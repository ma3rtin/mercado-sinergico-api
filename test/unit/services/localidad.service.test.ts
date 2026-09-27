import { readFileSync } from 'node:fs';
import { LocalidadService } from '../../../src/services/localidad.service';
import { LOCALIDADES } from '../../../src/config/localidades';
import { prisma } from '../../../src/prisma/client';

jest.mock('../../../src/prisma/client', () => ({
  prisma: { localidad: { findMany: jest.fn().mockResolvedValue([]) } },
}));

it('ofrece únicamente localidades vigentes ordenadas por nombre', async () => {
  await new LocalidadService().getAll();
  expect(prisma.localidad.findMany).toHaveBeenCalledWith({
    where: { activa: true }, orderBy: { nombre: 'asc' },
  });
});

it('la migración y el catálogo contienen las mismas 47 entradas sin duplicados', () => {
  const sql = readFileSync('prisma/migrations/20260927000000_localidades_y_paquetes_sin_zona/migration.sql', 'utf8');
  const nombres = [...sql.matchAll(/^\('([^']+)'\)/gm)].map(match => match[1]);
  expect(new Set(LOCALIDADES).size).toBe(47);
  expect(nombres).toEqual([...LOCALIDADES]);
  expect(LOCALIDADES).toEqual(expect.arrayContaining(['Vicente López', 'Ensenada', 'La Matanza Norte', 'La Matanza Sur']));
});
