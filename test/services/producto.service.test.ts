import { ProductoService } from "../../src/services/producto.service";
import { ProductoDTO } from "../../src/dtos/producto.dto";

// Mock de Prisma Client
const mockProductoFindMany = jest.fn();
const mockProductoFindUnique = jest.fn();
const mockProductoCreate = jest.fn();
const mockProductoUpdate = jest.fn();
const mockProductoDelete = jest.fn();
const mockCategoriaFindUnique = jest.fn();
const mockMarcaFindUnique = jest.fn();
const mockPlantillaFindUnique = jest.fn();
const mockPaqueteBaseProductoDeleteMany = jest.fn();
const mockProductoImagenDeleteMany = jest.fn();
const mockTransaction = jest.fn();

jest.mock("../../src/generated/prisma", () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      producto: {
        findMany: mockProductoFindMany,
        findUnique: mockProductoFindUnique,
        create: mockProductoCreate,
        update: mockProductoUpdate,
        delete: mockProductoDelete,
      },
      categoria: {
        findUnique: mockCategoriaFindUnique,
      },
      marca: {
        findUnique: mockMarcaFindUnique,
      },
      plantilla: {
        findUnique: mockPlantillaFindUnique,
      },
      paqueteBaseProducto: {
        deleteMany: mockPaqueteBaseProductoDeleteMany,
      },
      productoImagen: {
        deleteMany: mockProductoImagenDeleteMany,
      },
      $transaction: mockTransaction,
    })),
  };
});

describe("ProductoService", () => {
  let service: ProductoService;

  beforeEach(() => {
    service = new ProductoService();
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("debería retornar todos los productos con sus relaciones", async () => {
      const mockProductos = [
        {
          id_producto: 1,
          nombre: "Producto 1",
          descripcion: "Descripción 1",
          precio: 100,
          marca_id: 1,
          categoria_id: 1,
          peso: 1.5,
          altura: 10,
          ancho: 20,
          profundidad: 15,
          stock: 50,
          imagen_url: "url1.jpg",
          plantillaId: null,
          categoria: { id_categoria: 1, nombre: "Categoría 1" },
          marca: { id_marca: 1, nombre: "Marca 1" },
          imagenes: [
            { id: 1, url: "img1.jpg" },
            { id: 2, url: "img2.jpg" },
          ],
        },
        {
          id_producto: 2,
          nombre: "Producto 2",
          descripcion: "Descripción 2",
          precio: 200,
          marca_id: 2,
          categoria_id: 2,
          peso: 2.5,
          altura: 15,
          ancho: 25,
          profundidad: 20,
          stock: 30,
          imagen_url: "url2.jpg",
          plantillaId: 1,
          categoria: { id_categoria: 2, nombre: "Categoría 2" },
          marca: { id_marca: 2, nombre: "Marca 2" },
          imagenes: [],
        },
      ];

      mockProductoFindMany.mockResolvedValue(mockProductos);

      const resultado = await service.getAll();

      expect(mockProductoFindMany).toHaveBeenCalledWith({
        where: undefined,
        include: {
          categoria: true,
          marca: true,
          imagenes: true,
        },
        skip: 0,
        take: 10,
        orderBy: { id_producto: "asc" },
      });
      expect(resultado).toEqual(mockProductos);
      expect(resultado).toHaveLength(2);
    });

    it("debería filtrar productos por nombre", async () => {
      const mockProductos = [
        {
          id_producto: 1,
          nombre: "Producto Test",
          descripcion: "Descripción",
          precio: 100,
          marca_id: 1,
          categoria_id: 1,
          peso: 1.5,
          altura: 10,
          ancho: 20,
          profundidad: 15,
          stock: 50,
          imagen_url: "url1.jpg",
          plantillaId: null,
          categoria: { id_categoria: 1, nombre: "Categoría 1" },
          marca: { id_marca: 1, nombre: "Marca 1" },
          imagenes: [],
        },
      ];

      mockProductoFindMany.mockResolvedValue(mockProductos);

      const resultado = await service.getAll("Test", 0, 10);

      expect(mockProductoFindMany).toHaveBeenCalledWith({
        where: {
          nombre: {
            contains: "Test",
          },
        },
        include: {
          categoria: true,
          marca: true,
          imagenes: true,
        },
        skip: 0,
        take: 10,
        orderBy: { id_producto: "asc" },
      });
      expect(resultado).toEqual(mockProductos);
    });

    it("debería retornar array vacío si no hay productos", async () => {
      mockProductoFindMany.mockResolvedValue([]);

      const resultado = await service.getAll();

      expect(resultado).toEqual([]);
      expect(resultado).toHaveLength(0);
    });

    it("debería propagar errores de la base de datos", async () => {
      mockProductoFindMany.mockRejectedValue(new Error("Error de BD"));

      await expect(service.getAll()).rejects.toThrow("Error de BD");
    });
  });

  describe("getById", () => {
    it("debería retornar un producto por su id con sus relaciones", async () => {
      const mockProducto = {
        id_producto: 1,
        nombre: "Producto Test",
        descripcion: "Descripción Test",
        precio: 150,
        marca_id: 1,
        categoria_id: 1,
        peso: 1.5,
        altura: 10,
        ancho: 20,
        profundidad: 15,
        stock: 50,
        imagen_url: "url.jpg",
        plantillaId: null,
        categoria: { id_categoria: 1, nombre: "Categoría Test" },
        marca: { id_marca: 1, nombre: "Marca Test" },
        imagenes: [{ id: 1, url: "img1.jpg" }],
      };

      mockProductoFindUnique.mockResolvedValue(mockProducto);

      const resultado = await service.getById(1);

      expect(mockProductoFindUnique).toHaveBeenCalledWith({
        where: { id_producto: 1 },
        include: { categoria: true, marca: true, imagenes: true },
      });
      expect(resultado).toEqual(mockProducto);
    });

    it("debería retornar null si el producto no existe", async () => {
      mockProductoFindUnique.mockResolvedValue(null);

      const resultado = await service.getById(999);

      expect(resultado).toBeNull();
    });

    it("debería propagar errores de la base de datos", async () => {
      mockProductoFindUnique.mockRejectedValue(new Error("Error de BD"));

      await expect(service.getById(1)).rejects.toThrow("Error de BD");
    });
  });

  describe("create", () => {
    const productoDTO: ProductoDTO = {
      nombre: "Nuevo Producto",
      descripcion: "Descripción del producto",
      precio: 100,
      marca_id: 1,
      peso: 1.5,
      altura: 10,
      ancho: 20,
      profundidad: 15,
      categoria_id: 1,
      imagen_url: "main.jpg",
      imagenes: ["img1.jpg", "img2.jpg"],
      stock: 50,
      plantillaId: 1,
    };

    it("debería crear un producto exitosamente con todos los campos", async () => {
      const mockCategoria = { id_categoria: 1, nombre: "Categoría 1" };
      const mockProductoCreado = {
        id_producto: 1,
        ...productoDTO,
        categoria: mockCategoria,
        marca: { id_marca: 1, nombre: "Marca 1" },
        imagenes: [
          { id: 1, url: "img1.jpg" },
          { id: 2, url: "img2.jpg" },
        ],
      };

      mockCategoriaFindUnique.mockResolvedValue(mockCategoria);
      mockProductoCreate.mockResolvedValue(mockProductoCreado);

      const resultado = await service.create(productoDTO);

      expect(mockCategoriaFindUnique).toHaveBeenCalledWith({
        where: { id_categoria: 1 },
      });

      expect(mockProductoCreate).toHaveBeenCalledWith({
        data: {
          nombre: productoDTO.nombre,
          descripcion: productoDTO.descripcion,
          precio: productoDTO.precio,
          peso: productoDTO.peso,
          altura: productoDTO.altura,
          ancho: productoDTO.ancho,
          profundidad: productoDTO.profundidad,
          stock: productoDTO.stock,
          imagen_url: productoDTO.imagen_url,
          categoria: { connect: { id_categoria: 1 } },
          marca: { connect: { id_marca: 1 } },
          plantilla: { connect: { id: 1 } },
          imagenes: {
            create: [{ url: "img1.jpg" }, { url: "img2.jpg" }],
          },
        },
        include: { imagenes: true, categoria: true, marca: true },
      });

      expect(resultado).toEqual(mockProductoCreado);
    });

    it("debería crear un producto sin plantilla ni imágenes adicionales", async () => {
      const dtoBásico: ProductoDTO = {
        nombre: "Producto Básico",
        descripcion: "Descripción básica",
        precio: 50,
        marca_id: 1,
        peso: 1,
        altura: 5,
        ancho: 10,
        profundidad: 8,
        categoria_id: 1,
      };

      const mockCategoria = { id_categoria: 1, nombre: "Categoría 1" };
      const mockProductoCreado = {
        id_producto: 2,
        ...dtoBásico,
        plantillaId: null,
        imagen_url: null,
        stock: null,
        categoria: mockCategoria,
        marca: { id_marca: 1, nombre: "Marca 1" },
        imagenes: [],
      };

      mockCategoriaFindUnique.mockResolvedValue(mockCategoria);
      mockProductoCreate.mockResolvedValue(mockProductoCreado);

      const resultado = await service.create(dtoBásico);

      expect(mockProductoCreate).toHaveBeenCalledWith({
        data: {
          nombre: dtoBásico.nombre,
          descripcion: dtoBásico.descripcion,
          precio: dtoBásico.precio,
          peso: dtoBásico.peso,
          altura: dtoBásico.altura,
          ancho: dtoBásico.ancho,
          profundidad: dtoBásico.profundidad,
          stock: undefined,
          imagen_url: undefined,
          categoria: { connect: { id_categoria: 1 } },
          marca: { connect: { id_marca: 1 } },
          plantilla: undefined,
          imagenes: {
            create: [],
          },
        },
        include: { imagenes: true, categoria: true, marca: true },
      });

      expect(resultado).toEqual(mockProductoCreado);
    });

    it("debería lanzar error si la categoría no existe", async () => {
      mockCategoriaFindUnique.mockResolvedValue(null);

      await expect(service.create(productoDTO)).rejects.toThrow(
        "Categoria no encontrada"
      );

      expect(mockProductoCreate).not.toHaveBeenCalled();
    });

    it("debería propagar errores de la base de datos al crear", async () => {
      const mockCategoria = { id_categoria: 1, nombre: "Categoría 1" };
      mockCategoriaFindUnique.mockResolvedValue(mockCategoria);
      mockProductoCreate.mockRejectedValue(
        new Error("Error al crear producto")
      );

      await expect(service.create(productoDTO)).rejects.toThrow(
        "Error al crear producto"
      );
    });

    it("debería manejar array de imágenes vacío correctamente", async () => {
      const dtoSinImagenes: ProductoDTO = {
        ...productoDTO,
        imagenes: [],
      };

      const mockCategoria = { id_categoria: 1, nombre: "Categoría 1" };
      const mockProductoCreado = {
        id_producto: 3,
        ...dtoSinImagenes,
        categoria: mockCategoria,
        marca: { id_marca: 1, nombre: "Marca 1" },
        imagenes: [],
      };

      mockCategoriaFindUnique.mockResolvedValue(mockCategoria);
      mockProductoCreate.mockResolvedValue(mockProductoCreado);

      await service.create(dtoSinImagenes);

      expect(mockProductoCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            imagenes: {
              create: [],
            },
          }),
        })
      );
    });
  });

  describe("update", () => {
    const productoDTO: ProductoDTO = {
      nombre: "Producto Actualizado",
      descripcion: "Descripción actualizada",
      precio: 150,
      marca_id: 2,
      peso: 2,
      altura: 12,
      ancho: 22,
      profundidad: 18,
      categoria_id: 2,
      imagen_url: "updated.jpg",
      imagenes: ["new1.jpg", "new2.jpg"],
    };

    it("debería actualizar un producto con todas las propiedades", async () => {
      const mockProductoActualizado = {
        id_producto: 1,
        ...productoDTO,
        stock: 50,
        plantillaId: null,
        imagenes: [
          { id: 3, url: "new1.jpg" },
          { id: 4, url: "new2.jpg" },
        ],
      };

      mockProductoUpdate.mockResolvedValue(mockProductoActualizado);

      const resultado = await service.update(1, productoDTO);

      expect(mockProductoUpdate).toHaveBeenCalledWith({
        where: { id_producto: 1 },
        data: {
          nombre: productoDTO.nombre,
          descripcion: productoDTO.descripcion,
          precio: productoDTO.precio,
          peso: productoDTO.peso,
          altura: productoDTO.altura,
          ancho: productoDTO.ancho,
          profundidad: productoDTO.profundidad,
          imagen_url: productoDTO.imagen_url,
          categoria: { connect: { id_categoria: 2 } },
          marca: { connect: { id_marca: 2 } },
          imagenes: {
            deleteMany: {},
            create: [{ url: "new1.jpg" }, { url: "new2.jpg" }],
          },
        },
        include: { imagenes: true },
      });

      expect(resultado).toEqual(mockProductoActualizado);
    });

    it("debería actualizar sin reemplazar imágenes si no se proporcionan", async () => {
      const dtoSinImagenes: ProductoDTO = {
        nombre: "Producto Sin Cambio de Imágenes",
        descripcion: "Descripción",
        precio: 100,
        marca_id: 1,
        peso: 1.5,
        altura: 10,
        ancho: 20,
        profundidad: 15,
        categoria_id: 1,
      };

      const mockProductoActualizado = {
        id_producto: 1,
        ...dtoSinImagenes,
        imagen_url: null,
        stock: 50,
        plantillaId: null,
        imagenes: [{ id: 1, url: "old.jpg" }],
      };

      mockProductoUpdate.mockResolvedValue(mockProductoActualizado);

      await service.update(1, dtoSinImagenes);

      expect(mockProductoUpdate).toHaveBeenCalledWith({
        where: { id_producto: 1 },
        data: {
          nombre: dtoSinImagenes.nombre,
          descripcion: dtoSinImagenes.descripcion,
          precio: dtoSinImagenes.precio,
          peso: dtoSinImagenes.peso,
          altura: dtoSinImagenes.altura,
          ancho: dtoSinImagenes.ancho,
          profundidad: dtoSinImagenes.profundidad,
          imagen_url: undefined,
          categoria: { connect: { id_categoria: 1 } },
          marca: { connect: { id_marca: 1 } },
        },
        include: { imagenes: true },
      });
    });

    it("debería propagar errores de la base de datos al actualizar", async () => {
      mockProductoUpdate.mockRejectedValue(new Error("Error al actualizar"));

      await expect(service.update(1, productoDTO)).rejects.toThrow(
        "Error al actualizar"
      );
    });

    it("debería actualizar y eliminar todas las imágenes antiguas al proporcionar nuevas", async () => {
      const dtoConNuevasImagenes: ProductoDTO = {
        nombre: "Producto",
        descripcion: "Descripción",
        precio: 100,
        marca_id: 1,
        peso: 1,
        altura: 10,
        ancho: 20,
        profundidad: 15,
        categoria_id: 1,
        imagenes: ["nueva1.jpg"],
      };

      mockProductoUpdate.mockResolvedValue({
        id_producto: 1,
        ...dtoConNuevasImagenes,
        imagenes: [{ id: 5, url: "nueva1.jpg" }],
      });

      await service.update(1, dtoConNuevasImagenes);

      expect(mockProductoUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            imagenes: {
              deleteMany: {},
              create: [{ url: "nueva1.jpg" }],
            },
          }),
        })
      );
    });
  });

  describe("delete", () => {
    it("debería eliminar un producto exitosamente", async () => {
      const mockProductoEliminado = {
        id_producto: 1,
        nombre: "Producto Eliminado",
        descripcion: "Descripción",
        precio: 100,
        marca_id: 1,
        categoria_id: 1,
        peso: 1,
        altura: 10,
        ancho: 20,
        profundidad: 15,
        stock: 0,
        imagen_url: null,
        plantillaId: null,
      };

      // Mock the transaction
      mockTransaction.mockImplementation(async (callback) => {
        const tx = {
          paqueteBaseProducto: {
            deleteMany: mockPaqueteBaseProductoDeleteMany.mockResolvedValue({ count: 0 }),
          },
          productoImagen: {
            deleteMany: mockProductoImagenDeleteMany.mockResolvedValue({ count: 0 }),
          },
          producto: {
            delete: mockProductoDelete.mockResolvedValue(mockProductoEliminado),
          },
        };
        return callback(tx);
      });

      const resultado = await service.delete(1);

      expect(mockTransaction).toHaveBeenCalled();
      expect(mockPaqueteBaseProductoDeleteMany).toHaveBeenCalledWith({
        where: { productoId: 1 },
      });
      expect(mockProductoImagenDeleteMany).toHaveBeenCalledWith({
        where: { productoId: 1 },
      });
      expect(mockProductoDelete).toHaveBeenCalledWith({
        where: { id_producto: 1 },
      });
      expect(resultado).toEqual(mockProductoEliminado);
    });

    it("debería propagar errores si el producto no existe", async () => {
      mockTransaction.mockImplementation(async (callback) => {
        const tx = {
          paqueteBaseProducto: {
            deleteMany: mockPaqueteBaseProductoDeleteMany.mockResolvedValue({ count: 0 }),
          },
          productoImagen: {
            deleteMany: mockProductoImagenDeleteMany.mockResolvedValue({ count: 0 }),
          },
          producto: {
            delete: mockProductoDelete.mockRejectedValue(new Error("Producto no encontrado")),
          },
        };
        return callback(tx);
      });

      await expect(service.delete(999)).rejects.toThrow("Producto no encontrado");
    });

    it("debería propagar errores de la base de datos al eliminar", async () => {
      mockTransaction.mockRejectedValue(new Error("Error de BD"));

      await expect(service.delete(1)).rejects.toThrow("Error de BD");
    });
  });

  describe("duplicarProducto", () => {
    it("debería duplicar un producto exitosamente", async () => {
      const mockProductoOriginal = {
        id_producto: 1,
        nombre: "Producto Original",
        descripcion: "Descripción",
        precio: 100,
        marca_id: 1,
        categoria_id: 1,
        peso: 1.5,
        altura: 10,
        ancho: 20,
        profundidad: 15,
        stock: 50,
        imagen_url: "original.jpg",
        plantillaId: null,
        imagenes: [
          { id: 1, url: "img1.jpg", productoId: 1 },
          { id: 2, url: "img2.jpg", productoId: 1 },
        ],
      };

      const mockProductoDuplicado = {
        id_producto: 2,
        nombre: "Producto Original (Copia)",
        descripcion: "Descripción",
        precio: 100,
        marca_id: 1,
        categoria_id: 1,
        peso: 1.5,
        altura: 10,
        ancho: 20,
        profundidad: 15,
        stock: 50,
        imagen_url: "original.jpg",
        plantillaId: null,
        imagenes: [
          { id: 3, url: "img1.jpg", productoId: 2 },
          { id: 4, url: "img2.jpg", productoId: 2 },
        ],
      };

      mockProductoFindUnique.mockResolvedValue(mockProductoOriginal);
      mockProductoCreate.mockResolvedValue(mockProductoDuplicado);

      const resultado = await service.duplicarProducto(1);

      expect(mockProductoFindUnique).toHaveBeenCalledWith({
        where: { id_producto: 1 },
        include: { imagenes: true },
      });

      expect(mockProductoCreate).toHaveBeenCalledWith({
        data: {
          nombre: "Producto Original (Copia)",
          descripcion: mockProductoOriginal.descripcion,
          precio: mockProductoOriginal.precio,
          peso: mockProductoOriginal.peso,
          altura: mockProductoOriginal.altura,
          ancho: mockProductoOriginal.ancho,
          profundidad: mockProductoOriginal.profundidad,
          stock: mockProductoOriginal.stock,
          imagen_url: mockProductoOriginal.imagen_url,
          categoria: { connect: { id_categoria: 1 } },
          marca: { connect: { id_marca: 1 } },
          imagenes: {
            create: [{ url: "img1.jpg" }, { url: "img2.jpg" }],
          },
        },
        include: { imagenes: true },
      });

      expect(resultado).toEqual(mockProductoDuplicado);
    });

    it("debería lanzar error si el producto no existe", async () => {
      mockProductoFindUnique.mockResolvedValue(null);

      await expect(service.duplicarProducto(999)).rejects.toThrow(
        "Producto no encontrado"
      );

      expect(mockProductoCreate).not.toHaveBeenCalled();
    });

    it("debería propagar errores de la base de datos al duplicar", async () => {
      const mockProductoOriginal = {
        id_producto: 1,
        nombre: "Producto Original",
        descripcion: "Descripción",
        precio: 100,
        marca_id: 1,
        categoria_id: 1,
        peso: 1.5,
        altura: 10,
        ancho: 20,
        profundidad: 15,
        stock: 50,
        imagen_url: "original.jpg",
        plantillaId: null,
        imagenes: [],
      };

      mockProductoFindUnique.mockResolvedValue(mockProductoOriginal);
      mockProductoCreate.mockRejectedValue(new Error("Error al duplicar"));

      await expect(service.duplicarProducto(1)).rejects.toThrow(
        "Error al duplicar"
      );
    });
  });
});