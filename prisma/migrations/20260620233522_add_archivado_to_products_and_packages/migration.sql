-- AlterTable
-- ALTER TABLE `Direccion` ADD COLUMN `observaciones` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `PaqueteBase` ADD COLUMN `archivado` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `PaquetePublicado` ADD COLUMN `archivado` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `tipo` ENUM('SINERGICO', 'ENERGICO') NOT NULL DEFAULT 'SINERGICO';

-- Backfill names from PaqueteBase
-- UPDATE `PaquetePublicado` pp JOIN `PaqueteBase` pb ON pp.`paqueteBaseId` = pb.`id_paquete_base` SET pp.`nombre` = pb.`nombre`;

-- Fallback for safety
-- UPDATE `PaquetePublicado` SET `nombre` = 'Sin nombre' WHERE `nombre` IS NULL;

-- AlterTable
-- ALTER TABLE `PaquetePublicado` MODIFY COLUMN `nombre` VARCHAR(191) NOT NULL;

-- AlterTable
-- ALTER TABLE `Pedido` ADD COLUMN `paymentId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Producto` ADD COLUMN `archivado` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `tipo` ENUM('SINERGICO', 'ENERGICO') NULL DEFAULT 'SINERGICO';
