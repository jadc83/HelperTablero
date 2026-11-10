export const WEATHER_TYPES = [
  { id: 'none', label: 'Despejado', icon: '☀️' },
  { id: 'rain', label: 'Lluvia', icon: '🌧️' },
  { id: 'storm', label: 'Tormenta Eléctrica', icon: '⛈️' },
  { id: 'snow', label: 'Ventisca / Nieve', icon: '❄️' },
  { id: 'ash', label: 'Ceniza y Brasas', icon: '🌋' },
  { id: 'spores', label: 'Esporas Arcanas', icon: '✨' },
  { id: 'mist', label: 'Niebla Rastrera', icon: '🌫️' }
];

export const AMBIENT_TINTS = [
  { id: 'none', label: 'Luz Natural', color: 'transparent', blend: 'normal' },
  { id: 'torch', label: 'Antorcha Cálida', color: 'rgba(217, 119, 6, 0.18)', blend: 'multiply' },
  { id: 'night', label: 'Noche Cerrada', color: 'rgba(15, 23, 42, 0.48)', blend: 'multiply' },
  { id: 'blood', label: 'Ritual Carmesí', color: 'rgba(127, 29, 29, 0.34)', blend: 'multiply' },
  { id: 'crypt', label: 'Cripta Espectral', color: 'rgba(6, 78, 59, 0.28)', blend: 'multiply' }
];

export const ENTITY_CLASSIFICATIONS = [
  { id: 'human', label: 'Humano / Investigador', group: 'character', badgeColor: '#3b82f6' },
  { id: 'npc', label: 'Aliado / PNJ', group: 'character', badgeColor: '#10b981' },
  { id: 'cultist', label: 'Cultista / Sectario', group: 'character', badgeColor: '#a855f7' },
  { id: 'mythos_creature', label: 'Criatura de los Mitos', group: 'monster', badgeColor: '#ec4899' },
  { id: 'great_old_one', label: 'Dios Primigenio', group: 'monster', badgeColor: '#ef4444' },
  { id: 'outer_god', label: 'Dios Exterior', group: 'monster', badgeColor: '#8b5cf6' },
  { id: 'animal', label: 'Animal / Fauna', group: 'monster', badgeColor: '#eab308' },
  { id: 'undead', label: 'No-Muerto / Horror', group: 'monster', badgeColor: '#64748b' },
  { id: 'aberration', label: 'Aberración Arcana', group: 'monster', badgeColor: '#06b6d4' }
];

export const getClassificationMeta = (entityType, faction = 'ally') => {
  const found = ENTITY_CLASSIFICATIONS.find(c => c.id === entityType);
  if (found) return found;
  return faction === 'enemy'
    ? ENTITY_CLASSIFICATIONS.find(c => c.id === 'mythos_creature')
    : ENTITY_CLASSIFICATIONS.find(c => c.id === 'human');
};

export const OBJECT_PRESETS = [
  { presetId: 'chest', label: 'Cofre del Tesoro', icon: '📦', openIcon: '🪙', blocksMovement: true, blocksVision: false, interactable: true },
  { presetId: 'lever', label: 'Palanca / Mecanismo', icon: '🕹️', openIcon: '⚙️', blocksMovement: false, blocksVision: false, interactable: true },
  { presetId: 'barricade', label: 'Barricada Pesada', icon: '🚧', openIcon: '🪵', blocksMovement: true, blocksVision: true, interactable: true },
  { presetId: 'altar', label: 'Altar Arcano', icon: '⛩️', openIcon: '✨', blocksMovement: true, blocksVision: false, interactable: true },
  { presetId: 'trap', label: 'Trampa de Suelo', icon: '🕸️', openIcon: '💥', blocksMovement: false, blocksVision: false, interactable: true }
];

export const LIGHT_PRESETS = [
  { presetId: 'torch', label: 'Antorcha de Pared', icon: '🔥', radius: 210, color: 'rgba(251, 146, 60, 0.22)' },
  { presetId: 'brazier', label: 'Brasero Real', icon: '🏮', radius: 300, color: 'rgba(245, 158, 11, 0.26)' },
  { presetId: 'arcane_lantern', label: 'Farol Espectral', icon: '🔮', radius: 240, color: 'rgba(56, 189, 248, 0.24)' }
];

export const SOUND_CATALOG = [
  // Ambientes Continuos (Loops)
  { id: 'amb_rain', label: 'Lluvia Intensa', icon: '🌧️', category: 'Ambiente', loop: true, audioSrc: '/assets/sounds/amb_rain.ogg' },
  { id: 'amb_wind', label: 'Viento de Cueva', icon: '💨', category: 'Ambiente', loop: true, audioSrc: '/assets/sounds/amb_wind.ogg' },
  { id: 'amb_fire', label: 'Hoguera / Antorcha', icon: '🔥', category: 'Ambiente', loop: true, audioSrc: '/assets/sounds/amb_fire.ogg' },
  { id: 'amb_dungeon', label: 'Mazmorra Tétrica', icon: '🏰', category: 'Ambiente', loop: true, audioSrc: '/assets/sounds/amb_dungeon.ogg' },
  { id: 'amb_tavern', label: 'Murmullo Taberna', icon: '🍺', category: 'Ambiente', loop: true, audioSrc: '/assets/sounds/amb_tavern.ogg' },

  // Puertas y Mecanismos
  { id: 'sfx_door_open', label: 'Puerta Abriéndose', icon: '🚪', category: 'Entorno', audioSrc: '/assets/sounds/sfx_door_open.wav' },
  { id: 'sfx_door_slam', label: 'Portazo Fuerte', icon: '🔒', category: 'Entorno', audioSrc: '/assets/sounds/sfx_door_slam.wav' },
  { id: 'sfx_glass', label: 'Cristales Rotos', icon: '🪟', category: 'Entorno', audioSrc: '/assets/sounds/sfx_glass.wav' },
  { id: 'sfx_trap', label: 'Mecanismo / Trampa', icon: '⚙️', category: 'Entorno', audioSrc: '/assets/sounds/sfx_trap.wav' },
  { id: 'sfx_thunder', label: 'Trueno Lejano', icon: '⚡', category: 'Entorno', audioSrc: '/assets/sounds/sfx_thunder.ogg', maxDuration: 6.5 },
  { id: 'sfx_chest', label: 'Cofre / Monedas', icon: '🪙', category: 'Entorno', audioSrc: '/assets/sounds/sfx_chest.ogg', maxDuration: 4.0 },

  // Combate e Impactos
  { id: 'sfx_sword', label: 'Choque de Espadas', icon: '⚔️', category: 'Combate', audioSrc: '/assets/sounds/sfx_sword.mp3' },
  { id: 'sfx_hit', label: 'Golpe Contundente', icon: '🥊', category: 'Combate', audioSrc: '/assets/sounds/sfx_hit.mp3' },
  { id: 'sfx_arrow', label: 'Flecha Silbando', icon: '🏹', category: 'Combate', audioSrc: '/assets/sounds/sfx_arrow.ogg' },
  { id: 'sfx_fireball', label: 'Explosión / Fuego', icon: '💥', category: 'Combate', audioSrc: '/assets/sounds/sfx_fireball.ogg' },
  { id: 'sfx_magic', label: 'Hechizo Arcano', icon: '✨', category: 'Combate', audioSrc: '/assets/sounds/sfx_magic.mp3' },

  // Animales y Criaturas
  { id: 'sfx_wolf', label: 'Aullido de Lobo', icon: '🐺', category: 'Criaturas', audioSrc: '/assets/sounds/sfx_wolf.ogg', maxDuration: 6.0 },
  { id: 'sfx_roar', label: 'Rugido de Monstruo', icon: '🦖', category: 'Criaturas', audioSrc: '/assets/sounds/sfx_roar.ogg', maxDuration: 4.5 },
  { id: 'sfx_crow', label: 'Graznido de Cuervo', icon: '🐦‍⬛', category: 'Criaturas', audioSrc: '/assets/sounds/sfx_crow.mp3' },
  { id: 'sfx_bats', label: 'Bandada Murciélagos', icon: '🦇', category: 'Criaturas', audioSrc: '/assets/sounds/sfx_bats.ogg' },
  { id: 'sfx_ghost', label: 'Lamento Espectral', icon: '👻', category: 'Criaturas', audioSrc: '/assets/sounds/sfx_ghost.mp3' }
];
