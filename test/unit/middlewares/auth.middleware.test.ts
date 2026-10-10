import { authMiddleware } from '../../../src/middlewares/auth.middleware';

jest.mock('../../../src/prisma/client', () => {
  const mockUsuarioFindUnique = jest.fn();
  return {
    prisma: {
      usuario: {
        findUnique: mockUsuarioFindUnique,
      },
    },
    __mocks: {
      mockUsuarioFindUnique,
    },
  };
});

jest.mock('../../../src/auth/jwt', () => ({
  decodificarToken: jest.fn(),
}));

describe('authMiddleware', () => {
  let req: any;
  let res: any;
  let next: jest.Mock;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let mocks: ReturnType<typeof require>['__mocks'];
  const { decodificarToken } = require('../../../src/auth/jwt');

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock }));
    res = { status: statusMock } as any;
    next = jest.fn();
    mocks = require('../../../src/prisma/client').__mocks;
  });

  it('debería responder 401 si falta el header Authorization', async () => {
    req = { headers: {} };

    await authMiddleware(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ message: 'Token no proporcionado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debería responder 401 si el token es inválido', async () => {
    req = { headers: { authorization: 'Bearer token-invalido' } };
    decodificarToken.mockRejectedValueOnce(new Error('JWT malformed'));

    await authMiddleware(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('inválido') }));
    expect(next).not.toHaveBeenCalled();
  });

  it('debería rechazar con 403 y EMAIL_NO_VERIFICADO si el usuario no tiene email verificado', async () => {
    req = { headers: { authorization: 'Bearer token-valido' } };
    decodificarToken.mockResolvedValueOnce({ id: 5, email: 'pendiente@test.com' });
    mocks.mockUsuarioFindUnique.mockResolvedValueOnce({ emailVerificadoEn: null });

    await authMiddleware(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      message: 'Confirmá tu correo electrónico antes de continuar',
      code: 'EMAIL_NO_VERIFICADO',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('debería llamar a next() y adjuntar req.user si el usuario tiene email verificado', async () => {
    req = { headers: { authorization: 'Bearer token-valido' } };
    const userPayload = { id: 5, email: 'verificado@test.com' };
    decodificarToken.mockResolvedValueOnce(userPayload);
    mocks.mockUsuarioFindUnique.mockResolvedValueOnce({ emailVerificadoEn: new Date() });

    await authMiddleware(req, res, next);

    expect(req.user).toEqual(userPayload);
    expect(next).toHaveBeenCalledTimes(1);
    expect(statusMock).not.toHaveBeenCalled();
  });
});
