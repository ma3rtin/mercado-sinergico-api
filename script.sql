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
('En Preparación'),
('Enviado'),
('Entregado'),
('Cancelado');

-- ============================ LOCALIDAD ============================
INSERT INTO localidad (nombre, codigo_postal) VALUES
('Balvanera', 1001),
('San Nicolás', 1002),
('Monserrat', 1003),
('San Telmo', 1004),
('Constitución', 1005),
('San Cristóbal', 1006),
('Puerto Madero', 1007),
('Retiro', 1008),
('Palermo', 1009),
('Recoleta', 1010),
('Belgrano', 1011),
('Núñez', 1012),
('Colegiales', 1013),
('Saavedra', 1014),
('Almagro', 1015),
('Caballito', 1016),
('Villa Crespo', 1017),
('Boedo', 1018),
('Parque Chacabuco', 1019),
('Flores', 1020),
('Floresta', 1021),
('Villa General Mitre', 1022),
('Villa Santa Rita', 1023),
('Villa del Parque', 1024),
('Villa Devoto', 1025),
('Agronomía', 1026),
('Paternal', 1027),
('La Boca', 1028),
('Barracas', 1029),
('Parque Patricios', 1030),
('Nueva Pompeya', 1031),
('Villa Soldati', 1032),
('Villa Riachuelo', 1033),
('Villa Lugano', 1034),
('Parque Avellaneda', 1035),
('Mataderos', 1036),
('Liniers', 1037),
('Versalles', 1038),
('Monte Castro', 1039),
('Villa Luro', 1040),
('Vicente López', 1041),
('Olivos', 1042),
('Florida', 1043),
('Florida Oeste', 1044),
('Munro', 1045),
('Carapachay', 1046),
('Villa Martelli', 1047),
('La Lucila', 1048),
('Villa Adelina (parte)', 1049),
('San Isidro', 1050),
('Acassuso', 1051),
('Beccar', 1052),
('Boulogne', 1053),
('Martínez', 1054),
('Villa Adelina (parte)', 1055),
('San Fernando', 1056),
('Victoria', 1057),
('Virreyes', 1058),
('Islas (parte rural)', 1059),
('Tigre', 1060),
('Benavídez', 1061),
('Don Torcuato', 1062),
('General Pacheco', 1063),
('El Talar', 1064),
('Troncos del Talar', 1065),
('Rincón de Milberg', 1066),
('Ricardo Rojas', 1067),
('Dique Luján', 1068),
('Belén de Escobar', 1069),
('Garín', 1070),
('Ingeniero Maschwitz', 1071),
('Matheu', 1072),
('Maquinista F. Savio', 1073),
('Loma Verde', 1074),
('Puerto Paraná', 1075),
('Pilar', 1076),
('Del Viso', 1077),
('Fátima', 1078),
('La Lonja', 1079),
('Manzanares', 1080),
('Presidente Derqui', 1081),
('Villa Astolfi', 1082),
('Zelaya', 1083),
('San Martín', 1084),
('Villa Ballester', 1085),
('Villa Maipú', 1086),
('Villa Lynch', 1087),
('San Andrés', 1088),
('José León Suárez', 1089),
('Billinghurst', 1090),
('Loma Hermosa', 1091),
('Caseros', 1092),
('Ciudadela', 1093),
('Sáenz Peña', 1094),
('Santos Lugares', 1095),
('Villa Bosch', 1096),
('Villa Raffo', 1097),
('Villa Sarmiento (parte)', 1098),
('Ciudad Jardín', 1099),
('José Ingenieros', 1100),
('Pablo Podestá', 1101),
('Grand Bourg', 1102),
('Los Polvorines', 1103),
('Ingeniero Pablo Nogués', 1104),
('Tortuguitas', 1105),
('Villa de Mayo', 1106),
('Ing. Adolfo Sourdeaux', 1107),
('Tierras Altas', 1108),
('San Miguel', 1109),
('Bella Vista', 1110),
('Muñiz', 1111),
('Santa María', 1112),
('Campo de Mayo (parcial)', 1113),
('José C. Paz (parte Norte)', 1114),
('José C. Paz (parte Sur)', 1115),
('Sol y Verde', 1116),
('Frino', 1117),
('Gral. Rodríguez', 1118),
('Las Malvinas', 1119),
('Altamira', 1120),
('Agua de Oro', 1121),
('Baldomero Gigli', 1122),
('Morón', 1123),
('Castelar', 1124),
('Haedo', 1125),
('El Palomar', 1126),
('Villa Sarmiento (parte)', 1127),
('Hurlingham', 1128),
('Villa Tesei', 1129),
('William C. Morris', 1130),
('Ituzaingó', 1131),
('Villa Udaondo', 1132),
('Merlo', 1133),
('San Antonio de Padua', 1134),
('Libertad', 1135),
('Mariano Acosta', 1136),
('Parque San Martín', 1137),
('Pontevedra', 1138),
('Moreno', 1139),
('Paso del Rey', 1140),
('La Reja', 1141),
('Francisco Álvarez', 1142),
('Cuartel V', 1143),
('Trujui', 1144),
('San Justo', 1145),
('Ramos Mejía', 1146),
('Lomas del Mirador', 1147),
('Ciudad Evita', 1148),
('Villa Luzuriaga', 1149),
('Tapiales', 1150),
('Aldo Bonzi', 1151),
('Villa Celina', 1152),
('González Catán', 1153),
('Gregorio de Laferrere', 1154),
('Isidro Casanova', 1155),
('Rafael Castillo', 1156),
('Virrey del Pino', 1157),
('20 de Junio', 1158),
('Crovara (barrio)', 1159),
('El Palomar (parte)', 1160),
('Marcos Paz', 1161),
('Elías Romero', 1162),
('Santa Rosa', 1163),
('Lisandro de la Torre', 1164),
('Santa Marta', 1165),
('Avellaneda', 1166),
('Crucecita', 1167),
('Dock Sud', 1168),
('Gerli (Este)', 1169),
('Piñeyro', 1170),
('Sarandí', 1171),
('Villa Domínico', 1172),
('Wilde', 1173),
('Lanús (Este/Oeste)', 1174),
('Remedios de Escalada', 1175),
('Monte Chingolo', 1176),
('Valentín Alsina', 1177),
('Gerli (Oeste)', 1178),
('Villa Caraza', 1179),
('Villa Fiorito (parte)', 1180),
('Lomas de Zamora', 1181),
('Banfield', 1182),
('Temperley', 1183),
('Llavallol', 1184),
('Turdera', 1185),
('Villa Centenario', 1186),
('Villa Fiorito (parte)', 1187),
('Ingeniero Budge', 1188),
('Adrogué', 1189),
('Burzaco', 1190),
('Glew', 1191),
('Longchamps', 1192),
('Malvinas Argentinas', 1193),
('Ministro Rivadavia', 1194),
('José Mármol', 1195),
('Rafael Calzada', 1196),
('San Francisco Solano (parte)', 1197),
('Claypole', 1198),
('Don Orione (barrio)', 1199),
('Barrio San José', 1200),
('Quilmes', 1201),
('Bernal', 1202),
('Ezpeleta', 1203),
('San Francisco Solano (parte)', 1204),
('Don Bosco', 1205),
('Villa La Florida', 1206),
('Berazategui', 1207),
('Plátanos', 1208),
('Ranelagh', 1209),
('Sourigues', 1210),
('Juan María Gutiérrez', 1211),
('Hudson', 1212),
('Pereyra', 1213),
('El Pato', 1214),
('Cruce Varela', 1215),
('San Juan Bautista', 1216),
('Bosques', 1217),
('E. S. Zeballos', 1218),
('Gdor. Julio A. Costa', 1219),
('Ing. Allan', 1220),
('Villa Brown', 1221),
('Villa Santa Rosa', 1222),
('Monte Grande', 1223),
('Nueve de Abril', 1224),
('Canning (Este)', 1225),
('El Jagüel', 1226),
('Luis Guillón', 1227),
('Ezeiza', 1228),
('Canning (Oeste)', 1229),
('C. Spegazzini', 1230),
('La Unión', 1231),
('Tristán Suárez', 1232),
('Aeropuerto Ezeiza', 1233),
('San Vicente', 1234),
('Alejandro Korn', 1235),
('Domselaar', 1236),
('Guernica (parte Norte)', 1237),
('Guernica (parte Sur)', 1238),
('La Plata', 1239),
('Tolosa', 1240),
('Ringuelet', 1241),
('Gonnet', 1242),
('City Bell', 1243),
('Villa Elisa', 1244),
('Los Hornos', 1245),
('San Carlos', 1246),
('Olmos', 1247),
('Etcheverry', 1248),
('Melchor Romero', 1249),
('Abasto', 1250),
('Arturo Segui', 1251),
('Ensenada', 1252),
('Punta Lara', 1253),
('Dique N° 1', 1254),
('Berisso', 1255),
('B. Banco Provincia', 1256),
('El Carmen', 1257),
('Barrio Obrero', 1258),
('Villa Progreso', 1259);



-- ============================ ZONA ============================
INSERT INTO zona (nombre, createdAt, updatedAt) VALUES
('CABA', NOW(), NOW()),
('Zona Norte', NOW(), NOW()),
('Zona Oeste', NOW(), NOW()),
('Zona Sur', NOW(), NOW()),
('Zona Gran La Plata', NOW(), NOW());



-- ============================ LOCALIDADZONA ============================
INSERT INTO localidadzona (zonaId, localidadId) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 8),
(1, 9),
(1, 10),
(1, 11),
(1, 12),
(1, 13),
(1, 14),
(1, 15),
(1, 16),
(1, 17),
(1, 18),
(1, 19),
(1, 20),
(1, 21),
(1, 22),
(1, 23),
(1, 24),
(1, 25),
(1, 26),
(1, 27),
(1, 28),
(1, 29),
(1, 30),
(1, 31),
(1, 32),
(1, 33),
(1, 34),
(1, 35),
(1, 36),
(1, 37),
(1, 38),
(1, 39),
(1, 40),
(2, 41),
(2, 42),
(2, 43),
(2, 44),
(2, 45),
(2, 46),
(2, 47),
(2, 48),
(2, 49),
(2, 50),
(2, 51),
(2, 52),
(2, 53),
(2, 54),
(2, 55),
(2, 56),
(2, 57),
(2, 58),
(2, 59),
(2, 60),
(2, 61),
(2, 62),
(2, 63),
(2, 64),
(2, 65),
(2, 66),
(2, 67),
(2, 68),
(2, 69),
(2, 70),
(2, 71),
(2, 72),
(2, 73),
(2, 74),
(2, 75),
(2, 76),
(2, 77),
(2, 78),
(2, 79),
(2, 80),
(2, 81),
(2, 82),
(2, 83),
(2, 84),
(2, 85),
(2, 86),
(2, 87),
(2, 88),
(2, 89),
(2, 90),
(2, 91),
(2, 92),
(2, 93),
(2, 94),
(2, 95),
(2, 96),
(2, 97),
(2, 98),
(2, 99),
(2, 100),
(2, 101),
(2, 102),
(2, 103),
(2, 104),
(2, 105),
(2, 106),
(2, 107),
(2, 108),
(2, 109),
(2, 110),
(2, 111),
(2, 112),
(2, 113),
(2, 114),
(2, 115),
(2, 116),
(2, 117),
(2, 118),
(2, 119),
(2, 120),
(2, 121),
(2, 122),
(3, 123),
(3, 124),
(3, 125),
(3, 126),
(3, 127),
(3, 128),
(3, 129),
(3, 130),
(3, 131),
(3, 132),
(3, 133),
(3, 134),
(3, 135),
(3, 136),
(3, 137),
(3, 138),
(3, 139),
(3, 140),
(3, 141),
(3, 142),
(3, 143),
(3, 144),
(3, 145),
(3, 146),
(3, 147),
(3, 148),
(3, 149),
(3, 150),
(3, 151),
(3, 152),
(3, 153),
(3, 154),
(3, 155),
(3, 156),
(3, 157),
(3, 158),
(3, 159),
(3, 160),
(3, 161),
(3, 162),
(3, 163),
(3, 164),
(3, 165),
(4, 166),
(4, 167),
(4, 168),
(4, 169),
(4, 170),
(4, 171),
(4, 172),
(4, 173),
(4, 174),
(4, 175),
(4, 176),
(4, 177),
(4, 178),
(4, 179),
(4, 180),
(4, 181),
(4, 182),
(4, 183),
(4, 184),
(4, 185),
(4, 186),
(4, 187),
(4, 188),
(4, 189),
(4, 190),
(4, 191),
(4, 192),
(4, 193),
(4, 194),
(4, 195),
(4, 196),
(4, 197),
(4, 198),
(4, 199),
(4, 200),
(4, 201),
(4, 202),
(4, 203),
(4, 204),
(4, 205),
(4, 206),
(4, 207),
(4, 208),
(4, 209),
(4, 210),
(4, 211),
(4, 212),
(4, 213),
(4, 214),
(4, 215),
(4, 216),
(4, 217),
(4, 218),
(4, 219),
(4, 220),
(4, 221),
(4, 222),
(4, 223),
(4, 224),
(4, 225),
(4, 226),
(4, 227),
(4, 228),
(4, 229),
(4, 230),
(4, 231),
(4, 232),
(4, 233),
(4, 234),
(4, 235),
(4, 236),
(4, 237),
(4, 238),
(5, 239),
(5, 240),
(5, 241),
(5, 242),
(5, 243),
(5, 244),
(5, 245),
(5, 246),
(5, 247),
(5, 248),
(5, 249),
(5, 250),
(5, 251),
(5, 252),
(5, 253),
(5, 254),
(5, 255),
(5, 256),
(5, 257),
(5, 258),
(5, 259);



-- ============================ USUARIO ============================
-- 👤 Usuario admin (contraseña: Admin123)
INSERT INTO usuario 
(email, nombre, contraseña, telefono, fecha_nac, imagen_url, rolId, localidadId, createdAt, updatedAt)
VALUES
('admin@admin.com', 'Administrador', '$2b$10$bRN.9ubsi8pgl0Mun.oD/.dIMMmj2/gofIoiij5TyeEFVXFtLp/vW', '1122334455', '1990-01-01', 
'https://www.pngmart.com/files/21/Admin-Profile-Vector-PNG-Photos.png', 1, 9, NOW(), NOW());


-- 👤 Usuario cliente (contraseña: Clave123)
INSERT INTO usuario 
(email, nombre, contraseña, telefono, fecha_nac, imagen_url, rolId, localidadId, createdAt, updatedAt)
VALUES
('prueba@prueba.com', 'Juan Pérez', '$2b$10$W/AjjH9ka.qZKrz5a20jGuicKvHYaOJTCMageZNaM2amDrI7Gup2i', '1199887766', '1995-05-15', 
'https://res.cloudinary.com/dinntdzos/image/upload/v1762726834/mercado_sinergico/ggeuhzy1wglrgtu1a8jm.png', 2, 123, NOW(), NOW());



-- ============================ DIRECCION ============================
-- Admin → Palermo (localidadId = 9)
INSERT INTO direccion 
(usuarioId, localidadId, codigo_postal, calle, numero, piso, departamento)
VALUES
(1, 9, 1425, 'Av. Santa Fe', 1234, 5, 'A');


-- Juan Pérez → Morón (localidadId = 123)
INSERT INTO direccion 
(usuarioId, localidadId, codigo_postal, calle, numero, piso, departamento)
VALUES
(2, 123, 1708, 'Av. Rivadavia', 9876, NULL, NULL);


-- ============================ PLANTILLA ============================
INSERT INTO Plantilla (nombre, createdAt, updatedAt) 
VALUES
('Plantilla Celular', NOW(), NOW()),
('Plantilla Televisor', NOW(), NOW()),
('Plantilla Notebook', NOW(), NOW());

-- ============================ CARACTERISTICA ============================
-- Características para Plantilla Celular (id = 1)
INSERT INTO Caracteristica (nombre, plantillaId, createdAt, updatedAt) VALUES
('Color', 1, NOW(), NOW()),
('Capacidad de almacenamiento', 1, NOW(), NOW()),
('Tamaño de pantalla', 1, NOW(), NOW()),
('Memoria RAM', 1, NOW(), NOW());

-- Características para Plantilla Televisor (id = 2)
INSERT INTO Caracteristica (nombre, plantillaId, createdAt, updatedAt) VALUES
('Pulgadas', 2, NOW(), NOW()),
('Tipo de pantalla', 2, NOW(), NOW()),
('Resolución', 2, NOW(), NOW()),
('Conectividad', 2, NOW(), NOW());

-- Características para Plantilla Notebook (id = 3)
INSERT INTO Caracteristica (nombre, plantillaId, createdAt, updatedAt) VALUES
('Procesador', 3, NOW(), NOW()),
('Memoria RAM', 3, NOW(), NOW()),
('Almacenamiento', 3, NOW(), NOW()),
('Sistema operativo', 3, NOW(), NOW());

-- ============================ OPCION ============================
-- Característica 1: Color
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('Negro', 1, NOW(), NOW()),
('Blanco', 1, NOW(), NOW()),
('Azul', 1, NOW(), NOW()),
('Rojo', 1, NOW(), NOW());

-- Característica 2: Capacidad de almacenamiento
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('64 GB', 2, NOW(), NOW()),
('128 GB', 2, NOW(), NOW()),
('256 GB', 2, NOW(), NOW()),
('512 GB', 2, NOW(), NOW());

-- Característica 3: Tamaño de pantalla
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('5.5"', 3, NOW(), NOW()),
('6.1"', 3, NOW(), NOW()),
('6.7"', 3, NOW(), NOW());

-- Característica 4: Memoria RAM (Celular)
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('4 GB', 4, NOW(), NOW()),
('6 GB', 4, NOW(), NOW()),
('8 GB', 4, NOW(), NOW());

-- Característica 5: Pulgadas (Televisor)
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('32"', 5, NOW(), NOW()),
('43"', 5, NOW(), NOW()),
('55"', 5, NOW(), NOW()),
('65"', 5, NOW(), NOW());

-- Característica 6: Tipo de pantalla
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('LED', 6, NOW(), NOW()),
('OLED', 6, NOW(), NOW()),
('QLED', 6, NOW(), NOW());

-- Característica 7: Resolución
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('HD', 7, NOW(), NOW()),
('Full HD', 7, NOW(), NOW()),
('4K', 7, NOW(), NOW()),
('8K', 7, NOW(), NOW());

-- Característica 8: Conectividad
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('Wi-Fi', 8, NOW(), NOW()),
('Bluetooth', 8, NOW(), NOW()),
('HDMI', 8, NOW(), NOW()),
('USB', 8, NOW(), NOW());

-- Característica 9: Procesador (Notebook)
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('Intel i5', 9, NOW(), NOW()),
('Intel i7', 9, NOW(), NOW()),
('AMD Ryzen 5', 9, NOW(), NOW()),
('AMD Ryzen 7', 9, NOW(), NOW());

-- Característica 10: Memoria RAM (Notebook)
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('8 GB', 10, NOW(), NOW()),
('16 GB', 10, NOW(), NOW()),
('32 GB', 10, NOW(), NOW());

-- Característica 11: Almacenamiento
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('256 GB SSD', 11, NOW(), NOW()),
('512 GB SSD', 11, NOW(), NOW()),
('1 TB SSD', 11, NOW(), NOW());

-- Característica 12: Sistema operativo
INSERT INTO Opcion (nombre, caracteristicaId, createdAt, updatedAt) VALUES
('Windows 11', 12, NOW(), NOW()),
('Linux', 12, NOW(), NOW()),
('macOS', 12, NOW(), NOW());

-- ============================ PRODUCTO ============================
-- Celulares (Plantilla 1, Categoría: Tecnología, Marca: varias)
INSERT INTO Producto 
(nombre, descripcion, precio, imagen_url, marca_id, categoria_id, plantillaId, stock, tipo, altura, ancho, profundidad, peso, createdAt, updatedAt)
VALUES
('iPhone 14', 'Smartphone de Apple con pantalla de 6.1", 128 GB y chip A15 Bionic.', 1200.00, 'https://acdn-us.mitiendanube.com/stores/001/555/911/products/iphone-14-black-d61713d18bdf31d02417016951877100-1024-1024.webp', 1, 4, 1, NULL, 'SINERGICO', 14.7, 7.1, 0.8, 0.17, NOW(), NOW()),
('Samsung Galaxy S23', 'Smartphone Samsung con 256 GB de almacenamiento y cámara triple.', 1100.00, 'https://http2.mlstatic.com/D_848869-CBT90467223350_082025-C.jpg', 2, 4, 1, NULL, 'ENERGETICO', 15.0, 7.2, 0.8, 0.18, NOW(), NOW()),
('Sony Xperia 10 V', 'Celular Sony con pantalla OLED de 6.1" y batería de 5000 mAh.', 800.00, 'https://images-cdn.ubuy.co.in/66faadc7e1426368995da054-sony-xperia-10-v-xq-dc72-5g-dual-128gb.jpg', 3, 4, 1, NULL, 'SINERGICO', 15.2, 7.1, 0.8, 0.16, NOW(), NOW());

-- Televisores (Plantilla 2, Categoría: Televisores)
INSERT INTO Producto 
(nombre, descripcion, precio, imagen_url, marca_id, categoria_id, plantillaId, stock, tipo, altura, ancho, profundidad, peso, createdAt, updatedAt)
VALUES
('LG OLED C3 55"', 'Televisor OLED de 55" con resolución 4K y soporte Dolby Vision.', 1800.00, 'https://www.lg.com/content/dam/channel/wcms/mx/images/televisores/oled55c3psa_awm_enms_mx_c/gallery/large06.jpg', 4, 3, 2, NULL, 'ENERGETICO', 70.0, 123.0, 5.0, 18.0, NOW(), NOW()),
('Samsung QLED Q60C 50"', 'Televisor QLED de 50" con Quantum HDR y SmartThings integrado.', 1500.00, 'https://http2.mlstatic.com/D_NQ_NP_890431-MLU70332220536_072023-O.webp', 2, 3, 2, NULL, 'SINERGICO', 65.0, 112.0, 5.5, 16.5, NOW(), NOW()),
('Philips 43PUS8008', 'Televisor LED 4K UHD de 43" con Ambilight y Android TV.', 1000.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTaqu-K9cZ2B7O7q_5s0qDuD78PC2l8_323oA&s', 5, 3, 2, NULL, 'ENERGETICO', 55.0, 96.0, 5.0, 13.0, NOW(), NOW());

-- Notebooks (Plantilla 3, Categoría: Tecnología)
INSERT INTO Producto 
(nombre, descripcion, precio, imagen_url, marca_id, categoria_id, plantillaId, stock, tipo, altura, ancho, profundidad, peso, createdAt, updatedAt)
VALUES
('MacBook Air M2', 'Notebook de Apple con chip M2, pantalla Retina y 8 GB de RAM.', 1900.00, 'https://http2.mlstatic.com/D_NQ_NP_663606-MLA78669752141_082024-O.webp', 1, 4, 3, NULL, 'ENERGETICO', 1.1, 30.0, 21.0, 1.24, NOW(), NOW()),
('HP Pavilion 15', 'Notebook HP con procesador Intel i5 y SSD de 512 GB.', 950.00, 'https://i5.walmartimages.com/asr/762e3ce1-4e52-40fe-abd1-1a1e056d4895_2.f2b9c74ed7d0701637b067a44f89cca6.jpeg', 6, 4, 3, NULL, 'SINERGICO', 1.9, 36.0, 24.0, 1.80, NOW(), NOW()),
('Lenovo IdeaPad 3', 'Notebook Lenovo con AMD Ryzen 5, 8 GB de RAM y 256 GB SSD.', 800.00, 'https://i5.walmartimages.com/asr/812648ff-28b6-4a80-b19e-21a722a3a2ee.79a703c8f6fa9663ca7da697ea9f74d0.jpeg', 6, 4, 3, NULL, 'ENERGETICO', 1.9, 36.0, 24.0, 1.65, NOW(), NOW());

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

-- ============================ PRODUCTOVARIANTE ============================
-- 📱 iPhone 14 - Variantes (SINERGICO sin stock físico)
INSERT INTO ProductoVariante (productoId, sku, stockFisico, precioExtra, activo, createdAt, updatedAt) VALUES
-- Negro, 128 GB, 6.1", 4 GB
(1, 'IPH14-NEG-128-61-4', NULL, 0, true, NOW(), NOW()),
-- Negro, 256 GB, 6.1", 6 GB
(1, 'IPH14-NEG-256-61-6', NULL, 50, true, NOW(), NOW()),
-- Blanco, 128 GB, 6.1", 4 GB
(1, 'IPH14-BLA-128-61-4', NULL, 0, true, NOW(), NOW()),
-- Blanco, 256 GB, 6.1", 6 GB
(1, 'IPH14-BLA-256-61-6', NULL, 50, true, NOW(), NOW()),
-- Azul, 512 GB, 6.7", 8 GB
(1, 'IPH14-AZU-512-67-8', NULL, 150, true, NOW(), NOW());

-- 📱 Samsung Galaxy S23 - Variantes (ENERGETICO con stock físico)
INSERT INTO ProductoVariante (productoId, sku, stockFisico, precioExtra, activo, createdAt, updatedAt) VALUES
-- Negro, 128 GB, 6.1", 6 GB
(2, 'S23-NEG-128-61-6', 15, 0, true, NOW(), NOW()),
-- Negro, 256 GB, 6.1", 8 GB
(2, 'S23-NEG-256-61-8', 10, 80, true, NOW(), NOW()),
-- Blanco, 256 GB, 6.7", 8 GB
(2, 'S23-BLA-256-67-8', 8, 100, true, NOW(), NOW()),
-- Rojo, 512 GB, 6.7", 8 GB
(2, 'S23-ROJ-512-67-8', 5, 200, true, NOW(), NOW());

-- 📱 Sony Xperia 10 V - Variantes (SINERGICO sin stock)
INSERT INTO ProductoVariante (productoId, sku, stockFisico, precioExtra, activo, createdAt, updatedAt) VALUES
-- Negro, 64 GB, 5.5", 4 GB
(3, 'XPERIA-NEG-64-55-4', NULL, 0, true, NOW(), NOW()),
-- Blanco, 128 GB, 6.1", 6 GB
(3, 'XPERIA-BLA-128-61-6', NULL, 40, true, NOW(), NOW()),
-- Azul, 256 GB, 6.1", 8 GB
(3, 'XPERIA-AZU-256-61-8', NULL, 80, true, NOW(), NOW());

-- 🖥️ LG OLED C3 55" - Variantes (ENERGETICO con stock)
INSERT INTO ProductoVariante (productoId, sku, stockFisico, precioExtra, activo, createdAt, updatedAt) VALUES
-- 55", OLED, 4K, Wi-Fi
(4, 'LG-55-OLED-4K-WIFI', 12, 0, true, NOW(), NOW()),
-- 55", OLED, 4K, Bluetooth
(4, 'LG-55-OLED-4K-BT', 8, 50, true, NOW(), NOW()),
-- 65", OLED, 8K, HDMI
(4, 'LG-65-OLED-8K-HDMI', 5, 400, true, NOW(), NOW());

-- 🖥️ Samsung QLED Q60C 50" - Variantes (SINERGICO)
INSERT INTO ProductoVariante (productoId, sku, stockFisico, precioExtra, activo, createdAt, updatedAt) VALUES
-- 43", QLED, Full HD, Wi-Fi
(5, 'SAM-43-QLED-FHD-WIFI', NULL, 0, true, NOW(), NOW()),
-- 50", QLED, 4K, USB
(5, 'SAM-50-QLED-4K-USB', NULL, 100, true, NOW(), NOW()),
-- 55", QLED, 4K, HDMI
(5, 'SAM-55-QLED-4K-HDMI', NULL, 150, true, NOW(), NOW());

-- 🖥️ Philips 43PUS8008 - Variantes (ENERGETICO)
INSERT INTO ProductoVariante (productoId, sku, stockFisico, precioExtra, activo, createdAt, updatedAt) VALUES
-- 32", LED, HD, Wi-Fi
(6, 'PHI-32-LED-HD-WIFI', 20, 0, true, NOW(), NOW()),
-- 43", LED, Full HD, Bluetooth
(6, 'PHI-43-LED-FHD-BT', 15, 60, true, NOW(), NOW()),
-- 43", OLED, 4K, HDMI
(6, 'PHI-43-OLED-4K-HDMI', 10, 120, true, NOW(), NOW());

-- 💻 MacBook Air M2 - Variantes (ENERGETICO)
INSERT INTO ProductoVariante (productoId, sku, stockFisico, precioExtra, activo, createdAt, updatedAt) VALUES
-- Intel i7, 8 GB, 256 GB SSD, macOS
(7, 'MAC-I7-8-256-MAC', 10, 0, true, NOW(), NOW()),
-- Intel i7, 16 GB, 512 GB SSD, macOS
(7, 'MAC-I7-16-512-MAC', 7, 200, true, NOW(), NOW()),
-- AMD Ryzen 7, 16 GB, 1 TB SSD, macOS
(7, 'MAC-R7-16-1TB-MAC', 5, 400, true, NOW(), NOW());

-- 💻 HP Pavilion 15 - Variantes (SINERGICO)
INSERT INTO ProductoVariante (productoId, sku, stockFisico, precioExtra, activo, createdAt, updatedAt) VALUES
-- Intel i5, 8 GB, 256 GB SSD, Windows 11
(8, 'HP-I5-8-256-WIN', NULL, 0, true, NOW(), NOW()),
-- Intel i5, 16 GB, 512 GB SSD, Windows 11
(8, 'HP-I5-16-512-WIN', NULL, 100, true, NOW(), NOW()),
-- AMD Ryzen 5, 8 GB, 256 GB SSD, Linux
(8, 'HP-R5-8-256-LIN', NULL, -50, true, NOW(), NOW());

-- 💻 Lenovo IdeaPad 3 - Variantes (ENERGETICO)
INSERT INTO ProductoVariante (productoId, sku, stockFisico, precioExtra, activo, createdAt, updatedAt) VALUES
-- AMD Ryzen 5, 8 GB, 256 GB SSD, Windows 11
(9, 'LEN-R5-8-256-WIN', 18, 0, true, NOW(), NOW()),
-- AMD Ryzen 5, 16 GB, 512 GB SSD, Windows 11
(9, 'LEN-R5-16-512-WIN', 12, 120, true, NOW(), NOW()),
-- Intel i5, 8 GB, 512 GB SSD, Linux
(9, 'LEN-I5-8-512-LIN', 8, 80, true, NOW(), NOW());

-- ============================ PRODUCTOVARIANTEOPCION ============================
-- 📱 iPhone 14 - Variante 1: Negro, 128 GB, 6.1", 4 GB
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(1, 1, 1), -- Color: Negro
(1, 2, 6), -- Almacenamiento: 128 GB
(1, 3, 10), -- Pantalla: 6.1"
(1, 4, 13); -- RAM: 4 GB

-- iPhone 14 - Variante 2: Negro, 256 GB, 6.1", 6 GB
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(2, 1, 1), -- Color: Negro
(2, 2, 7), -- Almacenamiento: 256 GB
(2, 3, 10), -- Pantalla: 6.1"
(2, 4, 14); -- RAM: 6 GB

-- iPhone 14 - Variante 3: Blanco, 128 GB, 6.1", 4 GB
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(3, 1, 2), -- Color: Blanco
(3, 2, 6), -- Almacenamiento: 128 GB
(3, 3, 10), -- Pantalla: 6.1"
(3, 4, 13); -- RAM: 4 GB

-- iPhone 14 - Variante 4: Blanco, 256 GB, 6.1", 6 GB
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(4, 1, 2), -- Color: Blanco
(4, 2, 7), -- Almacenamiento: 256 GB
(4, 3, 10), -- Pantalla: 6.1"
(4, 4, 14); -- RAM: 6 GB

-- iPhone 14 - Variante 5: Azul, 512 GB, 6.7", 8 GB
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(5, 1, 3), -- Color: Azul
(5, 2, 8), -- Almacenamiento: 512 GB
(5, 3, 11), -- Pantalla: 6.7"
(5, 4, 15); -- RAM: 8 GB

-- 📱 Samsung Galaxy S23 - Variante 6: Negro, 128 GB, 6.1", 6 GB
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(6, 1, 1), -- Color: Negro
(6, 2, 6), -- Almacenamiento: 128 GB
(6, 3, 10), -- Pantalla: 6.1"
(6, 4, 14); -- RAM: 6 GB

-- Samsung Galaxy S23 - Variante 7: Negro, 256 GB, 6.1", 8 GB
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(7, 1, 1), -- Color: Negro
(7, 2, 7), -- Almacenamiento: 256 GB
(7, 3, 10), -- Pantalla: 6.1"
(7, 4, 15); -- RAM: 8 GB

-- Samsung Galaxy S23 - Variante 8: Blanco, 256 GB, 6.7", 8 GB
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(8, 1, 2), -- Color: Blanco
(8, 2, 7), -- Almacenamiento: 256 GB
(8, 3, 11), -- Pantalla: 6.7"
(8, 4, 15); -- RAM: 8 GB

-- Samsung Galaxy S23 - Variante 9: Rojo, 512 GB, 6.7", 8 GB
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(9, 1, 4), -- Color: Rojo
(9, 2, 8), -- Almacenamiento: 512 GB
(9, 3, 11), -- Pantalla: 6.7"
(9, 4, 15); -- RAM: 8 GB

-- 📱 Sony Xperia - Variante 10: Negro, 64 GB, 5.5", 4 GB
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(10, 1, 1), -- Color: Negro
(10, 2, 5), -- Almacenamiento: 64 GB
(10, 3, 9), -- Pantalla: 5.5"
(10, 4, 13); -- RAM: 4 GB

-- Sony Xperia - Variante 11: Blanco, 128 GB, 6.1", 6 GB
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(11, 1, 2), -- Color: Blanco
(11, 2, 6), -- Almacenamiento: 128 GB
(11, 3, 10), -- Pantalla: 6.1"
(11, 4, 14); -- RAM: 6 GB

-- Sony Xperia - Variante 12: Azul, 256 GB, 6.1", 8 GB
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(12, 1, 3), -- Color: Azul
(12, 2, 7), -- Almacenamiento: 256 GB
(12, 3, 10), -- Pantalla: 6.1"
(12, 4, 15); -- RAM: 8 GB

-- 🖥️ LG OLED - Variante 13: 55", OLED, 4K, Wi-Fi
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(13, 5, 18), -- Pulgadas: 55"
(13, 6, 22), -- Tipo: OLED
(13, 7, 26), -- Resolución: 4K
(13, 8, 29); -- Conectividad: Wi-Fi

-- LG OLED - Variante 14: 55", OLED, 4K, Bluetooth
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(14, 5, 18), -- Pulgadas: 55"
(14, 6, 22), -- Tipo: OLED
(14, 7, 26), -- Resolución: 4K
(14, 8, 30); -- Conectividad: Bluetooth

-- LG OLED - Variante 15: 65", OLED, 8K, HDMI
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(15, 5, 19), -- Pulgadas: 65"
(15, 6, 22), -- Tipo: OLED
(15, 7, 27), -- Resolución: 8K
(15, 8, 31); -- Conectividad: HDMI

-- 🖥️ Samsung QLED - Variante 16: 43", QLED, Full HD, Wi-Fi
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(16, 5, 17), -- Pulgadas: 43"
(16, 6, 23), -- Tipo: QLED
(16, 7, 25), -- Resolución: Full HD
(16, 8, 29); -- Conectividad: Wi-Fi

-- Samsung QLED - Variante 17: 50", QLED, 4K, USB
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(17, 5, 18), -- Pulgadas: 55" (ajustado)
(17, 6, 23), -- Tipo: QLED
(17, 7, 26), -- Resolución: 4K
(17, 8, 32); -- Conectividad: USB

-- Samsung QLED - Variante 18: 55", QLED, 4K, HDMI
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(18, 5, 18), -- Pulgadas: 55"
(18, 6, 23), -- Tipo: QLED
(18, 7, 26), -- Resolución: 4K
(18, 8, 31); -- Conectividad: HDMI

-- 🖥️ Philips - Variante 19: 32", LED, HD, Wi-Fi
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(19, 5, 16), -- Pulgadas: 32"
(19, 6, 21), -- Tipo: LED
(19, 7, 24), -- Resolución: HD
(19, 8, 29); -- Conectividad: Wi-Fi

-- Philips - Variante 20: 43", LED, Full HD, Bluetooth
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(20, 5, 17), -- Pulgadas: 43"
(20, 6, 21), -- Tipo: LED
(20, 7, 25), -- Resolución: Full HD
(20, 8, 30); -- Conectividad: Bluetooth

-- Philips - Variante 21: 43", OLED, 4K, HDMI
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(21, 5, 17), -- Pulgadas: 43"
(21, 6, 22), -- Tipo: OLED
(21, 7, 26), -- Resolución: 4K
(21, 8, 31); -- Conectividad: HDMI

-- 💻 MacBook Air M2 - Variante 22: Intel i7, 8 GB, 256 GB SSD, macOS
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(22, 9, 34), -- Procesador: Intel i7
(22, 10, 37), -- RAM: 8 GB
(22, 11, 40), -- Almacenamiento: 256 GB SSD
(22, 12, 43); -- SO: macOS

-- MacBook Air M2 - Variante 23: Intel i7, 16 GB, 512 GB SSD, macOS
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(23, 9, 34), -- Procesador: Intel i7
(23, 10, 38), -- RAM: 16 GB
(23, 11, 41), -- Almacenamiento: 512 GB SSD
(23, 12, 43); -- SO: macOS

-- MacBook Air M2 - Variante 24: AMD Ryzen 7, 16 GB, 1 TB SSD, macOS
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(24, 9, 36), -- Procesador: AMD Ryzen 7
(24, 10, 38), -- RAM: 16 GB
(24, 11, 42), -- Almacenamiento: 1 TB SSD
(24, 12, 43); -- SO: macOS

-- 💻 HP Pavilion - Variante 25: Intel i5, 8 GB, 256 GB SSD, Windows 11
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(25, 9, 33), -- Procesador: Intel i5
(25, 10, 37), -- RAM: 8 GB
(25, 11, 40), -- Almacenamiento: 256 GB SSD
(25, 12, 44); -- SO: Windows 11

-- HP Pavilion - Variante 26: Intel i5, 16 GB, 512 GB SSD, Windows 11
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(26, 9, 33), -- Procesador: Intel i5
(26, 10, 38), -- RAM: 16 GB
(26, 11, 41), -- Almacenamiento: 512 GB SSD
(26, 12, 44); -- SO: Windows 11

-- HP Pavilion - Variante 27: AMD Ryzen 5, 8 GB, 256 GB SSD, Linux
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(27, 9, 35), -- Procesador: AMD Ryzen 5
(27, 10, 37), -- RAM: 8 GB
(27, 11, 40), -- Almacenamiento: 256 GB SSD
(27, 12, 45); -- SO: Linux

-- 💻 Lenovo IdeaPad - Variante 28: AMD Ryzen 5, 8 GB, 256 GB SSD, Windows 11
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(28, 9, 35), -- Procesador: AMD Ryzen 5
(28, 10, 37), -- RAM: 8 GB
(28, 11, 40), -- Almacenamiento: 256 GB SSD
(28, 12, 44); -- SO: Windows 11

-- Lenovo IdeaPad - Variante 29: AMD Ryzen 5, 16 GB, 512 GB SSD, Windows 11
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(29, 9, 35), -- Procesador: AMD Ryzen 5
(29, 10, 38), -- RAM: 16 GB
(29, 11, 41), -- Almacenamiento: 512 GB SSD
(29, 12, 44); -- SO: Windows 11

-- Lenovo IdeaPad - Variante 30: Intel i5, 8 GB, 512 GB SSD, Linux
INSERT INTO ProductoVarianteOpcion (varianteId, caracteristicaId, opcionId) VALUES
(30, 9, 33), -- Procesador: Intel i5
(30, 10, 37), -- RAM: 8 GB
(30, 11, 41), -- Almacenamiento: 512 GB SSD
(30, 12, 41); -- SO: Linux

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
VALUES (1, 1);

-- 📱 Pack Galaxy Performance (Paquete 2) → Samsung Galaxy S23
INSERT INTO PaqueteBaseProducto (productoId, paqueteBaseId)
VALUES (2, 2);

-- 🖥️ Pack Smart TV LG (Paquete 3) → LG OLED C3 55"
INSERT INTO PaqueteBaseProducto (productoId, paqueteBaseId)
VALUES (4, 3);

-- 🖥️ Pack Philips Ambilight (Paquete 4) → Philips 43PUS8008
INSERT INTO PaqueteBaseProducto (productoId, paqueteBaseId)
VALUES (6, 4);

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
-- 📦 Pack iPhone Experience publicado en CABA (Activo)
INSERT INTO PaquetePublicado 
(paqueteBaseId, estadoId, zonaId, fecha_inicio, fecha_fin, cant_productos, monto_total, imagen_url, tipo, descuento, createdAt, updatedAt)
VALUES
(1, 1, 1, NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY), 50, 1200.00, 'https://static.rfstat.com/renderforest/images/v2/landing-pics/mockups/iphone/hero_slide_0.jpeg?v=18', 'SINERGICO', 10.0, NOW(), NOW());

-- 📦 Pack Galaxy Performance publicado en Zona Norte (Activo)
INSERT INTO PaquetePublicado 
(paqueteBaseId, estadoId, zonaId, fecha_inicio, fecha_fin, cant_productos, monto_total, imagen_url, tipo, descuento, createdAt, updatedAt)
VALUES
(2, 1, 2, NOW(), DATE_ADD(NOW(), INTERVAL 4 DAY), 40, 1100.00, 'https://img.global.news.samsung.com/global/wp-content/uploads/2023/02/%EA%B8%80%EB%A1%9C%EB%B2%8C-Featured-Stories-Thumbnail-728x410.jpg', 'ENERGETICO', 15.0, NOW(), NOW());

-- 📦 Pack Smart TV LG publicado en Zona Sur (Activo)
INSERT INTO PaquetePublicado 
(paqueteBaseId, estadoId, zonaId, fecha_inicio, fecha_fin, cant_productos, monto_total, imagen_url, tipo, descuento, createdAt, updatedAt)
VALUES
(3, 1, 4, NOW(), DATE_ADD(NOW(), INTERVAL 3 DAY), 25, 1800.00, 'https://www.lg.com/global/images/business/information-display/commercial-tv/md07574661/gallery/medium01.jpg', 'ENERGETICO', 20.0, NOW(), NOW());

-- 📦 Pack Philips Ambilight publicado en Zona Oeste (Pendiente)
INSERT INTO PaquetePublicado 
(paqueteBaseId, estadoId, zonaId, fecha_inicio, fecha_fin, cant_productos, monto_total, imagen_url, tipo, descuento, createdAt, updatedAt)
VALUES
(4, 3, 3, NOW(), DATE_ADD(NOW(), INTERVAL 2 DAY), 30, 1000.00, 'https://www.philips.es/c-dam/b2c/tv/categorypage/master/oled-2024/oled-2023-thumbnail-l-m.jpg', 'ENERGETICO', 12.0, NOW(), NOW());

-- 📦 Pack Oficina HP publicado en Zona Oeste (Activo)
INSERT INTO PaquetePublicado 
(paqueteBaseId, estadoId, zonaId, fecha_inicio, fecha_fin, cant_productos, monto_total, imagen_url, tipo, descuento, createdAt, updatedAt)
VALUES
(5, 1, 3, NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY), 45, 950.00, 'https://www.muycomputerpro.com/wp-content/uploads/2015/03/HP_Care_Pack-1.jpeg', 'SINERGICO', 8.0, NOW(), NOW());

-- 📦 Pack Apple Productivity publicado en Zona Gran La Plata (Activo)
INSERT INTO PaquetePublicado 
(paqueteBaseId, estadoId, zonaId, fecha_inicio, fecha_fin, cant_productos, monto_total, imagen_url, tipo, descuento, createdAt, updatedAt)
VALUES
(6, 1, 5, NOW(), DATE_ADD(NOW(), INTERVAL 10 DAY), 30, 1900.00, 'https://i.ytimg.com/vi/P-UifawCilA/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBx5Omr-Pgm8jU20l8i0KXkNUKAeQ', 'ENERGETICO', 5.0, NOW(), NOW());

-- ============================ DISPONIBILIDADVARIANTEPAQUETE ============================
-- Pack iPhone Experience (Paquete Publicado 1) - Variantes disponibles
INSERT INTO DisponibilidadVariantePaquete (varianteId, paquetePublicadoId, activo, createdAt, updatedAt) VALUES
(1, 1, true, NOW(), NOW()), -- Negro, 128 GB, 6.1", 4 GB
(2, 1, true, NOW(), NOW()), -- Negro, 256 GB, 6.1", 6 GB
(3, 1, true, NOW(), NOW()), -- Blanco, 128 GB, 6.1", 4 GB
(4, 1, true, NOW(), NOW()); -- Blanco, 256 GB, 6.1", 6 GB

-- Pack Galaxy Performance (Paquete Publicado 2) - Variantes disponibles
INSERT INTO DisponibilidadVariantePaquete (varianteId, paquetePublicadoId, activo, createdAt, updatedAt) VALUES
(6, 2, true, NOW(), NOW()), -- Negro, 128 GB, 6.1", 6 GB
(7, 2, true, NOW(), NOW()), -- Negro, 256 GB, 6.1", 8 GB
(8, 2, true, NOW(), NOW()); -- Blanco, 256 GB, 6.7", 8 GB

-- Pack Smart TV LG (Paquete Publicado 3) - Variantes disponibles
INSERT INTO DisponibilidadVariantePaquete (varianteId, paquetePublicadoId, activo, createdAt, updatedAt) VALUES
(13, 3, true, NOW(), NOW()), -- 55", OLED, 4K, Wi-Fi
(14, 3, true, NOW(), NOW()); -- 55", OLED, 4K, Bluetooth

-- Pack Philips Ambilight (Paquete Publicado 4) - Variantes disponibles
INSERT INTO DisponibilidadVariantePaquete (varianteId, paquetePublicadoId, activo, createdAt, updatedAt) VALUES
(19, 4, true, NOW(), NOW()), -- 32", LED, HD, Wi-Fi
(20, 4, true, NOW(), NOW()), -- 43", LED, Full HD, Bluetooth
(21, 4, true, NOW(), NOW()); -- 43", OLED, 4K, HDMI

-- Pack Oficina HP (Paquete Publicado 5) - Variantes disponibles
INSERT INTO DisponibilidadVariantePaquete (varianteId, paquetePublicadoId, activo, createdAt, updatedAt) VALUES
(25, 5, true, NOW(), NOW()), -- HP: Intel i5, 8 GB, 256 GB, Win11
(26, 5, true, NOW(), NOW()), -- HP: Intel i5, 16 GB, 512 GB, Win11
(28, 5, true, NOW(), NOW()), -- Lenovo: Ryzen 5, 8 GB, 256 GB, Win11
(29, 5, true, NOW(), NOW()); -- Lenovo: Ryzen 5, 16 GB, 512 GB, Win11

-- Pack Apple Productivity (Paquete Publicado 6) - Variantes disponibles
INSERT INTO DisponibilidadVariantePaquete (varianteId, paquetePublicadoId, activo, createdAt, updatedAt) VALUES
(22, 6, true, NOW(), NOW()), -- MacBook: i7, 8 GB, 256 GB, macOS
(23, 6, true, NOW(), NOW()), -- MacBook: i7, 16 GB, 512 GB, macOS
(1, 6, true, NOW(), NOW()),  -- iPhone: Negro, 128 GB, 6.1", 4 GB
(2, 6, true, NOW(), NOW());  -- iPhone: Negro, 256 GB, 6.1", 6 GB

-- ============================ PEDIDO ============================
-- Pedido 1: Admin compra iPhone 14 variante Negro 128GB del Pack iPhone Experience
INSERT INTO Pedido (usuarioId, paquetePublicadoId, estadoId, monto_total, descuento_aplicado, fecha, createdAt, updatedAt)
VALUES (1, 1, 2, 1080.00, 10.0, NOW(), NOW(), NOW());

-- Pedido 2: Admin compra Samsung Galaxy S23 variante Negro 256GB del Pack Galaxy Performance
INSERT INTO Pedido (usuarioId, paquetePublicadoId, estadoId, monto_total, descuento_aplicado, fecha, createdAt, updatedAt)
VALUES (1, 2, 3, 935.00, 15.0, NOW(), NOW(), NOW());

-- Pedido 3: Admin compra LG OLED variante 55" 4K del Pack Smart TV LG
INSERT INTO Pedido (usuarioId, paquetePublicadoId, estadoId, monto_total, descuento_aplicado, fecha, createdAt, updatedAt)
VALUES (1, 3, 1, 1440.00, 20.0, NOW(), NOW(), NOW());

-- Pedido 4: Admin compra HP Pavilion y Lenovo del Pack Oficina HP
INSERT INTO Pedido (usuarioId, paquetePublicadoId, estadoId, monto_total, descuento_aplicado, fecha, createdAt, updatedAt)
VALUES (1, 5, 4, 1610.00, 8.0, NOW(), NOW(), NOW());

-- Pedido 5: Juan Pérez compra MacBook Air del Pack Apple Productivity
INSERT INTO Pedido (usuarioId, paquetePublicadoId, estadoId, monto_total, descuento_aplicado, fecha, createdAt, updatedAt)
VALUES (2, 6, 2, 1805.00, 5.0, NOW(), NOW(), NOW());

-- ============================ PEDIDODETALLE ============================
-- Pedido 1: 1x iPhone 14 Negro 128GB (variante 1)
INSERT INTO PedidoDetalle (pedidoId, productoId, varianteId, cantidad, precio_unitario, subtotal)
VALUES (1, 1, 1, 1, 1080.00, 1080.00);

-- Pedido 2: 1x Samsung Galaxy S23 Negro 256GB (variante 7)
INSERT INTO PedidoDetalle (pedidoId, productoId, varianteId, cantidad, precio_unitario, subtotal)
VALUES (2, 2, 7, 1, 935.00, 935.00);

-- Pedido 3: 1x LG OLED 55" 4K WiFi (variante 13)
INSERT INTO PedidoDetalle (pedidoId, productoId, varianteId, cantidad, precio_unitario, subtotal)
VALUES (3, 4, 13, 1, 1440.00, 1440.00);

-- Pedido 4: 1x HP Pavilion i5 8GB (variante 25) + 1x Lenovo Ryzen5 8GB (variante 28)
INSERT INTO PedidoDetalle (pedidoId, productoId, varianteId, cantidad, precio_unitario, subtotal)
VALUES 
(4, 8, 25, 1, 874.00, 874.00),
(4, 9, 28, 1, 736.00, 736.00);

-- Pedido 5: 1x MacBook Air i7 8GB (variante 22)
INSERT INTO PedidoDetalle (pedidoId, productoId, varianteId, cantidad, precio_unitario, subtotal)
VALUES (5, 7, 22, 1, 1805.00, 1805.00);