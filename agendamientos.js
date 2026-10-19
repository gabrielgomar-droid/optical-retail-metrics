/* Country-level fiscal creation cohorts. No network, DOM or stored source data. */
(function (root) {
  'use strict';
  const HEADER = Object.freeze(['pais', 'anio_fiscal', 'semana_desde', 'semana_hasta', 'estado', 'agendamientos']);
  const CUTS = Object.freeze([
    Object.freeze({ id: 's01_40', year: 2026, start: 1, end: 40, status: 'observado', label: 'Fiscal creación 2026 · Semanas 1–40', note: 'Acumulado observado de 40 semanas fiscales; completitud no acreditada.' }),
    Object.freeze({ id: 's41', year: 2026, start: 41, end: 41, status: 'preliminar', label: 'Fiscal creación 2026 · Semana 41 · PRELIMINAR', note: 'Una semana fiscal preliminar; la carga puede estar incompleta.' })
  ]);
  const CALENDAR_NOTE = 'Correspondencia gregoriana del calendario fiscal de creación pendiente de comprobación directa.';
  const COMPLETENESS_NOTE = 'Completitud no acreditada. Refresco del reporte y fecha máxima de registros no equivalen a carga completa.';
  const key = value => value.trim().normalize('NFC').replace(/\s+/g, ' ').toLocaleLowerCase('es');
  function cut(id) { const value = CUTS.find(c => c.id === id); if (!value) throw new Error('Selecciona un único corte fiscal admitido.'); return value; }
  function validCountry(value) { return value.length > 0 && value.length <= 100 && !/[\x00-\x1f\x7f]/.test(value) && !/^(total|todos|all)$/i.test(value); }
  function dateValid(value) {
    if (!/^2026-\d{2}-\d{2}$/.test(value || '')) return false;
    const d = new Date(value + 'T00:00:00Z'); return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
  }
  function context(input) {
    if (!input) return { real: false, refreshedOn: '', countries: [] };
    if (typeof input.real !== 'boolean' || (input.refreshedOn && !dateValid(input.refreshedOn)) || !Array.isArray(input.countries)) throw new Error('Metadatos de fuente inválidos.');
    const seen = new Set(), countries = input.countries.map(r => {
      if (typeof r.country !== 'string' || !validCountry(r.country.trim()) || !dateValid(r.createdThrough) || !dateValid(r.convertedThrough)) throw new Error('Cobertura de país inválida.');
      if (input.refreshedOn && (r.createdThrough > input.refreshedOn || r.convertedThrough > input.refreshedOn)) throw new Error('La disponibilidad no puede ser posterior al refresco declarado.');
      const countryKey = key(r.country); if (seen.has(countryKey)) throw new Error('Cobertura duplicada.'); seen.add(countryKey);
      return { countryKey, createdThrough: r.createdThrough, convertedThrough: r.convertedThrough };
    });
    return { real: input.real, refreshedOn: input.refreshedOn || '', countries };
  }
  function importCSV(text) {
    const parsed = root.CSVLocal.read(text), errors = parsed.errors.slice(), rows = [];
    if (errors.length) return { rows, errors };
    if (parsed.header.length !== HEADER.length || !HEADER.every(h => parsed.header.includes(h))) return { rows, errors: [{ line: 1, code: 'ESQUEMA', message: 'Usa exactamente las seis columnas de la plantilla por país; sin columnas adicionales.' }] };
    const seen = new Set(), labels = new Map();
    for (const record of parsed.records) {
      const values = Object.fromEntries(parsed.header.map((h, i) => [h, record.values[i].trim().normalize('NFC')]));
      const fail = (code, message) => errors.push({ line: record.line, code, message });
      if (!validCountry(values.pais)) { fail('PAIS', 'Incluye un país de hasta 100 caracteres, sin controles ni subtotales.'); continue; }
      const cohort = CUTS.find(c => values.anio_fiscal === String(c.year) && values.semana_desde === String(c.start) && values.semana_hasta === String(c.end) && values.estado === c.status);
      if (!cohort) { fail('CORTE', 'Solo se admiten fiscal creación 2026, semanas 1–40 observado o semana 41 preliminar.'); continue; }
      if (!/^\d+$/.test(values.agendamientos) || !Number.isSafeInteger(Number(values.agendamientos))) { fail('CONTEO', 'El conteo debe ser un entero no negativo y seguro, sin separadores, decimales ni notación científica.'); continue; }
      const countryKey = key(values.pais), rowKey = JSON.stringify([countryKey, cohort.id]);
      if (seen.has(rowKey)) { fail('DUPLICADO', 'Hay más de una fila del mismo país y corte fiscal.'); continue; } seen.add(rowKey);
      if (!labels.has(countryKey)) labels.set(countryKey, values.pais);
      rows.push({ country: labels.get(countryKey), countryKey, cut: cohort.id, count: Number(values.agendamientos) });
    }
    if (!errors.length) {
      for (const countryKey of labels.keys()) if (!CUTS.every(c => seen.has(JSON.stringify([countryKey, c.id])))) errors.push({ line: 1, code: 'COBERTURA', message: 'Cada país debe tener una fila de cada uno de los dos cortes, incluidos ceros explícitos. No se completa un faltante con cero.' });
      for (const c of CUTS) if (!Number.isSafeInteger(rows.filter(r => r.cut === c.id).reduce((sum, r) => sum + r.count, 0))) errors.push({ line: 1, code: 'RANGO', message: 'La suma de un corte excede la precisión entera admitida.' });
    }
    return { rows: errors.length ? [] : rows, errors };
  }
  function select(rows, cutId, countryKey = '') { cut(cutId); return rows.filter(r => r.cut === cutId && (!countryKey || r.countryKey === countryKey)).sort((a, b) => a.country.localeCompare(b.country, 'es')); }
  function total(rows, cutId, countryKey = '') { return select(rows, cutId, countryKey).reduce((sum, r) => sum + r.count, 0); }
  function exportResults(rows, cutId, countryKey = '', source) {
    const cohort = cut(cutId), selected = select(rows, cutId, countryKey); if (!selected.length) return null;
    const meta = context(source), coverage = new Map(meta.countries.map(c => [c.countryKey, c]));
    const header = ['nivel', 'pais', 'anio_fiscal', 'semana_desde', 'semana_hasta', 'estado', 'base_fecha', 'agendamientos', 'max_fecha_creacion_origen', 'max_fecha_conversion_origen', 'fecha_refresco_origen', 'calendario_creacion', 'completitud'];
    const line = (level, country, count, cov) => [level, country, cohort.year, cohort.start, cohort.end, cohort.status, 'creacion', count, cov?.createdThrough || '', cov?.convertedThrough || '', meta.refreshedOn, CALENDAR_NOTE, COMPLETENESS_NOTE];
    return root.CSVLocal.exportCSV([header, line('TOTAL_SELECCION', '', total(rows, cutId, countryKey)), ...selected.map(r => line('PAIS', r.country, r.count, coverage.get(r.countryKey)))]);
  }
  function exampleCSV() {
    return HEADER.join(',') + '\n' + [
      'País ficticio A,2026,1,40,observado,120', 'País ficticio B,2026,1,40,observado,80', 'País ficticio C,2026,1,40,observado,0',
      'País ficticio A,2026,41,41,preliminar,7', 'País ficticio B,2026,41,41,preliminar,3', 'País ficticio C,2026,41,41,preliminar,0'
    ].join('\n') + '\n';
  }
  root.Agenda = { HEADER, CUTS, CALENDAR_NOTE, COMPLETENESS_NOTE, key, cut, context, dateValid, importCSV, select, total, exportResults, exampleCSV };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Agenda;
})(typeof globalThis !== 'undefined' ? globalThis : this);
