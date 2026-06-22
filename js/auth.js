let currentUser=null;

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
  // Si no hay error, la página redirige a Google y vuelve — el resto del flujo
  // (buscar perfil, chequear vencimiento, entrar) lo maneja resolveSessionAndEnter()
  // desde el listener onAuthStateChange al final del archivo.
}

// Busca el perfil para una sesión activa y entra a la app. Reintenta una vez si el
// perfil todavía no existe (cubre el caso raro en que el trigger de alta automática
// en Supabase tarde unos milisegundos más que el round-trip del login).
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

  // Guardar la foto de Google en el perfil (fire-and-forget) para que Equipo pueda usarla como fallback
  const googleAvatar=session.user.user_metadata?.avatar_url||session.user.user_metadata?.picture||"";
  if(googleAvatar&&googleAvatar!==perfil.avatar_url){
    sb.from("perfiles").update({avatar_url:googleAvatar}).eq("id",perfil.id).then(()=>{});
  }
  // Guardar también el email (fire-and-forget) para poder cruzarlo con el "Contacto" de cada persona en Equipo
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
function applyRoleRestrictions(){
  if(!currentUser)return;
  const role=ROLE_DEFS[currentUser.rol]||ROLE_DEFS.tecnico;
  const allowed=role.sections;
  // Re-render la tabla de shows ahora que se conoce el rol (oculta Ticket/Ingr. est. si corresponde)
  buildShows();
  // Hide nav items not in role
  document.querySelectorAll(".nav-item").forEach(el=>{
    const onclick=el.getAttribute("onclick")||"";
    const match=onclick.match(/nav\('(\w+)'/);
    if(match){
      const sec=match[1];
      el.style.display=allowed.includes(sec)?"flex":"none";
    }
  });
  // Edit buttons: visible only for roles with canEdit (programador + productor)
  if(role.canEdit){
    document.body.classList.add("can-edit");
  } else {
    document.body.classList.remove("can-edit");
  }
  // Export button: hide for tecnico and marketing
  const exp=document.getElementById("btn-export");
  if(exp)exp.style.display=(currentUser.rol==="tecnico"||currentUser.rol==="marketing")?"none":"";
  // "+ Nuevo show": solo roles con permiso de edición (programador, productor)
  const newShowBtn=document.getElementById("btn-new-show");
  if(newShowBtn)newShowBtn.style.display=role.canEdit?"":"none";
  // Tabs del detalle de show (vista completa): aplicar restricción por rol (ej. Técnico → solo Ficha técnica + Hoja de ruta)
  applyShowTabVisibility();
  // Navigate to first allowed section
  const firstSec=allowed[0]||"dashboard";
  const firstNavEl=document.querySelector(`.nav-item[onclick*="nav('${firstSec}'"]`);
  nav(firstSec,firstNavEl||document.querySelector(".nav-item"));
  // Update topbar chip
  document.getElementById("topbar-uname").textContent=currentUser.loginName;
  document.getElementById("topbar-urole").textContent=role.label;
  document.getElementById("topbar-avatar").textContent=currentUser.loginName.charAt(0).toUpperCase();
}
