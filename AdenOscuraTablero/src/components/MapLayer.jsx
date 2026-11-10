import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { isPointVisibleToPlayers } from './FogLayer';
import {
  Eye,
  EyeOff,
  Captions,
  CaptionsOff,
  Lock,
  Unlock,
  Copy,
  Projector,
  Trash2,
  Pencil,
  Hand,
  RotateCw,
  Flame,
  Moon,
  FileText,
  Zap
} from 'lucide-react';

const MapLayer = ({
  maps,
  tokens = [],
  fowCanvasRef,
  fowEnabled = false,
  fowVisionRadius = 180,
  isPlayerView = false,
  draggedMapElement = null,
  onMapElementPointerDown,
  onRotateMapElement,
  onToggleMapElementLock,
  onUpdateMapElement,
  onDuplicateMapElement,
  onInspectObject,
  onRemoveMapElement,
  onToggleDoor,
  onToggleWindow,
  onToggleObject,
  onToggleLight,
  onProjectHandout,
  activeTurnTokenId = null,
  onPickUpItem
}) => {
  const [readingNote, setReadingNote] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    if (contextMenu.visible) {
      document.addEventListener('pointerdown', handleClickOutside, true);
    }
    return () => document.removeEventListener('pointerdown', handleClickOutside, true);
  }, [contextMenu.visible]);

  // RADAR DE NIEBLA: Comprobación geométrica ultra-rápida (CPU pura, sin lecturas lentas de textura GPU)
  const visibleElements = useMemo(() => {
    if (!fowEnabled || !isPlayerView) return {};
    const vis = {};
    for (let i = 0; i < maps.length; i++) {
      const element = maps[i];
      if (element.type === 'note' || element.type === 'door' || element.type === 'window' || element.type === 'object' || element.type === 'light' || element.type === 'item') {
        const centerX = element.x + ((element.width || 40) / 2);
        const centerY = element.y + ((element.height || 40) / 2);
        vis[element.id] = isPointVisibleToPlayers(centerX, centerY, tokens, maps, fowVisionRadius);
      }
    }
    return vis;
  }, [maps, tokens, fowEnabled, isPlayerView, fowVisionRadius]);

  return (
    <>
      {maps.map((element) => {
        if (element.type === 'image' || !element.type) {
          return (
            <img
              key={element.id} src={element.src || element.url} alt="map"
              style={{
                position: 'absolute', left: `${element.x}px`, top: `${element.y}px`,
                width: `${element.width}px`, height: `${element.height}px`,
                pointerEvents: 'none', userSelect: 'none', WebkitUserDrag: 'none',
                boxShadow: '0 10px 30px rgba(0,0,0,0.75)', zIndex: 0
              }}
              draggable={false}
            />
          );
        }

        if (element.type === 'note') {
          if (isPlayerView && fowEnabled && !visibleElements[element.id]) {
            return null; 
          }

          return (
            <div
              key={element.id}
              onPointerDown={(e) => { 
                e.stopPropagation(); 
                setReadingNote(element); 
              }}
              style={{
                position: 'absolute', left: `${element.x}px`, top: `${element.y}px`,
                width: '40px', height: '40px',
                background: 'radial-gradient(circle, #f3e5ab 0%, #c5a059 100%)',
                borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', border: '2px solid #5c3a21', boxShadow: '0 4px 10px rgba(0,0,0,0.8)',
                fontSize: '22px', zIndex: 6
              }}
              title="Leer Pergamino"
            >
              📜
            </div>
          );
        }

        if (element.type === 'object') {
          if (isPlayerView && (element.isHidden || (fowEnabled && !visibleElements[element.id]))) {
            return null;
          }

          const isDragging = draggedMapElement === element.id;

          return (
            <div
              key={element.id}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isPlayerView) return;
                setIsEditingMenu(false); setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item: element });
              }}
              onPointerDown={(e) => {
                if (isPlayerView) return;
                if (e.button === 0 && !element.isLocked) {
                  e.stopPropagation();
                  if (onMapElementPointerDown) onMapElementPointerDown(e, element);
                } else if (e.button === 2) {
                  e.stopPropagation();
                }
              }}
              style={{
                position: 'absolute',
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: `${element.width || 48}px`,
                height: `${element.height || 48}px`,
                background: element.isOpen
                  ? 'radial-gradient(circle, rgba(20, 83, 45, 0.75) 0%, rgba(5, 46, 22, 0.85) 100%)'
                  : 'radial-gradient(circle, #3a2618 0%, #170f0a 100%)',
                border: isDragging
                  ? '2px dashed #fbbf24'
                  : (element.isOpen ? '2px solid #4ade80' : '2px solid #d4af37'),
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isPlayerView ? 'default' : (element.isLocked ? 'pointer' : (isDragging ? 'grabbing' : 'grab')),
                boxShadow: isDragging ? '0 10px 25px rgba(245, 158, 11, 0.6)' : '0 6px 14px rgba(0,0,0,0.85)',
                zIndex: isDragging ? 1000 : 6,
                fontSize: '22px',
                userSelect: 'none',
                opacity: isDragging ? 0.85 : (!isPlayerView && element.isHidden ? 0.45 : 1),
                transition: isDragging ? 'none' : 'border 0.2s, box-shadow 0.2s, opacity 0.2s'
              }}
              title={`${element.name || 'Objeto'} (${element.isOpen ? 'Abierto' : 'Cerrado'}${element.isLocked ? ' 🔒' : ''}${element.isHidden ? ' 👁️‍🗨️ Oculto' : ''} - Arrastra para mover o clic derecho)`}
            >
              {element.isOpen ? (element.openIcon || '🪙') : (element.icon || '📦')}
              {!isPlayerView && element.isHidden && (
                <span style={{ position: 'absolute', top: -4, left: -4, fontSize: '10px' }} title="Oculto a jugadores">👁️‍🗨️</span>
              )}
              {!isPlayerView && element.isLocked && (
                <span style={{ position: 'absolute', top: -4, right: -4, fontSize: '10px' }} title="Posición bloqueada">🔒</span>
              )}
              {!isPlayerView && (element.notes || element.linkedHandoutId || element.customClueText) && (
                <span style={{ position: 'absolute', bottom: -4, right: -4, fontSize: '10px' }} title="Tiene notas o pistas asociadas">📜</span>
              )}
              {element.showName === true && (
                <div style={{
                  position: 'absolute',
                  bottom: '-18px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(10, 12, 18, 0.88)',
                  color: '#fef08a',
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.8)'
                }}>
                  {element.name}
                </div>
              )}
            </div>
          );
        }

        if (element.type === 'item') {
          if (isPlayerView && (element.isHidden || (fowEnabled && !visibleElements[element.id]))) {
            return null;
          }

          const isDragging = draggedMapElement === element.id;

          return (
            <div
              key={element.id}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isPlayerView) return;
                setIsEditingMenu(false); setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item: element });
              }}
              onPointerDown={(e) => {
                if (isPlayerView) return;
                if (e.button === 0 && !element.isLocked) {
                  e.stopPropagation();
                  if (onMapElementPointerDown) onMapElementPointerDown(e, element);
                } else if (e.button === 2) {
                  e.stopPropagation();
                }
              }}
              style={{
                position: 'absolute',
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: `${element.width || 38}px`,
                height: `${element.height || 38}px`,
                background: 'radial-gradient(circle, rgba(245, 158, 11, 0.28) 0%, rgba(20, 15, 10, 0.95) 100%)',
                border: isDragging
                  ? '2px dashed #fbbf24'
                  : (element.isHidden ? '1.5px dashed #c084fc' : '1.5px solid #d4af37'),
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isPlayerView ? 'default' : (element.isLocked ? 'pointer' : (isDragging ? 'grabbing' : 'grab')),
                boxShadow: isDragging
                  ? '0 10px 25px rgba(245, 158, 11, 0.6)'
                  : '0 4px 12px rgba(0,0,0,0.85), 0 0 10px rgba(245, 158, 11, 0.35)',
                zIndex: isDragging ? 1000 : 6,
                fontSize: '18px',
                userSelect: 'none',
                opacity: isDragging ? 0.85 : (!isPlayerView && element.isHidden ? 0.45 : 1),
                transition: isDragging ? 'none' : 'border 0.2s, box-shadow 0.2s, opacity 0.2s'
              }}
              title={`${element.name || 'Objeto'} en el suelo (${element.isLocked ? '🔒 Bloqueado - ' : ''}${element.isHidden ? '👁️‍🗨️ Oculto - ' : ''}Arrastra para mover o clic derecho para opciones)`}
            >
              {element.icon || '📦'}
              {!isPlayerView && element.isHidden && (
                <span style={{ position: 'absolute', top: -3, left: -3, fontSize: '9px' }} title="Oculto a jugadores">👁️‍🗨️</span>
              )}
              {!isPlayerView && element.isLocked && (
                <span style={{ position: 'absolute', top: -3, right: -3, fontSize: '9px' }} title="Posición bloqueada">🔒</span>
              )}
              {/* Etiqueta flotante con el nombre del objeto */}
              {element.showName !== false && (
                <div style={{
                  position: 'absolute',
                  bottom: '-16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(10, 12, 18, 0.88)',
                  color: '#fef08a',
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.8)'
                }}>
                  {element.name}
                </div>
              )}
            </div>
          );
        }

        if (element.type === 'light') {
          if (isPlayerView && (element.isHidden || (!element.isOn && fowEnabled && !visibleElements[element.id]))) {
            return null;
          }

          const isDragging = draggedMapElement === element.id;

          return (
            <div
              key={element.id}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isPlayerView) return;
                setIsEditingMenu(false); setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item: element });
              }}
              onPointerDown={(e) => {
                if (isPlayerView) return;
                if (e.button === 0 && !element.isLocked) {
                  e.stopPropagation();
                  if (onMapElementPointerDown) onMapElementPointerDown(e, element);
                } else if (e.button === 2) {
                  e.stopPropagation();
                }
              }}
              style={{
                position: 'absolute',
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: `${element.width || 36}px`,
                height: `${element.height || 36}px`,
                borderRadius: '50%',
                background: element.isOn !== false
                  ? 'radial-gradient(circle, #b45309 0%, #261810 100%)'
                  : '#140c08',
                border: isDragging
                  ? '2px dashed #fbbf24'
                  : (element.isOn !== false ? '2px solid #fbbf24' : '2px dashed #6b4c2b'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isPlayerView ? 'default' : (element.isLocked ? 'pointer' : (isDragging ? 'grabbing' : 'grab')),
                boxShadow: element.isOn !== false ? '0 0 20px rgba(251, 191, 36, 0.9)' : 'none',
                opacity: isDragging ? 0.85 : (!isPlayerView && element.isHidden ? 0.45 : (element.isOn !== false ? 1 : 0.55)),
                zIndex: isDragging ? 1000 : 7,
                fontSize: '18px',
                userSelect: 'none'
              }}
              title={`${element.name || 'Fuente de Luz'} (${element.isOn !== false ? 'Encendida' : 'Apagada'}${element.isLocked ? ' 🔒' : ''}${element.isHidden ? ' 👁️‍🗨️ Oculto' : ''} - Arrastra para mover o clic derecho)`}
            >
              {element.isOn !== false ? (element.icon || '🔥') : '🌑'}
              {!isPlayerView && element.isHidden && (
                <span style={{ position: 'absolute', top: -4, left: -4, fontSize: '9px' }} title="Oculto a jugadores">👁️‍🗨️</span>
              )}
              {!isPlayerView && element.isLocked && (
                <span style={{ position: 'absolute', top: -4, right: -4, fontSize: '9px' }} title="Posición bloqueada">🔒</span>
              )}
              {element.showName === true && (
                <div style={{
                  position: 'absolute',
                  bottom: '-16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(10, 12, 18, 0.88)',
                  color: '#fef08a',
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.8)'
                }}>
                  {element.name}
                </div>
              )}
            </div>
          );
        }

        if (element.type === 'door') {
          if (isPlayerView && fowEnabled && !visibleElements[element.id]) {
            return null;
          }

          const isDragging = draggedMapElement === element.id;

          return (
            <div
              key={element.id}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isPlayerView) return;
                setIsEditingMenu(false); setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item: element });
              }}
              onPointerDown={(e) => {
                if (isPlayerView) return;
                if (e.button === 0 && !element.isLocked) {
                  e.stopPropagation();
                  if (onMapElementPointerDown) onMapElementPointerDown(e, element);
                } else if (e.button === 2) {
                  e.stopPropagation();
                }
              }}
              style={{
                position: 'absolute',
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: `${element.width || 60}px`,
                height: `${element.height || 16}px`,
                background: element.isOpen
                  ? 'rgba(16, 185, 129, 0.22)'
                  : 'linear-gradient(90deg, #451a03 0%, #78350f 50%, #451a03 100%)',
                border: isDragging
                  ? '2px dashed #fbbf24'
                  : (element.isOpen ? '2px dashed #34d399' : '2px solid #d4af37'),
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isPlayerView ? 'default' : (element.isLocked ? 'pointer' : (isDragging ? 'grabbing' : 'grab')),
                boxShadow: isDragging ? '0 10px 25px rgba(245, 158, 11, 0.6)' : (element.isOpen ? 'none' : '0 4px 12px rgba(0,0,0,0.85)'),
                zIndex: isDragging ? 1000 : 6,
                fontSize: '12px',
                userSelect: 'none',
                transition: isDragging ? 'none' : 'all 0.2s'
              }}
              title={element.isOpen ? 'Puerta Abierta (Arrastra para mover o clic derecho)' : 'Puerta Cerrada (Arrastra para mover o clic derecho)'}
            >
              {element.isOpen ? '🔓' : '🚪'}
              {!isPlayerView && element.isLocked && (
                <span style={{ position: 'absolute', top: -3, right: -3, fontSize: '9px' }}>🔒</span>
              )}
            </div>
          );
        }

        if (element.type === 'window') {
          if (isPlayerView && fowEnabled && !visibleElements[element.id]) {
            return null;
          }

          const isDragging = draggedMapElement === element.id;

          return (
            <div
              key={element.id}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isPlayerView) return;
                setIsEditingMenu(false); setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item: element });
              }}
              onPointerDown={(e) => {
                if (isPlayerView) return;
                if (e.button === 0 && !element.isLocked) {
                  e.stopPropagation();
                  if (onMapElementPointerDown) onMapElementPointerDown(e, element);
                } else if (e.button === 2) {
                  e.stopPropagation();
                }
              }}
              style={{
                position: 'absolute',
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: `${element.width || 60}px`,
                height: `${element.height || 14}px`,
                background: element.isOpen
                  ? 'rgba(56, 189, 248, 0.15)'
                  : 'linear-gradient(90deg, rgba(14, 116, 144, 0.75) 0%, rgba(186, 230, 253, 0.85) 50%, rgba(14, 116, 144, 0.75) 100%)',
                border: isDragging
                  ? '2px dashed #fbbf24'
                  : (element.isOpen ? '2px dashed #7dd3fc' : '2px solid #38bdf8'),
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isPlayerView ? 'default' : (element.isLocked ? 'pointer' : (isDragging ? 'grabbing' : 'grab')),
                boxShadow: isDragging ? '0 10px 25px rgba(245, 158, 11, 0.6)' : (element.isOpen ? 'none' : '0 0 10px rgba(56, 189, 248, 0.45)'),
                zIndex: isDragging ? 1000 : 6,
                fontSize: '11px',
                userSelect: 'none',
                transition: isDragging ? 'none' : 'all 0.2s'
              }}
              title={element.isOpen ? 'Ventana Abierta / Rota (Arrastra para mover o clic derecho)' : 'Ventana Cerrada (Arrastra para mover o clic derecho)'}
            >
              {element.isBroken ? '💥' : (element.isOpen ? '🌬️' : '🪟')}
              {!isPlayerView && element.isLocked && (
                <span style={{ position: 'absolute', top: -3, right: -3, fontSize: '9px' }}>🔒</span>
              )}
            </div>
          );
        }

        return null;
      })}

      {/* GUÍA SUTIL DE PAREDES (Solo visible para el Master) */}
      {!isPlayerView && (
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '8000px', height: '8000px', overflow: 'visible', pointerEvents: 'none', zIndex: 4 }}>
          {maps.filter(el => el.type === 'wall').map(wall => (
            <line
              key={wall.id}
              x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2}
              stroke="rgba(220, 38, 38, 0.42)"
              strokeWidth={6}
              strokeDasharray="8,6"
              strokeLinecap="round"
            />
          ))}
        </svg>
      )}

      {contextMenu.visible && contextMenu.item && createPortal(
        (() => {
          const activeItem = maps.find(m => m.id === contextMenu.item.id) || contextMenu.item;
          const isHidden = Boolean(activeItem.isHidden);
          const isLocked = Boolean(activeItem.isLocked);
          const isNameVisible = activeItem.type === 'item'
            ? activeItem.showName !== false
            : activeItem.showName === true;
          const supportsVisibilityAndName = activeItem.type === 'item' || activeItem.type === 'object' || activeItem.type === 'light';

          const headerIcon = activeItem.type === 'door'
            ? '🚪'
            : activeItem.type === 'window'
            ? '🪟'
            : activeItem.type === 'light'
            ? (activeItem.icon || '🔥')
            : activeItem.type === 'item'
            ? (activeItem.icon || '📦')
            : (activeItem.icon || '📦');

          const headerTitle = activeItem.type === 'door'
            ? 'Control de Puerta'
            : activeItem.type === 'window'
            ? 'Control de Ventana'
            : activeItem.type === 'light'
            ? (activeItem.name || 'Fuente de Luz')
            : activeItem.type === 'item'
            ? (activeItem.name || 'Objeto en el Suelo')
            : (activeItem.name || 'Objeto / Decorado');

          const activeTurnToken = tokens.find(t => t.id === activeTurnTokenId) || null;
          const recipientToken = activeTurnToken || (tokens.length === 1 ? tokens[0] : null);

          return (
            <div
              ref={menuRef}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                top: `${Math.max(12, Math.min(contextMenu.y, window.innerHeight - 430))}px`,
                left: `${Math.max(12, Math.min(contextMenu.x, window.innerWidth - 275))}px`,
                background: 'linear-gradient(180deg, #1b202c 0%, #11141c 100%)',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #3b4254',
                boxShadow: '0 15px 35px rgba(0,0,0,0.95)',
                zIndex: 999999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                width: '256px',
                maxHeight: 'calc(100vh - 24px)',
                overflowY: 'auto',
                color: '#e2e8f0',
                scrollbarWidth: 'thin',
                scrollbarColor: '#475569 transparent'
              }}
            >
              {/* CABECERA */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #283144', paddingBottom: '8px', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>{headerIcon}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span className="vtt-gothic-title" style={{ fontSize: '13px', color: '#f8fafc', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {headerTitle}
                    </span>
                    {activeItem.category && (
                      <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 600 }}>
                        {activeItem.category}
                      </span>
                    )}
                  </div>
                </div>

                {supportsVisibilityAndName && onUpdateMapElement && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isEditingMenu) {
                        setEditName(activeItem.name || '');
                        setEditNotes(activeItem.notes || '');
                        setIsEditingMenu(true);
                      } else {
                        setIsEditingMenu(false);
                      }
                    }}
                    className="vtt-brass-btn"
                    style={{
                      padding: '3px 7px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      borderColor: isEditingMenu ? '#f59e0b' : '#334155',
                      color: isEditingMenu ? '#fbbf24' : '#cbd5e1',
                      flexShrink: 0
                    }}
                    title="Renombrar o editar descripción del objeto"
                  >
                    <Pencil size={13} strokeWidth={2.2} />
                  </button>
                )}
              </div>

              {/* MODO EDICIÓN RÁPIDA EN LÍNEA */}
              {isEditingMenu && onUpdateMapElement && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  backgroundColor: '#0e1118',
                  border: '1px solid #2d3748',
                  borderRadius: '7px',
                  padding: '8px'
                }}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nombre..."
                    style={{
                      backgroundColor: '#161b26',
                      border: '1px solid #334155',
                      borderRadius: '5px',
                      padding: '5px 7px',
                      color: '#f8fafc',
                      fontSize: '11.5px',
                      outline: 'none'
                    }}
                  />
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Descripción o notas..."
                    rows={2}
                    style={{
                      backgroundColor: '#161b26',
                      border: '1px solid #334155',
                      borderRadius: '5px',
                      padding: '5px 7px',
                      color: '#cbd5e1',
                      fontSize: '11px',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateMapElement(activeItem.id, {
                          name: editName.trim() || activeItem.name,
                          notes: editNotes.trim()
                        }, 'Objeto actualizado', '💾');
                        setIsEditingMenu(false);
                      }}
                      className="vtt-primary-cta"
                      style={{ flex: 1, padding: '4px 8px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingMenu(false)}
                      className="vtt-brass-btn"
                      style={{ padding: '4px 8px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* BLOQUE 1: ACCIÓN PRINCIPAL (Según tipo de elemento) */}
              {activeItem.type === 'item' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeItem.notes && !isEditingMenu && (
                    <div style={{
                      fontSize: '11px',
                      color: '#cbd5e1',
                      backgroundColor: '#0e1118',
                      padding: '7px 9px',
                      borderRadius: '6px',
                      borderLeft: '2px solid #f59e0b',
                      lineHeight: 1.4
                    }}>
                      {activeItem.notes}
                    </div>
                  )}

                  {tokens.length === 0 ? (
                    <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '4px 0' }}>
                      Sin fichas en la escena para recogerlo
                    </div>
                  ) : recipientToken ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (onPickUpItem) onPickUpItem(activeItem, recipientToken.id);
                          setContextMenu({ visible: false, x: 0, y: 0, item: null });
                        }}
                        className="vtt-primary-cta"
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <Hand size={14} strokeWidth={2.2} />
                        <span>Coger ➔ {recipientToken.name}</span>
                      </button>

                      {tokens.length > 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            O entregar a otro:
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '110px', overflowY: 'auto' }}>
                            {tokens.filter(t => t.id !== recipientToken.id).map(tok => (
                              <button
                                key={tok.id}
                                type="button"
                                onClick={() => {
                                  if (onPickUpItem) onPickUpItem(activeItem, tok.id);
                                  setContextMenu({ visible: false, x: 0, y: 0, item: null });
                                }}
                                className="vtt-brass-btn"
                                style={{ padding: '5px 8px', fontSize: '11px', borderRadius: '5px', textAlign: 'left', cursor: 'pointer', justifyContent: 'flex-start' }}
                              >
                                🤲 {tok.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '9.5px', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Entregar a personaje:
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '130px', overflowY: 'auto' }}>
                        {tokens.map(tok => (
                          <button
                            key={tok.id}
                            type="button"
                            onClick={() => {
                              if (onPickUpItem) onPickUpItem(activeItem, tok.id);
                              setContextMenu({ visible: false, x: 0, y: 0, item: null });
                            }}
                            className="vtt-brass-btn"
                            style={{
                              padding: '6px 9px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              borderRadius: '5px',
                              textAlign: 'left',
                              cursor: 'pointer',
                              justifyContent: 'flex-start',
                              borderColor: '#b45309',
                              color: '#fef08a'
                            }}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><Hand size={13} strokeWidth={2.2} /> {tok.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeItem.type === 'door' && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (onToggleDoor) onToggleDoor(activeItem.id);
                      setContextMenu({ visible: false, x: 0, y: 0, item: null });
                    }}
                    className="vtt-primary-cta"
                    style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11.5px' }}
                  >
                    {activeItem.isOpen ? 'Cerrar Puerta' : 'Abrir Puerta'}
                  </button>
                  {onRotateMapElement && (
                    <button
                      type="button"
                      onClick={() => {
                        onRotateMapElement(activeItem.id);
                        setContextMenu({ visible: false, x: 0, y: 0, item: null });
                      }}
                      className="vtt-brass-btn"
                      style={{ padding: '7px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11.5px', color: '#38bdf8' }}
                      title="Girar 90 grados"
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><RotateCw size={13} strokeWidth={2.2} /> 90º</span>
                    </button>
                  )}
                </div>
              )}

              {activeItem.type === 'window' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (onToggleWindow) onToggleWindow(activeItem.id, false);
                        setContextMenu({ visible: false, x: 0, y: 0, item: null });
                      }}
                      className="vtt-primary-cta"
                      style={{ flex: 1, padding: '7px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11.5px' }}
                    >
                      {activeItem.isOpen ? 'Cerrar Ventana' : 'Abrir Ventana'}
                    </button>
                    {onRotateMapElement && (
                      <button
                        type="button"
                        onClick={() => {
                          onRotateMapElement(activeItem.id);
                          setContextMenu({ visible: false, x: 0, y: 0, item: null });
                        }}
                        className="vtt-brass-btn"
                        style={{ padding: '7px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11.5px', color: '#38bdf8' }}
                        title="Girar 90 grados"
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><RotateCw size={13} strokeWidth={2.2} /> 90º</span>
                      </button>
                    )}
                  </div>
                  {!activeItem.isOpen && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onToggleWindow) onToggleWindow(activeItem.id, true);
                        setContextMenu({ visible: false, x: 0, y: 0, item: null });
                      }}
                      style={{
                        padding: '7px 10px',
                        background: 'linear-gradient(180deg, #991b1b 0%, #450a0a 100%)',
                        color: '#fecaca',
                        border: '1px solid #f87171',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '11.5px'
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}><Zap size={13} strokeWidth={2.2} /> Romper Cristal</span>
                    </button>
                  )}
                </div>
              )}

              {activeItem.type === 'object' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (onToggleObject) onToggleObject(activeItem.id);
                      setContextMenu({ visible: false, x: 0, y: 0, item: null });
                    }}
                    className="vtt-primary-cta"
                    style={{ padding: '7px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11.5px' }}
                  >
                    {activeItem.isOpen ? 'Cerrar / Reiniciar' : 'Abrir / Activar'}
                  </button>

                  {onInspectObject && (
                    <button
                      type="button"
                      onClick={() => {
                        onInspectObject(activeItem);
                        setContextMenu({ visible: false, x: 0, y: 0, item: null });
                      }}
                      className="vtt-brass-btn"
                      style={{ padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11.5px', borderColor: '#f59e0b', color: '#fbbf24' }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}><FileText size={13} strokeWidth={2.2} /> Notas & Pistas</span>
                    </button>
                  )}

                  {(activeItem.customClueText || activeItem.linkedHandoutId) && onProjectHandout && (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeItem.linkedHandoutId) {
                          onProjectHandout({ id: activeItem.linkedHandoutId });
                        } else if (activeItem.customClueText) {
                          onProjectHandout({
                            type: 'note',
                            title: `Pista: ${activeItem.name || 'Objeto'}`,
                            content: activeItem.customClueText
                          });
                        }
                        setContextMenu({ visible: false, x: 0, y: 0, item: null });
                      }}
                      className="vtt-brass-btn"
                      style={{ padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11.5px', color: '#38bdf8', borderColor: '#0284c7' }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}><Projector size={13} strokeWidth={2.2} /> Desvelar Pista</span>
                    </button>
                  )}
                </div>
              )}

              {activeItem.type === 'light' && (
                <button
                  type="button"
                  onClick={() => {
                    if (onToggleLight) onToggleLight(activeItem.id);
                    setContextMenu({ visible: false, x: 0, y: 0, item: null });
                  }}
                  className="vtt-primary-cta"
                  style={{ padding: '7px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11.5px' }}
                >
                  {activeItem.isOn !== false ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Moon size={13} strokeWidth={2.2} /> Apagar Luz</span> : <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Flame size={13} strokeWidth={2.2} /> Encender Luz</span>}
                </button>
              )}

              {/* BLOQUE 2: BARRA COMPACTA DE ICONOS (Estilo uniforme Lucide) */}
              <div style={{
                borderTop: '1px solid #242c3d',
                paddingTop: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '5px'
              }}>
                {/* 1. Visibilidad para Jugadores */}
                {supportsVisibilityAndName && onUpdateMapElement && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateMapElement(
                        activeItem.id,
                        { isHidden: !isHidden },
                        !isHidden ? 'Elemento oculto a jugadores' : 'Elemento visible a jugadores',
                        !isHidden ? '👁️‍🗨️' : '👁️'
                      );
                    }}
                    style={{
                      flex: 1,
                      height: '34px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isHidden ? 'linear-gradient(180deg, #6b21a8 0%, #3b0764 100%)' : '#171c26',
                      border: isHidden ? '1px solid #c084fc' : '1px solid #2b3345',
                      color: isHidden ? '#f3e8ff' : '#cbd5e1',
                      transition: 'all 0.15s ease'
                    }}
                    title={isHidden ? 'Oculto a jugadores (clic para mostrar)' : 'Visible a jugadores (clic para ocultar)'}
                  >
                    {isHidden ? <EyeOff size={16} strokeWidth={2.2} /> : <Eye size={16} strokeWidth={2.2} />}
                  </button>
                )}

                {/* 2. Mostrar / Ocultar Nombre */}
                {supportsVisibilityAndName && onUpdateMapElement && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateMapElement(
                        activeItem.id,
                        { showName: !isNameVisible },
                        !isNameVisible ? 'Nombre visible en el tablero' : 'Nombre oculto en el tablero',
                        '🏷️'
                      );
                    }}
                    style={{
                      flex: 1,
                      height: '34px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isNameVisible ? 'rgba(245, 158, 11, 0.14)' : '#171c26',
                      border: isNameVisible ? '1px solid #f59e0b' : '1px solid #2b3345',
                      color: isNameVisible ? '#fbbf24' : '#64748b',
                      transition: 'all 0.15s ease'
                    }}
                    title={isNameVisible ? 'Ocultar etiqueta con el nombre en el tablero' : 'Mostrar etiqueta con el nombre en el tablero'}
                  >
                    {isNameVisible ? <Captions size={16} strokeWidth={2.2} /> : <CaptionsOff size={16} strokeWidth={2.2} />}
                  </button>
                )}

                {/* 3. Bloquear / Desbloquear Posición */}
                {onToggleMapElementLock && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleMapElementLock(activeItem.id);
                    }}
                    style={{
                      flex: 1,
                      height: '34px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isLocked ? 'rgba(245, 158, 11, 0.14)' : '#171c26',
                      border: isLocked ? '1px solid #f59e0b' : '1px solid #2b3345',
                      color: isLocked ? '#fbbf24' : '#cbd5e1',
                      transition: 'all 0.15s ease'
                    }}
                    title={isLocked ? 'Posición bloqueada (clic para desbloquear)' : 'Bloquear posición en el tablero'}
                  >
                    {isLocked ? <Lock size={16} strokeWidth={2.2} /> : <Unlock size={16} strokeWidth={2.2} />}
                  </button>
                )}

                {/* 4. Duplicar */}
                {onDuplicateMapElement && (
                  <button
                    type="button"
                    onClick={() => {
                      onDuplicateMapElement(activeItem);
                      setContextMenu({ visible: false, x: 0, y: 0, item: null });
                    }}
                    style={{
                      flex: 1,
                      height: '34px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#171c26',
                      border: '1px solid #2b3345',
                      color: '#cbd5e1',
                      transition: 'all 0.15s ease'
                    }}
                    title="Duplicar elemento en la escena"
                  >
                    <Copy size={16} strokeWidth={2.2} />
                  </button>
                )}

                {/* 5. Proyectar a Jugadores */}
                {activeItem.type === 'item' && onProjectHandout && (
                  <button
                    type="button"
                    onClick={() => {
                      onProjectHandout({
                        type: 'note',
                        title: `${activeItem.icon || '📦'} ${activeItem.name || 'Objeto'}`,
                        content: activeItem.notes || 'Objeto encontrado sobre el terreno.'
                      });
                      setContextMenu({ visible: false, x: 0, y: 0, item: null });
                    }}
                    style={{
                      flex: 1,
                      height: '34px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(14, 165, 233, 0.12)',
                      border: '1px solid #0284c7',
                      color: '#38bdf8',
                      transition: 'all 0.15s ease'
                    }}
                    title="Proyectar este objeto y sus notas en la pantalla de jugadores"
                  >
                    <Projector size={16} strokeWidth={2.2} />
                  </button>
                )}

                {/* 6. Retirar de la Escena */}
                {onRemoveMapElement && (
                  <button
                    type="button"
                    onClick={() => {
                      onRemoveMapElement(activeItem.id);
                      setContextMenu({ visible: false, x: 0, y: 0, item: null });
                    }}
                    style={{
                      flex: 1,
                      height: '34px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(127, 29, 29, 0.35)',
                      border: '1px solid rgba(239, 68, 68, 0.45)',
                      color: '#fca5a5',
                      transition: 'all 0.15s ease'
                    }}
                    title="Retirar elemento de la escena"
                  >
                    <Trash2 size={16} strokeWidth={2.2} />
                  </button>
                )}
              </div>
            </div>
          );
        })(),
        document.body
      )}

      {/* MODAL DE LECTURA DE PERGAMINO ANTIGUO */}
      {readingNote && createPortal(
        <div 
          onPointerDown={(e) => {
             e.stopPropagation(); 
             setReadingNote(null);
          }}
          onWheel={(e) => e.stopPropagation()} 
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 999999, 
            display: 'flex', justifyContent: 'center', alignItems: 'center' 
          }}
        >
          <div 
            onPointerDown={(e) => e.stopPropagation()} 
            style={{ 
              background: 'radial-gradient(circle, #f7ebd2 0%, #dcc196 100%)',
              padding: '34px',
              borderRadius: '8px', 
              width: '480px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto',
              color: '#3b2314',
              boxShadow: '0 25px 50px rgba(0,0,0,0.95), inset 0 0 35px rgba(120, 53, 15, 0.35)', 
              border: '4px double #5c3a21' 
            }}
          >
            <h2 className="vtt-gothic-title" style={{ margin: '0 0 15px 0', borderBottom: '2px solid #8a6d3b', paddingBottom: '10px', fontSize: '24px', color: '#451a03', textShadow: 'none' }}>
              {readingNote.title}
            </h2>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', margin: 0, fontSize: '18px', fontFamily: "'Crimson Text', Georgia, serif" }}>
              {readingNote.content}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', gap: '10px' }}>
              {!isPlayerView && onProjectHandout && (
                <button
                  onClick={() => {
                    onProjectHandout({
                      type: 'note',
                      title: readingNote.title,
                      content: readingNote.content
                    });
                    setReadingNote(null);
                  }}
                  className="vtt-gothic-title"
                  style={{
                    padding: '10px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    background: 'linear-gradient(180deg, #b45309 0%, #78350f 100%)',
                    color: '#fffbeb',
                    border: '1px solid #fbbf24'
                  }}
                >
                  Proyectar en Pantalla de Jugadores
                </button>
              )}
              <button 
                onClick={() => setReadingNote(null)} 
                className="vtt-brass-btn"
                style={{ padding: '10px 22px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginLeft: 'auto' }}
              >
                Cerrar Pergamino
              </button>
            </div>
          </div>
        </div>,
        document.body 
      )}
    </>
  );
};

export default MapLayer;
