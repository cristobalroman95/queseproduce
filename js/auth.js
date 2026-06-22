// ── ROLE DEFINITIONS ──
const ROLE_DEFS={
  invitado:{label:"Invitado",icon:"👋",color:"var(--p600)",sections:["dashboard","coordinacion","shows","contenido","presupuesto","roadmap","planner","equipo"],canEdit:true,showFinancials:true},
  programador:{label:"Programador",icon:"⬛",color:"#1a1a18",sections:["dashboard","coordinacion","shows","contenido","presupuesto","roadmap","planner","equipo"],canEdit:true,showFinancials:true},
  productor:{label:"Productor",icon:"🎬",color:"var(--p600)",sections:["dashboard","coordinacion","shows","contenido","presupuesto","roadmap","planner","equipo"],canEdit:true,showFinancials:true},
  artista:{label:"Artista",icon:"🎤",color:"var(--p600)",sections:["dashboard","coordinacion","shows","contenido","roadmap","planner","equipo"],canEdit:true,showFinancials:true},
  contador:{label:"Contador",icon:"📊",color:"var(--t600)",sections:["dashboard","presupuesto","shows"],canEdit:false,showFinancials:true},
  tecnico:{label:"Técnico",icon:"🔧",color:"var(--b600)",sections:["shows"],canEdit:false,showFinancials:false,showTabs:["resumen","ficha","equipo","bitacora","roadmap","multimedia"]},
  marketing:{label:"Marketing",icon:"📣",color:"var(--a600)",sections:["dashboard","shows","contenido","planner"],canEdit:false,showFinancials:false}
};

let currentUser=null;

function getAllowedShowTabs(){
  const all=["info","ficha","equipo","bitacora","roadmap","presupuesto","invitados","cdshow","cierre","multimedia"];
  if(!currentUser)return all;
  const role=ROLE_DEFS[currentUser.rol];
  if(role&&role.showTabs)return role.showTabs;
  return all;
}
function applyShowTabVisibility(){
  const allowed=getAllowedShowTabs();
  const map={resumen:"fd-resumen-btn",info:"fd-info-btn",ficha:"fd-ficha-btn",equipo:"fd-equipo-btn",bitacora:"fd-bitacora-btn",roadmap:"fd-rm-btn",presupuesto:"fd-presupuesto-btn",invitados:"fd-invitados-btn",cdshow:"fd-cdshow-btn",cierre:"fd-cierre-btn",multimedia:"fd-multimedia-btn"};
  Object.keys(map).forEach(k=>{
    const btn=document.getElementById(map[k]);
    if(btn)btn.style.display=allowed.includes(k)?"":"none";
  });
}

function isTecnico(){return currentUser&&currentUser.rol==="tecnico";}

function applyRoleRestrictions(){
  if(!currentUser)return;
  const role=ROLE_DEFS[currentUser.rol]||ROLE_DEFS.tecnico;
  const allowed=role.sections;
  buildShows();
  document.querySelectorAll(".nav-item").forEach(el=>{
    const onclick=el.getAttribute("onclick")||"";
    const match=onclick.match(/nav\('(\w+)'/);
    if(match){
      const sec=match[1];
      el.style.display=allowed.includes(sec)?"flex":"none";
    }
  });
  if(role.canEdit){
    document.body.classList.add("can-edit");
  } else {
    document.body.classList.remove("can-edit");
  }
  const exp=document.getElementById("btn-export");
  if(exp)exp.style.display=(currentUser.rol==="tecnico"||currentUser.rol==="marketing")?"none":"";
  const newShowBtn=document.getElementById("btn-new-show");
  if(newShowBtn)newShowBtn.style.display=role.canEdit?"":"none";
  applyShowTabVisibility();
  const firstSec=allowed[0]||"dashboard";
  const firstNavEl=document.querySelector(`.nav-item[onclick*="nav('${firstSec}'"]`);
  nav(firstSec,firstNavEl||document.querySelector(".nav-item"));
  document.getElementById("topbar-uname").textContent=currentUser.loginName;
  document.getElementById("topbar-urole").textContent=role.label;
  document.getElementById("topbar-avatar").textContent=currentUser.loginName.charAt(0).toUpperCase();
}

// ── LOGIN ──
async function loginWithGoogle(){
  const err=document.getElementById("login-error");
  const statusErr=document.getElementById("login-status-error");
  err.textContent="";
  statusErr.classList.remove("show");
  const btn=document.getElementById("login-google-btn");
  if(btn)btn.disabled=true;
  const {error}=await sb.auth.signInWithOAuth({
    provider:"google",
    options:{redirectTo:window.location.origin+window.location.pathname}
  });
  if(error){
    if(btn)btn.disabled=false;
    err.textContent="No se pudo iniciar el acceso con Google. Probá de nuevo.";
  }
}

async function resolveSessionAndEnter(session,isFreshSignIn){
  const pending=document.getElementById("login-pending");
  const statusErr=document.getElementById("login-status-error");
  pending.classList.add("show");
  statusErr.classList.remove("show");

  let perfil=null,perfilErr=null;
  for(let intento=0;intento<2;intento++){
    const res=await sb.from("perfiles").select("*").eq("id",session.user.id).single();
    perfil=res.data;perfilErr=res.error;
    if(perfil)break;
    if(intento===0)await new Promise(r=>setTimeout(r,1200));
  }
  pending.classList.remove("show");

  if(perfilErr||!perfil){
    statusErr.innerHTML="Iniciaste sesión con Google correctamente, pero todavía no tenés un perfil asignado en QueseProduce.<br>Avisale al programador para que te dé acceso — esto puede demorar unos minutos.<br><button onclick=\"location.reload()\">Reintentar</button>";
    statusErr.classList.add("show");
    await sb.auth.signOut();
    return;
  }

  if(perfil.exp){
    const exp=new Date(perfil.exp);exp.setHours(23,59,59);
    if(new Date()>exp){
      statusErr.innerHTML="Tu acceso venció el "+perfil.exp+". Contactá al programador para renovarlo.<br><button onclick=\"location.reload()\">Volver</button>";
      statusErr.classList.add("show");
      await sb.auth.signOut();
      return;
    }
  }

  currentUser={id:perfil.id,loginName:perfil.nombre,nombre:perfil.nombre,rol:perfil.rol,exp:perfil.exp,nota:perfil.nota};

  const googleAvatar=session.user.user_metadata?.avatar_url||session.user.user_metadata?.picture||"";
  if(googleAvatar&&googleAvatar!==perfil.avatar_url){
    sb.from("perfiles").update({avatar_url:googleAvatar}).eq("id",perfil.id).then(()=>{});
  }
  const googleEmail=session.user.email||"";
  if(googleEmail&&googleEmail!==perfil.email){
    sb.from("perfiles").update({email:googleEmail}).eq("id",perfil.id).then(()=>{});
  }

  if(isFreshSignIn)sb.from("sesiones").insert({perfil_id:perfil.id}).then(()=>{});

  document.getElementById("login-screen").style.display="none";
  await enterApp();
}

async function doLogout(){
  if(!confirm("¿Cerrar sesión?"))return;
  await sb.auth.signOut();
  currentUser=null;
  location.reload();
}

// ── AUTH LISTENER ──
document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("landing").style.display="none";
  document.getElementById("app").style.display="none";

  sb.auth.onAuthStateChange(async (event,session)=>{
    if(session){
      await resolveSessionAndEnter(session,event==="SIGNED_IN");
    }else{
      currentUser=null;
      document.getElementById("login-screen").style.display="flex";
    }
  });
});