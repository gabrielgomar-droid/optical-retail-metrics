# Privacidad y manejo de archivos

La aplicación procesa el archivo elegido mediante File.arrayBuffer y TextDecoder en el navegador. Solo conserva el contenido en memoria JavaScript. No incorpora cuentas, conexiones a BI, APIs, CDN, analítica, cookies, localStorage, sessionStorage, IndexedDB ni service worker.

La política CSP bloquea conexiones mediante `connect-src 'none'`. Los scripts y estilos se sirven desde el mismo servidor local; no se necesita Internet para usar el módulo. El servidor recomendado se limita a 127.0.0.1 y entrega archivos estáticos del proyecto. El navegador no envía el archivo importado a ese servidor.

No cargues datos personales, nombres de clientes, empleados, pacientes, recetas ni contactos. Usa solo agregados que tengas autorización para procesar. La vista, el estado y las exportaciones se limitan a país y métricas agregadas: se descartan las etiquetas de cadena después de validar el origen. Tampoco se muestra el nombre del archivo elegido. Las cabeceras admitidas son una protección de formato, no un detector infalible de información sensible dentro de los valores.

Guarda archivos de negocio originales y exportaciones en una carpeta privada **fuera del repositorio y de la carpeta servida por HTTP**. No copies datos reales, URLs privadas ni capturas empresariales a código, pruebas, documentación, issues, PR, demos, Library o solicitudes de programas externos. Las demostraciones y fixtures del proyecto son sintéticos.

Una copia privada preconfigurada puede cargar un agregado por país guardado fuera de Git y servirlo exclusivamente por 127.0.0.1. Esos archivos sí contienen datos de negocio y no deben publicarse. Su raíz HTTP no debe incluir originales con cadenas ni notas privadas. Al recargar esa copia, se vuelve a cargar el agregado local; limpiar solo vacía el estado de la página. No es un despliegue ni un servicio externo.

Las descargas se generan con Blob y una URL temporal del navegador, que se revoca. Su destino depende de la configuración de descargas del navegador; revisa esa ubicación antes de guardar datos de negocio. Limpiar o recargar la aplicación no borra archivos ni descargas del disco.

Las etiquetas se muestran con textContent y se neutralizan como fórmulas en la exportación CSV. El exportador mantiene los números calculados, incluidos NPS negativos, como números. El CSV exportado se considera otro archivo de negocio cuando procede de datos reales.

El `.gitignore` reduce cargas accidentales de CSV, hojas de cálculo, exportaciones y borradores. No reemplaza permisos de sistema, revisión de archivos ni control de acceso. No es una garantía contra extensiones del navegador, malware, capturas de pantalla, copias manuales o publicación posterior. No se ha realizado una auditoría de seguridad independiente.

## Agendamientos

El importador de agendamientos admite exclusivamente países y seis campos agregados definidos en su plantilla; rechaza columnas adicionales. Nunca muestra el nombre del archivo elegido. La exportación contiene un corte, total y países seleccionados, metadatos de disponibilidad opcionales y límites de interpretación; sin cadenas ni identificadores personales. Una carga nueva sin contexto borra la disponibilidad anterior, y reset elimina datos, errores y fechas declaradas de la vista.

La copia con datos reales y sus scripts de construcción, auditorías y resultados viven fuera de Git y fuera de la raíz del servidor de la demo sintética. No se deben copiar al repositorio al preparar una futura publicación.


## Entrada y navegación

La demo y las copias privadas usan entradas separadas. La navegación abre documentos independientes y no transfiere archivos entre módulos. El historial puede restaurar una página con su estado en memoria; reset lo vacía. Recargar una demo comienza sin datos, mientras que una copia privada preconfigurada vuelve a cargar el agregado que contiene su boot local.

`serve_demo.py` limita la demo a loopback y a archivos de producto; no ofrece listados de directorio ni sirve metadatos Git o borradores. La lista explícita de empaquetado incluye solo cuatro fixtures sintéticos. Los scripts, entradas y datos preconfigurados de las vistas privadas no forman parte del ZIP.

Ventas y cotizaciones aceptan esquemas propios por país y conservan el grupo sin asignar. El producto no incorpora nombres de cadenas en sus vistas o exportaciones. El contexto declarado de fuente, precisión y cobertura no constituye verificación automática del BI.
