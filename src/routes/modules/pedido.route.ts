import { Router } from "express";
import { PedidoController } from "../../controllers/pedido.controller";

const router = Router();
const controller = new PedidoController();

router.post("/", controller.crearPedido);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);

export default router;