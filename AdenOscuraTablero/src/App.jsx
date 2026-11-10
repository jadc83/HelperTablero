import React, { useState, useRef, useEffect } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { emit as tauriEmit, listen as tauriListen } from '@tauri-apps/api/event';

import Toolbar from './components/Toolbar';
import GameBoard from './components/GameBoard';
import TokenSidebar from './components/TokenSidebar';
import SettingsDrawer from './components/SettingsDrawer';
import HandoutProjectorModal from './components/HandoutProjectorModal';
import DiceRoller from './components/DiceRoller';
import Dice3D from './components/Dice3D';
import Soundboard, { playerSoundEngine, SOUND_CATALOG } from './components/Soundboard';
import TutorialModal from './components/TutorialModal';
import MapCreator from './components/MapCreator';
import CharacterSheetModal from './components/CharacterSheetModal';
import HomeScreen from './components/HomeScreen';
import EncyclopediaView, { getClassificationMeta } from './components/EncyclopediaView';
import ObjectNotesModal from './components/ObjectNotesModal';
import { WEATHER_TYPES, AMBIENT_TINTS } from './components/WeatherOverlay';
import { DEFAULT_COMMON_ITEMS } from './constants/commonItems';
import useLocalStorage from './hooks/useLocalStorage';
import { saveCampaignToDB, loadCampaignFromDB, clearActiveCampaignDB, exportCampaignJSON, saveCampaignSnapshot, getRecentCampaigns } from './utils/campaignStorage';
import { exportJSON, importJSON } from './utils/fileDialog';
import {
  Grip,
  Dices,
  Volume2,
  Ruler,
  Bell,
  Grid,
  Crosshair,
  Video,
  VideoOff,
  Trash2,
  ChevronUp,
  ChevronDown,
  MousePointer2,
  Eye,
  EyeOff,
  Sparkles,
  X,
  Package
} from 'lucide-react';

const isTauriDesktop = () => Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__);

const STARTER_CHARACTERS = [];
const STARTER_MONSTERS = [];

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
  .vtt-context-menu {
    position: fixed;
    background: linear-gradient(180deg, #1b202c 0%, #11141c 100%);
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid #3b4254;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.95);
    z-index: 999999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 256px;
    max-height: calc(100vh - 24px);
    overflow-y: auto;
    color: #e2e8f0;
    scrollbar-width: thin;
    scrollbar-color: #475569 transparent;
  }
  .vtt-context-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #283144;
    padding-bottom: 8px;
    gap: 8px;
  }
  .vtt-context-header-btn {
    width: 28px;
    height: 28px;
    padding: 0;
    border-radius: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: #171c26;
    border: 1px solid #2b3345;
    color: #cbd5e1;
    transition: all 0.15s ease;
  }
  .vtt-context-header-btn:hover {
    border-color: #f59e0b;
    color: #fbbf24;
    background: rgba(245, 158, 11, 0.14);
  }
  .vtt-context-icon-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
  }
  .vtt-context-icon-btn {
    flex: 1;
    height: 34px;
    padding: 0;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #171c26;
    border: 1px solid #2b3345;
    color: #cbd5e1;
    transition: all 0.15s ease;
  }
  .vtt-context-icon-btn:hover {
    border-color: #64748b;
    background: #1f2636;
    color: #f8fafc;
  }
  .vtt-context-icon-btn-info:hover {
    border-color: #0284c7;
    color: #38bdf8;
    background: rgba(14, 165, 233, 0.14);
  }
  .vtt-context-icon-btn-danger:hover {
    border-color: #ef4444;
    color: #fca5a5;
    background: rgba(239, 68, 68, 0.16);
  }
  .vtt-context-divider {
    border-top: 1px solid #242c3d;
    padding-top: 9px;
  }
  .vtt-context-section-label {
    font-size: 9.5px;
    color: #94a3b8;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .vtt-brass-slider {
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    background: #1a1e28;
    border: 1px solid #2d3546;
    border-radius: 999px;
    outline: none;
    cursor: pointer;
  }
  .vtt-brass-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #fef08a 0%, #d4af37 60%, #854d0e 100%);
    border: 1.5px solid #2a1b06;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.8), 0 0 6px rgba(212, 175, 55, 0.45);
    cursor: pointer;
    transition: transform 0.1s ease;
  }
  .vtt-brass-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
  }
  .vtt-brass-slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #fef08a 0%, #d4af37 60%, #854d0e 100%);
    border: 1.5px solid #2a1b06;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.8), 0 0 6px rgba(212, 175, 55, 0.45);
    cursor: pointer;
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

  const [characters, setCharacters] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [graveyard, setGraveyard] = useState([]);
  const [maps, setMaps] = useState([]);
  const [fowEnabled, setFowEnabled] = useLocalStorage('vtt_fow_enabled', false);
  const [fowBrushSize, setFowBrushSize] = useLocalStorage('vtt_fow_brush', 80);
  const [fowVisionRadius, setFowVisionRadius] = useLocalStorage('vtt_fow_vision_radius', 180);
  const [fowMemoryEnabled, setFowMemoryEnabled] = useLocalStorage('vtt_fow_memory', true);
  const [fowAutoHideEnemies, setFowAutoHideEnemies] = useLocalStorage('vtt_fow_autohide_enemies', true);
  const [fowActions, setFowActions] = useState([]);
  const [snapToGrid, setSnapToGrid] = useLocalStorage('vtt_snap_grid', false);
  const [gridSize, setGridSize] = useLocalStorage('vtt_grid_size', 50);
  const [customStatuses, setCustomStatuses] = useLocalStorage('vtt_custom_statuses', DEFAULT_STATUSES);
  const [weatherEffect, setWeatherEffect] = useState('none');
  const [ambientTint, setAmbientTint] = useState('none');
  const [syncCameraToPlayers, setSyncCameraToPlayers] = useLocalStorage('vtt_sync_camera', true);
  const [tutorialDismissed, setTutorialDismissed] = useLocalStorage('vtt_tutorial_dismissed', false);
  const [customSounds, setCustomSounds] = useState([]);
  const [customObjects, setCustomObjects] = useState([]);
  const [commonItems, setCommonItems] = useLocalStorage('vtt_common_items', DEFAULT_COMMON_ITEMS);

  // Gestión de Múltiples Escenas y Proyector de Handouts
  const [scenes, setScenes] = useState([
    {
      id: 'scene_default',
      name: 'Escena 1',
      maps: [],
      tokens: [],
      fowActions: [],
      weatherEffect: 'none',
      ambientTint: 'none'
    }
  ]);
  const [activeSceneId, setActiveSceneId] = useState('scene_default');
  const [handouts, setHandouts] = useState([]);
  const [activeHandout, setActiveHandout] = useState(null);
  const [isHandoutModalOpen, setIsHandoutModalOpen] = useState(false);

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const [draggedToken, setDraggedToken] = useState(null);
  const [rotatingToken, setRotatingToken] = useState(null);
  const [fowMode, setFowMode] = useState('none');
  const [isPaintingFow, setIsPaintingFow] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState(null);
  const [isMapCreatorOpen, setIsMapCreatorOpen] = useState(false);
  const [mapCreatorSceneId, setMapCreatorSceneId] = useState(null);
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
  const [isDraggingCharacter, setIsDraggingCharacter] = useState(false);
  const draggedCharacterRef = useRef(null);
  const draggedItemRef = useRef(null);
  const [pendingMapSpawn, setPendingMapSpawn] = useState(null);
  const [draggedMapElement, setDraggedMapElement] = useState(null);
  const [objectNotesModalState, setObjectNotesModalState] = useState({ isOpen: false, objectItem: null });

  // Estados para el Diario & Bloc de Notas del Máster (Punto 1)
  const [isMasterNotesOpen, setIsMasterNotesOpen] = useState(false);
  const [sceneNotes, setSceneNotes] = useState({});
  const [campaignNotes, setCampaignNotes] = useState('');

  const [holdProgress, setHoldProgress] = useState(null);
  const [radialMenu, setRadialMenu] = useState(null);
  const [activeLoops, setActiveLoops] = useState([]);
  const [masterToast, setMasterToast] = useState(null);

  // Estados de paneles y Dados 3D
  const [isDiceOpen, setIsDiceOpen] = useState(false);
  const [livingFogEnabled, setLivingFogEnabled] = useState(true);
  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);
  const [isFogDockOpen, setIsFogDockOpen] = useState(false);
  const dragStartYRef = useRef(null);
  const dragDistanceRef = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDraggingDock, setIsDraggingDock] = useState(false);

  const handlePointerDownDock = (e) => {
    e.stopPropagation();
    dragStartYRef.current = e.clientY;
    dragDistanceRef.current = 0;
    setIsDraggingDock(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMoveDock = (e) => {
    if (dragStartYRef.current === null) return;
    const dy = e.clientY - dragStartYRef.current;
    dragDistanceRef.current = dy;
    setDragOffset(dy);
  };

  const handlePointerUpDock = (e) => {
    if (dragStartYRef.current === null) return;
    dragStartYRef.current = null;
    setIsDraggingDock(false);
    setDragOffset(0);
    setIsFogDockOpen(prev => !prev);
  };
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
  const [combatGroups, setCombatGroups] = useState([]); // Grupos de encuentro independientes
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
      activeHandout, isCombatActive, combatRound, activeTurnTokenId, combatGroups, movementLimitsEnabled,
      camera: syncCameraToPlayers ? { pan, scale } : null
    };
  }, [
    tokens, maps, fowEnabled, fowVisionRadius, fowMemoryEnabled, fowAutoHideEnemies,
    fowActions, snapToGrid, gridSize, customStatuses, weatherEffect, ambientTint,
    activeHandout, isCombatActive, combatRound, activeTurnTokenId, combatGroups, movementLimitsEnabled, syncCameraToPlayers, pan, scale
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

  // 1. Restaurar campaña activa si hay una en curso; si fue concluida o está vacía, iniciar en limpio
  useEffect(() => {
    let mounted = true;
    loadCampaignFromDB().then((saved) => {
      if (!mounted) return;
      if (saved && !saved.isConcluded) {
        if (Array.isArray(saved.characters)) setCharacters(saved.characters);
        if (Array.isArray(saved.tokens)) setTokens(saved.tokens);
        if (Array.isArray(saved.maps)) setMaps(saved.maps);
        if (saved.fowEnabled !== undefined) setFowEnabled(saved.fowEnabled);
        if (saved.fowBrushSize) setFowBrushSize(saved.fowBrushSize);
        if (saved.fowVisionRadius) setFowVisionRadius(saved.fowVisionRadius);
        if (saved.fowMemoryEnabled !== undefined) setFowMemoryEnabled(saved.fowMemoryEnabled);
        if (saved.fowAutoHideEnemies !== undefined) setFowAutoHideEnemies(saved.fowAutoHideEnemies);
        if (Array.isArray(saved.fowActions)) setFowActions(saved.fowActions);
        if (saved.snapToGrid !== undefined) setSnapToGrid(saved.snapToGrid);
        if (saved.gridSize) setGridSize(saved.gridSize);
        if (saved.customStatuses) setCustomStatuses(saved.customStatuses);
        if (saved.weatherEffect) setWeatherEffect(saved.weatherEffect);
        if (saved.ambientTint) setAmbientTint(saved.ambientTint);
        if (Array.isArray(saved.customSounds)) setCustomSounds(saved.customSounds);
        if (Array.isArray(saved.scenes) && saved.scenes.length > 0) setScenes(saved.scenes);
        if (saved.activeSceneId) setActiveSceneId(saved.activeSceneId);
        if (Array.isArray(saved.handouts)) setHandouts(saved.handouts);
        if (saved.activeHandout !== undefined) setActiveHandout(saved.activeHandout);
        if (Array.isArray(saved.graveyard)) setGraveyard(saved.graveyard);
        if (Array.isArray(saved.customObjects)) setCustomObjects(saved.customObjects);
        if (Array.isArray(saved.commonItems)) setCommonItems(saved.commonItems);
        if (saved.sceneNotes) setSceneNotes(saved.sceneNotes);
        if (saved.campaignNotes !== undefined) setCampaignNotes(saved.campaignNotes);
      }
      setDbLoaded(true);
    });
    return () => { mounted = false; };
  }, []);

  // 2. Auto-guardado en segundo plano de la sesión activa en curso (solo si no está vacía de todo)
  useEffect(() => {
    if (!dbLoaded || isPlayerView) return;

    // Si el tablero está en estado limpio/vacío inicial (ej. tras concluir aventura), no sobreescribir la DB
    const isEmptyCleanSlate = (
      tokens.length === 0 &&
      maps.length === 0 &&
      characters.length === 0 &&
      scenes.length === 1 &&
      (scenes[0].maps || []).length === 0 &&
      (scenes[0].tokens || []).length === 0
    );
    if (isEmptyCleanSlate) return;

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
        commonItems,
        sceneNotes,
        campaignNotes
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [
    dbLoaded, isPlayerView, characters, tokens, maps,
    fowEnabled, fowBrushSize, fowVisionRadius, fowMemoryEnabled, fowAutoHideEnemies,
    fowActions, snapToGrid, gridSize, customStatuses, weatherEffect, ambientTint,
    customSounds, scenes, activeSceneId, handouts, activeHandout, graveyard, customObjects, commonItems,
    sceneNotes, campaignNotes
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

  // Atajo de teclado: Tecla 'N' para alternar Notas dentro del Centro de Mando
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'n' || e.key === 'N') {
        if (!isPlayerView) {
          setIsSettingsOpen(prev => {
            if (prev && settingsInitialTab === 'notas') {
              setSettingsInitialTab(null);
              return false;
            }
            setSettingsInitialTab('notas');
            return true;
          });
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPlayerView, settingsInitialTab]);

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

  const handleOpenMapCreator = (targetSceneId) => {
    const sceneToEdit = targetSceneId || activeSceneId;
    if (targetSceneId && targetSceneId !== activeSceneId) {
      handleSelectScene(targetSceneId);
    }
    setMapCreatorSceneId(sceneToEdit);
    setIsMapCreatorOpen(true);
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

  const spawnTokenFromCharacter = (char, spawnX, spawnY) => {
    const newToken = {
      id: Date.now() + Math.random(),
      characterId: char.id,
      firstName: char.firstName || '',
      lastName: char.lastName || '',
      birthYear: char.birthYear || '1890',
      name: char.name,
      entityType: char.entityType || (char.faction === 'enemy' ? 'mythos_creature' : 'human'),
      color: char.color,
      avatar: char.avatar || null,
      faction: char.faction || 'ally',
      x: spawnX,
      y: spawnY,
      size: gridSize,
      rotation: 0,
      visionMode: 'cone',
      isLocked: false,
      isHidden: char.faction === 'enemy',
      showName: true,
      showBars: false,
      statuses: char.statuses || [],
      hp: char.hp ?? 20,
      maxHp: char.maxHp ?? 20,
      mp: char.mp ?? 10,
      maxMp: char.maxMp ?? 10,
      san: char.san ?? 60,
      maxSan: char.maxSan ?? 60,
      hasArmor: Boolean(char.hasArmor),
      armorType: char.armorType || 'Ninguna',
      isGraveWound: Boolean(char.isGraveWound),
      speed: char.speed || 6,
      turnMovementUsed: 0,
      history: char.history || '',
      notes: char.notes || '',
      inventory: char.inventory || [],
      spells: char.spells || []
    };
    if (char.fromGraveyardId) {
      setGraveyard(prev => prev.filter(g => (g.graveyardId || g.id) !== char.fromGraveyardId));
      showMasterFeedback(`¡"${char.name}" ha resucitado y regresa al tablero!`, '✨');
    } else {
      showMasterFeedback(`${char.name} desplegado en escena`, '⚔️');
    }
    setTokens(prev => [...prev, newToken]);
  };

  const handleStartDragCharacter = (char) => {
    draggedCharacterRef.current = char;
    setIsDraggingCharacter(true);
    setPendingTokenSpawn(char);
  };

  const handleEndDragCharacter = () => {
    draggedCharacterRef.current = null;
    setIsDraggingCharacter(false);
    setPendingTokenSpawn(null);
  };

  const handleStartDragItem = (itemData) => {
    const mapItem = {
      type: 'item',
      name: itemData.name,
      icon: itemData.icon || '📦',
      category: itemData.category || 'Herramienta',
      notes: itemData.notes || '',
      state: itemData.state || 'equipped',
      width: 18,
      height: 18,
      isLocked: false
    };
    draggedItemRef.current = mapItem;
    setPendingMapSpawn(mapItem);
  };

  const handleEndDragItem = () => {
    draggedItemRef.current = null;
    setPendingMapSpawn(null);
  };

  const handleDropOnBoard = (e) => {
    if (isPlayerView) return;
    const coords = getLogicalCoords(e);

    // 1. Verificar si es un objeto arrastrado desde el buscador
    let droppedItem = draggedItemRef.current || (pendingMapSpawn && pendingMapSpawn.type === 'item' ? pendingMapSpawn : null);
    if (!droppedItem && e.dataTransfer) {
      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.type === 'ground_item' && parsed.item) {
            droppedItem = {
              type: 'item',
              name: parsed.item.name,
              icon: parsed.item.icon || '📦',
              category: parsed.item.category || 'Herramienta',
              notes: parsed.item.notes || '',
              state: parsed.item.state || 'equipped',
              width: 18,
              height: 18,
              isLocked: false
            };
          }
        }
      } catch {
        // Ignorar si no es JSON
      }
    }

    if (droppedItem) {
      const newElement = {
        ...droppedItem,
        id: Date.now() + Math.random(),
        x: Math.round(coords.x - (droppedItem.width || 18) / 2),
        y: Math.round(coords.y - (droppedItem.height || 18) / 2)
      };
      setMaps(prev => [...prev, newElement]);
      showMasterFeedback(`"${newElement.name || 'Objeto'}" colocado en el tablero`, '📦');
      draggedItemRef.current = null;
      setPendingMapSpawn(null);
      return;
    }

    // 2. Si es un personaje arrastrado
    const char = draggedCharacterRef.current || pendingTokenSpawn;
    if (!char) return;
    const spawnX = snapToGrid
      ? Math.floor(coords.x / gridSize) * gridSize
      : coords.x - gridSize / 2;
    const spawnY = snapToGrid
      ? Math.floor(coords.y / gridSize) * gridSize
      : coords.y - gridSize / 2;

    spawnTokenFromCharacter(char, spawnX, spawnY);
    draggedCharacterRef.current = null;
    setIsDraggingCharacter(false);
    setPendingTokenSpawn(null);
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

        spawnTokenFromCharacter(pendingTokenSpawn, spawnX, spawnY);
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

  // Contexto de combate para un token específico (según pertenezca a un grupo o al combate global)
  const getTokenCombatContext = (token) => {
    if (!token) return { isCombatActive: false, combatRound: 1, activeTurnTokenId: null, group: null };
    if (!combatGroups || combatGroups.length === 0) {
      return {
        isCombatActive,
        combatRound,
        activeTurnTokenId,
        group: null
      };
    }
    if (!token.combatGroupId) {
      // Fuera de combate / libre
      return {
        isCombatActive: false,
        combatRound: 1,
        activeTurnTokenId: null,
        group: null
      };
    }
    const group = combatGroups.find(g => g.id === token.combatGroupId);
    if (!group) {
      return {
        isCombatActive: false,
        combatRound: 1,
        activeTurnTokenId: null,
        group: null
      };
    }
    return {
      isCombatActive: Boolean(group.isCombatActive),
      combatRound: group.combatRound || 1,
      activeTurnTokenId: group.activeTurnTokenId || null,
      group
    };
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
    const tokenCombat = getTokenCombatContext(token);
    if (tokenCombat.isCombatActive && movementLimitsEnabled && !e.ctrlKey && !token.isLocked) {
      if (tokenCombat.activeTurnTokenId && token.id !== tokenCombat.activeTurnTokenId) {
        const activeTok = tokens.find(t => t.id === tokenCombat.activeTurnTokenId);
        showMasterFeedback(
          activeTok
            ? `Turno de "${activeTok.name}"${tokenCombat.group ? ` [${tokenCombat.group.name}]` : ''}. Mantén Ctrl para mover a otros.`
            : 'No es el turno de este combatiente.',
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

    // Capturamos el pointer en el BOARD (donde están los listeners de move/up),
    // no en el token (cuyo stopPropagation impide que los eventos lleguen al board).
    try {
      if (boardRef.current && e.pointerId !== undefined) {
        boardRef.current.setPointerCapture(e.pointerId);
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
      const tokenCombat = getTokenCombatContext(currentToken);
      if (tokenCombat.isCombatActive && movementLimitsEnabled && !e.ctrlKey && tokenDragOriginRef.current && currentToken) {
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
    // Liberar pointer capture del board si lo teníamos
    try {
      if (boardRef.current && e?.pointerId !== undefined && boardRef.current.hasPointerCapture(e.pointerId)) {
        boardRef.current.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}
    if (rulerMeasure) setRulerMeasure(null);

    if (draggedToken !== null) {
      // Si el usuario soltó el token sobre un grupo de combate en el sidebar lateral
      if (combatGroups && combatGroups.length > 0 && e?.clientX !== undefined && e?.clientY !== undefined) {
        const elemUnder = document.elementFromPoint(e.clientX, e.clientY);
        const groupEl = elemUnder?.closest('[data-combat-group-id]');
        if (groupEl) {
          const targetGid = groupEl.getAttribute('data-combat-group-id');
          handleAssignTokenToGroup(draggedToken, targetGid === 'free' ? null : targetGid);
        }
      }

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

            const tokenCombat = getTokenCombatContext(t);
            if (tokenCombat.isCombatActive && movementLimitsEnabled && origin && !isCtrlOverride) {
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

  const handleUpdateMapElement = (elId, updatedFields, feedbackMsg = null, feedbackIcon = '💾') => {
    setMaps(prev => prev.map(m => (m.id === elId ? { ...m, ...updatedFields } : m)));
    if (feedbackMsg) {
      showMasterFeedback(feedbackMsg, feedbackIcon);
    }
  };

  const handleDuplicateMapElement = (el) => {
    if (!el) return;
    const copy = {
      ...el,
      id: Date.now() + Math.random(),
      x: (el.x || 0) + 28,
      y: (el.y || 0) + 28
    };
    setMaps(prev => [...prev, copy]);
    showMasterFeedback(`"${el.name || 'Elemento'}" duplicado en la escena`, '📑');
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
      width: 18,
      height: 18,
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
      width: 18,
      height: 18,
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

  const COMBAT_GROUP_COLORS = [
    { hex: '#f59e0b', border: '#fbbf24', bg: 'rgba(245, 158, 11, 0.16)' },
    { hex: '#a855f7', border: '#c084fc', bg: 'rgba(168, 85, 247, 0.16)' },
    { hex: '#06b6d4', border: '#22d3ee', bg: 'rgba(6, 182, 212, 0.16)' },
    { hex: '#ef4444', border: '#f87171', bg: 'rgba(239, 68, 68, 0.16)' },
    { hex: '#10b981', border: '#34d399', bg: 'rgba(16, 185, 129, 0.16)' },
    { hex: '#f97316', border: '#fb923c', bg: 'rgba(249, 115, 22, 0.16)' }
  ];

  const handleCreateCombatGroup = (customName) => {
    const nextIdx = combatGroups.length;
    const colorTheme = COMBAT_GROUP_COLORS[nextIdx % COMBAT_GROUP_COLORS.length];
    const newGroup = {
      id: `cg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: customName || `Encuentro ${nextIdx + 1}`,
      color: colorTheme.hex,
      borderColor: colorTheme.border,
      bgColor: colorTheme.bg,
      isCombatActive: false,
      combatRound: 1,
      activeTurnTokenId: null
    };

    setCombatGroups(prev => [...prev, newGroup]);
    showMasterFeedback(`Creado grupo de combate: "${newGroup.name}"`, '⚔️');
    return newGroup.id;
  };

  const handleRemoveCombatGroup = (groupId) => {
    setCombatGroups(prev => prev.filter(g => g.id !== groupId));
    setTokens(prev => prev.map(t => t.combatGroupId === groupId ? { ...t, combatGroupId: null } : t));
    showMasterFeedback('Grupo de combate disuelto', '🗑️');
  };

  const handleUpdateCombatGroup = (groupId, updates) => {
    setCombatGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...updates } : g));
  };

  const handleAssignTokenToGroup = (tokenId, groupId) => {
    setTokens(prev => prev.map(t => {
      if (t.id !== tokenId) return t;
      return { ...t, combatGroupId: groupId || null };
    }));
    const targetGroup = combatGroups.find(g => g.id === groupId);
    const targetToken = tokens.find(t => t.id === tokenId);
    if (targetToken) {
      showMasterFeedback(
        targetGroup ? `"${targetToken.name}" asignado a "${targetGroup.name}"` : `"${targetToken.name}" ahora está libre`,
        '📋'
      );
    }
  };

  const handleStartGroupCombat = (groupId) => {
    const group = combatGroups.find(g => g.id === groupId);
    if (!group) return;
    const groupTokens = tokens.filter(t => t.combatGroupId === groupId);
    if (groupTokens.length === 0) {
      showMasterFeedback(`"${group.name}" no tiene personajes asignados. Arrastra fichas al grupo primero.`, '⚠️');
      return;
    }

    const firstToken = groupTokens[0];
    setCombatGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        isCombatActive: true,
        combatRound: 1,
        activeTurnTokenId: firstToken.id
      };
    }));

    setTokens(prev => prev.map(t => t.combatGroupId === groupId ? { ...t, turnMovementUsed: 0 } : t));
    tokenDragOriginRef.current = null;
    setTokenDragMeasurement(null);

    const baseSpeed = firstToken.speed || 6;
    const speed = firstToken.isGraveWound ? Math.max(1, Math.floor(baseSpeed / 2)) : baseSpeed;
    showMasterFeedback(`¡Combate iniciado en [${group.name}]! Turno de ${firstToken.name} (${speed} casillas)`, '⚔️');
  };

  const handleNextGroupTurn = (groupId) => {
    const group = combatGroups.find(g => g.id === groupId);
    if (!group) return;
    const groupTokens = tokens.filter(t => t.combatGroupId === groupId);
    if (groupTokens.length === 0) return;

    const currentIndex = groupTokens.findIndex(t => t.id === group.activeTurnTokenId);
    let nextIndex = currentIndex + 1;
    let nextRound = group.combatRound || 1;

    if (nextIndex >= groupTokens.length) {
      nextIndex = 0;
      nextRound += 1;
      showMasterFeedback(`[${group.name}] ¡Nueva ronda: Ronda ${nextRound}!`, '🔔');
    }

    const nextToken = groupTokens[nextIndex];
    if (nextToken) {
      setCombatGroups(prev => prev.map(g => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          combatRound: nextRound,
          activeTurnTokenId: nextToken.id
        };
      }));

      setTokens(prev => prev.map(t => t.id === nextToken.id ? { ...t, turnMovementUsed: 0 } : t));
      tokenDragOriginRef.current = null;
      setTokenDragMeasurement(null);

      const baseSpeed = nextToken.speed || 6;
      const speed = nextToken.isGraveWound ? Math.max(1, Math.floor(baseSpeed / 2)) : baseSpeed;
      showMasterFeedback(`[${group.name}] Turno de: ${nextToken.name} (${speed} casillas)`, '⚔️');
    }
  };

  const handleSelectGroupActiveTurn = (groupId, tokenId) => {
    const targetToken = tokens.find(t => t.id === tokenId);
    if (!targetToken) return;
    setCombatGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, activeTurnTokenId: tokenId };
    }));
    setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, turnMovementUsed: 0 } : t));
    tokenDragOriginRef.current = null;
    setTokenDragMeasurement(null);
    showMasterFeedback(`Turno asignado a: ${targetToken.name}`, '⚔️');
  };

  const handleEndGroupCombat = (groupId) => {
    const group = combatGroups.find(g => g.id === groupId);
    setCombatGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        isCombatActive: false,
        activeTurnTokenId: null,
        combatRound: 1
      };
    }));
    setTokens(prev => prev.map(t => t.combatGroupId === groupId ? { ...t, turnMovementUsed: 0 } : t));
    tokenDragOriginRef.current = null;
    setTokenDragMeasurement(null);
    showMasterFeedback(`Combate finalizado en [${group?.name || 'Encuentro'}]`, '🛡️');
  };

  const handleDisbandAllGroups = () => {
    setCombatGroups([]);
    setTokens(prev => prev.map(t => ({ ...t, combatGroupId: null })));
    showMasterFeedback('Todos los grupos de combate han sido disueltos. Modo estándar restaurado.', 'ℹ️');
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

  const handleResetToCleanSlate = () => {
    isSwitchingSceneRef.current = true;
    setCharacters([]);
    setTokens([]);
    setMaps([]);
    setFowActions([]);
    setGraveyard([]);
    setHandouts([]);
    setActiveHandout(null);
    setCustomObjects([]);
    setSceneNotes({});
    setCampaignNotes('');
    setWeatherEffect('none');
    setAmbientTint('none');
    const defaultScene = {
      id: 'scene_default',
      name: 'Escena 1',
      maps: [],
      tokens: [],
      fowActions: [],
      weatherEffect: 'none',
      ambientTint: 'none'
    };
    setScenes([defaultScene]);
    setActiveSceneId('scene_default');
    setPan({ x: 0, y: 0 });
    setScale(1);
    setTimeout(() => {
      isSwitchingSceneRef.current = false;
    }, 120);
    showMasterFeedback('Mesa y crónica vaciadas por completo', '🧹');
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

  const handleConcludeAdventure = async (adventureName, shouldExportFile = true) => {
    // 1. Sincronizar el estado en vivo de la escena activa dentro del listado de escenas
    const syncedScenes = scenes.map((sc) =>
      sc.id === activeSceneId
        ? { ...sc, maps, tokens, fowActions, weatherEffect, ambientTint }
        : sc
    );
    const activeScene = syncedScenes.find(sc => sc.id === activeSceneId) || syncedScenes[0];
    const advTitle = adventureName?.trim() || (activeScene ? `${activeScene.name} (Concluida)` : 'Crónica Concluida');

    const payload = {
      adventureName: advTitle,
      isConcluded: true,
      concludedAt: new Date().toISOString(),
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

    // 2. Guardar snapshot sellado como Concluida en disco (Tauri) y en IndexedDB
    try {
      await saveCampaignSnapshot(payload, advTitle, true);
    } catch (err) {
      console.warn('Error archivando snapshot concluido:', err);
    }

    // 3. Exportar archivo .json independiente si el máster lo solicitó
    let fileResult = null;
    if (shouldExportFile) {
      const safeTitle = advTitle.toLowerCase().replace(/[^a-z0-9]/gi, '_');
      const filename = `cronica_concluida_${safeTitle}_${new Date().toISOString().slice(0, 10)}.json`;
      fileResult = await exportJSON(filename, payload);
    }

    // 4. Limpiar la sesión activa de IndexedDB para que en el próximo arranque inicie limpia
    await clearActiveCampaignDB();

    // 5. Vaciar el estado completo de la mesa (clean slate)
    handleResetToCleanSlate();

    showMasterFeedback(`Crónica concluida y archivada: "${advTitle}". Mesa despejada.`, '📜');
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
          livingFogEnabled={livingFogEnabled}
          weatherEffect={weatherEffect}
          ambientTint={ambientTint}
          handlePointerDown={handlePointerDown}
          handlePointerMove={handlePointerMove}
          handlePointerUp={handlePointerUp}
          handleDropOnBoard={handleDropOnBoard}
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
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onOpenPlayerView={handleOpenPlayerView}
          onOpenHandouts={() => setIsHandoutModalOpen(true)}
          handoutsCount={handouts.length}
          hasActiveHandout={Boolean(activeHandout)}
          onOpenMasterNotes={() => {
            setSettingsInitialTab('notas');
            setIsSettingsOpen(true);
          }}
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
        onOpenMapCreator={() => handleOpenMapCreator(activeSceneId)}
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
          {(() => {
            const targetScene = scenes.find(sc => sc.id === (mapCreatorSceneId || activeSceneId))
              || scenes.find(sc => sc.id === activeSceneId)
              || scenes[0];
            const currentMapSceneName = targetScene ? targetScene.name : 'Escena Principal';
            const currentMapInitialElements = (targetScene && targetScene.maps) ? targetScene.maps : maps;
            const currentMapSceneId = targetScene ? targetScene.id : activeSceneId;

            return (
              <MapCreator
                initialElements={currentMapInitialElements}
                sceneName={currentMapSceneName}
                sceneId={currentMapSceneId}
                onLoadMapToBoard={(newElements) => {
                  setMaps(newElements);
                  setScenes((prev) => prev.map((sc) =>
                    sc.id === currentMapSceneId ? { ...sc, maps: newElements } : sc
                  ));
                  showMasterFeedback(`Plano de "${currentMapSceneName}" guardado en la mesa`, '🗺️');
                }}
                onClose={() => {
                  setIsMapCreatorOpen(false);
                  setMapCreatorSceneId(null);
                }}
                onReturnToSettings={() => {
                  setIsMapCreatorOpen(false);
                  setMapCreatorSceneId(null);
                  setIsSettingsOpen(true);
                }}
              />
            );
          })()}
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
          onImportCharacters={(list) => {
            setCharacters(prev => [...prev, ...list]);
            showMasterFeedback(`Importados ${list.length} registros a la mesa`, '📜');
          }}
          graveyard={graveyard}
          onOpenGraveyard={() => setEncyclopediaState({ isOpen: true, category: 'graveyard' })}
          onSendToGraveyard={handleSendToGraveyard}
          onAddToken={handleAddToken}
          onStartDragCharacter={handleStartDragCharacter}
          onEndDragCharacter={handleEndDragCharacter}
          onStartDragItem={handleStartDragItem}
          onEndDragItem={handleEndDragItem}
          onAddMapElement={handleStartPlaceMapElement}
          onOpenMapCreator={() => handleOpenMapCreator(activeSceneId)}
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
          combatGroups={combatGroups}
          onCreateCombatGroup={handleCreateCombatGroup}
          onRemoveCombatGroup={handleRemoveCombatGroup}
          onUpdateCombatGroup={handleUpdateCombatGroup}
          onAssignTokenToGroup={handleAssignTokenToGroup}
          onStartGroupCombat={handleStartGroupCombat}
          onNextGroupTurn={handleNextGroupTurn}
          onEndGroupCombat={handleEndGroupCombat}
          onSelectGroupActiveTurn={handleSelectGroupActiveTurn}
          onDisbandAllGroups={handleDisbandAllGroups}
        />

        {/* Aviso Superior de Modo Invocación Activo */}
        {pendingTokenSpawn && !isDraggingCharacter && (
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
            <span style={{ fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {pendingTokenSpawn.fromGraveyardId ? <Sparkles size={14} strokeWidth={2.2} style={{ color: '#fbbf24' }} /> : <Crosshair size={14} strokeWidth={2.2} style={{ color: '#fbbf24' }} />}
              <span>{pendingTokenSpawn.fromGraveyardId ? 'Haz clic en el mapa para situar al resucitado: ' : 'Haz clic en el mapa para invocar a: '}</span>
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
            <span style={{ fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Package size={14} strokeWidth={2.2} style={{ color: '#fbbf24' }} /> Haz clic en el mapa para colocar: <strong style={{ color: '#fbbf24' }}>{pendingMapSpawn.name}</strong>
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
          livingFogEnabled={livingFogEnabled}
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
          onUpdateMapElement={handleUpdateMapElement}
          onDuplicateMapElement={handleDuplicateMapElement}
          onInspectObject={handleInspectObject}
          onRemoveMapElement={handleRemoveMapElement}
          handlePointerDown={handlePointerDown}
          handlePointerMove={handlePointerMove}
          handlePointerUp={handlePointerUp}
          handleDropOnBoard={handleDropOnBoard}
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
          combatGroups={combatGroups}
          tokenDragOriginRef={tokenDragOriginRef}
          tokenDragMeasurement={tokenDragMeasurement}
        />

        {/* Dock Central Flotante Inferior - Sistema de Barras Apilables (Estilo Lineage II) */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            bottom: '12px',
            left: isSettingsOpen ? 'calc(50vw + 150px - 240px)' : 'calc(50vw + 150px)',
            transform: 'translateX(-50%)',
            transition: 'left 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
            zIndex: 4000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: '5px',
            whiteSpace: 'nowrap',
            userSelect: 'none'
          }}
        >
          {/* BARRA 1: Herramientas Principales de Mesa */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(15, 18, 25, 0.96)',
              padding: '6px 12px',
              borderRadius: '12px',
              border: '1px solid #2d3446',
              boxShadow: '0 8px 30px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)',
              boxSizing: 'border-box',
              height: '44px',
              minHeight: '44px',
              whiteSpace: 'nowrap'
            }}
          >
            {/* Agarre táctil de 4 puntos a la izquierda para arrastrar / desplegar barra */}
            <div
              onPointerDown={handlePointerDownDock}
              onPointerMove={handlePointerMoveDock}
              onPointerUp={handlePointerUpDock}
              onPointerCancel={handlePointerUpDock}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isDraggingDock ? 'grabbing' : 'grab',
                color: isFogDockOpen ? '#38bdf8' : '#64748b',
                padding: '4px',
                borderRadius: '4px',
                backgroundColor: isDraggingDock ? 'rgba(2, 132, 199, 0.25)' : 'transparent',
                touchAction: 'none',
                userSelect: 'none',
                transition: 'color 0.15s ease'
              }}
              title="Arrastra o haz clic para desplegar/ocultar la barra secundaria"
            >
              <Grip size={13} strokeWidth={2.2} />
            </div>

            {/* Herramientas de Juego */}
            <button
              onClick={() => {
                setIsDiceOpen(!isDiceOpen);
                setIsSoundboardOpen(false);
              }}
              className={`vtt-brass-btn ${isDiceOpen ? 'vtt-btn-active' : ''}`}
              style={{ padding: '6px 11px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, gap: '5px' }}
              title="Abrir Cubilete de Dados Físicos 3D"
            >
              <Dices size={13} strokeWidth={2.2} /> Dados
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
              <Volume2 size={13} strokeWidth={2.2} /> <span>Ecos</span>
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
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Ruler size={13} strokeWidth={2.2} /> Regla</span>
            </button>

            <button
              onClick={() => { setPingActive(!pingActive); setRulerActive(false); setFowMode('none'); }}
              className={`vtt-brass-btn ${pingActive ? 'vtt-btn-active' : ''}`}
              style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
              title="Señalar punto en el mapa a los jugadores (o Alt + Clic)"
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Bell size={13} strokeWidth={2.2} /> Señal</span>
            </button>

            <div style={{ width: '1px', height: '18px', backgroundColor: '#262d3d' }}></div>

            {/* Cuadrícula Táctica y Calibrador */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setSnapToGrid(!snapToGrid)}
                className={`vtt-brass-btn ${snapToGrid ? 'vtt-btn-active' : ''}`}
                style={{
                  padding: '5px 9px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: snapToGrid ? '#86efac' : '#94a3b8',
                  borderColor: snapToGrid ? '#10b981' : undefined,
                  gap: '5px'
                }}
                title="Ajuste magnético automático de fichas a la cuadrícula"
              >
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: snapToGrid ? '#10b981' : '#475569',
                  boxShadow: snapToGrid ? '0 0 5px #10b981' : 'none',
                  display: 'inline-block'
                }} />
                <Grid size={12} strokeWidth={2.2} />
                <span>Cuadrícula: {snapToGrid ? `${gridSize}px` : 'OFF'}</span>
              </button>

              <input
                type="range"
                min="20"
                max="150"
                step="5"
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="vtt-brass-slider"
                style={{ width: '75px' }}
                title={`Ajustar tamaño de cuadrícula: ${gridSize}px`}
              />
            </div>

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
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Crosshair size={13} strokeWidth={2.2} /> Centrar</span>
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
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>{syncCameraToPlayers ? <Video size={13} strokeWidth={2.2} /> : <VideoOff size={13} strokeWidth={2.2} />} {syncCameraToPlayers ? 'Cámara: ON' : 'Cámara: OFF'}</span>
            </button>

            <button
              onClick={() => {
                if (confirmResetBoard) {
                  handleResetToCleanSlate();
                  setConfirmResetBoard(false);
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
              title="Vaciar por completo el tablero, fichas y crónicas para empezar de cero"
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Trash2 size={12} strokeWidth={2.2} /> {confirmResetBoard ? '¿Vaciar Mesa?' : 'Vaciar Mesa'}</span>
            </button>

            <div style={{ width: '1px', height: '18px', backgroundColor: '#262d3d' }}></div>

            {/* Conmutador Flecha / Desplegable Barra II */}
            <button
              onClick={() => setIsFogDockOpen(!isFogDockOpen)}
              className={`vtt-brass-btn ${isFogDockOpen ? 'vtt-btn-active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px 9px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                borderColor: isFogDockOpen ? '#38bdf8' : '#334155',
                color: isFogDockOpen ? '#38bdf8' : '#cbd5e1',
                backgroundColor: isFogDockOpen ? 'rgba(2, 132, 199, 0.22)' : '#141822',
                transition: 'all 0.15s ease'
              }}
              title={isFogDockOpen ? "Ocultar barra táctica secundaria" : "Desplegar barra táctica secundaria"}
            >
              {isFogDockOpen ? <ChevronUp size={14} strokeWidth={2.4} /> : <ChevronDown size={14} strokeWidth={2.4} />}
            </button>
          </div>

          {/* BARRA 2: Controles Tácticos de Niebla y Visión (Mismo aspecto, ancho y alto que Barra 1) */}
          {isFogDockOpen && (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(15, 18, 25, 0.96)',
                padding: '6px 12px',
                borderRadius: '12px',
                border: '1px solid #2d3446',
                boxShadow: '0 8px 30px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
                boxSizing: 'border-box',
                height: '44px',
                minHeight: '44px',
                whiteSpace: 'nowrap'
              }}
            >
              {/* Agarre táctil de 4 puntos a la izquierda para Barra 2 */}
              <div
                onPointerDown={handlePointerDownDock}
                onPointerMove={handlePointerMoveDock}
                onPointerUp={handlePointerUpDock}
                onPointerCancel={handlePointerUpDock}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isDraggingDock ? 'grabbing' : 'grab',
                  color: '#38bdf8',
                  padding: '4px',
                  borderRadius: '4px',
                  backgroundColor: isDraggingDock ? 'rgba(2, 132, 199, 0.25)' : 'transparent',
                  touchAction: 'none',
                  userSelect: 'none',
                  transition: 'color 0.15s ease'
                }}
                title="Arrastra o haz clic para cerrar la barra secundaria"
              >
                <Grip size={13} strokeWidth={2.2} />
              </div>

              {/* Conmutador Niebla Global */}
              <button
                onClick={() => setFowEnabled(!fowEnabled)}
                className={`vtt-brass-btn ${fowEnabled ? 'vtt-btn-active' : ''}`}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: fowEnabled ? '#4ade80' : '#f87171',
                  borderColor: fowEnabled ? '#10b981' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: '30px',
                  boxSizing: 'border-box'
                }}
                title="Niebla de Guerra y Conos de Visión: Translúcida para el Máster, opaca para los Jugadores"
              >
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: fowEnabled ? '#10b981' : '#ef4444',
                  boxShadow: fowEnabled ? '0 0 6px #10b981' : '0 0 4px #ef4444',
                  display: 'inline-block'
                }} />
                <span>Niebla: {fowEnabled ? 'ON' : 'OFF'}</span>
              </button>

              {/* Memoria de Exploración (Penumbra) */}
              <button
                onClick={() => setFowMemoryEnabled(!fowMemoryEnabled)}
                className={`vtt-brass-btn ${fowMemoryEnabled ? 'vtt-btn-active' : ''}`}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: fowMemoryEnabled ? '#fbbf24' : '#94a3b8',
                  height: '30px',
                  boxSizing: 'border-box'
                }}
                title="Memoria de Exploración: deja en penumbra lo descubierto por los héroes"
              >
                Memoria: {fowMemoryEnabled ? 'ON' : 'OFF'}
              </button>

              {/* Conmutador Bruma Viva WebGL */}
              <button
                onClick={() => {
                  const nextState = !livingFogEnabled;
                  setLivingFogEnabled(nextState);
                  showMasterFeedback(nextState ? 'Bruma Viva WebGL activada (niebla volumétrica)' : 'Bruma Viva desactivada');
                }}
                className={`vtt-brass-btn ${livingFogEnabled ? 'vtt-btn-active' : ''}`}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: livingFogEnabled ? '#38bdf8' : '#94a3b8',
                  borderColor: livingFogEnabled ? '#0284c7' : '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: '30px',
                  boxSizing: 'border-box'
                }}
                title="Bruma Viva WebGL: Shaders Three.js de niebla volumétrica y parpadeo de llama"
              >
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: livingFogEnabled ? '#38bdf8' : '#64748b',
                  boxShadow: livingFogEnabled ? '0 0 6px #38bdf8' : 'none',
                  display: 'inline-block'
                }} />
                <span>Bruma Viva: {livingFogEnabled ? 'ON' : 'OFF'}</span>
              </button>

              {/* Auto-ocultar Enemigos fuera de vista */}
              <button
                onClick={() => setFowAutoHideEnemies(!fowAutoHideEnemies)}
                className={`vtt-brass-btn ${fowAutoHideEnemies ? 'vtt-btn-active' : ''}`}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: fowAutoHideEnemies ? '#4ade80' : '#94a3b8',
                  height: '30px',
                  boxSizing: 'border-box'
                }}
                title="Ocultar enemigos que estén fuera del cono de visión de los héroes"
              >
                Ocultar PNJ: {fowAutoHideEnemies ? 'ON' : 'OFF'}
              </button>

              <div style={{ width: '1px', height: '18px', backgroundColor: '#262d3d' }}></div>

              {/* Selector de Modo de Pincel de Niebla */}
              <div style={{
                display: 'flex',
                gap: '3px',
                backgroundColor: '#121622',
                padding: '2px',
                borderRadius: '6px',
                border: '1px solid #262e40',
                height: '30px',
                boxSizing: 'border-box',
                alignItems: 'center'
              }}>
                <button
                  onClick={() => setFowMode('none')}
                  className={`vtt-brass-btn ${fowMode === 'none' ? 'vtt-btn-active' : ''}`}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: fowMode === 'none' ? '#fbbf24' : '#94a3b8',
                    borderColor: fowMode === 'none' ? '#f59e0b' : 'transparent',
                    background: fowMode === 'none' ? '#241a0d' : 'transparent'
                  }}
                  title="Modo Mover: interactúa con fichas y navega por el tablero normalmente"
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MousePointer2 size={12} strokeWidth={2.2} /> Mover</span>
                </button>
                <button
                  onClick={() => { setFowMode('reveal'); setRulerActive(false); setPingActive(false); }}
                  className={`vtt-brass-btn ${fowMode === 'reveal' ? 'vtt-btn-active' : ''}`}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: fowMode === 'reveal' ? '#4ade80' : '#94a3b8',
                    borderColor: fowMode === 'reveal' ? '#10b981' : 'transparent',
                    background: fowMode === 'reveal' ? '#0f291e' : 'transparent'
                  }}
                  title="Pincel Despejar: arrastra sobre el mapa para desvelar zonas a los jugadores"
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Eye size={12} strokeWidth={2.2} /> Despejar</span>
                </button>
                <button
                  onClick={() => { setFowMode('hide'); setRulerActive(false); setPingActive(false); }}
                  className={`vtt-brass-btn ${fowMode === 'hide' ? 'vtt-btn-active' : ''}`}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: fowMode === 'hide' ? '#f87171' : '#94a3b8',
                    borderColor: fowMode === 'hide' ? '#ef4444' : 'transparent',
                    background: fowMode === 'hide' ? '#2b1111' : 'transparent'
                  }}
                  title="Pincel Cubrir: arrastra sobre el mapa para volver a ocultar zonas en la niebla"
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><EyeOff size={12} strokeWidth={2.2} /> Cubrir</span>
                </button>
              </div>

              {/* Slider de Tamaño de Pincel */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                  Pincel: <strong style={{ color: '#f8fafc' }}>{fowBrushSize}px</strong>
                </span>
                <input
                  type="range"
                  min="20"
                  max="300"
                  step="5"
                  value={fowBrushSize}
                  onChange={(e) => setFowBrushSize(Number(e.target.value))}
                  className="vtt-brass-slider"
                  style={{ width: '75px' }}
                  title={`Tamaño del pincel de niebla: ${fowBrushSize}px`}
                />
              </div>

              <div style={{ width: '1px', height: '18px', backgroundColor: '#262d3d' }}></div>

              {/* Slider Radio de Visión de Héroes */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                  Visión: <strong style={{ color: '#f8fafc' }}>{fowVisionRadius}px</strong>
                </span>
                <input
                  type="range"
                  min="60"
                  max="500"
                  step="10"
                  value={fowVisionRadius}
                  onChange={(e) => setFowVisionRadius(Number(e.target.value))}
                  className="vtt-brass-slider"
                  style={{ width: '75px' }}
                  title={`Radio de visión dinámica proyectada por los héroes: ${fowVisionRadius}px`}
                />
              </div>

              <div style={{ width: '1px', height: '18px', backgroundColor: '#262d3d' }}></div>

              {/* Botón Cubrir Todo (Restaurar Oscuridad) */}
              <button
                onClick={() => {
                  if (window.confirm('¿Deseas restaurar la oscuridad y cubrir todo el mapa con niebla?')) {
                    setFowActions([]);
                    showMasterFeedback('Oscuridad restaurada en todo el mapa');
                  }
                }}
                className="vtt-btn-danger"
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#ffffff',
                  height: '30px',
                  boxSizing: 'border-box'
                }}
                title="Restaurar oscuridad y cubrir con niebla todo el mapa"
              >
                Cubrir Todo
              </button>
            </div>
          )}
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
        onClose={() => {
          setIsSettingsOpen(false);
          setSettingsInitialTab(null);
        }}
        initialTab={settingsInitialTab}
        sceneNotes={sceneNotes}
        onUpdateSceneNotes={handleUpdateSceneNotes}
        campaignNotes={campaignNotes}
        onUpdateCampaignNotes={setCampaignNotes}
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
        openMapCreator={handleOpenMapCreator}
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
        onTransferItem={handleTransferItemBetweenCharacters}
        onSaveAdventure={handleSaveAdventure}
        onConcludeAdventure={handleConcludeAdventure}
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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Dices size={16} strokeWidth={2.2} /> Rodando dados en Pantalla de Jugadores...</span>
          <button
            onClick={() => {
              setWaitingForPlayerRoll(false);
              postSyncMessage({ type: 'CLOSE_3D_ROLL' });
            }}
            className="vtt-brass-btn"
            style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '4px', cursor: 'pointer' }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><X size={12} strokeWidth={2.4} /> Cancelar</span>
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

      {/* Proyector de Ilustraciones y Pistas (Handouts) */}
      <HandoutProjectorModal
        isOpen={isHandoutModalOpen}
        onClose={() => setIsHandoutModalOpen(false)}
        handouts={handouts}
        activeHandout={activeHandout}
        onAddHandout={(h) => setHandouts(prev => [...prev, h])}
        onRemoveHandout={(id) => {
          setHandouts(prev => prev.filter(h => h.id !== id));
          if (activeHandout && activeHandout.id === id) setActiveHandout(null);
        }}
        onProjectHandout={handleProjectHandout}
      />
    </div>
  );
}

export default App;