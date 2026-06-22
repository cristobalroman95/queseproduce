// ── DATA VERSION ──
// Incrementá este número cada vez que modifiques DEFAULT_SHOWS para forzar reset del localStorage
const DATA_VERSION = "v11_2";
const DATA_VERSION_KEY = "qp_data_version";

// ── DATA ──
const DEFAULT_SHOWS = [
  {n:1,nombre:"Show Bar · Zona Norte",venue:"Bar Centro Eventos",ciudad:"Ciudad A",fecha:"2026-01-10",hora:"21:00",aforo:300,ticket:9990,obj:0.80,tipo:"Show Bar",estado:"Realizado",vendidas:248,notas:""},
  {n:2,nombre:"Show Bar · Sur",venue:"Restobar Sur",ciudad:"Ciudad B",fecha:"2026-01-17",hora:"22:30",aforo:250,ticket:9990,obj:0.75,tipo:"Show Bar",estado:"Realizado",vendidas:203,notas:""},
  {n:3,nombre:"Teatro 1",venue:"Teatro 1",ciudad:"Ciudad A",fecha:"2026-01-24",hora:"20:00",aforo:600,ticket:17990,obj:0.85,tipo:"Teatro",estado:"Realizado",vendidas:527,notas:""},
  {n:4,nombre:"Show Bar · Centro",venue:"Bar Centro",ciudad:"Ciudad A",fecha:"2026-02-14",hora:"21:00",aforo:300,ticket:9990,obj:0.80,tipo:"Show Bar",estado:"Realizado",vendidas:261,notas:""},
  {n:5,nombre:"Teatro 2",venue:"Teatro 2",ciudad:"Ciudad C",fecha:"2026-03-07",hora:"20:00",aforo:500,ticket:15990,obj:0.80,tipo:"Teatro",estado:"Realizado",vendidas:418,notas:""},
  {n:6,nombre:"Centro Eventos 1",venue:"Centro Eventos 1",ciudad:"Ciudad D",fecha:"2026-03-21",hora:"21:00",aforo:400,ticket:12990,obj:0.75,tipo:"Show Bar",estado:"Realizado",vendidas:312,notas:""},
  {n:7,nombre:"Teatro 3",venue:"Teatro 3",ciudad:"Ciudad E",fecha:"2026-04-18",hora:"20:00",aforo:550,ticket:16990,obj:0.80,tipo:"Teatro",estado:"Realizado",vendidas:461,notas:""},
  {n:8,nombre:"Contenido Digital Bloque",venue:"Estudio Propio",ciudad:"Ciudad A",fecha:"2026-05-10",hora:"10:00",aforo:0,ticket:0,obj:0,tipo:"Digital",estado:"Realizado",vendidas:null,notas:""},
  {n:9,nombre:"Show Especial",venue:"Teatro 1",ciudad:"Ciudad A",fecha:"2026-06-20",hora:"20:00",aforo:800,ticket:22990,obj:0.90,tipo:"Teatro Especial",estado:"Confirmado",vendidas:720,notas:""},
  {n:10,nombre:"Teatro Municipal 1",venue:"Teatro Municipal 1",ciudad:"Ciudad C",fecha:"2026-07-11",hora:"20:00",aforo:563,ticket:19990,obj:0.85,tipo:"Teatro",estado:"Confirmado",vendidas:null,notas:""},
  {n:11,nombre:"Teatro Municipal 2",venue:"Teatro Municipal 2",ciudad:"Ciudad D",fecha:"2026-07-18",hora:"20:00",aforo:700,ticket:19990,obj:0.85,tipo:"Teatro",estado:"Confirmado",vendidas:null,notas:""},
  {n:12,nombre:"Centro Cultural 1",venue:"Centro Cultural 1",ciudad:"Ciudad E",fecha:"2026-07-31",hora:"20:00",aforo:850,ticket:21990,obj:0.85,tipo:"Teatro Especial",estado:"Confirmado",vendidas:null,notas:""},
  {n:13,nombre:"Teatro 4",venue:"Teatro 4",ciudad:"Ciudad H",fecha:"2026-08-21",hora:"20:00",aforo:1200,ticket:24990,obj:0.80,tipo:"Teatro",estado:"Tentativo",vendidas:null,notas:""},
  {n:14,nombre:"Teatro 5",venue:"Teatro 5",ciudad:"Ciudad I",fecha:"2026-08-28",hora:"20:00",aforo:700,ticket:19990,obj:0.80,tipo:"Teatro",estado:"Tentativo",vendidas:null,notas:""},
  {n:15,nombre:"Gira Internacional 1",venue:"Teatro Internacional",ciudad:"Int'l",fecha:"2026-09-18",hora:"20:00",aforo:800,ticket:29990,obj:0.85,tipo:"Teatro",estado:"Confirmado",vendidas:null,notas:""},
  {n:16,nombre:"Centro Eventos 3",venue:"Centro Eventos 3",ciudad:"Ciudad J",fecha:"2026-10-09",hora:"21:00",aforo:120,ticket:9990,obj:0.80,tipo:"Show Bar",estado:"Confirmado",vendidas:null,notas:""},
  {n:17,nombre:"Casino / Venue 1",venue:"Casino Venue 1",ciudad:"Ciudad A",fecha:"2026-11-06",hora:"20:00",aforo:600,ticket:18990,obj:0.75,tipo:"Teatro",estado:"Tentativo",vendidas:null,notas:""},
  {n:18,nombre:"Cierre de Temporada",venue:"Bar Sur",ciudad:"Ciudad K",fecha:"2026-12-05",hora:"22:00",aforo:200,ticket:9990,obj:0.70,tipo:"Show Bar",estado:"Tentativo",vendidas:null,notas:""},
];

// ── PRESETS DE HOJA DE RUTA ──
// Cada preset es una plantilla de horarios estimados según el tipo de show.
// El usuario puede editar libremente después de aplicarla a un show, duplicar presets o crear nuevos.
const DEFAULT_PRESETS_ROADMAP = {
  "teatro":{
    nombre:"Teatro (montaje completo)",
    tipo:"Teatro",
    secciones:[
      {s:"🔧  Montaje y técnica",tasks:[
        {i:"08:00",f:"10:00",area:"Técnica · Iluminador",act:"Llegada y descarga equipo",det:"Coordinación con jefe de sala",est:"Pendiente"},
        {i:"09:00",f:"11:00",area:"Técnica · Sonidista",act:"Instalación sistema PA",det:"Confirmar posición monitores",est:"Pendiente"},
        {i:"10:00",f:"12:00",area:"Producción",act:"Ambientación escenario",det:"Podium, pantalla, branding",est:"Pendiente"},
        {i:"11:00",f:"12:00",area:"Producción",act:"Instalación cámaras",det:"2 cámaras + CCTV perimetral",est:"Pendiente"},
        {i:"12:00",f:"13:00",area:"Sonidista",act:"Line checks y prueba PA",det:"Sin artistas en escenario",est:"Pendiente"},
        {i:"13:00",f:"14:00",area:"Todos",act:"Pausa almuerzo equipo",det:"Catering coordinado",est:"Pendiente"},
      ]},
      {s:"🎙  Ensayos y pruebas",tasks:[
        {i:"14:00",f:"15:30",area:"Dir. Técnico",act:"Prueba de luces y video",det:"Pantalla + proyector + robóticos",est:"Pendiente"},
        {i:"15:30",f:"17:00",area:"Dir. Técnico",act:"Soundcheck artista",det:"Revisar cuñas / nivel de voz",est:"Pendiente"},
        {i:"17:00",f:"18:00",area:"Invitados+Sonidista",act:"Soundcheck invitados",det:"Verificar riders individuales",est:"Pendiente"},
        {i:"18:00",f:"18:30",area:"Todos",act:"Briefing de equipo",det:"Cue list, seguridad, emergencias",est:"Pendiente"},
        {i:"18:30",f:"19:00",area:"Producción",act:"Catering camarines",det:"Agua, snacks, bebidas",est:"Pendiente"},
      ]},
      {s:"🚪  Apertura",tasks:[
        {i:"19:00",f:"20:00",area:"Sala/Boletería",act:"Apertura de puertas",det:"Control accesos, acomodadores",est:"Pendiente"},
        {i:"19:45",f:"20:00",area:"Dir. Técnico",act:"Pre-show checklist",det:"Revisión final, cue de entrada",est:"Pendiente"},
      ]},
      {s:"🎭  Show",tasks:[
        {i:"20:00",f:"",area:"Producción",act:"INICIO SHOW — PRESENTACIÓN",det:"Locución bienvenida, baja de luces",est:"Pendiente"},
        {i:"",f:"",area:"Artista+Equipo",act:"SHOW EN VIVO",det:"Monitoreo técnico continuo",est:"Pendiente"},
        {i:"",f:"",area:"Producción",act:"Intermedio (si aplica)",det:"Catering invitados, prep. 2ª parte",est:"Pendiente"},
        {i:"",f:"",area:"Artista+Equipo",act:"Segunda parte / cierre",det:"Cue de cierre con artista",est:"Pendiente"},
      ]},
      {s:"📷  Post-show",tasks:[
        {i:"",f:"",area:"Producción · Fotos",act:"Post-show — registro",det:"Fotos, reels para redes",est:"Pendiente"},
        {i:"",f:"",area:"Técnica",act:"Desmontaje y retiro",det:"Checklist retiro completo",est:"Pendiente"},
        {i:"",f:"",area:"Producción",act:"Cierre administrativo",det:"Firma docs venue, facturas",est:"Pendiente"},
      ]},
    ]
  },
  "teatro_especial":{
    nombre:"Teatro Especial (alta producción)",
    tipo:"Teatro Especial",
    secciones:[
      {s:"🔧  Montaje y técnica ampliado",tasks:[
        {i:"06:00",f:"09:00",area:"Técnica · Iluminador",act:"Llegada y descarga equipo",det:"Equipo ampliado: robóticos + estructuras",est:"Pendiente"},
        {i:"07:00",f:"10:00",area:"Técnica · Sonidista",act:"Instalación sistema PA ampliado",det:"Doble array + monitores invitados",est:"Pendiente"},
        {i:"09:00",f:"12:00",area:"Producción",act:"Ambientación y escenografía especial",det:"Set design, branding, mobiliario invitados",est:"Pendiente"},
        {i:"10:00",f:"12:00",area:"Producción AV",act:"Instalación pantallas LED + cámaras",det:"Streaming / CCTV / mapping si aplica",est:"Pendiente"},
        {i:"12:00",f:"13:30",area:"Sonidista",act:"Line checks y prueba PA",det:"Con múltiples micrófonos/invitados",est:"Pendiente"},
        {i:"13:30",f:"14:30",area:"Todos",act:"Pausa almuerzo equipo",det:"Catering coordinado",est:"Pendiente"},
      ]},
      {s:"🎙  Ensayos y pruebas",tasks:[
        {i:"14:30",f:"16:30",area:"Dir. Técnico",act:"Prueba de luces, video y mapping",det:"Pantalla + proyector + robóticos + cues especiales",est:"Pendiente"},
        {i:"16:30",f:"18:00",area:"Dir. Técnico",act:"Soundcheck artista principal",det:"Revisar cuñas / nivel de voz / efectos",est:"Pendiente"},
        {i:"18:00",f:"19:00",area:"Invitados+Sonidista",act:"Soundcheck invitados especiales",det:"Verificar riders individuales de cada invitado",est:"Pendiente"},
        {i:"19:00",f:"19:30",area:"Todos",act:"Briefing general de equipo",det:"Cue list extendida, seguridad, emergencias, protocolo invitados",est:"Pendiente"},
        {i:"19:30",f:"20:00",area:"Producción",act:"Catering camarines + zona invitados",det:"Catering diferenciado artista/invitados/staff",est:"Pendiente"},
      ]},
      {s:"🚪  Apertura",tasks:[
        {i:"20:00",f:"21:00",area:"Sala/Boletería",act:"Apertura de puertas",det:"Control accesos VIP + general, acomodadores",est:"Pendiente"},
        {i:"20:45",f:"21:00",area:"Dir. Técnico",act:"Pre-show checklist extendido",det:"Revisión final todas las áreas, cue de entrada",est:"Pendiente"},
      ]},
      {s:"🎭  Show",tasks:[
        {i:"21:00",f:"",area:"Producción",act:"INICIO SHOW — PRESENTACIÓN ESPECIAL",det:"Locución bienvenida, baja de luces, apertura especial",est:"Pendiente"},
        {i:"",f:"",area:"Artista+Invitados+Equipo",act:"SHOW EN VIVO CON INVITADOS",det:"Monitoreo técnico continuo, transiciones entre invitados",est:"Pendiente"},
        {i:"",f:"",area:"Producción",act:"Intermedio",det:"Catering invitados, prep. siguiente bloque",est:"Pendiente"},
        {i:"",f:"",area:"Artista+Equipo",act:"Cierre especial",det:"Cue de cierre coordinado, posible encore",est:"Pendiente"},
      ]},
      {s:"📷  Post-show",tasks:[
        {i:"",f:"",area:"Producción · Fotos/Video",act:"Post-show — registro ampliado",det:"Fotos, reels, entrevistas backstage",est:"Pendiente"},
        {i:"",f:"",area:"Técnica",act:"Desmontaje y retiro de equipo especial",det:"Checklist retiro completo, estructuras especiales",est:"Pendiente"},
        {i:"",f:"",area:"Producción",act:"Cierre administrativo",det:"Firma docs venue, facturas, liquidación invitados",est:"Pendiente"},
      ]},
    ]
  },
  "show_bar":{
    nombre:"Show Bar (montaje simple)",
    tipo:"Show Bar",
    secciones:[
      {s:"🔧  Montaje rápido",tasks:[
        {i:"18:00",f:"19:00",area:"Técnica · Sonidista",act:"Llegada e instalación PA básico",det:"Sistema de sonido compacto del venue o propio",est:"Pendiente"},
        {i:"18:30",f:"19:15",area:"Producción",act:"Ambientación mínima",det:"Branding puntual, mesa de merchandising si aplica",est:"Pendiente"},
        {i:"19:15",f:"19:45",area:"Sonidista",act:"Prueba de sonido",det:"Verificar micrófono y monitores",est:"Pendiente"},
      ]},
      {s:"🎙  Pre-show",tasks:[
        {i:"19:45",f:"20:15",area:"Todos",act:"Briefing breve",det:"Cue de entrada, timing del show",est:"Pendiente"},
        {i:"20:15",f:"20:45",area:"Sala/Boletería",act:"Apertura de puertas",det:"Control accesos, acomodación de mesas",est:"Pendiente"},
      ]},
      {s:"🎭  Show",tasks:[
        {i:"21:00",f:"",area:"Producción",act:"INICIO SHOW",det:"Presentación, baja de música ambiente",est:"Pendiente"},
        {i:"",f:"",area:"Artista+Equipo",act:"SHOW EN VIVO",det:"Monitoreo técnico continuo",est:"Pendiente"},
        {i:"",f:"",area:"Artista+Equipo",act:"Cierre",det:"Despedida, posible venta de merchandising",est:"Pendiente"},
      ]},
      {s:"📷  Post-show",tasks:[
        {i:"",f:"",area:"Producción",act:"Registro rápido",det:"Fotos para redes",est:"Pendiente"},
        {i:"",f:"",area:"Técnica",act:"Desmontaje",det:"Retiro de equipo, cierre con el venue",est:"Pendiente"},
      ]},
    ]
  },
  "digital":{
    nombre:"Digital (grabación / streaming)",
    tipo:"Digital",
    secciones:[
      {s:"🔧  Preparación de estudio",tasks:[
        {i:"08:00",f:"09:30",area:"Técnica · Camarógrafo",act:"Armado de set y cámaras",det:"Posicionamiento, encuadre, fondo",est:"Pendiente"},
        {i:"09:00",f:"10:00",area:"Técnica · Sonidista",act:"Instalación de audio",det:"Micrófonos lavalier/boom según formato",est:"Pendiente"},
        {i:"09:30",f:"10:30",area:"Iluminador",act:"Armado de iluminación de estudio",det:"Key, fill, back light",est:"Pendiente"},
      ]},
      {s:"🎙  Pruebas",tasks:[
        {i:"10:30",f:"11:00",area:"Técnica",act:"Prueba de cámara y audio",det:"Verificar niveles y encuadre final",est:"Pendiente"},
        {i:"11:00",f:"11:30",area:"Producción",act:"Briefing de contenido",det:"Guion, pauta de temas, tiempos por bloque",est:"Pendiente"},
      ]},
      {s:"🎬  Grabación / Streaming",tasks:[
        {i:"11:30",f:"",area:"Producción",act:"INICIO GRABACIÓN",det:"Roll cámara, claqueta si aplica",est:"Pendiente"},
        {i:"",f:"",area:"Artista+Equipo",act:"Grabación de bloques de contenido",det:"Cortes entre tomas si es necesario",est:"Pendiente"},
        {i:"",f:"",area:"Producción",act:"Revisión de tomas",det:"Verificar que no falten retakes",est:"Pendiente"},
      ]},
      {s:"📷  Post-producción",tasks:[
        {i:"",f:"",area:"Edición",act:"Descarga y respaldo de material",det:"Backup en dos ubicaciones",est:"Pendiente"},
        {i:"",f:"",area:"Edición",act:"Edición y entrega",det:"Cortes para redes, versión long-form",est:"Pendiente"},
      ]},
    ]
  },
};

// ── FICHA TÉCNICA: estructura por defecto ──
function defaultFichaTecnica(){
  return {
    sonido:"",
    luces:"",
    backline:"",
    video:"",
    catering:"",
    contactoVenue:{nombre:"",telefono:"",rol:""},
    riderArtista:"",
    notasLibres:"",
  };
}

// Asigna un preset de hoja de ruta según el tipo de show (usado al crear shows nuevos)
function presetKeyForTipo(tipo){
  if(tipo==="Teatro")return"teatro";
  if(tipo==="Teatro Especial")return"teatro_especial";
  if(tipo==="Show Bar")return"show_bar";
  return"digital";
}
function freshRoadmapFromPreset(presetKey){
  const preset=PRESETS_ROADMAP[presetKey]||PRESETS_ROADMAP["teatro"];
  return JSON.parse(JSON.stringify(preset.secciones));
}

// ── PERSISTENCE ──
function defaultCierre(){
  // Cierre: misma estructura por categoria, con valor presupuestado y valor real
  return {
    categorias:[
      {key:"ingresos",nombre:"Ingresos",esIngreso:true,items:[
        {desc:"Zona Preferente",presup:0,real:0},
        {desc:"Zona General",presup:0,real:0},
        {desc:"Auspicios / Marcas",presup:0,real:0}
      ]},
      {key:"rrhh",nombre:"RRHH",esIngreso:false,items:[
        {desc:"Artistas / Invitados",presup:0,real:0},
        {desc:"Equipo técnico",presup:0,real:0},
        {desc:"Producción",presup:0,real:0}
      ]},
      {key:"tecnica",nombre:"Técnica",esIngreso:false,items:[
        {desc:"Arriendo venue",presup:0,real:0},
        {desc:"Audio e iluminación",presup:0,real:0},
        {desc:"Pantalla / CCTV",presup:0,real:0}
      ]},
      {key:"produccion",nombre:"Producción",esIngreso:false,items:[
        {desc:"Ambientación",presup:0,real:0},
        {desc:"Catering",presup:0,real:0},
        {desc:"Traslados",presup:0,real:0}
      ]},
      {key:"marketing",nombre:"Marketing",esIngreso:false,items:[
        {desc:"Paid media",presup:0,real:0},
        {desc:"Fotos y diseño",presup:0,real:0}
      ]}
    ]
  };
}

function defaultPresupuesto(tipo){
  // Solo gastos VARIABLES por show (staff extra, arriendo, insumos).
  // Los sueldos fijos de planta van en el consolidado de producción, no aquí.
  tipo=tipo||"Teatro";
  if(tipo==="Show Bar"){
    return{categorias:[
      {key:"tecnica",nombre:"Técnica",items:[
        {desc:"Arriendo equipo PA / sonido",monto:180000},
        {desc:"Iluminación básica",monto:80000},
      ]},
      {key:"produccion",nombre:"Producción",items:[
        {desc:"Ambientación y branding",monto:60000},
        {desc:"Catering artista + staff",monto:80000},
        {desc:"Traslados",monto:40000},
      ]},
      {key:"marketing",nombre:"Marketing",items:[
        {desc:"Publicidad digital (pauta)",monto:150000},
        {desc:"Diseño piezas redes",monto:50000},
      ]},
      {key:"rrhh_ext",nombre:"Staff extra",items:[
        {desc:"Sonidista (por show)",monto:120000},
        {desc:"Fotógrafo (por show)",monto:80000},
      ]},
    ]};
  }
  if(tipo==="Digital"){
    return{categorias:[
      {key:"tecnica",nombre:"Técnica",items:[
        {desc:"Arriendo set / estudio",monto:300000},
        {desc:"Iluminación de estudio",monto:120000},
      ]},
      {key:"produccion",nombre:"Producción",items:[
        {desc:"Catering grabación",monto:60000},
        {desc:"Traslados",monto:40000},
      ]},
      {key:"rrhh_ext",nombre:"Staff extra",items:[
        {desc:"Camarógrafo (por bloque)",monto:200000},
        {desc:"Editor (por entrega)",monto:180000},
      ]},
    ]};
  }
  if(tipo==="Teatro Especial"){
    return{categorias:[
      {key:"tecnica",nombre:"Técnica",items:[
        {desc:"Arriendo venue (noche)",monto:3500000},
        {desc:"Sistema audio PA premium",monto:600000},
        {desc:"Iluminación + robóticos",monto:800000},
        {desc:"Pantalla / video mapping",monto:700000},
      ]},
      {key:"produccion",nombre:"Producción",items:[
        {desc:"Escenografía especial",monto:600000},
        {desc:"Catering artistas + VIP",monto:350000},
        {desc:"Traslados + logística",monto:200000},
      ]},
      {key:"marketing",nombre:"Marketing",items:[
        {desc:"Publicidad digital (pauta)",monto:1200000},
        {desc:"Diseño + fotografía promo",monto:350000},
      ]},
      {key:"rrhh_ext",nombre:"Staff extra",items:[
        {desc:"Sonidista (por show)",monto:220000},
        {desc:"Iluminador (por show)",monto:200000},
        {desc:"Fotógrafo / camarógrafo",monto:180000},
        {desc:"Acomodadores (x4)",monto:200000},
      ]},
    ]};
  }
  // Teatro (default)
  return{categorias:[
    {key:"tecnica",nombre:"Técnica",items:[
      {desc:"Arriendo venue (noche)",monto:1800000},
      {desc:"Sistema audio PA",monto:350000},
      {desc:"Iluminación",monto:280000},
      {desc:"Pantalla / proyección",monto:200000},
    ]},
    {key:"produccion",nombre:"Producción",items:[
      {desc:"Ambientación / escenografía",monto:180000},
      {desc:"Catering artistas + staff",monto:200000},
      {desc:"Traslados",monto:100000},
    ]},
    {key:"marketing",nombre:"Marketing",items:[
      {desc:"Publicidad digital (pauta)",monto:500000},
      {desc:"Diseño piezas gráficas",monto:120000},
    ]},
    {key:"rrhh_ext",nombre:"Staff extra",items:[
      {desc:"Sonidista (por show)",monto:180000},
      {desc:"Iluminador (por show)",monto:160000},
      {desc:"Fotógrafo (por show)",monto:120000},
      {desc:"Acomodadores (x3)",monto:150000},
    ]},
  ]};
}
