import { Router } from 'express';
import { PlantillaController } from '../../controllers/plantilla.controller.js';
import { PlantillaDTO } from '../../dtos/plantilla/plantilla.dto.js';
import { validarDto } from '../../middlewares/validateDTO.middleware.js';
import { PlantillaService } from '../../services/plantilla.service.js';
import { authMiddleware, rolMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();
//Plantillas
const plantillaService = new PlantillaService();
const plantillaController = new PlantillaController(plantillaService);

const soloAdmin = [authMiddleware, rolMiddleware(['Administrador'])];

router.get('/', plantillaController.getPlantillas.bind(plantillaController));
router.get('/:id', plantillaController.getPlantillaById.bind(plantillaController));
router.post('/', ...soloAdmin, validarDto(PlantillaDTO), plantillaController.crearPlantilla.bind(plantillaController));
router.put('/:id', ...soloAdmin, validarDto(PlantillaDTO), plantillaController.actualizarPlantilla.bind(plantillaController));
router.delete('/:id', ...soloAdmin, plantillaController.eliminarPlantilla.bind(plantillaController));

export { router as plantillaRouter };