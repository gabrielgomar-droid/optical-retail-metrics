(function (root) {
  'use strict';
  const CANONICAL = ['pais', 'banner', 'detractores', 'neutros', 'promotores', 'respuestas'];
  const COUNTRY = ['pais', 'detractores', 'neutros', 'promotores', 'respuestas'];
  const BI = ['País / Cadena', 'Cadena', 'Detractor', 'Neutro', 'Promotor', 'Total'];
  const BI_OPTIONAL = ['% Detractor', '% Neutro', '% Promotor', 'NPS'];
  const FIELDS = ['detractors', 'passives', 'promoters', 'responses'];
  const key = text => text.trim().normalize('NFC').toLowerCase();
  const err = (line, field, message) => ({ line, code: field, message });
  function dateValid(text) {
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(text || '')) return false;
    const [y, m, d] = text.split('-').map(Number), date = new Date(Date.UTC(y, m - 1, d));
    return y >= 1900 && y <= 9999 && date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
  }
  function validatePeriod(meta) {
    if (!meta || !dateValid(meta.start) || !dateValid(meta.end)) return 'Declara las fechas de inicio y fin del agregado (AAAA-MM-DD).';
    if (meta.start > meta.end) return 'El inicio no puede ser posterior al fin.';
    if (meta.start.slice(0, 4) !== meta.end.slice(0, 4)) return 'Usa un archivo de un único año; no se combinan años en este módulo.';
    if (meta.asOf && (!dateValid(meta.asOf) || meta.asOf < meta.end)) return 'La fecha de corte disponible debe ser válida y no anterior al fin del periodo.';
    return '';
  }
  function importCSV(text) {
    const base = root.CSVLocal.read(text);
    if (base.errors.length) return { rows: [], errors: base.errors, format: null };
    const canonical = CANONICAL.every(h => base.header.includes(h)), native = BI.every(h => base.header.includes(h)), countryOnly = !canonical && COUNTRY.every(h => base.header.includes(h));
    if (!canonical && !native && !countryOnly) return { rows: [], errors: [err(1, 'ESQUEMA', 'No coincide con la plantilla NPS por país ni con un resumen de origen admitido.')], format: null };
    const names = countryOnly ? ['pais', null, 'detractores', 'neutros', 'promotores', 'respuestas'] : canonical ? CANONICAL : BI;
    const allowed = countryOnly ? COUNTRY : canonical ? CANONICAL : BI.concat(BI_OPTIONAL);
    if (base.header.some(h => !allowed.includes(h))) return { rows: [], errors: [err(1, 'ESQUEMA', 'Hay columnas extra. Usa solo país, banner y conteos agregados; no importes registros personales.')], format: null };
    const rows = [], errors = [], seen = new Set(), totals = { detractors: 0, passives: 0, promoters: 0, responses: 0 };
    for (const record of base.records) {
      const values = names.map(name => name === null ? '' : record.values[base.header.indexOf(name)].trim().normalize('NFC')), before = errors.length;
      for (let i = 0; i < (countryOnly ? 1 : 2); i++) {
        if (!values[i] || values[i].length > 100 || /[\u0000-\u001f\u007f]/.test(values[i])) errors.push(err(record.line, names[i], 'Nombre obligatorio de hasta 100 caracteres, sin controles ni saltos.'));
        if (key(values[i]) === 'total') errors.push(err(record.line, names[i], 'Retira subtotales y total general; importa solo filas país/banner.'));
      }
      const counts = values.slice(2).map((value, i) => {
        if (!/^(0|[1-9][0-9]*)$/.test(value) || !Number.isSafeInteger(Number(value))) { errors.push(err(record.line, names[i + 2], 'Conteo obligatorio: entero no negativo, sin miles, decimales ni símbolos.')); return null; }
        return Number(value);
      });
      if (errors.length !== before) continue;
      if (!Number.isSafeInteger(counts[0] + counts[1] + counts[2]) || counts[0] + counts[1] + counts[2] !== counts[3]) { errors.push(err(record.line, names[5], 'Respuestas debe ser igual a detractores + neutros + promotores.')); continue; }
      const identity = JSON.stringify([key(values[0]), key(values[1])]);
      if (seen.has(identity)) { errors.push(err(record.line, 'CLAVE', countryOnly ? 'País duplicado. Usa una sola fila agregada por país.' : 'Clave de origen duplicada. No se suman filas duplicadas.')); continue; }
      seen.add(identity);
      if (native && base.header.includes('NPS')) {
        const score = record.values[base.header.indexOf('NPS')].trim();
        if (score && (!/^-?[0-9]+(?:\.[0-9]+)?$/.test(score) || Number(score) < -100 || Number(score) > 100 || (counts[3] === 0 && Number(score) !== 0) || (counts[3] > 0 && Math.abs(Number(score) - 100 * (counts[2] - counts[0]) / counts[3]) > 0.51))) { errors.push(err(record.line, 'NPS', 'El NPS informado no concilia con los conteos (tolerancia: 0,51 puntos).')); continue; }
      }
      const row = { country: values[0], banner: values[1], countryKey: key(values[0]), bannerKey: key(values[1]), line: record.line };
      FIELDS.forEach((field, i) => { row[field] = counts[i]; totals[field] += counts[i]; });
      if (FIELDS.some(field => !Number.isSafeInteger(totals[field]))) errors.push(err(record.line, 'RANGO', 'El total supera el rango de precisión entera admitido.'));
      rows.push(row);
    }
    return { rows: errors.length ? [] : rows, errors, format: errors.length ? null : countryOnly ? 'país' : canonical ? 'plantilla' : 'resumen de origen' };
  }
  function aggregate(rows) {
    const a = { rowCount: rows.length, detractors: 0, passives: 0, promoters: 0, responses: 0, score: null };
    for (const row of rows) for (const f of FIELDS) { a[f] += row[f]; if (!Number.isSafeInteger(a[f])) throw new Error('Total fuera del rango de precisión.'); }
    if (a.responses > 0) a.score = 100 * (a.promoters - a.detractors) / a.responses;
    return a;
  }
  function select(rows, country, banner) { return rows.filter(r => (!country || r.countryKey === country) && (!banner || r.bannerKey === banner)); }
  function byCountry(rows) {
    const groups = new Map(); rows.forEach(r => { if (!groups.has(r.countryKey)) groups.set(r.countryKey, []); groups.get(r.countryKey).push(r); });
    return [...groups.values()].map(group => ({ country: group[0].country, ...aggregate(group) })).sort((a, b) => a.country.localeCompare(b.country, 'es'));
  }
  function countryRows(rows) { return byCountry(rows).map(group => ({ country: group.country, countryKey: key(group.country), detractors: group.detractors, passives: group.passives, promoters: group.promoters, responses: group.responses })); }
  function exportResults(rows, meta) {
    const problem = validatePeriod(meta); if (problem) throw new Error(problem); if (!rows.length) return null;
    const entries = [['TOTAL', '', aggregate(rows)], ...countryRows(rows).map(r => ['PAIS', r.country, aggregate([r])])];
    return root.CSVLocal.exportCSV([
      ['alcance', 'pais', 'periodo_inicio', 'periodo_fin', 'corte_disponible_declarado', 'detractores', 'neutros', 'promotores', 'respuestas', 'nps_puntos'],
      ...entries.map(([scope, country, a]) => [scope, country, meta.start, meta.end, meta.asOf || '', a.detractors, a.passives, a.promoters, a.responses, a.score === null ? '' : Number(a.score.toFixed(6))])
    ]);
  }
  function exampleCSV() { return root.CSVLocal.exportCSV([CANONICAL,
    ['País ficticio A', 'Banner ficticio Norte', 12, 18, 70, 100],
    ['País ficticio A', 'Banner ficticio Centro', 6, 9, 15, 30],
    ['País ficticio B', 'Banner ficticio Sur', 25, 5, 20, 50],
    ['País ficticio C', 'Banner ficticio Este', 0, 0, 0, 0]
  ]); }
  root.NPS = { CANONICAL, COUNTRY, BI, importCSV, aggregate, select, byCountry, countryRows, validatePeriod, dateValid, exportResults, exampleCSV };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.NPS;
})(typeof globalThis !== 'undefined' ? globalThis : this);
