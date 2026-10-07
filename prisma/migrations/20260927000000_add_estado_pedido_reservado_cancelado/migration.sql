-- Inserción idempotente de los nuevos estados de pedido para compras de paquetes ENÉRGICOS
INSERT INTO `EstadoPedido` (`id_estado`, `nombre`) VALUES
(7, 'Reservado'),
(8, 'Cancelado')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);
