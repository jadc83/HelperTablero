import React, { useState, useEffect, useRef } from 'react';
import { LIGHT_PRESETS } from './MapCreator';
import { getGameIconComponent } from './icons/GameIcons';
import { importJSON } from '../utils/fileDialog';
import {
  Grip,
  Pencil,
  FolderOpen,
  Search,
  X,
  Swords,
  Play,
  SkipForward,
  Square,
  Star,
  Trash2,
  Circle,
  ArrowRight
} from 'lucide-react';

const SectionAccordion = ({ title, count, isExpanded, onClick, children, tooltip }) => (
  <div
    style={{
      borderRadius: '8px',
      border: isExpanded ? '1px solid #f59e0b' : '1px solid #242c3d',
      borderLeft: isExpanded ? '4px solid #f59e0b' : '1px solid #242c3d',
      backgroundColor: isExpanded ? '#141824' : '#131720',
      marginBottom: '10px',
      overflow: 'hidden',
      boxShadow: isExpanded ? '0 4px 14px rgba(245, 158, 11, 0.15)' : 'none',
      transition: 'border 0.15s, background 0.15s',
      flexShrink: 0
    }}
  >
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 12px',
        backgroundColor: isExpanded ? '#1b2232' : 'transparent',
        border: 'none',
        borderBottom: isExpanded ? '1px solid rgba(245, 158, 11, 0.25)' : 'none',
        cursor: 'pointer',
        color: isExpanded ? '#f8fafc' : '#94a3b8',
        transition: 'all 0.15s ease'
      }}
      title={tooltip || (isExpanded ? "Haz clic para plegar esta sección" : "Haz clic para desplegar esta sección")}
    >
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
        <span style={{
          fontSize: '12px',
          fontWeight: isExpanded ? 800 : 700,
          letterSpacing: '0.02em',
          color: isExpanded ? '#f8fafc' : '#cbd5e1',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {title}
        </span>
      </div>
      <span style={{
        fontSize: '10px',
        width: '20px',
        height: '20px',
        borderRadius: '4px',
        backgroundColor: isExpanded ? 'rgba(245, 158, 11, 0.25)' : '#1e2433',
        color: isExpanded ? '#fbbf24' : '#8593a8',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        flexShrink: 0
      }}>
        {isExpanded ? '▲' : '▼'}
      </span>
    </button>

    {isExpanded && (
      <div style={{ padding: '8px 9px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {children}
      </div>
    )}
  </div>
);

const TokenSidebar = ({ 
  tokens = [], 
  characters = [], 
  graveyard = [],
  onOpenGraveyard,
  onSendToGraveyard,
  onAddToken, 
  onStartDragCharacter,
  onEndDragCharacter,
  onStartDragItem,
  onEndDragItem,
  onAddMapElement,
  onOpenMapCreator,
  onOpenEncyclopedia,
  onRemoveToken, 
  onRemoveCharacter,
  onImportCharacters,
  onEditCharacter,
  onCreateNewCharacter,
  onUpdateTokenStats,
  onUpdateTokenSize,
  onUpdateTokenVisionMode,
  onToggleTokenName,
  onToggleTokenBars,
  onToggleTokenHidden,
  onToggleTokenFaction,
  customStatuses = [],
  customObjects = [],
  commonItems = [],
  onGiveItemToCharacter,
  onPlaceGroundItem,
  onDropItemToFloor,
  onOpenTokenSheet,
  onReorderTokens,
  onMoveTokenOrder,
  onCenterOnToken,
  activeTurnTokenId = null,
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
  onDisbandAllGroups
}) => {
  // Pestaña principal: 'scene' (En Escena) o 'library' (Biblioteca/Invocación)
  const [activeMainTab, setActiveMainTab] = useState('scene');

  // Estados para gestión de grupos de combate
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [activeGroupMenuTokenId, setActiveGroupMenuTokenId] = useState(null);

  // Acordeones de compendio dentro de la pestaña Biblioteca
  const [isCharactersExpanded, setIsCharactersExpanded] = useState(true);
  const [isMonstersExpanded, setIsMonstersExpanded] = useState(true);
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);
  const [lootSearchQuery, setLootSearchQuery] = useState('');
  const [isLightsExpanded, setIsLightsExpanded] = useState(false);
  const [isStructuresExpanded, setIsStructuresExpanded] = useState(false);

  // Estados de acordeón y Drag & Drop fluido para los personajes en escena (turnos de combate)
  const [expandedTokenIds, setExpandedTokenIds] = useState(new Set());
  const [activeDrag, setActiveDrag] = useState(null);
  const dragRef = useRef(null);
  const cardRefs = useRef({});
  const groupRefs = useRef({});
  const freeGroupRef = useRef(null);
  const [dragOverGroupId, setDragOverGroupId] = useState(null);
  const trashRef = useRef(null);
  const nameHoldTimerRef = useRef(null);
  const lastDragEndTimeRef = useRef(0);

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

    // Al mantener presionado 180ms se activa el arrastre y aparece la papelera abajo
    nameHoldTimerRef.current = setTimeout(() => {
      triggerDrag(e);
    }, 180);

    const onMove = (moveEvt) => {
      const dist = Math.hypot(moveEvt.clientX - startX, moveEvt.clientY - startY);
      if (dist > 4) {
        triggerDrag(moveEvt);
      }
    };

    const onUp = () => {
      cleanup();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

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

      // Comprobar si el puntero se encuentra sobre la zona de papelera inferior (abajo del todo)
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

      // Comprobar si el puntero está sobre algún grupo de combate
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
        if (i < originIndex) {
          if (currentCenter < mids[i]) {
            targetIndex = Math.min(targetIndex, i);
          }
        } else if (i > originIndex) {
          if (currentCenter > mids[i]) {
            targetIndex = Math.max(targetIndex, i);
          }
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

      // Si se soltó sobre la papelera: retirar token de la mesa y de la lista
      if (dragRef.current.isOverTrash) {
        const tokenIdToRemove = dragRef.current.tokenId;
        setActiveDrag(prev => ({
          ...prev,
          isDropping: true,
          isOverTrash: true
        }));

        setTimeout(() => {
          if (onRemoveToken) {
            onRemoveToken(tokenIdToRemove);
          }
          dragRef.current = null;
          setActiveDrag(null);
        }, 150);
        return;
      }

      // Si se soltó sobre un grupo o sobre la zona de fuera de combate
      if (dragRef.current.overGroupId !== undefined && dragRef.current.overGroupId !== null) {
        const tokenId = dragRef.current.tokenId;
        const targetGroupId = dragRef.current.overGroupId === 'free' ? null : dragRef.current.overGroupId;
        if (onAssignTokenToGroup) {
          onAssignTokenToGroup(tokenId, targetGroupId);
        }
        dragRef.current = null;
        setActiveDrag(null);
        return;
      }

      const { index: originIdx, targetIndex: finalTargetIdx, rects } = dragRef.current;

      // Calcular el desplazamiento exacto del slot destino para una transición suave y continua
      let targetDeltaY = 0;
      if (rects && rects[finalTargetIdx] && rects[originIdx]) {
        if (originIdx < finalTargetIdx) {
          targetDeltaY = (rects[finalTargetIdx].bottom - dragRef.current.draggedHeight) - rects[originIdx].top;
        } else if (originIdx > finalTargetIdx) {
          targetDeltaY = rects[finalTargetIdx].top - rects[originIdx].top;
        }
      }

      // Deslizar con animación fluida hacia el slot final
      setActiveDrag({
        index: originIdx,
        deltaY: targetDeltaY,
        targetIndex: finalTargetIdx,
        draggedHeight: dragRef.current.draggedHeight,
        isDropping: true,
        isOverTrash: false
      });

      // Al terminar la animación de asentamiento, se actualiza el orden en los datos sin salto visual
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

  const toggleTokenExpand = (id) => {
    setExpandedTokenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const collapseAll = () => setExpandedTokenIds(new Set());
  const expandAll = () => setExpandedTokenIds(new Set(tokens.map(t => t.id)));

  const MONSTER_TYPES = ['mythos_creature', 'great_old_one', 'outer_god', 'animal', 'undead', 'aberration'];
  const isMonsterEntity = (c) => MONSTER_TYPES.includes(c.entityType) || (!c.entityType && c.faction === 'enemy');

  const humanCharacters = (characters || []).filter(c => !isMonsterEntity(c));
  const monsterCharacters = (characters || []).filter(c => isMonsterEntity(c));

  const handleImportHumanCharacters = async () => {
    const res = await importJSON({ accept: '.json', description: 'Personajes VTT (*.json)' });
    if (res?.success && res.text) {
      try {
        const parsed = JSON.parse(res.text);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        const formatted = list.map(c => ({
          ...c,
          id: c.id || Date.now() + Math.random(),
          faction: c.faction || 'ally',
          entityType: c.entityType || 'human'
        }));
        if (onImportCharacters) onImportCharacters(formatted);
      } catch (err) {
        console.error('Error al importar personajes:', err);
      }
    }
  };

  const handleImportMonsters = async () => {
    const res = await importJSON({ accept: '.json', description: 'Bestiario VTT (*.json)' });
    if (res?.success && res.text) {
      try {
        const parsed = JSON.parse(res.text);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        const formatted = list.map(c => ({
          ...c,
          id: c.id || Date.now() + Math.random(),
          faction: c.faction || 'enemy',
          entityType: c.entityType || 'mythos_creature'
        }));
        if (onImportCharacters) onImportCharacters(formatted);
      } catch (err) {
        console.error('Error al importar bestiario:', err);
      }
    }
  };

  return (
    <div style={{
      width: '320px',
      height: '100%',
      background: 'linear-gradient(180deg, #14171f 0%, #0e1016 100%)',
      color: '#e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #2b3040',
      boxShadow: '6px 0 24px rgba(0,0,0,0.65)',
      zIndex: 20,
      flexShrink: 0
    }}>
      {/* Selector de Pestañas Superiores: En Escena vs Invocación */}
      <div style={{
        padding: '8px 10px',
        backgroundColor: '#0c0e15',
        borderBottom: '1px solid #242c3d',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          backgroundColor: '#131722',
          padding: '3px',
          borderRadius: '8px',
          border: '1px solid #242d40',
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
              border: activeMainTab === 'scene' ? '1px solid #f59e0b' : '1px solid transparent',
              borderRadius: '6px',
              backgroundColor: activeMainTab === 'scene' ? '#1e2638' : 'transparent',
              color: activeMainTab === 'scene' ? '#fbbf24' : '#8593a8',
              boxShadow: activeMainTab === 'scene' ? '0 2px 8px rgba(0,0,0,0.45)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Personajes y criaturas en juego en el mapa activo (turnos, PV, movimientos)"
          >
            <span>En Escena</span>
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
              border: activeMainTab === 'library' ? '1px solid #f59e0b' : '1px solid transparent',
              borderRadius: '6px',
              backgroundColor: activeMainTab === 'library' ? '#1e2638' : 'transparent',
              color: activeMainTab === 'library' ? '#fbbf24' : '#8593a8',
              boxShadow: activeMainTab === 'library' ? '0 2px 8px rgba(0,0,0,0.45)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px'
            }}
            title="Biblioteca de personajes, criaturas, mobiliario y elementos para colocar en el mapa"
          >
            <span>Elementos</span>
          </button>
        </div>
      </div>

      {/* PESTAÑA: BIBLIOTECA E INVOCACIÓN */}
      {activeMainTab === 'library' && (
        <div style={{ 
          padding: '12px', 
          flex: 1, 
          minHeight: 0,
          display: 'flex', 
          flexDirection: 'column',
          overflowY: 'auto'
        }}>


          {/* 1. ARCHIVO DE PERSONAJES */}
          <SectionAccordion
            title="Personajes"
            count={humanCharacters.length}
            isExpanded={isCharactersExpanded}
            onClick={() => setIsCharactersExpanded(!isCharactersExpanded)}
            tooltip="Investigadores y personajes aliados"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Investigadores</span>
              {onCreateNewCharacter && (
                <button
                  type="button"
                  onClick={() => onCreateNewCharacter('human')}
                  className="vtt-brass-btn"
                  style={{ padding: '3px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', color: '#fbbf24', borderColor: '#f59e0b' }}
                  title="Inscribir nuevo personaje o investigador"
                >
                  + Inscribir
                </button>
              )}
            </div>
            {humanCharacters.map(char => (
              <div 
                key={char.id}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'character', id: char.id }));
                  e.dataTransfer.effectAllowed = 'copy';
                  if (onStartDragCharacter) onStartDragCharacter(char);
                }}
                onDragEnd={() => {
                  if (onEndDragCharacter) onEndDragCharacter();
                }}
                style={{
                  background: '#191d27',
                  border: char.isGraveWound ? '1px solid #ef4444' : '1px solid #2c3344',
                  borderRadius: '7px',
                  padding: '7px 9px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  cursor: 'grab',
                  userSelect: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s'
                }}
                title="Arrastra este personaje al tablero para desplegarlo"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{ color: '#64748b', display: 'inline-flex', cursor: 'grab', userSelect: 'none' }} title="Arrastrar al tablero">
                      <Grip size={12} strokeWidth={2.2} />
                    </span>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: char.color,
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      border: '1px solid #3b82f6'
                    }}>
                      {char.avatar ? (
                        <img src={char.avatar} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontWeight: 800, color: '#93c5fd', fontSize: '11px' }}>{(char.name || '?').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: char.isGraveWound ? '#fca5a5' : '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {char.name}
                      </span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {char.hasArmor ? `Arm. ${char.armorType}` : 'Investigador / Humano'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                    {onEditCharacter && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCharacter(char);
                        }}
                        className="vtt-brass-btn"
                        style={{ borderRadius: '6px', padding: '4px 7px', cursor: 'pointer', fontSize: '11px' }}
                        title="Abrir y editar ficha"
                      >
                        <Pencil size={12} strokeWidth={2.2} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {humanCharacters.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '16px 12px',
                backgroundColor: '#12151c',
                borderRadius: '7px',
                border: '1px dashed #2c3344',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Sin personajes cargados en la mesa.
                </span>
                <button
                  type="button"
                  onClick={handleImportHumanCharacters}
                  className="vtt-brass-btn"
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    borderColor: '#f59e0b',
                    color: '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(180, 83, 9, 0.3) 100%)'
                  }}
                  title="Cargar archivo JSON de personajes"
                >
                  <FolderOpen size={13} strokeWidth={2.2} />
                  <span>Cargar Personajes (JSON)</span>
                </button>
              </div>
            )}
          </SectionAccordion>

          {/* 1B. BESTIARIO, MONSTRUOS Y MITOS */}
          <SectionAccordion
            title="Bestiario y Mitos"
            count={monsterCharacters.length}
            isExpanded={isMonstersExpanded}
            onClick={() => setIsMonstersExpanded(!isMonstersExpanded)}
            tooltip="Criaturas y monstruos de los Mitos"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <span style={{ fontSize: '10px', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Entidades y Horrores</span>
              {onCreateNewCharacter && (
                <button
                  type="button"
                  onClick={() => onCreateNewCharacter('mythos_creature')}
                  className="vtt-brass-btn"
                  style={{ padding: '3px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', color: '#fca5a5', borderColor: '#ef4444' }}
                  title="Registrar nueva criatura o monstruo de los Mitos"
                >
                  + Criatura
                </button>
              )}
            </div>
            {monsterCharacters.map(char => (
              <div 
                key={char.id}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'character', id: char.id }));
                  e.dataTransfer.effectAllowed = 'copy';
                  if (onStartDragCharacter) onStartDragCharacter(char);
                }}
                onDragEnd={() => {
                  if (onEndDragCharacter) onEndDragCharacter();
                }}
                style={{
                  background: '#191d27',
                  border: '1px solid #7f1d1d',
                  borderRadius: '7px',
                  padding: '7px 9px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  cursor: 'grab',
                  userSelect: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s'
                }}
                title="Arrastra esta criatura al tablero para desplegarla"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{ color: '#64748b', display: 'inline-flex', cursor: 'grab', userSelect: 'none' }} title="Arrastrar al tablero">
                      <Grip size={12} strokeWidth={2.2} />
                    </span>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: char.color,
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      border: '1px solid #ef4444'
                    }}>
                      {char.avatar ? (
                        <img src={char.avatar} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontWeight: 800, color: '#fca5a5', fontSize: '11px' }}>{(char.name || '?').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#fca5a5', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {char.name}
                      </span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {char.entityType ? char.entityType.replace('_', ' ') : 'Monstruo'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                    {onEditCharacter && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCharacter(char);
                        }}
                        className="vtt-brass-btn"
                        style={{ borderRadius: '6px', padding: '4px 7px', cursor: 'pointer', fontSize: '11px' }}
                        title="Abrir y editar ficha"
                      >
                        <Pencil size={12} strokeWidth={2.2} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {monsterCharacters.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '16px 12px',
                backgroundColor: '#12151c',
                borderRadius: '7px',
                border: '1px dashed #3a1d1d',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Sin criaturas registradas en el bestiario.
                </span>
                <button
                  type="button"
                  onClick={handleImportMonsters}
                  className="vtt-brass-btn"
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    borderColor: '#ef4444',
                    color: '#fca5a5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(153, 27, 27, 0.3) 100%)'
                  }}
                  title="Cargar archivo JSON de criaturas y monstruos"
                >
                  <FolderOpen size={13} strokeWidth={2.2} />
                  <span>Cargar Bestiario (JSON)</span>
                </button>
              </div>
            )}
          </SectionAccordion>

          {/* 2. OBJETOS DE INVENTARIO Y LOOT COMÚN */}
          <SectionAccordion
            title="Objetos de Inventario (Loot)"
            count={commonItems.length}
            isExpanded={isItemsExpanded}
            onClick={() => setIsItemsExpanded(!isItemsExpanded)}
            tooltip="Objetos comunes y botín para equipar o soltar"
          >
            {/* Buscador de botín / objetos comunes */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#0e1117', border: '1px solid #232a3a', borderRadius: '6px', padding: '3px 8px', marginBottom: '6px' }}>
              <Search size={12} strokeWidth={2.2} style={{ color: '#64748b', marginRight: '6px', flexShrink: 0 }} />
              <input
                type="text"
                value={lootSearchQuery}
                onChange={(e) => setLootSearchQuery(e.target.value)}
                placeholder="Buscar en el catálogo de objetos..."
                style={{ flex: 1, background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '11px', outline: 'none' }}
              />
              {lootSearchQuery && (
                <button
                  type="button"
                  onClick={() => setLootSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '10px' }}
                >
                  <X size={12} strokeWidth={2.4} />
                </button>
              )}
            </div>

            {Boolean(lootSearchQuery.trim()) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {(() => {
                  const q = lootSearchQuery.trim().toLowerCase();
                  const matches = commonItems.filter(item =>
                    item.name.toLowerCase().includes(q) ||
                    (item.notes && item.notes.toLowerCase().includes(q)) ||
                    (item.category && item.category.toLowerCase().includes(q))
                  );

                  if (matches.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '10px 6px', color: '#64748b', fontSize: '11px', fontStyle: 'italic' }}>
                        No se encontraron objetos para "{lootSearchQuery}".
                      </div>
                    );
                  }

                  return matches.map(item => (
                    <div
                      key={item.id}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'ground_item', item }));
                        e.dataTransfer.effectAllowed = 'copy';
                        if (onStartDragItem) onStartDragItem(item);
                      }}
                      onDragEnd={() => {
                        if (onEndDragItem) onEndDragItem();
                      }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#191d27',
                        padding: '5px 8px',
                        borderRadius: '7px',
                        border: '1px solid #2c3344',
                        gap: '6px',
                        cursor: 'grab',
                        userSelect: 'none',
                        transition: 'border-color 0.15s, box-shadow 0.15s'
                      }}
                      title="Arrastra este objeto directamente al tablero para soltarlo en el suelo"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', overflow: 'hidden', flex: 1 }}>
                        <span style={{ color: '#64748b', display: 'inline-flex', cursor: 'grab', flexShrink: 0 }} title="Arrastrar al tablero">
                          <Grip size={11} strokeWidth={2.2} />
                        </span>
                        <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {getGameIconComponent(item.name, 18)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {item.name}
                          </span>
                          {item.notes && (
                            <span style={{ fontSize: '9px', color: '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={item.notes}>
                              {item.notes}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onGiveItemToCharacter) onGiveItemToCharacter(activeTurnTokenId, item);
                          }}
                          className="vtt-brass-btn"
                          style={{
                            padding: '2px 7px',
                            fontSize: '10px',
                            borderRadius: '5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            color: '#fbbf24',
                            borderColor: '#f59e0b'
                          }}
                          title="Añadir inmediatamente al inventario del turno activo"
                        >
                          Dar
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </SectionAccordion>

          {/* 3. FUENTES DE LUZ */}
          <SectionAccordion
            title="Fuentes de Luz"
            count={LIGHT_PRESETS.length}
            isExpanded={isLightsExpanded}
            onClick={() => setIsLightsExpanded(!isLightsExpanded)}
            tooltip="Antorchas y luces para visión dinámica"
          >
            {LIGHT_PRESETS.map(preset => (
              <div key={preset.presetId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#191d27', padding: '6px 10px', borderRadius: '7px', border: '1px solid #2c3344' }}>
                <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 500 }}>{preset.icon} {preset.label}</span>
                <button 
                  type="button"
                  onClick={() => onAddMapElement && onAddMapElement({
                    id: Date.now() + Math.random(), type: 'light', name: preset.label, icon: preset.icon,
                    width: 38, height: 38, radius: preset.radius, color: preset.color, isOn: true
                  })}
                  className="vtt-brass-btn" style={{ padding: '4px 9px', fontSize: '11px', borderRadius: '5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Colocar
                </button>
              </div>
            ))}
          </SectionAccordion>

          {/* 4. ESTRUCTURAS */}
          <SectionAccordion
            title="Puertas y Ventanas"
            count={2}
            isExpanded={isStructuresExpanded}
            onClick={() => setIsStructuresExpanded(!isStructuresExpanded)}
            tooltip="Estructuras de paso y visión"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#191d27', padding: '6px 10px', borderRadius: '7px', border: '1px solid #2c3344' }}>
              <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 500 }}>Puerta de madera</span>
              <button 
                type="button"
                onClick={() => onAddMapElement && onAddMapElement({ id: Date.now() + Math.random(), type: 'door', name: 'Puerta', width: 60, height: 16, isOpen: false })}
                className="vtt-brass-btn" style={{ padding: '4px 9px', fontSize: '11px', borderRadius: '5px', fontWeight: 600, cursor: 'pointer' }}
              >+ Colocar</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#191d27', padding: '6px 10px', borderRadius: '7px', border: '1px solid #2c3344' }}>
              <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 500 }}>Ventana</span>
              <button 
                type="button"
                onClick={() => onAddMapElement && onAddMapElement({ id: Date.now() + Math.random(), type: 'window', name: 'Ventana', width: 60, height: 14, isOpen: false, isBroken: false })}
                className="vtt-brass-btn" style={{ padding: '4px 9px', fontSize: '11px', borderRadius: '5px', fontWeight: 600, cursor: 'pointer' }}
              >+ Colocar</button>
            </div>
          </SectionAccordion>
        </div>
      )}

      {/* PESTAÑA: EN ESCENA Y GESTIÓN DE COMBATE */}
      {activeMainTab === 'scene' && (
        <div style={{ padding: '12px 10px', flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* Barra de Gestión de Turnos e Iniciativa (Modo Estándar Global) */}
        {tokens.length > 1 && combatGroups.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginBottom: '10px',
            padding: '7px 8px',
            background: isCombatActive
              ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.18) 0%, rgba(20, 24, 34, 0.95) 100%)'
              : '#131620',
            border: isCombatActive ? '1px solid #fbbf24' : '1px solid #282f3f',
            borderRadius: '8px',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: isCombatActive ? '#fbbf24' : '#94a3b8', fontWeight: 600 }}>
                  {isCombatActive ? `Ronda ${combatRound}` : 'Orden de turnos'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                {!isCombatActive && onCreateCombatGroup && (
                  <button
                    type="button"
                    onClick={() => onCreateCombatGroup('Encuentro 1')}
                    className="vtt-brass-btn"
                    style={{ padding: '3px 7px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer' }}
                    title="Dividir en grupos de combate independientes para personajes en distintas zonas"
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Swords size={11} strokeWidth={2.2} /> + Grupos</span>
                  </button>
                )}
                {!isCombatActive ? (
                  onStartCombat && (
                    <button
                      type="button"
                      onClick={onStartCombat}
                      className="vtt-primary-cta"
                      style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer' }}
                      title="Iniciar el combate siguiendo el orden de la lista"
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Play size={10} strokeWidth={2.4} /> Iniciar</span>
                    </button>
                  )
                ) : (
                  <>
                    {onToggleMovementLimits && (
                      <button
                        type="button"
                        onClick={onToggleMovementLimits}
                        style={{
                          background: movementLimitsEnabled ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.15)',
                          border: movementLimitsEnabled ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(239, 68, 68, 0.4)',
                          color: movementLimitsEnabled ? '#34d399' : '#fca5a5',
                          padding: '3px 6px',
                          fontSize: '10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                        title={movementLimitsEnabled ? "Límites de movimiento activados. Clic para desactivar" : "Límites de movimiento desactivados. Clic para activar"}
                      >
                        {movementLimitsEnabled ? 'Mov.: ON' : 'Mov.: OFF'}
                      </button>
                    )}
                    {onNextTurn && (
                      <button
                        type="button"
                        onClick={onNextTurn}
                        className="vtt-primary-cta"
                        style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer' }}
                        title="Pasar al siguiente turno en la lista y restablecer movimiento"
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><SkipForward size={10} strokeWidth={2.4} /> Sig. Turno</span>
                      </button>
                    )}
                    {onEndCombat && (
                      <button
                        type="button"
                        onClick={onEndCombat}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          color: '#fca5a5',
                          padding: '3px 6px',
                          fontSize: '10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                        title="Finalizar el combate"
                      >
                        <Square size={10} strokeWidth={2.4} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            {isCombatActive ? (
              <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
                En combate solo se mueve el turno activo. <strong style={{ color: '#fbbf24' }}>Ctrl + Arrastre</strong> para mover libre.
              </span>
            ) : (
              <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
                Pulsa <strong style={{ color: '#fbbf24' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Play size={10} strokeWidth={2.4} /> Iniciar</span></strong> para comenzar el combate y activar el límite de movimiento por turno.
              </span>
            )}
          </div>
        )}

        {/* Barra Superior de Grupos / Encuentros cuando están activos */}
        {combatGroups.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
            padding: '7px 9px',
            background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(19, 22, 32, 0.95) 100%)',
            border: '1px solid #3b4255',
            borderRadius: '8px',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Swords size={12} strokeWidth={2.2} /> Encuentros ({combatGroups.length})</span>
              </span>
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
              {onCreateCombatGroup && (
                <button
                  type="button"
                  onClick={() => onCreateCombatGroup()}
                  className="vtt-brass-btn"
                  style={{ padding: '3px 7px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer' }}
                  title="Crear un nuevo grupo de combate independiente"
                >
                  + Grupo
                </button>
              )}
              {onDisbandAllGroups && (
                <button
                  type="button"
                  onClick={onDisbandAllGroups}
                  style={{
                    padding: '3px 6px',
                    fontSize: '10px',
                    borderRadius: '4px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#fca5a5',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                  title="Disolver todos los encuentros y volver a la lista unificada"
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><X size={11} strokeWidth={2.4} /> Disolver</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Botón para abrir y cerrar desplegables de personajes */}
        {tokens.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginBottom: '8px',
            paddingRight: '2px'
          }}>
            <button
              type="button"
              onClick={expandedTokenIds.size > 0 ? collapseAll : expandAll}
              className="vtt-brass-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                fontSize: '10px',
                borderRadius: '4px',
                cursor: 'pointer',
                background: expandedTokenIds.size > 0 ? 'rgba(245, 158, 11, 0.15)' : '#131620',
                border: expandedTokenIds.size > 0 ? '1px solid #f59e0b' : '1px solid #282f3f',
                color: expandedTokenIds.size > 0 ? '#fbbf24' : '#94a3b8',
                fontWeight: 600
              }}
              title={expandedTokenIds.size > 0 ? "Plegar todas las fichas de personajes" : "Desplegar todas las fichas de personajes"}
            >
              <span>{expandedTokenIds.size > 0 ? 'Plegar fichas' : 'Desplegar fichas'}</span>
              <span style={{ fontSize: '8px' }}>{expandedTokenIds.size > 0 ? '▲' : '▼'}</span>
            </button>
          </div>
        )}
        
        {/* Renderizado de Fichas con soporte de Grupos de Combate */}
        {(() => {
          const renderTokenCard = (token, idx) => {
            const isExpanded = expandedTokenIds.has(token.id);
            const myGroup = combatGroups.find(g => g.id === token.combatGroupId);
            const isCurrentTurn = combatGroups.length > 0
              ? Boolean(myGroup && myGroup.isCombatActive && token.id === myGroup.activeTurnTokenId)
              : Boolean(isCombatActive && token.id === activeTurnTokenId);
            const isBeingDragged = activeDrag && activeDrag.index === idx;

            const faction = token.faction || (token.entityType ? 'enemy' : 'player');
            const isPlayer = faction === 'player';
            const isEnemy = faction === 'enemy';
            const isAlly = faction === 'ally';

            // Colores temáticos de distinción táctica según facción
            const factionBorderColor = isEnemy
              ? '#ef4444'
              : isAlly
              ? '#3b82f6'
              : '#10b981'; // Jugador: Esmeralda

            const factionBgGradient = isEnemy
              ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.14) 0%, rgba(20, 13, 15, 0.96) 65%)'
              : isAlly
              ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.14) 0%, rgba(13, 17, 24, 0.96) 65%)'
              : 'linear-gradient(90deg, rgba(16, 185, 129, 0.18) 0%, rgba(12, 22, 17, 0.96) 65%)'; // Jugador

            const factionBorderBox = isEnemy
              ? '1px solid rgba(239, 68, 68, 0.35)'
              : isAlly
              ? '1px solid rgba(59, 130, 246, 0.35)'
              : '1px solid rgba(16, 185, 129, 0.45)';

            const badgeBg = isCurrentTurn
              ? '#3a2808'
              : isEnemy
              ? 'rgba(239, 68, 68, 0.2)'
              : isAlly
              ? 'rgba(59, 130, 246, 0.2)'
              : 'rgba(16, 185, 129, 0.22)';

            const badgeBorder = isCurrentTurn
              ? '1px solid #d4af37'
              : isEnemy
              ? '1px solid #ef4444'
              : isAlly
              ? '1px solid #3b82f6'
              : '1px solid #10b981';

            const badgeColor = isCurrentTurn
              ? '#fef08a'
              : isEnemy
              ? '#fca5a5'
              : isAlly
              ? '#93c5fd'
              : '#a7f3d0';

            const nameColor = isCurrentTurn
              ? '#fef08a'
              : isEnemy
              ? '#fecdd3'
              : isAlly
              ? '#e0f2fe'
              : '#ecfdf5';

            let translateY = 0;
            if (activeDrag && !isBeingDragged) {
              const { index: dragIdx, targetIndex: tgtIdx, draggedHeight } = activeDrag;
              const shiftAmount = draggedHeight + 6;
              if (dragIdx < tgtIdx && idx > dragIdx && idx <= tgtIdx) {
                translateY = -shiftAmount;
              } else if (dragIdx > tgtIdx && idx >= tgtIdx && idx < dragIdx) {
                translateY = shiftAmount;
              }
            }

            const hp = token.hp ?? 20;
            const maxHp = Math.max(1, token.maxHp ?? 20);
            const mp = token.mp ?? 10;
            const maxMp = Math.max(1, token.maxMp ?? 10);
            const san = token.san ?? 60;
            const maxSan = Math.max(1, token.maxSan ?? 60);

            const hpPct = Math.min(100, Math.max(0, (hp / maxHp) * 100));
            const mpPct = Math.min(100, Math.max(0, (mp / maxMp) * 100));
            const sanPct = Math.min(100, Math.max(0, (san / maxSan) * 100));

            const baseSpeed = Math.max(1, Number(token.speed) || 6);
            const maxSpeed = token.isGraveWound ? Math.max(1, Math.floor(baseSpeed / 2)) : baseSpeed;
            const usedSpeed = Math.max(0, Number(token.turnMovementUsed) || 0);
            const remainingSpeed = Math.max(0, maxSpeed - usedSpeed);
            const speedPct = Math.min(100, Math.max(0, (remainingSpeed / maxSpeed) * 100));

            return (
              <div 
                key={token.id}
                ref={(el) => { cardRefs.current[token.id] = el; }}
                draggable={!activeDrag}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', token.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flexShrink: 0,
                  position: 'relative',
                  zIndex: isBeingDragged ? 50 : 1,
                  transform: isBeingDragged
                    ? `translate3d(0, ${activeDrag.deltaY}px, 0) scale(${activeDrag.isDropping ? 1 : activeDrag.isOverTrash ? 0.93 : 1.025})`
                    : `translate3d(0, ${translateY}px, 0)`,
                  transition: isBeingDragged
                    ? activeDrag.isDropping
                      ? 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease, border 0.18s ease, opacity 0.18s ease'
                      : 'box-shadow 0.15s, border 0.15s, opacity 0.15s'
                    : activeDrag
                    ? 'transform 0.22s cubic-bezier(0.2, 0, 0, 1), background 0.15s, border 0.15s'
                    : 'background 0.15s, border 0.15s',
                  pointerEvents: activeDrag ? 'none' : 'auto',
                  background: isBeingDragged
                    ? activeDrag.isOverTrash
                      ? '#2a0e13'
                      : '#161d2b'
                    : isCurrentTurn
                    ? 'linear-gradient(90deg, rgba(212, 175, 55, 0.16) 0%, #131722 100%)'
                    : factionBgGradient,
                  borderRadius: '6px',
                  border: isBeingDragged
                    ? activeDrag.isOverTrash
                      ? '1.5px solid #ef4444'
                      : activeDrag.isDropping
                      ? isCurrentTurn ? '1px solid #d4af37' : factionBorderBox
                      : '1.5px solid #d4af37'
                    : isCurrentTurn
                    ? '1px solid #d4af37'
                    : token.isGraveWound
                    ? '1px solid #7f1d1d'
                    : factionBorderBox,
                  borderLeft: isBeingDragged
                    ? activeDrag.isOverTrash
                      ? '4px solid #ef4444'
                      : activeDrag.isDropping
                      ? isCurrentTurn ? '3px solid #d4af37' : `3.5px solid ${factionBorderColor}`
                      : '4px solid #d4af37'
                    : isCurrentTurn
                    ? '4px solid #fbbf24'
                    : `3.5px solid ${factionBorderColor}`,
                  boxShadow: isBeingDragged
                    ? activeDrag.isOverTrash
                      ? '0 0 24px rgba(239, 68, 68, 0.65)'
                      : activeDrag.isDropping
                      ? isCurrentTurn ? '0 0 12px rgba(212, 175, 55, 0.25)' : '0 4px 14px rgba(0,0,0,0.6)'
                      : '0 14px 30px rgba(0, 0, 0, 0.85), 0 0 16px rgba(212, 175, 55, 0.45)'
                    : isCurrentTurn
                    ? '0 0 12px rgba(212, 175, 55, 0.25)'
                    : isExpanded
                    ? `0 4px 14px rgba(0,0,0,0.6), 0 0 10px ${isEnemy ? 'rgba(239,68,68,0.25)' : isAlly ? 'rgba(59,130,246,0.25)' : 'rgba(16,185,129,0.25)'}`
                    : '0 2px 4px rgba(0,0,0,0.35)',
                  opacity: isBeingDragged && activeDrag.isOverTrash ? 0.75 : 1,
                  overflow: 'hidden'
                }}
              >
                {/* Cabecera Desplegable Limpia, Centrada y Equilibrada */}
                <div
                  onClick={() => toggleTokenExpand(token.id)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (onCenterOnToken) onCenterOnToken(token);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '7px 9px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    gap: '7px',
                    background: isExpanded ? 'rgba(17, 21, 31, 0.95)' : 'transparent',
                    borderBottom: isExpanded ? '1px solid #1f2738' : 'none'
                  }}
                  title={isExpanded ? "Haz clic para plegar controles (Doble clic: centrar en el tablero)" : "Haz clic para ver controles completos (Doble clic: centrar en el tablero)"}
                >
                  {/* Izquierda: Asa de arrastre fluida + Turno + Avatar miniatura */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                    <span
                      onPointerDown={(e) => handleStartDrag(e, idx, token.id)}
                      style={{
                        color: activeDrag?.index === idx ? '#d4af37' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: activeDrag ? 'grabbing' : 'grab',
                        userSelect: 'none',
                        touchAction: 'none',
                        padding: '3px',
                        borderRadius: '4px',
                        backgroundColor: activeDrag?.index === idx ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                        transition: 'color 0.15s, background-color 0.15s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#d4af37'; }}
                      onMouseLeave={(e) => {
                        if (activeDrag?.index !== idx) e.currentTarget.style.color = '#64748b';
                      }}
                      title="Arrastra para reordenar fluidamente los turnos"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Grip size={13} strokeWidth={2.2} />
                    </span>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '10px',
                        color: badgeColor,
                        backgroundColor: badgeBg,
                        border: badgeBorder,
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        minWidth: '22px',
                        textAlign: 'center',
                        lineHeight: '14px'
                      }}
                      title={`Posición de turno #${idx + 1}`}
                    >
                      #{idx + 1}
                    </span>
                    {/* Miniatura / Avatar del Token */}
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: token.color || (isEnemy ? '#450a0a' : isAlly ? '#0c2340' : '#064e3b'),
                        overflow: 'hidden',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 800,
                        border: `1.5px solid ${isCurrentTurn ? '#fbbf24' : factionBorderColor}`,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.6)'
                      }}
                      title={`${isEnemy ? 'Enemigo' : isAlly ? 'Aliado' : 'Jugador'}: ${token.name}`}
                    >
                      {token.avatar ? (
                        <img src={token.avatar} alt={token.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: '#ffffff' }}>{(token.name || '?').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </div>

                  {/* Centro: Nombre Centrado + Micro-Barra de Salud */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%' }}>
                      <span
                        className="vtt-gothic-title"
                        onPointerDown={(e) => handleNamePointerDown(e, idx, token.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (Date.now() - lastDragEndTimeRef.current < 250 || activeDrag || dragRef.current) return;
                          if (onOpenTokenSheet) {
                            onOpenTokenSheet(token);
                          } else if (onEditCharacter) {
                            onEditCharacter(token);
                          }
                        }}
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          letterSpacing: '0.03em',
                          color: nameColor,
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          textAlign: 'center',
                          fontStyle: token.isHidden ? 'italic' : 'normal',
                          opacity: token.isHidden ? 0.75 : 1,
                          lineHeight: '15px',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          textDecorationColor: isPlayer ? 'rgba(16, 185, 129, 0.45)' : isAlly ? 'rgba(59, 130, 246, 0.45)' : 'rgba(239, 68, 68, 0.45)',
                          textUnderlineOffset: '3px',
                          transition: 'color 0.15s ease, text-decoration-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#fef08a';
                          e.currentTarget.style.textDecorationColor = '#d4af37';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = nameColor;
                          e.currentTarget.style.textDecorationColor = isPlayer ? 'rgba(16, 185, 129, 0.45)' : isAlly ? 'rgba(59, 130, 246, 0.45)' : 'rgba(239, 68, 68, 0.45)';
                        }}
                        title={`Abrir ficha de ${token.name}`}
                      >
                        {token.name}
                      </span>
                      {token.hasArmor && (
                        <span style={{ fontSize: '9px', color: '#94a3b8', background: '#171c26', border: '1px solid #242c3d', padding: '0 3px', borderRadius: '3px', flexShrink: 0 }} title={`Armadura equipada: ${token.armorType}`}>
                          ARM
                        </span>
                      )}
                      {isCombatActive && isCurrentTurn && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            color: token.isGraveWound ? '#fca5a5' : '#a7f3d0',
                            background: token.isGraveWound ? 'rgba(127, 29, 29, 0.3)' : 'rgba(22, 60, 40, 0.4)',
                            border: `1px solid ${token.isGraveWound ? '#7f1d1d' : '#22533b'}`,
                            padding: '0 4px',
                            borderRadius: '3px',
                            flexShrink: 0
                          }}
                          title={`Movimiento restante este turno: ${remainingSpeed} de ${maxSpeed} casillas (${remainingSpeed * 5} ft)`}
                        >
                          {remainingSpeed}/{maxSpeed} c.
                        </span>
                      )}
                    </div>

                    {/* Micro-Barra de Salud Centrada */}
                    <div style={{ width: '100%', maxWidth: '140px', display: 'flex', alignItems: 'center', gap: '6px' }} title={`Salud actual: ${hp} de ${maxHp} PV (${Math.round(hpPct)}%)`}>
                      <div style={{
                        flex: 1,
                        height: '4px',
                        background: '#150a0c',
                        borderRadius: '999px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        <div style={{
                          width: `${hpPct}%`,
                          height: '100%',
                          background: hp <= 0
                            ? '#450a0a'
                            : isPlayer
                            ? 'linear-gradient(90deg, #059669 0%, #10b981 100%)'
                            : isAlly
                            ? 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)'
                            : 'linear-gradient(90deg, #6b141d 0%, #991b1b 100%)',
                          transition: 'width 0.25s ease'
                        }} />
                      </div>
                      <span style={{
                        fontFamily: 'monospace',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: hp <= 0 ? '#f87171' : isPlayer ? '#a7f3d0' : '#94a3b8',
                        flexShrink: 0
                      }}>
                        {hp <= 0 ? 'Caído' : `${hp}/${maxHp} PV`}
                      </span>
                    </div>
                  </div>

                  {/* Derecha: Selector de Grupo + Botón Turno + Botón Colapsar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    {combatGroups.length > 0 && (
                      <div style={{ position: 'relative' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveGroupMenuTokenId(activeGroupMenuTokenId === token.id ? null : token.id);
                          }}
                          style={{
                            fontSize: '9px',
                            cursor: 'pointer',
                            padding: '2px 5px',
                            borderRadius: '3px',
                            fontWeight: 700,
                            backgroundColor: myGroup ? myGroup.bgColor : '#181e2b',
                            border: `1px solid ${myGroup ? myGroup.borderColor : '#334155'}`,
                            color: myGroup ? myGroup.color : '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title="Asignar a un encuentro o dejar fuera de combate"
                        >
                          <span>{myGroup ? myGroup.name : 'Libre'}</span>
                          <span style={{ fontSize: '7px' }}>▼</span>
                        </button>
                        {activeGroupMenuTokenId === token.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: 'absolute',
                              top: '100%',
                              right: 0,
                              marginTop: '3px',
                              zIndex: 99999,
                              background: '#0f131c',
                              border: '1px solid #334155',
                              borderRadius: '5px',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.95)',
                              padding: '3px',
                              minWidth: '135px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px'
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (onAssignTokenToGroup) onAssignTokenToGroup(token.id, null);
                                setActiveGroupMenuTokenId(null);
                              }}
                              style={{
                                padding: '4px 6px',
                                fontSize: '9px',
                                borderRadius: '3px',
                                border: 'none',
                                background: !token.combatGroupId ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: !token.combatGroupId ? '#fff' : '#94a3b8',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              <span>⭕</span>
                              <span>Fuera de combate</span>
                            </button>
                            {combatGroups.map(cg => (
                              <button
                                key={cg.id}
                                type="button"
                                onClick={() => {
                                  if (onAssignTokenToGroup) onAssignTokenToGroup(token.id, cg.id);
                                  setActiveGroupMenuTokenId(null);
                                }}
                                style={{
                                  padding: '4px 6px',
                                  fontSize: '9px',
                                  borderRadius: '3px',
                                  border: 'none',
                                  background: token.combatGroupId === cg.id ? cg.bgColor : 'transparent',
                                  color: token.combatGroupId === cg.id ? cg.color : '#e2e8f0',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px'
                                }}
                              >
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cg.color }} />
                                <span style={{ fontWeight: 600 }}>{cg.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {((combatGroups.length > 0 ? (myGroup && myGroup.isCombatActive && !isCurrentTurn) : (isCombatActive && !isCurrentTurn))) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (combatGroups.length > 0) {
                            if (onSelectGroupActiveTurn && token.combatGroupId) {
                              onSelectGroupActiveTurn(token.combatGroupId, token.id);
                            }
                          } else if (onSelectActiveTurn) {
                            onSelectActiveTurn(token.id);
                          }
                        }}
                        className="vtt-brass-btn"
                        style={{
                          fontSize: '9px',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          borderRadius: '3px'
                        }}
                        title="Asignar el turno activo a este combatiente"
                      >
                        Turno
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleTokenExpand(token.id)}
                      className="vtt-brass-btn"
                      style={{
                        fontSize: '9px',
                        cursor: 'pointer',
                        padding: '2px 0',
                        width: '22px',
                        height: '20px',
                        borderRadius: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isExpanded ? factionBorderColor : '#94a3b8',
                        borderColor: isExpanded ? factionBorderColor : '#2b3345'
                      }}
                      title={isExpanded ? "Plegar tarjeta" : "Desplegar controles detallados"}
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Contenido Completo Desplegado Bien Organizado */}
                {isExpanded && (
                  <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#0a0d13' }}>
                    {/* A. Barra de Acciones y Orden de Iniciativa */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '6px',
                      paddingBottom: '6px',
                      borderBottom: '1px solid #191f2c'
                    }}>
                      {/* Lado izquierdo: Asignar Turno e Iniciativa */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isCombatActive && !isCurrentTurn && onSelectActiveTurn && (
                          <button
                            type="button"
                            onClick={() => onSelectActiveTurn(token.id)}
                            className="vtt-brass-btn"
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            title="Asignar el turno activo a este combatiente"
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Star size={10} strokeWidth={2.4} /> Turno</span>
                          </button>
                        )}

                      </div>

                      {/* Lado derecho: Abatir y Retirar de la mesa */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {onSendToGraveyard && (
                          <button
                            type="button"
                            onClick={() => onSendToGraveyard(token)}
                            style={{
                              padding: '3px 9px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              cursor: 'pointer',
                              backgroundColor: 'rgba(90, 18, 22, 0.4)',
                              border: '1px solid #6b141d',
                              color: '#fca5a5',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(120, 24, 30, 0.6)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(90, 18, 22, 0.4)'; }}
                            title="Abatir combatiente (enviar a la Cripta de Caídos)"
                          >
                            Abatir
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemoveToken(token.id)}
                          style={{
                            padding: '3px 7px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            backgroundColor: '#141822',
                            border: '1px solid #242c3d',
                            color: '#94a3b8',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#fca5a5';
                            e.currentTarget.style.borderColor = '#6b141d';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#94a3b8';
                            e.currentTarget.style.borderColor = '#242c3d';
                          }}
                          title="Retirar del mapa sin enviar a la cripta"
                        >
                          <X size={11} strokeWidth={2.4} />
                        </button>
                      </div>
                    </div>



                    {/* B. Bloque de Estadísticas Vitales (Tonos Ocultistas y Sobrios, Sin Colores Estridentes) */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      background: '#0d1017',
                      padding: '7px 9px',
                      borderRadius: '6px',
                      border: '1px solid #1a202c'
                    }}>
                      {/* Barra de PV */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '28px', fontSize: '10px', fontWeight: 800, color: '#fca5a5', textAlign: 'center', flexShrink: 0, letterSpacing: '0.04em' }}>
                          PV
                        </span>
                        <div style={{
                          position: 'relative',
                          flex: 1,
                          height: '16px',
                          background: '#150a0c',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          border: '1px solid #331015'
                        }} title={`Puntos de Vida: ${hp}/${maxHp} (${Math.round(hpPct)}%)`}>
                          <div style={{
                            width: `${hpPct}%`,
                            height: '100%',
                            background: hp <= 0 ? '#450a0a' : 'linear-gradient(90deg, #58151c 0%, #8b1823 100%)',
                            transition: 'width 0.2s ease'
                          }} />
                          <span style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'monospace',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#ffffff',
                            textShadow: '0 1px 3px rgba(0,0,0,0.95)',
                            letterSpacing: '0.02em',
                            userSelect: 'none'
                          }}>
                            {hp} / {maxHp}
                          </span>
                        </div>
                        {onUpdateTokenStats && (
                          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => onUpdateTokenStats(token.id, { hp: Math.max(0, hp - 1) })}
                              className="vtt-brass-btn"
                              style={{ width: '20px', height: '17px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}
                              title="Restar 1 Punto de Vida (PV)"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateTokenStats(token.id, { hp: Math.min(maxHp, hp + 1) })}
                              className="vtt-brass-btn"
                              style={{ width: '20px', height: '17px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}
                              title="Sumar 1 Punto de Vida (PV)"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Barra de MP */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '28px', fontSize: '10px', fontWeight: 800, color: '#93c5fd', textAlign: 'center', flexShrink: 0, letterSpacing: '0.04em' }}>
                          MP
                        </span>
                        <div style={{
                          position: 'relative',
                          flex: 1,
                          height: '16px',
                          background: '#0a101d',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          border: '1px solid #12243d'
                        }} title={`Puntos de Magia / Éter: ${mp}/${maxMp} (${Math.round(mpPct)}%)`}>
                          <div style={{
                            width: `${mpPct}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #102a48 0%, #1d4b7d 100%)',
                            transition: 'width 0.2s ease'
                          }} />
                          <span style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'monospace',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#ffffff',
                            textShadow: '0 1px 3px rgba(0,0,0,0.95)',
                            letterSpacing: '0.02em',
                            userSelect: 'none'
                          }}>
                            {mp} / {maxMp}
                          </span>
                        </div>
                        {onUpdateTokenStats && (
                          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => onUpdateTokenStats(token.id, { mp: Math.max(0, mp - 1) })}
                              className="vtt-brass-btn"
                              style={{ width: '20px', height: '17px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}
                              title="Restar 1 Punto de Magia (MP)"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateTokenStats(token.id, { mp: Math.min(maxMp, mp + 1) })}
                              className="vtt-brass-btn"
                              style={{ width: '20px', height: '17px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}
                              title="Sumar 1 Punto de Magia (MP)"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Barra de SAN */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '28px', fontSize: '10px', fontWeight: 800, color: '#fef08a', textAlign: 'center', flexShrink: 0, letterSpacing: '0.04em' }}>
                          SAN
                        </span>
                        <div style={{
                          position: 'relative',
                          flex: 1,
                          height: '16px',
                          background: '#191408',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          border: '1px solid #3b2e0e'
                        }} title={`Cordura: ${san}/${maxSan} (${Math.round(sanPct)}%)`}>
                          <div style={{
                            width: `${sanPct}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #5a4208 0%, #8c670f 100%)',
                            transition: 'width 0.2s ease'
                          }} />
                          <span style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'monospace',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#ffffff',
                            textShadow: '0 1px 3px rgba(0,0,0,0.95)',
                            letterSpacing: '0.02em',
                            userSelect: 'none'
                          }}>
                            {san} / {maxSan}
                          </span>
                        </div>
                        {onUpdateTokenStats && (
                          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => onUpdateTokenStats(token.id, { san: Math.max(0, san - 1) })}
                              className="vtt-brass-btn"
                              style={{ width: '20px', height: '17px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}
                              title="Restar 1 Punto de Cordura (SAN)"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateTokenStats(token.id, { san: Math.min(maxSan, san + 1) })}
                              className="vtt-brass-btn"
                              style={{ width: '20px', height: '17px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}
                              title="Sumar 1 Punto de Cordura (SAN)"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* C. Movimiento */}
                    <div style={{
                      backgroundColor: '#0d1017',
                      borderRadius: '6px',
                      padding: '7px 9px',
                      border: isCurrentTurn ? '1px solid #d4af37' : '1px solid #1a202c',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px'
                    }} title={`Movimiento: ${remainingSpeed} / ${maxSpeed} casillas (${remainingSpeed * 5} ft)`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          color: token.isGraveWound ? '#fca5a5' : '#a7f3d0'
                        }}>
                          Movimiento
                        </span>
                        {onResetTokenMovement && (
                          <button
                            type="button"
                            onClick={() => onResetTokenMovement(token.id)}
                            className="vtt-brass-btn"
                            style={{
                              padding: '1px 6px',
                              cursor: 'pointer',
                              fontSize: '9px',
                              borderRadius: '3px'
                            }}
                            title="Restablecer el movimiento completo del personaje a su máximo en este turno"
                          >
                            ↺ Reset
                          </button>
                        )}
                      </div>
                      <div style={{ width: '100%', height: '4px', background: '#0b1611', borderRadius: '999px', overflow: 'hidden', border: '1px solid #162c21' }}>
                        <div style={{
                          width: `${speedPct}%`,
                          height: '100%',
                          background: token.isGraveWound || speedPct < 30 ? '#7f1d1d' : 'linear-gradient(90deg, #163626 0%, #22533b 100%)',
                          transition: 'width 0.2s ease'
                        }} />
                      </div>
                    </div>



                    {/* E. Tamaño de la Ficha en el Mapa (Con el Mismo Estilo Brass Slider de la Cuadrícula) */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      background: '#0d1017',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: '1px solid #1a202c'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="vtt-gothic-title" style={{ fontSize: '10px', color: '#d4af37', letterSpacing: '0.05em', fontWeight: 700 }}>
                          TAMAÑO DE FICHA
                        </span>
                        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#cbd5e1', fontWeight: 700 }}>
                          {token.size || 50}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="250"
                        value={token.size || 50}
                        draggable={false}
                        onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          if (onUpdateTokenSize) onUpdateTokenSize(token.id, Number(e.target.value));
                        }}
                        className="vtt-brass-slider"
                        style={{ width: '100%', marginTop: '3px' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          };

          return combatGroups.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {combatGroups.map(group => {
                const groupTokens = tokens.filter(t => t.combatGroupId === group.id);
                const isEditingName = editingGroupId === group.id;
                const isDragTarget = (activeDrag && activeDrag.overGroupId === group.id) || dragOverGroupId === group.id;

                return (
                  <div
                    key={group.id}
                    data-combat-group-id={group.id}
                    ref={el => { groupRefs.current[group.id] = el; }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      setDragOverGroupId(group.id);
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setDragOverGroupId(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverGroupId(null);
                      const droppedTokenId = e.dataTransfer.getData('text/plain');
                      if (droppedTokenId && onAssignTokenToGroup) {
                        onAssignTokenToGroup(droppedTokenId, group.id);
                      }
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: isDragTarget
                        ? 'rgba(25, 33, 48, 0.95)'
                        : 'rgba(15, 19, 28, 0.75)',
                      border: isDragTarget
                        ? `2px solid ${group.color}`
                        : `1.5px solid ${group.borderColor || group.color}`,
                      boxShadow: isDragTarget
                        ? `0 0 20px ${group.color}, inset 0 0 15px ${group.color}`
                        : `0 4px 12px rgba(0,0,0,0.5), inset 0 0 10px ${group.bgColor || 'rgba(0,0,0,0.2)'}`,
                      transform: isDragTarget ? 'scale(1.015)' : 'scale(1)',
                      transition: 'all 0.16s ease'
                    }}
                  >
                    {/* Cabecera del Grupo */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: group.color, flexShrink: 0 }} />
                        {isEditingName ? (
                          <input
                            type="text"
                            value={editingGroupName}
                            autoFocus
                            onChange={(e) => setEditingGroupName(e.target.value)}
                            onBlur={() => {
                              if (editingGroupName.trim() && onUpdateCombatGroup) {
                                onUpdateCombatGroup(group.id, { name: editingGroupName.trim() });
                              }
                              setEditingGroupId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (editingGroupName.trim() && onUpdateCombatGroup) {
                                  onUpdateCombatGroup(group.id, { name: editingGroupName.trim() });
                                }
                                setEditingGroupId(null);
                              } else if (e.key === 'Escape') {
                                setEditingGroupId(null);
                              }
                            }}
                            style={{
                              background: '#0d1117',
                              border: `1px solid ${group.color}`,
                              color: '#f8fafc',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              width: '120px'
                            }}
                          />
                        ) : (
                          <span
                            onClick={() => {
                              setEditingGroupId(group.id);
                              setEditingGroupName(group.name);
                            }}
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: group.color,
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title="Clic para renombrar este encuentro"
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{group.name} <Pencil size={10} strokeWidth={2.2} /></span>
                          </span>
                        )}
                        <span style={{ fontSize: '10px', color: '#64748b' }}>({groupTokens.length})</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {!group.isCombatActive ? (
                          onStartGroupCombat && (
                            <button
                              type="button"
                              onClick={() => onStartGroupCombat(group.id)}
                              className="vtt-primary-cta"
                              style={{ padding: '2px 7px', fontSize: '9px', borderRadius: '4px', cursor: 'pointer' }}
                              title="Iniciar combate en este grupo"
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Play size={10} strokeWidth={2.4} /> Iniciar</span>
                            </button>
                          )
                        ) : (
                          <>
                            <span style={{ fontSize: '9px', fontWeight: 700, color: group.color, padding: '1px 4px', background: 'rgba(0,0,0,0.4)', borderRadius: '3px' }}>
                              R{group.combatRound || 1}
                            </span>
                            {onNextGroupTurn && (
                              <button
                                type="button"
                                onClick={() => onNextGroupTurn(group.id)}
                                className="vtt-primary-cta"
                                style={{ padding: '2px 6px', fontSize: '9px', borderRadius: '4px', cursor: 'pointer' }}
                                title="Siguiente turno en este encuentro"
                              >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><SkipForward size={10} strokeWidth={2.4} /> Sig.</span>
                              </button>
                            )}
                            {onEndGroupCombat && (
                              <button
                                type="button"
                                onClick={() => onEndGroupCombat(group.id)}
                                style={{
                                  padding: '2px 5px',
                                  fontSize: '9px',
                                  borderRadius: '3px',
                                  background: 'rgba(239, 68, 68, 0.2)',
                                  border: '1px solid rgba(239, 68, 68, 0.4)',
                                  color: '#fca5a5',
                                  cursor: 'pointer',
                                  fontWeight: 700
                                }}
                                title="Finalizar combate de este encuentro"
                              >
                                ⏹
                              </button>
                            )}
                          </>
                        )}
                        {onRemoveCombatGroup && (
                          <button
                            type="button"
                            onClick={() => onRemoveCombatGroup(group.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#64748b',
                              fontSize: '11px',
                              cursor: 'pointer',
                              padding: '0 2px'
                            }}
                            title="Eliminar este grupo (las fichas quedan libres)"
                          >
                            <Trash2 size={12} strokeWidth={2.2} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Fichas asignadas a este grupo */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {groupTokens.length === 0 ? (
                        <div style={{
                          padding: '8px',
                          textAlign: 'center',
                          fontSize: '10px',
                          color: '#64748b',
                          fontStyle: 'italic',
                          border: '1px dashed rgba(255,255,255,0.1)',
                          borderRadius: '5px'
                        }}>
                          Sin personajes en este encuentro. Usa el selector en la ficha para añadirlos.
                        </div>
                      ) : (
                        tokens.map((token, idx) => token.combatGroupId === group.id ? renderTokenCard(token, idx) : null)
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Sección Fuera de Combate / Libres si hay fichas no asignadas o si se está arrastrando una ficha */}
              {(tokens.some(t => !t.combatGroupId) || activeDrag) && (
                <div
                  ref={freeGroupRef}
                  data-combat-group-id="free"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    setDragOverGroupId('free');
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setDragOverGroupId(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverGroupId(null);
                    const droppedTokenId = e.dataTransfer.getData('text/plain');
                    if (droppedTokenId && onAssignTokenToGroup) {
                      onAssignTokenToGroup(droppedTokenId, null);
                    }
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: (activeDrag?.overGroupId === 'free' || dragOverGroupId === 'free')
                      ? 'rgba(30, 41, 59, 0.95)'
                      : '#11141b',
                    border: (activeDrag?.overGroupId === 'free' || dragOverGroupId === 'free')
                      ? '2px solid #94a3b8'
                      : '1px dashed #2d3748',
                    boxShadow: (activeDrag?.overGroupId === 'free' || dragOverGroupId === 'free')
                      ? '0 0 16px rgba(148, 163, 184, 0.45)'
                      : 'none',
                    transform: (activeDrag?.overGroupId === 'free' || dragOverGroupId === 'free') ? 'scale(1.015)' : 'scale(1)',
                    transition: 'all 0.16s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Circle size={10} strokeWidth={2.4} /> FUERA DE COMBATE / LIBRES</span> ({tokens.filter(t => !t.combatGroupId).length})
                    </span>
                    <span style={{ fontSize: '9px', color: '#64748b', fontStyle: 'italic' }}>
                      {(activeDrag?.overGroupId === 'free' || dragOverGroupId === 'free') ? 'Soltar aquí para liberar del combate' : 'Movimiento libre'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {tokens.filter(t => !t.combatGroupId).length === 0 ? (
                      <div style={{ fontSize: '10px', color: '#475569', fontStyle: 'italic', textAlign: 'center', padding: '6px' }}>
                        Arrastra una ficha aquí para dejarla fuera de combate.
                      </div>
                    ) : (
                      tokens.map((token, idx) => !token.combatGroupId ? renderTokenCard(token, idx) : null)
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {tokens.map((token, idx) => renderTokenCard(token, idx))}
            </div>
          );
        })()}
        
        {tokens.length === 0 && (
          <div style={{
            textAlign: 'center', color: '#64748b', fontSize: '12px', marginTop: '16px',
            padding: '28px 14px', backgroundColor: '#11141b', borderRadius: '10px', border: '1px dashed #262b38'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '8px', color: '#3b4255' }}>—</div>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>Mesa Despejada</div>
            <div style={{ fontSize: '11px', marginBottom: '14px', lineHeight: 1.4 }}>
              No hay personajes ni criaturas en juego.
            </div>
            <button
              type="button"
              onClick={() => setActiveMainTab('library')}
              className="vtt-brass-btn"
              style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', color: '#fbbf24', borderColor: '#f59e0b' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Abrir Elementos <ArrowRight size={12} strokeWidth={2.4} /></span>
            </button>
          </div>
        )}
      </div>
      )}

      {/* Papelera de descarte y retirada del tablero (anclada abajo del todo) */}
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
  );
};

export default TokenSidebar;
