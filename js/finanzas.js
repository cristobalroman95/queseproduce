function svgBar(pct,color,width=120){
  const w=Math.max(0,Math.min(100,pct));
  return`<svg width="${width}" height="10" style="border-radius:4px;overflow:hidden;background:#eee;display:block;"><rect width="${w*width/100}" height="10" fill="${color}" rx="3"/></svg>`;
}

function buildFinGraficos(){
  const body=document.getElementById("fin-graficos-body");
  if(!body)return;
  const shows=SHOWS.filter(s=>s.estado!=="Cancelado");
  if(!shows.length){body.innerHTML=`<div class="card" style="text-align:center;color:#bbb;padding:40px;">Sin shows cargados.</div>`;return;}

  const maxIngr=Math.max(...shows.map(s=>Math.round(s.aforo*s.obj)*s.ticket));
  const ingrVsGastRows=shows.map(s=>{
    const p=s.presupuesto||defaultPresupuesto(s.tipo||sh.tipo||"");
    const ingr=Math.round(s.aforo*s.obj)*s.ticket;
    const gast=p.categorias.reduce((a,cat)=>a+cat.items.reduce((b,it)=>b+(parseFloat(it.monto)||0),0),0);
    const margen=ingr-gast;
    const pctIngr=maxIngr>0?Math.round(ingr/maxIngr*100):0;
    const pctGast=maxIngr>0?Math.round(gast/maxIngr*100):0;
    const mc=margen>=0?"var(--t600)":"var(--r600)";
    const c=s.cierre?`<span style="font-size:9px;background:var(--t50);color:var(--t800);padding:1px 5px;border-radius:8px;margin-left:4px;">cierre</span>`:"";
    return`<tr>
      <td style="padding:6px 8px 6px 14px;font-size:11px;font-weight:500;white-space:nowrap;">${s.nombre}${c}<br><span style="font-size:9px;color:#bbb;">${fmtDate(s.fecha)}</span></td>
      <td style="padding:6px 8px;">
        <div style="display:flex;flex-direction:column;gap:3px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:180px;">${svgBar(pctIngr,"var(--t300)",180)}</div>
            <span style="font-size:10px;color:var(--t800);min-width:80px;">${fmtCLP(ingr)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:180px;">${svgBar(pctGast,"var(--r200)",180)}</div>
            <span style="font-size:10px;color:var(--r600);min-width:80px;">-${fmtCLP(gast)}</span>
          </div>
        </div>
      </td>
      <td style="padding:6px 14px 6px 8px;font-weight:700;color:${mc};font-size:12px;text-align:right;">${margen>=0?"+":""}${fmtCLP(margen)}</td>
    </tr>`;
  }).join("");

  const TIPOS=["Teatro","Show Bar","Especial","Digital","Otro"];
  const tipoData=TIPOS.map(tipo=>{
    const sh=shows.filter(s=>s.tipo===tipo);
    if(!sh.length)return null;
    const totalIngr=sh.reduce((a,s)=>a+Math.round(s.aforo*s.obj)*s.ticket,0);
    const totalGast=sh.reduce((a,s)=>{const p=s.presupuesto||defaultPresupuesto(s.tipo||sh.tipo||"");return a+p.categorias.reduce((b,cat)=>b+cat.items.reduce((c,it)=>c+(parseFloat(it.monto)||0),0),0);},0);
    const margen=totalIngr-totalGast;
    const pct=totalIngr>0?Math.round(margen/totalIngr*100):0;
    return{tipo,count:sh.length,totalIngr,totalGast,margen,pct};
  }).filter(Boolean);

  const maxTipoIngr=Math.max(...tipoData.map(t=>t.totalIngr));
  const tipoRows=tipoData.map(t=>{
    const pI=maxTipoIngr>0?Math.round(t.totalIngr/maxTipoIngr*100):0;
    const pG=maxTipoIngr>0?Math.round(t.totalGast/maxTipoIngr*100):0;
    const mc=t.margen>=0?"var(--t600)":"var(--r600)";
    const pc=t.pct>=0?"var(--t600)":"var(--r600)";
    return`<tr>
      <td style="padding:8px 8px 8px 14px;font-size:12px;font-weight:600;">${t.tipo} <span style="font-weight:400;color:#bbb;font-size:10px;">(${t.count})</span></td>
      <td style="padding:8px;">
        <div style="display:flex;flex-direction:column;gap:3px;">
          <div style="display:flex;align-items:center;gap:6px;">${svgBar(pI,"var(--t300)",160)}<span style="font-size:10px;color:var(--t800);">${fmtCLP(t.totalIngr)}</span></div>
          <div style="display:flex;align-items:center;gap:6px;">${svgBar(pG,"var(--r200)",160)}<span style="font-size:10px;color:var(--r600);">-${fmtCLP(t.totalGast)}</span></div>
        </div>
      </td>
      <td style="text-align:right;padding:8px;font-weight:700;color:${mc};font-size:12px;">${t.margen>=0?"+":""}${fmtCLP(t.margen)}</td>
      <td style="text-align:right;padding:8px 14px 8px 8px;font-weight:700;color:${pc};font-size:13px;">${t.pct}%</td>
    </tr>`;
  }).join("");

  const CAT_KEYS=["rrhh","tecnica","produccion","marketing"];
  const CAT_NAMES={"rrhh":"RRHH","tecnica":"Técnica","produccion":"Producción","marketing":"Marketing"};
  const CAT_COLORS_HEX={"rrhh":"#7F77DD","tecnica":"#378ADD","produccion":"#1D9E75","marketing":"#BA7517"};
  let totalGastCat=0;
  const catTotals=CAT_KEYS.map(key=>{
    let sum=0;
    shows.forEach(s=>{const p=s.presupuesto||defaultPresupuesto(s.tipo||sh.tipo||"");const cat=p.categorias.find(c=>c.key===key);if(cat)sum+=cat.items.reduce((a,it)=>a+(parseFloat(it.monto)||0),0);});
    totalGastCat+=sum;
    return{key,sum};
  });
  const catPcts=catTotals.map(c=>({...c,pct:totalGastCat>0?Math.round(c.sum/totalGastCat*100):0}));

  const R=60,cx=80,cy=80,stroke=22;
  let cumAngle=-90;
  const slices=catPcts.map(c=>{
    const angle=c.pct*3.6;
    const startA=(cumAngle)*Math.PI/180;
    const endA=(cumAngle+angle)*Math.PI/180;
    const x1=cx+R*Math.cos(startA),y1=cy+R*Math.sin(startA);
    const x2=cx+R*Math.cos(endA),y2=cy+R*Math.sin(endA);
    const large=angle>180?1:0;
    const col=CAT_COLORS_HEX[c.key];
    const path=`<path d="M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z" fill="${col}" opacity="0.85"/>`;
    cumAngle+=angle;
    return path;
  }).join("");
  const donutSVG=`<svg width="160" height="160" viewBox="0 0 160 160">
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#eee" stroke-width="${stroke}"/>
    ${slices}
    <circle cx="${cx}" cy="${cy}" r="${R-stroke/2-2}" fill="#fff"/>
    <text x="${cx}" y="${cy-4}" text-anchor="middle" font-size="9" fill="#888">Total gastos</text>
    <text x="${cx}" y="${cy+10}" text-anchor="middle" font-size="10" font-weight="600" fill="#333">${fmtCLP(totalGastCat)}</text>
  </svg>`;

  const catLegend=catPcts.map(c=>`
    <div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:0.5px solid #f0f0ee;">
      <div style="width:10px;height:10px;border-radius:2px;background:${CAT_COLORS_HEX[c.key]};flex-shrink:0;"></div>
      <div style="flex:1;font-size:11px;">${CAT_NAMES[c.key]}</div>
      <div style="font-size:11px;color:#B7B2DA;">${fmtCLP(c.sum)}</div>
      <div style="font-size:11px;font-weight:700;color:${CAT_COLORS_HEX[c.key]};min-width:34px;text-align:right;">${c.pct}%</div>
    </div>`).join("");

  body.innerHTML=`
    <div class="card" style="margin-bottom:14px;">
      <h3>Ingresos vs. Gastos por show <span style="font-weight:400;font-size:10px;color:#bbb;margin-left:6px;">— verde: ingresos · rojo: gastos</span></h3>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr>
            <th style="padding:6px 8px 6px 14px;text-align:left;font-size:10px;color:#888;font-weight:600;text-transform:uppercase;border-bottom:1px solid #eee;">Show</th>
            <th style="padding:6px 8px;text-align:left;font-size:10px;color:#888;font-weight:600;text-transform:uppercase;border-bottom:1px solid #eee;">Ingresos est. / Gastos presup.</th>
            <th style="padding:6px 14px 6px 8px;text-align:right;font-size:10px;color:#888;font-weight:600;text-transform:uppercase;border-bottom:1px solid #eee;">Margen</th>
          </tr></thead>
          <tbody>${ingrVsGastRows}</tbody>
        </table>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
      <div class="card">
        <h3>Rentabilidad por tipo de show</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr>
            <th style="padding:6px 8px 6px 14px;text-align:left;font-size:10px;color:#888;font-weight:600;border-bottom:1px solid #eee;">Tipo</th>
            <th style="padding:6px 8px;text-align:left;font-size:10px;color:#888;font-weight:600;border-bottom:1px solid #eee;">Ing. / Gasto</th>
            <th style="padding:6px 8px;text-align:right;font-size:10px;color:#888;font-weight:600;border-bottom:1px solid #eee;">Margen</th>
            <th style="padding:6px 14px 6px 8px;text-align:right;font-size:10px;color:#888;font-weight:600;border-bottom:1px solid #eee;">%</th>
          </tr></thead>
          <tbody>${tipoRows}</tbody>
        </table>
      </div>
      <div class="card">
        <h3>Distribución de gastos por categoría</h3>
        <div style="display:flex;align-items:center;gap:20px;margin-top:8px;">
          <div style="flex-shrink:0;">${donutSVG}</div>
          <div style="flex:1;">${catLegend}</div>
        </div>
      </div>
    </div>
    <p style="font-size:11px;color:#aaa;text-align:center;">Gráficos calculados desde presupuestos ingresados en cada show. Para resultados reales, cargá el cierre en cada show.</p>
  `;
}

function buildFinEECC(){
  const body=document.getElementById("fin-eecc-body");
  if(!body)return;
  const shows=SHOWS.filter(s=>s.estado!=="Cancelado");
  if(!shows.length){body.innerHTML=`<div class="card" style="text-align:center;color:#bbb;padding:40px;">Sin shows cargados.</div>`;return;}

  const CAT_KEYS=["rrhh","tecnica","produccion","marketing"];
  const CAT_NAMES={"rrhh":"Recursos Humanos","tecnica":"Técnica & Producción","produccion":"Producción","marketing":"Marketing & Comunicaciones"};

  let totIngrPresup=0,totIngrReal=0;
  let catPresup={},catReal={};
  CAT_KEYS.forEach(k=>{catPresup[k]=0;catReal[k]=0;});

  shows.forEach(s=>{
    const ingr=Math.round(s.aforo*s.obj)*s.ticket;
    totIngrPresup+=ingr;
    const p=s.presupuesto||defaultPresupuesto(s.tipo||sh.tipo||"");
    CAT_KEYS.forEach(key=>{
      const cat=p.categorias.find(c=>c.key===key);
      if(cat)catPresup[key]+=cat.items.reduce((a,it)=>a+(parseFloat(it.monto)||0),0);
    });
    if(s.cierre){
      const ingrCat=s.cierre.categorias.find(c=>c.esIngreso);
      if(ingrCat)totIngrReal+=ingrCat.items.reduce((a,it)=>a+(parseFloat(it.real)||0),0);
      CAT_KEYS.forEach(key=>{
        const ccat=s.cierre.categorias.find(c=>c.key===key);
        if(ccat)catReal[key]+=ccat.items.reduce((a,it)=>a+(parseFloat(it.real)||0),0);
      });
    }
  });

  const hasReal=totIngrReal>0;
  const totGastPresup=CAT_KEYS.reduce((a,k)=>a+catPresup[k],0);
  const totGastReal=CAT_KEYS.reduce((a,k)=>a+catReal[k],0);
  const margenPresup=totIngrPresup-totGastPresup;
  const margenReal=totIngrReal-totGastReal;
  const margenPresupPct=totIngrPresup>0?Math.round(margenPresup/totIngrPresup*100):0;
  const margenRealPct=totIngrReal>0?Math.round(margenReal/totIngrReal*100):0;

  const catRows=CAT_KEYS.map(key=>{
    const pv=catPresup[key];
    const rv=catReal[key];
    const diff=hasReal&&rv>0?rv-pv:null;
    const diffCol=diff===null?"#ccc":diff<=0?"var(--t600)":"var(--r600)";
    return`<tr>
      <td style="padding:7px 8px 7px 14px;font-size:11px;font-weight:500;">${CAT_NAMES[key]}</td>
      <td style="padding:7px 8px;text-align:right;font-size:11px;color:var(--r600);">-${fmtCLP(pv)}</td>
      <td style="padding:7px 8px;text-align:right;font-size:11px;color:var(--r600);">${hasReal&&rv>0?"-"+fmtCLP(rv):"—"}</td>
      <td style="padding:7px 14px 7px 8px;text-align:right;font-size:11px;font-weight:600;color:${diffCol};">${diff===null?"—":diff<=0?"+"+fmtCLP(-diff):"-"+fmtCLP(diff)}</td>
    </tr>`;
  }).join("");

  const showsConCierre=shows.filter(s=>s.cierre&&(s.cierre.categorias||[]).some(c=>c.items.some(it=>parseFloat(it.real)>0))).length;

  body.innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
      <div class="card">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--p600);margin-bottom:10px;">Estado de Resultado — Temporada 2026</div>
        <div style="font-size:10px;color:#bbb;margin-bottom:6px;">Período: Enero – Diciembre 2026 · ${shows.length} shows activos</div>
        <div style="border-top:1px solid #eee;padding-top:8px;">
          <div class="fr"><div class="frl" style="font-weight:600;">Ingresos presupuestados</div><div class="frv" style="color:var(--t600);font-weight:600;">${fmtCLP(totIngrPresup)}</div></div>
          <div class="fr" style="padding-bottom:8px;border-bottom:1px solid #eee;"><div class="frl" style="color:#888;font-size:10px;">Entradas estimadas + objetivos de aforo</div><div class="frv"></div></div>
          <div class="fr" style="margin-top:8px;"><div class="frl" style="font-weight:600;">Gastos totales presupuestados</div><div class="frv" style="color:var(--r600);font-weight:600;">-${fmtCLP(totGastPresup)}</div></div>
        </div>
        <div class="ftot" style="margin-top:10px;">
          <div class="ftl">Resultado neto presupuestado</div>
          <div class="ftv" style="color:${margenPresup>=0?"var(--t200)":"var(--c200)"};">${margenPresup>=0?"+":""}${fmtCLP(margenPresup)} <span style="font-size:11px;opacity:0.7;">(${margenPresupPct}%)</span></div>
        </div>
      </div>
      <div class="card">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${hasReal?"var(--t600)":"#bbb"};margin-bottom:10px;">Resultado Real Acumulado ${hasReal?"· "+showsConCierre+" show"+(showsConCierre!==1?"s":"")+" cerrado"+(showsConCierre!==1?"s":""):""}</div>
        ${hasReal?`
        <div style="font-size:10px;color:#bbb;margin-bottom:6px;">Basado en cierres reales ingresados</div>
        <div style="border-top:1px solid #eee;padding-top:8px;">
          <div class="fr"><div class="frl" style="font-weight:600;">Ingresos reales</div><div class="frv" style="color:var(--t600);font-weight:600;">${fmtCLP(totIngrReal)}</div></div>
          <div class="fr" style="padding-bottom:8px;border-bottom:1px solid #eee;"><div class="frl" style="color:#888;font-size:10px;">Entradas vendidas × ticket real</div><div class="frv"></div></div>
          <div class="fr" style="margin-top:8px;"><div class="frl" style="font-weight:600;">Gastos reales totales</div><div class="frv" style="color:var(--r600);font-weight:600;">-${fmtCLP(totGastReal)}</div></div>
        </div>
        <div class="ftot" style="margin-top:10px;">
          <div class="ftl">Resultado neto real</div>
          <div class="ftv" style="color:${margenReal>=0?"var(--t200)":"var(--c200)"};">${margenReal>=0?"+":""}${fmtCLP(margenReal)} <span style="font-size:11px;opacity:0.7;">(${margenRealPct}%)</span></div>
        </div>
        `:`<div style="padding:30px 0;text-align:center;color:#ccc;font-size:12px;">Ingresá cierres en los shows para ver resultados reales.</div>`}
      </div>
    </div>
    <div class="card" style="padding:0;overflow:hidden;margin-bottom:14px;">
      <div style="padding:12px 14px;border-bottom:1px solid #eee;">
        <h3>Desglose de gastos por categoría <span style="font-weight:400;font-size:10px;color:#bbb;margin-left:6px;">— presupuestado · real · variación</span></h3>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr>
          <th style="padding:7px 8px 7px 14px;text-align:left;font-size:10px;color:#888;font-weight:600;text-transform:uppercase;border-bottom:1px solid #eee;">Categoría</th>
          <th style="padding:7px 8px;text-align:right;font-size:10px;color:#888;font-weight:600;text-transform:uppercase;border-bottom:1px solid #eee;">Presupuestado</th>
          <th style="padding:7px 8px;text-align:right;font-size:10px;color:#888;font-weight:600;text-transform:uppercase;border-bottom:1px solid #eee;">Real</th>
          <th style="padding:7px 14px 7px 8px;text-align:right;font-size:10px;color:#888;font-weight:600;text-transform:uppercase;border-bottom:1px solid #eee;">Variación</th>
        </tr></thead>
        <tbody>
          <tr style="background:var(--g50);"><td colspan="4" style="padding:5px 14px;font-size:10px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.3px;">Egresos operacionales</td></tr>
          ${catRows}
          <tr style="background:var(--p900);">
            <td style="padding:9px 8px 9px 14px;font-weight:700;color:#fff;font-size:12px;">Total egresos</td>
            <td style="padding:9px 8px;text-align:right;font-weight:700;color:var(--c200);font-size:12px;">-${fmtCLP(totGastPresup)}</td>
            <td style="padding:9px 8px;text-align:right;font-weight:700;color:var(--c200);font-size:12px;">${hasReal&&totGastReal>0?"-"+fmtCLP(totGastReal):"—"}</td>
            <td style="padding:9px 14px 9px 8px;text-align:right;font-weight:700;color:${hasReal&&totGastReal>0?(totGastReal<=totGastPresup?"var(--t200)":"var(--c200)"):"#aaa"};font-size:12px;">${hasReal&&totGastReal>0?(totGastReal<=totGastPresup?"+":"-")+fmtCLP(Math.abs(totGastReal-totGastPresup)):"—"}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div style="background:var(--b50);border:0.5px solid var(--b100);border-radius:8px;padding:10px 14px;font-size:11px;color:var(--b800);">
      💡 <strong>Para el contador:</strong> este estado de resultado refleja los datos operativos ingresados en la plataforma. Para cuadrar con la contabilidad oficial, contrastá con los comprobantes de pago y las facturas emitidas/recibidas de cada show.
    </div>
  `;
}

function buildFinFlujo(){
  const body=document.getElementById("fin-flujo-body");
  if(!body)return;
  const shows=SHOWS.filter(s=>s.estado!=="Cancelado");
  if(!shows.length){body.innerHTML=`<div class="card" style="text-align:center;color:#bbb;padding:40px;">Sin shows cargados.</div>`;return;}

  const MESES=["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
  const mesIngresos=new Array(12).fill(0);
  const mesGastos=new Array(12).fill(0);
  const mesShows=new Array(12).fill(null).map(()=>[]);

  shows.forEach(s=>{
    const fecha=s.fecha?new Date(s.fecha):null;
    if(!fecha||isNaN(fecha))return;
    const mes=fecha.getMonth();
    const ingr=Math.round(s.aforo*s.obj)*s.ticket;
    const p=s.presupuesto||defaultPresupuesto(s.tipo||sh.tipo||"");
    const gast=p.categorias.reduce((a,cat)=>a+cat.items.reduce((b,it)=>b+(parseFloat(it.monto)||0),0),0);
    mesIngresos[mes]+=ingr;
    mesGastos[mes]+=gast;
    mesShows[mes].push(s.nombre);
  });

  const maxVal=Math.max(...mesIngresos,...mesGastos,1);
  let acum=0;
  const rows=MESES.map((mes,i)=>{
    const ingr=mesIngresos[i];
    const gast=mesGastos[i];
    const neto=ingr-gast;
    acum+=neto;
    const showList=mesShows[i].length?mesShows[i].join(", "):"Sin shows";
    const pI=Math.round(ingr/maxVal*100);
    const pG=Math.round(gast/maxVal*100);
    const netCol=neto>=0?"var(--t600)":"var(--r600)";
    const acumCol=acum>=0?"var(--t600)":"var(--r600)";
    const now=new Date();
    const esMes=now.getMonth()===i;
    const bgRow=esMes?"background:var(--p50);":"";
    return`<tr style="${bgRow}">
      <td style="padding:7px 8px 7px 14px;font-size:11px;font-weight:${esMes?"700":"500"};white-space:nowrap;">${mes}${esMes?" ←":""}</td>
      <td style="padding:7px 8px;">
        ${ingr>0?`<div style="display:flex;align-items:center;gap:5px;">${svgBar(pI,"var(--t300)",100)}<span style="font-size:10px;color:var(--t800);">${fmtCLP(ingr)}</span></div>`:"<span style='font-size:10px;color:#ddd;'>—</span>"}
      </td>
      <td style="padding:7px 8px;">
        ${gast>0?`<div style="display:flex;align-items:center;gap:5px;">${svgBar(pG,"var(--r200)",100)}<span style="font-size:10px;color:var(--r600);">-${fmtCLP(gast)}</span></div>`:"<span style='font-size:10px;color:#ddd;'>—</span>"}
      </td>
      <td style="padding:7px 8px;text-align:right;font-weight:600;color:${ingr>0||gast>0?netCol:"#ddd"};font-size:11px;">${ingr>0||gast>0?(neto>=0?"+":"")+fmtCLP(neto):"—"}</td>
      <td style="padding:7px 8px;text-align:right;font-weight:700;color:${acumCol};font-size:11px;">${fmtCLP(acum)}</td>
      <td style="padding:7px 14px 7px 8px;font-size:10px;color:#999;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${showList}">${mesShows[i].length?mesShows[i].length+" show"+(mesShows[i].length!==1?"s":"")+" · "+showList:"—"}</td>
    </tr>`;
  }).join("");

  const totIngr=mesIngresos.reduce((a,v)=>a+v,0);
  const totGast=mesGastos.reduce((a,v)=>a+v,0);
  const totNeto=totIngr-totGast;
  const mesConShows=mesShows.filter(m=>m.length>0).length;
  const mejorMes=mesIngresos.reduce((best,v,i)=>v>mesIngresos[best]?i:best,0);
  const peorMes=mesGastos.reduce((peak,v,i)=>v>mesGastos[peak]?i:peak,0);

  body.innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px;">
      <div class="stat-card"><div class="lbl">Total ingresos est.</div><div class="val" style="color:var(--t600);font-size:18px;">${fmtCLP(totIngr)}</div><div class="sub">temporada 2026</div></div>
      <div class="stat-card"><div class="lbl">Total gastos presup.</div><div class="val" style="color:var(--r600);font-size:18px;">${fmtCLP(totGast)}</div><div class="sub">temporada 2026</div></div>
      <div class="stat-card"><div class="lbl">Resultado proyectado</div><div class="val" style="color:${totNeto>=0?"var(--t600)":"var(--r600)"};font-size:18px;">${totNeto>=0?"+":""}${fmtCLP(totNeto)}</div><div class="sub">${totIngr>0?Math.round(totNeto/totIngr*100):0}% margen</div></div>
      <div class="stat-card"><div class="lbl">Meses con actividad</div><div class="val" style="font-size:22px;">${mesConShows}</div><div class="sub">de 12 meses · pico: ${MESES[mejorMes]}</div></div>
    </div>
    <div class="card" style="padding:0;overflow:hidden;margin-bottom:14px;">
      <div style="padding:12px 14px;border-bottom:1px solid #eee;">
        <h3>Flujo de caja proyectado · mensual 2026 <span style="font-weight:400;font-size:10px;color:#bbb;margin-left:6px;">— basado en fechas y presupuestos de cada show</span></h3>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;min-width:600px;">
          <thead><tr>
            <th style="padding:7px 8px 7px 14px;text-align:left;font-size:10px;color:#888;font-weight:600;text-transform:uppercase;border-bottom:1px solid #eee;">Mes</th>
            <th style="padding:7px 8px;text-align:left;font-size:10px;color:#888;font-weight:600;text-transform:uppercase;border-bottom:1px solid #eee;">Ingresos est.</th>
            <th style="padding:7px 8px;text-align:left;font-size:10px;color:#888;font-weight:600;text-transform:uppercase;border-bottom:1px solid #eee;">Gastos presup.</th>
            <th style="padding:7px 8px;text-align:right;font-size:10px;color:#888;font-weight:600;text-transform:uppercase;border-bottom:1px solid #eee;">Neto mes</th>
            <th style="padding:7px 8px;text-align:right;font-size:10px;color:#888;font-weight:600;text-transform:uppercase;border-bottom:1px solid #eee;">Acumulado</th>
            <th style="padding:7px 14px 7px 8px;text-align:left;font-size:10px;color:#888;font-weight:600;text-transform:uppercase;border-bottom:1px solid #eee;">Shows</th>
          </tr></thead>
          <tbody>
            ${rows}
            <tr style="background:var(--p900);">
              <td style="padding:9px 8px 9px 14px;font-weight:700;color:#fff;">TOTAL</td>
              <td style="padding:9px 8px;"><span style="font-size:11px;color:var(--t200);font-weight:700;">${fmtCLP(totIngr)}</span></td>
              <td style="padding:9px 8px;"><span style="font-size:11px;color:var(--c200);font-weight:700;">-${fmtCLP(totGast)}</span></td>
              <td style="padding:9px 8px;text-align:right;font-weight:700;color:${totNeto>=0?"var(--t200)":"var(--c200)"};font-size:12px;">${totNeto>=0?"+":""}${fmtCLP(totNeto)}</td>
              <td colspan="2" style="padding:9px 14px;text-align:right;font-weight:700;color:${totNeto>=0?"var(--t200)":"var(--c200)"};font-size:12px;"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div style="background:var(--a50);border:0.5px solid var(--a100);border-radius:8px;padding:10px 14px;font-size:11px;color:var(--a800);">
      ⚠️ <strong>Nota para contabilidad:</strong> este flujo es proyectado y se basa en las fechas de función de cada show. Los pagos reales a proveedores y la recepción de ingresos pueden ocurrir en fechas distintas. Usá este reporte como referencia operativa y contrastalo con el libro de cuentas corrientes.
    </div>
  `;
}

function presupTab(tab,btn){
  document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  ["consolidado","graficos","eecc","flujo"].forEach(t=>{
    const el=document.getElementById("pt-"+t);
    if(el)el.style.display=t===tab?"block":"none";
  });
  if(tab==="consolidado")buildPresupConsolidado();
  if(tab==="graficos")buildFinGraficos();
  if(tab==="eecc")buildFinEECC();
  if(tab==="flujo")buildFinFlujo();
}