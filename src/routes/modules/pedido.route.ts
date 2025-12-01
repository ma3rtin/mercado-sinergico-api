import { Router } from "express";
import { PedidoController } from "../../controllers/pedido.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validarDto } from "../../middlewares/validateDTO.middleware";
import { SumarseDTO } from "../../dtos/pedido/sumarse.dto";

const router = Router();
const controller = new PedidoController();

router.post("/:paqueteId", authMiddleware, validarDto(SumarseDTO), controller.crearPedido);
router.get("/", authMiddleware, controller.getAll);
router.get("/:id", authMiddleware, controller.getById);

export default router;
