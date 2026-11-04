import React, { useState, useRef } from 'react';
import { OBJECT_PRESETS, LIGHT_PRESETS } from './MapCreator';
import { exportJSON, importJSON } from '../utils/fileDialog';

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
  onMoveSceneOrder, onReorderScenes,
  handouts = [], activeHandout = null, onAddHandout, onRemoveHandout, onProjectHandout
}) => {
  const [activeTab, setActiveTab] = useState('escenario');
  const [bestiarySubTab, setBestiarySubTab] = useState('characters'); // 'characters' | 'statuses'
  const [statusMessage, setStatusMessage] = useState(null);
  const [confirmClearMaps, setConfirmClearMaps] = useState(false);

  // Estados para Escenas y Drag & Drop
  const [newSceneTitle, setNewSceneTitle] = useState('');
  const [draggedSceneIndex, setDraggedSceneIndex] = useState(null);
  const [dragOverSceneIndex, setDragOverSceneIndex] = useState(null);

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

  // Estados para Creador de Objetos y Luces en vivo
  const [objCategory, setObjCategory] = useState('object');
  const [objName, setObjName] = useState(OBJECT_PRESETS[0].label);
  const [objIcon, setObjIcon] = useState(OBJECT_PRESETS[0].icon);
  const [objOpenIcon, setObjOpenIcon] = useState(OBJECT_PRESETS[0].openIcon);
  const [objBlocksMove, setObjBlocksMove] = useState(true);
  const [objBlocksVision, setObjBlocksVision] = useState(false);
  const [lightRadius, setLightRadius] = useState(220);
  const [lightColor, setLightColor] = useState(LIGHT_PRESETS[0].color);

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

  const handleSpawnObjectOnBoard = (e) => {
    e.preventDefault();
    if (!onAddMapElement) return;

    if (objCategory === 'object') {
      onAddMapElement({
        id: Date.now() + Math.random(),
        type: 'object',
        name: objName.trim() || 'Objeto',
        icon: objIcon || '📦',
        openIcon: objOpenIcon || '🪙',
        width: 48,
        height: 48,
        isOpen: false,
        blocksMovement: objBlocksMove,
        blocksVision: objBlocksVision,
        isHidden: false
      });
      notify(`Objeto "${objName}" colocado en la mesa`);
    } else if (objCategory === 'light') {
      onAddMapElement({
        id: Date.now() + Math.random(),
        type: 'light',
        name: objName.trim() || 'Antorcha',
        icon: objIcon || '🔥',
        width: 38,
        height: 38,
        radius: lightRadius,
        color: lightColor,
        isOn: true
      });
      notify(`Fuente de luz "${objName}" colocada en la mesa`);
    } else if (objCategory === 'structure') {
      onAddMapElement({
        id: Date.now() + Math.random(),
        type: objIcon === '🪟' ? 'window' : 'door',
        name: objName.trim() || (objIcon === '🪟' ? 'Ventana' : 'Puerta'),
        width: 60,
        height: 16,
        isOpen: false
      });
      notify(`${objName} colocada en el centro de la mesa`);
    }
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
    { id: 'escenario', icon: '🗺️', label: 'Escenas' },
    { id: 'niebla', icon: '🕯️', label: 'Niebla y Luz' },
    { id: 'bestiario', icon: '🛡️', label: 'Seres y Estados' },
    { id: 'proyector', icon: '🖼️', label: 'Proyector' },
    { id: 'objetos', icon: '📦', label: 'En Escena' },
    { id: 'campana', icon: '💾', label: 'Guardar / Cargar' }
  ];

  const interactiveItemsOnBoard = maps.filter(
    el => el.type === 'object' || el.type === 'light' || el.type === 'door' || el.type === 'window'
  );

  return (
    <div style={{
      position: 'fixed',
      top: '58px',
      right: isOpen ? '0' : '-500px',
      width: '480px',
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
        padding: '14px 20px',
        background: '#10131b',
        borderBottom: '1px solid #262c3a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>⚙️</span>
          <span className="vtt-gothic-title" style={{ fontSize: '15px', fontWeight: 'bold', color: '#f8fafc' }}>
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

      {/* Navegación en Píldoras Modernas (3x2 limpia y muy legible) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '6px',
        padding: '10px 14px',
        background: '#0d1016',
        borderBottom: '1px solid #262c3a'
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                borderRadius: '8px',
                background: isActive ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.22) 0%, rgba(245, 158, 11, 0.08) 100%)' : '#151923',
                border: isActive ? '1px solid #f59e0b' : '1px solid #242a38',
                color: isActive ? '#fbbf24' : '#94a3b8',
                fontSize: '11px',
                fontWeight: isActive ? 700 : 600,
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.icon}</span>
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
                      draggable
                      onDragStart={(e) => {
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
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        backgroundColor: isCurrent ? 'rgba(245, 158, 11, 0.18)' : '#141822',
                        border: isDragOver
                          ? '2px dashed #38bdf8'
                          : isCurrent
                          ? '1px solid #fbbf24'
                          : '1px solid #2c3344',
                        fontSize: '12px',
                        cursor: 'grab',
                        opacity: draggedSceneIndex === idx ? 0.5 : 1,
                        transition: 'all 0.12s ease'
                      }}
                      title="Arrastra para cambiar el orden de la escena"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <span style={{ color: '#64748b', fontSize: '14px', cursor: 'grab', userSelect: 'none' }} title="Arrastrar escena">
                          ⠿
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <span style={{ fontWeight: 'bold', color: isCurrent ? '#fffbeb' : '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {idx + 1}. {sc.name} {isCurrent && <span style={{ color: '#4ade80', fontSize: '10px' }}>(Activa)</span>}
                          </span>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
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
                              onClick={() => onMoveSceneOrder(idx, 'up')}
                              className="vtt-brass-btn"
                              style={{ padding: '1px 5px', fontSize: '9px', borderRadius: '3px', opacity: idx === 0 ? 0.35 : 1, cursor: idx === 0 ? 'default' : 'pointer' }}
                              title="Subir escena"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              disabled={idx === scenes.length - 1}
                              onClick={() => onMoveSceneOrder(idx, 'down')}
                              className="vtt-brass-btn"
                              style={{ padding: '1px 5px', fontSize: '9px', borderRadius: '3px', opacity: idx === scenes.length - 1 ? 0.35 : 1, cursor: idx === scenes.length - 1 ? 'default' : 'pointer' }}
                              title="Bajar escena"
                            >
                              ▼
                            </button>
                          </div>
                        )}
                        {!isCurrent && onSelectScene && (
                          <button
                            onClick={() => {
                              onSelectScene(sc.id);
                              notify(`Escena "${sc.name}" cargada`);
                            }}
                            className="vtt-brass-btn"
                            style={{ padding: '4px 9px', borderRadius: '5px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            Cargar
                          </button>
                        )}
                        {scenes.length > 1 && onDeleteScene && (
                          <button
                            onClick={() => onDeleteScene(sc.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', padding: '0 4px' }}
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
                🗺️ Abrir Editor de Mapas a Pantalla Completa
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

        {/* PESTAÑA 3: OBJETOS Y ELEMENTOS INTERACTIVOS EN EL MAPA */}
        {activeTab === 'objetos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflow: 'hidden' }}>
            <div className="vtt-wood-panel" style={{ padding: '12px 14px', borderRadius: '8px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="vtt-gothic-title" style={{ fontSize: '12px', color: '#c5a059', fontWeight: 'bold' }}>
                  Elementos en el Mapa ({interactiveItemsOnBoard.length})
                </span>
                <button
                  onClick={() => { onClose(); openMapCreator(); }}
                  style={{ background: 'none', border: 'none', color: '#fbbf24', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Abrir Editor de Mapas
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
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    <span>
                      {item.type === 'light' ? (item.icon || '🔥') : item.type === 'door' ? '🚪' : item.type === 'window' ? '🪟' : (item.icon || '📦')}{' '}
                      <strong>{item.name || item.type}</strong>
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {onToggleMapElementState && (
                        <button
                          onClick={() => onToggleMapElementState(item.id)}
                          className="vtt-brass-btn"
                          style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                        >
                          {item.type === 'light'
                            ? (item.isOn !== false ? 'Apagar' : 'Encender')
                            : (item.isOpen ? 'Cerrar' : 'Abrir')}
                        </button>
                      )}
                      {onRemoveMapElement && (
                        <button
                          onClick={() => onRemoveMapElement(item.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {interactiveItemsOnBoard.length === 0 && (
                  <div style={{ color: '#8a6d3b', fontSize: '12px', textAlign: 'center', marginTop: '14px', fontStyle: 'italic' }}>
                    No hay objetos interactivos colocados en esta escena.
                  </div>
                )}
              </div>
            </div>
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
                  border: 'none',
                  background: bestiarySubTab === 'characters' ? '#f59e0b' : 'transparent',
                  color: bestiarySubTab === 'characters' ? '#0f1115' : '#94a3b8'
                }}
              >
                🛡️ Personajes ({characters.length})
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
                  border: 'none',
                  background: bestiarySubTab === 'statuses' ? '#f59e0b' : 'transparent',
                  color: bestiarySubTab === 'statuses' ? '#0f1115' : '#94a3b8'
                }}
              >
                ✨ Estados y Condiciones ({customStatuses.length})
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
                    📜 + Abrir Creador de Nuevo Personaje
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
                        📥 Importar JSON
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
                        📤 Exportar Todo
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
                  📥 Cargar aventura (.json)
                </button>
                <button onClick={onExportCampaign} className="vtt-primary-cta" style={{ flex: 1, padding: '11px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                  📤 Guardar aventura (.json)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsDrawer;