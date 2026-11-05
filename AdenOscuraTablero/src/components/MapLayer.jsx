import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { isPointVisibleToPlayers } from './FogLayer';

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
                setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item: element });
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
                opacity: isDragging ? 0.85 : 1,
                transition: isDragging ? 'none' : 'border 0.2s, box-shadow 0.2s'
              }}
              title={`${element.name || 'Objeto'} (${element.isOpen ? 'Abierto' : 'Cerrado'}${element.isLocked ? ' 🔒' : ''} - Arrastra para mover o clic derecho)`}
            >
              {element.isOpen ? (element.openIcon || '🪙') : (element.icon || '📦')}
              {!isPlayerView && element.isLocked && (
                <span style={{ position: 'absolute', top: -4, right: -4, fontSize: '10px' }} title="Posición bloqueada">🔒</span>
              )}
              {!isPlayerView && (element.notes || element.linkedHandoutId || element.customClueText) && (
                <span style={{ position: 'absolute', bottom: -4, right: -4, fontSize: '10px' }} title="Tiene notas o pistas asociadas">📜</span>
              )}
            </div>
          );
        }

        if (element.type === 'item') {
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
                setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item: element });
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
                  : '1.5px solid #d4af37',
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
                opacity: isDragging ? 0.85 : 1,
                transition: isDragging ? 'none' : 'border 0.2s, box-shadow 0.2s'
              }}
              title={`${element.name || 'Objeto'} en el suelo (${element.isLocked ? '🔒 Bloqueado - ' : ''}Arrastra para mover o clic derecho para coger)`}
            >
              {element.icon || '📦'}
              {!isPlayerView && element.isLocked && (
                <span style={{ position: 'absolute', top: -3, right: -3, fontSize: '9px' }} title="Posición bloqueada">🔒</span>
              )}
              {/* Etiqueta flotante con el nombre del objeto */}
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
            </div>
          );
        }

        if (element.type === 'light') {
          if (isPlayerView && !element.isOn && fowEnabled && !visibleElements[element.id]) {
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
                setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item: element });
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
                opacity: element.isOn !== false ? 1 : 0.55,
                zIndex: isDragging ? 1000 : 7,
                fontSize: '18px',
                userSelect: 'none'
              }}
              title={`${element.name || 'Fuente de Luz'} (${element.isOn !== false ? 'Encendida' : 'Apagada'}${element.isLocked ? ' 🔒' : ''} - Arrastra para mover o clic derecho)`}
            >
              {element.isOn !== false ? (element.icon || '🔥') : '🌑'}
              {!isPlayerView && element.isLocked && (
                <span style={{ position: 'absolute', top: -4, right: -4, fontSize: '9px' }} title="Posición bloqueada">🔒</span>
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
                setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item: element });
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
                setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item: element });
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
        <div
          ref={menuRef}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            background: 'linear-gradient(180deg, #261810 0%, #140c08 100%)',
            padding: '12px',
            borderRadius: '8px',
            border: '2px solid #8a6d3b',
            boxShadow: '0 12px 30px rgba(0,0,0,0.95)',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minWidth: '195px',
            color: '#e6d5b8'
          }}
        >
          <div className="vtt-gothic-title" style={{ fontSize: '12px', color: '#d4af37', fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #6b4c2b', paddingBottom: '5px' }}>
            {contextMenu.item.type === 'door'
              ? 'Control de Puerta'
              : contextMenu.item.type === 'window'
              ? 'Control de Ventana'
              : contextMenu.item.type === 'light'
              ? `${contextMenu.item.name || 'Fuente de Luz'}`
              : contextMenu.item.type === 'item'
              ? `📦 ${contextMenu.item.name || 'Objeto en el Suelo'}`
              : `${contextMenu.item.name || 'Objeto / Decorado'}`}
          </div>

          {/* Opciones para Items en el Suelo */}
          {contextMenu.item.type === 'item' && (
            <>
              {(() => {
                const activeTurnToken = tokens.find(t => t.id === activeTurnTokenId) || null;
                const recipientToken = activeTurnToken || (tokens.length === 1 ? tokens[0] : null);

                return (
                  <>
                    <button
                      onClick={() => {
                        const targetId = recipientToken ? recipientToken.id : null;
                        if (onPickUpItem) onPickUpItem(contextMenu.item, targetId);
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
                      <span>🤲</span>
                      <span>
                        {recipientToken ? `Coger ➔ ${recipientToken.name}` : 'Coger Objeto'}
                      </span>
                    </button>

                    {/* Si hay varios personajes, permitir elegir quién lo recoge */}
                    {tokens.length > 1 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
                        <span style={{ fontSize: '10px', color: '#94a3b8', paddingLeft: '4px' }}>O coger con otro:</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '120px', overflowY: 'auto' }}>
                          {tokens.filter(t => t.id !== recipientToken?.id).map(tok => (
                            <button
                              key={tok.id}
                              onClick={() => {
                                if (onPickUpItem) onPickUpItem(contextMenu.item, tok.id);
                                setContextMenu({ visible: false, x: 0, y: 0, item: null });
                              }}
                              className="vtt-brass-btn"
                              style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', textAlign: 'left', cursor: 'pointer' }}
                            >
                              🤲 {tok.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Ver notas del objeto si tiene */}
              {contextMenu.item.notes && (
                <div style={{
                  fontSize: '11px',
                  color: '#cbd5e1',
                  backgroundColor: 'rgba(0,0,0,0.45)',
                  padding: '6px 8px',
                  borderRadius: '5px',
                  borderLeft: '2px solid #f59e0b',
                  lineHeight: 1.35
                }}>
                  {contextMenu.item.notes}
                </div>
              )}
            </>
          )}

          {/* Giro de 90 grados para puertas y ventanas */}
          {(contextMenu.item.type === 'door' || contextMenu.item.type === 'window') && onRotateMapElement && (
            <button
              onClick={() => {
                onRotateMapElement(contextMenu.item.id);
                setContextMenu({ visible: false, x: 0, y: 0, item: null });
              }}
              className="vtt-brass-btn"
              style={{ padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#38bdf8' }}
            >
              🔄 Girar 90º ({contextMenu.item.width < contextMenu.item.height ? 'A Horizontal' : 'A Vertical'})
            </button>
          )}

          {contextMenu.item.type === 'door' && (
            <button
              onClick={() => {
                if (onToggleDoor) onToggleDoor(contextMenu.item.id);
                setContextMenu({ visible: false, x: 0, y: 0, item: null });
              }}
              className="vtt-brass-btn"
              style={{ padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
            >
              {contextMenu.item.isOpen ? 'Cerrar Puerta' : 'Abrir Puerta'}
            </button>
          )}

          {contextMenu.item.type === 'window' && (
            <>
              <button
                onClick={() => {
                  if (onToggleWindow) onToggleWindow(contextMenu.item.id, false);
                  setContextMenu({ visible: false, x: 0, y: 0, item: null });
                }}
                className="vtt-brass-btn"
                style={{ padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              >
                {contextMenu.item.isOpen ? 'Cerrar Ventana' : 'Abrir Ventana'}
              </button>
              {!contextMenu.item.isOpen && (
                <button
                  onClick={() => {
                    if (onToggleWindow) onToggleWindow(contextMenu.item.id, true);
                    setContextMenu({ visible: false, x: 0, y: 0, item: null });
                  }}
                  style={{
                    padding: '8px 12px',
                    fontFamily: "'Cinzel', serif",
                    background: 'linear-gradient(180deg, #991b1b 0%, #450a0a 100%)',
                    color: '#fecaca',
                    border: '1px solid #f87171',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}
                >
                  Romper Cristal
                </button>
              )}
            </>
          )}

          {contextMenu.item.type === 'object' && (
            <>
              <button
                onClick={() => {
                  if (onToggleObject) onToggleObject(contextMenu.item.id);
                  setContextMenu({ visible: false, x: 0, y: 0, item: null });
                }}
                className="vtt-brass-btn"
                style={{ padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              >
                {contextMenu.item.isOpen ? 'Cerrar / Reiniciar' : 'Abrir / Activar'}
              </button>

              {onInspectObject && (
                <button
                  onClick={() => {
                    onInspectObject(contextMenu.item);
                    setContextMenu({ visible: false, x: 0, y: 0, item: null });
                  }}
                  className="vtt-brass-btn"
                  style={{ padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', borderColor: '#f59e0b', color: '#fbbf24' }}
                >
                  📝 Notas & Pistas del Objeto
                </button>
              )}

              {(contextMenu.item.customClueText || contextMenu.item.linkedHandoutId) && onProjectHandout && (
                <button
                  onClick={() => {
                    if (contextMenu.item.linkedHandoutId) {
                      onProjectHandout({ id: contextMenu.item.linkedHandoutId });
                    } else if (contextMenu.item.customClueText) {
                      onProjectHandout({
                        type: 'note',
                        title: `Pista: ${contextMenu.item.name || 'Objeto'}`,
                        content: contextMenu.item.customClueText
                      });
                    }
                    setContextMenu({ visible: false, x: 0, y: 0, item: null });
                  }}
                  className="vtt-primary-cta"
                  style={{ padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Desvelar Pista a Jugadores
                </button>
              )}
            </>
          )}

          {contextMenu.item.type === 'light' && (
            <button
              onClick={() => {
                if (onToggleLight) onToggleLight(contextMenu.item.id);
                setContextMenu({ visible: false, x: 0, y: 0, item: null });
              }}
              className="vtt-brass-btn"
              style={{ padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
            >
              {contextMenu.item.isOn !== false ? 'Apagar Luz' : 'Encender Luz'}
            </button>
          )}

          {/* Bloquear / Desbloquear posición */}
          {onToggleMapElementLock && (
            <button
              onClick={() => {
                onToggleMapElementLock(contextMenu.item.id);
                setContextMenu({ visible: false, x: 0, y: 0, item: null });
              }}
              className="vtt-brass-btn"
              style={{ padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
            >
              {contextMenu.item.isLocked ? 'Desbloquear posición' : 'Bloquear posición'}
            </button>
          )}

          {/* Retirar de la escena */}
          {onRemoveMapElement && (
            <button
              onClick={() => {
                onRemoveMapElement(contextMenu.item.id);
                setContextMenu({ visible: false, x: 0, y: 0, item: null });
              }}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
                padding: '7px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                marginTop: '4px'
              }}
            >
              Retirar de la Escena
            </button>
          )}
        </div>,
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
