-- CP numéricos de referencia, no CPA completos ni validación de domicilios.
-- Fuentes, alcance y casos sin CP: docs/codigos-postales-localidades.md (01/10/2026).
-- Completar solamente localidades activas sin CP; preservar datos ya cargados e históricos.
-- No modificar Direccion: el CP informado por el usuario puede diferir de la referencia.
UPDATE `Localidad`
SET `codigo_postal` = CASE `nombre`
  WHEN 'Avellaneda' THEN 1870
  WHEN 'Berazategui' THEN 1884
  WHEN 'Berisso' THEN 1923
  WHEN 'Campana' THEN 2804
  WHEN 'Cañuelas' THEN 1814
  WHEN 'Del Viso' THEN 1669
  WHEN 'Derqui' THEN 1635
  WHEN 'Ezeiza' THEN 1804
  WHEN 'Florencio Varela' THEN 1888
  WHEN 'Hurlingham' THEN 1686
  WHEN 'Ituzaingó' THEN 1714
  WHEN 'José C. Paz' THEN 1665
  WHEN 'Lanús' THEN 1824
  WHEN 'Lomas de Zamora' THEN 1832
  WHEN 'Merlo' THEN 1722
  WHEN 'Moreno' THEN 1744
  WHEN 'Morón' THEN 1708
  WHEN 'Nordelta' THEN 1670
  WHEN 'Quilmes' THEN 1878
  WHEN 'San Fernando' THEN 1646
  WHEN 'San Isidro' THEN 1642
  WHEN 'San Martín' THEN 1650
  WHEN 'San Miguel' THEN 1663
  WHEN 'Tigre' THEN 1648
  WHEN 'Vicente López' THEN 1638
  WHEN 'Ensenada' THEN 1925
  WHEN 'Escobar' THEN 1625
  WHEN 'Garín' THEN 1619
  WHEN 'General Rodríguez' THEN 1748
  WHEN 'Guernica' THEN 1862
  WHEN 'Ingeniero Maschwitz' THEN 1623
  WHEN 'Luján' THEN 6700
  WHEN 'Marcos Paz' THEN 1727
  WHEN 'Pilar' THEN 1629
  WHEN 'San Vicente' THEN 1865
  WHEN 'Villa Rosa' THEN 1631
  WHEN 'Zárate' THEN 2800
  ELSE `codigo_postal`
END
WHERE `activa` = true AND `codigo_postal` IS NULL;
