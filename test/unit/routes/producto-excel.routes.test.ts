import express from 'express';
import request from 'supertest';

// 1. Mocks de Prisma y JWT
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

// 2. Mock de productoExcelService para no tocar datos ni generar archivos pesados
const mockImportarProductos = jest.fn();
const mockExportarProductos = jest.fn().mockResolvedValue(Buffer.from('fake-excel-export'));
const mockGenerarPlantilla = jest.fn().mockResolvedValue(Buffer.from('fake-excel-template'));

jest.mock('../../../src/services/producto-excel.service', () => ({
  productoExcelService: {
    importarProductos: mockImportarProductos,
    exportarProductos: mockExportarProductos,
    generarPlantilla: mockGenerarPlantilla,
  },
}));

import productoExcelRouter from '../../../src/routes/producto-excel.routes';
import { decodificarToken } from '../../../src/auth/jwt';

describe('Rutas Excel de Productos - Protección con Auth y Rol Admin', () => {
  let app: express.Express;
  let prismaMocks: ReturnType<typeof require>['__mocks'];

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/productos/excel', productoExcelRouter);
    prismaMocks = require('../../../src/prisma/client').__mocks;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Peticiones sin token o token inválido (401 Unauthorized)', () => {
    it('POST /importar debería rechazar con 401 si no hay token', async () => {
      const res = await request(app).post('/api/productos/excel/importar');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Token no proporcionado' });
      expect(mockImportarProductos).not.toHaveBeenCalled();
    });

    it('GET /exportar debería rechazar con 401 si no hay token', async () => {
      const res = await request(app).get('/api/productos/excel/exportar');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Token no proporcionado' });
      expect(mockExportarProductos).not.toHaveBeenCalled();
    });

    it('GET /plantilla debería rechazar con 401 si no hay token', async () => {
      const res = await request(app).get('/api/productos/excel/plantilla');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Token no proporcionado' });
      expect(mockGenerarPlantilla).not.toHaveBeenCalled();
    });

    it('debería rechazar con 401 si el token es inválido o expirado', async () => {
      (decodificarToken as jest.Mock).mockRejectedValue(new Error('jwt expired'));

      const res = await request(app)
        .get('/api/productos/excel/plantilla')
        .set('Authorization', 'Bearer token-invalido');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Token inválido o expirado' });
      expect(mockGenerarPlantilla).not.toHaveBeenCalled();
    });
  });

  describe('2. Peticiones con rol Usuario / no Administrador (403 Forbidden)', () => {
    beforeEach(() => {
      (decodificarToken as jest.Mock).mockResolvedValue({
        id: 99,
        email: 'user@test.com',
        rol: 'Usuario',
      });
      prismaMocks.mockUsuarioFindUnique.mockResolvedValue({
        emailVerificadoEn: new Date(),
      });
    });

    it('POST /importar debería rechazar con 403 si el rol no es Administrador', async () => {
      const res = await request(app)
        .post('/api/productos/excel/importar')
        .set('Authorization', 'Bearer token-usuario');

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: 'Acceso denegado' });
      expect(mockImportarProductos).not.toHaveBeenCalled();
    });

    it('GET /exportar debería rechazar con 403 si el rol no es Administrador', async () => {
      const res = await request(app)
        .get('/api/productos/excel/exportar')
        .set('Authorization', 'Bearer token-usuario');

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: 'Acceso denegado' });
      expect(mockExportarProductos).not.toHaveBeenCalled();
    });

    it('GET /plantilla debería rechazar con 403 si el rol no es Administrador', async () => {
      const res = await request(app)
        .get('/api/productos/excel/plantilla')
        .set('Authorization', 'Bearer token-usuario');

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: 'Acceso denegado' });
      expect(mockGenerarPlantilla).not.toHaveBeenCalled();
    });
  });

  describe('3. Peticiones con rol Administrador (solo GET /plantilla y GET /exportar)', () => {
    beforeEach(() => {
      (decodificarToken as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'admin@test.com',
        rol: 'Administrador',
      });
      prismaMocks.mockUsuarioFindUnique.mockResolvedValue({
        emailVerificadoEn: new Date(),
      });
    });

    it('GET /plantilla debería permitir el acceso (200 OK) para Administrador', async () => {
      const res = await request(app)
        .get('/api/productos/excel/plantilla')
        .set('Authorization', 'Bearer token-admin');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(mockGenerarPlantilla).toHaveBeenCalledTimes(1);
    });

    it('GET /exportar debería permitir el acceso (200 OK) para Administrador', async () => {
      const res = await request(app)
        .get('/api/productos/excel/exportar')
        .set('Authorization', 'Bearer token-admin');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(mockExportarProductos).toHaveBeenCalledTimes(1);
    });
  });
});
