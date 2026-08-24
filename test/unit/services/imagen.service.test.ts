import { Writable } from "stream";
import { randomBytes } from "crypto";
import { ImagenService } from "../../../src/services/imagen.service";
import sharp from "sharp";

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

  const webpMagicBytes = (buffer: Buffer): boolean =>
    buffer.subarray(0, 4).toString("latin1") === "RIFF" &&
    buffer.subarray(8, 12).toString("latin1") === "WEBP";

  const generatePng = async (width: number, height: number) =>
    sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 200, g: 120, b: 60 },
      },
    })
      .png()
      .toBuffer();

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

  it("comprime una imagen grande a WebP sin exceder 1200px y le pasa { folder } a Cloudinary", async () => {
    const png = await generatePng(3000, 2000);

    const url = await service.uploadToCloudinary(png);

    expect(url).toBe(SECURE_URL);
    expect(uploadedBuffers).toHaveLength(1);
    expect(webpMagicBytes(uploadedBuffers[0])).toBe(true);

    const metadata = await sharp(uploadedBuffers[0]).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(1200);
    expect(metadata.height).toBe(800);
    expect(Math.max(metadata.width ?? 0, metadata.height ?? 0)).toBeLessThanOrEqual(1200);

    expect(cloudinaryOptions).toEqual([{ folder: "mercado_sinergico" }]);
  });

  it("no agranda imágenes más chicas que 1200px (withoutEnlargement)", async () => {
    const png = await generatePng(100, 80);

    const url = await service.uploadToCloudinary(png);

    expect(url).toBe(SECURE_URL);
    const metadata = await sharp(uploadedBuffers[0]).metadata();
    expect(metadata.width).toBe(100);
    expect(metadata.height).toBe(80);
  });

  it("reduce el tamaño de una imagen con detalle al convertirla a WebP", async () => {
    const width = 1200;
    const height = 1200;
    const raw = randomBytes(width * height * 3);
    const png = await sharp(raw, { raw: { width, height, channels: 3 } }).png().toBuffer();

    await service.uploadToCloudinary(png);

    expect(uploadedBuffers[0].length).toBeLessThan(png.length);
  });

  it("si sharp falla con un buffer inválido, sube el buffer original y advierte", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const invalid = Buffer.from("esto no es una imagen");

    const url = await service.uploadToCloudinary(invalid);

    expect(url).toBe(SECURE_URL);
    expect(uploadedBuffers).toHaveLength(1);
    expect(uploadedBuffers[0].equals(invalid)).toBe(true);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
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

      const png = await generatePng(50, 50);
      const uploadPromise = service.uploadToCloudinary(png);
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
      const png = await generatePng(50, 50);
      await service.uploadToCloudinary(png);

      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it("rechaza si Cloudinary devuelve un error", async () => {
    uploadError = new Error("cloudinary boom");
    const png = await generatePng(100, 100);

    await expect(service.uploadToCloudinary(png)).rejects.toThrow("cloudinary boom");
  });

  it("rechaza si el resultado de Cloudinary no trae secure_url", async () => {
    uploadResult = {};
    const png = await generatePng(100, 100);

    await expect(service.uploadToCloudinary(png)).rejects.toThrow(
      "No se obtuvo URL segura de Cloudinary"
    );
  });

  it("reenvía el folder customizado a Cloudinary", async () => {
    const png = await generatePng(100, 100);

    await service.uploadToCloudinary(png, "mercado_sinergico/paquetes_publicados");

    expect(cloudinaryOptions).toEqual([{ folder: "mercado_sinergico/paquetes_publicados" }]);
  });

  it("uploadFromUrl baja la imagen con axios y delega en uploadToCloudinary", async () => {
    const png = await generatePng(100, 100);
    mockAxiosGet.mockResolvedValue({ data: png });
    const spy = jest.spyOn(service, "uploadToCloudinary");

    const url = await service.uploadFromUrl("http://example.com/img.png", "carpeta-x");

    expect(mockAxiosGet).toHaveBeenCalledWith("http://example.com/img.png", {
      responseType: "arraybuffer",
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(expect.any(Buffer), "carpeta-x");
    expect(spy.mock.calls[0][0].equals(png)).toBe(true);
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
