import { PaqueteController } from "../../src/controllers/paqueteBase.controller"; 
import { PaqueteBaseService } from "../../src/services/paqueteBase.service"; 
import { ImagenService } from "../../src/services/imagen.service";

describe("PaqueteController", () => {
  let service: PaqueteBaseService;
  let controller: PaqueteController;
  let imagenService: ImagenService;
  let req: any;
  let res: any;

  beforeEach(() => {
    service = {
      create: jest.fn().mockResolvedValue({ id_paquete_base: 1, nombre: "Test" }),
      getAll: jest.fn().mockResolvedValue([{ id_paquete_base: 1, nombre: "Test" }]),
      getById: jest.fn().mockResolvedValue({ id_paquete_base: 1, nombre: "Test" }),
      update: jest.fn().mockResolvedValue({ id_paquete_base: 1, nombre: "Test Updated" }),
      delete: jest.fn().mockResolvedValue({ id_paquete_base: 1, nombre: "Test" }),
      agregarProductos: jest.fn().mockResolvedValue({ id_paquete_base: 1, nombre: "Test" }),
    } as any;
    
    imagenService = {
      uploadToCloudinary: jest.fn().mockResolvedValue("http://cloudinary.com/image.jpg")
    } as any;
    
    controller = new PaqueteController(service, imagenService);
    
    req = { 
      body: {
        nombre: "Test",
        descripcion: "Desc",
        categoria_id: 1,
        marcaId: 1,
        productos: [1, 2, 3],
      },
      file: {
        buffer: Buffer.from("fake-image-data")
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  // it.skip("deberia crear un paquete y devolver estado 201 con el paquete creado", async () => {
  //   await controller.create(req, res);
    
  //   expect(res.status).toHaveBeenCalledWith(201);
  //   expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id_paquete: 1 }));

  // });
});