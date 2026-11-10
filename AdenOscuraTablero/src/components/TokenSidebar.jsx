import { useState, useRef } from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import LibraryTab from './sidebar/LibraryTab';
import SceneCombatTab from './sidebar/SceneCombatTab';

const SIDEBAR_OPEN_WIDTH = 320;

/**
 * Panel lateral principal del tablero: alterna entre "En Escena" (turnos y combate)
 * y "Elementos" (biblioteca arrastrable de personajes, criaturas, loot, luces y estructuras).
 */
const TokenSidebar = ({
  tokens = [],
  characters = [],
  codexEntities = [],
  graveyard = [],
  onImportCharacters,
  onBringToTable,
  onSendToGraveyard,
  onStartDragCharacter,
  onEndDragCharacter,
  onStartDragItem,
  onEndDragItem,
  onStartDragMapElement,
  onEndDragMapElement,
  onRemoveToken,
  onEditCharacter,
  onUpdateTokenStats,
  onUpdateTokenSize,
  commonItems = [],
  onGiveItemToCharacter,
  onImportCommonItems,
  onOpenTokenSheet,
  onReorderTokens,
  onCenterOnToken,
  activeTurnTokenId,
  combatRound = 1,
  isCombatActive = false,
  onStartCombat,
  onNextTurn,
  onEndCombat,
  movementLimitsEnabled = true,
  onToggleMovementLimits,
  onResetTokenMovement,
  onSelectActiveTurn,
  combatGroups = [],
  onCreateCombatGroup,
  onRemoveCombatGroup,
  onUpdateCombatGroup,
  onAssignTokenToGroup,
  onStartGroupCombat,
  onNextGroupTurn,
  onEndGroupCombat,
  onSelectGroupActiveTurn,
  onDisbandAllGroups,
  onWidthChange
}) => {
  const [activeMainTab, setActiveMainTab] = useState('scene');
  const [expandedTokenIds, setExpandedTokenIds] = useState(new Set());
  const [activeDrag, setActiveDrag] = useState(null);
  const [drawerWidth, setDrawerWidth] = useState(SIDEBAR_OPEN_WIDTH);
  const [isDraggingDrawer, setIsDraggingDrawer] = useState(false);
  const [isHoveringHandle, setIsHoveringHandle] = useState(false);
  const drawerDragRef = useRef(null);

  const dragRef = useRef(null);
  const cardRefs = useRef({});
  const groupRefs = useRef({});
  const freeGroupRef = useRef(null);
  const trashRef = useRef(null);
  const nameHoldTimerRef = useRef(null);
  const lastDragEndTimeRef = useRef(0);

  const handleStartDrag = (e, index, tokenId) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();

    const rects = tokens.map(t => cardRefs.current[t.id]?.getBoundingClientRect());
    const draggedRect = rects[index];
    if (!draggedRect) return;

    const midpoints = rects.map(r => r ? r.top + r.height / 2 : 0);

    dragRef.current = {
      index,
      tokenId,
      startY: e.clientY,
      targetIndex: index,
      draggedHeight: draggedRect.height,
      midpoints,
      rects,
      isOverTrash: false
    };

    setActiveDrag({
      index,
      deltaY: 0,
      targetIndex: index,
      draggedHeight: draggedRect.height,
      isDropping: false,
      isOverTrash: false
    });

    const handlePointerMove = (moveEvent) => {
      if (!dragRef.current || dragRef.current.isDropping) return;
      const deltaY = moveEvent.clientY - dragRef.current.startY;
      const currentCenter = dragRef.current.midpoints[dragRef.current.index] + deltaY;

      let isOverTrash = false;
      if (trashRef.current) {
        const trashRect = trashRef.current.getBoundingClientRect();
        isOverTrash = (
          moveEvent.clientX >= trashRect.left &&
          moveEvent.clientX <= trashRect.right &&
          moveEvent.clientY >= trashRect.top &&
          moveEvent.clientY <= trashRect.bottom + 20
        );
      }
      dragRef.current.isOverTrash = isOverTrash;

      let overGroupId = null;
      if (combatGroups && combatGroups.length > 0) {
        for (const cg of combatGroups) {
          const gEl = groupRefs.current[cg.id];
          if (gEl) {
            const gRect = gEl.getBoundingClientRect();
            if (
              moveEvent.clientX >= gRect.left - 20 &&
              moveEvent.clientX <= gRect.right + 20 &&
              moveEvent.clientY >= gRect.top &&
              moveEvent.clientY <= gRect.bottom
            ) {
              overGroupId = cg.id;
              break;
            }
          }
        }
        if (!overGroupId && freeGroupRef.current) {
          const fRect = freeGroupRef.current.getBoundingClientRect();
          if (
            moveEvent.clientX >= fRect.left - 20 &&
            moveEvent.clientX <= fRect.right + 20 &&
            moveEvent.clientY >= fRect.top &&
            moveEvent.clientY <= fRect.bottom
          ) {
            overGroupId = 'free';
          }
        }
      }
      dragRef.current.overGroupId = overGroupId;

      let targetIndex = dragRef.current.index;
      const { midpoints: mids, index: originIndex } = dragRef.current;

      for (let i = 0; i < mids.length; i++) {
        if (i < originIndex && currentCenter < mids[i]) {
          targetIndex = Math.min(targetIndex, i);
        } else if (i > originIndex && currentCenter > mids[i]) {
          targetIndex = Math.max(targetIndex, i);
        }
      }

      dragRef.current.deltaY = deltaY;
      dragRef.current.targetIndex = targetIndex;

      setActiveDrag({
        index: originIndex,
        deltaY,
        targetIndex,
        draggedHeight: dragRef.current.draggedHeight,
        isDropping: false,
        isOverTrash,
        overGroupId
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      lastDragEndTimeRef.current = Date.now();

      if (!dragRef.current || dragRef.current.isDropping) return;
      dragRef.current.isDropping = true;

      if (dragRef.current.isOverTrash) {
        const tokenIdToRemove = dragRef.current.tokenId;
        setActiveDrag(prev => ({ ...prev, isDropping: true, isOverTrash: true }));
        setTimeout(() => {
          if (onRemoveToken) onRemoveToken(tokenIdToRemove);
          dragRef.current = null;
          setActiveDrag(null);
        }, 150);
        return;
      }

      if (dragRef.current.overGroupId !== undefined && dragRef.current.overGroupId !== null) {
        const droppedTokenId = dragRef.current.tokenId;
        const targetGroupId = dragRef.current.overGroupId === 'free' ? null : dragRef.current.overGroupId;
        if (onAssignTokenToGroup) onAssignTokenToGroup(droppedTokenId, targetGroupId);
        dragRef.current = null;
        setActiveDrag(null);
        return;
      }

      const { index: originIdx, targetIndex: finalTargetIdx, rects: dropRects } = dragRef.current;
      let targetDeltaY = 0;
      if (dropRects && dropRects[finalTargetIdx] && dropRects[originIdx]) {
        if (originIdx < finalTargetIdx) {
          targetDeltaY = (dropRects[finalTargetIdx].bottom - dragRef.current.draggedHeight) - dropRects[originIdx].top;
        } else if (originIdx > finalTargetIdx) {
          targetDeltaY = dropRects[finalTargetIdx].top - dropRects[originIdx].top;
        }
      }

      setActiveDrag({
        index: originIdx,
        deltaY: targetDeltaY,
        targetIndex: finalTargetIdx,
        draggedHeight: dragRef.current.draggedHeight,
        isDropping: true,
        isOverTrash: false
      });

      setTimeout(() => {
        if (originIdx !== finalTargetIdx && onReorderTokens) {
          onReorderTokens(originIdx, finalTargetIdx);
        }
        dragRef.current = null;
        setActiveDrag(null);
      }, 200);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const handleNamePointerDown = (e, index, tokenId) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const startX = e.clientX;
    const startY = e.clientY;
    let dragTriggered = false;

    const cleanup = () => {
      if (nameHoldTimerRef.current) {
        clearTimeout(nameHoldTimerRef.current);
        nameHoldTimerRef.current = null;
      }
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };

    const triggerDrag = (evt) => {
      if (dragTriggered) return;
      dragTriggered = true;
      lastDragEndTimeRef.current = Date.now();
      cleanup();
      handleStartDrag(evt, index, tokenId);
    };

    nameHoldTimerRef.current = setTimeout(() => {
      triggerDrag(e);
    }, 180);

    const onMove = (moveEvt) => {
      const dist = Math.hypot(moveEvt.clientX - startX, moveEvt.clientY - startY);
      if (dist > 4) triggerDrag(moveEvt);
    };

    const onUp = () => cleanup();

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const toggleTokenExpand = (id) => {
    setExpandedTokenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyDrawerWidth = (w) => {
    setDrawerWidth(w);
    if (onWidthChange) onWidthChange(w);
  };

  const handleDrawerPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    drawerDragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startWidth: drawerWidth,
      latestWidth: drawerWidth
    };
    setIsDraggingDrawer(true);
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const handleDrawerPointerMove = (e) => {
    const drag = drawerDragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const clamped = Math.round(Math.min(SIDEBAR_OPEN_WIDTH, Math.max(0, drag.startWidth + dx)));
    drag.latestWidth = clamped;
    applyDrawerWidth(clamped);
  };

  const handleDrawerPointerUp = (e) => {
    const drag = drawerDragRef.current;
    if (!drag) return;
    try {
      e.currentTarget.releasePointerCapture?.(drag.pointerId);
    } catch {
      /* ignore */
    }
    const dx = e.clientX - drag.startX;
    const isClick = Math.abs(dx) < 5;
    let finalWidth;
    if (isClick) {
      finalWidth = drag.startWidth > SIDEBAR_OPEN_WIDTH / 2 ? 0 : SIDEBAR_OPEN_WIDTH;
    } else if (drag.startWidth >= SIDEBAR_OPEN_WIDTH / 2) {
      finalWidth = (dx < -40 || drag.latestWidth < SIDEBAR_OPEN_WIDTH * 0.65) ? 0 : SIDEBAR_OPEN_WIDTH;
    } else {
      finalWidth = (dx > 40 || drag.latestWidth > SIDEBAR_OPEN_WIDTH * 0.35) ? SIDEBAR_OPEN_WIDTH : 0;
    }
    drawerDragRef.current = null;
    setIsDraggingDrawer(false);
    applyDrawerWidth(finalWidth);
  };

  const isDrawerOpen = drawerWidth > 0;

  return (
    <div style={{
      position: 'relative',
      width: `${drawerWidth}px`,
      height: '100%',
      flexShrink: 0,
      zIndex: 25,
      transition: isDraggingDrawer ? 'none' : 'width 0.24s cubic-bezier(0.2, 0.8, 0.2, 1)'
    }}>
      <div style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRight: isDrawerOpen ? '1px solid var(--vtt-border)' : 'none',
        boxShadow: isDrawerOpen ? '6px 0 24px rgba(0,0,0,0.28)' : 'none',
        background: 'var(--vtt-sidebar-bg)'
      }}>
        <div style={{
          width: `${SIDEBAR_OPEN_WIDTH}px`,
          height: '100%',
          marginLeft: `${drawerWidth - SIDEBAR_OPEN_WIDTH}px`,
          transition: isDraggingDrawer ? 'none' : 'margin-left 0.24s cubic-bezier(0.2, 0.8, 0.2, 1)',
          color: 'var(--vtt-text)',
          display: 'flex',
          flexDirection: 'column'
        }}>
      {/* Selector de Pestañas Superiores: En Escena vs Elementos */}
      <div style={{
        padding: '8px 10px',
        backgroundColor: 'var(--vtt-sidebar-header-bg)',
        borderBottom: '1px solid var(--vtt-border-subtle)',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--vtt-bg-inset)',
          padding: '3px',
          borderRadius: '8px',
          border: '1px solid var(--vtt-border)',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => setActiveMainTab('scene')}
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              border: activeMainTab === 'scene' ? '1px solid var(--vtt-gold)' : '1px solid transparent',
              borderRadius: '6px',
              backgroundColor: activeMainTab === 'scene' ? 'var(--vtt-gold-soft)' : 'transparent',
              color: activeMainTab === 'scene' ? 'var(--vtt-gold-light)' : 'var(--vtt-text-muted)',
              boxShadow: activeMainTab === 'scene' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Personajes y criaturas en juego en el mapa activo (turnos, PV, movimientos)"
          >
            En Escena
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('library')}
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              border: activeMainTab === 'library' ? '1px solid var(--vtt-gold)' : '1px solid transparent',
              borderRadius: '6px',
              backgroundColor: activeMainTab === 'library' ? 'var(--vtt-gold-soft)' : 'transparent',
              color: activeMainTab === 'library' ? 'var(--vtt-gold-light)' : 'var(--vtt-text-muted)',
              boxShadow: activeMainTab === 'library' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Biblioteca de personajes, criaturas, mobiliario y elementos para colocar en el mapa"
          >
            Elementos
          </button>
        </div>
      </div>

      {activeMainTab === 'library' ? (
        <LibraryTab
          characters={characters}
          codexEntities={codexEntities}
          graveyard={graveyard}
          commonItems={commonItems}
          activeTurnTokenId={activeTurnTokenId}
          onImportCharacters={onImportCharacters}
          onBringToTable={onBringToTable}
          onStartDragCharacter={onStartDragCharacter}
          onEndDragCharacter={onEndDragCharacter}
          onEditCharacter={onEditCharacter}
          onStartDragItem={onStartDragItem}
          onEndDragItem={onEndDragItem}
          onStartDragMapElement={onStartDragMapElement}
          onEndDragMapElement={onEndDragMapElement}
          onGiveItemToCharacter={onGiveItemToCharacter}
          onImportCommonItems={onImportCommonItems}
        />
      ) : (
        <SceneCombatTab
          tokens={tokens}
          combatGroups={combatGroups}
          isCombatActive={isCombatActive}
          combatRound={combatRound}
          activeTurnTokenId={activeTurnTokenId}
          movementLimitsEnabled={movementLimitsEnabled}
          expandedTokenIds={expandedTokenIds}
          onToggleTokenExpand={toggleTokenExpand}
          onExpandAll={() => setExpandedTokenIds(new Set(tokens.map(t => t.id)))}
          onCollapseAll={() => setExpandedTokenIds(new Set())}
          activeDrag={activeDrag}
          cardRefs={cardRefs}
          groupRefs={groupRefs}
          freeGroupRef={freeGroupRef}
          handleStartDrag={handleStartDrag}
          handleNamePointerDown={handleNamePointerDown}
          lastDragEndTimeRef={lastDragEndTimeRef}
          onStartCombat={onStartCombat}
          onNextTurn={onNextTurn}
          onEndCombat={onEndCombat}
          onToggleMovementLimits={onToggleMovementLimits}
          onResetTokenMovement={onResetTokenMovement}
          onSelectActiveTurn={onSelectActiveTurn}
          onCreateCombatGroup={onCreateCombatGroup}
          onRemoveCombatGroup={onRemoveCombatGroup}
          onUpdateCombatGroup={onUpdateCombatGroup}
          onAssignTokenToGroup={onAssignTokenToGroup}
          onStartGroupCombat={onStartGroupCombat}
          onNextGroupTurn={onNextGroupTurn}
          onEndGroupCombat={onEndGroupCombat}
          onSelectGroupActiveTurn={onSelectGroupActiveTurn}
          onDisbandAllGroups={onDisbandAllGroups}
          onCenterOnToken={onCenterOnToken}
          onOpenTokenSheet={onOpenTokenSheet}
          onEditCharacter={onEditCharacter}
          onSendToGraveyard={onSendToGraveyard}
          onRemoveToken={onRemoveToken}
          onUpdateTokenStats={onUpdateTokenStats}
          onUpdateTokenSize={onUpdateTokenSize}
        />
      )}

      {/* Papelera de retirada del tablero (visible durante arrastre) */}
      {activeMainTab === 'scene' && tokens.length > 0 && (
        <div
          ref={trashRef}
          style={{
            flexShrink: 0,
            padding: activeDrag ? '12px 14px' : '0 14px',
            height: activeDrag ? '52px' : '0px',
            boxSizing: 'border-box',
            borderTop: activeDrag
              ? activeDrag.isOverTrash
                ? '2px solid #ef4444'
                : '1.5px dashed rgba(239, 68, 68, 0.45)'
              : 'none',
            background: activeDrag?.isOverTrash
              ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.35) 0%, rgba(127, 29, 29, 0.8) 100%)'
              : 'linear-gradient(180deg, rgba(35, 12, 16, 0.95) 0%, #10080a 100%)',
            boxShadow: activeDrag?.isOverTrash
              ? '0 -4px 20px rgba(239, 68, 68, 0.6), inset 0 0 15px rgba(239, 68, 68, 0.4)'
              : activeDrag
              ? '0 -4px 14px rgba(0, 0, 0, 0.7)'
              : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: activeDrag?.isOverTrash ? '#ffffff' : '#fca5a5',
            opacity: activeDrag ? 1 : 0,
            overflow: 'hidden',
            transform: activeDrag ? 'translateY(0)' : 'translateY(100%)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: activeDrag ? 'auto' : 'none',
            zIndex: 40
          }}
        >
          <Trash2
            size={16}
            strokeWidth={2.2}
            style={{
              transform: activeDrag?.isOverTrash ? 'scale(1.25) rotate(-6deg)' : 'scale(1)',
              transition: 'transform 0.15s ease',
              color: activeDrag?.isOverTrash ? '#ffffff' : '#ef4444'
            }}
          />
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.03em' }}>
            {activeDrag?.isOverTrash ? 'Soltar para retirar del tablero' : 'Arrastra aquí abajo para retirar'}
          </span>
        </div>
      )}
        </div>
      </div>

      {/* Agarre central en el borde derecho interior para desplegar / contraer arrastrando */}
      <div
        role="button"
        tabIndex={0}
        aria-label={isDrawerOpen ? 'Contraer panel lateral' : 'Desplegar panel lateral'}
        title={isDrawerOpen ? 'Arrastra hacia la izquierda o haz clic para ocultar el menú' : 'Arrastra hacia la derecha o haz clic para abrir el menú'}
        onPointerDown={handleDrawerPointerDown}
        onPointerMove={handleDrawerPointerMove}
        onPointerUp={handleDrawerPointerUp}
        onPointerCancel={handleDrawerPointerUp}
        onMouseEnter={() => setIsHoveringHandle(true)}
        onMouseLeave={() => setIsHoveringHandle(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            applyDrawerWidth(isDrawerOpen ? 0 : SIDEBAR_OPEN_WIDTH);
          }
        }}
        style={{
          position: 'absolute',
          top: '50%',
          right: '-16px',
          transform: 'translateY(-50%)',
          width: '16px',
          height: '72px',
          borderRadius: '0 8px 8px 0',
          border: `1px solid ${isDraggingDrawer || isHoveringHandle ? 'var(--vtt-gold)' : 'var(--vtt-border)'}`,
          borderLeft: 'none',
          background: isDraggingDrawer
            ? 'var(--vtt-gold-soft)'
            : 'var(--vtt-bg-panel)',
          boxShadow: isDraggingDrawer
            ? '4px 0 16px rgba(245, 158, 11, 0.3)'
            : '4px 0 14px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDraggingDrawer ? 'grabbing' : 'grab',
          color: isDraggingDrawer || isHoveringHandle ? 'var(--vtt-gold-light)' : 'var(--vtt-text-dim)',
          touchAction: 'none',
          userSelect: 'none',
          transition: 'border-color 0.15s ease, color 0.15s ease, background 0.15s ease'
        }}
      >
        <GripVertical size={13} strokeWidth={2.2} />
      </div>
    </div>
  );
};

export default TokenSidebar;
