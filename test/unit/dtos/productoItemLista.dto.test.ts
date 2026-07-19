import { ProductoItemListaDTO } from "../../../src/dtos/producto/productoItemLista.dto";

describe("ProductoItemListaDTO", () => {
  it("debería mapear correctamente un producto con marca y categoría con datos completos", () => {
    const mockProductoItemData = {
      id_producto: 1,
      nombre: "Producto Test",
      imagen_url: "http://example.com/image.png",
      plantillaId: 10,
      tipo: "SINERGICO",
      stock: 5,
      precio: 1500,
      marca: {
        id_marca: 2,
        nombre: "Marca Test",
      },
      categoria: {
        id_categoria: 3,
        nombre: "Categoria Test",
      },
      variantes: [{}, {}],
      archivado: false,
    };

    const dto = new ProductoItemListaDTO(mockProductoItemData);

    expect(dto.id).toBe(1);
    expect(dto.nombre).toBe("Producto Test");
    expect(dto.imagen).toBe("http://example.com/image.png");
    expect(dto.plantillaId).toBe(10);
    expect(dto.tipo).toBe("SINERGICO");
    expect(dto.stock).toBe(5);
    expect(dto.tieneVariantes).toBe(true);
    expect(dto.cantidadVariantes).toBe(2);
    expect(dto.archivado).toBe(false);
    expect(dto.marca).toEqual({ id_marca: 2, nombre: "Marca Test" });
    expect(dto.categoria).toEqual({ id_categoria: 3, nombre: "Categoria Test" });
  });

  it("debería manejar valores nulos o indefinidos para marca y categoría", () => {
    const mockProductoItemData = {
      id_producto: 2,
      nombre: "Producto Test 2",
      imagen_url: null,
      plantillaId: null,
      tipo: "SINERGICO",
      stock: null,
      precio: 0,
      marca: null,
      categoria: null,
      variantes: null,
      archivado: true,
    };

    const dto = new ProductoItemListaDTO(mockProductoItemData);

    expect(dto.id).toBe(2);
    expect(dto.imagen).toBeNull();
    expect(dto.plantillaId).toBeNull();
    expect(dto.tipo).toBe("SINERGICO"); // Valor por defecto
    expect(dto.stock).toBeNull();
    expect(dto.tieneVariantes).toBe(false);
    expect(dto.cantidadVariantes).toBe(0);
    expect(dto.archivado).toBe(true);
    expect(dto.marca).toEqual({ id_marca: 0, nombre: "" });
    expect(dto.categoria).toEqual({ id_categoria: 0, nombre: "" });
  });
});
