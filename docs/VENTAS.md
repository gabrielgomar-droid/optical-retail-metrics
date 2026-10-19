# Ventas EUR por país

Vista local de **SNS EUR TY**, conservando la etiqueta del modelo sin afirmar neto, bruto ni tratamiento de impuestos. Solo admite EUR explícito e importes visibles con cero decimales. No convierte monedas ni aplica multiplicadores; no acredita centavos subyacentes o precisión contable.

Con el servidor de la demo abre `http://127.0.0.1:8765/ventas.html`. El ejemplo ficticio concilia **1200 + 800 + 25 = 2025 EUR**: dos países ficticios y un grupo sin país asignado. El filtro incluye ese grupo como opción separada. No se descarta ni se reasigna para ocultar una discrepancia.

## CSV y periodo

```csv
pais,moneda,importe_eur
País ficticio A,EUR,1200
,EUR,25
```

Una fila por país; celda vacía significa país no asignado. El conteo de filas sin país debe ser como máximo uno. Se rechazan duplicados por espacios/mayúsculas, subtotales, nombres con controles o más de 100 caracteres, columnas extra y monedas distintas de EUR. El importe debe ser un entero seguro, sin separadores, decimales, notación científica o sufijos mil/millón. Se conservan ceros y negativos del origen; un archivo parcialmente inválido se rechaza completo. La suma también debe mantener precisión entera.

Carga UTF-8, coma, hasta 2 MiB y 10 000 filas. Declara fechas gregorianas válidas de 2026, ordenadas. El periodo describe todo el agregado: no filtra días ni reconstruye semanas. Una nueva carga borra el contexto y fechas anteriores; sin periodo válido no se muestran importes ni se exportan. Reset invalida lecturas pendientes.

La exportación contiene total de selección y países elegidos, estado `sin_asignar` cuando corresponda, moneda, medida, periodo, precisión, origen declarado y limitación de cobertura. Su esquema de resultados es diferente al de importación. Nombres de archivo y cadenas no aparecen en la vista o exportación.

## Origen y cobertura

Los agregados reales y sus filtros se documentan fuera del repositorio. La copia privada identifica si proviene de una consulta nativa con filtros replicados; no debe describirse como exportación del visual original SNS TY. Cambiar medida, país de hechos frente a país de la dimensión o exclusiones puede cambiar el perímetro: los controles de alcance diferente se conservan separados.

La aplicación solo valida estructura y aritmética. No consulta el BI ni verifica sus filtros, fórmula, completitud, última fecha real por país, tasa de cambio o impuestos. Refresco del reporte no equivale a carga completa. Conciliar los valores visibles redondeados no garantiza conciliación a centavos. No hay PY, presupuesto, pronóstico, comparaciones ni serie semanal derivada del agregado.

## Verificación y privacidad

30 pruebas de lógica en `ventas-tests.html`; 25 escenarios de interfaz Chrome en `ventas-ui-tests.html`, con fixtures ficticios. Cubren EUR único, grupo sin país, precisión, negativos, periodos, exportación, errores, concurrencia, reset, recursos locales y viewport de 375 px. Las descargas de prueba se capturan en memoria. Reproduce lógica con la ruta de JavaScriptCore indicada en `VERIFICATION.md`, añadiendo `ventas-tests.js`.

Los originales, auditorías, CSV de resultados y copia preconfigurada real se mantienen fuera de Git, en una raíz de servidor privada distinta de la demo. La política `connect-src 'none'` bloquea conexiones de datos; no hay telemetría ni almacenamiento persistente. Los ejemplos del repositorio son sintéticos.
