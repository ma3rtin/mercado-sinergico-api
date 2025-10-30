import { MarcaService } from '../services/marca.service';
import { Request, Response } from 'express';
import { CustomError } from '../errors/custom.error';

export class MarcaController {
    constructor(private service: MarcaService) {}

    public async getAll(req: Request, res: Response) {
        try {
            const marcas = await this.service.getAll();
            res.status(200).json(marcas);
        } catch (error) {
            console.error('Error obteniendo marcas:', error);
            res.status(500).send(new CustomError('Error al traer las marcas', 500));
        }
    }

    public async getById(req: Request, res: Response) {
        try {
            const id: number = parseInt(req.params.id, 10);
            const marca = await this.service.getById(id);

            if (!marca) {
                res.status(404).send(new CustomError('Marca no encontrada', 404));
            } else {
                res.status(200).json(marca);
            }
        } catch (error) {
            console.error('Error obteniendo marca por ID:', error);
            res.status(500).send(new CustomError('Error al traer la marca', 500));
        }
    }

    public async create(req: Request, res: Response) {
        try {
            const { nombre } = req.body;
            if (!nombre) {
                return res.status(400).send(new CustomError('El nombre es requerido', 400));
            }
            const newMarca = await this.service.create(nombre);
            res.status(201).json(newMarca);
        } catch (error) {
            console.error('Error creando marca:', error);
            res.status(500).send(new CustomError('Error al crear la marca', 500));
        }
    }
}
