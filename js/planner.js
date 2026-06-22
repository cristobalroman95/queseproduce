const MESES=["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
const MESES_FULL=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_SEMANA=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

let plActiveFilter='todos';
let plActiveView='anual';   // 'anual' | 'calendario'
let calYear=new Date().getFullYear();
let calMonth=new Date().getMonth(); // 0-indexed
let coordActiveFilter='proximos';

function showColor(tipo,estado){
  if(estado==="Tentativo")return{bg:"#FAEEDA",txt:"#633806"};
  if(tipo==="Teatro")return{bg:"#E1F5EE",txt:"#085041"};
  if(tipo==="Teatro Especial")return{bg:"#FAECE7",txt:"#712B13"};
  if(tipo==="Show Bar")return{bg:"#EEEDFE",txt:"#3C3489"};
  return{bg:"#E6F1FB",txt:"#0C447C"};
}

// ── FUNCIÓN REUTILIZABLE: agrupar items por semana ──
function groupByWeek(items, getFecha){
  const weeks=[];
  const weekMap={};
  items.forEach(item=>{
    const fecha=getFecha(item);
    if(!fecha)return;
    const d=new Date(fecha+"T12:00:00");
    const dow=d.getDay(); // 0=Dom
    const monday=new Date(d); monday.setDate(d.getDate()-(dow===0?6:dow-1));
    const sunday=new Date(monday); sunday.setDate(monday.getDate()+6);
    const key=monday.toISOString().slice(0,10);
    if(!weekMap[key]){
      weekMap[key]={key,monday:new Date(monday),sunday:new Date(sunday),items:[]};
      weeks.push(weekMap[key]);
    }
    weekMap[key].items.push(item);
  });
  weeks.sort((a,b)=>a.key.localeCompare(b.key));
  return weeks;
}

// ── FILTRO Y VISTA ──
function plFilter(f,btn){
  plActiveFilter=f;
  document.querySelectorAll('#pl-filter-tabs .filter-tab').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  _renderPlannerView();
}
function plSetView(v,btn){
  plActiveView=v;
  document.querySelectorAll('#pl-view-tabs .pl-view-tab').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  // Mostrar/ocultar leyenda (solo vista anual)
  const legend=document.querySelector('.pl-legend');
  if(legend)legend.style.display=v==='anual'?'':'none';
  _renderPlannerView();
}
function _renderPlannerView(){
  if(plActiveView==='calendario') buildPlannerCalendario();
  else buildPlanner();
}

// ── VISTA ANUAL (original) ──
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

// ── VISTA CALENDARIO MENSUAL (B.4) ──
function buildPlannerCalendario(){
  const grid=document.getElementById("planner-grid");
  const showFilter=plActiveFilter==='todos'||plActiveFilter==='shows';
  const contFilter=plActiveFilter==='todos'||plActiveFilter==='contenido';

  // Navegación header
  const prevMonth=calMonth===0?{m:11,y:calYear-1}:{m:calMonth-1,y:calYear};
  const nextMonth=calMonth===11?{m:0,y:calYear+1}:{m:calMonth+1,y:calYear};
  const today=new Date(); today.setHours(0,0,0,0);
  const isCurrentMonth=today.getFullYear()===calYear&&today.getMonth()===calMonth;

  const navHTML=`<div class="cal-nav">
    <button class="cal-nav-btn" onclick="calNavTo(${prevMonth.y},${prevMonth.m})">←</button>
    <span class="cal-nav-title">${MESES_FULL[calMonth]} ${calYear}</span>
    <button class="cal-nav-btn" onclick="calNavTo(${nextMonth.y},${nextMonth.m})">→</button>
    ${!isCurrentMonth?`<button class="cal-nav-hoy" onclick="calNavHoy()">Hoy</button>`:''}
  </div>`;

  // Header días de semana
  const dowHeader=DIAS_SEMANA.map(d=>`<div class="cal-dow">${d}</div>`).join('');

  // Calcular celdas del mes
  const firstDay=new Date(calYear,calMonth,1);
  const lastDay=new Date(calYear,calMonth+1,0);
  const startDow=firstDay.getDay(); // 0=Dom
  const totalDays=lastDay.getDate();

  // Agrupar items por fecha "YYYY-MM-DD"
  const dayMap={};
  const addToDay=(dateStr,entry)=>{
    if(!dateStr)return;
    const key=dateStr.slice(0,10);
    if(!dayMap[key])dayMap[key]=[];
    dayMap[key].push(entry);
  };
  if(showFilter){
    SHOWS.forEach((s,realIdx)=>{
      if(!s.fecha)return;
      if(parseInt(s.fecha.slice(5,7))===calMonth+1&&parseInt(s.fecha.slice(0,4))===calYear){
        addToDay(s.fecha,{type:'show',data:{s,realIdx}});
      }
    });
  }
  if(contFilter&&typeof CONTENIDO!=='undefined'){
    CONTENIDO.forEach(c=>{
      if(!c.fecha)return;
      if(parseInt(c.fecha.slice(5,7))===calMonth+1&&parseInt(c.fecha.slice(0,4))===calYear){
        addToDay(c.fecha,{type:'content',data:c});
      }
    });
  }

  // Generar celdas
  let cellsHTML='';
  // Celdas vacías antes del día 1
  for(let i=0;i<startDow;i++) cellsHTML+=`<div class="cal-cell cal-cell-empty"></div>`;

  for(let d=1;d<=totalDays;d++){
    const dateStr=`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday=isCurrentMonth&&d===today.getDate();
    const entries=dayMap[dateStr]||[];

    const chipsHTML=entries.map(entry=>{
      if(entry.type==='show'){
        const {s,realIdx}=entry.data;
        const c=showColor(s.tipo,s.estado);
        const equipo=equipoStackHTML('show',s.id,3);
        const label=(s.nombre||'').length>18?s.nombre.slice(0,17)+'…':s.nombre;
        return`<div class="cal-chip cal-chip-show"
          style="background:${c.bg};color:${c.txt};"
          onclick="goToShow(${realIdx})"
          data-tooltip="${s.nombre.replace(/"/g,'&quot;')} · Equipo: ${(PERSONAS||[]).filter(p=>getAsignaciones&&getAsignaciones('show',s.id).some(a=>a.personaId===p.id)).map(p=>p.nombre).join(', ')||'—'}"
        >🎤 ${label}</div>`;
      } else {
        const item=entry.data;
        const label=(item.nombre||'').length>18?item.nombre.slice(0,17)+'…':item.nombre;
        const equipo=equipoStackHTML('contenido',item.id,3);
        return`<div class="cal-chip cal-chip-content"
          onclick="openCdDetail('${item.id}')"
          data-tooltip="${item.nombre.replace(/"/g,'&quot;')} · ${cdEstEmoji(item.estado)} ${item.estado}"
        >${cdEstEmoji(item.estado)} ${label}</div>`;
      }
    }).join('');

    const overflow=entries.length>3?`<div class="cal-chip-more">+${entries.length-3} más</div>`:'';
    const visibleChips=entries.length>3?entries.slice(0,3).map(e=>{
      // reusar la misma lógica pero tomar solo primeros 3
      return chipsHTML; // placeholder, se maneja abajo
    }):null;

    // Chips mostrados (máx 3 + overflow)
    const chipsVisible=entries.slice(0,3).map(entry=>{
      if(entry.type==='show'){
        const {s,realIdx}=entry.data;
        const c=showColor(s.tipo,s.estado);
        const nombres=(PERSONAS||[]).filter(p=>typeof getAsignaciones==='function'&&getAsignaciones('show',s.id).some(a=>a.personaId===p.id)).map(p=>p.nombre).join(', ')||'—';
        const label=(s.nombre||'').length>18?s.nombre.slice(0,17)+'…':s.nombre;
        return`<div class="cal-chip cal-chip-show" style="background:${c.bg};color:${c.txt};" onclick="goToShow(${realIdx})" title="${s.nombre.replace(/"/g,'&quot;')} · Equipo: ${nombres.replace(/"/g,'&quot;')}">🎤 ${label}</div>`;
      } else {
        const item=entry.data;
        const label=(item.nombre||'').length>18?item.nombre.slice(0,17)+'…':item.nombre;
        return`<div class="cal-chip cal-chip-content" onclick="openCdDetail('${item.id}')" title="${item.nombre.replace(/"/g,'&quot;')} · ${item.estado.replace(/"/g,'&quot;')}">${cdEstEmoji(item.estado)} ${label}</div>`;
      }
    }).join('');
    const overflowHTML=entries.length>3?`<div class="cal-chip-more" onclick="calOpenDay('${dateStr}')">+${entries.length-3} más</div>`:'';

    cellsHTML+=`<div class="cal-cell${isToday?' cal-cell-today':''}" onclick="calCellClick('${dateStr}',event)">
      <div class="cal-cell-num${isToday?' cal-cell-num-today':''}">${d}</div>
      <div class="cal-cell-chips">${chipsVisible}${overflowHTML}</div>
    </div>`;
  }

  // Rellenar resto de la grilla (múltiplo de 7)
  const totalCells=startDow+totalDays;
  const remaining=(7-totalCells%7)%7;
  for(let i=0;i<remaining;i++) cellsHTML+=`<div class="cal-cell cal-cell-empty"></div>`;

  grid.innerHTML=`${navHTML}<div class="cal-monthly-grid"><div class="cal-dow-row">${dowHeader}</div><div class="cal-cells">${cellsHTML}</div></div>`;
}

function calNavTo(y,m){ calYear=y; calMonth=m; buildPlannerCalendario(); }
function calNavHoy(){ calYear=new Date().getFullYear(); calMonth=new Date().getMonth(); buildPlannerCalendario(); }

// Clic en celda vacía → modal creación con fecha prellenada
function calCellClick(dateStr,e){
  if(e.target.classList.contains('cal-chip')||e.target.classList.contains('cal-chip-more'))return;
  calOpenNewModal(dateStr);
}

function calOpenNewModal(dateStr){
  // Remover modal previo si existe
  const prev=document.getElementById('cal-new-modal'); if(prev)prev.remove();
  const overlay=document.createElement('div');
  overlay.id='cal-new-modal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:900;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML=`<div style="background:var(--surface2);border:0.5px solid var(--border-soft);border-radius:14px;padding:28px 32px;min-width:300px;max-width:380px;">
    <h3 style="margin:0 0 6px;font-size:14px;">Nuevo ítem — ${fmtDate(dateStr)}</h3>
    <p style="font-size:11px;color:#aaa;margin:0 0 18px;">¿Qué querés crear en esta fecha?</p>
    <div style="display:flex;gap:10px;">
      <button class="btn btn-primary" style="flex:1;" onclick="calNuevoShow('${dateStr}')">🎤 Nuevo Show</button>
      <button class="btn" style="flex:1;" onclick="calNuevoContenido('${dateStr}')">🎬 Nueva Pieza</button>
    </div>
    <button onclick="document.getElementById('cal-new-modal').remove()" style="display:block;margin:14px auto 0;background:none;border:none;color:#888;font-size:11px;cursor:pointer;">Cancelar</button>
  </div>`;
  overlay.addEventListener('click',e=>{ if(e.target===overlay)overlay.remove(); });
  document.body.appendChild(overlay);
}

function calNuevoShow(dateStr){
  document.getElementById('cal-new-modal')?.remove();
  // Navegar a sección shows y pre-cargar fecha si hay formulario de creación
  const navItem=Array.from(document.querySelectorAll('.nav-item')).find(n=>n.getAttribute('onclick')?.includes("nav('shows'"));
  if(navItem)nav('shows',navItem);
  // Intentar pre-llenar fecha si existe campo
  setTimeout(()=>{
    const fechaInput=document.getElementById('sh-nueva-fecha')||document.querySelector('[data-field="fecha"]');
    if(fechaInput){fechaInput.value=dateStr; fechaInput.dispatchEvent(new Event('change'));}
    toast('📅 Fecha '+fmtDate(dateStr)+' pre-cargada');
  },200);
}

function calNuevoContenido(dateStr){
  document.getElementById('cal-new-modal')?.remove();
  const navItem=Array.from(document.querySelectorAll('.nav-item')).find(n=>n.getAttribute('onclick')?.includes("nav('contenido'"));
  if(navItem)nav('contenido',navItem);
  setTimeout(()=>{
    const fechaInput=document.getElementById('cd-nueva-fecha')||document.querySelector('#cd-add-form [name="fecha"]');
    if(fechaInput){fechaInput.value=dateStr; fechaInput.dispatchEvent(new Event('change'));}
    toast('📅 Fecha '+fmtDate(dateStr)+' pre-cargada');
  },200);
}

function calOpenDay(dateStr){
  // Futuro: mostrar modal con todos los items del día
  toast('📅 '+fmtDate(dateStr));
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