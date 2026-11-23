# Optical Retail Metrics

[English](README.md)

**Analítica open source y orientada a privacidad para equipos de retail y Customer Experience.**

Optical Retail Metrics es una herramienta estática en etapa temprana para explorar localmente métricas agregadas de NPS, agendamientos, ventas y recuperación de cotizaciones.

El proyecto nació de casos de uso de retail óptico, pero su arquitectura busca ser genérica: los datos permanecen en el equipo del usuario, los ejemplos públicos son sintéticos y la aplicación no requiere backend, telemetría, cuenta ni conexión a Internet.

> Estado: proyecto OSS en etapa temprana. **No se afirma** adopción pública, uso productivo ni una comunidad externa de contribuidores. El objetivo es volverlo más fácil de probar, revisar y mejorar de forma pública.

## Qué problema intenta resolver

Muchos equipos de retail y CX necesitan revisar exportaciones operativas sin subir información sensible a otro servicio. El proyecto explora un enfoque simple:

- procesar CSV localmente en el navegador;
- validar el esquema antes de calcular;
- distinguir cero de dato ausente;
- no inventar tasas cuando las cohortes o denominadores no son comparables;
- exportar únicamente la selección activa;
- usar fixtures sintéticos para pruebas públicas.

## Módulos

| Módulo | Qué muestra | Límite importante |
|---|---|---|
| NPS | conteos y NPS ponderado | no reconstruye series de tiempo |
| Agendamientos | volúmenes por periodo | no calcula asistencia/conversión sin cohortes compatibles |
| Ventas | totales EUR por país | no agrega interpretación contable no declarada |
| Cotizaciones | ofrecimientos, cotizaciones, Venta App y recuperaciones cerradas | las medidas son independientes; no inventa conversión |

## Probarlo localmente

Requisitos: Python 3 y un navegador moderno.

```bash
git clone https://github.com/gabrielgomar-droid/optical-retail-metrics.git
cd optical-retail-metrics
python3 serve_demo.py
```

Abre **http://127.0.0.1:8765/home.html**.

## Demo pública

Se incluye un workflow de GitHub Pages en `.github/workflows/pages.yml`. Cuando Pages quede habilitado y el despliegue termine correctamente, la URL prevista es:

**https://gabrielgomar-droid.github.io/optical-retail-metrics/home.html**

No debe afirmarse que la demo está publicada hasta que GitHub confirme un despliegue exitoso.

## Verificación

El repositorio documenta actualmente:

- **176/176** pruebas de lógica;
- **136/136** escenarios de interfaz en la corrida registrada de Chrome;
- fixtures sintéticos;
- neutralización de fórmulas en exportaciones CSV;
- límites explícitos de filas/tamaño y rechazo de esquemas inválidos;
- ausencia de backend, telemetría y persistencia.

Consulta [VERIFICATION.md](VERIFICATION.md) para alcance y limitaciones.

## Cómo contribuir

No necesitas programar. Son útiles:

- reportes reproducibles de compatibilidad;
- propuestas para definiciones genéricas de KPI;
- edge cases sintéticos de CSV;
- mejoras de accesibilidad;
- fixtures reproducibles;
- casos de uso genéricos de retail/CX que no dependan de información privada.

Lee [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir un PR.

## Privacidad

No publiques en este repositorio:

- datos personales de clientes o empleados;
- exportaciones internas de empresas;
- credenciales, tokens o URLs privadas;
- capturas propietarias o materiales de marca sin autorización;
- datasets operativos reales sin permiso y licencia adecuada.

Usa datos sintéticos o con licencia independiente.

## Roadmap

La prioridad es generar utilidad real y feedback auténtico:

1. habilitar una demo pública;
2. conseguir testers externos;
3. convertir feedback en issues reales;
4. mejorar accesibilidad y compatibilidad;
5. preparar releases reproducibles;
6. generalizar únicamente lo que aporte valor.

Consulta [ROADMAP.md](ROADMAP.md).

## Licencia

MIT para el código y los fixtures sintéticos incluidos aquí. La licencia no se extiende a información empresarial o de terceros que no forme parte del repositorio.

---

Si trabajas en retail óptico, operaciones, CX o analítica con requisitos de privacidad, puedes probarlo y abrir un issue con una **reproducción sintética**. El feedback real vale más que acumular estrellas.
