const state={data:null,primary:2026,compare:2020,metric:"debt_gdp"};
const $=id=>document.getElementById(id);
const escapeHtml=value=>String(value).replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));

function formatValue(value,format){
  if(value===null||value===undefined)return "No disponible";
  const number=Number(value);
  if(format==="percent")return `${number.toLocaleString("es-DO",{maximumFractionDigits:2})}%`;
  if(format==="percentSigned")return `${number>0?"+":""}${number.toLocaleString("es-DO",{maximumFractionDigits:2})}%`;
  if(format==="integer")return number.toLocaleString("es-DO",{maximumFractionDigits:0});
  if(format==="dop")return `RD$${number.toLocaleString("es-DO",{minimumFractionDigits:2,maximumFractionDigits:4})}`;
  if(format==="usd"){
    if(Math.abs(number)>=1e9)return `US$${(number/1e9).toLocaleString("es-DO",{maximumFractionDigits:2})} mil MM`;
    return `US$${number.toLocaleString("es-DO")}`;
  }
  return number.toLocaleString("es-DO");
}

function record(year,id){return state.data.years[String(year)]?.[id]||null}
function setupControls(){
  const years=Object.keys(state.data.years).map(Number).sort((a,b)=>b-a);
  const options=years.map(year=>`<option value="${year}">${year}</option>`).join("");
  $("year-primary").innerHTML=options; $("year-compare").innerHTML=options;
  $("year-primary").value=String(state.primary); $("year-compare").value=String(state.compare);
  $("chart-metric").innerHTML=state.data.indicators.map(item=>`<option value="${item.id}">${escapeHtml(item.name)}</option>`).join("");
  $("chart-metric").value=state.metric;
  $("year-primary").addEventListener("change",event=>{state.primary=Number(event.target.value);render()});
  $("year-compare").addEventListener("change",event=>{state.compare=Number(event.target.value);renderComparison()});
  $("chart-metric").addEventListener("change",event=>{state.metric=event.target.value;renderChart()});
}

function renderCards(){
  const available=state.data.indicators.filter(indicator=>record(state.primary,indicator.id)).length;
  $("selected-year").textContent=state.primary;
  $("availability-summary").textContent=`${available} de ${state.data.indicators.length} disponibles`;
  $("history-cards").innerHTML=state.data.indicators.map(indicator=>{
    const item=record(state.primary,indicator.id);
    if(!item)return `<article class="history-card unavailable"><div class="card-top"><h3>${escapeHtml(indicator.name)}</h3><span class="history-status">Pendiente</span></div><div class="history-value">No disponible</div><p class="history-note">Esta serie todavía no ha sido incorporada con una fuente y metodología verificadas para ${state.primary}.</p></article>`;
    return `<article class="history-card"><div class="card-top"><h3>${escapeHtml(indicator.name)}</h3><span class="history-status ${escapeHtml(item.status)}">${escapeHtml(item.label)}</span></div><div class="history-value">${formatValue(item.value,indicator.format)}</div><div class="history-period">${escapeHtml(item.period)}</div><p class="history-note">${escapeHtml(item.note)}</p><a class="history-source" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.source)} ↗</a></article>`;
  }).join("");
  $("year-context").textContent=state.data.contexts[String(state.primary)]||state.data.contexts.default;
}

function renderComparison(){
  $("head-primary").textContent=state.primary; $("head-compare").textContent=state.compare;
  $("comparison-body").innerHTML=state.data.indicators.map(indicator=>{
    const a=record(state.primary,indicator.id),b=record(state.compare,indicator.id);
    let delta='<span class="na">No comparable</span>';
    if(a&&b&&typeof a.value==="number"&&typeof b.value==="number"){
      const diff=a.value-b.value,cls=diff>0?"delta-up":diff<0?"delta-down":"";
      delta=`<span class="${cls}">${diff>0?"+":""}${formatValue(diff,indicator.format)}</span>`;
    }
    return `<tr><td>${escapeHtml(indicator.name)}</td><td class="${a?"":"na"}">${a?formatValue(a.value,indicator.format):"No disponible"}</td><td class="${b?"":"na"}">${b?formatValue(b.value,indicator.format):"No disponible"}</td><td>${delta}</td></tr>`;
  }).join("");
}

function renderChart(){
  const indicator=state.data.indicators.find(item=>item.id===state.metric);
  const points=Object.keys(state.data.years).map(Number).sort((a,b)=>a-b).map(year=>({year,item:record(year,state.metric)})).filter(point=>point.item&&typeof point.item.value==="number");
  $("chart-title").textContent=indicator.name; $("chart-unit").textContent=indicator.unit;
  const svg=$("history-chart"),empty=$("chart-empty");
  if(points.length<2){svg.hidden=true;empty.hidden=false;return}
  svg.hidden=false;empty.hidden=true;
  const width=900,height=360,pad={left:80,right:28,top:28,bottom:55};
  const values=points.map(point=>point.item.value),min=Math.min(...values),max=Math.max(...values),range=max-min||1;
  const x=year=>pad.left+(year-2000)/(2026-2000)*(width-pad.left-pad.right);
  const y=value=>pad.top+(max-value)/range*(height-pad.top-pad.bottom);
  const grid=[0,.25,.5,.75,1].map(step=>{const gy=pad.top+step*(height-pad.top-pad.bottom);return `<line class="chart-grid" x1="${pad.left}" y1="${gy}" x2="${width-pad.right}" y2="${gy}"/>`}).join("");
  const path=points.map((point,index)=>`${index?"L":"M"}${x(point.year).toFixed(1)},${y(point.item.value).toFixed(1)}`).join(" ");
  const dots=points.map(point=>`<circle class="chart-dot" cx="${x(point.year)}" cy="${y(point.item.value)}" r="6"><title>${point.year}: ${formatValue(point.item.value,indicator.format)}</title></circle>`).join("");
  const labels=[2000,2005,2010,2015,2020,2026].map(year=>`<text class="chart-label" x="${x(year)}" y="${height-18}" text-anchor="middle">${year}</text>`).join("");
  svg.innerHTML=`${grid}<path class="chart-line" d="${path}"/>${dots}${labels}`;
}

function render(){renderCards();renderComparison();renderChart()}

fetch("data/historia.json?v=20261120",{cache:"no-cache"}).then(response=>{if(!response.ok)throw new Error("No se pudo cargar la base histórica");return response.json()}).then(data=>{state.data=data;setupControls();render()}).catch(error=>{$("history-cards").innerHTML=`<p class="chart-empty">${escapeHtml(error.message)}. Intenta recargar la página.</p>`});
