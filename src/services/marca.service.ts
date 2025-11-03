import { PrismaClient } from '@prisma/client';

export class MarcaService {
    private client = new PrismaClient();

    public async getAll() {
        try {
            const marcas = await this.client.marca.findMany();
            return marcas;
        } catch (error) {
            throw error;
        }
    }

    public async getById(id: number) {
        try {
            const marca = await this.client.marca.findUnique({
                where: { id_marca: id },
            });
            return marca;
        } catch (error) {
            throw error;
        }
    }

    public async create(marca: string) {
        try {
            const newMarca = await this.client.marca.create({ data: {nombre: marca} });
            return newMarca;
        } catch (error) {
            throw error;
        }
    }
}
