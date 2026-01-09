import { Router } from "express";
import { ProductoController } from "../../controllers/producto.controller.js";
import { ProductoService } from "../../services/producto.service.js";
import { VarianteService } from "../../services/variante.service.js";
import { validarDto } from "../../middlewares/validateDTO.middleware.js";
import { ProductoDTO } from "../../dtos/producto/producto.dto.js";
import { procesarSubidaImagen } from "../../middlewares/uploadFiles.middleware.js";
import { ImagenService } from "../../services/imagen.service.js";
import { GenerarVariantesDTO } from "../../dtos/variante/generarVariantes.dto.js";
import { ActualizarStockVariantesDTO } from "../../dtos/variante/actualizarStockVariantes.dto.js";
import { VarianteDTO } from "../../dtos/variante/variante.dto.js";
import { VarianteController } from "../../controllers/variante.controller.js";

const productoService = new ProductoService();
const varianteService = new VarianteService();
const imagenService = new ImagenService();

const productoController = new ProductoController(
  productoService,
  imagenService
);
const varianteController = new VarianteController(varianteService);

const router = Router();

router.get(
  "/filtrados",
  productoController.getProductosFiltrados.bind(productoController)
);

router.get("/", productoController.getProductos.bind(productoController));

router.get("/:id", productoController.getProductoById.bind(productoController));

router.post(
  "/",
  procesarSubidaImagen([
    { name: "icono", maxCount: 1 },
    { name: "imagenes", maxCount: 5 },
  ]),
  validarDto(ProductoDTO),
  productoController.createProducto.bind(productoController)
);

router.put(
  "/:id",
  procesarSubidaImagen([
    { name: "icono", maxCount: 1 },
    { name: "imagenes", maxCount: 5 },
  ]),
  validarDto(ProductoDTO),
  productoController.updateProducto.bind(productoController)
);

router.delete(
  "/:id",
  productoController.deleteProducto.bind(productoController)
);

router.post(
  "/:id/duplicate",
  productoController.duplicateProducto.bind(productoController)
);

router.get(
  "/:id/variantes",
  varianteController.getVariantesByProducto.bind(varianteController)
);

router.post(
  "/:id/generar-variantes",
  validarDto(GenerarVariantesDTO),
  varianteController.generarVariantes.bind(varianteController)
);

router.patch(
  "/:id/variantes/stock",
  validarDto(ActualizarStockVariantesDTO),
  varianteController.actualizarStockBulk.bind(varianteController)
);

router.get(
  "/:id/stock",
  varianteController.getStockGlobal.bind(varianteController)
);

router.patch(
  "/variantes/:id",
  validarDto(VarianteDTO),
  varianteController.actualizarVariante.bind(varianteController)
);

router.delete(
  "/variantes/:id",
  varianteController.eliminarVariante.bind(varianteController)
);

export default router;
