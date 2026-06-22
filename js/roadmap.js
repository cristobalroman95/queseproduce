let pendingPresetShowIdx=null;
let roadmapSaveChain=Promise.resolve();

// ── PRESETS ──
function loadPresets(){
  try{const s=localStorage.getItem('qp_presets');return s?JSON.parse(s):JSON.parse(JSON.stringify(DEFAULT_PRESETS_ROADMAP));}catch(e){return JSON.parse(JSON.stringify(DEFAULT_PRESETS_ROADMAP));}
}
function savePresets(){try{localStorage.setItem('qp_presets',JSON.stringify(PRESETS_ROADMAP));}catch(e){}}
let PRESETS_ROADMAP = loadPresets();

async function persistRoadmap(show){
  if(!show||!show.id)return;
  try{
    const {data:oldSecs,error:selErr}=await sb.from("roadmap_secciones").select("id").eq("show_id",show.id);
    if(selErr){ toast("⚠️ Error leyendo hoja de ruta previa: "+selErr.message); return; }
    const oldSecIds=(oldSecs||[]).map(r=>r.id);
    if(oldSecIds.length){
      const {error:delTasksErr}=await sb.from("roadmap_tasks").delete().in("seccion_id",oldSecIds);
      if(delTasksErr){ toast("⚠️ Error borrando tareas previas: "+delTasksErr.message); return; }
      const {error:delSecsErr}=await sb.from("roadmap_secciones").delete().in("id",oldSecIds);
      if(delSecsErr){ toast("⚠️ Error borrando secciones previas: "+delSecsErr.message); return; }
    }
    const secciones=show.roadmap||[];
    if(!secciones.length)return;
    const secPayload=secciones.map((sec,si)=>({show_id:show.id,titulo:sec.s,orden:si+1}));
    const {data:newSecs,error:insSecErr}=await sb.from("roadmap_secciones").insert(secPayload).select();
    if(insSecErr){ toast("⚠️ Error guardando secciones: "+insSecErr.message); return; }
    const secIdByOrden={};
    (newSecs||[]).forEach(r=>{ secIdByOrden[r.orden]=r.id; });
    const taskPayload=[];
    secciones.forEach((sec,si)=>{
      const seccionId=secIdByOrden[si+1];
      if(!seccionId)return;
      (sec.tasks||[]).forEach((t,ti)=>{
        taskPayload.push({
          seccion_id:seccionId,
          hora_inicio:t.i||null,
          hora_fin:t.f||null,
          area:t.area||null,
          actividad:t.act||null,
          detalle:t.det||null,
          estado:t.est||"Pendiente",
          orden:ti+1,
        });
      });
    });
    if(taskPayload.length){
      const {error:insTaskErr}=await sb.from("roadmap_tasks").insert(taskPayload);
      if(insTaskErr){ toast("⚠️ Error guardando tareas: "+insTaskErr.message); }
    }
  }catch(e){
    toast("⚠️ Error de conexión guardando hoja de ruta");
  }
}
function saveRoadmap(showIdx){
  const show=SHOWS[showIdx];
  if(!show)return;
  if(!show.id){ toast("⚠️ Guardá el show antes de editar la hoja de ruta"); return; }
  roadmapSaveChain=roadmapSaveChain.then(()=>persistRoadmap(show)).catch(()=>{});
  return roadmapSaveChain;
}

// ── BUILD ROADMAP ──
function buildRoadmapSelect(){
  const sel=document.getElementById("rm-show-select");
  if(!sel)return;
  sel.innerHTML=SHOWS.map((s,i)=>`<option value="${i}">${s.nombre} · ${fmtDate(s.fecha)}</option>`).join("");
  if(activeShowIdx===null||activeShowIdx>=SHOWS.length)activeShowIdx=0;
  sel.value=activeShowIdx;
  buildRoadmap(activeShowIdx);
}
function selectRoadmapShow(idxStr){
  activeShowIdx=parseInt(idxStr);
  buildRoadmap(activeShowIdx);
}
function buildRoadmap(idx){
  const body=document.getElementById("roadmap-body");
  if(idx===null||!SHOWS[idx]){body.innerHTML="";return;}
  const show=SHOWS[idx];
  const secciones=show.roadmap||[];
  if(!secciones.length){
    body.innerHTML=`<div class="card" style="text-align:center;color:#bbb;font-size:12px;padding:30px;">Este show no tiene hoja de ruta todavía.<br><br><button class="btn btn-primary" onclick="openPresetPicker(${idx})">📋 Elegir preset o duplicar otra</button></div>`;
    return;
  }
  body.innerHTML=secciones.map((sec,si)=>`
    <div class="rm-section">
      <div class="rm-hdr">
        <span style="flex:1;">${sec.s}</span>
        <button class="btn" style="font-size:10px;padding:3px 8px;" onclick="addTask(${idx},${si})">+ Tarea</button>
      </div>
      <div style="border:0.5px solid var(--border-soft);border-radius:8px;overflow:hidden;">
        <div style="display:grid;grid-template-columns:80px 1fr 130px 100px 90px 26px;gap:6px;padding:5px 11px;background:rgba(255,255,255,0.05);font-size:9px;font-weight:700;color:#ccc;text-transform:uppercase;letter-spacing:0.5px;">
          <div>Horario</div><div>Actividad</div><div>Detalle</div><div>Área</div><div>Estado</div><div></div>
        </div>
        ${sec.tasks.map((t,ti)=>`
          <div class="task-row" id="tr-${si}-${ti}" style="grid-template-columns:80px 1fr 130px 100px 90px 26px;${t.est==="Listo"?"opacity:0.45":""}">
            <div class="t-time" contenteditable="true" onblur="editTaskField(${idx},${si},${ti},'i',this.textContent)">${t.i}${t.f?"–"+t.f:""}</div>
            <div class="t-act" contenteditable="true" onblur="editTaskField(${idx},${si},${ti},'act',this.textContent)">${t.act}</div>
            <div class="t-det" contenteditable="true" onblur="editTaskField(${idx},${si},${ti},'det',this.textContent)">${t.det}</div>
            <div class="t-area" contenteditable="true" onblur="editTaskField(${idx},${si},${ti},'area',this.textContent)">${t.area}</div>
            <div><select class="tss" style="${tskC(t.est)}" onchange="updateTask(${idx},${si},${ti},this)">
              <option ${t.est==="Listo"?"selected":""}>✅ Listo</option>
              <option ${t.est==="En curso"?"selected":""}>▶ En curso</option>
              <option ${t.est==="Pendiente"?"selected":""}>□ Pendiente</option>
              <option ${t.est==="Cancelado"?"selected":""}>✕ Cancelado</option>
            </select></div>
            <div><button class="ph-close" style="font-size:12px;" title="Eliminar tarea" onclick="removeTask(${idx},${si},${ti})">✕</button></div>
          </div>`).join("")}
      </div>
    </div>`).join("");
}

function updateTask(showIdx,si,ti,sel){
  const v=sel.value;
  let est="Pendiente";
  if(v.includes("Listo"))est="Listo";
  else if(v.includes("curso"))est="En curso";
  else if(v.includes("Cancelado"))est="Cancelado";
  SHOWS[showIdx].roadmap[si].tasks[ti].est=est;
  sel.setAttribute("style",tskC(est));
  const row=document.getElementById(`tr-${si}-${ti}`);
  if(row)row.style.opacity=est==="Listo"?"0.45":est==="Cancelado"?"0.3":"1";
  saveRoadmap(showIdx);toast(est==="Listo"?"✅ Tarea completada":"Estado → "+est);
}
function editTaskField(showIdx,si,ti,field,value){
  SHOWS[showIdx].roadmap[si].tasks[ti][field]=value.trim();
  saveRoadmap(showIdx);
}
function addTask(showIdx,si){
  SHOWS[showIdx].roadmap[si].tasks.push({i:"",f:"",area:"",act:"Nueva tarea",det:"",est:"Pendiente"});
  saveRoadmap(showIdx);
  if(document.getElementById("roadmap-body"))buildRoadmap(showIdx);
  renderFullDetailIfOpen();
  toast("➕ Tarea agregada — editá los campos directamente");
}
function removeTask(showIdx,si,ti){
  SHOWS[showIdx].roadmap[si].tasks.splice(ti,1);
  saveRoadmap(showIdx);
  if(document.getElementById("roadmap-body"))buildRoadmap(showIdx);
  renderFullDetailIfOpen();
}

function editSectionTitle(idx,si,value){
  SHOWS[idx].roadmap[si].s=value.trim();
  saveRoadmap(idx);
}
function addSection(idx){
  SHOWS[idx].roadmap.push({s:"🆕  Nueva sección",tasks:[{i:"",f:"",area:"",act:"Nueva tarea",det:"",est:"Pendiente"}]});
  saveRoadmap(idx);renderFullDetailIfOpen();
  toast("➕ Sección agregada");
}
function removeSection(idx,si){
  if(!confirm("¿Eliminar esta sección completa y todas sus tareas?"))return;
  SHOWS[idx].roadmap.splice(si,1);
  saveRoadmap(idx);renderFullDetailIfOpen();
}

// ── PRESET PICKER ──
function openPresetPicker(showIdx){
  pendingPresetShowIdx=showIdx;
  const list=document.getElementById("preset-picker-list");
  const presetCards=Object.entries(PRESETS_ROADMAP).map(([key,p])=>`
    <div class="card" style="cursor:pointer;margin-bottom:8px;" onclick="applyPresetToShow('${key}')">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div><strong style="font-size:12px;">${p.nombre}</strong><div style="font-size:10px;color:#aaa;margin-top:2px;">${p.secciones.length} secciones · ${p.secciones.reduce((a,s)=>a+s.tasks.length,0)} tareas</div></div>
        <button class="btn" style="font-size:10px;" onclick="event.stopPropagation();deletePreset('${key}')" title="Eliminar preset">🗑</button>
      </div>
    </div>`).join("");
  const otherShows=SHOWS.map((s,i)=>({s,i})).filter(({i})=>i!==showIdx && SHOWS[i].roadmap && SHOWS[i].roadmap.length);
  const dupCards=otherShows.length?otherShows.map(({s,i})=>`
    <div class="card" style="cursor:pointer;margin-bottom:8px;" onclick="applyDuplicateToShow(${i})">
      <strong style="font-size:12px;">${s.nombre}</strong><div style="font-size:10px;color:#aaa;margin-top:2px;">${s.roadmap.length} secciones · ${s.roadmap.reduce((a,sec)=>a+sec.tasks.length,0)} tareas · ${s.tipo}</div>
    </div>`).join(""):`<div style="font-size:11px;color:#bbb;">No hay otros shows con hoja de ruta todavía.</div>`;
  list.innerHTML=`
    <div class="form-section-title">Presets disponibles</div>
    ${presetCards}
    <button class="btn" style="width:100%;margin-bottom:16px;" onclick="createNewPreset()">➕ Crear nuevo preset desde cero</button>
    <div class="form-section-title">Duplicar hoja de ruta de otro show</div>
    ${dupCards}
  `;
  document.getElementById("preset-modal-overlay").classList.add("open");
}
function closePresetPicker(){document.getElementById("preset-modal-overlay").classList.remove("open");}
function closePresetPickerOvl(e){if(e.target===document.getElementById("preset-modal-overlay"))closePresetPicker();}

function applyPresetToShow(presetKey){
  if(pendingPresetShowIdx===null)return;
  const apply=()=>{
    SHOWS[pendingPresetShowIdx].roadmap=freshRoadmapFromPreset(presetKey);
    saveRoadmap(pendingPresetShowIdx);
    if(document.getElementById("rm-show-select"))buildRoadmapSelect();
    if(typeof renderFullDetailIfOpen==='function')renderFullDetailIfOpen();
    toast("✅ Preset aplicado a "+SHOWS[pendingPresetShowIdx].nombre);
    closePresetPicker();
  };
  const show=SHOWS[pendingPresetShowIdx];
  if(show.roadmap&&show.roadmap.length){
    if(confirm("Esto reemplaza la hoja de ruta actual de \""+show.nombre+"\". ¿Continuar?"))apply();
  } else apply();
}
function applyDuplicateToShow(sourceIdx){
  if(pendingPresetShowIdx===null)return;
  const apply=()=>{
    SHOWS[pendingPresetShowIdx].roadmap=JSON.parse(JSON.stringify(SHOWS[sourceIdx].roadmap));
    SHOWS[pendingPresetShowIdx].roadmap.forEach(sec=>sec.tasks.forEach(t=>t.est="Pendiente"));
    saveRoadmap(pendingPresetShowIdx);
    if(document.getElementById("rm-show-select"))buildRoadmapSelect();
    if(typeof renderFullDetailIfOpen==='function')renderFullDetailIfOpen();
    toast("✅ Hoja de ruta duplicada de "+SHOWS[sourceIdx].nombre);
    closePresetPicker();
  };
  const show=SHOWS[pendingPresetShowIdx];
  if(show.roadmap&&show.roadmap.length){
    if(confirm("Esto reemplaza la hoja de ruta actual de \""+show.nombre+"\". ¿Continuar?"))apply();
  } else apply();
}
function createNewPreset(){
  const nombre=prompt("Nombre del nuevo preset (ej: 'Festival al aire libre'):");
  if(!nombre)return;
  const key="custom_"+Date.now();
  PRESETS_ROADMAP[key]={nombre,tipo:"Personalizado",secciones:[
    {s:"🔧  Sección 1",tasks:[{i:"",f:"",area:"",act:"Nueva tarea",det:"",est:"Pendiente"}]}
  ]};
  savePresets();
  toast("✅ Preset creado — aplicalo a un show y editalo desde su hoja de ruta");
  openPresetPicker(pendingPresetShowIdx);
}
function deletePreset(key){
  if(Object.keys(PRESETS_ROADMAP).length<=1){toast("⚠️ Debe quedar al menos un preset");return;}
  if(!confirm("¿Eliminar este preset? Los shows que ya lo usaron no se ven afectados."))return;
  delete PRESETS_ROADMAP[key];
  savePresets();
  openPresetPicker(pendingPresetShowIdx);
}