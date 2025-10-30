INSERT INTO rol (nombre) 
VALUES
("Administrador"),
("Usuario");

INSERT INTO categoria (nombre) 
VALUES
("Automotor"),
("Electrodomésticos"),
("Televisores"),
("Tecnología"),
("Hogar y Decoración"),
("Deportes y Fitness"),
("Alimentos y Bebidas");

INSERT INTO marca (nombre, updatedAt)
VALUES
("Apple", NOW()),
("Samsung", NOW()),
("Sony", NOW()),
("LG", NOW()),
("Philips", NOW()),
("Otras", NOW());

INSERT INTO estadopaquetepublicado (nombre) 
VALUES
("Activo"),
("Inactivo"),
("Pendiente"),
("Cancelado"),
("Cerrado"),
("Incompleto"),
("Eliminado");

INSERT INTO localidad (nombre, codigo_postal) VALUES
('Palermo', 1425),
('Recoleta', 1118),
('San Isidro', 1642),
('Morón', 1708),
('La Plata', 1900),
('Quilmes', 1878);

INSERT INTO zona (nombre, createdAt, updatedAt) VALUES
('Zona Norte', NOW(), NOW()),
('Zona Sur', NOW(), NOW()),
('Zona Oeste', NOW(), NOW()),
('CABA', NOW(), NOW());


-- Zona Norte
INSERT INTO localidadzona (zonaId, localidadId) VALUES
(1, 3), -- San Isidro
(1, 6); -- Quilmes (ejemplo mixto)

-- Zona Sur
INSERT INTO localidadzona (zonaId, localidadId) VALUES
(2, 5), -- La Plata
(2, 6); -- Quilmes

-- Zona Oeste
INSERT INTO localidadzona (zonaId, localidadId) VALUES
(3, 4); -- Morón

-- CABA
INSERT INTO localidadzona (zonaId, localidadId) VALUES
(4, 1), -- Palermo
(4, 2); -- Recoleta