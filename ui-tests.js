(async function () {
  'use strict';
  const frame = document.getElementById('app'), results = [];
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function until(fn) { const end = Date.now() + 2500; while (!fn()) { if (Date.now() > end) throw new Error('Tiempo de espera agotado'); await wait(20); } }
  function assert(value, message = 'Aserción fallida') { if (!value) throw new Error(message); }
  async function test(name, fn) {
    try { await fn(); results.push({ name, pass: true }); } catch (e) { results.push({ name, pass: false, error: e.message }); }
    const result = results[results.length - 1], li = document.createElement('li'); li.textContent = (result.pass ? '✓ ' : '✗ ') + name + (result.error ? ' — ' + result.error : ''); if (!result.pass) li.className = 'fail'; document.getElementById('test-results').appendChild(li);
  }
  try {
    await until(() => frame.contentWindow && frame.contentWindow.NPSApp);
    const w = frame.contentWindow, d = frame.contentDocument, $ = id => d.getElementById(id);
    const metrics = () => [...d.querySelectorAll('.metric-value')].map(n => n.textContent);
    const change = (id, value) => { $(id).value = value; $(id).dispatchEvent(new w.Event('change', { bubbles: true })); };
    const example = () => $('example').click();
    const period = () => { change('period-start', '2026-09-01'); change('period-end', '2026-09-30'); change('as-of', '2026-09-30'); };
    const file = (text, name = 'fixture-sintetico.csv') => new w.File([text], name, { type: 'text/csv' });
    const valid = () => file(w.NPS.exampleCSV());
    const head = 'pais,banner,detractores,neutros,promotores,respuestas\n';

    await test('Inicio vacío y exportación desactivada', () => { assert($('workspace').hidden); assert($('errors').hidden); assert($('export-results').disabled); assert($('period-start').value === ''); });
    await test('Ejemplo ficticio muestra conteos y NPS ponderado', () => { example(); assert(!$('workspace').hidden); assert(metrics()[0] === '34,4'); assert(metrics()[1] === '180'); assert($('status').textContent.includes('ficticio')); assert($('selection-note').textContent.includes('2026-09-01')); });
    await test('Gráfico y tabla concilian con grupos del ejemplo', () => { assert(d.querySelectorAll('.country-row').length === 3); assert($('detail-body').children.length === 3); assert(d.querySelectorAll('.nps-bar.negative').length === 1); });
    await test('Filtro país recalcula por conteos', () => { change('country', 'país ficticio a'); assert(metrics()[0] === '51,5'); assert(metrics()[1] === '130'); assert($('detail-body').children.length === 1); });
    await test('No muestra controles ni nombres de cadenas', () => { assert(!$('banner')); assert(!d.body.textContent.includes('Banner ficticio')); assert(metrics()[1] === '130'); });
    await test('Cambiar país reemplaza el alcance agregado', () => { change('country', 'país ficticio b'); assert(metrics()[0] === '-10,0'); assert(metrics()[1] === '50'); assert($('detail-body').children.length === 1); });
    await test('Cero respuestas se representa N/D', () => { change('country', 'país ficticio c'); assert(metrics()[0] === 'N/D'); assert(metrics()[1] === '0'); assert(d.querySelectorAll('.nps-bar').length === 0); });
    await test('Descarga contiene exactamente selección y rango declarado', async () => {
      change('country', 'país ficticio b'); let captured;
      const create = w.URL.createObjectURL, click = w.HTMLAnchorElement.prototype.click, revoke = w.URL.revokeObjectURL;
      try { w.URL.createObjectURL = blob => { captured = blob; return 'blob:prueba-sintetica'; }; w.URL.revokeObjectURL = () => {}; w.HTMLAnchorElement.prototype.click = function () {};
        $('export-results').click(); assert(captured); const exported = w.CSVLocal.read(await captured.text()); assert(exported.records.length === 2); assert(exported.records[0].values[8] === '50'); assert(exported.records[0].values[9] === '-10'); assert(exported.records[1].values[1] === 'País ficticio B'); assert(exported.records[0].values[2] === '2026-09-01');
      } finally { w.URL.createObjectURL = create; w.HTMLAnchorElement.prototype.click = click; w.URL.revokeObjectURL = revoke; }
    });
    await test('Periodo invertido bloquea métricas y exportación', () => { change('period-start', '2026-10-01'); assert($('export-results').disabled); assert(metrics().length === 0); assert($('period-message').textContent.includes('posterior')); });
    await test('Cruce de años se rechaza', () => { change('period-start', '2025-12-31'); assert($('export-results').disabled); assert($('period-message').textContent.includes('año')); });
    await test('Corte anterior al fin se rechaza', () => { period(); change('as-of', '2026-09-10'); assert($('export-results').disabled); assert(metrics().length === 0); });
    await test('Rango declarado cambia la etiqueta sin inventar filtrado diario', () => { period(); const before = metrics()[0]; change('period-start', '2026-09-15'); assert(metrics()[0] === before); assert($('selection-note').textContent.includes('2026-09-15')); assert($('selection-note').textContent.includes('sin desglose semanal')); });
    await test('Reset elimina datos, errores, filtros y fechas', () => { $('reset').click(); assert($('workspace').hidden); assert($('errors').hidden); assert($('country').options.length === 0); assert($('period-start').value === ''); assert($('file').value === ''); assert($('export-results').disabled); });
    await test('CSV válido sin fechas espera metadatos antes de mostrar valores', async () => { await w.NPSApp.loadFile(valid()); assert(!$('workspace').hidden); assert(metrics().length === 0); assert($('export-results').disabled); period(); assert(metrics()[1] === '180'); });
    await test('Cargar repetidamente reemplaza filas sin acumularlas', async () => { await w.NPSApp.loadFile(valid()); await w.NPSApp.loadFile(valid()); assert(metrics()[1] === '180'); assert($('detail-body').children.length === 3); });
    await test('Entrada real de archivo permite recargar el mismo CSV', async () => { const source = valid(); for (let i = 0; i < 2; i++) { const transfer = new w.DataTransfer(); transfer.items.add(source); $('file').files = transfer.files; $('file').dispatchEvent(new w.Event('change', { bubbles: true })); await until(() => !$('workspace').hidden && metrics()[1] === '180'); assert($('file').value === ''); } });
    await test('CSV inválido posterior elimina resultados anteriores', async () => { await w.NPSApp.loadFile(file(head + 'A,Norte,0,,1,1')); assert($('workspace').hidden); assert(!$('errors').hidden); assert(metrics().length === 0); assert($('export-results').disabled); });
    await test('Exportación de errores usa el rechazo vigente', async () => {
      let captured; const create = w.URL.createObjectURL, click = w.HTMLAnchorElement.prototype.click, revoke = w.URL.revokeObjectURL;
      try { w.URL.createObjectURL = blob => { captured = blob; return 'blob:error-sintetico'; }; w.URL.revokeObjectURL = () => {}; w.HTMLAnchorElement.prototype.click = function () {}; $('export-errors').click(); const csv = w.CSVLocal.read(await captured.text()); assert(csv.records.length > 0); assert(csv.records[0].values[1] === 'neutros'); }
      finally { w.URL.createObjectURL = create; w.URL.revokeObjectURL = revoke; w.HTMLAnchorElement.prototype.click = click; }
    });
    await test('Archivo vacío, extensión incorrecta y exceso de tamaño se rechazan', async () => { for (const f of [file(''), file('texto', 'fixture.txt'), { name: 'grande.csv', size: 2 * 1024 * 1024 + 1 }]) { await w.NPSApp.loadFile(f); assert(!$('errors').hidden); assert($('workspace').hidden); } });
    await test('Codificación UTF-8 incorrecta se rechaza', async () => { await w.NPSApp.loadFile(new w.File([new Uint8Array([0xff, 0xfe, 0x61])], 'utf8-invalido.csv')); assert($('error-body').textContent.includes('UTF8')); });
    await test('Una carga lenta no reemplaza a la carga posterior', async () => { let resolve; const slow = { name: 'lento.csv', size: 100, arrayBuffer: () => new Promise(r => { resolve = r; }) }; const pending = w.NPSApp.loadFile(slow); await w.NPSApp.loadFile(file(head + 'A,Norte,0,0,2,2', 'nuevo.csv')); resolve(new w.TextEncoder().encode(w.NPS.exampleCSV()).buffer); await pending; assert(metrics()[1] === '2'); assert(!$('status').textContent.includes('nuevo.csv')); });
    await test('Reset durante lectura pendiente impide repoblar datos', async () => { let resolve; const pending = w.NPSApp.loadFile({ name: 'pendiente.csv', size: 100, arrayBuffer: () => new Promise(r => { resolve = r; }) }); w.NPSApp.reset(); resolve(new w.TextEncoder().encode(w.NPS.exampleCSV()).buffer); await pending; assert($('workspace').hidden); assert($('status').textContent === 'Sin datos cargados.'); });
    await test('Etiquetas y nombre de archivo se muestran como texto, sin HTML', async () => { period(); await w.NPSApp.loadFile(file(head + 'País ficticio,<img src=x>,0,0,1,1', '<img>.csv')); assert(!$('detail-body').textContent.includes('<img src=x>')); assert(!d.querySelector('img')); assert(!$('status').textContent.includes('<img>.csv')); });
    await test('Carga local funciona sin fetch ni XMLHttpRequest', async () => { let requests = 0; const fetch = w.fetch, xhr = w.XMLHttpRequest; try { w.fetch = () => { requests++; throw new Error('Red bloqueada por prueba'); }; w.XMLHttpRequest = function () { requests++; throw new Error('Red bloqueada por prueba'); }; await w.NPSApp.loadFile(valid()); assert(metrics()[1] === '180'); assert(requests === 0); } finally { w.fetch = fetch; w.XMLHttpRequest = xhr; } });
    await test('Los recursos de la aplicación son exclusivamente locales', () => { assert(w.performance.getEntriesByType('resource').every(r => new URL(r.name).origin === location.origin)); const csp = d.querySelector('meta[http-equiv="Content-Security-Policy"]').content; assert(csp.includes("connect-src 'none'")); });
    await test('Vista móvil de 375 px mantiene el contenido dentro del ancho', async () => { const width = frame.style.width, border = frame.style.border; try { frame.style.border = '0'; frame.style.width = '375px'; await wait(50); assert(w.innerWidth === 375, 'Ancho del viewport: ' + w.innerWidth); assert(d.documentElement.scrollWidth <= w.innerWidth, 'Hay desbordamiento horizontal: ' + d.documentElement.scrollWidth); } finally { frame.style.width = width; frame.style.border = border; } });
    await test('Demo final queda limpia y reproducible con ejemplo ficticio', () => { w.NPSApp.reset(); example(); assert(metrics()[0] === '34,4'); assert(metrics()[1] === '180'); assert($('errors').hidden); });
  } catch (e) { results.push({ name: 'Preparación del navegador', pass: false, error: e.message }); }
  const passed = results.filter(r => r.pass).length, summary = passed + '/' + results.length + ' pruebas de interfaz correctas'; document.getElementById('test-summary').textContent = summary; document.title = summary;
})();
