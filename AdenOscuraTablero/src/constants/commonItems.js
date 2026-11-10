export const DEFAULT_COMMON_ITEMS = [
  {
    id: 'item_backpack',
    name: 'Mochila de viaje',
    icon: null,
    category: 'Supervivencia',
    state: 'equipped',
    extraSlots: 10,
    notes: 'Mochila de lona impermeable y correas reforzadas. Expande el inventario en +10 huecos adicionales.'
  },
  {
    id: 'item_lighter',
    name: 'Mechero de latón',
    icon: null,
    category: 'Herramienta',
    state: 'equipped',
    notes: 'A prueba de viento. Llama constante y fiable. Recargado de queroseno.'
  },
  {
    id: 'item_rope',
    name: 'Cuerda de cáñamo (15m)',
    icon: null,
    category: 'Supervivencia',
    state: 'equipped',
    notes: 'Cuerda trenzada de 15 metros con nudos de escalada y gancho de amarre. Soporta 200 kg.'
  },
  {
    id: 'item_flashlight',
    name: 'Linterna de queroseno / eléctrica',
    icon: null,
    category: 'Herramienta',
    state: 'equipped',
    notes: 'Foco de luz dirigida para explorar pasajes y sótanos en penumbra.'
  },
  {
    id: 'item_matches',
    name: 'Caja de cerillas secas',
    icon: null,
    category: 'Herramienta',
    state: 'equipped',
    notes: 'Estuche de metal sellado con 20 cerillas de azufre contra la humedad.'
  },
  {
    id: 'item_lockpicks',
    name: 'Ganzúas de cerrajero',
    icon: null,
    category: 'Herramienta',
    state: 'equipped',
    notes: 'Juego de ganzúas finas de acero templado. Concede bonificación a forzar cerraduras.'
  },
  {
    id: 'item_medkit',
    name: 'Botiquín de primeros auxilios',
    icon: null,
    category: 'Consumible',
    state: 'equipped',
    notes: 'Vendas esterilizadas, tijeras quirúrgicas, tintura de yodo y alcohol medicinal.'
  },
  {
    id: 'item_laudanum',
    name: 'Frasco de láudano medicinal',
    icon: null,
    category: 'Consumible',
    state: 'equipped',
    notes: 'Calmante narcótico potente. Calma dolores intensos y la histeria aguda (1 dosis restante).'
  },
  {
    id: 'item_notebook',
    name: 'Cuaderno de notas y carboncillo',
    icon: null,
    category: 'Documento',
    state: 'equipped',
    notes: 'Páginas amarillentas encuadernadas en cuero para calcar inscripciones y tomar notas.'
  },
  {
    id: 'item_magnifier',
    name: 'Lupa de investigación',
    icon: null,
    category: 'Herramienta',
    state: 'equipped',
    notes: 'Lente de aumento de cristal pulido con montura de latón para examinar detalles diminutos.'
  },
  {
    id: 'item_compass',
    name: 'Brújula magnética de bolsillo',
    icon: null,
    category: 'Supervivencia',
    state: 'equipped',
    notes: 'Aguja imantada de latón con cuadrante luminoso para orientación nocturna.'
  },
  {
    id: 'item_canteen',
    name: 'Cantimplora de campaña',
    icon: null,
    category: 'Supervivencia',
    state: 'equipped',
    notes: 'Cantimplora de aluminio forrada en fieltro con 1 litro de agua limpia.'
  },
  {
    id: 'item_knife',
    name: 'Machete o Cuchillo de caza',
    icon: null,
    category: 'Arma / Herramienta',
    state: 'equipped',
    notes: 'Hoja de acero templado para abrirse paso entre la maleza o defenderse.'
  },
  {
    id: 'item_revolver',
    name: 'Revólver de seis tiros',
    icon: null,
    category: 'Arma',
    state: 'equipped',
    notes: 'Revólver clásico de tambor calibre .38 con 6 balas cargadas.'
  },
  {
    id: 'item_rations',
    name: 'Raciones secas de viaje',
    icon: null,
    category: 'Consumible',
    state: 'equipped',
    notes: 'Conservas selladas y galletas de campaña para reponer energías.'
  },
  {
    id: 'item_relic',
    name: 'Amuleto o Reliquia arcana',
    icon: null,
    category: 'Reliquia',
    state: 'equipped',
    notes: 'Relieve de piedra verdosa no identificada. Permanece extrañamente gélida al tacto.'
  }
];

export const ITEM_CATEGORIES = [
  'Herramienta',
  'Supervivencia',
  'Consumible',
  'Documento',
  'Llave',
  'Arma / Herramienta',
  'Reliquia',
  'Equipo General'
];

export const POPULAR_ITEM_ICONS = [
  '🚬', '🪢', '🔦', '🕯️', '🗝️', '🩸', '💊', '🧪', '📜', '🔍', '🧭', '💧', '🔪', '📻', '📦', '🧥', '💼', '⚱️', '📓', '🪙', '🪤', '✝️', '🛡️', '⚡'
];

const normalizeSearchText = (str) =>
  String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const filterCatalogItems = (items = [], query = '') => {
  const normQ = normalizeSearchText(query.trim());
  if (!normQ) return [];
  return items.filter((item) => normalizeSearchText(item?.name).includes(normQ));
};
