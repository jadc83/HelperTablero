import { SOUND_CATALOG } from '../constants/gamePresets';
import { saveCampaignToDB, clearActiveCampaignDB, exportCampaignJSON, saveCampaignSnapshot } from '../utils/campaignStorage';
import { exportJSON } from '../utils/fileDialog';
import { playerSoundEngine } from '../utils/soundEngine';
import { useAppSettings } from './useAppSettings';

/**
 * Hook para gestión de escenas, proyecciones, audio espacial, tiradas 3D
 * y guardado/conclusión/exportación de campaña.
 */
export function useSceneAndCampaignActions({
  scenes,
  setScenes,
  activeSceneId,
  setActiveSceneId,
  maps,
  setMaps,
  tokens,
  setTokens,
  fowActions,
  setFowActions,
  weatherEffect,
  setWeatherEffect,
  ambientTint,
  setAmbientTint,
  isCombatActive,
  setIsCombatActive,
  combatRound,
  setCombatRound,
  activeTurnTokenId,
  setActiveTurnTokenId,
  combatGroups,
  setCombatGroups,
  characters,
  setCharacters,
  graveyard,
  setGraveyard,
  handouts,
  setHandouts,
  activeHandout,
  setActiveHandout,
  customObjects,
  setCustomObjects,
  customSounds,
  setCustomSounds,
  commonItems,
  setCommonItems,
  sceneNotes,
  setSceneNotes,
  campaignNotes,
  setCampaignNotes,
  fowEnabled,
  setFowEnabled,
  fowBrushSize,
  setFowBrushSize,
  fowVisionRadius,
  setFowVisionRadius,
  fowMemoryEnabled,
  setFowMemoryEnabled,
  snapToGrid,
  setSnapToGrid,
  gridSize,
  setGridSize,
  customStatuses,
  setCustomStatuses,
  activeLoops,
  setActiveLoops,
  radialMenu,
  setRadialMenu,
  setPan,
  setScale,
  setMapCreatorSceneId,
  setIsMapCreatorOpen,
  setMaster3DRoll,
  setWaitingForPlayerRoll,
  isSwitchingSceneRef,
  lastPlayerPingRef,
  postSyncMessage,
  showMasterFeedback
}) {
  const { settings } = useAppSettings();

  const syncLiveSceneIntoList = (sceneList) => (
    sceneList.map((sc) =>
      sc.id === activeSceneId
        ? {
            ...sc,
            maps,
            tokens,
            fowActions,
            weatherEffect,
            ambientTint,
            isCombatActive,
            combatRound,
            activeTurnTokenId,
            combatGroups
          }
        : sc
    )
  );

  const loadSceneIntoLiveState = (target) => {
    setActiveSceneId(target.id);
    setMaps(target.maps || []);
    setTokens(target.tokens || []);
    setFowActions(target.fowActions || []);
    setWeatherEffect(target.weatherEffect || 'none');
    setAmbientTint(target.ambientTint || 'none');
    setIsCombatActive(Boolean(target.isCombatActive));
    setCombatRound(target.combatRound || 1);
    setActiveTurnTokenId(target.activeTurnTokenId || null);
    setCombatGroups(Array.isArray(target.combatGroups) ? target.combatGroups : []);
  };

  const runWithSceneSwitchLock = (fn) => {
    isSwitchingSceneRef.current = true;
    fn();
    setTimeout(() => {
      isSwitchingSceneRef.current = false;
    }, 120);
  };

  const handleSelectScene = (targetSceneId) => {
    const target = scenes.find((sc) => sc.id === targetSceneId);
    if (!target) return;

    setScenes((prev) => syncLiveSceneIntoList(prev));
    runWithSceneSwitchLock(() => {
      loadSceneIntoLiveState(target);
      setPan({ x: 0, y: 0 });
    });
    showMasterFeedback(`Escena activa: ${target.name}`);
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
      ambientTint: 'none',
      isCombatActive: false,
      combatRound: 1,
      activeTurnTokenId: null,
      combatGroups: []
    };
    runWithSceneSwitchLock(() => {
      setScenes((prev) => [...syncLiveSceneIntoList(prev), newSceneObj]);
      loadSceneIntoLiveState(newSceneObj);
      setPan({ x: 0, y: 0 });
    });
    showMasterFeedback(`Nueva escena creada: ${sceneName}`);
  };

  const handleRenameScene = (sceneId, newName) => {
    if (!newName || !newName.trim()) return;
    setScenes((prev) => prev.map((sc) => (sc.id === sceneId ? { ...sc, name: newName.trim() } : sc)));
    showMasterFeedback(`Escena renombrada a "${newName.trim()}"`);
  };

  const handleDeleteScene = (sceneIdToDelete) => {
    const remaining = scenes.filter((sc) => sc.id !== sceneIdToDelete);
    if (remaining.length === 0) {
      const blankScene = {
        id: `scene_${Date.now()}`,
        name: 'Escena 1',
        maps: [],
        tokens: [],
        fowActions: [],
        weatherEffect: 'none',
        ambientTint: 'none'
      };
      runWithSceneSwitchLock(() => {
        setScenes([blankScene]);
        loadSceneIntoLiveState(blankScene);
      });
      showMasterFeedback('Escena eliminada (Tablero reiniciado)');
      return;
    }

    setScenes(remaining);
    if (activeSceneId === sceneIdToDelete) {
      const next = remaining[0];
      runWithSceneSwitchLock(() => {
        loadSceneIntoLiveState(next);
      });
    }
    showMasterFeedback('Escena eliminada');
  };

  const handleDeleteAllScenes = () => {
    const blankScene = {
      id: `scene_${Date.now()}`,
      name: 'Escena 1',
      maps: [],
      tokens: [],
      fowActions: [],
      weatherEffect: 'none',
      ambientTint: 'none'
    };
    runWithSceneSwitchLock(() => {
      setScenes([blankScene]);
      loadSceneIntoLiveState(blankScene);
    });
    showMasterFeedback('Todas las escenas han sido eliminadas');
  };

  const handleProjectHandout = (handoutObj) => {
    setActiveHandout(handoutObj);
    showMasterFeedback(handoutObj ? `Proyectando: ${handoutObj.title}` : 'Proyección cerrada');
  };

  const handleTriggerSound = (soundOrId) => {
    const soundObj = typeof soundOrId === 'object'
      ? soundOrId
      : [...SOUND_CATALOG, ...customSounds].find(s => s.id === soundOrId) || { id: soundOrId, label: 'Efecto', icon: '🔊' };

    postSyncMessage({ type: 'SOUND_PLAY', payload: soundObj });
    if (settings.playAudioOnMaster) {
      playerSoundEngine.play(soundObj);
    }

    if (soundObj.loop || String(soundObj.id).startsWith('amb_')) {
      const isAlreadyActive = activeLoops.includes(soundObj.id);
      const nextLoops = isAlreadyActive
        ? activeLoops.filter(item => item !== soundObj.id)
        : [...activeLoops, soundObj.id];
      setActiveLoops(nextLoops);
      showMasterFeedback(isAlreadyActive ? `Detenido: ${soundObj.label}` : `Ambiente: ${soundObj.label}`);
    } else {
      showMasterFeedback(soundObj.label);
    }
  };

  const handleStopAllSounds = () => {
    postSyncMessage({ type: 'SOUND_STOP_ALL' });
    playerSoundEngine.stopAll();
    setActiveLoops([]);
    showMasterFeedback('Ecos silenciados');
  };

  const handleSelectSpatialSound = (soundObj) => {
    if (!radialMenu) return;

    if (soundObj) {
      postSyncMessage({ type: 'SOUND_PLAY', payload: soundObj });
      if (settings.playAudioOnMaster) {
        playerSoundEngine.play(soundObj);
      }
      showMasterFeedback(`${soundObj.label} (en el mapa)`);
    }
    setRadialMenu(null);
  };

  const clearExistingDiceCanvases = () => {
    document.querySelectorAll('.dice-box-canvas').forEach(c => {
      try { c.remove(); } catch { /* ignore */ }
    });
  };

  const handleTriggerPublicRoll = (rollReq) => {
    clearExistingDiceCanvases();
    const isPlayerViewConnected = (Date.now() - lastPlayerPingRef.current) < 6500;
    const sendToPlayers = settings.dicePublicTarget !== 'local_master' && isPlayerViewConnected;

    if (sendToPlayers) {
      postSyncMessage({ type: 'TRIGGER_3D_ROLL', payload: rollReq });
      setWaitingForPlayerRoll(true);
      showMasterFeedback(`Lanzando ${rollReq.formula} en Pantalla de Jugadores...`);
    } else {
      setMaster3DRoll(rollReq);
      showMasterFeedback(`Lanzando ${rollReq.formula}...`);
    }
  };

  const handleTriggerHiddenRoll = (rollReq) => {
    clearExistingDiceCanvases();
    setMaster3DRoll(rollReq);
    showMasterFeedback(`Tirada oculta: ${rollReq.formula}`);
  };

  const handleUpdateSceneNotes = (sceneId, notesObj) => {
    setSceneNotes(prev => ({ ...prev, [sceneId]: notesObj }));
  };

  const handleResetToCleanSlate = () => {
    const defaultScene = {
      id: 'scene_default',
      name: 'Escena 1',
      maps: [],
      tokens: [],
      fowActions: [],
      weatherEffect: 'none',
      ambientTint: 'none'
    };
    runWithSceneSwitchLock(() => {
      setCharacters([]);
      setGraveyard([]);
      setHandouts([]);
      setActiveHandout(null);
      setCustomObjects([]);
      setCustomSounds([]);
      setSceneNotes({});
      setCampaignNotes('');
      setScenes([defaultScene]);
      loadSceneIntoLiveState(defaultScene);
      setPan({ x: 0, y: 0 });
      setScale(1);
    });
    showMasterFeedback('Mesa y crónica vaciadas por completo');
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

  const buildCampaignPayload = (extraFields = {}) => {
    const syncedScenes = syncLiveSceneIntoList(scenes);
    return {
      ...extraFields,
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
  };

  const handleSaveAdventure = async (adventureName, shouldExportFile = true) => {
    const syncedScenes = syncLiveSceneIntoList(scenes);
    const activeScene = syncedScenes.find(sc => sc.id === activeSceneId) || syncedScenes[0];
    const advTitle = adventureName?.trim() || (activeScene ? `Aventura: ${activeScene.name}` : 'Aventura de Campaña');
    const payload = buildCampaignPayload({ adventureName: advTitle });

    try {
      await saveCampaignSnapshot(payload, advTitle);
    } catch (err) {
      console.warn('Error guardando snapshot:', err);
    }

    let fileResult = null;
    if (shouldExportFile) {
      const safeTitle = advTitle.toLowerCase().replace(/[^a-z0-9]/gi, '_');
      const filename = `aventura_${safeTitle}_${new Date().toISOString().slice(0, 10)}.json`;
      fileResult = await exportJSON(filename, payload);
    }

    showMasterFeedback(`Aventura guardada: ${advTitle}`);
    return fileResult || { success: true };
  };

  const handleConcludeAdventure = async (adventureName, shouldExportFile = true) => {
    const syncedScenes = syncLiveSceneIntoList(scenes);
    const activeScene = syncedScenes.find(sc => sc.id === activeSceneId) || syncedScenes[0];
    const advTitle = adventureName?.trim() || (activeScene ? `${activeScene.name} (Concluida)` : 'Crónica Concluida');
    const payload = buildCampaignPayload({
      adventureName: advTitle,
      isConcluded: true,
      concludedAt: new Date().toISOString()
    });

    try {
      await saveCampaignSnapshot(payload, advTitle, true);
    } catch (err) {
      console.warn('Error archivando snapshot concluido:', err);
    }

    let fileResult = null;
    if (shouldExportFile) {
      const safeTitle = advTitle.toLowerCase().replace(/[^a-z0-9]/gi, '_');
      const filename = `cronica_concluida_${safeTitle}_${new Date().toISOString().slice(0, 10)}.json`;
      fileResult = await exportJSON(filename, payload);
    }

    await clearActiveCampaignDB();
    handleResetToCleanSlate();
    showMasterFeedback(`Crónica concluida y archivada: "${advTitle}". Mesa despejada.`);
    return fileResult || { success: true };
  };

  const handleExportCampaign = async () => {
    const res = await exportCampaignJSON(buildCampaignPayload());
    if (res?.success) {
      showMasterFeedback(`Crónica guardada: ${res.filename}`);
    } else if (res && !res.cancelled) {
      showMasterFeedback('Error al exportar crónica');
    }
  };

  return {
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
    handleConcludeAdventure,
    handleExportCampaign
  };
}
