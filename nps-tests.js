(function () {
  'use strict';
  if (typeof CSVLocal === 'undefined' && typeof load === 'function') load('csv.js');
  if (typeof NPS === 'undefined' && typeof load === 'function') load('nps.js');
  if (typeof CSVLocal === 'undefined' && typeof require === 'function') globalThis.CSVLocal = require('./csv.js');
  if (typeof NPS === 'undefined' && typeof require === 'function') globalThis.NPS = require('./nps.js');
  const results = [], header = NPS.CANONICAL.join(','), period = { start: '2026-09-01', end: '2026-09-30', asOf: '2026-10-01' };
  function assert(value, message = 'Aserción fallida') { if (!value) throw new Error(message); }
  function equal(a, b) { assert(JSON.stringify(a) === JSON.stringify(b), JSON.stringify(a) + ' != ' + JSON.stringify(b)); }
  function near(a, b) { assert(Math.abs(a - b) < 1e-10, a + ' != ' + b); }
  function test(name, fn) { try { fn(); results.push({ name, pass: true }); } catch (e) { results.push({ name, pass: false, error: e.message }); } }
  function read(body) { return NPS.importCSV(header + '\n' + body); }
  function rejected(body, field) { const r = read(body); assert(r.errors.length > 0); equal(r.rows, []); if (field) assert(r.errors.some(e => e.code === field), 'Falta error de ' + field); }

  test('NPS: importa los cuatro grupos sintéticos de ejemplo', () => { const r = NPS.importCSV(NPS.exampleCSV()); equal(r.errors, []); equal(r.rows.length, 4); equal(r.format, 'plantilla'); });
  test('NPS: reconcilia respuestas y grupos del ejemplo', () => { const a = NPS.aggregate(NPS.importCSV(NPS.exampleCSV()).rows); equal([a.detractors, a.passives, a.promoters, a.responses], [43, 32, 105, 180]); near(a.score, 100 * 62 / 180); });
  test('NPS: pondera por respuestas, sin promediar NPS de filas', () => { const a = NPS.aggregate(read('A,Norte,0,0,1,1\nA,Sur,9,0,0,9').rows); near(a.score, -80); assert(a.score !== 0); });
  test('NPS: cero respuestas da N/D, nunca cero inventado', () => equal(NPS.aggregate(read('A,Norte,0,0,0,0').rows).score, null));
  test('NPS: selección vacía mantiene denominador y score ausente', () => { const a = NPS.aggregate([]); equal(a.responses, 0); equal(a.score, null); });
  test('NPS: extremos −100 y +100', () => { equal(NPS.aggregate(read('A,N,1,0,0,1').rows).score, -100); equal(NPS.aggregate(read('A,N,0,0,1,1').rows).score, 100); });
  test('NPS: neutros cuentan en el denominador', () => near(NPS.aggregate(read('A,N,0,8,2,10').rows).score, 20));
  test('NPS: rechaza conteo faltante', () => rejected('A,N,,0,1,1', 'detractores'));
  test('NPS: rechaza números negativos', () => rejected('A,N,-1,0,1,0', 'detractores'));
  test('NPS: rechaza conteos decimales', () => rejected('A,N,0.5,0,1,1', 'detractores'));
  test('NPS: rechaza notación científica', () => rejected('A,N,1e2,0,0,100', 'detractores'));
  test('NPS: rechaza separador de miles y cantidades fuera de precisión', () => { rejected('A,N,"1,000",0,0,1000'); rejected('A,N,9007199254740992,0,0,9007199254740992'); });
  test('NPS: rechaza respuestas que no concilian', () => rejected('A,N,1,2,3,7', 'respuestas'));
  test('NPS: rechaza suma agregada fuera de precisión', () => rejected('A,N,0,0,9007199254740991,9007199254740991\nA,S,0,0,1,1', 'RANGO'));
  test('NPS: falta de país o banner se rechaza', () => { rejected(',N,1,0,0,1', 'pais'); rejected('A,,1,0,0,1', 'banner'); });
  test('NPS: nombres con saltos y excesivamente largos se rechazan', () => { rejected('A,"N\nS",1,0,0,1'); rejected('A,' + 'x'.repeat(101) + ',1,0,0,1'); });
  test('NPS: duplicado ignora espacios y mayúsculas', () => rejected('A,Norte,1,0,0,1\na, NORTE ,1,0,0,1', 'CLAVE'));
  test('NPS: mismo banner en países distintos es válido', () => equal(read('A,Norte,1,0,0,1\nB,Norte,0,0,1,1').errors, []));
  test('NPS: rechaza subtotales llamados Total', () => { rejected('Total,N,1,0,0,1'); rejected('A,TOTAL,1,0,0,1'); });
  test('NPS: no entrega filas parciales si otra fila falla', () => rejected('A,N,0,0,1,1\nB,S,0,,1,1'));
  test('NPS: importa comas y comillas escapadas en banners', () => equal(read('A,"Banner, ""ficticio""",1,0,2,3').rows[0].banner, 'Banner, "ficticio"'));
  test('NPS: rechaza columna extra, incluido un identificador personal', () => { const r = NPS.importCSV(header + ',contacto\nA,N,1,0,0,1,sintético'); equal(r.rows, []); assert(r.errors.length > 0); });
  test('NPS: acepta columnas reordenadas', () => { const r = NPS.importCSV('respuestas,promotores,pais,banner,neutros,detractores\n3,2,A,N,0,1'); equal(r.rows[0].responses, 3); });
  test('NPS: adapta resumen país/cadena con NPS redondeado', () => { const r = NPS.importCSV(NPS.BI.concat(['NPS']).join(',') + '\nPaís ficticio,Banner ficticio,1,0,2,3,33'); equal(r.errors, []); near(NPS.aggregate(r.rows).score, 100 / 3); });
  test('NPS: rechaza NPS informado que contradice conteos', () => { const r = NPS.importCSV(NPS.BI.concat(['NPS']).join(',') + '\nA,N,1,0,2,3,80'); equal(r.rows, []); assert(r.errors.some(e => e.code === 'NPS')); });
  test('NPS: rechaza NPS no numérico o fuera de escala', () => { for (const value of ['NaN', '101', '-101', '20%']) { const r = NPS.importCSV(NPS.BI.concat(['NPS']).join(',') + '\nA,N,1,0,2,3,' + value); assert(r.errors.length > 0); } });
  test('NPS: score ausente es admisible si existen los conteos', () => equal(NPS.importCSV(NPS.BI.concat(['NPS']).join(',') + '\nA,N,1,0,2,3,').errors, []));
  test('NPS: con cero respuestas acepta score vacío o cero pero no un valor positivo', () => { for (const value of ['', '0']) { const r = NPS.importCSV(NPS.BI.concat(['NPS']).join(',') + '\nA,N,0,0,0,0,' + value); equal(r.errors, []); equal(NPS.aggregate(r.rows).score, null); } assert(NPS.importCSV(NPS.BI.concat(['NPS']).join(',') + '\nA,N,0,0,0,0,50').errors.length > 0); });
  test('NPS: porcentajes del origen no sustituyen a conteos', () => { const r = NPS.importCSV(NPS.BI.concat(['% Promotor']).join(',') + '\nA,N,1,0,2,3,99 %'); equal(r.errors, []); near(NPS.aggregate(r.rows).score, 100 / 3); });
  test('NPS: filtros por país y banner conservan el alcance', () => { const rows = NPS.importCSV(NPS.exampleCSV()).rows; equal(NPS.select(rows, 'país ficticio a', '').length, 2); equal(NPS.select(rows, '', 'banner ficticio sur').length, 1); equal(NPS.select(rows, 'país ficticio a', 'banner ficticio sur').length, 0); });
  test('NPS: agrupación por país suma conteos y reconcilia total', () => { const rows = NPS.importCSV(NPS.exampleCSV()).rows, groups = NPS.byCountry(rows); equal(groups.length, 3); equal(groups.reduce((s, g) => s + g.responses, 0), NPS.aggregate(rows).responses); near(groups[0].score, 100 * 67 / 130); });
  test('NPS: valida fechas gregorianas reales y años bisiestos', () => { assert(NPS.dateValid('2024-02-29')); assert(!NPS.dateValid('2026-02-29')); assert(!NPS.dateValid('2026-13-01')); assert(!NPS.dateValid('10/01/2026')); });
  test('NPS: periodo declarado debe existir, estar ordenado y usar un año', () => { equal(NPS.validatePeriod(period), ''); assert(NPS.validatePeriod({})); assert(NPS.validatePeriod({ start: '2026-10-01', end: '2026-09-01' })); assert(NPS.validatePeriod({ start: '2025-12-31', end: '2026-01-01' })); });
  test('NPS: corte de fuente opcional debe cubrir el fin declarado', () => { assert(NPS.validatePeriod({ ...period, asOf: '2026-09-10' })); assert(NPS.validatePeriod({ ...period, asOf: 'incorrecto' })); equal(NPS.validatePeriod({ ...period, asOf: '' }), ''); });
  test('NPS: exporta exactamente selección y periodo, con total separado', () => { const rows = NPS.select(NPS.importCSV(NPS.exampleCSV()).rows, 'país ficticio a', ''), exported = CSVLocal.read(NPS.exportResults(rows, period)); equal(exported.records.length, 2); equal(exported.records[0].values[0], 'TOTAL'); equal(exported.records[0].values[2], period.start); equal(exported.records[0].values[8], '130'); assert(exported.records.slice(1).every(r => r.values[1] === 'País ficticio A')); });
  test('NPS: exporta score negativo como número y protege etiquetas de fórmulas', () => { const r = read('=PAIS,+Banner,9,0,1,10'), exported = CSVLocal.read(NPS.exportResults(r.rows, period)); equal(exported.records[0].values[9], '-80'); equal(exported.records[1].values[1], "'=PAIS"); assert(!exported.header.includes('banner')); assert(!exported.records.flatMap(r => r.values).includes('+Banner')); });
  test('NPS: exporta score ausente como celda vacía', () => equal(CSVLocal.read(NPS.exportResults(read('A,N,0,0,0,0').rows, period)).records[0].values[9], ''));
  test('NPS: exportación rechaza periodo inválido y omite selección vacía', () => { equal(NPS.exportResults([], period), null); let rejected = false; try { NPS.exportResults(read('A,N,0,0,1,1').rows, {}); } catch (_) { rejected = true; } assert(rejected); });

  test('País: importa plantilla sin nombres de cadena', () => { const r = NPS.importCSV(NPS.COUNTRY.join(',') + '\nPaís ficticio,1,2,7,10'); equal(r.errors, []); equal(r.rows[0].responses, 10); equal(r.format, 'país'); });
  test('País: rechaza dos filas del mismo país en plantilla agregada', () => { const r = NPS.importCSV(NPS.COUNTRY.join(',') + '\nA,1,2,7,10\na,1,2,7,10'); equal(r.rows, []); assert(r.errors.some(e => e.code === 'CLAVE')); });
  test('País: consolida cadenas por sumas antes de dividir', () => { const rows = read('A,Norte,0,0,1,1\nA,Sur,9,0,0,9').rows, countries = NPS.countryRows(rows); equal(countries.length, 1); equal(countries[0].responses, 10); equal(NPS.aggregate(countries).score, -80); });
  test('País: elimina nombres y claves de cadena del estado consolidado', () => { const rows = NPS.countryRows(read('A,ETIQUETA_PRIVADA,1,0,2,3').rows); assert(!JSON.stringify(rows).includes('ETIQUETA_PRIVADA')); assert(!Object.keys(rows[0]).some(k => /banner/i.test(k))); });
  test('País: exporta una fila por país sin columnas o nombres de cadena', () => { const rows = read('A,ETIQUETA_UNO,1,0,2,3\nA,ETIQUETA_DOS,2,0,1,3').rows, text = NPS.exportResults(rows, period), r = CSVLocal.read(text); equal(r.records.length, 2); equal(r.records[1].values[0], 'PAIS'); assert(!/ETIQUETA|banner|Cadena/.test(text)); equal(r.records[1].values[8], '6'); });
  test('País: exportación de estado ya agregado conserva totales', () => { const rows = NPS.importCSV(NPS.exampleCSV()).rows, grouped = NPS.countryRows(rows); equal(NPS.aggregate(grouped).responses, NPS.aggregate(rows).responses); near(NPS.aggregate(grouped).score, NPS.aggregate(rows).score); equal(CSVLocal.read(NPS.exportResults(grouped, period)).records.length, 4); });

  const all = (globalThis.CSV_TEST_RESULTS || []).concat(results), passed = all.filter(r => r.pass).length, summary = passed + '/' + all.length + ' pruebas correctas (CSV + NPS)';
  globalThis.NPS_TEST_RESULTS = results;
  if (typeof document !== 'undefined') {
    for (const result of results) { const li = document.createElement('li'); li.textContent = (result.pass ? '✓ ' : '✗ ') + result.name + (result.error ? ' — ' + result.error : ''); if (!result.pass) li.className = 'fail'; document.getElementById('test-results').appendChild(li); }
    document.getElementById('test-summary').textContent = summary; document.title = summary;
  } else {
    for (const r of results) { const value = (r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.error ? ': ' + r.error : ''); if (typeof print === 'function') print(value); else console.log(value); }
    if (typeof print === 'function') print(summary); else console.log(summary);
    if (passed !== all.length) throw new Error(summary);
  }
})();
