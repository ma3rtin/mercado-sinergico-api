import { Prisma, TipoPaquete } from '@prisma/client';
import { CustomError } from '../errors/custom.error.js';

interface OpcionParaGenerar {
  id: number;
}

interface CaracteristicaParaGenerar {
  id: number;
  opciones: OpcionParaGenerar[];
}

interface ProductoParaGenerarVariantes {
  id_producto: number;
  nombre: string;
  tipo?: TipoPaquete | null;
  plantilla: { caracteristicas: CaracteristicaParaGenerar[] } | null;
}

const MAX_VARIANTES = 200;

function validarOpcionesDisponibles(
  producto: ProductoParaGenerarVariantes,
  opcionesDisponibles: Record<string, number[]>
): void {
  if (!producto.plantilla) {
    throw new CustomError('El producto no tiene plantilla asignada', 400);
  }

  const entradas = Object.entries(opcionesDisponibles);
  if (entradas.length === 0) {
    throw new CustomError('Debés indicar al menos una opción por característica', 400);
  }

  const caracteristicasPorId = new Map(
    producto.plantilla.caracteristicas.map((c) => [c.id, c])
  );

  for (const [caracIdStr, opcionIds] of entradas) {
    const caracId = Number(caracIdStr);
    const caracteristica = caracteristicasPorId.get(caracId);

    if (!caracteristica) {
      throw new CustomError(
        `La característica ${caracId} no pertenece a la plantilla del producto`,
        400
      );
    }

    if (opcionIds.length === 0) {
      throw new CustomError(
        `La característica ${caracId} necesita al menos una opción seleccionada`,
        400
      );
    }

    const opcionesValidas = new Set(caracteristica.opciones.map((o) => o.id));
    for (const opcionId of opcionIds) {
      if (!opcionesValidas.has(opcionId)) {
        throw new CustomError(
          `La opción ${opcionId} no pertenece a la característica ${caracId}`,
          400
        );
      }
    }
  }
}

function contarCombinaciones(opcionesDisponibles: Record<string, number[]>): number {
  return Object.values(opcionesDisponibles).reduce((total, opciones) => total * opciones.length, 1);
}

function generarCombinaciones(
  opcionesDisponibles: Record<string, number[]>
): Record<string, number>[] {
  const caracteristicas = Object.keys(opcionesDisponibles);
  const valores = Object.values(opcionesDisponibles);
  const resultado: Record<string, number>[] = [];

  const generarRecursivo = (index: number, combinacionActual: Record<string, number>) => {
    if (index === caracteristicas.length) {
      resultado.push({ ...combinacionActual });
      return;
    }
    const caracId = caracteristicas[index];
    for (const opcionId of valores[index]) {
      combinacionActual[caracId] = opcionId;
      generarRecursivo(index + 1, combinacionActual);
    }
  };

  generarRecursivo(0, {});
  return resultado;
}

export async function generarVariantesEnTransaccion(
  tx: Prisma.TransactionClient,
  producto: ProductoParaGenerarVariantes,
  opcionesDisponibles: Record<string, number[]>
) {
  validarOpcionesDisponibles(producto, opcionesDisponibles);

  // Se cuenta la cantidad de combinaciones antes de generarlas: con ids
  // repetidos en un mismo arreglo (válidos individualmente, pero repetidos)
  // el producto cartesiano puede ser enorme, y no tiene sentido construirlo
  // en memoria solo para rechazarlo después.
  if (contarCombinaciones(opcionesDisponibles) > MAX_VARIANTES) {
    throw new CustomError(`No se pueden generar más de ${MAX_VARIANTES} variantes a la vez`, 400);
  }

  const combinaciones = generarCombinaciones(opcionesDisponibles);

  const stockInicial = producto.tipo === TipoPaquete.ENERGICO ? 0 : null;
  const nombreLimpio = producto.nombre.substring(0, 10).toUpperCase().replace(/\s+/g, '-');
  const productoId = producto.id_producto;

  const variantesData = combinaciones.map((combinacion) => ({
    productoId,
    sku: `${nombreLimpio}-${productoId}-${Object.values(combinacion).join('-')}`,
    stockFisico: stockInicial,
    precioExtra: 0,
    activo: true,
  }));

  const skusGenerados = variantesData.map((v) => v.sku);

  try {
    await tx.productoVariante.createMany({ data: variantesData });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new CustomError(
        'Ya existe una variante con ese SKU. Verificá que el producto no tenga variantes previas.',
        409,
        error
      );
    }
    throw error;
  }

  const variantesCreadas = await tx.productoVariante.findMany({
    where: { productoId, sku: { in: skusGenerados } },
    orderBy: { id: 'asc' },
  });

  const varianteIdPorSku = new Map(variantesCreadas.map((v) => [v.sku, v.id]));

  const opcionesData = combinaciones.flatMap((combinacion) => {
    const sku = `${nombreLimpio}-${productoId}-${Object.values(combinacion).join('-')}`;
    const varianteId = varianteIdPorSku.get(sku);

    if (varianteId === undefined) {
      throw new CustomError('Error al recuperar las variantes creadas', 500);
    }

    return Object.entries(combinacion).map(([caracId, opcionId]) => ({
      varianteId,
      caracteristicaId: parseInt(caracId),
      opcionId,
    }));
  });

  await tx.productoVarianteOpcion.createMany({ data: opcionesData });

  return tx.productoVariante.findMany({
    where: { id: { in: variantesCreadas.map((v) => v.id) } },
    orderBy: { id: 'asc' },
    include: {
      opciones: { include: { caracteristica: true, opcion: true } },
    },
  });
}
