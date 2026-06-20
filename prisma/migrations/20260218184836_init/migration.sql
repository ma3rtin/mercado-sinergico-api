-- CreateTable
CREATE TABLE `Plantilla` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Caracteristica` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `plantillaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Opcion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `caracteristicaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductoVariante` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productoId` INTEGER NOT NULL,
    `sku` VARCHAR(191) NULL,
    `stockFisico` INTEGER NULL,
    `precioExtra` DOUBLE NULL DEFAULT 0,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `imagen_url` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProductoVariante_sku_key`(`sku`),
    INDEX `ProductoVariante_productoId_idx`(`productoId`),
    INDEX `ProductoVariante_activo_idx`(`activo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductoVarianteOpcion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `varianteId` INTEGER NOT NULL,
    `caracteristicaId` INTEGER NOT NULL,
    `opcionId` INTEGER NOT NULL,

    INDEX `ProductoVarianteOpcion_varianteId_idx`(`varianteId`),
    UNIQUE INDEX `ProductoVarianteOpcion_varianteId_caracteristicaId_key`(`varianteId`, `caracteristicaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DisponibilidadVariantePaquete` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `varianteId` INTEGER NOT NULL,
    `paquetePublicadoId` INTEGER NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DisponibilidadVariantePaquete_paquetePublicadoId_idx`(`paquetePublicadoId`),
    INDEX `DisponibilidadVariantePaquete_varianteId_idx`(`varianteId`),
    UNIQUE INDEX `DisponibilidadVariantePaquete_varianteId_paquetePublicadoId_key`(`varianteId`, `paquetePublicadoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `contraseña` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `fecha_nac` DATETIME(3) NULL,
    `imagen_url` VARCHAR(191) NULL,
    `rolId` INTEGER NOT NULL,
    `localidadId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Rol` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Rol_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Direccion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `localidadId` INTEGER NOT NULL,
    `codigo_postal` INTEGER NOT NULL,
    `calle` VARCHAR(191) NOT NULL,
    `numero` INTEGER NOT NULL,
    `piso` INTEGER NULL,
    `departamento` VARCHAR(191) NULL,

    UNIQUE INDEX `Direccion_usuarioId_key`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Localidad` (
    `id_localidad` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `codigo_postal` INTEGER NOT NULL,

    PRIMARY KEY (`id_localidad`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Zona` (
    `id_zona` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Zona_nombre_key`(`nombre`),
    PRIMARY KEY (`id_zona`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LocalidadZona` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `localidadId` INTEGER NOT NULL,
    `zonaId` INTEGER NOT NULL,

    UNIQUE INDEX `LocalidadZona_localidadId_zonaId_key`(`localidadId`, `zonaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Categoria` (
    `id_categoria` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id_categoria`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Marca` (
    `id_marca` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Marca_nombre_key`(`nombre`),
    PRIMARY KEY (`id_marca`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Producto` (
    `id_producto` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `precio` DOUBLE NOT NULL,
    `imagen_url` VARCHAR(191) NULL,
    `marca_id` INTEGER NOT NULL,
    `altura` DOUBLE NULL,
    `ancho` DOUBLE NULL,
    `profundidad` DOUBLE NULL,
    `peso` DOUBLE NULL,
    `stock` INTEGER NULL,
    `tipo` ENUM('SINERGICO', 'ENERGICO', 'POR_DEFINIR') NULL DEFAULT 'POR_DEFINIR',
    `plantillaId` INTEGER NULL,
    `categoria_id` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Producto_plantillaId_idx`(`plantillaId`),
    INDEX `Producto_categoria_id_idx`(`categoria_id`),
    INDEX `Producto_marca_id_idx`(`marca_id`),
    INDEX `Producto_tipo_idx`(`tipo`),
    PRIMARY KEY (`id_producto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductoImagen` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `url` VARCHAR(191) NOT NULL,
    `productoId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaqueteBase` (
    `id_paquete_base` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `imagen_url` VARCHAR(191) NULL,
    `categoria_id` INTEGER NOT NULL,
    `marcaId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_paquete_base`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaqueteBaseProducto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productoId` INTEGER NOT NULL,
    `paqueteBaseId` INTEGER NOT NULL,

    UNIQUE INDEX `PaqueteBaseProducto_productoId_paqueteBaseId_key`(`productoId`, `paqueteBaseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaquetePublicado` (
    `id_paquete_publicado` INTEGER NOT NULL AUTO_INCREMENT,
    `paqueteBaseId` INTEGER NOT NULL,
    `estadoId` INTEGER NOT NULL,
    `zonaId` INTEGER NOT NULL,
    `fecha_inicio` DATETIME(3) NOT NULL,
    `fecha_fin` DATETIME(3) NOT NULL,
    `cant_productos` INTEGER NULL,
    `cant_productos_reservados` INTEGER NOT NULL DEFAULT 0,
    `cant_usuarios_registrados` INTEGER NOT NULL DEFAULT 0,
    `monto_total` DOUBLE NULL,
    `imagen_url` VARCHAR(191) NULL,
    `tipo` ENUM('SINERGICO', 'ENERGICO', 'POR_DEFINIR') NOT NULL DEFAULT 'POR_DEFINIR',
    `descuento` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PaquetePublicado_estadoId_idx`(`estadoId`),
    INDEX `PaquetePublicado_zonaId_idx`(`zonaId`),
    INDEX `PaquetePublicado_tipo_idx`(`tipo`),
    PRIMARY KEY (`id_paquete_publicado`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EstadoPaquetePublicado` (
    `id_estado` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `EstadoPaquetePublicado_nombre_key`(`nombre`),
    PRIMARY KEY (`id_estado`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pedido` (
    `id_pedido` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `paquetePublicadoId` INTEGER NOT NULL,
    `estadoId` INTEGER NOT NULL,
    `monto_total` DOUBLE NOT NULL,
    `descuento_aplicado` DOUBLE NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Pedido_usuarioId_idx`(`usuarioId`),
    INDEX `Pedido_paquetePublicadoId_idx`(`paquetePublicadoId`),
    INDEX `Pedido_estadoId_idx`(`estadoId`),
    PRIMARY KEY (`id_pedido`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PedidoDetalle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pedidoId` INTEGER NOT NULL,
    `productoId` INTEGER NOT NULL,
    `varianteId` INTEGER NULL,
    `cantidad` INTEGER NOT NULL,
    `precio_unitario` DOUBLE NOT NULL,
    `subtotal` DOUBLE NOT NULL,

    INDEX `PedidoDetalle_pedidoId_idx`(`pedidoId`),
    INDEX `PedidoDetalle_productoId_idx`(`productoId`),
    INDEX `PedidoDetalle_varianteId_idx`(`varianteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EstadoPedido` (
    `id_estado` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `EstadoPedido_nombre_key`(`nombre`),
    PRIMARY KEY (`id_estado`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Caracteristica` ADD CONSTRAINT `Caracteristica_plantillaId_fkey` FOREIGN KEY (`plantillaId`) REFERENCES `Plantilla`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Opcion` ADD CONSTRAINT `Opcion_caracteristicaId_fkey` FOREIGN KEY (`caracteristicaId`) REFERENCES `Caracteristica`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductoVariante` ADD CONSTRAINT `ProductoVariante_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `Producto`(`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductoVarianteOpcion` ADD CONSTRAINT `ProductoVarianteOpcion_varianteId_fkey` FOREIGN KEY (`varianteId`) REFERENCES `ProductoVariante`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductoVarianteOpcion` ADD CONSTRAINT `ProductoVarianteOpcion_caracteristicaId_fkey` FOREIGN KEY (`caracteristicaId`) REFERENCES `Caracteristica`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductoVarianteOpcion` ADD CONSTRAINT `ProductoVarianteOpcion_opcionId_fkey` FOREIGN KEY (`opcionId`) REFERENCES `Opcion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DisponibilidadVariantePaquete` ADD CONSTRAINT `DisponibilidadVariantePaquete_varianteId_fkey` FOREIGN KEY (`varianteId`) REFERENCES `ProductoVariante`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DisponibilidadVariantePaquete` ADD CONSTRAINT `DisponibilidadVariantePaquete_paquetePublicadoId_fkey` FOREIGN KEY (`paquetePublicadoId`) REFERENCES `PaquetePublicado`(`id_paquete_publicado`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_rolId_fkey` FOREIGN KEY (`rolId`) REFERENCES `Rol`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_localidadId_fkey` FOREIGN KEY (`localidadId`) REFERENCES `Localidad`(`id_localidad`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Direccion` ADD CONSTRAINT `Direccion_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Direccion` ADD CONSTRAINT `Direccion_localidadId_fkey` FOREIGN KEY (`localidadId`) REFERENCES `Localidad`(`id_localidad`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LocalidadZona` ADD CONSTRAINT `LocalidadZona_localidadId_fkey` FOREIGN KEY (`localidadId`) REFERENCES `Localidad`(`id_localidad`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LocalidadZona` ADD CONSTRAINT `LocalidadZona_zonaId_fkey` FOREIGN KEY (`zonaId`) REFERENCES `Zona`(`id_zona`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Producto` ADD CONSTRAINT `Producto_marca_id_fkey` FOREIGN KEY (`marca_id`) REFERENCES `Marca`(`id_marca`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Producto` ADD CONSTRAINT `Producto_plantillaId_fkey` FOREIGN KEY (`plantillaId`) REFERENCES `Plantilla`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Producto` ADD CONSTRAINT `Producto_categoria_id_fkey` FOREIGN KEY (`categoria_id`) REFERENCES `Categoria`(`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductoImagen` ADD CONSTRAINT `ProductoImagen_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `Producto`(`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaqueteBase` ADD CONSTRAINT `PaqueteBase_categoria_id_fkey` FOREIGN KEY (`categoria_id`) REFERENCES `Categoria`(`id_categoria`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaqueteBase` ADD CONSTRAINT `PaqueteBase_marcaId_fkey` FOREIGN KEY (`marcaId`) REFERENCES `Marca`(`id_marca`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaqueteBaseProducto` ADD CONSTRAINT `PaqueteBaseProducto_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `Producto`(`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaqueteBaseProducto` ADD CONSTRAINT `PaqueteBaseProducto_paqueteBaseId_fkey` FOREIGN KEY (`paqueteBaseId`) REFERENCES `PaqueteBase`(`id_paquete_base`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaquetePublicado` ADD CONSTRAINT `PaquetePublicado_paqueteBaseId_fkey` FOREIGN KEY (`paqueteBaseId`) REFERENCES `PaqueteBase`(`id_paquete_base`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaquetePublicado` ADD CONSTRAINT `PaquetePublicado_estadoId_fkey` FOREIGN KEY (`estadoId`) REFERENCES `EstadoPaquetePublicado`(`id_estado`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaquetePublicado` ADD CONSTRAINT `PaquetePublicado_zonaId_fkey` FOREIGN KEY (`zonaId`) REFERENCES `Zona`(`id_zona`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pedido` ADD CONSTRAINT `Pedido_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pedido` ADD CONSTRAINT `Pedido_paquetePublicadoId_fkey` FOREIGN KEY (`paquetePublicadoId`) REFERENCES `PaquetePublicado`(`id_paquete_publicado`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pedido` ADD CONSTRAINT `Pedido_estadoId_fkey` FOREIGN KEY (`estadoId`) REFERENCES `EstadoPedido`(`id_estado`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PedidoDetalle` ADD CONSTRAINT `PedidoDetalle_pedidoId_fkey` FOREIGN KEY (`pedidoId`) REFERENCES `Pedido`(`id_pedido`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PedidoDetalle` ADD CONSTRAINT `PedidoDetalle_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `Producto`(`id_producto`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PedidoDetalle` ADD CONSTRAINT `PedidoDetalle_varianteId_fkey` FOREIGN KEY (`varianteId`) REFERENCES `ProductoVariante`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
