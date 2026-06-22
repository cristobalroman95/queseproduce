const CD_STORAGE_KEY = 'qp_contenido_v1';
const CD_TIPOS = ['Reel promo','Paid ad','Orgánico','Stream / clip','Viral','Canje / collab','Otro'];
const CD_ESTADOS = ['Idea','En producción','Listo para publicar','Publicado'];
const CD_PLATAFORMAS = ['IG + TikTok','Instagram','TikTok','Meta Ads','YouTube','Todas las redes','Otra'];

const CD_ETAPAS_DEFAULT=['Idea / Brief','Guion','Grabación','Edición','Aprobación interna','Correcciones','Publicación'];
const CD_TASK_ESTADOS=['pendiente','en_progreso','hecho'];
const CD_TASK_EMOJIS={pendiente:'○',en_progreso:'◑',hecho:'●'};
const CD_TASK_LABELS={pendiente:'Pendiente',en_progreso:'En progreso',hecho:'Hecho'};

const CD_MET_PLATAFORMAS=['Instagram','TikTok','YouTube','Facebook','Twitter/X','Otra'];
const CD_MET_CAMPOS=['views','likes','comentarios','guardados','reach','shares'];
const CD_MET_LABELS={views:'👁 Views',likes:'❤️ Likes',comentarios:'💬 Comentarios',guardados:'🔖 Guardados',reach:'📡 Alcance',shares:'🔁 Compartidos'};

let CONTENIDO = [];
let cdEditingId = null;
let cdActiveFilter = 'todos';
let cdDetailId=null;
let cdDetailActiveTab='info';

let _ganttDayWidth=30;
let _ganttRowHeight=42;
let _ganttCollapsed={};
let _ganttItemsCache=[];
let _ganttZoomTouched=false;

let _cdTasksCache={};
let _cdLogsCache={};
let _cdMetricasCache={};
let _cdRefActiveCat='todas';

const CD_FIELD_MAP={
  nombre:'nombre', tipo:'tipo', plataforma:'plataforma', estado:'estado',
  responsable:'responsable', fecha:'fecha', fechaInicio:'fecha_inicio',
  fechaIdea:'fecha_idea', url:'url', notas:'notas', showIdx:'show_id'
};
const CD_REF_CATS=['Moodboard','Brief visual','Guion / Texto','Grabación','Edición','Entrega final','Otros'];

// ── LOAD CONTENIDO ──
// ── LOAD CONTENIDO ──
async function loadContenido(){
  try{
    const {data,error}=await sb.from("contenido_digital").select("*").order("id",{ascending:true});
    if(error){ toast("⚠️ Error cargando contenido digital: "+error.message); return []; }
    
    // Si la tabla está vacía, insertar los datos de ejemplo
    if(data && data.length === 0 && typeof DEFAULT_CONTENIDO !== 'undefined'){
      toast("📦 Cargando contenido digital de ejemplo...");
      const showIdToIdx={};
      SHOWS.forEach((s,i)=>{ if(s.id)showIdToIdx[s.id]=i; });
      
      // Convertir showIdx (índice en el array de shows) a show_id real
      const payload = DEFAULT_CONTENIDO.map(item => {
        const showId = (item.showIdx !== null && item.showIdx !== undefined) ? SHOWS[item.showIdx]?.id : null;
        return {
          nombre: item.nombre,
          tipo: item.tipo,
          plataforma: item.plataforma,
          estado: item.estado,
          responsable: item.responsable,
          fecha: item.fecha || null,
          fecha_inicio: item.fechaInicio || null,
          fecha_idea: item.fechaIdea || null,
          show_id: showId,
          url: item.url || "",
          notas: item.notas || ""
        };
      });
      
      const {data:inserted, error:insError} = await sb.from("contenido_digital").insert(payload).select();
      if(insError){ 
        toast("⚠️ Error insertando contenido de ejemplo: "+insError.message);
        return [];
      }
      
      // Construir el array CONTENIDO con los datos insertados
      const showIdToIdx2 = {};
      SHOWS.forEach((s,i)=>{ if(s.id)showIdToIdx2[s.id]=i; });
      
      const result = (inserted||[]).map(row => ({
        id: row.id,
        nombre: row.nombre||"",
        tipo: row.tipo||"Reel promo",
        plataforma: row.plataforma||"IG + TikTok",
        estado: row.estado||"Idea",
        responsable: row.responsable||"Editor",
        fecha: row.fecha||"",
        fechaInicio: row.fecha_inicio||"",
        fechaIdea: row.fecha_idea||"",
        showIdx: row.show_id != null ? (showIdToIdx2[row.show_id] ?? null) : null,
        url: row.url||"",
        notas: row.notas||""
      }));
      
      toast("✅ Contenido digital de ejemplo cargado");
      return result;
    }
    
    // Si ya hay datos, cargarlos normalmente
    const showIdToIdx={};
    SHOWS.forEach((s,i)=>{ if(s.id)showIdToIdx[s.id]=i; });
    return (data||[]).map(row=>({
      id:row.id,
      nombre:row.nombre||"",
      tipo:row.tipo||"Reel promo",
      plataforma:row.plataforma||"IG + TikTok",
      estado:row.estado||"Idea",
      responsable:row.responsable||"Editor",
      fecha:row.fecha||"",
      fechaInicio:row.fecha_inicio||"",
      fechaIdea:row.fecha_idea||"",
      showIdx:row.show_id!=null?(showIdToIdx[row.show_id]??null):null,
      url:row.url||"",
      notas:row.notas||""
    }));
  }catch(e){ 
    toast("⚠️ Error de conexión cargando contenido digital"); 
    return []; 
  }
}

async function insertCdItem(item){
  try{
    const payload={
      nombre:item.nombre||"",tipo:item.tipo||"Reel promo",plataforma:item.plataforma||"IG + TikTok",
      estado:item.estado||"Idea",responsable:item.responsable||"Editor",
      fecha:item.fecha||null,fecha_inicio:item.fechaInicio||null,fecha_idea:item.fechaIdea||null,
      show_id:item.showIdx!=null?(SHOWS[item.showIdx]?.id||null):null,
      url:item.url||"",notas:item.notas||"",
    };
    const {data,error}=await sb.from("contenido_digital").insert(payload).select();
    if(error){ toast("⚠️ Error guardando pieza: "+error.message); return null; }
    return data?.[0]?.id ?? null;
  }catch(e){ toast("⚠️ Error de conexión al guardar pieza"); return null; }
}
async function deleteCdItem(id){
  try{
    const {error}=await sb.from("contenido_digital").delete().eq("id",id).select();
    if(error){ toast("⚠️ Error eliminando pieza: "+error.message); return false; }
    return true;
  }catch(e){ toast("⚠️ Error de conexión al eliminar pieza"); return false; }
}

function cdTipoClass(tipo){
  if(tipo==='Reel promo')return'cd-tipo-reel';
  if(tipo==='Paid ad')return'cd-tipo-paid';
  if(tipo==='Orgánico')return'cd-tipo-org';
  if(tipo==='Stream / clip')return'cd-tipo-stream';
  if(tipo==='Viral')return'cd-tipo-viral';
  if(tipo==='Canje / collab')return'cd-tipo-canje';
  return'cd-tipo-otro';
}
function cdEstClass(est){
  if(est==='Idea')return'cd-est-idea';
  if(est==='En producción')return'cd-est-prod';
  if(est==='Listo para publicar')return'cd-est-listo';
  if(est==='Publicado')return'cd-est-pub';
  return'cd-est-idea';
}
function cdEstEmoji(est){
  if(est==='Idea')return'💡';
  if(est==='En producción')return'🎬';
  if(est==='Listo para publicar')return'✅';
  if(est==='Publicado')return'🚀';
  return'💡';
}
function cdFilteredItems(){
  if(cdActiveFilter==='todos')return CONTENIDO;
  return CONTENIDO.filter(c=>c.tipo===cdActiveFilter);
}
function cdFilter(tipo,btn){
  cdActiveFilter=tipo;
  document.querySelectorAll('#cd-filter-tabs .filter-tab').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  buildContenido();
}

// ── GANTT HELPERS ──
function weekKey(d){
  const mon=new Date(d);
  mon.setDate(d.getDate()-((d.getDay()+6)%7));
  return mon.toISOString().slice(0,10);
}
function weekLabel(d){
  const mon=new Date(d);
  mon.setDate(d.getDate()-((d.getDay()+6)%7));
  const sun=new Date(mon);sun.setDate(mon.getDate()+6);
  const opts={day:'numeric',month:'short'};
  return mon.toLocaleDateString('es-CL',opts)+' – '+sun.toLocaleDateString('es-CL',opts);
}
function groupByWeek(items){
  const weeks={};
  const today=new Date();
  for(let w=0;w<8;w++){
    const d=new Date(today);
    d.setDate(d.getDate()-d.getDay()+1+w*7);
    const key=weekKey(d);
    if(!weeks[key])weeks[key]={label:weekLabel(d),items:[],monday:new Date(d)};
  }
  items.forEach(item=>{
    if(!item.fecha){
      const k='sin-fecha';
      if(!weeks[k])weeks[k]={label:'Sin fecha',items:[],monday:null};
      weeks[k].items.push(item);
      return;
    }
    const d=new Date(item.fecha+'T12:00:00');
    const key=weekKey(d);
    if(!weeks[key])weeks[key]={label:weekLabel(d),items:[],monday:new Date(d)};
    weeks[key].items.push(item);
  });
  return weeks;
}
function cdGanttColor(tipo){
  const map={'Reel promo':'#1D9E75','Paid ad':'#BA7517','Orgánico':'#6C5CE7','Stream / clip':'#378ADD','Viral':'#E04B3A','Canje / collab':'#8E88B5','Otro':'#8077B0'};
  return map[tipo]||'#8077B0';
}

function renderGanttControls(){
  const el=document.getElementById('cd-gantt-controls');
  if(!el)return;
  el.innerHTML=`
    <div class="gantt-controls">
      <div class="gantt-control-item"><label>🔍 Zoom tiempo</label><input type="range" min="6" max="50" step="1" value="${_ganttDayWidth}" oninput="setGanttDayWidth(this.value)"></div>
      <div class="gantt-control-item"><label>↕ Alto filas</label><div class="gantt-vslider-wrap"><input type="range" min="26" max="60" step="2" value="${_ganttRowHeight}" oninput="setGanttRowHeight(this.value)"></div></div>
      <button class="btn" style="font-size:10px;" onclick="expandAllGanttGroups()">Expandir todo</button>
      <button class="btn" style="font-size:10px;" onclick="collapseAllGanttGroups()">Colapsar todo</button>
    </div>`;
}
function setGanttDayWidth(v){_ganttZoomTouched=true;_ganttDayWidth=parseInt(v);buildContenidoGantt(_ganttItemsCache);}
function setGanttRowHeight(v){_ganttZoomTouched=true;_ganttRowHeight=parseInt(v);buildContenidoGantt(_ganttItemsCache);}
function toggleGanttGroup(key){_ganttCollapsed[key]=!_ganttCollapsed[key];buildContenidoGantt(_ganttItemsCache);}
function expandAllGanttGroups(){_ganttCollapsed={};buildContenidoGantt(_ganttItemsCache);}
function collapseAllGanttGroups(){
  const items=_ganttItemsCache.filter(it=>it.fecha||it.fechaInicio);
  const keys=new Set(items.map(it=>it.showIdx!=null?('show-'+it.showIdx):'sin-show'));
  keys.forEach(k=>_ganttCollapsed[k]=true);
  buildContenidoGantt(_ganttItemsCache);
}
function syncGanttVertical(source){
  const other=source.id==='gantt-labels-col'?document.getElementById('gantt-scroll-col'):document.getElementById('gantt-labels-col');
  if(other && other.scrollTop!==source.scrollTop)other.scrollTop=source.scrollTop;
}
function ganttLabelColWidth(visibleRows,rowHeight){
  const canvas=ganttLabelColWidth._c||(ganttLabelColWidth._c=document.createElement('canvas'));
  const ctx=canvas.getContext('2d');
  let max=0;
  visibleRows.forEach(row=>{
    if(row.type==='group'){
      ctx.font='700 11px Inter, sans-serif';
      const txt='▾ '+(row.isUngrouped?'📦':'🎭')+' '+row.label;
      const w=ctx.measureText(txt).width+20+6+26;
      if(w>max)max=w;
    } else {
      const size=rowHeight<34?'10px':'11px';
      ctx.font='400 '+size+' Inter, sans-serif';
      const w=ctx.measureText(row.item.nombre).width+32;
      if(w>max)max=w;
    }
  });
  const minW=window.innerWidth<640?110:150;
  const maxW=Math.round(Math.min(window.innerWidth*0.42,360));
  return Math.max(minW,Math.min(Math.ceil(max)+4,maxW));
}
function buildContenidoGantt(items){
  const container=document.getElementById('cd-gantt-container');
  if(!container)return;
  const withDates=items.filter(it=>it.fecha||it.fechaInicio||it.fechaIdea);
  if(!withDates.length){
    container.innerHTML=`<div class="card" style="text-align:center;color:#bbb;padding:40px;margin-top:14px;">Ninguna pieza tiene fecha asignada todavía. Agregá una fecha de inicio y/o fecha objetivo para verla en el timeline.</div>`;
    return;
  }
  const resolvedAll=withDates.map(it=>{
    let idea=it.fechaIdea?new Date(it.fechaIdea+'T12:00:00'):null;
    let ini=it.fechaInicio?new Date(it.fechaInicio+'T12:00:00'):null;
    let fin=it.fecha?new Date(it.fecha+'T12:00:00'):null;
    if(!idea&&!ini)idea=null;
    if(!ini&&idea)ini=idea;
    if(!fin)fin=ini||idea;
    if(!ini)ini=fin;
    if(!idea)idea=ini;
    if(idea>ini){const t=idea;idea=ini;ini=t;}
    if(ini>fin){const t=ini;ini=fin;fin=t;}
    if(idea>fin){const t=idea;idea=fin;fin=t;}
    const hasPrep=it.fechaIdea&&it.fechaInicio;
    return{item:it,idea,ini,fin,hasPrep};
  });

  const groupMap={}; const groupOrder=[];
  resolvedAll.forEach(r=>{
    const key=r.item.showIdx!=null?('show-'+r.item.showIdx):'sin-show';
    if(!groupMap[key]){
      const label=r.item.showIdx!=null?(SHOWS[r.item.showIdx]?.nombre||'Show'):'Sin show vinculado';
      groupMap[key]={key,label,rows:[],isUngrouped:key==='sin-show'};
      groupOrder.push(key);
    }
    groupMap[key].rows.push(r);
  });
  groupOrder.sort((a,b)=>{
    if(a==='sin-show')return 1;
    if(b==='sin-show')return -1;
    const fa=SHOWS[groupMap[a].rows[0].item.showIdx]?.fecha||'';
    const fb=SHOWS[groupMap[b].rows[0].item.showIdx]?.fecha||'';
    return fa.localeCompare(fb);
  });

  let minDate=new Date(Math.min(...resolvedAll.map(r=>r.idea||r.ini)));
  let maxDate=new Date(Math.max(...resolvedAll.map(r=>r.fin)));
  const today=new Date();today.setHours(12,0,0,0);
  if(today<minDate)minDate=new Date(today);
  if(today>maxDate)maxDate=new Date(today);
  minDate.setDate(minDate.getDate()-2);
  maxDate.setDate(maxDate.getDate()+2);
  minDate.setHours(12,0,0,0);maxDate.setHours(12,0,0,0);

  const dayWidth=_ganttDayWidth;
  const rowHeight=_ganttRowHeight;
  const totalDays=Math.round((maxDate-minDate)/(1000*60*60*24))+1;
  const totalWidth=totalDays*dayWidth;

  const visibleRows=[];
  groupOrder.forEach(key=>{
    const g=groupMap[key];
    const collapsed=!!_ganttCollapsed[key];
    visibleRows.push({type:'group',key,label:g.label,count:g.rows.length,collapsed,isUngrouped:g.isUngrouped});
    if(!collapsed)g.rows.forEach(r=>visibleRows.push({type:'item',...r}));
  });
  const labelColWidth=ganttLabelColWidth(visibleRows,rowHeight);

  const dayCells=[]; const monthGroups=[]; let curMonth=null,curStart=0,curCount=0; const showDayNum=dayWidth>=14;
  for(let d=0;d<totalDays;d++){
    const date=new Date(minDate);date.setDate(minDate.getDate()+d);
    const isWeekend=date.getDay()===0||date.getDay()===6;
    const isToday=date.toDateString()===today.toDateString();
    dayCells.push(`<div style="width:${dayWidth}px;flex-shrink:0;text-align:center;font-size:9px;color:${isToday?'#fff':'#9690C2'};background:${isToday?'var(--c400)':isWeekend?'rgba(255,255,255,0.04)':'transparent'};font-weight:${isToday?'700':'400'};border-radius:${isToday?'4px':'0'};padding:2px 0;">${showDayNum?date.getDate():''}</div>`);
    const monthLabel=date.toLocaleDateString('es-CL',{month:'short'}).toUpperCase().replace('.','');
    if(monthLabel!==curMonth){ if(curMonth!==null)monthGroups.push({label:curMonth,start:curStart,count:curCount}); curMonth=monthLabel;curStart=d;curCount=1;} else curCount++;
  }
  monthGroups.push({label:curMonth,start:curStart,count:curCount});
  const monthHTML=monthGroups.map(m=>`<div style="position:absolute;left:${m.start*dayWidth}px;width:${m.count*dayWidth}px;font-size:10px;font-weight:700;color:#B7B2DA;text-transform:uppercase;letter-spacing:0.5px;padding:4px 0 3px 4px;border-left:1px solid var(--border-soft);">${m.label}</div>`).join('');
  const todayOffset=Math.round((today-minDate)/(1000*60*60*24));
  const todayLineLeft=todayOffset*dayWidth+dayWidth/2;

  let cursorY=0; const labelRowsHTML=[]; const barsHTML=[]; const groupBgHTML=[];
  visibleRows.forEach(row=>{
    if(row.type==='group'){
      labelRowsHTML.push(`<div onclick="toggleGanttGroup('${row.key}')" style="height:${rowHeight}px;display:flex;align-items:center;gap:6px;padding:0 10px;font-size:11px;font-weight:700;color:#fff;background:rgba(255,255,255,0.06);border-bottom:0.5px solid var(--border-soft);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
        <span style="display:inline-block;transition:transform 0.15s;transform:rotate(${row.collapsed?'-90':'0'}deg);">▾</span> ${row.isUngrouped?'📦':'🎭'} ${row.label} <span style="font-size:9px;color:#9690C2;font-weight:400;margin-left:auto;flex-shrink:0;">${row.count}</span>
      </div>`);
      groupBgHTML.push(`<div style="position:absolute;left:0;top:${cursorY}px;width:${totalWidth}px;height:${rowHeight}px;background:rgba(255,255,255,0.06);"></div>`);
      cursorY+=rowHeight;
    } else {
      const{item,idea,ini,fin,hasPrep}=row;
      labelRowsHTML.push(`<div onclick="openCdDetail('${item.id}')" style="height:${rowHeight}px;display:flex;align-items:center;padding:0 10px 0 22px;font-size:${rowHeight<34?'10px':'11px'};color:#E4E1F7;border-bottom:0.5px solid var(--border-soft);cursor:pointer;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${item.nombre}</div>`);
      const color=cdGanttColor(item.tipo);
      const top=cursorY+Math.max(4,rowHeight*0.18);
      const barH=rowHeight-Math.max(8,rowHeight*0.36);
      const isPub=item.estado==='Publicado';
      const opacity=isPub?0.5:0.9;

      if(hasPrep){
        const prepOffsetDays=Math.round((idea-minDate)/(1000*60*60*24));
        const prepDurDays=Math.max(Math.round((ini-idea)/(1000*60*60*24)),1);
        const prepLeft=prepOffsetDays*dayWidth+2;
        const prepWidth=Math.max(prepDurDays*dayWidth-2,6);
        barsHTML.push(`<div onclick="openCdDetail('${item.id}')" title="Preproducción: ${fmtDate(item.fechaIdea)} → ${fmtDate(item.fechaInicio)}" style="position:absolute;left:${prepLeft}px;top:${top}px;width:${prepWidth}px;height:${barH}px;background:repeating-linear-gradient(135deg,${color}55 0px,${color}55 4px,${color}22 4px,${color}22 8px);border:1px solid ${color}88;border-radius:6px 0 0 6px;cursor:pointer;box-sizing:border-box;"></div>`);
        const prodOffsetDays=Math.round((ini-minDate)/(1000*60*60*24));
        const prodDurDays=Math.max(Math.round((fin-ini)/(1000*60*60*24))+1,1);
        const prodLeft=prodOffsetDays*dayWidth;
        const prodWidth=Math.max(prodDurDays*dayWidth-4,dayWidth-4);
        const showLabel=prodWidth>60;
        barsHTML.push(`<div onclick="openCdDetail('${item.id}')" title="${item.nombre} · Producción: ${fmtDate(item.fechaInicio)} → ${fmtDate(item.fecha)}" style="position:absolute;left:${prodLeft}px;top:${top}px;width:${prodWidth}px;height:${barH}px;background:${color};opacity:${opacity};border-radius:0 6px 6px 0;cursor:pointer;display:flex;align-items:center;padding:0 8px;font-size:10px;color:#fff;font-weight:600;overflow:hidden;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.25);">${showLabel?(cdEstEmoji(item.estado)+' '+item.nombre):cdEstEmoji(item.estado)}</div>`);
      } else {
        const offsetDays=Math.round((ini-minDate)/(1000*60*60*24));
        const durDays=Math.max(Math.round((fin-ini)/(1000*60*60*24))+1,1);
        const left=offsetDays*dayWidth+2;
        const width=Math.max(durDays*dayWidth-4,dayWidth-4);
        const showLabel=width>60;
        barsHTML.push(`<div onclick="openCdDetail('${item.id}')" title="${item.nombre} · ${fmtDate(item.fecha||item.fechaInicio)}" style="position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${barH}px;background:${color};opacity:${opacity};border-radius:6px;cursor:pointer;display:flex;align-items:center;padding:0 8px;font-size:10px;color:#fff;font-weight:600;overflow:hidden;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.25);">${showLabel?(cdEstEmoji(item.estado)+' '+item.nombre):cdEstEmoji(item.estado)}</div>`);
      }
      cursorY+=rowHeight;
    }
  });

  const bodyHeight=cursorY;
  const weekendStripes=[];
  for(let d=0;d<totalDays;d++){
    const date=new Date(minDate);date.setDate(minDate.getDate()+d);
    if(date.getDay()===0||date.getDay()===6)weekendStripes.push(`<div style="position:absolute;left:${d*dayWidth}px;top:0;width:${dayWidth}px;height:100%;background:rgba(255,255,255,0.025);"></div>`);
  }

  const withoutDates=items.length-withDates.length;
  container.innerHTML=`
    ${withoutDates>0?`<div style="font-size:11px;color:#aaa;margin:10px 0;">⚠️ ${withoutDates} pieza${withoutDates!==1?'s':''} sin fecha asignada no se muestra${withoutDates!==1?'n':''} en el timeline.</div>`:''}
<div class="gantt-wrap" style="display:flex;border:0.5px solid var(--border-soft);border-radius:8px;overflow:hidden;margin-top:10px;max-height:70vh;max-width:100%;">
      <div class="gantt-labels" id="gantt-labels-col" onscroll="syncGanttVertical(this)" style="width:${labelColWidth}px;flex-shrink:0;background:var(--surface2);border-right:1px solid var(--border-soft);overflow-y:auto;">
        <div style="height:42px;border-bottom:1px solid var(--border-soft);position:sticky;top:0;background:var(--surface2);z-index:3;"></div>
        ${labelRowsHTML.join('')}
      </div>
<div class="gantt-scroll" id="gantt-scroll-col" onscroll="syncGanttVertical(this)" style="flex:1;min-width:0;overflow:auto;">
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
    <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;font-size:10px;color:#9690C2;">
      ${CD_TIPOS.map(t=>`<span style="display:flex;align-items:center;gap:5px;"><span style="width:9px;height:9px;border-radius:2px;background:${cdGanttColor(t)};display:inline-block;"></span>${t}</span>`).join('')}
    </div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:6px;font-size:10px;color:#9690C2;border-top:0.5px solid var(--border-soft);padding-top:8px;">
      <span style="display:flex;align-items:center;gap:5px;"><span style="width:16px;height:8px;border-radius:2px;background:repeating-linear-gradient(135deg,#9690C255 0px,#9690C255 4px,#9690C222 4px,#9690C222 8px);border:1px solid #9690C288;display:inline-block;"></span>Preproducción (idea → inicio producción)</span>
      <span style="display:flex;align-items:center;gap:5px;"><span style="width:16px;height:8px;border-radius:2px;background:#9690C2;display:inline-block;"></span>Producción (inicio → publicación)</span>
    </div>`;
}

// ── BUILD CONTENIDO (main) ──
function buildContenido(){
  const body=document.getElementById('cd-body');
  if(!body)return;
  const view=document.getElementById('cd-view-sel')?.value||'kanban';
  const items=cdFilteredItems();

  const total=CONTENIDO.length;
  const pub=CONTENIDO.filter(c=>c.estado==='Publicado').length;
  const prod=CONTENIDO.filter(c=>c.estado==='En producción').length;
  const listo=CONTENIDO.filter(c=>c.estado==='Listo para publicar').length;
  const statsHTML=`<div class="cd-stats-row">
    <div class="stat-card"><div class="lbl">Total piezas</div><div class="val">${total}</div><div class="sub">en el período</div></div>
    <div class="stat-card"><div class="lbl">En producción</div><div class="val" style="color:var(--b600)">${prod}</div><div class="sub">siendo trabajadas</div></div>
    <div class="stat-card"><div class="lbl">Listas</div><div class="val" style="color:var(--a600)">${listo}</div><div class="sub">para publicar</div></div>
    <div class="stat-card"><div class="lbl">Publicadas</div><div class="val" style="color:var(--t600)">${pub}</div><div class="sub">ya en redes</div></div>
  </div>`;

  if(view==='kanban'){
    const weeks=groupByWeek(items);
    const cols=Object.entries(weeks).map(([key,week])=>{
      if(!week.items.length&&key!=='sin-fecha'){
        const mon=week.monday;
        const today=new Date();today.setHours(0,0,0,0);
        const diff=(mon-today)/(1000*60*60*24);
        if(diff>21)return'';
      }
      const cards=week.items.map(item=>cdCardHTML(item)).join('');
      const emptyMsg=!week.items.length?`<div style="font-size:11px;color:#ccc;text-align:center;padding:10px 0;">Sin contenido</div>`:'';
      return`<div class="cd-week-col">
        <div class="cd-week-hdr"><span>${week.label}</span><span class="cd-week-cnt">${week.items.length}</span></div>
        ${cards}${emptyMsg}
      </div>`;
    }).join('');
    body.innerHTML=statsHTML+`<div class="cd-kanban">${cols||'<div class="cd-empty">No hay piezas de contenido todavía. ¡Agregá la primera!</div>'}</div>`;
  } else if(view==='gantt'){
    if(!_ganttZoomTouched){_ganttDayWidth=window.innerWidth<640?16:30;_ganttRowHeight=window.innerWidth<640?34:42;}
    _ganttItemsCache=items;
    body.innerHTML=statsHTML+`<div id="cd-gantt-controls"></div><div id="cd-gantt-container"></div>`;
    renderGanttControls();
    buildContenidoGantt(items);
  } else {
    if(!items.length){body.innerHTML=statsHTML+`<div class="card"><div class="cd-empty">No hay piezas que coincidan con el filtro.</div></div>`;return;}
    const rows=items.map(item=>{
      const show=item.showIdx!=null?SHOWS[item.showIdx]:null;
      return`<tr onclick="openCdDetail('${item.id}')">
        <td style="padding-left:14px;font-weight:500;">${item.nombre}</td>
        <td><span class="cd-tipo-pill ${cdTipoClass(item.tipo)}">${item.tipo}</span></td>
        <td>${item.plataforma}</td>
        <td>${item.fecha?fmtDate(item.fecha):'—'}</td>
        <td>${item.responsable}</td>
        <td>${show?`<span style="font-size:10px;color:var(--p600);cursor:pointer;" onclick="event.stopPropagation();goToShowDetailFull(${item.showIdx},'cdshow')">↗ ${show.nombre}</span>`:'—'}</td>
        <td><span class="cd-est-pill ${cdEstClass(item.estado)}">${cdEstEmoji(item.estado)} ${item.estado}</span></td>
        <td><button class="btn" style="font-size:10px;padding:3px 8px;" onclick="event.stopPropagation();deleteCd('${item.id}')">✕</button></td>
      </tr>`;
    }).join('');
    body.innerHTML=statsHTML+`<div class="card" style="padding:0;overflow:hidden;">
      <table class="cd-list-tbl"><thead><tr><th style="padding-left:14px">Pieza</th><th>Tipo</th><th>Plataforma</th><th>Fecha</th><th>Responsable</th><th>Show vinculado</th><th>Estado</th><th></th></tr></thead>
      <tbody>${rows}</tbody></table>
    </div>`;
  }
}

function cdCardHTML(item){
  const show=item.showIdx!=null?SHOWS[item.showIdx]:null;
  const urlLink=item.url?`<a href="${item.url}" onclick="event.stopPropagation()" target="_blank" style="font-size:10px;color:var(--b600);">🔗 Ver</a>`:'';
  return`<div class="cd-card" onclick="openCdDetail('${item.id}')">
    <div class="cd-card-top"><div class="cd-card-nombre">${item.nombre}</div><button class="ph-close" style="font-size:11px;flex-shrink:0;" onclick="event.stopPropagation();deleteCd('${item.id}')" title="Eliminar">✕</button></div>
    <div class="cd-card-meta"><span class="cd-tipo-pill ${cdTipoClass(item.tipo)}">${item.tipo}</span><span class="cd-est-pill ${cdEstClass(item.estado)}">${cdEstEmoji(item.estado)} ${item.estado}</span></div>
    <div class="cd-card-meta" style="margin-top:4px;"><span>📱 ${item.plataforma}</span><span>👤 ${item.responsable}</span>${urlLink}</div>
    ${show?`<div class="cd-card-show" onclick="event.stopPropagation();goToShowDetailFull(${item.showIdx},'cdshow')" style="cursor:pointer;">↗ ${show.nombre}</div>`:''}
  </div>`;
}

// ── CONTENIDO MODAL ──
function openNewContenido(){
  cdEditingId=null;
  document.getElementById('cd-modal-title').textContent='Nueva pieza de contenido';
  document.getElementById('cd-f-nombre').value='';
  document.getElementById('cd-f-tipo').value='Reel promo';
  document.getElementById('cd-f-plataforma').value='IG + TikTok';
  document.getElementById('cd-f-estado').value='Idea';
  document.getElementById('cd-f-responsable').value='Editor';
  document.getElementById('cd-f-fecha').value='';
  document.getElementById('cd-f-fecha-inicio').value='';
  document.getElementById('cd-f-url').value='';
  document.getElementById('cd-f-notas').value='';
  const sel=document.getElementById('cd-f-show');
  sel.innerHTML='<option value="">— Sin show asociado —</option>'+SHOWS.map((s,i)=>`<option value="${i}">${s.nombre}</option>`).join('');
  sel.value='';
  document.getElementById('cd-modal-overlay').classList.add('open');
  document.getElementById('cd-f-nombre').focus();
}
function openNewContenidoForShow(showIdx){
  openNewContenido();
  const sel=document.getElementById('cd-f-show');
  if(sel)sel.value=showIdx;
}
function openEditContenido(id){
  const item=CONTENIDO.find(c=>String(c.id)===String(id));
  if(!item)return;
  cdEditingId=id;
  document.getElementById('cd-modal-title').textContent='Editar pieza';
  document.getElementById('cd-f-nombre').value=item.nombre||'';
  document.getElementById('cd-f-tipo').value=item.tipo||'Reel promo';
  document.getElementById('cd-f-plataforma').value=item.plataforma||'IG + TikTok';
  document.getElementById('cd-f-estado').value=item.estado||'Idea';
  document.getElementById('cd-f-responsable').value=item.responsable||'Editor';
  document.getElementById('cd-f-fecha').value=item.fecha||'';
  document.getElementById('cd-f-fecha-inicio').value=item.fechaInicio||'';
  document.getElementById('cd-f-url').value=item.url||'';
  document.getElementById('cd-f-notas').value=item.notas||'';
  const sel=document.getElementById('cd-f-show');
  sel.innerHTML='<option value="">— Sin show asociado —</option>'+SHOWS.map((s,i)=>`<option value="${i}">${s.nombre}</option>`).join('');
  sel.value=item.showIdx!=null?item.showIdx:'';
  document.getElementById('cd-modal-overlay').classList.add('open');
}
async function saveContenido(){
  const nombre=document.getElementById('cd-f-nombre').value.trim();
  if(!nombre){toast('⚠️ Ingresá un nombre para la pieza');return;}
  const showVal=document.getElementById('cd-f-show').value;
  const item={nombre,tipo:document.getElementById('cd-f-tipo').value,plataforma:document.getElementById('cd-f-plataforma').value,estado:document.getElementById('cd-f-estado').value,responsable:document.getElementById('cd-f-responsable').value,fecha:document.getElementById('cd-f-fecha').value,fechaInicio:document.getElementById('cd-f-fecha-inicio').value,showIdx:showVal!==''?parseInt(showVal):null,url:document.getElementById('cd-f-url').value.trim(),notas:document.getElementById('cd-f-notas').value.trim()};
  if(cdEditingId!=null){
    item.id=cdEditingId;
    const idx=CONTENIDO.findIndex(c=>String(c.id)===String(cdEditingId));
    if(idx>=0)CONTENIDO[idx]=item;
    await saveCdCampo(item, null);
    closeCdModal();
    buildContenido();
    renderFullDetailIfOpen();
    toast('✅ Pieza actualizada');
  } else {
    closeCdModal();
    const newId=await insertCdItem(item);
    if(newId==null)return;
    item.id=newId;
    CONTENIDO.push(item);
    buildContenido();
    renderFullDetailIfOpen();
    toast('✅ Pieza agregada');
  }
}
async function deleteCd(id){
  if(!confirm('¿Eliminar esta pieza de contenido?'))return;
  const ok=await deleteCdItem(id);
  if(!ok)return;
  CONTENIDO=CONTENIDO.filter(c=>String(c.id)!==String(id));
  buildContenido();
  renderFullDetailIfOpen();
  toast('🗑 Pieza eliminada');
}
function closeCdModal(){document.getElementById('cd-modal-overlay').classList.remove('open');cdEditingId=null;}
function closeCdModalOvl(e){if(e.target===document.getElementById('cd-modal-overlay'))closeCdModal();}

// ── CD FULL DETAIL ──
function openCdDetail(id){
  const item=CONTENIDO.find(c=>String(c.id)===String(id));
  if(!item)return;
  cdDetailId=id;
  cdDetailActiveTab='info';
  document.getElementById('cd-full-detail-overlay').classList.add('open');
  document.body.style.overflow='hidden';
  _refreshCdDetailHeader(item);
  cdDetailTab('info');
}
function _refreshCdDetailHeader(item){
  const show=item.showIdx!=null?SHOWS[item.showIdx]:null;
  document.getElementById('cd-fd-title').textContent=item.nombre||'Sin nombre';
  const parts=[]; if(item.tipo)parts.push(item.tipo); if(item.plataforma)parts.push(item.plataforma); if(show)parts.push('↗ '+show.nombre);
  document.getElementById('cd-fd-sub').textContent=parts.join(' · ');
}
function closeCdDetail(){document.getElementById('cd-full-detail-overlay').classList.remove('open');document.body.style.overflow='';cdDetailId=null;}
function closeCdDetailOvl(e){}
function cdDetailTab(tab){
  cdDetailActiveTab=tab;
  ['info','refs','progreso','bitacora','metricas'].forEach(t=>{
    const btn=document.getElementById('cd-fdt-'+t+'-btn');
    if(btn)btn.classList.toggle('active',t===tab);
  });
  const body=document.getElementById('cd-fd-body');
  const item=CONTENIDO.find(c=>String(c.id)===String(cdDetailId));
  if(!item){body.innerHTML='<div class="card" style="color:#bbb;padding:30px;">Pieza no encontrada.</div>';return;}
  if(tab==='info')body.innerHTML=cdInfoHTML(item);
  else if(tab==='refs'){ body.innerHTML=cdRefsHTML(item); initCdRefsZone(item.id); }
  else if(tab==='progreso'){ body.innerHTML='<div style="color:#bbb;padding:20px;">Cargando...</div>'; loadCdTasks(item.id).then(tasks=>{ body.innerHTML=cdProgresoHTML(item,tasks); }); }
  else if(tab==='bitacora'){ body.innerHTML='<div style="color:#bbb;padding:20px;">Cargando...</div>'; loadCdLogs(item.id).then(logs=>{ body.innerHTML=cdBitacoraHTML(item,logs); }); }
  else if(tab==='metricas'){ body.innerHTML='<div style="color:#bbb;padding:20px;">Cargando...</div>'; loadCdMetricas(item.id).then(mets=>{ body.innerHTML=cdMetricasHTML(item,mets); }); }
}

function escHtml(str){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── CD INFO ──
function cdInfoHTML(item){
  const id=item.id;
  const showOpts='<option value="">— Sin show asociado —</option>'+SHOWS.map((s,i)=>`<option value="${i}"${item.showIdx===i?' selected':''}>${s.nombre}</option>`).join('');
  const field=(label,inner)=>`<div class="cd-info-field"><div class="cd-fl">${label}</div>${inner}</div>`;
  const textField=(label,fieldKey,value,placeholder='')=>field(label,`<div class="cd-inline-text" contenteditable="true" data-field="${fieldKey}" onblur="updateCdField('${id}','${fieldKey}',this.textContent)" style="outline:none;">${escHtml(value||'')}</div>`);
  const textareaField=(label,fieldKey,value,placeholder='')=>field(label,`<div class="cd-inline-textarea" contenteditable="true" data-field="${fieldKey}" onblur="updateCdField('${id}','${fieldKey}',this.textContent)" style="outline:none;">${escHtml(value||'')}</div>`);
  const selectField=(label,fieldKey,value,options)=>field(label,`<select class="cd-inline-select" onchange="updateCdField('${id}','${fieldKey}',this.value)">${options.map(o=>`<option${value===o?' selected':''}>${o}</option>`).join('')}</select>`);
  const dateField=(label,fieldKey,value)=>field(label,`<input type="date" class="cd-inline-select" style="cursor:pointer;" value="${value||''}" onchange="updateCdField('${id}','${fieldKey}',this.value)">`);
  const showField=field('Show vinculado',`<select class="cd-inline-select" onchange="updateCdField('${id}','showIdx',this.value)">${showOpts}</select>`);

  return`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;flex-wrap:wrap;gap:10px;">
    <div><span class="cd-tipo-pill ${cdTipoClass(item.tipo)}" style="font-size:12px;">${item.tipo}</span><span class="cd-est-pill ${cdEstClass(item.estado)}" style="font-size:12px;margin-left:8px;">${cdEstEmoji(item.estado)} ${item.estado}</span></div>
    <button class="btn" style="font-size:11px;color:#E04B3A;border-color:#E04B3A;" onclick="deleteCdFromDetail('${id}')">🗑 Eliminar pieza</button>
  </div>
  <div class="cd-info-grid">
    <div><div class="card"><h3>Identificación</h3>${textField('Nombre / descripción','nombre',item.nombre,'Ej: Reel promo Show Especial')}${selectField('Tipo de contenido','tipo',item.tipo,CD_TIPOS)}${selectField('Plataforma(s)','plataforma',item.plataforma,CD_PLATAFORMAS)}${showField}</div></div>
    <div><div class="card"><h3>Estado y responsable</h3>${selectField('Estado','estado',item.estado,CD_ESTADOS)}${selectField('Responsable','responsable',item.responsable,['Editor','Community Manager','Marketing','Producción','Artista'])}${dateField('Fecha idea / inicio preproducción','fechaIdea',item.fechaIdea)}${dateField('Fecha inicio producción','fechaInicio',item.fechaInicio)}${dateField('Fecha objetivo publicación','fecha',item.fecha)}</div></div>
  </div>
  <div class="card" style="margin-top:20px;"><h3>Detalles adicionales</h3>${textField('URL publicado (si ya salió)','url',item.url,'https://...')}${textareaField('Notas / brief / referencias','notas',item.notas,'Contexto, referencias visuales, indicaciones...')}</div>
  <p style="font-size:10px;color:#bbb;margin-top:12px;">Todos los campos se guardan automáticamente al hacer clic afuera o cambiar el valor.</p>`;
}

async function saveCdCampo(item, changedField){
  const dbField=CD_FIELD_MAP[changedField];
  let dbValue;
  if(changedField==='showIdx'){ dbValue=item.showIdx!=null?(SHOWS[item.showIdx]?.id||null):null; }
  else if(changedField==='fecha'||changedField==='fechaInicio'||changedField==='fechaIdea'){ dbValue=item[changedField]||null; }
  else { dbValue=item[changedField]||''; }
  const payload=dbField?{[dbField]:dbValue}:{nombre:item.nombre||'',tipo:item.tipo||'',plataforma:item.plataforma||'',estado:item.estado||'',responsable:item.responsable||'',fecha:item.fecha||null,fecha_inicio:item.fechaInicio||null,fecha_idea:item.fechaIdea||null,url:item.url||'',notas:item.notas||'',show_id:item.showIdx!=null?(SHOWS[item.showIdx]?.id||null):null};
  try{
    const {error}=await sb.from('contenido_digital').update(payload).eq('id',item.id);
    if(error)toast('\u26a0\ufe0f Error guardando campo: '+error.message);
  }catch(e){ toast('\u26a0\ufe0f Error de conexion al guardar'); }
}
function updateCdField(id,field,rawValue){
  const item=CONTENIDO.find(c=>String(c.id)===String(id)); if(!item)return;
  const value=typeof rawValue==='string'?rawValue.trim():rawValue;
  if(field==='showIdx'){ item.showIdx=value!==''&&value!==null?parseInt(value):null; }
  else if(field==='fechaIdea'||field==='fechaInicio'||field==='fecha'){ item[field]=value||''; }
  else { item[field]=value; }
  _refreshCdDetailHeader(item);
  saveCdCampo(item, field);
  const view=document.getElementById('cd-view-sel')?.value||'kanban';
  if(view!=='gantt') buildContenido();
}
async function deleteCdFromDetail(id){
  if(!confirm('¿Eliminar esta pieza de contenido?'))return;
  const ok=await deleteCdItem(id);
  if(!ok)return;
  CONTENIDO=CONTENIDO.filter(c=>String(c.id)!==String(id));
  buildContenido();
  renderFullDetailIfOpen();
  closeCdDetail();
  toast('🗑 Pieza eliminada');
}

// ── CD REFERENCIAS ──
function cdRefsHTML(item){
  const canUpload=currentUser&&ROLE_DEFS[currentUser.rol]?.canEdit;
  const pref='cdref';
  return`<div id="cdref-wrap" style="max-width:900px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
      <div><span style="font-size:13px;font-weight:700;color:#F5F4FB;">Referencias y archivos</span><span class="media-counter" id="cdref-media-cnt">—</span></div>
      ${canUpload?`<div style="display:flex;gap:7px;align-items:center;"><select id="cdref-upload-cat" style="font-size:11px;padding:5px 8px;border-radius:6px;border:0.5px solid var(--border-soft);background:var(--surface);color:#E4E1F7;">${CD_REF_CATS.map(c=>`<option value="${c}">${c}</option>`).join('')}</select><button class="btn" style="font-size:11px;" onclick="document.getElementById('cdref-file-input').click()">📁 Subir archivo</button><input type="file" id="cdref-file-input" accept="image/*" multiple style="display:none;" onchange="handleCdRefUpload(event,'${item.id}')"></div>`:''}
    </div>
    ${canUpload?`<div style="margin-bottom:14px;"><div class="media-url-row"><input type="url" id="cdref-url-input" placeholder="O pegá una URL de imagen (https://...)" style="font-size:12px;"><select id="cdref-url-cat" style="min-width:140px;">${CD_REF_CATS.map(c=>`<option value="${c}">${c}</option>`).join('')}</select><button class="btn btn-primary" style="font-size:11px;white-space:nowrap;" onclick="addCdRefUrl('${item.id}')">Agregar URL</button></div><div class="media-upload-zone" id="cdref-drop-zone" ondragover="event.preventDefault();this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')" ondrop="handleCdRefDrop(event,'${item.id}')"><div class="muz-icon">📎</div><div class="muz-label">Arrastrá referencias aquí, o usá el botón de arriba</div><div class="muz-sub">JPG, PNG, WEBP · Hasta 49 MB por archivo</div></div></div>`:''}
    <div class="media-cat-tabs" id="cdref-cat-tabs"><button class="media-cat-tab active" onclick="filterCdRefCat('todas','${item.id}')">Todas</button>${CD_REF_CATS.map(c=>`<button class="media-cat-tab" onclick="filterCdRefCat('${c}','${item.id}')">${c}</button>`).join('')}</div>
    <div class="media-grid large" id="cdref-media-grid"></div>
  </div>`;
}
async function loadCdRefPhotos(contenidoId){
  try{ const {data,error}=await sb.from('media_items').select('*').eq('contenido_id',contenidoId).order('created_at',{ascending:true}); if(error){toast('⚠️ Error cargando referencias: '+error.message);return[];} return (data||[]).map(row=>({id:row.id,src:row.url,cat:row.categoria||'Otros',label:row.label||'',path:row.storage_path||null,tipo:row.tipo||'foto'}));}catch(e){toast('⚠️ Error de conexión cargando referencias');return[];}
}
async function renderCdRefGrid(contenidoId){
  const grid=document.getElementById('cdref-media-grid'); const cntEl=document.getElementById('cdref-media-cnt'); if(!grid)return;
  grid.innerHTML=`<div class="media-empty" style="grid-column:1/-1;color:#666;">Cargando...</div>`;
  const photos=await loadCdRefPhotos(contenidoId); const canUpload=currentUser&&ROLE_DEFS[currentUser.rol]?.canEdit;
  const filtered=_cdRefActiveCat==='todas'?photos:photos.filter(p=>p.cat===_cdRefActiveCat);
  if(cntEl){const n=photos.length;cntEl.textContent=n+' archivo'+(n!==1?'s':'');}
  CD_REF_CATS.forEach(c=>{ const btns=document.querySelectorAll('#cdref-cat-tabs .media-cat-tab'); btns.forEach(b=>{if(b.textContent.replace(/\s*\(\d+\)/,'')===c){const n=photos.filter(p=>p.cat===c).length;b.textContent=c+(n>0?` (${n})`:``); }}); });
  if(!filtered.length){ grid.innerHTML=`<div class="media-empty" style="grid-column:1/-1;">${_cdRefActiveCat==='todas'?'Todavía no hay referencias cargadas para esta pieza.':'No hay archivos en esta categoría.'}</div>`; return; }
  _lbPhotos=filtered;
  grid.innerHTML=filtered.map((p,i)=>`<div class="media-thumb" onclick="openLightbox(${i})"><img src="${p.src}" alt="${p.label||''}" loading="lazy">${canUpload?`<select class="media-cat-badge media-cat-badge-sel" onclick="event.stopPropagation()" onchange="event.stopPropagation();changeCdRefCat('${contenidoId}','${p.id}',this.value)">${CD_REF_CATS.map(c=>`<option value="${c}" ${c===(p.cat||'Otros')?'selected':''}>${c}</option>`).join('')}</select>`:`<div class="media-cat-badge">${p.cat||'Otros'}</div>`}<div class="media-thumb-overlay"><div class="media-thumb-label">${p.label||p.cat||''}</div></div>${canUpload?`<button class="media-thumb-del" onclick="event.stopPropagation();confirmDeleteCdRef('${contenidoId}','${p.id}')" title="Eliminar">✕</button>`:''}</div>`).join('');
}
function filterCdRefCat(cat,contenidoId){ _cdRefActiveCat=cat; document.querySelectorAll('#cdref-cat-tabs .media-cat-tab').forEach(b=>{ b.classList.toggle('active',b.textContent.replace(/\s*\(\d+\)/,'')===(cat==='todas'?'Todas':cat)||(cat==='todas'&&b.textContent==='Todas')); }); renderCdRefGrid(contenidoId); }
async function saveCdRefFile(contenidoId,file,cat,label){ try{ const ext=file.name.split('.').pop()||'jpg'; const path=`contenido/${contenidoId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`; const {error:upErr}=await sb.storage.from(STORAGE_BUCKET).upload(path,file,{cacheControl:'3600',upsert:false}); if(upErr){toast('⚠️ Error subiendo archivo: '+upErr.message);return false;} const {data:urlData}=sb.storage.from(STORAGE_BUCKET).getPublicUrl(path); const {error:insErr}=await sb.from('media_items').insert({contenido_id:contenidoId,show_id:null,categoria:cat,label,url:urlData.publicUrl,storage_path:path,tipo:'foto'}); if(insErr){toast('⚠️ Error guardando referencia: '+insErr.message);return false;} return true; }catch(e){toast('⚠️ Error de conexión subiendo archivo');return false;} }
async function saveCdRefUrl(contenidoId,url,cat){ try{ const {data,error}=await sb.from('media_items').insert({contenido_id:contenidoId,show_id:null,categoria:cat,label:'',url,storage_path:null,tipo:'url'}).select(); if(error){toast('⚠️ Error guardando URL: '+error.message);return false;} return true; }catch(e){toast('⚠️ Error de conexión');return false;} }
async function changeCdRefCat(contenidoId,photoId,newCat){ const {data,error}=await sb.from('media_items').update({categoria:newCat}).eq('id',photoId).select(); if(error){toast('⚠️ Error cambiando categoría: '+error.message);return;} if(!data||data.length===0){toast('⚠️ No se actualizó ninguna fila — revisá RLS de UPDATE en media_items');return;} await renderCdRefGrid(contenidoId); }
async function confirmDeleteCdRef(contenidoId,photoId){ if(!confirm('¿Eliminar esta referencia?'))return; const {error}=await sb.from('media_items').delete().eq('id',photoId); if(error){toast('⚠️ Error eliminando: '+error.message);return;} await renderCdRefGrid(contenidoId); toast('🗑 Referencia eliminada'); }
async function handleCdRefUpload(e,contenidoId){ const files=Array.from(e.target.files);e.target.value='';if(!files.length)return; const cat=document.getElementById('cdref-upload-cat')?.value||CD_REF_CATS[0]; toast('⏳ Subiendo '+files.length+' archivo'+(files.length!==1?'s':'')+'...'); let ok=0; for(const f of files){const r=await saveCdRefFile(contenidoId,f,cat,f.name.replace(/\.[^.]+$/,''));if(r)ok++;} await renderCdRefGrid(contenidoId); toast('✅ '+ok+' archivo'+(ok!==1?'s':'')+' subido'+(ok!==1?'s':'')); }
async function handleCdRefDrop(e,contenidoId){ e.preventDefault(); document.getElementById('cdref-drop-zone')?.classList.remove('drag-over'); const files=Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith('image/')); if(!files.length){toast('⚠️ Solo se aceptan imágenes.');return;} const cat=document.getElementById('cdref-upload-cat')?.value||CD_REF_CATS[0]; let ok=0; for(const f of files){const r=await saveCdRefFile(contenidoId,f,cat,f.name.replace(/\.[^.]+$/,''));if(r)ok++;} await renderCdRefGrid(contenidoId); if(ok)toast('✅ '+ok+' archivo'+(ok!==1?'s':'')+' subido'+(ok!==1?'s':'')); }
async function addCdRefUrl(contenidoId){ const input=document.getElementById('cdref-url-input'); const cat=document.getElementById('cdref-url-cat')?.value||'Otros'; const url=input?.value.trim(); if(!url||!url.startsWith('http')){toast('⚠️ Ingresá una URL válida (https://...)');return;} const ok=await saveCdRefUrl(contenidoId,url,cat); if(ok){if(input)input.value='';await renderCdRefGrid(contenidoId);toast('✅ URL agregada');} }

// ── CD PROGRESO ──
async function loadCdTasks(contenidoId){ try{ const {data,error}=await sb.from('contenido_tasks').select('*').eq('contenido_id',contenidoId).order('orden',{ascending:true}); if(error){toast('⚠️ Error cargando tareas: '+error.message);return[];} _cdTasksCache[contenidoId]=data||[]; return _cdTasksCache[contenidoId]; }catch(e){toast('⚠️ Error de conexión');return[];} }
function cdProgresoHTML(item,tasks){ const id=item.id; const canEdit=currentUser&&ROLE_DEFS[currentUser.rol]?.canEdit; const done=tasks.filter(t=>t.estado==='hecho').length; const pct=tasks.length?Math.round(done/tasks.length*100):0;
  const taskRows=tasks.map((t,i)=>`<div class="cd-task-row" id="cdtask-row-${t.id}"><div class="cd-task-estado ${t.estado}" title="${CD_TASK_LABELS[t.estado]}" onclick="${canEdit?`cycleCdTaskEstado('${id}',${t.id})`:''}">${CD_TASK_EMOJIS[t.estado]||'○'}</div><div class="cd-task-etapa ${t.estado==='hecho'?'hecho':''}" contenteditable="${canEdit?'true':'false'}" onblur="${canEdit?`updateCdTaskEtapa('${id}',${t.id},this.textContent)`:''}" style="outline:none;">${escHtml(t.etapa)}</div><div class="cd-task-notas" contenteditable="${canEdit?'true':'false'}" onblur="${canEdit?`updateCdTaskNotas('${id}',${t.id},this.textContent)`:''}" style="outline:none;min-width:80px;${canEdit?'':'color:#666;'}" title="${escHtml(t.notas||'')}">${escHtml(t.notas||'—')}</div>${canEdit?`<button onclick="deleteCdTask('${id}',${t.id})" style="background:none;border:none;cursor:pointer;color:#666;font-size:14px;padding:0 4px;flex-shrink:0;" title="Eliminar etapa">✕</button>`:''}</div>`).join('');
  return`<div style="max-width:680px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:10px;"><div><span style="font-size:18px;font-weight:700;">${pct}%</span><span style="font-size:12px;color:#9690C2;margin-left:6px;">${done} de ${tasks.length} etapas completadas</span></div>${canEdit?`<button class="btn btn-primary" style="font-size:11px;" onclick="initCdTasks('${id}')">↺ Cargar etapas por defecto</button>`:''}</div><div style="background:var(--surface2);border-radius:6px;height:8px;margin-bottom:24px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:var(--p500);border-radius:6px;transition:width 0.3s;"></div></div><div class="card" style="padding:0 16px;"><div style="display:flex;gap:10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:#9690C2;padding:10px 0;border-bottom:1px solid var(--border-soft);"><div style="width:26px;flex-shrink:0;"></div><div style="flex:1;">Etapa</div><div style="width:200px;flex-shrink:0;">Notas</div>${canEdit?`<div style="width:24px;"></div>`:''}</div>${taskRows||`<div style="padding:20px 0;color:#666;font-size:13px;">No hay etapas definidas. ${canEdit?'Usá el botón para cargar las etapas por defecto, o agregá una personalizada abajo.':''}</div>`}</div>${canEdit?`<div style="margin-top:14px;display:flex;gap:8px;"><input id="cdtask-new-input" type="text" placeholder="Nueva etapa..." style="flex:1;background:var(--surface2);border:0.5px solid var(--border-soft);border-radius:8px;padding:9px 12px;font-size:13px;color:#E4E1F7;font-family:var(--font);"><button class="btn btn-primary" style="font-size:12px;" onclick="addCdTask('${id}')">+ Agregar</button></div>`:''}</div>`;
}
async function cycleCdTaskEstado(contenidoId,taskId){ const tasks=_cdTasksCache[contenidoId]||[]; const task=tasks.find(t=>t.id===taskId); if(!task)return; const idx=CD_TASK_ESTADOS.indexOf(task.estado); const next=CD_TASK_ESTADOS[(idx+1)%CD_TASK_ESTADOS.length]; const {error}=await sb.from('contenido_tasks').update({estado:next}).eq('id',taskId); if(error){toast('⚠️ Error actualizando estado: '+error.message);return;} task.estado=next; const body=document.getElementById('cd-fd-body'); if(body)body.innerHTML=cdProgresoHTML(CONTENIDO.find(c=>String(c.id)===String(contenidoId)),tasks); }
async function updateCdTaskEtapa(contenidoId,taskId,value){ const tasks=_cdTasksCache[contenidoId]||[]; const task=tasks.find(t=>t.id===taskId); if(!task||task.etapa===value.trim())return; task.etapa=value.trim(); await sb.from('contenido_tasks').update({etapa:task.etapa}).eq('id',taskId); }
async function updateCdTaskNotas(contenidoId,taskId,value){ const tasks=_cdTasksCache[contenidoId]||[]; const task=tasks.find(t=>t.id===taskId); const v=value.trim()==='—'?'':value.trim(); if(!task||task.notas===v)return; task.notas=v; await sb.from('contenido_tasks').update({notas:task.notas}).eq('id',taskId); }
async function addCdTask(contenidoId){ const input=document.getElementById('cdtask-new-input'); const etapa=input?.value.trim(); if(!etapa){toast('⚠️ Escribí el nombre de la etapa');return;} const tasks=_cdTasksCache[contenidoId]||[]; const orden=tasks.length?Math.max(...tasks.map(t=>t.orden))+1:0; const {data,error}=await sb.from('contenido_tasks').insert({contenido_id:contenidoId,etapa,orden,estado:'pendiente',notas:''}).select(); if(error){toast('⚠️ Error agregando etapa: '+error.message);return;} if(data&&data[0])tasks.push(data[0]); _cdTasksCache[contenidoId]=tasks; const body=document.getElementById('cd-fd-body'); if(body)body.innerHTML=cdProgresoHTML(CONTENIDO.find(c=>String(c.id)===String(contenidoId)),tasks); }
async function deleteCdTask(contenidoId,taskId){ if(!confirm('¿Eliminar esta etapa?'))return; const {error}=await sb.from('contenido_tasks').delete().eq('id',taskId); if(error){toast('⚠️ Error eliminando: '+error.message);return;} _cdTasksCache[contenidoId]=(_cdTasksCache[contenidoId]||[]).filter(t=>t.id!==taskId); const body=document.getElementById('cd-fd-body'); if(body)body.innerHTML=cdProgresoHTML(CONTENIDO.find(c=>String(c.id)===String(contenidoId)),_cdTasksCache[contenidoId]); }
async function initCdTasks(contenidoId){ if(!confirm('Esto cargará las etapas por defecto. Las etapas existentes no se borran — se agregan al final. ¿Continuar?'))return; const tasks=_cdTasksCache[contenidoId]||[]; const maxOrden=tasks.length?Math.max(...tasks.map(t=>t.orden))+1:0; const nuevas=CD_ETAPAS_DEFAULT.map((etapa,i)=>({contenido_id:contenidoId,etapa,orden:maxOrden+i,estado:'pendiente',notas:''})); const {data,error}=await sb.from('contenido_tasks').insert(nuevas).select(); if(error){toast('⚠️ Error: '+error.message);return;} (data||[]).forEach(t=>tasks.push(t)); _cdTasksCache[contenidoId]=tasks; const body=document.getElementById('cd-fd-body'); if(body)body.innerHTML=cdProgresoHTML(CONTENIDO.find(c=>String(c.id)===String(contenidoId)),tasks); toast('✅ Etapas por defecto cargadas'); }

// ── CD BITÁCORA ──
async function loadCdLogs(contenidoId){ try{ const {data,error}=await sb.from('contenido_logs').select('*').eq('contenido_id',contenidoId).order('created_at',{ascending:true}); if(error){toast('⚠️ Error cargando bitácora: '+error.message);return[];} _cdLogsCache[contenidoId]=data||[]; return _cdLogsCache[contenidoId]; }catch(e){toast('⚠️ Error de conexión');return[];} }
function cdBitacoraHTML(item,logs){ const id=item.id; const logEntries=logs.map(l=>`<div class="cd-log-entry"><div class="cd-log-meta"><span style="font-weight:700;color:#B7B2DA;">${escHtml(l.autor||'—')}</span><span>${new Date(l.created_at).toLocaleString('es-CL',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span>${currentUser&&(ROLE_DEFS[currentUser.rol]?.canEdit)?`<button onclick="deleteCdLog('${id}',${l.id})" style="background:none;border:none;cursor:pointer;color:#666;font-size:11px;margin-left:auto;padding:0;">✕ eliminar</button>`:''}</div><div class="cd-log-texto">${escHtml(l.texto)}</div></div>`).join('');
  return`<div style="max-width:680px;"><div class="cd-log-thread">${logEntries||`<div style="color:#666;font-size:13px;padding:16px 0;">No hay entradas en la bitácora todavía.</div>`}</div><div class="cd-log-input-row" style="margin-top:18px;"><textarea id="cdlog-new-text" placeholder="Anotá una actualización, decisión, comentario..."></textarea><button class="btn btn-primary" style="font-size:12px;white-space:nowrap;align-self:flex-end;" onclick="addCdLog('${id}')">Agregar ↵</button></div><p style="font-size:10px;color:#666;margin-top:8px;">Las entradas se registran con tu nombre (${escHtml(currentUser?.nombre||'—')}) y la fecha/hora actual.</p></div>`;
}
async function addCdLog(contenidoId){ const input=document.getElementById('cdlog-new-text'); const texto=input?.value.trim(); if(!texto){toast('⚠️ Escribí algo antes de agregar');return;} const autor=currentUser?.nombre||'Usuario'; const {data,error}=await sb.from('contenido_logs').insert({contenido_id:contenidoId,autor,texto}).select(); if(error){toast('⚠️ Error: '+error.message);return;} if(data&&data[0])(_cdLogsCache[contenidoId]=_cdLogsCache[contenidoId]||[]).push(data[0]); const body=document.getElementById('cd-fd-body'); if(body)body.innerHTML=cdBitacoraHTML(CONTENIDO.find(c=>String(c.id)===String(contenidoId)),_cdLogsCache[contenidoId]); toast('✅ Entrada agregada'); }
async function deleteCdLog(contenidoId,logId){ if(!confirm('¿Eliminar esta entrada?'))return; const {error}=await sb.from('contenido_logs').delete().eq('id',logId); if(error){toast('⚠️ Error: '+error.message);return;} _cdLogsCache[contenidoId]=(_cdLogsCache[contenidoId]||[]).filter(l=>l.id!==logId); const body=document.getElementById('cd-fd-body'); if(body)body.innerHTML=cdBitacoraHTML(CONTENIDO.find(c=>String(c.id)===String(contenidoId)),_cdLogsCache[contenidoId]); }

// ── CD MÉTRICAS ──
async function loadCdMetricas(contenidoId){ try{ const {data,error}=await sb.from('contenido_metricas').select('*').eq('contenido_id',contenidoId); if(error){toast('⚠️ Error cargando métricas: '+error.message);return[];} _cdMetricasCache[contenidoId]=data||[]; return _cdMetricasCache[contenidoId]; }catch(e){toast('⚠️ Error de conexión');return[];} }
function cdMetricasHTML(item,mets){ const id=item.id; const isPublicado=item.estado==='Publicado'; const plats=[...new Set([...(item.plataforma||'').split('+').map(p=>p.trim()).filter(Boolean),...mets.map(m=>m.plataforma)])].filter(Boolean);
  const totalPorCampo={}; CD_MET_CAMPOS.forEach(c=>{totalPorCampo[c]=mets.reduce((s,m)=>s+(parseInt(m[c])||0),0);});
  const cards=plats.map(plat=>{ const m=mets.find(r=>r.plataforma===plat)||{}; return`<div class="cd-met-card"><h4>📱 ${escHtml(plat)}</h4>${CD_MET_CAMPOS.map(c=>`<div class="cd-met-field"><label>${CD_MET_LABELS[c]}</label><input type="number" min="0" value="${m[c]||0}" placeholder="0" onchange="updateCdMetrica('${id}','${plat}','${c}',this.value)" ${isPublicado?'':'style="opacity:0.5;" title="Disponible cuando el estado es Publicado"'} ${isPublicado?'':'readonly'}></div>`).join('')}<div class="cd-met-field" style="margin-top:8px;align-items:flex-start;"><label style="padding-top:6px;">Notas</label><textarea style="flex:1;background:var(--surface);border:0.5px solid var(--border-soft);border-radius:6px;padding:5px 8px;font-size:12px;color:#E4E1F7;font-family:var(--font);resize:vertical;min-height:48px;" onblur="updateCdMetrica('${id}','${plat}','notas',this.value)" ${isPublicado?'':'readonly style="opacity:0.5;"'}>${escHtml(m.notas||'')}</textarea></div></div>`;}).join('');
  const totalsRow=CD_MET_CAMPOS.map(c=>`<div class="cd-met-total-row"><span>${CD_MET_LABELS[c]}</span><span>${totalPorCampo[c].toLocaleString('es-CL')}</span></div>`).join('');
  return`<div>${!isPublicado?`<div class="card" style="background:rgba(55,138,221,0.08);border-color:var(--b400);margin-bottom:18px;font-size:13px;color:#B7B2DA;">ℹ️ Las métricas se habilitan cuando el estado de la pieza es <strong>Publicado</strong>. Cambiá el estado en la pestaña Info para registrar resultados.</div>`:''}<div class="cd-met-grid">${cards||`<div style="color:#666;font-size:13px;">No hay plataformas definidas. Asigná una plataforma en la pestaña Info.</div>`}</div>${mets.length?`<div class="cd-met-totals" style="margin-top:20px;max-width:320px;"><h4>Totales consolidados</h4>${totalsRow}</div>`:''}</div>`;
}
async function updateCdMetrica(contenidoId,plataforma,campo,valor){ const mets=_cdMetricasCache[contenidoId]||[]; const existing=mets.find(m=>m.plataforma===plataforma);
  if(existing){ existing[campo]=campo==='notas'?valor:(parseInt(valor)||0); const {error}=await sb.from('contenido_metricas').update({[campo]:existing[campo]}).eq('id',existing.id); if(error)toast('⚠️ Error guardando métrica: '+error.message); } else { const nuevo={contenido_id:contenidoId,plataforma,views:0,likes:0,comentarios:0,guardados:0,reach:0,shares:0,notas:''}; nuevo[campo]=campo==='notas'?valor:(parseInt(valor)||0); const {data,error}=await sb.from('contenido_metricas').insert(nuevo).select(); if(error){toast('⚠️ Error: '+error.message);return;} if(data&&data[0])mets.push(data[0]); _cdMetricasCache[contenidoId]=mets; } }

// ── SHOW CONTENIDO VINCULADO ──
function fullDetailContenidoHTML(s,idx){
  const items=(typeof CONTENIDO!=='undefined'?CONTENIDO:[]).filter(c=>c.showIdx===idx);
  const pub=items.filter(c=>c.estado==='Publicado').length; const prod=items.filter(c=>c.estado==='En producción').length; const listo=items.filter(c=>c.estado==='Listo para publicar').length; const idea=items.filter(c=>c.estado==='Idea').length;
  const statsHTML=items.length?`<div class="cd-stats-row" style="margin-bottom:16px;"><div class="stat-card"><div class="lbl">Piezas vinculadas</div><div class="val">${items.length}</div><div class="sub">para este show</div></div><div class="stat-card"><div class="lbl">Idea</div><div class="val" style="color:#999">${idea}</div><div class="sub">por trabajar</div></div><div class="stat-card"><div class="lbl">En producción / listo</div><div class="val" style="color:var(--b600)">${prod+listo}</div><div class="sub">en curso</div></div><div class="stat-card"><div class="lbl">Publicadas</div><div class="val" style="color:var(--t600)">${pub}</div><div class="sub">ya en redes</div></div></div>`:'';
  const cards=items.length?`<div class="cd-kanban" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr));">${items.map(item=>cdCardHTML(item)).join('')}</div>`:`<div class="card" style="text-align:center;color:#bbb;padding:40px;">Todavía no hay contenido digital vinculado a este show.<br><br><button class="btn btn-primary" onclick="openNewContenidoForShow(${idx})">+ Vincular contenido nuevo</button></div>`;
  return`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;"><p style="font-size:11px;color:#aaa;margin:0;">Piezas de contenido digital (reels, paid ads, streams, etc.) asociadas a este show. Se gestionan desde acá o desde la sección general de Contenido digital.</p>${items.length?`<button class="btn btn-primary" style="flex-shrink:0;margin-left:12px;" onclick="openNewContenidoForShow(${idx})">+ Vincular contenido nuevo</button>`:''}</div>${statsHTML}${cards}`;
}