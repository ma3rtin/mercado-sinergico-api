import { CustomError } from "../../../src/errors/custom.error";

let capturedFileFilter: (
  req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, accept?: boolean) => void
) => void;

jest.mock("multer", () => {
  const multerFn: any = (options: any) => {
    capturedFileFilter = options.fileFilter;
    return {
      single: jest.fn(() => (req: any, res: any, next: any) => next()),
      fields: jest.fn(() => (req: any, res: any, next: any) => next()),
      array: jest.fn(() => (req: any, res: any, next: any) => next()),
    };
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
