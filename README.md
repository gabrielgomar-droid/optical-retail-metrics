# Optical Retail Metrics

Prototipo web local en español para **NPS, agendamientos, ventas EUR y cotizaciones por país**. Importa CSV agregados, valida su estructura, muestra gráficos y tablas y exporta la selección. Los ejemplos son completamente ficticios. No hay uso operativo, usuarios, adopción ni afiliación empresarial acreditados.

## Abrir en dos pasos

Requisitos: Python 3 y un navegador moderno con File API, TextDecoder y campos de fecha. No requiere npm, paquetes, cuenta ni conexión a Internet.

1. En la carpeta del proyecto, ejecuta:

   ```sh
   python3 serve_demo.py
   ```

2. Abre **http://127.0.0.1:8765/home.html** y elige un módulo. Pulsa **Explorar ejemplo ficticio**.

En macOS también puedes ejecutar `bash "Abrir demo.command"` desde esta carpeta. Mantén la terminal abierta; `Ctrl+C` detiene ese servidor. Si el puerto está ocupado, el comando lo indica y conserva el proceso existente. El servidor se limita a loopback y no sirve metadatos de Git, borradores ni directorios. No abras la aplicación mediante `file://`.

## Cuatro alcances independientes

| Módulo | Ejemplo sintético | Límites que se mantienen visibles |
|---|---|---|
| [NPS](index.html) | 180 respuestas y 34,4 puntos; septiembre 2026 | Ponderación desde conteos; cero respuestas es N/D. Sin semanas reconstruidas ni representatividad acreditada. |
| [Agendamientos](agendamientos.html) | 200 para fiscal creación semanas 1–40 y 10 para semana 41 preliminar de 2026 | Cortes separados. Correspondencia gregoriana de creación pendiente, sin tasas ni variación entre duraciones distintas. |
| [Ventas EUR](ventas.html) | 2025 EUR: 1200 + 800 + 25 sin país; 1–17 septiembre 2026 | EUR visibles a unidad, sin centavos ni definición contable completa acreditados. Negativos y país ausente se conservan. |
| [Cotizaciones](cotizaciones.html) | 205 ofrecimientos, 102 cotizaciones, 131 Venta App y 26 recuperaciones cerradas; 1–17 septiembre 2026 | Cuatro cantidades independientes. Recuperaciones ya cerradas, cohorte reciente aún recuperable y fecha de atribución pendiente; sin tasa. |

La entrada común no calcula un total entre módulos ni impone un rango global. Cada archivo conserva su alcance. Declarar fechas describe el agregado completo; no filtra días dentro del CSV ni certifica completitud.

## Importar y exportar

Usa solo agregados autorizados, UTF-8 y la plantilla del módulo. El límite común es 2 MiB y 10 000 filas. Se rechaza el archivo completo si su esquema, conteos o cobertura exigida son inválidos. Las columnas extra y subtotales no se admiten. Cero, dato ausente y país sin asignar tienen significados diferentes.

El filtro por país determina tarjetas, gráfico, tabla y exportación. Las exportaciones distinguen total y detalle: no sumes ambos. Las etiquetas que parecen fórmulas se neutralizan para hojas de cálculo. El formato de resultados no es la plantilla de importación.

Cada vista usa memoria independiente. Navegar no combina estados. El navegador puede restaurar una página al volver; **Limpiar todo** vacía explícitamente datos, errores, filtros y metadatos. Recargar la demo comienza sin datos. Limpiar no borra archivos o descargas del disco.

Guarda datos reales y exportaciones fuera del repositorio y de la carpeta servida. La demo no incluye copias privadas ni información empresarial. Consulta [uso](docs/USAGE.md), [NPS y KPIs](docs/KPIS.md), [agendas](docs/AGENDAMIENTOS.md), [ventas](docs/VENTAS.md), [cotizaciones](docs/COTIZACIONES.md) y [privacidad](docs/PRIVACY.md).

## Verificación

- **176/176** pruebas de lógica en JavaScriptCore: 36 CSV, 44 NPS, 36 agendas, 30 ventas y 30 cotizaciones. Las suites también pasaron en Chrome.
- **136/136** escenarios de interfaz Chrome: 27 NPS, 26 agendas, 25 ventas, 24 cotizaciones y 34 de integración.
- Incluye navegación Back/Forward, reset, recarga, importaciones repetidas, exportación segura, concurrencia, errores, recursos locales y ancho de 375 px.

Abre **http://127.0.0.1:8765/regression.html** para repetir toda la interfaz. Los fixtures son sintéticos y las descargas se capturan en memoria. [VERIFICATION.md](VERIFICATION.md) incluye comandos, suites y límites de estas comprobaciones.

## Distribución y continuidad

Aplicación estática sin backend de datos, dependencias descargadas, telemetría ni persistencia. [Arquitectura](docs/ARCHITECTURE.md), [contribución](CONTRIBUTING.md), [roadmap](ROADMAP.md), [componentes y procedencia](THIRD_PARTY_NOTICES.md) y [licencia MIT](LICENSE).

El código se desarrolló con asistencia de IA durante esta sesión. No se atribuye al usuario una trayectoria de mantenimiento anterior. Se distribuye el código y los fixtures sintéticos de este proyecto bajo [MIT](LICENSE). Esa licencia no se aplica a datos de negocio, reportes, marcas o materiales de terceros, que no se incluyen. El repositorio es un prototipo nuevo: no se acredita uso operativo, adopción, importancia en un ecosistema ni mantenimiento sostenido. Publicar código no garantiza selección en un programa externo.

Para preparar un archivo revisable después de un cambio, ejecuta `python3 tools/prepare_package.py`. Solo empaqueta la lista explícita de `package-files.txt`; consulta [revisión del paquete](docs/PACKAGE_REVIEW.md) antes de compartirlo.
