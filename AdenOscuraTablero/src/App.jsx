import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { emit as tauriEmit, listen as tauriListen } from '@tauri-apps/api/event';

import Toolbar from './components/Toolbar';
import GameBoard from './components/GameBoard';
import TokenSidebar from './components/TokenSidebar';
import SettingsDrawer from './components/SettingsDrawer';
import HandoutProjectorModal from './components/HandoutProjectorModal';
import HandoutFullscreenOverlay from './components/HandoutFullscreenOverlay';
import DiceRoller from './components/DiceRoller';
import Dice3D from './components/Dice3D';
import Soundboard from './components/Soundboard';
import TutorialModal from './components/TutorialModal';
import MapCreator from './components/MapCreator';
import CharacterSheetModal from './components/CharacterSheetModal';
import HomeScreen from './components/HomeScreen';
import EncyclopediaView from './components/EncyclopediaView';
import ObjectNotesModal from './components/ObjectNotesModal';
import AppSettingsModal from './components/AppSettingsModal';
import {
  WEATHER_TYPES,
  AMBIENT_TINTS
} from './constants/gamePresets';
import { playerSoundEngine } from './utils/soundEngine';
import { DEFAULT_COMMON_ITEMS } from './constants/commonItems';
import useLocalStorage from './hooks/useLocalStorage';
import { useAppSettings } from './hooks/useAppSettings';
import { useConfirm } from './hooks/useConfirm';
import { useGlobalCodex } from './hooks/useGlobalCodex';
import { useSceneAndCampaignActions } from './hooks/useSceneAndCampaignActions';
import { useCombatManager } from './hooks/useCombatManager';
import { useBoardInteraction } from './hooks/useBoardInteraction';
import { useInventoryActions } from './hooks/useInventoryActions';
import { saveCampaignToDB, loadCampaignFromDB, saveCampaignSnapshot } from './utils/campaignStorage';
import { exportJSON, importJSON } from './utils/fileDialog';
import {
  Grip,
  Dices,
  Volume2,
  Ruler,
  Grid,
  Crosshair,
  Trash2,
  ChevronUp,
  ChevronDown,
  MousePointer2,
  Eye,
  EyeOff,
  Sparkles,
  X,
  Package,
  ScrollText
} from 'lucide-react';

const isTauriDesktop = () => Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__);

const DEFAULT_STATUSES = [
  { id: 'bloodied', icon: '🩸', label: 'Malherido', effect: 'none' },
  { id: 'poisoned', icon: '🤢', label: 'Envenenado', effect: 'none' },
  { id: 'stunned', icon: '💫', label: 'Aturdido', effect: 'immobilize' },
  { id: 'burning', icon: '🔥', label: 'Ardiendo', effect: 'none' }
];

function App() {
  const isPlayerView = new URLSearchParams(window.location.search).get('view') === 'player';
  const confirm = useConfirm();
  const { settings, updateSettings, importSettings } = useAppSettings();
  const importSettingsRef = useRef(importSettings);
  const latestAppSettingsRef = useRef(settings);

  const [characters, setCharacters] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [graveyard, setGraveyard] = useState([]);
  const [maps, setMaps] = useState([]);
  const [fowEnabled, setFowEnabled] = useLocalStorage('vtt_fow_enabled', false, isPlayerView);
  const [fowBrushSize, setFowBrushSize] = useLocalStorage('vtt_fow_brush', 80, isPlayerView);
  const [fowVisionRadius, setFowVisionRadius] = useLocalStorage('vtt_fow_vision_radius', 180, isPlayerView);
  const [fowMemoryEnabled, setFowMemoryEnabled] = useLocalStorage('vtt_fow_memory', true, isPlayerView);
  const [fowActions, setFowActions] = useState([]);
  const [snapToGrid, setSnapToGrid] = useLocalStorage('vtt_snap_grid', false, isPlayerView);
  const gridSize = settings.gridSize ?? 50;
  const setGridSize = useCallback((val) => {
    updateSettings({ gridSize: Number(val) || 50 });
  }, [updateSettings]);
  const [customStatuses, setCustomStatuses] = useLocalStorage('vtt_custom_statuses', DEFAULT_STATUSES, isPlayerView);
  const [weatherEffect, setWeatherEffect] = useState('none');
  const [ambientTint, setAmbientTint] = useState('none');
  const [tutorialDismissed, setTutorialDismissed] = useLocalStorage('vtt_tutorial_dismissed', false, isPlayerView);
  const [customSounds, setCustomSounds] = useState([]);
  const [customObjects, setCustomObjects] = useState([]);
  const [commonItems, setCommonItems] = useLocalStorage('vtt_common_items', DEFAULT_COMMON_ITEMS, isPlayerView);

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
  const [handoutImageFullscreen, setHandoutImageFullscreen] = useLocalStorage('vtt_handout_image_fullscreen', false);

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const [draggedToken, setDraggedToken] = useState(null);
  const [rotatingToken, setRotatingToken] = useState(null);
  const [fowMode, setFowMode] = useState('none');
  const [isPaintingFow, setIsPaintingFow] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAppSettingsOpen, setIsAppSettingsOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [settingsInitialTab, setSettingsInitialTab] = useState(null);
  const [isMapCreatorOpen, setIsMapCreatorOpen] = useState(false);
  const [mapCreatorSceneId, setMapCreatorSceneId] = useState(null);
  const [isHomeOpen, setIsHomeOpen] = useState(false);
  const [encyclopediaState, setEncyclopediaState] = useState({ isOpen: false, category: 'character' });
  const [isTutorialOpen, setIsTutorialOpen] = useState(() => !tutorialDismissed && !isPlayerView);
  const [dbLoaded, setDbLoaded] = useState(false);

  const {
    codex,
    archiveEntitiesToCodex,
    archiveItemsToCodex,
    deleteCodexEntity,
    deleteCodexItem,
    clearCodexCategory
  } = useGlobalCodex(isPlayerView);

  // Estado para abrir el Modal de Creación o Edición de Personaje
  const [editingCharacter, setEditingCharacter] = useState(null); // { mode: 'create' | 'edit', character: obj | null }

  const [rulerActive, setRulerActive] = useState(false);
  const [rulerMeasure, setRulerMeasure] = useState(null);

  // Estado para Invocación Interactiva de Personajes y Objetos en el Mapa
  const [pendingTokenSpawn, setPendingTokenSpawn] = useState(null);
  const [isDraggingCharacter, setIsDraggingCharacter] = useState(false);
  const draggedCharacterRef = useRef(null);
  const draggedItemRef = useRef(null);
  const [pendingMapSpawn, setPendingMapSpawn] = useState(null);
  const [draggedMapElement, setDraggedMapElement] = useState(null);
  const [objectNotesModalState, setObjectNotesModalState] = useState({ isOpen: false, objectItem: null });

  // Estados para el Diario & Bloc de Notas del Máster
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
    dragDistanceRef.current = e.clientY - dragStartYRef.current;
  };

  const handlePointerUpDock = () => {
    if (dragStartYRef.current === null) return;
    const dy = dragDistanceRef.current;
    dragStartYRef.current = null;
    dragDistanceRef.current = 0;
    setIsDraggingDock(false);
    if (dy <= -16) {
      setIsFogDockOpen(true);
    } else if (dy >= 16) {
      setIsFogDockOpen(false);
    } else if (Math.abs(dy) < 8) {
      setIsFogDockOpen(prev => !prev);
    }
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
  const [movementLimitsEnabled, setMovementLimitsEnabled] = useLocalStorage('vtt_movement_limits_enabled', true, isPlayerView);
  const tokenDragOriginRef = useRef(null);
  const [tokenDragMeasurement, setTokenDragMeasurement] = useState(null);

  const boardRef = useRef(null);
  const fowCanvasRef = useRef(null);
  const syncChannelRef = useRef(null);
  const holdTimerRef = useRef(null);
  const holdStartPosRef = useRef(null);
  const isSwitchingSceneRef = useRef(false);
  const latestStateRef = useRef({});
  const lastFowPointRef = useRef(null);

  // Mantener actualizado el ref con el último estado para respuestas de sincronización atómicas
  useEffect(() => {
    latestStateRef.current = {
      tokens, maps, fowEnabled, fowVisionRadius, fowMemoryEnabled, livingFogEnabled,
      fowActions, snapToGrid, gridSize, customStatuses, weatherEffect, ambientTint,
      activeHandout, isCombatActive, combatRound, activeTurnTokenId, combatGroups, movementLimitsEnabled
    };
  }, [
    tokens, maps, fowEnabled, fowVisionRadius, fowMemoryEnabled, livingFogEnabled,
    fowActions, snapToGrid, gridSize, customStatuses, weatherEffect, ambientTint,
    activeHandout, isCombatActive, combatRound, activeTurnTokenId, combatGroups, movementLimitsEnabled
  ]);

  // Función auxiliar para emitir eventos tanto por BroadcastChannel (Web) como por Tauri Events (Desktop)
  const postSyncMessage = (message) => {
    if (syncChannelRef.current) {
      try { syncChannelRef.current.postMessage(message); } catch { /* canal cerrado */ }
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
        if (Array.isArray(saved.characters)) {
          setCharacters(saved.characters);
          archiveEntitiesToCodex(saved.characters, { updateExisting: false });
        }
        if (Array.isArray(saved.tokens)) setTokens(saved.tokens);
        if (Array.isArray(saved.maps)) setMaps(saved.maps);
        if (saved.fowEnabled !== undefined) setFowEnabled(saved.fowEnabled);
        if (saved.fowBrushSize) setFowBrushSize(saved.fowBrushSize);
        if (saved.fowVisionRadius) setFowVisionRadius(saved.fowVisionRadius);
        if (saved.fowMemoryEnabled !== undefined) setFowMemoryEnabled(saved.fowMemoryEnabled);
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
        if (Array.isArray(saved.commonItems)) {
          setCommonItems(saved.commonItems);
          archiveItemsToCodex(saved.commonItems, { updateExisting: false });
        }
        if (saved.sceneNotes) setSceneNotes(saved.sceneNotes);
        if (saved.campaignNotes !== undefined) setCampaignNotes(saved.campaignNotes);
      }
      setDbLoaded(true);
    });
    return () => { mounted = false; };
  }, [
    archiveEntitiesToCodex, archiveItemsToCodex,
    setCommonItems, setCustomStatuses, setFowBrushSize,
    setFowEnabled, setFowMemoryEnabled, setFowVisionRadius, setGridSize, setSnapToGrid
  ]);

  useEffect(() => {
    importSettingsRef.current = importSettings;
  }, [importSettings]);

  useEffect(() => {
    latestAppSettingsRef.current = settings;
    playerSoundEngine.updateSettings({
      masterVolume: settings.masterVolume,
      ambientVolume: settings.ambientVolume,
      sfxVolume: settings.sfxVolume,
      isMuted: isPlayerView ? settings.mutePlayerAudio : !settings.playAudioOnMaster
    });
  }, [settings, isPlayerView]);

  const campaignDbPayload = useMemo(() => ({
    characters,
    tokens,
    maps,
    fowEnabled,
    fowBrushSize,
    fowVisionRadius,
    fowMemoryEnabled,
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
  }), [
    characters, tokens, maps, fowEnabled, fowBrushSize, fowVisionRadius, fowMemoryEnabled,
    fowActions, snapToGrid, gridSize, customStatuses, weatherEffect, ambientTint,
    customSounds, scenes, activeSceneId, handouts, activeHandout, graveyard, customObjects, commonItems,
    sceneNotes, campaignNotes
  ]);

  // 2. Auto-guardado en segundo plano de la sesión activa en curso (solo si no está vacía de todo)
  useEffect(() => {
    if (!dbLoaded || isPlayerView || !settings.autoSaveEnabled) return;

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
      saveCampaignToDB(campaignDbPayload);
    }, settings.autoSaveIntervalMs || 400);
    return () => clearTimeout(timer);
  }, [dbLoaded, isPlayerView, settings.autoSaveEnabled, settings.autoSaveIntervalMs, campaignDbPayload, tokens.length, maps.length, characters.length, scenes]);

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
            postSyncMessage({
              type: 'SETTINGS_SYNC',
              payload: latestAppSettingsRef.current
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
            try { c.remove(); } catch { /* ignore */ }
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
          if (p.livingFogEnabled !== undefined) setLivingFogEnabled(p.livingFogEnabled);
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
          if (Array.isArray(p.combatGroups)) setCombatGroups(p.combatGroups);
          if (p.movementLimitsEnabled !== undefined) setMovementLimitsEnabled(p.movementLimitsEnabled);
        } else if (msg.type === 'TRIGGER_3D_ROLL') {
          document.querySelectorAll('.dice-box-canvas').forEach(c => {
            try { c.remove(); } catch { /* ignore */ }
          });
          setPlayer3DRoll(msg.payload);
        } else if (msg.type === 'CLOSE_3D_ROLL') {
          document.querySelectorAll('.dice-box-canvas').forEach(c => {
            try { c.remove(); } catch { /* ignore */ }
          });
          setPlayer3DRoll(null);
        } else if (msg.type === 'SOUND_PLAY') {
          playerSoundEngine.play(msg.payload);
        } else if (msg.type === 'SOUND_STOP_ALL') {
          playerSoundEngine.stopAll();
        } else if (msg.type === 'SETTINGS_SYNC' && msg.payload) {
          importSettingsRef.current(msg.payload);
        }
      }
    };

    channel.onmessage = (event) => handleIncomingMessage(event.data);

    if (isTauriDesktop()) {
      tauriListen('vtt_realtime_event', (event) => {
        handleIncomingMessage(event.payload);
      }).then((fn) => {
        if (!isMounted) {
          try { fn(); } catch { /* ignore */ }
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
        try { unlistenTauri(); } catch { /* ignore */ }
      }
    };
  }, [
    isPlayerView, setCustomStatuses, setFowEnabled,
    setFowMemoryEnabled, setFowVisionRadius, setGridSize, setMovementLimitsEnabled, setSnapToGrid
  ]);

  // Emitir cambios de estado desde el Master hacia la Vista de Jugadores
  useEffect(() => {
    if (isPlayerView) return;
    postSyncMessage({
      type: 'STATE_SYNC',
      payload: {
        tokens, maps, fowEnabled, fowVisionRadius, fowMemoryEnabled, livingFogEnabled,
        fowActions, snapToGrid, gridSize, customStatuses, weatherEffect, ambientTint,
        activeHandout, isCombatActive, combatRound, activeTurnTokenId, combatGroups, movementLimitsEnabled
      }
    });
  }, [
    isPlayerView, tokens, maps, fowEnabled, fowVisionRadius, fowMemoryEnabled,
    livingFogEnabled, fowActions, snapToGrid, gridSize, customStatuses,
    weatherEffect, ambientTint, activeHandout, isCombatActive, combatRound, activeTurnTokenId, combatGroups, movementLimitsEnabled
  ]);

  useEffect(() => {
    if (isPlayerView) return;
    postSyncMessage({
      type: 'SETTINGS_SYNC',
      payload: settings
    });
  }, [isPlayerView, settings]);

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
      const target = e.target;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable
      ) {
        return;
      }
      if (
        isPlayerView ||
        isHomeOpen ||
        isMapCreatorOpen ||
        encyclopediaState.isOpen ||
        editingCharacter ||
        isHandoutModalOpen ||
        isTutorialOpen ||
        objectNotesModalState.isOpen
      ) {
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        setIsSettingsOpen(prev => {
          if (prev && settingsInitialTab === 'notas') {
            setSettingsInitialTab(null);
            return false;
          }
          setSettingsInitialTab('notas');
          return true;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isPlayerView,
    settingsInitialTab,
    isHomeOpen,
    isMapCreatorOpen,
    encyclopediaState.isOpen,
    editingCharacter,
    isHandoutModalOpen,
    isTutorialOpen,
    objectNotesModalState.isOpen
  ]);

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

  const {
    handleSelectScene,
    handleOpenMapCreator,
    handleCreateNewScene,
    handleRenameScene,
    handleDeleteScene,
    handleDeleteAllScenes,
    handleProjectHandout,
    handleTriggerSound,
    handleStopAllSounds,
    handleSelectSpatialSound,
    handleTriggerPublicRoll,
    handleTriggerHiddenRoll,
    handleUpdateSceneNotes,
    handleResetToCleanSlate,
    applyCampaignData,
    handleSaveAdventure,
    handleConcludeAdventure
  } = useSceneAndCampaignActions({
    scenes, setScenes, activeSceneId, setActiveSceneId,
    maps, setMaps, tokens, setTokens, fowActions, setFowActions,
    weatherEffect, setWeatherEffect, ambientTint, setAmbientTint,
    isCombatActive, setIsCombatActive, combatRound, setCombatRound,
    activeTurnTokenId, setActiveTurnTokenId, combatGroups, setCombatGroups,
    characters, setCharacters, graveyard, setGraveyard,
    handouts, setHandouts, activeHandout, setActiveHandout,
    customObjects, setCustomObjects, customSounds, setCustomSounds,
    commonItems, setCommonItems, sceneNotes, setSceneNotes,
    campaignNotes, setCampaignNotes, fowEnabled, setFowEnabled,
    fowBrushSize, setFowBrushSize, fowVisionRadius, setFowVisionRadius,
    fowMemoryEnabled, setFowMemoryEnabled,
    snapToGrid, setSnapToGrid, gridSize, setGridSize,
    customStatuses, setCustomStatuses, activeLoops, setActiveLoops,
    radialMenu, setRadialMenu, setPan, setScale,
    setMapCreatorSceneId, setIsMapCreatorOpen,
    setMaster3DRoll, setWaitingForPlayerRoll,
    isSwitchingSceneRef, lastPlayerPingRef, postSyncMessage, showMasterFeedback
  });

  const handleProjectHandoutWithMode = (handoutObj) => {
    if (!handoutObj) {
      handleProjectHandout(null);
      return;
    }
    const isImageHandout = handoutObj.type !== 'note' && Boolean(handoutObj.src);
    handleProjectHandout(
      isImageHandout
        ? { ...handoutObj, fullscreen: handoutObj.fullscreen !== undefined ? handoutObj.fullscreen : handoutImageFullscreen }
        : handoutObj
    );
  };

  const handleToggleHandoutFullscreen = () => {
    const nextFullscreen = !handoutImageFullscreen;
    setHandoutImageFullscreen(nextFullscreen);
    setActiveHandout(prev => (
      prev && prev.type !== 'note' && prev.src
        ? { ...prev, fullscreen: nextFullscreen }
        : prev
    ));
    showMasterFeedback(
      nextFullscreen
        ? 'Proyección de imágenes a pantalla completa activada'
        : 'Proyección de imágenes en modo normal'
    );
  };

  const {
    getTokenCombatContext,
    handleReorderTokens,
    handleStartCombat,
    handleNextTurn,
    handleSelectActiveTurn,
    handleEndCombat,
    handleToggleMovementLimits,
    handleResetTokenMovement,
    handleCreateCombatGroup,
    handleRemoveCombatGroup,
    handleUpdateCombatGroup,
    handleAssignTokenToGroup,
    handleStartGroupCombat,
    handleNextGroupTurn,
    handleSelectGroupActiveTurn,
    handleEndGroupCombat,
    handleDisbandAllGroups
  } = useCombatManager({
    tokens, setTokens, combatGroups, setCombatGroups,
    isCombatActive, setIsCombatActive, combatRound, setCombatRound,
    activeTurnTokenId, setActiveTurnTokenId,
    setMovementLimitsEnabled,
    tokenDragOriginRef, setTokenDragMeasurement, showMasterFeedback
  });

  const {
    handleToggleDoor,
    handleToggleWindow,
    handleToggleObject,
    handleToggleLight,
    handleSetAllLights,
    handleWheel,
    handleStartDragCharacter,
    handleEndDragCharacter,
    handleStartDragItem,
    handleEndDragItem,
    handleStartDragMapElement,
    handleEndDragMapElement,
    handleDropOnBoard,
    handlePointerDown,
    handleTokenPointerDown,
    handleStartTokenRotate,
    handlePointerMove,
    handlePointerUp,
    handleAddToken,
    handleStartPlaceMapElement,
    handleMapElementPointerDown,
    handleToggleMapElementLock,
    handleInspectObject,
    handleUpdateObject,
    handleUpdateMapElement,
    handleDuplicateMapElement,
    handleRemoveMapElement,
    handleToggleTokenLock,
    handleToggleTokenName,
    handleToggleTokenBars,
    handleToggleTokenHidden,
    handleToggleTokenFaction,
    handleCenterOnToken,
    handleUpdateTokenSize,
    handleUpdateTokenRotation,
    handleToggleTokenStatus
  } = useBoardInteraction({
    isPlayerView, maps, setMaps, tokens, setTokens, setFowActions,
    scale, setScale, pan, setPan, gridSize, snapToGrid,
    fowEnabled, fowMode, fowBrushSize,
    rulerActive, setRulerActive,
    rulerMeasure, setRulerMeasure, radialMenu, setRadialMenu,
    pendingTokenSpawn, setPendingTokenSpawn, pendingMapSpawn, setPendingMapSpawn,
    isDraggingPan, setIsDraggingPan, draggedToken, setDraggedToken,
    draggedMapElement, setDraggedMapElement, rotatingToken, setRotatingToken,
    isPaintingFow, setIsPaintingFow, tokenDragMeasurement, setTokenDragMeasurement,
    movementLimitsEnabled, combatGroups, customStatuses,
    setGraveyard, setCharacters, setIsDraggingCharacter, setHoldProgress,
    setIsSettingsOpen, setFowMode, setObjectNotesModalState,
    boardRef, holdTimerRef, holdStartPosRef, lastFowPointRef,
    tokenDragOriginRef, draggedCharacterRef, draggedItemRef,
    handleTriggerSound, getTokenCombatContext,
    handleAssignTokenToGroup, showMasterFeedback
  });

  const {
    handleGiveItemToCharacter,
    handleSaveCommonItem,
    handleImportCommonItems,
    handleDeleteCommonItem,
    handlePickUpItem,
    handleDropItemToFloor,
    handleTransferItemBetweenCharacters,
    handleStartPlaceGroundItem
  } = useInventoryActions({
    tokens, characters, activeTurnTokenId, pan, scale, snapToGrid, gridSize,
    setMaps, setTokens, setCharacters, setCustomObjects, setCommonItems,
    onStartPlaceMapElement: handleStartPlaceMapElement,
    onArchiveItemsToCodex: archiveItemsToCodex,
    showMasterFeedback
  });

  const handleStartPlaceClue = (clue, sceneId = activeSceneId) => {
    if (!clue) return;
    if (sceneId && sceneId !== activeSceneId) {
      handleSelectScene(sceneId);
    }
    const clueTitle = clue.title || clue.text || 'Pista';
    handleStartPlaceMapElement({
      type: 'note',
      title: clueTitle,
      name: clueTitle,
      content: clue.content || '',
      clueId: clue.id,
      width: 34,
      height: 34,
      showName: true,
      isHidden: !clue.completed,
      isLocked: clue.isLocked !== false
    });
  };

  const handleUpdateBoardClue = (clueId, updatedFields, sceneId = activeSceneId) => {
    if (!clueId) return;
    if (!sceneId || sceneId === activeSceneId) {
      setMaps(prev => prev.map(m => (
        m.type === 'note' && m.clueId === clueId ? { ...m, ...updatedFields } : m
      )));
    } else {
      setScenes(prev => prev.map(sc => (
        sc.id === sceneId
          ? {
              ...sc,
              maps: (sc.maps || []).map(m => (
                m.type === 'note' && m.clueId === clueId ? { ...m, ...updatedFields } : m
              ))
            }
          : sc
      )));
    }
  };

  const handleRemoveBoardClue = (clueId, sceneId = activeSceneId) => {
    if (!clueId) return;
    if (!sceneId || sceneId === activeSceneId) {
      setMaps(prev => prev.filter(m => !(m.type === 'note' && m.clueId === clueId)));
    } else {
      setScenes(prev => prev.map(sc => (
        sc.id === sceneId
          ? {
              ...sc,
              maps: (sc.maps || []).filter(m => !(m.type === 'note' && m.clueId === clueId))
            }
          : sc
      )));
    }
  };

  const handleBoardMapElementUpdate = (elId, updatedFields, feedbackMsg) => {
    handleUpdateMapElement(elId, updatedFields, feedbackMsg);
    const targetNote = maps.find(m => m.id === elId && m.type === 'note' && m.clueId);
    if (targetNote && (updatedFields.title !== undefined || updatedFields.content !== undefined || updatedFields.isHidden !== undefined)) {
      const sceneEntry = sceneNotes[activeSceneId] || { notes: '', clues: [] };
      const updatedClues = (sceneEntry.clues || []).map(c =>
        c.id === targetNote.clueId
          ? {
              ...c,
              title: updatedFields.title !== undefined ? updatedFields.title : (c.title || c.text),
              text: updatedFields.title !== undefined ? updatedFields.title : c.text,
              content: updatedFields.content !== undefined ? updatedFields.content : (c.content || ''),
              completed: updatedFields.isHidden !== undefined ? !updatedFields.isHidden : Boolean(c.completed)
            }
          : c
      );
      handleUpdateSceneNotes(activeSceneId, { ...sceneEntry, clues: updatedClues });
    }
  };

  const handleBoardMapElementLockToggle = (elId) => {
    handleToggleMapElementLock(elId);
    const targetNote = maps.find(m => m.id === elId && m.type === 'note' && m.clueId);
    if (targetNote) {
      const nextLocked = !targetNote.isLocked;
      const sceneEntry = sceneNotes[activeSceneId] || { notes: '', clues: [] };
      const updatedClues = (sceneEntry.clues || []).map(c =>
        c.id === targetNote.clueId ? { ...c, isLocked: nextLocked } : c
      );
      handleUpdateSceneNotes(activeSceneId, { ...sceneEntry, clues: updatedClues });
    }
  };

  const handleBringCodexEntityToTable = (entity, { silent = false } = {}) => {
    if (!entity) return;
    let added = false;
    setCharacters((prev) => {
      if (prev.some(c => String(c.id) === String(entity.id))) {
        return prev;
      }
      added = true;
      return [...prev, { ...entity }];
    });
    if (!silent) {
      showMasterFeedback(
        added ? `"${entity.name}" traído desde el Códice a la partida` : `"${entity.name}" ya está en la partida`,
        '📖'
      );
    }
  };

  const handleBringCodexItemToTable = (item) => {
    if (!item) return;
    let added = false;
    setCommonItems((prev) => {
      const exists = prev.some(
        it => String(it.id) === String(item.id) || (it.name || '').trim().toLowerCase() === (item.name || '').trim().toLowerCase()
      );
      if (exists) return prev;
      added = true;
      return [...prev, { ...item }];
    });
    showMasterFeedback(
      added ? `Objeto "${item.name}" añadido al catálogo de la partida` : `"${item.name}" ya estaba en la partida`,
      '📦'
    );
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

    const remainingTokens = tokens.filter(t => t.id !== token.id);
    setTokens(remainingTokens);
    setGraveyard(prev => [graveEntry, ...prev]);

    const linkedCharId = token.characterId || token.id;
    const stillHasLivingToken = remainingTokens.some(t => String(t.characterId) === String(linkedCharId));
    if (!stillHasLivingToken) {
      setCharacters(prev => prev.filter(c => String(c.id) !== String(linkedCharId)));
    }

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
        if (Array.isArray(d.characters)) {
          archiveEntitiesToCodex(d.characters, { updateExisting: false });
        }
        if (Array.isArray(d.commonItems)) {
          archiveItemsToCodex(d.commonItems, { updateExisting: false });
        }
        saveCampaignSnapshot(d, `Crónica: ${res.filename?.replace('.json', '') || 'Importada'}`);
        showMasterFeedback(`Crónica cargada: ${res.filename}`, '📥');
      } catch (err) {
        console.error('Error al importar crónica:', err);
        showMasterFeedback('Archivo JSON no válido', '⚠️');
      }
    }
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
        <GameBoard
          boardRef={boardRef}
          scale={scale}
          pan={pan}
          isPlayerView={true}
          activeTurnTokenId={activeTurnTokenId}
          fowEnabled={fowEnabled}
          fowVisionRadius={fowVisionRadius}
          fowMemoryEnabled={fowMemoryEnabled}
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
          onPickUpItem={handlePickUpItem}
          isCombatActive={isCombatActive}
          movementLimitsEnabled={movementLimitsEnabled}
          combatGroups={combatGroups}
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
            {tokens.find(t => t.id === activeTurnTokenId && !t.isHidden) && (
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
    <div style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--vtt-bg-deep)' }}>
      <div style={{
        height: '58px',
        background: 'var(--vtt-toolbar-bg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid var(--vtt-toolbar-border)',
        boxShadow: 'var(--vtt-shadow-panel)',
        zIndex: 30
      }}>
        <Toolbar
          scenes={scenes}
          activeSceneId={activeSceneId}
          onSelectScene={handleSelectScene}
          onOpenHome={() => setIsHomeOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(!isSettingsOpen)}
          isSettingsOpen={isSettingsOpen}
          onOpenAppSettings={() => setIsAppSettingsOpen(true)}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onOpenPlayerView={handleOpenPlayerView}
          onOpenHandouts={() => setIsHandoutModalOpen(true)}
          handoutsCount={handouts.length}
          hasActiveHandout={Boolean(activeHandout)}
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
        characters={characters}
        codexEntities={codex.entities}
        codexItems={codex.items}
        graveyard={graveyard}
        onOpenGraveyard={() => {
          setEncyclopediaState({ isOpen: true, category: 'graveyard' });
        }}
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
        onImportCampaign={handleImportCampaign}
        onLoadRecentCampaign={(data) => {
          if (!data) return;
          applyCampaignData(data);
          if (Array.isArray(data.characters)) {
            archiveEntitiesToCodex(data.characters, { updateExisting: false });
          }
          if (Array.isArray(data.commonItems)) {
            archiveItemsToCodex(data.commonItems, { updateExisting: false });
          }
          setIsHomeOpen(false);
          showMasterFeedback('Crónica cargada con éxito', '📖');
        }}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        onOpenAppSettings={() => setIsAppSettingsOpen(true)}
      />

      {/* Vista Independiente: Códice Global (Personajes, Bestiario, Objetos y Cripta) */}
      <EncyclopediaView
        isOpen={encyclopediaState.isOpen}
        initialCategory={encyclopediaState.category}
        characters={codex.entities}
        codexItems={codex.items}
        tableCharacters={characters}
        tableCommonItems={commonItems}
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
        onBringItemToTable={(item) => handleBringCodexItemToTable(item)}
        onDeleteCharacter={(id) => {
          deleteCodexEntity(id);
          showMasterFeedback('Registro eliminado del Códice Global', '🗑️');
        }}
        onDeleteCodexItem={(id) => {
          deleteCodexItem(id);
          showMasterFeedback('Objeto eliminado del Códice Global', '🗑️');
        }}
        onSpawnOnBoard={(char) => {
          handleBringCodexEntityToTable(char, { silent: true });
          setEncyclopediaState(prev => ({ ...prev, isOpen: false }));
          setIsHomeOpen(false);
          handleAddToken(char);
        }}
        onImportCharacters={(list) => {
          archiveEntitiesToCodex(list, { updateExisting: true });
          showMasterFeedback(`Archivados ${list.length} registros en el Códice Global`, '📥');
        }}
        onImportCodexItems={(list) => {
          archiveItemsToCodex(list, { updateExisting: true });
          showMasterFeedback(`Archivados ${list.length} objetos en el Códice Global`, '📥');
        }}
        onExportCharacters={async (entriesToExport, cat) => {
          const defaultName = cat === 'graveyard'
            ? 'registro_bajas_vtt.json'
            : cat === 'item'
            ? 'codex_objetos_vtt.json'
            : cat === 'monster'
            ? 'codex_bestiario_vtt.json'
            : 'codex_personajes_vtt.json';
          const res = await exportJSON(defaultName, entriesToExport);
          if (res?.success) {
            showMasterFeedback(`Códice exportado: ${res.filename}`, '📤');
          }
        }}
        onClearCategory={(cat) => {
          clearCodexCategory(cat);
          showMasterFeedback(
            cat === 'item'
              ? 'Objetos del Códice vaciados'
              : cat === 'monster'
              ? 'Bestiario del Códice vaciado'
              : 'Personajes del Códice vaciados',
            '🗑️'
          );
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
              archiveEntitiesToCodex([savedChar], { updateExisting: true });
              showMasterFeedback(`"${savedChar.name}" inscrito en la mesa y el Códice`, '📜');
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
                    sanityLoss: savedChar.sanityLoss,
                    habitat: savedChar.habitat,
                    creatureNature: savedChar.creatureNature,
                    attacks: savedChar.attacks,
                    history: savedChar.history,
                    notes: savedChar.notes,
                    inventory: savedChar.inventory,
                    spells: savedChar.spells
                  };
                }
                return t;
              }));
              archiveEntitiesToCodex([savedChar], { updateExisting: true });
              showMasterFeedback(`Ficha de "${savedChar.name}" actualizada en mesa y Códice`, '✏️');
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
          codexEntities={codex.entities}
          graveyard={graveyard}
          onBringToTable={(entity) => handleBringCodexEntityToTable(entity)}
          onImportCharacters={(list) => {
            setCharacters(prev => {
              const existingIds = new Set(prev.map(c => String(c.id)));
              const additions = list.filter(c => !existingIds.has(String(c.id)));
              return [...prev, ...additions];
            });
            archiveEntitiesToCodex(list, { updateExisting: false });
            showMasterFeedback(`Importados ${list.length} registros a la mesa y archivados en el Códice`, '📜');
          }}
          onImportCommonItems={handleImportCommonItems}
          onSendToGraveyard={handleSendToGraveyard}
          onStartDragCharacter={handleStartDragCharacter}
          onEndDragCharacter={handleEndDragCharacter}
          onStartDragItem={handleStartDragItem}
          onEndDragItem={handleEndDragItem}
          onStartDragMapElement={handleStartDragMapElement}
          onEndDragMapElement={handleEndDragMapElement}
          onRemoveToken={(id) => setTokens(prev => prev.filter(t => t.id !== id))}
          onEditCharacter={handleEditCharacter}
          onUpdateTokenStats={handleUpdateTokenStats}
          onUpdateTokenSize={handleUpdateTokenSize}
          commonItems={commonItems}
          onGiveItemToCharacter={handleGiveItemToCharacter}
          onOpenTokenSheet={handleOpenTokenSheet}
          onReorderTokens={handleReorderTokens}
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
          onWidthChange={setSidebarWidth}
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
              background: 'var(--vtt-bg-panel-gradient)',
              border: '1px solid var(--vtt-gold)',
              borderRadius: '10px',
              padding: '8px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              color: 'var(--vtt-text-strong)',
              boxShadow: 'var(--vtt-shadow-panel)'
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {pendingTokenSpawn.fromGraveyardId ? <Sparkles size={14} strokeWidth={2.2} style={{ color: 'var(--vtt-accent-amber)' }} /> : <Crosshair size={14} strokeWidth={2.2} style={{ color: 'var(--vtt-accent-amber)' }} />}
              <span>{pendingTokenSpawn.fromGraveyardId ? 'Haz clic en el mapa para situar al resucitado: ' : 'Haz clic en el mapa para invocar a: '}</span>
              <strong style={{ color: 'var(--vtt-accent-amber)' }}>{pendingTokenSpawn.name}</strong>
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
              background: 'var(--vtt-bg-panel-gradient)',
              border: '1px solid var(--vtt-gold)',
              borderRadius: '10px',
              padding: '8px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              color: 'var(--vtt-text-strong)',
              boxShadow: 'var(--vtt-shadow-panel)'
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {pendingMapSpawn.type === 'note' ? (
                <>
                  <ScrollText size={14} strokeWidth={2.2} style={{ color: 'var(--vtt-accent-amber)' }} />
                  Haz clic en el tablero para colocar la pista: <strong style={{ color: 'var(--vtt-accent-amber)' }}>{pendingMapSpawn.title || pendingMapSpawn.name}</strong>
                </>
              ) : (
                <>
                  <Package size={14} strokeWidth={2.2} style={{ color: 'var(--vtt-accent-amber)' }} />
                  Haz clic en el mapa para colocar: <strong style={{ color: 'var(--vtt-accent-amber)' }}>{pendingMapSpawn.name}</strong>
                </>
              )}
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
          livingFogEnabled={livingFogEnabled}
          weatherEffect={weatherEffect}
          ambientTint={ambientTint}
          rulerActive={rulerActive}
          pendingTokenSpawn={pendingTokenSpawn}
          pendingMapSpawn={pendingMapSpawn}
          draggedMapElement={draggedMapElement}
          onMapElementPointerDown={handleMapElementPointerDown}
          onToggleMapElementLock={handleBoardMapElementLockToggle}
          onUpdateMapElement={handleBoardMapElementUpdate}
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
          onUpdateTokenRotation={handleUpdateTokenRotation}
          onToggleTokenStatus={handleToggleTokenStatus}
          onOpenTokenSheet={handleOpenTokenSheet}
          customStatuses={customStatuses}
          rulerMeasure={rulerMeasure}
          holdProgress={holdProgress}
          radialMenu={radialMenu}
          onSelectSpatialSound={handleSelectSpatialSound}
          customSounds={customSounds}
          onToggleDoor={handleToggleDoor}
          onToggleWindow={handleToggleWindow}
          onToggleObject={handleToggleObject}
          onToggleLight={handleToggleLight}
          onSetAllLights={handleSetAllLights}
          handouts={handouts}
          onProjectHandout={handleProjectHandoutWithMode}
          onPickUpItem={handlePickUpItem}
          isCombatActive={isCombatActive}
          movementLimitsEnabled={movementLimitsEnabled}
          combatGroups={combatGroups}
          tokenDragMeasurement={tokenDragMeasurement}
        />

        {/* Dock Central Flotante Inferior - Sistema de Barras Apilables (Estilo Lineage II) */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            bottom: '12px',
            left: `calc(50vw + ${Math.round(sidebarWidth / 2)}px - ${isSettingsOpen ? 240 : 0}px)`,
            transform: 'translateX(-50%)',
            transition: 'left 0.24s cubic-bezier(0.2, 0.8, 0.2, 1)',
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
              width: '100%',
              gap: '8px',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--vtt-dock-bg)',
              padding: '6px 12px',
              borderRadius: '12px',
              border: '1px solid var(--vtt-border)',
              boxShadow: 'var(--vtt-shadow-panel)',
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
                color: isFogDockOpen ? 'var(--vtt-accent-sky)' : 'var(--vtt-text-dim)',
                padding: '4px',
                borderRadius: '4px',
                backgroundColor: isDraggingDock ? 'var(--vtt-accent-sky-bg)' : 'transparent',
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
              style={{ padding: '6px 11px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, gap: '5px', height: '30px', boxSizing: 'border-box' }}
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
              style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, gap: '6px', height: '30px', boxSizing: 'border-box' }}
              title="Abrir Órgano de Ecos y Sonidos Atmosféricos"
            >
              <Volume2 size={13} strokeWidth={2.2} /> <span>Ecos</span>
              {activeLoops.length > 0 && (
                <span style={{ backgroundColor: '#f59e0b', color: '#0f1115', borderRadius: '999px', padding: '1px 5px', fontSize: '9px', fontWeight: 800 }}>
                  {activeLoops.length}
                </span>
              )}
            </button>

            <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--vtt-border-subtle)' }}></div>

            <button
              onClick={() => { setRulerActive(!rulerActive); setFowMode('none'); }}
              className={`vtt-brass-btn ${rulerActive ? 'vtt-btn-active' : ''}`}
              style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, height: '30px', boxSizing: 'border-box' }}
              title="Medir distancia en el mapa (pies, metros y casillas)"
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Ruler size={13} strokeWidth={2.2} /> Regla</span>
            </button>

            <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--vtt-border-subtle)' }}></div>

            {/* Cuadrícula Táctica */}
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`vtt-brass-btn ${snapToGrid ? 'vtt-btn-active' : ''}`}
              style={{
                padding: '5px 9px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
                color: snapToGrid ? 'var(--vtt-accent-green)' : 'var(--vtt-btn-text)',
                borderColor: snapToGrid ? 'var(--vtt-accent-green-border)' : undefined,
                gap: '5px',
                height: '30px',
                boxSizing: 'border-box'
              }}
              title="Ajuste magnético automático de fichas a la cuadrícula (el tamaño se ajusta en Config. → Tablero)"
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

            <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--vtt-border-subtle)' }}></div>

            {/* Atmósfera y Ambiente */}
            <select
              value={weatherEffect}
              onChange={(e) => setWeatherEffect(e.target.value)}
              style={{
                padding: '0 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--vtt-input-bg)',
                color: 'var(--vtt-input-text)',
                border: '1px solid var(--vtt-input-border)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                height: '30px',
                boxSizing: 'border-box'
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
                padding: '0 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--vtt-input-bg)',
                color: 'var(--vtt-input-text)',
                border: '1px solid var(--vtt-input-border)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                height: '30px',
                boxSizing: 'border-box'
              }}
              title="Iluminación ambiental del mapa"
            >
              {AMBIENT_TINTS.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>

            <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--vtt-border-subtle)' }}></div>

            {/* Navegación y Cámara */}
            <button
              onClick={() => { setPan({ x: 0, y: 0 }); setScale(1); }}
              className="vtt-brass-btn"
              style={{ padding: '6px 11px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, height: '30px', boxSizing: 'border-box' }}
              title="Centrar tablero y restablecer zoom al 100%"
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Crosshair size={13} strokeWidth={2.2} /> Centrar</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                const ok = await confirm({
                  title: 'Vaciar mesa por completo',
                  message: 'Se limpiarán el tablero, las fichas en escena, los objetos y la niebla actual. ¿Deseas empezar desde cero?',
                  confirmLabel: 'Vaciar Mesa',
                  tone: 'danger'
                });
                if (ok) handleResetToCleanSlate();
              }}
              className="vtt-brass-btn"
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
                color: 'var(--vtt-text-muted)',
                height: '30px',
                boxSizing: 'border-box'
              }}
              title="Vaciar por completo el tablero, fichas y crónicas para empezar de cero"
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Trash2 size={12} strokeWidth={2.2} /> Vaciar Mesa</span>
            </button>

            <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--vtt-border-subtle)' }}></div>

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
                borderColor: isFogDockOpen ? 'var(--vtt-info)' : 'var(--vtt-border)',
                color: isFogDockOpen ? 'var(--vtt-info)' : 'var(--vtt-text)',
                backgroundColor: isFogDockOpen ? 'rgba(2, 132, 199, 0.22)' : 'var(--vtt-input-bg)',
                transition: 'all 0.15s ease',
                height: '30px',
                boxSizing: 'border-box'
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
                width: '100%',
                gap: '8px',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--vtt-dock-bg)',
                padding: '6px 12px',
                borderRadius: '12px',
                border: '1px solid var(--vtt-border)',
                boxShadow: 'var(--vtt-shadow-panel)',
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
                  color: 'var(--vtt-accent-sky)',
                  padding: '4px',
                  borderRadius: '4px',
                  backgroundColor: isDraggingDock ? 'var(--vtt-accent-sky-bg)' : 'transparent',
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
                  color: fowEnabled ? 'var(--vtt-accent-green-strong)' : 'var(--vtt-accent-red)',
                  borderColor: fowEnabled ? 'var(--vtt-accent-green-border)' : 'var(--vtt-danger-border)',
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
                  color: fowMemoryEnabled ? 'var(--vtt-accent-amber)' : 'var(--vtt-btn-text)',
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
                  color: livingFogEnabled ? 'var(--vtt-accent-sky)' : 'var(--vtt-btn-text)',
                  borderColor: livingFogEnabled ? 'var(--vtt-accent-sky-border)' : 'var(--vtt-btn-border)',
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
                  backgroundColor: livingFogEnabled ? 'var(--vtt-accent-sky)' : 'var(--vtt-text-dim)',
                  boxShadow: livingFogEnabled ? '0 0 6px var(--vtt-accent-sky)' : 'none',
                  display: 'inline-block'
                }} />
                <span>Bruma Viva: {livingFogEnabled ? 'ON' : 'OFF'}</span>
              </button>

              <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--vtt-border-subtle)' }}></div>

              {/* Selector de Modo de Pincel de Niebla */}
              <div style={{
                display: 'flex',
                gap: '3px',
                backgroundColor: 'var(--vtt-bg-inset)',
                padding: '2px',
                borderRadius: '6px',
                border: '1px solid var(--vtt-border)',
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
                    color: fowMode === 'none' ? 'var(--vtt-accent-amber)' : 'var(--vtt-text-muted)',
                    borderColor: fowMode === 'none' ? 'var(--vtt-accent-amber-border)' : 'transparent',
                    background: fowMode === 'none' ? 'var(--vtt-accent-amber-bg)' : 'transparent'
                  }}
                  title="Modo Mover: interactúa con fichas y navega por el tablero normalmente"
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MousePointer2 size={12} strokeWidth={2.2} /> Mover</span>
                </button>
                <button
                  onClick={() => { setFowMode('reveal'); setRulerActive(false); }}
                  className={`vtt-brass-btn ${fowMode === 'reveal' ? 'vtt-btn-active' : ''}`}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: fowMode === 'reveal' ? 'var(--vtt-accent-green-strong)' : 'var(--vtt-text-muted)',
                    borderColor: fowMode === 'reveal' ? 'var(--vtt-accent-green-border)' : 'transparent',
                    background: fowMode === 'reveal' ? 'var(--vtt-accent-green-bg)' : 'transparent'
                  }}
                  title="Pincel Despejar: arrastra sobre el mapa para desvelar zonas a los jugadores"
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Eye size={12} strokeWidth={2.2} /> Despejar</span>
                </button>
                <button
                  onClick={() => { setFowMode('hide'); setRulerActive(false); }}
                  className={`vtt-brass-btn ${fowMode === 'hide' ? 'vtt-btn-active' : ''}`}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: fowMode === 'hide' ? 'var(--vtt-accent-red)' : 'var(--vtt-text-muted)',
                    borderColor: fowMode === 'hide' ? 'var(--vtt-danger-border)' : 'transparent',
                    background: fowMode === 'hide' ? 'var(--vtt-accent-red-bg)' : 'transparent'
                  }}
                  title="Pincel Cubrir: arrastra sobre el mapa para volver a ocultar zonas en la niebla"
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><EyeOff size={12} strokeWidth={2.2} /> Cubrir</span>
                </button>
              </div>

              {/* Slider de Tamaño de Pincel */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--vtt-text-muted)', fontWeight: 600 }}>
                  Pincel: <strong style={{ color: 'var(--vtt-text-strong)' }}>{fowBrushSize}px</strong>
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

              <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--vtt-border-subtle)' }}></div>

              {/* Slider Radio de Visión de Héroes */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--vtt-text-muted)', fontWeight: 600 }}>
                  Visión: <strong style={{ color: 'var(--vtt-text-strong)' }}>{fowVisionRadius}px</strong>
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
          isSettingsOpen={isSettingsOpen}
        />
        
        <DiceRoller 
          isOpen={isDiceOpen} 
          onClose={() => setIsDiceOpen(false)} 
          onPublicRoll={handleTriggerPublicRoll} 
          onHiddenRoll={handleTriggerHiddenRoll} 
          incomingResult={incomingRollResult}
          isSettingsOpen={isSettingsOpen}
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
        customStatuses={customStatuses}
        onAddCustomStatus={(newSt) => setCustomStatuses(prev => [...prev, newSt])}
        onRemoveCustomStatus={(id) => setCustomStatuses(prev => prev.filter(s => s.id !== id))}
        onImportCampaign={handleImportCampaign}
        openMapCreator={handleOpenMapCreator}
        scenes={scenes}
        activeSceneId={activeSceneId}
        onSelectScene={handleSelectScene}
        onCreateNewScene={handleCreateNewScene}
        onRenameScene={handleRenameScene}
        onDeleteScene={handleDeleteScene}
        onDeleteAllScenes={handleDeleteAllScenes}
        onMoveSceneOrder={handleMoveSceneOrder}
        onReorderScenes={handleReorderScenes}
        tokens={tokens}
        maps={maps}
        activeTurnTokenId={activeTurnTokenId}
        commonItems={commonItems}
        onGiveItemToCharacter={handleGiveItemToCharacter}
        onSaveCommonItem={handleSaveCommonItem}
        onDeleteCommonItem={handleDeleteCommonItem}
        onPlaceGroundItem={handleStartPlaceGroundItem}
        onTransferItem={handleTransferItemBetweenCharacters}
        onSaveAdventure={handleSaveAdventure}
        onConcludeAdventure={handleConcludeAdventure}
        onStartPlaceClue={handleStartPlaceClue}
        onUpdateBoardClue={handleUpdateBoardClue}
        onRemoveBoardClue={handleRemoveBoardClue}
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
              try { c.remove(); } catch { /* ignore */ }
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
              try { c.remove(); } catch { /* ignore */ }
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
        onProjectHandout={handleProjectHandoutWithMode}
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
        onProjectHandout={handleProjectHandoutWithMode}
        isImageFullscreen={handoutImageFullscreen}
        onToggleImageFullscreen={handleToggleHandoutFullscreen}
      />

      {/* Configuración Global de la Aplicación */}
      <AppSettingsModal
        isOpen={isAppSettingsOpen}
        onClose={() => setIsAppSettingsOpen(false)}
        onManualSaveCampaign={async () => {
          const ok = await saveCampaignToDB(campaignDbPayload);
          showMasterFeedback(ok ? 'Sesión guardada en IndexedDB' : 'Error al guardar sesión');
        }}
      />
    </div>
  );
}

export default App;