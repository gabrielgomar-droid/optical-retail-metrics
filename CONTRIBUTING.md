# Contribuir

El proyecto es un prototipo en etapa inicial, distribuido bajo MIT. Esta guía describe el flujo propuesto para revisar cambios; no acredita colaboradores ni contribuciones previas.

1. Trabaja en una rama de desarrollo y limita el cambio a una necesidad comprobable.
2. Usa exclusivamente fixtures sintéticos, sin marcas reales, datos personales, archivos de negocio, URLs privadas, capturas empresariales ni credenciales.
3. Explica grano, población, numerador, denominador y periodo antes de añadir un KPI. Conserva ceros y valores ausentes con significados distintos.
4. Añade pruebas cuando cambie lógica o comportamiento. Comprueba que tarjetas, filtros, tabla y exportación usan la misma selección.
5. Ejecuta lógica e interfaz siguiendo `VERIFICATION.md`. Revisa al menos el ejemplo completo, un caso inválido y un ancho móvil.
6. Describe problema, cambio, validación y límites pendientes en la revisión. No afirmes uso, impacto, popularidad o historial que no exista.

Las fusiones, despliegues y cambios de distribución deben respetar la autorización del propietario. Un futuro módulo comercial debe introducir su propio esquema y pruebas, sin reinterpretar conteos de NPS ni compartir denominadores incompatibles.

Ante un posible fallo de privacidad, conserva una reproducción sintética mínima y comunícala al propietario por un canal privado autorizado. No publiques los datos que originaron el problema.


Antes de proponer un cambio de navegación, ejecuta `regression.html` completo. Conserva cortes, unidades y advertencias de cada módulo; no introduzcas filtros o totales globales que mezclen cohortes. Comprueba Back/Forward, reset, recarga e importación repetida y revisa una pantalla de 375 px.

Si añades un archivo distribuible, revísalo antes de incluirlo en `package-files.txt`. Reconstruye el paquete y verifica sus hashes, lista y privacidad. Registra cualquier componente externo en `THIRD_PARTY_NOTICES.md`; conserva los avisos MIT del código original y documenta por separado cualquier licencia de terceros. Mantén los borradores de solicitud fieles al estado comprobado y fuera de cualquier envío automático.
