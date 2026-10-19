(function(){
  'use strict';if(typeof CSVLocal==='undefined'&&typeof load==='function')load('csv.js');if(typeof Sales==='undefined'&&typeof load==='function')load('ventas.js');if(typeof CSVLocal==='undefined'&&typeof require==='function')globalThis.CSVLocal=require('./csv.js');if(typeof Sales==='undefined'&&typeof require==='function')globalThis.Sales=require('./ventas.js');
  const results=[],fixture=Sales.exampleCSV(),period={start:'2026-09-01',end:'2026-09-17'},rows=()=>Sales.importCSV(fixture).rows;
  function assert(v,m='Aserción fallida'){if(!v)throw new Error(m);}function eq(a,b){assert(JSON.stringify(a)===JSON.stringify(b),JSON.stringify(a)+' != '+JSON.stringify(b));}function test(name,fn){try{fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}}function reject(text,code){const r=Sales.importCSV(text);eq(r.rows,[]);assert(r.errors.some(e=>e.code===code),'Falta '+code);}function throws(fn){let fail=false;try{fn();}catch(_){fail=true;}assert(fail);}
  test('Ventas: fixture con dos países y grupo sin asignar',()=>{eq(Sales.importCSV(fixture).errors,[]);eq(rows().length,3);});
  test('Ventas: total visible concilia 1200 + 800 + 25 = 2025',()=>eq(Sales.total(rows()),2025));
  test('Ventas: país seleccionado conserva importe',()=>eq(Sales.total(rows(),Sales.key('País ficticio A')),1200));
  test('Ventas: país vacío se conserva separado con importe25',()=>{const r=Sales.select(rows(),Sales.MISSING);eq(r.length,1);eq(r[0].amount,25);eq(r[0].country,'');eq(Sales.label(r[0]),'Sin país asignado');});
  test('Ventas: no elimina importes negativos del origen',()=>eq(Sales.total(Sales.importCSV(fixture.replace('EUR,1200','EUR,-1200')).rows),-375));
  test('Ventas: cero explícito es un importe válido',()=>eq(Sales.importCSV(fixture.replace('EUR,1200','EUR,0')).rows[0].amount,0));
  test('Ventas: rechaza moneda ajena o mezclada',()=>{for(const c of ['USD','CLP','LC','','eur'])reject(fixture.replace('EUR,1200',c+',1200'),'MONEDA');});
  test('Ventas: API de total rechaza monedas mezcladas',()=>throws(()=>Sales.total(rows().concat([{country:'Otro',countryKey:'otro',currency:'USD',amount:1}]))));
  test('Ventas: rechaza decimales, vacíos, notación científica y sufijos',()=>{for(const n of ['1.5','','1e3','NaN','Infinity','12 mil','2M'])reject(fixture.replace('EUR,1200','EUR,'+n),'IMPORTE');});
  test('Ventas: no acepta separadores de miles ni exceso de precisión',()=>{for(const n of ['"1,200"','1.200','9007199254740992'])reject(fixture.replace('EUR,1200','EUR,'+n),'IMPORTE');});
  test('Ventas: rechaza suma fuera de precisión',()=>reject(fixture.replace('EUR,1200','EUR,9007199254740991'),'RANGO'));
  test('Ventas: detecta duplicado por mayúsculas y espacios',()=>reject(fixture+' PAÍS FICTICIO A ,EUR,1\n','DUPLICADO'));
  test('Ventas: detecta grupo sin país duplicado',()=>reject(fixture+',EUR,1\n','DUPLICADO'));
  test('Ventas: rechaza subtotales y claves reservadas',()=>{for(const n of ['Total','TODOS','All','*','__sin_pais__'])reject(fixture.replace('País ficticio A',n),'PAIS');});
  test('Ventas: rechaza nombre con controles o más de100caracteres',()=>{reject(fixture.replace('País ficticio A','x'.repeat(101)),'PAIS');reject(fixture.replace('País ficticio A','"A\nB"'),'PAIS');});
  test('Ventas: rechaza columnas adicionales de origen',()=>reject(fixture.trim().split('\n').map((l,i)=>l+(i?',ETIQUETA_FICTICIA':',cadena')).join('\n'),'ESQUEMA'));
  test('Ventas: admite columnas reordenadas',()=>eq(Sales.importCSV(fixture.trim().split('\n').map(l=>l.split(',').reverse().join(',')).join('\n')).errors,[]));
  test('Ventas: un archivo inválido no entrega resultados parciales',()=>reject(fixture.replace('EUR,800','EUR,xyz'),'IMPORTE'));
  test('Ventas: BOM y CRLF no alteran el importe',()=>eq(Sales.total(Sales.importCSV('\uFEFF'+fixture.replaceAll('\n','\r\n')).rows),2025));
  test('Ventas: rango válido de 2026',()=>eq(Sales.validatePeriod(period),''));
  test('Ventas: rechaza otros años, fecha imposible y rangos invertidos',()=>{for(const p of [{},{start:'2025-12-31',end:'2026-09-17'},{start:'2026-02-29',end:'2026-09-17'},{start:'2026-09-18',end:'2026-09-17'}])assert(Sales.validatePeriod(p));});
  test('Ventas: exporta total y tres grupos sin mezclar monedas',()=>{const r=CSVLocal.read(Sales.exportResults(rows(),period));eq(r.records.length,4);eq(r.records[0].values[7],'2025');assert(r.records.every(x=>x.values[3]==='EUR'&&x.values[4]==='SNS EUR TY'));});
  test('Ventas: exporta país seleccionado únicamente',()=>{const r=CSVLocal.read(Sales.exportResults(rows(),period,Sales.key('País ficticio B')));eq(r.records.length,2);eq(r.records[0].values[7],'800');eq(r.records[1].values[1],'País ficticio B');});
  test('Ventas: exporta grupo sin asignar con país vacío y estado explícito',()=>{const r=CSVLocal.read(Sales.exportResults(rows(),period,Sales.MISSING));eq(r.records[1].values.slice(1,4),['','sin_asignar','EUR']);eq(r.records[0].values[7],'25');});
  test('Ventas: exportación conserva periodo, precisión y cobertura',()=>{const r=CSVLocal.read(Sales.exportResults(rows(),period));assert(r.records.every(x=>x.values[5]===period.start&&x.values[6]===period.end&&x.values[8]===Sales.PRECISION&&x.values[9]===Sales.COVERAGE));});
  test('Ventas: selección vacía no exporta y periodo inválido bloquea',()=>{eq(Sales.exportResults(rows(),period,'inexistente'),null);throws(()=>Sales.exportResults(rows(),{}));});
  test('Ventas: neutraliza fórmulas en etiquetas conservando números negativos',()=>{const r=Sales.importCSV(fixture.replace('País ficticio A','=PAIS').replace('EUR,1200','EUR,-1200')),csv=CSVLocal.read(Sales.exportResults(r.rows,period,'=pais'));eq(csv.records[1].values[1],"'=PAIS");eq(csv.records[1].values[7],'-1200');});
  test('Ventas: exportación no tiene columnas de cadenas ni derivados inventados',()=>{const r=CSVLocal.read(Sales.exportResults(rows(),period));assert(!r.header.some(h=>/cadena|banner|variacion|presupuesto|forecast|tasa/.test(h)));});
  test('Ventas: seleccionar y exportar no modifica el estado importado',()=>{const r=rows(),before=JSON.stringify(r);Sales.select(r,Sales.MISSING);Sales.exportResults(r,period);eq(JSON.stringify(r),before);});
  test('Ventas: origen declarado se conserva sin afirmar exportación del visual',()=>{const r=CSVLocal.read(Sales.exportResults(rows(),period,Sales.ALL,'consulta_nativa_filtros_replicados'));assert(r.records.every(x=>x.values[10]==='consulta_nativa_filtros_replicados'));throws(()=>Sales.exportResults(rows(),period,Sales.ALL,'export_visual_no_acreditado'));});
  const passed=results.filter(r=>r.pass).length,summary=passed+'/'+results.length+' pruebas correctas de ventas';globalThis.SALES_TEST_RESULTS=results;
  if(typeof document!=='undefined'){for(const r of results){const li=document.createElement('li');li.textContent=(r.pass?'✓ ':'✗ ')+r.name+(r.error?' — '+r.error:'');if(!r.pass)li.className='fail';document.getElementById('test-results').append(li);}document.getElementById('test-summary').textContent=summary;document.title=summary;}else{const out=typeof print==='function'?print:console.log;for(const r of results)out((r.pass?'PASS ':'FAIL ')+r.name+(r.error?': '+r.error:''));out(summary);if(passed!==results.length)throw new Error(summary);}
})();
