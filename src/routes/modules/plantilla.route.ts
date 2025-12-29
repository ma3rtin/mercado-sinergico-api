import { Router } from 'express';
import { PlantillaController } from '../../controllers/ControladoresPlantilla/plantilla.controller';
import { PlantillaDTO } from '../../dtos/plantilla/plantilla.dto';
import { validarDto } from '../../middlewares/validateDTO.middleware';
import { PlantillaService } from '../../services/plantilla.service';
import { PlantillaRepository } from '../../repositories/plantilla.repository';
import { ProductoRepository } from '../../repositories/producto.repository';


const router = Router();
//Repositories
const plantillaRepository = new PlantillaRepository();
const productoRepository = new ProductoRepository();

//Plantillas
const plantillaService = new PlantillaService(plantillaRepository, productoRepository);
const plantillaController = new PlantillaController(plantillaService);

router.get('/', plantillaController.getPlantillas.bind(plantillaController));
router.get('/:id', plantillaController.getPlantillaById.bind(plantillaController));
router.post('/', validarDto(PlantillaDTO), plantillaController.crearPlantilla.bind(plantillaController));
router.put('/:id', plantillaController.actualizarPlantilla.bind(plantillaController));
router.delete('/:id', plantillaController.eliminarPlantilla.bind(plantillaController));


export { router as plantillaRouter };