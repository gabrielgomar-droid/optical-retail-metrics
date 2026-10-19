# Cotizaciones por país

Módulo local de cuatro cantidades independientes: ofrecimientos, cotizaciones, Venta App y recuperaciones cerradas. Importa CSV agregados, filtra por país, muestra una medida a la vez en el gráfico y exporta la selección. No exige que las cantidades estén ordenadas como un embudo ni las suma entre sí.

## Contrato de importación

```csv
pais,ofrecimientos,cotizaciones,venta_app,recuperaciones_cerradas
País ficticio A,120,60,80,15
País ficticio B,80,40,50,10
,5,2,1,1
```

UTF-8, coma, hasta 2 MiB y 10 000 filas. Encabezados reordenables, sin columnas extra; una fila por país, incluida como máximo una con país vacío. La celda vacía identifica el grupo sin país asignado. Los cuatro conteos deben ser enteros no negativos y seguros, sin separadores, decimales ni campos vacíos. Un cero debe ser explícito. Se rechazan duplicados, subtotales y el archivo completo si existe cualquier error. No se rellenan países ausentes con cero.

El ejemplo es completamente ficticio y concilia, por separado, **205**, **102**, **131** y **26**. No representa cobertura ni uso empresarial.

## Medidas y temporalidad

| Columna | Etiqueta de medida del origen |
|---|---|
| `ofrecimientos` | OFRECIMIENTOS TY |
| `cotizaciones` | Q COTIZACIONES TY |
| `venta_app` | Q RECUPEROS APP TY |
| `recuperaciones_cerradas` | Q RECUPEROS TY |

Son cantidades del modelo; no se acredita la unidad documental exacta, deduplicación de personas ni correspondencia uno a uno entre medidas. Venta App no se interpreta como importe ni recibe moneda.

La definición declarada de recuperación es una cotización que terminó posteriormente en una **venta ya cerrada**, después de 24 horas y hasta 120 días. La inclusividad exacta del límite de 24 horas sigue sin confirmar. Las cotizaciones recientes todavía pueden recuperarse: la inmadurez corresponde a esa cohorte de cotizaciones, no a ventas recuperadas pendientes de cierre.

Las fechas gregorianas de 2026 describen el corte completo del archivo. No filtran sus filas ni prueban una cohorte común. Sigue pendiente si las recuperaciones se atribuyen a la fecha original de cotización o a la fecha de compra. El módulo muestra los conteos con esa limitación y **no calcula tasas de conversión**. Tampoco certifica completitud ni última fecha real por país.

## Exportación y origen

La exportación incluye una fila `TOTAL_SELECCION`, seguida de filas `PAIS`, con las cuatro cantidades, estado de asignación del país, periodo, definición de recuperación, advertencia de cohorte, cobertura y origen declarado. No sumes total y detalle. El formato de resultados no se reimporta como plantilla. Etiquetas que parecen fórmulas reciben un apóstrofo.

La copia privada puede declarar una consulta nativa con filtros replicados y controles del visual original conciliados. Eso no la convierte en una exportación nativa del visual original ni en verificación automática del BI. La aplicación funciona sin conexión, no guarda archivos importados ni conserva nombres de archivo o etiquetas de cadenas en sus resultados. Los originales y auditorías reales permanecen fuera del repositorio.

## Verificación

- `cotizaciones-tests.html`: 30/30 pruebas de lógica, también ejecutadas en JavaScriptCore.
- `cotizaciones-ui-tests.html`: 24/24 escenarios en Chrome, con fixtures ficticios y descargas capturadas en memoria.
- Filtro de país, grupo sin asignar, cuatro totales, periodo, exportación, errores, concurrencia, reset, texto seguro, ausencia de solicitudes de datos y ancho de 375 px verificados.
