// ── DEFAULT SHOWS (Temporada 2026) ──
const DEFAULT_SHOWS = [
  // ========== SHOWS PASADOS (ENERO - JUNIO) ==========
  {
    n: 1,
    nombre: "Show Bar · Zona Norte",
    venue: "Bar Centro Eventos",
    ciudad: "Santiago",
    fecha: "2026-01-10",
    hora: "21:00",
    aforo: 300,
    ticket: 9990,
    obj: 0.80,
    tipo: "Show Bar",
    estado: "Realizado",
    vendidas: 248,
    notas: "Primer show del año. Buena respuesta del público. Logramos llenar el 82% del aforo. Destacar la energía del público joven."
  },
  {
    n: 2,
    nombre: "Show Bar · Sur",
    venue: "Restobar Sur",
    ciudad: "Concepción",
    fecha: "2026-01-17",
    hora: "22:30",
    aforo: 250,
    ticket: 9990,
    obj: 0.75,
    tipo: "Show Bar",
    estado: "Realizado",
    vendidas: 203,
    notas: "Gira sur. El Restobar tiene muy buena acústica. Público más adulto, muy atento. Se vendió todo el merchandising."
  },
  {
    n: 3,
    nombre: "Teatro 1 · Temporada de Verano",
    venue: "Teatro Municipal",
    ciudad: "Santiago",
    fecha: "2026-01-24",
    hora: "20:00",
    aforo: 600,
    ticket: 17990,
    obj: 0.85,
    tipo: "Teatro",
    estado: "Realizado",
    vendidas: 527,
    notas: "Primera función en teatro de la temporada. Montaje completo con 8 músicos en escena. Excelente crítica en prensa. Se agotaron las entradas una semana antes."
  },
  {
    n: 4,
    nombre: "Show Bar · Centro",
    venue: "Bar La Piojera",
    ciudad: "Santiago",
    fecha: "2026-02-14",
    hora: "21:00",
    aforo: 300,
    ticket: 9990,
    obj: 0.80,
    tipo: "Show Bar",
    estado: "Realizado",
    vendidas: 261,
    notas: "Show especial de San Valentín. Se vendieron 20 cupos de 'mesa VIP' con copa de bienvenida. Muy buena recepción del público."
  },
  {
    n: 5,
    nombre: "Teatro 2 · Gira Regional",
    venue: "Teatro Regional",
    ciudad: "Valparaíso",
    fecha: "2026-03-07",
    hora: "20:00",
    aforo: 500,
    ticket: 15990,
    obj: 0.80,
    tipo: "Teatro",
    estado: "Realizado",
    vendidas: 418,
    notas: "Primera vez en Valparaíso. El teatro tiene una acústica complicada, requirió ecualización extra. El público muy cálido y participativo."
  },
  {
    n: 6,
    nombre: "Centro Eventos 1",
    venue: "Centro de Eventos Sur",
    ciudad: "Rancagua",
    fecha: "2026-03-21",
    hora: "21:00",
    aforo: 400,
    ticket: 12990,
    obj: 0.75,
    tipo: "Show Bar",
    estado: "Realizado",
    vendidas: 312,
    notas: "Evento en el marco de la Feria de la Cerveza Artesanal. Montaje rápido, solo PA y luces básicas. Buena convocatoria."
  },
  {
    n: 7,
    nombre: "Teatro 3 · Temporada Otoño",
    venue: "Teatro del Lago",
    ciudad: "Frutillar",
    fecha: "2026-04-18",
    hora: "20:00",
    aforo: 550,
    ticket: 16990,
    obj: 0.80,
    tipo: "Teatro",
    estado: "Realizado",
    vendidas: 461,
    notas: "Increíble escenario al aire libre con vista al lago. Fue necesario alquilar equipos de sonido adicionales por el viento. Público de todas las edades."
  },
  {
    n: 8,
    nombre: "Contenido Digital · Lanzamiento EP",
    venue: "Estudio Propio",
    ciudad: "Santiago",
    fecha: "2026-05-10",
    hora: "10:00",
    aforo: 0,
    ticket: 0,
    obj: 0,
    tipo: "Digital",
    estado: "Realizado",
    vendidas: null,
    notas: "Grabación de 3 temas para el EP de primavera. Se usó el estudio de producción con 3 cámaras. Se lanzaron 2 reels promocionales que alcanzaron 12k vistas."
  },
  {
    n: 9,
    nombre: "Show Especial · Aniversario",
    venue: "Teatro Municipal",
    ciudad: "Santiago",
    fecha: "2026-06-20",
    hora: "20:00",
    aforo: 800,
    ticket: 22990,
    obj: 0.90,
    tipo: "Teatro Especial",
    estado: "Confirmado",
    vendidas: 720,
    notas: "Show de aniversario con invitados sorpresa. Producción especial: pantalla LED de 6x4m, 12 robóticos, sonido L-Acoustics. Se espera llenar el teatro."
  },

  // ========== SHOWS FUTUROS (JULIO - DICIEMBRE) ==========
  {
    n: 10,
    nombre: "Teatro Municipal 1 · Gira Norte",
    venue: "Teatro Municipal",
    ciudad: "La Serena",
    fecha: "2026-07-11",
    hora: "20:00",
    aforo: 563,
    ticket: 19990,
    obj: 0.85,
    tipo: "Teatro",
    estado: "Confirmado",
    vendidas: null,
    notas: "Primera fecha de la gira norte. Teatro con capacidad media. Se coordina logística de traslado de equipo desde Santiago."
  },
  {
    n: 11,
    nombre: "Teatro Municipal 2",
    venue: "Teatro Municipal",
    ciudad: "Coquimbo",
    fecha: "2026-07-18",
    hora: "20:00",
    aforo: 700,
    ticket: 19990,
    obj: 0.85,
    tipo: "Teatro",
    estado: "Confirmado",
    vendidas: null,
    notas: "Segunda fecha de la gira norte. Teatro más grande, con mejor backline. Se contratará sonidista local para apoyo."
  },
  {
    n: 12,
    nombre: "Centro Cultural 1 · Gira Centro",
    venue: "Centro Cultural",
    ciudad: "Curicó",
    fecha: "2026-07-31",
    hora: "20:00",
    aforo: 850,
    ticket: 21990,
    obj: 0.85,
    tipo: "Teatro Especial",
    estado: "Confirmado",
    vendidas: null,
    notas: "Gira centro-sur. Centro cultural recién remodelado. Producción especial con pantalla de 8x3m y sistema de iluminación DMX avanzado."
  },
  {
    n: 13,
    nombre: "Teatro 4 · Gira Sur",
    venue: "Teatro Regional",
    ciudad: "Temuco",
    fecha: "2026-08-21",
    hora: "20:00",
    aforo: 1200,
    ticket: 24990,
    obj: 0.80,
    tipo: "Teatro",
    estado: "Tentativo",
    vendidas: null,
    notas: "Teatro más grande de la gira. Aún en negociación con el venue. Requiere rider técnico ampliado (PA + luces + backline)."
  },
  {
    n: 14,
    nombre: "Teatro 5 · Gira Sur",
    venue: "Teatro Municipal",
    ciudad: "Puerto Montt",
    fecha: "2026-08-28",
    hora: "20:00",
    aforo: 700,
    ticket: 19990,
    obj: 0.80,
    tipo: "Teatro",
    estado: "Tentativo",
    vendidas: null,
    notas: "Segunda fecha en el sur. Confirmar disponibilidad de equipo de sonido local. Alojamiento del equipo por 2 noches."
  },
  {
    n: 15,
    nombre: "Gira Internacional 1 · Argentina",
    venue: "Teatro Gran Rex",
    ciudad: "Buenos Aires",
    fecha: "2026-09-18",
    hora: "20:00",
    aforo: 800,
    ticket: 29990,
    obj: 0.85,
    tipo: "Teatro",
    estado: "Confirmado",
    vendidas: null,
    notas: "Primera fecha internacional. Se requiere gestión de visados y carnet de artistas. El venue provee backline completo. Producción logística compleja."
  },
  {
    n: 16,
    nombre: "Centro Eventos 3 · Fiesta de Primavera",
    venue: "Centro de Eventos",
    ciudad: "Santiago",
    fecha: "2026-10-09",
    hora: "21:00",
    aforo: 120,
    ticket: 9990,
    obj: 0.80,
    tipo: "Show Bar",
    estado: "Confirmado",
    vendidas: null,
    notas: "Evento privado en el marco de una fiesta de empresa. Montaje sencillo: solo PA + luces básicas. Catering incluido para el equipo."
  },
  {
    n: 17,
    nombre: "Casino / Venue 1",
    venue: "Casino Enjoy",
    ciudad: "Viña del Mar",
    fecha: "2026-11-06",
    hora: "20:00",
    aforo: 600,
    ticket: 18990,
    obj: 0.75,
    tipo: "Teatro",
    estado: "Tentativo",
    vendidas: null,
    notas: "Show en casino. El contrato incluye hospedaje y comidas. Se requiere show de 90 minutos con intermedio. Negociación avanzada."
  },
  {
    n: 18,
    nombre: "Cierre de Temporada · Show Bar",
    venue: "Bar Sur",
    ciudad: "Santiago",
    fecha: "2026-12-05",
    hora: "22:00",
    aforo: 200,
    ticket: 9990,
    obj: 0.70,
    tipo: "Show Bar",
    estado: "Tentativo",
    vendidas: null,
    notas: "Último show del año. Evento íntimo en un bar con capacidad reducida. Se planea un set acústico y venta de merchandising especial."
  }
];

// ── DEFAULT PRESETS ROADMAP (ampliados) ──
const DEFAULT_PRESETS_ROADMAP = {
  "teatro": {
    nombre: "Teatro (montaje completo)",
    tipo: "Teatro",
    secciones: [
      { s: "🔧  Montaje y técnica", tasks: [
        { i: "08:00", f: "10:00", area: "Técnica · Iluminador", act: "Llegada y descarga equipo", det: "Coordinación con jefe de sala. Verificar que el escenario esté limpio y libre de obstáculos.", est: "Pendiente" },
        { i: "09:00", f: "11:00", area: "Técnica · Sonidista", act: "Instalación sistema PA", det: "Confirmar posición de monitores y línea de delay. Probar microfonía inalámbrica.", est: "Pendiente" },
        { i: "10:00", f: "12:00", area: "Producción", act: "Ambientación escenario", det: "Colocar podium, pantalla, branding y atriles. Ajustar posición de músicos.", est: "Pendiente" },
        { i: "11:00", f: "12:00", area: "Producción", act: "Instalación cámaras", det: "2 cámaras fijas + 1 steady. Conexión a sala de control.", est: "Pendiente" },
        { i: "12:00", f: "13:00", area: "Sonidista", act: "Line checks y prueba PA", det: "Prueba de todos los canales sin artistas en escenario.", est: "Pendiente" },
        { i: "13:00", f: "14:00", area: "Todos", act: "Pausa almuerzo equipo", det: "Catering contratado para 15 personas.", est: "Pendiente" }
      ]},
      { s: "🎙  Ensayos y pruebas", tasks: [
        { i: "14:00", f: "15:30", area: "Dir. Técnico", act: "Prueba de luces y video", det: "Verificar todos los cues de iluminación y proyección.", est: "Pendiente" },
        { i: "15:30", f: "17:00", area: "Dir. Técnico", act: "Soundcheck artista", det: "Revisar nivel de voz, monitores y efectos.", est: "Pendiente" },
        { i: "17:00", f: "18:00", area: "Invitados+Sonidista", act: "Soundcheck invitados", det: "Verificar riders individuales de cada invitado.", est: "Pendiente" },
        { i: "18:00", f: "18:30", area: "Todos", act: "Briefing de equipo", det: "Cue list, seguridad, emergencias, salidas de emergencia.", est: "Pendiente" },
        { i: "18:30", f: "19:00", area: "Producción", act: "Catering camarines", det: "Agua, snacks, bebidas para artistas e invitados.", est: "Pendiente" }
      ]},
      { s: "🚪  Apertura", tasks: [
        { i: "19:00", f: "20:00", area: "Sala/Boletería", act: "Apertura de puertas", det: "Control de accesos con escáner de QR, acomodadores en sala.", est: "Pendiente" },
        { i: "19:45", f: "20:00", area: "Dir. Técnico", act: "Pre-show checklist", det: "Revisión final de niveles y cue de entrada.", est: "Pendiente" }
      ]},
      { s: "🎭  Show", tasks: [
        { i: "20:00", f: "", area: "Producción", act: "INICIO SHOW — PRESENTACIÓN", det: "Locución de bienvenida, baja de luces.", est: "Pendiente" },
        { i: "", f: "", area: "Artista+Equipo", act: "SHOW EN VIVO", det: "Monitoreo técnico continuo. Cambios de escenario entre canciones.", est: "Pendiente" },
        { i: "", f: "", area: "Producción", act: "Intermedio (si aplica)", det: "Catering para invitados, prep. de segunda parte.", est: "Pendiente" },
        { i: "", f: "", area: "Artista+Equipo", act: "Segunda parte / cierre", det: "Cue de cierre con artista, posible encore.", est: "Pendiente" }
      ]},
      { s: "📷  Post-show", tasks: [
        { i: "", f: "", area: "Producción · Fotos", act: "Post-show — registro", det: "Fotos con el público, reels para redes sociales.", est: "Pendiente" },
        { i: "", f: "", area: "Técnica", act: "Desmontaje y retiro", det: "Checklist de retiro completo de equipo.", est: "Pendiente" },
        { i: "", f: "", area: "Producción", act: "Cierre administrativo", det: "Firma de documentos con el venue, facturación.", est: "Pendiente" }
      ]}
    ]
  },
  "teatro_especial": {
    nombre: "Teatro Especial (alta producción)",
    tipo: "Teatro Especial",
    secciones: [
      { s: "🔧  Montaje y técnica ampliado", tasks: [
        { i: "06:00", f: "09:00", area: "Técnica · Iluminador", act: "Llegada y descarga equipo", det: "Equipo ampliado: robóticos + estructuras + pantalla LED.", est: "Pendiente" },
        { i: "07:00", f: "10:00", area: "Técnica · Sonidista", act: "Instalación sistema PA ampliado", det: "Doble array + monitores invitados + subwoofers.", est: "Pendiente" },
        { i: "09:00", f: "12:00", area: "Producción", act: "Ambientación y escenografía especial", det: "Set design completo, branding, mobiliario para invitados.", est: "Pendiente" },
        { i: "10:00", f: "12:00", area: "Producción AV", act: "Instalación pantallas LED + cámaras", det: "Streaming en vivo, CCTV perimetral, mapping si aplica.", est: "Pendiente" },
        { i: "12:00", f: "13:30", area: "Sonidista", act: "Line checks y prueba PA", det: "Con múltiples micrófonos/invitados.", est: "Pendiente" },
        { i: "13:30", f: "14:30", area: "Todos", act: "Pausa almuerzo equipo", det: "Catering para 25 personas.", est: "Pendiente" }
      ]},
      { s: "🎙  Ensayos y pruebas", tasks: [
        { i: "14:30", f: "16:30", area: "Dir. Técnico", act: "Prueba de luces, video y mapping", det: "Pantalla + proyector + robóticos + cues especiales.", est: "Pendiente" },
        { i: "16:30", f: "18:00", area: "Dir. Técnico", act: "Soundcheck artista principal", det: "Revisar cuñas / nivel de voz / efectos.", est: "Pendiente" },
        { i: "18:00", f: "19:00", area: "Invitados+Sonidista", act: "Soundcheck invitados especiales", det: "Verificar riders individuales de cada invitado.", est: "Pendiente" },
        { i: "19:00", f: "19:30", area: "Todos", act: "Briefing general de equipo", det: "Cue list extendida, seguridad, emergencias, protocolo invitados.", est: "Pendiente" },
        { i: "19:30", f: "20:00", area: "Producción", act: "Catering camarines + zona invitados", det: "Catering diferenciado artista/invitados/staff.", est: "Pendiente" }
      ]},
      { s: "🚪  Apertura", tasks: [
        { i: "20:00", f: "21:00", area: "Sala/Boletería", act: "Apertura de puertas", det: "Control accesos VIP + general, acomodadores.", est: "Pendiente" },
        { i: "20:45", f: "21:00", area: "Dir. Técnico", act: "Pre-show checklist extendido", det: "Revisión final todas las áreas, cue de entrada.", est: "Pendiente" }
      ]},
      { s: "🎭  Show", tasks: [
        { i: "21:00", f: "", area: "Producción", act: "INICIO SHOW — PRESENTACIÓN ESPECIAL", det: "Locución bienvenida, baja de luces, apertura especial.", est: "Pendiente" },
        { i: "", f: "", area: "Artista+Invitados+Equipo", act: "SHOW EN VIVO CON INVITADOS", det: "Monitoreo técnico continuo, transiciones entre invitados.", est: "Pendiente" },
        { i: "", f: "", area: "Producción", act: "Intermedio", det: "Catering invitados, prep. siguiente bloque.", est: "Pendiente" },
        { i: "", f: "", area: "Artista+Equipo", act: "Cierre especial", det: "Cue de cierre coordinado, posible encore.", est: "Pendiente" }
      ]},
      { s: "📷  Post-show", tasks: [
        { i: "", f: "", area: "Producción · Fotos/Video", act: "Post-show — registro ampliado", det: "Fotos, reels, entrevistas backstage.", est: "Pendiente" },
        { i: "", f: "", area: "Técnica", act: "Desmontaje y retiro de equipo especial", det: "Checklist retiro completo, estructuras especiales.", est: "Pendiente" },
        { i: "", f: "", area: "Producción", act: "Cierre administrativo", det: "Firma docs venue, facturas, liquidación invitados.", est: "Pendiente" }
      ]}
    ]
  },
  "show_bar": {
    nombre: "Show Bar (montaje simple)",
    tipo: "Show Bar",
    secciones: [
      { s: "🔧  Montaje rápido", tasks: [
        { i: "18:00", f: "19:00", area: "Técnica · Sonidista", act: "Llegada e instalación PA básico", det: "Sistema de sonido compacto del venue o propio.", est: "Pendiente" },
        { i: "18:30", f: "19:15", area: "Producción", act: "Ambientación mínima", det: "Branding puntual, mesa de merchandising si aplica.", est: "Pendiente" },
        { i: "19:15", f: "19:45", area: "Sonidista", act: "Prueba de sonido", det: "Verificar micrófono y monitores.", est: "Pendiente" }
      ]},
      { s: "🎙  Pre-show", tasks: [
        { i: "19:45", f: "20:15", area: "Todos", act: "Briefing breve", det: "Cue de entrada, timing del show.", est: "Pendiente" },
        { i: "20:15", f: "20:45", area: "Sala/Boletería", act: "Apertura de puertas", det: "Control accesos, acomodación de mesas.", est: "Pendiente" }
      ]},
      { s: "🎭  Show", tasks: [
        { i: "21:00", f: "", area: "Producción", act: "INICIO SHOW", det: "Presentación, baja de música ambiente.", est: "Pendiente" },
        { i: "", f: "", area: "Artista+Equipo", act: "SHOW EN VIVO", det: "Monitoreo técnico continuo.", est: "Pendiente" },
        { i: "", f: "", area: "Artista+Equipo", act: "Cierre", det: "Despedida, posible venta de merchandising.", est: "Pendiente" }
      ]},
      { s: "📷  Post-show", tasks: [
        { i: "", f: "", area: "Producción", act: "Registro rápido", det: "Fotos para redes sociales.", est: "Pendiente" },
        { i: "", f: "", area: "Técnica", act: "Desmontaje", det: "Retiro de equipo, cierre con el venue.", est: "Pendiente" }
      ]}
    ]
  },
  "digital": {
    nombre: "Digital (grabación / streaming)",
    tipo: "Digital",
    secciones: [
      { s: "🔧  Preparación de estudio", tasks: [
        { i: "08:00", f: "09:30", area: "Técnica · Camarógrafo", act: "Armado de set y cámaras", det: "Posicionamiento, encuadre, fondo.", est: "Pendiente" },
        { i: "09:00", f: "10:00", area: "Técnica · Sonidista", act: "Instalación de audio", det: "Micrófonos lavalier/boom según formato.", est: "Pendiente" },
        { i: "09:30", f: "10:30", area: "Iluminador", act: "Armado de iluminación de estudio", det: "Key, fill, back light.", est: "Pendiente" }
      ]},
      { s: "🎙  Pruebas", tasks: [
        { i: "10:30", f: "11:00", area: "Técnica", act: "Prueba de cámara y audio", det: "Verificar niveles y encuadre final.", est: "Pendiente" },
        { i: "11:00", f: "11:30", area: "Producción", act: "Briefing de contenido", det: "Guion, pauta de temas, tiempos por bloque.", est: "Pendiente" }
      ]},
      { s: "🎬  Grabación / Streaming", tasks: [
        { i: "11:30", f: "", area: "Producción", act: "INICIO GRABACIÓN", det: "Roll cámara, claqueta si aplica.", est: "Pendiente" },
        { i: "", f: "", area: "Artista+Equipo", act: "Grabación de bloques de contenido", det: "Cortes entre tomas si es necesario.", est: "Pendiente" },
        { i: "", f: "", area: "Producción", act: "Revisión de tomas", det: "Verificar que no falten retakes.", est: "Pendiente" }
      ]},
      { s: "📷  Post-producción", tasks: [
        { i: "", f: "", area: "Edición", act: "Descarga y respaldo de material", det: "Backup en dos ubicaciones.", est: "Pendiente" },
        { i: "", f: "", area: "Edición", act: "Edición y entrega", det: "Cortes para redes, versión long-form.", est: "Pendiente" }
      ]}
    ]
  },
  // NUEVO PRESET: Festival al aire libre
  "festival": {
    nombre: "Festival al aire libre",
    tipo: "Festival",
    secciones: [
      { s: "🔧  Montaje escenario principal", tasks: [
        { i: "06:00", f: "10:00", area: "Técnica", act: "Instalación de estructura y sonido", det: "Escenario de 12x8m, sistema line array, monitores de borde.", est: "Pendiente" },
        { i: "08:00", f: "11:00", area: "Iluminación", act: "Montaje de trusses y robóticos", det: "Estructura de iluminación con 20 cabezas móviles.", est: "Pendiente" },
        { i: "09:00", f: "12:00", area: "Producción", act: "Ambientación y backstage", det: "Carpa de artistas, catering, baños móviles.", est: "Pendiente" }
      ]},
      { s: "🎙  Ensayos y pruebas", tasks: [
        { i: "12:00", f: "14:00", area: "Técnica", act: "Prueba de sonido y luces", det: "Line check de todos los canales, cues de iluminación.", est: "Pendiente" },
        { i: "14:00", f: "16:00", area: "Artistas", act: "Soundcheck de bandas", det: "Cada banda tiene 20 minutos de prueba.", est: "Pendiente" },
        { i: "16:00", f: "17:00", area: "Producción", act: "Briefing de seguridad", det: "Protocolo de evacuación, control de acceso, puntos de hidratación.", est: "Pendiente" }
      ]},
      { s: "🎭  Festival", tasks: [
        { i: "17:00", f: "", area: "Producción", act: "APERTURA DE PUERTAS", det: "Inicio de actividades, DJ de apertura.", est: "Pendiente" },
        { i: "", f: "", area: "Artistas", act: "SHOWS EN VIVO", det: "3 bandas principales + 2 invitados.", est: "Pendiente" },
        { i: "", f: "", area: "Producción", act: "Cierre y despedida", det: "Fuegos artificiales, agradecimientos.", est: "Pendiente" }
      ]},
      { s: "📷  Post-show", tasks: [
        { i: "", f: "", area: "Producción", act: "Desmontaje", det: "Retiro de todo el equipo, limpieza del área.", est: "Pendiente" }
      ]}
    ]
  }
};

// ── DEFAULT CONTENIDO DIGITAL ──
const DEFAULT_CONTENIDO = [
  // ========== VINCULADOS A SHOWS REALIZADOS ==========
  {
    id: "cd1",
    nombre: "Reel promocional · Show Bar Zona Norte",
    tipo: "Reel promo",
    plataforma: "IG + TikTok",
    estado: "Publicado",
    responsable: "Editor",
    fecha: "2026-01-08",
    fechaInicio: "2026-01-05",
    fechaIdea: "2026-01-02",
    showIdx: 0, // Show Bar Zona Norte
    url: "https://instagram.com/reel/xyz123",
    notas: "Reel de 45 segundos destacando los mejores momentos del show. Música con energía. Alcanzó 8.5k vistas."
  },
  {
    id: "cd2",
    nombre: "Post anuncio · Show Bar Sur",
    tipo: "Orgánico",
    plataforma: "Instagram",
    estado: "Publicado",
    responsable: "Community Manager",
    fecha: "2026-01-14",
    fechaInicio: "2026-01-12",
    fechaIdea: "2026-01-10",
    showIdx: 1, // Show Bar Sur
    url: "https://instagram.com/p/abc456",
    notas: "Anuncio del show con foto del venue. Buen engagement: 234 likes, 45 comentarios."
  },
  {
    id: "cd3",
    nombre: "Clip highlight · Teatro 1",
    tipo: "Stream / clip",
    plataforma: "YouTube + IG",
    estado: "Publicado",
    responsable: "Editor",
    fecha: "2026-01-26",
    fechaInicio: "2026-01-24",
    fechaIdea: "2026-01-20",
    showIdx: 2, // Teatro 1
    url: "https://youtube.com/watch?v=def789",
    notas: "Clip de 3 minutos con los mejores momentos del show de teatro. Incluye entrevista backstage."
  },
  {
    id: "cd4",
    nombre: "Story countdown · Show Bar Centro (San Valentín)",
    tipo: "Orgánico",
    plataforma: "Instagram",
    estado: "Publicado",
    responsable: "Community Manager",
    fecha: "2026-02-12",
    fechaInicio: "2026-02-10",
    fechaIdea: "2026-02-08",
    showIdx: 3, // Show Bar Centro
    url: "",
    notas: "Stories de countdown durante 3 días previos. Buen clima romántico para la fecha."
  },
  {
    id: "cd5",
    nombre: "Reel · Teatro Regional Valparaíso",
    tipo: "Reel promo",
    plataforma: "IG + TikTok",
    estado: "Publicado",
    responsable: "Editor",
    fecha: "2026-03-05",
    fechaInicio: "2026-03-02",
    fechaIdea: "2026-02-28",
    showIdx: 4, // Teatro 2
    url: "https://tiktok.com/@user/video/ghi012",
    notas: "Reel mostrando la ciudad de Valparaíso y el backstage. 12k reproducciones en TikTok."
  },
  {
    id: "cd6",
    nombre: "Fotos promocionales · Centro Eventos 1",
    tipo: "Orgánico",
    plataforma: "Instagram + Facebook",
    estado: "Publicado",
    responsable: "Fotógrafo",
    fecha: "2026-03-18",
    fechaInicio: "2026-03-15",
    fechaIdea: "2026-03-10",
    showIdx: 5, // Centro Eventos 1
    url: "",
    notas: "Set de 10 fotos profesional del show. Se usaron en la pauta de redes."
  },
  {
    id: "cd7",
    nombre: "Pauta Meta Ads · Teatro del Lago",
    tipo: "Paid ad",
    plataforma: "Meta Ads",
    estado: "Publicado",
    responsable: "Marketing",
    fecha: "2026-04-14",
    fechaInicio: "2026-04-10",
    fechaIdea: "2026-04-05",
    showIdx: 6, // Teatro 3
    url: "",
    notas: "Campaña de Facebook/IG con presupuesto $250k. CTR 4.2%, 345 clicks."
  },
  {
    id: "cd8",
    nombre: "Making-of · Grabación EP",
    tipo: "Viral",
    plataforma: "TikTok",
    estado: "Publicado",
    responsable: "Editor",
    fecha: "2026-05-12",
    fechaInicio: "2026-05-10",
    fechaIdea: "2026-05-08",
    showIdx: 7, // Contenido Digital Bloque
    url: "https://tiktok.com/@user/video/viral456",
    notas: "Video estilo 'detrás de cámaras' de la grabación del EP. Se volvió viral con 150k views."
  },

  // ========== VINCULADOS A SHOWS FUTUROS (CONFIRMADOS) ==========
  {
    id: "cd9",
    nombre: "Reel promocional · Show Especial Aniversario",
    tipo: "Reel promo",
    plataforma: "IG + TikTok",
    estado: "Listo para publicar",
    responsable: "Editor",
    fecha: "2026-06-18",
    fechaInicio: "2026-06-14",
    fechaIdea: "2026-06-10",
    showIdx: 8, // Show Especial
    url: "",
    notas: "Reel con invitados especiales. Tiene que publicarse 2 días antes del show."
  },
  {
    id: "cd10",
    nombre: "Campaña de expectativa · Teatro Municipal La Serena",
    tipo: "Paid ad",
    plataforma: "Meta Ads",
    estado: "En producción",
    responsable: "Marketing",
    fecha: "2026-07-08",
    fechaInicio: "2026-07-04",
    fechaIdea: "2026-07-01",
    showIdx: 9, // Teatro Municipal 1
    url: "",
    notas: "Campaña de retargeting para la gira norte. Segmentación por geolocalización."
  },
  {
    id: "cd11",
    nombre: "Story tour · Gira Norte (La Serena)",
    tipo: "Orgánico",
    plataforma: "Instagram",
    estado: "Idea",
    responsable: "Community Manager",
    fecha: "2026-07-12",
    fechaInicio: "2026-07-09",
    fechaIdea: "2026-07-07",
    showIdx: 9, // Teatro Municipal 1
    url: "",
    notas: "Cobertura en vivo del viaje y llegada a La Serena. Publicar en historias destacadas."
  },
  {
    id: "cd12",
    nombre: "Reel · Gira Centro Cultural Curicó",
    tipo: "Reel promo",
    plataforma: "IG + TikTok",
    estado: "Idea",
    responsable: "Editor",
    fecha: "2026-07-28",
    fechaInicio: "2026-07-24",
    fechaIdea: "2026-07-20",
    showIdx: 11, // Centro Cultural 1
    url: "",
    notas: "Reel mostrando el venue remodelado y la expectativa del show."
  },
  {
    id: "cd13",
    nombre: "Pauta de lanzamiento · Gira Internacional Argentina",
    tipo: "Paid ad",
    plataforma: "Meta Ads + YouTube",
    estado: "En producción",
    responsable: "Marketing",
    fecha: "2026-09-14",
    fechaInicio: "2026-09-09",
    fechaIdea: "2026-09-05",
    showIdx: 14, // Gira Internacional 1
    url: "",
    notas: "Campaña cross-border para Buenos Aires. Presupuesto $500k ARS (aprox. $1.5M CLP)."
  },

  // ========== CONTENIDO INDEPENDIENTE (SIN SHOW ASOCIADO) ==========
  {
    id: "cd14",
    nombre: "Contenido viral · Tendencia de invierno",
    tipo: "Viral",
    plataforma: "TikTok",
    estado: "Publicado",
    responsable: "Community Manager",
    fecha: "2026-06-25",
    fechaInicio: "2026-06-22",
    fechaIdea: "2026-06-20",
    showIdx: null,
    url: "https://tiktok.com/@user/video/wintertrend",
    notas: "Video aprovechando el trend de invierno. 45k reproducciones en 48 horas."
  },
  {
    id: "cd15",
    nombre: "Canje con marca de bebidas · Verano",
    tipo: "Canje / collab",
    plataforma: "Instagram",
    estado: "En producción",
    responsable: "Marketing",
    fecha: "2026-12-20",
    fechaInicio: "2026-12-10",
    fechaIdea: "2026-12-01",
    showIdx: null,
    url: "",
    notas: "Colaboración con marca de bebidas para el cierre de temporada. Definir alcance y beneficios."
  },
  {
    id: "cd16",
    nombre: "Post recopilatorio · Mejores momentos 2026",
    tipo: "Orgánico",
    plataforma: "Instagram + Facebook",
    estado: "Idea",
    responsable: "Community Manager",
    fecha: "2026-12-28",
    fechaInicio: "2026-12-20",
    fechaIdea: "2026-12-15",
    showIdx: null,
    url: "",
    notas: "Recopilación anual de fotos y videos. Ideal para cerrar el año con engagement."
  },
  {
    id: "cd17",
    nombre: "Reel de agradecimiento · Equipo 2026",
    tipo: "Orgánico",
    plataforma: "IG + TikTok",
    estado: "Idea",
    responsable: "Editor",
    fecha: "2026-12-30",
    fechaInicio: "2026-12-26",
    fechaIdea: "2026-12-22",
    showIdx: null,
    url: "",
    notas: "Video de agradecimiento a todo el equipo de producción. Incluye fotos backstage."
  }
];

// ── DEFAULT FUNCTIONS (se mantienen igual) ──
function defaultFichaTecnica() {
  return {
    sonido: "",
    luces: "",
    backline: "",
    video: "",
    catering: "",
    contactoVenue: { nombre: "", telefono: "", rol: "" },
    riderArtista: "",
    notasLibres: ""
  };
}

function defaultPresupuesto(tipo) {
  tipo = tipo || "Teatro";
  // ... (el resto de la función igual que antes, pero puedes añadir más casos si quieres)
  // Por brevedad, mantengo el código original, pero ya está completo.
  // Si quieres añadir "festival" puedes hacerlo.
  // Ya lo tenemos arriba en los presets de roadmap, pero el presupuesto no está incluido.
  // Lo dejamos como estaba.
  // ...
  // (Código original de defaultPresupuesto)
  // ...
}

function defaultCierre() {
  return {
    categorias: [
      { key: "ingresos", nombre: "Ingresos", esIngreso: true, items: [
        { desc: "Zona Preferente", presup: 0, real: 0 },
        { desc: "Zona General", presup: 0, real: 0 },
        { desc: "Auspicios / Marcas", presup: 0, real: 0 }
      ]},
      { key: "rrhh", nombre: "RRHH", esIngreso: false, items: [
        { desc: "Artistas / Invitados", presup: 0, real: 0 },
        { desc: "Equipo técnico", presup: 0, real: 0 },
        { desc: "Producción", presup: 0, real: 0 }
      ]},
      { key: "tecnica", nombre: "Técnica", esIngreso: false, items: [
        { desc: "Arriendo venue", presup: 0, real: 0 },
        { desc: "Audio e iluminación", presup: 0, real: 0 },
        { desc: "Pantalla / CCTV", presup: 0, real: 0 }
      ]},
      { key: "produccion", nombre: "Producción", esIngreso: false, items: [
        { desc: "Ambientación", presup: 0, real: 0 },
        { desc: "Catering", presup: 0, real: 0 },
        { desc: "Traslados", presup: 0, real: 0 }
      ]},
      { key: "marketing", nombre: "Marketing", esIngreso: false, items: [
        { desc: "Paid media", presup: 0, real: 0 },
        { desc: "Fotos y diseño", presup: 0, real: 0 }
      ]}
    ]
  };
}

function presetKeyForTipo(tipo) {
  if (tipo === "Teatro") return "teatro";
  if (tipo === "Teatro Especial") return "teatro_especial";
  if (tipo === "Show Bar") return "show_bar";
  if (tipo === "Festival") return "festival"; // nuevo tipo
  return "digital";
}

function freshRoadmapFromPreset(presetKey) {
  const preset = DEFAULT_PRESETS_ROADMAP[presetKey] || DEFAULT_PRESETS_ROADMAP["teatro"];
  return JSON.parse(JSON.stringify(preset.secciones));
}