import { Router } from 'express';
import { PlantillaController } from '../../controllers/plantilla.controller.js';
import { PlantillaDTO } from '../../dtos/plantilla/plantilla.dto.js';
import { validarDto } from '../../middlewares/validateDTO.middleware.js';
import { PlantillaService } from '../../services/plantilla.service.js';



const router = Router();
//Plantillas
const plantillaService = new PlantillaService();
const plantillaController = new PlantillaController(plantillaService);

router.get('/', plantillaController.getPlantillas.bind(plantillaController));
router.get('/:id', plantillaController.getPlantillaById.bind(plantillaController));
router.post('/', validarDto(PlantillaDTO), plantillaController.crearPlantilla.bind(plantillaController));
router.put('/:id', validarDto(PlantillaDTO), plantillaController.actualizarPlantilla.bind(plantillaController));
router.delete('/:id', plantillaController.eliminarPlantilla.bind(plantillaController));


export { router as plantillaRouter };