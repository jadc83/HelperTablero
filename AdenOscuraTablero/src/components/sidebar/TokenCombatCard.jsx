import {
  Grip, ChevronUp, ChevronDown, RotateCcw, Star, X
} from 'lucide-react';

/**
 * Tarjeta colapsable de un combatiente en la pestaña "En Escena".
 * Soporta reordenamiento fluido por arrastre, asignación a encuentros,
 * edición rápida de PV/MP/SAN, reset de movimiento y tamaño en tablero.
 */
const TokenCombatCard = ({
  token,
  idx,
  isExpanded,
  onToggleExpand,
  isBeingDragged,
  activeDrag,
  cardRef,
  handleStartDrag,
  handleNamePointerDown,
  lastDragEndTimeRef,
  isCombatActive,
  activeTurnTokenId,
  combatGroups = [],
  activeGroupMenuTokenId,
  setActiveGroupMenuTokenId,
  onCenterOnToken,
  onOpenTokenSheet,
  onEditCharacter,
  onAssignTokenToGroup,
  onSelectActiveTurn,
  onSelectGroupActiveTurn,
  onSendToGraveyard,
  onRemoveToken,
  onUpdateTokenStats,
  onResetTokenMovement,
  onUpdateTokenSize
}) => {
  const myGroup = combatGroups.find(g => g.id === token.combatGroupId);
  const isCurrentTurn = myGroup
    ? (myGroup.isCombatActive && myGroup.activeTurnTokenId === token.id)
    : (isCombatActive && activeTurnTokenId === token.id);

  const isEnemy = token.faction === 'enemy';
  const isAlly = token.faction === 'ally';
  const isPlayer = !isEnemy && !isAlly;

  const factionBorderColor = isEnemy
    ? '#ef4444'
    : isAlly
    ? '#3b82f6'
    : '#10b981';

  const factionBgGradient = isEnemy
    ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.14) 0%, rgba(16, 13, 18, 0.96) 65%)'
    : isAlly
    ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.14) 0%, rgba(13, 17, 24, 0.96) 65%)'
    : 'linear-gradient(90deg, rgba(16, 185, 129, 0.18) 0%, rgba(12, 22, 17, 0.96) 65%)';

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

  const handleAssignTurn = () => {
    if (myGroup && onSelectGroupActiveTurn) {
      onSelectGroupActiveTurn(myGroup.id, token.id);
    } else if (onSelectActiveTurn) {
      onSelectActiveTurn(token.id);
    }
  };

  const canAssignTurn = Boolean((myGroup && onSelectGroupActiveTurn) || (!myGroup && onSelectActiveTurn));

  const vitalBars = [
    {
      key: 'hp',
      label: 'PV',
      value: hp,
      max: maxHp,
      pct: hpPct,
      labelColor: '#fca5a5',
      trackBg: '#150a0c',
      trackBorder: '1px solid #331015',
      fillBg: hp <= 0 ? '#450a0a' : 'linear-gradient(90deg, #58151c 0%, #8b1823 100%)',
      tooltip: `Puntos de Vida: ${hp}/${maxHp} (${Math.round(hpPct)}%)`,
      minusTitle: 'Restar 1 Punto de Vida (PV)',
      plusTitle: 'Sumar 1 Punto de Vida (PV)'
    },
    {
      key: 'mp',
      label: 'MP',
      value: mp,
      max: maxMp,
      pct: mpPct,
      labelColor: '#93c5fd',
      trackBg: '#0a101d',
      trackBorder: '1px solid #12243d',
      fillBg: 'linear-gradient(90deg, #102a48 0%, #1d4b7d 100%)',
      tooltip: `Puntos de Magia / Éter: ${mp}/${maxMp} (${Math.round(mpPct)}%)`,
      minusTitle: 'Restar 1 Punto de Magia (MP)',
      plusTitle: 'Sumar 1 Punto de Magia (MP)'
    },
    {
      key: 'san',
      label: 'SAN',
      value: san,
      max: maxSan,
      pct: sanPct,
      labelColor: '#fef08a',
      trackBg: '#191408',
      trackBorder: '1px solid #3b2e0e',
      fillBg: 'linear-gradient(90deg, #5a4208 0%, #8c670f 100%)',
      tooltip: `Cordura: ${san}/${maxSan} (${Math.round(sanPct)}%)`,
      minusTitle: 'Restar 1 Punto de Cordura (SAN)',
      plusTitle: 'Sumar 1 Punto de Cordura (SAN)'
    }
  ];

  return (
    <div
      ref={cardRef}
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
        zIndex: isBeingDragged ? 50 : activeGroupMenuTokenId === token.id ? 30 : 1,
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
        overflow: activeGroupMenuTokenId === token.id ? 'visible' : 'hidden',
        opacity: isBeingDragged && activeDrag.isOverTrash ? 0.75 : 1
      }}
    >
      {/* Cabecera Desplegable */}
      <div
        onClick={() => onToggleExpand(token.id)}
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
        title={isExpanded ? 'Haz clic para plegar controles (Doble clic: centrar en el tablero)' : 'Haz clic para ver controles completos (Doble clic: centrar en el tablero)'}
      >
        {/* Izquierda: Asa de arrastre + Turno + Avatar */}
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
              padding: '4px',
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

        {/* Centro: Nombre + Micro-Barra de Salud */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%' }}>
            <span
              className="vtt-gothic-title"
              onPointerDown={(e) => handleNamePointerDown(e, idx, token.id)}
              onClick={(e) => {
                e.stopPropagation();
                if (Date.now() - lastDragEndTimeRef.current < 250 || activeDrag) return;
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
            {((myGroup?.isCombatActive || isCombatActive) && isCurrentTurn) && (
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

        {/* Derecha: Selector de Grupo + Botón Colapsar */}
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
                  fontSize: '10px',
                  cursor: 'pointer',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  backgroundColor: myGroup ? myGroup.bgColor : '#181e2b',
                  border: `1px solid ${myGroup ? myGroup.color : '#2c3548'}`,
                  color: myGroup ? myGroup.color : '#94a3b8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                title="Asignar a un encuentro o grupo de combate"
              >
                <span>{myGroup ? myGroup.name.slice(0, 8) : 'Libre'}</span>
                <ChevronDown size={11} strokeWidth={2.2} />
              </button>

              {activeGroupMenuTokenId === token.id && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 4px)',
                    minWidth: '150px',
                    backgroundColor: '#131722',
                    border: '1px solid #334155',
                    borderRadius: '7px',
                    padding: '4px',
                    boxShadow: '0 10px 24px rgba(0,0,0,0.8)',
                    zIndex: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  {combatGroups.map(group => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => {
                        if (onAssignTokenToGroup) onAssignTokenToGroup(token.id, group.id);
                        setActiveGroupMenuTokenId(null);
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '5px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: token.combatGroupId === group.id ? 'rgba(245, 158, 11, 0.16)' : 'transparent',
                        color: group.color || '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: group.color, flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.name}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      if (onAssignTokenToGroup) onAssignTokenToGroup(token.id, null);
                      setActiveGroupMenuTokenId(null);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '5px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '4px',
                      border: 'none',
                      borderTop: '1px solid #1e2433',
                      marginTop: '2px',
                      cursor: 'pointer',
                      backgroundColor: !token.combatGroupId ? 'rgba(148, 163, 184, 0.15)' : 'transparent',
                      color: '#94a3b8'
                    }}
                  >
                    Fuera de combate
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => onToggleExpand(token.id)}
            className="vtt-brass-btn"
            style={{
              width: '24px',
              height: '22px',
              padding: 0,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isExpanded ? '#fbbf24' : '#94a3b8'
            }}
            title={isExpanded ? 'Plegar controles' : 'Desplegar controles'}
          >
            {isExpanded ? <ChevronUp size={13} strokeWidth={2.3} /> : <ChevronDown size={13} strokeWidth={2.3} />}
          </button>
        </div>
      </div>

      {/* Contenido Desplegable */}
      {isExpanded && (
        <div style={{
          padding: '8px 9px 10px 9px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          backgroundColor: 'rgba(11, 13, 19, 0.65)'
        }}>
          {/* A. Fila de acciones rápidas de combate */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isCurrentTurn ? (
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  backgroundColor: 'rgba(245, 158, 11, 0.18)',
                  border: '1px solid #fbbf24',
                  color: '#fbbf24',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Star size={10} strokeWidth={2.4} /> Turno activo
                </span>
              ) : (
                canAssignTurn && (
                  <button
                    type="button"
                    onClick={handleAssignTurn}
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
                )
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {onSendToGraveyard && (
                <button
                  type="button"
                  onClick={() => onSendToGraveyard(token)}
                  style={{
                    padding: '4px 9px',
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
                  minWidth: '24px',
                  height: '22px',
                  padding: '0 6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
                <X size={12} strokeWidth={2.4} />
              </button>
            </div>
          </div>

          {/* B. Barras vitales PV / MP / SAN */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            background: '#0d1017',
            padding: '7px 9px',
            borderRadius: '6px',
            border: '1px solid #1a202c'
          }}>
            {vitalBars.map((bar) => (
              <div key={bar.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '28px', fontSize: '10px', fontWeight: 800, color: bar.labelColor, textAlign: 'center', flexShrink: 0, letterSpacing: '0.04em' }}>
                  {bar.label}
                </span>
                <div
                  style={{
                    position: 'relative',
                    flex: 1,
                    height: '18px',
                    background: bar.trackBg,
                    borderRadius: '3px',
                    overflow: 'hidden',
                    border: bar.trackBorder
                  }}
                  title={bar.tooltip}
                >
                  <div style={{ width: `${bar.pct}%`, height: '100%', background: bar.fillBg, transition: 'width 0.2s ease' }} />
                  <span style={{
                    position: 'absolute',
                    inset: 0,
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
                    {bar.value} / {bar.max}
                  </span>
                </div>
                {onUpdateTokenStats && (
                  <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => onUpdateTokenStats(token.id, { [bar.key]: Math.max(0, bar.value - 1) })}
                      className="vtt-brass-btn"
                      style={{ width: '24px', height: '22px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}
                      title={bar.minusTitle}
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateTokenStats(token.id, { [bar.key]: Math.min(bar.max, bar.value + 1) })}
                      className="vtt-brass-btn"
                      style={{ width: '24px', height: '22px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}
                      title={bar.plusTitle}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* C. Movimiento */}
          <div
            style={{
              backgroundColor: '#0d1017',
              borderRadius: '6px',
              padding: '7px 9px',
              border: isCurrentTurn ? '1px solid #d4af37' : '1px solid #1a202c',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px'
            }}
            title={`Movimiento: ${remainingSpeed} / ${maxSpeed} casillas (${remainingSpeed * 5} ft)`}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: token.isGraveWound ? '#fca5a5' : '#a7f3d0'
              }}>
                Movimiento ({remainingSpeed}/{maxSpeed} c.)
              </span>
              {onResetTokenMovement && (
                <button
                  type="button"
                  onClick={() => onResetTokenMovement(token.id)}
                  className="vtt-brass-btn"
                  style={{
                    padding: '3px 8px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    borderRadius: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Restablecer el movimiento completo del personaje a su máximo en este turno"
                >
                  <RotateCcw size={10} strokeWidth={2.3} /> Reset
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

          {/* D. Tamaño en el Mapa */}
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

export default TokenCombatCard;
