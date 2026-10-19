(function(root){
  'use strict';
  const HEADER=Object.freeze(['pais','moneda','importe_eur']), MISSING='__sin_pais__', ALL='*';
  const MEASURE='SNS EUR TY', PRECISION='EUR visibles, redondeados a unidad; centavos subyacentes no comprobados.', COVERAGE='Completitud y última fecha real por país no acreditadas. Refresco no equivale a carga completa.';
  const key=s=>s.trim().normalize('NFC').replace(/\s+/g,' ').toLocaleLowerCase('es');
  function dateValid(s){if(!/^2026-\d{2}-\d{2}$/.test(s||''))return false;const d=new Date(s+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;}
  function validatePeriod(p={}){if(!dateValid(p.start)||!dateValid(p.end))return 'Declara fechas válidas de 2026 para todo el agregado.';if(p.start>p.end)return 'El inicio no puede ser posterior al fin.';return '';}
  function importCSV(text){
    const p=root.CSVLocal.read(text),errors=p.errors.slice(),rows=[];if(errors.length)return{rows,errors};
    if(p.header.length!==3||!HEADER.every(h=>p.header.includes(h)))return{rows,errors:[{line:1,code:'ESQUEMA',message:'Usa exactamente pais,moneda,importe_eur; sin columnas adicionales.'}]};
    const seen=new Set();let sum=0;
    for(const r of p.records){const v=Object.fromEntries(p.header.map((h,i)=>[h,r.values[i].trim().normalize('NFC')]));const fail=(code,message)=>errors.push({line:r.line,code,message});
      if(v.pais.length>100||/[\x00-\x1f\x7f]/.test(v.pais)||/^(total|todos|all|\*|__sin_pais__)$/i.test(v.pais)){fail('PAIS','País inválido o subtotal. Para país no asignado usa celda vacía.');continue;}
      if(v.moneda!=='EUR'){fail('MONEDA','Este módulo solo admite EUR explícito; no convierte ni mezcla monedas.');continue;}
      if(!/^-?\d+$/.test(v.importe_eur)||!Number.isSafeInteger(Number(v.importe_eur))){fail('IMPORTE','Usa un entero seguro en EUR visibles, sin miles, decimales ni multiplicadores.');continue;}
      const countryKey=v.pais?key(v.pais):MISSING;if(seen.has(countryKey)){fail('DUPLICADO','Una sola fila por país, incluido el grupo sin país.');continue;}seen.add(countryKey);
      sum+=Number(v.importe_eur);if(!Number.isSafeInteger(sum)){fail('RANGO','La suma excede la precisión entera admitida.');continue;}
      rows.push({country:v.pais,countryKey,amount:Number(v.importe_eur),currency:'EUR'});
    }return{rows:errors.length?[]:rows,errors};
  }
  function label(r){return r.country||'Sin país asignado';}
  function select(rows,countryKey=ALL){return rows.filter(r=>countryKey===ALL||r.countryKey===countryKey).sort((a,b)=>label(a).localeCompare(label(b),'es'));}
  function total(rows,countryKey=ALL){return select(rows,countryKey).reduce((s,r)=>{if(r.currency!=='EUR'||!Number.isSafeInteger(r.amount)||!Number.isSafeInteger(s+r.amount))throw new Error('Total EUR inválido o fuera de precisión.');return s+r.amount;},0);}
  function exportResults(rows,period,countryKey=ALL,origin='declarado'){if(validatePeriod(period))throw new Error(validatePeriod(period));if(!['declarado','consulta_nativa_filtros_replicados'].includes(origin))throw new Error('Origen no admitido.');const selected=select(rows,countryKey);if(!selected.length)return null;
    const h=['nivel','pais','estado_pais','moneda','medida','desde','hasta','importe_eur','precision','cobertura','origen_declarado'];
    const line=(level,country,state,n)=>[level,country,state,'EUR',MEASURE,period.start,period.end,n,PRECISION,COVERAGE,origin];
    return root.CSVLocal.exportCSV([h,line('TOTAL_SELECCION','','',total(rows,countryKey)),...selected.map(r=>line('PAIS',r.country,r.country?'informado':'sin_asignar',r.amount))]);
  }
  function exampleCSV(){return HEADER.join(',')+'\nPaís ficticio A,EUR,1200\nPaís ficticio B,EUR,800\n,EUR,25\n';}
  root.Sales={HEADER,MISSING,ALL,MEASURE,PRECISION,COVERAGE,key,label,dateValid,validatePeriod,importCSV,select,total,exportResults,exampleCSV};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.Sales;
})(typeof globalThis!=='undefined'?globalThis:this);
