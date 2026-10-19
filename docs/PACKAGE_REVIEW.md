# Revisión del paquete local

El ZIP contiene la versión sintética del producto bajo MIT. Contiene únicamente código, pruebas, documentación y los cuatro CSV ficticios de `examples/` seleccionados en `package-files.txt`.

## Construcción

```sh
python3 tools/prepare_package.py
```

El comando escribe en una carpeta `review-package` junto al proyecto. No usa Git para copiar archivos, no descarga dependencias y no envía contenido. La lista explícita evita incluir archivos nuevos sin revisión. Se rechazan rutas absolutas, segmentos de recorrido, symlinks, duplicados y archivos faltantes.

El ZIP contiene una carpeta superior `optical-retail-metrics/` y un `MANIFEST.json` con ruta relativa, tamaño y SHA-256 de cada archivo de producto. El manifiesto no se incluye en su propia lista de hashes. Un archivo SHA-256 externo permite comprobar el ZIP. La verificación por hash prueba integridad respecto al manifiesto; no demuestra autoría, seguridad o permiso de distribución.

## Revisión aplicada

- Inclusión explícita: fuentes, pruebas, cuatro fixtures sintéticos y documentación.
- Exclusión: `.git`, borradores, exportaciones, originales BI, auditorías privadas, boots con datos reales, capturas, credenciales y artefactos previos.
- Búsqueda local de controles reales conocidos y etiquetas del origen, sin copiar esa lista privada al paquete.
- Búsqueda de URLs BI, rutas personales, tokens y claves; revisión de enlaces y dependencias.
- Comprobación de miembros, hashes y ausencia de symlinks o rutas fuera de la carpeta superior.

No se encontraron coincidencias privadas en los archivos seleccionados. Esta revisión reduce riesgos conocidos; no es un detector infalible de secretos o derechos de terceros. Los contratos y ejemplos del prototipo no acreditan completitud o uso real.

## Antes de una futura publicación

Revisar el listado y el contenido, conservar los avisos MIT y revisar licencias de nuevos componentes, y repetir pruebas y escaneo después de cualquier cambio. No incorporar archivos de las copias privadas. El paquete no incluye despliegue ni datos privados.
