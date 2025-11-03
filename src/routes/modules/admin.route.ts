import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { rolMiddleware } from '../../middlewares/auth.middleware';
import { validarDto } from '../../middlewares/validateDTO.middleware';
import { PaqueteBaseDTO } from '../../dtos/paqueteBase.dto';
import { ProductoService } from '../../services/producto.service';
import { PaqueteBaseService } from '../../services/paqueteBase.service';
import { AdminController } from '../../controllers/admin.controller';
import { ProductoDTO } from '../../dtos/producto.dto';
import { AgregarProductoPaqueteDTO } from '../../dtos/agregarProductoPaquete.dto';

const prisma = new PrismaClient();
const router = Router();
const productoService = new ProductoService();
const paqueteService = new PaqueteBaseService();
const adminController = new AdminController(productoService, paqueteService);

router.get('/productos', rolMiddleware(['admin']), adminController.obtenerProductos.bind(adminController));

router.get('/productos/:id', rolMiddleware(['admin']), adminController.obtenerProductoPorId.bind(adminController));

router.post('/productos', rolMiddleware(['admin']), validarDto(ProductoDTO), adminController.crearProducto.bind(adminController));

router.post('/paquetes', rolMiddleware(['admin']), validarDto(PaqueteBaseDTO), adminController.crearPaquete.bind(adminController));

router.post( '/paquetes/:id/productos', rolMiddleware(['admin']), validarDto(AgregarProductoPaqueteDTO), adminController.agregarProductoAPaquete.bind(adminController));

router.put('/productos/:id', rolMiddleware(['admin']), validarDto(ProductoDTO), adminController.actualizarProducto.bind(adminController));

router.delete('/productos/:id', rolMiddleware(['admin']), adminController.eliminarProducto.bind(adminController));

export default router;
