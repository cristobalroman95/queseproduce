let presupuestoSaveChain=Promise.resolve();
let cierreSaveChain=Promise.resolve();
let invitadosSaveChain=Promise.resolve();

// ── PRESUPUESTO PERSIST ──
async function persistPresupuesto(show){
  if(!show||!show.id)return;
  try{
    const {error:delErr}=await sb.from("presupuesto_items").delete().eq("show_id",show.id);
    if(delErr){ toast("⚠️ Error borrando presupuesto previo: "+delErr.message); return; }
    const categorias=(show.presupuesto&&show.presupuesto.categorias)||[];
    const payload=[];
    categorias.forEach(cat=>{
      (cat.items||[]).forEach((it,ii)=>{
        payload.push({
          show_id:show.id,
          categoria_key:cat.key,
          categoria_nombre:cat.nombre,
          descripcion:it.desc||"",
          monto:it.monto||0,
          orden:ii+1,
        });
      });
    });
    if(payload.length){
      const {error:insErr}=await sb.from("presupuesto_items").insert(payload);
      if(insErr){ toast("⚠️ Error guardando presupuesto: "+insErr.message); }
    }
  }catch(e){
    toast("⚠️ Error de conexión guardando presupuesto");
  }
}
function savePresupuesto(showIdx){
  const show=SHOWS[showIdx];
  if(!show)return;
  if(!show.id){ toast("⚠️ Guardá el show antes de editar el presupuesto"); return; }
  presupuestoSaveChain=presupuestoSaveChain.then(()=>persistPresupuesto(show)).catch(()=>{});
  return presupuestoSaveChain;
}

// ── CIERRE PERSIST ──
async function persistCierre(show){
  if(!show||!show.id)return;
  try{
    const {error:delErr}=await sb.from("cierre_items").delete().eq("show_id",show.id);
    if(delErr){ toast("⚠️ Error borrando cierre previo: "+delErr.message); return; }
    const categorias=(show.cierre&&show.cierre.categorias)||[];
    const payload=[];
    categorias.forEach(cat=>{
      (cat.items||[]).forEach((it,ii)=>{
        payload.push({
          show_id:show.id,
          categoria_key:cat.key,
          categoria_nombre:cat.nombre,
          es_ingreso:!!cat.esIngreso,
          descripcion:it.desc||"",
          presup:it.presup||0,
          real:it.real||0,
          orden:ii+1,
        });
      });
    });
    if(payload.length){
      const {error:insErr}=await sb.from("cierre_items").insert(payload);
      if(insErr){ toast("⚠️ Error guardando cierre: "+insErr.message); }
    }
  }catch(e){
    toast("⚠️ Error de conexión guardando cierre");
  }
}
function saveCierre(showIdx){
  const show=SHOWS[showIdx];
  if(!show)return;
  if(!show.id){ toast("⚠️ Guardá el show antes de editar el cierre"); return; }
  cierreSaveChain=cierreSaveChain.then(()=>persistCierre(show)).catch(()=>{});
  return cierreSaveChain;
}

// ── INVITADOS PERSIST ──
async function persistInvitados(show){
  if(!show||!show.id)return;
  try{
    const {error:delErr}=await sb.from("invitados").delete().eq("show_id",show.id);
    if(delErr){ toast("⚠️ Error borrando invitados previos: "+delErr.message); return; }
    const invs=show.invitados||[];
    if(!invs.length)return;
    const payload=invs.map(g=>({
      show_id:show.id,
      nombre:g.nombre||"",
      rol:g.rol||"",
      estado:g.estado||"Pendiente",
      pago:g.pago||0,
    }));
    const {error:insErr}=await sb.from("invitados").insert(payload);
    if(insErr){ toast("⚠️ Error guardando invitados: "+insErr.message); }
  }catch(e){
    toast("⚠️ Error de conexión guardando invitados");
  }
}
function saveInvitados(showIdx){
  const show=SHOWS[showIdx];
  if(!show)return;
  if(!show.id){ toast("⚠️ Guardá el show antes de editar los invitados"); return; }
  invitadosSaveChain=invitadosSaveChain.then(()=>persistInvitados(show)).catch(()=>{});
  return invitadosSaveChain;
}

// ── PRESUPUESTO HTML ──
function presupuestoShowHTML(s,idx,compact){
  const p=s.presupuesto||defaultPresupuesto(s.tipo||sh.tipo||"");
  const ingrEst=Math.round(s.aforo*s.obj)*s.ticket;
  let totalGastos=0;
  const catHTML=p.categorias.map((cat,ci)=>{
    const subtot=cat.items.reduce((a,it)=>a+(parseFloat(it.monto)||0),0);
    totalGastos+=subtot;
    const itemRows=cat.items.map((it,ii)=>`
      <div class="bgt-item">
        <input type="text" value="${it.desc.replace(/"/g,'&quot;')}" placeholder="Descripción" onblur="updatePresupItem(${idx},${ci},${ii},'desc',this.value)">
        <input type="number" class="val-input" value="${it.monto||0}" onblur="updatePresupItem(${idx},${ci},${ii},'monto',this.value)" onfocus="this.select()">
        <button class="bgt-del-btn" onclick="removePresupItem(${idx},${ci},${ii})" title="Eliminar ítem">✕</button>
      </div>`).join("");
    return`
      <div class="bgt-cat-hdr">
        <span>${cat.nombre}</span>
        <button class="bgt-add-btn" onclick="addPresupItem(${idx},${ci})">+ Ítem</button>
      </div>
      ${itemRows}
      <div class="bgt-subtot"><span>Subtotal ${cat.nombre}</span><span style="color:var(--r600)">-${fmtCLP(subtot)}</span></div>`;
  }).join("");
  const margen=ingrEst-totalGastos;
  const margenPct=ingrEst>0?Math.round(margen/ingrEst*100):0;
  const margenCol=margen>=0?"var(--t200)":"var(--c200)";
  const w=compact?"":"max-width:780px;";
  return`
    <div style="${w}">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;">
        <div class="card">
          <h3>Ingresos estimados</h3>
          <div class="fr"><div class="frl">Aforo × objetivo × ticket</div><div class="frv" style="color:var(--t600);">${fmtCLP(Math.round(s.aforo*s.obj))} ent. × ${fmtCLP(s.ticket)}</div></div>
          <div class="ftot"><div class="ftl">Ingreso total estimado</div><div class="ftv" style="color:var(--t800);">${fmtCLP(ingrEst)}</div></div>
        </div>
        <div class="card">
          <h3>Resultado proyectado</h3>
          <div class="fr"><div class="frl">Ingresos</div><div class="frv" style="color:var(--t600);">${fmtCLP(ingrEst)}</div></div>
          <div class="fr"><div class="frl">Gastos totales</div><div class="frv" style="color:var(--r600);">-${fmtCLP(totalGastos)}</div></div>
          <div class="bgt-total-bar">
            <span style="font-size:12px;font-weight:600;">Margen neto</span>
            <span style="font-size:16px;font-weight:700;color:${margenCol};">${margen>=0?"+":""}${fmtCLP(margen)} <span style="font-size:12px;opacity:0.7;">(${margenPct}%)</span></span>
          </div>
        </div>
      </div>
      <div class="card" style="padding:12px 14px;">
        <h3>Gastos por categoría <span style="font-weight:400;font-size:10px;color:#bbb;margin-left:6px;">— hacé clic en los campos para editar</span></h3>
        ${catHTML}
        <div class="bgt-total-bar" style="margin-top:14px;">
          <span style="font-size:12px;font-weight:600;">Total gastos</span>
          <span style="font-size:15px;font-weight:700;">-${fmtCLP(totalGastos)}</span>
        </div>
      </div>
      <p style="font-size:10px;color:#bbb;margin-top:8px;">Los valores se guardan automáticamente al hacer clic afuera de cada campo.</p>
    </div>`;
}

function updatePresupItem(showIdx,ci,ii,field,value){
  if(!SHOWS[showIdx].presupuesto)SHOWS[showIdx].presupuesto=defaultPresupuesto(SHOWS[showIdx].tipo);
  const item=SHOWS[showIdx].presupuesto.categorias[ci].items[ii];
  if(field==="monto")item.monto=parseFloat(value)||0;
  else item.desc=value.trim();
  savePresupuesto(showIdx);
  const s=SHOWS[showIdx];
  const isPanel=document.getElementById("pnl-tab-body");
  const isPanelActive=isPanel&&document.getElementById("panel-overlay").classList.contains("open");
  if(isPanelActive){document.getElementById("pnl-tab-body").innerHTML=presupuestoShowHTML(s,showIdx,true);}
  else if(fullDetailIdx===showIdx){document.getElementById("fd-body").innerHTML=presupuestoShowHTML(s,showIdx,false);}
  if(document.getElementById("presup-consolidado-body")&&document.getElementById("pt-consolidado").style.display!=="none")buildPresupConsolidado();
}
function addPresupItem(showIdx,ci){
  if(!SHOWS[showIdx].presupuesto)SHOWS[showIdx].presupuesto=defaultPresupuesto(SHOWS[showIdx].tipo);
  SHOWS[showIdx].presupuesto.categorias[ci].items.push({desc:"Nuevo ítem",monto:0});
  savePresupuesto(showIdx);
  const s=SHOWS[showIdx];
  const isPanel=document.getElementById("pnl-tab-body");
  const isPanelActive=isPanel&&document.getElementById("panel-overlay").classList.contains("open");
  if(isPanelActive){document.getElementById("pnl-tab-body").innerHTML=presupuestoShowHTML(s,showIdx,true);}
  else if(fullDetailIdx===showIdx){document.getElementById("fd-body").innerHTML=presupuestoShowHTML(s,showIdx,false);}
  toast("➕ Ítem agregado");
}
function removePresupItem(showIdx,ci,ii){
  if(!SHOWS[showIdx].presupuesto)return;
  SHOWS[showIdx].presupuesto.categorias[ci].items.splice(ii,1);
  savePresupuesto(showIdx);
  const s=SHOWS[showIdx];
  const isPanel=document.getElementById("panel-overlay").classList.contains("open");
  if(isPanel){document.getElementById("pnl-tab-body").innerHTML=presupuestoShowHTML(s,showIdx,true);}
  else if(fullDetailIdx===showIdx){document.getElementById("fd-body").innerHTML=presupuestoShowHTML(s,showIdx,false);}
  if(document.getElementById("presup-consolidado-body")&&document.getElementById("pt-consolidado")&&document.getElementById("pt-consolidado").style.display!=="none")buildPresupConsolidado();
}

// ── CIERRE HTML ──
function cierreShowHTML(s,idx,compact){
  const c=s.cierre||defaultCierre();
  const p=s.presupuesto||defaultPresupuesto(s.tipo||sh.tipo||"");
  const w=compact?"":"max-width:860px;";

  let totalPresupIngresos=0,totalRealIngresos=0;
  let totalPresupGastos=0,totalRealGastos=0;

  const catsHTML=c.categorias.map((cat,ci)=>{
    let subPresup=0,subReal=0;
    const itemRows=cat.items.map((it,ii)=>{
      const pv=parseFloat(it.presup)||0;
      const rv=parseFloat(it.real)||0;
      subPresup+=pv; subReal+=rv;
      const diff=cat.esIngreso?(rv-pv):(pv-rv);
      const diffClass=diff>0?"cierre-diff-pos":diff<0?"cierre-diff-neg":"cierre-diff-zer";
      const diffStr=diff===0?"$0":(diff>0?"+":"")+fmtCLP(diff);
      return`<div class="cierre-item">
        <input type="text" value="${(it.desc||"").replace(/"/g,'&quot;')}" placeholder="Ítem" onblur="updateCierreItem(${idx},${ci},${ii},'desc',this.value)">
        <input type="number" class="num ${cat.esIngreso?'pos':'neg'}" value="${pv}" onblur="updateCierreItem(${idx},${ci},${ii},'presup',this.value)" onfocus="this.select()">
        <input type="number" class="num ${cat.esIngreso?'pos':'neg'}" value="${rv}" onblur="updateCierreItem(${idx},${ci},${ii},'real',this.value)" onfocus="this.select()">
        <div class="${diffClass}">${diffStr}</div>
        <button class="bgt-del-btn" onclick="removeCierreItem(${idx},${ci},${ii})" title="Eliminar">✕</button>
      </div>`;
    }).join("");

    if(cat.esIngreso){totalPresupIngresos+=subPresup;totalRealIngresos+=subReal;}
    else{totalPresupGastos+=subPresup;totalRealGastos+=subReal;}

    const subDiff=cat.esIngreso?(subReal-subPresup):(subPresup-subReal);
    const subDiffClass=subDiff>0?"cierre-diff-pos":subDiff<0?"cierre-diff-neg":"cierre-diff-zer";
    return`
      <div class="bgt-cat-hdr">
        <span>${cat.nombre}</span>
        <button class="bgt-add-btn" onclick="addCierreItem(${idx},${ci})">+ Ítem</button>
      </div>
      <div style="border:0.5px solid var(--border-soft);border-radius:8px;overflow:hidden;margin-bottom:4px;">
        <div style="display:grid;grid-template-columns:1fr 120px 120px 90px 26px;gap:6px;padding:4px 10px;background:rgba(255,255,255,0.05);font-size:9px;font-weight:700;color:#bbb;text-transform:uppercase;letter-spacing:0.4px;">
          <div>Ítem</div><div style="text-align:right;">Presupuestado</div><div style="text-align:right;">Real</div><div style="text-align:right;">Diferencia</div><div></div>
        </div>
        ${itemRows}
      </div>
      <div class="bgt-subtot">
        <span>Subtotal ${cat.nombre}</span>
        <span style="display:flex;gap:20px;">
          <span style="color:#888;">${cat.esIngreso?"+":"-"}${fmtCLP(subPresup)}</span>
          <span style="color:#E4E1F7;font-weight:700;">${cat.esIngreso?"+":"-"}${fmtCLP(subReal)}</span>
          <span class="${subDiffClass}">${subDiff>=0?"+":""}${fmtCLP(subDiff)}</span>
        </span>
      </div>`;
  }).join("");

  const margenPresup=totalPresupIngresos-totalPresupGastos;
  const margenReal=totalRealIngresos-totalRealGastos;
  const margenDiff=margenReal-margenPresup;
  const barClass=margenReal>=0?"pos":"neg";

  const presupGastoTotal=p.categorias.reduce((a,cat)=>a+cat.items.reduce((b,it)=>b+(parseFloat(it.monto)||0),0),0);
  const cierreGastoTotal=c.categorias.filter(cat=>!cat.esIngreso).reduce((a,cat)=>a+cat.items.reduce((b,it)=>b+(parseFloat(it.presup)||0),0),0);

  return`<div style="${w}">
    ${presupGastoTotal>0?`<div style="display:flex;align-items:center;justify-content:space-between;background:var(--b50);border:0.5px solid var(--b100);border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:var(--b800);">
      <span>💡 Copiá los montos del presupuesto a la columna "Presupuestado" del cierre. ${cierreGastoTotal>0?"<strong>Ojo: sobreescribe los valores que ya cargaste.</strong>":"¿Querés autocompletar?"}</span>
      <button class="btn" style="font-size:11px;margin-left:10px;flex-shrink:0;" onclick="${cierreGastoTotal>0?`if(confirm('¿Sobreescribir los valores presupuestados del cierre con los del presupuesto actual?'))autofillCierreFromPresupuesto(${idx})`:`autofillCierreFromPresupuesto(${idx})`}">↓ Autocompletar desde presupuesto</button>
    </div>`:""}
    <div class="card" style="padding:12px 14px;margin-bottom:12px;">
      <h3>Resumen de resultado</h3>
      <div class="cierre-resumen-bar ${barClass}">
        <div class="crb-item"><div class="crbl">Resultado presupuestado</div><div class="crbv">${margenPresup>=0?"+":""}${fmtCLP(margenPresup)}</div></div>
        <div class="crb-item"><div class="crbl">Resultado real</div><div class="crbv" style="font-size:20px;">${margenReal>=0?"+":""}${fmtCLP(margenReal)}</div></div>
        <div class="crb-item"><div class="crbl">Diferencia vs. presupuesto</div><div class="crbv">${margenDiff>=0?"+":""}${fmtCLP(margenDiff)}</div></div>
      </div>
    </div>
    <div class="card" style="padding:12px 14px;">
      <h3>Desglose por categoría <span style="font-weight:400;font-size:10px;color:#bbb;margin-left:6px;">— editá presupuestado y real, la diferencia se calcula sola</span></h3>
      ${catsHTML}
    </div>
    <p style="font-size:10px;color:#bbb;margin-top:8px;">Diferencia: positivo = dentro o mejor que el presupuesto · negativo = se pasó o quedó corto.</p>
  </div>`;
}

function updateCierreItem(showIdx,ci,ii,field,value){
  if(!SHOWS[showIdx].cierre)SHOWS[showIdx].cierre=defaultCierre();
  const it=SHOWS[showIdx].cierre.categorias[ci].items[ii];
  if(!it)return;
  if(field==="presup"||field==="real")it[field]=parseFloat(value)||0;
  else it[field]=value.trim();
  saveCierre(showIdx);
  rerenderCierre(showIdx);
}
function addCierreItem(showIdx,ci){
  if(!SHOWS[showIdx].cierre)SHOWS[showIdx].cierre=defaultCierre();
  SHOWS[showIdx].cierre.categorias[ci].items.push({desc:"Nuevo ítem",presup:0,real:0});
  saveCierre(showIdx);
  rerenderCierre(showIdx);
  toast("➕ Ítem agregado");
}
function removeCierreItem(showIdx,ci,ii){
  if(!SHOWS[showIdx].cierre)return;
  SHOWS[showIdx].cierre.categorias[ci].items.splice(ii,1);
  saveCierre(showIdx);
  rerenderCierre(showIdx);
}
function autofillCierreFromPresupuesto(showIdx){
  const s=SHOWS[showIdx];
  if(!s.presupuesto||!s.cierre)return;
  s.presupuesto.categorias.forEach(pcat=>{
    const ccat=s.cierre.categorias.find(c=>c.key===pcat.key);
    if(!ccat)return;
    pcat.items.forEach(pit=>{
      const existing=ccat.items.find(it=>it.desc===pit.desc);
      if(existing){existing.presup=pit.monto||0;}
      else{ccat.items.push({desc:pit.desc,presup:pit.monto||0,real:0});}
    });
  });
  const ingrCat=s.cierre.categorias.find(c=>c.key==="ingresos");
  if(ingrCat){
    const ingrEst=Math.round(s.aforo*s.obj)*s.ticket;
    const pref=ingrCat.items.find(i=>i.desc==="Zona Preferente");
    const gen=ingrCat.items.find(i=>i.desc==="Zona General");
    if(pref&&pref.presup===0)pref.presup=Math.round(ingrEst*0.60);
    if(gen&&gen.presup===0)gen.presup=Math.round(ingrEst*0.40);
  }
  saveCierre(showIdx);
  rerenderCierre(showIdx);
  toast("✅ Cierre autocompletado desde presupuesto");
}
function rerenderCierre(showIdx){
  const s=SHOWS[showIdx];
  const isPanel=document.getElementById("panel-overlay").classList.contains("open");
  if(isPanel&&document.getElementById("pt-cierre-btn")&&document.getElementById("pt-cierre-btn").classList.contains("active")){
    document.getElementById("pnl-tab-body").innerHTML=cierreShowHTML(s,showIdx,true);
  } else if(fullDetailIdx===showIdx&&fullDetailActiveTab==="cierre"){
    document.getElementById("fd-body").innerHTML=cierreShowHTML(s,showIdx,false);
  }
}

// ── INVITADOS HTML ──
function guestStatColor(st){
  if(st==="Confirmado")return"gs-conf";
  if(st==="En negociación")return"gs-neg";
  if(st==="Cancelado")return"gs-canc";
  return"gs-pend";
}
function invitadosHTML(s,idx,compact){
  const invs=s.invitados||[];
  const w=compact?"":"max-width:780px;";
  const totalPago=invs.filter(g=>g.estado==="Confirmado").reduce((a,g)=>a+(parseFloat(g.pago)||0),0);
  const totalTodos=invs.reduce((a,g)=>a+(parseFloat(g.pago)||0),0);
  const rows=invs.length?invs.map((g,gi)=>`
    <div class="guest-row">
      <input class="guest-input" type="text" value="${(g.nombre||"").replace(/"/g,'&quot;')}" placeholder="Nombre invitado" onblur="updateGuest(${idx},${gi},'nombre',this.value)">
      <input class="guest-input" type="text" value="${(g.rol||"").replace(/"/g,'&quot;')}" placeholder="Rol / tipo" onblur="updateGuest(${idx},${gi},'rol',this.value)">
      <select class="guest-sel ${guestStatColor(g.estado)}" onchange="updateGuest(${idx},${gi},'estado',this.value);this.className='guest-sel '+guestStatColor(this.value)">
        <option ${g.estado==="Confirmado"?"selected":""}>Confirmado</option>
        <option ${g.estado==="En negociación"?"selected":""}>En negociación</option>
        <option ${g.estado==="Pendiente"?"selected":""}>Pendiente</option>
        <option ${g.estado==="Cancelado"?"selected":""}>Cancelado</option>
      </select>
      <input class="guest-input val-g" type="number" value="${g.pago||0}" placeholder="0" onblur="updateGuest(${idx},${gi},'pago',this.value)" onfocus="this.select()">
      <button class="bgt-del-btn" onclick="removeGuest(${idx},${gi})" title="Eliminar">✕</button>
    </div>`).join(""):`<div style="padding:20px 12px;text-align:center;font-size:12px;color:#bbb;">Sin invitados cargados todavía.</div>`;
  return`
    <div style="${w}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-size:11px;color:#888;">${invs.length} invitado${invs.length!==1?"s":""} · <span title="Solo se suman los Confirmados al presupuesto">Confirmados: <strong style="color:var(--r600);">${fmtCLP(totalPago)}</strong></span>${totalTodos!==totalPago?` · Todos: <span style="color:#aaa;">${fmtCLP(totalTodos)}</span>`:""} ${totalPago>0?'<span style="font-size:10px;color:var(--t600);margin-left:4px;">✔ sumado a RRHH en presupuesto</span>':""}</span>
        <button class="btn btn-primary" onclick="addGuest(${idx})" style="font-size:11px;">+ Agregar invitado</button>
        <button class="btn" onclick="forceSyncInvitados(${idx})" style="font-size:11px;" title="Forzar actualización en Presupuesto y Cierre">🔄 Sincronizar</button>
      </div>
      <div class="card" style="padding:0;overflow:hidden;">
        <div class="guest-hdr" style="display:grid;grid-template-columns:1fr 120px 130px 110px 28px;gap:6px;">
          <div>Nombre</div><div>Rol / tipo</div><div>Estado</div><div style="text-align:right;">Pago (CLP)</div><div></div>
        </div>
        ${rows}
      </div>
      ${invs.length?`<div class="guest-total-bar"><span>Cache confirmados (→ RRHH presupuesto)</span><span style="font-weight:700;">-${fmtCLP(totalPago)}</span></div>`:""}
      <p style="font-size:10px;color:#bbb;margin-top:8px;">Los campos se guardan automáticamente al hacer clic afuera. Solo los invitados <strong>Confirmados</strong> se suman al presupuesto y cierre (categoría RRHH).</p>
    </div>`;
}

function updateGuest(showIdx,gi,field,value){
  if(!SHOWS[showIdx].invitados)SHOWS[showIdx].invitados=[];
  const g=SHOWS[showIdx].invitados[gi];
  if(!g)return;
  if(field==="pago")g.pago=parseFloat(value)||0;
  else g[field]=value.trim()?value.trim():(field==="estado"?"Pendiente":value);
  syncInvitadosToPresupuesto(showIdx);
  saveInvitados(showIdx);
  savePresupuesto(showIdx);
  saveCierre(showIdx);
  const s=SHOWS[showIdx];
  const isPanel=document.getElementById("panel-overlay").classList.contains("open");
  if(isPanel){document.getElementById("pnl-tab-body").innerHTML=invitadosHTML(s,showIdx,true);}
  else if(fullDetailIdx===showIdx){document.getElementById("fd-body").innerHTML=invitadosHTML(s,showIdx,false);}
}
function addGuest(showIdx){
  if(!SHOWS[showIdx].invitados)SHOWS[showIdx].invitados=[];
  SHOWS[showIdx].invitados.push({nombre:"",rol:"",estado:"Pendiente",pago:0});
  syncInvitadosToPresupuesto(showIdx);
  saveInvitados(showIdx);
  savePresupuesto(showIdx);
  saveCierre(showIdx);
  const s=SHOWS[showIdx];
  const isPanel=document.getElementById("panel-overlay").classList.contains("open");
  if(isPanel){document.getElementById("pnl-tab-body").innerHTML=invitadosHTML(s,showIdx,true);}
  else if(fullDetailIdx===showIdx){document.getElementById("fd-body").innerHTML=invitadosHTML(s,showIdx,false);}
  toast("➕ Invitado agregado");
}
function removeGuest(showIdx,gi){
  if(!SHOWS[showIdx].invitados)return;
  SHOWS[showIdx].invitados.splice(gi,1);
  syncInvitadosToPresupuesto(showIdx);
  saveInvitados(showIdx);
  savePresupuesto(showIdx);
  saveCierre(showIdx);
  const s=SHOWS[showIdx];
  const isPanel=document.getElementById("panel-overlay").classList.contains("open");
  if(isPanel){document.getElementById("pnl-tab-body").innerHTML=invitadosHTML(s,showIdx,true);}
  else if(fullDetailIdx===showIdx){document.getElementById("fd-body").innerHTML=invitadosHTML(s,showIdx,false);}
}

function syncInvitadosToPresupuesto(showIdx){
  const s=SHOWS[showIdx];
  const totalConfirmados=(s.invitados||[]).filter(g=>g.estado==="Confirmado").reduce((a,g)=>a+(parseFloat(g.pago)||0),0);
  const AUTO_DESC="Artistas / Invitados (auto)";

  if(!s.presupuesto)s.presupuesto=defaultPresupuesto(s.tipo);
  const pRRHH=s.presupuesto.categorias.find(c=>
    c.key==="rrhh_ext"||c.key==="rrhh"||
    (c.nombre&&(c.nombre==="Staff extra"||c.nombre==="RRHH"))
  );
  if(pRRHH){
    const existing=pRRHH.items.find(it=>it.desc===AUTO_DESC);
    if(existing){existing.monto=totalConfirmados;}
    else{pRRHH.items.push({desc:AUTO_DESC,monto:totalConfirmados});}
  } else if(s.presupuesto.categorias.length>0){
    const lastCat=s.presupuesto.categorias[s.presupuesto.categorias.length-1];
    const existing=lastCat.items.find(it=>it.desc===AUTO_DESC);
    if(existing){existing.monto=totalConfirmados;}
    else{lastCat.items.push({desc:AUTO_DESC,monto:totalConfirmados});}
  }

  if(!s.cierre)s.cierre=defaultCierre();
  const cRRHH=s.cierre.categorias.find(c=>c.key==="rrhh"||
    (c.nombre&&(c.nombre==="RRHH"||c.nombre==="Staff extra"))&&!c.esIngreso
  );
  if(cRRHH){
    const existing=cRRHH.items.find(it=>it.desc===AUTO_DESC);
    if(existing){existing.presup=totalConfirmados;}
    else{cRRHH.items.push({desc:AUTO_DESC,presup:totalConfirmados,real:0});}
  }
}
function forceSyncInvitados(showIdx){
  syncInvitadosToPresupuesto(showIdx);
  saveInvitados(showIdx);
  savePresupuesto(showIdx);
  saveCierre(showIdx);
  const s=SHOWS[showIdx];
  const isPanel=document.getElementById("panel-overlay").classList.contains("open");
  if(isPanel){document.getElementById("pnl-tab-body").innerHTML=invitadosHTML(s,showIdx,true);}
  else if(fullDetailIdx===showIdx){document.getElementById("fd-body").innerHTML=invitadosHTML(s,showIdx,false);}
  toast("✅ Invitados sincronizados al presupuesto y cierre");
}

// ── BUILD PRESUP CONSOLIDADO ──
function buildPresupConsolidado(){
  const body=document.getElementById("presup-consolidado-body");
  if(!body)return;
  const shows=SHOWS.filter(s=>s.estado!=="Cancelado");
  if(!shows.length){
    body.innerHTML=`<div class="card" style="text-align:center;color:#bbb;padding:40px;">Sin shows cargados.</div>`;
    return;
  }

  let totPresupIngr=0,totPresupGast=0,totRealIngr=0,totRealGast=0;
  let showsConCierre=0;

  const rows=shows.map(s=>{
    const p=s.presupuesto||defaultPresupuesto(s.tipo||sh.tipo||"");
    const gastosPresup=p.categorias.reduce((a,cat)=>a+cat.items.reduce((b,it)=>b+(parseFloat(it.monto)||0),0),0);
    const ingrPresup=Math.round(s.aforo*s.obj)*s.ticket;
    const margenPresup=ingrPresup-gastosPresup;
    totPresupIngr+=ingrPresup; totPresupGast+=gastosPresup;

    const c=s.cierre||null;
    let ingrReal=null,gastosReal=null,margenReal=null;
    if(c){
      const ingrCat=c.categorias.find(cat=>cat.esIngreso);
      const ir=ingrCat?ingrCat.items.reduce((a,it)=>a+(parseFloat(it.real)||0),0):0;
      const gr=c.categorias.filter(cat=>!cat.esIngreso).reduce((a,cat)=>a+cat.items.reduce((b,it)=>b+(parseFloat(it.real)||0),0),0);
      if(ir>0||gr>0){ingrReal=ir;gastosReal=gr;margenReal=ir-gr;showsConCierre++;totRealIngr+=ir;totRealGast+=gr;}
    }

    const margenPresupCol=margenPresup>=0?"var(--t600)":"var(--r600)";
    const margenRealCol=margenReal===null?"#ccc":margenReal>=0?"var(--t600)":"var(--r600)";
    const diff=margenReal!==null?margenReal-margenPresup:null;
    const diffCol=diff===null?"#ccc":diff>=0?"var(--t600)":"var(--r600)";

    return`<div class="bgt-consolidado-row">
      <div style="font-weight:500;font-size:12px;">${s.nombre}<br><span style="font-size:10px;color:#bbb;">${fmtDate(s.fecha)} · ${s.ciudad}</span></div>
      <div style="color:var(--t600);font-size:11px;">${fmtCLP(ingrPresup)}<br><span style="color:var(--r600);font-size:10px;">-${fmtCLP(gastosPresup)}</span></div>
      <div style="color:${margenPresupCol};font-weight:600;">${margenPresup>=0?"+":""}${fmtCLP(margenPresup)}</div>
      <div style="color:${margenRealCol};font-weight:600;">${margenReal!==null?(margenReal>=0?"+":"")+fmtCLP(margenReal):"—"}</div>
      <div style="color:${diffCol};font-weight:700;">${diff!==null?(diff>=0?"+":"")+fmtCLP(diff):"—"}</div>
    </div>`;
  }).join("");

  const totMargenPresup=totPresupIngr-totPresupGast;
  const totMargenReal=totRealIngr-totRealGast;
  const totDiff=showsConCierre>0?totMargenReal-totMargenPresup:null;
  const presupPct=totPresupIngr>0?Math.round(totMargenPresup/totPresupIngr*100):0;
  const realPct=totRealIngr>0?Math.round(totMargenReal/totRealIngr*100):0;

  body.innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">
      <div class="card">
        <h3>Presupuestado vs. Real — temporada</h3>
        <div class="fr"><div class="frl">Ingresos presupuestados</div><div class="frv" style="color:var(--t600);">${fmtCLP(totPresupIngr)}</div></div>
        <div class="fr"><div class="frl">Gastos presupuestados</div><div class="frv" style="color:var(--r600);">-${fmtCLP(totPresupGast)}</div></div>
        <div class="ftot"><div class="ftl">Margen presupuestado</div><div class="ftv" style="color:${totMargenPresup>=0?"var(--t200)":"var(--c200)"};">${totMargenPresup>=0?"+":""}${fmtCLP(totMargenPresup)} <span style="font-size:11px;opacity:0.7;">(${presupPct}%)</span></div></div>
      </div>
      <div class="card">
        <h3>Resultado real acumulado ${showsConCierre>0?"· "+showsConCierre+" show"+( showsConCierre!==1?"s":"")+" cerrado"+( showsConCierre!==1?"s":""):""}</h3>
        ${showsConCierre>0?`
        <div class="fr"><div class="frl">Ingresos reales</div><div class="frv" style="color:var(--t600);">${fmtCLP(totRealIngr)}</div></div>
        <div class="fr"><div class="frl">Gastos reales</div><div class="frv" style="color:var(--r600);">-${fmtCLP(totRealGast)}</div></div>
        <div class="ftot"><div class="ftl">Margen real</div><div class="ftv" style="color:${totMargenReal>=0?"var(--t200)":"var(--c200)"};">${totMargenReal>=0?"+":""}${fmtCLP(totMargenReal)} <span style="font-size:11px;opacity:0.7;">(${realPct}%)</span></div></div>
        `:`<div style="color:#bbb;font-size:12px;padding:20px 0;text-align:center;">Cargá cierres en los shows para ver resultados reales.</div>`}
      </div>
    </div>
    <div class="card" style="padding:0;overflow:hidden;margin-bottom:14px;">
      <div class="bgt-consolidado-hdr" style="display:grid;grid-template-columns:1fr 90px 90px 90px 80px;gap:8px;">
        <div>Show</div><div>Ing. est. / Gastos</div><div>Margen ppto.</div><div>Margen real</div><div>Diferencia</div>
      </div>
      ${rows}
      <div class="bgt-consolidado-row" style="background:var(--p900);color:#fff;border-radius:0 0 10px 10px;">
        <div style="font-weight:700;">TOTAL TEMPORADA<br><span style="font-size:10px;opacity:0.55;">${shows.length} shows activos · ${showsConCierre} cerrados</span></div>
        <div style="font-size:11px;color:var(--t200);">${fmtCLP(totPresupIngr)}<br><span style="color:var(--c200);font-size:10px;">-${fmtCLP(totPresupGast)}</span></div>
        <div style="color:${totMargenPresup>=0?"var(--t200)":"var(--c200)"};font-weight:700;">${totMargenPresup>=0?"+":""}${fmtCLP(totMargenPresup)}</div>
        <div style="color:${showsConCierre>0?(totMargenReal>=0?"var(--t200)":"var(--c200)"):"#aaa"};font-weight:700;">${showsConCierre>0?(totMargenReal>=0?"+":"")+fmtCLP(totMargenReal):"—"}</div>
        <div style="color:${totDiff!==null?(totDiff>=0?"var(--t200)":"var(--c200)"):"#aaa"};font-weight:700;">${totDiff!==null?(totDiff>=0?"+":"")+fmtCLP(totDiff):"—"}</div>
      </div>
    </div>`;
}