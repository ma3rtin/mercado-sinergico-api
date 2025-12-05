import { PaquetePublicadoDTO } from '../../dtos/paquetePublicado.dto';
import { PaquetePublicadoUpdateDTO } from '../../dtos/paquetePublicadoUpdate.dto';
import { PaquetePublicado } from '@prisma/client';
import { IBaseRepository } from './IBaseRepository';

export interface IPaquetePublicadoRepository extends IBaseRepository<PaquetePublicado> {
    getPorCerrarse(): Promise<PaquetePublicado[]>;
    // Override methods if DTOs are different from generic Partial<T>
    create(data: PaquetePublicadoDTO): Promise<PaquetePublicado>;
    update(id: number, data: PaquetePublicadoUpdateDTO): Promise<PaquetePublicado>;
}
