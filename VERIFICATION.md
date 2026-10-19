# Verificación reproducible

## Resultados de esta sesión

| Suite | Lógica JavaScriptCore y Chrome | Interfaz Chrome |
|---|---:|---:|
| CSV + NPS | 80/80 (36 + 44) | 27/27 |
| Agendamientos | 36/36 | 26/26 |
| Ventas EUR | 30/30 | 25/25 |
| Cotizaciones | 30/30 | 24/24 |
| Integración de entrada y navegación | — | 34/34 |
| Total | **176/176** | **136/136** |

Cada módulo mantiene su propia selección y definición. La integración verifica los cinco enlaces de navegación y página activa, cortes y límites en la entrada, estado inicial vacío, ejemplo, importación repetida mediante input, exportación de país con etiqueta que parece fórmula, Back/Forward, reset, recarga, recursos locales y 375 px. Las cuatro suites de interfaz también incluyen errores de formato/UTF-8/tamaño, concurrencia y lecturas antiguas, selección, exportación y contexto de origen. No se guardan descargas de prueba.

Controles ficticios: NPS 180 respuestas y 34,444… puntos; agendas 200 y 10 en cortes separados; ventas 2025 EUR; cotizaciones 205/102/131/26 como cuatro cantidades independientes. Las sumas por país concilian con cada tarjeta y exportación. El país sin asignar se conserva en ventas y cotizaciones.

## Lógica

Desde la carpeta del proyecto, en este Mac:

```sh
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc tests.js nps-tests.js agenda-tests.js ventas-tests.js cotizaciones-tests.js
```

Salida observada: 176 líneas PASS y código de salida 0. La suite NPS informa el acumulado CSV+NPS de 80; no vuelvas a sumar sus 36 CSV a ese acumulado.

Las suites incluyen una entrada alternativa para Node, pero **Node no se instaló ni ejecutó en esta sesión**. No se necesita para usar el producto.

## Navegador

```sh
python3 serve_demo.py
```

Abre `http://127.0.0.1:8765/regression.html`. Ejecuta secuencialmente las cuatro suites de interfaz y la integración, y muestra el total observado. Se volvió a ejecutar después de sustituir el servidor inicial por el servidor final de demo.

Suites individuales: `tests.html`, `agenda-tests.html`, `ventas-tests.html`, `cotizaciones-tests.html`, `ui-tests.html`, `agenda-ui-tests.html`, `ventas-ui-tests.html`, `cotizaciones-ui-tests.html`, `integration-tests.html`.

La entrada `home.html` y las vistas fueron revisadas visualmente. Se comprobó que el servidor final sirve los recursos necesarios y rechaza metadatos Git, borradores, directorios y recorridos fuera de la raíz. `serve_demo.py` solo escucha en 127.0.0.1.

## Revisión del paquete

`tools/prepare_package.py` toma una lista explícita de archivos, rechaza rutas fuera de la raíz y symlinks, crea manifiesto por archivo y comprueba la integridad del ZIP. Una revisión local adicional buscó cifras reales conocidas, marcas del origen, URLs BI, rutas privadas, credenciales y archivos no permitidos. No se encontraron coincidencias en el paquete preparado. Véase [alcance de la revisión](docs/PACKAGE_REVIEW.md).

## Límites

Chrome del Mac y JavaScriptCore son los entornos ejecutados. No se verificaron otros navegadores, Node, lectores de pantalla específicos, rendimiento próximo al máximo ni una auditoría independiente de seguridad. La captura de descargas comprueba el Blob, no el diálogo ni el destino del sistema.

La comprobación estructural y aritmética no acredita veracidad, fechas de los hechos, completitud, representatividad o compatibilidad de cohortes. Los agregados privados se reconciliaron fuera del repositorio; sus datos y URLs no se incluyen aquí. El historial del navegador puede conservar páginas en memoria al volver; reset vacía el estado y recarga inicia la demo vacía. Las copias privadas preconfiguradas vuelven a cargar su agregado al recargar.

Estas pruebas respaldan un prototipo funcional, no adopción, importancia en un ecosistema ni mantenimiento sostenido.
