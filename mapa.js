const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace('BAHORUCO','BAORUCO').replace('MONTECRISTI','MONTE CRISTI');
const money=v=>`RD$${v.toLocaleString('es-DO',{maximumFractionDigits:1})} MM`;
const people=v=>v.toLocaleString('es-DO');
const perCapita=(m,p)=>m*1e6/p;
const formatMetric=(key,d)=>key==='population'?`${people(d.population)} habitantes`:key==='executed'?money(d.executed):key==='planned'?money(d.planned):`RD$${Math.round(perCapita(d.executed,d.population)).toLocaleString('es-DO')} por habitante`;
const metricInfo={
  population:{label:'Población censada',period:'Censo 2022',field:d=>d.population},
  executed:{label:'Inversión ejecutada',period:'Ene–Sep 2026 · devengado',field:d=>d.executed},
  planned:{label:'Inversión formulada',period:'Proyecto PGE 2027 · presupuestado',field:d=>d.planned},
  percapita:{label:'Inversión ejecutada por habitante',period:'Ene–Sep 2026 · cálculo derivado',field:d=>perCapita(d.executed,d.population)}
};
let current='executed',selected=null,records,features;

function buildFeatures(geojson){
  return geojson.features.map(f=>({name:f.properties.name,rings:f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates}));
}
function bounds(fs){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;fs.forEach(f=>f.rings.flat(2).forEach(([x,y])=>{minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}));return {minX,minY,maxX,maxY};}
function pathFor(f,b,w=1000,h=520){const pad=18,s=Math.min((w-pad*2)/(b.maxX-b.minX),(h-pad*2)/(b.maxY-b.minY));return f.rings.map(poly=>poly.map(ring=>ring.map(([x,y],i)=>`${i?'L':'M'}${(pad+(x-b.minX)*s).toFixed(1)},${(h-pad-(y-b.minY)*s).toFixed(1)}`).join('')+'Z').join('')).join('');}
function color(value,min,max){const t=max===min?.5:(value-min)/(max-min);const a=[23,59,72],b=[24,214,229];return `rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*t)).join(',')})`;}
function render(){
  const info=metricInfo[current],values=records.map(info.field),min=Math.min(...values),max=Math.max(...values),b=bounds(features),svg=document.getElementById('province-map');
  svg.innerHTML='';
  features.forEach(f=>{const d=records.find(r=>normalize(r.name)===normalize(f.name));if(!d)return;const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',pathFor(f,b));p.setAttribute('fill',color(info.field(d),min,max));p.setAttribute('class',`province${selected===d.name?' active':''}`);p.setAttribute('tabindex','0');p.setAttribute('role','button');p.setAttribute('aria-label',`${d.name}: ${formatMetric(current,d)}`);p.dataset.name=d.name;p.addEventListener('click',()=>select(d));p.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(d)}});svg.appendChild(p)});
  document.getElementById('legend-min').textContent=formatMetric(current,records.reduce((a,d)=>info.field(d)<info.field(a)?d:a));
  document.getElementById('legend-max').textContent=formatMetric(current,records.reduce((a,d)=>info.field(d)>info.field(a)?d:a));
  renderRanking(); if(selected)select(records.find(r=>r.name===selected),false);else select(records.reduce((a,d)=>info.field(d)>info.field(a)?d:a),false);
}
function select(d,rerender=true){selected=d.name;if(rerender)render();const info=metricInfo[current];document.getElementById('province-name').textContent=d.name;document.getElementById('detail-label').textContent=info.label;document.getElementById('detail-value').textContent=formatMetric(current,d);document.getElementById('detail-period').textContent=info.period;document.getElementById('detail-pop').textContent=people(d.population);document.getElementById('detail-executed').textContent=money(d.executed);document.getElementById('detail-planned').textContent=money(d.planned);document.getElementById('detail-capita').textContent=`RD$${Math.round(perCapita(d.executed,d.population)).toLocaleString('es-DO')}`;}
function renderRanking(){const info=metricInfo[current],top=[...records].sort((a,b)=>info.field(b)-info.field(a)).slice(0,10);document.getElementById('ranking-title').textContent=`Mayores valores · ${info.label}`;document.getElementById('ranking').innerHTML=top.map((d,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span><span>${d.name}</span><b>${formatMetric(current,d)}</b></li>`).join('');}
document.querySelectorAll('[data-metric]').forEach(btn=>btn.addEventListener('click',()=>{current=btn.dataset.metric;document.querySelectorAll('[data-metric]').forEach(b=>b.classList.toggle('selected',b===btn));render()}));
Promise.all([fetch('data/provincias.json').then(r=>r.json()),fetch('data/provinces.geojson').then(r=>r.json())]).then(([data,geojson])=>{records=data.provinces;features=buildFeatures(geojson);document.getElementById('map-loading').remove();document.getElementById('map-content').hidden=false;render();}).catch(()=>{document.getElementById('map-loading').className='map-error';document.getElementById('map-loading').textContent='No fue posible cargar el mapa. Intenta actualizar la página.'});
