-- prisma-audit: allow-drop
-- Eliminación intencional: se descarta la zona histórica de cada paquete.
-- El catálogo activo deja de guardar CP; Direccion.codigo_postal se conserva.
-- Conservar paquetes, pedidos y direcciones; retirar solamente la asignación geográfica del paquete.
ALTER TABLE `PaquetePublicado` DROP FOREIGN KEY `PaquetePublicado_zonaId_fkey`;
ALTER TABLE `PaquetePublicado` DROP INDEX `PaquetePublicado_zonaId_idx`, DROP COLUMN `zonaId`;

-- Las localidades históricas se conservan para no reasignar domicilios por suposición.
ALTER TABLE `Localidad` ADD COLUMN `activa` BOOLEAN NOT NULL DEFAULT true,
  MODIFY COLUMN `codigo_postal` INTEGER NULL;
UPDATE `Localidad` SET `activa` = false;
-- Heredar la collation del nombre existente, aunque difiera del default de la base.
CREATE TEMPORARY TABLE `CatalogoLocalidad` AS SELECT `nombre` FROM `Localidad` WHERE 1 = 0;
ALTER TABLE `CatalogoLocalidad` ADD PRIMARY KEY (`nombre`);
INSERT INTO `CatalogoLocalidad` (`nombre`) VALUES
('Almirante Brown'),
('Avellaneda'),
('Berazategui'),
('Berisso'),
('CABA'),
('Campana'),
('Cañuelas'),
('Del Viso'),
('Derqui'),
('Esteban Echeverría'),
('Ezeiza'),
('Florencio Varela'),
('Hurlingham'),
('Ituzaingó'),
('José C. Paz'),
('La Matanza Norte'),
('La Matanza Sur'),
('Lanús'),
('Lomas de Zamora'),
('Malvinas Argentinas'),
('Merlo'),
('Moreno'),
('Morón'),
('Nordelta'),
('Quilmes'),
('San Fernando'),
('San Isidro'),
('San Martín'),
('San Miguel'),
('Tigre'),
('Tres de Febrero'),
('Vicente López'),
('Ensenada'),
('Escobar'),
('Garín'),
('General Rodríguez'),
('Guernica'),
('Ingeniero Maschwitz'),
('La Plata Centro'),
('La Plata Norte'),
('La Plata Oeste'),
('Luján'),
('Marcos Paz'),
('Pilar'),
('San Vicente'),
('Villa Rosa'),
('Zárate');
INSERT INTO `Localidad` (`nombre`, `codigo_postal`, `activa`)
SELECT c.nombre, NULL, false FROM `CatalogoLocalidad` c
WHERE NOT EXISTS (SELECT 1 FROM `Localidad` l WHERE l.nombre = c.nombre);
-- Reutilizar un ID por nombre y desactivar duplicados sin romper claves foráneas.
CREATE TEMPORARY TABLE `LocalidadVigente` AS
SELECT MIN(l.id_localidad) AS id FROM `Localidad` l
INNER JOIN `CatalogoLocalidad` c ON c.nombre = l.nombre GROUP BY c.nombre;
UPDATE `Localidad` l INNER JOIN `LocalidadVigente` v ON l.id_localidad = v.id
SET l.activa = true, l.codigo_postal = NULL;
DROP TEMPORARY TABLE `LocalidadVigente`;
DROP TEMPORARY TABLE `CatalogoLocalidad`;
