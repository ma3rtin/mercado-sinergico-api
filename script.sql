-- ============================ ROL ============================
INSERT INTO Rol (nombre) 
VALUES
('Administrador'),
('Usuario');

-- ============================ CATEGORIA ============================
INSERT INTO Categoria (nombre) 
VALUES
('Automotor'),
('Electrodomésticos'),
('Televisores'),
('Tecnología'),
('Hogar y Decoración'),
('Deportes y Fitness'),
('Alimentos y Bebidas');

-- ============================ MARCA ============================
INSERT INTO Marca (nombre, createdAt, updatedAt)
VALUES
('Apple', NOW(), NOW()),
('Samsung', NOW(), NOW()),
('Sony', NOW(), NOW()),
('LG', NOW(), NOW()),
('Philips', NOW(), NOW()),
('Otras', NOW(), NOW());

-- ============================ ESTADOPAQUETEPUBLICADO ============================
INSERT INTO EstadoPaquetePublicado (nombre) 
VALUES
('Activo'),
('Inactivo'),
('Pendiente'),
('Cancelado'),
('Cerrado'),
('Incompleto'),
('Eliminado');

-- ============================ ESTADOPEDIDO ============================
INSERT INTO EstadoPedido (nombre) VALUES
('Pendiente'),
('Confirmado'),
('Pagado'),
('Enviado'),
('Entregado'),
('Cancelado');

-- ============================ LOCALIDAD ============================
INSERT INTO Localidad (nombre, codigo_postal) VALUES
('Palermo', 1425),
('Recoleta', 1118),
('San Isidro', 1642),
('Morón', 1708),
('La Plata', 1900),
('Quilmes', 1878);

-- ============================ ZONA ============================
INSERT INTO Zona (nombre, createdAt, updatedAt) VALUES
('Zona Norte', NOW(), NOW()),
('Zona Sur', NOW(), NOW()),
('Zona Oeste', NOW(), NOW()),
('CABA', NOW(), NOW());

-- ============================ LOCALIDADZONA ============================
INSERT INTO LocalidadZona (zonaId, localidadId) VALUES
-- Zona Norte
(1, 3), -- San Isidro
(1, 6), -- Quilmes
-- Zona Sur
(2, 5), -- La Plata
(2, 6), -- Quilmes
-- Zona Oeste
(3, 4), -- Morón
-- CABA
(4, 1), -- Palermo
(4, 2); -- Recoleta

-- ============================ USUARIO ============================
-- 👤 Usuario admin
INSERT INTO Usuario 
(email, nombre, contraseña, telefono, fecha_nac, imagen_url, rolId, createdAt, updatedAt)
VALUES
('admin@admin.com', 'Administrador', 'admin123', '1122334455', '1990-01-01', 
'https://img.freepik.com/free-psd/3d-illustration-bald-person-with-glasses_23-2149436184.jpg?semt=ais_incoming&w=740&q=80', 1, NOW(), NOW());

-- 👤 Usuario cliente
INSERT INTO Usuario 
(email, nombre, contraseña, telefono, fecha_nac, imagen_url, rolId, createdAt, updatedAt)
VALUES
('juanperez@example.com', 'Juan Pérez', 'clave123', '1199887766', '1995-05-15', 
'https://img.freepik.com/psd-gratuit/illustration-3d-personne-lunettes-soleil_23-2149436188.jpg?semt=ais_hybrid&w=740&q=80', 2, NOW(), NOW());

-- ============================ DIRECCION ============================
-- Admin → Palermo (localidadId = 1)
INSERT INTO Direccion 
(usuarioId, localidadId, codigo_postal, calle, numero, piso, departamento)
VALUES
(1, 1, 1425, 'Av. Santa Fe', 1234, 5, 'A');

-- Juan Pérez → Morón (localidadId = 4)
INSERT INTO Direccion 
(usuarioId, localidadId, codigo_postal, calle, numero, piso, departamento)
VALUES
(2, 4, 1708, 'Av. Rivadavia', 9876, NULL, NULL);

-- ============================ PLANTILLA ============================
INSERT INTO Plantilla (nombre) 
VALUES
('Plantilla Celular'),
('Plantilla Televisor'),
('Plantilla Notebook');

-- ============================ CARACTERISTICA ============================
-- Características para Plantilla Celular (id = 1)
INSERT INTO Caracteristica (nombre, plantillaId) VALUES
('Color', 1),
('Capacidad de almacenamiento', 1),
('Tamaño de pantalla', 1),
('Memoria RAM', 1);

-- Características para Plantilla Televisor (id = 2)
INSERT INTO Caracteristica (nombre, plantillaId) VALUES
('Pulgadas', 2),
('Tipo de pantalla', 2),
('Resolución', 2),
('Conectividad', 2);

-- Características para Plantilla Notebook (id = 3)
INSERT INTO Caracteristica (nombre, plantillaId) VALUES
('Procesador', 3),
('Memoria RAM', 3),
('Almacenamiento', 3),
('Sistema operativo', 3);

-- ============================ OPCION ============================
-- Característica 1: Color
INSERT INTO Opcion (nombre, caracteristicaId) VALUES
('Negro', 1),
('Blanco', 1),
('Azul', 1),
('Rojo', 1);

-- Característica 2: Capacidad de almacenamiento
INSERT INTO Opcion (nombre, caracteristicaId) VALUES
('64 GB', 2),
('128 GB', 2),
('256 GB', 2),
('512 GB', 2);

-- Característica 3: Tamaño de pantalla
INSERT INTO Opcion (nombre, caracteristicaId) VALUES
('5.5"', 3),
('6.1"', 3),
('6.7"', 3);

-- Característica 4: Memoria RAM (Celular)
INSERT INTO Opcion (nombre, caracteristicaId) VALUES
('4 GB', 4),
('6 GB', 4),
('8 GB', 4);

-- Característica 5: Pulgadas (Televisor)
INSERT INTO Opcion (nombre, caracteristicaId) VALUES
('32"', 5),
('43"', 5),
('55"', 5),
('65"', 5);

-- Característica 6: Tipo de pantalla
INSERT INTO Opcion (nombre, caracteristicaId) VALUES
('LED', 6),
('OLED', 6),
('QLED', 6);

-- Característica 7: Resolución
INSERT INTO Opcion (nombre, caracteristicaId) VALUES
('HD', 7),
('Full HD', 7),
('4K', 7),
('8K', 7);

-- Característica 8: Conectividad
INSERT INTO Opcion (nombre, caracteristicaId) VALUES
('Wi-Fi', 8),
('Bluetooth', 8),
('HDMI', 8),
('USB', 8);

-- Característica 9: Procesador (Notebook)
INSERT INTO Opcion (nombre, caracteristicaId) VALUES
('Intel i5', 9),
('Intel i7', 9),
('AMD Ryzen 5', 9),
('AMD Ryzen 7', 9);

-- Característica 10: Memoria RAM (Notebook)
INSERT INTO Opcion (nombre, caracteristicaId) VALUES
('8 GB', 10),
('16 GB', 10),
('32 GB', 10);

-- Característica 11: Almacenamiento
INSERT INTO Opcion (nombre, caracteristicaId) VALUES
('256 GB SSD', 11),
('512 GB SSD', 11),
('1 TB SSD', 11);

-- Característica 12: Sistema operativo
INSERT INTO Opcion (nombre, caracteristicaId) VALUES
('Windows 11', 12),
('Linux', 12),
('macOS', 12);

-- ============================ PRODUCTO ============================
-- Celulares (Plantilla 1, Categoría: Tecnología, Marca: varias)
INSERT INTO Producto 
(nombre, descripcion, precio, imagen_url, marca_id, categoria_id, plantillaId, stock, altura, ancho, profundidad, peso, createdAt, updatedAt)
VALUES
('iPhone 14', 'Smartphone de Apple con pantalla de 6.1", 128 GB y chip A15 Bionic.', 1200.00, 'https://acdn-us.mitiendanube.com/stores/001/555/911/products/iphone-14-black-d61713d18bdf31d02417016951877100-1024-1024.webp', 1, 4, 1, 50, 14.7, 7.1, 0.8, 0.17, NOW(), NOW()),
('Samsung Galaxy S23', 'Smartphone Samsung con 256 GB de almacenamiento y cámara triple.', 1100.00, 'https://http2.mlstatic.com/D_848869-CBT90467223350_082025-C.jpg', 2, 4, 1, 40, 15.0, 7.2, 0.8, 0.18, NOW(), NOW()),
('Sony Xperia 10 V', 'Celular Sony con pantalla OLED de 6.1" y batería de 5000 mAh.', 800.00, 'https://images-cdn.ubuy.co.in/66faadc7e1426368995da054-sony-xperia-10-v-xq-dc72-5g-dual-128gb.jpg', 3, 4, 1, 35, 15.2, 7.1, 0.8, 0.16, NOW(), NOW());

-- Televisores (Plantilla 2, Categoría: Televisores)
INSERT INTO Producto 
(nombre, descripcion, precio, imagen_url, marca_id, categoria_id, plantillaId, stock, altura, ancho, profundidad, peso, createdAt, updatedAt)
VALUES
('LG OLED C3 55"', 'Televisor OLED de 55" con resolución 4K y soporte Dolby Vision.', 1800.00, 'https://www.lg.com/content/dam/channel/wcms/mx/images/televisores/oled55c3psa_awm_enms_mx_c/gallery/large06.jpg', 4, 3, 2, 25, 70.0, 123.0, 5.0, 18.0, NOW(), NOW()),
('Samsung QLED Q60C 50"', 'Televisor QLED de 50" con Quantum HDR y SmartThings integrado.', 1500.00, 'https://http2.mlstatic.com/D_NQ_NP_890431-MLU70332220536_072023-O.webp', 2, 3, 2, 30, 65.0, 112.0, 5.5, 16.5, NOW(), NOW()),
('Philips 43PUS8008', 'Televisor LED 4K UHD de 43" con Ambilight y Android TV.', 1000.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTaqu-K9cZ2B7O7q_5s0qDuD78PC2l8_323oA&s', 5, 3, 2, 40, 55.0, 96.0, 5.0, 13.0, NOW(), NOW());

-- Notebooks (Plantilla 3, Categoría: Tecnología)
INSERT INTO Producto 
(nombre, descripcion, precio, imagen_url, marca_id, categoria_id, plantillaId, stock, altura, ancho, profundidad, peso, createdAt, updatedAt)
VALUES
('MacBook Air M2', 'Notebook de Apple con chip M2, pantalla Retina y 8 GB de RAM.', 1900.00, 'https://http2.mlstatic.com/D_NQ_NP_663606-MLA78669752141_082024-O.webp', 1, 4, 3, 20, 1.1, 30.0, 21.0, 1.24, NOW(), NOW()),
('HP Pavilion 15', 'Notebook HP con procesador Intel i5 y SSD de 512 GB.', 950.00, 'https://i5.walmartimages.com/asr/762e3ce1-4e52-40fe-abd1-1a1e056d4895_2.f2b9c74ed7d0701637b067a44f89cca6.jpeg', 6, 4, 3, 25, 1.9, 36.0, 24.0, 1.80, NOW(), NOW()),
('Lenovo IdeaPad 3', 'Notebook Lenovo con AMD Ryzen 5, 8 GB de RAM y 256 GB SSD.', 800.00, 'https://i5.walmartimages.com/asr/812648ff-28b6-4a80-b19e-21a722a3a2ee.79a703c8f6fa9663ca7da697ea9f74d0.jpeg', 6, 4, 3, 30, 1.9, 36.0, 24.0, 1.65, NOW(), NOW());

-- ============================ PRODUCTOIMAGEN ============================
-- 📱 Celulares
INSERT INTO ProductoImagen (url, productoId, createdAt) VALUES
('https://cdn.accentuate.io/39884851707990/1677610349980/iPhone-14-Pro-Max-Glass---Side-(1).jpg?v=1677610349981', 1, NOW()),
('https://www.macstation.com.ar/web/image/product.template/63145/image_1024?unique=458b3d2', 1, NOW()),
('https://m-cdn.phonearena.com/images/phones/83817-940/Samsung-Galaxy-S23-Ultra.jpg?w=1', 2, NOW()),
('https://tienda.claro.com.ar/staticContent/Claro/images/catalog/productos/646x1000/70011154_3.webp', 2, NOW()),
('https://www.stuff.tv/wp-content/uploads/sites/2/2023/08/Sony-Xperia-10-V-front.jpg', 3, NOW()),
('https://images.expertreviews.co.uk/wp-content/uploads/2023/10/Xperia-10-V-9-scaled.jpeg', 3, NOW());

-- 🖥️ Televisores
INSERT INTO ProductoImagen (url, productoId, createdAt) VALUES
('https://www.lg.com/content/dam/channel/wcms/mx/images/tv/features/oled2023/TV-OLED-C3-05-Synergy-Bracket-Mobile.jpg', 4, NOW()),
('https://www.lg.com/ar/images/televisores/md07581378/gallery/medium11.jpg', 4, NOW()),
('https://media.flixcar.com/webp/synd-asset/Samsung-123166095-latin-qled-q60c-qn50q60capxpa-536876303--Download-Source--zoom.png', 5, NOW()),
('https://i0.wp.com/blog.son-video.com/wp-content/uploads/2024/01/TV-x-Phillips-Hue_Lifestyle.jpg?resize=696%2C383&ssl=1', 5, NOW()),
('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQpueyRwRAjGYbTqXOv3DM6lzkzWjfIfh4Hw&s', 6, NOW()),
('https://formulatv.ru/images/catalog/televizory/philips-43pus8008_108869_full.jpg', 6, NOW());

-- 💻 Notebooks
INSERT INTO ProductoImagen (url, productoId, createdAt) VALUES
('https://omnitech.ar/wp-content/uploads/2025/03/macbook-air-m2.jpg.webp', 7, NOW()),
('https://thedisconnekt.com/wp-content/uploads/2024/03/Apple-MacBook-Air-15-inch-23.jpg', 7, NOW()),
('https://ar-media.hptiendaenlinea.com/catalog/product/cache/b3b166914d87ce343d4dc5ec5117b502/9/1/91S43LA-1_T1717517862.png', 8, NOW()),
('https://acdn-us.mitiendanube.com/stores/001/907/418/products/3-144808ada911a9eaf117025781453077-1024-1024.webp', 8, NOW()),
('https://www.stec.com.ar/cdn/shop/files/D_NQ_NP_939290-MLU77147912887_062024-O.jpg?v=1734448575&width=2048', 9, NOW()),
('https://http2.mlstatic.com/D_NQ_NP_954700-MLU70878566482_082023-O.webp', 9, NOW());

-- ============================ PAQUETEBASE ============================
-- 📱 Paquete de celulares Apple
INSERT INTO PaqueteBase 
(nombre, descripcion, imagen_url, categoria_id, marcaId, createdAt, updatedAt)
VALUES
('Pack iPhone Experience', 'Paquete base de productos Apple: iPhone, accesorios y beneficios premium.', 
'https://packmojo.com/blog/images/2022/09/apple-rigid-box-packaging.jpg', 4, 1, NOW(), NOW());

-- 📱 Paquete de celulares Samsung
INSERT INTO PaqueteBase 
(nombre, descripcion, imagen_url, categoria_id, marcaId, createdAt, updatedAt)
VALUES
('Pack Galaxy Performance', 'Paquete Samsung con celular Galaxy y complementos oficiales.', 
'https://packagingguruji.com/wp-content/uploads/2022/01/Samsung-has-defined-its-mobile-packaging-with-Eco-Conscious-Packaging.jpg', 4, 2, NOW(), NOW());

-- 🖥️ Paquete de televisores LG
INSERT INTO PaqueteBase 
(nombre, descripcion, imagen_url, categoria_id, marcaId, createdAt, updatedAt)
VALUES
('Pack Smart TV LG', 'Televisor LG OLED más soporte de pared y extensión de garantía.', 
'https://www.lg.com/ar/images/microsite/2023/Sustainability/TV-OLED-Microsite-sustainability-03-ECO-PACKAGING-Mobile.jpg', 3, 4, NOW(), NOW());

-- 🖥️ Paquete de televisores Philips
INSERT INTO PaqueteBase 
(nombre, descripcion, imagen_url, categoria_id, marcaId, createdAt, updatedAt)
VALUES
('Pack Philips Ambilight', 'Televisor Philips Ambilight 4K con barra de sonido y control remoto inteligente.', 
'https://images-cdn.ubuy.co.in/64d72bbe4c4a947ff616a3dc-philips-43-class-4k-ultra-hd-2160p.jpg', 3, 5, NOW(), NOW());

-- 💻 Paquete de notebooks HP
INSERT INTO PaqueteBase 
(nombre, descripcion, imagen_url, categoria_id, marcaId, createdAt, updatedAt)
VALUES
('Pack Oficina HP', 'Notebook HP Pavilion más mouse inalámbrico y mochila ejecutiva.', 
'https://www.myhome.co.nz/wp-content/uploads/2022/04/Laptop-3.jpg', 4, 6, NOW(), NOW());

-- 💻 Paquete de notebooks Apple
INSERT INTO PaqueteBase 
(nombre, descripcion, imagen_url, categoria_id, marcaId, createdAt, updatedAt)
VALUES
('Pack Apple Productivity', 'MacBook Air M2 más accesorios esenciales y AppleCare.', 
'https://www.gentlepk.com/wp-content/uploads/2025/05/Apple-boxes-interact-with-a-users-perceptions.jpg', 4, 1, NOW(), NOW());

-- ============================ PAQUETEBASEPRODUCTO ============================
-- 📱 Pack iPhone Experience (Paquete 1) → iPhone 14
INSERT INTO PaqueteBaseProducto (productoId, paqueteBaseId)
VALUES
(1, 1);

-- 📱 Pack Galaxy Performance (Paquete 2) → Samsung Galaxy S23
INSERT INTO PaqueteBaseProducto (productoId, paqueteBaseId)
VALUES
(2, 2);

-- 🖥️ Pack Smart TV LG (Paquete 3) → LG OLED C3 55"
INSERT INTO PaqueteBaseProducto (productoId, paqueteBaseId)
VALUES
(4, 3);

-- 🖥️ Pack Philips Ambilight (Paquete 4) → Philips 43PUS8008
INSERT INTO PaqueteBaseProducto (productoId, paqueteBaseId)
VALUES
(6, 4);

-- 💻 Pack Oficina HP (Paquete 5) → HP Pavilion 15 y Lenovo IdeaPad 3
INSERT INTO PaqueteBaseProducto (productoId, paqueteBaseId)
VALUES
(8, 5),
(9, 5);

-- 💻 Pack Apple Productivity (Paquete 6) → MacBook Air M2 + iPhone 14
INSERT INTO PaqueteBaseProducto (productoId, paqueteBaseId)
VALUES
(7, 6),
(1, 6);

-- ============================ PAQUETEPUBLICADO ============================
-- 📦 Pack iPhone Experience publicado en Zona Norte (Activo)
INSERT INTO PaquetePublicado 
(paqueteBaseId, estadoId, zonaId, fecha_inicio, fecha_fin, cant_productos, monto_total, imagen_url, tipoPaquete, descuento, createdAt, updatedAt)
VALUES
(1, 1, 1, NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY), 50, 1200.00, 'https://static.rfstat.com/renderforest/images/v2/landing-pics/mockups/iphone/hero_slide_0.jpeg?v=18', 'SINERGICO', 10.0, NOW(), NOW());

-- 📦 Pack Galaxy Performance publicado en Zona Sur (Activo)
INSERT INTO PaquetePublicado 
(paqueteBaseId, estadoId, zonaId, fecha_inicio, fecha_fin, cant_productos, monto_total, imagen_url, tipoPaquete, descuento, createdAt, updatedAt)
VALUES
(2, 1, 2, NOW(), DATE_ADD(NOW(), INTERVAL 4 DAY), 40, 1100.00, 'https://img.global.news.samsung.com/global/wp-content/uploads/2023/02/%EA%B8%80%EB%A1%9C%EB%B2%8C-Featured-Stories-Thumbnail-728x410.jpg', 'SINERGICO', 15.0, NOW(), NOW());

-- 📦 Pack Smart TV LG publicado en CABA (Activo)
INSERT INTO PaquetePublicado 
(paqueteBaseId, estadoId, zonaId, fecha_inicio, fecha_fin, cant_productos, monto_total, imagen_url, tipoPaquete, descuento, createdAt, updatedAt)
VALUES
(3, 1, 4, NOW(), DATE_ADD(NOW(), INTERVAL 3 DAY), 25, 1800.00, 'https://www.lg.com/global/images/business/information-display/commercial-tv/md07574661/gallery/medium01.jpg', 'ENERGETICO', 20.0, NOW(), NOW());

-- 📦 Pack Philips Ambilight publicado en Zona Sur (Pendiente)
INSERT INTO PaquetePublicado 
(paqueteBaseId, estadoId, zonaId, fecha_inicio, fecha_fin, cant_productos, monto_total, imagen_url, tipoPaquete, descuento, createdAt, updatedAt)
VALUES
(4, 3, 2, NOW(), DATE_ADD(NOW(), INTERVAL 2 DAY), 30, 1000.00, 'https://www.philips.es/c-dam/b2c/tv/categorypage/master/oled-2024/oled-2023-thumbnail-l-m.jpg', 'ENERGETICO', 12.0, NOW(), NOW());

-- 📦 Pack Oficina HP publicado en Zona Oeste (Activo)
INSERT INTO PaquetePublicado 
(paqueteBaseId, estadoId, zonaId, fecha_inicio, fecha_fin, cant_productos, monto_total, imagen_url, tipoPaquete, descuento, createdAt, updatedAt)
VALUES
(5, 1, 3, NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY), 45, 950.00, 'https://www.muycomputerpro.com/wp-content/uploads/2015/03/HP_Care_Pack-1.jpeg', 'SINERGICO', 8.0, NOW(), NOW());

-- 📦 Pack Apple Productivity publicado en CABA (Activo)
INSERT INTO PaquetePublicado 
(paqueteBaseId, estadoId, zonaId, fecha_inicio, fecha_fin, cant_productos, monto_total, imagen_url, tipoPaquete, descuento, createdAt, updatedAt)
VALUES
(6, 1, 4, NOW(), DATE_ADD(NOW(), INTERVAL 10 DAY), 30, 1900.00, 'https://i.ytimg.com/vi/P-UifawCilA/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBx5Omr-Pgm8jU20l8i0KXkNUKAeQ', 'ENERGETICO', 5.0, NOW(), NOW());

-- ============================ PEDIDO ============================
-- Pedido 1: Admin compra 1 iPhone 14 del Pack iPhone Experience
INSERT INTO Pedido (usuarioId, paquetePublicadoId, estadoId, monto_total, descuento_aplicado, fecha, createdAt, updatedAt)
VALUES (1, 1, 2, 1080.00, 10.0, NOW(), NOW(), NOW()); -- Confirmado (1200 - 10% = 1080)

-- Pedido 2: Admin compra 2 Samsung Galaxy S23 del Pack Galaxy Performance
INSERT INTO Pedido (usuarioId, paquetePublicadoId, estadoId, monto_total, descuento_aplicado, fecha, createdAt, updatedAt)
VALUES (1, 2, 3, 1870.00, 15.0, NOW(), NOW(), NOW()); -- Pagado (2200 - 15% = 1870)

-- Pedido 3: Admin compra 1 LG OLED del Pack Smart TV LG
INSERT INTO Pedido (usuarioId, paquetePublicadoId, estadoId, monto_total, descuento_aplicado, fecha, createdAt, updatedAt)
VALUES (1, 3, 1, 1440.00, 20.0, NOW(), NOW(), NOW()); -- Pendiente (1800 - 20% = 1440)

-- Pedido 4: Admin compra 1 HP Pavilion y 1 Lenovo del Pack Oficina HP
INSERT INTO Pedido (usuarioId, paquetePublicadoId, estadoId, monto_total, descuento_aplicado, fecha, createdAt, updatedAt)
VALUES (1, 5, 4, 1610.00, 8.0, NOW(), NOW(), NOW()); -- Enviado (950 + 800 = 1750, 1750 - 8% = 1610)

-- Pedido 5: Juan Pérez compra 1 MacBook Air del Pack Apple Productivity
INSERT INTO Pedido (usuarioId, paquetePublicadoId, estadoId, monto_total, descuento_aplicado, fecha, createdAt, updatedAt)
VALUES (2, 6, 2, 1805.00, 5.0, NOW(), NOW(), NOW()); -- Confirmado (1900 - 5% = 1805)

-- ============================ PEDIDODETALLE ============================
-- Pedido 1: 1x iPhone 14
INSERT INTO PedidoDetalle (pedidoId, productoId, cantidad, precio_unitario, subtotal)
VALUES (1, 1, 1, 1080.00, 1080.00);

-- Pedido 2: 2x Samsung Galaxy S23
INSERT INTO PedidoDetalle (pedidoId, productoId, cantidad, precio_unitario, subtotal)
VALUES (2, 2, 2, 935.00, 1870.00); -- 1100 - 15% = 935 por unidad

-- Pedido 3: 1x LG OLED C3 55"
INSERT INTO PedidoDetalle (pedidoId, productoId, cantidad, precio_unitario, subtotal)
VALUES (3, 4, 1, 1440.00, 1440.00);

-- Pedido 4: 1x HP Pavilion + 1x Lenovo IdeaPad
INSERT INTO PedidoDetalle (pedidoId, productoId, cantidad, precio_unitario, subtotal)
VALUES 
(4, 8, 1, 874.00, 874.00), -- 950 - 8% = 874
(4, 9, 1, 736.00, 736.00); -- 800 - 8% = 736

-- Pedido 5: 1x MacBook Air M2
INSERT INTO PedidoDetalle (pedidoId, productoId, cantidad, precio_unitario, subtotal)
VALUES (5, 7, 1, 1805.00, 1805.00);

-- ============================ UPDATE USUARIOS ============================

-- 👤 Usuario admin (contraseña original: admin123 → nueva hasheada de Admin123)
UPDATE Usuario
SET contraseña = '$2b$10$bRN.9ubsi8pgl0Mun.oD/.dIMMmj2/gofIoiij5TyeEFVXFtLp/vW'
WHERE email = 'admin@admin.com';

-- 👤 Usuario cliente (contraseña original: clave123 → nueva hasheada de Clave123)
UPDATE Usuario
SET contraseña = '$2b$10$W/AjjH9ka.qZKrz5a20jGuicKvHYaOJTCMageZNaM2amDrI7Gup2i'
WHERE email = 'juanperez@example.com';