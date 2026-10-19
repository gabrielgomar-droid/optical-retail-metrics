(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  let rows = [], errors = [], generation = 0;
  const number = value => new Intl.NumberFormat('es', { maximumFractionDigits: 0 }).format(value);
  const score = value => value === null ? 'N/D' : new Intl.NumberFormat('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
  const meta = () => ({ start: $('period-start').value, end: $('period-end').value, asOf: $('as-of').value });
  function node(tag, text, className) { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (className) n.className = className; return n; }
  function status(text, bad = false) { $('status').textContent = text; $('status').className = 'status' + (bad ? ' bad' : ''); }
  function options(select, items, label) { const old = select.value; select.replaceChildren(new Option(label, '')); items.forEach(([value, text]) => select.add(new Option(text, value))); select.value = items.some(item => item[0] === old) ? old : ''; }
  function choices() { options($('country'), rows.map(r => [r.countryKey, r.country]), 'Todos los países'); }
  function clearView() { $('workspace').hidden = true; $('errors').hidden = true; ['error-body', 'metrics', 'country-chart', 'detail-body'].forEach(id => $(id).replaceChildren()); $('export-results').disabled = true; $('selection-note').textContent = ''; $('period-message').textContent = ''; }
  function showErrors() {
    $('errors').hidden = false; $('error-summary').textContent = errors.length + ' error(es). El archivo completo fue rechazado. Se muestran los primeros 100; la exportación incluye todos.';
    for (const e of errors.slice(0, 100)) { const tr = node('tr'); [e.line, e.code, e.message].forEach(t => tr.append(node('td', t))); $('error-body').append(tr); }
    status('No se han calculado métricas del archivo rechazado.', true);
  }
  function accept(text, source, token) {
    if (token !== generation) return;
    try { const imported = NPS.importCSV(text); errors = imported.errors; if (errors.length) { showErrors(); return; } rows = NPS.countryRows(imported.rows); choices(); status(source + ' · ' + rows.length + ' países. Vista y exportación agregadas por país.'); render(); }
    catch (_) { errors = [{ line: 1, code: 'LECTURA', message: 'No se pudo interpretar el archivo como CSV agregado admitido.' }]; rows = []; showErrors(); }
  }
  function beginLoad() { generation++; rows = []; errors = []; clearView(); $('country').replaceChildren(); return generation; }
  async function loadFile(file) {
    const token = beginLoad();
    if (!file || !/\.csv$/i.test(file.name) || file.size > 2 * 1024 * 1024 || file.size === 0) { errors = [{ line: 1, code: 'ARCHIVO', message: 'Selecciona un CSV no vacío de hasta 2 MiB.' }]; showErrors(); return; }
    status('Leyendo CSV local…');
    try { const bytes = await file.arrayBuffer(); const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); accept(text, 'CSV local validado', token); }
    catch (_) { if (token !== generation) return; errors = [{ line: 1, code: 'UTF8', message: 'No se pudo leer como UTF-8. Exporta el CSV en esa codificación.' }]; showErrors(); }
  }
  function selected() { return NPS.select(rows, $('country').value, ''); }
  function render() {
    $('workspace').hidden = !rows.length;
    const problem = NPS.validatePeriod(meta()); $('period-message').textContent = problem;
    const selectedRows = selected(); $('export-results').disabled = !!problem || !selectedRows.length;
    ['metrics', 'country-chart', 'detail-body'].forEach(id => $(id).replaceChildren());
    if (!rows.length) return;
    if (problem) { $('selection-note').textContent = 'CSV validado. Declara un periodo válido para mostrar indicadores; el archivo agregado no contiene fechas por fila.'; return; }
    const a = NPS.aggregate(selectedRows);
    $('selection-note').textContent = meta().start + ' → ' + meta().end + ' · ' + selectedRows.length + ' filas seleccionadas de ' + rows.length + '. Periodo declarado para todo el archivo, sin desglose semanal. ' + (meta().asOf ? 'Corte disponible declarado: ' + meta().asOf + '.' : 'Frescura de origen sin declarar.');
    for (const [label, value, detail] of [['NPS', score(a.score), 'Puntos · 100 × (promotores − detractores) / respuestas'], ['Respuestas', number(a.responses), 'Suma de los tres grupos de respuesta'], ['Promotores', number(a.promoters), 'Neutros: ' + number(a.passives) + ' · Detractores: ' + number(a.detractors)]]) { const card = node('article', undefined, 'metric'); card.append(node('span', label, 'metric-label'), node('strong', value, 'metric-value'), node('span', detail, 'metric-detail')); $('metrics').append(card); }
    for (const group of NPS.byCountry(selectedRows)) {
      const item = node('div', undefined, 'country-row'), label = node('div', undefined, 'country-label'); label.append(node('strong', group.country), node('span', number(group.responses) + ' respuestas'));
      const track = node('div', undefined, 'nps-track'); track.setAttribute('role', 'img'); track.setAttribute('aria-label', group.country + ': NPS ' + score(group.score) + ' puntos, ' + group.responses + ' respuestas');
      if (group.score !== null) { const bar = node('span', undefined, 'nps-bar' + (group.score < 0 ? ' negative' : '')); bar.style.width = Math.abs(group.score) / 2 + '%'; bar.style.left = group.score < 0 ? (50 + group.score / 2) + '%' : '50%'; track.append(bar); }
      item.append(label, track, node('strong', score(group.score), 'country-score')); $('country-chart').append(item);
    }
    for (const row of selectedRows) { const tr = node('tr'); [row.country, number(row.detractors), number(row.passives), number(row.promoters), number(row.responses), score(NPS.aggregate([row]).score)].forEach(t => tr.append(node('td', t))); $('detail-body').append(tr); }
  }
  function download(text, name) { if (!text) return; const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  function reset() { beginLoad(); $('file').value = ''; $('period-start').value = ''; $('period-end').value = ''; $('as-of').value = ''; status('Sin datos cargados.'); }
  $('file').addEventListener('change', e => { const file = e.target.files[0]; e.target.value = ''; if (file) loadFile(file); });
  $('example').addEventListener('click', () => { const token = beginLoad(); $('period-start').value = '2026-09-01'; $('period-end').value = '2026-09-30'; $('as-of').value = '2026-09-30'; accept(NPS.exampleCSV(), 'Ejemplo completamente ficticio', token); });
  $('template').addEventListener('click', () => download(CSVLocal.exportCSV([NPS.COUNTRY]), 'plantilla-nps-por-pais.csv'));
  $('reset').addEventListener('click', reset);
  $('country').addEventListener('change', render);
  ['period-start', 'period-end', 'as-of'].forEach(id => $(id).addEventListener('change', render));
  $('export-results').addEventListener('click', () => { if (!$('export-results').disabled) download(NPS.exportResults(selected(), meta()), 'nps-resultados.csv'); });
  $('export-errors').addEventListener('click', () => download(CSVLocal.exportErrors(errors), 'nps-errores.csv'));
  const drop = $('dropzone');
  ['dragover', 'dragenter'].forEach(name => drop.addEventListener(name, e => { e.preventDefault(); drop.classList.add('dragging'); }));
  ['dragleave', 'drop'].forEach(name => drop.addEventListener(name, e => { e.preventDefault(); drop.classList.remove('dragging'); }));
  drop.addEventListener('drop', e => { if (e.dataTransfer.files.length !== 1) { beginLoad(); errors = [{ line: 1, code: 'ARCHIVO', message: 'Arrastra un único archivo CSV.' }]; showErrors(); } else loadFile(e.dataTransfer.files[0]); });
  window.NPSApp = { loadFile, reset };
})();
