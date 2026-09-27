# Validación de domicilios — investigación y propuesta

Investigación realizada el 27/09/2026. La integración externa está propuesta, no implementada ni contratada.

## Recomendación

Usar **Google Address Validation desde el backend**, inicialmente con un formulario de calle, altura, ciudad real, provincia y código postal. Agregar autocompletado de Places si las pruebas de uso lo justifican. Argentina figura con cobertura de Address Validation y metadatos residenciales/comerciales en la [matriz oficial de Google](https://developers.google.com/maps/documentation/address-validation/coverage).

El objetivo alcanzable es mejorar y comprobar la calidad de la dirección. Una respuesta de una API no demuestra que una persona viva allí ni garantiza la entrega: piso, departamento, acceso a barrios privados y referencias requieren confirmación del cliente.

## Opciones evaluadas

| Opción | Qué aporta | Limitaciones y decisión |
| --- | --- | --- |
| Google Address Validation | Normalización y señales para aceptar, pedir confirmación o corregir componentes. | Requiere facturación y claves. Recomendada para el control de calidad del domicilio. |
| Georef | Servicio público gratuito argentino para normalizar nombres territoriales, calles y direcciones. | Las coordenadas son aproximadas; no usar una coincidencia como prueba de entregabilidad. Alternativa para normalización con revisión manual. |
| Nominatim público | Geocodificación basada en OpenStreetMap. | No recomendado para este flujo: máximo global de 1 solicitud/segundo, sin autocompletado y sin enviar datos personales/confidenciales. |

Fuentes: [lógica de validación de Google](https://developers.google.com/maps/documentation/address-validation/build-validation-logic), [Georef: preguntas frecuentes](https://www.argentina.gob.ar/node/473730), [Georef: normalización de direcciones](https://www.argentina.gob.ar/node/473623), [política de Nominatim](https://operations.osmfoundation.org/policies/nominatim/).

Google recomienda interpretar `possibleNextAction`, completitud, granularidad y componentes de la respuesta. No alcanza con recibir HTTP 200 o coordenadas. La aplicación debe distinguir corrección, confirmación, pedido de unidad funcional y aceptación, según las [señales documentadas](https://developers.google.com/maps/documentation/address-validation/build-validation-logic).

## Costos orientativos

La tarifa publicada de Address Validation Pro incluye 5.000 eventos mensuales gratuitos y luego USD 17 por 1.000 en el primer tramo; Enterprise incluye 1.000 gratuitos y luego USD 25 por 1.000. Ejemplo: 10.000 validaciones Pro al mes costarían aproximadamente USD 85, sin impuestos, Places, mapas ni otras llamadas. Un registro puede requerir varias validaciones si se corrige el domicilio. Verificar el SKU realmente utilizado antes de activar facturación. [Lista oficial de precios](https://developers.google.com/maps/billing-and-pricing/pricing).

## Situación del proyecto

- `UsuarioService.registrar` crea la cuenta sin domicilio; `loginConFirebase` también puede crear usuarios sin dirección.
- `registrarDireccion` y `actualizarUsuario` guardan direcciones por caminos distintos. La futura comprobación debe ser compartida y obligatoria en ambos.
- El perfil actualmente captura calle, número, localidad, CP, piso y departamento. El CP y el piso se almacenan como números: para CPA alfanumérico y valores como PB, habrá que cambiar DTO, Prisma y formularios.
- El catálogo de 47 entradas mezcla municipios, localidades y divisiones comerciales como La Matanza Norte/Sur y La Plata Centro/Norte/Oeste. No debe enviarse una división comercial como si fuera una ciudad postal oficial.

## Flujo propuesto

1. Recopilar el domicilio durante el alta por email. Validarlo antes de crear usuario y dirección juntos en una transacción. Para Firebase, completar un paso de domicilio antes de crear/activar el usuario comercial; autenticar la identidad por sí solo no completa el alta.
2. Crear un endpoint de prevalidación con límite de solicitudes. El backend consulta Google con país `AR`, sin enviar email, nombre de usuario ni otros datos que no requiera la búsqueda.
3. Mostrar la propuesta normalizada. Si faltan datos o existen cambios importantes, pedir corrección o confirmación explícita. No elegir silenciosamente el primer resultado ambiguo.
4. Al guardar, volver a validar desde el servidor o consumir un comprobante de corta duración ligado al usuario y al contenido exacto del domicilio. Nunca confiar en un booleano `validada` recibido del navegador.
5. Guardar la dirección confirmada y un estado propio (`pendiente`, `validada`, `revision_manual`), fecha y proveedor. Cambiar calle, altura, ciudad o CP invalida la validación anterior. Una caída o timeout del proveedor deja el alta pendiente; no se debe marcar como válida.
6. Separar dirección postal de cobertura comercial. Para Norte/Sur/Centro/Oeste se necesitan límites definidos por el negocio o polígonos de reparto; hasta entonces, la pertenencia precisa queda a revisión. Esto no vuelve a segmentar paquetes.
7. Pedir a cuentas existentes que revisen su dirección al completar el perfil o antes de comprar. El catálogo actualizado no valida automáticamente domicilios históricos. Si se exige que toda cuenta esté validada, la API debe impedir operaciones comerciales con estado pendiente, incluso por llamadas directas.

La consulta externa debe ocurrir antes de abrir una transacción de base de datos. Reutilizar `fetch` de Node y los formularios Angular existentes; no hace falta incorporar un SDK para una primera integración HTTP.

## Almacenamiento y evaluación previa

No persistir indiscriminadamente el JSON del proveedor. Google restringe almacenamiento/caché de su contenido y permite conservar el `placeId` indefinidamente. Revisar las condiciones aplicables para dirección normalizada, coordenadas y plazos; incluir atribución al mostrar resultados. [Políticas oficiales](https://developers.google.com/maps/documentation/address-validation/policies).

Antes de contratar: probar una muestra consentida que cubra las 47 entradas, calles numéricas y diagonales de La Plata, esquinas, alturas inexistentes, errores de escritura, barrios privados, piso/departamento y localidades homónimas. Medir aceptaciones erróneas, rechazos de direcciones reales, necesidad de revisión, latencia y llamadas por alta. La cobertura publicada no sustituye esa evaluación local.

Decisiones pendientes para implementar: proveedor y presupuesto, límites de las divisiones comerciales y procedimiento de revisión manual. No se requieren credenciales para revisar esta propuesta.
