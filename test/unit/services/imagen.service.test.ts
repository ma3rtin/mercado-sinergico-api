import { Writable } from "stream";
import { ImagenService } from "../../../src/services/imagen.service";

jest.mock("cloudinary", () => {
  const upload_stream = jest.fn();
  return {
    v2: {
      uploader: {
        upload_stream,
      },
    },
    __mocks: {
      upload_stream,
    },
  };
});

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

describe("ImagenService", () => {
  const SECURE_URL = "https://res.cloudinary.com/test/image.jpg";

  let service: ImagenService;
  let mockUploadStream: jest.Mock;
  let mockAxiosGet: jest.Mock;
  let uploadedBuffers: Buffer[];
  let cloudinaryOptions: Record<string, unknown>[];
  let uploadResult: Record<string, unknown> | null;
  let uploadError: Error | null;

  const setupUploadStream = () => {
    mockUploadStream.mockImplementation((options, callback) => {
      cloudinaryOptions.push(options);
      const chunks: Buffer[] = [];
      return new Writable({
        write(chunk, _encoding, done) {
          chunks.push(Buffer.from(chunk));
          done();
        },
        final(done) {
          uploadedBuffers.push(Buffer.concat(chunks));
          done();
          if (uploadError) {
            callback(uploadError, undefined);
          } else {
            callback(null, uploadResult);
          }
        },
      });
    });
  };

  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ImagenService();
    mockUploadStream = require("cloudinary").__mocks.upload_stream;
    mockAxiosGet = require("axios").default.get;
    uploadedBuffers = [];
    cloudinaryOptions = [];
    uploadResult = { secure_url: SECURE_URL };
    uploadError = null;
    setupUploadStream();
  });

  it("sube el buffer original sin procesarlo localmente", async () => {
    const buffer = Buffer.from("contenido-de-la-imagen");

    const url = await service.uploadToCloudinary(buffer);

    expect(url).toBe(SECURE_URL);
    expect(uploadedBuffers).toHaveLength(1);
    expect(uploadedBuffers[0].equals(buffer)).toBe(true);
  });

  it("delega el resize/recompresión a Cloudinary vía transformación de entrada", async () => {
    const buffer = Buffer.from("otra-imagen");

    await service.uploadToCloudinary(buffer);

    expect(cloudinaryOptions).toEqual([
      {
        folder: "mercado_sinergico",
        format: "webp",
        transformation: [{ width: 1200, height: 1200, crop: "limit", quality: 80 }],
      },
    ]);
  });

  // fetch_format:'auto' es una feature de entrega, no de subida: si se usa acá
  // el asset queda en su formato original (~2.4x más pesado). Este test evita
  // que alguien lo reintroduzca por confundirlo con f_auto de la URL.
  it("guarda el asset en webp, no en el formato original", async () => {
    await service.uploadToCloudinary(Buffer.from("imagen"));

    expect(cloudinaryOptions[0].format).toBe("webp");
    expect(cloudinaryOptions[0]).not.toHaveProperty("fetch_format");
  });

  it("rechaza con CustomError (no un Error genérico) si Cloudinary nunca responde en 15s", async () => {
    jest.useFakeTimers({ doNotFake: ["nextTick", "queueMicrotask"] });
    try {
      // upload_stream nunca llama al callback: simula una conexión colgada.
      mockUploadStream.mockImplementation((options) => {
        cloudinaryOptions.push(options);
        return new Writable({
          write(chunk, _encoding, done) {
            done();
          },
          final(done) {
            done();
          },
        });
      });

      const buffer = Buffer.from("imagen");
      const uploadPromise = service.uploadToCloudinary(buffer);
      const assertion = expect(uploadPromise).rejects.toMatchObject({
        status: 500,
        message: expect.stringContaining("15 segundos"),
      });

      await jest.advanceTimersByTimeAsync(15000);
      await assertion;
    } finally {
      jest.useRealTimers();
    }
  });

  it("no deja un timer colgado después de una subida exitosa", async () => {
    jest.useFakeTimers({ doNotFake: ["nextTick", "queueMicrotask"] });
    try {
      const buffer = Buffer.from("imagen");
      await service.uploadToCloudinary(buffer);

      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it("rechaza si Cloudinary devuelve un error", async () => {
    uploadError = new Error("cloudinary boom");
    const buffer = Buffer.from("imagen");

    await expect(service.uploadToCloudinary(buffer)).rejects.toThrow("cloudinary boom");
  });

  it("rechaza si el resultado de Cloudinary no trae secure_url", async () => {
    uploadResult = {};
    const buffer = Buffer.from("imagen");

    await expect(service.uploadToCloudinary(buffer)).rejects.toThrow(
      "No se obtuvo URL segura de Cloudinary"
    );
  });

  it("reenvía el folder customizado a Cloudinary", async () => {
    const buffer = Buffer.from("imagen");

    await service.uploadToCloudinary(buffer, "mercado_sinergico/paquetes_publicados");

    expect(cloudinaryOptions[0].folder).toBe("mercado_sinergico/paquetes_publicados");
  });

  it("uploadFromUrl baja la imagen con axios y delega en uploadToCloudinary", async () => {
    const buffer = Buffer.from("imagen-remota");
    mockAxiosGet.mockResolvedValue({ data: buffer });
    const spy = jest.spyOn(service, "uploadToCloudinary");

    const url = await service.uploadFromUrl("http://example.com/img.png", "carpeta-x");

    expect(mockAxiosGet).toHaveBeenCalledWith("http://example.com/img.png", {
      responseType: "arraybuffer",
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(expect.any(Buffer), "carpeta-x");
    expect(spy.mock.calls[0][0].equals(buffer)).toBe(true);
    expect(url).toBe(SECURE_URL);
  });

  it("uploadFromUrl propaga errores de axios", async () => {
    mockAxiosGet.mockRejectedValue(new Error("network down"));

    await expect(service.uploadFromUrl("http://example.com/img.png")).rejects.toThrow(
      "network down"
    );
  });

  describe("subirArchivosEnLotes", () => {
    // Nota: el mock de p-limit en Jest (passthrough sin throttle real) hace que
    // no se pueda verificar la concurrencia máxima en este entorno. El test
    // verifica la funcionalidad: N archivos → N llamadas → N URLs en orden.
    it("llama a uploadToCloudinary exactamente una vez por archivo y devuelve todas las URLs en orden", async () => {
      const TOTAL = 9;

      let callCount = 0;
      jest.spyOn(service, "uploadToCloudinary").mockImplementation(async (buf) => {
        callCount++;
        return `https://cloudinary.com/img-${buf.toString()}.jpg`;
      });

      const archivos = Array.from({ length: TOTAL }, (_, i) => ({
        buffer: Buffer.from(`${i}`),
      }));

      const urls = await service.subirArchivosEnLotes(archivos, 3);

      expect(callCount).toBe(TOTAL);
      expect(urls).toHaveLength(TOTAL);
      urls.forEach((url, i) => {
        expect(url).toBe(`https://cloudinary.com/img-${i}.jpg`);
      });
    });

    it("preserva el orden de las URLs independientemente del orden de resolución", async () => {
      const TOTAL = 4;
      const resolvers: Array<() => void> = [];

      jest.spyOn(service, "uploadToCloudinary").mockImplementation(async (buf, _folder) => {
        await new Promise<void>((res) => resolvers.push(res));
        return `https://cloudinary.com/${buf.toString()}.jpg`;
      });

      const archivos = ["a", "b", "c", "d"].map((s) => ({ buffer: Buffer.from(s) }));
      const lotePromise = service.subirArchivosEnLotes(archivos, TOTAL);

      await new Promise((res) => setImmediate(res));

      // Resolver en orden invertido para verificar que Promise.all mantiene índices
      for (let i = TOTAL - 1; i >= 0; i--) {
        resolvers[i]?.();
        await new Promise((res) => setImmediate(res));
      }

      const urls = await lotePromise;
      expect(urls).toEqual([
        "https://cloudinary.com/a.jpg",
        "https://cloudinary.com/b.jpg",
        "https://cloudinary.com/c.jpg",
        "https://cloudinary.com/d.jpg",
      ]);
    });

    it("propaga el error fail-fast si uno de los uploads falla", async () => {
      jest
        .spyOn(service, "uploadToCloudinary")
        .mockResolvedValueOnce("https://cloudinary.com/ok.jpg")
        .mockRejectedValueOnce(new Error("boom en upload 2"))
        .mockResolvedValue("https://cloudinary.com/otro.jpg");

      const archivos = Array.from({ length: 3 }, (_, i) => ({
        buffer: Buffer.from(`img-${i}`),
      }));

      await expect(service.subirArchivosEnLotes(archivos, 3)).rejects.toThrow(
        "boom en upload 2"
      );
    });
  });
});
