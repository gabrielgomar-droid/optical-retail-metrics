# Uso del módulo NPS

## Preparar el archivo

Usa UTF-8, coma como separador, cabecera y hasta 10 000 filas de datos o 2 MiB. Se admiten BOM, CR/LF/CRLF, comas dentro de comillas y comillas escapadas duplicándolas. Los nombres de país y banner no pueden contener saltos de línea. La aplicación no adivina separadores ni formatos numéricos.

La plantilla recomendada contiene un único agregado por país para el mismo rango y población. No mezcles Retail y ecommerce, tipos de encuesta, países solapados, años ni rangos que se superpongan. No incluyas el total general ni subtotales.

Formato de plantilla:

| Columna | Contenido |
|---|---|
| `pais` | Nombre o etiqueta de país, sin datos personales |
| `detractores` | Entero no negativo |
| `neutros` | Entero no negativo |
| `promotores` | Entero no negativo |
| `respuestas` | Suma exacta de los tres grupos |

Los encabezados pueden reordenarse. Se recortan espacios de encabezados y valores y se normaliza Unicode NFC. Para duplicados se ignoran mayúsculas y espacios externos. Los conteos no admiten campos vacíos, separadores de miles, decimales, negativos, signos ni notación científica. El botón de plantilla descarga solo país y conteos.

Formato de resumen compatible:

`País / Cadena,Cadena,Detractor,Neutro,Promotor,Total`

También acepta `pais,banner,detractores,neutros,promotores,respuestas` para compatibilidad de origen. En ambos formatos se valida primero cada clave país/cadena, se suman los conteos de sus grupos y se descartan las etiquetas de cadena del estado visible. Solo queda una fila por país; no se promedian NPS de grupos. No se muestran nombres de cadenas ni nombres de archivo en la interfaz, resultados o exportaciones.

Admite además `% Detractor`, `% Neutro`, `% Promotor` y `NPS`. Los porcentajes se ignoran. Si el NPS informado existe, debe conciliar con los conteos dentro de 0,51 puntos para tolerar redondeo entero. Con cero respuestas solo se admite NPS vacío o cero; el indicador calculado siempre será N/D. Se rechazan otras columnas para evitar importar detalles personales o un esquema incorrecto.

## Cargar y explorar

1. Selecciona o arrastra un único CSV. También puedes comenzar con el ejemplo ficticio.
2. Declara las fechas de inicio y fin que se usaron en la fuente. Deben ser reales, ordenadas y del mismo año. No se muestran métricas hasta que sean válidas.
3. Opcionalmente declara el corte disponible de la fuente, que no puede ser anterior al fin del rango. Dejarlo vacío muestra que la frescura no está declarada. Este dato no se comprueba contra una conexión externa.
4. Filtra por país. La vista, el gráfico y la exportación contienen únicamente países y sus conteos agregados.
5. Revisa conteos y NPS. Los ceros se conservan; N/D distingue un denominador ausente de un resultado cero.

Cambiar el rango declarado cambia los metadatos, no los conteos. Para analizar otro periodo, vuelve a exportar el agregado correcto de tu fuente e importa ese CSV. La herramienta no reconstruye fechas ni semanas a partir de un agregado.

## Errores, recarga y exportación

Si hay un error se rechaza todo el archivo y se eliminan los resultados anteriores. La tabla muestra hasta 100 errores y su exportación incluye todos. Las filas se indican por número físico inicial, incluidos los saltos internos del CSV.

Una carga nueva reemplaza la anterior. Se puede elegir repetidamente el mismo archivo. Si una lectura anterior termina tarde, no sustituye a la carga posterior; limpiar durante una lectura impide que vuelva a poblar resultados.

**Exportar resultados** descarga la selección vigente y el periodo declarado, con una fila `TOTAL` separada de las filas `PAIS`, sin columna ni nombres de cadenas. No sumes la fila TOTAL con su detalle. El score N/D se exporta como celda vacía; las cifras se preservan y el NPS se redondea a seis decimales. Este formato de resultados no es una plantilla de importación.

Las etiquetas que parecen fórmulas se prefijan con apóstrofo para hojas de cálculo. Eso modifica deliberadamente su representación exportada. Los NPS negativos calculados se exportan como números. Revisa la carpeta de destino de las descargas: los resultados pueden contener datos empresariales si cargaste un archivo de ese tipo.

**Limpiar todo** borra datos, errores, filtros y fechas de la aplicación. No borra el archivo original ni las descargas guardadas en el equipo. Recargar la página también elimina el estado de la aplicación.

## Agendamientos

Abre `agendamientos.html` para los dos cortes fiscales de creación por país. Usa un esquema distinto al de NPS y requiere ambos cortes para cada país. Consulta [contrato, ejemplo y límites](AGENDAMIENTOS.md).

## Ventas EUR

Abre `ventas.html`; el esquema país/moneda/importe es distinto al de los otros módulos. La fila sin país se conserva. Lee [contrato, precisión y límites](VENTAS.md).

## Cotizaciones

Abre `cotizaciones.html`; importa país y cuatro conteos independientes. El grupo sin país puede seleccionarse. Declara el periodo 2026 del agregado y elige una medida para el gráfico. Las fechas no filtran filas. Exporta la selección con definición de recuperación, advertencia sobre cohortes y origen. Lee [contrato y límites](COTIZACIONES.md).
