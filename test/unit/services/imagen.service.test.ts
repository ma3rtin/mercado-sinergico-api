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

  it("comprime una imagen grande a WebP sin exceder 2000px y le pasa { folder } a Cloudinary", async () => {
    const png = await generatePng(3000, 2000);

    const url = await service.uploadToCloudinary(png);

    expect(url).toBe(SECURE_URL);
    expect(uploadedBuffers).toHaveLength(1);
    expect(webpMagicBytes(uploadedBuffers[0])).toBe(true);

    const metadata = await sharp(uploadedBuffers[0]).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(2000);
    expect(metadata.height).toBe(1333);
    expect(Math.max(metadata.width ?? 0, metadata.height ?? 0)).toBeLessThanOrEqual(2000);

    expect(cloudinaryOptions).toEqual([{ folder: "mercado_sinergico" }]);
  });

  it("no agranda imágenes más chicas que 2000px (withoutEnlargement)", async () => {
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
});
