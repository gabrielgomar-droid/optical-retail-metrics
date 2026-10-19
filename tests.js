(function () {
  'use strict';
  if (typeof CSVLocal === 'undefined' && typeof load === 'function') load('csv.js');
  if (typeof CSVLocal === 'undefined' && typeof require === 'function') globalThis.CSVLocal = require('./csv.js');
  const results = [];
  function assert(value, message = 'Aserción fallida') { if (!value) throw new Error(message); }
  function equal(actual, expected) { assert(JSON.stringify(actual) === JSON.stringify(expected), JSON.stringify(actual) + ' != ' + JSON.stringify(expected)); }
  function test(name, fn) { try { fn(); results.push({ name, pass: true }); } catch (e) { results.push({ name, pass: false, error: e.message }); } }
  function code(text, expected, options) { const r = CSVLocal.read(text, options); assert(r.errors.some(e => e.code === expected), 'Falta error ' + expected); equal(r.records, []); }

  test('Lee columnas genéricas sin imponer un esquema comercial', () => { const r = CSVLocal.read('campo_a,campo_b\ntexto,12'); equal(r.header, ['campo_a', 'campo_b']); equal(r.records[0].values, ['texto', '12']); equal(r.errors, []); });
  test('Conserva valores como texto, incluidos vacíos y ceros iniciales', () => { equal(CSVLocal.read('a,b,c\n001,,0').records[0].values, ['001', '', '0']); });
  test('Reconoce BOM UTF-8 representado en texto', () => { equal(CSVLocal.read('\uFEFFa,b\nx,y').header, ['a', 'b']); });
  test('Acepta CRLF y filas finales con salto', () => { equal(CSVLocal.read('a,b\r\nx,y\r\nz,w\r\n').records.map(r => r.line), [2, 3]); });
  test('Acepta finales de línea CR', () => { equal(CSVLocal.read('a,b\rx,y\rz,w').records.length, 2); });
  test('Omite líneas completamente vacías y conserva líneas físicas', () => { equal(CSVLocal.read('\na,b\n\nx,y\n').records[0].line, 4); });
  test('Lee comas dentro de comillas', () => { equal(CSVLocal.read('a,b\n"valor, ficticio",otro').records[0].values, ['valor, ficticio', 'otro']); });
  test('Lee comillas escapadas', () => { equal(CSVLocal.read('a,b\n"dijo ""hola""",otro').records[0].values[0], 'dijo "hola"'); });
  test('Lee saltos dentro de campos entrecomillados', () => { const r = CSVLocal.read('a,b\n"línea 1\r\nlínea 2",x\ny,z'); equal(r.records[0].values[0], 'línea 1\nlínea 2'); equal(r.records[1].line, 4); });
  test('Acepta un campo vacío entrecomillado', () => { equal(CSVLocal.read('a,b\n"",x').records[0].values, ['', 'x']); });
  test('Acepta punto y coma solo al configurarlo', () => { equal(CSVLocal.read('a;b\nx;y', { delimiter: ';' }).header, ['a', 'b']); });
  test('No adivina el separador', () => { equal(CSVLocal.read('a;b\nx;y').header, ['a;b']); });
  test('Rechaza separador no admitido', () => { let thrown = false; try { CSVLocal.read('a', { delimiter: '|' }); } catch (_) { thrown = true; } assert(thrown); });
  test('Rechaza comillas sin cerrar', () => code('a,b\n"x,y', 'UNCLOSED_QUOTE'));
  test('Rechaza comillas en campo sin entrecomillar', () => code('a,b\nx"y,z', 'UNEXPECTED_QUOTE'));
  test('Rechaza texto después de cierre de comillas', () => code('a,b\n"x"z,y', 'AFTER_QUOTE'));
  test('Rechaza campos de más', () => code('a,b\nx,y,z', 'FIELD_COUNT'));
  test('Rechaza campos de menos', () => code('a,b\nx', 'FIELD_COUNT'));
  test('Rechaza archivo vacío', () => code('\n\r\n', 'EMPTY_FILE'));
  test('Rechaza archivo con solo cabecera', () => code('a,b\n', 'NO_RECORDS'));
  test('Rechaza encabezados vacíos', () => code('a,\nx,y', 'EMPTY_HEADER'));
  test('Rechaza encabezados duplicados tras recortar espacios', () => code('a, a \nx,y', 'DUPLICATE_HEADER'));
  test('Valida columnas requeridas solo cuando se declaran', () => code('a,b\nx,y', 'MISSING_HEADER', { requiredHeaders: ['columna_configurada'] }));
  test('Respeta límite de filas', () => code('a\nx\ny', 'ROW_LIMIT', { maxRows: 1 }));
  test('Acepta exactamente el límite de filas', () => equal(CSVLocal.read('a\nx', { maxRows: 1 }).errors, []));
  test('Respeta límite de caracteres', () => code('a\nxyz', 'TEXT_LIMIT', { maxCharacters: 4 }));
  test('Rechaza NUL para señalar posible codificación incorrecta', () => code('a\nx\u0000', 'NUL_CHARACTER'));
  test('Mantiene seguro el nombre de cabecera __proto__', () => { const r = CSVLocal.read('__proto__,constructor\nx,y'); equal(r.header, ['__proto__', 'constructor']); equal(r.records[0].values, ['x', 'y']); });
  test('Exporta comas y comillas con escape correcto', () => { const csv = CSVLocal.exportCSV([['a', 'b'], ['x,y', 'dijo "hola"']]); equal(CSVLocal.read(csv).records[0].values, ['x,y', 'dijo "hola"']); });
  test('Neutraliza fórmulas en exportación para hojas de cálculo', () => { const csv = CSVLocal.exportCSV([['dato'], ['=1+1'], [' @SUM(A1)'], ['-3'], ['\t=1']]); const values = CSVLocal.read(csv).records.map(r => r.values[0]); assert(values.every(v => v.startsWith("'"))); });
  test('Exporta errores con filas y códigos', () => { const r = CSVLocal.read('a,b\nx'); const exported = CSVLocal.read(CSVLocal.exportErrors(r.errors)); equal(exported.header, ['fila_fisica', 'codigo', 'error']); equal(exported.records[0].values[0], '2'); });
  test('Cargar dos veces reemplaza los datos, sin acumularlos', () => { const s = CSVLocal.createSession(); s.load('a\nx'); s.load('a\ny'); equal(s.snapshot().records.map(r => r.values), [['y']]); });
  test('Una carga inválida elimina los resultados anteriores', () => { const s = CSVLocal.createSession(); s.load('a\nx'); s.load('a,b\nx'); equal(s.snapshot().records, []); assert(s.snapshot().errors.length > 0); });
  test('Reset elimina datos, encabezados y errores', () => { const s = CSVLocal.createSession(); s.load('a,b\nx'); s.reset(); equal(s.snapshot(), { header: [], records: [], errors: [] }); });
  test('La copia de estado no modifica la sesión', () => { const s = CSVLocal.createSession(); s.load('a\nx'); s.snapshot().records[0].values[0] = 'cambiado'; equal(s.snapshot().records[0].values[0], 'x'); });
  test('Una excepción de entrada tampoco conserva datos anteriores', () => { const s = CSVLocal.createSession(); s.load('a\nx'); try { s.load(null); } catch (_) {} equal(s.snapshot().records, []); });

  globalThis.CSV_TEST_RESULTS = results;
  const passed = results.filter(r => r.pass).length;
  const summary = passed + '/' + results.length + ' pruebas correctas';
  if (typeof document !== 'undefined') {
    document.getElementById('test-summary').textContent = summary;
    for (const result of results) {
      const li = document.createElement('li');
      li.textContent = (result.pass ? '✓ ' : '✗ ') + result.name + (result.error ? ' — ' + result.error : '');
      if (!result.pass) li.className = 'fail';
      document.getElementById('test-results').appendChild(li);
    }
    document.title = summary + ' · CSV local';
  } else {
    results.forEach(r => { const output = (r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.error ? ': ' + r.error : ''); if (typeof print === 'function') print(output); else console.log(output); });
    if (typeof print === 'function') print(summary); else console.log(summary);
    if (passed !== results.length) throw new Error(summary);
  }
})();
