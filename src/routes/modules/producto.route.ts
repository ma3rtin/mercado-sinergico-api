import { Router } from 'express';
import { ProductoController } from '../../controllers/producto.controller';
import { ProductoService } from '../../services/producto.service';
import { validarDto } from '../../middlewares/validateDTO.middleware';
import { ProductoDTO } from '../../dtos/producto/producto.dto';
import { procesarSubidaImagen } from '../../middlewares/uploadFiles.middleware';
import { ImagenService } from '../../services/imagen.service';

import { ProductoRepository } from '../../repositories/producto.repository';
import { PaquetePublicadoRepository } from '../../repositories/paquetePublicado.repository';
import { CategoriaRepository } from '../../repositories/categoria.repository';

const productoRepository = new ProductoRepository();
const paquetePublicadoRepository = new PaquetePublicadoRepository();
const categoriaRepository = new CategoriaRepository();

const productoService = new ProductoService(
  productoRepository,
  paquetePublicadoRepository,
  categoriaRepository
);
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
