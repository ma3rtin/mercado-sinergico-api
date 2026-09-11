-- Los usuarios existentes se consideran verificados para evitar bloquear sesiones
-- al desplegar esta funcionalidad. Las nuevas cuentas requieren activación.
ALTER TABLE `Usuario` ADD COLUMN `emailVerificadoEn` DATETIME(3) NULL;

UPDATE `Usuario`
SET `emailVerificadoEn` = `createdAt`
WHERE `emailVerificadoEn` IS NULL;

CREATE TABLE `TokenVerificacionEmail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiraEn` DATETIME(3) NOT NULL,
    `usadoEn` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TokenVerificacionEmail_tokenHash_key`(`tokenHash`),
    INDEX `TokenVerificacionEmail_usuarioId_idx`(`usuarioId`),
    INDEX `TokenVerificacionEmail_expiraEn_idx`(`expiraEn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `TokenVerificacionEmail`
  ADD CONSTRAINT `TokenVerificacionEmail_usuarioId_fkey`
  FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
