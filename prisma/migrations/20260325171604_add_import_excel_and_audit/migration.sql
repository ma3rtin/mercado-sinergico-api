-- CreateTable
CREATE TABLE `ImportacionExcel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombreArchivo` VARCHAR(191) NOT NULL,
    `hashArchivo` VARCHAR(191) NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'PENDIENTE',
    `progreso` INTEGER NOT NULL DEFAULT 0,
    `totalFilas` INTEGER NOT NULL DEFAULT 0,
    `procesadas` INTEGER NOT NULL DEFAULT 0,
    `errores` JSON NULL,
    `resultado` JSON NULL,
    `duracionMs` INTEGER NULL,
    `filasPorSegundo` DOUBLE NULL,
    `errorFatal` TEXT NULL,
    `usuarioId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ImportacionExcel_estado_idx`(`estado`),
    INDEX `ImportacionExcel_hashArchivo_idx`(`hashArchivo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditoriaProducto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productoId` INTEGER NOT NULL,
    `accion` VARCHAR(191) NOT NULL,
    `campo` VARCHAR(191) NULL,
    `valorAnterior` TEXT NULL,
    `valorNuevo` TEXT NULL,
    `motivo` VARCHAR(191) NOT NULL DEFAULT 'IMPORTACION_EXCEL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditoriaProducto_productoId_idx`(`productoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ImportacionExcel` ADD CONSTRAINT `ImportacionExcel_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditoriaProducto` ADD CONSTRAINT `AuditoriaProducto_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `Producto`(`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE;
