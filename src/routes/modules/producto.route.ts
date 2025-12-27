import { Router } from 'express';
import { ProductoController } from '../../controllers/producto.controller.js';
import { ProductoService } from '../../services/producto.service.js';
import { validarDto } from '../../middlewares/validateDTO.middleware.js';
import { ProductoDTO } from '../../dtos/producto/producto.dto.js';
import { procesarSubidaImagen } from '../../middlewares/uploadFiles.middleware.js';
import { ImagenService } from '../../services/imagen.service.js';

const productoService = new ProductoService();
const imagenService = new ImagenService();
const productoController = new ProductoController(
  productoService,
  imagenService
);

const router = Router();
router.get('/filtrados', productoController.getProductosFiltrados.bind(productoController));
router.get('/', productoController.getProductos.bind(productoController));
router.get('/:id', productoController.getProductoById.bind(productoController));
router.post(
  '/',
  procesarSubidaImagen([
    { name: 'icono', maxCount: 1 },
    { name: 'imagenes', maxCount: 5 },
  ]),
  validarDto(ProductoDTO),
  productoController.createProducto.bind(productoController)
);
router.put(
  '/:id',
  procesarSubidaImagen([
    { name: 'icono', maxCount: 1 },
    { name: 'imagenes', maxCount: 5 },
  ]),
  validarDto(ProductoDTO),
  productoController.updateProducto.bind(productoController)
);
router.delete(
  '/:id',
  productoController.deleteProducto.bind(productoController)
);
router.post(
  '/:id/duplicate',
  productoController.duplicateProducto.bind(productoController)
);

export default router;
