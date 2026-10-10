-- ================================================================
-- MERCADO SINÉRGICO — SCRIPT COMPLETO
-- 1. Correr: npx prisma migrate reset --force
-- 2. Abrir este archivo en MySQL Workbench → Ctrl+A → ejecutar
-- ================================================================

-- ============================ ROL ============================
-- id: 1=Administrador, 2=Usuario
INSERT INTO Rol (nombre) VALUES
('Administrador'),
('Usuario');

-- ============================ CATEGORIA ============================
-- id: 1=Automotor, 2=Electrodomésticos, 3=Televisores, 4=Tecnología
--     5=Hogar y Decoración, 6=Deportes y Fitness, 7=Alimentos y Bebidas
INSERT INTO Categoria (nombre) VALUES
('Automotor'),
('Electrodomésticos'),
('Televisores'),
('Tecnología'),
('Hogar y Decoración'),
('Deportes y Fitness'),
('Alimentos y Bebidas');

-- ============================ MARCA ============================
-- id: 1=Apple, 2=Samsung, 3=Sony, 4=LG, 5=Philips, 6=Otras
INSERT INTO Marca (nombre, createdAt, updatedAt) VALUES
('Apple',   NOW(), NOW()),
('Samsung', NOW(), NOW()),
('Sony',    NOW(), NOW()),
('LG',      NOW(), NOW()),
('Philips', NOW(), NOW()),
('Otras',   NOW(), NOW());

-- ============================ ESTADOPAQUETEPUBLICADO ============================
-- id: 1=Activo, 2=Completo, 3=Confirmado, 4=Entregado, 5=Cancelado
INSERT INTO EstadoPaquetePublicado (nombre) VALUES
('Activo'),
('Completo'),
('Confirmado'),
('Entregado'),
('Cancelado');

-- ============================ ESTADOPEDIDO ============================
-- id: 1=Pendiente, 2=Pagado, 3=Reembolsado, 4=En preparación, 5=En camino, 6=Recibido, 7=Reservado, 8=Cancelado
INSERT INTO EstadoPedido (nombre) VALUES
('Pendiente'),
('Pagado'),
('Reembolsado'),
('En preparación'),
('En camino'),
('Recibido'),
('Reservado'),
('Cancelado');

-- ============================ LOCALIDAD ============================
-- El catálogo se instala con la migración 20260927000000; no depende de IDs fijos.

-- ============================ USUARIO ============================
-- id: 1=Admin(Admin123), 2=Juan Pérez(Clave123)
-- id: 3=María, 4=Carlos, 5=Laura, 6=Pablo, 7=Ana  (todos: Clave123)
INSERT INTO Usuario (email, nombre, contraseña, telefono, fecha_nac, imagen_url, rolId, localidadId, createdAt, updatedAt) VALUES
('admin@admin.com',          'Administrador',  '$2b$10$bRN.9ubsi8pgl0Mun.oD/.dIMMmj2/gofIoiij5TyeEFVXFtLp/vW', '1122334455', '1990-01-01', 'https://www.pngmart.com/files/21/Admin-Profile-Vector-PNG-Photos.png',                                                                                    1, (SELECT id_localidad FROM Localidad WHERE nombre = 'CABA' AND activa = true), NOW(), NOW()),
('prueba@prueba.com',        'Juan Pérez',     '$2b$10$W/AjjH9ka.qZKrz5a20jGuicKvHYaOJTCMageZNaM2amDrI7Gup2i', '1199887766', '1995-05-15', 'https://res.cloudinary.com/dinntdzos/image/upload/v1762726834/mercado_sinergico/ggeuhzy1wglrgtu1a8jm.png', 2, (SELECT id_localidad FROM Localidad WHERE nombre = 'Morón' AND activa = true), NOW(), NOW()),
('maria.gomez@test.com',     'María Gómez',    '$2b$10$W/AjjH9ka.qZKrz5a20jGuicKvHYaOJTCMageZNaM2amDrI7Gup2i', '1155667788', '1992-03-14', 'https://i.pravatar.cc/150?img=47',                                                                                                               2, (SELECT id_localidad FROM Localidad WHERE nombre = 'CABA' AND activa = true), NOW(), NOW()),
('carlos.diaz@test.com',     'Carlos Díaz',    '$2b$10$W/AjjH9ka.qZKrz5a20jGuicKvHYaOJTCMageZNaM2amDrI7Gup2i', '1144556677', '1988-07-22', 'https://i.pravatar.cc/150?img=12',                                                                                                               2, (SELECT id_localidad FROM Localidad WHERE nombre = 'Vicente López' AND activa = true), NOW(), NOW()),
('laura.rodriguez@test.com', 'Laura Rodríguez','$2b$10$W/AjjH9ka.qZKrz5a20jGuicKvHYaOJTCMageZNaM2amDrI7Gup2i', '1166778899', '1995-11-05', 'https://i.pravatar.cc/150?img=23',                                                                                                               2, (SELECT id_localidad FROM Localidad WHERE nombre = 'Morón' AND activa = true), NOW(), NOW()),
('pablo.martinez@test.com',  'Pablo Martínez', '$2b$10$W/AjjH9ka.qZKrz5a20jGuicKvHYaOJTCMageZNaM2amDrI7Gup2i', '1177889900', '1990-01-30', 'https://i.pravatar.cc/150?img=68',                                                                                                               2, (SELECT id_localidad FROM Localidad WHERE nombre = 'Avellaneda' AND activa = true), NOW(), NOW()),
('ana.lopez@test.com',       'Ana López',      '$2b$10$W/AjjH9ka.qZKrz5a20jGuicKvHYaOJTCMageZNaM2amDrI7Gup2i', '1188990011', '1997-09-18', 'https://i.pravatar.cc/150?img=44',                                                                                                               2, (SELECT id_localidad FROM Localidad WHERE nombre = 'La Plata Centro' AND activa = true), NOW(), NOW());

-- ============================ DIRECCION ============================
INSERT INTO Direccion (usuarioId, localidadId, codigo_postal, calle, numero, piso, departamento) VALUES
(1, (SELECT id_localidad FROM Localidad WHERE nombre = 'CABA' AND activa = true), 1425, 'Av. Santa Fe',    1234,    5, 'A'),
(2, (SELECT id_localidad FROM Localidad WHERE nombre = 'Morón' AND activa = true), 1708, 'Av. Rivadavia',   9876, NULL, NULL),
(3, (SELECT id_localidad FROM Localidad WHERE nombre = 'CABA' AND activa = true), 1425, 'Av. Córdoba',     3500,    2, 'B'),
(4, (SELECT id_localidad FROM Localidad WHERE nombre = 'Vicente López' AND activa = true), 1638, 'Maipú',            456, NULL, NULL),
(5, (SELECT id_localidad FROM Localidad WHERE nombre = 'Morón' AND activa = true), 1708, 'Av. General Paz', 1200,    3, 'A'),
(6, (SELECT id_localidad FROM Localidad WHERE nombre = 'Avellaneda' AND activa = true), 1870, 'Mitre',            789, NULL, NULL),
(7, (SELECT id_localidad FROM Localidad WHERE nombre = 'La Plata Centro' AND activa = true), 1900, 'Av. 7',           2100,    1, 'C');

-- ============================ PLANTILLA ============================
-- id: 1=Celular, 2=Televisor, 3=Notebook
INSERT INTO Plantilla (nombre, createdAt, updatedAt) VALUES
('Plantilla Celular',   NOW(), NOW()),
('Plantilla Televisor', NOW(), NOW()),
('Plantilla Notebook',  NOW(), NOW());

-- ============================ CARACTERISTICA ============================
-- Celular(1): 1=Color, 2=Almacenamiento, 3=Pantalla, 4=RAM
INSERT INTO Caracteristica (nombre, plantillaId, createdAt, updatedAt) VALUES
('Color',                       1, NOW(), NOW()),
('Capacidad de almacenamiento', 1, NOW(), NOW()),
('Tamaño de pantalla',          1, NOW(), NOW()),
('Memoria RAM',                 1, NOW(), NOW());
-- Televisor(2): 5=Pulgadas, 6=Tipo pantalla, 7=Resolución, 8=Conectividad
INSERT INTO Caracteristica (nombre, plantillaId, createdAt, updatedAt) VALUES
('Pulgadas',        2, NOW(), NOW()),
('Tipo de pantalla',2, NOW(), NOW()),
('Resolución',      2, NOW(), NOW()),
('Conectividad',    2, NOW(), NOW());
-- Notebook(3): 9=Procesador, 10=RAM, 11=Almacenamiento, 12=SO
INSERT INTO Caracteristica (nombre, plantillaId, createdAt, updatedAt) VALUES
('Procesador',        3, NOW(), NOW()),
('Memoria RAM',       3, NOW(), NOW()),
('Almacenamiento',    3, NOW(), NOW()),
('Sistema operativo', 3, NOW(), NOW());

-- ============================ OPCION ============================
-- C1 Color:          1=Negro 2=Blanco 3=Azul 4=Rojo
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('Negro',1,NOW(),NOW()),('Blanco',1,NOW(),NOW()),('Azul',1,NOW(),NOW()),('Rojo',1,NOW(),NOW());
-- C2 Almacenamiento: 5=64GB 6=128GB 7=256GB 8=512GB
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('64 GB',2,NOW(),NOW()),('128 GB',2,NOW(),NOW()),('256 GB',2,NOW(),NOW()),('512 GB',2,NOW(),NOW());
-- C3 Pantalla:       9=5.5" 10=6.1" 11=6.7"
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('5.5"',3,NOW(),NOW()),('6.1"',3,NOW(),NOW()),('6.7"',3,NOW(),NOW());
-- C4 RAM Celular:    12=4GB 13=6GB 14=8GB
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('4 GB',4,NOW(),NOW()),('6 GB',4,NOW(),NOW()),('8 GB',4,NOW(),NOW());
-- C5 Pulgadas:       15=32" 16=43" 17=55" 18=65"
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('32"',5,NOW(),NOW()),('43"',5,NOW(),NOW()),('55"',5,NOW(),NOW()),('65"',5,NOW(),NOW());
-- C6 Tipo pantalla:  19=LED 20=OLED 21=QLED
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('LED',6,NOW(),NOW()),('OLED',6,NOW(),NOW()),('QLED',6,NOW(),NOW());
-- C7 Resolución:     22=HD 23=Full HD 24=4K 25=8K
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('HD',7,NOW(),NOW()),('Full HD',7,NOW(),NOW()),('4K',7,NOW(),NOW()),('8K',7,NOW(),NOW());
-- C8 Conectividad:   26=Wi-Fi 27=Bluetooth 28=HDMI 29=USB
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('Wi-Fi',8,NOW(),NOW()),('Bluetooth',8,NOW(),NOW()),('HDMI',8,NOW(),NOW()),('USB',8,NOW(),NOW());
-- C9 Procesador:     30=i5 31=i7 32=Ryzen5 33=Ryzen7
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('Intel i5',9,NOW(),NOW()),('Intel i7',9,NOW(),NOW()),('AMD Ryzen 5',9,NOW(),NOW()),('AMD Ryzen 7',9,NOW(),NOW());
-- C10 RAM Notebook:  34=8GB 35=16GB 36=32GB
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('8 GB',10,NOW(),NOW()),('16 GB',10,NOW(),NOW()),('32 GB',10,NOW(),NOW());
-- C11 Almacenamiento Notebook: 37=256SSD 38=512SSD 39=1TB
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('256 GB SSD',11,NOW(),NOW()),('512 GB SSD',11,NOW(),NOW()),('1 TB SSD',11,NOW(),NOW());
-- C12 SO:            40=Windows11 41=Linux 42=macOS
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('Windows 11',12,NOW(),NOW()),('Linux',12,NOW(),NOW()),('macOS',12,NOW(),NOW());

-- ============================ PRODUCTO ============================
-- id: 1=iPhone14  2=SamsungS23  3=SonyXperia
--     4=LG OLED   5=SamsungQLED 6=Philips
--     7=MacBook   8=HP Pavilion 9=Lenovo
INSERT INTO Producto (nombre, descripcion, precio, imagen_url, marca_id, categoria_id, plantillaId, stock, tipo, altura, ancho, profundidad, peso, createdAt, updatedAt) VALUES
('iPhone 14',         'Smartphone de Apple con pantalla de 6.1", 128 GB y chip A15 Bionic.',    1200.00, 'https://acdn-us.mitiendanube.com/stores/001/555/911/products/iphone-14-black-d61713d18bdf31d02417016951877100-1024-1024.webp',                  1, 4, 1, NULL, 'SINERGICO',  14.7,  7.1,  0.8,  0.17, NOW(), NOW()),
('Samsung Galaxy S23','Smartphone Samsung con 256 GB de almacenamiento y cámara triple.',        1100.00, 'https://http2.mlstatic.com/D_848869-CBT90467223350_082025-C.jpg',                                                                               2, 4, 1, NULL, 'ENERGICO', 15.0,  7.2,  0.8,  0.18, NOW(), NOW()),
('Sony Xperia 10 V',  'Celular Sony con pantalla OLED de 6.1" y batería de 5000 mAh.',           800.00, 'https://images-cdn.ubuy.co.in/66faadc7e1426368995da054-sony-xperia-10-v-xq-dc72-5g-dual-128gb.jpg',                                            3, 4, 1, NULL, 'SINERGICO',  15.2,  7.1,  0.8,  0.16, NOW(), NOW()),
('LG OLED C3 55"',    'Televisor OLED de 55" con resolución 4K y soporte Dolby Vision.',         1800.00, 'https://www.lg.com/content/dam/channel/wcms/mx/images/televisores/oled55c3psa_awm_enms_mx_c/gallery/large06.jpg',                              4, 3, 2, NULL, 'ENERGICO', 70.0, 123.0,  5.0, 18.0,  NOW(), NOW()),
('Samsung QLED Q60C', 'Televisor QLED de 50" con Quantum HDR y SmartThings integrado.',          1500.00, 'https://http2.mlstatic.com/D_NQ_NP_890431-MLU70332220536_072023-O.webp',                                                                       2, 3, 2, NULL, 'SINERGICO',  65.0, 112.0,  5.5, 16.5,  NOW(), NOW()),
('Philips 43PUS8008', 'Televisor LED 4K UHD de 43" con Ambilight y Android TV.',                 1000.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTaqu-K9cZ2B7O7q_5s0qDuD78PC2l8_323oA&s',                                              5, 3, 2, NULL, 'ENERGICO', 55.0,  96.0,  5.0, 13.0,  NOW(), NOW()),
('MacBook Air M2',    'Notebook de Apple con chip M2, pantalla Retina y 8 GB de RAM.',           1900.00, 'https://http2.mlstatic.com/D_NQ_NP_663606-MLA78669752141_082024-O.webp',                                                                       1, 4, 3, NULL, 'ENERGICO',  1.1,  30.0, 21.0,  1.24, NOW(), NOW()),
('HP Pavilion 15',    'Notebook HP con procesador Intel i5 y SSD de 512 GB.',                     950.00, 'https://i5.walmartimages.com/asr/762e3ce1-4e52-40fe-abd1-1a1e056d4895_2.f2b9c74ed7d0701637b067a44f89cca6.jpeg',                               6, 4, 3, NULL, 'SINERGICO',   1.9,  36.0, 24.0,  1.80, NOW(), NOW()),
('Lenovo IdeaPad 3',  'Notebook Lenovo con AMD Ryzen 5, 8 GB de RAM y 256 GB SSD.',               800.00, 'https://i5.walmartimages.com/asr/812648ff-28b6-4a80-b19e-21a722a3a2ee.79a703c8f6fa9663ca7da697ea9f74d0.jpeg',                                6, 4, 3, NULL, 'ENERGICO',  1.9,  36.0, 24.0,  1.65, NOW(), NOW());

-- ============================ PRODUCTOIMAGEN ============================
INSERT INTO ProductoImagen (url, productoId, createdAt) VALUES
-- iPhone 14 (1)
('https://cdn.accentuate.io/39884851707990/1677610349980/iPhone-14-Pro-Max-Glass---Side-(1).jpg?v=1677610349981', 1, NOW()),
('https://www.macstation.com.ar/web/image/product.template/63145/image_1024?unique=458b3d2', 1, NOW()),
-- Samsung S23 (2)
('https://m-cdn.phonearena.com/images/phones/83817-940/Samsung-Galaxy-S23-Ultra.jpg?w=1', 2, NOW()),
('https://tienda.claro.com.ar/staticContent/Claro/images/catalog/productos/646x1000/70011154_3.webp', 2, NOW()),
-- Sony Xperia (3)
('https://www.stuff.tv/wp-content/uploads/sites/2/2023/08/Sony-Xperia-10-V-front.jpg', 3, NOW()),
('https://images.expertreviews.co.uk/wp-content/uploads/2023/10/Xperia-10-V-9-scaled.jpeg', 3, NOW()),
-- LG OLED (4)
('https://www.lg.com/content/dam/channel/wcms/mx/images/tv/features/oled2023/TV-OLED-C3-05-Synergy-Bracket-Mobile.jpg', 4, NOW()),
('https://www.lg.com/ar/images/televisores/md07581378/gallery/medium11.jpg', 4, NOW()),
-- Samsung QLED (5)
('https://media.flixcar.com/webp/synd-asset/Samsung-123166095-latin-qled-q60c-qn50q60capxpa-536876303--Download-Source--zoom.png', 5, NOW()),
('https://i0.wp.com/blog.son-video.com/wp-content/uploads/2024/01/TV-x-Phillips-Hue_Lifestyle.jpg?resize=696%2C383&ssl=1', 5, NOW()),
-- Philips (6)
('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQpueyRwRAjGYbTqXOv3DM6lzkzWjfIfh4Hw&s', 6, NOW()),
('https://formulatv.ru/images/catalog/televizory/philips-43pus8008_108869_full.jpg', 6, NOW()),
-- MacBook (7)
('https://omnitech.ar/wp-content/uploads/2025/03/macbook-air-m2.jpg.webp', 7, NOW()),
('https://thedisconnekt.com/wp-content/uploads/2024/03/Apple-MacBook-Air-15-inch-23.jpg', 7, NOW()),
-- HP (8)
('https://ar-media.hptiendaenlinea.com/catalog/product/cache/b3b166914d87ce343d4dc5ec5117b502/9/1/91S43LA-1_T1717517862.png', 8, NOW()),
('https://acdn-us.mitiendanube.com/stores/001/907/418/products/3-144808ada911a9eaf117025781453077-1024-1024.webp', 8, NOW()),
-- Lenovo (9)
('https://www.stec.com.ar/cdn/shop/files/D_NQ_NP_939290-MLU77147912887_062024-O.jpg?v=1734448575&width=2048', 9, NOW()),
('https://http2.mlstatic.com/D_NQ_NP_954700-MLU70878566482_082023-O.webp', 9, NOW());

-- ============================ PRODUCTOVARIANTE ============================
-- iPhone(1): v1-5
INSERT INTO ProductoVariante (productoId, sku, stockFisico, precioExtra, activo, createdAt, updatedAt) VALUES
(1,'IPH14-NEG-128-61-4',NULL,  0,true,NOW(),NOW()),
(1,'IPH14-NEG-256-61-6',NULL, 50,true,NOW(),NOW()),
(1,'IPH14-BLA-128-61-4',NULL,  0,true,NOW(),NOW()),
(1,'IPH14-BLA-256-61-6',NULL, 50,true,NOW(),NOW()),
(1,'IPH14-AZU-512-67-8',NULL,150,true,NOW(),NOW());
-- Samsung(2): v6-9
INSERT INTO ProductoVariante (productoId, sku, stockFisico, precioExtra, activo, createdAt, updatedAt) VALUES
(2,'S23-NEG-128-61-6',15,  0,true,NOW(),NOW()),
(2,'S23-NEG-256-61-8',10, 80,true,NOW(),NOW()),
(2,'S23-BLA-256-67-8', 8,100,true,NOW(),NOW()),
(2,'S23-ROJ-512-67-8', 5,200,true,NOW(),NOW());
-- Sony(3): v10-12
INSERT INTO ProductoVariante (productoId, sku, stockFisico, precioExtra, activo, createdAt, updatedAt) VALUES
(3,'XPERIA-NEG-64-55-4', NULL, 0,true,NOW(),NOW()),
(3,'XPERIA-BLA-128-61-6',NULL,40,true,NOW(),NOW()),
(3,'XPERIA-AZU-256-61-8',NULL,80,true,NOW(),NOW());
-- LG(4): v13-15
INSERT INTO ProductoVariante (productoId, sku, stockFisico, precioExtra, activo, createdAt, updatedAt) VALUES
(4,'LG-55-OLED-4K-WIFI',12,  0,true,NOW(),NOW()),
(4,'LG-55-OLED-4K-BT',  8, 50,true,NOW(),NOW()),
(4,'LG-65-OLED-8K-HDMI',5,400,true,NOW(),NOW());
-- SamsungQLED(5): v16-18
INSERT INTO ProductoVariante (productoId, sku, stockFisico, precioExtra, activo, createdAt, updatedAt) VALUES
(5,'SAM-43-QLED-FHD-WIFI',NULL,  0,true,NOW(),NOW()),
(5,'SAM-50-QLED-4K-USB',  NULL,100,true,NOW(),NOW()),
(5,'SAM-55-QLED-4K-HDMI', NULL,150,true,NOW(),NOW());
-- Philips(6): v19-21
INSERT INTO ProductoVariante (productoId, sku, stockFisico, precioExtra, activo, createdAt, updatedAt) VALUES
(6,'PHI-32-LED-HD-WIFI', 20,  0,true,NOW(),NOW()),
(6,'PHI-43-LED-FHD-BT',  15, 60,true,NOW(),NOW()),
(6,'PHI-43-OLED-4K-HDMI',10,120,true,NOW(),NOW());
-- MacBook(7): v22-24
INSERT INTO ProductoVariante (productoId, sku, stockFisico, precioExtra, activo, createdAt, updatedAt) VALUES
(7,'MAC-I7-8-256-MAC', 10,  0,true,NOW(),NOW()),
(7,'MAC-I7-16-512-MAC', 7,200,true,NOW(),NOW()),
(7,'MAC-R7-16-1TB-MAC', 5,400,true,NOW(),NOW());
-- HP(8): v25-27
INSERT INTO ProductoVariante (productoId, sku, stockFisico, precioExtra, activo, createdAt, updatedAt) VALUES
(8,'HP-I5-8-256-WIN', NULL,  0,true,NOW(),NOW()),
(8,'HP-I5-16-512-WIN',NULL,100,true,NOW(),NOW()),
(8,'HP-R5-8-256-LIN', NULL,-50,true,NOW(),NOW());
-- Lenovo(9): v28-30
INSERT INTO ProductoVariante (productoId, sku, stockFisico, precioExtra, activo, createdAt, updatedAt) VALUES
(9,'LEN-R5-8-256-WIN', 18,  0,true,NOW(),NOW()),
(9,'LEN-R5-16-512-WIN',12,120,true,NOW(),NOW()),
(9,'LEN-I5-8-512-LIN',  8, 80,true,NOW(),NOW());

-- ============================ PRODUCTOVARIANTEOPCION ============================
-- v1: iPhone Negro 128GB 6.1" 4GB
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (1,1,1),(1,2,6),(1,3,10),(1,4,12);
-- v2: iPhone Negro 256GB 6.1" 6GB
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (2,1,1),(2,2,7),(2,3,10),(2,4,13);
-- v3: iPhone Blanco 128GB 6.1" 4GB
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (3,1,2),(3,2,6),(3,3,10),(3,4,12);
-- v4: iPhone Blanco 256GB 6.1" 6GB
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (4,1,2),(4,2,7),(4,3,10),(4,4,13);
-- v5: iPhone Azul 512GB 6.7" 8GB
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (5,1,3),(5,2,8),(5,3,11),(5,4,14);
-- v6: Samsung Negro 128GB 6.1" 6GB
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (6,1,1),(6,2,6),(6,3,10),(6,4,13);
-- v7: Samsung Negro 256GB 6.1" 8GB
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (7,1,1),(7,2,7),(7,3,10),(7,4,14);
-- v8: Samsung Blanco 256GB 6.7" 8GB
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (8,1,2),(8,2,7),(8,3,11),(8,4,14);
-- v9: Samsung Rojo 512GB 6.7" 8GB
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (9,1,4),(9,2,8),(9,3,11),(9,4,14);
-- v10: Sony Negro 64GB 5.5" 4GB
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (10,1,1),(10,2,5),(10,3,9),(10,4,12);
-- v11: Sony Blanco 128GB 6.1" 6GB
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (11,1,2),(11,2,6),(11,3,10),(11,4,13);
-- v12: Sony Azul 256GB 6.1" 8GB
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (12,1,3),(12,2,7),(12,3,10),(12,4,14);
-- v13: LG 55" OLED 4K WiFi
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (13,5,17),(13,6,20),(13,7,24),(13,8,26);
-- v14: LG 55" OLED 4K Bluetooth
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (14,5,17),(14,6,20),(14,7,24),(14,8,27);
-- v15: LG 65" OLED 8K HDMI
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (15,5,18),(15,6,20),(15,7,25),(15,8,28);
-- v16: Samsung QLED 43" FHD WiFi
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (16,5,16),(16,6,21),(16,7,23),(16,8,26);
-- v17: Samsung QLED 55" 4K USB
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (17,5,17),(17,6,21),(17,7,24),(17,8,29);
-- v18: Samsung QLED 55" 4K HDMI
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (18,5,17),(18,6,21),(18,7,24),(18,8,28);
-- v19: Philips 32" LED HD WiFi
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (19,5,15),(19,6,19),(19,7,22),(19,8,26);
-- v20: Philips 43" LED FHD Bluetooth
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (20,5,16),(20,6,19),(20,7,23),(20,8,27);
-- v21: Philips 43" OLED 4K HDMI
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (21,5,16),(21,6,20),(21,7,24),(21,8,28);
-- v22: MacBook i7 8GB 256SSD macOS
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (22,9,31),(22,10,34),(22,11,37),(22,12,42);
-- v23: MacBook i7 16GB 512SSD macOS
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (23,9,31),(23,10,35),(23,11,38),(23,12,42);
-- v24: MacBook Ryzen7 16GB 1TB macOS
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (24,9,33),(24,10,35),(24,11,39),(24,12,42);
-- v25: HP i5 8GB 256SSD Win11
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (25,9,30),(25,10,34),(25,11,37),(25,12,40);
-- v26: HP i5 16GB 512SSD Win11
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (26,9,30),(26,10,35),(26,11,38),(26,12,40);
-- v27: HP Ryzen5 8GB 256SSD Linux
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (27,9,32),(27,10,34),(27,11,37),(27,12,41);
-- v28: Lenovo Ryzen5 8GB 256SSD Win11
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (28,9,32),(28,10,34),(28,11,37),(28,12,40);
-- v29: Lenovo Ryzen5 16GB 512SSD Win11
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (29,9,32),(29,10,35),(29,11,38),(29,12,40);
-- v30: Lenovo i5 8GB 512SSD Linux
INSERT INTO ProductoVarianteOpcion (varianteId,caracteristicaId,opcionId) VALUES (30,9,30),(30,10,34),(30,11,38),(30,12,41);

-- ============================ PAQUETEBASE ============================
-- id: 1=iPhone Experience  2=Galaxy Performance  3=Smart TV LG
--     4=Philips Ambilight   5=Oficina HP          6=Apple Productivity
--     7=Tech Combo          8=Entretenimiento     9=Home Office Pro
--     10=Apple Ecosystem    11=Sony Mobile
INSERT INTO PaqueteBase (nombre, descripcion, imagen_url, categoria_id, marcaId, createdAt, updatedAt) VALUES
('Pack iPhone Experience',    'Paquete base de productos Apple: iPhone, accesorios y beneficios premium.',
 'https://packmojo.com/blog/images/2022/09/apple-rigid-box-packaging.jpg', 4, 1, NOW(), NOW()),
('Pack Galaxy Performance',   'Paquete Samsung con celular Galaxy y complementos oficiales.',
 'https://packagingguruji.com/wp-content/uploads/2022/01/Samsung-has-defined-its-mobile-packaging-with-Eco-Conscious-Packaging.jpg', 4, 2, NOW(), NOW()),
('Pack Smart TV LG',          'Televisor LG OLED más soporte de pared y extensión de garantía.',
 'https://www.lg.com/ar/images/microsite/2023/Sustainability/TV-OLED-Microsite-sustainability-03-ECO-PACKAGING-Mobile.jpg', 3, 4, NOW(), NOW()),
('Pack Philips Ambilight',    'Televisor Philips Ambilight 4K con barra de sonido y control remoto inteligente.',
 'https://images-cdn.ubuy.co.in/64d72bbe4c4a947ff616a3dc-philips-43-class-4k-ultra-hd-2160p.jpg', 3, 5, NOW(), NOW()),
('Pack Oficina HP',           'Notebook HP Pavilion más mouse inalámbrico y mochila ejecutiva.',
 'https://www.myhome.co.nz/wp-content/uploads/2022/04/Laptop-3.jpg', 4, 6, NOW(), NOW()),
('Pack Apple Productivity',   'MacBook Air M2 más accesorios esenciales y AppleCare.',
 'https://www.gentlepk.com/wp-content/uploads/2025/05/Apple-boxes-interact-with-a-users-perceptions.jpg', 4, 1, NOW(), NOW()),
('Pack Tech Combo',           'Paquete combinado con smartphones Samsung y Sony al mejor precio.',
 'https://img.global.news.samsung.com/global/wp-content/uploads/2023/02/%EA%B8%80%EB%A1%9C%EB%B2%8C-Featured-Stories-Thumbnail-728x410.jpg', 4, 2, NOW(), NOW()),
('Pack Entretenimiento Total','Los mejores televisores LG y Philips para tu hogar.',
 'https://www.lg.com/ar/images/televisores/md07581378/gallery/medium01.jpg', 3, 4, NOW(), NOW()),
('Pack Home Office Pro',      'Todo lo que necesitás para trabajar desde casa: notebooks Lenovo y HP.',
 'https://www.myhome.co.nz/wp-content/uploads/2022/04/Laptop-3.jpg', 4, 6, NOW(), NOW()),
('Pack Apple Ecosystem',      'iPhone 14 y MacBook Air M2: el ecosistema Apple completo.',
 'https://www.gentlepk.com/wp-content/uploads/2025/05/Apple-boxes-interact-with-a-users-perceptions.jpg', 4, 1, NOW(), NOW()),
('Pack Sony Mobile',          'Paquete exclusivo Sony Xperia para los que eligen calidad japonesa.',
 'https://images-cdn.ubuy.co.in/66faadc7e1426368995da054-sony-xperia-10-v-xq-dc72-5g-dual-128gb.jpg', 4, 3, NOW(), NOW());

-- ============================ PAQUETEBASEPRODUCTO ============================
INSERT INTO PaqueteBaseProducto (productoId, paqueteBaseId) VALUES
(1, 1),         -- iPhone Experience → iPhone 14
(2, 2),         -- Galaxy Performance → Samsung S23
(4, 3),         -- Smart TV LG → LG OLED
(6, 4),         -- Philips Ambilight → Philips
(8, 5),(9, 5),  -- Oficina HP → HP + Lenovo
(7, 6),(1, 6),  -- Apple Productivity → MacBook + iPhone
(2, 7),(3, 7),  -- Tech Combo → Samsung + Sony
(4, 8),(6, 8),  -- Entretenimiento → LG + Philips
(9, 9),(8, 9),  -- Home Office Pro → Lenovo + HP
(1,10),(7,10),  -- Apple Ecosystem → iPhone + MacBook
(3,11);         -- Sony Mobile → Sony

-- ============================ PAQUETEPUBLICADO ============================
-- id: 1=iPhone Activo        2=Galaxy Activo
--     3=LG Activo            4=Philips Pendiente
--     5=HP Activo          6=Apple Activo
--     7=TechCombo Activo   8=Entretenimiento EnPrep(8)
--     9=HomeOffice Final(9) 10=AppleEco Activo
--     11=Sony Cancelado(4)
INSERT INTO PaquetePublicado (nombre, paqueteBaseId, estadoId, fecha_inicio, fecha_fin, cant_productos, cant_productos_reservados, cant_usuarios_registrados, monto_total, imagen_url, tipo, descuento, createdAt, updatedAt) VALUES
('iPhone Activo',           1, 1, NOW(),                            DATE_ADD(NOW(), INTERVAL  5 DAY), 50,  0,  0, 1200.00, 'https://static.rfstat.com/renderforest/images/v2/landing-pics/mockups/iphone/hero_slide_0.jpeg?v=18',                                                                                                            'SINERGICO',  10.0, NOW(), NOW()),
('Galaxy Activo',         2, 1, NOW(),                            DATE_ADD(NOW(), INTERVAL  4 DAY), 40,  0,  0, 1100.00, 'https://img.global.news.samsung.com/global/wp-content/uploads/2023/02/%EA%B8%80%EB%A1%9C%EB%B2%8C-Featured-Stories-Thumbnail-728x410.jpg',                                                                     'ENERGICO', 15.0, NOW(), NOW()),
('LG Activo',               3, 1, NOW(),                            DATE_ADD(NOW(), INTERVAL  3 DAY), 25,  0,  0, 1800.00, 'https://www.lg.com/global/images/business/information-display/commercial-tv/md07574661/gallery/medium01.jpg',                                                                                                   'ENERGICO', 20.0, NOW(), NOW()),
('Philips Pendiente',      4, 3, NOW(),                            DATE_ADD(NOW(), INTERVAL  2 DAY), 30,  0,  0, 1000.00, 'https://www.philips.es/c-dam/b2c/tv/categorypage/master/oled-2024/oled-2023-thumbnail-l-m.jpg',                                                                                                                 'ENERGICO', 12.0, NOW(), NOW()),
('HP Activo',             5, 1, NOW(),                            DATE_ADD(NOW(), INTERVAL  1 DAY), 45,  0,  0,  950.00, 'https://www.muycomputerpro.com/wp-content/uploads/2015/03/HP_Care_Pack-1.jpeg',                                                                                                                                 'SINERGICO',   8.0, NOW(), NOW()),
('Apple Activo',             6, 1, NOW(),                            DATE_ADD(NOW(), INTERVAL 10 DAY), 30,  0,  0, 1900.00, 'https://i.ytimg.com/vi/P-UifawCilA/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBx5Omr-Pgm8jU20l8i0KXkNUKAeQ',                                                              'ENERGICO',  5.0, NOW(), NOW()),
('TechCombo Activo',      7, 1, NOW(),                            DATE_ADD(NOW(), INTERVAL  7 DAY), 60,  0,  0, 1900.00, 'https://img.global.news.samsung.com/global/wp-content/uploads/2023/02/%EA%B8%80%EB%A1%9C%EB%B2%8C-Featured-Stories-Thumbnail-728x410.jpg',                                                                     'ENERGICO', 12.0, NOW(), NOW()),
('Entretenimiento EnPrep',  8, 3, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL  2 DAY), 30, 22, 18, 2800.00, 'https://www.lg.com/global/images/business/information-display/commercial-tv/md07574661/gallery/medium01.jpg',                                                                                                   'ENERGICO', 18.0, NOW(), NOW()),
('HomeOffice Final',      9, 4, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL  5 DAY), 50, 50, 40, 1750.00, 'https://www.muycomputerpro.com/wp-content/uploads/2015/03/HP_Care_Pack-1.jpeg',                                                                                                                                 'SINERGICO',  10.0, NOW(), NOW()),
('AppleEco Activo',        10, 1, NOW(),                            DATE_ADD(NOW(), INTERVAL  6 DAY), 40,  0,  0, 3100.00, 'https://i.ytimg.com/vi/P-UifawCilA/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBx5Omr-Pgm8jU20l8i0KXkNUKAeQ',                                                              'SINERGICO',   7.0, NOW(), NOW()),
('Sony Cancelado',          11, 5, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL  8 DAY), 25, 10,  8,  800.00, 'https://images-cdn.ubuy.co.in/66faadc7e1426368995da054-sony-xperia-10-v-xq-dc72-5g-dual-128gb.jpg',                                                                                                            'ENERGICO',  5.0, NOW(), NOW());

-- ============================ DISPONIBILIDADVARIANTEPAQUETE ============================
INSERT INTO DisponibilidadVariantePaquete (varianteId, paquetePublicadoId, activo, createdAt, updatedAt) VALUES
-- PP1: iPhone Experience
(1,1,true,NOW(),NOW()),(2,1,true,NOW(),NOW()),(3,1,true,NOW(),NOW()),(4,1,true,NOW(),NOW()),
-- PP2: Galaxy Performance
(6,2,true,NOW(),NOW()),(7,2,true,NOW(),NOW()),(8,2,true,NOW(),NOW()),
-- PP3: Smart TV LG
(13,3,true,NOW(),NOW()),(14,3,true,NOW(),NOW()),
-- PP4: Philips Ambilight
(19,4,true,NOW(),NOW()),(20,4,true,NOW(),NOW()),(21,4,true,NOW(),NOW()),
-- PP5: Oficina HP
(25,5,true,NOW(),NOW()),(26,5,true,NOW(),NOW()),(28,5,true,NOW(),NOW()),(29,5,true,NOW(),NOW()),
-- PP6: Apple Productivity
(22,6,true,NOW(),NOW()),(23,6,true,NOW(),NOW()),(1,6,true,NOW(),NOW()),(2,6,true,NOW(),NOW()),
-- PP7: Tech Combo
(6,7,true,NOW(),NOW()),(7,7,true,NOW(),NOW()),(8,7,true,NOW(),NOW()),(10,7,true,NOW(),NOW()),(11,7,true,NOW(),NOW()),
-- PP8: Entretenimiento Total
(13,8,true,NOW(),NOW()),(14,8,true,NOW(),NOW()),(15,8,true,NOW(),NOW()),(19,8,true,NOW(),NOW()),(20,8,true,NOW(),NOW()),(21,8,true,NOW(),NOW()),
-- PP9: Home Office Pro
(25,9,true,NOW(),NOW()),(26,9,true,NOW(),NOW()),(28,9,true,NOW(),NOW()),(29,9,true,NOW(),NOW()),
-- PP10: Apple Ecosystem
(1,10,true,NOW(),NOW()),(2,10,true,NOW(),NOW()),(3,10,true,NOW(),NOW()),(22,10,true,NOW(),NOW()),(23,10,true,NOW(),NOW()),
-- PP11: Sony Mobile
(10,11,true,NOW(),NOW()),(11,11,true,NOW(),NOW()),(12,11,true,NOW(),NOW());

-- ============================ PEDIDO ============================
-- id 1-5: originales  |  id 6-15: usuarios ficticios
INSERT INTO Pedido (usuarioId, paquetePublicadoId, estadoId, monto_total, descuento_aplicado, fecha, createdAt, updatedAt) VALUES
-- Originales
(1, 1, 2, 1080.00, 10.0, NOW(),                            NOW(), NOW()),
(1, 2, 3,  935.00, 15.0, NOW(),                            NOW(), NOW()),
(1, 3, 1, 1440.00, 20.0, NOW(),                            NOW(), NOW()),
(1, 5, 4, 1610.00,  8.0, NOW(),                            NOW(), NOW()),
(2, 6, 2, 1805.00,  5.0, NOW(),                            NOW(), NOW()),
-- Nuevos (usuarios ficticios)
(3, 7, 2, 1672.00, 12.0, NOW(),                            NOW(), NOW()),
(4, 7, 1,  704.00, 12.0, NOW(),                            NOW(), NOW()),
(5, 8, 3, 1476.00, 18.0, DATE_SUB(NOW(), INTERVAL 5 DAY),  NOW(), NOW()),
(6, 8, 3,  820.00, 18.0, DATE_SUB(NOW(), INTERVAL 4 DAY),  NOW(), NOW()),
(7, 8, 4, 1476.00, 18.0, DATE_SUB(NOW(), INTERVAL 3 DAY),  NOW(), NOW()),
(3, 9, 5,  720.00, 10.0, DATE_SUB(NOW(), INTERVAL 8 DAY),  NOW(), NOW()),
(4, 9, 5, 1485.00, 10.0, DATE_SUB(NOW(), INTERVAL 7 DAY),  NOW(), NOW()),
(5,10, 1, 2883.00,  7.0, NOW(),                            NOW(), NOW()),
(7,10, 2, 1116.00,  7.0, NOW(),                            NOW(), NOW()),
(6,11, 6,  760.00,  5.0, DATE_SUB(NOW(), INTERVAL 10 DAY), NOW(), NOW());

-- ============================ PEDIDODETALLE ============================
INSERT INTO PedidoDetalle (pedidoId, productoId, varianteId, cantidad, precio_unitario, subtotal) VALUES
-- p1: iPhone Negro 128GB
(1, 1,  1, 1, 1080.00, 1080.00),
-- p2: Samsung Negro 256GB
(2, 2,  7, 1,  935.00,  935.00),
-- p3: LG OLED 55" WiFi
(3, 4, 13, 1, 1440.00, 1440.00),
-- p4: HP i5 8GB + Lenovo Ryzen5 8GB
(4, 8, 25, 1,  874.00,  874.00),
(4, 9, 28, 1,  736.00,  736.00),
-- p5: MacBook i7 8GB
(5, 7, 22, 1, 1805.00, 1805.00),
-- p6: María → Samsung Negro 128GB + Sony Blanco 128GB
(6, 2,  6, 1,  968.00,  968.00),
(6, 3, 11, 1,  704.00,  704.00),
-- p7: Carlos → Sony Negro 64GB
(7, 3, 10, 1,  704.00,  704.00),
-- p8: Laura → LG OLED 55" WiFi + Philips 43" FHD
(8, 4, 13, 1, 1476.00, 1476.00),
(8, 6, 20, 1,  869.60,  869.60),
-- p9: Pablo → Philips 43" OLED 4K
(9, 6, 21, 1,  820.00,  820.00),
-- p10: Ana → LG OLED 55" WiFi + Philips 32" HD
(10, 4, 13, 1, 1476.00, 1476.00),
(10, 6, 19, 1,  820.00,  820.00),
-- p11: María → Lenovo Ryzen5 8GB
(11, 9, 28, 1,  720.00,  720.00),
-- p12: Carlos → HP i5 8GB + Lenovo Ryzen5 16GB
(12, 8, 25, 1,  855.00,  855.00),
(12, 9, 29, 1,  630.00,  630.00),
-- p13: Laura → iPhone Blanco 128GB + MacBook i7 16GB
(13, 1,  3, 1, 1116.00, 1116.00),
(13, 7, 23, 1, 1767.00, 1767.00),
-- p14: Ana → iPhone Negro 128GB
(14, 1,  1, 1, 1116.00, 1116.00),
-- p15: Pablo → Sony Azul 256GB
(15, 3, 12, 1,  760.00,  760.00);