// ── MI TRABAJO (dashboard personal) ──
// Concepto híbrido: destacado del próximo compromiso + stats + toggle Lista/Mi carga (mini-heatmap).
// Visible para todos los roles, pero requiere que el usuario logueado esté vinculado a una
// persona del equipo (PERSONAS.perfilId === currentUser.id). Si no, el nav-item se oculta
// (ver applyRoleRestrictions en auth.js) y esta vista muestra un estado vacío como respaldo.

let mtVista='lista'; // 'lista' | 'heatmap'

function miPersonaActual(){
  if(!currentUser)return null;
  return PERSONAS.find(p=>String(p.perfilId)===String(currentUser.id))||null;
}

function mtSetVista(v){
  mtVista=v;
  buildMiTrabajo();
}

// Resuelve una asignación a un objeto enriquecido con los datos del show/contenido real.
// Reutiliza plCargaResolveRange() (de planner.js, B.5) para el rango de fechas — misma lógica
// que el Gantt y la Carga de Equipo, sin duplicar nada.
function mtResolveItem(a){
  const r=plCargaResolveRange(a.entityType,a.entityId);
  if(!r)return null;
  if(a.entityType==='show'){
    const idx=SHOWS.findIndex(x=>String(x.id)===String(a.entityId));
    if(idx<0)return null;
    const s=SHOWS[idx];
    return{a,ini:r.ini,fin:r.fin,kind:'show',idx,nombre:s.nombre,sub:s.tipo+(s.ciudad?(' · '+s.ciudad):''),estado:s.estado,fechaTxt:fmtDate(s.fecha)};
  }
  const it=(typeof CONTENIDO!=='undefined'?CONTENIDO:[]).find(x=>String(x.id)===String(a.entityId));
  if(!it)return null;
  return{a,ini:r.ini,fin:r.fin,kind:'contenido',idRef:it.id,nombre:it.nombre,sub:it.tipo+(it.plataforma?(' · '+it.plataforma):''),estado:it.estado,fechaTxt:it.fecha?fmtDate(it.fecha):'Sin fecha objetivo'};
}

function mtCuentaAtras(fin,today){
  const dias=Math.round((fin-today)/(1000*60*60*24));
  if(dias<0)return'En curso';
  if(dias===0)return'Hoy';
  if(dias===1)return'Mañana';
  return`En ${dias} días`;
}

function buildMiTrabajo(){
  const body=document.getElementById('mt-body');
  if(!body)return;
  const persona=miPersonaActual();
  if(!persona){
    body.innerHTML=`<div class="card" style="text-align:center;color:#bbb;padding:50px 20px;">
      <div style="font-size:32px;margin-bottom:10px;">👤</div>
      <div style="font-weight:600;color:#ddd;margin-bottom:6px;">Tu usuario todavía no está vinculado a una persona del equipo.</div>
      <div style="font-size:12px;">Pedile a alguien con permisos que te vincule desde la sección Equipo para ver acá tus shows y piezas de contenido asignadas.</div>
    </div>`;
    return;
  }

  const today=new Date();today.setHours(12,0,0,0);
  const items=ASIGNACIONES.filter(a=>a.personaId===persona.id).map(mtResolveItem).filter(Boolean);
  items.sort((x,y)=>x.ini-y.ini);

  const activos=items.filter(it=>it.fin>=today);
  const proximo=activos[0]||null;

  // ── Stats ──
  const weekStart=new Date(today);weekStart.setDate(weekStart.getDate()-((weekStart.getDay()+6)%7));
  const weekEnd=new Date(weekStart);weekEnd.setDate(weekEnd.getDate()+6);weekEnd.setHours(23,59,59,999);
  const monthStart=new Date(today.getFullYear(),today.getMonth(),1);
  const monthEnd=new Date(today.getFullYear(),today.getMonth()+1,0,23,59,59,999);
  const estaSemana=items.filter(it=>it.ini<=weekEnd&&it.fin>=weekStart).length;
  const esteMes=items.filter(it=>it.ini<=monthEnd&&it.fin>=monthStart).length;
  const totalActivo=activos.length;

  // ── Destacado: próximo compromiso ──
  const heroHTML=proximo?`
    <div class="card mt-hero">
      <div class="mt-hero-label">${proximo.kind==='show'?'🎤 Tu próximo show':'🎬 Tu próxima entrega'}</div>
      <div class="mt-hero-nombre">${proximo.nombre}</div>
      <div class="mt-hero-sub">${proximo.sub}${proximo.a.rol?(' · '+proximo.a.rol):''}</div>
      <div class="mt-hero-cuenta">${mtCuentaAtras(proximo.fin,today)} · ${proximo.fechaTxt}</div>
    </div>`:`
    <div class="card mt-hero mt-hero-empty">
      <div style="font-size:28px;">🎉</div>
      <div style="margin-top:6px;color:#ddd;font-weight:600;">No tenés compromisos activos por ahora.</div>
    </div>`;

  const statsHTML=`<div class="stats-grid" style="margin-top:14px;">
    <div class="stat-card"><div class="lbl">Esta semana</div><div class="val">${estaSemana}</div><div class="sub">shows + piezas</div></div>
    <div class="stat-card"><div class="lbl">Este mes</div><div class="val">${esteMes}</div><div class="sub">shows + piezas</div></div>
    <div class="stat-card"><div class="lbl">Activo en total</div><div class="val">${totalActivo}</div><div class="sub">sin terminar todavía</div></div>
  </div>`;

  const toggleHTML=`<div class="pl-kanban-toggle" style="margin-top:18px;margin-bottom:10px;">
    <button class="pl-kanban-toggle-btn ${mtVista==='lista'?'active':''}" onclick="mtSetVista('lista')">📋 Lista</button>
    <button class="pl-kanban-toggle-btn ${mtVista==='heatmap'?'active':''}" onclick="mtSetVista('heatmap')">🔥 Mi carga</button>
  </div>`;

  const contentHTML=mtVista==='lista'?mtListaHTML(activos):mtHeatmapHTML(items,today);

  body.innerHTML=heroHTML+statsHTML+toggleHTML+contentHTML;
}

function mtListaHTML(activos){
  if(!activos.length)return`<div class="card" style="text-align:center;color:#bbb;padding:30px;">No hay nada asignado todavía.</div>`;
  const hoy=new Date();hoy.setHours(12,0,0,0);
  const en14=new Date(hoy);en14.setDate(en14.getDate()+14);
  const grupos=[
    {label:'Próximas 2 semanas',items:activos.filter(it=>it.ini<=en14)},
    {label:'Más adelante',items:activos.filter(it=>it.ini>en14)},
  ].filter(g=>g.items.length);
  return grupos.map(g=>`<div class="mt-grupo-label">${g.label}</div>${g.items.map(mtCardHTML).join('')}`).join('');
}

function mtCardHTML(it){
  const onclick=it.kind==='show'?`goToShow(${it.idx})`:`openCdDetail('${it.idRef}')`;
  return`<div class="mt-item-card" onclick="${onclick}">
    <div class="mt-item-icon">${it.kind==='show'?'🎤':'🎬'}</div>
    <div class="mt-item-body">
      <div class="mt-item-nombre">${it.nombre}</div>
      <div class="mt-item-sub">${it.sub}${it.a.rol?' · '+it.a.rol:''}</div>
    </div>
    <div class="mt-item-right">
      <div class="mt-item-fecha">${it.fechaTxt}</div>
      <div class="mt-item-estado">${it.estado}${it.a.viaja?' ✈️':''}</div>
    </div>
  </div>`;
}

// Mini-heatmap personal: 10 semanas (de la semana actual en adelante), misma paleta que
// Carga de Equipo (plCargaColor, B.5) pero filtrado a esta sola persona.
function mtHeatmapHTML(items,today){
  const weeks=[];
  let cur=new Date(today);cur.setDate(cur.getDate()-((cur.getDay()+6)%7));cur.setHours(12,0,0,0);
  for(let i=0;i<10;i++){
    const ini=new Date(cur);const fin=new Date(cur);fin.setDate(fin.getDate()+6);fin.setHours(23,59,59,999);
    const matched=items.filter(it=>it.ini<=fin&&it.fin>=ini);
    weeks.push({label:weekLabel(cur).split('–')[0].trim(),ini,fin,count:matched.length,viaja:matched.some(m=>m.a.viaja),items:matched,isToday:today>=ini&&today<=fin});
    cur.setDate(cur.getDate()+7);
  }
  const cellsHTML=weeks.map(w=>{
    const col=plCargaColor(w.count);
    const tip=w.items.length?w.items.map(i=>i.nombre).join(', '):'Sin carga';
    return`<div class="mt-heat-col">
      <div class="mt-heat-cell ${w.isToday?'pl-carga-col-today':''}" style="background:${col.bg};color:${col.txt};" title="${tip.replace(/"/g,'&quot;')}">${w.count||''}${w.viaja?' ✈️':''}</div>
      <div class="mt-heat-label">${w.label}</div>
    </div>`;
  }).join('');
  return`<div class="card"><div class="mt-heat-row">${cellsHTML}</div></div>`;
}
