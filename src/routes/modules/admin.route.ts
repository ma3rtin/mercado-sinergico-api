import { Router } from 'express';
import { rolMiddleware } from '../../middlewares/auth.middleware.js';
import { validarDto } from '../../middlewares/validateDTO.middleware.js';
import { PaqueteBaseDTO } from '../../dtos/paquete/paqueteBase.dto.js';
import { ProductoService } from '../../services/producto.service.js';
import { PaqueteBaseService } from '../../services/paqueteBase.service.js';
import { AdminController } from '../../controllers/admin.controller.js';
import { ProductoDTO } from '../../dtos/producto/producto.dto.js';
import { AgregarProductoPaqueteDTO } from '../../dtos/producto/agregarProductoPaquete.dto.js';

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
