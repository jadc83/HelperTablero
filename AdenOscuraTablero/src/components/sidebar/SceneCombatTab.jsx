import { useState } from 'react';
import {
  Play, SkipForward, Square, Swords, Pencil, Trash2,
  Circle, ArrowRight, X, ChevronUp, ChevronDown
} from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';
import TokenCombatCard from './TokenCombatCard';

/**
 * Pestaña "En Escena" del panel lateral: gestión de iniciativa global,
 * encuentros independientes (grupos de combate) y tarjetas de combatientes.
 */
const SceneCombatTab = ({
  tokens = [],
  combatGroups = [],
  isCombatActive = false,
  combatRound = 1,
  activeTurnTokenId,
  movementLimitsEnabled = true,
  expandedTokenIds,
  onToggleTokenExpand,
  onExpandAll,
  onCollapseAll,
  activeDrag,
  cardRefs,
  groupRefs,
  freeGroupRef,
  handleStartDrag,
  handleNamePointerDown,
  lastDragEndTimeRef,
  onStartCombat,
  onNextTurn,
  onEndCombat,
  onToggleMovementLimits,
  onResetTokenMovement,
  onSelectActiveTurn,
  onCreateCombatGroup,
  onRemoveCombatGroup,
  onUpdateCombatGroup,
  onAssignTokenToGroup,
  onStartGroupCombat,
  onNextGroupTurn,
  onEndGroupCombat,
  onSelectGroupActiveTurn,
  onDisbandAllGroups,
  onCenterOnToken,
  onOpenTokenSheet,
  onEditCharacter,
  onSendToGraveyard,
  onRemoveToken,
  onUpdateTokenStats,
  onUpdateTokenSize,
  onOpenLibraryTab
}) => {
  const { confirm } = useConfirm();
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [dragOverGroupId, setDragOverGroupId] = useState(null);
  const [activeGroupMenuTokenId, setActiveGroupMenuTokenId] = useState(null);

  const handleConfirmRemoveGroup = async (group) => {
    if (!onRemoveCombatGroup) return;
    const confirmed = await confirm({
      title: 'Eliminar encuentro',
      message: `¿Eliminar el grupo "${group.name}"? Las fichas asignadas pasarán a quedar libres fuera de combate.`,
      confirmText: 'Eliminar grupo',
      variant: 'danger'
    });
    if (confirmed) onRemoveCombatGroup(group.id);
  };

  const handleConfirmDisbandAll = async () => {
    if (!onDisbandAllGroups) return;
    const confirmed = await confirm({
      title: 'Disolver encuentros',
      message: '¿Disolver todos los encuentros activos y volver a la lista unificada de turnos?',
      confirmText: 'Disolver todos',
      variant: 'danger'
    });
    if (confirmed) onDisbandAllGroups();
  };

  const renderCard = (token, idx) => (
    <TokenCombatCard
      key={token.id}
      token={token}
      idx={idx}
      isExpanded={expandedTokenIds.has(token.id)}
      onToggleExpand={onToggleTokenExpand}
      isBeingDragged={activeDrag?.index === idx}
      activeDrag={activeDrag}
      cardRef={(el) => { cardRefs.current[token.id] = el; }}
      handleStartDrag={handleStartDrag}
      handleNamePointerDown={handleNamePointerDown}
      lastDragEndTimeRef={lastDragEndTimeRef}
      isCombatActive={isCombatActive}
      activeTurnTokenId={activeTurnTokenId}
      combatGroups={combatGroups}
      activeGroupMenuTokenId={activeGroupMenuTokenId}
      setActiveGroupMenuTokenId={setActiveGroupMenuTokenId}
      onCenterOnToken={onCenterOnToken}
      onOpenTokenSheet={onOpenTokenSheet}
      onEditCharacter={onEditCharacter}
      onAssignTokenToGroup={onAssignTokenToGroup}
      onSelectActiveTurn={onSelectActiveTurn}
      onSelectGroupActiveTurn={onSelectGroupActiveTurn}
      onSendToGraveyard={onSendToGraveyard}
      onRemoveToken={onRemoveToken}
      onUpdateTokenStats={onUpdateTokenStats}
      onResetTokenMovement={onResetTokenMovement}
      onUpdateTokenSize={onUpdateTokenSize}
    />
  );

  return (
    <div
      style={{ padding: '12px 10px', flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
      onClick={() => { if (activeGroupMenuTokenId) setActiveGroupMenuTokenId(null); }}
    >
      {/* Barra de Gestión de Turnos Global */}
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
                      title={movementLimitsEnabled ? 'Límites de movimiento activados. Clic para desactivar' : 'Límites de movimiento desactivados. Clic para activar'}
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
                        padding: '4px 7px',
                        fontSize: '10px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center'
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

      {/* Barra Superior de Encuentros */}
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
          <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Swords size={12} strokeWidth={2.2} /> Encuentros ({combatGroups.length})
          </span>
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
                onClick={handleConfirmDisbandAll}
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

      {/* Botón rápido de desplegar / plegar todos */}
      {tokens.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 2px', flexShrink: 0 }}>
          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
            Combatientes ({tokens.length})
          </span>
          <button
            type="button"
            onClick={expandedTokenIds.size === tokens.length ? onCollapseAll : onExpandAll}
            className="vtt-brass-btn"
            style={{
              padding: '3px 8px',
              fontSize: '10px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title={expandedTokenIds.size === tokens.length ? 'Plegar todas las fichas' : 'Desplegar todas las fichas'}
          >
            {expandedTokenIds.size === tokens.length ? (
              <><ChevronUp size={11} strokeWidth={2.3} /> Plegar todo</>
            ) : (
              <><ChevronDown size={11} strokeWidth={2.3} /> Desplegar todo</>
            )}
          </button>
        </div>
      )}

      {/* Lista de Grupos o Lista Plana */}
      {combatGroups.length > 0 ? (
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
                  backgroundColor: isDragTarget ? 'rgba(25, 33, 48, 0.95)' : 'rgba(15, 19, 28, 0.75)',
                  border: isDragTarget ? `2px solid ${group.color}` : `1.5px solid ${group.borderColor || group.color}`,
                  boxShadow: isDragTarget
                    ? `0 0 20px ${group.color}, inset 0 0 15px ${group.color}`
                    : `0 4px 12px rgba(0,0,0,0.5), inset 0 0 10px ${group.bgColor || 'rgba(0,0,0,0.2)'}`,
                  transform: isDragTarget ? 'scale(1.015)' : 'scale(1)',
                  transition: 'all 0.16s ease'
                }}
              >
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
                          padding: '2px 5px',
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
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {group.name} <Pencil size={10} strokeWidth={2.2} />
                        </span>
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
                          style={{ padding: '3px 7px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer' }}
                          title="Iniciar combate en este grupo"
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Play size={10} strokeWidth={2.4} /> Iniciar</span>
                        </button>
                      )
                    ) : (
                      <>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: group.color, padding: '2px 5px', background: 'rgba(0,0,0,0.4)', borderRadius: '3px' }}>
                          R{group.combatRound || 1}
                        </span>
                        {onNextGroupTurn && (
                          <button
                            type="button"
                            onClick={() => onNextGroupTurn(group.id)}
                            className="vtt-primary-cta"
                            style={{ padding: '3px 6px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer' }}
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
                              padding: '4px 6px',
                              borderRadius: '4px',
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              color: '#fca5a5',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                            title="Finalizar combate de este encuentro"
                          >
                            <Square size={10} strokeWidth={2.4} />
                          </button>
                        )}
                      </>
                    )}
                    {onRemoveCombatGroup && (
                      <button
                        type="button"
                        onClick={() => handleConfirmRemoveGroup(group)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '3px',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                        title="Eliminar este grupo (las fichas quedan libres)"
                      >
                        <Trash2 size={12} strokeWidth={2.2} />
                      </button>
                    )}
                  </div>
                </div>

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
                      Sin personajes en este encuentro. Usa el selector en la ficha o arrastra aquí para añadirlos.
                    </div>
                  ) : (
                    tokens.map((token, idx) => token.combatGroupId === group.id ? renderCard(token, idx) : null)
                  )}
                </div>
              </div>
            );
          })}

          {/* Zona Fuera de Combate */}
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
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Circle size={10} strokeWidth={2.4} /> FUERA DE COMBATE ({tokens.filter(t => !t.combatGroupId).length})
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
                  tokens.map((token, idx) => !token.combatGroupId ? renderCard(token, idx) : null)
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {tokens.map((token, idx) => renderCard(token, idx))}
        </div>
      )}

      {tokens.length === 0 && (
        <div style={{
          textAlign: 'center', color: '#64748b', fontSize: '12px', marginTop: '16px',
          padding: '28px 14px', backgroundColor: '#11141b', borderRadius: '10px', border: '1px dashed #262b38'
        }}>
          <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>Mesa Despejada</div>
          <div style={{ fontSize: '11px', marginBottom: '14px', lineHeight: 1.4 }}>
            No hay personajes ni criaturas en juego.
          </div>
          <button
            type="button"
            onClick={onOpenLibraryTab}
            className="vtt-brass-btn"
            style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', color: '#fbbf24', borderColor: '#f59e0b' }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Abrir Elementos <ArrowRight size={12} strokeWidth={2.4} />
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SceneCombatTab;
