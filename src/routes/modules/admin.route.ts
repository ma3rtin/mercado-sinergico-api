import { Router } from 'express';
import { prisma } from '../../prisma/client';
import { rolMiddleware } from '../../middlewares/auth.middleware';
import { validarDto } from '../../middlewares/validateDTO.middleware';
import { PaqueteBaseDTO } from '../../dtos/paquete/paqueteBase.dto';
import { ProductoService } from '../../services/producto.service';
import { PaqueteBaseService } from '../../services/paqueteBase.service';
import { AdminController } from '../../controllers/admin.controller';
import { ProductoDTO } from '../../dtos/producto/producto.dto';
import { AgregarProductoPaqueteDTO } from '../../dtos/producto/agregarProductoPaquete.dto';

const router = Router();
import { PrismaProductoRepository, PrismaCategoriaRepository, PrismaMarcaRepository } from '../../repositories/prisma/PrismaCatalogRepository';
import { PrismaPaquetePublicadoRepository } from '../../repositories/prisma/PrismaPaquetePublicadoRepository';

const productoRepository = new PrismaProductoRepository();
const categoriaRepository = new PrismaCategoriaRepository();
const marcaRepository = new PrismaMarcaRepository();
const paqueteRepository = new PrismaPaquetePublicadoRepository();

import { PrismaPaqueteBaseRepository } from '../../repositories/prisma/PrismaBundleRepository';

const productoService = new ProductoService(
    productoRepository,
    categoriaRepository,
    marcaRepository,
    paqueteRepository
);
const paqueteBaseRepository = new PrismaPaqueteBaseRepository();
const paqueteService = new PaqueteBaseService(paqueteBaseRepository);
const adminController = new AdminController(productoService, paqueteService);

router.get('/productos', rolMiddleware(['admin']), adminController.obtenerProductos.bind(adminController));

router.get('/productos/:id', rolMiddleware(['admin']), adminController.obtenerProductoPorId.bind(adminController));

router.post('/productos', rolMiddleware(['admin']), validarDto(ProductoDTO), adminController.crearProducto.bind(adminController));

router.post('/paquetes', rolMiddleware(['admin']), validarDto(PaqueteBaseDTO), adminController.crearPaquete.bind(adminController));

router.post('/paquetes/:id/productos', rolMiddleware(['admin']), validarDto(AgregarProductoPaqueteDTO), adminController.agregarProductoAPaquete.bind(adminController));

router.put('/productos/:id', rolMiddleware(['admin']), validarDto(ProductoDTO), adminController.actualizarProducto.bind(adminController));

router.delete('/productos/:id', rolMiddleware(['admin']), adminController.eliminarProducto.bind(adminController));

export default router;
