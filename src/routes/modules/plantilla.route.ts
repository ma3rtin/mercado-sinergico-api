import { Router } from 'express';
import { PlantillaController } from '../../controllers/ControladoresPlantilla/plantilla.controller';
import { PlantillaDTO } from '../../dtos/dtos-plantilla/plantilla.dto';
import { validarDto } from '../../middlewares/validateDTO.middleware';
import { PlantillaService } from '../../services/plantilla.service';



const router = Router();
//Plantillas
const plantillaService = new PlantillaService();
const plantillaController = new PlantillaController(plantillaService);

router.get('/', plantillaController.getPlantillas.bind(plantillaController));
router.get('/:id', plantillaController.getPlantillaById.bind(plantillaController));
router.post('/', validarDto(PlantillaDTO), plantillaController.crearPlantilla.bind(plantillaController));
router.put('/:id', plantillaController.actualizarPlantilla.bind(plantillaController));
router.delete('/:id', plantillaController.eliminarPlantilla.bind(plantillaController));


export { router as plantillaRouter };