/* Generic CSV infrastructure. No business schema, network or storage. */
(function (root) {
  'use strict';
  const issue = (code, line, message) => ({ code, line, message });
  const DEFAULT_LIMIT = 2 * 1024 * 1024;

  function read(text, options = {}) {
    const delimiter = options.delimiter === undefined ? ',' : options.delimiter;
    if (delimiter !== ',' && delimiter !== ';') throw new Error('Selecciona explícitamente coma o punto y coma.');
    if (typeof text !== 'string') throw new TypeError('Se esperaba texto CSV.');
    const maxRows = options.maxRows === undefined ? 10000 : options.maxRows;
    const maxCharacters = options.maxCharacters === undefined ? DEFAULT_LIMIT : options.maxCharacters;
    if (!Number.isSafeInteger(maxRows) || maxRows < 1 || !Number.isSafeInteger(maxCharacters) || maxCharacters < 1) throw new Error('Límites inválidos.');
    if (text.length > maxCharacters) return { header: [], records: [], errors: [issue('TEXT_LIMIT', 1, 'El texto supera el límite de caracteres configurado.')] };
    if (text.includes('\u0000')) return { header: [], records: [], errors: [issue('NUL_CHARACTER', 1, 'El texto contiene un carácter NUL. Comprueba su codificación.')] };
    text = text.replace(/^\uFEFF/, '');
    const parsed = [], errors = [];
    let fields = [], value = '', state = 'start', line = 1, firstLine = 1, touched = false;
    function finishField() { fields.push(value); value = ''; state = 'start'; }
    function finishRecord() {
      finishField();
      if (touched || fields.length > 1 || fields[0] !== '') parsed.push({ line: firstLine, values: fields });
      fields = []; touched = false;
      if (parsed.length > maxRows + 1) errors.push(issue('ROW_LIMIT', firstLine, 'El archivo supera el límite de filas configurado.'));
    }
    for (let i = 0; i < text.length && !errors.length; i++) {
      const ch = text[i];
      if (state === 'quoted') {
        if (ch === '"') {
          if (text[i + 1] === '"') { value += '"'; i++; } else state = 'closed';
        } else if (ch === '\r' || ch === '\n') {
          if (ch === '\r' && text[i + 1] === '\n') i++;
          value += '\n'; line++;
        } else value += ch;
        continue;
      }
      if (ch === delimiter) { finishField(); touched = true; continue; }
      if (ch === '\r' || ch === '\n') {
        finishRecord();
        if (ch === '\r' && text[i + 1] === '\n') i++;
        line++; firstLine = line; continue;
      }
      if (state === 'closed') { errors.push(issue('AFTER_QUOTE', line, 'Hay caracteres después del cierre de comillas.')); break; }
      if (ch === '"') {
        if (state !== 'start') { errors.push(issue('UNEXPECTED_QUOTE', line, 'Comillas dentro de un campo sin entrecomillar.')); break; }
        state = 'quoted'; touched = true;
      } else { value += ch; state = 'plain'; touched = true; }
    }
    if (!errors.length && state === 'quoted') errors.push(issue('UNCLOSED_QUOTE', firstLine, 'Campo con comillas sin cerrar.'));
    if (!errors.length && (touched || fields.length || value)) finishRecord();
    if (errors.length) return { header: [], records: [], errors };
    if (!parsed.length) return { header: [], records: [], errors: [issue('EMPTY_FILE', 1, 'El archivo está vacío.')] };
    const header = parsed[0].values.map(name => name.trim().normalize('NFC'));
    const used = new Set();
    for (const name of header) {
      if (!name) errors.push(issue('EMPTY_HEADER', parsed[0].line, 'Hay un encabezado vacío.'));
      if (used.has(name)) errors.push(issue('DUPLICATE_HEADER', parsed[0].line, 'Hay encabezados duplicados después de recortar espacios.'));
      used.add(name);
    }
    for (const name of options.requiredHeaders || []) {
      if (!header.includes(name)) errors.push(issue('MISSING_HEADER', parsed[0].line, 'Falta un encabezado requerido por la configuración: ' + name + '.'));
    }
    if (parsed.length === 1) errors.push(issue('NO_RECORDS', parsed[0].line, 'Incluye al menos una fila de datos.'));
    for (const record of parsed.slice(1)) {
      if (record.values.length !== header.length) errors.push(issue('FIELD_COUNT', record.line, 'La cantidad de campos no coincide con la cabecera.'));
    }
    // All-or-nothing: invalid input cannot leave stale or partial valid data.
    return { header: errors.length ? [] : header, records: errors.length ? [] : parsed.slice(1), errors };
  }

  function cell(value) {
    let text = value === null || value === undefined ? '' : String(value);
    // Human-facing spreadsheet export; formula-like values become literal text.
    if (typeof value === 'string' && (/^[\s]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text))) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function exportCSV(records) {
    return '\uFEFF' + records.map(row => row.map(cell).join(',')).join('\r\n') + '\r\n';
  }
  function exportErrors(errors) {
    return exportCSV([['fila_fisica', 'codigo', 'error'], ...errors.map(e => [e.line, e.code, e.message])]);
  }

  function createSession() {
    let current = { header: [], records: [], errors: [] };
    return {
      load(text, options) { current = { header: [], records: [], errors: [] }; current = read(text, options); return current; },
      reset() { current = { header: [], records: [], errors: [] }; },
      snapshot() { return JSON.parse(JSON.stringify(current)); }
    };
  }
  root.CSVLocal = { read, exportCSV, exportErrors, createSession };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.CSVLocal;
})(typeof globalThis !== 'undefined' ? globalThis : this);
