import React, { useState, useRef, useEffect } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { emit as tauriEmit, listen as tauriListen } from '@tauri-apps/api/event';

import Toolbar from './components/Toolbar';
import GameBoard from './components/GameBoard';
import TokenSidebar from './components/TokenSidebar';
import SettingsDrawer from './components/SettingsDrawer';
import DiceRoller from './components/DiceRoller';
import Dice3D from './components/Dice3D';
import Soundboard, { playerSoundEngine, SOUND_CATALOG } from './components/Soundboard';
import TutorialModal from './components/TutorialModal';
import MapCreator from './components/MapCreator';
import CharacterSheetModal from './components/CharacterSheetModal';
import HomeScreen from './components/HomeScreen';
import EncyclopediaView, { getClassificationMeta } from './components/EncyclopediaView';
import ObjectNotesModal from './components/ObjectNotesModal';
import MasterNotesDrawer from './components/MasterNotesDrawer';
import { WEATHER_TYPES, AMBIENT_TINTS } from './components/WeatherOverlay';
import { DEFAULT_COMMON_ITEMS } from './constants/commonItems';
import useLocalStorage from './hooks/useLocalStorage';
import { saveCampaignToDB, loadCampaignFromDB, exportCampaignJSON, saveCampaignSnapshot, getRecentCampaigns } from './utils/campaignStorage';
import { exportJSON, importJSON } from './utils/fileDialog';

const isTauriDesktop = () => Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__);

const STARTER_CHARACTERS = [
  {
    id: 1,
    firstName: 'Arthur',
    lastName: 'Pendelton',
    birthYear: '1888',
    name: 'Arthur Pendelton',
    entityType: 'human',
    color: '#3b82f6',
    faction: 'ally',
    hp: 24,
    maxHp: 24,
    mp: 12,
    maxMp: 12,
    san: 65,
    maxSan: 65,
    hasArmor: true,
    armorType: 'Gabardina de Cuero Reforzado',
    isGraveWound: false,
    history: 'Investigador privado y anticuario de Arkham. Tras hallar un diario cifrado en el puerto de Kingsport, dedica su vida a documentar fenómenos que la ciencia oficial prefiere ignorar.',
    notes: 'Siempre lleva un reloj de bolsillo de plata y un encendedor grabado.',
    inventory: [
      { id: 101, name: 'Revólver .38', state: 'equipped' },
      { id: 102, name: 'Linterna de aceite', state: 'hand' },
      { id: 103, name: 'Botiquín médico', state: 'stored' }
    ],
    spells: [
      { id: 'sp1', name: 'Signo de Voor', cost: '2 MP / 1 SAN', desc: 'Revela presencias invisibles o astrales en una estancia.' }
    ]
  },
  {
    id: 2,
    firstName: 'Eleanor',
    lastName: 'Vance',
    birthYear: '1894',
    name: 'Dra. Eleanor Vance',
    entityType: 'human',
    color: '#10b981',
    faction: 'ally',
    hp: 18,
    maxHp: 18,
    mp: 16,
    maxMp: 16,
    san: 75,
    maxSan: 75,
    hasArmor: false,
    armorType: 'Ninguna',
    isGraveWound: false,
    history: 'Catedrática de lenguas muertas y folclore precolombino en la Universidad Miskatonic. Experta en traducir tablillas cuneiformes y manuscritos prohibidos.',
    notes: 'Sufre insomnio desde la expedición al círculo megalítico.',
    inventory: [
      { id: 104, name: 'Diario de traducciones arcanas', state: 'equipped' },
      { id: 105, name: 'Daga ceremonial de obsidiana', state: 'hand' }
    ],
    spells: [
      { id: 'sp2', name: 'Sello de Protección', cost: '4 MP', desc: 'Bloquea un umbral contra entidades extradimensionales.' }
    ]
  }
];

const STARTER_MONSTERS = [
  {
    id: 3,
    firstName: 'Profundo',
    lastName: 'de Innsmouth',
    birthYear: 'Inmemorial',
    name: 'Profundo de Innsmouth',
    entityType: 'mythos_creature',
    color: '#0d9488',
    faction: 'enemy',
    hp: 26,
    maxHp: 26,
    mp: 10,
    maxMp: 10,
    san: 0,
    maxSan: 0,
    hasArmor: true,
    armorType: 'Escamas Batracias Naturales',
    isGraveWound: false,
    history: 'Criatura anfibia e inmortal que habita en las fosas oceánicas y rinde culto al Padre Dagón y a la Madre Hidra. Su aspecto combina rasgos ictiológicos y batracios.',
    notes: 'Pérdida de Cordura al verlo: 0/1D6 SAN. Extremadamente ágil en zonas inundadas.',
    inventory: [{ id: 201, name: 'Tridente de coral negro', state: 'equipped' }],
    spells: []
  },
  {
    id: 4,
    firstName: 'Lobo',
    lastName: 'del Bosque Negro',
    birthYear: 'Salvaje',
    name: 'Lobo del Bosque Negro',
    entityType: 'animal',
    color: '#ca8a04',
    faction: 'enemy',
    hp: 14,
    maxHp: 14,
    mp: 4,
    maxMp: 4,
    san: 20,
    maxSan: 20,
    hasArmor: true,
    armorType: 'Pelaje Denso',
    isGraveWound: false,
    history: 'Depredador alfa de gran envergadura que acecha en manada los caminos rurales envueltos en niebla.',
    notes: 'Ataca en grupo tratando de rodear al rezagado.',
    inventory: [{ id: 202, name: 'Colmillos desgarradores', state: 'equipped' }],
    spells: []
  },
  {
    id: 5,
    firstName: 'Avatar de',
    lastName: 'Nyarlathotep',
    birthYear: 'Antes del Tiempo',
    name: 'Avatar de Nyarlathotep',
    entityType: 'outer_god',
    color: '#7c3aed',
    faction: 'enemy',
    hp: 85,
    maxHp: 85,
    mp: 60,
    maxMp: 60,
    san: 99,
    maxSan: 99,
    hasArmor: true,
    armorType: 'Inmunidad Mundana / Aura del Caos',
    isGraveWound: false,
    history: 'El Caos Reptante, mensajero y alma de los Dioses Exteriores. Adopta mil máscaras entre los mortales para sembrar la locura y precipitar el fin de las eras.',
    notes: 'Cualquier mirada directa a su verdadera forma provoca una pérdida masiva de Cordura.',
    inventory: [],
    spells: [
      { id: 'sp3', name: 'Mirada del Vacío', cost: '10 MP', desc: 'Fractura la mente del objetivo con visiones del cosmos exterior.' }
    ]
  }
];

const DEFAULT_STATUSES = [
  { id: 'bloodied', icon: '🩸', label: 'Malherido', effect: 'none' },
  { id: 'poisoned', icon: '🤢', label: 'Envenenado', effect: 'none' },
  { id: 'stunned', icon: '💫', label: 'Aturdido', effect: 'immobilize' },
  { id: 'burning', icon: '🔥', label: 'Ardiendo', effect: 'none' }
];

const segmentsIntersect = (ax, ay, bx, by, cx, cy, dx, dy) => {
  const ccw = (p1x, p1y, p2x, p2y, p3x, p3y) =>
    (p3y - p1y) * (p2x - p1x) > (p2y - p1y) * (p3x - p1x);
  return (
    ccw(ax, ay, cx, cy, dx, dy) !== ccw(bx, by, cx, cy, dx, dy) &&
    ccw(ax, ay, bx, by, cx, cy) !== ccw(ax, ay, bx, by, dx, dy)
  );
};

const GLOBAL_VTT_STYLES = `
  html, body, #root {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: 100% !important;
    overflow: hidden !important;
    background-color: #0b0d12 !important;
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #e2e8f0;
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
  }
  *, *::before, *::after {
    box-sizing: border-box;
  }
  .vtt-gothic-title {
    font-family: 'Cinzel', Georgia, serif;
    letter-spacing: 0.05em;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
  }
  .vtt-retro-badge {
    font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace;
    letter-spacing: 0.04em;
  }
  .vtt-wood-panel {
    background: #141822;
    border: 1px solid #2b3345;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }
  .vtt-brass-btn {
    font-family: 'Inter', system-ui, sans-serif;
    background: #161a24;
    color: #cbd5e1;
    border: 1px solid #2b3345;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
    transition: all 0.15s ease;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .vtt-brass-btn:hover:not(:disabled) {
    background: #1e2433;
    border-color: #3f4b64;
    color: #f8fafc;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.45);
  }
  .vtt-brass-btn:active:not(:disabled) {
    transform: translateY(1px);
  }
  .vtt-primary-cta {
    font-family: 'Inter', system-ui, sans-serif;
    background-color: #2a1a08;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.32) 0%, rgba(180, 83, 9, 0.45) 100%);
    color: #fbbf24;
    border: 1.5px solid #f59e0b;
    font-weight: 700;
    box-shadow: 0 2px 10px rgba(245, 158, 11, 0.25), inset 0 0 8px rgba(245, 158, 11, 0.12);
    transition: all 0.15s ease;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .vtt-primary-cta:hover:not(:disabled) {
    background-color: #38240c;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.45) 0%, rgba(180, 83, 9, 0.6) 100%);
    border-color: #fbbf24;
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35), inset 0 0 12px rgba(245, 158, 11, 0.18);
  }
  .vtt-primary-cta:active:not(:disabled) {
    transform: translateY(1px);
  }
  .vtt-btn-active {
    background: rgba(245, 158, 11, 0.15) !important;
    border-color: #f59e0b !important;
    color: #fbbf24 !important;
    box-shadow: 0 0 10px rgba(245, 158, 11, 0.25) !important;
  }
  .vtt-btn-danger {
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.35);
    color: #fca5a5;
    transition: all 0.15s ease;
  }
  .vtt-btn-danger:hover:not(:disabled) {
    background: #dc2626;
    border-color: #ef4444;
    color: #ffffff;
  }
  select, input[type="text"], input[type="number"], textarea {
    font-family: inherit;
    background-color: #121620;
    color: #f1f5f9;
    border: 1px solid #2b3345;
    outline: none;
    transition: border-color 0.15s ease;
  }
  select:focus, input[type="text"]:focus, input[type="number"]:focus, textarea:focus {
    border-color: #f59e0b;
  }
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: #0b0d13;
  }
  ::-webkit-scrollbar-thumb {
    background: #242c3d;
    border-radius: 999px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #3b465f;
  }
`;

// Componente de Proyección a Pantalla Completa (Handout)
const HandoutFullscreenOverlay = ({ handout, isPlayerView, onStopProjection }) => {
  if (!handout) return null;

  if (!isPlayerView) {
    return (
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '68px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9500,
          background: 'linear-gradient(180deg, rgba(24, 28, 38, 0.96) 0%, rgba(14, 16, 22, 0.98) 100%)',
          border: '1px solid #f59e0b',
          borderRadius: '10px',
          padding: '8px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          color: '#f8fafc',
          boxShadow: '0 10px 25px rgba(0,0,0,0.9)'
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600 }}>
          🖼️ Proyectando en Sala de Jugadores: <strong style={{ color: '#fbbf24' }}>{handout.title}</strong>
        </span>
        <button
          onClick={onStopProjection}
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            background: '#991b1b',
            color: '#fecaca',
            border: '1px solid #f87171',
            fontWeight: 700,
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Cerrar Proyección
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(5, 3, 2, 0.95)',
        zIndex: 99990,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px'
      }}
    >
      {handout.type === 'note' ? (
        <div
          style={{
            background: 'radial-gradient(circle, #f7ebd2 0%, #dcc196 100%)',
            padding: '42px',
            borderRadius: '10px',
            width: '680px',
            maxWidth: '90vw',
            maxHeight: '82vh',
            overflowY: 'auto',
            color: '#3b2314',
            boxShadow: '0 25px 60px rgba(0,0,0,0.98), inset 0 0 40px rgba(120, 53, 15, 0.35)',
            border: '5px double #5c3a21'
          }}
        >
          <h2 className="vtt-gothic-title" style={{ margin: '0 0 18px 0', borderBottom: '2px solid #8a6d3b', paddingBottom: '12px', fontSize: '28px', color: '#451a03', textShadow: 'none' }}>
            {handout.title}
          </h2>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.75', margin: 0, fontSize: '21px', fontFamily: "'Crimson Text', Georgia, serif" }}>
            {handout.content}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '92vw',
            maxHeight: '90vh'
          }}
        >
          <div
            style={{
              border: '4px double #d4af37',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 25px 70px rgba(0,0,0,0.98), 0 0 35px rgba(212, 175, 55, 0.25)',
              backgroundColor: '#090604',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <img
              src={handout.src}
              alt={handout.title}
              style={{
                maxWidth: '88vw',
                maxHeight: '78vh',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>
          {handout.title && (
            <div
              className="vtt-gothic-title"
              style={{
                marginTop: '16px',
                padding: '8px 24px',
                background: 'linear-gradient(180deg, #261810 0%, #120b07 100%)',
                border: '2px solid #d4af37',
                borderRadius: '6px',
                color: '#f3e5ab',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: '0 8px 20px rgba(0,0,0,0.9)'
              }}
            >
              {handout.title}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function App() {
  const isPlayerView = new URLSearchParams(window.location.search).get('view') === 'player';

  const [characters, setCharacters] = useLocalStorage('vtt_characters', [
    ...STARTER_CHARACTERS,
    ...STARTER_MONSTERS
  ]);
  const [tokens, setTokens] = useLocalStorage('vtt_tokens', []);
  const [graveyard, setGraveyard] = useLocalStorage('vtt_graveyard', []);
  const [maps, setMaps] = useLocalStorage('vtt_maps_array', []);
  const [fowEnabled, setFowEnabled] = useLocalStorage('vtt_fow_enabled', false);
  const [fowBrushSize, setFowBrushSize] = useLocalStorage('vtt_fow_brush', 80);
  const [fowVisionRadius, setFowVisionRadius] = useLocalStorage('vtt_fow_vision_radius', 180);
  const [fowMemoryEnabled, setFowMemoryEnabled] = useLocalStorage('vtt_fow_memory', true);
  const [fowAutoHideEnemies, setFowAutoHideEnemies] = useLocalStorage('vtt_fow_autohide_enemies', true);
  const [fowActions, setFowActions] = useLocalStorage('vtt_fow_actions', []);
  const [snapToGrid, setSnapToGrid] = useLocalStorage('vtt_snap_grid', false);
  const [gridSize, setGridSize] = useLocalStorage('vtt_grid_size', 50);
  const [customStatuses, setCustomStatuses] = useLocalStorage('vtt_custom_statuses', DEFAULT_STATUSES);
  const [weatherEffect, setWeatherEffect] = useLocalStorage('vtt_weather_effect', 'none');
  const [ambientTint, setAmbientTint] = useLocalStorage('vtt_ambient_tint', 'none');
  const [syncCameraToPlayers, setSyncCameraToPlayers] = useLocalStorage('vtt_sync_camera', true);
  const [tutorialDismissed, setTutorialDismissed] = useLocalStorage('vtt_tutorial_dismissed', false);
  const [customSounds, setCustomSounds] = useLocalStorage('vtt_custom_sounds', []);
  const [customObjects, setCustomObjects] = useLocalStorage('vtt_custom_objects', []);
  const [commonItems, setCommonItems] = useLocalStorage('vtt_common_items', DEFAULT_COMMON_ITEMS);

  // Gestión de Múltiples Escenas y Proyector de Handouts
  const [scenes, setScenes] = useLocalStorage('vtt_scenes_list', [
    {
      id: 'scene_default',
      name: 'Escena Principal',
      maps: [],
      tokens: [],
      fowActions: [],
      weatherEffect: 'none',
      ambientTint: 'none'
    }
  ]);
  const [activeSceneId, setActiveSceneId] = useLocalStorage('vtt_active_scene_id', 'scene_default');
  const [handouts, setHandouts] = useLocalStorage('vtt_handouts_list', []);
  const [activeHandout, setActiveHandout] = useLocalStorage('vtt_active_handout', null);

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const [draggedToken, setDraggedToken] = useState(null);
  const [rotatingToken, setRotatingToken] = useState(null);
  const [fowMode, setFowMode] = useState('none');
  const [isPaintingFow, setIsPaintingFow] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMapCreatorOpen, setIsMapCreatorOpen] = useState(false);
  const [isHomeOpen, setIsHomeOpen] = useState(false);
  const [encyclopediaState, setEncyclopediaState] = useState({ isOpen: false, category: 'character' });
  const [confirmResetBoard, setConfirmResetBoard] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(() => !tutorialDismissed && !isPlayerView);
  const [dbLoaded, setDbLoaded] = useState(false);

  // Estado para abrir el Modal de Creación o Edición de Personaje
  const [editingCharacter, setEditingCharacter] = useState(null); // { mode: 'create' | 'edit', character: obj | null }

  const [rulerActive, setRulerActive] = useState(false);
  const [rulerMeasure, setRulerMeasure] = useState(null);
  const [pingActive, setPingActive] = useState(false);
  const [pings, setPings] = useState([]);

  // Estado para Invocación Interactiva de Personajes y Objetos en el Mapa
  const [pendingTokenSpawn, setPendingTokenSpawn] = useState(null);
  const [pendingMapSpawn, setPendingMapSpawn] = useState(null);
  const [draggedMapElement, setDraggedMapElement] = useState(null);
  const [objectNotesModalState, setObjectNotesModalState] = useState({ isOpen: false, objectItem: null });

  // Estados para el Diario & Bloc de Notas del Máster (Punto 1)
  const [isMasterNotesOpen, setIsMasterNotesOpen] = useState(false);
  const [sceneNotes, setSceneNotes] = useLocalStorage('vtt_scene_notes', {});
  const [campaignNotes, setCampaignNotes] = useLocalStorage('vtt_campaign_notes', '');

  const [holdProgress, setHoldProgress] = useState(null);
  const [radialMenu, setRadialMenu] = useState(null);
  const [activeLoops, setActiveLoops] = useState([]);
  const [masterToast, setMasterToast] = useState(null);

  // Estados de paneles y Dados 3D
  const [isDiceOpen, setIsDiceOpen] = useState(false);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);
  const [player3DRoll, setPlayer3DRoll] = useState(null);
  const [master3DRoll, setMaster3DRoll] = useState(null);
  const [incomingRollResult, setIncomingRollResult] = useState(null);
  const [publicRollResult, setPublicRollResult] = useState(null);
  const [waitingForPlayerRoll, setWaitingForPlayerRoll] = useState(false);
  const lastPlayerPingRef = useRef(0);

  // Estados de Combate y Turnos
  const [isCombatActive, setIsCombatActive] = useState(false);
  const [combatRound, setCombatRound] = useState(1);
  const [activeTurnTokenId, setActiveTurnTokenId] = useState(null);
  const [movementLimitsEnabled, setMovementLimitsEnabled] = useLocalStorage('vtt_movement_limits_enabled', true);
  const tokenDragOriginRef = useRef(null);
  const [tokenDragMeasurement, setTokenDragMeasurement] = useState(null);

  const boardRef = useRef(null);
  const fowCanvasRef = useRef(null);
  const fileInputCampaignRef = useRef(null);
  const syncChannelRef = useRef(null);
  const holdTimerRef = useRef(null);
  const holdStartPosRef = useRef(null);
  const isSwitchingSceneRef = useRef(false);
  const latestStateRef = useRef({});
  const lastFowPointRef = useRef(null);

  // Mantener actualizado el ref con el último estado para respuestas de sincronización atómicas
  useEffect(() => {
    latestStateRef.current = {
      tokens, maps, fowEnabled, fowVisionRadius, fowMemoryEnabled, fowAutoHideEnemies,
      fowActions, snapToGrid, gridSize, customStatuses, weatherEffect, ambientTint,
      activeHandout, isCombatActive, combatRound, activeTurnTokenId, movementLimitsEnabled,
      camera: syncCameraToPlayers ? { pan, scale } : null
    };
  }, [
    tokens, maps, fowEnabled, fowVisionRadius, fowMemoryEnabled, fowAutoHideEnemies,
    fowActions, snapToGrid, gridSize, customStatuses, weatherEffect, ambientTint,
    activeHandout, isCombatActive, combatRound, activeTurnTokenId, movementLimitsEnabled, syncCameraToPlayers, pan, scale
  ]);

  // Función auxiliar para emitir eventos tanto por BroadcastChannel (Web) como por Tauri Events (Desktop)
  const postSyncMessage = (message) => {
    if (syncChannelRef.current) {
      try { syncChannelRef.current.postMessage(message); } catch (e) {}
    }
    if (isTauriDesktop()) {
      tauriEmit('vtt_realtime_event', message).catch(() => {});
    }
  };

  // Mantener la escena activa actualizada cuando cambian los mapas, fichas, niebla o clima
  useEffect(() => {
    if (isPlayerView || !activeSceneId || isSwitchingSceneRef.current) return;
    setScenes((prevScenes) => {
      const exists = prevScenes.some((sc) => sc.id === activeSceneId);
      if (!exists) {
        return [
          {
            id: activeSceneId,
            name: 'Escena Principal',
            maps,
            tokens,
            fowActions,
            weatherEffect,
            ambientTint
          },
          ...prevScenes
        ];
      }
      return prevScenes.map((sc) =>
        sc.id === activeSceneId
          ? { ...sc, maps, tokens, fowActions, weatherEffect, ambientTint }
          : sc
      );
    });
  }, [maps, tokens, fowActions, weatherEffect, ambientTint, activeSceneId, isPlayerView, setScenes]);

  // 1. Cargar campaña completa desde IndexedDB al iniciar
  useEffect(() => {
    let mounted = true;
    loadCampaignFromDB().then((saved) => {
      if (!mounted) return;
      if (saved) {
        if (saved.characters) setCharacters(saved.characters);
        if (saved.tokens) setTokens(saved.tokens);
        if (saved.maps) setMaps(saved.maps);
        if (saved.fowEnabled !== undefined) setFowEnabled(saved.fowEnabled);
        if (saved.fowBrushSize) setFowBrushSize(saved.fowBrushSize);
        if (saved.fowVisionRadius) setFowVisionRadius(saved.fowVisionRadius);
        if (saved.fowMemoryEnabled !== undefined) setFowMemoryEnabled(saved.fowMemoryEnabled);
        if (saved.fowAutoHideEnemies !== undefined) setFowAutoHideEnemies(saved.fowAutoHideEnemies);
        if (saved.fowActions) setFowActions(saved.fowActions);
        if (saved.snapToGrid !== undefined) setSnapToGrid(saved.snapToGrid);
        if (saved.gridSize) setGridSize(saved.gridSize);
        if (saved.customStatuses) setCustomStatuses(saved.customStatuses);
        if (saved.weatherEffect) setWeatherEffect(saved.weatherEffect);
        if (saved.ambientTint) setAmbientTint(saved.ambientTint);
        if (saved.customSounds) setCustomSounds(saved.customSounds);
        if (Array.isArray(saved.scenes) && saved.scenes.length > 0) setScenes(saved.scenes);
        if (saved.activeSceneId) setActiveSceneId(saved.activeSceneId);
        if (Array.isArray(saved.handouts)) setHandouts(saved.handouts);
        if (saved.activeHandout !== undefined) setActiveHandout(saved.activeHandout);
        if (Array.isArray(saved.graveyard)) setGraveyard(saved.graveyard);
        if (Array.isArray(saved.customObjects)) setCustomObjects(saved.customObjects);
        if (Array.isArray(saved.commonItems)) setCommonItems(saved.commonItems);
      }
      setDbLoaded(true);
    });
    return () => { mounted = false; };
  }, []);

  // 2. Auto-guardar en IndexedDB cada vez que cambie el estado en la vista del Master
  useEffect(() => {
    if (!dbLoaded || isPlayerView) return;
    const timer = setTimeout(() => {
      saveCampaignToDB({
        characters,
        tokens,
        maps,
        fowEnabled,
        fowBrushSize,
        fowVisionRadius,
        fowMemoryEnabled,
        fowAutoHideEnemies,
        fowActions,
        snapToGrid,
        gridSize,
        customStatuses,
        weatherEffect,
        ambientTint,
        customSounds,
        scenes,
        activeSceneId,
        handouts,
        activeHandout,
        graveyard,
        customObjects,
        commonItems
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [
    dbLoaded, isPlayerView, characters, tokens, maps,
    fowEnabled, fowBrushSize, fowVisionRadius, fowMemoryEnabled, fowAutoHideEnemies,
    fowActions, snapToGrid, gridSize, customStatuses, weatherEffect, ambientTint,
    customSounds, scenes, activeSceneId, handouts, activeHandout, graveyard, customObjects, commonItems
  ]);

  // 3. Sincronización en tiempo real entre ventana de Master y ventana de Jugador
  useEffect(() => {
    let isMounted = true;
    let unlistenTauri = null;
    const channel = new BroadcastChannel('vtt_realtime_sync');
    syncChannelRef.current = channel;

    const handleIncomingMessage = (msg) => {
      if (!isMounted || !msg || !msg.type) return;

      if (!isPlayerView) {
        if (msg.type === 'PLAYER_PING' || msg.type === 'REQUEST_INITIAL_STATE') {
          lastPlayerPingRef.current = Date.now();
          if (msg.type === 'REQUEST_INITIAL_STATE') {
            postSyncMessage({
              type: 'STATE_SYNC',
              payload: latestStateRef.current
            });
          }
          return;
        }

        // El Master recibe el resultado físico 3D real desde la Pantalla de Jugadores
        if (msg.type === 'RESULT_3D_ROLL') {
          setPublicRollResult(msg.payload);
          setIncomingRollResult(msg.payload);
          setWaitingForPlayerRoll(false);
          return;
        }

        if (msg.type === 'CLOSE_3D_ROLL') {
          document.querySelectorAll('.dice-box-canvas').forEach(c => {
            try { c.remove(); } catch (e) {}
          });
          setPublicRollResult(null);
          setMaster3DRoll(null);
          setWaitingForPlayerRoll(false);
          return;
        }
      }

      if (isPlayerView) {
        if (msg.type === 'STATE_SYNC') {
          const p = msg.payload;
          if (!p) return;
          if (p.tokens) setTokens(p.tokens);
          if (p.maps) setMaps(p.maps);
          if (p.fowEnabled !== undefined) setFowEnabled(p.fowEnabled);
          if (p.fowVisionRadius !== undefined) setFowVisionRadius(p.fowVisionRadius);
          if (p.fowMemoryEnabled !== undefined) setFowMemoryEnabled(p.fowMemoryEnabled);
          if (p.fowAutoHideEnemies !== undefined) setFowAutoHideEnemies(p.fowAutoHideEnemies);
          if (p.fowActions) setFowActions(p.fowActions);
          if (p.snapToGrid !== undefined) setSnapToGrid(p.snapToGrid);
          if (p.gridSize !== undefined) setGridSize(p.gridSize);
          if (p.customStatuses) setCustomStatuses(p.customStatuses);
          if (p.weatherEffect) setWeatherEffect(p.weatherEffect);
          if (p.ambientTint) setAmbientTint(p.ambientTint);
          if (p.activeHandout !== undefined) setActiveHandout(p.activeHandout);
          if (p.isCombatActive !== undefined) setIsCombatActive(p.isCombatActive);
          if (p.combatRound !== undefined) setCombatRound(p.combatRound);
          if (p.activeTurnTokenId !== undefined) setActiveTurnTokenId(p.activeTurnTokenId);
          if (p.camera) {
            setPan(p.camera.pan);
            setScale(p.camera.scale);
          }
        } else if (msg.type === 'PING') {
          setPings(prev => [...prev, msg.payload]);
          setTimeout(() => {
            if (isMounted) setPings(prev => prev.filter(p => p.id !== msg.payload.id));
          }, 3600);
        } else if (msg.type === 'TRIGGER_3D_ROLL') {
          document.querySelectorAll('.dice-box-canvas').forEach(c => {
            try { c.remove(); } catch (e) {}
          });
          setPlayer3DRoll(msg.payload);
        } else if (msg.type === 'CLOSE_3D_ROLL') {
          document.querySelectorAll('.dice-box-canvas').forEach(c => {
            try { c.remove(); } catch (e) {}
          });
          setPlayer3DRoll(null);
        } else if (msg.type === 'SOUND_PLAY') {
          playerSoundEngine.play(msg.payload);
        } else if (msg.type === 'SOUND_STOP_ALL') {
          playerSoundEngine.stopAll();
        }
      }
    };

    channel.onmessage = (event) => handleIncomingMessage(event.data);

    if (isTauriDesktop()) {
      tauriListen('vtt_realtime_event', (event) => {
        handleIncomingMessage(event.payload);
      }).then((fn) => {
        if (!isMounted) {
          try { fn(); } catch (e) {}
        } else {
          unlistenTauri = fn;
        }
      }).catch(() => {});
    }

    let playerPingInterval = null;
    if (isPlayerView) {
      postSyncMessage({ type: 'PLAYER_PING', payload: { time: Date.now() } });
      playerPingInterval = setInterval(() => {
        if (isMounted) postSyncMessage({ type: 'PLAYER_PING', payload: { time: Date.now() } });
      }, 2500);

      setTimeout(() => {
        if (isMounted) postSyncMessage({ type: 'REQUEST_INITIAL_STATE' });
      }, 150);
    }

    return () => {
      isMounted = false;
      if (playerPingInterval) clearInterval(playerPingInterval);
      channel.close();
      if (unlistenTauri) {
        try { unlistenTauri(); } catch (e) {}
      }
    };
  }, [isPlayerView]);

  // Emitir cambios de estado desde el Master hacia la Vista de Jugadores
  useEffect(() => {
    if (isPlayerView) return;
    postSyncMessage({
      type: 'STATE_SYNC',
      payload: {
        tokens, maps, fowEnabled, fowVisionRadius, fowMemoryEnabled, fowAutoHideEnemies,
        fowActions, snapToGrid, gridSize, customStatuses, weatherEffect, ambientTint,
        activeHandout, isCombatActive, combatRound, activeTurnTokenId,
        camera: syncCameraToPlayers ? { pan, scale } : null
      }
    });
  }, [
    isPlayerView, tokens, maps, fowEnabled, fowVisionRadius, fowMemoryEnabled,
    fowAutoHideEnemies, fowActions, snapToGrid, gridSize, customStatuses,
    weatherEffect, ambientTint, activeHandout, isCombatActive, combatRound, activeTurnTokenId, syncCameraToPlayers, pan, scale
  ]);

  // Permitir cancelar la invocación de ficha u objeto con la tecla Escape
  useEffect(() => {
    if (!pendingTokenSpawn && !pendingMapSpawn) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (pendingTokenSpawn) setPendingTokenSpawn(null);
        if (pendingMapSpawn) setPendingMapSpawn(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pendingTokenSpawn, pendingMapSpawn]);

  // Atajo de teclado: Tecla 'N' para alternar el Diario & Notas del Máster
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'n' || e.key === 'N') {
        if (!isPlayerView) {
          setIsMasterNotesOpen(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPlayerView]);

  const showMasterFeedback = (label, icon = '⚜️') => {
    setMasterToast({ label, icon });
    setTimeout(() => {
      setMasterToast(prev => (prev && prev.label === label ? null : prev));
    }, 2600);
  };

  // Reordenar escenas por botones (Subir / Bajar)
  const handleMoveSceneOrder = (index, direction) => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= scenes.length) return;
    const newScenes = [...scenes];
    const temp = newScenes[index];
    newScenes[index] = newScenes[targetIdx];
    newScenes[targetIdx] = temp;
    setScenes(newScenes);
    showMasterFeedback('Orden de escenas actualizado', '🗺️');
  };

  // Reordenar escenas arrastrando (Drag & Drop)
  const handleReorderScenes = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= scenes.length || toIndex >= scenes.length) return;
    const updated = [...scenes];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setScenes(updated);
    showMasterFeedback('Orden de escenas actualizado', '🗺️');
  };

  const handleUpdateTokenStats = (tokenId, patch) => {
    let targetCharId = null;
    setTokens(prev => prev.map(t => {
      if (t.id === tokenId) {
        targetCharId = t.characterId;
        return { ...t, ...patch };
      }
      return t;
    }));
    if (targetCharId) {
      setCharacters(prev => prev.map(c => c.id === targetCharId ? { ...c, ...patch } : c));
    }
  };

  const handleOpenTokenSheet = (tokenOrId, initialTab = 'stats') => {
    const targetToken = typeof tokenOrId === 'object' && tokenOrId !== null
      ? tokenOrId
      : tokens.find(t => t.id === tokenOrId) || characters.find(c => c.id === tokenOrId);
    if (!targetToken) return;

    const linkedChar = characters.find(c => c.id === targetToken.characterId || c.id === targetToken.id || c.name === targetToken.name);
    const mergedChar = {
      ...(linkedChar || {}),
      ...targetToken,
      id: linkedChar ? linkedChar.id : targetToken.id,
      characterId: linkedChar ? linkedChar.id : targetToken.characterId,
      inventory: Array.isArray(targetToken.inventory) ? targetToken.inventory : (linkedChar?.inventory || []),
      hp: targetToken.hp ?? linkedChar?.hp,
      maxHp: targetToken.maxHp ?? linkedChar?.maxHp,
      mp: targetToken.mp ?? linkedChar?.mp,
      maxMp: targetToken.maxMp ?? linkedChar?.maxMp,
      san: targetToken.san ?? linkedChar?.san,
      maxSan: targetToken.maxSan ?? linkedChar?.maxSan,
      hasArmor: targetToken.hasArmor ?? linkedChar?.hasArmor,
      armorType: targetToken.armorType ?? linkedChar?.armorType,
      isGraveWound: targetToken.isGraveWound ?? linkedChar?.isGraveWound,
    };

    setEditingCharacter({
      mode: 'edit',
      character: mergedChar,
      linkedTokenId: targetToken.id,
      initialTab: initialTab || 'stats'
    });
  };

  const handleEditCharacter = (char) => {
    if (!char) return;
    const matchingToken = tokens.find(t => t.characterId === char.id || t.id === char.id || t.name === char.name);
    const charData = matchingToken ? {
      ...char,
      inventory: Array.isArray(matchingToken.inventory) ? matchingToken.inventory : (char.inventory || []),
      hp: matchingToken.hp ?? char.hp,
      maxHp: matchingToken.maxHp ?? char.maxHp,
      mp: matchingToken.mp ?? char.mp,
      maxMp: matchingToken.maxMp ?? char.maxMp,
      san: matchingToken.san ?? char.san,
      maxSan: matchingToken.maxSan ?? char.maxSan,
      hasArmor: matchingToken.hasArmor ?? char.hasArmor,
      armorType: matchingToken.armorType ?? char.armorType,
      isGraveWound: matchingToken.isGraveWound ?? char.isGraveWound,
    } : char;
    setEditingCharacter({ mode: 'edit', character: charData, linkedTokenId: matchingToken?.id });
  };

  const handleSelectScene = (targetSceneId) => {
    const target = scenes.find((sc) => sc.id === targetSceneId);
    if (!target) return;
    
    // Guardar el estado actual de la escena saliente antes del cambio
    setScenes((prev) => prev.map((sc) =>
      sc.id === activeSceneId
        ? { ...sc, maps, tokens, fowActions, weatherEffect, ambientTint }
        : sc
    ));

    isSwitchingSceneRef.current = true;
    setActiveSceneId(target.id);
    setMaps(target.maps || []);
    setTokens(target.tokens || []);
    setFowActions(target.fowActions || []);
    setWeatherEffect(target.weatherEffect || 'none');
    setAmbientTint(target.ambientTint || 'none');
    setPan({ x: 0, y: 0 });
    setTimeout(() => {
      isSwitchingSceneRef.current = false;
    }, 120);
    showMasterFeedback(`Escena activa: ${target.name}`, '🗺️');
  };

  const handleCreateNewScene = (sceneName) => {
    const newId = `scene_${Date.now()}`;
    const newSceneObj = {
      id: newId,
      name: sceneName,
      maps: [],
      tokens: [],
      fowActions: [],
      weatherEffect: 'none',
      ambientTint: 'none'
    };
    isSwitchingSceneRef.current = true;
    setScenes((prev) => [
      ...prev.map((sc) =>
        sc.id === activeSceneId
          ? { ...sc, maps, tokens, fowActions, weatherEffect, ambientTint }
          : sc
      ),
      newSceneObj
    ]);
    setActiveSceneId(newId);
    setMaps([]);
    setTokens([]);
    setFowActions([]);
    setWeatherEffect('none');
    setAmbientTint('none');
    setPan({ x: 0, y: 0 });
    setTimeout(() => {
      isSwitchingSceneRef.current = false;
    }, 120);
    showMasterFeedback(`Nueva escena creada: ${sceneName}`, '🗺️');
  };

  const handleRenameScene = (sceneId, newName) => {
    if (!newName || !newName.trim()) return;
    setScenes((prev) =>
      prev.map((sc) => (sc.id === sceneId ? { ...sc, name: newName.trim() } : sc))
    );
    showMasterFeedback(`Escena renombrada a "${newName.trim()}"`, '✏️');
  };

  const handleDeleteScene = (sceneIdToDelete) => {
    const remaining = scenes.filter((sc) => sc.id !== sceneIdToDelete);
    if (remaining.length === 0) {
      const blankScene = {
        id: 'scene_' + Date.now(),
        name: 'Escena 1',
        maps: [],
        tokens: [],
        fowActions: [],
        weatherEffect: 'none',
        ambientTint: 'none'
      };
      isSwitchingSceneRef.current = true;
      setScenes([blankScene]);
      setActiveSceneId(blankScene.id);
      setMaps([]);
      setTokens([]);
      setFowActions([]);
      setWeatherEffect('none');
      setAmbientTint('none');
      setTimeout(() => {
        isSwitchingSceneRef.current = false;
      }, 120);
      showMasterFeedback('Escena eliminada (Tablero reiniciado)', '🗑️');
      return;
    }

    setScenes(remaining);
    if (activeSceneId === sceneIdToDelete) {
      const next = remaining[0];
      isSwitchingSceneRef.current = true;
      setActiveSceneId(next.id);
      setMaps(next.maps || []);
      setTokens(next.tokens || []);
      setFowActions(next.fowActions || []);
      setWeatherEffect(next.weatherEffect || 'none');
      setAmbientTint(next.ambientTint || 'none');
      setTimeout(() => {
        isSwitchingSceneRef.current = false;
      }, 120);
    }
    showMasterFeedback('Escena eliminada', '🗑️');
  };

  const handleDeleteAllScenes = () => {
    const blankScene = {
      id: 'scene_' + Date.now(),
      name: 'Escena 1',
      maps: [],
      tokens: [],
      fowActions: [],
      weatherEffect: 'none',
      ambientTint: 'none'
    };
    isSwitchingSceneRef.current = true;
    setScenes([blankScene]);
    setActiveSceneId(blankScene.id);
    setMaps([]);
    setTokens([]);
    setFowActions([]);
    setWeatherEffect('none');
    setAmbientTint('none');
    setTimeout(() => {
      isSwitchingSceneRef.current = false;
    }, 120);
    showMasterFeedback('Todas las escenas han sido eliminadas', '🗑️');
  };

  const handleProjectHandout = (handoutObj) => {
    setActiveHandout(handoutObj);
    if (handoutObj) {
      showMasterFeedback(`Proyectando: ${handoutObj.title}`, '🖼️');
    } else {
      showMasterFeedback('Proyección cerrada', '🖼️');
    }
  };

  const emitPingAt = (x, y, options = {}) => {
    const newPing = {
      id: Date.now() + Math.random(),
      x,
      y,
      color: options.color || '#d4af37',
      icon: options.icon || '🔔',
      label: options.label || null,
      isSoundWave: Boolean(options.isSoundWave)
    };
    setPings(prev => [...prev, newPing]);
    postSyncMessage({ type: 'PING', payload: newPing });
    setTimeout(() => {
      setPings(prev => prev.filter(p => p.id !== newPing.id));
    }, 3600);
  };

  const handleTriggerSound = (soundOrId) => {
    const soundObj = typeof soundOrId === 'object'
      ? soundOrId
      : [...SOUND_CATALOG, ...customSounds].find(s => s.id === soundOrId) || { id: soundOrId, label: 'Efecto', icon: '🔊' };

    postSyncMessage({ type: 'SOUND_PLAY', payload: soundObj });

    if (soundObj.loop || String(soundObj.id).startsWith('amb_')) {
      const isAlreadyActive = activeLoops.includes(soundObj.id);
      const nextLoops = isAlreadyActive
        ? activeLoops.filter(item => item !== soundObj.id)
        : [...activeLoops, soundObj.id];
      setActiveLoops(nextLoops);
      showMasterFeedback(isAlreadyActive ? `Detenido: ${soundObj.label}` : `Ambiente: ${soundObj.label}`, soundObj.icon);
    } else {
      showMasterFeedback(soundObj.label, soundObj.icon);
    }
  };

  const handleStopAllSounds = () => {
    postSyncMessage({ type: 'SOUND_STOP_ALL' });
    setActiveLoops([]);
    showMasterFeedback('Ecos silenciados', '🔇');
  };

  const handleSelectSpatialSound = (soundObj) => {
    if (!radialMenu) return;
    const { worldX, worldY } = radialMenu;

    if (!soundObj) {
      emitPingAt(worldX, worldY, { icon: '🔔', color: '#d4af37' });
      showMasterFeedback('Señal visual enviada a Jugadores', '🔔');
    } else {
      postSyncMessage({ type: 'SOUND_PLAY', payload: soundObj });
      emitPingAt(worldX, worldY, {
        icon: soundObj.icon,
        label: soundObj.label,
        color: '#fbbf24',
        isSoundWave: true
      });
      showMasterFeedback(`${soundObj.label} (en el mapa)`, soundObj.icon);
    }
    setRadialMenu(null);
  };

  // Funciones de los Dados 3D
  const handleTriggerPublicRoll = (rollReq) => {
    document.querySelectorAll('.dice-box-canvas').forEach(c => {
      try { c.remove(); } catch (e) {}
    });
    const isPlayerViewConnected = (Date.now() - lastPlayerPingRef.current) < 6500;

    if (isPlayerViewConnected) {
      // 1. Hay Pantalla de Jugadores activa: la tirada física 3D se ejecuta allí y nos devuelve el resultado
      postSyncMessage({ type: 'TRIGGER_3D_ROLL', payload: rollReq });
      setWaitingForPlayerRoll(true);
      showMasterFeedback(`Lanzando ${rollReq.formula} en Pantalla de Jugadores...`, '🎲');
    } else {
      // 2. Modo pantalla única (Master jugando solo): se ejecuta el motor 3D localmente
      setMaster3DRoll(rollReq);
      showMasterFeedback(`Lanzando ${rollReq.formula}...`, '🎲');
    }
  };

  const handleTriggerHiddenRoll = (rollReq) => {
    document.querySelectorAll('.dice-box-canvas').forEach(c => {
      try { c.remove(); } catch (e) {}
    });
    // Tirada secreta: siempre rueda únicamente en la pantalla del Master
    setMaster3DRoll(rollReq);
    showMasterFeedback(`Tirada oculta: ${rollReq.formula}`, '🎲');
  };

  // Funciones de Puertas, Ventanas, Objetos y Fuentes de Luz
  const handleToggleDoor = (doorId) => {
    setMaps(prev => prev.map(el => {
      if (el.id === doorId && el.type === 'door') {
        const nextOpen = !el.isOpen;
        handleTriggerSound(nextOpen ? 'sfx_door_open' : 'sfx_door_slam');
        return { ...el, isOpen: nextOpen };
      }
      return el;
    }));
  };

  const handleToggleWindow = (windowId, breakGlass = false) => {
    setMaps(prev => prev.map(el => {
      if (el.id === windowId && el.type === 'window') {
        if (breakGlass) {
          handleTriggerSound('sfx_glass');
          return { ...el, isOpen: true, isBroken: true };
        }
        const nextOpen = !el.isOpen;
        handleTriggerSound('sfx_door_open');
        return { ...el, isOpen: nextOpen };
      }
      return el;
    }));
  };

  const handleToggleObject = (objectId) => {
    setMaps(prev => prev.map(el => {
      if (el.id === objectId && el.type === 'object') {
        const nextOpen = !el.isOpen;
        handleTriggerSound('sfx_chest');
        showMasterFeedback(`${el.name}: ${nextOpen ? 'Activado / Abierto' : 'Cerrado'}`, nextOpen ? (el.openIcon || '🪙') : (el.icon || '📦'));
        return { ...el, isOpen: nextOpen };
      }
      return el;
    }));
  };

  const handleToggleLight = (lightId) => {
    setMaps(prev => prev.map(el => {
      if (el.id === lightId && el.type === 'light') {
        const nextOn = el.isOn === false ? true : false;
        handleTriggerSound('sfx_fireball');
        showMasterFeedback(`${el.name}: ${nextOn ? 'Encendida' : 'Apagada'}`, nextOn ? (el.icon || '🔥') : '🌑');
        return { ...el, isOn: nextOn };
      }
      return el;
    }));
  };

  const isMovementBlocked = (fromX, fromY, toX, toY) => {
    if (Math.abs(toX - fromX) < 0.5 && Math.abs(toY - fromY) < 0.5) return false;

    for (let i = 0; i < maps.length; i++) {
      const el = maps[i];
      if (el.type === 'wall') {
        if (segmentsIntersect(fromX, fromY, toX, toY, el.x1, el.y1, el.x2, el.y2)) {
          return true;
        }
      } else if ((el.type === 'door' || el.type === 'window') && !el.isOpen) {
        const w = el.width || 60;
        const h = el.height || 16;
        const x1 = el.x;
        const y1 = el.y;
        const x2 = el.x + w;
        const y2 = el.y + h;
        if (
          segmentsIntersect(fromX, fromY, toX, toY, x1, y1, x2, y1) ||
          segmentsIntersect(fromX, fromY, toX, toY, x2, y1, x2, y2) ||
          segmentsIntersect(fromX, fromY, toX, toY, x2, y2, x1, y2) ||
          segmentsIntersect(fromX, fromY, toX, toY, x1, y2, x1, y1)
        ) {
          return true;
        }
      } else if (el.type === 'object' && el.blocksMovement && !el.isOpen) {
        const w = el.width || 48;
        const h = el.height || 48;
        const x1 = el.x;
        const y1 = el.y;
        const x2 = el.x + w;
        const y2 = el.y + h;
        if (
          segmentsIntersect(fromX, fromY, toX, toY, x1, y1, x2, y1) ||
          segmentsIntersect(fromX, fromY, toX, toY, x2, y1, x2, y2) ||
          segmentsIntersect(fromX, fromY, toX, toY, x2, y2, x1, y2) ||
          segmentsIntersect(fromX, fromY, toX, toY, x1, y2, x1, y1)
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const cancelHoldTimer = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(null);
  };

  const handleWheel = (e) => {
    if (radialMenu) setRadialMenu(null);
    const zoomFactor = -e.deltaY * 0.001;
    setScale(prev => Math.min(Math.max(0.2, prev + zoomFactor), 4));
  };

  const getLogicalCoords = (e) => {
    const rect = boardRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / scale,
      y: (e.clientY - rect.top - pan.y) / scale
    };
  };

  const handlePointerDown = (e) => {
    if (radialMenu) {
      setRadialMenu(null);
      return;
    }

    if (e.button === 1 || e.button === 2) {
      if (pendingTokenSpawn) {
        setPendingTokenSpawn(null);
        return;
      }
      if (pendingMapSpawn) {
        setPendingMapSpawn(null);
        return;
      }
      setIsDraggingPan(true);
      return;
    }

    if (e.button === 0) {
      // MODO COLOCACIÓN DE OBJETO / ESTRUCTURA: Coloca el elemento donde el Máster haga clic
      if (!isPlayerView && pendingMapSpawn) {
        const coords = getLogicalCoords(e);
        const w = pendingMapSpawn.width || (pendingMapSpawn.type === 'door' || pendingMapSpawn.type === 'window' ? 60 : 48);
        const h = pendingMapSpawn.height || (pendingMapSpawn.type === 'door' ? 16 : pendingMapSpawn.type === 'window' ? 14 : 48);
        const spawnX = snapToGrid ? Math.round(coords.x / gridSize) * gridSize : coords.x - w / 2;
        const spawnY = snapToGrid ? Math.round(coords.y / gridSize) * gridSize : coords.y - h / 2;

        const newMapEl = {
          ...pendingMapSpawn,
          id: Date.now() + Math.random(),
          x: Math.round(spawnX),
          y: Math.round(spawnY),
          width: w,
          height: h,
          isLocked: false
        };

        setMaps(prev => [...prev, newMapEl]);
        showMasterFeedback(`${pendingMapSpawn.name} colocado en el tablero`, pendingMapSpawn.icon || '📦');
        setPendingMapSpawn(null);
        return;
      }

      // MODO INVOCACIÓN: Coloca el personaje donde el Master haga clic izquierdo
      if (!isPlayerView && pendingTokenSpawn) {
        const coords = getLogicalCoords(e);
        const spawnX = snapToGrid
          ? Math.floor(coords.x / gridSize) * gridSize
          : coords.x - gridSize / 2;
        const spawnY = snapToGrid
          ? Math.floor(coords.y / gridSize) * gridSize
          : coords.y - gridSize / 2;

        const newToken = {
          id: Date.now() + Math.random(),
          characterId: pendingTokenSpawn.id,
          firstName: pendingTokenSpawn.firstName || '',
          lastName: pendingTokenSpawn.lastName || '',
          birthYear: pendingTokenSpawn.birthYear || '1890',
          name: pendingTokenSpawn.name,
          entityType: pendingTokenSpawn.entityType || (pendingTokenSpawn.faction === 'enemy' ? 'mythos_creature' : 'human'),
          color: pendingTokenSpawn.color,
          avatar: pendingTokenSpawn.avatar || null,
          faction: pendingTokenSpawn.faction || 'ally',
          x: spawnX,
          y: spawnY,
          size: gridSize,
          rotation: 0,
          visionMode: 'cone',
          isLocked: false,
          isHidden: pendingTokenSpawn.faction === 'enemy',
          showName: true,
          showBars: false,
          statuses: pendingTokenSpawn.statuses || [],
          hp: pendingTokenSpawn.hp ?? 20,
          maxHp: pendingTokenSpawn.maxHp ?? 20,
          mp: pendingTokenSpawn.mp ?? 10,
          maxMp: pendingTokenSpawn.maxMp ?? 10,
          san: pendingTokenSpawn.san ?? 60,
          maxSan: pendingTokenSpawn.maxSan ?? 60,
          hasArmor: Boolean(pendingTokenSpawn.hasArmor),
          armorType: pendingTokenSpawn.armorType || 'Ninguna',
          isGraveWound: Boolean(pendingTokenSpawn.isGraveWound),
          speed: pendingTokenSpawn.speed || 6,
          turnMovementUsed: 0,
          history: pendingTokenSpawn.history || '',
          notes: pendingTokenSpawn.notes || '',
          inventory: pendingTokenSpawn.inventory || [],
          spells: pendingTokenSpawn.spells || []
        };
        if (pendingTokenSpawn.fromGraveyardId) {
          setGraveyard(prev => prev.filter(g => (g.graveyardId || g.id) !== pendingTokenSpawn.fromGraveyardId));
          showMasterFeedback(`¡"${pendingTokenSpawn.name}" ha resucitado y regresa al tablero!`, '✨');
        } else {
          showMasterFeedback(`${pendingTokenSpawn.name} desplegado en escena`, '⚔️');
        }
        setTokens(prev => [...prev, newToken]);
        setPendingTokenSpawn(null);
        return;
      }

      if (pingActive || e.altKey) {
        const coords = getLogicalCoords(e);
        emitPingAt(coords.x, coords.y);
        return;
      }

      if (rulerActive) {
        const coords = getLogicalCoords(e);
        setRulerMeasure({ startX: coords.x, startY: coords.y, endX: coords.x, endY: coords.y });
        return;
      }

      if (!isPlayerView && fowEnabled && fowMode !== 'none') {
        setIsPaintingFow(true);
        const coords = getLogicalCoords(e);
        lastFowPointRef.current = coords;
        setFowActions(prev => [...prev, { mode: fowMode, x: coords.x, y: coords.y, size: fowBrushSize }]);
        return;
      }

      if (!isPlayerView) {
        const coords = getLogicalCoords(e);
        holdStartPosRef.current = { clientX: e.clientX, clientY: e.clientY };
        setHoldProgress({ x: coords.x, y: coords.y });

        holdTimerRef.current = setTimeout(() => {
          setIsDraggingPan(false);
          setHoldProgress(null);
          setRadialMenu({
            screenX: e.clientX,
            screenY: e.clientY,
            worldX: coords.x,
            worldY: coords.y
          });
        }, 550);
      }

      setIsDraggingPan(true);
    }
  };

  const handleTokenPointerDown = (e, token) => {
    cancelHoldTimer();
    if (e.altKey || pingActive) {
      const size = token.size || 50;
      emitPingAt(token.x + size / 2, token.y + size / 2);
      return;
    }

    if (e.shiftKey && !isPlayerView && !token.isLocked) {
      setRotatingToken(token.id);
      return;
    }

    if (!isPlayerView && fowEnabled && fowMode !== 'none') return;
    if (rulerActive) return;

    // Comprobación de límites de movimiento en combate si no se mantiene Ctrl
    if (isCombatActive && movementLimitsEnabled && !e.ctrlKey && !token.isLocked) {
      if (activeTurnTokenId && token.id !== activeTurnTokenId) {
        const activeTok = tokens.find(t => t.id === activeTurnTokenId);
        showMasterFeedback(
          activeTok ? `Turno de "${activeTok.name}". Mantén Ctrl para mover a otros.` : 'No es el turno de este combatiente.',
          '⚠️'
        );
        return;
      }
      const baseSpeed = token.speed || 6;
      const maxSpeed = token.isGraveWound ? Math.max(1, Math.floor(baseSpeed / 2)) : baseSpeed;
      const used = token.turnMovementUsed || 0;
      const remaining = Math.max(0, maxSpeed - used);
      if (remaining <= 0) {
        showMasterFeedback(`"${token.name}" agotó su movimiento este turno (${used}/${maxSpeed} casillas). Mantén Ctrl para forzar.`, '🛑');
        return;
      }
    }

    const activeTokenStatuses = token.statuses || [];
    const isImmobilized = activeTokenStatuses.some(statusId => {
      const statusObj = customStatuses.find(s => s.id === statusId);
      return statusObj && statusObj.effect === 'immobilize';
    });

    if (isImmobilized) return;

    try {
      if (e.currentTarget && e.pointerId !== undefined) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    } catch (err) {}

    tokenDragOriginRef.current = {
      x: token.x,
      y: token.y,
      tokenId: token.id,
      isCtrl: Boolean(e.ctrlKey)
    };
    setDraggedToken(token.id);
  };

  const handleStartTokenRotate = (e, token) => {
    cancelHoldTimer();
    if (isPlayerView || token.isLocked) return;
    setRotatingToken(token.id);
  };

  const handlePointerMove = (e) => {
    if (holdTimerRef.current && holdStartPosRef.current) {
      const dist = Math.hypot(
        e.clientX - holdStartPosRef.current.clientX,
        e.clientY - holdStartPosRef.current.clientY
      );
      if (dist > 8) {
        cancelHoldTimer();
      }
    }

    if (rulerMeasure) {
      const coords = getLogicalCoords(e);
      setRulerMeasure(prev => (prev ? { ...prev, endX: coords.x, endY: coords.y } : null));
      return;
    }

    if (isPaintingFow && fowEnabled && fowMode !== 'none') {
      const coords = getLogicalCoords(e);
      const lastPt = lastFowPointRef.current;
      const minDistance = Math.max(15, (fowBrushSize || 80) / 4);
      if (!lastPt || Math.hypot(coords.x - lastPt.x, coords.y - lastPt.y) >= minDistance) {
        lastFowPointRef.current = coords;
        setFowActions(prev => [...prev, { mode: fowMode, x: coords.x, y: coords.y, size: fowBrushSize }]);
      }
      return;
    }

    if (rotatingToken !== null && boardRef.current) {
      const coords = getLogicalCoords(e);
      setTokens(prev =>
        prev.map(t => {
          if (t.id !== rotatingToken) return t;
          const size = t.size || 50;
          const cx = t.x + size / 2;
          const cy = t.y + size / 2;
          const deg = (Math.atan2(coords.y - cy, coords.x - cx) * 180) / Math.PI;
          return { ...t, rotation: ((Math.round(deg) % 360) + 360) % 360 };
        })
      );
      return;
    }

    if (draggedToken !== null && boardRef.current) {
      const coords = getLogicalCoords(e);
      const currentToken = tokens.find(t => t.id === draggedToken);
      const size = currentToken?.size || 50;
      let targetX = coords.x - size / 2;
      let targetY = coords.y - size / 2;

      // Limitación elástica de movimiento en combate
      if (isCombatActive && movementLimitsEnabled && !e.ctrlKey && tokenDragOriginRef.current && currentToken) {
        const originX = tokenDragOriginRef.current.x;
        const originY = tokenDragOriginRef.current.y;
        const baseSpeed = currentToken.speed || 6;
        const maxSpeed = currentToken.isGraveWound ? Math.max(1, Math.floor(baseSpeed / 2)) : baseSpeed;
        const used = currentToken.turnMovementUsed || 0;
        const remaining = Math.max(0, maxSpeed - used);
        const maxPixelDist = remaining * gridSize;

        const dx = targetX - originX;
        const dy = targetY - originY;
        const currentDist = Math.hypot(dx, dy);

        if (currentDist > maxPixelDist && currentDist > 0) {
          const angle = Math.atan2(dy, dx);
          targetX = originX + Math.cos(angle) * maxPixelDist;
          targetY = originY + Math.sin(angle) * maxPixelDist;
        }

        const currentMovedSquares = Math.round(Math.hypot(targetX - originX, targetY - originY) / gridSize);
        setTokenDragMeasurement({
          startX: originX + size / 2,
          startY: originY + size / 2,
          currentX: targetX + size / 2,
          currentY: targetY + size / 2,
          movedSquares: currentMovedSquares,
          maxSquares: remaining,
          totalSpeed: maxSpeed,
          isGraveWound: Boolean(currentToken.isGraveWound)
        });
      } else if (tokenDragMeasurement) {
        setTokenDragMeasurement(null);
      }

      setTokens(prevTokens =>
        prevTokens.map(t => {
          if (t.id !== draggedToken) return t;

          const fromCenterX = t.x + size / 2;
          const fromCenterY = t.y + size / 2;
          const toCenterX = targetX + size / 2;
          const toCenterY = targetY + size / 2;

          if (!isMovementBlocked(fromCenterX, fromCenterY, toCenterX, toCenterY)) {
            return { ...t, x: targetX, y: targetY };
          }
          if (!isMovementBlocked(fromCenterX, fromCenterY, toCenterX, fromCenterY)) {
            return { ...t, x: targetX };
          }
          if (!isMovementBlocked(fromCenterX, fromCenterY, fromCenterX, toCenterY)) {
            return { ...t, y: targetY };
          }
          return t;
        })
      );
      return;
    }

    // Arrastre libre de objetos y estructuras en el mapa
    if (draggedMapElement !== null && boardRef.current) {
      const coords = getLogicalCoords(e);
      setMaps(prevMaps =>
        prevMaps.map(m => {
          if (m.id !== draggedMapElement) return m;
          const w = m.width || 48;
          const h = m.height || 48;
          return {
            ...m,
            x: Math.round(coords.x - w / 2),
            y: Math.round(coords.y - h / 2)
          };
        })
      );
      return;
    }

    if (isDraggingPan && draggedToken === null && draggedMapElement === null && rotatingToken === null) {
      setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
    }
  };

  const handlePointerUp = (e) => {
    cancelHoldTimer();
    if (rulerMeasure) setRulerMeasure(null);

    if (draggedToken !== null) {
      const origin = tokenDragOriginRef.current;
      const isCtrlOverride = Boolean(e?.ctrlKey || origin?.isCtrl);

      setTokens(prevTokens =>
        prevTokens.map(t => {
          if (t.id === draggedToken) {
            let finalX = t.x;
            let finalY = t.y;
            if (snapToGrid) {
              const snappedX = Math.floor((t.x + (t.size || gridSize) / 2) / gridSize) * gridSize;
              const snappedY = Math.floor((t.y + (t.size || gridSize) / 2) / gridSize) * gridSize;
              const size = t.size || 50;
              if (!isMovementBlocked(t.x + size / 2, t.y + size / 2, snappedX + size / 2, snappedY + size / 2)) {
                finalX = snappedX;
                finalY = snappedY;
              }
            }

            if (isCombatActive && movementLimitsEnabled && origin && !isCtrlOverride) {
              const pixelDist = Math.hypot(finalX - origin.x, finalY - origin.y);
              const squaresMoved = Math.round(pixelDist / gridSize);
              if (squaresMoved > 0) {
                const baseSpeed = t.speed || 6;
                const maxSpeed = t.isGraveWound ? Math.max(1, Math.floor(baseSpeed / 2)) : baseSpeed;
                const currentUsed = t.turnMovementUsed || 0;
                const remainingBefore = Math.max(0, maxSpeed - currentUsed);
                const actualSquares = Math.min(squaresMoved, remainingBefore);
                const newUsed = currentUsed + actualSquares;
                const remainingAfter = Math.max(0, maxSpeed - newUsed);
                showMasterFeedback(`🚶 ${t.name}: avanzó ${actualSquares} casillas (${remainingAfter} restantes)`, '🚶');
                return { ...t, x: finalX, y: finalY, turnMovementUsed: newUsed };
              }
            }
            return { ...t, x: finalX, y: finalY };
          }
          return t;
        })
      );
      tokenDragOriginRef.current = null;
      setTokenDragMeasurement(null);
    }

    if (draggedMapElement !== null && snapToGrid) {
      setMaps(prevMaps =>
        prevMaps.map(m => {
          if (m.id !== draggedMapElement) return m;
          const snappedX = Math.round(m.x / gridSize) * gridSize;
          const snappedY = Math.round(m.y / gridSize) * gridSize;
          return { ...m, x: snappedX, y: snappedY };
        })
      );
    }

    setIsDraggingPan(false);
    setDraggedToken(null);
    setDraggedMapElement(null);
    setRotatingToken(null);
    lastFowPointRef.current = null;
    setIsPaintingFow(false);
    tokenDragOriginRef.current = null;
    setTokenDragMeasurement(null);
  };

  const handleAddToken = (char) => {
    setRulerActive(false);
    setPingActive(false);
    setFowMode('none');
    setIsSettingsOpen(false);
    setPendingTokenSpawn(char);
    showMasterFeedback(`Haz clic en el mapa para colocar a ${char.name}`, '🎯');
  };

  const handleStartPlaceMapElement = (newElement) => {
    setRulerActive(false);
    setPingActive(false);
    setFowMode('none');
    setIsSettingsOpen(false);
    setPendingTokenSpawn(null);
    setPendingMapSpawn(newElement);
    showMasterFeedback(`Haz clic en el mapa para colocar ${newElement.name}`, newElement.icon || '📦');
  };

  const handleMapElementPointerDown = (e, element) => {
    cancelHoldTimer();
    if (isPlayerView || element.isLocked) return;
    setDraggedMapElement(element.id);
  };

  const handleRotateMapElement = (elId) => {
    setMaps(prev => prev.map(m => {
      if (m.id === elId) {
        const oldW = m.width || 60;
        const oldH = m.height || 16;
        return {
          ...m,
          width: oldH,
          height: oldW,
          isVertical: !m.isVertical
        };
      }
      return m;
    }));
    showMasterFeedback('Orientación rotada 90º', '🔄');
  };

  const handleToggleMapElementLock = (elId) => {
    setMaps(prev => prev.map(m => {
      if (m.id === elId) {
        const next = !m.isLocked;
        showMasterFeedback(next ? 'Posición bloqueada' : 'Posición desbloqueada', next ? '🔒' : '🔓');
        return { ...m, isLocked: next };
      }
      return m;
    }));
  };

  const handleInspectObject = (objectItem) => {
    setObjectNotesModalState({ isOpen: true, objectItem });
  };

  const handleUpdateObject = (objectId, updatedFields) => {
    setMaps(prev => prev.map(m => {
      if (m.id === objectId) {
        return { ...m, ...updatedFields };
      }
      return m;
    }));
    showMasterFeedback('Objeto y notas actualizados', '💾');
  };

  const handleUpdateSceneNotes = (sceneId, notesObj) => {
    setSceneNotes(prev => ({ ...prev, [sceneId]: notesObj }));
  };

  const handleSaveCustomObject = (obj) => {
    setCustomObjects(prev => {
      const exists = prev.some(o => o.id === obj.id);
      return exists ? prev.map(o => o.id === obj.id ? obj : o) : [...prev, obj];
    });
    showMasterFeedback(`Plantilla "${obj.name}" guardada en el catálogo`, '⭐');
  };

  const handleDeleteCustomObject = (id) => {
    setCustomObjects(prev => prev.filter(o => o.id !== id));
    showMasterFeedback('Plantilla eliminada del catálogo', '🗑️');
  };

  const handleGiveItemToCharacter = (targetId, itemData) => {
    // Si no se especifica targetId pero hay activeTurnTokenId:
    const resolvedId = targetId || activeTurnTokenId || (tokens.length === 1 ? tokens[0].id : null);
    if (!resolvedId) {
      showMasterFeedback('No hay combatiente seleccionado ni turno activo para recibir el objeto', '⚠️');
      return false;
    }

    const newItem = {
      id: Date.now() + Math.random(),
      name: itemData.name,
      icon: itemData.icon || '📦',
      category: itemData.category || 'Herramienta',
      state: itemData.state || 'equipped',
      notes: itemData.notes || ''
    };

    const targetToken = tokens.find(t => t.id === resolvedId || t.characterId === resolvedId);
    const linkedCharId = targetToken?.characterId || resolvedId;
    let assignedName = targetToken?.name || '';

    // 1. Actualizar en tokens del tablero
    setTokens(prev => prev.map(t => {
      if (t.id === resolvedId || t.characterId === resolvedId || (targetToken && t.characterId === targetToken.characterId)) {
        if (!assignedName) assignedName = t.name;
        const currentInv = Array.isArray(t.inventory) ? t.inventory : [];
        return { ...t, inventory: [...currentInv, newItem] };
      }
      return t;
    }));

    // 2. Actualizar en biblioteca de personajes
    setCharacters(prev => prev.map(c => {
      if (c.id === linkedCharId || c.id === resolvedId || (targetToken && c.name === targetToken.name)) {
        if (!assignedName) assignedName = c.name;
        const currentInv = Array.isArray(c.inventory) ? c.inventory : [];
        return { ...c, inventory: [...currentInv, newItem] };
      }
      return c;
    }));

    if (!assignedName) {
      const found = characters.find(c => c.id === linkedCharId || c.id === resolvedId);
      assignedName = found ? found.name : 'combatiente';
    }

    showMasterFeedback(`🎁 "${newItem.name}" entregado a ${assignedName}`, newItem.icon || '🎁');
    return true;
  };

  const handleSaveCommonItem = (item) => {
    setCommonItems(prev => {
      const exists = prev.some(it => it.id === item.id);
      return exists ? prev.map(it => it.id === item.id ? item : it) : [...prev, item];
    });
    showMasterFeedback(`Objeto "${item.name}" guardado en el catálogo`, '⭐');
  };

  const handleDeleteCommonItem = (id) => {
    setCommonItems(prev => prev.filter(it => it.id !== id));
    showMasterFeedback('Objeto retirado del catálogo común', '🗑️');
  };

  const handlePickUpItem = (itemElement, targetId) => {
    const resolvedId = targetId || activeTurnTokenId || (tokens.length === 1 ? tokens[0].id : null);
    if (!resolvedId) {
      showMasterFeedback('Selecciona qué combatiente recoge el objeto', '⚠️');
      return false;
    }

    const newItem = {
      id: Date.now() + Math.random(),
      name: itemElement.name,
      icon: itemElement.icon || '📦',
      category: itemElement.category || 'Herramienta',
      state: itemElement.state || 'equipped',
      notes: itemElement.notes || ''
    };

    const targetToken = tokens.find(t => t.id === resolvedId || t.characterId === resolvedId);
    const linkedCharId = targetToken?.characterId || resolvedId;
    let collectorName = targetToken?.name || '';

    // 1. Actualizar en tokens del tablero
    setTokens(prev => prev.map(t => {
      if (t.id === resolvedId || t.characterId === resolvedId || (targetToken && t.characterId === targetToken.characterId)) {
        if (!collectorName) collectorName = t.name;
        const currentInv = Array.isArray(t.inventory) ? t.inventory : [];
        return { ...t, inventory: [...currentInv, newItem] };
      }
      return t;
    }));

    // 2. Actualizar en la biblioteca de personajes
    setCharacters(prev => prev.map(c => {
      if (c.id === linkedCharId || c.id === resolvedId || (targetToken && c.name === targetToken.name)) {
        if (!collectorName) collectorName = c.name;
        const currentInv = Array.isArray(c.inventory) ? c.inventory : [];
        return { ...c, inventory: [...currentInv, newItem] };
      }
      return c;
    }));

    // 3. Retirar del mapa
    setMaps(prev => prev.filter(m => m.id !== itemElement.id));

    if (!collectorName) {
      const found = characters.find(c => c.id === linkedCharId || c.id === resolvedId);
      collectorName = found ? found.name : 'Combatiente';
    }
    showMasterFeedback(`🤲 ${collectorName} recogió "${itemElement.name}"`, itemElement.icon || '🤲');
    return true;
  };

  const handleDropItemToFloor = (characterOrTokenId, itemToDrop) => {
    const targetToken = tokens.find(t => t.id === characterOrTokenId || t.characterId === characterOrTokenId);
    const linkedCharId = targetToken?.characterId || characterOrTokenId;

    let dropX = targetToken ? targetToken.x + (targetToken.size || 50) + 8 : (-pan.x / scale + 250);
    let dropY = targetToken ? targetToken.y : (-pan.y / scale + 250);

    if (snapToGrid) {
      dropX = Math.round(dropX / gridSize) * gridSize;
      dropY = Math.round(dropY / gridSize) * gridSize;
    }

    const floorItem = {
      id: Date.now() + Math.random(),
      type: 'item',
      name: itemToDrop.name,
      icon: itemToDrop.icon || '📦',
      category: itemToDrop.category || 'Herramienta',
      notes: itemToDrop.notes || '',
      state: itemToDrop.state || 'equipped',
      x: dropX,
      y: dropY,
      width: 38,
      height: 38,
      isLocked: false
    };

    setMaps(prev => [...prev, floorItem]);

    setTokens(prev => prev.map(t => {
      if (t.id === characterOrTokenId || t.characterId === characterOrTokenId || (targetToken && t.characterId === targetToken.characterId)) {
        const inv = Array.isArray(t.inventory) ? t.inventory : [];
        return { ...t, inventory: inv.filter(i => i.id !== itemToDrop.id && i.name !== itemToDrop.name) };
      }
      return t;
    }));

    setCharacters(prev => prev.map(c => {
      if (c.id === linkedCharId || c.id === characterOrTokenId || (targetToken && c.name === targetToken.name)) {
        const inv = Array.isArray(c.inventory) ? c.inventory : [];
        return { ...c, inventory: inv.filter(i => i.id !== itemToDrop.id && i.name !== itemToDrop.name) };
      }
      return c;
    }));

    const charName = targetToken ? targetToken.name : 'Personaje';
    showMasterFeedback(`🫳 ${charName} descartó "${itemToDrop.name}" al suelo`, '🫳');
  };

  const handleTransferItemBetweenCharacters = (senderId, recipientId, itemData) => {
    if (!recipientId || !itemData) return false;

    // 1. Quitar del emisor en tokens y characters
    if (senderId) {
      const senderToken = tokens.find(t => t.id === senderId || t.characterId === senderId);
      const senderCharId = senderToken?.characterId || senderId;

      setTokens(prev => prev.map(t => {
        if (t.id === senderId || t.characterId === senderId || (senderToken && t.characterId === senderToken.characterId)) {
          const inv = Array.isArray(t.inventory) ? t.inventory : [];
          return { ...t, inventory: inv.filter(i => i.id !== itemData.id) };
        }
        return t;
      }));

      setCharacters(prev => prev.map(c => {
        if (c.id === senderCharId || c.id === senderId || (senderToken && c.name === senderToken.name)) {
          const inv = Array.isArray(c.inventory) ? c.inventory : [];
          return { ...c, inventory: inv.filter(i => i.id !== itemData.id) };
        }
        return c;
      }));
    }

    // 2. Dar al destinatario mediante handleGiveItemToCharacter
    return handleGiveItemToCharacter(recipientId, itemData);
  };

  const handleStartPlaceGroundItem = (itemData) => {
    handleStartPlaceMapElement({
      type: 'item',
      name: itemData.name,
      icon: itemData.icon || '📦',
      category: itemData.category || 'Herramienta',
      notes: itemData.notes || '',
      state: itemData.state || 'equipped',
      width: 38,
      height: 38,
      isLocked: false
    });
  };

  const handleToggleMapElementState = (elId) => {
    const target = maps.find(m => m.id === elId);
    if (!target) return;
    if (target.type === 'object') handleToggleObject(elId);
    else if (target.type === 'light') handleToggleLight(elId);
    else if (target.type === 'door') handleToggleDoor(elId);
    else if (target.type === 'window') handleToggleWindow(elId, false);
  };

  const handleRemoveMapElement = (elId) => {
    setMaps(prev => prev.filter(m => m.id !== elId));
  };

  const handleToggleTokenLock = (id) => {
    setTokens(prev => prev.map(t => {
      if (t.id === id) {
        const nextLock = !t.isLocked;
        showMasterFeedback(`${t.name}: ${nextLock ? 'Posición bloqueada' : 'Posición desbloqueada'}`, nextLock ? '🔒' : '🔓');
        return { ...t, isLocked: nextLock };
      }
      return t;
    }));
  };

  const handleToggleTokenName = (id) => {
    setTokens(prev => prev.map(t => (t.id === id ? { ...t, showName: t.showName === false ? true : false } : t)));
  };

  const handleToggleTokenBars = (id) => {
    setTokens(prev => prev.map(t => (t.id === id ? { ...t, showBars: !t.showBars } : t)));
  };

  const handleToggleTokenHidden = (id) => {
    setTokens(prev => prev.map(t => {
      if (t.id === id) {
        const nextHidden = !t.isHidden;
        showMasterFeedback(`${t.name}: ${nextHidden ? 'En Sigilo (Oculto a Jugadores)' : 'Revelado a Jugadores'}`, nextHidden ? '👻' : '👁️');
        return { ...t, isHidden: nextHidden };
      }
      return t;
    }));
  };

  const handleToggleTokenFaction = (id) => {
    setTokens(prev => prev.map(t => {
      if (t.id === id) {
        const current = t.faction || 'player';
        const nextFaction = current === 'player' ? 'ally' : current === 'ally' ? 'enemy' : 'player';
        const label = nextFaction === 'enemy' ? 'Enemigo' : nextFaction === 'player' ? 'Jugador' : 'Aliado';
        const icon = nextFaction === 'enemy' ? '⚔️' : nextFaction === 'player' ? '👤' : '🤝';
        showMasterFeedback(`${t.name}: ${label}`, icon);
        return { ...t, faction: nextFaction };
      }
      return t;
    }));
  };

  const handleReorderTokens = (fromIndex, toIndex) => {
    setTokens(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleMoveTokenOrder = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tokens.length) return;
    handleReorderTokens(index, targetIndex);
  };

  const handleStartCombat = () => {
    if (!tokens.length) return;
    setIsCombatActive(true);
    setCombatRound(1);
    setActiveTurnTokenId(tokens[0].id);
    setTokens(prev => prev.map(t => ({ ...t, turnMovementUsed: 0 })));
    tokenDragOriginRef.current = null;
    setTokenDragMeasurement(null);
    const baseSpeed = tokens[0].speed || 6;
    const speed = tokens[0].isGraveWound ? Math.max(1, Math.floor(baseSpeed / 2)) : baseSpeed;
    showMasterFeedback(`¡Combate iniciado! Turno de ${tokens[0].name} (${speed} casillas)`, '⚔️');
  };

  const handleNextTurn = () => {
    if (!tokens.length) return;
    const currentIndex = tokens.findIndex(t => t.id === activeTurnTokenId);
    let nextIndex = currentIndex + 1;
    let nextRound = combatRound;

    if (nextIndex >= tokens.length) {
      nextIndex = 0;
      nextRound += 1;
      setCombatRound(nextRound);
      showMasterFeedback(`¡Nueva ronda de combate: Ronda ${nextRound}!`, '🔔');
    }

    const nextToken = tokens[nextIndex];
    if (nextToken) {
      setActiveTurnTokenId(nextToken.id);
      setTokens(prev => prev.map(t => t.id === nextToken.id ? { ...t, turnMovementUsed: 0 } : t));
      tokenDragOriginRef.current = null;
      setTokenDragMeasurement(null);
      const baseSpeed = nextToken.speed || 6;
      const speed = nextToken.isGraveWound ? Math.max(1, Math.floor(baseSpeed / 2)) : baseSpeed;
      showMasterFeedback(`Turno de: ${nextToken.name} (${speed} casillas)`, '⚔️');
    }
  };

  const handleSelectActiveTurn = (tokenId) => {
    const targetToken = tokens.find(t => t.id === tokenId);
    if (!targetToken) return;
    setActiveTurnTokenId(tokenId);
    setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, turnMovementUsed: 0 } : t));
    tokenDragOriginRef.current = null;
    setTokenDragMeasurement(null);
    const baseSpeed = targetToken.speed || 6;
    const speed = targetToken.isGraveWound ? Math.max(1, Math.floor(baseSpeed / 2)) : baseSpeed;
    showMasterFeedback(`Turno asignado a: ${targetToken.name} (${speed} casillas)`, '⚔️');
  };

  const handleEndCombat = () => {
    setIsCombatActive(false);
    setActiveTurnTokenId(null);
    setCombatRound(1);
    setTokens(prev => prev.map(t => ({ ...t, turnMovementUsed: 0 })));
    tokenDragOriginRef.current = null;
    setTokenDragMeasurement(null);
    showMasterFeedback('Combate finalizado', '🛡️');
  };

  const handleToggleMovementLimits = () => {
    setMovementLimitsEnabled(prev => {
      const next = !prev;
      showMasterFeedback(
        next ? 'Límites de movimiento en combate: ACTIVADOS' : 'Límites de movimiento: DESACTIVADOS (Movimiento libre)',
        next ? '🚶' : '🔓'
      );
      return next;
    });
  };

  const handleResetTokenMovement = (tokenId) => {
    setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, turnMovementUsed: 0 } : t));
    setTokenDragMeasurement(null);
    showMasterFeedback('Presupuesto de movimiento restablecido', '↺');
  };

  const handleCenterOnToken = (token) => {
    if (!token) return;
    setPan({
      x: window.innerWidth / 2 - token.x * scale,
      y: window.innerHeight / 2 - token.y * scale
    });
    showMasterFeedback(`Cámara centrada en "${token.name}"`, '🎯');
  };

  const handleUpdateTokenSize = (id, newSize) => {
    setTokens(prev => prev.map(t => (t.id === id ? { ...t, size: newSize } : t)));
  };

  const handleUpdateTokenRotation = (id, newAngle) => {
    const normalized = ((Math.round(newAngle) % 360) + 360) % 360;
    setTokens(prev => prev.map(t => (t.id === id ? { ...t, rotation: normalized } : t)));
  };

  const handleUpdateTokenVisionMode = (id, mode) => {
    setTokens(prev => prev.map(t => (t.id === id ? { ...t, visionMode: mode } : t)));
  };

  const handleToggleTokenStatus = (tokenId, statusId) => {
    setTokens(prev =>
      prev.map(t => {
        if (t.id === tokenId) {
          const current = t.statuses || [];
          const updated = current.includes(statusId)
            ? current.filter(id => id !== statusId)
            : [...current, statusId];
          return { ...t, statuses: updated };
        }
        return t;
      })
    );
  };

  const applyCampaignData = (d) => {
    isSwitchingSceneRef.current = true;
    if (d.characters) setCharacters(d.characters);
    if (d.tokens) setTokens(d.tokens);
    if (d.maps) setMaps(d.maps);
    if (d.fowEnabled !== undefined) setFowEnabled(d.fowEnabled);
    if (d.fowBrushSize) setFowBrushSize(d.fowBrushSize);
    if (d.fowVisionRadius) setFowVisionRadius(d.fowVisionRadius);
    if (d.fowMemoryEnabled !== undefined) setFowMemoryEnabled(d.fowMemoryEnabled);
    if (d.fowAutoHideEnemies !== undefined) setFowAutoHideEnemies(d.fowAutoHideEnemies);
    if (d.fowActions) setFowActions(d.fowActions);
    if (d.snapToGrid !== undefined) setSnapToGrid(d.snapToGrid);
    if (d.gridSize) setGridSize(d.gridSize);
    if (d.customStatuses) setCustomStatuses(d.customStatuses);
    if (d.weatherEffect) setWeatherEffect(d.weatherEffect);
    if (d.ambientTint) setAmbientTint(d.ambientTint);
    if (d.customSounds) setCustomSounds(d.customSounds);
    if (Array.isArray(d.scenes) && d.scenes.length > 0) setScenes(d.scenes);
    if (d.activeSceneId) setActiveSceneId(d.activeSceneId);
    if (Array.isArray(d.handouts)) setHandouts(d.handouts);
    if (d.activeHandout !== undefined) setActiveHandout(d.activeHandout);
    if (Array.isArray(d.graveyard)) setGraveyard(d.graveyard);
    if (Array.isArray(d.customObjects)) setCustomObjects(d.customObjects);
    if (Array.isArray(d.commonItems)) setCommonItems(d.commonItems);
    if (d.sceneNotes) setSceneNotes(d.sceneNotes);
    if (d.campaignNotes !== undefined) setCampaignNotes(d.campaignNotes);
    saveCampaignToDB(d, true);
    setTimeout(() => {
      isSwitchingSceneRef.current = false;
    }, 150);
  };

  const handleSaveAdventure = async (adventureName, shouldExportFile = true) => {
    // 1. Sincronizar el estado en vivo de la escena activa dentro del listado de escenas
    const syncedScenes = scenes.map((sc) =>
      sc.id === activeSceneId
        ? { ...sc, maps, tokens, fowActions, weatherEffect, ambientTint }
        : sc
    );
    const activeScene = syncedScenes.find(sc => sc.id === activeSceneId) || syncedScenes[0];
    const advTitle = adventureName?.trim() || (activeScene ? `Aventura: ${activeScene.name}` : 'Aventura de Campaña');

    const payload = {
      adventureName: advTitle,
      characters,
      tokens,
      maps,
      fowEnabled,
      fowBrushSize,
      fowVisionRadius,
      fowMemoryEnabled,
      fowAutoHideEnemies,
      fowActions,
      snapToGrid,
      gridSize,
      customStatuses,
      weatherEffect,
      ambientTint,
      customSounds,
      scenes: syncedScenes,
      activeSceneId,
      handouts,
      activeHandout,
      graveyard,
      customObjects,
      commonItems,
      sceneNotes,
      campaignNotes,
      savedAt: new Date().toISOString(),
      version: '1.4.0',
      app: 'Grimorio VTT'
    };

    // 2. Guardar en carpeta nativa de la app (Tauri campaigns/ en AppData/Linux) y en IndexedDB
    try {
      await saveCampaignSnapshot(payload, advTitle);
    } catch (err) {
      console.warn('Error guardando snapshot:', err);
    }

    // 3. Si se solicita exportar archivo .json independiente
    let fileResult = null;
    if (shouldExportFile) {
      const safeTitle = advTitle.toLowerCase().replace(/[^a-z0-9]/gi, '_');
      const filename = `aventura_${safeTitle}_${new Date().toISOString().slice(0, 10)}.json`;
      fileResult = await exportJSON(filename, payload);
    }

    showMasterFeedback(`Aventura guardada: ${advTitle}`, '💾');
    return fileResult || { success: true };
  };

  const handleExportCampaign = async () => {
    const syncedScenes = scenes.map((sc) =>
      sc.id === activeSceneId
        ? { ...sc, maps, tokens, fowActions, weatherEffect, ambientTint }
        : sc
    );
    const res = await exportCampaignJSON({
      characters,
      tokens,
      maps,
      fowEnabled,
      fowBrushSize,
      fowVisionRadius,
      fowMemoryEnabled,
      fowAutoHideEnemies,
      fowActions,
      snapToGrid,
      gridSize,
      customStatuses,
      weatherEffect,
      ambientTint,
      customSounds,
      scenes: syncedScenes,
      activeSceneId,
      handouts,
      activeHandout,
      graveyard,
      customObjects,
      commonItems,
      sceneNotes,
      campaignNotes
    });
    if (res?.success) {
      showMasterFeedback(`Crónica guardada: ${res.filename}`, '💾');
    } else if (res && !res.cancelled) {
      showMasterFeedback('Error al exportar crónica', '⚠️');
    }
  };

  const handleSendToGraveyard = (tokenOrId) => {
    const token = typeof tokenOrId === 'string' ? tokens.find(t => t.id === tokenOrId) : tokenOrId;
    if (!token) return;

    const currentScene = scenes.find(s => s.id === activeSceneId);
    const graveEntry = {
      ...token,
      graveyardId: 'grave_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      fallenAt: new Date().toISOString(),
      sceneName: currentScene?.name || 'Tablero de Juego',
      hp: 0
    };

    setTokens(prev => prev.filter(t => t.id !== token.id));
    setGraveyard(prev => [graveEntry, ...prev]);

    if (activeTurnTokenId === token.id) {
      handleNextTurn();
    }

    showMasterFeedback(`"${token.name}" ha sido enviado a la Cripta / Cementerio`, '🪦');
  };

  const handleReviveFromGraveyard = (entry) => {
    if (!entry) return;

    const reviveData = {
      ...entry,
      hp: Math.max(1, entry.maxHp ? Math.floor(entry.maxHp / 2) : 10),
      fromGraveyardId: entry.graveyardId || entry.id
    };
    delete reviveData.graveyardId;
    delete reviveData.fallenAt;
    delete reviveData.sceneName;

    setEncyclopediaState(prev => ({ ...prev, isOpen: false }));
    setIsHomeOpen(false);
    setRulerActive(false);
    setPingActive(false);
    setFowMode('none');
    setIsSettingsOpen(false);
    setPendingTokenSpawn(reviveData);

    showMasterFeedback(`Haz clic en el mapa para situar al resucitado: "${entry.name}"`, '✨');
  };

  const handleDeleteFromGraveyard = (graveId) => {
    setGraveyard(prev => prev.filter(g => (g.graveyardId || g.id) !== graveId));
    showMasterFeedback('Registro eliminado de la cripta', '🗑️');
  };

  const handleClearGraveyard = () => {
    setGraveyard([]);
    showMasterFeedback('Cripta y cementerio vaciados', '⚰️');
  };

  const handleExportGraveyard = async (graveyardData) => {
    const defaultName = `registro_bajas_vtt_${new Date().toISOString().slice(0, 10)}.json`;
    const res = await exportJSON(defaultName, graveyardData);
    if (res?.success) {
      showMasterFeedback(`Registro de bajas exportado: ${res.filename}`, '📤');
    }
  };

  const handleImportCampaign = async () => {
    const res = await importJSON({ accept: '.json', description: 'Crónica VTT (*.json)' });
    if (res?.success && res.text) {
      try {
        const d = JSON.parse(res.text);
        applyCampaignData(d);
        saveCampaignSnapshot(d, `Crónica: ${res.filename?.replace('.json', '') || 'Importada'}`);
        showMasterFeedback(`Crónica cargada: ${res.filename}`, '📥');
      } catch (err) {
        console.error('Error al importar crónica:', err);
        showMasterFeedback('Archivo JSON no válido', '⚠️');
      }
    }
  };

  const handleImportCampaignFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const d = JSON.parse(event.target.result);
        applyCampaignData(d);
        saveCampaignSnapshot(d, `Crónica: ${file.name?.replace('.json', '') || 'Importada'}`);
        showMasterFeedback('Crónica cargada con éxito', '📥');
      } catch (err) {
        console.error('Error al importar crónica:', err);
        showMasterFeedback('Archivo JSON no válido', '⚠️');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleOpenPlayerView = async () => {
    const playerUrl = `${window.location.origin}${window.location.pathname}?view=player`;

    if (isTauriDesktop()) {
      try {
        const existing = await WebviewWindow.getByLabel('player');
        if (existing) {
          await existing.setFocus();
          showMasterFeedback('Pantalla de Jugadores enfocada', '🖥️');
          return;
        }
        const playerWin = new WebviewWindow('player', {
          url: playerUrl,
          title: 'Grimorio VTT — Sala de Jugadores',
          width: 1280,
          height: 720,
          resizable: true
        });
        playerWin.once('tauri://created', () => {
          showMasterFeedback('Ventana de Jugadores abierta', '🖥️');
        });
        playerWin.once('tauri://error', () => {
          window.open(playerUrl, '_blank', 'width=1280,height=720');
        });
        return;
      } catch (err) {
        console.warn('Fallback a window.open:', err);
      }
    }

    window.open(playerUrl, '_blank', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no');
  };

  if (isPlayerView) {
    return (
      <div style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', display: 'flex', overflow: 'hidden', backgroundColor: '#050302' }}>
        <style>{GLOBAL_VTT_STYLES}</style>
        <GameBoard
          boardRef={boardRef}
          scale={scale}
          pan={pan}
          isPlayerView={true}
          activeTurnTokenId={activeTurnTokenId}
          fowEnabled={fowEnabled}
          fowVisionRadius={fowVisionRadius}
          fowMemoryEnabled={fowMemoryEnabled}
          fowAutoHideEnemies={fowAutoHideEnemies}
          weatherEffect={weatherEffect}
          ambientTint={ambientTint}
          handlePointerDown={handlePointerDown}
          handlePointerMove={handlePointerMove}
          handlePointerUp={handlePointerUp}
          handleWheel={handleWheel}
          snapToGrid={snapToGrid}
          gridSize={gridSize}
          maps={maps}
          activeSceneId={activeSceneId}
          fowCanvasRef={fowCanvasRef}
          fowActions={fowActions}
          tokens={tokens}
          customStatuses={customStatuses}
          pings={pings}
          onPickUpItem={handlePickUpItem}
          isCombatActive={isCombatActive}
          movementLimitsEnabled={movementLimitsEnabled}
        />

        {/* Indicador de Turnos para la Pantalla de Jugadores */}
        {isCombatActive && (
          <div style={{
            position: 'fixed',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(17, 21, 32, 0.94)',
            border: '1px solid rgba(245, 158, 11, 0.6)',
            borderRadius: '999px',
            padding: '6px 18px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8), 0 0 16px rgba(245, 158, 11, 0.3)',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'none',
            userSelect: 'none'
          }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.04em' }}>
              RONDA {combatRound}
            </span>
            {tokens.find(t => t.id === activeTurnTokenId && (!t.isHidden || !fowAutoHideEnemies)) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '10px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Turno:</span>
                <strong style={{ fontSize: '12px', color: tokens.find(t => t.id === activeTurnTokenId)?.faction === 'enemy' ? '#fca5a5' : '#93c5fd' }}>
                  {tokens.find(t => t.id === activeTurnTokenId)?.name}
                </strong>
              </div>
            )}
          </div>
        )}

        {player3DRoll && (
          <Dice3D
            rollReq={player3DRoll}
            isPlayerView={true}
            onRollLanded={(res) => {
              postSyncMessage({ type: 'RESULT_3D_ROLL', payload: res });
            }}
            onComplete={() => {
              setPlayer3DRoll(null);
              postSyncMessage({ type: 'CLOSE_3D_ROLL' });
            }}
          />
        )}

        <HandoutFullscreenOverlay handout={activeHandout} isPlayerView={true} />
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#0b0d12' }}>
      <style>{GLOBAL_VTT_STYLES}</style>
      <input type="file" accept=".json" ref={fileInputCampaignRef} style={{ display: 'none' }} onChange={handleImportCampaignFile} />

      <div style={{
        height: '58px',
        backgroundImage: 'linear-gradient(180deg, rgba(22, 25, 34, 0.72) 0%, rgba(15, 17, 23, 0.92) 100%), url("/assets/textures/grimoire_leather_header.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #3d3222',
        boxShadow: '0 4px 20px rgba(0,0,0,0.65)',
        zIndex: 30
      }}>
        <Toolbar
          scenes={scenes}
          activeSceneId={activeSceneId}
          onSelectScene={handleSelectScene}
          onOpenHome={() => setIsHomeOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(!isSettingsOpen)}
          onOpenPlayerView={handleOpenPlayerView}
          onOpenMasterNotes={() => setIsMasterNotesOpen(!isMasterNotesOpen)}
          onOpenGraveyard={() => setEncyclopediaState({ isOpen: true, category: 'graveyard' })}
          graveyardCount={(graveyard || []).length}
          isCombatActive={isCombatActive}
          combatRound={combatRound}
          activeTurnToken={tokens.find(t => t.id === activeTurnTokenId)}
          onNextTurn={handleNextTurn}
          onEndCombat={handleEndCombat}
        />
      </div>

      {/* Pantalla de Inicio / Hub Principal al pulsar el Logo */}
      <HomeScreen
        isOpen={isHomeOpen}
        onResumeGame={() => setIsHomeOpen(false)}
        scenes={scenes}
        activeSceneId={activeSceneId}
        onSelectScene={handleSelectScene}
        characters={characters}
        graveyard={graveyard}
        onOpenGraveyard={() => {
          setEncyclopediaState({ isOpen: true, category: 'graveyard' });
        }}
        onReviveCharacter={handleReviveFromGraveyard}
        onOpenEncyclopedia={(category) => {
          setEncyclopediaState({ isOpen: true, category: category || 'character' });
        }}
        onCreateCharacter={(defaultEntityType = 'human') => {
          const isMonster = defaultEntityType !== 'human' && defaultEntityType !== 'npc' && defaultEntityType !== 'cultist';
          setEditingCharacter({
            mode: 'create',
            character: {
              entityType: defaultEntityType,
              faction: isMonster ? 'enemy' : 'ally',
              color: isMonster ? '#8b5cf6' : '#3b82f6'
            }
          });
        }}
        onOpenMapCreator={() => setIsMapCreatorOpen(true)}
        onImportCampaign={handleImportCampaign}
        onExportCampaign={handleExportCampaign}
        onLoadRecentCampaign={(data) => {
          if (!data) return;
          applyCampaignData(data);
          setIsHomeOpen(false);
          showMasterFeedback('Crónica cargada con éxito', '📖');
        }}
        onOpenPlayerView={handleOpenPlayerView}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />

      {/* Vista Independiente: Enciclopedia de Personajes, Bestiario y Cripta/Cementerio */}
      <EncyclopediaView
        isOpen={encyclopediaState.isOpen}
        initialCategory={encyclopediaState.category}
        characters={characters}
        graveyard={graveyard}
        onClose={() => setEncyclopediaState(prev => ({ ...prev, isOpen: false }))}
        onReviveCharacter={handleReviveFromGraveyard}
        onDeleteFromGraveyard={handleDeleteFromGraveyard}
        onClearGraveyard={handleClearGraveyard}
        onExportGraveyard={handleExportGraveyard}
        onCreateNew={(defaultEntityType) => {
          const isMonster = defaultEntityType !== 'human' && defaultEntityType !== 'npc' && defaultEntityType !== 'cultist';
          setEditingCharacter({
            mode: 'create',
            character: {
              entityType: defaultEntityType,
              faction: isMonster ? 'enemy' : 'ally',
              color: isMonster ? '#8b5cf6' : '#3b82f6'
            }
          });
        }}
        onEditCharacter={handleEditCharacter}
        onDeleteCharacter={(id) => {
          setCharacters(prev => prev.filter(c => c.id !== id));
          showMasterFeedback('Registro eliminado de la biblioteca', '🗑️');
        }}
        onSpawnOnBoard={(char) => {
          setEncyclopediaState(prev => ({ ...prev, isOpen: false }));
          setIsHomeOpen(false);
          handleAddToken(char);
        }}
        onImportCharacters={(list) => {
          setCharacters(prev => [...prev, ...list]);
          showMasterFeedback(`Importados ${list.length} registros a la biblioteca`, '📥');
        }}
        onExportCharacters={async (entriesToExport, cat) => {
          const defaultName = cat === 'graveyard' ? 'registro_bajas_vtt.json' : cat === 'monster' ? 'bestiario_mitos_vtt.json' : 'enciclopedia_personajes_vtt.json';
          const res = await exportJSON(defaultName, entriesToExport);
          if (res?.success) {
            showMasterFeedback(`Biblioteca exportada: ${res.filename}`, '📤');
          }
        }}
        onClearCategory={(cat) => {
          setCharacters(prev => prev.filter(c => getClassificationMeta(c.entityType, c.faction).group !== cat));
          showMasterFeedback(cat === 'monster' ? 'Bestiario vaciado' : 'Archivo de personajes vaciado', '🗑️');
        }}
        onLoadStarterPack={(cat) => {
          const pack = (cat === 'monster' ? STARTER_MONSTERS : STARTER_CHARACTERS).map(item => ({
            ...item,
            id: Date.now() + Math.random()
          }));
          setCharacters(prev => [...prev, ...pack]);
          showMasterFeedback('Ejemplos cargados en la biblioteca', '✨');
        }}
      />

      {/* Editor de Mapas a Pantalla Completa */}
      {isMapCreatorOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          backgroundColor: '#080504',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <MapCreator
            initialElements={maps}
            onLoadMapToBoard={(newElements) => {
              setMaps(newElements);
              showMasterFeedback('Escenario actualizado en la mesa', '🗺️');
            }}
            onClose={() => setIsMapCreatorOpen(false)}
            onReturnToSettings={() => {
              setIsMapCreatorOpen(false);
              setIsSettingsOpen(true);
            }}
          />
        </div>
      )}

      {/* Modal Dedicado de Creación / Edición de Personaje */}
      {editingCharacter && (
        <CharacterSheetModal
          key={editingCharacter.character?.id || editingCharacter.linkedTokenId || 'modal'}
          mode={editingCharacter.mode}
          initialData={editingCharacter.character}
          initialTab={editingCharacter.initialTab || 'stats'}
          onUpdate={(savedChar) => {
            if (editingCharacter.mode === 'create') {
              setEditingCharacter(prev => prev ? { ...prev, character: savedChar } : null);
            } else {
              setCharacters(prev => prev.map(c => {
                if (c.id === savedChar.id || (editingCharacter.linkedTokenId && c.id === savedChar.characterId) || c.name === savedChar.name) {
                  return savedChar;
                }
                return c;
              }));
              setTokens(prev => prev.map(t => {
                if (t.characterId === savedChar.id || t.id === savedChar.id || (editingCharacter.linkedTokenId && t.id === editingCharacter.linkedTokenId) || t.name === savedChar.name) {
                  return {
                    ...t,
                    firstName: savedChar.firstName,
                    lastName: savedChar.lastName,
                    birthYear: savedChar.birthYear,
                    profession: savedChar.profession,
                    education: savedChar.education,
                    birthplace: savedChar.birthplace,
                    residence: savedChar.residence,
                    name: savedChar.name,
                    entityType: savedChar.entityType,
                    color: savedChar.color,
                    avatar: savedChar.avatar,
                    faction: savedChar.faction,
                    hp: savedChar.hp,
                    maxHp: savedChar.maxHp,
                    mp: savedChar.mp,
                    maxMp: savedChar.maxMp,
                    san: savedChar.san,
                    maxSan: savedChar.maxSan,
                    hasArmor: savedChar.hasArmor,
                    armorType: savedChar.armorType,
                    isGraveWound: savedChar.isGraveWound,
                    speed: savedChar.speed,
                    history: savedChar.history,
                    notes: savedChar.notes,
                    inventory: savedChar.inventory,
                    spells: savedChar.spells
                  };
                }
                return t;
              }));
              showMasterFeedback(`Identidad de "${savedChar.name}" autoguardada`, '✏️');
            }
          }}
          onSave={(savedChar) => {
            if (editingCharacter.mode === 'create') {
              setCharacters(prev => [...prev, savedChar]);
              showMasterFeedback(`"${savedChar.name}" inscrito en la biblioteca`, '📜');
            } else {
              setCharacters(prev => prev.map(c => {
                if (c.id === savedChar.id || (editingCharacter.linkedTokenId && c.id === savedChar.characterId) || c.name === savedChar.name) {
                  return savedChar;
                }
                return c;
              }));
              setTokens(prev => prev.map(t => {
                if (t.characterId === savedChar.id || t.id === savedChar.id || (editingCharacter.linkedTokenId && t.id === editingCharacter.linkedTokenId) || t.name === savedChar.name) {
                  return {
                    ...t,
                    firstName: savedChar.firstName,
                    lastName: savedChar.lastName,
                    birthYear: savedChar.birthYear,
                    profession: savedChar.profession,
                    education: savedChar.education,
                    birthplace: savedChar.birthplace,
                    residence: savedChar.residence,
                    name: savedChar.name,
                    entityType: savedChar.entityType,
                    color: savedChar.color,
                    avatar: savedChar.avatar,
                    faction: savedChar.faction,
                    hp: savedChar.hp,
                    maxHp: savedChar.maxHp,
                    mp: savedChar.mp,
                    maxMp: savedChar.maxMp,
                    san: savedChar.san,
                    maxSan: savedChar.maxSan,
                    hasArmor: savedChar.hasArmor,
                    armorType: savedChar.armorType,
                    isGraveWound: savedChar.isGraveWound,
                    history: savedChar.history,
                    notes: savedChar.notes,
                    inventory: savedChar.inventory,
                    spells: savedChar.spells
                  };
                }
                return t;
              }));
              showMasterFeedback(`Ficha de "${savedChar.name}" actualizada`, '✏️');
            }
            setEditingCharacter(null);
          }}
          onClose={() => setEditingCharacter(null)}
          onDropItemToFloor={handleDropItemToFloor}
          onTransferItem={handleTransferItemBetweenCharacters}
          tokens={tokens}
          characters={characters}
        />
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <TokenSidebar
          tokens={tokens}
          characters={characters}
          graveyard={graveyard}
          onOpenGraveyard={() => setEncyclopediaState({ isOpen: true, category: 'graveyard' })}
          onSendToGraveyard={handleSendToGraveyard}
          onAddToken={handleAddToken}
          onAddMapElement={handleStartPlaceMapElement}
          onOpenMapCreator={() => setIsMapCreatorOpen(true)}
          onOpenEncyclopedia={(category) => setEncyclopediaState({ isOpen: true, category: category || 'character' })}
          onRemoveToken={(id) => setTokens(prev => prev.filter(t => t.id !== id))}
          onRemoveCharacter={(id) => setCharacters(prev => prev.filter(c => c.id !== id))}
          onEditCharacter={handleEditCharacter}
          onCreateNewCharacter={(defaultEntityType = 'human') => {
            const isMonster = defaultEntityType !== 'human' && defaultEntityType !== 'npc' && defaultEntityType !== 'cultist';
            setEditingCharacter({
              mode: 'create',
              character: {
                entityType: defaultEntityType,
                faction: isMonster ? 'enemy' : 'ally',
                color: isMonster ? '#8b5cf6' : '#3b82f6'
              }
            });
          }}
          onUpdateTokenStats={handleUpdateTokenStats}
          onUpdateTokenSize={handleUpdateTokenSize}
          onUpdateTokenVisionMode={handleUpdateTokenVisionMode}
          onToggleTokenName={handleToggleTokenName}
          onToggleTokenBars={handleToggleTokenBars}
          onToggleTokenHidden={handleToggleTokenHidden}
          onToggleTokenFaction={handleToggleTokenFaction}
          customStatuses={customStatuses}
          customObjects={customObjects}
          commonItems={commonItems}
          onGiveItemToCharacter={handleGiveItemToCharacter}
          onPlaceGroundItem={handleStartPlaceGroundItem}
          onDropItemToFloor={handleDropItemToFloor}
          onOpenTokenSheet={handleOpenTokenSheet}
          onReorderTokens={handleReorderTokens}
          onMoveTokenOrder={handleMoveTokenOrder}
          onCenterOnToken={handleCenterOnToken}
          activeTurnTokenId={activeTurnTokenId}
          combatRound={combatRound}
          isCombatActive={isCombatActive}
          onStartCombat={handleStartCombat}
          onNextTurn={handleNextTurn}
          onEndCombat={handleEndCombat}
          movementLimitsEnabled={movementLimitsEnabled}
          onToggleMovementLimits={handleToggleMovementLimits}
          onResetTokenMovement={handleResetTokenMovement}
          onSelectActiveTurn={handleSelectActiveTurn}
        />

        {/* Aviso Superior de Modo Invocación Activo */}
        {pendingTokenSpawn && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '70px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9600,
              background: 'linear-gradient(180deg, rgba(24, 28, 38, 0.96) 0%, rgba(14, 16, 22, 0.98) 100%)',
              border: '1px solid #fbbf24',
              borderRadius: '10px',
              padding: '8px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              color: '#f8fafc',
              boxShadow: '0 10px 25px rgba(0,0,0,0.9)'
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              {pendingTokenSpawn.fromGraveyardId ? '✨ Haz clic en el mapa para situar al resucitado: ' : '🎯 Haz clic en el mapa para invocar a: '}
              <strong style={{ color: '#fbbf24' }}>{pendingTokenSpawn.name}</strong>
            </span>
            <button
              onClick={() => setPendingTokenSpawn(null)}
              className="vtt-brass-btn"
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Cancelar (Esc)
            </button>
          </div>
        )}

        {/* Aviso Superior de Modo Colocación de Objeto Activo */}
        {pendingMapSpawn && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '70px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9600,
              background: 'linear-gradient(180deg, rgba(24, 28, 38, 0.96) 0%, rgba(14, 16, 22, 0.98) 100%)',
              border: '1px solid #f59e0b',
              borderRadius: '10px',
              padding: '8px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              color: '#f8fafc',
              boxShadow: '0 10px 25px rgba(0,0,0,0.9)'
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              {pendingMapSpawn.icon || '📦'} Haz clic en el mapa para colocar: <strong style={{ color: '#fbbf24' }}>{pendingMapSpawn.name}</strong>
            </span>
            <button
              onClick={() => setPendingMapSpawn(null)}
              className="vtt-brass-btn"
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Cancelar (Esc)
            </button>
          </div>
        )}

        <GameBoard
          boardRef={boardRef}
          scale={scale}
          pan={pan}
          isDraggingPan={isDraggingPan}
          isPlayerView={false}
          activeTurnTokenId={activeTurnTokenId}
          fowEnabled={fowEnabled}
          fowMode={fowMode}
          fowVisionRadius={fowVisionRadius}
          fowMemoryEnabled={fowMemoryEnabled}
          fowAutoHideEnemies={fowAutoHideEnemies}
          weatherEffect={weatherEffect}
          ambientTint={ambientTint}
          rulerActive={rulerActive}
          pingActive={pingActive}
          pendingTokenSpawn={pendingTokenSpawn}
          pendingMapSpawn={pendingMapSpawn}
          draggedMapElement={draggedMapElement}
          onMapElementPointerDown={handleMapElementPointerDown}
          onRotateMapElement={handleRotateMapElement}
          onToggleMapElementLock={handleToggleMapElementLock}
          onInspectObject={handleInspectObject}
          onRemoveMapElement={handleRemoveMapElement}
          handlePointerDown={handlePointerDown}
          handlePointerMove={handlePointerMove}
          handlePointerUp={handlePointerUp}
          handleWheel={handleWheel}
          snapToGrid={snapToGrid}
          gridSize={gridSize}
          maps={maps}
          activeSceneId={activeSceneId}
          fowCanvasRef={fowCanvasRef}
          fowActions={fowActions}
          tokens={tokens}
          draggedToken={draggedToken}
          rotatingToken={rotatingToken}
          onTokenPointerDown={handleTokenPointerDown}
          onStartTokenRotate={handleStartTokenRotate}
          onToggleTokenLock={handleToggleTokenLock}
          onToggleTokenName={handleToggleTokenName}
          onToggleTokenBars={handleToggleTokenBars}
          onToggleTokenHidden={handleToggleTokenHidden}
          onToggleTokenFaction={handleToggleTokenFaction}
          onUpdateTokenSize={handleUpdateTokenSize}
          onUpdateTokenRotation={handleUpdateTokenRotation}
          onUpdateTokenVisionMode={handleUpdateTokenVisionMode}
          onToggleTokenStatus={handleToggleTokenStatus}
          onUpdateTokenStats={handleUpdateTokenStats}
          onOpenTokenSheet={handleOpenTokenSheet}
          customStatuses={customStatuses}
          rulerMeasure={rulerMeasure}
          pings={pings}
          holdProgress={holdProgress}
          radialMenu={radialMenu}
          onCloseRadialMenu={() => setRadialMenu(null)}
          onSelectSpatialSound={handleSelectSpatialSound}
          customSounds={customSounds}
          onToggleDoor={handleToggleDoor}
          onToggleWindow={handleToggleWindow}
          onToggleObject={handleToggleObject}
          onToggleLight={handleToggleLight}
          onProjectHandout={handleProjectHandout}
          onPickUpItem={handlePickUpItem}
          isCombatActive={isCombatActive}
          movementLimitsEnabled={movementLimitsEnabled}
          tokenDragOriginRef={tokenDragOriginRef}
          tokenDragMeasurement={tokenDragMeasurement}
        />

        {/* Dock Central Flotante Inferior Reorganizado y Compacto */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            bottom: '18px',
            left: isSettingsOpen ? 'calc(50vw + 150px - 240px)' : 'calc(50vw + 150px)',
            transform: 'translateX(-50%)',
            transition: 'left 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
            zIndex: 4000,
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
            background: 'rgba(15, 18, 25, 0.95)',
            padding: '6px 12px',
            borderRadius: '12px',
            border: '1px solid #2d3446',
            boxShadow: '0 12px 35px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
            whiteSpace: 'nowrap'
          }}
        >
          {/* Herramientas de Juego */}
          <button
            onClick={() => {
              setIsDiceOpen(!isDiceOpen);
              setIsSoundboardOpen(false);
            }}
            className={`vtt-brass-btn ${isDiceOpen ? 'vtt-btn-active' : ''}`}
            style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
            title="Abrir Cubilete de Dados Físicos 3D"
          >
            Dados
          </button>

          <button
            onClick={() => {
              setIsSoundboardOpen(!isSoundboardOpen);
              setIsDiceOpen(false);
            }}
            className={`vtt-brass-btn ${isSoundboardOpen || activeLoops.length > 0 ? 'vtt-btn-active' : ''}`}
            style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, gap: '6px' }}
            title="Abrir Órgano de Ecos y Sonidos Atmosféricos"
          >
            <span>Ecos</span>
            {activeLoops.length > 0 && (
              <span style={{ backgroundColor: '#f59e0b', color: '#0f1115', borderRadius: '999px', padding: '1px 5px', fontSize: '9px', fontWeight: 800 }}>
                {activeLoops.length}
              </span>
            )}
          </button>

          <div style={{ width: '1px', height: '18px', backgroundColor: '#262d3d' }}></div>

          <button
            onClick={() => { setRulerActive(!rulerActive); setPingActive(false); setFowMode('none'); }}
            className={`vtt-brass-btn ${rulerActive ? 'vtt-btn-active' : ''}`}
            style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
            title="Medir distancia en el mapa (pies, metros y casillas)"
          >
            Regla
          </button>

          <button
            onClick={() => { setPingActive(!pingActive); setRulerActive(false); setFowMode('none'); }}
            className={`vtt-brass-btn ${pingActive ? 'vtt-btn-active' : ''}`}
            style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
            title="Señalar punto en el mapa a los jugadores (o Alt + Clic)"
          >
            Señal
          </button>

          <div style={{ width: '1px', height: '18px', backgroundColor: '#262d3d' }}></div>

          {/* Atmósfera y Ambiente */}
          <select
            value={weatherEffect}
            onChange={(e) => setWeatherEffect(e.target.value)}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              backgroundColor: '#141822',
              color: '#cbd5e1',
              border: '1px solid #2d3546',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
            title="Efecto de clima atmosférico"
          >
            {WEATHER_TYPES.map(w => (
              <option key={w.id} value={w.id}>{w.label}</option>
            ))}
          </select>

          <select
            value={ambientTint}
            onChange={(e) => setAmbientTint(e.target.value)}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              backgroundColor: '#141822',
              color: '#cbd5e1',
              border: '1px solid #2d3546',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
            title="Iluminación ambiental del mapa"
          >
            {AMBIENT_TINTS.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>

          <div style={{ width: '1px', height: '18px', backgroundColor: '#262d3d' }}></div>

          {/* Navegación y Cámara */}
          <button
            onClick={() => { setPan({ x: 0, y: 0 }); setScale(1); }}
            className="vtt-brass-btn"
            style={{ padding: '6px 11px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
            title="Centrar tablero y restablecer zoom al 100%"
          >
            Centrar
          </button>

          <button
            onClick={() => {
              const nextSync = !syncCameraToPlayers;
              setSyncCameraToPlayers(nextSync);
              showMasterFeedback(
                nextSync
                  ? 'Cámara sincronizada con la pantalla de jugadores'
                  : 'Cámara libre (desvinculada de los jugadores)'
              );
            }}
            className={`vtt-brass-btn ${syncCameraToPlayers ? 'vtt-btn-active' : ''}`}
            style={{ padding: '6px 11px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
            title={syncCameraToPlayers ? "Cámara vinculada: los jugadores ven tus movimientos de pantalla" : "Cámara libre: navega en secreto sin mover la pantalla de los jugadores"}
          >
            {syncCameraToPlayers ? 'Cámara: ON' : 'Cámara: OFF'}
          </button>

          <button
            onClick={() => {
              if (confirmResetBoard) {
                setTokens([]);
                setFowActions([]);
                setConfirmResetBoard(false);
                showMasterFeedback('Mesa despejada');
              } else {
                setConfirmResetBoard(true);
                setTimeout(() => setConfirmResetBoard(false), 3000);
              }
            }}
            className={confirmResetBoard ? 'vtt-btn-danger' : 'vtt-brass-btn'}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 600,
              borderColor: confirmResetBoard ? '#ef4444' : undefined,
              color: confirmResetBoard ? '#ffffff' : '#94a3b8'
            }}
            title="Limpiar fichas y niebla de la mesa activa"
          >
            {confirmResetBoard ? '¿Limpiar?' : 'Limpiar'}
          </button>

          <button
            onClick={() => setIsTutorialOpen(true)}
            className="vtt-brass-btn"
            style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', color: '#94a3b8', fontWeight: 600 }}
            title="Guía de uso rápido del Grimorio VTT"
          >
            Ayuda
          </button>
        </div>

        <Soundboard
          isOpen={isSoundboardOpen}
          onClose={() => setIsSoundboardOpen(false)}
          onTriggerSound={handleTriggerSound}
          onStopAllSounds={handleStopAllSounds}
          activeLoops={activeLoops}
          masterToast={masterToast}
          customSounds={customSounds}
          onAddCustomSound={(snd) => setCustomSounds(prev => [...prev, snd])}
          onRemoveCustomSound={(id) => setCustomSounds(prev => prev.filter(s => s.id !== id))}
        />
        
        <DiceRoller 
          isOpen={isDiceOpen} 
          onClose={() => setIsDiceOpen(false)} 
          onPublicRoll={handleTriggerPublicRoll} 
          onHiddenRoll={handleTriggerHiddenRoll} 
          incomingResult={incomingRollResult}
        />

        <HandoutFullscreenOverlay
          handout={activeHandout}
          isPlayerView={false}
          onStopProjection={() => handleProjectHandout(null)}
        />
      </div>

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        characters={characters}
        onSaveCharacter={(newChar) => setCharacters(prev => [...prev, newChar])}
        onImportCharacters={(importedList) => setCharacters(prev => [...prev, ...importedList])}
        onAddToken={handleAddToken}
        onRemoveCharacter={(id) => setCharacters(prev => prev.filter(c => c.id !== id))}
        onOpenCharacterCreator={() => setEditingCharacter({ mode: 'create', character: null })}
        onEditCharacter={handleEditCharacter}
        customStatuses={customStatuses}
        onAddCustomStatus={(newSt) => setCustomStatuses(prev => [...prev, newSt])}
        onRemoveCustomStatus={(id) => setCustomStatuses(prev => prev.filter(s => s.id !== id))}
        onExportCampaign={handleExportCampaign}
        onImportCampaign={handleImportCampaign}
        fowEnabled={fowEnabled} setFowEnabled={setFowEnabled}
        fowBrushSize={fowBrushSize} setFowBrushSize={setFowBrushSize}
        fowVisionRadius={fowVisionRadius} setFowVisionRadius={setFowVisionRadius}
        fowMemoryEnabled={fowMemoryEnabled} setFowMemoryEnabled={setFowMemoryEnabled}
        fowAutoHideEnemies={fowAutoHideEnemies} setFowAutoHideEnemies={setFowAutoHideEnemies}
        onResetFow={() => setFowActions([])}
        fowMode={fowMode} setFowMode={setFowMode}
        snapToGrid={snapToGrid} setSnapToGrid={setSnapToGrid}
        gridSize={gridSize} setGridSize={setGridSize}
        openMapCreator={() => setIsMapCreatorOpen(true)}
        maps={maps}
        onAddMapElement={handleStartPlaceMapElement}
        onToggleMapElementState={handleToggleMapElementState}
        onRemoveMapElement={handleRemoveMapElement}
        onClearAllMaps={() => setMaps([])}
        scenes={scenes}
        activeSceneId={activeSceneId}
        onSelectScene={handleSelectScene}
        onCreateNewScene={handleCreateNewScene}
        onRenameScene={handleRenameScene}
        onDeleteScene={handleDeleteScene}
        onDeleteAllScenes={handleDeleteAllScenes}
        onMoveSceneOrder={handleMoveSceneOrder}
        onReorderScenes={handleReorderScenes}
        handouts={handouts}
        activeHandout={activeHandout}
        onAddHandout={(h) => setHandouts(prev => [...prev, h])}
        onRemoveHandout={(id) => {
          setHandouts(prev => prev.filter(h => h.id !== id));
          if (activeHandout && activeHandout.id === id) setActiveHandout(null);
        }}
        onProjectHandout={handleProjectHandout}
        customObjects={customObjects}
        onSaveCustomObject={handleSaveCustomObject}
        onDeleteCustomObject={handleDeleteCustomObject}
        onInspectObject={handleInspectObject}
        tokens={tokens}
        activeTurnTokenId={activeTurnTokenId}
        commonItems={commonItems}
        onGiveItemToCharacter={handleGiveItemToCharacter}
        onSaveCommonItem={handleSaveCommonItem}
        onDeleteCommonItem={handleDeleteCommonItem}
        onPlaceGroundItem={handleStartPlaceGroundItem}
        onSaveAdventure={handleSaveAdventure}
      />

      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onNeverShowAgain={() => setTutorialDismissed(true)}
      />

      {/* Tirada 3D local del Master (tirada oculta o modo pantalla única) */}
      {master3DRoll && (
        <Dice3D 
          rollReq={master3DRoll} 
          isPlayerView={false} 
          onComplete={(res) => {
            document.querySelectorAll('.dice-box-canvas').forEach(c => {
              try { c.remove(); } catch (e) {}
            });
            setMaster3DRoll(null);
            setIncomingRollResult(res);
          }} 
        />
      )}

      {/* Resultado unificado recibido desde la Pantalla de Jugadores */}
      {publicRollResult && (
        <Dice3D
          rollReq={publicRollResult}
          resultData={publicRollResult}
          isPlayerView={false}
          onComplete={() => {
            document.querySelectorAll('.dice-box-canvas').forEach(c => {
              try { c.remove(); } catch (e) {}
            });
            setPublicRollResult(null);
            postSyncMessage({ type: 'CLOSE_3D_ROLL' });
          }}
        />
      )}

      {/* Indicador mientras los dados giran en la Pantalla de Jugadores */}
      {waitingForPlayerRoll && !publicRollResult && (
        <div style={{
          position: 'fixed',
          top: '75px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(180deg, rgba(38, 24, 16, 0.96) 0%, rgba(18, 11, 7, 0.98))',
          border: '2px solid #d4af37',
          borderRadius: '10px',
          padding: '12px 26px',
          color: '#f3e5ab',
          fontSize: '15px',
          fontWeight: 'bold',
          zIndex: 999999,
          boxShadow: '0 10px 30px rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <span>🎲 Rodando dados en Pantalla de Jugadores...</span>
          <button
            onClick={() => {
              setWaitingForPlayerRoll(false);
              postSyncMessage({ type: 'CLOSE_3D_ROLL' });
            }}
            className="vtt-brass-btn"
            style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '4px', cursor: 'pointer' }}
          >
            ✕ Cancelar
          </button>
        </div>
      )}

      {/* Modal de Notas & Pistas de Objetos */}
      <ObjectNotesModal
        isOpen={objectNotesModalState.isOpen}
        onClose={() => setObjectNotesModalState({ isOpen: false, objectItem: null })}
        objectItem={objectNotesModalState.objectItem}
        handouts={handouts}
        onUpdateObject={handleUpdateObject}
        onProjectHandout={handleProjectHandout}
        onRemoveObject={handleRemoveMapElement}
      />

      {/* Diario & Notas del Máster (Punto 1) */}
      <MasterNotesDrawer
        isOpen={isMasterNotesOpen}
        onClose={() => setIsMasterNotesOpen(false)}
        activeSceneId={activeSceneId}
        scenes={scenes}
        sceneNotes={sceneNotes}
        onUpdateSceneNotes={handleUpdateSceneNotes}
        campaignNotes={campaignNotes}
        onUpdateCampaignNotes={setCampaignNotes}
        onSaveCharacter={(newChar) => setCharacters(prev => [...prev, newChar])}
      />
    </div>
  );
}

export default App;