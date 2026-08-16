import { errorHandler } from "../../../src/middlewares/errorHandler.middleware";
import { CustomError } from "../../../src/errors/custom.error";

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
    expect(jsonMock).toHaveBeenCalledWith({ message: "Mensaje personalizado" });
  });

  it("debería responder 500 con 'Internal Server Error' para errores genéricos", () => {
    const error = new Error("algo falló");

    errorHandler(error, req, res, next);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ message: "Internal Server Error" });
  });
});
