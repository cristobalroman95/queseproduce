const MESES=["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
const MESES_FULL=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_SEMANA=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

let plActiveFilter='todos';
let plActiveView='anual';   // 'anual' | 'calendario' | 'gantt' | 'kanban'
let calYear=new Date().getFullYear();
let calMonth=new Date().getMonth(); // 0-indexed
let coordActiveFilter='proximos';

// ── Estado Gantt del Planner (independiente del Gantt de Contenido) ──
let _plGanttDayWidth=30;
let _plGanttRowHeight=42;
let _plGanttZoomTouched=false;
let _plGanttCollapsed={};

// ── Estado Kanban del Planner (B.2) ──
const SHOW_ESTADOS=['Tentativo','Confirmado','En proceso','Realizado','Cancelado'];
let plKanbanMode='shows';   // 'shows' | 'contenido' — toggle dentro de la vista Kanban (Opción A)
let _plKanbanDrag=null;     // {kind:'show'|'contenido', id}

function showColor(tipo,estado){
  if(estado==="Tentativo")return{bg:"#FAEEDA",txt:"#633806"};
  if(tipo==="Teatro")return{bg:"#E1F5EE",txt:"#085041"};
  if(tipo==="Teatro Especial")return{bg:"#FAECE7",txt:"#712B13"};
  if(tipo==="Show Bar")return{bg:"#EEEDFE",txt:"#3C3489"};
  return{bg:"#E6F1FB",txt:"#0C447C"};
}

// ── FUNCIÓN REUTILIZABLE: agrupar items por semana ──
function groupItemsByWeek(items, getFecha){
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
  // El filtro todos/shows/contenido no aplica en Kanban (usa su propio toggle interno)
  const filterTabs=document.getElementById('pl-filter-tabs');
  if(filterTabs)filterTabs.style.display=v==='kanban'?'none':'';
  _renderPlannerView();
}
function _renderPlannerView(){
  if(plActiveView==='calendario') buildPlannerCalendario();
  else if(plActiveView==='gantt') buildPlannerGantt();
  else if(plActiveView==='kanban') buildPlannerKanban();
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


// ── VISTA GANTT UNIFICADO (B.3) ──
function setPlGanttDayWidth(v){_plGanttZoomTouched=true;_plGanttDayWidth=parseInt(v);buildPlannerGantt();}
function setPlGanttRowHeight(v){_plGanttZoomTouched=true;_plGanttRowHeight=parseInt(v);buildPlannerGantt();}
function togglePlGanttGroup(key){_plGanttCollapsed[key]=!_plGanttCollapsed[key];buildPlannerGantt();}

function buildPlannerGantt(){
  const grid=document.getElementById('planner-grid');
  if(!grid)return;
  const showFilter=plActiveFilter==='todos'||plActiveFilter==='shows';
  const contFilter=plActiveFilter==='todos'||plActiveFilter==='contenido';

  if(!_plGanttZoomTouched){_plGanttDayWidth=window.innerWidth<640?14:28;_plGanttRowHeight=window.innerWidth<640?32:40;}

  // ── Resolver fechas de cada ítem ──
  const resolved=[];

  if(showFilter){
    SHOWS.forEach((s,realIdx)=>{
      if(!s.fecha)return;
      const d=new Date(s.fecha+'T12:00:00');
      resolved.push({kind:'show',realIdx,s,ini:d,fin:d,label:s.nombre,color:showGanttColor(s.tipo,s.estado)});
    });
  }
  if(contFilter&&typeof CONTENIDO!=='undefined'){
    CONTENIDO.forEach(it=>{
      let idea=it.fechaIdea?new Date(it.fechaIdea+'T12:00:00'):null;
      let ini=it.fechaInicio?new Date(it.fechaInicio+'T12:00:00'):null;
      let fin=it.fecha?new Date(it.fecha+'T12:00:00'):null;
      if(!ini&&idea)ini=idea; if(!fin)fin=ini||idea; if(!ini)ini=fin; if(!idea)idea=ini;
      if(!ini&&!fin)return;
      if(idea>ini){const t=idea;idea=ini;ini=t;}
      if(ini>fin){const t=ini;ini=fin;fin=t;}
      const hasPrep=!!(it.fechaIdea&&it.fechaInicio);
      resolved.push({kind:'contenido',it,ini,fin,idea,hasPrep,label:it.nombre,color:cdGanttColor(it.tipo)});
    });
  }

  if(!resolved.length){
    grid.innerHTML=`<div class="card" style="text-align:center;color:#bbb;padding:40px;">No hay ítems con fechas para mostrar en el Gantt.</div>`;
    return;
  }

  // ── Agrupar por show ──
  const groupMap={}; const groupOrder=[];
  resolved.forEach(r=>{
    let key,label;
    if(r.kind==='show'){
      key='show-'+r.realIdx; label='🎤 '+r.s.nombre;
    } else {
      const idx=r.it.showIdx;
      key=idx!=null?('show-'+idx):'sin-show';
      label=idx!=null?('🎭 '+(SHOWS[idx]?.nombre||'Show')):'📦 Sin show vinculado';
    }
    if(!groupMap[key]){groupMap[key]={key,label,rows:[]};groupOrder.push(key);}
    groupMap[key].rows.push(r);
  });
  // Ordenar grupos: primero shows por fecha, sin-show al final
  groupOrder.sort((a,b)=>{
    if(a==='sin-show')return 1; if(b==='sin-show')return -1;
    const idxA=parseInt(a.replace('show-','')); const idxB=parseInt(b.replace('show-',''));
    return (SHOWS[idxA]?.fecha||'').localeCompare(SHOWS[idxB]?.fecha||'');
  });

  // ── Rango de fechas global ──
  const allDates=resolved.flatMap(r=>[r.ini,r.fin,r.idea].filter(Boolean));
  let minDate=new Date(Math.min(...allDates)); let maxDate=new Date(Math.max(...allDates));
  const today=new Date();today.setHours(12,0,0,0);
  if(today<minDate)minDate=new Date(today); if(today>maxDate)maxDate=new Date(today);
  minDate.setDate(minDate.getDate()-3); maxDate.setDate(maxDate.getDate()+3);
  minDate.setHours(12,0,0,0); maxDate.setHours(12,0,0,0);

  const dayWidth=_plGanttDayWidth; const rowHeight=_plGanttRowHeight;
  const totalDays=Math.round((maxDate-minDate)/(1000*60*60*24))+1;
  const totalWidth=totalDays*dayWidth;

  // ── Filas visibles ──
  const visibleRows=[];
  groupOrder.forEach(key=>{
    const g=groupMap[key];
    const collapsed=!!_plGanttCollapsed[key];
    visibleRows.push({type:'group',key,label:g.label,count:g.rows.length,collapsed});
    if(!collapsed)g.rows.forEach(r=>visibleRows.push({type:'item',...r}));
  });

  // ── Canvas para ancho dinámico de labels ──
  const canvas=document.createElement('canvas');
  const ctx=canvas.getContext('2d');
  ctx.font='11px Inter,-apple-system,sans-serif';
  let maxLabelW=80;
  visibleRows.forEach(r=>{
    const w=ctx.measureText(r.label||'').width+(r.type==='group'?30:36);
    if(w>maxLabelW)maxLabelW=w;
  });
  const labelColWidth=Math.min(Math.ceil(maxLabelW)+10, 260);

  // ── Header: meses + días ──
  const showDayNum=dayWidth>=14;
  const dayCells=[]; const monthGroups=[]; let curMonth=null,curStart=0,curCount=0;
  for(let d=0;d<totalDays;d++){
    const date=new Date(minDate);date.setDate(minDate.getDate()+d);
    const isWeekend=date.getDay()===0||date.getDay()===6;
    const isToday=date.toDateString()===today.toDateString();
    dayCells.push(`<div style="width:${dayWidth}px;flex-shrink:0;text-align:center;font-size:9px;color:${isToday?'#fff':'#9690C2'};background:${isToday?'var(--c400)':isWeekend?'rgba(255,255,255,0.04)':'transparent'};font-weight:${isToday?'700':'400'};border-radius:${isToday?'4px':'0'};padding:2px 0;">${showDayNum?date.getDate():''}</div>`);
    const monthLabel=date.toLocaleDateString('es-CL',{month:'short'}).toUpperCase().replace('.','');
    if(monthLabel!==curMonth){if(curMonth!==null)monthGroups.push({label:curMonth,start:curStart,count:curCount});curMonth=monthLabel;curStart=d;curCount=1;}else curCount++;
  }
  monthGroups.push({label:curMonth,start:curStart,count:curCount});
  const monthHTML=monthGroups.map(m=>`<div style="position:absolute;left:${m.start*dayWidth}px;width:${m.count*dayWidth}px;font-size:10px;font-weight:700;color:#B7B2DA;text-transform:uppercase;letter-spacing:0.5px;padding:4px 0 3px 4px;border-left:1px solid var(--border-soft);">${m.label}</div>`).join('');
  const todayOffset=Math.round((today-minDate)/(1000*60*60*24));
  const todayLineLeft=todayOffset*dayWidth+dayWidth/2;

  // ── Generar filas ──
  let cursorY=0; const labelRowsHTML=[]; const barsHTML=[]; const groupBgHTML=[];
  const weekendStripes=[];
  for(let d=0;d<totalDays;d++){
    const date=new Date(minDate);date.setDate(minDate.getDate()+d);
    if(date.getDay()===0||date.getDay()===6)weekendStripes.push(`<div style="position:absolute;left:${d*dayWidth}px;top:0;width:${dayWidth}px;height:100%;background:rgba(255,255,255,0.025);"></div>`);
  }

  visibleRows.forEach(row=>{
    if(row.type==='group'){
      labelRowsHTML.push(`<div onclick="togglePlGanttGroup('${row.key}')" style="height:${rowHeight}px;display:flex;align-items:center;gap:6px;padding:0 10px;font-size:11px;font-weight:700;color:#fff;background:rgba(255,255,255,0.06);border-bottom:0.5px solid var(--border-soft);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
        <span style="display:inline-block;transition:transform 0.15s;transform:rotate(${row.collapsed?'-90':'0'}deg);">▾</span> ${row.label} <span style="font-size:9px;color:#9690C2;font-weight:400;margin-left:auto;flex-shrink:0;">${row.count}</span>
      </div>`);
      groupBgHTML.push(`<div style="position:absolute;left:0;top:${cursorY}px;width:${totalWidth}px;height:${rowHeight}px;background:rgba(255,255,255,0.06);"></div>`);
      cursorY+=rowHeight;
    } else {
      const top=cursorY+Math.max(4,rowHeight*0.18);
      const barH=rowHeight-Math.max(8,rowHeight*0.36);

      if(row.kind==='show'){
        // Barra puntual: 1 día con color del show
        const offsetDays=Math.round((row.ini-minDate)/(1000*60*60*24));
        const left=offsetDays*dayWidth+2;
        const width=Math.max(dayWidth-4,8);
        const c=showColor(row.s.tipo,row.s.estado);
        const showLabel=width>50;
        labelRowsHTML.push(`<div onclick="goToShow(${row.realIdx})" style="height:${rowHeight}px;display:flex;align-items:center;padding:0 10px 0 22px;font-size:${rowHeight<34?'10px':'11px'};color:#E4E1F7;border-bottom:0.5px solid var(--border-soft);cursor:pointer;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;" title="${row.s.nombre}">🎤 ${row.s.nombre}</div>`);
        barsHTML.push(`<div onclick="goToShow(${row.realIdx})" title="🎤 ${row.s.nombre} · ${fmtDate(row.s.fecha)}" style="position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${barH}px;background:${c.bg};border:2px solid ${c.txt};border-radius:5px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:9px;color:${c.txt};font-weight:700;box-shadow:0 1px 6px rgba(0,0,0,0.3);">🎤</div>`);
      } else {
        // Barra de contenido: doble tramo si tiene preproducción
        labelRowsHTML.push(`<div onclick="openCdDetail('${row.it.id}')" style="height:${rowHeight}px;display:flex;align-items:center;padding:0 10px 0 22px;font-size:${rowHeight<34?'10px':'11px'};color:#E4E1F7;border-bottom:0.5px solid var(--border-soft);cursor:pointer;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;" title="${row.it.nombre}">${row.it.nombre}</div>`);
        const color=row.color;
        const opacity=row.it.estado==='Publicado'?0.5:0.9;
        if(row.hasPrep){
          const prepOff=Math.round((row.idea-minDate)/(1000*60*60*24));
          const prepDur=Math.max(Math.round((row.ini-row.idea)/(1000*60*60*24)),1);
          barsHTML.push(`<div onclick="openCdDetail('${row.it.id}')" title="Preproducción: ${fmtDate(row.it.fechaIdea)} → ${fmtDate(row.it.fechaInicio)}" style="position:absolute;left:${prepOff*dayWidth+2}px;top:${top}px;width:${Math.max(prepDur*dayWidth-2,6)}px;height:${barH}px;background:repeating-linear-gradient(135deg,${color}55 0px,${color}55 4px,${color}22 4px,${color}22 8px);border:1px solid ${color}88;border-radius:6px 0 0 6px;cursor:pointer;box-sizing:border-box;"></div>`);
          const prodOff=Math.round((row.ini-minDate)/(1000*60*60*24));
          const prodDur=Math.max(Math.round((row.fin-row.ini)/(1000*60*60*24))+1,1);
          const prodW=Math.max(prodDur*dayWidth-4,dayWidth-4);
          barsHTML.push(`<div onclick="openCdDetail('${row.it.id}')" title="${row.it.nombre} · Producción: ${fmtDate(row.it.fechaInicio)} → ${fmtDate(row.it.fecha)}" style="position:absolute;left:${prodOff*dayWidth}px;top:${top}px;width:${prodW}px;height:${barH}px;background:${color};opacity:${opacity};border-radius:0 6px 6px 0;cursor:pointer;display:flex;align-items:center;padding:0 6px;font-size:10px;color:#fff;font-weight:600;overflow:hidden;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.25);">${prodW>60?(cdEstEmoji(row.it.estado)+' '+row.it.nombre):cdEstEmoji(row.it.estado)}</div>`);
        } else {
          const off=Math.round((row.ini-minDate)/(1000*60*60*24));
          const dur=Math.max(Math.round((row.fin-row.ini)/(1000*60*60*24))+1,1);
          const w=Math.max(dur*dayWidth-4,dayWidth-4);
          barsHTML.push(`<div onclick="openCdDetail('${row.it.id}')" title="${row.it.nombre} · ${fmtDate(row.it.fecha||row.it.fechaInicio)}" style="position:absolute;left:${off*dayWidth+2}px;top:${top}px;width:${w}px;height:${barH}px;background:${color};opacity:${opacity};border-radius:6px;cursor:pointer;display:flex;align-items:center;padding:0 6px;font-size:10px;color:#fff;font-weight:600;overflow:hidden;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.25);">${w>60?(cdEstEmoji(row.it.estado)+' '+row.it.nombre):cdEstEmoji(row.it.estado)}</div>`);
        }
      }
      cursorY+=rowHeight;
    }
  });

  const bodyHeight=cursorY;

  // ── Controles zoom ──
  const controlsHTML=`<div class="gantt-controls" style="margin-bottom:10px;">
    <div class="gantt-control-item"><label>🔍 Zoom tiempo</label><input type="range" min="6" max="50" step="1" value="${dayWidth}" oninput="setPlGanttDayWidth(this.value)"></div>
    <div class="gantt-control-item"><label>↕ Alto filas</label><div class="gantt-vslider-wrap"><input type="range" min="26" max="60" step="2" value="${rowHeight}" oninput="setPlGanttRowHeight(this.value)"></div></div>
    <button class="btn" style="font-size:10px;padding:3px 8px;" onclick="Object.keys(_plGanttCollapsed).forEach(k=>_plGanttCollapsed[k]=false);buildPlannerGantt()">Expandir todo</button>
    <button class="btn" style="font-size:10px;padding:3px 8px;" onclick="groupOrder&&groupOrder.forEach(k=>_plGanttCollapsed[k]=true);buildPlannerGantt()">Colapsar todo</button>
  </div>`;

  grid.innerHTML=controlsHTML+`
  <div class="gantt-wrap" style="display:flex;border:0.5px solid var(--border-soft);border-radius:8px;overflow:hidden;margin-top:4px;max-height:70vh;max-width:100%;">
    <div class="gantt-labels" id="pl-gantt-labels" onscroll="syncPlGanttVertical(this)" style="width:${labelColWidth}px;flex-shrink:0;background:var(--surface2);border-right:1px solid var(--border-soft);overflow-y:auto;">
      <div style="height:42px;border-bottom:1px solid var(--border-soft);position:sticky;top:0;background:var(--surface2);z-index:3;"></div>
      ${labelRowsHTML.join('')}
    </div>
    <div class="gantt-scroll" id="pl-gantt-scroll" onscroll="syncPlGanttVertical(this)" style="flex:1;min-width:0;overflow:auto;">
      <div style="position:relative;width:${totalWidth}px;">
        <div style="height:42px;border-bottom:1px solid var(--border-soft);position:sticky;top:0;z-index:2;background:var(--surface2);">
          ${monthHTML}
          <div style="position:absolute;top:18px;left:0;display:flex;">${dayCells.join('')}</div>
        </div>
        <div style="position:relative;height:${bodyHeight}px;">
          ${groupBgHTML.join('')}
          ${weekendStripes.join('')}
          <div style="position:absolute;left:${todayLineLeft}px;top:0;width:2px;height:100%;background:var(--c400);z-index:2;"></div>
          ${barsHTML.join('')}
        </div>
      </div>
    </div>
  </div>
  <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;font-size:10px;color:#9690C2;align-items:center;">
    <span style="display:flex;align-items:center;gap:5px;"><span style="width:14px;height:10px;border-radius:3px;border:2px solid #085041;background:#E1F5EE;display:inline-block;font-size:8px;text-align:center;">🎤</span>Show (puntual)</span>
    <span style="display:flex;align-items:center;gap:5px;"><span style="width:14px;height:8px;border-radius:2px;background:repeating-linear-gradient(135deg,#9690C255 0px,#9690C255 4px,#9690C222 4px,#9690C222 8px);border:1px solid #9690C288;display:inline-block;"></span>Preproducción</span>
    <span style="display:flex;align-items:center;gap:5px;"><span style="width:14px;height:8px;border-radius:2px;background:#9690C2;display:inline-block;"></span>Producción</span>
  </div>`;
}

// ── VISTA KANBAN POR ESTADO (B.2) ──
// Opción A: toggle "Ver Shows" / "Ver Contenido" dentro de la vista (no se mezclan estados: son vocabularios distintos).
function plKanbanSetMode(mode){
  plKanbanMode=mode;
  buildPlannerKanban();
}
function buildPlannerKanban(){
  const grid=document.getElementById('planner-grid');
  if(!grid)return;
  const canEdit=!!(currentUser&&ROLE_DEFS[currentUser.rol]?.canEdit);

  const toggleHTML=`<div class="pl-kanban-toggle">
    <button class="pl-kanban-toggle-btn ${plKanbanMode==='shows'?'active':''}" onclick="plKanbanSetMode('shows')">🎤 Shows / eventos</button>
    <button class="pl-kanban-toggle-btn ${plKanbanMode==='contenido'?'active':''}" onclick="plKanbanSetMode('contenido')">🎬 Contenido digital</button>
  </div>`;

  let colsHTML;
  if(plKanbanMode==='shows'){
    colsHTML=SHOW_ESTADOS.map(estado=>{
      const items=SHOWS.map((s,realIdx)=>({s,realIdx})).filter(o=>(o.s.estado||'Tentativo')===estado);
      const cards=items.map(o=>plKanbanShowCard(o.s,o.realIdx,canEdit)).join('')||`<div class="pl-kanban-empty">Sin shows</div>`;
      const dropAttrs=canEdit?`ondragover="plKanbanDragOver(event)" ondragleave="plKanbanDragLeave(event)" ondrop="plKanbanDrop(event,'${estado}')"`:'';
      return`<div class="pl-kanban-col" ${dropAttrs}>
        <div class="pl-kanban-col-hdr"><span>${estado}</span><span class="pl-kanban-col-cnt">${items.length}</span></div>
        ${cards}
      </div>`;
    }).join('');
  } else {
    const contenido=typeof CONTENIDO!=='undefined'?CONTENIDO:[];
    colsHTML=CD_ESTADOS.map(estado=>{
      const items=contenido.filter(c=>c.estado===estado);
      const cards=items.map(it=>plKanbanContenidoCard(it,canEdit)).join('')||`<div class="pl-kanban-empty">Sin piezas</div>`;
      const dropAttrs=canEdit?`ondragover="plKanbanDragOver(event)" ondragleave="plKanbanDragLeave(event)" ondrop="plKanbanDrop(event,'${estado}')"`:'';
      return`<div class="pl-kanban-col" ${dropAttrs}>
        <div class="pl-kanban-col-hdr"><span>${cdEstEmoji(estado)} ${estado}</span><span class="pl-kanban-col-cnt">${items.length}</span></div>
        ${cards}
      </div>`;
    }).join('');
  }

  grid.innerHTML=toggleHTML+`<div class="pl-kanban-cols">${colsHTML}</div>`;
}
function plKanbanShowCard(s,realIdx,canEdit){
  const equipo=equipoStackHTML('show',s.id,3);
  const dragAttrs=canEdit?`draggable="true" ondragstart="plKanbanDragStart(event,'show',${realIdx})" ondragend="plKanbanDragEnd(event)"`:'';
  return`<div class="pl-kanban-card" ${dragAttrs} onclick="goToShow(${realIdx})">
    <div class="pl-kanban-card-nombre">🎤 ${s.nombre}</div>
    <div class="pl-kanban-card-meta"><span>${s.fecha?fmtDate(s.fecha):'Sin fecha'}</span></div>
    <div class="pl-kanban-card-meta">${equipo}</div>
  </div>`;
}
function plKanbanContenidoCard(item,canEdit){
  const equipo=equipoStackHTML('contenido',item.id,3);
  const dragAttrs=canEdit?`draggable="true" ondragstart="plKanbanDragStart(event,'contenido','${item.id}')" ondragend="plKanbanDragEnd(event)"`:'';
  return`<div class="pl-kanban-card" ${dragAttrs} onclick="openCdDetail('${item.id}')">
    <div class="pl-kanban-card-nombre">${item.nombre}</div>
    <div class="pl-kanban-card-meta"><span>${item.fecha?fmtDate(item.fecha):'Sin fecha'}</span></div>
    <div class="pl-kanban-card-meta">${equipo}</div>
  </div>`;
}
function plKanbanDragStart(e,kind,id){
  _plKanbanDrag={kind,id};
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed='move';
  e.dataTransfer.setData('text/plain',String(id));
}
function plKanbanDragEnd(e){
  e.currentTarget.classList.remove('dragging');
  _plKanbanDrag=null;
  document.querySelectorAll('.pl-kanban-col.drag-over').forEach(c=>c.classList.remove('drag-over'));
}
function plKanbanDragOver(e){
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}
function plKanbanDragLeave(e){
  e.currentTarget.classList.remove('drag-over');
}
async function plKanbanDrop(e,newEstado){
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const drag=_plKanbanDrag;
  if(!drag)return;
  if(drag.kind==='show'){
    const s=SHOWS[drag.id];
    if(!s||s.estado===newEstado)return;
    const prevEstado=s.estado;
    s.estado=newEstado;
    buildPlannerKanban();
    try{
      const{error}=await sb.from('shows').update({estado:newEstado}).eq('id',s.id);
      if(error){ s.estado=prevEstado; buildPlannerKanban(); toast('⚠️ Error guardando estado: '+error.message); }
      else toast('✅ '+s.nombre+' → '+newEstado);
    }catch(err){ s.estado=prevEstado; buildPlannerKanban(); toast('⚠️ Error de conexión guardando estado'); }
  } else {
    const item=(typeof CONTENIDO!=='undefined'?CONTENIDO:[]).find(c=>String(c.id)===String(drag.id));
    if(!item||item.estado===newEstado)return;
    updateCdField(item.id,'estado',newEstado);
    buildPlannerKanban();
    toast('✅ '+item.nombre+' → '+newEstado);
  }
}

function showGanttColor(tipo,estado){
  const c=showColor(tipo,estado); return c.bg;
}

function syncPlGanttVertical(source){
  const other=source.id==='pl-gantt-labels'?document.getElementById('pl-gantt-scroll'):document.getElementById('pl-gantt-labels');
  if(other&&other.scrollTop!==source.scrollTop)other.scrollTop=source.scrollTop;
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