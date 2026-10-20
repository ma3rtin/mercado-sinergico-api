import { Request, Response } from "express";
import { ProductoController } from "../../../src/controllers/producto.controller";
import { ProductoDTO } from "../../../src/dtos/producto/producto.dto";

const next: jest.Mock = jest.fn();

jest.mock('../../../src/utils/asyncHandler', () => ({
  asyncHandler: (fn: any) => async (req: any, res: any, next: any) => {
    try {
      await fn(req, res, next);
    } catch (error: any) {
      const status = error.status || 500;
      res.status(status).json({ message: error.message });
    }
  },
}));

const mockProductoService = {
  getAll: jest.fn(),
  countAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  duplicarProducto: jest.fn(),
};

const mockImagenService = {
  uploadToCloudinary: jest.fn(),
  subirArchivosEnLotes: jest.fn(),
};

describe("ProductoController", () => {
  let controller: ProductoController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    controller = new ProductoController(
      mockProductoService as any,
      mockImagenService as any
    );

    mockRequest = { body: {}, params: {}, query: {}, files: undefined };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe("getProductos", () => {
    it("debería retornar todos los productos exitosamente", async () => {
      const productos = [
        { id_producto: 1, nombre: "Producto 1", precio: 100, categoria: { nombre: "Categoría 1" }, marca: { nombre: "Marca 1" } },
        { id_producto: 2, nombre: "Producto 2", precio: 200, categoria: { nombre: "Categoría 2" }, marca: { nombre: "Marca 2" } },
      ];

      mockProductoService.getAll.mockResolvedValue(productos);

      await controller.getProductos(mockRequest as Request, mockResponse as Response, next);

      expect(mockProductoService.getAll).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(productos);
    });

    it("pasa el parametro orden al service", async () => {
      mockRequest.query = { orden: "precio-asc" };
      mockProductoService.getAll.mockResolvedValue([]);

      await controller.getProductos(mockRequest as Request, mockResponse as Response, next);

      expect(mockProductoService.getAll).toHaveBeenCalledWith(
        undefined, undefined, undefined, false,
        undefined, undefined, undefined, undefined, undefined,
        "precio-asc"
      );
    });

    it("pasa orden undefined cuando no viene en la query", async () => {
      mockProductoService.getAll.mockResolvedValue([]);

      await controller.getProductos(mockRequest as Request, mockResponse as Response, next);

      const args = mockProductoService.getAll.mock.calls[0];
      expect(args[9]).toBeUndefined();
    });

    it("no rompe con un orden desconocido: responde 200 y delega al service", async () => {
      mockRequest.query = { orden: "no-existe" };
      mockProductoService.getAll.mockResolvedValue([]);

      await controller.getProductos(mockRequest as Request, mockResponse as Response, next);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("debería manejar errores y devolver estado 500", async () => {
      const error = new Error("Error de BD");
      mockProductoService.getAll.mockRejectedValue(error);

      await controller.getProductos(mockRequest as Request, mockResponse as Response, next);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Error de BD" }));
    });

    // La matriz de valores inválidos (1.5, 12abc, Infinity, etc.) se testea
    // una sola vez en parseEnteroPositivo (test/unit/utils/numeros.test.ts);
    // acá sólo importa que el controller responda 400 cuando eso pasa.
    it('responde 400 si "page" es inválido', async () => {
      mockRequest.query = { page: "abc" };
      await controller.getProductos(mockRequest as Request, mockResponse as Response, next);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockProductoService.getAll).not.toHaveBeenCalled();
    });

    it('responde 400 si "limit" es inválido', async () => {
      mockRequest.query = { limit: "abc" };
      await controller.getProductos(mockRequest as Request, mockResponse as Response, next);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockProductoService.getAll).not.toHaveBeenCalled();
    });

    it('responde 400 si "limit" supera 100 (regla propia del controller, no de parseEnteroPositivo)', async () => {
      mockRequest.query = { limit: "101" };
      await controller.getProductos(mockRequest as Request, mockResponse as Response, next);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockProductoService.getAll).not.toHaveBeenCalled();
    });

    it("manda X-Total-Count sólo cuando vienen page y limit juntos", async () => {
      mockRequest.query = { page: "1", limit: "10" };
      mockProductoService.getAll.mockResolvedValue([]);
      mockProductoService.countAll.mockResolvedValue(5);

      await controller.getProductos(mockRequest as Request, mockResponse as Response, next);

      expect(mockProductoService.countAll).toHaveBeenCalledTimes(1);
      expect(mockResponse.setHeader).toHaveBeenCalledWith("X-Total-Count", 5);
    });

    it("no manda X-Total-Count si sólo viene page (sin limit)", async () => {
      mockRequest.query = { page: "1" };
      mockProductoService.getAll.mockResolvedValue([]);

      await controller.getProductos(mockRequest as Request, mockResponse as Response, next);

      expect(mockProductoService.countAll).not.toHaveBeenCalled();
      expect(mockResponse.setHeader).not.toHaveBeenCalled();
    });

    it("ignora precioMin/precioMax inválidos en vez de mandar NaN", async () => {
      mockRequest.query = { precioMin: "abc", precioMax: "Infinity" };
      mockProductoService.getAll.mockResolvedValue([]);

      await controller.getProductos(mockRequest as Request, mockResponse as Response, next);

      const args = mockProductoService.getAll.mock.calls[0];
      expect(args[6]).toBeUndefined();
      expect(args[7]).toBeUndefined();
    });

    it("filtra ids no numéricos y entradas vacías de la lista de categorías", async () => {
      mockRequest.query = { categorias: "1,,2,abc,1.5" };
      mockProductoService.getAll.mockResolvedValue([]);

      await controller.getProductos(mockRequest as Request, mockResponse as Response, next);

      expect(mockProductoService.getAll.mock.calls[0][4]).toEqual([1, 2]);
    });
  });

  describe("getProductoById", () => {
    it("debería retornar un producto por ID exitosamente", async () => {
      const producto = { id_producto: 1, nombre: "Producto Test", precio: 150 };
      mockRequest.params = { id: "1" };
      mockProductoService.getById.mockResolvedValue(producto);

      await controller.getProductoById(mockRequest as Request, mockResponse as Response, next);

      expect(mockProductoService.getById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(producto);
    });

    it("debería manejar errores del servicio", async () => {
      mockRequest.params = { id: "1" };
      const error = new Error("Error de BD");
      mockProductoService.getById.mockRejectedValue(error);

      await controller.getProductoById(mockRequest as Request, mockResponse as Response, next);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Error de BD" }));
    });

    it.each(["abc", "1.5"])(
      "responde 400 con un id inválido (%s) sin llegar al service",
      async (id) => {
        mockRequest.params = { id };
        await controller.getProductoById(mockRequest as Request, mockResponse as Response, next);
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockProductoService.getById).not.toHaveBeenCalled();
      }
    );
  });

  describe("createProducto", () => {
    const validBody = {
      nombre: "Nuevo Producto",
      descripcion: "Descripción del producto",
      precio: "100",
      marca_id: "1",
      categoria_id: "1",
      peso: "1.5",
      altura: "10",
      ancho: "20",
      profundidad: "15",
      stock: "50",
      plantillaId: "1",
    };

    it("debería crear un producto exitosamente con imagen principal y galería", async () => {
      mockRequest.body = validBody;
      mockRequest.files = {
        icono: [{ buffer: Buffer.from("icono"), fieldname: "icono", originalname: "icono.jpg" }] as any,
        imagenes: [
          { buffer: Buffer.from("img1"), fieldname: "imagenes", originalname: "img1.jpg" },
          { buffer: Buffer.from("img2"), fieldname: "imagenes", originalname: "img2.jpg" },
        ] as any,
      };

      mockImagenService.subirArchivosEnLotes.mockResolvedValue([
        "https://cloudinary.com/icono.jpg",
        "https://cloudinary.com/img1.jpg",
        "https://cloudinary.com/img2.jpg",
      ]);

      const productoCreado = { id_producto: 1, nombre: validBody.nombre, precio: 100 };
      mockProductoService.create.mockResolvedValue(productoCreado);

      await controller.createProducto(mockRequest as Request, mockResponse as Response, next);

      // Se llamó una sola vez con los 3 archivos en orden (icono → img1 → img2)
      expect(mockImagenService.subirArchivosEnLotes).toHaveBeenCalledTimes(1);
      expect(mockImagenService.subirArchivosEnLotes).toHaveBeenCalledWith([
        expect.objectContaining({ buffer: Buffer.from("icono") }),
        expect.objectContaining({ buffer: Buffer.from("img1") }),
        expect.objectContaining({ buffer: Buffer.from("img2") }),
      ]);
      expect(mockProductoService.create).toHaveBeenCalledWith(expect.objectContaining({
        nombre: "Nuevo Producto",
        precio: 100,
        imagen_url: "https://cloudinary.com/icono.jpg",
        imagenes: ["https://cloudinary.com/img1.jpg","https://cloudinary.com/img2.jpg"],
      }));
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(productoCreado);
    });

    it("debería retornar 400 si no se proporciona imagen principal", async () => {
      mockRequest.body = validBody;
      mockRequest.files = {} as any;

      await controller.createProducto(mockRequest as Request, mockResponse as Response, next);

      expect(mockImagenService.subirArchivosEnLotes).not.toHaveBeenCalled();
      expect(mockProductoService.create).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: "La imagen principal es obligatoria" });
    });

    it("debería manejar error en la subida de imagen principal", async () => {
      mockRequest.body = validBody;
      mockRequest.files = { icono: [{ buffer: Buffer.from("icono"), fieldname: "icono", originalname: "icono.jpg" }] } as any;
      mockImagenService.subirArchivosEnLotes.mockRejectedValue(new Error("Error subiendo a Cloudinary"));

      await controller.createProducto(mockRequest as Request, mockResponse as Response, next);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Error subiendo a Cloudinary" }));
      expect(mockProductoService.create).not.toHaveBeenCalled();
    });

    it("debería retornar 400 (no 500) si opcionesDisponibles llega como JSON inválido", async () => {
      mockRequest.body = { ...validBody, opcionesDisponibles: "{esto no es json" };
      mockRequest.files = {
        icono: [{ buffer: Buffer.from("icono"), fieldname: "icono", originalname: "icono.jpg" }] as any,
      };

      await controller.createProducto(mockRequest as Request, mockResponse as Response, next);

      expect(mockProductoService.create).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining("JSON válido") })
      );
    });

    it("debería crear un producto con el máximo de archivos (1 icono + 15 imágenes = 16 total)", async () => {
      mockRequest.body = validBody;
      mockRequest.files = {
        icono: [{ buffer: Buffer.from("icono"), fieldname: "icono", originalname: "icono.jpg" }] as any,
        imagenes: Array.from({ length: 15 }, (_, i) => ({
          buffer: Buffer.from(`img${i}`),
          fieldname: "imagenes",
          originalname: `img${i}.jpg`,
        })) as any,
      };

      mockImagenService.subirArchivosEnLotes.mockResolvedValue([
        "https://cloudinary.com/icono.jpg",
        ...Array.from({ length: 15 }, (_, i) => `https://cloudinary.com/img${i}.jpg`),
      ]);

      const productoCreado = { id_producto: 1, nombre: validBody.nombre, precio: 100 };
      mockProductoService.create.mockResolvedValue(productoCreado);

      await controller.createProducto(mockRequest as Request, mockResponse as Response, next);

      expect(mockImagenService.subirArchivosEnLotes).toHaveBeenCalledTimes(1);
      expect(mockImagenService.subirArchivosEnLotes).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ buffer: Buffer.from("icono") }),
          ...Array.from({ length: 15 }, (_, i) =>
            expect.objectContaining({ buffer: Buffer.from(`img${i}`) })
          ),
        ])
      );
      expect(mockProductoService.create).toHaveBeenCalledWith(expect.objectContaining({
        imagen_url: "https://cloudinary.com/icono.jpg",
        imagenes: expect.arrayContaining(
          Array.from({ length: 15 }, (_, i) => `https://cloudinary.com/img${i}.jpg`)
        ),
      }));
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe("updateProducto", () => {
    const validDto: ProductoDTO = {
      nombre: "Producto Actualizado",
      descripcion: "Nueva descripción",
      precio: 150,
      marca_id: 2,
      categoria_id: 2,
      peso: 2,
      altura: 12,
      ancho: 22,
      profundidad: 18,
    };

    it("debería actualizar producto exitosamente sin cambiar imágenes", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = validDto;
      mockProductoService.update.mockResolvedValue({ id_producto: 1, ...validDto });

      await controller.updateProducto(mockRequest as Request, mockResponse as Response, next);

      expect(mockProductoService.update).toHaveBeenCalledWith(1, validDto);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("debería manejar error en la actualización", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = validDto;
      mockProductoService.update.mockRejectedValue(new Error("Error al actualizar"));

      await controller.updateProducto(mockRequest as Request, mockResponse as Response, next);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Error al actualizar" }));
    });

    it("debería parsear opcionesDisponibles cuando llega como JSON string (multipart/form-data)", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        ...validDto,
        opcionesDisponibles: JSON.stringify({ "1": [10, 11] }),
      };
      mockProductoService.update.mockResolvedValue({ id_producto: 1 });

      await controller.updateProducto(mockRequest as Request, mockResponse as Response, next);

      expect(mockProductoService.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ opcionesDisponibles: { "1": [10, 11] } })
      );
    });

    it("no debería tocar opcionesDisponibles cuando ya llega como objeto (JSON)", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { ...validDto, opcionesDisponibles: { "1": [10, 11] } };
      mockProductoService.update.mockResolvedValue({ id_producto: 1 });

      await controller.updateProducto(mockRequest as Request, mockResponse as Response, next);

      expect(mockProductoService.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ opcionesDisponibles: { "1": [10, 11] } })
      );
    });

    it("debería retornar 400 (no 500) si opcionesDisponibles llega como JSON inválido", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { ...validDto, opcionesDisponibles: "{esto no es json" };

      await controller.updateProducto(mockRequest as Request, mockResponse as Response, next);

      expect(mockProductoService.update).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining("JSON válido") })
      );
    });
  });

  describe("deleteProducto", () => {
    it("debería eliminar producto exitosamente", async () => {
      mockRequest.params = { id: "1" };
      mockProductoService.delete.mockResolvedValue({});
      await controller.deleteProducto(mockRequest as Request, mockResponse as Response, next);

      expect(mockProductoService.delete).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("debería manejar error en la eliminación", async () => {
      mockRequest.params = { id: "1" };
      mockProductoService.delete.mockRejectedValue(new Error("Producto no encontrado"));

      await controller.deleteProducto(mockRequest as Request, mockResponse as Response, next);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Producto no encontrado" }));
    });
  });

  describe("duplicateProducto", () => {
    it("debería duplicar producto exitosamente", async () => {
      mockRequest.params = { id: "1" };
      mockProductoService.duplicarProducto.mockResolvedValue({});
      await controller.duplicateProducto(mockRequest as Request, mockResponse as Response, next);

      expect(mockProductoService.duplicarProducto).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("debería manejar error en la duplicación", async () => {
      mockRequest.params = { id: "1" };
      mockProductoService.duplicarProducto.mockRejectedValue(new Error("Error al duplicar"));

      await controller.duplicateProducto(mockRequest as Request, mockResponse as Response, next);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Error al duplicar" }));
    });
  });
});
