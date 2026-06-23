// ── CONSTANTES ──
const MESES = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
const MESES_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_SEMANA = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

let plActiveFilter = 'todos';
let plActiveView = 'anual';   // 'anual' | 'calendario' | 'gantt' | 'kanban' | 'carga'
let plFiltroEstados = [];
let plFiltroFechaIni = null;
let plFiltroFechaFin = null;
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let coordActiveFilter = 'proximos';

let _plGanttDayWidth = 30;
let _plGanttRowHeight = 42;
let _plGanttZoomTouched = false;
let _plGanttCollapsed = {};

const SHOW_ESTADOS = ['Tentativo','Confirmado','En proceso','Realizado','Cancelado'];
let plKanbanMode = 'shows';
let _plKanbanDrag = null;
let plCargaGran = 'semana';

// ── HELPERS DE SEGURIDAD ──
function _getCurrentUser() {
  return (typeof currentUser !== 'undefined') ? currentUser : null;
}
function _getRoleDefs() {
  return (typeof ROLE_DEFS !== 'undefined') ? ROLE_DEFS : {};
}
function _canEdit() {
  const user = _getCurrentUser();
  if (!user) return false;
  const roles = _getRoleDefs();
  const role = roles[user.rol];
  return role ? !!role.canEdit : false;
}

// ── FUNCIONES DE COLOR Y ESTADO ──
function showColor(tipo, estado) {
  if (estado === "Tentativo") return { bg: "#FAEEDA", txt: "#633806" };
  if (tipo === "Teatro") return { bg: "#E1F5EE", txt: "#085041" };
  if (tipo === "Teatro Especial") return { bg: "#FAECE7", txt: "#712B13" };
  if (tipo === "Show Bar") return { bg: "#EEEDFE", txt: "#3C3489" };
  return { bg: "#E6F1FB", txt: "#0C447C" };
}

function showGanttColor(tipo, estado) {
  return showColor(tipo, estado).bg;
}

// ── FILTROS AVANZADOS ──
function plToggleEstado(estado) {
  const idx = plFiltroEstados.indexOf(estado);
  if (idx === -1) plFiltroEstados.push(estado);
  else plFiltroEstados.splice(idx, 1);
  _renderPlannerView();
}
function plSetFechaIni(v) { plFiltroFechaIni = v || null; _renderPlannerView(); }
function plSetFechaFin(v) { plFiltroFechaFin = v || null; _renderPlannerView(); }
function plLimpiarFiltrosAvanzados() {
  plFiltroEstados = [];
  plFiltroFechaIni = null;
  plFiltroFechaFin = null;
  document.querySelectorAll('.pl-adv-estado-btn').forEach(b => b.classList.remove('active'));
  const fi = document.getElementById('pl-fi');
  const ff = document.getElementById('pl-ff');
  if (fi) fi.value = '';
  if (ff) ff.value = '';
  _renderPlannerView();
}

function _plFechaEnRango(fechaStr) {
  if (!fechaStr) return !plFiltroFechaIni && !plFiltroFechaFin;
  const f = fechaStr.slice(0, 10);
  if (plFiltroFechaIni && f < plFiltroFechaIni) return false;
  if (plFiltroFechaFin && f > plFiltroFechaFin) return false;
  return true;
}
function _plRangoEnFiltro(ini, fin) {
  if (!plFiltroFechaIni && !plFiltroFechaFin) return true;
  const fi = plFiltroFechaIni ? new Date(plFiltroFechaIni + 'T00:00:00') : null;
  const ff = plFiltroFechaFin ? new Date(plFiltroFechaFin + 'T23:59:59') : null;
  if (fi && fin < fi) return false;
  if (ff && ini > ff) return false;
  return true;
}
function _plShowPasaFiltros(s) {
  if (plFiltroEstados.length && !plFiltroEstados.includes(s.estado || 'Tentativo')) return false;
  // Pass if ANY date of the show falls in the range filter
  const allDates = [s.fechaPreproduccion, s.fechaProduccion, s.fecha, ...(s.fechasExtra||[]).map(fe=>fe.fecha)].filter(Boolean);
  if (!allDates.length) return !plFiltroFechaIni && !plFiltroFechaFin;
  return allDates.some(d => _plFechaEnRango(d));
}
function _plContPasaFiltros(c) {
  if (plFiltroEstados.length && !plFiltroEstados.includes(c.estado)) return false;
  const ini = new Date((c.fechaIdea || c.fechaInicio || c.fecha || '9999') + 'T12:00:00');
  const fin = new Date((c.fecha || c.fechaInicio || c.fechaIdea || '0000') + 'T12:00:00');
  if (!_plRangoEnFiltro(ini, fin)) return false;
  return true;
}

function _plAdvFiltrosHTML(modoKanban) {
  if (modoKanban) return '';
  const showMode = plActiveFilter === 'todos' || plActiveFilter === 'shows';
  const contMode = plActiveFilter === 'todos' || plActiveFilter === 'contenido';
  let estadosBtns = '';
  if (showMode) {
    estadosBtns += SHOW_ESTADOS.map(e => {
      const active = plFiltroEstados.includes(e) ? 'active' : '';
      return `<button class="pl-adv-estado-btn ${active}" onclick="plToggleEstado('${e}')" title="Filtrar por estado show">${e}</button>`;
    }).join('');
  }
  if (contMode && typeof CD_ESTADOS !== 'undefined') {
    estadosBtns += CD_ESTADOS.map(e => {
      const active = plFiltroEstados.includes(e) ? 'active' : '';
      return `<button class="pl-adv-estado-btn ${active}" onclick="plToggleEstado('${e}')" title="Filtrar por estado contenido">${e}</button>`;
    }).join('');
  }
  const hayFiltros = plFiltroEstados.length || plFiltroFechaIni || plFiltroFechaFin;
  return `<div class="pl-adv-filtros" id="pl-adv-filtros">
    <span class="pl-adv-label">Estado:</span>
    <div class="pl-adv-estados">${estadosBtns}</div>
    <span class="pl-adv-label" style="margin-left:10px;">Desde:</span>
    <input id="pl-fi" type="date" class="pl-adv-date" value="${plFiltroFechaIni || ''}" onchange="plSetFechaIni(this.value)">
    <span class="pl-adv-label">Hasta:</span>
    <input id="pl-ff" type="date" class="pl-adv-date" value="${plFiltroFechaFin || ''}" onchange="plSetFechaFin(this.value)">
    ${hayFiltros ? `<button class="pl-adv-clear" onclick="plLimpiarFiltrosAvanzados()">✕ Limpiar</button>` : ''}
  </div>`;
}

// ── FILTRO Y VISTA ──
function plFilter(f, btn) {
  plActiveFilter = f;
  document.querySelectorAll('#pl-filter-tabs .filter-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  _renderPlannerView();
}
function plSetView(v, btn) {
  plActiveView = v;
  document.querySelectorAll('#pl-view-tabs .pl-view-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const legend = document.querySelector('.pl-legend');
  if (legend) legend.style.display = v === 'anual' ? '' : 'none';
  const filterTabs = document.getElementById('pl-filter-tabs');
  if (filterTabs) filterTabs.style.display = v === 'kanban' ? 'none' : '';
  _renderPlannerView();
}
function _renderPlannerView() {
  const isKanban = plActiveView === 'kanban';
  let advWrap = document.getElementById('pl-adv-wrap');
  if (!advWrap) {
    advWrap = document.createElement('div');
    advWrap.id = 'pl-adv-wrap';
    const grid = document.getElementById('planner-grid');
    if (grid && grid.parentNode) grid.parentNode.insertBefore(advWrap, grid);
  }
  advWrap.innerHTML = _plAdvFiltrosHTML(isKanban);

  if (plActiveView === 'calendario') buildPlannerCalendario();
  else if (plActiveView === 'gantt') buildPlannerGantt();
  else if (plActiveView === 'kanban') buildPlannerKanban();
  else if (plActiveView === 'carga') buildPlannerCarga();
  else buildPlanner();
}

// ── VISTA ANUAL ──
function buildPlanner() {
  const grid = document.getElementById("planner-grid");
  const showFilter = plActiveFilter === 'todos' || plActiveFilter === 'shows';
  const contFilter = plActiveFilter === 'todos' || plActiveFilter === 'contenido';
  grid.innerHTML = MESES.map((mes, mi) => {
    const mShows = showFilter ? SHOWS.map((s, realIdx) => ({ s, realIdx })).filter(o => {
      if (!_plShowPasaFiltros(o.s)) return false;
      // include if any date (prepro, pro, show, extras) falls in this month
      const dates = [o.s.fechaPreproduccion, o.s.fechaProduccion, o.s.fecha, ...(o.s.fechasExtra||[]).map(fe=>fe.fecha)].filter(Boolean);
      return dates.some(d => parseInt(d.split("-")[1]) === mi + 1);
    }) : [];
    const mCont = contFilter ? (typeof CONTENIDO !== 'undefined' ? CONTENIDO : []).filter(c => {
      if (!c.fecha) return false;
      if (!_plContPasaFiltros(c)) return false;
      return parseInt(c.fecha.split("-")[1]) === mi + 1;
    }) : [];
    // Expand shows to one entry per date that falls this month
    const expandedShows = [];
    mShows.forEach(o => {
      const { s, realIdx } = o;
      const addEntry = (dateStr, icon, note) => {
        if (!dateStr) return;
        if (parseInt(dateStr.split("-")[1]) !== mi + 1) return;
        expandedShows.push({ type: 'show', day: parseInt(dateStr.split("-")[2]), data: { s, realIdx, dateStr, icon, note } });
      };
      if (s.fechaPreproduccion) addEntry(s.fechaPreproduccion, '📋', 'Inicio preproducción');
      if (s.fechaProduccion) addEntry(s.fechaProduccion, '🎬', 'Inicio producción');
      if (s.fecha) addEntry(s.fecha, '🎤', null);
      (s.fechasExtra||[]).forEach((fe,feIdx)=>{ if(fe.fecha) addEntry(fe.fecha,'📅', fe.nota||('Función '+(feIdx+2))); });
    });
    const combined = [...expandedShows,
      ...mCont.map(c => ({ type: 'content', day: parseInt(c.fecha.split("-")[2]), data: c }))
    ].sort((a, b) => a.day - b.day);
    const inner = combined.length ? combined.map(entry => {
      if (entry.type === 'show') {
        const { s, realIdx, dateStr, icon, note } = entry.data;
        const c = showColor(s.tipo, s.estado);
        const dia = dateStr ? dateStr.split("-")[2] : "??";
        const nameDisplay = note ? `<span style="font-size:9px;opacity:0.75;">${note}</span><br>${s.nombre}` : s.nombre;
        const bgOpacity = icon === '📋' ? '55' : icon === '🎬' ? '99' : '';
        return `<div class="cal-show" style="background:${c.bg}${bgOpacity};color:${c.txt};${icon!=='🎤'?'border:1px dashed '+c.txt+'88;':''}" onclick="goToShow(${realIdx})" title="${icon} ${note||s.nombre} · ${s.nombre.replace(/"/g, '&quot;')}"><div class="cs-date">${icon} Día ${dia}</div><div class="cs-name">${nameDisplay}</div></div>`;
      } else {
        const item = entry.data;
        const dia = item.fecha ? item.fecha.split("-")[2] : "??";
        return `<div class="cal-content" onclick="openCdDetail('${item.id}')" title="Ver ${item.nombre.replace(/"/g, '&quot;')}"><div class="cc-meta"><span>🎬 Día ${dia}</span><span>${cdEstEmoji(item.estado)}</span></div><div class="cc-name">${item.nombre}</div></div>`;
      }
    }).join("") : `<div style="padding:10px 8px;font-size:10px;color:#ddd;font-style:italic;">Sin eventos</div>`;
    return `<div class="month-block"><div class="month-name">${mes}</div><div class="month-shows">${inner}</div></div>`;
  }).join("");
}

// ── VISTA CALENDARIO ──
function buildPlannerCalendario() {
  const grid = document.getElementById("planner-grid");
  const showFilter = plActiveFilter === 'todos' || plActiveFilter === 'shows';
  const contFilter = plActiveFilter === 'todos' || plActiveFilter === 'contenido';

  const prevMonth = calMonth === 0 ? { m: 11, y: calYear - 1 } : { m: calMonth - 1, y: calYear };
  const nextMonth = calMonth === 11 ? { m: 0, y: calYear + 1 } : { m: calMonth + 1, y: calYear };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isCurrentMonth = today.getFullYear() === calYear && today.getMonth() === calMonth;

  const navHTML = `<div class="cal-nav">
    <button class="cal-nav-btn" onclick="calNavTo(${prevMonth.y},${prevMonth.m})">←</button>
    <span class="cal-nav-title">${MESES_FULL[calMonth]} ${calYear}</span>
    <button class="cal-nav-btn" onclick="calNavTo(${nextMonth.y},${nextMonth.m})">→</button>
    ${!isCurrentMonth ? `<button class="cal-nav-hoy" onclick="calNavHoy()">Hoy</button>` : ''}
  </div>`;

  const dowHeader = DIAS_SEMANA.map(d => `<div class="cal-dow">${d}</div>`).join('');

  const firstDay = new Date(calYear, calMonth, 1);
  const lastDay = new Date(calYear, calMonth + 1, 0);
  const startDow = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const dayMap = {};
  const addToDay = (dateStr, entry) => {
    if (!dateStr) return;
    const key = dateStr.slice(0, 10);
    if (!dayMap[key]) dayMap[key] = [];
    dayMap[key].push(entry);
  };
  if (showFilter) {
    SHOWS.forEach((s, realIdx) => {
      if (!_plShowPasaFiltros(s)) return;
      const addShowDay = (dateStr, opts) => {
        if (!dateStr) return;
        if (parseInt(dateStr.slice(5, 7)) === calMonth + 1 && parseInt(dateStr.slice(0, 4)) === calYear) {
          addToDay(dateStr, { type: 'show', data: { s, realIdx, ...opts } });
        }
      };
      if (s.fechaPreproduccion) addShowDay(s.fechaPreproduccion, { subtype: 'prepro' });
      if (s.fechaProduccion) addShowDay(s.fechaProduccion, { subtype: 'pro' });
      if (s.fecha) addShowDay(s.fecha, { subtype: 'show' });
      (s.fechasExtra || []).forEach((fe, feIdx) => {
        if (fe.fecha) addShowDay(fe.fecha, { subtype: 'extra', feNota: fe.nota || ('Función ' + (feIdx + 2)) });
      });
    });
  }
  if (contFilter && typeof CONTENIDO !== 'undefined') {
    CONTENIDO.forEach(c => {
      if (!c.fecha) return;
      if (!_plContPasaFiltros(c)) return;
      if (parseInt(c.fecha.slice(5, 7)) === calMonth + 1 && parseInt(c.fecha.slice(0, 4)) === calYear) {
        addToDay(c.fecha, { type: 'content', data: c });
      }
    });
  }

  let cellsHTML = '';
  for (let i = 0; i < startDow; i++) cellsHTML += `<div class="cal-cell cal-cell-empty"></div>`;

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = isCurrentMonth && d === today.getDate();
    const entries = dayMap[dateStr] || [];

    const chipsVisible = entries.slice(0, 3).map(entry => {
      if (entry.type === 'show') {
        const { s, realIdx, subtype, feNota } = entry.data;
        const c = showColor(s.tipo, s.estado);
        const label = (s.nombre || '').length > 16 ? s.nombre.slice(0, 15) + '…' : s.nombre;
        if (subtype === 'prepro') {
          return `<div class="cal-chip cal-chip-show" style="background:${c.bg}55;color:${c.txt};border:1px dashed ${c.txt}55;font-style:italic;" onclick="goToShow(${realIdx})" title="📋 Inicio preproducción · ${s.nombre.replace(/"/g, '&quot;')}">📋 ${label}</div>`;
        } else if (subtype === 'pro') {
          return `<div class="cal-chip cal-chip-show" style="background:${c.bg}99;color:${c.txt};border:1px solid ${c.txt}55;" onclick="goToShow(${realIdx})" title="🎬 Inicio producción · ${s.nombre.replace(/"/g, '&quot;')}">🎬 ${label}</div>`;
        } else if (subtype === 'extra') {
          return `<div class="cal-chip cal-chip-show" style="background:${c.bg};color:${c.txt};border:2px dashed ${c.txt};" onclick="goToShow(${realIdx})" title="📅 ${feNota} · ${s.nombre.replace(/"/g, '&quot;')}">📅 ${(feNota||'').length>14?feNota.slice(0,13)+'…':feNota}</div>`;
        }
        return `<div class="cal-chip cal-chip-show" style="background:${c.bg};color:${c.txt};" onclick="goToShow(${realIdx})" title="${s.nombre.replace(/"/g, '&quot;')}">🎤 ${label}</div>`;
      } else {
        const item = entry.data;
        const label = (item.nombre || '').length > 18 ? item.nombre.slice(0, 17) + '…' : item.nombre;
        return `<div class="cal-chip cal-chip-content" onclick="openCdDetail('${item.id}')" title="${item.nombre.replace(/"/g, '&quot;')} · ${item.estado.replace(/"/g, '&quot;')}">${cdEstEmoji(item.estado)} ${label}</div>`;
      }
    }).join('');
    const overflowHTML = entries.length > 3 ? `<div class="cal-chip-more" onclick="calOpenDay('${dateStr}')">+${entries.length - 3} más</div>` : '';

    cellsHTML += `<div class="cal-cell${isToday ? ' cal-cell-today' : ''}" onclick="calCellClick('${dateStr}',event)">
      <div class="cal-cell-num${isToday ? ' cal-cell-num-today' : ''}">${d}</div>
      <div class="cal-cell-chips">${chipsVisible}${overflowHTML}</div>
    </div>`;
  }

  const totalCells = startDow + totalDays;
  const remaining = (7 - totalCells % 7) % 7;
  for (let i = 0; i < remaining; i++) cellsHTML += `<div class="cal-cell cal-cell-empty"></div>`;

  grid.innerHTML = `${navHTML}<div class="cal-monthly-grid"><div class="cal-dow-row">${dowHeader}</div><div class="cal-cells">${cellsHTML}</div></div>`;
}

function calNavTo(y, m) { calYear = y; calMonth = m; buildPlannerCalendario(); }
function calNavHoy() { calYear = new Date().getFullYear(); calMonth = new Date().getMonth(); buildPlannerCalendario(); }

function calCellClick(dateStr, e) {
  if (e.target.classList.contains('cal-chip') || e.target.classList.contains('cal-chip-more')) return;
  calOpenNewModal(dateStr);
}

function calOpenNewModal(dateStr) {
  const prev = document.getElementById('cal-new-modal');
  if (prev) prev.remove();
  const overlay = document.createElement('div');
  overlay.id = 'cal-new-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:900;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `<div style="background:var(--surface2);border:0.5px solid var(--border-soft);border-radius:14px;padding:28px 32px;min-width:300px;max-width:380px;">
    <h3 style="margin:0 0 6px;font-size:14px;">Nuevo ítem — ${fmtDate(dateStr)}</h3>
    <p style="font-size:11px;color:#aaa;margin:0 0 18px;">¿Qué querés crear en esta fecha?</p>
    <div style="display:flex;gap:10px;">
      <button class="btn btn-primary" style="flex:1;" onclick="calNuevoShow('${dateStr}')">🎤 Nuevo Show</button>
      <button class="btn" style="flex:1;" onclick="calNuevoContenido('${dateStr}')">🎬 Nueva Pieza</button>
    </div>
    <button onclick="document.getElementById('cal-new-modal').remove()" style="display:block;margin:14px auto 0;background:none;border:none;color:#888;font-size:11px;cursor:pointer;">Cancelar</button>
  </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function calNuevoShow(dateStr) {
  document.getElementById('cal-new-modal')?.remove();
  const navItem = Array.from(document.querySelectorAll('.nav-item')).find(n => n.getAttribute('onclick')?.includes("nav('shows'"));
  if (navItem) nav('shows', navItem);
  setTimeout(() => {
    const fechaInput = document.getElementById('sh-nueva-fecha') || document.querySelector('[data-field="fecha"]');
    if (fechaInput) { fechaInput.value = dateStr; fechaInput.dispatchEvent(new Event('change')); }
    toast('📅 Fecha ' + fmtDate(dateStr) + ' pre-cargada');
  }, 200);
}
function calNuevoContenido(dateStr) {
  document.getElementById('cal-new-modal')?.remove();
  const navItem = Array.from(document.querySelectorAll('.nav-item')).find(n => n.getAttribute('onclick')?.includes("nav('contenido'"));
  if (navItem) nav('contenido', navItem);
  setTimeout(() => {
    const fechaInput = document.getElementById('cd-nueva-fecha') || document.querySelector('#cd-add-form [name="fecha"]');
    if (fechaInput) { fechaInput.value = dateStr; fechaInput.dispatchEvent(new Event('change')); }
    toast('📅 Fecha ' + fmtDate(dateStr) + ' pre-cargada');
  }, 200);
}
function calOpenDay(dateStr) {
  toast('📅 ' + fmtDate(dateStr));
}

// ── VISTA GANTT ──
function setPlGanttDayWidth(v) { _plGanttZoomTouched = true; _plGanttDayWidth = parseInt(v); buildPlannerGantt(); }
function setPlGanttRowHeight(v) { _plGanttZoomTouched = true; _plGanttRowHeight = parseInt(v); buildPlannerGantt(); }
function togglePlGanttGroup(key) { _plGanttCollapsed[key] = !_plGanttCollapsed[key]; buildPlannerGantt(); }
function expandAllPlGanttGroups() { _plGanttCollapsed = {}; buildPlannerGantt(); }
function collapseAllPlGanttGroups() {
  const showFilter = plActiveFilter === 'todos' || plActiveFilter === 'shows';
  const contFilter = plActiveFilter === 'todos' || plActiveFilter === 'contenido';
  const keys = new Set();
  if (showFilter) { SHOWS.forEach((s, realIdx) => { if (s.fecha) keys.add('show-' + realIdx); }); }
  if (contFilter && typeof CONTENIDO !== 'undefined') {
    CONTENIDO.forEach(it => {
      if (!it.fechaIdea && !it.fechaInicio && !it.fecha) return;
      keys.add(it.showIdx != null ? ('show-' + it.showIdx) : 'sin-show');
    });
  }
  keys.forEach(k => _plGanttCollapsed[k] = true);
  buildPlannerGantt();
}

function buildPlannerGantt() {
  const grid = document.getElementById('planner-grid');
  if (!grid) return;
  const showFilter = plActiveFilter === 'todos' || plActiveFilter === 'shows';
  const contFilter = plActiveFilter === 'todos' || plActiveFilter === 'contenido';

  const canEditGantt = _canEdit();
  if (!_plGanttZoomTouched) { _plGanttDayWidth = window.innerWidth < 640 ? 14 : 28; _plGanttRowHeight = window.innerWidth < 640 ? 32 : 40; }

  // ── Resolver fechas ──
  const resolved = [];

  if (showFilter) {
    SHOWS.forEach((s, realIdx) => {
      if (!s.fecha) return;
      if (!_plShowPasaFiltros(s)) return;
      const showDate = new Date(s.fecha + 'T12:00:00');
      const proDate = s.fechaProduccion ? new Date(s.fechaProduccion + 'T12:00:00') : null;
      const preproDate = s.fechaPreproduccion ? new Date(s.fechaPreproduccion + 'T12:00:00') : null;
      // ini para rango de Gantt = la fecha más temprana disponible
      const iniRange = preproDate || proDate || showDate;
      const hasPrep = !!(preproDate || proDate);
      resolved.push({ kind: 'show', realIdx, s, ini: iniRange, fin: showDate, label: s.nombre, color: showGanttColor(s.tipo, s.estado), showDate, proDate, preproDate, hasPrep });
      // Fechas extra del mismo show
      (s.fechasExtra || []).forEach((fe, feIdx) => {
        if (!fe.fecha) return;
        const feDate = new Date(fe.fecha + 'T12:00:00');
        resolved.push({ kind: 'show', realIdx, s, ini: feDate, fin: feDate, label: s.nombre + (fe.nota ? ' · ' + fe.nota : ' · Función ' + (feIdx + 2)), color: showGanttColor(s.tipo, s.estado), showDate: feDate, proDate: null, preproDate: null, hasPrep: false, esExtra: true, feNota: fe.nota || ('Función ' + (feIdx + 2)) });
      });
    });
  }
  if (contFilter && typeof CONTENIDO !== 'undefined') {
    CONTENIDO.forEach(it => {
      let idea = it.fechaIdea ? new Date(it.fechaIdea + 'T12:00:00') : null;
      let ini = it.fechaInicio ? new Date(it.fechaInicio + 'T12:00:00') : null;
      let fin = it.fecha ? new Date(it.fecha + 'T12:00:00') : null;
      if (!ini && idea) ini = idea;
      if (!fin) fin = ini || idea;
      if (!ini) ini = fin;
      if (!idea) idea = ini;
      if (!ini && !fin) return;
      if (idea > ini) { const t = idea; idea = ini; ini = t; }
      if (ini > fin) { const t = ini; ini = fin; fin = t; }
      if (!_plContPasaFiltros(it)) return;
      const hasPrep = !!(it.fechaIdea && it.fechaInicio);
      resolved.push({ kind: 'contenido', it, ini, fin, idea, hasPrep, label: it.nombre, color: cdGanttColor(it.tipo) });
    });
  }

  if (!resolved.length) {
    grid.innerHTML = `<div class="card" style="text-align:center;color:#bbb;padding:40px;">No hay ítems con fechas para mostrar en el Gantt.</div>`;
    return;
  }

  // ── Agrupar por show ──
  const groupMap = {};
  const groupOrder = [];
  resolved.forEach(r => {
    let key, label;
    if (r.kind === 'show') {
      key = 'show-' + r.realIdx;
      label = '🎤 ' + r.s.nombre + ((r.s.fechasExtra||[]).length ? ' (+' + r.s.fechasExtra.length + ')' : '');
    } else {
      const idx = r.it.showIdx;
      key = idx != null ? ('show-' + idx) : 'sin-show';
      label = idx != null ? ('🎭 ' + (SHOWS[idx]?.nombre || 'Show')) : '📦 Sin show vinculado';
    }
    if (!groupMap[key]) { groupMap[key] = { key, label, rows: [] }; groupOrder.push(key); }
    groupMap[key].rows.push(r);
  });
  groupOrder.sort((a, b) => {
    if (a === 'sin-show') return 1;
    if (b === 'sin-show') return -1;
    const idxA = parseInt(a.replace('show-', ''));
    const idxB = parseInt(b.replace('show-', ''));
    return (SHOWS[idxA]?.fecha || '').localeCompare(SHOWS[idxB]?.fecha || '');
  });

  // ── Rango de fechas ──
  const allDates = resolved.flatMap(r => [r.ini, r.fin, r.idea].filter(Boolean));
  let minDate = new Date(Math.min(...allDates));
  let maxDate = new Date(Math.max(...allDates));
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  if (today < minDate) minDate = new Date(today);
  if (today > maxDate) maxDate = new Date(today);
  minDate.setDate(minDate.getDate() - 3);
  maxDate.setDate(maxDate.getDate() + 3);
  minDate.setHours(12, 0, 0, 0);
  maxDate.setHours(12, 0, 0, 0);

  const dayWidth = _plGanttDayWidth;
  const rowHeight = _plGanttRowHeight;
  const totalDays = Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
  const totalWidth = totalDays * dayWidth;

  // ── Filas visibles ──
  const visibleRows = [];
  groupOrder.forEach(key => {
    const g = groupMap[key];
    const collapsed = !!_plGanttCollapsed[key];
    visibleRows.push({ type: 'group', key, label: g.label, count: g.rows.length, collapsed });
    if (!collapsed) g.rows.forEach(r => visibleRows.push({ type: 'item', ...r }));
  });

  // ── Ancho columna labels ──
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = '11px Inter,-apple-system,sans-serif';
  let maxLabelW = 80;
  visibleRows.forEach(r => {
    const w = ctx.measureText(r.label || '').width + (r.type === 'group' ? 30 : 36);
    if (w > maxLabelW) maxLabelW = w;
  });
  const labelColWidth = Math.min(Math.ceil(maxLabelW) + 10, 260);

  // ── Header ──
  const showDayNum = dayWidth >= 14;
  const dayCells = [];
  const monthGroups = [];
  let curMonth = null, curStart = 0, curCount = 0;
  for (let d = 0; d < totalDays; d++) {
    const date = new Date(minDate);
    date.setDate(minDate.getDate() + d);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isToday = date.toDateString() === today.toDateString();
    dayCells.push(`<div style="width:${dayWidth}px;flex-shrink:0;text-align:center;font-size:9px;color:${isToday ? '#fff' : '#9690C2'};background:${isToday ? 'var(--c400)' : isWeekend ? 'rgba(255,255,255,0.04)' : 'transparent'};font-weight:${isToday ? '700' : '400'};border-radius:${isToday ? '4px' : '0'};padding:2px 0;">${showDayNum ? date.getDate() : ''}</div>`);
    const monthLabel = date.toLocaleDateString('es-CL', { month: 'short' }).toUpperCase().replace('.', '');
    if (monthLabel !== curMonth) {
      if (curMonth !== null) monthGroups.push({ label: curMonth, start: curStart, count: curCount });
      curMonth = monthLabel;
      curStart = d;
      curCount = 1;
    } else curCount++;
  }
  monthGroups.push({ label: curMonth, start: curStart, count: curCount });
  const monthHTML = monthGroups.map(m =>
    `<div style="position:absolute;left:${m.start * dayWidth}px;width:${m.count * dayWidth}px;font-size:10px;font-weight:700;color:#B7B2DA;text-transform:uppercase;letter-spacing:0.5px;padding:4px 0 3px 4px;border-left:1px solid var(--border-soft);">${m.label}</div>`
  ).join('');
  const todayOffset = Math.round((today - minDate) / (1000 * 60 * 60 * 24));
  const todayLineLeft = todayOffset * dayWidth + dayWidth / 2;

  // ── Generar filas ──
  let cursorY = 0;
  const labelRowsHTML = [];
  const barsHTML = [];
  const groupBgHTML = [];
  const weekendStripes = [];
  for (let d = 0; d < totalDays; d++) {
    const date = new Date(minDate);
    date.setDate(minDate.getDate() + d);
    if (date.getDay() === 0 || date.getDay() === 6) weekendStripes.push(`<div style="position:absolute;left:${d * dayWidth}px;top:0;width:${dayWidth}px;height:100%;background:rgba(255,255,255,0.025);"></div>`);
  }

  visibleRows.forEach(row => {
    if (row.type === 'group') {
      labelRowsHTML.push(`<div onclick="togglePlGanttGroup('${row.key}')" style="height:${rowHeight}px;display:flex;align-items:center;gap:6px;padding:0 10px;font-size:11px;font-weight:700;color:#fff;background:rgba(255,255,255,0.06);border-bottom:0.5px solid var(--border-soft);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
        <span style="display:inline-block;transition:transform 0.15s;transform:rotate(${row.collapsed ? '-90' : '0'}deg);">▾</span> ${row.label} <span style="font-size:9px;color:#9690C2;font-weight:400;margin-left:auto;flex-shrink:0;">${row.count}</span>
      </div>`);
      groupBgHTML.push(`<div style="position:absolute;left:0;top:${cursorY}px;width:${totalWidth}px;height:${rowHeight}px;background:rgba(255,255,255,0.06);"></div>`);
      cursorY += rowHeight;
    } else {
      const top = cursorY + Math.max(4, rowHeight * 0.18);
      const barH = rowHeight - Math.max(8, rowHeight * 0.36);

      if (row.kind === 'show') {
        const c = showColor(row.s.tipo, row.s.estado);
        const rowLabel = row.esExtra ? `📅 ${row.feNota}` : `🎤 ${row.s.nombre}`;
        const rowTitle = row.esExtra ? `${row.s.nombre} · ${row.feNota}` : row.s.nombre;
        labelRowsHTML.push(`<div onclick="goToShow(${row.realIdx})" style="height:${rowHeight}px;display:flex;align-items:center;padding:0 10px 0 22px;font-size:${rowHeight < 34 ? '10px' : '11px'};color:#E4E1F7;border-bottom:0.5px solid var(--border-soft);cursor:pointer;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;" title="${rowTitle}">${rowLabel}</div>`);

        if (row.esExtra) {
          // Función extra: barra puntual simple
          const offsetDays = Math.round((row.showDate - minDate) / (1000 * 60 * 60 * 24));
          const left = offsetDays * dayWidth + 2;
          const width = Math.max(dayWidth - 4, 8);
          barsHTML.push(`<div onclick="goToShow(${row.realIdx})" title="📅 ${row.feNota} · ${fmtDate(row.s.fecha)}" style="position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${barH}px;background:${c.bg};border:2px dashed ${c.txt};border-radius:5px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:9px;color:${c.txt};font-weight:700;box-shadow:0 1px 6px rgba(0,0,0,0.2);">📅</div>`);
        } else if (row.hasPrep) {
          // Tiene fechas de preproducción/producción — barras encadenadas
          const color = c.bg;
          const txtColor = c.txt;
          const showFields = {};
          if (row.s.fechaPreproduccion) showFields.fechaPreproduccion = row.s.fechaPreproduccion;
          if (row.s.fechaProduccion) showFields.fechaProduccion = row.s.fechaProduccion;
          if (row.s.fecha) showFields.fecha = row.s.fecha;
          const fieldsJSON = JSON.stringify(showFields).replace(/"/g, '&quot;');
          const showBarData = canEditGantt ? ` data-gantt-edit="show-multi" data-gantt-idx="${row.realIdx}" data-gantt-fields='${fieldsJSON}' data-gantt-nombre="${row.s.nombre.replace(/"/g, '&quot;')}"` : '';

          if (row.preproDate) {
            const endPrepro = row.proDate || row.showDate;
            const preproOff = Math.round((row.preproDate - minDate) / (1000 * 60 * 60 * 24));
            const preproDur = Math.max(Math.round((endPrepro - row.preproDate) / (1000 * 60 * 60 * 24)), 1);
            barsHTML.push(`<div ${canEditGantt ? '' : 'onclick="goToShow(' + row.realIdx + ')"'}${showBarData} title="📋 Preproducción: ${fmtDate(row.s.fechaPreproduccion)} → ${fmtDate((row.proDate||row.showDate).toISOString().slice(0,10))} ${canEditGantt ? '· Clic para editar fechas' : ''}" style="position:absolute;left:${preproOff * dayWidth + 2}px;top:${top}px;width:${Math.max(preproDur * dayWidth - 2, 6)}px;height:${barH}px;background:repeating-linear-gradient(135deg,${color}55 0px,${color}55 4px,${color}22 4px,${color}22 8px);border:1px solid ${color}88;border-radius:6px 0 0 6px;cursor:pointer;box-sizing:border-box;"></div>`);
          }
          if (row.proDate) {
            const proOff = Math.round((row.proDate - minDate) / (1000 * 60 * 60 * 24));
            const proDur = Math.max(Math.round((row.showDate - row.proDate) / (1000 * 60 * 60 * 24)), 1);
            const proW = Math.max(proDur * dayWidth - 2, 6);
            barsHTML.push(`<div ${canEditGantt ? '' : 'onclick="goToShow(' + row.realIdx + ')"'}${showBarData} title="🎬 Producción: ${fmtDate(row.s.fechaProduccion)} → ${fmtDate(row.s.fecha)} ${canEditGantt ? '· Clic para editar fechas' : ''}" style="position:absolute;left:${proOff * dayWidth}px;top:${top}px;width:${proW}px;height:${barH}px;background:${color};opacity:0.75;border:1px solid ${txtColor}55;border-radius:${row.preproDate ? '0' : '6px'} 0 0 ${row.preproDate ? '0' : '6px'};cursor:pointer;"></div>`);
          }
          // Punto del show
          const showOff = Math.round((row.showDate - minDate) / (1000 * 60 * 60 * 24));
          const showLeft = showOff * dayWidth + 2;
          const showW = Math.max(dayWidth - 4, 8);
          barsHTML.push(`<div ${canEditGantt ? '' : 'onclick="goToShow(' + row.realIdx + ')"'}${showBarData} title="🎤 ${row.s.nombre} · ${fmtDate(row.s.fecha)} ${canEditGantt ? '· Clic para editar fechas' : ''}" style="position:absolute;left:${showLeft}px;top:${top}px;width:${showW}px;height:${barH}px;background:${color};border:2px solid ${txtColor};border-radius:5px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:9px;color:${txtColor};font-weight:700;box-shadow:0 1px 6px rgba(0,0,0,0.3);">🎤</div>`);
        } else {
          // Sin fechas de prepro — barra puntual simple (comportamiento original)
          const offsetDays = Math.round((row.showDate - minDate) / (1000 * 60 * 60 * 24));
          const left = offsetDays * dayWidth + 2;
          const width = Math.max(dayWidth - 4, 8);
          const showBarData = canEditGantt ? ` data-gantt-edit="show" data-gantt-idx="${row.realIdx}" data-gantt-fecha="${row.s.fecha}" data-gantt-nombre="${row.s.nombre.replace(/"/g, '&quot;')}"` : '';
          barsHTML.push(`<div ${canEditGantt ? '' : 'onclick="goToShow(' + row.realIdx + ')"'} title="🎤 ${row.s.nombre} · ${fmtDate(row.s.fecha)} ${canEditGantt ? '· Clic para editar fecha' : ''}"${showBarData} style="position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${barH}px;background:${c.bg};border:2px solid ${c.txt};border-radius:5px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:9px;color:${c.txt};font-weight:700;box-shadow:0 1px 6px rgba(0,0,0,0.3);">🎤</div>`);
        }
      } else {
        // ── CONTENIDO ──
        labelRowsHTML.push(`<div onclick="openCdDetail('${row.it.id}')" style="height:${rowHeight}px;display:flex;align-items:center;padding:0 10px 0 22px;font-size:${rowHeight < 34 ? '10px' : '11px'};color:#E4E1F7;border-bottom:0.5px solid var(--border-soft);cursor:pointer;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;" title="${row.it.nombre}">${row.it.nombre}</div>`);
        const color = row.color;
        const opacity = row.it.estado === 'Publicado' ? 0.5 : 0.9;

        // Construir objeto con las fechas existentes para pasarlo como data
        const fields = {};
        if (row.it.fechaIdea) fields.fechaIdea = row.it.fechaIdea;
        if (row.it.fechaInicio) fields.fechaInicio = row.it.fechaInicio;
        if (row.it.fecha) fields.fecha = row.it.fecha;
        const fieldsJSON = JSON.stringify(fields).replace(/"/g, '&quot;');

        if (row.hasPrep) {
          
          // Barra de preproducción (rayada) → target = fechaIdea
            const prepOff = Math.round((row.idea - minDate) / (1000 * 60 * 60 * 24));
            const prepDur = Math.max(Math.round((row.ini - row.idea) / (1000 * 60 * 60 * 24)), 1);
            const prepBarData = canEditGantt ? ` data-gantt-edit="contenido" data-gantt-target="fechaIdea" data-gantt-id="${row.it.id}" data-gantt-fields='${fieldsJSON}' data-gantt-nombre="${row.it.nombre.replace(/"/g, '&quot;')}"` : '';
            barsHTML.push(`<div ${canEditGantt ? '' : 'onclick="openCdDetail(\'' + row.it.id + '\')"'} title="Preproducción: ${fmtDate(row.it.fechaIdea)} → ${fmtDate(row.it.fechaInicio)} ${canEditGantt ? '· Clic para editar fechas' : ''}"${prepBarData} style="position:absolute;left:${prepOff * dayWidth + 2}px;top:${top}px;width:${Math.max(prepDur * dayWidth - 2, 6)}px;height:${barH}px;background:repeating-linear-gradient(135deg,${color}55 0px,${color}55 4px,${color}22 4px,${color}22 8px);border:1px solid ${color}88;border-radius:6px 0 0 6px;cursor:pointer;box-sizing:border-box;"></div>`);
          
            // Barra de producción (sólida) → target = fecha
          const prodOff = Math.round((row.ini - minDate) / (1000 * 60 * 60 * 24));
          const prodDur = Math.max(Math.round((row.fin - row.ini) / (1000 * 60 * 60 * 24)) + 1, 1);
          const prodW = Math.max(prodDur * dayWidth - 4, dayWidth - 4);
          const prodBarData = canEditGantt ? ` data-gantt-edit="contenido" data-gantt-target="fecha" data-gantt-id="${row.it.id}" data-gantt-fields='${fieldsJSON}' data-gantt-nombre="${row.it.nombre.replace(/"/g, '&quot;')}"` : '';
          barsHTML.push(`<div ${canEditGantt ? '' : 'onclick="openCdDetail(\'' + row.it.id + '\')"'} title="${row.it.nombre} · Producción: ${fmtDate(row.it.fechaInicio)} → ${fmtDate(row.it.fecha)} ${canEditGantt ? '· Clic para editar fechas' : ''}"${prodBarData} style="position:absolute;left:${prodOff * dayWidth}px;top:${top}px;width:${prodW}px;height:${barH}px;background:${color};opacity:${opacity};border-radius:0 6px 6px 0;cursor:pointer;display:flex;align-items:center;padding:0 6px;font-size:10px;color:#fff;font-weight:600;overflow:hidden;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.25);">${prodW > 60 ? (cdEstEmoji(row.it.estado) + ' ' + row.it.nombre) : cdEstEmoji(row.it.estado)}</div>`);
        } else {
          // Barra única (sin preproducción diferenciada) → target = fecha
          const off = Math.round((row.ini - minDate) / (1000 * 60 * 60 * 24));
          const dur = Math.max(Math.round((row.fin - row.ini) / (1000 * 60 * 60 * 24)) + 1, 1);
          const w = Math.max(dur * dayWidth - 4, dayWidth - 4);
          const singleBarData = canEditGantt ? ` data-gantt-edit="contenido" data-gantt-target="fecha" data-gantt-id="${row.it.id}" data-gantt-fields='${fieldsJSON}' data-gantt-nombre="${row.it.nombre.replace(/"/g, '&quot;')}"` : '';
          barsHTML.push(`<div ${canEditGantt ? '' : 'onclick="openCdDetail(\'' + row.it.id + '\')"'} title="${row.it.nombre} · ${fmtDate(row.it.fecha || row.it.fechaInicio)} ${canEditGantt ? '· Clic para editar fechas' : ''}"${singleBarData} style="position:absolute;left:${off * dayWidth + 2}px;top:${top}px;width:${w}px;height:${barH}px;background:${color};opacity:${opacity};border-radius:6px;cursor:pointer;display:flex;align-items:center;padding:0 6px;font-size:10px;color:#fff;font-weight:600;overflow:hidden;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.25);">${w > 60 ? (cdEstEmoji(row.it.estado) + ' ' + row.it.nombre) : cdEstEmoji(row.it.estado)}</div>`);
        }
      }
      cursorY += rowHeight;
    }
  });

  const bodyHeight = cursorY;

  // ── Controles ──
  const controlsHTML = `
  <div class="gantt-controls" style="margin-bottom:10px;">
    <div class="gantt-control-item"><label>🔍 Zoom tiempo</label><input type="range" min="6" max="50" step="1" value="${dayWidth}" oninput="setPlGanttDayWidth(this.value)"></div>
    <div class="gantt-control-item"><label>↕ Alto filas</label><div class="gantt-vslider-wrap"><input type="range" min="26" max="60" step="2" value="${rowHeight}" oninput="setPlGanttRowHeight(this.value)"></div></div>
    <button class="btn" style="font-size:10px;padding:3px 8px;" onclick="expandAllPlGanttGroups()">Expandir todo</button>
    <button class="btn" style="font-size:10px;padding:3px 8px;" onclick="collapseAllPlGanttGroups()">Colapsar todo</button>
  </div>`;

  grid.innerHTML = controlsHTML + `
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
    <span style="display:flex;align-items:center;gap:5px;"><span style="width:14px;height:8px;border-radius:2px;background:repeating-linear-gradient(135deg,#E1F5EE55 0px,#E1F5EE55 4px,#E1F5EE22 4px,#E1F5EE22 8px);border:1px solid #08504188;display:inline-block;"></span>Preproducción show</span>
    <span style="display:flex;align-items:center;gap:5px;"><span style="width:14px;height:8px;border-radius:2px;background:#E1F5EE;opacity:0.75;display:inline-block;border:1px solid #08504155;"></span>Producción show</span>
    <span style="display:flex;align-items:center;gap:5px;"><span style="width:14px;height:10px;border-radius:3px;border:2px dashed #085041;background:#E1F5EE;display:inline-block;font-size:8px;text-align:center;">📅</span>Función extra</span>
    <span style="display:flex;align-items:center;gap:5px;"><span style="width:14px;height:8px;border-radius:2px;background:repeating-linear-gradient(135deg,#9690C255 0px,#9690C255 4px,#9690C222 4px,#9690C222 8px);border:1px solid #9690C288;display:inline-block;"></span>Preproducción contenido</span>
    <span style="display:flex;align-items:center;gap:5px;"><span style="width:14px;height:8px;border-radius:2px;background:#9690C2;display:inline-block;"></span>Producción contenido</span>
  </div>`;
  // Bind event listeners a las barras editables
  grid.querySelectorAll('[data-gantt-edit]').forEach(el => el.addEventListener('click', plGanttBarClick));
}

// ── GANTT: EDICIÓN INLINE DE FECHA ──
function plGanttBarClick(e) {
  e.stopPropagation();
  const el = e.currentTarget;
  const tipo = el.dataset.ganttEdit; // 'show' o 'contenido'
  const targetField = el.dataset.ganttTarget || 'fecha'; // campo que se debe enfocar
  const nombre = el.dataset.ganttNombre || '';

  // Remover picker previo
  const prev = document.getElementById('pl-gantt-datepicker');
  if (prev) prev.remove();

  const rect = el.getBoundingClientRect();
  const picker = document.createElement('div');
  picker.id = 'pl-gantt-datepicker';
  picker.className = 'pl-gantt-datepicker';

  let fieldsHTML = '';
  let focusId = '';

  if (tipo === 'show') {
    // Show: solo un campo (sin prepro/pro)
    const fechaActual = el.dataset.ganttFecha || '';
    fieldsHTML = `
      <div class="pl-gantt-dp-field">
        <label class="pl-gantt-dp-label">🎤 Fecha del show</label>
        <input id="pl-gantt-dp-input-fecha" type="date" class="pl-gantt-dp-input" value="${fechaActual}">
      </div>`;
    focusId = 'pl-gantt-dp-input-fecha';
  } else if (tipo === 'show-multi') {
    // Show con fechas de prepro/pro
    let fields = {};
    try { const raw = el.dataset.ganttFields; if (raw) fields = JSON.parse(raw.replace(/&quot;/g, '"')); } catch(e) {}
    const fieldOrder = ['fechaPreproduccion', 'fechaProduccion', 'fecha'];
    const fieldLabels = { fechaPreproduccion: '📋 Inicio preproducción', fechaProduccion: '🎬 Inicio producción', fecha: '🎤 Fecha del show' };
    fieldOrder.forEach(key => {
      if (fields[key] !== undefined) {
        const val = fields[key] || '';
        const isTarget = (key === targetField);
        fieldsHTML += `
          <div class="pl-gantt-dp-field">
            <label class="pl-gantt-dp-label" style="${isTarget ? 'font-weight:700;color:var(--p400);' : ''}">${fieldLabels[key]}</label>
            <input id="pl-gantt-dp-input-${key}" type="date" class="pl-gantt-dp-input" value="${val}" data-field="${key}" data-kind="show-multi">
          </div>`;
        if (isTarget) focusId = 'pl-gantt-dp-input-' + key;
      }
    });
  } else {
    // Contenido: leer las fechas del dataset
    let fields = {};
    try {
      const raw = el.dataset.ganttFields;
      if (raw) fields = JSON.parse(raw.replace(/&quot;/g, '"'));
    } catch (e) {}

    // Orden de campos: idea, inicio, entrega
    const fieldOrder = ['fechaIdea', 'fechaInicio', 'fecha'];
    const fieldLabels = {
      fechaIdea: '💡 Idea / preproducción',
      fechaInicio: '🎬 Inicio producción',
      fecha: '🚀 Entrega / publicación'
    };

    fieldOrder.forEach(key => {
      if (fields[key] !== undefined) {
        const val = fields[key] || '';
        const label = fieldLabels[key] || key;
        const isTarget = (key === targetField);
        fieldsHTML += `
          <div class="pl-gantt-dp-field">
            <label class="pl-gantt-dp-label" style="${isTarget ? 'font-weight:700;color:var(--p400);' : ''}">${label}</label>
            <input id="pl-gantt-dp-input-${key}" type="date" class="pl-gantt-dp-input" value="${val}" data-field="${key}">
          </div>`;
        if (isTarget) focusId = 'pl-gantt-dp-input-' + key;
      }
    });
  }

  // Si no hay campos, cerrar
  if (!fieldsHTML) {
    toast('⚠️ No hay fechas editables para este elemento.');
    return;
  }

  picker.innerHTML = `
    <div class="pl-gantt-dp-header">${nombre}</div>
    <div class="pl-gantt-dp-fields">${fieldsHTML}</div>
    <div class="pl-gantt-dp-btns">
      <button class="pl-gantt-dp-ok">✓ Guardar cambios</button>
      <button class="pl-gantt-dp-cancel">✕</button>
    </div>`;

  // Posicionar el picker
  picker.style.position = 'fixed';
  picker.style.top = (rect.bottom + 4) + 'px';
  picker.style.left = Math.min(rect.left, window.innerWidth - 320) + 'px';
  document.body.appendChild(picker);

  // Enfocar el campo objetivo
  const targetInput = document.getElementById(focusId);
  if (targetInput) targetInput.focus();

  const close = () => { const p = document.getElementById('pl-gantt-datepicker'); if (p) p.remove(); };

  // Botón cancelar
  picker.querySelector('.pl-gantt-dp-cancel').addEventListener('click', close);

  // Botón guardar
  picker.querySelector('.pl-gantt-dp-ok').addEventListener('click', async () => {
    if (tipo === 'show') {
      const input = document.getElementById('pl-gantt-dp-input-fecha');
      const nuevaFecha = input.value;
      if (!nuevaFecha) { close(); return; }
      const idx = parseInt(el.dataset.ganttIdx);
      const s = SHOWS[idx];
      if (!s) return;
      const prev = s.fecha;
      s.fecha = nuevaFecha;
      buildPlannerGantt();
      try {
        const { error } = await sb.from('shows').update({ fecha: nuevaFecha }).eq('id', s.id);
        if (error) { s.fecha = prev; buildPlannerGantt(); toast('⚠️ Error guardando fecha: ' + error.message); }
        else toast('✅ Fecha actualizada → ' + fmtDate(nuevaFecha));
      } catch (err) { s.fecha = prev; buildPlannerGantt(); toast('⚠️ Error de conexión'); }
      close();
      return;
    }

    if (tipo === 'show-multi') {
      const idx = parseInt(el.dataset.ganttIdx);
      const s = SHOWS[idx];
      if (!s) { close(); return; }
      const inputs = picker.querySelectorAll('.pl-gantt-dp-input[data-kind="show-multi"]');
      const dbUpdate = {};
      let changes = 0;
      inputs.forEach(inp => {
        const field = inp.dataset.field;
        if (!field) return;
        const newVal = inp.value;
        const oldVal = s[field] || '';
        if (newVal !== oldVal) {
          s[field] = newVal;
          const dbField = field === 'fechaPreproduccion' ? 'fecha_preproduccion' : field === 'fechaProduccion' ? 'fecha_produccion' : 'fecha';
          dbUpdate[dbField] = newVal || null;
          changes++;
        }
      });
      if (changes > 0) {
        buildPlannerGantt();
        try {
          const { error } = await sb.from('shows').update(dbUpdate).eq('id', s.id);
          if (error) toast('⚠️ Error guardando fechas: ' + error.message);
          else toast('✅ ' + changes + ' fecha' + (changes > 1 ? 's' : '') + ' actualizadas');
        } catch (err) { toast('⚠️ Error de conexión'); }
      } else { toast('ℹ️ Sin cambios'); }
      close();
      return;
    }

    // ── CONTENIDO: actualizar todos los campos que hayan cambiado ──
    const id = el.dataset.ganttId;
    const it = (typeof CONTENIDO !== 'undefined' ? CONTENIDO : []).find(c => String(c.id) === String(id));
    if (!it) { close(); return; }

    const inputs = picker.querySelectorAll('.pl-gantt-dp-input');
    let changes = 0;
    for (const inp of inputs) {
      const field = inp.dataset.field;
      if (!field) continue;
      const newVal = inp.value;
      const oldVal = it[field] || '';
      if (newVal !== oldVal) {
        it[field] = newVal;
        await updateCdField(id, field, newVal);
        changes++;
      }
    }
    if (changes > 0) {
      toast('✅ ' + changes + ' fecha' + (changes > 1 ? 's' : '') + ' actualizada' + (changes > 1 ? 's' : ''));
    } else {
      toast('ℹ️ Sin cambios');
    }
    buildPlannerGantt();
    close();
  });

  // Cerrar al hacer clic fuera
  setTimeout(() => document.addEventListener('click', function h(ev) {
    if (!document.getElementById('pl-gantt-datepicker')?.contains(ev.target)) {
      close();
      document.removeEventListener('click', h);
    }
  }), 50);
}

function syncPlGanttVertical(source) {
  const other = source.id === 'pl-gantt-labels' ? document.getElementById('pl-gantt-scroll') : document.getElementById('pl-gantt-labels');
  if (other && other.scrollTop !== source.scrollTop) other.scrollTop = source.scrollTop;
}

// ── VISTA KANBAN ──
function plKanbanSetMode(mode) {
  plKanbanMode = mode;
  buildPlannerKanban();
}
function buildPlannerKanban() {
  const grid = document.getElementById('planner-grid');
  if (!grid) return;
  const canEdit = _canEdit();

  const toggleHTML = `<div class="pl-kanban-toggle">
    <button class="pl-kanban-toggle-btn ${plKanbanMode === 'shows' ? 'active' : ''}" onclick="plKanbanSetMode('shows')">🎤 Shows / eventos</button>
    <button class="pl-kanban-toggle-btn ${plKanbanMode === 'contenido' ? 'active' : ''}" onclick="plKanbanSetMode('contenido')">🎬 Contenido digital</button>
  </div>`;

  let colsHTML;
  if (plKanbanMode === 'shows') {
    colsHTML = SHOW_ESTADOS.map(estado => {
      const items = SHOWS.map((s, realIdx) => ({ s, realIdx })).filter(o => (o.s.estado || 'Tentativo') === estado);
      const cards = items.map(o => plKanbanShowCard(o.s, o.realIdx, canEdit)).join('') || `<div class="pl-kanban-empty">Sin shows</div>`;
      const dropAttrs = canEdit ? `ondragover="plKanbanDragOver(event)" ondragleave="plKanbanDragLeave(event)" ondrop="plKanbanDrop(event,'${estado}')"` : '';
      return `<div class="pl-kanban-col" ${dropAttrs}>
        <div class="pl-kanban-col-hdr"><span>${estado}</span><span class="pl-kanban-col-cnt">${items.length}</span></div>
        ${cards}
      </div>`;
    }).join('');
  } else {
    const contenido = typeof CONTENIDO !== 'undefined' ? CONTENIDO : [];
    colsHTML = CD_ESTADOS.map(estado => {
      const items = contenido.filter(c => c.estado === estado);
      const cards = items.map(it => plKanbanContenidoCard(it, canEdit)).join('') || `<div class="pl-kanban-empty">Sin piezas</div>`;
      const dropAttrs = canEdit ? `ondragover="plKanbanDragOver(event)" ondragleave="plKanbanDragLeave(event)" ondrop="plKanbanDrop(event,'${estado}')"` : '';
      return `<div class="pl-kanban-col" ${dropAttrs}>
        <div class="pl-kanban-col-hdr"><span>${cdEstEmoji(estado)} ${estado}</span><span class="pl-kanban-col-cnt">${items.length}</span></div>
        ${cards}
      </div>`;
    }).join('');
  }

  grid.innerHTML = toggleHTML + `<div class="pl-kanban-cols">${colsHTML}</div>`;
}
function plKanbanShowCard(s, realIdx, canEdit) {
  const equipo = equipoStackHTML('show', s.id, 3);
  const dragAttrs = canEdit ? `draggable="true" ondragstart="plKanbanDragStart(event,'show',${realIdx})" ondragend="plKanbanDragEnd(event)"` : '';
  const extraFns = (s.fechasExtra||[]).filter(fe=>fe.fecha);
  const fechasStr = s.fecha ? fmtDate(s.fecha) + (extraFns.length ? ' +'+extraFns.length+' fcn.' : '') : 'Sin fecha';
  const preproLine = s.fechaPreproduccion ? `<div class="pl-kanban-card-meta" style="font-size:9px;color:#9690C2;">📋 prepro ${fmtDate(s.fechaPreproduccion)}</div>` : '';
  const proLine = s.fechaProduccion ? `<div class="pl-kanban-card-meta" style="font-size:9px;color:#9690C2;">🎬 prod. ${fmtDate(s.fechaProduccion)}</div>` : '';
  return `<div class="pl-kanban-card" ${dragAttrs} onclick="goToShow(${realIdx})">
    <div class="pl-kanban-card-nombre">🎤 ${s.nombre}</div>
    ${preproLine}${proLine}
    <div class="pl-kanban-card-meta"><span>🎤 ${fechasStr}</span></div>
    <div class="pl-kanban-card-meta">${equipo}</div>
  </div>`;
}
function plKanbanContenidoCard(item, canEdit) {
  const equipo = equipoStackHTML('contenido', item.id, 3);
  const dragAttrs = canEdit ? `draggable="true" ondragstart="plKanbanDragStart(event,'contenido','${item.id}')" ondragend="plKanbanDragEnd(event)"` : '';
  return `<div class="pl-kanban-card" ${dragAttrs} onclick="openCdDetail('${item.id}')">
    <div class="pl-kanban-card-nombre">${item.nombre}</div>
    <div class="pl-kanban-card-meta"><span>${item.fecha ? fmtDate(item.fecha) : 'Sin fecha'}</span></div>
    <div class="pl-kanban-card-meta">${equipo}</div>
  </div>`;
}
function plKanbanDragStart(e, kind, id) {
  _plKanbanDrag = { kind, id };
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(id));
}
function plKanbanDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  _plKanbanDrag = null;
  document.querySelectorAll('.pl-kanban-col.drag-over').forEach(c => c.classList.remove('drag-over'));
}
function plKanbanDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}
function plKanbanDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}
async function plKanbanDrop(e, newEstado) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const drag = _plKanbanDrag;
  if (!drag) return;
  if (drag.kind === 'show') {
    const s = SHOWS[drag.id];
    if (!s || s.estado === newEstado) return;
    const prevEstado = s.estado;
    s.estado = newEstado;
    buildPlannerKanban();
    try {
      const { error } = await sb.from('shows').update({ estado: newEstado }).eq('id', s.id);
      if (error) { s.estado = prevEstado; buildPlannerKanban(); toast('⚠️ Error guardando estado: ' + error.message); } else toast('✅ ' + s.nombre + ' → ' + newEstado);
    } catch (err) { s.estado = prevEstado; buildPlannerKanban(); toast('⚠️ Error de conexión guardando estado'); }
  } else {
    const item = (typeof CONTENIDO !== 'undefined' ? CONTENIDO : []).find(c => String(c.id) === String(drag.id));
    if (!item || item.estado === newEstado) return;
    updateCdField(item.id, 'estado', newEstado);
    buildPlannerKanban();
    toast('✅ ' + item.nombre + ' → ' + newEstado);
  }
}

// ── VISTA CARGA DE EQUIPO ──
function plCargaSetGran(g) {
  plCargaGran = g;
  buildPlannerCarga();
}
function plCargaResolveRange(entityType, entityId) {
  if (entityType === 'show') {
    const s = SHOWS.find(x => String(x.id) === String(entityId));
    if (!s || !s.fecha) return null;
    const showDate = new Date(s.fecha + 'T12:00:00');
    const iniDate = s.fechaPreproduccion ? new Date(s.fechaPreproduccion + 'T12:00:00')
                  : s.fechaProduccion    ? new Date(s.fechaProduccion    + 'T12:00:00')
                  : showDate;
    return { ini: iniDate, fin: showDate, label: '🎤 ' + s.nombre };
  }
  const it = (typeof CONTENIDO !== 'undefined' ? CONTENIDO : []).find(x => String(x.id) === String(entityId));
  if (!it) return null;
  let idea = it.fechaIdea ? new Date(it.fechaIdea + 'T12:00:00') : null;
  let ini = it.fechaInicio ? new Date(it.fechaInicio + 'T12:00:00') : null;
  let fin = it.fecha ? new Date(it.fecha + 'T12:00:00') : null;
  if (!ini && idea) ini = idea;
  if (!fin) fin = ini || idea;
  if (!ini) ini = fin;
  if (!idea) idea = ini;
  if (!ini && !fin) return null;
  if (idea > ini) { const t = idea; idea = ini; ini = t; }
  if (ini > fin) { const t = ini; ini = fin; fin = t; }
  return { ini: idea, fin, label: it.nombre };
}
function plCargaColor(count) {
  if (count <= 0) return { bg: 'transparent', txt: '#665f99' };
  if (count === 1) return { bg: 'var(--t50)', txt: 'var(--t800)' };
  if (count === 2) return { bg: 'var(--t200)', txt: 'var(--t800)' };
  if (count === 3) return { bg: 'var(--a100)', txt: 'var(--a800)' };
  if (count === 4) return { bg: 'var(--a400)', txt: '#fff' };
  return { bg: 'var(--c400)', txt: '#fff' };
}
function buildPlannerCarga() {
  const grid = document.getElementById('planner-grid');
  if (!grid) return;
  const personas = PERSONAS.filter(p => p.activo);
  if (!personas.length) {
    grid.innerHTML = `<div class="card" style="text-align:center;color:#bbb;padding:40px;">No hay personas activas en el equipo todavía.</div>`;
    return;
  }
  const showFilter = plActiveFilter === 'todos' || plActiveFilter === 'shows';
  const contFilter = plActiveFilter === 'todos' || plActiveFilter === 'contenido';

  const resolved = ASIGNACIONES
    .filter(a => {
      if (!((a.entityType === 'show' && showFilter) || (a.entityType === 'contenido' && contFilter))) return false;
      if (plFiltroEstados.length) {
        if (a.entityType === 'show') {
          const s = SHOWS.find(x => String(x.id) === String(a.entityId));
          if (!s || !plFiltroEstados.includes(s.estado || 'Tentativo')) return false;
        } else {
          const c = (typeof CONTENIDO !== 'undefined' ? CONTENIDO : []).find(x => String(x.id) === String(a.entityId));
          if (!c || !plFiltroEstados.includes(c.estado)) return false;
        }
      }
      return true;
    })
    .map(a => { const r = plCargaResolveRange(a.entityType, a.entityId); return r ? { a, ...r } : null; })
    .filter(Boolean)
    .filter(r => _plRangoEnFiltro(r.ini, r.fin));

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  let minDate = resolved.length ? new Date(Math.min(...resolved.map(r => +r.ini))) : new Date(today);
  let maxDate = resolved.length ? new Date(Math.max(...resolved.map(r => +r.fin))) : new Date(today);
  if (today < minDate) minDate = new Date(today);
  if (today > maxDate) maxDate = new Date(today);

  const periods = [];
  if (plCargaGran === 'semana') {
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 28);
    let cur = new Date(minDate);
    cur.setDate(cur.getDate() - ((cur.getDay() + 6) % 7));
    cur.setHours(12, 0, 0, 0);
    const end = new Date(maxDate);
    let guard = 0;
    while (cur <= end && guard < 104) {
      const fin = new Date(cur);
      fin.setDate(fin.getDate() + 6);
      fin.setHours(23, 59, 59, 999);
      periods.push({ key: weekKey(cur), label: weekLabel(cur), ini: new Date(cur), fin, isToday: today >= cur && today <= fin });
      cur.setDate(cur.getDate() + 7);
      guard++;
    }
  } else {
    minDate.setDate(1);
    minDate.setMonth(minDate.getMonth() - 1);
    maxDate.setMonth(maxDate.getMonth() + 3);
    let cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1, 12, 0, 0, 0);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    let guard = 0;
    while (cur <= end && guard < 36) {
      const fin = new Date(cur.getFullYear(), cur.getMonth() + 1, 0, 23, 59, 59, 999);
      periods.push({ key: cur.getFullYear() + '-' + cur.getMonth(), label: MESES[cur.getMonth()] + ' ' + cur.getFullYear(), ini: new Date(cur), fin, isToday: today >= cur && today <= fin });
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1, 12, 0, 0, 0);
      guard++;
    }
  }

  const cargaMap = {};
  personas.forEach(p => { cargaMap[p.id] = {}; periods.forEach(per => { cargaMap[p.id][per.key] = { count: 0, viaja: false, items: [] }; }); });
  resolved.forEach(r => {
    const m = cargaMap[r.a.personaId];
    if (!m) return;
    periods.forEach(per => {
      if (r.ini <= per.fin && r.fin >= per.ini) {
        const c = m[per.key];
        c.count++;
        if (r.a.viaja) c.viaja = true;
        c.items.push(r.label);
      }
    });
  });

  const headCols = periods.map(per => `<th class="${per.isToday ? 'pl-carga-col-today' : ''}">${per.label}</th>`).join('');
  const bodyRows = personas.map(p => {
    const cells = periods.map(per => {
      const c = cargaMap[p.id][per.key];
      const col = plCargaColor(c.count);
      const tip = c.items.length ? c.items.join(', ') : 'Sin carga asignada';
      const drillAttrs = c.count ? ` data-drill="1" data-persona="${p.nombre.replace(/"/g, '&quot;')}" data-periodo="${per.label.replace(/"/g, '&quot;')}" data-items="${btoa(unescape(encodeURIComponent(JSON.stringify(c.items))))}"` : '';
      return `<td class="pl-carga-cell ${per.isToday ? 'pl-carga-col-today' : ''}" style="background:${col.bg};color:${col.txt};${c.count ? 'cursor:pointer' : ''}" title="${tip.replace(/"/g, '&quot;')}"${drillAttrs}>${c.count || ''}${c.viaja ? ` <span class="pl-carga-viaje" title="Viaja">✈️</span>` : ''}</td>`;
    }).join('');
    return `<tr><td class="pl-carga-td-persona"><div class="pl-carga-persona-row">${personaAvatarHTML(p, 'pl-carga-av')}<span>${p.nombre}</span></div></td>${cells}</tr>`;
  }).join('');

  const toggleHTML = `<div class="pl-kanban-toggle">
    <button class="pl-kanban-toggle-btn ${plCargaGran === 'semana' ? 'active' : ''}" onclick="plCargaSetGran('semana')">🗞 Semanas</button>
    <button class="pl-kanban-toggle-btn ${plCargaGran === 'mes' ? 'active' : ''}" onclick="plCargaSetGran('mes')">📆 Meses</button>
  </div>`;

  grid.innerHTML = toggleHTML + `<div class="pl-carga-wrap"><table class="pl-carga-table"><thead><tr><th class="pl-carga-th-persona">Persona</th>${headCols}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
  grid.querySelectorAll('td[data-drill]').forEach(td => td.addEventListener('click', plCargaDrilldown));
}

function plCargaDrilldown(e) {
  const td = e.currentTarget;
  const persona = td.dataset.persona;
  const periodo = td.dataset.periodo;
  let items = [];
  try { items = JSON.parse(decodeURIComponent(escape(atob(td.dataset.items)))); } catch (err) { return; }
  e.stopPropagation();
  const prev = document.getElementById('pl-carga-modal');
  if (prev) prev.remove();
  const overlay = document.createElement('div');
  overlay.id = 'pl-carga-modal';
  overlay.className = 'pl-carga-modal-overlay';
  const listHTML = items.map(nombre => {
    const isShow = nombre.startsWith('🎤 ');
    const cleanNombre = nombre.replace(/^🎤 /, '');
    const showIdx = isShow ? SHOWS.findIndex(s => s.nombre === cleanNombre) : -1;
    if (isShow && showIdx !== -1)
      return `<div class="pl-carga-drill-item" onclick="document.getElementById('pl-carga-modal').remove();goToShow(${showIdx})">🎤 ${cleanNombre}<span class="pl-carga-drill-go">→</span></div>`;
    const contItem = !isShow ? (typeof CONTENIDO !== 'undefined' ? CONTENIDO : []).find(c => c.nombre === cleanNombre) : null;
    if (contItem)
      return `<div class="pl-carga-drill-item" onclick="document.getElementById('pl-carga-modal').remove();openCdDetail('${contItem.id}')">${cleanNombre}<span class="pl-carga-drill-go">→</span></div>`;
    return `<div class="pl-carga-drill-item pl-carga-drill-plain">${nombre}</div>`;
  }).join('');
  overlay.innerHTML = `<div class="pl-carga-modal-box">
    <div class="pl-carga-modal-hdr">
      <div>
        <div class="pl-carga-modal-persona">${persona}</div>
        <div class="pl-carga-modal-periodo">${periodo} · ${items.length} asignación${items.length !== 1 ? 'es' : ''}</div>
      </div>
      <button class="pl-carga-modal-close" onclick="document.getElementById('pl-carga-modal').remove()">✕</button>
    </div>
    <div class="pl-carga-modal-list">${listHTML}</div>
  </div>`;
  overlay.addEventListener('click', ev => { if (ev.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

// ── COORDINACIÓN ──
function coordFilter(f, btn) {
  coordActiveFilter = f;
  document.querySelectorAll('#coord-filter-tabs .filter-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  buildCoordinacion();
}
function coordShowStatus(s, idx) {
  const f = s.fichaTecnica;
  const fichaCompleta = !!(f && (f.sonido || f.luces || f.backline || f.video || f.catering || f.riderArtista));
  const secciones = s.roadmap || [];
  const totalTasks = secciones.reduce((a, sec) => a + sec.tasks.length, 0);
  const doneTasks = secciones.reduce((a, sec) => a + sec.tasks.filter(t => t.est === "Listo").length, 0);
  const roadmapPct = totalTasks ? Math.round(doneTasks / totalTasks * 100) : 0;
  const presupPersonalizado = !!s.presupuesto;
  const items = (typeof CONTENIDO !== 'undefined' ? CONTENIDO : []).filter(c => c.showIdx === idx);
  const pub = items.filter(c => c.estado === 'Publicado').length;
  const pendientes = items.length - pub;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaShow = s.fecha ? new Date(s.fecha + "T12:00:00") : null;
  const diasFaltan = fechaShow ? Math.round((fechaShow - hoy) / (1000 * 60 * 60 * 24)) : null;
  const esPasado = s.estado === "Realizado" || s.estado === "Cancelado" || (diasFaltan !== null && diasFaltan < 0);
  const esProximo = diasFaltan !== null && diasFaltan >= 0 && diasFaltan <= 21;
  let semaforo = "grey";
  if (!esPasado) {
    const sinContenido = items.length === 0;
    const roadmapBajo = roadmapPct < 50;
    const faltaFicha = !fichaCompleta;
    if (esProximo && (sinContenido || roadmapBajo || faltaFicha)) { semaforo = "red"; } else if (!fichaCompleta || roadmapPct < 100 || items.length === 0) { semaforo = "yellow"; } else { semaforo = "green"; }
  }
  return { fichaCompleta, roadmapPct, totalTasks, presupPersonalizado, items, pub, pendientes, diasFaltan, esPasado, esProximo, semaforo };
}
function buildCoordinacion() {
  const body = document.getElementById("coord-body");
  if (!body) return;
  let rows = SHOWS.map((s, idx) => ({ s, idx, st: coordShowStatus(s, idx) }));
  rows.sort((a, b) => (a.s.fecha || "").localeCompare(b.s.fecha || ""));
  if (coordActiveFilter === 'proximos') { rows = rows.filter(r => !r.st.esPasado); } else if (coordActiveFilter === 'riesgo') { rows = rows.filter(r => r.st.semaforo === 'red' || r.st.semaforo === 'yellow'); }
  const totalRiesgo = SHOWS.filter((s, idx) => { const st = coordShowStatus(s, idx); return !st.esPasado && st.semaforo === 'red'; }).length;
  const totalProximos = SHOWS.filter((s, idx) => !coordShowStatus(s, idx).esPasado).length;
  const totalContenidoPendiente = (typeof CONTENIDO !== 'undefined' ? CONTENIDO : []).filter(c => c.estado !== 'Publicado').length;
  const statsHTML = `<div class="cd-stats-row" style="margin-bottom:16px;"><div class="stat-card"><div class="lbl">Shows próximos</div><div class="val">${totalProximos}</div><div class="sub">no realizados todavía</div></div><div class="stat-card"><div class="lbl">En riesgo</div><div class="val" style="color:var(--r600)">${totalRiesgo}</div><div class="sub">requieren atención ya</div></div><div class="stat-card"><div class="lbl">Contenido pendiente</div><div class="val" style="color:var(--b600)">${totalContenidoPendiente}</div><div class="sub">piezas sin publicar</div></div></div>`;
  if (!rows.length) { body.innerHTML = statsHTML + `<div class="card" style="text-align:center;color:#bbb;padding:40px;">No hay shows que coincidan con este filtro.</div>`; return; }
  const semColor = { red: "coord-sem-red", yellow: "coord-sem-yellow", green: "coord-sem-green", grey: "coord-sem-grey" };
  const deptLabel = (ok, warnCond, okTxt, warnTxt, badTxt) => { if (ok) return `<span class="coord-dept-ok">✅ ${okTxt}</span>`; if (warnCond) return `<span class="coord-dept-warn">🟡 ${warnTxt}</span>`; return `<span class="coord-dept-bad">⚠️ ${badTxt}</span>`; };
  const rowsHTML = rows.map(({ s, idx, st }) => {
    const rowClass = st.semaforo === 'red' ? 'coord-row-risk' : '';
    const diasTxt = st.esPasado ? 'Realizado' : (st.diasFaltan === 0 ? 'Hoy' : st.diasFaltan === 1 ? 'Mañana' : `En ${st.diasFaltan} días`);
    return `<tr class="${rowClass}" onclick="goToShowDetailFull(${idx},'info')"><td style="padding-left:14px;"><div style="font-weight:600;">${s.nombre}</div><div style="font-size:10px;color:#aaa;">${fmtDate(s.fecha)} · ${diasTxt}</div></td><td>${deptLabel(st.fichaCompleta, false, 'Completa', '', 'Sin datos')}</td><td>${st.totalTasks ? `<div class="coord-mini-bar"><div class="coord-mini-fill" style="width:${st.roadmapPct}%;background:${st.roadmapPct === 100 ? 'var(--t600)' : st.roadmapPct >= 50 ? '#d9a72c' : 'var(--r600)'}"></div></div> <span style="font-size:11px;color:#888;">${st.roadmapPct}%</span>` : `<span class="coord-dept-bad">⚠️ Sin hoja de ruta</span>`}</td><td>${st.presupPersonalizado ? `<span class="coord-dept-ok">✅ Personalizado</span>` : `<span class="coord-dept-warn">🟡 Plantilla</span>`}</td><td>${st.items.length ? `<span style="font-size:11px;">${st.items.length} piezas · <span style="color:var(--t600);font-weight:600;">${st.pub} pub.</span>${st.pendientes ? ` · <span style="color:#b8860b;">${st.pendientes} pend.</span>` : ''}</span><button class="btn" style="font-size:9px;padding:2px 6px;margin-left:6px;" onclick="event.stopPropagation();goToShowDetailFull(${idx},'cdshow')">Ver</button></td>` : `<span class="coord-dept-bad">⚠️ Sin contenido</span>`}</td><td style="text-align:center;"><span class="coord-semaforo ${semColor[st.semaforo]}" title="${{ red: "Urgente", yellow: "Atención", green: "Encaminado", grey: "Show pasado" }[st.semaforo]}"></span></td></tr>`;
  }).join("");
  body.innerHTML = statsHTML + `<div class="card" style="padding:0;overflow:hidden;"><table class="tbl"><thead><tr><th style="padding-left:14px">Show</th><th>Ficha técnica</th><th>Hoja de ruta</th><th>Presupuesto</th><th>Contenido digital</th><th style="text-align:center;">Estado</th></tr></thead><tbody>${rowsHTML}</tbody></table></div>`;
}