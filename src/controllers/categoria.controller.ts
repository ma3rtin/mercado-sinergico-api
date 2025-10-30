import { CategoriaService } from '../services/categoria.service';
import { Request, Response } from 'express';
import { CustomError } from '../errors/custom.error';

export class CategoriaController {
    constructor(private service: CategoriaService) {}

    public async getAll(req: Request, res: Response) {
        try {
            const categorias = await this.service.getAll();
            res.status(200).json(categorias);
        } catch (error) {
            console.error('Error obteniendo categorias:', error);
            res.status(500).send(new CustomError('Error al traer las categorias', 500));
        }
    }

    public async getById(req: Request, res: Response) {
        try {
            const id: number = parseInt(req.params.id, 10);
            const categoria = await this.service.getById(id);

            if (!categoria) {
                res.status(404).send(new CustomError('Categoria no encontrada', 404));
            } else {
                res.status(200).json(categoria);
            }
        } catch (error) {
            console.error('Error obteniendo categoria por ID:', error);
            res.status(500).send(new CustomError('Error al traer la categoria', 500));
        }
    }

    public async create(req: Request, res: Response) {
        try {
            const { nombre } = req.body;
            if (!nombre) {
                return res.status(400).send(new CustomError('El nombre es requerido', 400));
            }
            const newCategoria = await this.service.create(nombre);
            res.status(201).json(newCategoria);
        } catch (error) {
            console.error('Error creando categoria:', error);
            res.status(500).send(new CustomError('Error al crear la categoria', 500));
        }
    }
}
