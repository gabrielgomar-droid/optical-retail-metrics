# Agendamientos por país

Módulo local para **conteos TY de fiscal creación 2026**. Solo admite dos cortes: semanas 1–40 (`observado`) y semana 41 (`preliminar`). Los consulta por separado con un selector; nunca suma ambos cortes en una tarjeta, calcula variación entre duraciones distintas ni reconstruye 41 puntos semanales.

## Abrir y probar

Con el servidor local descrito en el README, abre `http://127.0.0.1:8765/agendamientos.html` y pulsa **Explorar ejemplo ficticio**. El acumulado muestra **200** y la semana 41 **10**. El país ficticio A muestra 120 y 7, respectivamente; C contiene cero explícito en ambos cortes. Todos los conteos del ejemplo fueron inventados para verificar el software.

Selecciona corte y país. La tarjeta, las barras y la tabla muestran exclusivamente esa selección. El máximo visible determina la escala de las barras; el conteo se muestra como texto. No hay eje temporal ni porcentaje de asistencia.

## Contrato del CSV

```csv
pais,anio_fiscal,semana_desde,semana_hasta,estado,agendamientos
País ficticio A,2026,1,40,observado,120
País ficticio A,2026,41,41,preliminar,7
```

Una fila por país y corte. Los dos cortes deben contener el mismo conjunto de países. Un país ausente provoca rechazo; no se interpreta como cero. El conteo debe ser entero no negativo y seguro, sin separadores de miles ni decimales. La suma de cada corte debe conservar precisión entera. Se rechazan años distintos, semanas ajenas a los cortes admitidos, estados incompatibles, subtotales, duplicados por espacios/mayúsculas, columnas extra y archivos parcialmente inválidos. El orden de columnas puede cambiar.

Solo CSV UTF-8, coma, hasta 2 MiB y 10 000 filas. La interfaz limpia el valor del input para permitir seleccionar de nuevo el mismo archivo. Una carga nueva elimina datos y disponibilidad anteriores; las lecturas antiguas no pueden reemplazar una carga posterior ni repoblar el estado después de reset.

Los CSV de resultados llevan un esquema diferente con `nivel` y un total de selección: no son una plantilla de reimportación. La exportación contiene un solo corte, `base_fecha=creacion`, su estado, el total y los países seleccionados. Conserva la incertidumbre del calendario y la advertencia de completitud en cada fila. Los campos de disponibilidad quedan vacíos si no se declararon. No contiene columnas de cadena, nombres de archivo ni porcentajes derivados.

## Calendario y límites

- Las semanas se consideran de domingo a sábado, conservando la numeración fiscal de creación del origen.
- La correspondencia gregoriana de **creación** no fue comprobada directamente. El calendario de fecha de cita no basta para acreditarla. La interfaz y los CSV mantienen esa limitación y no asignan fechas gregorianas a los cortes.
- `observado` significa que existe un agregado bajo esos filtros; no certifica completitud. La semana 41 permanece preliminar.
- Refresco del reporte, fecha máxima de creación y fecha máxima de conversión son metadatos diferentes. Ninguno demuestra por sí mismo carga completa de cada sistema.
- Crear una cita, programarla, asistir y realizar una compra vinculada son hechos distintos. No hay datos compatibles para calcular asistencia, no-show, conversión ni cumplimiento de citas en este módulo.
- La validación comprueba estructura y aritmética. No comprueba filtros del BI, semántica de su medida, representatividad ni veracidad de los datos.

## Privacidad y verificación

La demo reutilizable contiene exclusivamente fixtures sintéticos. Los agregados autorizados, auditorías de origen, exports y copia privada preconfigurada se mantienen fuera del repositorio y se sirven desde una raíz local separada, únicamente en loopback. No hay conexión al BI, telemetría, red de datos ni almacenamiento persistente del navegador.

Pruebas: `agenda-tests.html` (36 de lógica) y `agenda-ui-tests.html` (26 de interfaz Chrome). Cubren ambos controles, filtros, exportación con advertencias, rechazo de faltantes, precisión, metadatos, recarga, concurrencia, reset, HTML como texto, recursos locales y viewport de 375 px. Las descargas de pruebas se capturan en memoria.

La API de integración privada `AgendaApp.loadFile(file, sourceContext)` acepta contexto opcional con `real`, `refreshedOn` y `countries` (país, máximos `createdThrough` y `convertedThrough`). Exige fechas válidas de 2026 y máximos no posteriores al refresco declarado. Solo cambia etiquetas y disponibilidad; nunca recalcula el conteo ni acredita la fuente. Una carga sin contexto borra metadatos anteriores.
