import { VarianteService } from '../../src/services/variante.service.js';
import { PrismaClient } from '@prisma/client';

// Mock del cliente de prisma para retornar un cliente real nuevo,
// evitando que Jest cargue y compile 'src/prisma/client.ts' (que contiene top-level await).
jest.mock('../../src/prisma/client.js', () => {
  let client: any = null;
  return {
    get prisma() {
      if (!client) {
        const { PrismaClient } = require('@prisma/client');
        const mod = require('@prisma/adapter-mariadb');
        const AdapterCtor = mod.default || mod.PrismaMariaDb || Object.values(mod).find((v: any) => typeof v === 'function');
        
        const url = new URL(process.env.DATABASE_URL || 'mysql://root:root123@127.0.0.1:3306/mercado_sinergico');
        const database = url.pathname ? url.pathname.replace(/^\//, '') : undefined;
        const configObj = {
          host: url.hostname,
          port: url.port ? Number(url.port) : 3306,
          user: url.username,
          password: url.password,
          database,
          connectionLimit: 20,
          connectTimeout: 20000,
          acquireTimeout: 30000,
        };
        const factoryOptions = { database };
        const adapter = new (AdapterCtor as any)(configObj, factoryOptions);
        
        client = new PrismaClient({ adapter });
      }
      return client;
    }
  };
});

// Importamos la instancia mockeada (que es un PrismaClient real) para usar en los tests
import { prisma } from '../../src/prisma/client.js';

describe('VarianteService - Integracion (Base de Datos Real)', () => {
  let service: VarianteService;

  let createdCategoriaId: number;
  let createdMarcaId: number;
  let createdPlantillaId: number;
  let createdCaracteristicaId: number;
  let createdOpcionIds: number[] = [];
  let createdProductoId: number;
  let createdVarianteIds: number[] = [];

  beforeAll(() => {
    service = new VarianteService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Batch 1: categoria, marca, plantilla — no dependen entre si (parallel)
    const [categoria, marca, plantilla] = await Promise.all([
      prisma.categoria.create({
        data: { nombre: `Cat_Int_${Date.now()}_${Math.random()}` },
      }),
      prisma.marca.create({
        data: { nombre: `Marca_Int_${Date.now()}_${Math.random()}` },
      }),
      prisma.plantilla.create({
        data: { nombre: `Plantilla_Int_${Date.now()}_${Math.random()}` },
      }),
    ]);
    createdCategoriaId = categoria.id_categoria;
    createdMarcaId = marca.id_marca;
    createdPlantillaId = plantilla.id;

    // Paso 2: caracteristica (depende de createdPlantillaId)
    const caracteristica = await prisma.caracteristica.create({
      data: {
        nombre: `Carac_Int_${Date.now()}`,
        plantillaId: createdPlantillaId,
      },
    });
    createdCaracteristicaId = caracteristica.id;

    // Batch 3: 3 opciones en paralelo (dependen de createdCaracteristicaId)
    const [opcion1, opcion2, opcion3] = await Promise.all([
      prisma.opcion.create({
        data: { nombre: 'Opcion_A', caracteristicaId: createdCaracteristicaId },
      }),
      prisma.opcion.create({
        data: { nombre: 'Opcion_B', caracteristicaId: createdCaracteristicaId },
      }),
      prisma.opcion.create({
        data: { nombre: 'Opcion_C', caracteristicaId: createdCaracteristicaId },
      }),
    ]);
    createdOpcionIds = [opcion1.id, opcion2.id, opcion3.id];

    // Paso 4: producto (depende de createdCategoriaId, createdMarcaId, createdPlantillaId)
    const producto = await prisma.producto.create({
      data: {
        nombre: `Prod_Int_${Date.now()}`,
        descripcion: 'Test integration product',
        precio: 1500,
        categoria_id: createdCategoriaId,
        marca_id: createdMarcaId,
        plantillaId: createdPlantillaId,
        tipo: 'SINERGICO',
      },
    });
    createdProductoId = producto.id_producto;

    // Batch 5: 3 variantes en paralelo (dependen de createdProductoId y sus opciones)
    const [var1, var2, var3] = await Promise.all([
      prisma.productoVariante.create({
        data: {
          productoId: createdProductoId,
          sku: `SKU-VAR-1-${Date.now()}`,
          stockFisico: 10,
          precioExtra: 0,
          activo: true,
          opciones: {
            create: {
              caracteristicaId: createdCaracteristicaId,
              opcionId: opcion1.id,
            },
          },
        },
      }),
      prisma.productoVariante.create({
        data: {
          productoId: createdProductoId,
          sku: `SKU-VAR-2-${Date.now()}`,
          stockFisico: 5,
          precioExtra: 50,
          activo: false,
          opciones: {
            create: {
              caracteristicaId: createdCaracteristicaId,
              opcionId: opcion2.id,
            },
          },
        },
      }),
      prisma.productoVariante.create({
        data: {
          productoId: createdProductoId,
          sku: `SKU-VAR-3-${Date.now()}`,
          stockFisico: 0,
          precioExtra: 100,
          activo: true,
          opciones: {
            create: {
              caracteristicaId: createdCaracteristicaId,
              opcionId: opcion3.id,
            },
          },
        },
      }),
    ]);

    createdVarianteIds = [var1.id, var2.id, var3.id];
  }, 30000);

  afterEach(async () => {
    // Borrar de forma segura los registros creados por ID en orden inverso
    if (createdVarianteIds.length > 0) {
      await prisma.productoVarianteOpcion.deleteMany({
        where: { varianteId: { in: createdVarianteIds } },
      });
      await prisma.productoVariante.deleteMany({
        where: { id: { in: createdVarianteIds } },
      });
    }
    if (createdProductoId) {
      await prisma.producto.delete({
        where: { id_producto: createdProductoId },
      });
    }
    if (createdOpcionIds.length > 0) {
      await prisma.opcion.deleteMany({
        where: { id: { in: createdOpcionIds } },
      });
    }
    if (createdCaracteristicaId) {
      await prisma.caracteristica.delete({
        where: { id: createdCaracteristicaId },
      });
    }
    if (createdPlantillaId) {
      await prisma.plantilla.delete({
        where: { id: createdPlantillaId },
      });
    }
    if (createdMarcaId) {
      await prisma.marca.delete({
        where: { id_marca: createdMarcaId },
      });
    }
    if (createdCategoriaId) {
      await prisma.categoria.delete({
        where: { id_categoria: createdCategoriaId },
      });
    }
  }, 30000);

  it('debería activar una variante individual', async () => {
    const targetId = createdVarianteIds[1]; // Arranca en false

    // Verificar que arranca en false
    const initialVar = await prisma.productoVariante.findUnique({
      where: { id: targetId },
    });
    expect(initialVar?.activo).toBe(false);

    // Activar
    await service.actualizarVariante(targetId, { activo: true });

    // Verificar en la base que cambió a true
    const updatedVar = await prisma.productoVariante.findUnique({
      where: { id: targetId },
    });
    expect(updatedVar?.activo).toBe(true);
  });

  it('debería desactivar una variante individual', async () => {
    const targetId = createdVarianteIds[0]; // Arranca en true

    // Verificar que arranca en true
    const initialVar = await prisma.productoVariante.findUnique({
      where: { id: targetId },
    });
    expect(initialVar?.activo).toBe(true);

    // Desactivar
    await service.actualizarVariante(targetId, { activo: false });

    // Verificar en la base que cambió a false
    const updatedVar = await prisma.productoVariante.findUnique({
      where: { id: targetId },
    });
    expect(updatedVar?.activo).toBe(false);
  });

  it('debería activar todas las variantes de un producto', async () => {
    // Activar todas
    await service.actualizarVarianteBulk(createdProductoId, {
      variantes: [
        { id: createdVarianteIds[0], activo: true },
        { id: createdVarianteIds[1], activo: true },
        { id: createdVarianteIds[2], activo: true },
      ],
    });

    // Verificar que todas estén en true
    const dbVariantes = await prisma.productoVariante.findMany({
      where: { productoId: createdProductoId },
    });
    expect(dbVariantes).toHaveLength(3);
    expect(dbVariantes.every((v) => v.activo === true)).toBe(true);
  });

  it('debería desactivar todas las variantes de un producto', async () => {
    // Desactivar todas
    await service.actualizarVarianteBulk(createdProductoId, {
      variantes: [
        { id: createdVarianteIds[0], activo: false },
        { id: createdVarianteIds[1], activo: false },
        { id: createdVarianteIds[2], activo: false },
      ],
    });

    // Verificar que todas estén en false
    const dbVariantes = await prisma.productoVariante.findMany({
      where: { productoId: createdProductoId },
    });
    expect(dbVariantes).toHaveLength(3);
    expect(dbVariantes.every((v) => v.activo === false)).toBe(true);
  });

  it('debería actualizar con bulk update con una mezcla de cambios sin mezclar datos', async () => {
    // Actualizar con una mezcla
    await service.actualizarVarianteBulk(createdProductoId, {
      variantes: [
        { id: createdVarianteIds[0], stockFisico: 44 }, // stock cambia de 10 a 44
        { id: createdVarianteIds[1], activo: true }, // activo cambia de false a true
        { id: createdVarianteIds[2], stockFisico: 88, activo: false }, // stock 0->88, activo true->false
      ],
    });

    // Verificar de forma independiente cada variante
    const var1 = await prisma.productoVariante.findUnique({ where: { id: createdVarianteIds[0] } });
    expect(var1?.stockFisico).toBe(44);
    expect(var1?.activo).toBe(true); // se mantiene

    const var2 = await prisma.productoVariante.findUnique({ where: { id: createdVarianteIds[1] } });
    expect(var2?.stockFisico).toBe(5); // se mantiene
    expect(var2?.activo).toBe(true);

    const var3 = await prisma.productoVariante.findUnique({ where: { id: createdVarianteIds[2] } });
    expect(var3?.stockFisico).toBe(88);
    expect(var3?.activo).toBe(false);
  });

  it('debería abortar todo el bulk si una variante no pertenece al producto y no aplicar ningún cambio', async () => {
    const invalidVarianteId = 999999;

    // Intentamos actualizar una variante válida y una inválida
    await expect(
      service.actualizarVarianteBulk(createdProductoId, {
        variantes: [
          { id: createdVarianteIds[0], stockFisico: 999 }, // cambio que debería abortarse
          { id: invalidVarianteId, stockFisico: 10 },
        ],
      })
    ).rejects.toThrow('Algunas variantes no pertenecen al producto');

    // Verificar que la variante válida NO sufrió cambios
    const var1 = await prisma.productoVariante.findUnique({ where: { id: createdVarianteIds[0] } });
    expect(var1?.stockFisico).toBe(10); // Sigue siendo el original (10), no cambió a 999
  });

  it('debería rechazar stock negativo en actualizarVariante y no modificar la base de datos', async () => {
    await expect(
      service.actualizarVariante(createdVarianteIds[0], { stockFisico: -5 })
    ).rejects.toThrow('El stock físico no puede ser negativo.');

    // Verificar que el stock sigue siendo 10
    const var1 = await prisma.productoVariante.findUnique({ where: { id: createdVarianteIds[0] } });
    expect(var1?.stockFisico).toBe(10);
  });

  it('debería rechazar stock negativo en actualizarVarianteBulk y no modificar la base de datos', async () => {
    await expect(
      service.actualizarVarianteBulk(createdProductoId, {
        variantes: [{ id: createdVarianteIds[0], stockFisico: -10 }],
      })
    ).rejects.toThrow('El stock físico no puede ser negativo.');

    // Verificar que el stock sigue siendo 10
    const var1 = await prisma.productoVariante.findUnique({ where: { id: createdVarianteIds[0] } });
    expect(var1?.stockFisico).toBe(10);
  });
});
