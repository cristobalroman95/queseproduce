// ── HELPERS ──
function fmtDate(d){if(!d)return"—";const p=d.split("-");return p[2]+"/"+p[1]+"/"+p[0];}
function fmtM(n){if(!n||n===0)return"—";return"$"+Math.round(n/1000000*10)/10+"M";}
function fmtCLP(n){if(!n&&n!==0)return"—";return"$"+n.toLocaleString("es-CL");}
function tipoC(t){if(t==="Teatro")return"tp-teatro";if(t==="Teatro Especial")return"tp-especial";if(t==="Show Bar")return"tp-bar";return"tp-digital";}
function estC(e){if(e==="Confirmado")return"ss-conf";if(e==="Tentativo")return"ss-tent";if(e==="En proceso")return"ss-proc";if(e==="Realizado")return"ss-real";return"ss-canc";}
function estEmoji(e){if(e==="Confirmado")return"✅";if(e==="Tentativo")return"⏳";if(e==="En proceso")return"🔄";if(e==="Realizado")return"🎉";return"❌";}
function tskC(e){if(e==="Listo")return"color:var(--t600);background:var(--t50);";if(e==="En curso")return"color:var(--b600);background:var(--b50);";if(e==="Cancelado")return"color:var(--r600);background:var(--r50);";return"color:#888;background:var(--g50);";}
function ingr(s){return Math.round(s.aforo*s.obj)*s.ticket;}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200);}

// ── EDIT MODE ──
const EDIT_STORAGE_KEY='qp_edits_v1';
const EDIT_SKIP_TAGS=new Set(['BUTTON','SELECT','OPTION','INPUT','TEXTAREA','SCRIPT','STYLE','SVG','PATH']);

function loadEdits(){
  try{const s=localStorage.getItem(EDIT_STORAGE_KEY);return s?JSON.parse(s):{};}catch(e){return{};}
}
function saveEdits(edits){try{localStorage.setItem(EDIT_STORAGE_KEY,JSON.stringify(edits));}catch(e){}}
function isLeafTextElement(el){
  if(EDIT_SKIP_TAGS.has(el.tagName))return false;
  if(el.closest('button,select,a,[onclick]') && el.tagName!=='SPAN')return false;
  if(el.hasAttribute('onclick'))return false;
  const hasDirectText=Array.from(el.childNodes).some(n=>n.nodeType===3 && n.textContent.trim().length>0);
  if(!hasDirectText)return false;
  return true;
}
function collectEditableLeaves(root){
  const leaves=[];
  const walk=(node)=>{
    if(node.nodeType!==1)return;
    if(EDIT_SKIP_TAGS.has(node.tagName))return;
    if(node.hasAttribute('onclick') && !node.classList.contains('show-link'))return;
    if(isLeafTextElement(node)){
      leaves.push(node);
    }
    Array.from(node.children).forEach(walk);
  };
  walk(root);
  return leaves;
}
function pathFor(el){
  const zone=el.closest('.edit-zone');
  if(!zone)return null;
  const zoneId=zone.id||zone.getAttribute('data-zone-id');
  const leaves=collectEditableLeaves(zone);
  const idx=leaves.indexOf(el);
  if(idx<0)return null;
  return zoneId+"::"+idx;
}
function onEditableBlur(e){
  const el=e.target;
  const key=pathFor(el);
  if(!key)return;
  const edits=loadEdits();
  edits[key]=el.innerHTML;
  saveEdits(edits);
}
function applyStoredEdits(){
  const edits=loadEdits();
  document.querySelectorAll('.edit-zone').forEach((zone,zi)=>{
    if(!zone.id)zone.setAttribute('data-zone-id','zone-'+zi);
    const zoneId=zone.id||zone.getAttribute('data-zone-id');
    const leaves=collectEditableLeaves(zone);
    leaves.forEach((leaf,idx)=>{
      const key=zoneId+"::"+idx;
      if(edits[key]!==undefined)leaf.innerHTML=edits[key];
    });
  });
}
function toggleEditMode(){
  const editMode=document.body.classList.toggle('edit-mode');
  const btn=document.getElementById('edit-toggle-btn');
  btn.classList.toggle('active',editMode);
  btn.innerHTML=editMode?'<span class="eb-dot"></span> Salir de edición':'<span class="eb-dot"></span> Editar plataforma';

  document.querySelectorAll('.edit-zone').forEach((zone,zi)=>{
    if(!zone.id)zone.setAttribute('data-zone-id','zone-'+zi);
    const leaves=collectEditableLeaves(zone);
    leaves.forEach(leaf=>{
      leaf.setAttribute('data-editable','');
      leaf.setAttribute('contenteditable',editMode?'true':'false');
      if(editMode){
        leaf.addEventListener('blur',onEditableBlur);
      } else {
        leaf.removeEventListener('blur',onEditableBlur);
      }
    });
  });

  if(editMode){toast('✏️ Modo edición activado — hacé clic en cualquier texto marcado');}
  else{toast('✅ Cambios guardados');}
}
function resetEdits(){
  if(!confirm('¿Restaurar todos los textos a su versión original? Esta acción no se puede deshacer.'))return;
  localStorage.removeItem(EDIT_STORAGE_KEY);
  toast('↩️ Textos restaurados — recargando...');
  setTimeout(()=>location.reload(),700);
}
function resetShowsData(){
  if(!confirm('¿Resetear todos los datos de shows al estado del código? Se perderán cambios manuales (presupuestos, cierres, hojas de ruta). Esta acción no se puede deshacer.'))return;
  localStorage.removeItem('qp_shows');
  localStorage.setItem(DATA_VERSION_KEY, DATA_VERSION);
  toast('🔄 Datos reseteados — recargando...');
  setTimeout(()=>location.reload(),700);
}

// ── NAV ──
const TITLES={dashboard:"Dashboard ejecutivo",coordinacion:"Coordinación de departamentos",shows:"Shows 2026",contenido:"Contenido digital",presupuesto:"Finanzas · reportes y consolidado",roadmap:"Hoja de ruta · día del show",planner:"Planner 2026",equipo:"Equipo de producción"};
function nav(id,el){
  document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
  const sec=document.getElementById("sec-"+id);
  if(sec)sec.classList.add("active");
  if(el)el.classList.add("active");
  document.getElementById("topbar-title").textContent=TITLES[id]||id;
  if(id==="dashboard"){buildDash();updateHeader();}
  if(id==="coordinacion")buildCoordinacion();
  if(id==="shows")buildShows();
  if(id==="roadmap")buildRoadmapSelect();
  if(id==="planner")buildPlanner();
  if(id==="presupuesto")buildPresupConsolidado();
  if(id==="contenido")buildContenido();
  if(id==="equipo")buildEquipo();
}

function updateHeader(){
  const conf=SHOWS.filter(s=>s.estado==="Confirmado").length;
  const tent=SHOWS.filter(s=>s.estado==="Tentativo").length;
  document.getElementById("hdr-conf").textContent="✅ "+conf+" confirmados";
  document.getElementById("hdr-tent").textContent="⏳ "+tent+" tentativos";
  document.getElementById("d-conf").textContent=conf;
  document.getElementById("d-tent").textContent=tent;
  const totalIngr=SHOWS.filter(s=>s.estado==="Confirmado"||s.estado==="Realizado").reduce((a,s)=>{
    const v=s.vendidas!=null?s.vendidas*s.ticket:ingr(s);
    return a+v;
  },0);
  document.getElementById("d-ingr").textContent=fmtM(totalIngr);
}

// ── ENTER APP ──
async function enterApp(){
  const l=document.getElementById("landing");
  if(l)l.style.display="none";
  document.getElementById("app").style.display="flex";
  SHOWS = await loadShows();
  CONTENIDO = await loadContenido();
  PERSONAS = await loadPersonas();
  ASIGNACIONES = await loadAsignaciones();
  PERFILES_LITE = await loadPerfilesLite();
  buildShows();
  buildDash();
  buildRoadmapSelect();
  buildPlanner();
  updateHeader();
  applyRoleRestrictions();
}

function enterAppFromLanding(){
  if(!currentUser){
    document.getElementById("landing").classList.add("exit");
    setTimeout(()=>document.getElementById("landing").style.display="none",600);
    return;
  }
  enterApp();
}

// ── INIT ──
applyStoredEdits();