(function () {
  'use strict';
  if (typeof CSVLocal === 'undefined' && typeof load === 'function') load('csv.js');
  if (typeof Agenda === 'undefined' && typeof load === 'function') load('agendamientos.js');
  if (typeof CSVLocal === 'undefined' && typeof require === 'function') globalThis.CSVLocal = require('./csv.js');
  if (typeof Agenda === 'undefined' && typeof require === 'function') globalThis.Agenda = require('./agendamientos.js');
  const results = [], fixture = Agenda.exampleCSV(), parsed = () => Agenda.importCSV(fixture).rows;
  const context = { real: false, refreshedOn: '2026-10-18', countries: [{ country: 'País ficticio A', createdThrough: '2026-10-16', convertedThrough: '2026-10-15' }] };
  function assert(value, message = 'Aserción fallida') { if (!value) throw new Error(message); }
  function equal(a, b) { assert(JSON.stringify(a) === JSON.stringify(b), JSON.stringify(a) + ' != ' + JSON.stringify(b)); }
  function test(name, fn) { try { fn(); results.push({ name, pass: true }); } catch (e) { results.push({ name, pass: false, error: e.message }); } }
  function reject(text, code) { const r = Agenda.importCSV(text); equal(r.rows, []); assert(r.errors.some(e => e.code === code), 'Falta error ' + code); }
  function throws(fn) { let failed = false; try { fn(); } catch (_) { failed = true; } assert(failed); }
  test('Agenda: importa seis filas sintéticas y dos cortes', () => { equal(Agenda.importCSV(fixture).errors, []); equal(parsed().length, 6); });
  test('Agenda: corte 1–40 concilia con 120 + 80 + 0', () => equal(Agenda.total(parsed(), 's01_40'), 200));
  test('Agenda: corte 41 concilia con 7 + 3 + 0', () => equal(Agenda.total(parsed(), 's41'), 10));
  test('Agenda: país conserva el conteo de cada corte por separado', () => { equal(Agenda.total(parsed(), 's01_40', Agenda.key('País ficticio A')), 120); equal(Agenda.total(parsed(), 's41', Agenda.key('País ficticio A')), 7); });
  test('Agenda: ceros explícitos siguen presentes en ambos cortes', () => { const r = Agenda.select(parsed(), 's41', Agenda.key('País ficticio C')); equal(r.length, 1); equal(r[0].count, 0); });
  test('Agenda: corte ausente, combinado o desconocido se rechaza', () => { for (const c of [undefined, '', 'todos', 's01_41']) throws(() => Agenda.total(parsed(), c)); });
  test('Agenda: selección no produce tasas, variación ni serie semanal', () => { const r = Agenda.select(parsed(), 's01_40'); equal(r.length, 3); assert(r.every(x => Object.keys(x).sort().join(',') === 'count,country,countryKey,cut')); });
  test('Agenda: rechaza año distinto o mezclado', () => reject(fixture.replace(',2026,', ',2025,'), 'CORTE'));
  test('Agenda: rechaza semanas futuras o corte no disponible', () => { for (const pair of ['42,42', '1,41', '0,40', '40,1']) reject(fixture.replace('1,40', pair), 'CORTE'); });
  test('Agenda: semana 41 siempre exige estado preliminar', () => reject(fixture.replace('41,41,preliminar', '41,41,observado'), 'CORTE'));
  test('Agenda: acumulado no acepta etiqueta de completitud inventada', () => reject(fixture.replace('1,40,observado', '1,40,completo'), 'CORTE'));
  test('Agenda: falta un país en un corte rechaza todo el archivo', () => reject(fixture.split('\n').filter(l => !l.includes('C,2026,41')).join('\n'), 'COBERTURA'));
  test('Agenda: un solo corte no basta ni se rellena con ceros', () => reject(fixture.split('\n').filter(l => !l.includes(',41,41,')).join('\n'), 'COBERTURA'));
  test('Agenda: detecta país/corte duplicado por mayúsculas y espacios', () => reject(fixture + ' PAÍS FICTICIO A ,2026,1,40,observado,1\n', 'DUPLICADO'));
  test('Agenda: país puede repetirse en el otro corte', () => equal(Agenda.importCSV(fixture).errors, []));
  test('Agenda: rechaza conteo negativo, decimal, vacío o exponente', () => { for (const n of ['-1', '1.5', '', '1e3', 'NaN', 'Infinity']) reject(fixture.replace('observado,120', 'observado,' + n), 'CONTEO'); });
  test('Agenda: rechaza separador de miles y exceso de precisión', () => { for (const n of ['"1,000"', '9007199254740992']) reject(fixture.replace('observado,120', 'observado,' + n), 'CONTEO'); });
  test('Agenda: detecta suma fuera de precisión dentro de un corte', () => reject(fixture.replace('observado,120', 'observado,9007199254740991'), 'RANGO'));
  test('Agenda: no suma ambos cortes para validar precisión', () => { const f = fixture.replace('observado,120', 'observado,9007199254740000').replace('preliminar,7', 'preliminar,9007199254740000'); equal(Agenda.importCSV(f).errors, []); });
  test('Agenda: rechaza países vacíos y subtotales', () => { for (const n of ['', 'Total', 'TODOS', 'All']) reject(fixture.replaceAll('País ficticio A', n), 'PAIS'); });
  test('Agenda: rechaza país con saltos o más de 100 caracteres', () => { reject(fixture.replaceAll('País ficticio A', 'x'.repeat(101)), 'PAIS'); reject(fixture.replaceAll('País ficticio A', '"A\nB"'), 'PAIS'); });
  test('Agenda: rechaza columna de cadena y no entrega filas parciales', () => reject(fixture.replace('pais,', 'cadena,pais,'), 'FIELD_COUNT'));
  test('Agenda: rechaza columna adicional incluso con estructura válida', () => reject(fixture.trim().split('\n').map((l, i) => l + (i ? ',ETIQUETA_FICTICIA' : ',cadena')).join('\n'), 'ESQUEMA'));
  test('Agenda: acepta orden de columnas distinto', () => { const lines = fixture.trim().split('\n').map(l => l.split(',').reverse().join(',')); equal(Agenda.importCSV(lines.join('\n')).errors, []); });
  test('Agenda: respeta BOM UTF-8 y CRLF', () => equal(Agenda.importCSV('\uFEFF' + fixture.replaceAll('\n', '\r\n')).errors, []));
  test('Agenda: contexto valida fechas reales de 2026', () => { assert(Agenda.dateValid('2026-10-16')); for (const d of ['2026-02-29', '2026-13-01', '2025-12-31', '16/10/2026']) assert(!Agenda.dateValid(d)); });
  test('Agenda: cobertura duplicada o fecha inválida se rechaza', () => { throws(() => Agenda.context({ ...context, countries: context.countries.concat(context.countries) })); throws(() => Agenda.context({ ...context, refreshedOn: '2026-02-29' })); throws(() => Agenda.context({ ...context, countries: [{ ...context.countries[0], createdThrough: '' }] })); });
  test('Agenda: contexto sin declarar no inventa disponibilidad', () => equal(Agenda.context(), { real: false, refreshedOn: '', countries: [] }));
  test('Agenda: exporta total y tres países de un solo corte', () => { const r = CSVLocal.read(Agenda.exportResults(parsed(), 's41')); equal(r.records.length, 4); assert(r.records.every(x => x.values[3] === '41' && x.values[4] === '41' && x.values[5] === 'preliminar')); equal(r.records[0].values[7], '10'); });
  test('Agenda: exporta solamente el país seleccionado', () => { const r = CSVLocal.read(Agenda.exportResults(parsed(), 's01_40', Agenda.key('País ficticio B'))); equal(r.records.length, 2); equal(r.records[0].values[7], '80'); equal(r.records[1].values[1], 'País ficticio B'); });
  test('Agenda: exportación conserva incertidumbre fiscal y completitud', () => { const r = CSVLocal.read(Agenda.exportResults(parsed(), 's01_40')); assert(r.records.every(x => x.values[11] === Agenda.CALENDAR_NOTE && x.values[12] === Agenda.COMPLETENESS_NOTE)); assert(!r.header.some(h => /cadena|banner|tasa|variacion|serie/.test(h))); });
  test('Agenda: exporta cobertura del país y refresco sin adjudicar completitud', () => { const r = CSVLocal.read(Agenda.exportResults(parsed(), 's41', Agenda.key('País ficticio A'), context)); equal(r.records[1].values.slice(8, 11), ['2026-10-16', '2026-10-15', '2026-10-18']); equal(r.records[0].values[8], ''); });
  test('Agenda: cobertura no declarada se exporta vacía', () => { const r = CSVLocal.read(Agenda.exportResults(parsed(), 's41')); equal(r.records[1].values.slice(8, 11), ['', '', '']); });
  test('Agenda: exportación no mezcla cortes y selección vacía no descarga', () => { throws(() => Agenda.exportResults(parsed(), 'todos')); equal(Agenda.exportResults(parsed(), 's41', 'no-existe'), null); });
  test('Agenda: exportación neutraliza etiqueta con fórmula', () => { const r = Agenda.importCSV(fixture.replaceAll('País ficticio A', '=PAIS')); const csv = CSVLocal.read(Agenda.exportResults(r.rows, 's41', '=pais')); equal(csv.records[1].values[1], "'=PAIS"); });
  test('Agenda: las funciones no modifican las filas importadas', () => { const r = parsed(), original = JSON.stringify(r); Agenda.select(r, 's41'); Agenda.exportResults(r, 's01_40'); equal(JSON.stringify(r), original); });
  const passed = results.filter(r => r.pass).length, summary = passed + '/' + results.length + ' pruebas correctas de agendamientos';
  globalThis.AGENDA_TEST_RESULTS = results;
  if (typeof document !== 'undefined') { for (const r of results) { const li = document.createElement('li'); li.textContent = (r.pass ? '✓ ' : '✗ ') + r.name + (r.error ? ' — ' + r.error : ''); if (!r.pass) li.className = 'fail'; document.getElementById('test-results').append(li); } document.getElementById('test-summary').textContent = summary; document.title = summary; }
  else { const out = typeof print === 'function' ? print : console.log; for (const r of results) out((r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.error ? ': ' + r.error : '')); out(summary); if (passed !== results.length) throw new Error(summary); }
})();
