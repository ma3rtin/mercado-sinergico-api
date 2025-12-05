export interface IBaseRepository<T> {
    getAll(): Promise<T[]>;
    getById(id: number): Promise<T | null>;
    create(data: any): Promise<T>;
    update(id: number, data: any): Promise<T>;
    delete(id: number): Promise<T>;
}