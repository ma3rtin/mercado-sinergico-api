-- ============================ CARACTERISTICA ============================
-- Características para Plantilla Celular (id = 1)
INSERT INTO caracteristica (nombre, plantillaId) VALUES
('Color', 1),
('Capacidad de almacenamiento', 1),
('Tamaño de pantalla', 1),
('Memoria RAM', 1);

-- Características para Plantilla Televisor (id = 2)
INSERT INTO caracteristica (nombre, plantillaId) VALUES
('Pulgadas', 2),
('Tipo de pantalla', 2),
('Resolución', 2),
('Conectividad', 2);

-- Características para Plantilla Notebook (id = 3)
INSERT INTO caracteristica (nombre, plantillaId) VALUES
('Procesador', 3),
('Memoria RAM', 3),
('Almacenamiento', 3),
('Sistema operativo', 3);


-- ============================ PLANTILLA ============================
INSERT INTO plantilla (nombre) 
VALUES
('Plantilla Celular'),
('Plantilla Televisor'),
('Plantilla Notebook');


-- ============================ OPCION ============================
-- Característica 1: Color
INSERT INTO opcion (nombre, caracteristicaId) VALUES
('Negro', 1),
('Blanco', 1),
('Azul', 1),
('Rojo', 1);

-- Característica 2: Capacidad de almacenamiento
INSERT INTO opcion (nombre, caracteristicaId) VALUES
('64 GB', 2),
('128 GB', 2),
('256 GB', 2),
('512 GB', 2);

-- Característica 3: Tamaño de pantalla
INSERT INTO opcion (nombre, caracteristicaId) VALUES
('5.5"', 3),
('6.1"', 3),
('6.7"', 3);

-- Característica 4: Memoria RAM (Celular)
INSERT INTO opcion (nombre, caracteristicaId) VALUES
('4 GB', 4),
('6 GB', 4),
('8 GB', 4);

-- Característica 5: Pulgadas (Televisor)
INSERT INTO opcion (nombre, caracteristicaId) VALUES
('32"', 5),
('43"', 5),
('55"', 5),
('65"', 5);

-- Característica 6: Tipo de pantalla
INSERT INTO opcion (nombre, caracteristicaId) VALUES
('LED', 6),
('OLED', 6),
('QLED', 6);

-- Característica 7: Resolución
INSERT INTO opcion (nombre, caracteristicaId) VALUES
('HD', 7),
('Full HD', 7),
('4K', 7),
('8K', 7);

-- Característica 8: Conectividad
INSERT INTO opcion (nombre, caracteristicaId) VALUES
('Wi-Fi', 8),
('Bluetooth', 8),
('HDMI', 8),
('USB', 8);

-- Característica 9: Procesador (Notebook)
INSERT INTO opcion (nombre, caracteristicaId) VALUES
('Intel i5', 9),
('Intel i7', 9),
('AMD Ryzen 5', 9),
('AMD Ryzen 7', 9);

-- Característica 10: Memoria RAM (Notebook)
INSERT INTO opcion (nombre, caracteristicaId) VALUES
('8 GB', 10),
('16 GB', 10),
('32 GB', 10);

-- Característica 11: Almacenamiento
INSERT INTO opcion (nombre, caracteristicaId) VALUES
('256 GB SSD', 11),
('512 GB SSD', 11),
('1 TB SSD', 11);

-- Característica 12: Sistema operativo
INSERT INTO opcion (nombre, caracteristicaId) VALUES
('Windows 11', 12),
('Linux', 12),
('macOS', 12);


-- ============================ USUARIO ============================
INSERT INTO usuario 
(email, nombre, contraseña, telefono, fecha_nac, imagen_url, rolId, createdAt, updatedAt)
VALUES
('admin@admin.com', 'Administrador', 'admin123', '1122334455', '1990-01-01', 
'https://example.com/admin-avatar.jpg', 1, NOW(), NOW());

-- 👤 Usuario cliente
INSERT INTO usuario 
(email, nombre, contraseña, telefono, fecha_nac, imagen_url, rolId, createdAt, updatedAt)
VALUES
('juanperez@example.com', 'Juan Pérez', 'clave123', '1199887766', '1995-05-15', 
'https://example.com/juan-avatar.jpg', 2, NOW(), NOW());

-- ============================ ROL ============================
INSERT INTO rol (nombre) 
VALUES
("Administrador"),
("Usuario");


-- ============================ DIRECCION ============================
-- Admin → Palermo (localidadId = 1)
INSERT INTO direccion 
(usuarioId, localidadId, codigo_postal, calle, numero, piso, departamento)
VALUES
(1, 1, 1425, 'Av. Santa Fe', 1234, 5, 'A');

-- Juan Pérez → Morón (localidadId = 4)
INSERT INTO direccion 
(usuarioId, localidadId, codigo_postal, calle, numero, piso, departamento)
VALUES
(2, 4, 1708, 'Av. Rivadavia', 9876, NULL, NULL);


-- ============================ LOCALIDAD ============================
INSERT INTO localidad (nombre, codigo_postal) VALUES
('Palermo', 1425),
('Recoleta', 1118),
('San Isidro', 1642),
('Morón', 1708),
('La Plata', 1900),
('Quilmes', 1878);

-- 8️⃣ Zona
INSERT INTO zona (nombre, createdAt, updatedAt) VALUES
('Zona Norte', NOW(), NOW()),
('Zona Sur', NOW(), NOW()),
('Zona Oeste', NOW(), NOW()),
('CABA', NOW(), NOW());


-- ============================ LOCALIDADZONA ============================
-- Relación entre zonas y localidades
INSERT INTO localidadzona (zonaId, localidadId) VALUES
-- Zona Norte
(1, 3), -- San Isidro
(1, 6), -- Quilmes (ejemplo mixto)

-- Zona Sur
(2, 5), -- La Plata
(2, 6), -- Quilmes

-- Zona Oeste
(3, 4), -- Morón

-- CABA
(4, 1), -- Palermo
(4, 2); -- Recoleta


-- ============================ CATEGORIA ============================
INSERT INTO categoria (nombre) 
VALUES
("Automotor"),
("Electrodomésticos"),
("Televisores"),
("Tecnología"),
("Hogar y Decoración"),
("Deportes y Fitness"),
("Alimentos y Bebidas");

-- 1️⃣1️⃣ Marca
INSERT INTO marca (nombre, updatedAt)
VALUES
("Apple", NOW()),
("Samsung", NOW()),
("Sony", NOW()),
("LG", NOW()),
("Philips", NOW()),
("Otras", NOW());


-- ============================ PRODUCTO ============================
-- Celulares (Plantilla 1, Categoría: Tecnología, Marca: varias)
INSERT INTO producto 
(nombre, descripcion, precio, imagen_url, marca_id, categoria_id, plantillaId, stock, altura, ancho, profundidad, peso, createdAt, updatedAt)
VALUES
('iPhone 14', 'Smartphone de Apple con pantalla de 6.1", 128 GB y chip A15 Bionic.', 1200.00, 'https://example.com/iphone14.jpg', 1, 4, 1, 50, 14.7, 7.1, 0.8, 0.17, NOW(), NOW()),
('Samsung Galaxy S23', 'Smartphone Samsung con 256 GB de almacenamiento y cámara triple.', 1100.00, 'https://example.com/galaxy-s23.jpg', 2, 4, 1, 40, 15.0, 7.2, 0.8, 0.18, NOW(), NOW()),
('Sony Xperia 10 V', 'Celular Sony con pantalla OLED de 6.1" y batería de 5000 mAh.', 800.00, 'https://example.com/xperia10v.jpg', 3, 4, 1, 35, 15.2, 7.1, 0.8, 0.16, NOW(), NOW());

-- Televisores (Plantilla 2, Categoría: Televisores)
INSERT INTO producto 
(nombre, descripcion, precio, imagen_url, marca_id, categoria_id, plantillaId, stock, altura, ancho, profundidad, peso, createdAt, updatedAt)
VALUES
('LG OLED C3 55"', 'Televisor OLED de 55" con resolución 4K y soporte Dolby Vision.', 1800.00, 'https://example.com/lg-oled-c3.jpg', 4, 3, 2, 25, 70.0, 123.0, 5.0, 18.0, NOW(), NOW()),
('Samsung QLED Q60C 50"', 'Televisor QLED de 50" con Quantum HDR y SmartThings integrado.', 1500.00, 'https://example.com/samsung-qled-q60c.jpg', 2, 3, 2, 30, 65.0, 112.0, 5.5, 16.5, NOW(), NOW()),
('Philips 43PUS8008', 'Televisor LED 4K UHD de 43" con Ambilight y Android TV.', 1000.00, 'https://example.com/philips-43pus8008.jpg', 5, 3, 2, 40, 55.0, 96.0, 5.0, 13.0, NOW(), NOW());

-- Notebooks (Plantilla 3, Categoría: Tecnología)
INSERT INTO producto 
(nombre, descripcion, precio, imagen_url, marca_id, categoria_id, plantillaId, stock, altura, ancho, profundidad, peso, createdAt, updatedAt)
VALUES
('MacBook Air M2', 'Notebook de Apple con chip M2, pantalla Retina y 8 GB de RAM.', 1900.00, 'https://example.com/macbook-air-m2.jpg', 1, 4, 3, 20, 1.1, 30.0, 21.0, 1.24, NOW(), NOW()),
('HP Pavilion 15', 'Notebook HP con procesador Intel i5 y SSD de 512 GB.', 950.00, 'https://example.com/hp-pavilion15.jpg', 6, 4, 3, 25, 1.9, 36.0, 24.0, 1.80, NOW(), NOW()),
('Lenovo IdeaPad 3', 'Notebook Lenovo con AMD Ryzen 5, 8 GB de RAM y 256 GB SSD.', 800.00, 'https://example.com/lenovo-ideapad3.jpg', 6, 4, 3, 30, 1.9, 36.0, 24.0, 1.65, NOW(), NOW());


-- ============================ PRODUCTOIMAGEN ============================
-- 📱 Celulares
INSERT INTO productoimagen (url, productoId, createdAt) VALUES
('https://example.com/iphone14-front.jpg', 1, NOW()),
('https://example.com/iphone14-back.jpg', 1, NOW()),
('https://example.com/galaxy-s23-front.jpg', 2, NOW()),
('https://example.com/galaxy-s23-back.jpg', 2, NOW()),
('https://example.com/xperia10v-front.jpg', 3, NOW()),
('https://example.com/xperia10v-side.jpg', 3, NOW());

-- 🖥️ Televisores
INSERT INTO productoimagen (url, productoId, createdAt) VALUES
('https://example.com/lg-oled-c3-front.jpg', 4, NOW()),
('https://example.com/lg-oled-c3-side.jpg', 4, NOW()),
('https://example.com/samsung-qled-q60c-front.jpg', 5, NOW()),
('https://example.com/samsung-qled-q60c-ambilight.jpg', 5, NOW()),
('https://example.com/philips-43pus8008-front.jpg', 6, NOW()),
('https://example.com/philips-43pus8008-back.jpg', 6, NOW());

-- 💻 Notebooks
INSERT INTO productoimagen (url, productoId, createdAt) VALUES
('https://example.com/macbook-air-m2-open.jpg', 7, NOW()),
('https://example.com/macbook-air-m2-side.jpg', 7, NOW()),
('https://example.com/hp-pavilion15-open.jpg', 8, NOW()),
('https://example.com/hp-pavilion15-keyboard.jpg', 8, NOW()),
('https://example.com/lenovo-ideapad3-front.jpg', 9, NOW()),
('https://example.com/lenovo-ideapad3-side.jpg', 9, NOW());


-- ============================ PAQUETEBASE ============================
-- 📱 Paquete de celulares Apple
INSERT INTO paquetebase 
(nombre, descripcion, imagen_url, categoria_id, marcaId, createdAt, updatedAt)
VALUES
('Pack iPhone Experience', 'Paquete base de productos Apple: iPhone, accesorios y beneficios premium.', 
'https://example.com/pack-iphone.jpg', 4, 1, NOW(), NOW());

-- 📱 Paquete de celulares Samsung
INSERT INTO paquetebase 
(nombre, descripcion, imagen_url, categoria_id, marcaId, createdAt, updatedAt)
VALUES
('Pack Galaxy Performance', 'Paquete Samsung con celular Galaxy y complementos oficiales.', 
'https://example.com/pack-galaxy.jpg', 4, 2, NOW(), NOW());

-- 🖥️ Paquete de televisores LG
INSERT INTO paquetebase 
(nombre, descripcion, imagen_url, categoria_id, marcaId, createdAt, updatedAt)
VALUES
('Pack Smart TV LG', 'Televisor LG OLED más soporte de pared y extensión de garantía.', 
'https://example.com/pack-lg-tv.jpg', 3, 4, NOW(), NOW());

-- 🖥️ Paquete de televisores Philips
INSERT INTO paquetebase 
(nombre, descripcion, imagen_url, categoria_id, marcaId, createdAt, updatedAt)
VALUES
('Pack Philips Ambilight', 'Televisor Philips Ambilight 4K con barra de sonido y control remoto inteligente.', 
'https://example.com/pack-philips-tv.jpg', 3, 5, NOW(), NOW());

-- 💻 Paquete de notebooks HP
INSERT INTO paquetebase 
(nombre, descripcion, imagen_url, categoria_id, marcaId, createdAt, updatedAt)
VALUES
('Pack Oficina HP', 'Notebook HP Pavilion más mouse inalámbrico y mochila ejecutiva.', 
'https://example.com/pack-hp-notebook.jpg', 4, 6, NOW(), NOW());

-- 💻 Paquete de notebooks Apple
INSERT INTO paquetebase 
(nombre, descripcion, imagen_url, categoria_id, marcaId, createdAt, updatedAt)
VALUES
('Pack Apple Productivity', 'MacBook Air M2 más accesorios esenciales y AppleCare.', 
'https://example.com/pack-apple-notebook.jpg', 4, 1, NOW(), NOW());


-- ============================ PAQUETEBASEPRODUCTO ============================
-- 📱 Pack iPhone Experience (Paquete 1) → iPhone 14
INSERT INTO paquetebaseproducto (productoId, paqueteBaseId)
VALUES
(1, 1);

-- 📱 Pack Galaxy Performance (Paquete 2) → Samsung Galaxy S23
INSERT INTO paquetebaseproducto (productoId, paqueteBaseId)
VALUES
(2, 2);

-- 🖥️ Pack Smart TV LG (Paquete 3) → LG OLED C3 55"
INSERT INTO paquetebaseproducto (productoId, paqueteBaseId)
VALUES
(4, 3);

-- 🖥️ Pack Philips Ambilight (Paquete 4) → Philips 43PUS8008
INSERT INTO paquetebaseproducto (productoId, paqueteBaseId)
VALUES
(6, 4);

-- 💻 Pack Oficina HP (Paquete 5) → HP Pavilion 15 y Lenovo IdeaPad 3
INSERT INTO paquetebaseproducto (productoId, paqueteBaseId)
VALUES
(8, 5),
(9, 5);

-- 💻 Pack Apple Productivity (Paquete 6) → MacBook Air M2 + iPhone 14
INSERT INTO paquetebaseproducto (productoId, paqueteBaseId)
VALUES
(7, 6),
(1, 6);


-- ============================ PAQUETEPUBLICADO ============================
-- 📦 Pack iPhone Experience publicado en Zona Norte (Activo)
INSERT INTO paquetepublicado 
(paqueteBaseId, estadoId, zonaId, fecha_inicio, fecha_fin, cant_productos, monto_total, imagen_url, tipoPaquete, createdAt, updatedAt)
VALUES
(1, 1, 1, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 50, 1200.00, 'https://example.com/pub-iphone.jpg', 'SINERGICO', NOW(), NOW());

-- 📦 Pack Galaxy Performance publicado en Zona Sur (Activo)
INSERT INTO paquetepublicado 
(paqueteBaseId, estadoId, zonaId, fecha_inicio, fecha_fin, cant_productos, monto_total, imagen_url, tipoPaquete, createdAt, updatedAt)
VALUES
(2, 1, 2, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 40, 1100.00, 'https://example.com/pub-galaxy.jpg', 'SINERGICO', NOW(), NOW());

-- 📦 Pack Smart TV LG publicado en CABA (Activo)
INSERT INTO paquetepublicado 
(paqueteBaseId, estadoId, zonaId, fecha_inicio, fecha_fin, cant_productos, monto_total, imagen_url, tipoPaquete, createdAt, updatedAt)
VALUES
(3, 1, 4, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 25, 1800.00, 'https://example.com/pub-lg.jpg', 'ENERGETICO', NOW(), NOW());

-- 📦 Pack Philips Ambilight publicado en Zona Sur (Pendiente)
INSERT INTO paquetepublicado 
(paqueteBaseId, estadoId, zonaId, fecha_inicio, fecha_fin, cant_productos, monto_total, imagen_url, tipoPaquete, createdAt, updatedAt)
VALUES
(4, 3, 2, NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY), 30, 1000.00, 'https://example.com/pub-philips.jpg', 'POR_DEFINIR', NOW(), NOW());

-- 📦 Pack Oficina HP publicado en Zona Oeste (Activo)
INSERT INTO paquetepublicado 
(paqueteBaseId, estadoId, zonaId, fecha_inicio, fecha_fin, cant_productos, monto_total, imagen_url, tipoPaquete, createdAt, updatedAt)
VALUES
(5, 1, 3, NOW(), DATE_ADD(NOW(), INTERVAL 20 DAY), 45, 950.00, 'https://example.com/pub-hp.jpg', 'SINERGICO', NOW(), NOW());

-- 📦 Pack Apple Productivity publicado en CABA (Activo)
INSERT INTO paquetepublicado 
(paqueteBaseId, estadoId, zonaId, fecha_inicio, fecha_fin, cant_productos, monto_total, imagen_url, tipoPaquete, createdAt, updatedAt)
VALUES
(6, 1, 4, NOW(), DATE_ADD(NOW(), INTERVAL 25 DAY), 30, 1900.00, 'https://example.com/pub-apple.jpg', 'ENERGETICO', NOW(), NOW());


-- ============================ ESTADOPAQUETEPUBLICADO ============================
INSERT INTO estadopaquetepublicado (nombre) 
VALUES
("Activo"),
("Inactivo"),
("Pendiente"),
("Cancelado"),
("Cerrado"),
("Incompleto"),
("Eliminado");


-- ============================ PEDIDO ============================
-- Pedido 1: Usuario 1 compra el Pack iPhone Experience (Activo en Zona Norte)
INSERT INTO pedido (usuarioId, paquetePublicadoId, estadoId, monto_total, fecha)
VALUES (1, 1, 2, 1200.00, NOW()); -- Confirmado

-- Pedido 2: Usuario 1 compra el Pack Galaxy Performance (Activo en Zona Sur)
INSERT INTO pedido (usuarioId, paquetePublicadoId, estadoId, monto_total, fecha)
VALUES (1, 2, 3, 1100.00, NOW()); -- Pagado

-- Pedido 3: Usuario 1 reserva el Pack Smart TV LG (Activo en CABA)
INSERT INTO pedido (usuarioId, paquetePublicadoId, estadoId, monto_total, fecha)
VALUES (1, 3, 1, 1800.00, NOW()); -- Pendiente

-- Pedido 4: Usuario 1 compra el Pack Oficina HP (Activo en Zona Oeste)
INSERT INTO pedido (usuarioId, paquetePublicadoId, estadoId, monto_total, fecha)
VALUES (1, 5, 4, 950.00, NOW()); -- Enviado


-- ============================ PEDIDOPAQUETEPUBLICADO ============================
-- Pedido 1 → Paquete Publicado 1 (Pack iPhone Experience)
INSERT INTO pedidopaquetepublicado (pedidoId, paquetePublicadoId)
VALUES (1, 1);

-- Pedido 2 → Paquete Publicado 2 (Pack Galaxy Performance)
INSERT INTO pedidopaquetepublicado (pedidoId, paquetePublicadoId)
VALUES (2, 2);

-- Pedido 3 → Paquete Publicado 3 (Pack Smart TV LG)
INSERT INTO pedidopaquetepublicado (pedidoId, paquetePublicadoId)
VALUES (3, 3);

-- Pedido 4 → Paquete Publicado 5 (Pack Oficina HP)
INSERT INTO pedidopaquetepublicado (pedidoId, paquetePublicadoId)
VALUES (4, 5);


-- ============================ ESTADOPEDIDO ============================
INSERT INTO estadopedido (nombre) VALUES
('Pendiente'),
('Confirmado'),
('Pagado'),
('Enviado'),
('Entregado'),
('Cancelado');

-- ============================ CARRITO ============================
INSERT INTO carrito (usuarioId, createdAt, updatedAt) VALUES
(1, NOW(), NOW()),  -- Admin
(2, NOW(), NOW());  -- Juan Pérez

-- ============================ CARRITOPRODUCTO ============================
INSERT INTO carritoproducto (carritoId, productoId, cantidad)
VALUES
(1, 1, 1),  -- iPhone 14
(1, 4, 1);  -- LG OLED C3

-- 👤 Juan Pérez → agrega un Galaxy y una notebook HP
INSERT INTO carritoproducto (carritoId, productoId, cantidad)
VALUES
(2, 2, 1),  -- Samsung Galaxy S23
(2, 8, 1);  -- HP Pavilion 15


-- ============================ CARRITOPAQUETEPUBLICADO ============================
-- 🧑‍💼 Admin → añade un paquete publicado activo (Pack Smart TV LG)
INSERT INTO carritopaquetepublicado (carritoId, paquetePublicadoId, cantidad)
VALUES
(1, 3, 1);

-- 👤 Juan Pérez → añade un paquete de notebooks (Pack Oficina HP)
INSERT INTO carritopaquetepublicado (carritoId, paquetePublicadoId, cantidad)
VALUES
(2, 5, 1);