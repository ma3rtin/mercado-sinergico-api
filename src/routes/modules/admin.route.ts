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
import { ProductoRepository } from '../../repositories/producto.repository';
import { PaquetePublicadoRepository } from '../../repositories/paquetePublicado.repository';
import { CategoriaRepository } from '../../repositories/categoria.repository';
import { PaqueteBaseRepository } from '../../repositories/paqueteBase.repository';

const router = Router();

const productoRepository = new ProductoRepository();
const paquetePublicadoRepository = new PaquetePublicadoRepository();
const categoriaRepository = new CategoriaRepository();
const paqueteBaseRepository = new PaqueteBaseRepository();

const productoService = new ProductoService(
    productoRepository,
    paquetePublicadoRepository,
    categoriaRepository
);
const paqueteService = new PaqueteBaseService(
    paqueteBaseRepository,
    categoriaRepository
);

const adminController = new AdminController(productoService, paqueteService);

router.get('/productos', rolMiddleware(['admin']), adminController.obtenerProductos.bind(adminController));

router.get('/productos/:id', rolMiddleware(['admin']), adminController.obtenerProductoPorId.bind(adminController));

router.post('/productos', rolMiddleware(['admin']), validarDto(ProductoDTO), adminController.crearProducto.bind(adminController));

router.post('/paquetes', rolMiddleware(['admin']), validarDto(PaqueteBaseDTO), adminController.crearPaquete.bind(adminController));

router.post('/paquetes/:id/productos', rolMiddleware(['admin']), validarDto(AgregarProductoPaqueteDTO), adminController.agregarProductoAPaquete.bind(adminController));

router.put('/productos/:id', rolMiddleware(['admin']), validarDto(ProductoDTO), adminController.actualizarProducto.bind(adminController));

router.delete('/productos/:id', rolMiddleware(['admin']), adminController.eliminarProducto.bind(adminController));

export default router;
