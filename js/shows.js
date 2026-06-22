let SHOWS = [];
let editingIdx = null;
let activeShowIdx = null;
let panelActiveTab = "ficha";
let fullDetailIdx = null;
let fullDetailActiveTab = "info";

// ── CONVERSIÓN DE FICHA ──
function fichaRowToFront(row){
  if(!row)return null;
  return{
    sonido:row.sonido||"",
    luces:row.luces||"",
    backline:row.backline||"",
    video:row.video||"",
    catering:row.catering||"",
    riderArtista:row.rider_artista||"",
    notasLibres:row.notas_libres||"",
    contactoVenue:{
      nombre:row.contacto_nombre||"",
      telefono:row.contacto_telefono||"",
      rol:row.contacto_rol||"",
    },
  };
}

// ── LOAD SHOWS ──
async function loadShows(){
  try{
    const {data,error}=await sb.from("shows").select("*").order("n",{ascending:true});
    if(error){ toast("⚠️ Error cargando shows: "+error.message); return []; }
    const {data:fichaRows,error:fichaError}=await sb.from("ficha_tecnica").select("*");
    if(fichaError){ toast("⚠️ Error cargando fichas técnicas: "+fichaError.message); }
    const fichaByShowId={};
    (fichaRows||[]).forEach(row=>{ fichaByShowId[row.show_id]=fichaRowToFront(row); });
    const {data:secRows,error:secError}=await sb.from("roadmap_secciones").select("*").order("orden",{ascending:true});
    if(secError){ toast("⚠️ Error cargando secciones de hoja de ruta: "+secError.message); }
    const {data:taskRows,error:taskError}=await sb.from("roadmap_tasks").select("*").order("orden",{ascending:true});
    if(taskError){ toast("⚠️ Error cargando tareas de hoja de ruta: "+taskError.message); }
    const tasksBySeccionId={};
    (taskRows||[]).forEach(t=>{
      if(!tasksBySeccionId[t.seccion_id])tasksBySeccionId[t.seccion_id]=[];
      tasksBySeccionId[t.seccion_id].push({
        i:t.hora_inicio||"", f:t.hora_fin||"", area:t.area||"",
        act:t.actividad||"", det:t.detalle||"", est:t.estado||"Pendiente",
      });
    });
    const roadmapByShowId={};
    (secRows||[]).forEach(sec=>{
      if(!roadmapByShowId[sec.show_id])roadmapByShowId[sec.show_id]=[];
      roadmapByShowId[sec.show_id].push({s:sec.titulo, tasks:tasksBySeccionId[sec.id]||[]});
    });
    const {data:presupRows,error:presupError}=await sb.from("presupuesto_items").select("*").order("id",{ascending:true});
    if(presupError){ toast("⚠️ Error cargando presupuestos: "+presupError.message); }
    const presupCategoriasByShowId={};
    const presupCatIndexByShowId={};
    (presupRows||[]).forEach(row=>{
      if(!presupCategoriasByShowId[row.show_id]){presupCategoriasByShowId[row.show_id]=[];presupCatIndexByShowId[row.show_id]={};}
      const cats=presupCategoriasByShowId[row.show_id];
      const catIndex=presupCatIndexByShowId[row.show_id];
      if(catIndex[row.categoria_key]===undefined){
        catIndex[row.categoria_key]=cats.length;
        cats.push({key:row.categoria_key,nombre:row.categoria_nombre,items:[]});
      }
      cats[catIndex[row.categoria_key]].items.push({desc:row.descripcion||"",monto:Number(row.monto)||0});
    });
    const {data:cierreRows,error:cierreError}=await sb.from("cierre_items").select("*").order("id",{ascending:true});
    const {data:invRows,error:invError}=await sb.from("invitados").select("*").order("id",{ascending:true});
    if(invError){ toast("⚠️ Error cargando invitados: "+invError.message); }
    const invitadosByShowId={};
    (invRows||[]).forEach(row=>{
      if(!invitadosByShowId[row.show_id])invitadosByShowId[row.show_id]=[];
      invitadosByShowId[row.show_id].push({
        nombre: row.nombre||"",
        rol:    row.rol||"",
        estado: row.estado||"Pendiente",
        pago:   Number(row.pago)||0,
      });
    });
    if(cierreError){ toast("⚠️ Error cargando cierres: "+cierreError.message); }
    const cierreCategoriasByShowId={};
    const cierreCatIndexByShowId={};
    (cierreRows||[]).forEach(row=>{
      if(!cierreCategoriasByShowId[row.show_id]){cierreCategoriasByShowId[row.show_id]=[];cierreCatIndexByShowId[row.show_id]={};}
      const cats=cierreCategoriasByShowId[row.show_id];
      const catIndex=cierreCatIndexByShowId[row.show_id];
      if(catIndex[row.categoria_key]===undefined){
        catIndex[row.categoria_key]=cats.length;
        cats.push({key:row.categoria_key,nombre:row.categoria_nombre,esIngreso:!!row.es_ingreso,items:[]});
      }
      cats[catIndex[row.categoria_key]].items.push({desc:row.descripcion||"",presup:Number(row.presup)||0,real:Number(row.real)||0});
    });
    let shows=(data||[]).map(row=>({
      id:row.id,
      n:row.n,
      nombre:row.nombre,
      venue:row.venue,
      ciudad:row.ciudad,
      fecha:row.fecha,
      hora:row.hora,
      aforo:row.aforo,
      ticket:Number(row.ticket),
      obj:Number(row.obj),
      tipo:row.tipo,
      estado:row.estado,
      vendidas:row.vendidas===null?null:Number(row.vendidas),
      notas:row.notas||"",
      fichaTecnica:fichaByShowId[row.id]||null,
      roadmap:roadmapByShowId[row.id]||null,
      presupuesto:presupCategoriasByShowId[row.id]?{categorias:presupCategoriasByShowId[row.id]}:null,
      cierre:cierreCategoriasByShowId[row.id]?{categorias:cierreCategoriasByShowId[row.id]}:null,
      invitados:invitadosByShowId[row.id]||null,
    }));
    const today=new Date(); today.setHours(0,0,0,0);
    shows.forEach(sh=>{
      if(!sh.roadmap)sh.roadmap=freshRoadmapFromPreset(presetKeyForTipo(sh.tipo));
      if(!sh.fichaTecnica)sh.fichaTecnica=defaultFichaTecnica();
      if(!sh.presupuesto)sh.presupuesto=defaultPresupuesto(sh.tipo);
      if(!sh.invitados)sh.invitados=[];
      if(!sh.cierre)sh.cierre=defaultCierre();
      if(sh.fecha){
        const fd=new Date(sh.fecha); fd.setHours(23,59,59);
        if(fd<today && (sh.estado==="Confirmado"||sh.estado==="Tentativo"||sh.estado==="En proceso")){
          sh.estado="Realizado";
        }
      }
    });
    return shows;
  }catch(e){
    toast("⚠️ Error de conexión cargando shows");
    return [];
  }
}

// ── SAVE SHOWS ──
async function saveShows(){
  try{
    const flattenInsert=s=>({
      n:s.n,nombre:s.nombre,venue:s.venue,ciudad:s.ciudad,
      fecha:s.fecha,hora:s.hora,aforo:s.aforo,ticket:s.ticket,obj:s.obj,
      tipo:s.tipo,estado:s.estado,vendidas:s.vendidas,notas:s.notas,
    });
    const flattenUpdate=s=>({
      id:s.id,n:s.n,nombre:s.nombre,venue:s.venue,ciudad:s.ciudad,
      fecha:s.fecha,hora:s.hora,aforo:s.aforo,ticket:s.ticket,obj:s.obj,
      tipo:s.tipo,estado:s.estado,vendidas:s.vendidas,notas:s.notas,
    });
    const nuevos=SHOWS.filter(s=>!s.id);
    const existentes=SHOWS.filter(s=>s.id).map(flattenUpdate);

    if(nuevos.length){
      const {data,error}=await sb.from("shows").insert(nuevos.map(flattenInsert)).select();
      if(error){ toast("⚠️ Error guardando shows nuevos: "+error.message); return; }
      data.forEach(row=>{
        const local=nuevos.find(s=>s.n===row.n && !s.id);
        if(local) local.id=row.id;
      });
      const fichaNuevas=nuevos.filter(s=>s.id).map(s=>({show_id:s.id}));
      if(fichaNuevas.length){
        const {error:fichaError}=await sb.from("ficha_tecnica").insert(fichaNuevas);
        if(fichaError){ toast("⚠️ Error creando ficha técnica: "+fichaError.message); }
      }
      const roadmapInserts=nuevos.filter(s=>s.id&&s.roadmap&&s.roadmap.length).map(s=>persistRoadmap(s));
      if(roadmapInserts.length)await Promise.all(roadmapInserts);
      const presupInserts=nuevos.filter(s=>s.id&&s.presupuesto&&s.presupuesto.categorias&&s.presupuesto.categorias.length).map(s=>persistPresupuesto(s));
      if(presupInserts.length)await Promise.all(presupInserts);
      const cierreInserts=nuevos.filter(s=>s.id&&s.cierre&&s.cierre.categorias&&s.cierre.categorias.length).map(s=>persistCierre(s));
      if(cierreInserts.length)await Promise.all(cierreInserts);
    }
    if(existentes.length){
      const {error}=await sb.from("shows").upsert(existentes,{onConflict:"id"});
      if(error){ toast("⚠️ Error guardando shows: "+error.message); }
    }
  }catch(e){
    toast("⚠️ Error de conexión guardando shows");
  }
}

// ── SHOWS TABLE ──
function buildShows(){
  const body=document.getElementById("shows-body");
  const role=currentUser?ROLE_DEFS[currentUser.rol]:null;
  const hideFin=role?!role.showFinancials:false;
  body.innerHTML=SHOWS.map((s,i)=>`
    <tr data-tipo="${s.tipo}" data-estado="${s.estado}" onclick="openPanel(${i})">
      <td style="padding-left:14px;color:#ccc;font-size:11px;">${s.n}</td>
      <td style="font-weight:500;"><span class="show-link">${s.nombre}</span></td>
      <td style="color:#777;">${s.venue}<br><span style="font-size:10px;color:#bbb;">${s.ciudad}</span></td>
      <td style="font-variant-numeric:tabular-nums;">${fmtDate(s.fecha)}<br><span style="font-size:10px;color:#bbb;">${s.hora}</span></td>
      <td><span class="tipo-pill ${tipoC(s.tipo)}">${s.tipo}</span></td>
      <td>${equipoStackHTML("show",s.id,3)}</td>
      <td>${s.aforo>0?s.aforo+"<br><span style='font-size:10px;color:#bbb;'>"+Math.round(s.obj*100)+"% obj.</span>":"—"}</td>
      <td style="font-variant-numeric:tabular-nums;">${hideFin?"—":(s.ticket>0?fmtCLP(s.ticket):"—")}</td>
      <td style="font-variant-numeric:tabular-nums;">${hideFin?"—":fmtM(ingr(s))}</td>
      <td>
        <select class="status-sel ${estC(s.estado)}" onclick="event.stopPropagation()" onchange="updateEstado(${i},this)">
          <option ${s.estado==="Confirmado"?"selected":""}>✅ Confirmado</option>
          <option ${s.estado==="Tentativo"?"selected":""}>⏳ Tentativo</option>
          <option ${s.estado==="En proceso"?"selected":""}>🔄 En proceso</option>
          <option ${s.estado==="Realizado"?"selected":""}>🎉 Realizado</option>
          <option ${s.estado==="Cancelado"?"selected":""}>❌ Cancelado</option>
        </select>
      </td>
    </tr>`).join("");
}

// ── DASHBOARD ──
function buildDash(){
  const body=document.getElementById("dash-body");
  body.innerHTML=SHOWS.map((s,realIdx)=>({s,realIdx})).filter(o=>o.s.estado!=="Cancelado").map(({s,realIdx})=>`
    <tr onclick="goToShow(${realIdx})">
      <td style="font-weight:500;"><span class="show-link">${s.nombre}</span></td>
      <td style="font-size:11px;">${fmtDate(s.fecha)}</td>
      <td style="font-size:11px;color:#888;">${s.ciudad}</td>
      <td><span class="tipo-pill ${tipoC(s.tipo)}">${s.tipo}</span></td>
      <td style="font-size:11px;">${s.aforo>0?s.aforo:"—"}</td>
      <td style="font-size:11px;">${s.ticket>0?fmtCLP(s.ticket):"—"}</td>
      <td><span style="font-size:11px;font-weight:500;">${estEmoji(s.estado)} ${s.estado}</span></td>
    </tr>`).join("");
}

function updateEstado(idx,sel){
  const raw=sel.value.replace(/[✅⏳🔄❌🎉]\s*/,"");
  SHOWS[idx].estado=raw;
  sel.className="status-sel "+estC(raw);
  const row=sel.closest("tr");if(row)row.dataset.estado=raw;
  saveShows();updateHeader();buildDash();
  toast("Estado actualizado → "+estEmoji(raw)+" "+raw);
}

function filterShows(f,btn){
  document.querySelectorAll(".filter-tab").forEach(t=>t.classList.remove("active"));
  btn.classList.add("active");
  document.querySelectorAll("#shows-body tr").forEach(r=>{
    if(f==="todos"){r.classList.remove("hidden");return;}
    const match=r.dataset.tipo?.includes(f)||r.dataset.estado?.includes(f);
    r.classList.toggle("hidden",!match);
  });
}

function goToShow(idx){
  const navItem=Array.from(document.querySelectorAll('.nav-item')).find(n=>n.getAttribute('onclick')&&n.getAttribute('onclick').includes("nav('shows'"));
  if(navItem)nav('shows',navItem);
  setTimeout(()=>openPanel(idx),60);
}
function goToShowByName(nombre){
  const idx=SHOWS.findIndex(s=>s.nombre===nombre);
  if(idx>=0)goToShow(idx);
  else toast('⚠️ No se encontró el show "'+nombre+'"');
}

// ── PANEL ──
function openPanel(idx){
  activeShowIdx=idx;
  const s=SHOWS[idx];
  document.getElementById("pnl-title").textContent=s.nombre;
  document.getElementById("pnl-sub").textContent=s.venue+" · "+s.ciudad;
  const allowed=getAllowedShowTabs();
  const tabDefs=[
  {key:"resumen",id:"pt-resumen-btn",arg:"resumen",label:"📋 Resumen"},
  {key:"info",id:"pt-info-btn",arg:"info",label:"ℹ️ Info"},
  {key:"ficha",id:"pt-ficha-btn",arg:"ficha",label:"📝 Ficha técnica"},
  {key:"equipo",id:"pt-equipo-btn",arg:"equipo",label:"👥 Equipo"},
  {key:"bitacora",id:"pt-bitacora-btn",arg:"bitacora",label:"💬 Bitácora"},
  {key:"roadmap",id:"pt-rm-btn",arg:"rm",label:"🗺 Hoja de ruta"},
  {key:"presupuesto",id:"pt-pres-btn",arg:"presupuesto",label:"💰 Presupuesto"},
  {key:"invitados",id:"pt-inv-btn",arg:"invitados",label:"🎫 Invitados"},
  {key:"cierre",id:"pt-cierre-btn",arg:"cierre",label:"📊 Cierre"},
  {key:"multimedia",id:"pt-media-btn",arg:"multimedia",label:"📷 Fotos"}
];
  const tabsHTML=tabDefs.filter(t=>allowed.includes(t.key)).map(t=>
    `<button class="pnl-tab" id="${t.id}" onclick="panelTab('${t.arg}',${idx})">${t.label}</button>`
  ).join("");
  const firstKey=allowed[0]||"ficha";
  const firstArg=firstKey==="roadmap"?"rm":firstKey;
  document.getElementById("pnl-body").innerHTML=`
    <div class="pnl-tabs">${tabsHTML}</div>
    <div id="pnl-tab-body"></div>
    <div style="padding:14px 0 0;text-align:center;">
      <button class="btn" style="font-size:11px;" onclick="goToShowDetailFull(${idx},'${firstKey}')">⤢ Ver detalle completo en página aparte</button>
    </div>`;
  panelTab(firstArg,idx);
  document.getElementById("panel-overlay").classList.add("open");
}

function panelTab(tab,idx){
  const allowed=getAllowedShowTabs();
  const canonical=tab==="rm"?"roadmap":tab;
  if(!allowed.includes(canonical)){
    const fb=allowed[0]||"ficha";
    tab=fb==="roadmap"?"rm":fb;
  }
  panelActiveTab=tab;
  ["resumen","info","ficha","equipo","bitacora","rm","pres","inv","cierre","media"].forEach(t=>{
    const btn=document.getElementById("pt-"+t+"-btn");
    const canonical=t==="rm"?"roadmap":t==="pres"?"presupuesto":t==="inv"?"invitados":t==="media"?"multimedia":t;
    if(btn)btn.classList.toggle("active",canonical===tab||t===tab);
  });
  const body=document.getElementById("pnl-tab-body");
  const s=SHOWS[idx];
  if(tab==="resumen")body.innerHTML=panelResumenHTML(s,idx);
  else if(tab==="info")body.innerHTML=panelInfoHTML(s,idx);
  else if(tab==="ficha")body.innerHTML=panelFichaHTML(s,idx);
  else if(tab==="equipo"){const canEdit=currentUser&&ROLE_DEFS[currentUser.rol]?.canEdit;body.innerHTML=equipoAsignadoHTML("show",s.id,canEdit);}
  else if(tab==="bitacora")body.innerHTML=notasHTML("show",s.id);
  else if(tab==="rm")body.innerHTML=panelRoadmapSummaryHTML(s,idx);
  else if(tab==="presupuesto")body.innerHTML=presupuestoShowHTML(s,idx,true);
  else if(tab==="invitados")body.innerHTML=invitadosHTML(s,idx,true);
  else if(tab==="cierre")body.innerHTML=cierreShowHTML(s,idx,true);
  else if(tab==="multimedia"){body.innerHTML=multimediaHTML(s,idx,true);initMultimediaZone(idx,true);}
}

function closePanel(){document.getElementById("panel-overlay").classList.remove("open");}
function closePanelOvl(e){if(e.target===document.getElementById("panel-overlay"))closePanel();}

// ── PANEL HTML FUNCTIONS ──
function panelResumenHTML(s,idx){
  const f=s.fichaTecnica||defaultFichaTecnica();
  const vc=f.contactoVenue||{};
  const entEst=Math.round(s.aforo*s.obj);
  return`
    <div class="ps">
      <h4>📍 Datos del evento</h4>
      <div class="pg">
        <div class="pf"><div class="fl">Nombre</div><div class="fv" style="font-weight:600;">${s.nombre}</div></div>
        <div class="pf"><div class="fl">Fecha</div><div class="fv">${fmtDate(s.fecha)}</div></div>
        <div class="pf"><div class="fl">Hora</div><div class="fv">${s.hora}</div></div>
        <div class="pf"><div class="fl">Venue</div><div class="fv">${s.venue}</div></div>
        <div class="pf"><div class="fl">Ciudad</div><div class="fv">${s.ciudad}</div></div>
        <div class="pf"><div class="fl">Estado</div><div class="fv">${estEmoji(s.estado)} ${s.estado}</div></div>
        <div class="pf"><div class="fl">Aforo total</div><div class="fv">${s.aforo>0?s.aforo+" personas":"—"}</div></div>
        <div class="pf"><div class="fl">Entradas estimadas</div><div class="fv">${entEst>0?entEst+" entradas":"—"}</div></div>
      </div>
    </div>
    ${vc.nombre||vc.telefono?`<div class="ps"><h4>📞 Contacto en sitio</h4>
      <div class="pg">
        ${vc.nombre?`<div class="pf"><div class="fl">Nombre</div><div class="fv">${vc.nombre}</div></div>`:""}
        ${vc.rol?`<div class="pf"><div class="fl">Rol</div><div class="fv">${vc.rol}</div></div>`:""}
        ${vc.telefono?`<div class="pf"><div class="fl">Teléfono</div><div class="fv"><a href="tel:${vc.telefono}" style="color:var(--p600)">${vc.telefono}</a></div></div>`:""}
      </div>
    </div>`:""}
    ${f.notasLibres?`<div class="ps"><h4>📝 Notas para el técnico</h4><p style="font-size:12px;color:#E4E1F7;line-height:1.7;white-space:pre-wrap;">${f.notasLibres}</p></div>`:""}
    ${s.notas?`<div class="ps"><h4>🗒 Notas del show</h4><p style="font-size:12px;color:#E4E1F7;line-height:1.7;">${s.notas}</p></div>`:""}`;
}

function panelInfoHTML(s,idx){
  const est=Math.round(s.aforo*s.obj);
  const ingrEst=est*s.ticket;
  const pct=s.vendidas&&s.aforo?Math.round(s.vendidas/s.aforo*100):0;
  return`
    <div class="ps"><h4>Identificación</h4>
      <div class="pg">
        <div class="pf"><div class="fl">Tipo</div><div class="fv"><span class="tipo-pill ${tipoC(s.tipo)}">${s.tipo}</span></div></div>
        <div class="pf"><div class="fl">Estado</div><div class="fv">${estEmoji(s.estado)} ${s.estado}</div></div>
        <div class="pf"><div class="fl">Fecha</div><div class="fv">${fmtDate(s.fecha)}</div></div>
        <div class="pf"><div class="fl">Hora</div><div class="fv">${s.hora}</div></div>
      </div>
    </div>
    <div class="ps"><h4>Aforo y entradas</h4>
      <div class="pg">
        <div class="pf"><div class="fl">Aforo total</div><div class="fv">${s.aforo>0?s.aforo+" personas":"N/A"}</div></div>
        <div class="pf"><div class="fl">Objetivo</div><div class="fv">${Math.round(s.obj*100)}%</div></div>
        <div class="pf"><div class="fl">Entradas estimadas</div><div class="fv">${est>0?est:"—"}</div></div>
        <div class="pf"><div class="fl">Entradas vendidas</div><div class="fv">${s.vendidas!=null?s.vendidas:"—"}</div></div>
      </div>
      ${s.vendidas&&s.aforo?`<div style="margin-top:8px;"><div style="font-size:10px;color:#aaa;margin-bottom:3px;">Ocupación actual: ${pct}%</div><div class="aforo-bar"><div class="aforo-fill" style="width:${pct}%"></div></div></div>`:""}
    </div>
    <div class="ps"><h4>Financiero estimado</h4>
      <div class="fr"><div class="frl">Ticket promedio</div><div class="frv">${fmtCLP(s.ticket)}</div></div>
      <div class="fr"><div class="frl">Ingreso estimado (${Math.round(s.obj*100)}% aforo)</div><div class="frv" style="color:var(--t600)">${fmtCLP(ingrEst)}</div></div>
      ${s.vendidas?`<div class="fr"><div class="frl">Ingreso real actual</div><div class="frv" style="color:var(--p600)">${fmtCLP(s.vendidas*s.ticket)}</div></div>`:""}
      <div class="ftot"><div class="ftl">Total estimado</div><div class="ftv">${fmtM(ingrEst)}</div></div>
    </div>
    ${s.notas?`<div class="ps"><h4>Notas</h4><p style="font-size:12px;color:#666;line-height:1.6;">${s.notas}</p></div>`:""}
    ${relatedShowsHTML(s,idx)}
    <div class="ps"><h4>Acciones</h4>
      <div style="display:flex;gap:7px;flex-wrap:wrap;">
        ${isTecnico()?"":`<button class="btn" onclick="openEditShow(${idx});closePanel();">✏️ Editar show</button>`}
        <button class="btn btn-primary" onclick="exportSingleShow(${idx});">⬇ Exportar ficha</button>
        <button class="btn" onclick="downloadShowComplete(${idx});" style="display:flex;align-items:center;gap:6px;background:var(--p600);border-color:var(--p400);color:#fff;font-weight:600;">⬇ Descargar show</button>
      </div>
    </div>`;
}

function panelFichaHTML(s,idx){
  const f=s.fichaTecnica||defaultFichaTecnica();
  const ro=isTecnico();
  const row=(label,field,value)=>ro?`
    <div class="pf" style="margin-bottom:10px;">
      <div class="fl">${label}</div>
      <div class="fv" style="min-height:18px;padding:2px 0;color:#E4E1F7;">${value||"<span style='color:#bbb;font-size:11px;'>Sin datos</span>"}</div>
    </div>`:`
    <div class="pf" style="margin-bottom:10px;">
      <div class="fl">${label}</div>
      <div class="fv" contenteditable="true" style="min-height:18px;border-bottom:1px dashed rgba(255,255,255,0.2);padding:2px 0;" onblur="updateFichaField(${idx},'${field}',this.textContent)">${value||""}</div>
    </div>`;
  const contactRow=(label,field,value)=>ro?`
    <div class="pf"><div class="fl">${label}</div><div class="fv">${value||"<span style='color:#bbb;font-size:11px;'>—</span>"}</div></div>`:`
    <div class="pf"><div class="fl">${label}</div><div class="fv" contenteditable="true" style="border-bottom:1px dashed rgba(255,255,255,0.2);" onblur="updateFichaContacto(${idx},'${field}',this.textContent)">${value||""}</div></div>`;
  return`
    <div class="ps"><h4>Requerimientos técnicos</h4>
      ${row("Sonido","sonido",f.sonido)}
      ${row("Luces","luces",f.luces)}
      ${row("Backline / escenario","backline",f.backline)}
      ${row("Video / pantallas","video",f.video)}
      ${row("Catering","catering",f.catering)}
    </div>
    <div class="ps"><h4>Contacto del venue</h4>
      <div class="pg">
        ${contactRow("Nombre","nombre",f.contactoVenue?.nombre)}
        ${contactRow("Teléfono","telefono",f.contactoVenue?.telefono)}
        ${contactRow("Rol","rol",f.contactoVenue?.rol)}
      </div>
    </div>
    <div class="ps"><h4>Rider del artista</h4>
      ${ro?`<div style="font-size:12px;color:#E4E1F7;line-height:1.6;">${f.riderArtista||"<span style='color:#bbb;'>Sin datos</span>"}</div>`:`<div class="fv" contenteditable="true" style="min-height:18px;border-bottom:1px dashed rgba(255,255,255,0.2);padding:2px 0;font-weight:400;" onblur="updateFichaField(${idx},'riderArtista',this.textContent)">${f.riderArtista||""}</div>`}
    </div>
    <div class="ps"><h4>Notas libres</h4>
      ${ro?`<div style="min-height:40px;font-size:12px;color:#E4E1F7;line-height:1.6;white-space:pre-wrap;">${f.notasLibres||"<span style='color:#bbb;'>Sin notas</span>"}</div>`:`<div contenteditable="true" style="min-height:60px;border:0.5px solid var(--border-soft);border-radius:7px;padding:8px;font-size:12px;color:#E4E1F7;" onblur="updateFichaField(${idx},'notasLibres',this.textContent)">${f.notasLibres||""}</div>`}
    </div>
    ${ro?"":` <p style="font-size:10px;color:#bbb;margin-top:6px;">Los campos se guardan automáticamente al hacer clic afuera.</p>`}`;
}

function panelRoadmapSummaryHTML(s,idx){
  const secciones=s.roadmap||[];
  const ro=isTecnico();
  if(!secciones.length){
    return`<div style="text-align:center;color:#bbb;font-size:12px;padding:30px 10px;">Este show no tiene hoja de ruta todavía.${ro?"":` <br><br><button class="btn btn-primary" onclick="openPresetPicker(${idx})">📋 Elegir preset o duplicar otra</button>`}</div>`;
  }
  const totalTasks=secciones.reduce((a,sec)=>a+sec.tasks.length,0);
  const doneTasks=secciones.reduce((a,sec)=>a+sec.tasks.filter(t=>t.est==="Listo").length,0);
  return`
    <div class="ps">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-size:11px;color:#9690C2;">${doneTasks} / ${totalTasks} tareas completadas</span>
        ${ro?"":` <button class="btn" style="font-size:10px;" onclick="openPresetPicker(${idx})">📋 Cambiar preset</button>`}
      </div>
      ${secciones.map(sec=>`
        <div style="margin-bottom:10px;">
          <div style="font-size:10px;font-weight:700;color:#B7B2DA;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;">${sec.s}</div>
          ${sec.tasks.map(t=>`<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:0.5px solid var(--border-soft);">
            <span style="color:${t.est==='Listo'?'#7A74A8':'#F5F4FB'};${t.est==='Listo'?'text-decoration:line-through;':''}">${t.act}</span>
            <span style="font-size:10px;color:#9690C2;">${t.i||""}</span>
          </div>`).join("")}
        </div>`).join("")}
      <button class="btn btn-primary" style="width:100%;margin-top:6px;" onclick="goToShowDetailFull(${idx},'roadmap')">⤢ Ver hoja de ruta completa</button>
    </div>`;
}

function relatedShowsHTML(s,idx){
  const related=SHOWS.map((o,i)=>({o,i})).filter(({o,i})=>i!==idx && o.venue===s.venue && s.venue && s.venue!=="Por confirmar");
  if(!related.length)return"";
  return`<div class="ps"><h4>Otros shows en ${s.venue}</h4>
    <div style="display:flex;flex-direction:column;gap:5px;">
      ${related.map(({o,i})=>`<div class="show-link" style="font-size:12px;padding:5px 0;" onclick="openPanel(${i})">${o.nombre} · ${fmtDate(o.fecha)}</div>`).join("")}
    </div>
  </div>`;
}

// ── FICHA TECNICA UPDATES ──
function updateFichaField(idx,field,value){
  if(!SHOWS[idx].fichaTecnica)SHOWS[idx].fichaTecnica=defaultFichaTecnica();
  SHOWS[idx].fichaTecnica[field]=value.trim();
  saveFichaTecnica(idx);
}
function updateFichaContacto(idx,field,value){
  if(!SHOWS[idx].fichaTecnica)SHOWS[idx].fichaTecnica=defaultFichaTecnica();
  if(!SHOWS[idx].fichaTecnica.contactoVenue)SHOWS[idx].fichaTecnica.contactoVenue={};
  SHOWS[idx].fichaTecnica.contactoVenue[field]=value.trim();
  saveFichaTecnica(idx);
}
async function saveFichaTecnica(idx){
  const s=SHOWS[idx];
  if(!s)return;
  if(!s.id){ toast("⚠️ Guardá el show antes de editar la ficha técnica"); return; }
  const f=s.fichaTecnica||defaultFichaTecnica();
  const payload={
    show_id:s.id,
    sonido:f.sonido||null,
    luces:f.luces||null,
    backline:f.backline||null,
    video:f.video||null,
    catering:f.catering||null,
    rider_artista:f.riderArtista||null,
    notas_libres:f.notasLibres||null,
    contacto_nombre:(f.contactoVenue&&f.contactoVenue.nombre)||null,
    contacto_telefono:(f.contactoVenue&&f.contactoVenue.telefono)||null,
    contacto_rol:(f.contactoVenue&&f.contactoVenue.rol)||null,
  };
  try{
    const {error}=await sb.from("ficha_tecnica").upsert(payload,{onConflict:"show_id"});
    if(error){ toast("⚠️ Error guardando ficha técnica: "+error.message); }
  }catch(e){
    toast("⚠️ Error de conexión guardando ficha técnica");
  }
}

// ── FULL DETAIL ──
function goToShowDetailFull(idx,tab){
  closePanel();
  fullDetailIdx=idx;
  const allowed=getAllowedShowTabs();
  fullDetailActiveTab=(tab&&allowed.includes(tab))?tab:(allowed[0]||"ficha");
  activeShowIdx=idx;
  const s=SHOWS[idx];
  document.getElementById("fd-title").textContent=s.nombre;
  document.getElementById("fd-sub").textContent=s.venue+" · "+s.ciudad+" · "+fmtDate(s.fecha)+" · "+s.hora;
  applyShowTabVisibility();
  document.getElementById("full-detail-overlay").classList.add("open");
  document.body.style.overflow="hidden";
  fullDetailTab(fullDetailActiveTab);
}
function closeFullDetail(){
  document.getElementById("full-detail-overlay").classList.remove("open");
  document.body.style.overflow="";
  fullDetailIdx=null;
}
function renderFullDetailIfOpen(){
  if(fullDetailIdx!==null && document.getElementById("full-detail-overlay").classList.contains("open")){
    fullDetailTab(fullDetailActiveTab);
  }
}
function fullDetailTab(tab){
  const allowed=getAllowedShowTabs();
  if(!allowed.includes(tab))tab=allowed[0]||"ficha";
  fullDetailActiveTab=tab;
  ["resumen","info","ficha","equipo","bitacora","roadmap","presupuesto","invitados","cdshow","cierre","multimedia"].forEach(t=>{
    const key=t==="roadmap"?"rm":t;
    const btn=document.getElementById("fd-"+key+"-btn");
    if(btn)btn.classList.toggle("active",t===tab);
  });
  const body=document.getElementById("fd-body");
  const s=SHOWS[fullDetailIdx];
  if(tab==="resumen")body.innerHTML=fullDetailResumenHTML(s,fullDetailIdx);
  else if(tab==="info")body.innerHTML=fullDetailInfoHTML(s,fullDetailIdx);
  else if(tab==="ficha")body.innerHTML=fullDetailFichaHTML(s,fullDetailIdx);
  else if(tab==="equipo"){const canEdit=currentUser&&ROLE_DEFS[currentUser.rol]?.canEdit;body.innerHTML=equipoAsignadoHTML("show",s.id,canEdit);}
  else if(tab==="bitacora")body.innerHTML=notasHTML("show",s.id);
  else if(tab==="roadmap")body.innerHTML=fullDetailRoadmapHTML(s,fullDetailIdx);
  else if(tab==="presupuesto")body.innerHTML=presupuestoShowHTML(s,fullDetailIdx,false);
  else if(tab==="invitados")body.innerHTML=invitadosHTML(s,fullDetailIdx,false);
  else if(tab==="cdshow")body.innerHTML=fullDetailContenidoHTML(s,fullDetailIdx);
  else if(tab==="cierre")body.innerHTML=cierreShowHTML(s,fullDetailIdx,false);
  else if(tab==="multimedia"){body.innerHTML=multimediaHTML(s,fullDetailIdx,false);initMultimediaZone(fullDetailIdx,false);}
}

function fullDetailResumenHTML(s,idx){
  const f=s.fichaTecnica||defaultFichaTecnica();
  const vc=f.contactoVenue||{};
  const entEst=Math.round(s.aforo*s.obj);
  return`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div class="card">
        <h3>📍 Datos del evento</h3>
        <div class="pg">
          <div class="pf"><div class="fl">Nombre</div><div class="fv" style="font-weight:600;">${s.nombre}</div></div>
          <div class="pf"><div class="fl">Fecha</div><div class="fv">${fmtDate(s.fecha)}</div></div>
          <div class="pf"><div class="fl">Hora</div><div class="fv">${s.hora}</div></div>
          <div class="pf"><div class="fl">Venue</div><div class="fv">${s.venue}</div></div>
          <div class="pf"><div class="fl">Ciudad</div><div class="fv">${s.ciudad}</div></div>
          <div class="pf"><div class="fl">Estado</div><div class="fv">${estEmoji(s.estado)} ${s.estado}</div></div>
          <div class="pf"><div class="fl">Aforo total</div><div class="fv">${s.aforo>0?s.aforo+" personas":"—"}</div></div>
          <div class="pf"><div class="fl">Entradas estimadas</div><div class="fv">${entEst>0?entEst+" entradas":"—"}</div></div>
        </div>
      </div>
      <div class="card">
        <h3>📞 Contacto en sitio</h3>
        ${vc.nombre||vc.telefono?`<div class="pg">
          ${vc.nombre?`<div class="pf"><div class="fl">Nombre</div><div class="fv">${vc.nombre}</div></div>`:""}
          ${vc.rol?`<div class="pf"><div class="fl">Rol</div><div class="fv">${vc.rol}</div></div>`:""}
          ${vc.telefono?`<div class="pf"><div class="fl">Teléfono</div><div class="fv"><a href="tel:${vc.telefono}" style="color:var(--p600);font-size:14px;font-weight:600;">${vc.telefono}</a></div></div>`:""}
        </div>`:`<p style="color:#bbb;font-size:12px;padding:16px 0;">Sin contacto de venue cargado todavía.<br>El productor puede ingresarlo en Ficha técnica.</p>`}
      </div>
    </div>
    ${f.notasLibres?`<div class="card" style="margin-top:20px;"><h3>📝 Notas para el técnico</h3><p style="font-size:13px;color:#E4E1F7;line-height:1.7;white-space:pre-wrap;">${f.notasLibres}</p></div>`:""}
    ${s.notas?`<div class="card" style="margin-top:20px;"><h3>🗒 Notas del show</h3><p style="font-size:13px;color:#E4E1F7;line-height:1.7;">${s.notas}</p></div>`:`<div class="card" style="margin-top:20px;background:var(--g50);"><p style="color:#bbb;font-size:12px;padding:8px 0;">Sin notas adicionales para este show.</p></div>`}`;
}

function fullDetailInfoHTML(s,idx){
  const est=Math.round(s.aforo*s.obj);
  const ingrEst=est*s.ticket;
  const pct=s.vendidas&&s.aforo?Math.round(s.vendidas/s.aforo*100):0;
  return`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div class="card">
        <h3>Identificación</h3>
        <div class="pg">
          <div class="pf"><div class="fl">Tipo</div><div class="fv"><span class="tipo-pill ${tipoC(s.tipo)}">${s.tipo}</span></div></div>
          <div class="pf"><div class="fl">Estado</div><div class="fv">${estEmoji(s.estado)} ${s.estado}</div></div>
          <div class="pf"><div class="fl">Fecha</div><div class="fv">${fmtDate(s.fecha)}</div></div>
          <div class="pf"><div class="fl">Hora</div><div class="fv">${s.hora}</div></div>
          <div class="pf"><div class="fl">Venue</div><div class="fv">${s.venue}</div></div>
          <div class="pf"><div class="fl">Ciudad</div><div class="fv">${s.ciudad}</div></div>
        </div>
      </div>
      <div class="card">
        <h3>Aforo y entradas</h3>
        <div class="pg">
          <div class="pf"><div class="fl">Aforo total</div><div class="fv">${s.aforo>0?s.aforo+" personas":"N/A"}</div></div>
          <div class="pf"><div class="fl">Objetivo</div><div class="fv">${Math.round(s.obj*100)}%</div></div>
          <div class="pf"><div class="fl">Entradas estimadas</div><div class="fv">${est>0?est:"—"}</div></div>
          <div class="pf"><div class="fl">Entradas vendidas</div><div class="fv">${s.vendidas!=null?s.vendidas:"—"}</div></div>
        </div>
        ${s.vendidas&&s.aforo?`<div style="margin-top:10px;"><div style="font-size:10px;color:#aaa;margin-bottom:3px;">Ocupación actual: ${pct}%</div><div class="aforo-bar"><div class="aforo-fill" style="width:${pct}%"></div></div></div>`:""}
      </div>
    </div>
    <div class="card" style="margin-top:20px;">
      <h3>Financiero estimado</h3>
      <div class="fr"><div class="frl">Ticket promedio</div><div class="frv">${fmtCLP(s.ticket)}</div></div>
      <div class="fr"><div class="frl">Ingreso estimado (${Math.round(s.obj*100)}% aforo)</div><div class="frv" style="color:var(--t600)">${fmtCLP(ingrEst)}</div></div>
      ${s.vendidas?`<div class="fr"><div class="frl">Ingreso real actual</div><div class="frv" style="color:var(--p600)">${fmtCLP(s.vendidas*s.ticket)}</div></div>`:""}
      <div class="ftot"><div class="ftl">Total estimado</div><div class="ftv">${fmtM(ingrEst)}</div></div>
    </div>
    ${s.notas?`<div class="card" style="margin-top:20px;"><h3>Notas</h3><p style="font-size:13px;color:#666;line-height:1.7;">${s.notas}</p></div>`:""}
    ${relatedShowsHTML(s,idx)?`<div class="card" style="margin-top:20px;">${relatedShowsHTML(s,idx).replace('<div class="ps">','').replace(/<\/div>$/,'')}</div>`:""}
    <div style="margin-top:20px;display:flex;gap:8px;">
      <button class="btn" onclick="openEditShow(${idx});closeFullDetail();">✏️ Editar datos del show</button>
      <button class="btn btn-primary" onclick="exportSingleShow(${idx});">⬇ Exportar ficha</button>
    </div>`;
}

function fullDetailFichaHTML(s,idx){
  const f=s.fichaTecnica||defaultFichaTecnica();
  const ro=isTecnico();
  const block=(label,field,value,placeholder)=>ro?`
    <div style="margin-bottom:16px;">
      <div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:5px;">${label}</div>
      <div style="min-height:40px;border:0.5px solid var(--border-soft);border-radius:8px;padding:10px 12px;font-size:13px;color:#E4E1F7;line-height:1.6;background:rgba(255,255,255,0.05);">${value||"<span style='color:#ccc;'>Sin datos</span>"}</div>
    </div>`:`
    <div style="margin-bottom:16px;">
      <div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:5px;">${label}</div>
      <div contenteditable="true" style="min-height:40px;border:0.5px solid var(--border-soft);border-radius:8px;padding:10px 12px;font-size:13px;color:#E4E1F7;line-height:1.6;" data-placeholder="${placeholder||''}" onblur="updateFichaField(${idx},'${field}',this.textContent)">${value||""}</div>
    </div>`;
  const contactField=(label,field,value)=>ro?`
    <div class="pf"><div class="fl">${label}</div><div class="fv">${value||"<span style='color:#bbb;font-size:11px;'>—</span>"}</div></div>`:`
    <div class="pf"><div class="fl">${label}</div><div class="fv" contenteditable="true" style="border-bottom:1px dashed rgba(255,255,255,0.2);" onblur="updateFichaContacto(${idx},'${field}',this.textContent)">${value||""}</div></div>`;
  return`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div class="card">
        <h3>Requerimientos técnicos</h3>
        ${block("Sonido","sonido",f.sonido,"Sistema PA, micrófonos, monitores, consola...")}
        ${block("Luces","luces",f.luces,"Tipo de iluminación, robóticos, cues especiales...")}
        ${block("Backline / escenario","backline",f.backline,"Tarima, atriles, mobiliario en escena...")}
        ${block("Video / pantallas","video",f.video,"LED, proyección, cámaras, streaming...")}
      </div>
      <div class="card">
        <h3>Producción y logística</h3>
        ${block("Catering","catering",f.catering,"Camarines, staff, invitados...")}
        <div style="margin-bottom:16px;">
          <div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:5px;">Contacto del venue</div>
          <div class="pg" style="border:0.5px solid var(--border-soft);border-radius:8px;padding:10px 12px;">
            ${contactField("Nombre","nombre",f.contactoVenue?.nombre)}
            ${contactField("Teléfono","telefono",f.contactoVenue?.telefono)}
            ${contactField("Rol","rol",f.contactoVenue?.rol)}
          </div>
        </div>
        ${block("Rider del artista","riderArtista",f.riderArtista,"Requerimientos específicos del artista...")}
      </div>
    </div>
    <div class="card" style="margin-top:20px;">
      <h3>Notas libres</h3>
      ${ro?`<div style="min-height:60px;font-size:13px;color:#E4E1F7;line-height:1.7;white-space:pre-wrap;">${f.notasLibres||"<span style='color:#bbb;'>Sin notas</span>"}</div>`:`<div contenteditable="true" style="min-height:90px;border:0.5px solid var(--border-soft);border-radius:8px;padding:12px;font-size:13px;color:#E4E1F7;line-height:1.7;" onblur="updateFichaField(${idx},'notasLibres',this.textContent)">${f.notasLibres||""}</div>`}
    </div>
    ${ro?"":` <p style="font-size:10px;color:#bbb;margin-top:10px;">Todos los campos se guardan automáticamente al hacer clic afuera.</p>`}`;
}

function fullDetailRoadmapHTML(s,idx){
  const secciones=s.roadmap||[];
  const ro=isTecnico();
  if(!secciones.length){
    return`<div class="card" style="text-align:center;color:#bbb;padding:40px;">Este show no tiene hoja de ruta todavía.${ro?"":` <br><br><button class="btn btn-primary" onclick="openPresetPicker(${idx})">📋 Elegir preset o duplicar otra</button>`}</div>`;
  }
  const totalTasks=secciones.reduce((a,sec)=>a+sec.tasks.length,0);
  const doneTasks=secciones.reduce((a,sec)=>a+sec.tasks.filter(t=>t.est==="Listo").length,0);
  return`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
      <div style="font-size:13px;color:#888;">${doneTasks} / ${totalTasks} tareas completadas — desglose con responsables por área</div>
      ${ro?"":` <div style="display:flex;gap:8px;">
        <button class="btn" onclick="addSection(${idx})">➕ Nueva sección</button>
        <button class="btn" onclick="openPresetPicker(${idx})">📋 Aplicar preset / duplicar otra</button>
      </div>`}
    </div>
    ${secciones.map((sec,si)=>`
      <div class="rm-section">
        <div class="rm-hdr">
          ${ro?`<span style="flex:1;">${sec.s}</span>`:`<span contenteditable="true" style="flex:1;" onblur="editSectionTitle(${idx},${si},this.textContent)">${sec.s}</span>
          <button class="btn" style="font-size:10px;padding:3px 8px;" onclick="addTask(${idx},${si})">+ Tarea</button>
          <button class="btn" style="font-size:10px;padding:3px 8px;" onclick="removeSection(${idx},${si})">🗑 Sección</button>`}
        </div>
        <div style="border:0.5px solid var(--border-soft);border-radius:8px;overflow:hidden;">
          <div style="display:grid;grid-template-columns:90px 1fr 1.3fr 130px 100px${ro?"":" 26px"};gap:8px;padding:6px 12px;background:rgba(255,255,255,0.05);font-size:9px;font-weight:700;color:#ccc;text-transform:uppercase;letter-spacing:0.5px;">
            <div>Horario</div><div>Actividad</div><div>Detalle</div><div>Responsable / Área</div><div>Estado</div>${ro?"":"<div></div>"}
          </div>
          ${sec.tasks.map((t,ti)=>`
            <div class="task-row" style="grid-template-columns:90px 1fr 1.3fr 130px 100px${ro?"":" 26px"};${t.est==="Listo"?"opacity:0.45":""}">
              ${ro?`<div class="t-time">${t.i}${t.f?"–"+t.f:""}</div>
              <div class="t-act">${t.act}</div>
              <div class="t-det">${t.det}</div>
              <div class="t-area">${t.area}</div>
              <div><span class="tss" style="${tskC(t.est)};padding:3px 7px;border-radius:4px;font-size:10px;">${t.est==="Listo"?"✅ Listo":t.est==="En curso"?"▶ En curso":t.est==="Cancelado"?"✕ Cancelado":"□ Pendiente"}</span></div>`:`
              <div class="t-time" contenteditable="true" onblur="editTaskField(${idx},${si},${ti},'i',this.textContent)">${t.i}${t.f?"–"+t.f:""}</div>
              <div class="t-act" contenteditable="true" onblur="editTaskField(${idx},${si},${ti},'act',this.textContent)">${t.act}</div>
              <div class="t-det" contenteditable="true" onblur="editTaskField(${idx},${si},${ti},'det',this.textContent)">${t.det}</div>
              <div class="t-area" contenteditable="true" onblur="editTaskField(${idx},${si},${ti},'area',this.textContent)">${t.area}</div>
              <div><select class="tss" style="${tskC(t.est)}" onchange="updateTask(${idx},${si},${ti},this);renderFullDetailIfOpen();">
                <option ${t.est==="Listo"?"selected":""}>✅ Listo</option>
                <option ${t.est==="En curso"?"selected":""}>▶ En curso</option>
                <option ${t.est==="Pendiente"?"selected":""}>□ Pendiente</option>
                <option ${t.est==="Cancelado"?"selected":""}>✕ Cancelado</option>
              </select></div>
              <div><button class="ph-close" style="font-size:12px;" title="Eliminar tarea" onclick="removeTask(${idx},${si},${ti})">✕</button></div>`}
            </div>`).join("")}
        </div>
      </div>`).join("")}`;
}

// ── MODAL SHOW ──
function openNewShow(){editingIdx=null;document.getElementById("modal-title").textContent="Nuevo show";clearForm();const db=document.getElementById("delete-show-btn");if(db)db.style.display="none";document.getElementById("modal-overlay").classList.add("open");}
function openEditShow(idx){
  editingIdx=idx;
  const s=SHOWS[idx];
  document.getElementById("modal-title").textContent="Editar show";
  document.getElementById("f-nombre").value=s.nombre||"";
  document.getElementById("f-tipo").value=s.tipo||"Teatro";
  document.getElementById("f-estado").value=s.estado||"Tentativo";
  document.getElementById("f-venue").value=s.venue||"";
  document.getElementById("f-ciudad").value=s.ciudad||"";
  document.getElementById("f-fecha").value=s.fecha||"";
  document.getElementById("f-hora").value=s.hora||"20:00";
  document.getElementById("f-aforo").value=s.aforo||"";
  document.getElementById("f-obj").value=s.obj||"";
  document.getElementById("f-ticket").value=s.ticket||"";
  document.getElementById("f-vendidas").value=s.vendidas||"";
  document.getElementById("f-notas").value=s.notas||"";
  const db=document.getElementById("delete-show-btn");
  if(db)db.style.display=(currentUser&&ROLE_DEFS[currentUser.rol]?.canEdit)?"block":"none";
  document.getElementById("modal-overlay").classList.add("open");
}
function clearForm(){["f-nombre","f-venue","f-ciudad","f-fecha","f-aforo","f-obj","f-ticket","f-vendidas","f-notas"].forEach(id=>document.getElementById(id).value="");document.getElementById("f-hora").value="20:00";}
function closeModal(){document.getElementById("modal-overlay").classList.remove("open");}
function closeModalOvl(e){if(e.target===document.getElementById("modal-overlay"))closeModal();}
async function deleteShow(){
  if(editingIdx==null)return;
  const s=SHOWS[editingIdx];
  if(!s)return;
  if(!confirm("¿Eliminar el show \""+s.nombre+"\" definitivamente?\n\nSe borra también su ficha técnica, hoja de ruta, presupuesto, cierre, invitados, equipo asignado, bitácora y multimedia.\nLas piezas de Contenido Digital vinculadas NO se borran, solo quedan sin show asociado.\n\nEsta acción no se puede deshacer."))return;
  const showId=s.id;
  try{
    await sb.from("ficha_tecnica").delete().eq("show_id",showId);
    const {data:secs}=await sb.from("roadmap_secciones").select("id").eq("show_id",showId);
    const secIds=(secs||[]).map(x=>x.id);
    if(secIds.length)await sb.from("roadmap_tasks").delete().in("seccion_id",secIds);
    await sb.from("roadmap_secciones").delete().eq("show_id",showId);
    await sb.from("presupuesto_items").delete().eq("show_id",showId);
    await sb.from("cierre_items").delete().eq("show_id",showId);
    await sb.from("invitados").delete().eq("show_id",showId);
    await sb.from("media_items").delete().eq("show_id",showId);
    await sb.from("asignaciones").delete().eq("entity_type","show").eq("entity_id",showId);
    await sb.from("notas_equipo").delete().eq("entity_type","show").eq("entity_id",showId);
    await sb.from("contenido_digital").update({show_id:null}).eq("show_id",showId);
    const {error}=await sb.from("shows").delete().eq("id",showId);
    if(error){toast("⚠️ Error eliminando show: "+error.message);return;}
  }catch(e){toast("⚠️ Error de conexión eliminando show");return;}
  toast("🗑 Show eliminado");
  closeModal();
  closePanel();
  if(fullDetailIdx!==null)closeFullDetail();
  ASIGNACIONES=ASIGNACIONES.filter(a=>!(a.entityType==="show"&&String(a.entityId)===String(showId)));
  delete NOTAS_CACHE[eqKey("show",showId)];
  SHOWS=await loadShows();
  CONTENIDO=await loadContenido();
  buildShows();buildDash();buildPlanner();buildRoadmapSelect();
}

function saveShow(){
  const nombre=document.getElementById("f-nombre").value.trim();
  if(!nombre){toast("⚠️ Ingresá el nombre del show");return;}
  const show={
    nombre,tipo:document.getElementById("f-tipo").value,estado:document.getElementById("f-estado").value,
    venue:document.getElementById("f-venue").value||"Por confirmar",ciudad:document.getElementById("f-ciudad").value||"Ciudad A",
    fecha:document.getElementById("f-fecha").value,hora:document.getElementById("f-hora").value||"20:00",
    aforo:parseInt(document.getElementById("f-aforo").value)||0,
    obj:parseFloat(document.getElementById("f-obj").value)||0.85,
    ticket:parseInt(document.getElementById("f-ticket").value)||0,
    vendidas:document.getElementById("f-vendidas").value?parseInt(document.getElementById("f-vendidas").value):null,
    notas:document.getElementById("f-notas").value,
  };
  if(editingIdx!==null){
    show.id=SHOWS[editingIdx].id;
    show.n=SHOWS[editingIdx].n;
    show.roadmap=SHOWS[editingIdx].roadmap;
    show.fichaTecnica=SHOWS[editingIdx].fichaTecnica;
    show.presupuesto=SHOWS[editingIdx].presupuesto;
    show.invitados=SHOWS[editingIdx].invitados||[];
    show.cierre=SHOWS[editingIdx].cierre||defaultCierre();
    SHOWS[editingIdx]=show;
    toast("✅ Show actualizado");
  } else {
    show.n=SHOWS.length+1;
    show.roadmap=freshRoadmapFromPreset(presetKeyForTipo(show.tipo));
    show.fichaTecnica=defaultFichaTecnica();
    show.presupuesto=defaultPresupuesto(show.tipo);
    show.invitados=[];
    show.cierre=defaultCierre();
    SHOWS.push(show);
    toast("✅ Show agregado — se le asignó una hoja de ruta según su tipo");
  }
  saveShows();buildShows();buildDash();buildPlanner();updateHeader();closeModal();
}