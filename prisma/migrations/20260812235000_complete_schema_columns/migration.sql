ALTER TABLE `PaquetePublicado`
  ADD COLUMN `nombre` VARCHAR(191) NOT NULL AFTER `id_paquete_publicado`;

UPDATE `PaquetePublicado` pp
JOIN `PaqueteBase` pb ON pb.`id_paquete_base` = pp.`paqueteBaseId`
SET pp.`nombre` = pb.`nombre`;

ALTER TABLE `Direccion`
  ADD COLUMN `observaciones` VARCHAR(191) NULL;

ALTER TABLE `Pedido`
  ADD COLUMN `paymentId` VARCHAR(191) NULL;
