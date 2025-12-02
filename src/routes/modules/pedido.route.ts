import { Router } from "express";
import { PedidoController } from "../../controllers/pedido.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validarDto } from "../../middlewares/validateDTO.middleware";
import { SumarseDTO } from "../../dtos/pedido/sumarse.dto";

const router = Router();
const controller = new PedidoController();

router.post("/:paqueteId", authMiddleware, validarDto(SumarseDTO), controller.crearPedido);
router.get("/mis-paquetes", authMiddleware, controller.getAll);
router.get("/:id", authMiddleware, controller.getById);
router.get("/bajarse/:paqueteId", authMiddleware, controller.bajarse);

export default router;
