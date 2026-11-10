import React, { useState, useRef } from 'react';
import { OBJECT_PRESETS, LIGHT_PRESETS } from './MapCreator';
import {
  Map,
  Eye,
  FileText,
  Zap,
  Package,
  Settings,
  X,
  Trash2,
  Plus,
  GripVertical,
  Check,
  Pencil,
  ChevronUp,
  ChevronDown,
  Save,
  Upload,
  Scroll,
  BookOpen,
  Search,
  MapPin,
  Gift,
  Hammer,
  ArrowLeftRight,
  ArrowRight,
  ImagePlus,
  Lock
} from 'lucide-react';
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
  commonItems = [], onGiveItemToCharacter, onSaveCommonItem, onDeleteCommonItem, onPlaceGroundItem, onTransferItem,
  onSaveAdventure, onConcludeAdventure,
  sceneNotes = {}, onUpdateSceneNotes, campaignNotes = '', onUpdateCampaignNotes,
  initialTab = null
}) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'escenario');
  const [selectedNoteSceneId, setSelectedNoteSceneId] = useState(activeSceneId || (scenes[0] && scenes[0].id));
  const [newClueText, setNewClueText] = useState('');

  React.useEffect(() => {
    if (activeSceneId) {
      setSelectedNoteSceneId(activeSceneId);
    }
  }, [activeSceneId]);

  React.useEffect(() => {
    if (initialTab && isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);
  const [bestiarySubTab, setBestiarySubTab] = useState('characters'); // 'characters' | 'statuses'
  const [statusMessage, setStatusMessage] = useState(null);
  const [confirmDeleteAllScenes, setConfirmDeleteAllScenes] = useState(false);
  const [confirmDeleteSceneId, setConfirmDeleteSceneId] = useState(null);

  // Estados para Guardar Aventura Completa
  const [isSaveAdventureModalOpen, setIsSaveAdventureModalOpen] = useState(false);
  const [adventureNameInput, setAdventureNameInput] = useState('');
  const [exportJsonFile, setExportJsonFile] = useState(true);
  const [isSavingAdventure, setIsSavingAdventure] = useState(false);

  // Estados para Concluir Aventura y Archivar
  const [isConcludeModalOpen, setIsConcludeModalOpen] = useState(false);
  const [concludeNameInput, setConcludeNameInput] = useState('');
  const [concludeExportJson, setConcludeExportJson] = useState(true);
  const [isConcluding, setIsConcluding] = useState(false);

  const handleOpenConcludeModal = () => {
    const cur = scenes.find(s => s.id === activeSceneId) || scenes[0];
    setConcludeNameInput(cur?.name ? `Crónica: ${cur.name} — Concluida` : 'Crónica Concluida');
    setConcludeExportJson(true);
    setIsConcludeModalOpen(true);
  };

  const handleConfirmConcludeAdventure = async () => {
    if (!onConcludeAdventure) return;
    setIsConcluding(true);
    try {
      await onConcludeAdventure(concludeNameInput.trim() || 'Crónica Concluida', concludeExportJson);
      setIsConcludeModalOpen(false);
      if (onClose) onClose();
    } catch (err) {
      console.error('Error al concluir aventura:', err);
      notify('Error al concluir la aventura');
    } finally {
      setIsConcluding(false);
    }
  };

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

  // Estados para Objetos de Inventario y Equipo Común (Loot / Pertenencias)
  const [itemsSubTab, setItemsSubTab] = useState('catalog');
  const [isCreatorExpanded, setIsCreatorExpanded] = useState(false); // 'catalog' | 'creator'
  const [commonItemName, setCommonItemName] = useState('');
  const [commonItemIcon, setCommonItemIcon] = useState('🚬');
  const [commonItemCategory, setCommonItemCategory] = useState('Herramienta');
  const [commonItemState, setCommonItemState] = useState('equipped');
  const [commonItemNotes, setCommonItemNotes] = useState('');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [selectedGiverId, setSelectedGiverId] = useState('');
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

const renderTabIcon = (tabId, isActive) => {
  const color = isActive ? '#fef08a' : '#8e9caa';
  const size = 13;
  switch (tabId) {
    case 'escenario':
      return <Map size={size} strokeWidth={2.2} style={{ color }} />;
    case 'niebla':
      return <Eye size={size} strokeWidth={2.2} style={{ color }} />;
    case 'notas':
      return <FileText size={size} strokeWidth={2.2} style={{ color }} />;
    case 'estados':
      return <Zap size={size} strokeWidth={2.2} style={{ color }} />;
    case 'items':
      return <Package size={size} strokeWidth={2.2} style={{ color }} />;
    default:
      return null;
  }
};

  const TABS = [
    { id: 'escenario', label: 'Escenas' },
    { id: 'notas', label: 'Notas' },
    { id: 'estados', label: 'Estados' },
    { id: 'items', label: 'Objetos' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: '58px',
      right: isOpen ? '0' : '-520px',
      width: '510px',
      bottom: '0',
      transition: 'right 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
      zIndex: 4500,
      background: 'linear-gradient(180deg, #131722 0%, #0a0d14 100%)',
      borderLeft: '1.5px solid #2a3448',
      boxShadow: isOpen ? '-16px 0 50px rgba(0,0,0,0.92)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      color: '#e2e8f0',
      overflow: 'hidden'
    }}>
      {/* Cabecera Superior con Placa de Cuero Ocultista */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 18px',
        backgroundImage: 'linear-gradient(180deg, rgba(16, 19, 27, 0.75) 0%, rgba(13, 16, 23, 0.95) 100%), url("/assets/textures/grimoire_leather_header.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '5px',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(180, 83, 9, 0.4) 100%)',
            border: '1px solid #d4af37',
            fontSize: '13px',
            color: '#fbbf24',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
          }}>
            ⚙
          </span>
          <span className="vtt-gothic-title" style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc', letterSpacing: '0.06em' }}>
            CENTRO DE MANDO
          </span>
        </div>
        <button
          onClick={onClose}
          className="vtt-brass-plate-btn"
          style={{ padding: '4px 11px', fontSize: '11px' }}
          title="Cerrar Centro de Mando"
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><X size={13} strokeWidth={2.4} /> Cerrar</span>
        </button>
      </div>

      {/* Navegación en Lengüetas de Expediente de Archivador (Dossier Tabs) */}
      <div className="vtt-dossier-tab-container">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`vtt-dossier-tab ${isActive ? 'vtt-dossier-tab-active' : ''}`}
              title={`Expediente: ${tab.label}`}
            >
              {renderTabIcon(tab.id, isActive)}
              <span>{tab.label}</span>
            </button>
          );
        })}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="vtt-gothic-title" style={{ fontSize: '13px', color: '#d4af37', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Map size={14} strokeWidth={2.2} style={{ color: '#d4af37' }} />
                  <span>Selector de Escenas y Planos ({scenes.length})</span>
                </div>

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
                    className={confirmDeleteAllScenes ? "vtt-danger-plate-btn" : "vtt-icon-tool-btn"}
                    style={{
                      padding: confirmDeleteAllScenes ? '3px 8px' : '4px 6px',
                      fontSize: '11px',
                      color: confirmDeleteAllScenes ? '#fca5a5' : '#ef4444',
                      borderColor: confirmDeleteAllScenes ? '#ef4444' : 'rgba(239, 68, 68, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    title={confirmDeleteAllScenes ? "Confirmar borrado total de todas las escenas" : "Borrar todas las escenas"}
                  >
                    <Trash2 size={13} strokeWidth={2.2} />
                    {confirmDeleteAllScenes && <span>¿Borrar todo?</span>}
                  </button>
                )}
              </div>

              {/* Formulario de Nueva Escena con Input y Botón Táctil de Latón */}
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
                  className="vtt-dossier-input"
                  style={{ flex: 1 }}
                />
                <button type="submit" className="vtt-brass-plate-btn" style={{ padding: '6px 14px' }}>
                  <Plus size={13} strokeWidth={2.4} />
                  <span>Crear Escena</span>
                </button>
              </form>

              {/* Lista de Fichas de Expediente de Escenario */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '2px' }}>
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
                      className={`vtt-scene-dossier-card ${isCurrent ? 'vtt-scene-dossier-card-active' : ''}`}
                      style={{
                        borderStyle: isDragOver ? 'dashed' : 'solid',
                        borderColor: isDragOver ? '#38bdf8' : undefined,
                        opacity: draggedSceneIndex === idx ? 0.45 : 1,
                        cursor: editingSceneId === sc.id ? 'default' : isCurrent ? 'default' : 'pointer'
                      }}
                      title={
                        editingSceneId === sc.id
                          ? ''
                          : isCurrent
                          ? 'Escena activa (arrastra para reordenar)'
                          : 'Haz clic para activar esta escena'
                      }
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', overflow: 'hidden' }}>
                        {/* Agarre táctil de 4 puntos */}
                        <span
                          style={{
                            color: isCurrent ? '#f59e0b' : '#64748b',
                            display: 'inline-flex',
                            cursor: editingSceneId === sc.id ? 'default' : 'grab',
                            userSelect: 'none',
                            padding: '2px'
                          }}
                          title="Arrastrar para ordenar escena"
                        >
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
                            <rect x="2" y="2" width="3" height="3" rx="0.7"/>
                            <rect x="8.5" y="2" width="3" height="3" rx="0.7"/>
                            <rect x="2" y="8.5" width="3" height="3" rx="0.7"/>
                            <rect x="8.5" y="8.5" width="3" height="3" rx="0.7"/>
                          </svg>
                        </span>

                        {/* Placa Numérica de Latón */}
                        <span style={{
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: isCurrent ? 'linear-gradient(135deg, #d4af37 0%, #854d0e 100%)' : '#171d29',
                          color: isCurrent ? '#0f141f' : '#94a3b8',
                          fontWeight: 800,
                          fontSize: '11px',
                          fontFamily: 'ui-monospace, monospace',
                          border: isCurrent ? '1px solid #fef08a' : '1px solid #2a3448',
                          boxShadow: isCurrent ? '0 1px 4px rgba(0,0,0,0.4)' : 'none'
                        }}>
                          {idx + 1}
                        </span>

                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {editingSceneId === sc.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
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
                                  className="vtt-dossier-input"
                                  style={{
                                    padding: '2px 6px',
                                    fontSize: '11px',
                                    maxWidth: '140px'
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveRename(sc.id)}
                                  className="vtt-icon-tool-btn"
                                  style={{ color: '#10b981' }}
                                  title="Guardar nombre"
                                >
                                  ✓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSceneId(null)}
                                  className="vtt-icon-tool-btn"
                                  style={{ color: '#94a3b8' }}
                                  title="Cancelar"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <>
                                <span 
                                  onDoubleClick={() => handleStartRename(sc)}
                                  style={{
                                    fontWeight: 700,
                                    fontFamily: "'Cinzel', Georgia, serif",
                                    color: isCurrent ? '#ffffff' : '#e2e8f0',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    letterSpacing: '0.03em'
                                  }}
                                  title="Doble clic para cambiar nombre"
                                >
                                  {sc.name}
                                </span>
                                {onRenameScene && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartRename(sc);
                                    }}
                                    className="vtt-icon-tool-btn"
                                    title="Cambiar nombre a la escena"
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 20h9"/>
                                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                                    </svg>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                          <span style={{ fontSize: '10px', color: isCurrent ? '#fde68a' : '#8e9caa', marginTop: '1px' }}>
                            {(sc.maps || []).length} elem. mapa • {(sc.tokens || []).length} fichas
                          </span>
                        </div>
                      </div>

                      {/* Herramientas de Ficha: Reordenar y Eliminar */}
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                        {onMoveSceneOrder && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '3px' }}>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveSceneOrder(idx, 'up');
                              }}
                              className="vtt-icon-tool-btn"
                              style={{ opacity: idx === 0 ? 0.3 : 1, cursor: idx === 0 ? 'default' : 'pointer', padding: '2px 4px' }}
                              title="Subir escena"
                            >
                              <ChevronUp size={11} strokeWidth={2.4} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === scenes.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveSceneOrder(idx, 'down');
                              }}
                              className="vtt-icon-tool-btn"
                              style={{ opacity: idx === scenes.length - 1 ? 0.3 : 1, cursor: idx === scenes.length - 1 ? 'default' : 'pointer', padding: '2px 4px' }}
                              title="Bajar escena"
                            >
                              <ChevronDown size={11} strokeWidth={2.4} />
                            </button>
                          </div>
                        )}
                        {openMapCreator && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isCurrent && onSelectScene) onSelectScene(sc.id);
                              if (onClose) onClose();
                              openMapCreator(sc.id);
                            }}
                            className="vtt-icon-tool-btn"
                            style={{ color: '#fbbf24', padding: '3px 5px' }}
                            title={`Editar plano de "${sc.name}" en el Creador de Mapas`}
                          >
                            <Map size={12} strokeWidth={2.2} />
                          </button>
                        )}
                        {confirmDeleteSceneId === sc.id ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              backgroundColor: 'rgba(127, 29, 29, 0.45)',
                              border: '1px solid #ef4444',
                              borderRadius: '5px',
                              padding: '2px 5px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span style={{ fontSize: '9.5px', color: '#fca5a5', fontWeight: 700 }}>
                              ¿Borrar?
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteScene(sc.id);
                                setConfirmDeleteSceneId(null);
                              }}
                              style={{
                                background: '#ef4444',
                                border: 'none',
                                color: '#ffffff',
                                borderRadius: '3px',
                                padding: '1px 5px',
                                fontSize: '9.5px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title={`Confirmar eliminación definitiva de "${sc.name}"`}
                            >
                              Sí
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteSceneId(null);
                              }}
                              style={{
                                background: '#334155',
                                border: 'none',
                                color: '#cbd5e1',
                                borderRadius: '3px',
                                padding: '1px 5px',
                                fontSize: '9.5px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              title="Cancelar borrado"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          onDeleteScene && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteSceneId(sc.id);
                              }}
                              className="vtt-icon-tool-btn"
                              style={{ color: '#f87171', padding: '3px 6px' }}
                              title={`Eliminar escena "${sc.name}"`}
                            >
                              <Trash2 size={11} strokeWidth={2.2} />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Barra Inferior de Operaciones: Guardar Aventura, Concluir y Borrar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginTop: '6px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {onSaveAdventure && (
                    <button
                      type="button"
                      onClick={handleOpenSaveAdventureModal}
                      className="vtt-brass-plate-btn"
                      title="Guardar la aventura completa con todas las escenas, mapas, fichas y estado"
                    >
                      <Save size={13} strokeWidth={2.2} />
                      <span>Guardar Aventura</span>
                    </button>
                  )}

                  {onImportCampaign && (
                    <button
                      type="button"
                      onClick={onImportCampaign}
                      className="vtt-brass-plate-btn"
                      title="Cargar e importar una aventura guardada previamente en formato .json"
                    >
                      <Upload size={13} strokeWidth={2.2} />
                      <span>Cargar Aventura</span>
                    </button>
                  )}

                  {onConcludeAdventure && (
                    <button
                      type="button"
                      onClick={handleOpenConcludeModal}
                      className="vtt-conclude-plate-btn"
                      title="Concluir y sellar la crónica actual de forma inmutable, archivándola y dejando la mesa limpia"
                    >
                      <Scroll size={13} strokeWidth={2.2} />
                      <span>Concluir Aventura</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: NOTAS DE ESCENA */}
        {activeTab === 'notas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {/* Selector de Escena para las Notas */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              backgroundColor: '#121620',
              border: '1px solid #283144',
              borderRadius: '8px',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  Escena:
                </span>
                <select
                  value={selectedNoteSceneId || activeSceneId || (scenes[0] && scenes[0].id) || ''}
                  onChange={(e) => setSelectedNoteSceneId(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '5px 8px',
                    borderRadius: '5px',
                    backgroundColor: '#0a0d14',
                    border: '1px solid #3b4255',
                    color: '#f8fafc',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {scenes.map(sc => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name}{sc.id === activeSceneId ? ' (En mesa activa)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedNoteSceneId === activeSceneId && (
                <span style={{
                  fontSize: '10px',
                  color: '#34d399',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '2px 7px',
                  borderRadius: '999px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap'
                }}>
                  ● En Mesa
                </span>
              )}
            </div>

            {/* Checklist de Pistas & Objetivos de la Escena */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              backgroundColor: '#121620',
              border: '1px solid #283144',
              borderRadius: '8px',
              padding: '10px 12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#f8fafc', fontWeight: 700, letterSpacing: '0.04em' }}>
                  PISTAS Y SECRETOS DE LA SALA
                </span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  {((sceneNotes[selectedNoteSceneId]?.clues) || []).filter(c => c.completed).length} / {((sceneNotes[selectedNoteSceneId]?.clues) || []).length} descubiertas
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '140px', overflowY: 'auto' }}>
                {((sceneNotes[selectedNoteSceneId]?.clues) || []).map(clue => (
                  <div
                    key={clue.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px',
                      backgroundColor: clue.completed ? 'rgba(16, 185, 129, 0.08)' : '#0d1017',
                      border: clue.completed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #232b3b',
                      borderRadius: '5px',
                      gap: '8px'
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer', overflow: 'hidden' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(clue.completed)}
                        onChange={() => {
                          const currentData = sceneNotes[selectedNoteSceneId] || { notes: '', clues: [] };
                          const updated = (currentData.clues || []).map(c => c.id === clue.id ? { ...c, completed: !c.completed } : c);
                          if (onUpdateSceneNotes) onUpdateSceneNotes(selectedNoteSceneId, { ...currentData, clues: updated });
                        }}
                      />
                      <span style={{
                        fontSize: '11px',
                        color: clue.completed ? '#94a3b8' : '#e2e8f0',
                        textDecoration: clue.completed ? 'line-through' : 'none',
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {clue.text}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const currentData = sceneNotes[selectedNoteSceneId] || { notes: '', clues: [] };
                        const filtered = (currentData.clues || []).filter(c => c.id !== clue.id);
                        if (onUpdateSceneNotes) onUpdateSceneNotes(selectedNoteSceneId, { ...currentData, clues: filtered });
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '11px',
                        padding: '2px 4px'
                      }}
                      title="Eliminar pista"
                    >
                      <X size={12} strokeWidth={2.4} />
                    </button>
                  </div>
                ))}

                {((sceneNotes[selectedNoteSceneId]?.clues) || []).length === 0 && (
                  <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', padding: '4px 0' }}>
                    Sin pistas registradas para esta sala.
                  </div>
                )}
              </div>

              {/* Formulario para añadir pista */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newClueText.trim()) return;
                  const currentData = sceneNotes[selectedNoteSceneId] || { notes: '', clues: [] };
                  const newClues = [
                    ...(currentData.clues || []),
                    {
                      id: 'clue_' + Date.now() + Math.random().toString(36).slice(2, 5),
                      text: newClueText.trim(),
                      completed: false
                    }
                  ];
                  if (onUpdateSceneNotes) {
                    onUpdateSceneNotes(selectedNoteSceneId, { ...currentData, clues: newClues });
                  }
                  setNewClueText('');
                }}
                style={{ display: 'flex', gap: '6px', marginTop: '4px' }}
              >
                <input
                  type="text"
                  value={newClueText}
                  onChange={(e) => setNewClueText(e.target.value)}
                  placeholder="Añadir pista (ej: Diario bajo la alfombra, trampa en el cofre...)"
                  style={{
                    flex: 1,
                    padding: '5px 8px',
                    backgroundColor: '#0a0d14',
                    border: '1px solid #283144',
                    color: '#f8fafc',
                    borderRadius: '5px',
                    fontSize: '11px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  className="vtt-brass-btn"
                  style={{ padding: '4px 9px', fontSize: '11px', borderRadius: '5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Añadir
                </button>
              </form>
            </div>

            {/* Cuaderno de Notas Narrativas de la Escena */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: '260px',
              backgroundColor: '#121620',
              border: '1px solid #283144',
              borderRadius: '8px',
              padding: '10px 12px',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#f8fafc', fontWeight: 700, letterSpacing: '0.04em' }}>
                  APUNTES Y SECRETOS DEL MÁSTER
                </span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Guardado automático
                </span>
              </div>
              <textarea
                value={sceneNotes[selectedNoteSceneId]?.notes || ''}
                onChange={(e) => {
                  const currentData = sceneNotes[selectedNoteSceneId] || { notes: '', clues: [] };
                  if (onUpdateSceneNotes) {
                    onUpdateSceneNotes(selectedNoteSceneId, {
                      ...currentData,
                      notes: e.target.value
                    });
                  }
                }}
                placeholder="Escribe aquí los secretos de la sala, atmósfera, descripciones para leer a los jugadores, tiradas requeridas, trampas..."
                style={{
                  width: '100%',
                  flex: 1,
                  minHeight: '220px',
                  backgroundColor: '#0a0d14',
                  border: '1px solid #232b3b',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  color: '#e2e8f0',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  resize: 'none',
                  outline: 'none',
                  lineHeight: '1.6',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        )}

        {/* PESTAÑA 4: OBJETOS DE INVENTARIO (LOOT) & COMPENDIO */}
        {activeTab === 'items' && (() => {
          const activeTurnToken = tokens.find(t => String(t.id) === String(activeTurnTokenId)) || null;
          const effectiveGiverId = selectedGiverId || (activeTurnToken ? String(activeTurnToken.id) : 'master');

          const giverToken = tokens.find(tok => String(tok.id) === String(effectiveGiverId) || (tok.characterId && String(tok.characterId) === String(effectiveGiverId)));
          const giverChar = characters.find(ch => String(ch.id) === String(effectiveGiverId));
          const effectiveGiverName = (() => {
            if (effectiveGiverId === 'master') return '⚜️ El Máster (Alijo)';
            if (giverToken) return giverToken.name;
            if (giverChar) return giverChar.name;
            return 'Emisor';
          })();

          // Inventario del que lo da
          const giverInventory = Array.isArray(giverToken?.inventory)
            ? giverToken.inventory
            : (Array.isArray(giverChar?.inventory) ? giverChar.inventory : []);

          // Destinatarios disponibles: excluye estrictamente al que lo da
          const recipientTokens = tokens.filter(t => {
            if (effectiveGiverId === 'master') return true;
            if (String(t.id) === String(effectiveGiverId)) return false;
            if (t.characterId && String(t.characterId) === String(effectiveGiverId)) return false;
            if (giverToken && t.characterId && giverToken.characterId && String(t.characterId) === String(giverToken.characterId)) return false;
            if (effectiveGiverName && t.name.trim().toLowerCase() === effectiveGiverName.trim().toLowerCase()) return false;
            return true;
          });

          const recipientCharacters = characters.filter(c => {
            if (effectiveGiverId === 'master') return true;
            if (String(c.id) === String(effectiveGiverId)) return false;
            if (giverToken && giverToken.characterId && String(c.id) === String(giverToken.characterId)) return false;
            if (effectiveGiverName && c.name.trim().toLowerCase() === effectiveGiverName.trim().toLowerCase()) return false;
            return true;
          });

          const isValidRecipient = (id) => {
            if (!id) return false;
            return recipientTokens.some(t => String(t.id) === String(id) || (t.characterId && String(t.characterId) === String(id))) ||
                   recipientCharacters.some(c => String(c.id) === String(id));
          };

          const effectiveRecipientId = isValidRecipient(selectedRecipientId)
            ? selectedRecipientId
            : (recipientTokens[0] ? String(recipientTokens[0].id) : (recipientCharacters[0] ? String(recipientCharacters[0].id) : ''));

          const effectiveRecipientName = (() => {
            const foundT = recipientTokens.find(t => String(t.id) === String(effectiveRecipientId) || (t.characterId && String(t.characterId) === String(effectiveRecipientId)));
            if (foundT) return foundT.name;
            const foundC = recipientCharacters.find(c => String(c.id) === String(effectiveRecipientId));
            return foundC ? foundC.name : 'Nadie disponible';
          })();

          const q = itemSearchQuery.toLowerCase().trim();
          const filteredCommonItems = commonItems.filter(item =>
            !q ||
            item.name.toLowerCase().includes(q) ||
            (item.notes && item.notes.toLowerCase().includes(q)) ||
            (item.category && item.category.toLowerCase().includes(q))
          );

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
              
              {/* ========================================================= */}
              {/* 1. SECCIÓN PRINCIPAL: CATÁLOGO COMÚN (Encabezado + Buscador) */}
              {/* ========================================================= */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                backgroundColor: '#121622',
                border: '1px solid #283042',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={15} strokeWidth={2.2} style={{ color: '#fbbf24' }} />
                    <span className="vtt-gothic-title" style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.04em' }}>
                      Catálogo Común de Objetos
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, backgroundColor: '#0c0f17', padding: '2px 7px', borderRadius: '4px', border: '1px solid #252d3d' }}>
                    {commonItems.length} plantillas
                  </span>
                </div>

                {/* Buscador de Objetos del Catálogo */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '10px', display: 'flex', alignItems: 'center', color: '#64748b', pointerEvents: 'none' }}>
                    <Search size={13} strokeWidth={2.2} />
                  </span>
                  <input
                    type="text"
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    placeholder="Buscar mechero, cuerda, linterna, ganzúa, botiquín..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#0c0f17',
                      border: '1px solid #2d3748',
                      borderRadius: '6px',
                      padding: '7px 30px 7px 30px',
                      color: '#f8fafc',
                      fontSize: '11px',
                      outline: 'none'
                    }}
                  />
                  {itemSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setItemSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '11px',
                        padding: '2px'
                      }}
                      title="Borrar búsqueda"
                    >
                      <X size={12} strokeWidth={2.4} />
                    </button>
                  )}
                </div>

                {/* Lista de Objetos del Catálogo (Solo visible si hay búsqueda activa) */}
                {Boolean(itemSearchQuery.trim()) && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    marginTop: '4px'
                  }}>
                    {filteredCommonItems.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px 8px', color: '#64748b', fontSize: '11px', fontStyle: 'italic' }}>
                        No se encontraron objetos que coincidan con "{itemSearchQuery}".
                      </div>
                    ) : (
                      filteredCommonItems.map(item => {
                        const isDefaultPreset = typeof item.id === 'string' && item.id.startsWith('item_');

                        return (
                          <div
                            key={item.id}
                            style={{
                              backgroundColor: '#0c0f17',
                              border: '1px solid #232d3f',
                              borderRadius: '7px',
                              padding: '8px 10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                              <span style={{ fontSize: '17px', flexShrink: 0 }}>{item.icon || '📦'}</span>
                              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                    {item.name}
                                  </span>
                                  {item.category && (
                                    <span style={{
                                      fontSize: '9px',
                                      backgroundColor: '#161f30',
                                      color: '#93c5fd',
                                      padding: '1px 5px',
                                      borderRadius: '3px',
                                      fontWeight: 600,
                                      border: '1px solid rgba(59, 130, 246, 0.3)'
                                    }}>
                                      {item.category}
                                    </span>
                                  )}
                                </div>
                                {item.notes && (
                                  <span style={{ fontSize: '9.5px', color: '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={item.notes}>
                                    {item.notes}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                              {onPlaceGroundItem && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onPlaceGroundItem(item);
                                    onClose();
                                  }}
                                  className="vtt-brass-btn"
                                  style={{
                                    padding: '3px 7px',
                                    borderRadius: '5px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    color: '#38bdf8',
                                    borderColor: '#0284c7'
                                  }}
                                  title="Colocar en el suelo del tablero para que los personajes puedan recogerlo"
                                >
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapPin size={11} strokeWidth={2.2} /> Suelo</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  if (onGiveItemToCharacter) {
                                    if (effectiveRecipientId) {
                                      onGiveItemToCharacter(effectiveRecipientId, item);
                                    } else {
                                      notify('Selecciona un destinatario abajo para entregar');
                                    }
                                  }
                                }}
                                disabled={!effectiveRecipientId}
                                className="vtt-brass-btn"
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '5px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  cursor: effectiveRecipientId ? 'pointer' : 'default',
                                  color: '#fbbf24',
                                  borderColor: '#f59e0b',
                                  opacity: effectiveRecipientId ? 1 : 0.4
                                }}
                                title={effectiveRecipientId ? `Entregar a ${effectiveRecipientName}` : 'Selecciona un destinatario abajo'}
                              >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Gift size={11} strokeWidth={2.2} /> Entregar</span>
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
                                    fontSize: '11px',
                                    padding: '2px 4px'
                                  }}
                                  title="Eliminar plantilla del catálogo"
                                >
                                  <Trash2 size={13} strokeWidth={2.2} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* 2. SECCIÓN: CREAR / FORJAR NUEVO OBJETO (Justo debajo)     */}
              {/* ========================================================= */}
              <div style={{
                backgroundColor: '#121622',
                border: '1px solid #283042',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div
                  onClick={() => setIsCreatorExpanded(!isCreatorExpanded)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Hammer size={15} strokeWidth={2.2} style={{ color: '#f59e0b' }} />
                    <span className="vtt-gothic-title" style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b', letterSpacing: '0.04em' }}>
                      Forjar Nuevo Objeto
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>
                    {isCreatorExpanded ? '▲ Plegar' : '▼ Desplegar'}
                  </span>
                </div>

                {isCreatorExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '6px', borderTop: '1px solid #242c3d' }}>
                    {/* Nombre del objeto */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                        Nombre del Objeto:
                      </label>
                      <input
                        type="text"
                        value={commonItemName}
                        onChange={(e) => setCommonItemName(e.target.value)}
                        placeholder="Ej: Mechero de latón con iniciales / Daga ritual"
                        style={{
                          backgroundColor: '#0c0f17',
                          border: '1px solid #2d3748',
                          borderRadius: '6px',
                          padding: '7px 9px',
                          color: '#f8fafc',
                          fontSize: '11px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Selector de Icono Popular */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                        Icono:
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', backgroundColor: '#0c0f17', padding: '5px', borderRadius: '6px', border: '1px solid #232d3f' }}>
                        {POPULAR_ITEM_ICONS.map(ic => (
                          <button
                            key={ic}
                            type="button"
                            onClick={() => setCommonItemIcon(ic)}
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '4px',
                              border: commonItemIcon === ic ? '1.5px solid #f59e0b' : '1px solid transparent',
                              backgroundColor: commonItemIcon === ic ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                              fontSize: '13px',
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

                    {/* Categoría y Ubicación en Ficha */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                          Categoría:
                        </label>
                        <select
                          value={commonItemCategory}
                          onChange={(e) => setCommonItemCategory(e.target.value)}
                          style={{
                            backgroundColor: '#0c0f17',
                            border: '1px solid #2d3748',
                            borderRadius: '6px',
                            padding: '6px 8px',
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

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                          Ubicación:
                        </label>
                        <select
                          value={commonItemState}
                          onChange={(e) => setCommonItemState(e.target.value)}
                          style={{
                            backgroundColor: '#0c0f17',
                            border: '1px solid #2d3748',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            color: '#f8fafc',
                            fontSize: '11px',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="equipped">Equipado (Puesto)</option>
                          <option value="hand">A mano (Bolsillo / Cinturón)</option>
                          <option value="stored">Guardado (Mochila)</option>
                        </select>
                      </div>
                    </div>

                    {/* Notas / Propiedades */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <label style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                        Notas / Propiedades:
                      </label>
                      <input
                        type="text"
                        value={commonItemNotes}
                        onChange={(e) => setCommonItemNotes(e.target.value)}
                        placeholder="Detalles sobre el objeto, inscripciones, bonificaciones..."
                        style={{
                          backgroundColor: '#0c0f17',
                          border: '1px solid #2d3748',
                          borderRadius: '6px',
                          padding: '6px 9px',
                          color: '#f8fafc',
                          fontSize: '11px',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Botones de Guardar / Entregar / En Suelo */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
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
                          notify(`Objeto "${itemObj.name}" guardado en el catálogo`);
                        }}
                        disabled={!commonItemName.trim()}
                        className="vtt-brass-btn"
                        style={{
                          flex: 1,
                          padding: '7px 8px',
                          borderRadius: '5px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: commonItemName.trim() ? 'pointer' : 'default',
                          opacity: commonItemName.trim() ? 1 : 0.4
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Save size={12} strokeWidth={2.2} /> Guardar</span>
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
                            padding: '7px 8px',
                            borderRadius: '5px',
                            fontSize: '10px',
                            fontWeight: 700,
                            cursor: commonItemName.trim() ? 'pointer' : 'default',
                            color: '#38bdf8',
                            borderColor: '#0284c7',
                            opacity: commonItemName.trim() ? 1 : 0.4
                          }}
                          title="Colocar directamente en el suelo del tablero"
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapPin size={11} strokeWidth={2.2} /> En Suelo</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (!commonItemName.trim()) return;
                          if (!effectiveRecipientId) {
                            notify('Selecciona un destinatario abajo para entregar');
                            return;
                          }
                          const itemObj = {
                            id: `custom_item_${Date.now()}`,
                            name: commonItemName.trim(),
                            icon: commonItemIcon,
                            category: commonItemCategory,
                            state: commonItemState,
                            notes: commonItemNotes.trim()
                          };
                          if (onGiveItemToCharacter) onGiveItemToCharacter(effectiveRecipientId, itemObj);
                          setCommonItemName('');
                          setCommonItemNotes('');
                        }}
                        disabled={!commonItemName.trim() || !effectiveRecipientId}
                        className="vtt-brass-btn"
                        style={{
                          flex: 1.2,
                          padding: '7px 8px',
                          borderRadius: '5px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: commonItemName.trim() && effectiveRecipientId ? 'pointer' : 'default',
                          color: '#fbbf24',
                          borderColor: '#f59e0b',
                          opacity: commonItemName.trim() && effectiveRecipientId ? 1 : 0.4
                        }}
                        title={effectiveRecipientId ? `Entregar directamente a ${effectiveRecipientName}` : 'Selecciona un destinatario abajo'}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Gift size={11} strokeWidth={2.2} /> Entregar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* 3. SECCIÓN: TRASPASO DE OBJETOS ENTRE PERSONAJES (Abajo)  */}
              {/* ========================================================= */}
              <div style={{
                backgroundColor: '#141824',
                border: '1px solid #2b3345',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowLeftRight size={15} strokeWidth={2.2} style={{ color: '#fbbf24' }} />
                  <div>
                    <span className="vtt-gothic-title" style={{ fontSize: '13px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Traspaso de Objetos entre Personajes
                    </span>
                    <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#94a3b8' }}>
                      Transfiere pertenencias directamente del inventario de un personaje a otro.
                    </p>
                  </div>
                </div>

                {/* Fila de Selectores: Quién lo da ➔ Destinatario */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '8px' }}>
                  {/* Quién lo da */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                    <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                      Quién lo da:
                    </span>
                    <select
                      value={effectiveGiverId}
                      onChange={(e) => setSelectedGiverId(e.target.value)}
                      style={{
                        backgroundColor: '#0c0f17',
                        color: '#cbd5e1',
                        border: '1px solid #333d52',
                        borderRadius: '5px',
                        padding: '5px 7px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        outline: 'none',
                        width: '100%',
                        textOverflow: 'ellipsis'
                      }}
                      title="Personaje que entrega el objeto (queda excluido de los destinatarios)"
                    >
                      <option value="master">⚜️ El Máster (Alijo)</option>
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
                        <optgroup label="Biblioteca">
                          {characters.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {/* Flecha indicadora */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '14px', color: '#fbbf24', fontSize: '13px', fontWeight: 700 }}>
                    <ArrowRight size={14} strokeWidth={2.4} />
                  </div>

                  {/* Destinatario de Entrega */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                    <span style={{ fontSize: '9.5px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
                      Destinatario de Entrega:
                    </span>
                    <select
                      value={effectiveRecipientId}
                      onChange={(e) => setSelectedRecipientId(e.target.value)}
                      style={{
                        backgroundColor: '#0c0f17',
                        color: effectiveRecipientId ? '#f8fafc' : '#ef4444',
                        border: '1px solid #333d52',
                        borderRadius: '5px',
                        padding: '5px 7px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        outline: 'none',
                        width: '100%',
                        textOverflow: 'ellipsis'
                      }}
                      title="Personaje que recibe el objeto (excluye al que lo da)"
                    >
                      {recipientTokens.length > 0 && (
                        <optgroup label="En Tablero (Escena)">
                          {recipientTokens.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {recipientCharacters.length > 0 && (
                        <optgroup label="Biblioteca de Personajes">
                          {recipientCharacters.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {recipientTokens.length === 0 && recipientCharacters.length === 0 && (
                        <option value="" disabled>Sin otros destinatarios disponibles</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Inventario del Emisor para Traspasar */}
                {effectiveGiverId !== 'master' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                      Inventario de {effectiveGiverName} ({giverInventory.length}):
                    </span>
                    {giverInventory.length === 0 ? (
                      <div style={{
                        fontSize: '11px',
                        color: '#64748b',
                        fontStyle: 'italic',
                        padding: '10px',
                        backgroundColor: '#0c0f17',
                        borderRadius: '6px',
                        textAlign: 'center',
                        border: '1px dashed #242c3d'
                      }}>
                        {effectiveGiverName} no tiene objetos en su inventario para transferir.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
                        {giverInventory.map(item => (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 10px',
                              backgroundColor: '#0c0f17',
                              border: '1px solid #232d3f',
                              borderRadius: '6px',
                              gap: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                              <span style={{ fontSize: '15px' }}>{item.icon || '📦'}</span>
                              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {item.name}
                                </span>
                                {item.notes && (
                                  <span style={{ fontSize: '9px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (onTransferItem && effectiveRecipientId) {
                                  onTransferItem(effectiveGiverId, effectiveRecipientId, item);
                                }
                              }}
                              disabled={!effectiveRecipientId}
                              className="vtt-brass-btn"
                              style={{
                                padding: '3px 8px',
                                borderRadius: '5px',
                                fontSize: '10px',
                                fontWeight: 700,
                                cursor: effectiveRecipientId ? 'pointer' : 'default',
                                color: '#38bdf8',
                                borderColor: '#0284c7',
                                whiteSpace: 'nowrap',
                                opacity: effectiveRecipientId ? 1 : 0.4
                              }}
                              title={effectiveRecipientId ? `Transferir "${item.name}" a ${effectiveRecipientName}` : 'Selecciona un destinatario'}
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Traspasar <ArrowRight size={11} strokeWidth={2.4} /></span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          );
        })()}

        {/* PESTAÑA: ESTADOS Y CONDICIONES ALTERADAS */}
        {activeTab === 'estados' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflow: 'hidden' }}>
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
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><ImagePlus size={12} strokeWidth={2.2} /> Subir Icono</span>
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
                      {status.effect === 'immobilize' && <span style={{ fontSize: '10px', color: '#f87171' }}><Lock size={11} strokeWidth={2.2} /></span>}
                      <button onClick={() => onRemoveCustomStatus(status.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', marginLeft: '2px' }}><X size={12} strokeWidth={2.5} /></button>
                    </div>
                  );
                })}
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
                className="vtt-brass-plate-btn"
                style={{
                  padding: '9px 22px',
                  fontSize: '13px',
                  cursor: isSavingAdventure ? 'not-allowed' : 'pointer',
                  opacity: isSavingAdventure ? 0.7 : 1
                }}
              >
                {isSavingAdventure ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                    <span>Guardando Aventura...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} strokeWidth={2.2} />
                    <span>Guardar Aventura</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GÓTICO: CONCLUIR AVENTURA Y ARCHIVAR */}
      {isConcludeModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(5, 7, 12, 0.88)',
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
              maxWidth: '580px',
              backgroundColor: '#121620',
              backgroundImage: 'linear-gradient(180deg, rgba(24, 20, 28, 0.96) 0%, rgba(14, 12, 18, 0.98) 100%), url("/assets/textures/parchment_dossier_texture.jpg")',
              backgroundBlendMode: 'overlay',
              borderRadius: '12px',
              border: '1.5px solid rgba(245, 158, 11, 0.6)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(245, 158, 11, 0.2)',
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
              borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
              background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.15) 0%, rgba(0, 0, 0, 0.3) 100%)'
            }}>
              <div>
                <h3 className="vtt-gothic-title" style={{ margin: 0, fontSize: '18px', color: '#fbbf24', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Scroll size={14} strokeWidth={2.2} /> Concluir Aventura y Archivar
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  Sella esta crónica de forma permanente, archívala y despeja la mesa para tu próxima historia.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsConcludeModalOpen(false)}
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
              {/* Campo Nombre de la Aventura Concluida */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Título Definitivo de la Crónica Concluida
                </label>
                <input
                  type="text"
                  value={concludeNameInput}
                  onChange={(e) => setConcludeNameInput(e.target.value)}
                  placeholder="Ej. Las Máscaras de Nyarlathotep — Concluida"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #475569',
                    backgroundColor: '#0a0d14',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#f59e0b')}
                  onBlur={(e) => (e.target.style.borderColor = '#475569')}
                />
              </div>

              {/* Estadísticas de la Aventura que se archiva */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(15, 20, 30, 0.7)',
                border: '1px solid rgba(245, 158, 11, 0.25)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f8fafc' }}>{scenes.length}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Escenarios</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#60a5fa' }}>{characters.length}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Personajes</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f87171' }}>{tokens.length}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Fichas Activas</div>
                </div>
              </div>

              {/* Opción Exportar Archivo JSON */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#e2e8f0', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={concludeExportJson}
                  onChange={(e) => setConcludeExportJson(e.target.checked)}
                  style={{ accentColor: '#f59e0b', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span>Descargar copia final de seguridad en archivo <strong>.json</strong></span>
              </label>

              {/* Aviso explicativo */}
              <div style={{
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontSize: '11px',
                color: '#cbd5e1',
                lineHeight: 1.5
              }}>
                ℹ️ <strong>Mesa Limpia:</strong> La crónica quedará archivada en tu historial como <em>«Concluida»</em> y el tablero se vaciará por completo. Cuando abras de nuevo el Grimorio VTT, arrancará <strong>100% limpio y vacío</strong> hasta que inicies una nueva aventura o cargues una anterior.
              </div>
            </div>

            {/* Pie del Modal: Acciones */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 20px',
              borderTop: '1px solid rgba(245, 158, 11, 0.25)',
              background: 'rgba(10, 13, 20, 0.85)'
            }}>
              <button
                type="button"
                onClick={() => setIsConcludeModalOpen(false)}
                disabled={isConcluding}
                style={{
                  background: 'none',
                  border: '1px solid #475569',
                  color: '#94a3b8',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: isConcluding ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmConcludeAdventure}
                disabled={isConcluding}
                className="vtt-conclude-plate-btn"
                style={{
                  padding: '9px 22px',
                  fontSize: '13px',
                  cursor: isConcluding ? 'not-allowed' : 'pointer',
                  opacity: isConcluding ? 0.7 : 1
                }}
              >
                {isConcluding ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                    <span>Sellando Crónica...</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    <span>Sellar y Vaciar Mesa</span>
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
