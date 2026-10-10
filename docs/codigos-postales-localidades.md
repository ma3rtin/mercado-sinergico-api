# Códigos postales de referencia del catálogo

Investigación: 01/10/2026. Alcance aprobado: un CP numérico de referencia cuando hay respaldo; `NULL` cuando la entrada representa una cobertura ambigua. No es un nomenclador postal exhaustivo ni una validación del domicilio.

## Criterio y fuentes

El [buscador oficial de Correo Argentino](https://www.correoargentino.com.ar/formularios/cpa) solicita provincia, localidad, calle y altura para obtener el CPA de ocho caracteres. Un CP numérico de cuatro cifras del catálogo no sustituye ese resultado. Correo [mantiene la base de localidades, calles y alturas](https://www.correoargentino.com.ar/encabezado/cpa).

Se contrastaron nombres y CP de domicilios institucionales y comerciales publicados por sus responsables. La columna de **localidad** se distinguió de la de **partido**: el CP de una cabecera no se extiende al partido entero.

- **BP:** [Banco Provincia / Provincia Net](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net), directorio con columnas de localidad, partido y CP. Publica actualización 02/07/2021; se usa como evidencia de referencia, no como garantía de vigencia de cada domicilio.
- **Pilar:** [dependencias municipales](https://www.pilar.gov.ar/wp-content/uploads/2021/11/Dependencias_municipales.pdf), con Del Viso, Presidente Derqui, Pilar y Villa Rosa.
- **Hurlingham:** [Universidad Nacional de Hurlingham](https://compras.unahur.edu.ar/siu/diaguita/aplicacion.php?ah=st69989fc14c4c90.64092050&ai=diaguita%7C%7C110000003&v=1020), domicilio institucional en 1686.
- **Nordelta:** [Fundación Nordelta](https://fundacionnordelta.org/), domicilio propio en 1670.
- **Contraste:** [cobertura publicada por UPS](https://www.ups.com/assets/resources/webcontent/ApprovedCountryListLimitedServiceAreaTable.pdf). Es una lista de servicio del transportista, no la autoridad postal ni un catálogo completo. Por ejemplo, distingue varias localidades dentro de Malvinas Argentinas y Tres de Febrero.

## Valores implementados

Son referencias de la ciudad/localidad nombrada, no de todas las localidades de un partido homónimo. En particular, Escobar corresponde a Belén de Escobar; Derqui a Presidente Derqui; San Martín a la ciudad de General San Martín. Los domicilios pueden tener otro CP válido.

| Entrada | CP de referencia | Evidencia |
| --- | ---: | --- |
| Avellaneda | 1870 | [BP, p. 17](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=17) |
| Berazategui | 1884 | [BP, p. 18](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=18) |
| Berisso | 1923 | [BP, p. 61](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=61) |
| Campana | 2804 | [BP, p. 63](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=63) |
| Cañuelas | 1814 | [BP, p. 63](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=63) |
| Del Viso | 1669 | [Pilar](https://www.pilar.gov.ar/wp-content/uploads/2021/11/Dependencias_municipales.pdf) |
| Derqui | 1635 | [Pilar](https://www.pilar.gov.ar/wp-content/uploads/2021/11/Dependencias_municipales.pdf) |
| Ezeiza | 1804 | [BP, p. 21](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=21) |
| Florencio Varela | 1888 | [BP, p. 22](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=22) |
| Hurlingham | 1686 | [Hurlingham](https://compras.unahur.edu.ar/siu/diaguita/aplicacion.php?ah=st69989fc14c4c90.64092050&ai=diaguita%7C%7C110000003&v=1020) |
| Ituzaingó | 1714 | [BP, p. 25](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=25) |
| José C. Paz | 1665 | [BP, p. 25](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=25) |
| Lanús | 1824 | [BP, p. 26](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=26) |
| Lomas de Zamora | 1832 | [BP, p. 27](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=27) |
| Merlo | 1722 | [BP, p. 29](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=29) |
| Moreno | 1744 | [BP, p. 30](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=30) |
| Morón | 1708 | [BP, p. 30](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=30) |
| Nordelta | 1670 | [Nordelta](https://fundacionnordelta.org/) |
| Quilmes | 1878 | [BP, p. 33](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=33) |
| San Fernando | 1646 | [BP, p. 34](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=34) |
| San Isidro | 1642 | [BP, p. 35](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=35) |
| San Martín | 1650 | [BP, p. 36](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=36) |
| San Miguel | 1663 | [BP, p. 36](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=36) |
| Tigre | 1648 | [BP, p. 37](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=37) |
| Vicente López | 1638 | [BP, p. 38](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=38) |
| Ensenada | 1925 | [BP, p. 70](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=70) |
| Escobar | 1625 | [BP, p. 21](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=21) |
| Garín | 1619 | [BP, p. 22](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=22) |
| General Rodríguez | 1748 | [BP, p. 23](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=23) |
| Guernica | 1862 | [BP, p. 23](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=23) |
| Ingeniero Maschwitz | 1623 | [BP, p. 24](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=24) |
| Luján | 6700 | [BP, p. 80](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=80) |
| Marcos Paz | 1727 | [BP, p. 89](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=89) |
| Pilar | 1629 | [Pilar](https://www.pilar.gov.ar/wp-content/uploads/2021/11/Dependencias_municipales.pdf) |
| San Vicente | 1865 | [BP, p. 99](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=99) |
| Villa Rosa | 1631 | [Pilar](https://www.pilar.gov.ar/wp-content/uploads/2021/11/Dependencias_municipales.pdf) |
| Zárate | 2800 | [BP, p. 104](https://www.bancoprovincia.com.ar/CDN/Get/Agencias_complementarias_Provincia_Net#page=104) |

## Entradas que permanecen sin referencia

| Entrada | Motivo |
| --- | --- |
| Almirante Brown | Partido: no asignar el CP de Adrogué a todas sus localidades. |
| CABA | Múltiples áreas postales; requiere domicilio. |
| Esteban Echeverría | Partido: Monte Grande y otras localidades tienen referencias distintas. |
| La Matanza Norte | División comercial sin delimitación postal definida. |
| La Matanza Sur | División comercial sin delimitación postal definida. |
| Malvinas Argentinas | Partido con varias localidades y CP. |
| Tres de Febrero | Partido con varias localidades y CP. |
| La Plata Centro | División comercial sin delimitación postal definida. |
| La Plata Norte | División comercial sin delimitación postal definida. |
| La Plata Oeste | División comercial sin delimitación postal definida. |

La falta de CP no debe convertirse en `0`, `1000` o `1900` por defecto. El usuario debe informar el CP de su domicilio.

## Discrepancias y límites

- Ituzaingó: se adopta **1714** como referencia respaldada por BP y el [boletín municipal](https://www.miituzaingo.gov.ar/sites/default/files/boletin_oficial/bolet%C3%ADn%202017/310%20marzo%202017.pdf). UPS también publica 1715; no se infiere un CP único para toda la ciudad.
- Berazategui: BP muestra domicilios con 1884 y 1880. Se adopta **1884** como referencia, corroborada por un [espacio cultural municipal](https://berazategui.gob.ar/cultura/salon-final-finales). No se rechaza 1880 en domicilios.
- Pilar: el municipio usa **1629**; UPS también lista 1630. Se conserva el carácter orientativo.
- Nordelta: **1670** está documentado por la fundación local. No se reutiliza automáticamente 1648 de Tigre para toda Nordelta.
- La consulta oficial del CPA no se ejecutó para domicilios particulares: no se tienen calle y altura reales. Ninguna referencia se presenta como CPA completo o prueba de entregabilidad.

## Implementación y contrato

La migración `20261001000000_codigos_postales_referencia` completa `Localidad.codigo_postal` únicamente cuando `activa = true` y el valor es `NULL`. Conserva CP ya cargados, localidades inactivas, IDs, relaciones y todo `Direccion`. Es repetible sin sobrescribir personalizaciones. Las diez entradas ambiguas quedan como estaban (normalmente `NULL` tras la migración anterior).

No se modifica la migración anterior para incorporar estos datos: instalaciones que ya retiraron las zonas reciben esta migración adicional. `GET /api/localidades` sigue devolviendo `codigo_postal: number | null`, ahora con referencias cuando existen. No cambian esquema Prisma ni DTO. Los formularios deben permitir un CP de domicilio diferente; el frontend revisado mantiene el valor del domicilio y no copia el CP del catálogo automáticamente.

La seed SQL reutiliza las localidades creadas por las migraciones; no necesita otra copia del catálogo postal. Aplicar las migraciones antes de poblar una base vacía.

El soporte de CPA alfanumérico en `Direccion` sigue pendiente: actualmente el campo es entero. Convertirlo a texto y adaptar formularios sería otro cambio de contrato, no parte de esta carga de referencias.
