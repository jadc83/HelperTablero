import { useState, useMemo, useRef } from 'react';
import { isPointVisibleToPlayers, getStructureRenderBox } from '../utils/fogGeometry';
import { EyeOff, Lock, Package, ScrollText } from 'lucide-react';
import MapElementContextMenu from './map-layer/MapElementContextMenu';
import NoteParchmentModal from './map-layer/NoteParchmentModal';
import MapStructureGraphic from './map-layer/MapStructureGraphic';

const MapLayer = ({
  maps,
  tokens = [],
  fowEnabled = false,
  fowVisionRadius = 180,
  isPlayerView = false,
  draggedMapElement = null,
  onMapElementPointerDown,
  onToggleMapElementLock,
  onUpdateMapElement,
  onDuplicateMapElement,
  onInspectObject,
  onRemoveMapElement,
  onToggleDoor,
  onToggleWindow,
  onToggleObject,
  onToggleLight,
  onSetAllLights,
  handouts = [],
  onProjectHandout,
  activeTurnTokenId = null,
  onPickUpItem
}) => {
  const [readingNote, setReadingNote] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const notePointerStartRef = useRef(null);

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
          if (isPlayerView && (element.isHidden || (fowEnabled && !visibleElements[element.id]))) {
            return null;
          }

          const isDragging = draggedMapElement === element.id;
          const noteTitle = element.title || element.name || 'Pista';
          const noteWidth = element.width || 34;
          const noteHeight = element.height || 34;

          return (
            <div
              key={element.id}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isPlayerView) return;
                setIsEditingMenu(false);
                setContextMenu({ visible: true, x: e.clientX, y: e.clientY, item: element });
              }}
              onPointerDown={(e) => {
                if (e.button === 2) {
                  e.stopPropagation();
                  return;
                }
                if (e.button !== 0) return;
                e.stopPropagation();
                notePointerStartRef.current = { id: element.id, x: e.clientX, y: e.clientY };
                if (!isPlayerView && !element.isLocked && onMapElementPointerDown) {
                  onMapElementPointerDown(e, element);
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                const start = notePointerStartRef.current;
                notePointerStartRef.current = null;
                if (start && start.id === element.id) {
                  const movedDist = Math.hypot(e.clientX - start.x, e.clientY - start.y);
                  if (movedDist >= 5) return;
                }
                setReadingNote(element);
              }}
              style={{
                position: 'absolute',
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: `${noteWidth}px`,
                height: `${noteHeight}px`,
                background: 'radial-gradient(circle, #f3e5ab 0%, #c5a059 100%)',
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isDragging ? 'grabbing' : 'pointer',
                border: isDragging
                  ? '2px dashed #fbbf24'
                  : (element.isHidden ? '2px dashed #a855f7' : '2px solid #5c3a21'),
                boxShadow: isDragging
                  ? '0 8px 20px rgba(245, 158, 11, 0.55)'
                  : '0 4px 10px rgba(0,0,0,0.8)',
                color: '#451a03',
                zIndex: isDragging ? 1000 : 6,
                userSelect: 'none',
                opacity: isDragging ? 0.85 : (!isPlayerView && element.isHidden ? 0.48 : 1),
                transition: isDragging ? 'none' : 'border 0.2s, box-shadow 0.2s, opacity 0.2s'
              }}
              title={`${noteTitle} (Clic para leer · Arrastra para mover · Clic derecho para opciones)`}
            >
              <ScrollText size={18} strokeWidth={2.2} />
              {!isPlayerView && element.isHidden && (
                <span style={{ position: 'absolute', top: -5, left: -5, background: '#11141c', border: '1px solid #c084fc', borderRadius: '3px', padding: '1px', display: 'flex', color: '#e9d5ff' }} title="Oculto a jugadores">
                  <EyeOff size={8} strokeWidth={2.4} />
                </span>
              )}
              {!isPlayerView && element.isLocked && (
                <span style={{ position: 'absolute', top: -5, right: -5, background: '#11141c', border: '1px solid #f59e0b', borderRadius: '3px', padding: '1px', display: 'flex', color: '#fbbf24' }} title="Posición bloqueada">
                  <Lock size={8} strokeWidth={2.4} />
                </span>
              )}
              {element.showName !== false && (
                <div style={{
                  position: 'absolute',
                  bottom: '-17px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(10, 12, 18, 0.9)',
                  color: '#fef08a',
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.8)'
                }}>
                  {noteTitle}
                </div>
              )}
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
                width: '18px',
                height: '18px',
                background: 'linear-gradient(135deg, #1b202c 0%, #0f131c 100%)',
                border: isDragging
                  ? '1.5px dashed #fbbf24'
                  : (element.isHidden ? '1px dashed #c084fc' : '1px solid #d4af37'),
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isPlayerView ? 'default' : (element.isLocked ? 'pointer' : (isDragging ? 'grabbing' : 'grab')),
                boxShadow: isDragging
                  ? '0 6px 14px rgba(245, 158, 11, 0.6)'
                  : '0 2px 6px rgba(0,0,0,0.85), 0 0 5px rgba(245, 158, 11, 0.25)',
                zIndex: isDragging ? 1000 : 6,
                userSelect: 'none',
                opacity: isDragging ? 0.85 : (!isPlayerView && element.isHidden ? 0.45 : 1),
                transition: isDragging ? 'none' : 'border 0.2s, box-shadow 0.2s, opacity 0.2s'
              }}
              title={`${element.name || 'Objeto'} en el suelo (${element.isLocked ? 'Bloqueado - ' : ''}${element.isHidden ? 'Oculto - ' : ''}Arrastra para mover o clic derecho para opciones)`}
            >
              <Package size={11} strokeWidth={2.3} style={{ color: '#fbbf24' }} />
              {!isPlayerView && element.isHidden && (
                <span style={{ position: 'absolute', top: -4, left: -4, background: '#11141c', border: '1px solid #c084fc', borderRadius: '3px', padding: '1px', display: 'flex', color: '#e9d5ff' }} title="Oculto a jugadores">
                  <EyeOff size={7} strokeWidth={2.4} />
                </span>
              )}
              {!isPlayerView && element.isLocked && (
                <span style={{ position: 'absolute', top: -4, right: -4, background: '#11141c', border: '1px solid #f59e0b', borderRadius: '3px', padding: '1px', display: 'flex', color: '#fbbf24' }} title="Posición bloqueada">
                  <Lock size={7} strokeWidth={2.4} />
                </span>
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

        if (element.type === 'door' || element.type === 'window') {
          if (isPlayerView && fowEnabled && !visibleElements[element.id]) {
            return null;
          }

          const isDragging = draggedMapElement === element.id;
          const isDoor = element.type === 'door';
          const { x: boxX, y: boxY, width: boxW, height: boxH, angleDeg } = getStructureRenderBox(element);

          const statusLabel = isDoor
            ? `Puerta ${element.isOpen ? 'Abierta' : 'Cerrada'}`
            : `Ventana ${element.isBroken ? 'Rota' : element.isOpen ? 'Abierta' : 'Cerrada'}`;

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
                left: `${boxX}px`,
                top: `${boxY}px`,
                width: `${boxW}px`,
                height: `${boxH}px`,
                transform: angleDeg ? `rotate(${angleDeg}deg)` : undefined,
                transformOrigin: 'center center',
                cursor: isPlayerView ? 'default' : (element.isLocked ? 'pointer' : (isDragging ? 'grabbing' : 'grab')),
                filter: isDragging ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.85))' : undefined,
                zIndex: isDragging ? 1000 : 6,
                userSelect: 'none'
              }}
              title={`${statusLabel} (${boxW}×${boxH}px • ${angleDeg}° — Clic derecho para abrir, girar o redimensionar)`}
            >
              <MapStructureGraphic
                type={element.type}
                width={boxW}
                height={boxH}
                isOpen={Boolean(element.isOpen)}
                isBroken={Boolean(element.isBroken)}
                isDragging={isDragging}
              />
              {!isPlayerView && element.isLocked && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  backgroundColor: '#0b0d12',
                  border: '1px solid #f59e0b',
                  borderRadius: '50%',
                  width: '12px',
                  height: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fbbf24'
                }}>
                  <Lock size={7} strokeWidth={2.4} />
                </span>
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

      <MapElementContextMenu
        contextMenu={contextMenu}
        maps={maps}
        tokens={tokens}
        handouts={handouts}
        activeTurnTokenId={activeTurnTokenId}
        isEditingMenu={isEditingMenu}
        setIsEditingMenu={setIsEditingMenu}
        editName={editName}
        setEditName={setEditName}
        editNotes={editNotes}
        setEditNotes={setEditNotes}
        onClose={() => setContextMenu({ visible: false, x: 0, y: 0, item: null })}
        onToggleMapElementLock={onToggleMapElementLock}
        onUpdateMapElement={onUpdateMapElement}
        onDuplicateMapElement={onDuplicateMapElement}
        onInspectObject={onInspectObject}
        onRemoveMapElement={onRemoveMapElement}
        onToggleDoor={onToggleDoor}
        onToggleWindow={onToggleWindow}
        onToggleObject={onToggleObject}
        onToggleLight={onToggleLight}
        onSetAllLights={onSetAllLights}
        onProjectHandout={onProjectHandout}
        onPickUpItem={onPickUpItem}
        onReadNote={(noteEl) => setReadingNote(noteEl)}
      />

      <NoteParchmentModal
        note={readingNote ? (maps.find(m => m.id === readingNote.id) || readingNote) : null}
        isPlayerView={isPlayerView}
        onProjectHandout={onProjectHandout}
        onClose={() => setReadingNote(null)}
      />
    </>
  );
};

export default MapLayer;
