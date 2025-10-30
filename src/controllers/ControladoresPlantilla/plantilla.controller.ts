import { Request, Response } from 'express';
import { PlantillaService } from '../../services/plantilla.service';
import { PlantillaDTO } from '../../dtos/dtos-plantilla/plantilla.dto';
import { CustomError } from '../../errors/custom.error';

export class PlantillaController {

    constructor(private plantillaService: PlantillaService) { }

    public async getPlantillas(req: Request, res: Response) {
        try {
            const plantillas = await this.plantillaService.obtenerPlantillas();
            res.status(200).json(plantillas);
        } catch (error) {
            console.error('Error obteniendo plantillas:', error);
            res.status(500).send(new CustomError('Error al traer las plantillas', 500));
        }
    }

    public async crearPlantilla(req: Request, res: Response) {
        try {
            // El DTO ya está validado por el middleware
            const dto: PlantillaDTO = req.body;
            
            const nuevaPlantilla = await this.plantillaService.crearPlantilla(dto);
            res.status(201).json(nuevaPlantilla);
        } catch (error) {
            console.error('Error creando plantilla:', error);
            
            if (error instanceof Error) {
                // Manejar errores de duplicados (más específico)
                if (error.message.includes('unique') || error.message.includes('duplicate')) {
                    return res.status(409).json({ message: 'Ya existe una plantilla con ese nombre' });
                }
                
                // Otros errores de constraints (más genérico)
                if (error.message.includes('constraint')) {
                    return res.status(409).json({ message: 'Conflicto de integridad de datos' });
                }
            }
            
            res.status(500).send(new CustomError('Error al crear la plantilla', 500));
        }
    }

    public async asignarPlantillaAProducto(req: Request, res: Response) {
        try {
            const productoId: number = parseInt(req.params.productoId, 10);
            const plantillaId: number = parseInt(req.params.plantillaId, 10);
            
            // Validar IDs de parámetros (esto SÍ es necesario porque no pasan por DTO)
            if (isNaN(productoId) || productoId <= 0) {
                return res.status(400).json({ message: 'ID de producto inválido' });
            }
            
            if (isNaN(plantillaId) || plantillaId <= 0) {
                return res.status(400).json({ message: 'ID de plantilla inválido' });
            }

            const productoActualizado = await this.plantillaService.asignarPlantillaAProducto(plantillaId, productoId);
            res.status(200).json(productoActualizado);
        } catch (error) {
            console.error('Error asignando plantilla a producto:', error);
            
            if (error instanceof Error) {
                // Manejar errores de foreign key o registros no encontrados
                if (error.message.includes('foreign key') || error.message.includes('not found')) {
                    return res.status(404).json({ message: 'Producto o plantilla no encontrada' });
                }
                
                if (error.message.includes('constraint')) {
                    return res.status(409).json({ message: 'Conflicto de integridad de datos' });
                }
            }
            
            res.status(500).send(new CustomError('Error al asignar la plantilla al producto', 500));
        }
    }

    public async actualizarPlantilla(req: Request, res: Response) {
        try {
            const id: number = parseInt(req.params.id, 10);
            
            // Validar ID de parámetro (esto SÍ es necesario)
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({ message: 'ID de plantilla inválido' });
            }

            // El DTO ya está validado por el middleware
            const dto: PlantillaDTO = req.body;

            const plantillaActualizada = await this.plantillaService.actualizarPlantilla(id, dto);

            if (!plantillaActualizada) {
                return res.status(404).json({ message: 'Plantilla no encontrada' });
            }

            res.status(200).json(plantillaActualizada);
        } catch (error) {
            console.error('Error actualizando plantilla:', error);
            
            if (error instanceof Error) {
                // Errores de duplicados (más específico primero)
                if (error.message.includes('unique') || error.message.includes('duplicate')) {
                    return res.status(409).json({ message: 'Ya existe una plantilla con ese nombre' });
                }
                
                // Errores de plantilla no encontrada en el service
                if (error.message.includes('not found') || error.message.includes('no encontrada')) {
                    return res.status(404).json({ message: 'Plantilla no encontrada' });
                }

                // Errores de constraint/foreign key (más genérico)
                if (error.message.includes('foreign key') || error.message.includes('constraint')) {
                    return res.status(409).json({ message: 'Conflicto de integridad de datos' });
                }
            }
            
            res.status(500).send(new CustomError('Error al actualizar la plantilla', 500));
        }
    }

    public async eliminarPlantilla(req: Request, res: Response) {
        try {
            const id: number = parseInt(req.params.id, 10);
            
            // Validar ID de parámetro (esto SÍ es necesario)
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({ message: 'ID de plantilla inválido' });
            }

            await this.plantillaService.eliminarPlantilla(id);
            res.status(204).send();
        } catch (error) {
            console.error('Error eliminando plantilla:', error);
            
            if (error instanceof Error) {
                // Manejar casos donde la plantilla no existe
                if (error.message.includes('not found') || error.message.includes('no encontrada')) {
                    return res.status(404).json({ message: 'Plantilla no encontrada' });
                }
                
                // Manejar casos donde hay productos asociados
                if (error.message.includes('foreign key') || error.message.includes('constraint')) {
                    return res.status(409).json({ message: 'No se puede eliminar la plantilla porque tiene productos asociados' });
                }
            }
            
            res.status(500).send(new CustomError('Error al eliminar la plantilla', 500));
        }
    }

    public async getPlantillaById(req: Request, res: Response) {
        try {
            const id: number = parseInt(req.params.id, 10);
            
            // Validar ID de parámetro (esto SÍ es necesario)
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({ message: 'ID de plantilla inválido' });
            }

            const plantilla = await this.plantillaService.getPlantillaById(id);
            
            if (!plantilla) {
                return res.status(404).json({ message: 'Plantilla no encontrada' });
            }
            
            res.status(200).json(plantilla);
        } catch (error) {
            console.error('Error obteniendo plantilla por ID:', error);
            res.status(500).send(new CustomError('Error al traer la plantilla', 500));
        }
    }
}