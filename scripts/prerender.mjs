import {readFile, writeFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const data=JSON.parse(await readFile(new URL('data/data.json',root),'utf8'));
const indexUrl=new URL('index.html',root);
let html=await readFile(indexUrl,'utf8');
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const formatters={
  usd:v=>v>=1e9?`US$${(v/1e9).toLocaleString('es-DO',{maximumFractionDigits:2})} mil MM`:`US$${v.toLocaleString('es-DO',{maximumFractionDigits:0})}`,
  percent:v=>`${v.toLocaleString('es-DO',{minimumFractionDigits:1,maximumFractionDigits:2})}%`,
  percentSigned:v=>`${v>=0?'+':''}${v.toLocaleString('es-DO',{minimumFractionDigits:1,maximumFractionDigits:1})}%`,
  integer:v=>Math.round(v).toLocaleString('es-DO'),
  dop:v=>`RD$${v.toLocaleString('es-DO',{minimumFractionDigits:2,maximumFractionDigits:4})}`,
  dopTotal:v=>v>=1e12?`RD$${(v/1e12).toLocaleString('es-DO',{maximumFractionDigits:2})} billones`:`RD$${(v/1e6).toLocaleString('es-DO',{maximumFractionDigits:1})} MM`,
  years:v=>`${v.toLocaleString('es-DO',{maximumFractionDigits:1})} años`
};
const labels={official:'OFICIAL',estimate:'ESTIMACIÓN',derived:'DERIVADO'};
const revisions={preliminary:'preliminar',preliminary_revised:'preliminar revisado',estimate:'estimación',budgeted:'presupuestado'};
const dates=i=>[i.period,i.publishedDate&&`publicado ${i.publishedDate}`,!i.publishedDate&&i.retrievedDate&&`consulta ${i.retrievedDate}`,revisions[i.revisionStatus]].filter(Boolean).join(' · ');
const cards=data.metrics.map(i=>`<article class="metric-card" data-tone="${escape(i.tone||'cyan')}" data-category="${escape(i.category)}"><div class="top"><h3>${escape(i.name.toUpperCase())}</h3><span class="tag ${escape(i.status)}">${escape(labels[i.status])}</span></div><div class="metric-value">${escape(formatters[i.format](i.value))}</div><p>${escape(i.description)}</p><div class="metric-meta"><span>${escape(dates(i))}</span><a href="${escape(i.url)}" target="_blank" rel="noopener noreferrer">${escape(i.source)} ↗</a></div></article>`).join('');
const start='<!-- metrics:start -->',end='<!-- metrics:end -->';
if(!html.includes(start)||!html.includes(end))throw new Error('No se encontraron los marcadores de prerender.');
html=html.replace(new RegExp(`${start}[\\s\\S]*?${end}`),`${start}${cards}${end}`);
html=html.replace(/(<small id="result-count"[^>]*>)[^<]*(<\/small>)/,`$1${data.metrics.length} indicadores$2`);
await writeFile(indexUrl,html);
console.log(`Prerenderizados ${data.metrics.length} indicadores.`);
