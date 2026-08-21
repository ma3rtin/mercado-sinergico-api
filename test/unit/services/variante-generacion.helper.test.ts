import { generarVariantesEnTransaccion } from "../../../src/services/variante-generacion.helper";

function mockTx(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    productoVariante: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    productoVarianteOpcion: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    ...overrides,
  } as any;
}

const productoBase = {
  id_producto: 1,
  nombre: "Producto Test",
  tipo: "SINERGICO" as const,
  plantilla: {
    caracteristicas: [
      { id: 10, opciones: [{ id: 100 }, { id: 101 }] },
      { id: 11, opciones: [{ id: 110 }] },
    ],
  },
};

describe("generarVariantesEnTransaccion", () => {
  it("rechaza si el producto no tiene plantilla", async () => {
    const tx = mockTx();
    await expect(
      generarVariantesEnTransaccion(tx, { ...productoBase, plantilla: null }, { "10": [100] })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rechaza opcionesDisponibles vacío", async () => {
    const tx = mockTx();
    await expect(
      generarVariantesEnTransaccion(tx, productoBase, {})
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rechaza una característica que no pertenece a la plantilla", async () => {
    const tx = mockTx();
    await expect(
      generarVariantesEnTransaccion(tx, productoBase, { "99": [1] })
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining("no pertenece a la plantilla"),
    });
  });

  it("rechaza una característica sin ninguna opción seleccionada", async () => {
    const tx = mockTx();
    await expect(
      generarVariantesEnTransaccion(tx, productoBase, { "10": [] })
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining("al menos una opción"),
    });
  });

  it("rechaza un opcionId que no pertenece a la característica indicada", async () => {
    const tx = mockTx();
    // 110 pertenece a la característica 11, no a la 10
    await expect(
      generarVariantesEnTransaccion(tx, productoBase, { "10": [110] })
    ).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining("no pertenece a la característica"),
    });
  });

  it("rechaza más de 200 combinaciones", async () => {
    const tx = mockTx();
    const productoConMuchasOpciones = {
      ...productoBase,
      plantilla: {
        caracteristicas: [
          { id: 10, opciones: Array.from({ length: 15 }, (_, i) => ({ id: i })) },
          { id: 11, opciones: Array.from({ length: 15 }, (_, i) => ({ id: 100 + i })) },
        ],
      },
    };
    await expect(
      generarVariantesEnTransaccion(tx, productoConMuchasOpciones, {
        "10": Array.from({ length: 15 }, (_, i) => i),
        "11": Array.from({ length: 15 }, (_, i) => 100 + i),
      })
    ).rejects.toMatchObject({ status: 400, message: expect.stringContaining("200") });
  });

  it("rechaza rápido (sin generar el producto cartesiano) si un id válido viene repetido miles de veces", async () => {
    const tx = mockTx();
    const opcionIdRepetido = Array.from({ length: 50000 }, () => 100);

    const inicio = Date.now();
    await expect(
      generarVariantesEnTransaccion(tx, productoBase, { "10": opcionIdRepetido })
    ).rejects.toMatchObject({ status: 400, message: expect.stringContaining("200") });
    const duracionMs = Date.now() - inicio;

    expect(duracionMs).toBeLessThan(500);
    expect(tx.productoVariante.createMany).not.toHaveBeenCalled();
  });

  it("genera las variantes y sus opciones cuando todo es válido", async () => {
    const createManyVariantes = jest.fn().mockResolvedValue({ count: 2 });
    const findManyVariantes = jest
      .fn()
      .mockResolvedValueOnce([
        { id: 1, sku: "PRODUCTO-T-1-100" },
        { id: 2, sku: "PRODUCTO-T-1-101" },
      ])
      .mockResolvedValueOnce([
        { id: 1, sku: "PRODUCTO-T-1-100", opciones: [] },
        { id: 2, sku: "PRODUCTO-T-1-101", opciones: [] },
      ]);
    const createManyOpciones = jest.fn().mockResolvedValue({ count: 2 });

    const tx = mockTx({
      productoVariante: { createMany: createManyVariantes, findMany: findManyVariantes } as any,
      productoVarianteOpcion: { createMany: createManyOpciones } as any,
    });

    const resultado = await generarVariantesEnTransaccion(tx, productoBase, { "10": [100, 101] });

    expect(createManyVariantes).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ productoId: 1, sku: "PRODUCTO-T-1-100", stockFisico: null }),
        expect.objectContaining({ productoId: 1, sku: "PRODUCTO-T-1-101", stockFisico: null }),
      ]),
    });
    expect(createManyOpciones).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        { varianteId: 1, caracteristicaId: 10, opcionId: 100 },
        { varianteId: 2, caracteristicaId: 10, opcionId: 101 },
      ]),
    });
    expect(resultado).toHaveLength(2);
  });

  it("usa stockFisico 0 para productos enérgicos", async () => {
    const createManyVariantes = jest.fn().mockResolvedValue({ count: 1 });
    const tx = mockTx({
      productoVariante: {
        createMany: createManyVariantes,
        findMany: jest.fn().mockResolvedValue([{ id: 1, sku: "PRODUCTO-T-1-100" }]),
      } as any,
    });

    await generarVariantesEnTransaccion(
      tx,
      { ...productoBase, tipo: "ENERGICO" as any },
      { "10": [100] }
    );

    expect(createManyVariantes).toHaveBeenCalledWith({
      data: expect.arrayContaining([expect.objectContaining({ stockFisico: 0 })]),
    });
  });
});
