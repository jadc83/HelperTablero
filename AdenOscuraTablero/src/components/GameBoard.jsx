import { useState } from 'react';
import { Ruler, X, Package } from 'lucide-react';
import GridLayer from './GridLayer';
import MapLayer from './MapLayer';
import FogLayer from './FogLayer';
import AtmosphericLivingFog from './AtmosphericLivingFog';
import GameToken from './GameToken';
import WeatherOverlay from './WeatherOverlay';
import MapStructureGraphic from './map-layer/MapStructureGraphic';
import { SOUND_CATALOG } from '../constants/gamePresets';
import { useAppSettings } from '../hooks/useAppSettings';
import { formatBoardDistance, formatShortUnitDistance, getBoardSurfaceConfig } from '../constants/appSettings';

const BASE_QUICK_SOUNDS = SOUND_CATALOG.filter(s => !s.loop).slice(0, 6);

const GameBoard = ({
  boardRef, scale, pan = { x: 0, y: 0 }, isDraggingPan = false, isPlayerView = false,
  fowEnabled, fowMode = 'none', fowVisionRadius = 180, fowMemoryEnabled = true,
  livingFogEnabled = true,
  weatherEffect = 'none', ambientTint = 'none',
  rulerActive = false, pendingTokenSpawn = null, pendingMapSpawn = null,
  handlePointerDown, handlePointerMove, handlePointerUp, handleWheel,
  snapToGrid, gridSize, maps, activeSceneId,
  fowCanvasRef, fowActions,
  tokens, draggedToken, rotatingToken, onTokenPointerDown, onStartTokenRotate,
  onToggleTokenLock, onToggleTokenName, onToggleTokenBars, onToggleTokenHidden, onToggleTokenFaction,
  onUpdateTokenRotation, onToggleTokenStatus,
  onOpenTokenSheet, customStatuses,
  rulerMeasure, holdProgress = null, radialMenu = null, onSelectSpatialSound,
  customSounds = [],
  draggedMapElement = null, onMapElementPointerDown, onToggleMapElementLock, onUpdateMapElement, onDuplicateMapElement, onInspectObject, onRemoveMapElement,
  onToggleDoor, onToggleWindow, onToggleObject, onToggleLight,
  handouts = [], onProjectHandout,
  activeTurnTokenId = null,
  onPickUpItem,
  isCombatActive = false,
  movementLimitsEnabled = true,
  combatGroups = [],
  tokenDragMeasurement = null,
  handleDropOnBoard = null
}) => {
  const { settings } = useAppSettings();
  const boardSurface = getBoardSurfaceConfig(settings.boardSurface);
  const [spawnHoverPos, setSpawnHoverPos] = useState(null);
  const isToolActive = rulerActive || Boolean(pendingTokenSpawn) || Boolean(pendingMapSpawn) || (!isPlayerView && fowEnabled && fowMode !== 'none');
  const boardCursor = isDraggingPan ? 'grabbing' : (isToolActive ? 'crosshair' : 'grab');

  const computeSpawnHoverPos = (clientX, clientY) => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const rawX = (clientX - rect.left - pan.x) / scale;
    const rawY = (clientY - rect.top - pan.y) / scale;
    const w = pendingMapSpawn ? (pendingMapSpawn.type === 'item' ? 18 : (pendingMapSpawn.width || gridSize || 48)) : (gridSize || 50);
    const h = pendingMapSpawn ? (pendingMapSpawn.type === 'item' ? 18 : (pendingMapSpawn.height || gridSize || 48)) : (gridSize || 50);
    const isDirectCenter = Boolean(pendingMapSpawn);
    const shouldSnap = snapToGrid && !isDirectCenter;
    const x = shouldSnap ? Math.floor(rawX / (gridSize || 50)) * (gridSize || 50) : rawX - w / 2;
    const y = shouldSnap ? Math.floor(rawY / (gridSize || 50)) * (gridSize || 50) : rawY - h / 2;
    return { x, y, w, h };
  };

  const onBoardPointerMove = (e) => {
    if (pendingTokenSpawn || pendingMapSpawn) {
      const next = computeSpawnHoverPos(e.clientX, e.clientY);
      if (next) setSpawnHoverPos(next);
    } else if (spawnHoverPos) {
      setSpawnHoverPos(null);
    }
    if (handlePointerMove) handlePointerMove(e);
  };

  const onBoardDragOver = (e) => {
    if (isPlayerView) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (pendingTokenSpawn || pendingMapSpawn) {
      const next = computeSpawnHoverPos(e.clientX, e.clientY);
      if (next) setSpawnHoverPos(next);
    }
  };

  const onBoardDragLeave = (e) => {
    if (boardRef.current && !boardRef.current.contains(e.relatedTarget)) {
      setSpawnHoverPos(null);
    }
  };

  const onBoardDrop = (e) => {
    e.preventDefault();
    setSpawnHoverPos(null);
    if (handleDropOnBoard) {
      handleDropOnBoard(e);
    }
  };

  const radialSounds = [
    ...customSounds.filter(s => !s.loop).slice(0, 4),
    ...BASE_QUICK_SOUNDS
  ].slice(0, 8);

  const renderRuler = () => {
    if (!rulerMeasure) return null;
    const { startX, startY, endX, endY } = rulerMeasure;
    const dx = endX - startX;
    const dy = endY - startY;
    const pixelDist = Math.hypot(dx, dy);
    const squares = pixelDist / (gridSize || 50);
    const distanceLabel = formatBoardDistance(squares, settings, true);
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;

    return (
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 500 }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '5000px', height: '5000px', overflow: 'visible' }}>
          <line
            x1={startX} y1={startY} x2={endX} y2={endY}
            stroke="#d4af37" strokeWidth={3 / scale} strokeDasharray={`${8 / scale},${6 / scale}`}
          />
          <circle cx={startX} cy={startY} r={5 / scale} fill="#d4af37" />
          <circle cx={endX} cy={endY} r={6 / scale} fill="#991b1b" stroke="#d4af37" strokeWidth={2 / scale} />
        </svg>
        <div
          className="vtt-gothic-title"
          style={{
            position: 'absolute',
            left: `${midX}px`,
            top: `${midY}px`,
            transform: `translate(-50%, -130%) scale(${1 / scale})`,
            background: 'linear-gradient(180deg, rgba(38, 24, 16, 0.96) 0%, rgba(20, 12, 8, 0.96) 100%)',
            border: '2px solid #d4af37',
            color: '#f3e5ab',
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            boxShadow: '0 6px 16px rgba(0,0,0,0.85)'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Ruler size={13} strokeWidth={2.2} /> {distanceLabel}</span>
        </div>
      </div>
    );
  };

  const renderMovementFloorRing = () => {
    if (!isCombatActive || !movementLimitsEnabled || !activeTurnTokenId) return null;
    const activeToken = tokens.find(t => t.id === activeTurnTokenId);
    if (!activeToken) return null;

    const baseSpeed = activeToken.speed || 6;
    const isGraveWound = Boolean(activeToken.isGraveWound);
    const maxSpeed = isGraveWound ? Math.max(1, Math.floor(baseSpeed / 2)) : baseSpeed;
    const used = activeToken.turnMovementUsed || 0;
    const remaining = Math.max(0, maxSpeed - used);

    const tokenSize = activeToken.size || gridSize || 50;
    const originX = (draggedToken === activeToken.id && tokenDragMeasurement)
      ? tokenDragMeasurement.startX
      : activeToken.x + tokenSize / 2;
    const originY = (draggedToken === activeToken.id && tokenDragMeasurement)
      ? tokenDragMeasurement.startY
      : activeToken.y + tokenSize / 2;

    const radius = remaining * (gridSize || 50);
    const ringColor = isGraveWound ? '#ef4444' : '#10b981';
    const ringFill = isGraveWound ? 'rgba(239, 68, 68, 0.09)' : 'rgba(16, 185, 129, 0.08)';

    if (remaining <= 0) return null;

    return (
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 120 }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '10000px', height: '10000px', overflow: 'visible' }}>
          <circle
            cx={originX}
            cy={originY}
            r={radius}
            fill={ringFill}
            stroke={ringColor}
            strokeWidth={2.5 / scale}
            strokeDasharray={`${8 / scale},${6 / scale}`}
          />
          {/* Cruz central de origen */}
          <line x1={originX - 6 / scale} y1={originY} x2={originX + 6 / scale} y2={originY} stroke={ringColor} strokeWidth={2 / scale} />
          <line x1={originX} y1={originY - 6 / scale} x2={originX} y2={originY + 6 / scale} stroke={ringColor} strokeWidth={2 / scale} />
        </svg>

        {/* Insignia en el borde superior del radio */}
        <div
          style={{
            position: 'absolute',
            left: `${originX}px`,
            top: `${originY - radius}px`,
            transform: `translate(-50%, -120%) scale(${1 / scale})`,
            backgroundColor: isGraveWound ? 'rgba(38, 12, 16, 0.96)' : 'rgba(12, 28, 22, 0.96)',
            border: `1.5px solid ${ringColor}`,
            color: isGraveWound ? '#fca5a5' : '#6ee7b7',
            padding: '3px 10px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 14px rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isGraveWound ? '#ef4444' : '#10b981'
          }} />
          <span>
            {isGraveWound
              ? `Herida Grave: ${remaining}/${maxSpeed} casillas${formatShortUnitDistance(remaining, settings)}`
              : `Movimiento: ${remaining}/${maxSpeed} casillas${formatShortUnitDistance(remaining, settings)}`}
          </span>
        </div>
      </div>
    );
  };

  const renderMovementMeasurementOverlay = () => {
    if (!tokenDragMeasurement) return null;
    const { startX, startY, currentX, currentY, movedSquares, maxSquares } = tokenDragMeasurement;
    const atLimit = movedSquares >= maxSquares;
    const midX = (startX + currentX) / 2;
    const midY = (startY + currentY) / 2;
    const lineColor = atLimit ? '#ef4444' : '#fbbf24';

    return (
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 550 }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '10000px', height: '10000px', overflow: 'visible' }}>
          <line
            x1={startX}
            y1={startY}
            x2={currentX}
            y2={currentY}
            stroke={lineColor}
            strokeWidth={3 / scale}
            strokeDasharray={`${6 / scale},${4 / scale}`}
          />
          <circle cx={startX} cy={startY} r={5 / scale} fill="#fbbf24" stroke="#ffffff" strokeWidth={1 / scale} />
          <circle cx={currentX} cy={currentY} r={6 / scale} fill={atLimit ? '#ef4444' : '#10b981'} stroke="#ffffff" strokeWidth={1.5 / scale} />
        </svg>

        <div
          style={{
            position: 'absolute',
            left: `${midX}px`,
            top: `${midY}px`,
            transform: `translate(-50%, -140%) scale(${1 / scale})`,
            backgroundColor: atLimit ? 'rgba(40, 10, 10, 0.96)' : 'rgba(15, 20, 30, 0.96)',
            border: `1.5px solid ${lineColor}`,
            color: atLimit ? '#fca5a5' : '#fde047',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            boxShadow: '0 6px 16px rgba(0,0,0,0.92)'
          }}
        >
          {atLimit ? '🔴 ¡Límite alcanzado! ' : '🟢 '}
          {movedSquares} / {maxSquares} casillas{formatShortUnitDistance(movedSquares, settings)}
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={boardRef}
      onPointerDown={handlePointerDown} onPointerMove={onBoardPointerMove}
      onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} onPointerCancel={handlePointerUp}
      onDragStart={(e) => e.preventDefault()}
      onDragOver={onBoardDragOver}
      onDragLeave={onBoardDragLeave}
      onDrop={onBoardDrop}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        cursor: boardCursor,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        background: `${boardSurface.overlay}, url("${boardSurface.image}")`,
        backgroundSize: boardSurface.backgroundSize,
        backgroundPosition: 'center',
        backgroundRepeat: boardSurface.backgroundRepeat
      }}
    >
      <style>{`
        @keyframes vttPingWave {
          0% { transform: translate(-50%, -50%) scale(0.2); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(4.2); opacity: 0; }
        }
        @keyframes vttSoundPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.25); }
        }
        @keyframes vttHoldCharge {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0.4; }
          100% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
        }
      `}</style>
      <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: '0 0', position: 'absolute', width: '100%', height: '100%' }}>
        
        <GridLayer snapToGrid={snapToGrid} gridSize={gridSize} />
        
        <MapLayer
          maps={maps}
          tokens={tokens}
          fowEnabled={fowEnabled}
          fowVisionRadius={fowVisionRadius}
          isPlayerView={isPlayerView}
          draggedMapElement={draggedMapElement}
          onMapElementPointerDown={onMapElementPointerDown}
          onToggleMapElementLock={onToggleMapElementLock}
          onUpdateMapElement={onUpdateMapElement}
          onDuplicateMapElement={onDuplicateMapElement}
          onInspectObject={onInspectObject}
          onRemoveMapElement={onRemoveMapElement}
          onToggleDoor={onToggleDoor}
          onToggleWindow={onToggleWindow}
          onToggleObject={onToggleObject}
          onToggleLight={onToggleLight}
          handouts={handouts}
          onProjectHandout={onProjectHandout}
          activeTurnTokenId={activeTurnTokenId}
          onPickUpItem={onPickUpItem}
        />
        
        <FogLayer
          fowEnabled={fowEnabled}
          fowCanvasRef={fowCanvasRef}
          fowActions={fowActions}
          maps={maps}
          tokens={tokens}
          activeSceneId={activeSceneId}
          fowVisionRadius={fowVisionRadius}
          fowMemoryEnabled={fowMemoryEnabled}
          isPlayerView={isPlayerView}
        />

        <AtmosphericLivingFog
          fowEnabled={fowEnabled}
          livingFogEnabled={livingFogEnabled}
          fowCanvasRef={fowCanvasRef}
          tokens={tokens}
          maps={maps}
          fowVisionRadius={fowVisionRadius}
          isPlayerView={isPlayerView}
        />

        {renderMovementFloorRing()}

        {tokens.map((token) => {
          if (isPlayerView && token.isHidden) return null;

          const myGroup = combatGroups.find(g => g.id === token.combatGroupId);
          const isTokenActiveTurn = combatGroups.length > 0
            ? Boolean(myGroup && myGroup.isCombatActive && myGroup.activeTurnTokenId === token.id)
            : Boolean(token.id === activeTurnTokenId);

          return (
            <GameToken
              key={token.id} token={token}
              combatGroup={myGroup}
              isActiveTurn={isTokenActiveTurn}
              isDragging={draggedToken === token.id}
              isRotating={rotatingToken === token.id}
              isPlayerView={isPlayerView}
              onPointerDown={onTokenPointerDown}
              onStartRotate={onStartTokenRotate}
              onToggleLock={onToggleTokenLock}
              onToggleName={onToggleTokenName}
              onToggleBars={onToggleTokenBars}
              onToggleHidden={onToggleTokenHidden}
              onToggleFaction={onToggleTokenFaction}
              onUpdateRotation={onUpdateTokenRotation}
              onToggleStatus={onToggleTokenStatus}
              onOpenSheet={onOpenTokenSheet}
              customStatuses={customStatuses}
            />
          );
        })}

        {/* Previsualización Fantasma al Invocar un Personaje */}
        {!isPlayerView && pendingTokenSpawn && spawnHoverPos && (
          <div
            style={{
              position: 'absolute',
              left: `${spawnHoverPos.x}px`,
              top: `${spawnHoverPos.y}px`,
              width: `${gridSize || 50}px`,
              height: `${gridSize || 50}px`,
              borderRadius: '50%',
              backgroundColor: pendingTokenSpawn.color || '#d4af37',
              border: '3px dashed #fbbf24',
              boxShadow: '0 0 20px rgba(251, 191, 36, 0.75)',
              opacity: 0.72,
              pointerEvents: 'none',
              zIndex: 450,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            {pendingTokenSpawn.avatar && (
              <img
                src={pendingTokenSpawn.avatar}
                alt={pendingTokenSpawn.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            )}
          </div>
        )}

        {/* Previsualización Fantasma al Arrastrar o Colocar un Objeto / Estructura */}
        {!isPlayerView && pendingMapSpawn && spawnHoverPos && (
          <div
            style={{
              position: 'absolute',
              left: `${spawnHoverPos.x}px`,
              top: `${spawnHoverPos.y}px`,
              width: `${pendingMapSpawn.type === 'item' ? 18 : (spawnHoverPos.w || 48)}px`,
              height: `${pendingMapSpawn.type === 'item' ? 18 : (spawnHoverPos.h || 48)}px`,
              borderRadius: pendingMapSpawn.type === 'light' ? '50%' : '3px',
              backgroundColor: (pendingMapSpawn.type === 'door' || pendingMapSpawn.type === 'window')
                ? 'transparent'
                : 'rgba(245, 158, 11, 0.22)',
              border: (pendingMapSpawn.type === 'door' || pendingMapSpawn.type === 'window')
                ? 'none'
                : '1.5px dashed #fbbf24',
              boxShadow: (pendingMapSpawn.type === 'door' || pendingMapSpawn.type === 'window')
                ? 'none'
                : '0 0 16px rgba(245, 158, 11, 0.65)',
              opacity: 0.9,
              pointerEvents: 'none',
              zIndex: 450,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}
          >
            {pendingMapSpawn.type === 'item' ? (
              <Package size={11} strokeWidth={2.3} style={{ color: '#fbbf24' }} />
            ) : (pendingMapSpawn.type === 'door' || pendingMapSpawn.type === 'window') ? (
              <MapStructureGraphic
                type={pendingMapSpawn.type}
                width={spawnHoverPos.w || 36}
                height={spawnHoverPos.h || (pendingMapSpawn.type === 'door' ? 10 : 8)}
                isDragging={true}
              />
            ) : (
              pendingMapSpawn.icon || <Package size={18} strokeWidth={2.2} style={{ color: '#fbbf24' }} />
            )}
          </div>
        )}

        {renderRuler()}
        {renderMovementMeasurementOverlay()}

        {holdProgress && !isPlayerView && (
          <div
            style={{
              position: 'absolute',
              left: `${holdProgress.x}px`,
              top: `${holdProgress.y}px`,
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              border: '3px dashed #fbbf24',
              backgroundColor: 'rgba(251, 191, 36, 0.15)',
              pointerEvents: 'none',
              zIndex: 650,
              animation: 'vttHoldCharge 0.55s ease-out forwards'
            }}
          />
        )}
      </div>

      {radialMenu && !isPlayerView && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: `${radialMenu.screenX}px`,
            top: `${radialMenu.screenY}px`,
            zIndex: 99999
          }}
        >
          <button
            onClick={() => onSelectSpatialSound(null)}
            className="vtt-brass-btn"
            style={{
              position: 'absolute',
              transform: 'translate(-50%, -50%)',
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              border: '2px solid #fbbf24',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(0,0,0,0.95)'
            }}
            title="Cerrar menú"
          >
            <X size={20} strokeWidth={2.2} style={{ color: '#fbbf24' }} />
          </button>

          {radialSounds.map((snd, idx) => {
            const angle = (idx / radialSounds.length) * Math.PI * 2 - Math.PI / 2;
            const radius = 84;
            const bx = Math.cos(angle) * radius;
            const by = Math.sin(angle) * radius;
            return (
              <button
                key={snd.id}
                onClick={() => onSelectSpatialSound(snd)}
                className="vtt-brass-btn"
                style={{
                  position: 'absolute',
                  left: `${bx}px`,
                  top: `${by}px`,
                  transform: 'translate(-50%, -50%)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.9)'
                }}
                title={`Emitir aquí: ${snd.label}`}
              >
                {snd.icon}
              </button>
            );
          })}
        </div>
      )}

      <WeatherOverlay weather={weatherEffect} ambientTint={ambientTint} />
    </div>
  );
};

export default GameBoard;