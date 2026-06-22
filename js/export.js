// ── EXPORT CSV ──
function exportCSV(){
  const headers=["N°","Nombre","Venue","Ciudad","Fecha","Hora","Tipo","Estado","Aforo","% Objetivo","Ticket CLP","Entradas Estimadas","Ingreso Estimado","Entradas Vendidas","Notas"];
  const rows=SHOWS.map(s=>[
    s.n,s.nombre,s.venue,s.ciudad,fmtDate(s.fecha),s.hora,s.tipo,s.estado,
    s.aforo,Math.round(s.obj*100)+"%",s.ticket,
    Math.round(s.aforo*s.obj),Math.round(s.aforo*s.obj)*s.ticket,
    s.vendidas||"",s.notas||""
  ].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(","));
  const csv="\uFEFF"+[headers.join(","),...rows].join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download="QueseProduce_2026.csv";a.click();
  URL.revokeObjectURL(url);
  toast("✅ CSV exportado — importá en Google Sheets con Archivo → Importar");
}

function exportSingleShow(idx){
  const s=SHOWS[idx];
  const role=currentUser?ROLE_DEFS[currentUser.rol]:null;
  const hideFin=role?!role.showFinancials:false;
  const lines=["QueseProduce · Ficha de Show","","Campo,Valor",
    `"Nombre","${s.nombre}"`,`"Venue","${s.venue}"`,`"Ciudad","${s.ciudad}"`,
    `"Fecha","${fmtDate(s.fecha)}"`,`"Hora","${s.hora}"`,`"Tipo","${s.tipo}"`,
    `"Estado","${s.estado}"`,`"Aforo total","${s.aforo}"`,
    `"% Objetivo","${Math.round(s.obj*100)}%"`,
    ...(hideFin?[]:[
      `"Ticket CLP","${s.ticket}"`,
      `"Entradas estimadas","${Math.round(s.aforo*s.obj)}"`,
      `"Ingreso estimado","${Math.round(s.aforo*s.obj)*s.ticket}"`
    ]),
    `"Entradas vendidas","${s.vendidas||""}"`,`"Notas","${s.notas||""}"`
  ];
  const blob=new Blob(["\uFEFF"+lines.join("\n")],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=`Ficha_${s.nombre.replace(/[^a-z0-9]/gi,"_")}.csv`;a.click();
  URL.revokeObjectURL(url);
  toast("✅ Ficha exportada");
}

// ── DOWNLOAD COMPLETE SHOW ──
function downloadShowComplete(idxParam){
  const idx=(idxParam===undefined||idxParam===null)?fullDetailIdx:idxParam;
  if(idx===null||idx===undefined||!SHOWS[idx])return;
  const s=SHOWS[idx];

  function safeTab(fn,label){ try{return fn();}catch(e){return`<div class="section-block"><h2>${label}</h2><p style="color:#bbb;font-size:12px;">No hay datos disponibles.</p></div>`;} }
  const tabs=[
    {label:"Información general",html:safeTab(()=>fullDetailInfoHTML(s,idx),"Información general")},
    {label:"Ficha técnica",html:safeTab(()=>fullDetailFichaHTML(s,idx),"Ficha técnica")},
    {label:"Hoja de ruta",html:safeTab(()=>fullDetailRoadmapHTML(s,idx),"Hoja de ruta")},
    {label:"Presupuesto",html:safeTab(()=>presupuestoShowHTML(s,idx,false),"Presupuesto")},
    {label:"Invitados",html:safeTab(()=>invitadosHTML(s,idx,false),"Invitados")},
    {label:"Cierre",html:safeTab(()=>cierreShowHTML(s,idx,false),"Cierre")},
    {label:"Fotos / Multimedia",html:safeTab(()=>multimediaExportHTML(s,idx),"Fotos / Multimedia")},
  ];
  const allCSS=Array.from(document.styleSheets).map(sheet=>{ try{return Array.from(sheet.cssRules||[]).map(r=>r.cssText).join("\n");} catch(e){return"";} }).join("\n");
  function multimediaExportHTML(s,idx){
    const photos=_photoCache[idx]||[];
    if(!photos.length)return`<p style="color:#bbb;font-size:12px;padding:12px 0;">No hay fotos cargadas para este show.</p>`;
    return`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-top:10px;">
      ${photos.map(p=>`<div style="border-radius:8px;overflow:hidden;border:0.5px solid rgba(255,255,255,0.12);"><img src="${p.src}" alt="${p.label||p.cat||""}" style="width:100%;height:160px;object-fit:cover;display:block;"><div style="padding:7px 10px;font-size:10px;color:#B7B2DA;background:var(--surface);">${p.cat||"Otros"}${p.label?` · ${p.label}`:""}</div></div>`).join("")}
    </div>`;
  }
  tabs[tabs.length-1].html=safeTab(()=>multimediaExportHTML(s,idx),"Fotos / Multimedia");

  const sectionsHTML=tabs.map((t,ti)=>`<div class="dl-section${ti===0?" dl-first":""}"><div class="dl-section-title">${t.label}</div><div class="dl-section-body">${t.html}</div></div>`).join("");
  const printStyles=`
    @media print{ body{background:#1E1948!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;} .dl-section{page-break-before:always;} .dl-section.dl-first{page-break-before:avoid;} .dl-header,.dl-toc{page-break-after:avoid;page-break-inside:avoid;} .dl-section-title{page-break-after:avoid;page-break-inside:avoid;} .card,.rm-section{page-break-inside:avoid;} table{page-break-inside:auto;} thead{display:table-header-group;} tr{page-break-inside:avoid;} input,select,button[contenteditable],[contenteditable]{-webkit-user-select:text;} .btn,.bgt-del-btn,.bgt-add-btn,.ph-close,.edit-btn{display:none!important;} }
    .dl-header{ padding:28px 32px 20px; border-bottom:3px solid var(--c400); display:flex;align-items:flex-end;justify-content:space-between; margin-bottom:0; background:var(--surface2); }
    .dl-logo{font-family:'Oswald','Inter',sans-serif;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--p400);margin-bottom:4px;}
    .dl-show-name{font-family:'Oswald','Inter',sans-serif;font-size:28px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:-0.5px;line-height:1.1;}
    .dl-show-sub{font-size:12px;color:#9690C2;margin-top:4px;}
    .dl-meta-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:600;background:var(--c400);color:#fff;margin-top:8px;}
    .dl-toc{display:flex;gap:8px;flex-wrap:wrap;padding:14px 32px;background:rgba(255,255,255,0.04);border-bottom:1px solid var(--border-soft);}
    .dl-toc-item{font-size:10px;font-weight:600;color:#9690C2;text-transform:uppercase;letter-spacing:0.4px;padding:3px 9px;background:var(--surface);border-radius:5px;border:0.5px solid var(--border-soft);}
    .dl-section{padding:28px 32px;} .dl-section+.dl-section{border-top:1px solid var(--border-soft);}
    .dl-section-title{font-family:'Oswald','Inter',sans-serif;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--p400);margin-bottom:18px;padding-bottom:8px;border-bottom:1px solid var(--border-soft);}
    .dl-section-body .ftl{color:#B7AEEC!important;}
    .dl-section-body [contenteditable]:empty::after{content:"Sin datos";color:#7A74A8;font-style:italic;font-size:12px;}
    .dl-section-body .fv:empty::after{content:"—";color:#7A74A8;}
    .dl-section-body button:not([style*="display:none"]):not(.btn-success){display:none!important;}
    .dl-section-body select{pointer-events:none;}
    .dl-section-body [contenteditable]{outline:none!important;border-bottom:none!important;cursor:default!important;}
    .dl-section-body > div[style*="max-width"]{max-width:100%!important;}
  `;

  const fecha=fmtDate(s.fecha);
  const htmlContent=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${s.nombre} · QueseProduce 2026</title><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><style>${allCSS}${printStyles} body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:radial-gradient(circle at 15% 0%,#241E58 0%,#150F38 55%,#0F0B29 100%);color:#F5F4FB;font-size:14px;margin:0;min-height:100vh;}</style></head><body><div class="dl-header"><div><div class="dl-logo">QueseProduce · Plataforma de Producción</div><div class="dl-show-name">${s.nombre}</div><div class="dl-show-sub">${s.venue} · ${s.ciudad} · ${fecha} · ${s.hora}</div><div class="dl-meta-chip">${estEmoji(s.estado)} ${s.estado}</div></div><div style="text-align:right;font-size:11px;color:#9690C2;"><div>Descargado el ${new Date().toLocaleDateString("es-CL",{day:"2-digit",month:"long",year:"numeric"})}</div><div style="margin-top:3px;">Generado por ${currentUser?currentUser.nombre:"—"}</div></div></div><div class="dl-toc">${tabs.map(t=>`<div class="dl-toc-item">${t.label}</div>`).join("")}</div>${sectionsHTML}<script>document.querySelectorAll('input[type="number"], input[type="text"], .bgt-del-btn, .bgt-add-btn').forEach(el=>{ if(el.tagName==='INPUT'){ const span=document.createElement('span'); span.textContent=el.value; span.style.cssText='font-size:inherit;color:inherit;font-family:inherit;'; el.parentNode.replaceChild(span,el); } }); setTimeout(()=>window.print(),600);<\/script></body></html>`;

  const blob=new Blob([htmlContent],{type:"text/html;charset=utf-8;"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=`${s.nombre.replace(/[^a-z0-9áéíóúüñ\s]/gi,"_").replace(/\s+/g,"_")}_QueseProduce.html`;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
  toast("📥 Descargando — abrí el archivo y usá Imprimir → Guardar como PDF");
}