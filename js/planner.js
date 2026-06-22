const MESES=["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
let plActiveFilter='todos';
let coordActiveFilter='proximos';

function showColor(tipo,estado){
  if(estado==="Tentativo")return{bg:"#FAEEDA",txt:"#633806"};
  if(tipo==="Teatro")return{bg:"#E1F5EE",txt:"#085041"};
  if(tipo==="Teatro Especial")return{bg:"#FAECE7",txt:"#712B13"};
  if(tipo==="Show Bar")return{bg:"#EEEDFE",txt:"#3C3489"};
  return{bg:"#E6F1FB",txt:"#0C447C"};
}

function plFilter(f,btn){
  plActiveFilter=f;
  document.querySelectorAll('#pl-filter-tabs .filter-tab').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  buildPlanner();
}
function buildPlanner(){
  const grid=document.getElementById("planner-grid");
  const showFilter=plActiveFilter==='todos'||plActiveFilter==='shows';
  const contFilter=plActiveFilter==='todos'||plActiveFilter==='contenido';
  grid.innerHTML=MESES.map((mes,mi)=>{
    const mShows=showFilter?SHOWS.map((s,realIdx)=>({s,realIdx})).filter(o=>{ if(!o.s.fecha)return false; return parseInt(o.s.fecha.split("-")[1])===mi+1; }):[];
    const mCont=contFilter?(typeof CONTENIDO!=='undefined'?CONTENIDO:[]).filter(c=>{ if(!c.fecha)return false; return parseInt(c.fecha.split("-")[1])===mi+1; }):[];
    const combined=[...mShows.map(o=>({type:'show',day:parseInt(o.s.fecha.split("-")[2]),data:o})),...mCont.map(c=>({type:'content',day:parseInt(c.fecha.split("-")[2]),data:c}))].sort((a,b)=>a.day-b.day);
    const inner=combined.length?combined.map(entry=>{
      if(entry.type==='show'){ const {s,realIdx}=entry.data; const c=showColor(s.tipo,s.estado); const dia=s.fecha?s.fecha.split("-")[2]:"??"; return`<div class="cal-show" style="background:${c.bg};color:${c.txt}" onclick="goToShow(${realIdx})" title="Ver ${s.nombre.replace(/"/g,'&quot;')}"><div class="cs-date">🎤 Día ${dia}</div><div class="cs-name">${s.nombre}</div></div>`; }
      else { const item=entry.data; const dia=item.fecha?item.fecha.split("-")[2]:"??"; return`<div class="cal-content" onclick="openCdDetail('${item.id}')" title="Ver ${item.nombre.replace(/"/g,'&quot;')}"><div class="cc-meta"><span>🎬 Día ${dia}</span><span>${cdEstEmoji(item.estado)}</span></div><div class="cc-name">${item.nombre}</div></div>`; }
    }).join(""):`<div style="padding:10px 8px;font-size:10px;color:#ddd;font-style:italic;">Sin eventos</div>`;
    return`<div class="month-block"><div class="month-name">${mes}</div><div class="month-shows">${inner}</div></div>`;
  }).join("");
}

// ── COORDINACIÓN ──
function coordFilter(f,btn){
  coordActiveFilter=f;
  document.querySelectorAll('#coord-filter-tabs .filter-tab').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  buildCoordinacion();
}
function coordShowStatus(s,idx){
  const f=s.fichaTecnica; const fichaCompleta=!!(f&&(f.sonido||f.luces||f.backline||f.video||f.catering||f.riderArtista));
  const secciones=s.roadmap||[]; const totalTasks=secciones.reduce((a,sec)=>a+sec.tasks.length,0); const doneTasks=secciones.reduce((a,sec)=>a+sec.tasks.filter(t=>t.est==="Listo").length,0); const roadmapPct=totalTasks?Math.round(doneTasks/totalTasks*100):0;
  const presupPersonalizado=!!s.presupuesto;
  const items=(typeof CONTENIDO!=='undefined'?CONTENIDO:[]).filter(c=>c.showIdx===idx); const pub=items.filter(c=>c.estado==='Publicado').length; const pendientes=items.length-pub;
  const hoy=new Date();hoy.setHours(0,0,0,0); const fechaShow=s.fecha?new Date(s.fecha+"T12:00:00"):null; const diasFaltan=fechaShow?Math.round((fechaShow-hoy)/(1000*60*60*24)):null; const esPasado=s.estado==="Realizado"||s.estado==="Cancelado"||(diasFaltan!==null&&diasFaltan<0); const esProximo=diasFaltan!==null&&diasFaltan>=0&&diasFaltan<=21;
  let semaforo="grey";
  if(!esPasado){ const sinContenido=items.length===0; const roadmapBajo=roadmapPct<50; const faltaFicha=!fichaCompleta; if(esProximo&&(sinContenido||roadmapBajo||faltaFicha)){ semaforo="red"; } else if(!fichaCompleta||roadmapPct<100||items.length===0){ semaforo="yellow"; } else { semaforo="green"; } }
  return{fichaCompleta,roadmapPct,totalTasks,presupPersonalizado,items,pub,pendientes,diasFaltan,esPasado,esProximo,semaforo};
}
function buildCoordinacion(){
  const body=document.getElementById("coord-body"); if(!body)return;
  let rows=SHOWS.map((s,idx)=>({s,idx,st:coordShowStatus(s,idx)})); rows.sort((a,b)=>(a.s.fecha||"").localeCompare(b.s.fecha||""));
  if(coordActiveFilter==='proximos'){ rows=rows.filter(r=>!r.st.esPasado); } else if(coordActiveFilter==='riesgo'){ rows=rows.filter(r=>r.st.semaforo==='red'||r.st.semaforo==='yellow'); }
  const totalRiesgo=SHOWS.filter((s,idx)=>{const st=coordShowStatus(s,idx);return!st.esPasado&&st.semaforo==='red';}).length;
  const totalProximos=SHOWS.filter((s,idx)=>!coordShowStatus(s,idx).esPasado).length;
  const totalContenidoPendiente=(typeof CONTENIDO!=='undefined'?CONTENIDO:[]).filter(c=>c.estado!=='Publicado').length;
  const statsHTML=`<div class="cd-stats-row" style="margin-bottom:16px;"><div class="stat-card"><div class="lbl">Shows próximos</div><div class="val">${totalProximos}</div><div class="sub">no realizados todavía</div></div><div class="stat-card"><div class="lbl">En riesgo</div><div class="val" style="color:var(--r600)">${totalRiesgo}</div><div class="sub">requieren atención ya</div></div><div class="stat-card"><div class="lbl">Contenido pendiente</div><div class="val" style="color:var(--b600)">${totalContenidoPendiente}</div><div class="sub">piezas sin publicar</div></div></div>`;
  if(!rows.length){ body.innerHTML=statsHTML+`<div class="card" style="text-align:center;color:#bbb;padding:40px;">No hay shows que coincidan con este filtro.</div>`; return; }
  const semColor={red:"coord-sem-red",yellow:"coord-sem-yellow",green:"coord-sem-green",grey:"coord-sem-grey"};
  const deptLabel=(ok,warnCond,okTxt,warnTxt,badTxt)=>{ if(ok)return`<span class="coord-dept-ok">✅ ${okTxt}</span>`; if(warnCond)return`<span class="coord-dept-warn">🟡 ${warnTxt}</span>`; return`<span class="coord-dept-bad">⚠️ ${badTxt}</span>`; };
  const rowsHTML=rows.map(({s,idx,st})=>{ const rowClass=st.semaforo==='red'?'coord-row-risk':''; const diasTxt=st.esPasado?'Realizado':(st.diasFaltan===0?'Hoy':st.diasFaltan===1?'Mañana':`En ${st.diasFaltan} días`); return`<tr class="${rowClass}" onclick="goToShowDetailFull(${idx},'info')"><td style="padding-left:14px;"><div style="font-weight:600;">${s.nombre}</div><div style="font-size:10px;color:#aaa;">${fmtDate(s.fecha)} · ${diasTxt}</div></td><td>${deptLabel(st.fichaCompleta,false,'Completa','','Sin datos')}</td><td>${st.totalTasks?`<div class="coord-mini-bar"><div class="coord-mini-fill" style="width:${st.roadmapPct}%;background:${st.roadmapPct===100?'var(--t600)':st.roadmapPct>=50?'#d9a72c':'var(--r600)'}"></div></div> <span style="font-size:11px;color:#888;">${st.roadmapPct}%</span>`:`<span class="coord-dept-bad">⚠️ Sin hoja de ruta</span>`}</td><td>${st.presupPersonalizado?`<span class="coord-dept-ok">✅ Personalizado</span>`:`<span class="coord-dept-warn">🟡 Plantilla</span>`}</td><td>${st.items.length?`<span style="font-size:11px;">${st.items.length} piezas · <span style="color:var(--t600);font-weight:600;">${st.pub} pub.</span>${st.pendientes?` · <span style="color:#b8860b;">${st.pendientes} pend.</span>`:''}</span><button class="btn" style="font-size:9px;padding:2px 6px;margin-left:6px;" onclick="event.stopPropagation();goToShowDetailFull(${idx},'cdshow')">Ver</button></td>`:`<span class="coord-dept-bad">⚠️ Sin contenido</span>`}</td><td style="text-align:center;"><span class="coord-semaforo ${semColor[st.semaforo]}" title="${{red:"Urgente",yellow:"Atención",green:"Encaminado",grey:"Show pasado"}[st.semaforo]}"></span></td></tr>`; }).join("");
  body.innerHTML=statsHTML+`<div class="card" style="padding:0;overflow:hidden;"><table class="tbl"><thead><tr><th style="padding-left:14px">Show</th><th>Ficha técnica</th><th>Hoja de ruta</th><th>Presupuesto</th><th>Contenido digital</th><th style="text-align:center;">Estado</th></tr></thead><tbody>${rowsHTML}</tbody></table></div>`;
}