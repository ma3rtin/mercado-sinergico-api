import { PrismaClient } from '@prisma/client';

export class CategoriaService {
    private client = new PrismaClient();

    public async getAll() {
        try {
            const categorias = await this.client.categoria.findMany();
            return categorias;
        } catch (error) {
            throw error;
        }
    }

    public async getById(id: number) {
        try {
            const categoria = await this.client.categoria.findUnique({
                where: { id_categoria: id },
            });
            return categoria;
        } catch (error) {
            throw error;
        }
    }

    public async create(categoria: string) {
        try {
            const nuevaCategoria = await this.client.categoria.create({ data: {nombre: categoria} });
            return nuevaCategoria;
        } catch (error) {
            throw error;
        }
    }
}
