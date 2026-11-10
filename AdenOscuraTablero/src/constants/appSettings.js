export const APP_SETTINGS_STORAGE_KEY = 'vtt_app_settings';

export const THEME_OPTIONS = [
  {
    id: 'dark',
    label: 'Oscuro (Base)',
    description: 'Estética original en obsidiana, pizarra profunda y bronce dorado para mesas con poca luz.',
    swatches: ['#0b0d12', '#141822', '#2b3345', '#f59e0b', '#f8fafc']
  },
  {
    id: 'light',
    label: 'Claro (Pergamino)',
    description: 'Tonos marfil y pergamino cálido con tinta oscura y bronce bruñido para habitaciones iluminadas.',
    swatches: ['#e5dfd1', '#fbf8f0', '#cbbda3', '#b45309', '#18130e']
  },
  {
    id: 'high-contrast',
    label: 'Alto Contraste',
    description: 'Negro puro, blanco nítido, bordes gruesos y amarillo/cian de máxima legibilidad visual.',
    swatches: ['#000000', '#0d0f14', '#ffffff', '#fde047', '#22d3ee']
  }
];

export const BOARD_SURFACE_OPTIONS = [
  {
    id: 'dark_wood',
    label: 'Tablones de Roble',
    description: 'Madera oscura clásica de mesa de juego.',
    image: '/assets/textures/tabletop_dark_wood.jpg',
    overlay: 'radial-gradient(circle at center, rgba(16, 20, 28, 0.42) 0%, rgba(5, 7, 10, 0.88) 100%)',
    backgroundSize: 'cover',
    backgroundRepeat: 'repeat'
  },
  {
    id: 'slate_stone',
    label: 'Losa de Pizarra',
    description: 'Piedra antigua y pizarra para criptas o mazmorras.',
    image: '/assets/textures/tabletop_slate_stone.jpg',
    overlay: 'radial-gradient(circle at center, rgba(10, 14, 20, 0.34) 0%, rgba(5, 7, 10, 0.82) 100%)',
    backgroundSize: '512px 512px',
    backgroundRepeat: 'repeat'
  },
  {
    id: 'emerald_baize',
    label: 'Tapete Esmeralda',
    description: 'Paño verde de sociedad con marco de nogal y latón.',
    image: '/assets/textures/tabletop_emerald_baize.jpg',
    overlay: 'radial-gradient(circle at center, rgba(6, 20, 15, 0.16) 0%, rgba(4, 12, 9, 0.56) 100%)',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat'
  },
  {
    id: 'aged_parchment',
    label: 'Pergamino Cálido',
    description: 'Superficie clara de cartografía, ideal para modo Light.',
    image: '/assets/textures/tabletop_aged_parchment.jpg',
    overlay: 'radial-gradient(circle at center, rgba(255, 250, 240, 0.08) 0%, rgba(120, 96, 62, 0.28) 100%)',
    backgroundSize: '512px 512px',
    backgroundRepeat: 'repeat'
  }
];

export const getBoardSurfaceConfig = (surfaceId) =>
  BOARD_SURFACE_OPTIONS.find(opt => opt.id === surfaceId) || BOARD_SURFACE_OPTIONS[0];

export const DICE_COLOR_PRESETS = [
  { id: 'gold', label: 'Oro Antiguo', color: '#d4af37' },
  { id: 'crimson', label: 'Carmesí', color: '#b91c1c' },
  { id: 'bone', label: 'Hueso', color: '#e2e8f0' },
  { id: 'spectral', label: 'Espectral', color: '#38bdf8' },
  { id: 'emerald', label: 'Esmeralda', color: '#10b981' },
  { id: 'obsidian', label: 'Obsidiana', color: '#475569' }
];

export const GRID_COLOR_PRESETS = [
  { id: 'white', label: 'Blanco', color: '#ffffff' },
  { id: 'gold', label: 'Ámbar', color: '#f59e0b' },
  { id: 'cyan', label: 'Cian Táctico', color: '#38bdf8' },
  { id: 'ink', label: 'Tinta Oscura', color: '#0f172a' }
];

export const MEASURE_UNIT_OPTIONS = [
  { id: 'both', label: 'Casillas + Pies y Metros' },
  { id: 'meters', label: 'Casillas + Metros (m)' },
  { id: 'feet', label: 'Casillas + Pies (ft)' },
  { id: 'squares', label: 'Solo Casillas' }
];

export const GRID_VISIBILITY_OPTIONS = [
  { id: 'with_snap', label: 'Solo con Imán activo (Clásico)' },
  { id: 'always', label: 'Mostrar siempre' },
  { id: 'never', label: 'Ocultar siempre (Imán invisible)' }
];

export const LIVING_FOG_QUALITY_OPTIONS = [
  { id: 'high', label: 'Alta (60 FPS completos)' },
  { id: 'medium', label: 'Media (~30 FPS equilibrado)' },
  { id: 'low', label: 'Baja (~15 FPS ahorro GPU)' },
  { id: 'off', label: 'Desactivada (Solo niebla 2D)' }
];

export const AUTOSAVE_INTERVAL_OPTIONS = [
  { id: 400, label: 'Instantáneo (0.4s)' },
  { id: 5000, label: 'Cada 5 segundos' },
  { id: 15000, label: 'Cada 15 segundos' }
];

export const DEFAULT_APP_SETTINGS = {
  // Apariencia
  theme: 'dark',
  boardSurface: 'dark_wood',

  // Audio y Ecos
  masterVolume: 85,
  ambientVolume: 70,
  sfxVolume: 85,
  mutePlayerAudio: false,
  playAudioOnMaster: true,

  // Tablero, Cuadrícula y Medición
  gridSize: 50,
  gridVisibility: 'with_snap',
  gridColor: '#ffffff',
  gridOpacity: 0.28,
  measureUnit: 'both',
  metersPerSquare: 1.5,
  feetPerSquare: 5,
  defaultShowTokenName: true,
  defaultShowTokenBars: false,

  // Dados 3D
  dice3DEnabled: true,
  diceThemeColor: '#d4af37',
  diceScale: 7,
  diceThrowForce: 5,
  diceResultDurationMs: 4500,
  dicePublicTarget: 'auto',

  // Niebla, Iluminación y Rendimiento
  masterFogOpacity: 0.68,
  livingFogQuality: 'high',
  weatherEffectsEnabled: true,
  defaultDoorWidth: 36,
  defaultDoorThickness: 10,
  defaultWindowWidth: 36,
  defaultWindowThickness: 8,

  // Ventanas Flotantes
  rememberFloatingPositions: true,
  floatingPositions: {},

  // Datos y Sistema
  autoSaveEnabled: true,
  autoSaveIntervalMs: 400
};

const clampNum = (value, min, max, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

export const sanitizeAppSettings = (raw = {}) => {
  const src = raw && typeof raw === 'object' ? raw : {};
  const validTheme = ['dark', 'light', 'high-contrast'].includes(src.theme)
    ? src.theme
    : DEFAULT_APP_SETTINGS.theme;
  const validBoardSurface = BOARD_SURFACE_OPTIONS.some(opt => opt.id === src.boardSurface)
    ? src.boardSurface
    : DEFAULT_APP_SETTINGS.boardSurface;
  const validGridVis = ['with_snap', 'always', 'never'].includes(src.gridVisibility)
    ? src.gridVisibility
    : DEFAULT_APP_SETTINGS.gridVisibility;
  const validUnits = ['both', 'meters', 'feet', 'squares'].includes(src.measureUnit)
    ? src.measureUnit
    : DEFAULT_APP_SETTINGS.measureUnit;
  const validTarget = ['auto', 'local_master'].includes(src.dicePublicTarget)
    ? src.dicePublicTarget
    : DEFAULT_APP_SETTINGS.dicePublicTarget;
  const validFogQuality = ['high', 'medium', 'low', 'off'].includes(src.livingFogQuality)
    ? src.livingFogQuality
    : DEFAULT_APP_SETTINGS.livingFogQuality;

  const cleanFloating = {};
  if (src.floatingPositions && typeof src.floatingPositions === 'object') {
    Object.entries(src.floatingPositions).forEach(([key, pos]) => {
      if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
        cleanFloating[key] = { x: Math.round(pos.x), y: Math.round(pos.y) };
      }
    });
  }

  return {
    theme: validTheme,
    boardSurface: validBoardSurface,
    masterVolume: clampNum(src.masterVolume, 0, 100, DEFAULT_APP_SETTINGS.masterVolume),
    ambientVolume: clampNum(src.ambientVolume, 0, 100, DEFAULT_APP_SETTINGS.ambientVolume),
    sfxVolume: clampNum(src.sfxVolume, 0, 100, DEFAULT_APP_SETTINGS.sfxVolume),
    mutePlayerAudio: typeof src.mutePlayerAudio === 'boolean' ? src.mutePlayerAudio : DEFAULT_APP_SETTINGS.mutePlayerAudio,
    playAudioOnMaster: typeof src.playAudioOnMaster === 'boolean' ? src.playAudioOnMaster : DEFAULT_APP_SETTINGS.playAudioOnMaster,

    gridSize: clampNum(src.gridSize, 20, 150, DEFAULT_APP_SETTINGS.gridSize),
    gridVisibility: validGridVis,
    gridColor: typeof src.gridColor === 'string' && /^#[0-9a-f]{6}$/i.test(src.gridColor)
      ? src.gridColor
      : DEFAULT_APP_SETTINGS.gridColor,
    gridOpacity: clampNum(src.gridOpacity, 0.05, 0.85, DEFAULT_APP_SETTINGS.gridOpacity),
    measureUnit: validUnits,
    metersPerSquare: clampNum(src.metersPerSquare, 0.5, 20, DEFAULT_APP_SETTINGS.metersPerSquare),
    feetPerSquare: clampNum(src.feetPerSquare, 1, 50, DEFAULT_APP_SETTINGS.feetPerSquare),
    defaultShowTokenName: typeof src.defaultShowTokenName === 'boolean' ? src.defaultShowTokenName : DEFAULT_APP_SETTINGS.defaultShowTokenName,
    defaultShowTokenBars: typeof src.defaultShowTokenBars === 'boolean' ? src.defaultShowTokenBars : DEFAULT_APP_SETTINGS.defaultShowTokenBars,

    dice3DEnabled: typeof src.dice3DEnabled === 'boolean' ? src.dice3DEnabled : DEFAULT_APP_SETTINGS.dice3DEnabled,
    diceThemeColor: typeof src.diceThemeColor === 'string' && /^#[0-9a-f]{6}$/i.test(src.diceThemeColor)
      ? src.diceThemeColor
      : DEFAULT_APP_SETTINGS.diceThemeColor,
    diceScale: clampNum(src.diceScale, 4, 12, DEFAULT_APP_SETTINGS.diceScale),
    diceThrowForce: clampNum(src.diceThrowForce, 2, 10, DEFAULT_APP_SETTINGS.diceThrowForce),
    diceResultDurationMs: clampNum(src.diceResultDurationMs, 1500, 10000, DEFAULT_APP_SETTINGS.diceResultDurationMs),
    dicePublicTarget: validTarget,

    masterFogOpacity: clampNum(src.masterFogOpacity, 0.2, 0.95, DEFAULT_APP_SETTINGS.masterFogOpacity),
    livingFogQuality: validFogQuality,
    weatherEffectsEnabled: typeof src.weatherEffectsEnabled === 'boolean' ? src.weatherEffectsEnabled : DEFAULT_APP_SETTINGS.weatherEffectsEnabled,
    defaultDoorWidth: clampNum(src.defaultDoorWidth, 20, 100, DEFAULT_APP_SETTINGS.defaultDoorWidth),
    defaultDoorThickness: clampNum(src.defaultDoorThickness, 4, 24, DEFAULT_APP_SETTINGS.defaultDoorThickness),
    defaultWindowWidth: clampNum(src.defaultWindowWidth, 20, 100, DEFAULT_APP_SETTINGS.defaultWindowWidth),
    defaultWindowThickness: clampNum(src.defaultWindowThickness, 4, 24, DEFAULT_APP_SETTINGS.defaultWindowThickness),

    rememberFloatingPositions: typeof src.rememberFloatingPositions === 'boolean'
      ? src.rememberFloatingPositions
      : DEFAULT_APP_SETTINGS.rememberFloatingPositions,
    floatingPositions: cleanFloating,

    autoSaveEnabled: typeof src.autoSaveEnabled === 'boolean' ? src.autoSaveEnabled : DEFAULT_APP_SETTINGS.autoSaveEnabled,
    autoSaveIntervalMs: clampNum(src.autoSaveIntervalMs, 400, 30000, DEFAULT_APP_SETTINGS.autoSaveIntervalMs)
  };
};

export const hexToRgba = (hex, alpha = 1) => {
  const clean = (hex || '#ffffff').replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean.padEnd(6, 'f').slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) || 255;
  const g = parseInt(full.slice(2, 4), 16) || 255;
  const b = parseInt(full.slice(4, 6), 16) || 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const formatBoardDistance = (squares, settings = DEFAULT_APP_SETTINGS, fixedSquares = false) => {
  const numSq = Number(squares) || 0;
  const sqLabel = fixedSquares ? numSq.toFixed(1) : `${numSq}`;
  const feet = Math.round(numSq * (settings.feetPerSquare || 5));
  const meters = (numSq * (settings.metersPerSquare || 1.5)).toFixed(1);

  if (settings.measureUnit === 'squares') return `${sqLabel} casillas`;
  if (settings.measureUnit === 'meters') return `${sqLabel} casillas (${meters} m)`;
  if (settings.measureUnit === 'feet') return `${sqLabel} casillas (${feet} ft)`;
  return `${sqLabel} casillas (${feet} ft / ${meters} m)`;
};

export const formatShortUnitDistance = (squares, settings = DEFAULT_APP_SETTINGS) => {
  const numSq = Number(squares) || 0;
  if (settings.measureUnit === 'squares') return '';
  if (settings.measureUnit === 'meters') return ` (${(numSq * (settings.metersPerSquare || 1.5)).toFixed(1)} m)`;
  return ` (${Math.round(numSq * (settings.feetPerSquare || 5))} ft)`;
};
