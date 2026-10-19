# KPIs y límites de interpretación

## Definición implementada

Sean P los promotores, D los detractores, N los neutros y R las respuestas del mismo conjunto:

`R = D + N + P`

`NPS = 100 × (P − D) / R`

Se suman primero los conteos de los grupos seleccionados. Esto equivale a ponderar los NPS por sus respuestas cuando los grupos son disjuntos y usan la misma definición; no se promedian scores de filas. Los neutros forman parte del denominador.

El resultado se expresa en puntos de −100 a +100, con una cifra decimal en pantalla. Si R = 0 se muestra N/D y se conserva el conteo cero. Los conteos se manejan como enteros seguros de JavaScript y se rechazan desbordamientos de filas o totales.

La herramienta recibe categorías agregadas ya clasificadas por la fuente. No recibe notas individuales ni vuelve a clasificar respuestas. No determina personas únicas, deduplicación de encuestados, elegibilidad de la encuesta, sesgo de respuesta ni representatividad estadística.

## Ejemplo ficticio verificable

| Grupo | D | N | P | R | NPS |
|---|---:|---:|---:|---:|---:|
| País ficticio A / Norte | 12 | 18 | 70 | 100 | 58,0 |
| País ficticio A / Centro | 6 | 9 | 15 | 30 | 30,0 |
| País ficticio B / Sur | 25 | 5 | 20 | 50 | −10,0 |
| País ficticio C / Este | 0 | 0 | 0 | 0 | N/D |
| Total disjunto | 43 | 32 | 105 | 180 | 34,4 |

El NPS de País ficticio A es `100 × (85 − 18) / 130 = 51,538…`, no el promedio simple de 58 y 30.

## Límites temporales y de cobertura

El formato agregado no contiene fechas por fila. El rango de la fuente es una declaración del usuario, visible en pantalla y exportación; no es un filtro temporal ni prueba de que el origen contiene únicamente ese año. Es necesario verificarlo en la fuente antes de exportar.

No se implementan tendencias, comparación de periodos, calendario ISO/fiscal, intervalos de confianza, alertas, metas, pronósticos ni inferencias causales. Una actualización técnica del modelo no demuestra que las fechas de negocio estén completas hasta hoy. Las poblaciones y cohortes de respuesta y compra pueden ser distintas.

No se deben mezclar subtotales con detalles, poblaciones solapadas, canales o clases de encuesta incompatibles. Las columnas extra y duplicados país/banner se rechazan, pero una inconsistencia semántica puede no detectarse mediante validación estructural.

## Volúmenes de agendamientos

`Agendamientos TY` es el conteo agregado del origen para la cohorte fiscal de **fecha de creación**, 2026. La tarjeta suma países disjuntos dentro de un único corte. Se ofrecen semanas 1–40 observado y semana 41 preliminar; no se mezclan, no se calcula una variación entre ellos y no se interpolan semanas. Cero requiere una fila explícita; ausencia provoca rechazo.

La correspondencia gregoriana de creación permanece pendiente. Semanas domingo–sábado, fecha máxima por país y refresco del reporte no bastan para afirmar completitud de la carga. Fechas de conversión visibles son metadatos del origen, no una cantidad ni una tasa. Asistencia, no-show y conversión requieren indicadores y cohortes compatibles que todavía no existen en el módulo. Ver [contrato completo](AGENDAMIENTOS.md).

## Cantidades de cotizaciones

Ofrecimientos, cotizaciones, Venta App y recuperaciones cerradas se conservan como cuatro cantidades independientes del modelo. No se suman entre sí, no se asigna moneda ni se impone un embudo de personas únicas. La definición declarada de recuperación es venta ya cerrada después de 24 horas y hasta 120 días; la inclusividad exacta de 24 horas no está comprobada. Cotizaciones recientes aún pueden recuperarse. Fecha de atribución y unidad documental pendientes impiden presentar su cociente como tasa final de conversión. Ver [contrato](COTIZACIONES.md).
