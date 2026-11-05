import React, { useState, useRef } from 'react';
import { OBJECT_PRESETS, LIGHT_PRESETS } from './MapCreator';
import { exportJSON, importJSON } from '../utils/fileDialog';
import { ITEM_CATEGORIES, POPULAR_ITEM_ICONS } from '../constants/commonItems';

const SettingsDrawer = ({ 
  isOpen, onClose, characters = [], onSaveCharacter, onImportCharacters,
  onAddToken, onRemoveCharacter, onOpenCharacterCreator, onEditCharacter,
  customStatuses = [], onAddCustomStatus, onRemoveCustomStatus,
  onExportCampaign, onImportCampaign,
  fowEnabled, setFowEnabled, fowBrushSize, setFowBrushSize, fowVisionRadius, setFowVisionRadius,
  fowMemoryEnabled = true, setFowMemoryEnabled, fowAutoHideEnemies = true, setFowAutoHideEnemies,
  onResetFow, fowMode, setFowMode,
  snapToGrid, setSnapToGrid, gridSize = 50, setGridSize,
  openMapCreator,
  maps = [], onAddMapElement, onToggleMapElementState, onRemoveMapElement, onClearAllMaps,
  scenes = [], activeSceneId = null, onSelectScene, onCreateNewScene, onRenameScene, onDeleteScene,
  onDeleteAllScenes,
  onMoveSceneOrder, onReorderScenes,
  handouts = [], activeHandout = null, onAddHandout, onRemoveHandout, onProjectHandout,
  customObjects = [], onSaveCustomObject, onDeleteCustomObject, onInspectObject,
  tokens = [], activeTurnTokenId = null,
  commonItems = [], onGiveItemToCharacter, onSaveCommonItem, onDeleteCommonItem, onPlaceGroundItem,
  onSaveAdventure
}) => {
  const [activeTab, setActiveTab] = useState('escenario');
  const [bestiarySubTab, setBestiarySubTab] = useState('characters'); // 'characters' | 'statuses'
  const [statusMessage, setStatusMessage] = useState(null);
  const [confirmClearMaps, setConfirmClearMaps] = useState(false);
  const [confirmDeleteAllScenes, setConfirmDeleteAllScenes] = useState(false);

  // Estados para Guardar Aventura Completa
  const [isSaveAdventureModalOpen, setIsSaveAdventureModalOpen] = useState(false);
  const [adventureNameInput, setAdventureNameInput] = useState('');
  const [exportJsonFile, setExportJsonFile] = useState(true);
  const [isSavingAdventure, setIsSavingAdventure] = useState(false);

  const handleOpenSaveAdventureModal = () => {
    const cur = scenes.find(s => s.id === activeSceneId) || scenes[0];
    setAdventureNameInput(cur?.name ? `Crónica: ${cur.name}` : 'Mi Aventura');
    setIsSaveAdventureModalOpen(true);
  };

  const handleConfirmSaveAdventure = async () => {
    if (!onSaveAdventure) return;
    setIsSavingAdventure(true);
    try {
      await onSaveAdventure(adventureNameInput.trim() || 'Aventura de Campaña', exportJsonFile);
      notify('¡Aventura guardada exitosamente!');
      setIsSaveAdventureModalOpen(false);
    } catch (err) {
      console.error('Error al guardar aventura:', err);
      notify('Error al guardar la aventura');
    } finally {
      setIsSavingAdventure(false);
    }
  };

  // Estados para Escenas y Drag & Drop
  const [newSceneTitle, setNewSceneTitle] = useState('');
  const [draggedSceneIndex, setDraggedSceneIndex] = useState(null);
  const [dragOverSceneIndex, setDragOverSceneIndex] = useState(null);
  const [editingSceneId, setEditingSceneId] = useState(null);
  const [editingSceneName, setEditingSceneName] = useState('');

  const handleStartRename = (sc) => {
    setEditingSceneId(sc.id);
    setEditingSceneName(sc.name);
  };

  const handleSaveRename = (sceneId) => {
    if (editingSceneName.trim() && onRenameScene) {
      onRenameScene(sceneId, editingSceneName.trim());
      notify('Escena renombrada');
    }
    setEditingSceneId(null);
  };

  // Estados para Ilustraciones (Handouts)
  const [handoutTitle, setHandoutTitle] = useState('');
  const handoutFileInputRef = useRef(null);

  // Estados para Bestiario
  const [charName, setCharName] = useState('');
  const [charColor, setCharColor] = useState('#b45309');
  const [charFaction, setCharFaction] = useState('ally');
  const [charAvatar, setCharAvatar] = useState('');
  const charInputRef = useRef(null);
  const charAvatarInputRef = useRef(null);

  // Estados para Creador de Objetos y Estructuras
  const [objectsSubTab, setObjectsSubTab] = useState('creator'); // 'creator' | 'scene' | 'catalog'
  const [objCategory, setObjCategory] = useState('object'); // 'object' | 'light' | 'door' | 'window'
  const [objName, setObjName] = useState('Cofre Antiguo');
  const [objIcon, setObjIcon] = useState('📦');
  const [objOpenIcon, setObjOpenIcon] = useState('🪙');
  const [objWidth, setObjWidth] = useState(48);
  const [objHeight, setObjHeight] = useState(48);
  const [objBlocksMove, setObjBlocksMove] = useState(true);
  const [objBlocksVision, setObjBlocksVision] = useState(false);
  const [objNotes, setObjNotes] = useState('');
  const [lightRadius, setLightRadius] = useState(220);
  const [lightColor, setLightColor] = useState('#f59e0b');

  const POPULAR_OBJECT_ICONS = ['📦', '🪙', '⚰️', '🪞', '🪦', '🏺', '🪤', '🗝️', '📜', '🔮', '🗡️', '🩸', '⚙️', '🚪', '🪟', '🕯️', '🔥', '🏮'];
  const POPULAR_OPEN_ICONS = ['🪙', '🔓', '💥', '⚰️', '💨', '💀', '✨'];

  // Estados para Objetos de Inventario y Equipo Común (Loot / Pertenencias)
  const [itemsSubTab, setItemsSubTab] = useState('catalog'); // 'catalog' | 'creator'
  const [commonItemName, setCommonItemName] = useState('');
  const [commonItemIcon, setCommonItemIcon] = useState('🚬');
  const [commonItemCategory, setCommonItemCategory] = useState('Herramienta');
  const [commonItemState, setCommonItemState] = useState('equipped');
  const [commonItemNotes, setCommonItemNotes] = useState('');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');

  // Estados para Condiciones
  const [statusIcon, setStatusIcon] = useState('🩸');
  const [statusLabel, setStatusLabel] = useState('');
  const [statusEffect, setStatusEffect] = useState('none');
  const statusIconInputRef = useRef(null);

  const PRESET_ICONS = ['🩸', '🤢', '💫', '🔥', '🛡️', '⚔️', '👁️', '🕸️', '❄️', '💤', '💀', '🎯', '💔', '⚡'];

  const notify = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleHandoutImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const title = handoutTitle.trim() || file.name.replace(/\.[^/.]+$/, '');
      const newHandout = {
        id: `handout_${Date.now()}`,
        type: 'image',
        title,
        src: event.target.result
      };
      if (onAddHandout) onAddHandout(newHandout);
      setHandoutTitle('');
      notify(`Ilustración "${title}" lista para proyectar`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 256, 256);
        setCharAvatar(canvas.toDataURL('image/webp', 0.85));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCharacterSubmit = (e) => {
    e.preventDefault();
    if (!charName.trim()) return;
    onSaveCharacter({
      id: Date.now(),
      name: charName.trim(),
      color: charColor,
      faction: charFaction,
      avatar: charAvatar || null
    });
    setCharName('');
    setCharAvatar('');
    notify('Personaje añadido al Bestiario');
  };

  const handlePlaceNewObject = (e) => {
    if (e) e.preventDefault();
    if (!onAddMapElement) return;

    let newEl = null;
    if (objCategory === 'object') {
      newEl = {
        id: Date.now() + Math.random(),
        type: 'object',
        name: objName.trim() || 'Objeto',
        icon: objIcon || '📦',
        openIcon: objOpenIcon || '🪙',
        width: Number(objWidth) || 48,
        height: Number(objHeight) || 48,
        isOpen: false,
        blocksMovement: objBlocksMove,
        blocksVision: objBlocksVision,
        notes: objNotes.trim(),
        isHidden: false,
        isLocked: false
      };
    } else if (objCategory === 'light') {
      newEl = {
        id: Date.now() + Math.random(),
        type: 'light',
        name: objName.trim() || 'Fuente de Luz',
        icon: objIcon || '🔥',
        width: 38,
        height: 38,
        radius: Number(lightRadius) || 220,
        color: lightColor,
        isOn: true,
        isLocked: false
      };
    } else if (objCategory === 'door') {
      newEl = {
        id: Date.now() + Math.random(),
        type: 'door',
        name: objName.trim() || 'Puerta',
        width: Number(objWidth) || 60,
        height: Number(objHeight) || 16,
        isOpen: false,
        isLocked: false
      };
    } else if (objCategory === 'window') {
      newEl = {
        id: Date.now() + Math.random(),
        type: 'window',
        name: objName.trim() || 'Ventana',
        width: Number(objWidth) || 60,
        height: Number(objHeight) || 14,
        isOpen: false,
        isBroken: false,
        isLocked: false
      };
    }

    if (newEl) {
      onAddMapElement(newEl);
      notify(`Haz clic en el mapa para colocar "${newEl.name}"`);
      onClose();
    }
  };

  const handleSaveToCatalog = (e) => {
    if (e) e.preventDefault();
    if (!onSaveCustomObject) return;

    const catalogItem = {
      id: 'custom_obj_' + Date.now(),
      presetId: 'custom_' + Date.now(),
      type: objCategory,
      label: objName.trim() || (objCategory === 'light' ? 'Luz' : objCategory === 'door' ? 'Puerta' : 'Objeto'),
      name: objName.trim() || (objCategory === 'light' ? 'Luz' : objCategory === 'door' ? 'Puerta' : 'Objeto'),
      icon: objIcon,
      openIcon: objOpenIcon,
      width: Number(objWidth) || 48,
      height: Number(objHeight) || 48,
      blocksMovement: objBlocksMove,
      blocksVision: objBlocksVision,
      radius: Number(lightRadius) || 220,
      color: lightColor,
      notes: objNotes.trim()
    };

    onSaveCustomObject(catalogItem);
    notify(`Plantilla "${catalogItem.name}" guardada en el catálogo`);
  };

  const handleStatusIconUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 64, 64);
        setStatusIcon(canvas.toDataURL('image/webp', 0.85));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleStatusSubmit = (e) => {
    e.preventDefault();
    if (!statusLabel.trim() || !statusIcon.trim()) return;
    onAddCustomStatus({
      id: `custom_${Date.now()}`,
      icon: statusIcon.trim(),
      label: statusLabel.trim(),
      effect: statusEffect
    });
    setStatusLabel('');
    notify('Condición añadida');
  };

  const TABS = [
    { id: 'escenario', label: 'Escenas' },
    { id: 'niebla', label: 'Niebla & Luz' },
    { id: 'bestiario', label: 'Seres' },
    { id: 'decorado', label: 'Decorado' },
    { id: 'items', label: 'Objetos & Loot' },
    { id: 'proyector', label: 'Proyector' },
    { id: 'campana', label: 'Guardar/Cargar' }
  ];

  const interactiveItemsOnBoard = maps.filter(
    el => el.type === 'object' || el.type === 'light' || el.type === 'door' || el.type === 'window'
  );

  return (
    <div style={{
      position: 'fixed',
      top: '58px',
      right: isOpen ? '0' : '-500px',
      width: '490px',
      bottom: '0',
      transition: 'right 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
      zIndex: 4500,
      background: 'linear-gradient(180deg, #141822 0%, #0d1017 100%)',
      borderLeft: '1px solid #2e3546',
      boxShadow: isOpen ? '-14px 0 40px rgba(0,0,0,0.9)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      color: '#e2e8f0',
      overflow: 'hidden'
    }}>
      {/* Cabecera Superior Moderna */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 18px',
        backgroundImage: 'linear-gradient(180deg, rgba(16, 19, 27, 0.72) 0%, rgba(13, 16, 23, 0.92) 100%), url("/assets/textures/grimoire_leather_header.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderBottom: '1px solid #262c3a',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="vtt-gothic-title" style={{ fontSize: '15px', fontWeight: 'bold', color: '#f8fafc', letterSpacing: '0.04em' }}>
            CENTRO DE MANDO
          </span>
        </div>
        <button
          onClick={onClose}
          className="vtt-brass-btn"
          style={{ padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
        >
          ✕ Cerrar
        </button>
      </div>

      {/* Navegación en Píldoras Modernas y Espaciosas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
        gap: '6px',
        padding: '8px 12px',
        background: '#0c0f16',
        borderBottom: '1px solid #242c3d'
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                backgroundColor: isActive ? '#2a1a08' : '#141824',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.32) 0%, rgba(180, 83, 9, 0.45) 100%)'
                  : '#141824',
                border: isActive ? '1.5px solid #f59e0b' : '1px solid #252e42',
                color: isActive ? '#fbbf24' : '#94a3b8',
                fontSize: '11px',
                fontWeight: isActive ? 800 : 600,
                boxShadow: isActive ? '0 2px 10px rgba(245, 158, 11, 0.25), inset 0 0 8px rgba(245, 158, 11, 0.12)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Indicador de Sección Activa Muy Claro */}
      <div style={{
        padding: '6px 16px',
        background: '#111520',
        borderBottom: '1px solid #242c3d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }} />
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fbbf24' }}>
            SECCIÓN: {TABS.find(t => t.id === activeTab)?.label}
          </span>
        </div>
      </div>

      {/* Cuerpo Compacto */}
      <div style={{ flex: 1, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
        {statusMessage && (
          <div style={{
            padding: '7px 12px',
            backgroundColor: '#261810',
            border: '1px solid #d4af37',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#fbbf24',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            {statusMessage}
          </div>
        )}

        {/* PESTAÑA 1: GESTOR DE ESCENAS, PLANOS Y REJILLA */}
        {activeTab === 'escenario' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflow: 'hidden' }}>
            {/* Gestor de Múltiples Escenas / Pisos */}
            <div className="vtt-wood-panel" style={{ padding: '12px 14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflow: 'hidden' }}>
              <div className="vtt-gothic-title" style={{ fontSize: '13px', color: '#d4af37', fontWeight: 'bold' }}>
                Selector de Escenas y Planos ({scenes.length})
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newSceneTitle.trim() || !onCreateNewScene) return;
                  onCreateNewScene(newSceneTitle.trim());
                  setNewSceneTitle('');
                  notify('Nueva escena creada y activada');
                }}
                style={{ display: 'flex', gap: '6px' }}
              >
                <input
                  type="text"
                  value={newSceneTitle}
                  onChange={(e) => setNewSceneTitle(e.target.value)}
                  placeholder="Nombre de nueva escena (ej. Cripta Piso 2)..."
                  style={{ flex: 1, padding: '6px 8px', backgroundColor: '#120b07', color: '#f3e5ab', border: '1px solid #8a6d3b', borderRadius: '4px', fontSize: '12px' }}
                />
                <button type="submit" className="vtt-brass-btn" style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', borderColor: '#fbbf24' }}>
                  + Crear Escena
                </button>
              </form>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {scenes.map((sc, idx) => {
                  const isCurrent = sc.id === activeSceneId;
                  const isDragOver = dragOverSceneIndex === idx && draggedSceneIndex !== idx;
                  return (
                    <div
                      key={sc.id}
                      draggable={editingSceneId !== sc.id}
                      onClick={() => {
                        if (editingSceneId === sc.id) return;
                        if (!isCurrent && onSelectScene) {
                          onSelectScene(sc.id);
                        }
                      }}
                      onDragStart={(e) => {
                        if (editingSceneId === sc.id) {
                          e.preventDefault();
                          return;
                        }
                        setDraggedSceneIndex(idx);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverSceneIndex !== idx) setDragOverSceneIndex(idx);
                      }}
                      onDragLeave={() => {
                        if (dragOverSceneIndex === idx) setDragOverSceneIndex(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedSceneIndex !== null && draggedSceneIndex !== idx && onReorderScenes) {
                          onReorderScenes(draggedSceneIndex, idx);
                          notify('Orden de escenas actualizado');
                        }
                        setDraggedSceneIndex(null);
                        setDragOverSceneIndex(null);
                      }}
                      onDragEnd={() => {
                        setDraggedSceneIndex(null);
                        setDragOverSceneIndex(null);
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrent && editingSceneId !== sc.id) {
                          e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.45)';
                          e.currentTarget.style.backgroundColor = '#181e2b';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrent && editingSceneId !== sc.id) {
                          e.currentTarget.style.borderColor = '#283144';
                          e.currentTarget.style.backgroundColor = '#141822';
                        }
                      }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        backgroundColor: isCurrent ? '#2a1a08' : '#141822',
                        background: isCurrent
                          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.32) 0%, rgba(180, 83, 9, 0.45) 100%)'
                          : '#141822',
                        border: isDragOver
                          ? '2px dashed #38bdf8'
                          : isCurrent
                          ? '1.5px solid #f59e0b'
                          : '1px solid #283144',
                        boxShadow: isCurrent ? '0 3px 12px rgba(245, 158, 11, 0.25), inset 0 0 10px rgba(245, 158, 11, 0.12)' : 'none',
                        fontSize: '12px',
                        cursor: editingSceneId === sc.id ? 'default' : isCurrent ? 'default' : 'pointer',
                        opacity: draggedSceneIndex === idx ? 0.5 : 1,
                        transition: 'all 0.15s ease'
                      }}
                      title={
                        editingSceneId === sc.id
                          ? ''
                          : isCurrent
                          ? 'Escena activa (arrastra para reordenar)'
                          : 'Haz clic para activar esta escena'
                      }
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <span style={{ color: isCurrent ? '#f59e0b' : '#64748b', fontSize: '14px', cursor: editingSceneId === sc.id ? 'default' : 'grab', userSelect: 'none' }} title="Arrastrar escena">
                          ⠿
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {editingSceneId === sc.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                                <span style={{ fontWeight: 800, color: '#f59e0b', fontSize: '11px' }}>
                                  {idx + 1}.
                                </span>
                                <input
                                  type="text"
                                  value={editingSceneName}
                                  onChange={(e) => setEditingSceneName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSaveRename(sc.id);
                                    } else if (e.key === 'Escape') {
                                      setEditingSceneId(null);
                                    }
                                  }}
                                  autoFocus
                                  style={{
                                    padding: '2px 6px',
                                    fontSize: '11px',
                                    backgroundColor: '#0c0f17',
                                    color: '#f8fafc',
                                    border: '1px solid #f59e0b',
                                    borderRadius: '4px',
                                    outline: 'none',
                                    maxWidth: '135px'
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveRename(sc.id)}
                                  style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '13px', padding: '0 2px' }}
                                  title="Guardar nombre"
                                >
                                  ✓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSceneId(null)}
                                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px', padding: '0 2px' }}
                                  title="Cancelar"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <>
                                <span 
                                  onDoubleClick={() => handleStartRename(sc)}
                                  style={{ fontWeight: 800, color: isCurrent ? '#ffffff' : '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', cursor: 'pointer' }}
                                  title="Doble clic para cambiar nombre"
                                >
                                  {idx + 1}. {sc.name}
                                </span>
                                {onRenameScene && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartRename(sc);
                                    }}
                                    style={{ background: 'none', border: 'none', color: isCurrent ? '#fef08a' : '#94a3b8', cursor: 'pointer', fontSize: '11px', padding: '0 2px', opacity: 0.8 }}
                                    title="Cambiar nombre a la escena"
                                  >
                                    ✏️
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                          <span style={{ fontSize: '10px', color: isCurrent ? '#fde68a' : '#94a3b8' }}>
                            {(sc.maps || []).length} elem. mapa • {(sc.tokens || []).length} fichas
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                        {onMoveSceneOrder && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '4px' }}>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveSceneOrder(idx, 'up');
                              }}
                              className="vtt-brass-btn"
                              style={{ padding: '1px 5px', fontSize: '9px', borderRadius: '3px', opacity: idx === 0 ? 0.35 : 1, cursor: idx === 0 ? 'default' : 'pointer' }}
                              title="Subir escena"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              disabled={idx === scenes.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveSceneOrder(idx, 'down');
                              }}
                              className="vtt-brass-btn"
                              style={{ padding: '1px 5px', fontSize: '9px', borderRadius: '3px', opacity: idx === scenes.length - 1 ? 0.35 : 1, cursor: idx === scenes.length - 1 ? 'default' : 'pointer' }}
                              title="Bajar escena"
                            >
                              ▼
                            </button>
                          </div>
                        )}
                        {onDeleteScene && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteScene(sc.id);
                            }}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', padding: '0 6px' }}
                            title="Eliminar esta escena"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginTop: '6px', flexWrap: 'wrap', gap: '8px' }}>
                {onSaveAdventure && (
                  <button
                    type="button"
                    onClick={handleOpenSaveAdventureModal}
                    className="vtt-brass-btn"
                    style={{
                      background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(180, 83, 9, 0.2) 100%)',
                      border: '1px solid #d4af37',
                      color: '#fef3c7',
                      padding: '5px 12px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)'
                    }}
                    title="Guardar la aventura completa con todas las escenas, mapas, fichas y estado"
                  >
                    💾 Guardar Aventura
                  </button>
                )}

                {onDeleteAllScenes && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmDeleteAllScenes) {
                        onDeleteAllScenes();
                        setConfirmDeleteAllScenes(false);
                        notify('Todas las escenas han sido eliminadas');
                      } else {
                        setConfirmDeleteAllScenes(true);
                        setTimeout(() => setConfirmDeleteAllScenes(false), 3500);
                      }
                    }}
                    style={{
                      backgroundColor: confirmDeleteAllScenes ? '#dc2626' : 'rgba(239, 68, 68, 0.08)',
                      border: confirmDeleteAllScenes ? '1px solid #dc2626' : '1px solid rgba(239, 68, 68, 0.3)',
                      color: confirmDeleteAllScenes ? '#ffffff' : '#f87171',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      marginLeft: 'auto'
                    }}
                    title="Eliminar todas las escenas y reiniciar el tablero"
                  >
                    {confirmDeleteAllScenes ? '⚠️ ¿Confirmar borrar todas las escenas?' : '🗑️ Borrar todas las escenas'}
                  </button>
                )}
              </div>
            </div>

            {/* Arquitectura de Escena: Botón Principal para Abrir el Creador/Editor de Mapas */}
            <div className="vtt-wood-panel" style={{ padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="vtt-gothic-title" style={{ fontSize: '13px', color: '#d4af37', fontWeight: 'bold' }}>
                  Arquitectura de Escena ({maps.length} elementos)
                </span>
                {maps.length > 0 && onClearAllMaps && (
                  <button
                    onClick={() => {
                      if (confirmClearMaps) {
                        onClearAllMaps();
                        setConfirmClearMaps(false);
                        notify('Mapa de la escena despejado');
                      } else {
                        setConfirmClearMaps(true);
                        setTimeout(() => setConfirmClearMaps(false), 3000);
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    {confirmClearMaps ? '¿Confirmar borrado?' : 'Limpiar Mapa'}
                  </button>
                )}
              </div>
              <button
                onClick={() => { onClose(); openMapCreator(); }}
                className="vtt-primary-cta"
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
              >
                Abrir Editor de Mapas a Pantalla Completa
              </button>
            </div>

            {/* Configuración de Cuadrícula Táctica */}
            <div className="vtt-wood-panel" style={{ padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="vtt-gothic-title" style={{ fontSize: '13px', color: '#d4af37', fontWeight: 'bold' }}>
                  Cuadrícula ({gridSize} px)
                </span>
                <button
                  onClick={() => setSnapToGrid(!snapToGrid)}
                  className="vtt-brass-btn"
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    color: snapToGrid ? '#4ade80' : '#f87171'
                  }}
                >
                  {snapToGrid ? 'Activada' : 'Desactivada'}
                </button>
              </div>
              <input
                type="range"
                min="20"
                max="150"
                step="5"
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#d4af37', cursor: 'pointer' }}
              />
            </div>
          </div>
        )}

        {/* PESTAÑA 2: PROYECTOR DE ILUSTRACIONES (HANDOUTS) */}
        {activeTab === 'proyector' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflow: 'hidden' }}>
            <div className="vtt-wood-panel" style={{ padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="vtt-gothic-title" style={{ fontSize: '13px', color: '#d4af37', fontWeight: 'bold' }}>
                Proyector de Ilustraciones y Pistas
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  value={handoutTitle}
                  onChange={(e) => setHandoutTitle(e.target.value)}
                  placeholder="Título de la ilustración o pista..."
                  style={{ flex: 1, padding: '7px 9px', backgroundColor: '#120b07', color: '#f3e5ab', border: '1px solid #8a6d3b', borderRadius: '5px', fontSize: '12px' }}
                />
                <input type="file" accept="image/*" ref={handoutFileInputRef} onChange={handleHandoutImageUpload} style={{ display: 'none' }} />
                <button
                  type="button"
                  onClick={() => handoutFileInputRef.current.click()}
                  className="vtt-primary-cta"
                  style={{ padding: '7px 12px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}
                >
                  Subir Imagen
                </button>
              </div>
              {activeHandout && (
                <button
                  onClick={() => onProjectHandout && onProjectHandout(null)}
                  style={{ padding: '8px', background: '#991b1b', color: '#fecaca', border: '1px solid #f87171', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                >
                  ⏹ Detener Proyección Activa ({activeHandout.title})
                </button>
              )}
            </div>

            <div className="vtt-wood-panel" style={{ padding: '12px 14px', borderRadius: '8px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {handouts.map(h => {
                const isShowing = activeHandout && activeHandout.id === h.id;
                return (
                  <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: '#120b07', border: isShowing ? '1px solid #fbbf24' : '1px solid #4a331d', borderRadius: '6px', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      {h.src && <img src={h.src} alt={h.title} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #8a6d3b' }} />}
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#f3e5ab', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {h.title}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => onProjectHandout && onProjectHandout(isShowing ? null : h)}
                        className="vtt-brass-btn"
                        style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', color: isShowing ? '#4ade80' : '#fbbf24' }}
                      >
                        {isShowing ? 'Ocultar' : 'Proyectar'}
                      </button>
                      {onRemoveHandout && (
                        <button onClick={() => onRemoveHandout(h.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {handouts.length === 0 && (
                <div style={{ color: '#8a6d3b', fontSize: '12px', textAlign: 'center', marginTop: '20px', fontStyle: 'italic' }}>
                  Sube retratos, mapas o cartas para proyectarlos en la Pantalla de Jugadores.
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA: CREADOR DE DECORADO, MOBILIARIO Y ESTRUCTURAS */}
        {activeTab === 'decorado' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflow: 'hidden' }}>
            {/* Selector de Subpestañas */}
            <div style={{ display: 'flex', gap: '6px', backgroundColor: '#0e1118', padding: '4px', borderRadius: '8px', border: '1px solid #262c3a' }}>
              <button
                type="button"
                onClick={() => setObjectsSubTab('creator')}
                style={{
                  flex: 1,
                  padding: '7px 4px',
                  borderRadius: '6px',
                  border: objectsSubTab === 'creator' ? '1.5px solid #f59e0b' : '1px solid transparent',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: objectsSubTab === 'creator' ? '#2a1a08' : 'transparent',
                  background: objectsSubTab === 'creator'
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.32) 0%, rgba(180, 83, 9, 0.45) 100%)'
                    : 'transparent',
                  color: objectsSubTab === 'creator' ? '#fbbf24' : '#94a3b8',
                  boxShadow: objectsSubTab === 'creator' ? '0 2px 8px rgba(245, 158, 11, 0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                🛠️ Forjar Decorado
              </button>
              <button
                type="button"
                onClick={() => setObjectsSubTab('scene')}
                style={{
                  flex: 1,
                  padding: '7px 4px',
                  borderRadius: '6px',
                  border: objectsSubTab === 'scene' ? '1.5px solid #f59e0b' : '1px solid transparent',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: objectsSubTab === 'scene' ? '#2a1a08' : 'transparent',
                  background: objectsSubTab === 'scene'
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.32) 0%, rgba(180, 83, 9, 0.45) 100%)'
                    : 'transparent',
                  color: objectsSubTab === 'scene' ? '#fbbf24' : '#94a3b8',
                  boxShadow: objectsSubTab === 'scene' ? '0 2px 8px rgba(245, 158, 11, 0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                📋 En Escena ({interactiveItemsOnBoard.length})
              </button>
              <button
                type="button"
                onClick={() => setObjectsSubTab('catalog')}
                style={{
                  flex: 1,
                  padding: '7px 4px',
                  borderRadius: '6px',
                  border: objectsSubTab === 'catalog' ? '1.5px solid #f59e0b' : '1px solid transparent',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: objectsSubTab === 'catalog' ? '#2a1a08' : 'transparent',
                  background: objectsSubTab === 'catalog'
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.32) 0%, rgba(180, 83, 9, 0.45) 100%)'
                    : 'transparent',
                  color: objectsSubTab === 'catalog' ? '#fbbf24' : '#94a3b8',
                  boxShadow: objectsSubTab === 'catalog' ? '0 2px 8px rgba(245, 158, 11, 0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                📚 Catálogo Decorado ({customObjects.length})
              </button>
            </div>

            {/* SUBPESTAÑA 1: CREADOR Y FORJA DE OBJETOS */}
            {objectsSubTab === 'creator' && (
              <div className="vtt-wood-panel" style={{ padding: '14px', borderRadius: '8px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Tipo de Elemento */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
                    Tipo de Elemento:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {[
                      { id: 'object', label: 'Contenedor', icon: '📦' },
                      { id: 'light', label: 'Luz', icon: '🔥' },
                      { id: 'door', label: 'Puerta', icon: '🚪' },
                      { id: 'window', label: 'Ventana', icon: '🪟' }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setObjCategory(type.id);
                          if (type.id === 'object') {
                            setObjName('Cofre Misterioso');
                            setObjIcon('📦');
                            setObjWidth(48); setObjHeight(48);
                          } else if (type.id === 'light') {
                            setObjName('Antorcha de Pared');
                            setObjIcon('🔥');
                          } else if (type.id === 'door') {
                            setObjName('Puerta de Roble');
                            setObjIcon('🚪');
                            setObjWidth(60); setObjHeight(16);
                          } else if (type.id === 'window') {
                            setObjName('Ventana con Rejas');
                            setObjIcon('🪟');
                            setObjWidth(60); setObjHeight(14);
                          }
                        }}
                        style={{
                          padding: '6px 4px',
                          borderRadius: '6px',
                          border: objCategory === type.id ? '1px solid #f59e0b' : '1px solid #283042',
                          backgroundColor: objCategory === type.id ? 'rgba(245, 158, 11, 0.15)' : '#141822',
                          color: objCategory === type.id ? '#fbbf24' : '#cbd5e1',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 600,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>{type.icon}</span>
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nombre */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '5px' }}>
                    Nombre del Elemento:
                  </label>
                  <input
                    type="text"
                    value={objName}
                    onChange={(e) => setObjName(e.target.value)}
                    placeholder="Ej: Sarcófago de alabastro, Escritorio antiguo..."
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      backgroundColor: '#0c0e14',
                      border: '1px solid #283042',
                      color: '#f8fafc',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                </div>

                {/* Selector de Iconos para Objetos */}
                {objCategory === 'object' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '5px' }}>
                        Icono Cerrado / Inactivo:
                      </label>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        {POPULAR_OBJECT_ICONS.map(ic => (
                          <button
                            key={ic}
                            type="button"
                            onClick={() => setObjIcon(ic)}
                            style={{
                              padding: '4px 6px',
                              borderRadius: '5px',
                              border: objIcon === ic ? '1px solid #f59e0b' : '1px solid #283042',
                              backgroundColor: objIcon === ic ? 'rgba(245, 158, 11, 0.2)' : '#131620',
                              cursor: 'pointer',
                              fontSize: '15px'
                            }}
                          >
                            {ic}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={objIcon}
                        onChange={(e) => setObjIcon(e.target.value)}
                        placeholder="O escribe un emoji / símbolo libre"
                        style={{
                          width: '100%',
                          padding: '5px 8px',
                          backgroundColor: '#0c0e14',
                          border: '1px solid #283042',
                          color: '#f8fafc',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '5px' }}>
                        Icono Abierto / Activado:
                      </label>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        {POPULAR_OPEN_ICONS.map(ic => (
                          <button
                            key={ic}
                            type="button"
                            onClick={() => setObjOpenIcon(ic)}
                            style={{
                              padding: '4px 6px',
                              borderRadius: '5px',
                              border: objOpenIcon === ic ? '1px solid #f59e0b' : '1px solid #283042',
                              backgroundColor: objOpenIcon === ic ? 'rgba(245, 158, 11, 0.2)' : '#131620',
                              cursor: 'pointer',
                              fontSize: '15px'
                            }}
                          >
                            {ic}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={objOpenIcon}
                        onChange={(e) => setObjOpenIcon(e.target.value)}
                        placeholder="O escribe un emoji libre"
                        style={{
                          width: '100%',
                          padding: '5px 8px',
                          backgroundColor: '#0c0e14',
                          border: '1px solid #283042',
                          color: '#f8fafc',
                          borderRadius: '6px',
                          fontSize: '12px'
                        }}
                      />
                    </div>

                    {/* Dimensiones y Casillas */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '5px' }}>
                        Tamaño en Cuadrícula:
                      </label>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                        {[
                          { label: '1x1 Casilla', w: 48, h: 48 },
                          { label: '2x1 Grande', w: 96, h: 48 },
                          { label: '2x2 Enorme', w: 96, h: 96 }
                        ].map(preset => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => { setObjWidth(preset.w); setObjHeight(preset.h); }}
                            className="vtt-brass-btn"
                            style={{
                              padding: '4px 8px',
                              fontSize: '10px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              borderColor: (objWidth === preset.w && objHeight === preset.h) ? '#f59e0b' : undefined,
                              color: (objWidth === preset.w && objHeight === preset.h) ? '#fbbf24' : undefined
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bloqueos Físicos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#0d1017', padding: '8px 10px', borderRadius: '6px', border: '1px solid #232938' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: '#e2e8f0' }}>
                        <input
                          type="checkbox"
                          checked={objBlocksMove}
                          onChange={(e) => setObjBlocksMove(e.target.checked)}
                        />
                        <span>🛡️ <strong>Bloquea Movimiento:</strong> Los tokens no pueden atravesarlo mientras esté cerrado.</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: '#e2e8f0' }}>
                        <input
                          type="checkbox"
                          checked={objBlocksVision}
                          onChange={(e) => setObjBlocksVision(e.target.checked)}
                        />
                        <span>👁️ <strong>Bloquea Visión:</strong> Proyecta sombra y oculta lo que hay detrás en la niebla.</span>
                      </label>
                    </div>

                    {/* Notas secretas / Botín */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '5px' }}>
                        Notas Secretas o Botín inicial (Solo Máster):
                      </label>
                      <textarea
                        value={objNotes}
                        onChange={(e) => setObjNotes(e.target.value)}
                        placeholder="Anota qué contiene, qué cerradura tiene o qué pistas revela..."
                        style={{
                          width: '100%',
                          height: '60px',
                          backgroundColor: '#0c0e14',
                          border: '1px solid #283042',
                          color: '#f8fafc',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          fontSize: '11px',
                          resize: 'none'
                        }}
                      />
                    </div>
                  </>
                )}

                {/* Opciones Específicas de Luz */}
                {objCategory === 'light' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '5px' }}>
                        Radio de Iluminación: <strong>{lightRadius}px</strong>
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="500"
                        step="20"
                        value={lightRadius}
                        onChange={(e) => setLightRadius(Number(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '5px' }}>
                        Tono del Haz de Luz:
                      </label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {[
                          { color: '#f59e0b', label: 'Cálido' },
                          { color: '#38bdf8', label: 'Etéreo' },
                          { color: '#ef4444', label: 'Carmesí' },
                          { color: '#a855f7', label: 'Arcano' },
                          { color: '#f8fafc', label: 'Claro' }
                        ].map(c => (
                          <button
                            key={c.color}
                            type="button"
                            onClick={() => setLightColor(c.color)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: c.color,
                              border: lightColor === c.color ? '3px solid #ffffff' : '2px solid #283042',
                              boxShadow: lightColor === c.color ? `0 0 10px ${c.color}` : 'none',
                              cursor: 'pointer'
                            }}
                            title={c.label}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Opciones Específicas de Puerta / Ventana */}
                {(objCategory === 'door' || objCategory === 'window') && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '5px' }}>
                      Orientación Inicial:
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => { setObjWidth(60); setObjHeight(objCategory === 'door' ? 16 : 14); }}
                        className="vtt-brass-btn"
                        style={{
                          flex: 1,
                          padding: '6px',
                          fontSize: '11px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          borderColor: objWidth >= objHeight ? '#f59e0b' : undefined,
                          color: objWidth >= objHeight ? '#fbbf24' : undefined
                        }}
                      >
                        Horizontal (60x16)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setObjWidth(objCategory === 'door' ? 16 : 14); setObjHeight(60); }}
                        className="vtt-brass-btn"
                        style={{
                          flex: 1,
                          padding: '6px',
                          fontSize: '11px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          borderColor: objWidth < objHeight ? '#f59e0b' : undefined,
                          color: objWidth < objHeight ? '#fbbf24' : undefined
                        }}
                      >
                        Vertical (16x60)
                      </button>
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', fontStyle: 'italic' }}>
                      * Recuerda que siempre podrás girar la puerta o ventana 90º con clic derecho en el tablero.
                    </div>
                  </div>
                )}

                {/* Botonera de Acción */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                  <button
                    type="button"
                    onClick={handlePlaceNewObject}
                    className="vtt-primary-cta"
                    style={{ flex: 1, padding: '9px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    🎯 Colocar en el Tablero
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveToCatalog}
                    className="vtt-brass-btn"
                    style={{ padding: '9px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', borderColor: '#f59e0b', color: '#fbbf24' }}
                    title="Guardar como plantilla permanente para reutilizar en cualquier momento"
                  >
                    ⭐ Guardar Plantilla
                  </button>
                </div>
              </div>
            )}

            {/* SUBPESTAÑA 2: ELEMENTOS ACTIVOS EN LA ESCENA */}
            {objectsSubTab === 'scene' && (
              <div className="vtt-wood-panel" style={{ padding: '12px 14px', borderRadius: '8px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="vtt-gothic-title" style={{ fontSize: '12px', color: '#c5a059', fontWeight: 'bold' }}>
                    Elementos en la Escena Activa ({interactiveItemsOnBoard.length})
                  </span>
                  <button
                    onClick={() => { onClose(); openMapCreator(); }}
                    style={{ background: 'none', border: 'none', color: '#fbbf24', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Editor de Mapas
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {interactiveItemsOnBoard.map(item => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 10px',
                        backgroundColor: '#120b07',
                        border: '1px solid #4a331d',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                        {item.type === 'light' ? (item.icon || '🔥') : item.type === 'door' ? '🚪' : item.type === 'window' ? '🪟' : (item.icon || '📦')}{' '}
                        <strong>{item.name || item.type}</strong>
                        {item.isLocked && <span style={{ marginLeft: '4px', fontSize: '10px' }}>🔒</span>}
                      </span>
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        {item.type === 'object' && onInspectObject && (
                          <button
                            type="button"
                            onClick={() => onInspectObject(item)}
                            className="vtt-brass-btn"
                            style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', borderColor: '#f59e0b', color: '#fbbf24' }}
                            title="Editar notas, trampa y botín"
                          >
                            📝
                          </button>
                        )}
                        {onToggleMapElementState && (
                          <button
                            type="button"
                            onClick={() => onToggleMapElementState(item.id)}
                            className="vtt-brass-btn"
                            style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                          >
                            {item.type === 'light'
                              ? (item.isOn !== false ? 'Apagar' : 'Encender')
                              : (item.isOpen ? 'Cerrar' : 'Abrir')}
                          </button>
                        )}
                        {onRemoveMapElement && (
                          <button
                            type="button"
                            onClick={() => onRemoveMapElement(item.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                            title="Retirar del mapa"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {interactiveItemsOnBoard.length === 0 && (
                    <div style={{ color: '#8a6d3b', fontSize: '12px', textAlign: 'center', marginTop: '20px', fontStyle: 'italic' }}>
                      No hay objetos ni estructuras colocados en esta escena.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUBPESTAÑA 3: CATÁLOGO PERSONALIZADO DE PLANTILLAS */}
            {objectsSubTab === 'catalog' && (
              <div className="vtt-wood-panel" style={{ padding: '12px 14px', borderRadius: '8px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="vtt-gothic-title" style={{ fontSize: '12px', color: '#c5a059', fontWeight: 'bold' }}>
                    Plantillas Guardadas ({customObjects.length})
                  </span>
                  <button
                    onClick={() => setObjectsSubTab('creator')}
                    style={{ background: 'none', border: 'none', color: '#fbbf24', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    + Forjar Nueva
                  </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {customObjects.map(obj => (
                    <div
                      key={obj.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 10px',
                        backgroundColor: '#120b07',
                        border: '1px solid #4a331d',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                    >
                      <span>
                        {obj.icon || '📦'} <strong>{obj.name || obj.label}</strong>
                      </span>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (onAddMapElement) {
                              onAddMapElement(obj);
                              notify(`Colocando ${obj.name} en el tablero`);
                              onClose();
                            }
                          }}
                          className="vtt-primary-cta"
                          style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                        >
                          🎯 Colocar
                        </button>
                        {onDeleteCustomObject && (
                          <button
                            type="button"
                            onClick={() => onDeleteCustomObject(obj.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {customObjects.length === 0 && (
                    <div style={{ color: '#8a6d3b', fontSize: '12px', textAlign: 'center', marginTop: '20px', fontStyle: 'italic' }}>
                      No tienes plantillas personalizadas guardadas aún.
                      <div style={{ marginTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setObjectsSubTab('creator')}
                          className="vtt-brass-btn"
                          style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          🛠️ Forjar Mi Primer Decorado
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA: OBJETOS DE INVENTARIO Y EQUIPO COMÚN (LOOT / PERTENENCIAS) */}
        {activeTab === 'items' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflow: 'hidden' }}>
            {/* Selector de Subpestañas */}
            <div style={{ display: 'flex', gap: '6px', backgroundColor: '#0e1118', padding: '4px', borderRadius: '8px', border: '1px solid #262c3a' }}>
              <button
                type="button"
                onClick={() => setItemsSubTab('catalog')}
                style={{
                  flex: 1,
                  padding: '7px 4px',
                  borderRadius: '6px',
                  border: itemsSubTab === 'catalog' ? '1.5px solid #f59e0b' : '1px solid transparent',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: itemsSubTab === 'catalog' ? '#2a1a08' : 'transparent',
                  background: itemsSubTab === 'catalog'
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.32) 0%, rgba(180, 83, 9, 0.45) 100%)'
                    : 'transparent',
                  color: itemsSubTab === 'catalog' ? '#fbbf24' : '#94a3b8',
                  boxShadow: itemsSubTab === 'catalog' ? '0 2px 8px rgba(245, 158, 11, 0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                📚 Catálogo Común ({commonItems.length})
              </button>
              <button
                type="button"
                onClick={() => setItemsSubTab('creator')}
                style={{
                  flex: 1,
                  padding: '7px 4px',
                  borderRadius: '6px',
                  border: itemsSubTab === 'creator' ? '1.5px solid #f59e0b' : '1px solid transparent',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: itemsSubTab === 'creator' ? '#2a1a08' : 'transparent',
                  background: itemsSubTab === 'creator'
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.32) 0%, rgba(180, 83, 9, 0.45) 100%)'
                    : 'transparent',
                  color: itemsSubTab === 'creator' ? '#fbbf24' : '#94a3b8',
                  boxShadow: itemsSubTab === 'creator' ? '0 2px 8px rgba(245, 158, 11, 0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                🛠️ Forjar Nuevo Objeto
              </button>
            </div>

            {/* Banner de Destinatario: Turno Activo vs Selección Manual */}
            {(() => {
              const activeTurnToken = tokens.find(t => t.id === activeTurnTokenId) || null;
              const effectiveRecipientId = selectedRecipientId || (activeTurnToken ? activeTurnToken.id : (tokens[0]?.id || characters[0]?.id || ''));
              const effectiveRecipientName = (() => {
                const foundT = tokens.find(t => t.id === effectiveRecipientId || t.characterId === effectiveRecipientId);
                if (foundT) return foundT.name;
                const foundC = characters.find(c => c.id === effectiveRecipientId);
                return foundC ? foundC.name : 'Nadie seleccionado';
              })();

              return (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: activeTurnToken ? 'rgba(245, 158, 11, 0.12)' : '#141824',
                  border: activeTurnToken ? '1px solid #f59e0b' : '1px solid #2b3345',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '15px' }}>{activeTurnToken ? '🎯' : '👤'}</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '10px', color: activeTurnToken ? '#fbbf24' : '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                        {activeTurnToken ? 'Destinatario: Turno Activo' : 'Destinatario de Entrega:'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#f8fafc', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {effectiveRecipientName}
                      </span>
                    </div>
                  </div>

                  {/* Selector rápido para cambiar destinatario si se desea */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <select
                      value={effectiveRecipientId}
                      onChange={(e) => setSelectedRecipientId(e.target.value)}
                      style={{
                        backgroundColor: '#0c0f17',
                        color: '#cbd5e1',
                        border: '1px solid #333d52',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        outline: 'none',
                        maxWidth: '150px'
                      }}
                      title="Elegir qué personaje recibe los objetos de inventario"
                    >
                      {tokens.length > 0 && (
                        <optgroup label="En Tablero (Escena)">
                          {tokens.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.id === activeTurnTokenId ? '⭐ (Turno) ' : ''}{t.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {characters.length > 0 && (
                        <optgroup label="Biblioteca de Personajes">
                          {characters.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                </div>
              );
            })()}

            {/* SUBPESTAÑA 1: CATÁLOGO DE OBJETOS COMUNES */}
            {itemsSubTab === 'catalog' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflow: 'hidden' }}>
                {/* Buscador de Objetos */}
                <input
                  type="text"
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  placeholder="Buscar mechero, cuerda, linterna, botiquín..."
                  style={{
                    backgroundColor: '#121622',
                    border: '1px solid #283042',
                    borderRadius: '7px',
                    padding: '7px 10px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    outline: 'none',
                    flexShrink: 0
                  }}
                />

                {/* Lista de Objetos con Scroll */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  paddingRight: '4px'
                }}>
                  {commonItems
                    .filter(item => {
                      if (!itemSearchQuery.trim()) return true;
                      const q = itemSearchQuery.toLowerCase();
                      return (
                        item.name.toLowerCase().includes(q) ||
                        (item.notes && item.notes.toLowerCase().includes(q)) ||
                        (item.category && item.category.toLowerCase().includes(q))
                      );
                    })
                    .map(item => {
                      const activeTurnToken = tokens.find(t => t.id === activeTurnTokenId) || null;
                      const targetId = selectedRecipientId || (activeTurnToken ? activeTurnToken.id : (tokens[0]?.id || characters[0]?.id || null));
                      const isDefaultPreset = typeof item.id === 'string' && item.id.startsWith('item_');

                      return (
                        <div
                          key={item.id}
                          style={{
                            backgroundColor: '#141824',
                            border: '1px solid #252d3d',
                            borderRadius: '8px',
                            padding: '9px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            transition: 'border 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                              <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon || '📦'}</span>
                              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                    {item.name}
                                  </span>
                                  {item.category && (
                                    <span style={{
                                      fontSize: '9px',
                                      backgroundColor: '#1e2638',
                                      color: '#93c5fd',
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      fontWeight: 600,
                                      flexShrink: 0
                                    }}>
                                      {item.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Botones de Acción */}
                            <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexShrink: 0 }}>
                              {onPlaceGroundItem && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onPlaceGroundItem(item);
                                    onClose();
                                  }}
                                  className="vtt-brass-btn"
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    color: '#38bdf8',
                                    borderColor: '#0284c7',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                  title="Colocar en el suelo del tablero para que los personajes puedan recogerlo"
                                >
                                  📍 Suelo
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onGiveItemToCharacter && onGiveItemToCharacter(targetId, item)}
                                className="vtt-brass-btn"
                                style={{
                                  padding: '4px 9px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  color: '#fbbf24',
                                  borderColor: '#f59e0b',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Añadir inmediatamente al inventario del personaje seleccionado"
                              >
                                🎁 Entregar
                              </button>
                              {!isDefaultPreset && onDeleteCommonItem && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteCommonItem(item.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    padding: '2px 4px'
                                  }}
                                  title="Eliminar plantilla del catálogo"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Notas / Descripción legible */}
                          {item.notes && (
                            <div style={{
                              fontSize: '11px',
                              color: '#94a3b8',
                              backgroundColor: '#0c0f17',
                              padding: '5px 8px',
                              borderRadius: '5px',
                              borderLeft: '2px solid #3b82f6',
                              lineHeight: 1.35
                            }}>
                              {item.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* SUBPESTAÑA 2: FORJAR NUEVO OBJETO DE INVENTARIO */}
            {itemsSubTab === 'creator' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Nombre del Objeto:</label>
                  <input
                    type="text"
                    value={commonItemName}
                    onChange={(e) => setCommonItemName(e.target.value)}
                    placeholder="Ej: Mechero de latón con iniciales / Cuerda de seda"
                    style={{
                      backgroundColor: '#121622',
                      border: '1px solid #283042',
                      borderRadius: '7px',
                      padding: '8px 10px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Selector de Icono Popular */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Icono:</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', backgroundColor: '#0e1118', padding: '6px', borderRadius: '7px', border: '1px solid #262c3a' }}>
                    {POPULAR_ITEM_ICONS.map(ic => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setCommonItemIcon(ic)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '5px',
                          border: commonItemIcon === ic ? '1px solid #f59e0b' : '1px solid transparent',
                          backgroundColor: commonItemIcon === ic ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categoría y Estado en Inventario */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Categoría:</label>
                    <select
                      value={commonItemCategory}
                      onChange={(e) => setCommonItemCategory(e.target.value)}
                      style={{
                        backgroundColor: '#121622',
                        border: '1px solid #283042',
                        borderRadius: '7px',
                        padding: '7px 8px',
                        color: '#f8fafc',
                        fontSize: '11px',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      {ITEM_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Ubicación en Ficha:</label>
                    <select
                      value={commonItemState}
                      onChange={(e) => setCommonItemState(e.target.value)}
                      style={{
                        backgroundColor: '#121622',
                        border: '1px solid #283042',
                        borderRadius: '7px',
                        padding: '7px 8px',
                        color: '#f8fafc',
                        fontSize: '11px',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="equipped">Equipado (Llevado puesto)</option>
                      <option value="hand">A mano (Cinturón / Bolsillo)</option>
                      <option value="stored">Guardado (Mochila)</option>
                    </select>
                  </div>
                </div>

                {/* Textarea de Notas / Descripción */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Notas, Pistas o Propiedades:</label>
                  <textarea
                    rows={3}
                    value={commonItemNotes}
                    onChange={(e) => setCommonItemNotes(e.target.value)}
                    placeholder="Detalles sobre el objeto, pistas escritas, bonificaciones o efectos..."
                    style={{
                      backgroundColor: '#121622',
                      border: '1px solid #283042',
                      borderRadius: '7px',
                      padding: '8px 10px',
                      color: '#f8fafc',
                      fontSize: '11px',
                      resize: 'vertical',
                      outline: 'none',
                      lineHeight: 1.4
                    }}
                  />
                </div>

                {/* Botones de Guardar / Entregar */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!commonItemName.trim()) return;
                      const activeTurnToken = tokens.find(t => t.id === activeTurnTokenId) || null;
                      const targetId = selectedRecipientId || (activeTurnToken ? activeTurnToken.id : (tokens[0]?.id || characters[0]?.id || null));
                      const itemObj = {
                        id: `custom_item_${Date.now()}`,
                        name: commonItemName.trim(),
                        icon: commonItemIcon,
                        category: commonItemCategory,
                        state: commonItemState,
                        notes: commonItemNotes.trim()
                      };
                      if (onGiveItemToCharacter) onGiveItemToCharacter(targetId, itemObj);
                      setCommonItemName('');
                      setCommonItemNotes('');
                    }}
                    disabled={!commonItemName.trim()}
                    className="vtt-brass-btn"
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '7px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: commonItemName.trim() ? 'pointer' : 'default',
                      color: '#fbbf24',
                      borderColor: '#f59e0b',
                      opacity: commonItemName.trim() ? 1 : 0.4
                    }}
                  >
                    🎁 Entregar al Personaje
                  </button>

                  {onPlaceGroundItem && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!commonItemName.trim()) return;
                        const itemObj = {
                          id: `custom_item_${Date.now()}`,
                          name: commonItemName.trim(),
                          icon: commonItemIcon,
                          category: commonItemCategory,
                          state: commonItemState,
                          notes: commonItemNotes.trim()
                        };
                        onPlaceGroundItem(itemObj);
                        setCommonItemName('');
                        setCommonItemNotes('');
                        onClose();
                      }}
                      disabled={!commonItemName.trim()}
                      className="vtt-brass-btn"
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: '7px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: commonItemName.trim() ? 'pointer' : 'default',
                        color: '#38bdf8',
                        borderColor: '#0284c7',
                        opacity: commonItemName.trim() ? 1 : 0.4
                      }}
                      title="Colocar directamente en el suelo del tablero"
                    >
                      📍 En Suelo
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!commonItemName.trim()) return;
                      const itemObj = {
                        id: `custom_item_${Date.now()}`,
                        name: commonItemName.trim(),
                        icon: commonItemIcon,
                        category: commonItemCategory,
                        state: commonItemState,
                        notes: commonItemNotes.trim()
                      };
                      if (onSaveCommonItem) onSaveCommonItem(itemObj);
                      setCommonItemName('');
                      setCommonItemNotes('');
                      setItemsSubTab('catalog');
                    }}
                    disabled={!commonItemName.trim()}
                    className="vtt-brass-btn"
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '7px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: commonItemName.trim() ? 'pointer' : 'default',
                      opacity: commonItemName.trim() ? 1 : 0.4
                    }}
                  >
                    ⭐ Guardar en Catálogo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 4: NIEBLA DE GUERRA Y VISIÓN */}
        {activeTab === 'niebla' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="vtt-wood-panel" style={{ padding: '14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="vtt-gothic-title" style={{ fontSize: '13px', color: '#d4af37', fontWeight: 'bold' }}>
                  Niebla de Guerra y Conos de Visión
                </div>
                <div style={{ fontSize: '11px', color: '#b89f7d' }}>
                  Translúcida para el Master, opaca para los Jugadores
                </div>
              </div>
              <button
                onClick={() => setFowEnabled(!fowEnabled)}
                className="vtt-brass-btn"
                style={{ padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', color: fowEnabled ? '#4ade80' : '#f87171' }}
              >
                {fowEnabled ? 'Activada' : 'Desactivada'}
              </button>
            </div>

            <div className="vtt-wood-panel" style={{ padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Memoria de Exploración (Penumbra)</span>
                <button
                  onClick={() => setFowMemoryEnabled(!fowMemoryEnabled)}
                  className="vtt-brass-btn"
                  style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                >
                  {fowMemoryEnabled ? 'Con Memoria' : 'Visión Estricta'}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Auto-ocultar Enemigos fuera de vista</span>
                <button
                  onClick={() => setFowAutoHideEnemies(!fowAutoHideEnemies)}
                  className="vtt-brass-btn"
                  style={{ padding: '4px 12px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', color: fowAutoHideEnemies ? '#4ade80' : '#f87171' }}
                >
                  {fowAutoHideEnemies ? 'Activo' : 'Siempre Visibles'}
                </button>
              </div>
            </div>

            <div className="vtt-wood-panel" style={{ padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="vtt-gothic-title" style={{ fontSize: '12px', color: '#c5a059', fontWeight: 'bold' }}>
                Pincel Manual de Niebla
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <button onClick={() => setFowMode('none')} className="vtt-brass-btn" style={{ padding: '7px 4px', borderRadius: '4px', fontSize: '11px', borderColor: fowMode === 'none' ? '#fbbf24' : undefined }}>Mover</button>
                <button onClick={() => setFowMode('reveal')} className="vtt-brass-btn" style={{ padding: '7px 4px', borderRadius: '4px', fontSize: '11px', borderColor: fowMode === 'reveal' ? '#4ade80' : undefined }}>Despejar</button>
                <button onClick={() => setFowMode('hide')} className="vtt-brass-btn" style={{ padding: '7px 4px', borderRadius: '4px', fontSize: '11px', borderColor: fowMode === 'hide' ? '#f87171' : undefined }}>Cubrir</button>
              </div>
              <label style={{ fontSize: '12px' }}>Tamaño de Pincel: <strong>{fowBrushSize}px</strong></label>
              <input type="range" min="20" max="300" value={fowBrushSize} onChange={(e) => setFowBrushSize(Number(e.target.value))} style={{ width: '100%', accentColor: '#d4af37' }} />
              <label style={{ fontSize: '12px' }}>Radio de Visión de Héroes: <strong>{fowVisionRadius}px</strong></label>
              <input type="range" min="60" max="500" value={fowVisionRadius} onChange={(e) => setFowVisionRadius(Number(e.target.value))} style={{ width: '100%', accentColor: '#d4af37' }} />
            </div>

            {onResetFow && (
              <button
                onClick={onResetFow}
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  background: 'linear-gradient(180deg, #991b1b 0%, #450a0a 100%)',
                  color: '#fecaca',
                  border: '1px solid #f87171',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Restaurar Oscuridad en Todo el Mapa
              </button>
            )}
          </div>
        )}

        {/* PESTAÑA 5: SERES (PERSONAJES) Y ESTADOS ALTERADOS */}
        {activeTab === 'bestiario' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflow: 'hidden' }}>
            {/* Conmutador interno: Personajes vs Estados y Condiciones */}
            <div style={{ display: 'flex', gap: '6px', background: '#0e1118', padding: '4px', borderRadius: '8px', border: '1px solid #262c3a' }}>
              <button
                type="button"
                onClick={() => setBestiarySubTab('characters')}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: bestiarySubTab === 'characters' ? '1.5px solid #f59e0b' : '1px solid transparent',
                  backgroundColor: bestiarySubTab === 'characters' ? '#2a1a08' : 'transparent',
                  background: bestiarySubTab === 'characters'
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.32) 0%, rgba(180, 83, 9, 0.45) 100%)'
                    : 'transparent',
                  color: bestiarySubTab === 'characters' ? '#fbbf24' : '#94a3b8',
                  boxShadow: bestiarySubTab === 'characters' ? '0 2px 8px rgba(245, 158, 11, 0.2)' : 'none'
                }}
              >
                Personajes ({characters.length})
              </button>
              <button
                type="button"
                onClick={() => setBestiarySubTab('statuses')}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: bestiarySubTab === 'statuses' ? '1.5px solid #f59e0b' : '1px solid transparent',
                  backgroundColor: bestiarySubTab === 'statuses' ? '#2a1a08' : 'transparent',
                  background: bestiarySubTab === 'statuses'
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.32) 0%, rgba(180, 83, 9, 0.45) 100%)'
                    : 'transparent',
                  color: bestiarySubTab === 'statuses' ? '#fbbf24' : '#94a3b8',
                  boxShadow: bestiarySubTab === 'statuses' ? '0 2px 8px rgba(245, 158, 11, 0.2)' : 'none'
                }}
              >
                Estados y Condiciones ({customStatuses.length})
              </button>
            </div>

            {bestiarySubTab === 'characters' ? (
              <>
                <div className="vtt-wood-panel" style={{ padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="vtt-gothic-title" style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 'bold' }}>
                    Expedientes de Personajes y Criaturas
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                    Abre el creador dedicado para definir nombre y apellidos, año de nacimiento, salud, magia, cordura, armadura, inventario y grimorio.
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenCharacterCreator && onOpenCharacterCreator()}
                    className="vtt-primary-cta"
                    style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', width: '100%' }}
                  >
                    + Abrir Creador de Nuevo Personaje
                  </button>
                </div>

                <div className="vtt-wood-panel" style={{ padding: '12px 14px', borderRadius: '8px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="vtt-gothic-title" style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 'bold' }}>
                      Compendio ({characters.length})
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={async () => {
                          const res = await importJSON({ accept: '.json', description: 'Personajes VTT (*.json)' });
                          if (res?.success && res.text) {
                            try {
                              const parsed = JSON.parse(res.text);
                              const list = Array.isArray(parsed) ? parsed : [parsed];
                              onImportCharacters(list.map(c => ({ ...c, id: Date.now() + Math.random() })));
                              notify(`¡Importados ${list.length} personaje(s) con éxito!`);
                            } catch (err) {
                              notify('Archivo JSON inválido');
                            }
                          }
                        }}
                        className="vtt-brass-btn"
                        style={{ padding: '4px 8px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Importar JSON
                      </button>
                      <button
                        onClick={async () => {
                          if (!characters.length) return notify('No hay personajes para exportar');
                          const res = await exportJSON('bestiario_vtt.json', characters);
                          if (res?.success) notify(`¡Exportado: ${res.filename}!`);
                        }}
                        className="vtt-brass-btn"
                        style={{ padding: '4px 8px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Exportar Todo
                      </button>
                    </div>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {characters.map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#141822', padding: '7px 10px', borderRadius: '6px', border: c.isGraveWound ? '1px solid #ef4444' : '1px solid #2c3344', fontSize: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                          <span style={{ color: '#f8fafc', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {c.isGraveWound ? '🩸 ' : ''}{c.name} <span style={{ color: c.faction === 'enemy' ? '#f87171' : '#60a5fa', fontSize: '10px' }}>({c.faction === 'enemy' ? 'Enemigo' : 'Aliado'})</span>
                          </span>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                            ❤️ {c.hp ?? 20}/{c.maxHp ?? 20} • 💧 {c.mp ?? 10}/{c.maxMp ?? 10} • 👁️ {c.san ?? 60}/{c.maxSan ?? 60}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                          {onEditCharacter && (
                            <button onClick={() => onEditCharacter(c)} className="vtt-brass-btn" style={{ padding: '3px 8px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }} title="Editar ficha completa">
                              ✏️ Ficha
                            </button>
                          )}
                          {onAddToken && (
                            <button onClick={() => { onAddToken(c); }} className="vtt-primary-cta" style={{ padding: '3px 8px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}>
                              Invocar
                            </button>
                          )}
                          {onRemoveCharacter && (
                            <button onClick={() => onRemoveCharacter(c.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {characters.length === 0 && (
                      <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', marginTop: '10px', fontStyle: 'italic' }}>
                        Registra o importa personajes para invocarlos en tus partidas.
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    accept=".json"
                    ref={charInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const r = new FileReader();
                      r.onload = (ev) => {
                        try {
                          const parsed = JSON.parse(ev.target.result);
                          const list = Array.isArray(parsed) ? parsed : [parsed];
                          onImportCharacters(list.map(c => ({ ...c, id: Date.now() + Math.random() })));
                          notify(`¡Importados ${list.length} personaje(s) con éxito!`);
                        } catch (err) {}
                      };
                      r.readAsText(file);
                      e.target.value = '';
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="vtt-wood-panel" style={{ padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflow: 'hidden' }}>
                <div>
                  <div className="vtt-gothic-title" style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 'bold' }}>
                    Estados Alterados y Condiciones de Combate
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    Se asignan haciendo clic derecho sobre cualquier ficha en el tablero
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {PRESET_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setStatusIcon(icon)}
                      style={{
                        background: statusIcon === icon ? 'rgba(245, 158, 11, 0.25)' : '#12151e',
                        border: statusIcon === icon ? '1px solid #fbbf24' : '1px solid #2b3244',
                        borderRadius: '6px', padding: '5px 7px', cursor: 'pointer', fontSize: '14px'
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => statusIconInputRef.current.click()}
                    title="Subir icono de imagen personalizado"
                    className="vtt-brass-btn"
                    style={{ borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                  >
                    + 📷 Subir Icono
                  </button>
                  <input type="file" accept="image/*" ref={statusIconInputRef} onChange={handleStatusIconUpload} style={{ display: 'none' }} />
                </div>

                <form onSubmit={handleStatusSubmit} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <div style={{
                    width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#12151e', border: '1px solid #fbbf24', borderRadius: '6px', flexShrink: 0
                  }}>
                    {statusIcon.startsWith('data:image') ? (
                      <img src={statusIcon} alt="Custom Icon" style={{ width: '24px', height: '24px', borderRadius: '2px', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '16px' }}>{statusIcon}</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={statusLabel}
                    onChange={(e) => setStatusLabel(e.target.value)}
                    placeholder="Nombre (ej. Envenenado, Aturdido)..."
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', background: '#12151e', color: 'white', border: '1px solid #333a4d', fontSize: '12px' }}
                  />
                  <select
                    value={statusEffect}
                    onChange={(e) => setStatusEffect(e.target.value)}
                    style={{ padding: '8px', borderRadius: '6px', background: '#12151e', color: '#e2e8f0', border: '1px solid #333a4d', fontSize: '11px' }}
                  >
                    <option value="none">Visual</option>
                    <option value="immobilize">Inmoviliza</option>
                  </select>
                  <button type="submit" className="vtt-primary-cta" style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    + Añadir
                  </button>
                </form>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1, overflowY: 'auto', alignContent: 'flex-start', paddingTop: '4px' }}>
                  {customStatuses.map(status => {
                    const isImage = status.icon.startsWith('data:image');
                    return (
                      <div key={status.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#141822', border: '1px solid #2e3546', padding: '6px 10px', borderRadius: '7px', fontSize: '12px' }}>
                        {isImage ? <img src={status.icon} style={{ width: '16px', height: '16px', borderRadius: '2px', objectFit: 'cover' }} alt="" /> : <span>{status.icon}</span>}
                        <span style={{ fontWeight: 600 }}>{status.label}</span>
                        {status.effect === 'immobilize' && <span style={{ fontSize: '10px', color: '#f87171' }}>(🔒)</span>}
                        <button onClick={() => onRemoveCustomStatus(status.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', marginLeft: '2px' }}>✕</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 6: ARCHIVO DE CRÓNICA Y RESPALDO */}
        {activeTab === 'campana' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="vtt-wood-panel" style={{ padding: '18px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0, lineHeight: 1.5 }}>
                Exporta o restaura una copia de seguridad completa con todas tus escenas, mapas, muros, objetos interactivos, luces, fichas de personaje y niebla de guerra.
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button onClick={onImportCampaign} className="vtt-brass-btn" style={{ flex: 1, padding: '11px', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', borderColor: '#60a5fa', color: '#93c5fd' }}>
                  Cargar aventura (.json)
                </button>
                <button 
                  onClick={onSaveAdventure ? handleOpenSaveAdventureModal : onExportCampaign} 
                  className="vtt-primary-cta" 
                  style={{ flex: 1, padding: '11px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Guardar aventura (.json)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL GÓTICO: GUARDAR AVENTURA Y ESCENARIOS */}
      {isSaveAdventureModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(5, 7, 12, 0.82)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div 
            className="vtt-wood-panel"
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#121620',
              backgroundImage: 'linear-gradient(180deg, rgba(20, 26, 38, 0.95) 0%, rgba(13, 16, 24, 0.98) 100%), url("/assets/textures/parchment_dossier_texture.jpg")',
              backgroundBlendMode: 'overlay',
              borderRadius: '12px',
              border: '1px solid rgba(212, 175, 55, 0.45)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 25px rgba(212, 175, 55, 0.15)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Cabecera del Modal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
              background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)'
            }}>
              <div>
                <h3 className="vtt-gothic-title" style={{ margin: 0, fontSize: '17px', color: '#f3e8c8', letterSpacing: '0.04em' }}>
                  Guardar Aventura y Escenarios
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  Preserva el estado íntegro de la crónica para continuar la partida en cualquier momento.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveAdventureModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  lineHeight: 1
                }}
                title="Cerrar ventana"
              >
                ✕
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Campo Nombre de Aventura */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Nombre de la Aventura / Crónica
                </label>
                <input
                  type="text"
                  value={adventureNameInput}
                  onChange={(e) => setAdventureNameInput(e.target.value)}
                  placeholder="Ej. La Mansión Corbitt - Acto I"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #3b4252',
                    backgroundColor: '#0a0d14',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#d4af37')}
                  onBlur={(e) => (e.target.style.borderColor = '#3b4252')}
                />
              </div>

              {/* Tarjeta de Contenido que se Guardará */}
              <div style={{
                background: 'rgba(10, 13, 20, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '14px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                  Contenido incluido en la copia de seguridad:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0' }}>
                    <span style={{ fontSize: '15px' }}>🗺️</span>
                    <span><strong>{scenes.length}</strong> {scenes.length === 1 ? 'Escena preparada' : 'Escenas preparadas'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0' }}>
                    <span style={{ fontSize: '15px' }}>♟️</span>
                    <span><strong>{tokens.length}</strong> Fichas en mesa</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0' }}>
                    <span style={{ fontSize: '15px' }}>🏰</span>
                    <span><strong>{maps.length}</strong> Muros, planos y luces</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0' }}>
                    <span style={{ fontSize: '15px' }}>📜</span>
                    <span><strong>{characters.length}</strong> Fichas en Códice</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0' }}>
                    <span style={{ fontSize: '15px' }}>🌫️</span>
                    <span>Niebla de Guerra y Visión</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#e2e8f0' }}>
                    <span style={{ fontSize: '15px' }}>🌧️</span>
                    <span>Clima, Tintes y Audio</span>
                  </div>
                </div>

                {/* Listado de Escenas incluidas */}
                {scenes.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed rgba(255, 255, 255, 0.1)', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Escenas:</span>
                    {scenes.map((s, idx) => (
                      <span key={s.id || idx} style={{
                        fontSize: '11px',
                        background: s.id === activeSceneId ? 'rgba(212, 175, 55, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        border: s.id === activeSceneId ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: s.id === activeSceneId ? '#fef3c7' : '#94a3b8',
                        padding: '2px 7px',
                        borderRadius: '4px'
                      }}>
                        {idx + 1}. {s.name} {s.id === activeSceneId ? '• Activa' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Compatibilidad Multiplataforma / AppData */}
              <div style={{
                background: 'rgba(30, 41, 59, 0.35)',
                border: '1px solid rgba(96, 165, 250, 0.2)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <span style={{ fontSize: '18px', lineHeight: 1 }}>📁</span>
                <div style={{ fontSize: '12px', color: '#93c5fd', lineHeight: 1.45 }}>
                  <strong>Multiplataforma (Windows y Linux):</strong> Se archivará en la carpeta interna de la app (<code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 4px', borderRadius: '3px' }}>appdata/campaigns</code>) y estará disponible al instante con doble clic desde el menú principal.
                </div>
              </div>

              {/* Opción Exportar Archivo JSON */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#e2e8f0', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={exportJsonFile}
                  onChange={(e) => setExportJsonFile(e.target.checked)}
                  style={{ accentColor: '#d4af37', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span>Exportar además una copia en archivo <strong>.json</strong> descargable a tu equipo</span>
              </label>
            </div>

            {/* Pie del Modal: Acciones */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 20px',
              borderTop: '1px solid rgba(212, 175, 55, 0.2)',
              background: 'rgba(10, 13, 20, 0.8)'
            }}>
              <button
                type="button"
                onClick={() => setIsSaveAdventureModalOpen(false)}
                disabled={isSavingAdventure}
                style={{
                  background: 'none',
                  border: '1px solid #475569',
                  color: '#94a3b8',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: isSavingAdventure ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmSaveAdventure}
                disabled={isSavingAdventure}
                className="vtt-primary-cta"
                style={{
                  padding: '8px 20px',
                  fontSize: '13px',
                  cursor: isSavingAdventure ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: isSavingAdventure ? 0.7 : 1
                }}
              >
                {isSavingAdventure ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                    Guardando Aventura...
                  </>
                ) : (
                  <>
                    💾 Guardar Aventura
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsDrawer;