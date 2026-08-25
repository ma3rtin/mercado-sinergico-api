import { CustomError } from "../../../src/errors/custom.error";

let capturedFileFilter: (
  req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, accept?: boolean) => void
) => void;
let capturedLimits: Record<string, number> | undefined;
let mockUploadInstance: {
  single: jest.Mock;
  fields: jest.Mock;
  array: jest.Mock;
};

jest.mock("multer", () => {
  const multerFn: any = (options: any) => {
    capturedFileFilter = options.fileFilter;
    capturedLimits = options.limits;
    mockUploadInstance = {
      single: jest.fn(() => (req: any, res: any, next: any) => next()),
      fields: jest.fn(() => (req: any, res: any, next: any) => next()),
      array: jest.fn(() => (req: any, res: any, next: any) => next()),
    };
    return mockUploadInstance;
  };
  multerFn.memoryStorage = jest.fn(() => ({}));
  multerFn.diskStorage = jest.fn(() => ({}));
  return { __esModule: true, default: multerFn };
});

beforeAll(() => {
  require("../../../src/middlewares/uploadFiles.middleware");
});

describe("uploadFiles.middleware - fileFilter", () => {
  const req = {} as any;
  const file = { fieldname: "imagen", originalname: "test.jpg", mimetype: "" } as Express.Multer.File;

  it("debería aceptar archivos con mimetype image/jpeg", () => {
    const cb = jest.fn();
    file.mimetype = "image/jpeg";
    capturedFileFilter(req, file, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("debería aceptar archivos con mimetype image/png", () => {
    const cb = jest.fn();
    file.mimetype = "image/png";
    capturedFileFilter(req, file, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("debería aceptar archivos con mimetype image/gif", () => {
    const cb = jest.fn();
    file.mimetype = "image/gif";
    capturedFileFilter(req, file, cb);
    expect(cb).toHaveBeenCalledWith(null, true);
  });

  it("debería rechazar archivos con mimetype application/pdf y devolver CustomError con status 415", () => {
    const cb = jest.fn();
    file.mimetype = "application/pdf";
    capturedFileFilter(req, file, cb);

    expect(cb).toHaveBeenCalledTimes(1);
    const errorArg = cb.mock.calls[0][0];
    expect(errorArg).toBeInstanceOf(CustomError);
    expect(errorArg.status).toBe(415);
  });

  it("debería rechazar cualquier mimetype no permitido", () => {
    const cb = jest.fn();
    file.mimetype = "video/mp4";
    capturedFileFilter(req, file, cb);

    expect(cb).toHaveBeenCalledTimes(1);
    const errorArg = cb.mock.calls[0][0];
    expect(errorArg).toBeInstanceOf(CustomError);
    expect(errorArg.status).toBe(415);
  });
});

describe("uploadFiles.middleware - limits", () => {
  it("debería configurar fileSize a 5 MB", () => {
    expect(capturedLimits).toBeDefined();
    expect(capturedLimits!.fileSize).toBe(5 * 1024 * 1024);
  });
});

describe("uploadFiles.middleware - procesarSubidaImagen routing", () => {
  let procesarSubidaImagen: (campos: any) => any;

  beforeAll(() => {
    procesarSubidaImagen = require("../../../src/middlewares/uploadFiles.middleware").procesarSubidaImagen;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debería llamar upload.single() cuando se pasa un string", () => {
    procesarSubidaImagen("imagen");
    expect(mockUploadInstance!.single).toHaveBeenCalledWith("imagen");
    expect(mockUploadInstance!.fields).not.toHaveBeenCalled();
    expect(mockUploadInstance!.array).not.toHaveBeenCalled();
  });

  it("debería llamar upload.fields() con maxCount 1 para icono y maxCount 7 para imagenes", () => {
    procesarSubidaImagen([
      { name: "icono", maxCount: 1 },
      { name: "imagenes", maxCount: 7 },
    ]);
    expect(mockUploadInstance!.fields).toHaveBeenCalledWith([
      { name: "icono", maxCount: 1 },
      { name: "imagenes", maxCount: 7 },
    ]);
    expect(mockUploadInstance!.single).not.toHaveBeenCalled();
    expect(mockUploadInstance!.array).not.toHaveBeenCalled();
  });

  it("debería llamar upload.array() cuando se pasa { fieldName, multiple: true }", () => {
    procesarSubidaImagen({ fieldName: "archivos", multiple: true });
    expect(mockUploadInstance!.array).toHaveBeenCalledWith("archivos", 10);
    expect(mockUploadInstance!.single).not.toHaveBeenCalled();
    expect(mockUploadInstance!.fields).not.toHaveBeenCalled();
  });

  it("debería llamar upload.array() con maxCount 1 cuando multiple es false", () => {
    procesarSubidaImagen({ fieldName: "archivo", multiple: false });
    expect(mockUploadInstance!.array).toHaveBeenCalledWith("archivo", 1);
  });

  it("debería usar maxCount 1 como default cuando no se especifica", () => {
    procesarSubidaImagen([{ name: "imagen" }]);
    expect(mockUploadInstance!.fields).toHaveBeenCalledWith([
      { name: "imagen", maxCount: 1 },
    ]);
  });
});
