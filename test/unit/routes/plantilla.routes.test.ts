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

// 2. Mock de PlantillaService
const mockCrearPlantilla = jest.fn();
const mockActualizarPlantilla = jest.fn();
const mockEliminarPlantilla = jest.fn();
const mockObtenerPlantillas = jest.fn();
const mockGetPlantillaById = jest.fn();

jest.mock('../../../src/services/plantilla.service', () => {
  return {
    PlantillaService: jest.fn().mockImplementation(() => ({
      crearPlantilla: mockCrearPlantilla,
      actualizarPlantilla: mockActualizarPlantilla,
      eliminarPlantilla: mockEliminarPlantilla,
      obtenerPlantillas: mockObtenerPlantillas,
      getPlantillaById: mockGetPlantillaById,
    })),
  };
});

import { plantillaRouter } from '../../../src/routes/modules/plantilla.route';
import { decodificarToken } from '../../../src/auth/jwt';

describe('Rutas de Plantillas - Protección con Auth y Rol Admin', () => {
  let app: express.Express;
  let prismaMocks: ReturnType<typeof require>['__mocks'];

  const mockPlantillaDtoValido = {
    nombre: 'Remeras',
    caracteristicas: [
      {
        nombre: 'Talle',
        opciones: [
          { nombre: 'S' },
          { nombre: 'M' },
        ],
      },
    ],
  };

  const mockPlantillaCreada = {
    id: 1,
    nombre: 'Remeras',
    caracteristicas: [
      {
        id: 10,
        nombre: 'Talle',
        plantillaId: 1,
        opciones: [
          { id: 100, nombre: 'S', caracteristicaId: 10 },
          { id: 101, nombre: 'M', caracteristicaId: 10 },
        ],
      },
    ],
  };

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/plantillas', plantillaRouter);
    prismaMocks = require('../../../src/prisma/client').__mocks;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockObtenerPlantillas.mockResolvedValue([mockPlantillaCreada]);
    mockGetPlantillaById.mockResolvedValue(mockPlantillaCreada);
    mockCrearPlantilla.mockResolvedValue(mockPlantillaCreada);
    mockActualizarPlantilla.mockResolvedValue(mockPlantillaCreada);
    mockEliminarPlantilla.mockResolvedValue(mockPlantillaCreada);
  });

  describe('1. Rutas públicas de consulta (GET / y GET /:id)', () => {
    it('GET / debería permitir acceso público (200 OK) sin token', async () => {
      const res = await request(app).get('/api/plantillas');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([mockPlantillaCreada]);
      expect(mockObtenerPlantillas).toHaveBeenCalledTimes(1);
    });

    it('GET /:id debería permitir acceso público (200 OK) sin token', async () => {
      const res = await request(app).get('/api/plantillas/1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockPlantillaCreada);
      expect(mockGetPlantillaById).toHaveBeenCalledWith(1);
    });
  });

  describe('2. Peticiones de escritura sin token (401 Unauthorized)', () => {
    it('POST / debería rechazar con 401 si no hay token (incluso con body válido)', async () => {
      const res = await request(app)
        .post('/api/plantillas')
        .send(mockPlantillaDtoValido);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Token no proporcionado' });
      expect(mockCrearPlantilla).not.toHaveBeenCalled();
    });

    it('POST / debería rechazar con 401 si no hay token aun con body inválido (orden auth > validación)', async () => {
      const res = await request(app)
        .post('/api/plantillas')
        .send({ nombre: '' }); // body inválido

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Token no proporcionado' });
      expect(mockCrearPlantilla).not.toHaveBeenCalled();
    });

    it('PUT /:id debería rechazar con 401 si no hay token', async () => {
      const res = await request(app)
        .put('/api/plantillas/1')
        .send(mockPlantillaDtoValido);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Token no proporcionado' });
      expect(mockActualizarPlantilla).not.toHaveBeenCalled();
    });

    it('DELETE /:id debería rechazar con 401 si no hay token', async () => {
      const res = await request(app).delete('/api/plantillas/1');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Token no proporcionado' });
      expect(mockEliminarPlantilla).not.toHaveBeenCalled();
    });
  });

  describe('3. Peticiones con token inválido o expirado (401 Unauthorized)', () => {
    beforeEach(() => {
      (decodificarToken as jest.Mock).mockRejectedValue(new Error('jwt expired'));
    });

    it('POST / debería rechazar con 401 si el token es inválido o expiró', async () => {
      const res = await request(app)
        .post('/api/plantillas')
        .set('Authorization', 'Bearer token-invalido')
        .send(mockPlantillaDtoValido);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Token inválido o expirado' });
      expect(mockCrearPlantilla).not.toHaveBeenCalled();
    });

    it('PUT /:id debería rechazar con 401 si el token es inválido o expiró', async () => {
      const res = await request(app)
        .put('/api/plantillas/1')
        .set('Authorization', 'Bearer token-invalido')
        .send(mockPlantillaDtoValido);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Token inválido o expirado' });
      expect(mockActualizarPlantilla).not.toHaveBeenCalled();
    });

    it('DELETE /:id debería rechazar con 401 si el token es inválido o expiró', async () => {
      const res = await request(app)
        .delete('/api/plantillas/1')
        .set('Authorization', 'Bearer token-invalido');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Token inválido o expirado' });
      expect(mockEliminarPlantilla).not.toHaveBeenCalled();
    });
  });

  describe('4. Peticiones con rol Usuario / no Administrador (403 Forbidden)', () => {
    beforeEach(() => {
      (decodificarToken as jest.Mock).mockResolvedValue({
        id: 50,
        email: 'usuario@test.com',
        rol: 'Usuario',
      });
      prismaMocks.mockUsuarioFindUnique.mockResolvedValue({
        emailVerificadoEn: new Date(),
      });
    });

    it('POST / debería rechazar con 403 para rol Usuario', async () => {
      const res = await request(app)
        .post('/api/plantillas')
        .set('Authorization', 'Bearer token-usuario')
        .send(mockPlantillaDtoValido);

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: 'Acceso denegado' });
      expect(mockCrearPlantilla).not.toHaveBeenCalled();
    });

    it('PUT /:id debería rechazar con 403 para rol Usuario', async () => {
      const res = await request(app)
        .put('/api/plantillas/1')
        .set('Authorization', 'Bearer token-usuario')
        .send(mockPlantillaDtoValido);

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: 'Acceso denegado' });
      expect(mockActualizarPlantilla).not.toHaveBeenCalled();
    });

    it('DELETE /:id debería rechazar con 403 para rol Usuario', async () => {
      const res = await request(app)
        .delete('/api/plantillas/1')
        .set('Authorization', 'Bearer token-usuario');

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: 'Acceso denegado' });
      expect(mockEliminarPlantilla).not.toHaveBeenCalled();
    });
  });

  describe('5. Peticiones con rol Administrador (ejecución exitosa en el controller)', () => {
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

    it('POST / debería crear la plantilla (201 Created) con rol Administrador y DTO válido', async () => {
      const res = await request(app)
        .post('/api/plantillas')
        .set('Authorization', 'Bearer token-admin')
        .send(mockPlantillaDtoValido);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(mockPlantillaCreada);
      expect(mockCrearPlantilla).toHaveBeenCalledTimes(1);
    });

    it('PUT /:id debería actualizar la plantilla (200 OK) con rol Administrador y DTO válido', async () => {
      const res = await request(app)
        .put('/api/plantillas/1')
        .set('Authorization', 'Bearer token-admin')
        .send(mockPlantillaDtoValido);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockPlantillaCreada);
      expect(mockActualizarPlantilla).toHaveBeenCalledTimes(1);
    });

    it('DELETE /:id debería eliminar la plantilla (204 No Content) con rol Administrador', async () => {
      const res = await request(app)
        .delete('/api/plantillas/1')
        .set('Authorization', 'Bearer token-admin');

      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
      expect(mockEliminarPlantilla).toHaveBeenCalledWith(1);
    });
  });
});
