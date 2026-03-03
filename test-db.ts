import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.paquetePublicado.findMany({ where: { estado: { nombre: 'Cerrado' } }, include: { pedidos: { include: { detalles: true } } } });
  console.log(JSON.stringify(p, null, 2));
}
main();
