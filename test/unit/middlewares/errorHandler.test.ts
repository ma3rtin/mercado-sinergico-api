import { errorHandler } from "../../../src/middlewares/errorHandler.middleware";
import { CustomError } from "../../../src/errors/custom.error";
import { MulterError } from "multer";

describe("errorHandler middleware", () => {
  const req = { method: "GET", url: "/test" } as any;
  const next = jest.fn();

  let res: any;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock }));
    res = { status: statusMock } as any;
  });

  it("debería responder con el status y mensaje del CustomError", () => {
    const error = new CustomError("Mensaje personalizado", 422);

    errorHandler(error, req, res, next);

    expect(statusMock).toHaveBeenCalledWith(422);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Mensaje personalizado",
      message: "Mensaje personalizado",
    });
  });

  it("debería responder 413 cuando MulterError es LIMIT_FILE_SIZE", () => {
    const error = new MulterError("LIMIT_FILE_SIZE", "imagenes");

    errorHandler(error, req, res, next);

    expect(statusMock).toHaveBeenCalledWith(413);
    expect(jsonMock).toHaveBeenCalledWith({
      error: error.message,
      message: error.message,
    });
  });

  it("debería responder 400 para otros códigos de MulterError", () => {
    const error = new MulterError("LIMIT_FILE_COUNT", "imagenes");

    errorHandler(error, req, res, next);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: error.message,
      message: error.message,
    });
  });

  it("debería responder 500 con 'Internal Server Error' para errores genéricos", () => {
    const error = new Error("algo falló");

    errorHandler(error, req, res, next);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Internal Server Error",
      message: "Internal Server Error",
    });
  });
});
