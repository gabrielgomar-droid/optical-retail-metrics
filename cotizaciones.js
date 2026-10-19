(function(root){
  'use strict';
  const FIELDS=Object.freeze(['ofrecimientos','cotizaciones','venta_app','recuperaciones_cerradas']);
  const HEADER=Object.freeze(['pais',...FIELDS]),ALL='*',MISSING='__sin_pais__';
  const LABELS=Object.freeze({ofrecimientos:'Ofrecimientos',cotizaciones:'Cotizaciones',venta_app:'Venta App',recuperaciones_cerradas:'Recuperaciones cerradas'});
  const MEASURES=Object.freeze({ofrecimientos:'OFRECIMIENTOS TY',cotizaciones:'Q COTIZACIONES TY',venta_app:'Q RECUPEROS APP TY',recuperaciones_cerradas:'Q RECUPEROS TY'});
  const WINDOW='Definición declarada: recuperación es una venta ya cerrada, posterior a la cotización, después de 24 horas y hasta 120 días. Inclusividad exacta de 24 horas no confirmada.';
  const COHORT='Las cotizaciones recientes todavía pueden recuperarse. La inmadurez corresponde a la cohorte de cotizaciones, no a las ventas recuperadas. Fecha de atribución/filtro pendiente; sin tasa final de conversión.';
  const COVERAGE='Completitud, última fecha real por país y unidad documental exacta de cada conteo no acreditadas. Cantidades independientes del origen, sin moneda ni suma entre métricas.';
  const key=s=>s.trim().normalize('NFC').replace(/\s+/g,' ').toLocaleLowerCase('es');
  const label=r=>r.country||'Sin país asignado';
  function dateValid(s){if(!/^2026-\d{2}-\d{2}$/.test(s||''))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;}
  function validatePeriod(p={}){if(!dateValid(p.start)||!dateValid(p.end))return 'Declara fechas gregorianas válidas de 2026 para el archivo.';if(p.start>p.end)return 'El inicio no puede ser posterior al fin.';return '';}
  function importCSV(text){const p=root.CSVLocal.read(text),errors=p.errors.slice(),rows=[];if(errors.length)return{rows,errors};
    if(p.header.length!==HEADER.length||!HEADER.every(h=>p.header.includes(h)))return{rows,errors:[{line:1,code:'ESQUEMA',message:'Usa las cinco columnas de la plantilla por país; sin columnas adicionales.'}]};
    const seen=new Set(),sums=Object.fromEntries(FIELDS.map(f=>[f,0]));
    for(const r of p.records){const v=Object.fromEntries(p.header.map((h,i)=>[h,r.values[i].trim().normalize('NFC')]));const fail=(code,message)=>errors.push({line:r.line,code,message});
      if(v.pais.length>100||/[\x00-\x1f\x7f]/.test(v.pais)||/^(total|todos|all|\*|__sin_pais__)$/i.test(v.pais)){fail('PAIS','País inválido o subtotal. Para país no asignado usa celda vacía.');continue;}
      const countryKey=v.pais?key(v.pais):MISSING;if(seen.has(countryKey)){fail('DUPLICADO','Una sola fila por país, incluido el grupo sin asignar.');continue;}seen.add(countryKey);
      const counts={};let bad=false;for(const f of FIELDS){if(!/^\d+$/.test(v[f])||!Number.isSafeInteger(Number(v[f]))){fail(f,'Usa un entero no negativo seguro, sin separadores ni decimales.');bad=true;}else{counts[f]=Number(v[f]);sums[f]+=counts[f];if(!Number.isSafeInteger(sums[f])){fail('RANGO','La suma de una medida excede la precisión entera.');bad=true;}}}
      if(!bad)rows.push({country:v.pais,countryKey,...counts});
    }return{rows:errors.length?[]:rows,errors};
  }
  function select(rows,countryKey=ALL){return rows.filter(r=>countryKey===ALL||r.countryKey===countryKey).sort((a,b)=>label(a).localeCompare(label(b),'es'));}
  function totals(rows,countryKey=ALL){const result=Object.fromEntries(FIELDS.map(f=>[f,0]));for(const r of select(rows,countryKey))for(const f of FIELDS){if(!Number.isSafeInteger(r[f])||r[f]<0||!Number.isSafeInteger(result[f]+r[f]))throw new Error('Conteo inválido o fuera de precisión.');result[f]+=r[f];}return result;}
  function exportResults(rows,period,countryKey=ALL,origin='declarado'){if(validatePeriod(period))throw new Error(validatePeriod(period));if(!['declarado','consulta_nativa_filtros_replicados'].includes(origin))throw new Error('Origen no admitido.');const selected=select(rows,countryKey);if(!selected.length)return null;
    const header=['nivel','pais','estado_pais','desde','hasta',...FIELDS,'ventana_declarada','cohorte_y_tasas','cobertura','origen_declarado'];
    const line=(level,country,state,counts)=>[level,country,state,period.start,period.end,...FIELDS.map(f=>counts[f]),WINDOW,COHORT,COVERAGE,origin];
    return root.CSVLocal.exportCSV([header,line('TOTAL_SELECCION','','',totals(rows,countryKey)),...selected.map(r=>line('PAIS',r.country,r.country?'informado':'sin_asignar',r))]);
  }
  function exampleCSV(){return HEADER.join(',')+'\nPaís ficticio A,120,60,80,15\nPaís ficticio B,80,40,50,10\n,5,2,1,1\n';}
  root.Quotes={FIELDS,HEADER,ALL,MISSING,LABELS,MEASURES,WINDOW,COHORT,COVERAGE,key,label,dateValid,validatePeriod,importCSV,select,totals,exportResults,exampleCSV};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.Quotes;
})(typeof globalThis!=='undefined'?globalThis:this);
