# Roadmap

Este documento distingue lo implementado de ideas pendientes. No promete fechas ni acredita uso real.

## Implementado en el módulo NPS

- CSV local UTF-8 con parser estricto, plantilla por país y dos formatos de origen compatibles.
- Validación de claves, campos, precisión entera, conciliación y NPS informado cuando exista.
- NPS calculado desde conteos, respuestas y grupos visibles; N/D con denominador cero.
- Rango fuente declarado explícito, filtro de país, gráfico y detalle por país. Sin nombres de cadenas en vista, estado o exportación.
- Exportación de la selección y errores, recarga, reset y descarte de lecturas antiguas.
- Fixtures sintéticos, pruebas de lógica y de interfaz, documentación y restricciones de privacidad.

## Pendiente antes de ampliar el producto

Agendamientos ya implementa volúmenes TY por país para fiscal creación 2026 semanas 1–40 y semana 41 preliminar, separados. Su correspondencia gregoriana permanece pendiente, no acredita completitud y no calcula tasas. Ver [alcance](docs/AGENDAMIENTOS.md).

| Módulo | Evidencia necesaria antes de implementar |
|---|---|
| Ampliar ventas | SNS EUR TY agregado ya implementado en EUR visibles a unidad. Faltan completitud/última fecha real por país, precisión subyacente y definición formal si se requieren neto/bruto/impuestos o comparaciones. |
| Ampliar cotizaciones | Los cuatro conteos por país ya están implementados. Recuperación significa venta cerrada después de 24 horas y hasta 120 días, según definición declarada. Faltan fecha de atribución, inclusividad de 24 horas y unidad documental exacta. Cohortes compatibles y madurez son necesarias para tasas. |
| Ampliar agendamientos | Correspondencia directa del calendario de creación, cobertura por sistema y periodos comparables. Asistencia/no-show/conversión requieren estados, numeradores, denominadores y madurez de una misma cohorte. |
| Tendencias NPS | Exportación con fechas o periodos disjuntos y conteos por grupo. No reconstruir semanas desde el agregado actual. |
| Comparaciones | Calendario verificado, fechas de inicio/fin y cortes completos comparables; mantener periodos parciales identificados. |

## Pendiente de producto y distribución

- Revisar compatibilidad en otros navegadores: la validación actual de interfaz es en Chrome del Mac.
- Evaluar límites de rendimiento próximos al máximo admitido.
- Conservar los avisos MIT y revisar derechos y licencia antes de incorporar nuevos materiales de terceros.
- Cualquier publicación, integración o conexión futura requiere una decisión de alcance y privacidad. No hay automatización de BI ni conexión en vivo implementada.

La existencia de este prototipo y sus pruebas no demuestra mantenimiento sostenido, adopción ni elegibilidad para programas OSS.

Cotizaciones se documenta en [COTIZACIONES.md](docs/COTIZACIONES.md). El alcance de implementación y validación está en [README.md](README.md) y [VERIFICATION.md](VERIFICATION.md).


## Integración completada

Entrada común con los cuatro módulos, navegación uniforme, cortes y cobertura por módulo, 34 escenarios de integración y 136 escenarios de regresión de interfaz. Se prepararon arranque local sencillo, manifiesto y paquete de revisión con fixtures sintéticos. El código y los ejemplos sintéticos se distribuyen bajo MIT; no se implementó despliegue web ni automatización de envío de solicitudes.
