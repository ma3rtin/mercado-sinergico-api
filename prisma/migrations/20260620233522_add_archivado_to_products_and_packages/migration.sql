-- AlterTable
ALTER TABLE `direccion` ADD COLUMN `observaciones` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `paquetebase` ADD COLUMN `archivado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `tipo` ENUM('SINERGICO', 'ENERGICO') NOT NULL DEFAULT 'SINERGICO';

-- AlterTable
ALTER TABLE `paquetepublicado` ADD COLUMN `archivado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `nombre` VARCHAR(191) NULL,
    MODIFY `tipo` ENUM('SINERGICO', 'ENERGICO') NOT NULL DEFAULT 'SINERGICO';

-- Backfill names from PaqueteBase
UPDATE `paquetepublicado` pp JOIN `paquetebase` pb ON pp.`paqueteBaseId` = pb.`id_paquete_base` SET pp.`nombre` = pb.`nombre`;

-- Fallback for safety
UPDATE `paquetepublicado` SET `nombre` = 'Sin nombre' WHERE `nombre` IS NULL;

-- AlterTable
ALTER TABLE `paquetepublicado` MODIFY COLUMN `nombre` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `pedido` ADD COLUMN `paymentId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `producto` ADD COLUMN `archivado` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `tipo` ENUM('SINERGICO', 'ENERGICO') NULL DEFAULT 'SINERGICO';
