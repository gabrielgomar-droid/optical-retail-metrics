(function () {
  'use strict';
  const $ = id => document.getElementById(id), number = n => new Intl.NumberFormat('es', { maximumFractionDigits: 0 }).format(n);
  let rows = [], errors = [], generation = 0, source;
  function node(tag, text, className) { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (className) n.className = className; return n; }
  function status(message, bad = false) { $('status').textContent = message; $('status').className = 'status' + (bad ? ' bad' : ''); }
  function beginLoad() { generation++; rows = []; errors = []; $('workspace').hidden = true; $('errors').hidden = true; $('export-results').disabled = true; ['country', 'metrics', 'country-chart', 'detail-body', 'error-body'].forEach(id => $(id).replaceChildren()); ['selection-note', 'cut-note', 'source-note'].forEach(id => { $(id).textContent = ''; }); $('cut').value = 's01_40'; return generation; }
  function showErrors() { $('errors').hidden = false; $('error-summary').textContent = errors.length + ' error(es). Archivo completo rechazado; se muestran hasta 100.'; for (const e of errors.slice(0, 100)) { const tr = node('tr'); [e.line, e.code, e.message].forEach(t => tr.append(node('td', t))); $('error-body').append(tr); } status('No hay resultados del archivo rechazado.', true); }
  function accept(text, label, token) { if (token !== generation) return; const result = Agenda.importCSV(text); errors = result.errors; if (errors.length) { showErrors(); return; } rows = result.rows; const countries = Agenda.select(rows, 's01_40'); $('country').add(new Option('Todos los países', '')); countries.forEach(r => $('country').add(new Option(r.country, r.countryKey))); status(label + ' · ' + countries.length + ' países, dos cortes separados.'); render(); }
  async function loadFile(file, sourceContext) {
    const token = beginLoad();
    try { setSourceContext(sourceContext); }
    catch (_) { setSourceContext(); errors = [{ line: 1, code: 'METADATOS', message: 'Las fechas de disponibilidad declaradas no son válidas.' }]; showErrors(); return; }
    if (!file || !/\.csv$/i.test(file.name) || file.size === 0 || file.size > 2 * 1024 * 1024) { errors = [{ line: 1, code: 'ARCHIVO', message: 'Selecciona un CSV UTF-8 no vacío de hasta 2 MiB.' }]; showErrors(); return; }
    status('Leyendo agregado local…');
    try { const bytes = await file.arrayBuffer(); const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); accept(text, source?.real ? 'Datos reales agregados · copia privada local' : 'CSV local validado', token); }
    catch (_) { if (token !== generation) return; rows = []; errors = [{ line: 1, code: 'LECTURA_UTF8', message: 'No se pudo leer el CSV admitido en UTF-8.' }]; showErrors(); }
  }
  function render() {
    ['metrics', 'country-chart', 'detail-body'].forEach(id => $(id).replaceChildren()); $('workspace').hidden = !rows.length; if (!rows.length) return;
    const id = $('cut').value, c = Agenda.cut(id), selected = Agenda.select(rows, id, $('country').value), sum = Agenda.total(rows, id, $('country').value);
    $('export-results').disabled = !selected.length;
    $('cut-note').textContent = c.note; $('cut-note').className = 'notice' + (c.status === 'preliminar' ? ' preliminary' : '');
    $('selection-note').textContent = c.label + ' · Base: fecha de creación · ' + selected.length + ' países seleccionados. Los cortes se consultan por separado; no hay variación comparable entre 40 semanas y una semana.';
    const card = node('article', undefined, 'metric'); card.append(node('span', 'Agendamientos TY', 'metric-label'), node('strong', number(sum), 'metric-value'), node('span', 'Conteo del corte y países seleccionados', 'metric-detail')); $('metrics').append(card);
    const coverage = new Map((source?.countries || []).map(r => [Agenda.key(r.country), r]));
    const max = Math.max(...selected.map(r => r.count), 0);
    for (const r of selected) {
      const row = node('div', undefined, 'agenda-country-row'), track = node('div', undefined, 'agenda-track'), bar = node('span', undefined, 'agenda-bar'); bar.style.width = (max ? 100 * r.count / max : 0) + '%'; track.append(bar); track.setAttribute('aria-hidden', 'true'); row.append(node('strong', r.country), track, node('span', number(r.count))); $('country-chart').append(row);
      const cov = coverage.get(r.countryKey), tr = node('tr'); [r.country, number(r.count), cov?.createdThrough || 'Sin declarar', cov?.convertedThrough || 'Sin declarar'].forEach(value => tr.append(node('td', value))); $('detail-body').append(tr);
    }
    $('source-note').textContent = source?.refreshedOn ? 'Refresco del reporte declarado: ' + source.refreshedOn + '. Las fechas máximas por país son metadatos de disponibilidad; no garantizan carga completa del corte ni de cada sistema.' : 'No hay fechas de disponibilidad de origen declaradas para este archivo. Un conteo validado no acredita su cobertura.';
  }
  function download(text, filename) { if (!text) return; const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })), a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  function reset() { beginLoad(); setSourceContext(); $('file').value = ''; status('Sin datos cargados.'); }
  function setSourceContext(value) { Agenda.context(value); source = value ? JSON.parse(JSON.stringify(value)) : undefined; $('example').hidden = !!source?.real; $('mode-note').textContent = source?.real ? 'Datos reales agregados · vista privada local' : 'Prototipo local · ejemplos completamente ficticios'; render(); }
  $('file').addEventListener('change', e => { const file = e.target.files[0]; e.target.value = ''; if (file) loadFile(file); });
  $('example').addEventListener('click', () => { setSourceContext(); const token = beginLoad(); accept(Agenda.exampleCSV(), 'Ejemplo completamente ficticio', token); });
  $('template').addEventListener('click', () => download(Agenda.exampleCSV(), 'agendamientos-ejemplo-ficticio.csv'));
  $('cut').addEventListener('change', render); $('country').addEventListener('change', render); $('reset').addEventListener('click', reset);
  $('export-results').addEventListener('click', () => { if (!$('export-results').disabled) download(Agenda.exportResults(rows, $('cut').value, $('country').value, source), 'agendamientos-' + $('cut').value + '-por-pais.csv'); });
  $('export-errors').addEventListener('click', () => download(CSVLocal.exportErrors(errors), 'agendamientos-errores.csv'));
  window.AgendaApp = { loadFile, reset };
})();
