const state={rows:[],sismapMeta:null,sort:'accrued',direction:-1};
const money=new Intl.NumberFormat('es-DO',{minimumFractionDigits:1,maximumFractionDigits:1});
const pct=new Intl.NumberFormat('es-DO',{minimumFractionDigits:1,maximumFractionDigits:1});
const esc=value=>String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const derived=row=>({...row,execution:row.current?row.accrued/row.current*100:0,available:row.current-row.accrued,variation:row.current-row.initial});
const formatMoney=value=>`RD$${money.format(value)} MM`;

function filtered(){
  const query=document.querySelector('#budget-search').value.trim().toLocaleLowerCase('es');
  const section=document.querySelector('#budget-section').value;
  const level=document.querySelector('#budget-level').value;
  return state.rows.map(derived).filter(row=>{
    const text=!query||`${row.name} ${row.code}`.toLocaleLowerCase('es').includes(query);
    const group=section==='all'||row.section===section;
    const band=level==='all'||level==='high'&&row.execution>=80||level==='medium'&&row.execution>=60&&row.execution<80||level==='low'&&row.execution<60;
    return text&&group&&band;
  }).sort((a,b)=>{
    const left=a[state.sort],right=b[state.sort];
    return(typeof left==='string'?left.localeCompare(right,'es'):left-right)*state.direction;
  });
}

function sismapCell(row){
  return row.sismap?`<span class="tag official" title="Posición ${row.sismap.rank} del ranking de septiembre de 2026">${pct.format(row.sismap.score)}%</span>`:'<span class="na">N/D</span>';
}

function render(){
  const rows=filtered();
  document.querySelector('#budget-status').textContent=`${rows.length} instituciones visibles · ${rows.filter(row=>row.sismap).length} con valoración SISMAP vinculada`;
  document.querySelector('#budget-rows').innerHTML=rows.length?rows.map(row=>`<tr tabindex="0" data-code="${esc(row.code)}"><td><strong>${esc(row.name)}</strong><span class="institution-code">${esc(row.code)} · ${esc(row.section)}</span></td><td>${formatMoney(row.initial)}</td><td>${formatMoney(row.current)}</td><td>${formatMoney(row.accrued)}</td><td class="execution-cell">${pct.format(row.execution)}%</td><td>${formatMoney(row.available)}</td><td>${sismapCell(row)}</td><td class="na">N/D acumulado</td><td class="na">N/D acumulado</td></tr>`).join(''):'<tr><td colspan="9">No hay instituciones que coincidan con los filtros.</td></tr>';
  document.querySelectorAll('#budget-rows tr[data-code]').forEach(tr=>{
    tr.addEventListener('click',()=>openInstitution(tr.dataset.code));
    tr.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openInstitution(tr.dataset.code);}});
  });
}

function openInstitution(code){
  const row=derived(state.rows.find(item=>item.code===code));
  document.querySelector('#dialog-section').textContent=row.section;
  document.querySelector('#dialog-title').textContent=row.name;
  document.querySelector('#dialog-code').textContent=`Código institucional ${row.code} · corte presupuestario 13 nov 2026 · preliminar`;
  const metrics=[['Presupuesto inicial',formatMoney(row.initial)],['Presupuesto vigente',formatMoney(row.current)],['Devengado',formatMoney(row.accrued)],['Ejecución',`${pct.format(row.execution)}%`],['Modificación',formatMoney(row.variation)],['Disponible',formatMoney(row.available)],['Comprometido','N/D acumulado'],['Pagado','N/D acumulado']];
  document.querySelector('#dialog-metrics').innerHTML=metrics.map(([label,value])=>`<div class="dialog-metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');
  document.querySelector('#dialog-sismap').innerHTML=row.sismap?`<strong>SISMAP: ${pct.format(row.sismap.score)}%</strong> · posición ${row.sismap.rank} en el informe de septiembre de 2026.<br><a href="${esc(state.sismapMeta.source)}" target="_blank" rel="noopener noreferrer">Ver informe oficial ↗</a>`:'<strong>SISMAP: no disponible en este cruce.</strong> No se asigna una valoración si la institución no pudo vincularse de forma inequívoca con el informe trimestral.';
  document.querySelector('#institution-dialog').showModal();
}

function download(){
  const header=['codigo','institucion','seccion','inicial_rd_mm','vigente_rd_mm','devengado_rd_mm','ejecucion_pct','disponible_rd_mm','sismap_pct','sismap_posicion','sismap_periodo','comprometido','pagado','corte','estado'];
  const lines=filtered().map(row=>[row.code,row.name,row.section,row.initial,row.current,row.accrued,row.execution.toFixed(1),row.available.toFixed(1),row.sismap?.score??'N/D',row.sismap?.rank??'N/D',row.sismap?'Sep 2026':'N/D','N/D acumulado','N/D acumulado','2026-11-13','Preliminar']);
  const csv=[header,...lines].map(line=>line.map(value=>`"${String(value).replaceAll('"','""')}"`).join(',')).join('\n');
  const link=document.createElement('a');link.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));link.download='rddebtclock-presupuesto-sismap-2026.csv';link.click();URL.revokeObjectURL(link.href);
}

Promise.all([fetch('data/presupuesto-2026.json').then(response=>response.json()),fetch('data/sismap-2026.json').then(response=>response.json())]).then(([budget,sismap])=>{
  const scores=new Map(sismap.institutions.map(item=>[item.code,item]));
  state.rows=budget.institutions.map(row=>({...row,sismap:scores.get(row.code)||null}));
  state.sismapMeta=sismap.meta;
  render();
}).catch(()=>{document.querySelector('#budget-rows').innerHTML='<tr><td colspan="9">No se pudieron cargar los datos. Consulta las fuentes oficiales enlazadas al final.</td></tr>';});
document.querySelectorAll('#budget-search,#budget-section,#budget-level').forEach(control=>control.addEventListener('input',render));
document.querySelectorAll('[data-sort]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.sort;if(state.sort===key)state.direction*=-1;else{state.sort=key;state.direction=key==='name'?1:-1;}render();}));
document.querySelector('#download-budget').addEventListener('click',download);
