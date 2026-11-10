import { useState, useEffect } from 'react';
import { Sparkles, Dices, Grip, X, Eye, EyeOff, RotateCcw, Plus, Minus } from 'lucide-react';
import { useAppSettings } from '../hooks/useAppSettings';
import { useDraggablePanel } from '../hooks/useDraggablePanel';

const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100];
const EMPTY_DICE_MAP = { 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0, 100: 0 };
const createRollId = () => Date.now() + Math.random();

const formatGroupFormula = (group, compact = false) => {
  const base = `${group.count}d${group.sides}`;
  const mod = group.modifier || 0;
  if (mod === 0) return base;
  const sign = mod > 0 ? '+' : '-';
  const absMod = Math.abs(mod);
  return compact ? `${base}${sign}${absMod}` : `${base} ${sign} ${absMod}`;
};

const DiceRoller = ({ isOpen, onClose, onPublicRoll, onHiddenRoll, incomingResult, isSettingsOpen = false }) => {
  const { settings } = useAppSettings();
  const [dicePool, setDicePool] = useState({ ...EMPTY_DICE_MAP, 20: 1 });
  const [diceModifiers, setDiceModifiers] = useState({ ...EMPTY_DICE_MAP });
  const [history, setHistory] = useState([]);
  const [screenRoll, setScreenRoll] = useState(null);
  const [prevIncomingResult, setPrevIncomingResult] = useState(incomingResult);
  const [isPublicRoll, setIsPublicRoll] = useState(true);
  const { panelRef, panelPos, isDragging, gripProps } = useDraggablePanel('diceRoller', {
    fallbackWidth: 340,
    fallbackHeight: 440
  });

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
    }, settings.diceResultDurationMs || 4500);
    return () => clearTimeout(timer);
  }, [screenRoll, settings.diceResultDurationMs]);

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

  const handleAddDie = (sides) => {
    setDicePool(prev => ({
      ...prev,
      [sides]: Math.min(30, (prev[sides] || 0) + 1)
    }));
  };

  const handleDecrementDie = (sides) => {
    const nextCount = Math.max(0, (dicePool[sides] || 0) - 1);
    setDicePool(prev => ({ ...prev, [sides]: nextCount }));
    if (nextCount === 0) {
      setDiceModifiers(prev => ({ ...prev, [sides]: 0 }));
    }
  };

  const handleRemoveDieType = (sides) => {
    setDicePool(prev => ({
      ...prev,
      [sides]: 0
    }));
    setDiceModifiers(prev => ({
      ...prev,
      [sides]: 0
    }));
  };

  const handleAdjustModifier = (sides, delta) => {
    setDiceModifiers(prev => ({
      ...prev,
      [sides]: Math.max(-99, Math.min(99, (prev[sides] || 0) + delta))
    }));
  };

  const handleResetModifier = (sides) => {
    setDiceModifiers(prev => ({
      ...prev,
      [sides]: 0
    }));
  };

  const handleClearPool = () => {
    setDicePool({ ...EMPTY_DICE_MAP });
    setDiceModifiers({ ...EMPTY_DICE_MAP });
  };

  const activeDiceGroups = DICE_TYPES
    .filter(sides => (dicePool[sides] || 0) > 0)
    .map(sides => ({ count: dicePool[sides], sides, modifier: diceModifiers[sides] || 0 }));

  const totalDiceCount = activeDiceGroups.reduce((acc, g) => acc + g.count, 0);
  const totalModifier = activeDiceGroups.reduce((acc, g) => acc + g.modifier, 0);
  const isMultiGroup = activeDiceGroups.length > 1;

  const currentFormula = totalDiceCount > 0
    ? activeDiceGroups.map(g => formatGroupFormula(g, isMultiGroup)).join(' + ')
    : '0 dados';

  const handleRoll = () => {
    if (activeDiceGroups.length === 0) return;

    const diceNotation = activeDiceGroups.map(g => `${g.count}d${g.sides}`);
    const rollReq = {
      id: createRollId(),
      formula: currentFormula,
      diceNotation,
      diceGroups: activeDiceGroups,
      totalDiceCount,
      modifier: totalModifier,
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
            background: 'var(--vtt-bg-panel-gradient)',
            border: '2px solid var(--vtt-gold)',
            borderRadius: '10px',
            padding: '16px 32px',
            color: 'var(--vtt-text-strong)',
            zIndex: 110000,
            boxShadow: 'var(--vtt-shadow-panel)',
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
          <div className="vtt-gothic-title" style={{ fontSize: '12px', color: 'var(--vtt-accent-amber)', fontWeight: 'bold' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Sparkles size={13} strokeWidth={2.2} /> Destino: {screenRoll.formula}</span>
          </div>
          <div
            className="vtt-gothic-title"
            style={{
              fontSize: '46px',
              fontWeight: '900',
              lineHeight: '1',
              color: (screenRoll.rolls?.length === 1 && screenRoll.diceSides === 20 && screenRoll.rolls[0] === 20)
                ? 'var(--vtt-accent-green-strong)'
                : (screenRoll.rolls?.length === 1 && screenRoll.diceSides === 20 && screenRoll.rolls[0] === 1)
                ? 'var(--vtt-accent-red)'
                : 'var(--vtt-text-strong)'
            }}
          >
            {screenRoll.total}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--vtt-text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span>Dados:</span>
            {screenRoll.groupResults && screenRoll.groupResults.length > 1 ? (
              screenRoll.groupResults.map((g, i) => (
                <span key={i} style={{ background: 'var(--vtt-bg-card)', border: '1px solid var(--vtt-border)', padding: '1px 7px', borderRadius: '4px', fontSize: '12px', color: 'var(--vtt-text)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <strong style={{ color: 'var(--vtt-accent-amber)' }}>{g.count}d{g.sides}:</strong>
                  <span>{g.rolls.length === 1 ? g.rolls[0] : `[${g.rolls.join(', ')}]`}</span>
                  {g.modifier !== 0 && (
                    <span style={{ color: g.modifier > 0 ? 'var(--vtt-accent-green-strong)' : 'var(--vtt-accent-red)', fontWeight: 'bold' }}>
                      {g.modifier > 0 ? `+${g.modifier}` : g.modifier}
                    </span>
                  )}
                  {(g.modifier !== 0 || g.rolls.length > 1) && (
                    <strong style={{ color: 'var(--vtt-text-strong)' }}>= {g.subtotal}</strong>
                  )}
                </span>
              ))
            ) : (
              <>
                {screenRoll.detailedRolls && screenRoll.detailedRolls.length > 0 ? (
                  screenRoll.detailedRolls.map((r, i) => (
                    <span key={i} style={{ background: 'var(--vtt-bg-card)', border: '1px solid var(--vtt-border)', padding: '1px 6px', borderRadius: '4px', fontSize: '12px', color: 'var(--vtt-text)' }}>
                      <strong style={{ color: 'var(--vtt-accent-amber)' }}>{r.dieType || `d${r.sides}`}:</strong> {r.value}
                    </span>
                  ))
                ) : (
                  <span>[{screenRoll.rolls?.join(', ')}]</span>
                )}
                {screenRoll.modifier !== 0 && (
                  <span style={{ color: screenRoll.modifier > 0 ? 'var(--vtt-accent-green-strong)' : 'var(--vtt-accent-red)', fontWeight: 'bold' }}>
                    {screenRoll.modifier > 0 ? `+ ${screenRoll.modifier}` : `- ${Math.abs(screenRoll.modifier)}`}
                  </span>
                )}
              </>
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
              border: '1.5px solid var(--vtt-border-strong)',
              background: 'var(--vtt-bg-panel-gradient)',
              color: 'var(--vtt-text)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: 'var(--vtt-shadow-panel)'
            }}
          >
            {/* Cabecera */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--vtt-border-subtle)', paddingBottom: '9px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div
                  {...gripProps}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    color: isDragging ? 'var(--vtt-info)' : 'var(--vtt-text-dim)',
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
                <Dices size={16} strokeWidth={2.2} style={{ color: 'var(--vtt-gold-light)' }} />
                <span className="vtt-gothic-title" style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--vtt-text-strong)' }}>
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
                <span style={{ fontSize: '11px', color: 'var(--vtt-text-muted)', fontWeight: 600 }}>Añadir dados al cubilete:</span>
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
                    color: 'var(--vtt-accent-red)'
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
                        border: isSelected ? '1px solid var(--vtt-gold)' : '1px solid var(--vtt-border)',
                        background: isSelected ? 'var(--vtt-accent-amber-bg)' : 'var(--vtt-btn-bg)',
                        color: isSelected ? 'var(--vtt-accent-amber)' : 'var(--vtt-btn-text)',
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
                          background: 'var(--vtt-gold)',
                          color: 'var(--vtt-badge-active-text)',
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
              background: 'var(--vtt-bg-inset)',
              border: '1px solid var(--vtt-border)',
              borderRadius: '7px',
              padding: '9px 10px',
              minHeight: '46px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--vtt-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Cubilete actual:
                </span>
                <span className="vtt-retro-badge" style={{ fontSize: '11px', color: 'var(--vtt-accent-amber)', fontWeight: 800 }}>
                  {totalDiceCount} {totalDiceCount === 1 ? 'dado' : 'dados'}
                </span>
              </div>

              {activeDiceGroups.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: activeDiceGroups.length === 1 ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))',
                  gap: '7px'
                }}>
                  {activeDiceGroups.map((group) => (
                    <div
                      key={group.sides}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--vtt-bg-card)',
                        border: '1px solid var(--vtt-border)',
                        borderRadius: '6px',
                        padding: '6px 7px',
                        gap: '5px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                        <strong className="vtt-retro-badge" style={{ color: 'var(--vtt-accent-amber)', fontSize: '12px' }}>
                          {group.count}d{group.sides}
                        </strong>
                        <div style={{ display: 'flex', gap: '3px' }}>
                          <button
                            type="button"
                            onClick={() => handleDecrementDie(group.sides)}
                            style={{
                              width: '21px', height: '21px', borderRadius: '4px', background: 'var(--vtt-btn-bg)',
                              border: '1px solid var(--vtt-btn-border)', color: 'var(--vtt-btn-text)', cursor: 'pointer',
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
                              width: '21px', height: '21px', borderRadius: '4px', background: 'var(--vtt-btn-bg)',
                              border: '1px solid var(--vtt-btn-border)', color: 'var(--vtt-btn-text)', cursor: 'pointer',
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
                              width: '21px', height: '21px', borderRadius: '4px', background: 'var(--vtt-accent-red-bg)',
                              border: '1px solid var(--vtt-danger-border)', color: 'var(--vtt-accent-red)', cursor: 'pointer',
                              padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            title="Quitar este tipo de dado del cubilete"
                          >
                            <X size={11} strokeWidth={2.4} />
                          </button>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '4px',
                        borderTop: '1px solid var(--vtt-border-subtle)',
                        paddingTop: '5px'
                      }}>
                        <span style={{ fontSize: '10px', color: 'var(--vtt-text-muted)', fontWeight: 600 }}>
                          {activeDiceGroups.length === 1 ? 'Modificador:' : 'Mod:'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <button
                            type="button"
                            onClick={() => handleAdjustModifier(group.sides, -1)}
                            style={{
                              width: '21px', height: '21px', borderRadius: '4px', background: 'var(--vtt-btn-bg)',
                              border: '1px solid var(--vtt-btn-border)', color: 'var(--vtt-btn-text)', cursor: 'pointer',
                              padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            title={`Restar 1 al modificador de d${group.sides}`}
                          >
                            <Minus size={11} strokeWidth={2.4} />
                          </button>
                          <span
                            onClick={() => group.modifier !== 0 && handleResetModifier(group.sides)}
                            className="vtt-retro-badge"
                            title={group.modifier !== 0 ? 'Haz clic para restablecer a 0' : `Modificador para d${group.sides}`}
                            style={{
                              minWidth: '24px',
                              textAlign: 'center',
                              fontWeight: 800,
                              fontSize: '11.5px',
                              cursor: group.modifier !== 0 ? 'pointer' : 'default',
                              color: group.modifier > 0
                                ? 'var(--vtt-accent-green-strong)'
                                : group.modifier < 0
                                ? 'var(--vtt-accent-red)'
                                : 'var(--vtt-text-strong)'
                            }}
                          >
                            {group.modifier > 0 ? `+${group.modifier}` : group.modifier}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAdjustModifier(group.sides, 1)}
                            style={{
                              width: '21px', height: '21px', borderRadius: '4px', background: 'var(--vtt-btn-bg)',
                              border: '1px solid var(--vtt-btn-border)', color: 'var(--vtt-btn-text)', cursor: 'pointer',
                              padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            title={`Sumar 1 al modificador de d${group.sides}`}
                          >
                            <Plus size={11} strokeWidth={2.4} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--vtt-text-dim)', fontStyle: 'italic' }}>
                  El cubilete está vacío. Pulsa los dados de arriba para añadirlos.
                </span>
              )}
            </div>

            {/* Opciones de Visibilidad */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsPublicRoll(true)}
                style={{
                  flex: 1, padding: '7px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11.5px', fontWeight: 700,
                  background: isPublicRoll ? 'var(--vtt-accent-green-bg)' : 'var(--vtt-btn-bg)',
                  color: isPublicRoll ? 'var(--vtt-accent-green-strong)' : 'var(--vtt-text-muted)',
                  border: isPublicRoll ? '1px solid var(--vtt-accent-green-border)' : '1px solid var(--vtt-btn-border)'
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
                  background: !isPublicRoll ? 'var(--vtt-accent-red-bg)' : 'var(--vtt-btn-bg)',
                  color: !isPublicRoll ? 'var(--vtt-accent-red)' : 'var(--vtt-text-muted)',
                  border: !isPublicRoll ? '1px solid var(--vtt-danger-border)' : '1px solid var(--vtt-btn-border)'
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
              <div style={{ borderTop: '1px solid var(--vtt-border-subtle)', paddingTop: '8px', maxHeight: '115px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="vtt-context-section-label">Historial</span>
                {history.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', backgroundColor: 'var(--vtt-bg-inset)', border: '1px solid var(--vtt-border-subtle)', padding: '5px 8px', borderRadius: '5px' }}>
                    <span style={{ color: 'var(--vtt-text)', display: 'flex', gap: '5px', alignItems: 'center', minWidth: 0, overflow: 'hidden' }}>
                      <strong>{item.formula}</strong>
                      <span style={{ color: 'var(--vtt-text-dim)', fontSize: '10.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        [{item.groupResults && item.groupResults.length > 1
                          ? item.groupResults.map(g => `${g.count}d${g.sides}:${g.rolls.join('+')}${g.modifier !== 0 ? (g.modifier > 0 ? `+${g.modifier}` : g.modifier) : ''}`).join(', ')
                          : (item.detailedRolls ? item.detailedRolls.map(r => `${r.dieType || 'd' + r.sides}:${r.value}`).join(', ') : item.rolls?.join(', '))}]
                      </span>
                    </span>
                    <strong className="vtt-retro-badge" style={{ color: 'var(--vtt-accent-amber)', flexShrink: 0 }}>= {item.total}</strong>
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
