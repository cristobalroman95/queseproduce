
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
function updateHeader(){
  const conf=SHOWS.filter(s=>s.estado==="Confirmado").length;
  const tent=SHOWS.filter(s=>s.estado==="Tentativo").length;
  const real=SHOWS.filter(s=>s.estado==="Realizado").length;
  document.getElementById("hdr-conf").textContent="✅ "+conf+" confirmados";
  document.getElementById("hdr-tent").textContent="⏳ "+tent+" tentativos";
  document.getElementById("d-conf").textContent=conf;
  document.getElementById("d-tent").textContent=tent;
  // Ingresos estimados: suma Confirmados futuros + Realizados (entradas vendidas reales si las hay)
  const totalIngr=SHOWS.filter(s=>s.estado==="Confirmado"||s.estado==="Realizado").reduce((a,s)=>{
    const v=s.vendidas!=null?s.vendidas*s.ticket:ingr(s);
    return a+v;
  },0);
  document.getElementById("d-ingr").textContent=fmtM(totalIngr);
}
// ── LANDING ──
function enterAppFromLanding(){
  // Landing "Entrar" just goes to login if not authenticated
  if(!currentUser){
    document.getElementById("landing").classList.add("exit");
    setTimeout(()=>document.getElementById("landing").style.display="none",600);
    return;
  }
  enterApp();
}

async function enterApp(){
  const l=document.getElementById("landing");
  if(l)l.style.display="none";
  document.getElementById("app").style.display="flex";
   SHOWS = await loadShows();
  CONTENIDO = await loadContenido(); // carga después de SHOWS para tener el mapa showId→idx
  PERSONAS = await loadPersonas();
  ASIGNACIONES = await loadAsignaciones();
  PERFILES_LITE = await loadPerfilesLite();
  // Build all data-driven sections now that DOM is visible and user is known
  buildShows();
  buildDash();
  buildRoadmapSelect();
  buildPlanner();
  updateHeader();
  applyRoleRestrictions(); // also calls buildShows() + nav to first allowed section
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
