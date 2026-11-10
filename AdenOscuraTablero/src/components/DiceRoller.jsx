import { Fragment, useState, useEffect, useRef } from 'react';
import { Sparkles, Dices, Grip, X, Eye, EyeOff, RotateCcw, Plus, Minus } from 'lucide-react';

const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100];
const createRollId = () => Date.now() + Math.random();

const DiceRoller = ({ isOpen, onClose, onPublicRoll, onHiddenRoll, incomingResult, isSettingsOpen = false }) => {
  const [dicePool, setDicePool] = useState({ 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 1, 100: 0 });
  const [modifier, setModifier] = useState(0);
  const [history, setHistory] = useState([]);
  const [screenRoll, setScreenRoll] = useState(null);
  const [prevIncomingResult, setPrevIncomingResult] = useState(incomingResult);
  const [isPublicRoll, setIsPublicRoll] = useState(true);
  const [panelPos, setPanelPos] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef(null);
  const dragStateRef = useRef(null);

  if (incomingResult !== prevIncomingResult) {
    setPrevIncomingResult(incomingResult);
    if (incomingResult) {
      setScreenRoll(incomingResult);
      setHistory(prev => [incomingResult, ...prev.slice(0, 9)]);
    }
  }

  useEffect(() => {
    if (!screenRoll) return;
    const timer = setTimeout(() => {
      setScreenRoll(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [screenRoll]);

  useEffect(() => {
    if (!isOpen || !onClose) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!panelPos) return;
    const handleResize = () => {
      const rect = panelRef.current?.getBoundingClientRect();
      const width = rect?.width || 340;
      const height = rect?.height || 420;
      setPanelPos(prev => {
        if (!prev) return null;
        const maxLeft = Math.max(8, window.innerWidth - width - 8);
        const maxTop = Math.max(8, window.innerHeight - height - 8);
        const nextX = Math.min(Math.max(8, prev.x), maxLeft);
        const nextY = Math.min(Math.max(8, prev.y), maxTop);
        return (nextX === prev.x && nextY === prev.y) ? prev : { x: nextX, y: nextY };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [panelPos]);

  const handleGripPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originLeft: rect.left,
      originTop: rect.top,
      width: rect.width,
      height: rect.height
    };
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch { /* ignore */ }
  };

  const handleGripPointerMove = (e) => {
    const drag = dragStateRef.current;
    if (!drag) return;
    const rawLeft = drag.originLeft + (e.clientX - drag.startX);
    const rawTop = drag.originTop + (e.clientY - drag.startY);
    const maxLeft = Math.max(8, window.innerWidth - drag.width - 8);
    const maxTop = Math.max(8, window.innerHeight - drag.height - 8);
    setPanelPos({
      x: Math.round(Math.min(Math.max(8, rawLeft), maxLeft)),
      y: Math.round(Math.min(Math.max(8, rawTop), maxTop))
    });
  };

  const handleGripPointerUp = (e) => {
    if (!dragStateRef.current) return;
    try {
      e.currentTarget.releasePointerCapture?.(dragStateRef.current.pointerId);
    } catch { /* ignore */ }
    dragStateRef.current = null;
    setIsDragging(false);
  };

  const handleAddDie = (sides) => {
    setDicePool(prev => ({
      ...prev,
      [sides]: Math.min(30, (prev[sides] || 0) + 1)
    }));
  };

  const handleDecrementDie = (sides) => {
    setDicePool(prev => {
      const nextCount = Math.max(0, (prev[sides] || 0) - 1);
      return { ...prev, [sides]: nextCount };
    });
  };

  const handleRemoveDieType = (sides) => {
    setDicePool(prev => ({
      ...prev,
      [sides]: 0
    }));
  };

  const handleClearPool = () => {
    setDicePool({ 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0, 100: 0 });
    setModifier(0);
  };

  const activeDiceGroups = DICE_TYPES
    .filter(sides => (dicePool[sides] || 0) > 0)
    .map(sides => ({ count: dicePool[sides], sides }));

  const totalDiceCount = activeDiceGroups.reduce((acc, g) => acc + g.count, 0);

  const diceFormulaStr = activeDiceGroups.map(g => `${g.count}d${g.sides}`).join(' + ');
  const modStr = modifier > 0 ? ` + ${modifier}` : modifier < 0 ? ` - ${Math.abs(modifier)}` : '';
  const currentFormula = totalDiceCount > 0 ? (diceFormulaStr + modStr) : (modifier !== 0 ? `${modifier}` : '0 dados');

  const handleRoll = () => {
    if (activeDiceGroups.length === 0) return;

    const diceNotation = activeDiceGroups.map(g => `${g.count}d${g.sides}`);
    const rollReq = {
      id: createRollId(),
      formula: currentFormula,
      diceNotation,
      diceGroups: activeDiceGroups,
      totalDiceCount,
      modifier,
      isPublic: isPublicRoll,
      diceCount: activeDiceGroups[0]?.count || 1,
      diceSides: activeDiceGroups[0]?.sides || 20
    };

    if (isPublicRoll && onPublicRoll) {
      onPublicRoll(rollReq);
    } else if (!isPublicRoll && onHiddenRoll) {
      onHiddenRoll(rollReq);
    }
  };

  return (
    <>
      {/* Notificación flotante de resultado */}
      {screenRoll && (
        <div
          onClick={() => setScreenRoll(null)}
          style={{
            position: 'fixed',
            top: '75px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, rgba(22, 27, 38, 0.98) 0%, rgba(12, 15, 22, 0.98) 100%)',
            border: '2px solid #f59e0b',
            borderRadius: '10px',
            padding: '16px 32px',
            color: '#f8fafc',
            zIndex: 110000,
            boxShadow: '0 20px 45px rgba(0,0,0,0.95), 0 0 25px rgba(245, 158, 11, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            userSelect: 'none',
            minWidth: '240px'
          }}
          title="Haz clic para cerrar"
        >
          <div className="vtt-gothic-title" style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 'bold' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Sparkles size={13} strokeWidth={2.2} /> Destino: {screenRoll.formula}</span>
          </div>
          <div
            className="vtt-gothic-title"
            style={{
              fontSize: '46px',
              fontWeight: '900',
              lineHeight: '1',
              color: (screenRoll.rolls?.length === 1 && screenRoll.diceSides === 20 && screenRoll.rolls[0] === 20)
                ? '#4ade80'
                : (screenRoll.rolls?.length === 1 && screenRoll.diceSides === 20 && screenRoll.rolls[0] === 1)
                ? '#f87171'
                : '#f8fafc'
            }}
          >
            {screenRoll.total}
          </div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span>Dados:</span>
            {screenRoll.detailedRolls && screenRoll.detailedRolls.length > 0 ? (
              screenRoll.detailedRolls.map((r, i) => (
                <span key={i} style={{ background: '#171c26', border: '1px solid #2b3345', padding: '1px 6px', borderRadius: '4px', fontSize: '12px', color: '#e2e8f0' }}>
                  <strong style={{ color: '#fbbf24' }}>{r.dieType || `d${r.sides}`}:</strong> {r.value}
                </span>
              ))
            ) : (
              <span>[{screenRoll.rolls?.join(', ')}]</span>
            )}
            {screenRoll.modifier !== 0 && (
              <span style={{ color: screenRoll.modifier > 0 ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                {screenRoll.modifier > 0 ? `+ ${screenRoll.modifier}` : `- ${Math.abs(screenRoll.modifier)}`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Panel del Cubilete de Dados */}
      {isOpen && (
        <div
          ref={panelRef}
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            ...(panelPos
              ? {
                  left: `${panelPos.x}px`,
                  top: `${panelPos.y}px`
                }
              : {
                  top: '65px',
                  right: isSettingsOpen ? '526px' : '16px',
                  transition: 'right 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
                }),
            zIndex: 5500,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end'
          }}
        >
          <div
            className="vtt-wood-panel"
            style={{
              width: '340px',
              maxWidth: 'calc(100vw - 32px)',
              borderRadius: '10px',
              padding: '15px',
              border: '1.5px solid #334155',
              background: 'linear-gradient(180deg, #161b26 0%, #0d1017 100%)',
              color: '#e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.92)'
            }}
          >
            {/* Cabecera */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #242d3f', paddingBottom: '9px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div
                  onPointerDown={handleGripPointerDown}
                  onPointerMove={handleGripPointerMove}
                  onPointerUp={handleGripPointerUp}
                  onPointerCancel={handleGripPointerUp}
                  onDoubleClick={() => setPanelPos(null)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    color: isDragging ? '#38bdf8' : '#64748b',
                    padding: '4px',
                    marginLeft: '-4px',
                    borderRadius: '4px',
                    backgroundColor: isDragging ? 'rgba(2, 132, 199, 0.25)' : 'transparent',
                    touchAction: 'none',
                    userSelect: 'none',
                    transition: 'color 0.15s ease, background-color 0.15s ease'
                  }}
                  title="Arrastra desde aquí para mover el cubilete (doble clic para restaurar)"
                  aria-label="Mover cubilete"
                >
                  <Grip size={14} strokeWidth={2.2} />
                </div>
                <Dices size={16} strokeWidth={2.2} style={{ color: '#fbbf24' }} />
                <span className="vtt-gothic-title" style={{ fontWeight: 'bold', fontSize: '14px', color: '#f8fafc' }}>
                  Cubilete del Destino
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="vtt-brass-btn"
                style={{ width: '28px', height: '28px', padding: 0, borderRadius: '6px', cursor: 'pointer' }}
                title="Cerrar panel (Esc)"
                aria-label="Cerrar panel"
              >
                <X size={14} strokeWidth={2.2} />
              </button>
            </div>

            {/* Botonera de Dados */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Añadir dados al cubilete:</span>
                <button
                  type="button"
                  onClick={handleClearPool}
                  className="vtt-brass-btn"
                  style={{
                    padding: '3px 8px',
                    borderRadius: '5px',
                    fontSize: '10.5px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: '#fca5a5'
                  }}
                  title="Vaciar todos los dados"
                >
                  <RotateCcw size={11} strokeWidth={2.2} /> Vaciar
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {DICE_TYPES.map(sides => {
                  const qty = dicePool[sides] || 0;
                  const isSelected = qty > 0;
                  return (
                    <button
                      type="button"
                      key={sides}
                      onClick={() => handleAddDie(sides)}
                      className="vtt-gothic-title"
                      style={{
                        padding: '8px 4px',
                        borderRadius: '6px',
                        border: isSelected ? '1px solid #f59e0b' : '1px solid #2b3345',
                        background: isSelected ? 'rgba(245, 158, 11, 0.18)' : '#171c26',
                        color: isSelected ? '#fef08a' : '#cbd5e1',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        position: 'relative',
                        transition: 'all 0.15s ease'
                      }}
                      title={`Haz clic para añadir 1d${sides} al cubilete`}
                    >
                      <span>+ d{sides}</span>
                      {isSelected && (
                        <span style={{
                          background: '#f59e0b',
                          color: '#0b0d12',
                          borderRadius: '999px',
                          padding: '1px 5px',
                          fontSize: '9px',
                          fontWeight: 900,
                          lineHeight: 1.1
                        }}>
                          {qty}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reserva de Dados Seleccionados */}
            <div style={{
              background: '#0f131c',
              border: '1px solid #242c3d',
              borderRadius: '7px',
              padding: '9px 10px',
              minHeight: '46px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Cubilete actual:
                </span>
                <span className="vtt-retro-badge" style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 800 }}>
                  {totalDiceCount} {totalDiceCount === 1 ? 'dado' : 'dados'}
                </span>
              </div>

              {activeDiceGroups.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  {activeDiceGroups.map((group, idx) => (
                    <Fragment key={group.sides}>
                      {idx > 0 && <span style={{ color: '#64748b', fontWeight: 'bold', fontSize: '12px' }}>+</span>}
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: '#171c26',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        padding: '3px 5px 3px 7px',
                        gap: '5px'
                      }}>
                        <strong className="vtt-retro-badge" style={{ color: '#fbbf24', fontSize: '12px' }}>
                          {group.count}d{group.sides}
                        </strong>
                        <div style={{ display: 'flex', gap: '3px' }}>
                          <button
                            type="button"
                            onClick={() => handleDecrementDie(group.sides)}
                            style={{
                              width: '22px', height: '22px', borderRadius: '4px', background: '#1e2534',
                              border: '1px solid #334155', color: '#cbd5e1', cursor: 'pointer',
                              padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            title="Restar 1 dado de este tipo"
                          >
                            <Minus size={11} strokeWidth={2.4} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddDie(group.sides)}
                            style={{
                              width: '22px', height: '22px', borderRadius: '4px', background: '#1e2534',
                              border: '1px solid #334155', color: '#cbd5e1', cursor: 'pointer',
                              padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            title="Añadir 1 dado más de este tipo"
                          >
                            <Plus size={11} strokeWidth={2.4} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDieType(group.sides)}
                            style={{
                              width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.14)',
                              border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', cursor: 'pointer',
                              padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            title="Quitar este tipo de dado del cubilete"
                          >
                            <X size={11} strokeWidth={2.4} />
                          </button>
                        </div>
                      </div>
                    </Fragment>
                  ))}
                  {modifier !== 0 && (
                    <span className="vtt-retro-badge" style={{
                      color: modifier > 0 ? '#4ade80' : '#f87171',
                      fontWeight: 800,
                      fontSize: '12px',
                      background: '#171c26',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      border: '1px solid #2b3345'
                    }}>
                      {modifier > 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`}
                    </span>
                  )}
                </div>
              ) : (
                <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                  El cubilete está vacío. Pulsa los dados de arriba para añadirlos.
                </span>
              )}
            </div>

            {/* Modificador numérico */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', color: '#cbd5e1', fontWeight: 600 }}>Modificador numérico:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setModifier(modifier - 1)}
                  className="vtt-brass-btn"
                  style={{ width: '28px', height: '28px', padding: 0, borderRadius: '5px', cursor: 'pointer' }}
                >
                  <Minus size={13} strokeWidth={2.4} />
                </button>
                <span
                  className="vtt-retro-badge"
                  style={{
                    minWidth: '38px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    color: modifier > 0 ? '#4ade80' : modifier < 0 ? '#f87171' : '#f8fafc'
                  }}
                >
                  {modifier > 0 ? `+${modifier}` : modifier}
                </span>
                <button
                  type="button"
                  onClick={() => setModifier(modifier + 1)}
                  className="vtt-brass-btn"
                  style={{ width: '28px', height: '28px', padding: 0, borderRadius: '5px', cursor: 'pointer' }}
                >
                  <Plus size={13} strokeWidth={2.4} />
                </button>
                {modifier !== 0 && (
                  <button
                    type="button"
                    onClick={() => setModifier(0)}
                    className="vtt-brass-btn"
                    style={{ width: '26px', height: '26px', padding: 0, borderRadius: '5px', cursor: 'pointer', color: '#94a3b8' }}
                    title="Restablecer a 0"
                  >
                    <RotateCcw size={12} strokeWidth={2.2} />
                  </button>
                )}
              </div>
            </div>

            {/* Opciones de Visibilidad */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsPublicRoll(true)}
                style={{
                  flex: 1, padding: '7px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11.5px', fontWeight: 700,
                  background: isPublicRoll ? 'rgba(16, 185, 129, 0.16)' : '#171c26',
                  color: isPublicRoll ? '#34d399' : '#94a3b8',
                  border: isPublicRoll ? '1px solid #10b981' : '1px solid #2b3345'
                }}
                title="Lanzamiento visible para todos los jugadores en la Pantalla 3D"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><Eye size={13} strokeWidth={2.2} /> Público (3D)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPublicRoll(false)}
                style={{
                  flex: 1, padding: '7px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11.5px', fontWeight: 700,
                  background: !isPublicRoll ? 'rgba(239, 68, 68, 0.16)' : '#171c26',
                  color: !isPublicRoll ? '#fca5a5' : '#94a3b8',
                  border: !isPublicRoll ? '1px solid #ef4444' : '1px solid #2b3345'
                }}
                title="Tirada oculta: solo el Máster ve el resultado en su pantalla"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><EyeOff size={13} strokeWidth={2.2} /> Oculto (Local)</span>
              </button>
            </div>

            {/* Botón Principal de Lanzamiento */}
            <button
              type="button"
              onClick={handleRoll}
              disabled={totalDiceCount === 0}
              className={totalDiceCount > 0 ? 'vtt-primary-cta' : 'vtt-brass-btn'}
              style={{
                padding: '10px 12px',
                borderRadius: '7px',
                fontSize: '13px',
                cursor: totalDiceCount > 0 ? 'pointer' : 'not-allowed',
                opacity: totalDiceCount > 0 ? 1 : 0.45
              }}
            >
              <Dices size={15} strokeWidth={2.2} />
              <span>Lanzar dados ({currentFormula})</span>
            </button>

            {/* Historial */}
            {history.length > 0 && (
              <div style={{ borderTop: '1px solid #242c3d', paddingTop: '8px', maxHeight: '115px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="vtt-context-section-label">Historial</span>
                {history.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', backgroundColor: '#10141e', border: '1px solid #232b3b', padding: '5px 8px', borderRadius: '5px' }}>
                    <span style={{ color: '#cbd5e1', display: 'flex', gap: '5px', alignItems: 'center', minWidth: 0, overflow: 'hidden' }}>
                      <strong>{item.formula}</strong>
                      <span style={{ color: '#64748b', fontSize: '10.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        [{item.detailedRolls ? item.detailedRolls.map(r => `${r.dieType || 'd' + r.sides}:${r.value}`).join(', ') : item.rolls?.join(', ')}]
                      </span>
                    </span>
                    <strong className="vtt-retro-badge" style={{ color: '#fbbf24', flexShrink: 0 }}>= {item.total}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DiceRoller;
