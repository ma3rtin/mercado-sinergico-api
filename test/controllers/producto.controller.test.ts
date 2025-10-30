import { Request, Response } from "express";
import { ProductoController } from "../../src/controllers/producto.controller";
import { ProductoDTO } from "../../src/dtos/producto.dto";

// Mock del ProductoService
const mockProductoService = {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    duplicarProducto: jest.fn(),
};

// Mock del ImagenService
const mockImagenService = {
    uploadToCloudinary: jest.fn(),
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

        mockRequest = {
            body: {},
            params: {},
            query: {},
            files: undefined,
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };

        jest.clearAllMocks();
    });

    describe("getProductos", () => {
        it("debería retornar todos los productos exitosamente", async () => {
            const productos = [
                {
                    id_producto: 1,
                    nombre: "Producto 1",
                    precio: 100,
                    categoria: { nombre: "Categoría 1" },
                    marca: { nombre: "Marca 1" },
                },
                {
                    id_producto: 2,
                    nombre: "Producto 2",
                    precio: 200,
                    categoria: { nombre: "Categoría 2" },
                    marca: { nombre: "Marca 2" },
                },
            ];

            mockProductoService.getAll.mockResolvedValue(productos);

            await controller.getProductos(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockProductoService.getAll).toHaveBeenCalledTimes(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(productos);
        });

        it("debería manejar errores y devolver estado 500", async () => {
            const error = new Error("Error de BD");
            mockProductoService.getAll.mockRejectedValue(error);

            await controller.getProductos(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Error de BD" })
            );
        });
    });

    describe("getProductoById", () => {
        it("debería retornar un producto por ID exitosamente", async () => {
            const producto = {
                id_producto: 1,
                nombre: "Producto Test",
                precio: 150,
            };

            mockRequest.params = { id: "1" };
            mockProductoService.getById.mockResolvedValue(producto);

            await controller.getProductoById(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockProductoService.getById).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(producto);
        });

        it("debería retornar 404 si el producto no existe", async () => {
            mockRequest.params = { id: "999" };
            mockProductoService.getById.mockResolvedValue(null);

            await controller.getProductoById(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Product not found" })
            );
        });

        it("debería manejar errores del servicio", async () => {
            mockRequest.params = { id: "1" };
            const error = new Error("Error de BD");
            mockProductoService.getById.mockRejectedValue(error);

            await controller.getProductoById(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Error de BD" })
            );
        });
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
                icono: [
                    {
                        buffer: Buffer.from("icono"),
                        fieldname: "icono",
                        originalname: "icono.jpg",
                    } as Express.Multer.File,
                ],
                imagenes: [
                    {
                        buffer: Buffer.from("img1"),
                        fieldname: "imagenes",
                        originalname: "img1.jpg",
                    } as Express.Multer.File,
                    {
                        buffer: Buffer.from("img2"),
                        fieldname: "imagenes",
                        originalname: "img2.jpg",
                    } as Express.Multer.File,
                ],
            } as any;

            mockImagenService.uploadToCloudinary
                .mockResolvedValueOnce("https://cloudinary.com/icono.jpg")
                .mockResolvedValueOnce("https://cloudinary.com/img1.jpg")
                .mockResolvedValueOnce("https://cloudinary.com/img2.jpg");

            const productoCreado = {
                id_producto: 1,
                nombre: validBody.nombre,
                precio: 100,
            };

            mockProductoService.create.mockResolvedValue(productoCreado);

            await controller.createProducto(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockImagenService.uploadToCloudinary).toHaveBeenCalledTimes(3);
            expect(mockProductoService.create).toHaveBeenCalledWith({
                nombre: "Nuevo Producto",
                descripcion: "Descripción del producto",
                precio: 100,
                marca_id: 1,
                categoria_id: 1,
                peso: 1.5,
                altura: 10,
                ancho: 20,
                profundidad: 15,
                stock: 50,
                plantillaId: 1,
                imagen_url: "https://cloudinary.com/icono.jpg",
                imagenes: [
                    "https://cloudinary.com/img1.jpg",
                    "https://cloudinary.com/img2.jpg",
                ],
            });

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(productoCreado);
        });

        it("debería crear producto sin imágenes adicionales (solo icono)", async () => {
            mockRequest.body = validBody;
            mockRequest.files = {
                icono: [
                    {
                        buffer: Buffer.from("icono"),
                        fieldname: "icono",
                        originalname: "icono.jpg",
                    } as Express.Multer.File,
                ],
            } as any;

            mockImagenService.uploadToCloudinary.mockResolvedValue(
                "https://cloudinary.com/icono.jpg"
            );

            const productoCreado = { id_producto: 1, nombre: validBody.nombre };
            mockProductoService.create.mockResolvedValue(productoCreado);

            await controller.createProducto(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockImagenService.uploadToCloudinary).toHaveBeenCalledTimes(1);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
        });

        it("debería retornar 400 si no se proporciona imagen principal", async () => {
            mockRequest.body = validBody;
            mockRequest.files = {} as any;

            await controller.createProducto(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockImagenService.uploadToCloudinary).not.toHaveBeenCalled();
            expect(mockProductoService.create).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "La imagen principal es obligatoria",
            });
        });

        it("debería manejar campos opcionales como undefined", async () => {
            const bodyMinimo = {
                nombre: "Producto Mínimo",
                descripcion: "Descripción",
                precio: "50",
                marca_id: "1",
                categoria_id: "1",
            };

            mockRequest.body = bodyMinimo;
            mockRequest.files = {
                icono: [
                    {
                        buffer: Buffer.from("icono"),
                        fieldname: "icono",
                        originalname: "icono.jpg",
                    } as Express.Multer.File,
                ],
            } as any;

            mockImagenService.uploadToCloudinary.mockResolvedValue(
                "https://cloudinary.com/icono.jpg"
            );
            mockProductoService.create.mockResolvedValue({
                id_producto: 1,
                nombre: bodyMinimo.nombre,
            });

            await controller.createProducto(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockProductoService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    nombre: "Producto Mínimo",
                    precio: 50,
                    peso: undefined,
                    altura: undefined,
                    ancho: undefined,
                    profundidad: undefined,
                    stock: undefined,
                    plantillaId: undefined,
                })
            );
        });

        it("debería convertir correctamente strings a números", async () => {
            mockRequest.body = {
                nombre: "Test",
                descripcion: "Test",
                precio: "99.99",
                marca_id: "5",
                categoria_id: "3",
                peso: "2.5",
                altura: "15.7",
                ancho: "25.3",
                profundidad: "18.9",
                stock: "100",
                plantillaId: "2",
            };

            mockRequest.files = {
                icono: [
                    {
                        buffer: Buffer.from("icono"),
                        fieldname: "icono",
                        originalname: "icono.jpg",
                    } as Express.Multer.File,
                ],
            } as any;

            mockImagenService.uploadToCloudinary.mockResolvedValue("url");
            mockProductoService.create.mockResolvedValue({});

            await controller.createProducto(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockProductoService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    precio: 99.99,
                    marca_id: 5,
                    categoria_id: 3,
                    peso: 2.5,
                    altura: 15.7,
                    ancho: 25.3,
                    profundidad: 18.9,
                    stock: 100,
                    plantillaId: 2,
                })
            );
        });

        it("debería manejar error en la subida de imagen principal", async () => {
            mockRequest.body = validBody;
            mockRequest.files = {
                icono: [
                    {
                        buffer: Buffer.from("icono"),
                        fieldname: "icono",
                        originalname: "icono.jpg",
                    } as Express.Multer.File,
                ],
            } as any;

            const error = new Error("Error subiendo a Cloudinary");
            mockImagenService.uploadToCloudinary.mockRejectedValue(error);

            await controller.createProducto(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Error subiendo a Cloudinary" })
            );
            expect(mockProductoService.create).not.toHaveBeenCalled();
        });

        it("debería manejar error en la creación del producto", async () => {
            mockRequest.body = validBody;
            mockRequest.files = {
                icono: [
                    {
                        buffer: Buffer.from("icono"),
                        fieldname: "icono",
                        originalname: "icono.jpg",
                    } as Express.Multer.File,
                ],
            } as any;

            mockImagenService.uploadToCloudinary.mockResolvedValue("url");

            const error = new Error("Categoria no encontrada");
            mockProductoService.create.mockRejectedValue(error);

            await controller.createProducto(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Categoria no encontrada" })
            );
        });

        it("debería manejar error en la subida de imágenes de galería", async () => {
            mockRequest.body = validBody;
            mockRequest.files = {
                icono: [
                    {
                        buffer: Buffer.from("icono"),
                        fieldname: "icono",
                        originalname: "icono.jpg",
                    } as Express.Multer.File,
                ],
                imagenes: [
                    {
                        buffer: Buffer.from("img1"),
                        fieldname: "imagenes",
                        originalname: "img1.jpg",
                    } as Express.Multer.File,
                ],
            } as any;

            mockImagenService.uploadToCloudinary
                .mockResolvedValueOnce("https://cloudinary.com/icono.jpg")
                .mockRejectedValueOnce(new Error("Error en imagen de galería"));

            await controller.createProducto(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Error en imagen de galería" })
            );
            expect(mockProductoService.create).not.toHaveBeenCalled();
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

            const productoActualizado = { id_producto: 1, ...validDto };
            mockProductoService.update.mockResolvedValue(productoActualizado);

            await controller.updateProducto(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockProductoService.update).toHaveBeenCalledWith(1, validDto);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(productoActualizado);
        });

        it("debería actualizar producto con nueva imagen principal", async () => {
            mockRequest.params = { id: "1" };
            mockRequest.body = validDto;
            mockRequest.files = {
                icono: [
                    {
                        buffer: Buffer.from("nuevo_icono"),
                        fieldname: "icono",
                        originalname: "nuevo_icono.jpg",
                    } as Express.Multer.File,
                ],
            } as any;

            mockImagenService.uploadToCloudinary.mockResolvedValue(
                "https://cloudinary.com/nuevo_icono.jpg"
            );
            mockProductoService.update.mockResolvedValue({});

            await controller.updateProducto(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockImagenService.uploadToCloudinary).toHaveBeenCalledWith(
                Buffer.from("nuevo_icono")
            );
            expect(mockProductoService.update).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    imagen_url: "https://cloudinary.com/nuevo_icono.jpg",
                })
            );
        });

        it("debería actualizar producto con nuevas imágenes de galería", async () => {
            mockRequest.params = { id: "1" };
            mockRequest.body = validDto;
            mockRequest.files = {
                imagenes: [
                    {
                        buffer: Buffer.from("img1"),
                        fieldname: "imagenes",
                        originalname: "img1.jpg",
                    } as Express.Multer.File,
                    {
                        buffer: Buffer.from("img2"),
                        fieldname: "imagenes",
                        originalname: "img2.jpg",
                    } as Express.Multer.File,
                ],
            } as any;

            mockImagenService.uploadToCloudinary
                .mockResolvedValueOnce("https://cloudinary.com/img1.jpg")
                .mockResolvedValueOnce("https://cloudinary.com/img2.jpg");

            mockProductoService.update.mockResolvedValue({});

            await controller.updateProducto(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockImagenService.uploadToCloudinary).toHaveBeenCalledTimes(2);
            expect(mockProductoService.update).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    imagenes: [
                        "https://cloudinary.com/img1.jpg",
                        "https://cloudinary.com/img2.jpg",
                    ],
                })
            );
        });

        it("debería manejar error en la actualización", async () => {
            mockRequest.params = { id: "1" };
            mockRequest.body = validDto;

            const error = new Error("Error al actualizar");
            mockProductoService.update.mockRejectedValue(error);

            await controller.updateProducto(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Error al actualizar" })
            );
        });

        it("debería manejar error en la subida de imagen", async () => {
            mockRequest.params = { id: "1" };
            mockRequest.body = validDto;
            mockRequest.files = {
                icono: [
                    {
                        buffer: Buffer.from("icono"),
                        fieldname: "icono",
                        originalname: "icono.jpg",
                    } as Express.Multer.File,
                ],
            } as any;

            const error = new Error("Error subiendo imagen");
            mockImagenService.uploadToCloudinary.mockRejectedValue(error);

            await controller.updateProducto(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Error subiendo imagen" })
            );
            expect(mockProductoService.update).not.toHaveBeenCalled();
        });
    });

    describe("deleteProducto", () => {
        it("debería eliminar producto exitosamente", async () => {
            mockRequest.params = { id: "1" };
            mockProductoService.delete.mockResolvedValue({});

            await controller.deleteProducto(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockProductoService.delete).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Product deleted successfully",
                deleted: {}
            });
        });

        it("debería manejar error en la eliminación", async () => {
            mockRequest.params = { id: "1" };
            const error = new Error("Producto no encontrado");
            mockProductoService.delete.mockRejectedValue(error);

            await controller.deleteProducto(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Producto no encontrado" })
            );
        });
    });

    describe("duplicateProducto", () => {
        it("debería duplicar producto exitosamente", async () => {
            mockRequest.params = { id: "1" };
            mockProductoService.duplicarProducto.mockResolvedValue({});

            await controller.duplicateProducto(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockProductoService.duplicarProducto).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Product duplicated successfully",
            });
        });

        it("debería manejar error en la duplicación", async () => {
            mockRequest.params = { id: "1" };
            const error = new Error("Error al duplicar");
            mockProductoService.duplicarProducto.mockRejectedValue(error);

            await controller.duplicateProducto(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Error al duplicar" })
            );
        });
    });
});