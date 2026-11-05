import React, { useState, useEffect } from 'react';

const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100];

// Parser para fórmulas combinadas como "1d6 + 1d4 + 2", "2d8 - 3", etc.
export const parseDiceFormula = (formulaStr) => {
  if (!formulaStr || typeof formulaStr !== 'string') {
    return { diceGroups: [{ count: 1, sides: 20 }], modifier: 0 };
  }

  const s = formulaStr.trim();
  const diceRegex = /([+-]?\s*\d*)\s*d\s*(\d+)/gi;
  let match;
  const diceMap = {};

  while ((match = diceRegex.exec(s)) !== null) {
    let signOrQty = match[1].replace(/\s+/g, '');
    let qty = 1;
    if (signOrQty === '' || signOrQty === '+') qty = 1;
    else if (signOrQty === '-') qty = -1;
    else qty = parseInt(signOrQty, 10);

    const sides = parseInt(match[2], 10);
    if (qty > 0 && sides > 0) {
      diceMap[sides] = (diceMap[sides] || 0) + qty;
    }
  }

  // Extraer modificadores constantes (+3, -2) que no van pegados a una 'd'
  const withoutDice = s.replace(/([+-]?\s*\d*)\s*d\s*(\d+)/gi, '');
  const modRegex = /([+-]?\s*\d+)/g;
  let modifier = 0;
  let modMatch;
  while ((modMatch = modRegex.exec(withoutDice)) !== null) {
    const val = parseInt(modMatch[1].replace(/\s+/g, ''), 10);
    if (!isNaN(val)) modifier += val;
  }

  const diceGroups = Object.entries(diceMap)
    .filter(([_, count]) => count > 0)
    .map(([sides, count]) => ({ count, sides: parseInt(sides, 10) }))
    .sort((a, b) => b.sides - a.sides);

  return {
    diceGroups: diceGroups.length > 0 ? diceGroups : [{ count: 1, sides: 20 }],
    modifier
  };
};

const DiceRoller = ({ isOpen, onClose, onPublicRoll, onHiddenRoll, incomingResult }) => {
  // Pool de dados: mapa de caras => cantidad { 4: 0, 6: 1, 8: 0, ... }
  const [dicePool, setDicePool] = useState({ 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 1, 100: 0 });
  const [modifier, setModifier] = useState(0);
  const [history, setHistory] = useState([]);
  const [screenRoll, setScreenRoll] = useState(null);
  const [isPublicRoll, setIsPublicRoll] = useState(true);

  // Escuchamos los resultados devueltos por la Pantalla de Jugadores o local tras tirar
  useEffect(() => {
    if (incomingResult) {
      setScreenRoll(incomingResult);
      setHistory(prev => [incomingResult, ...prev.slice(0, 9)]);
    }
  }, [incomingResult]);

  useEffect(() => {
    if (!screenRoll) return;
    const timer = setTimeout(() => {
      setScreenRoll(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [screenRoll]);

  // Añadir un dado al pool actual
  const handleAddDie = (sides) => {
    setDicePool(prev => ({
      ...prev,
      [sides]: Math.min(30, (prev[sides] || 0) + 1)
    }));
  };

  // Decrementar un dado del pool
  const handleDecrementDie = (sides) => {
    setDicePool(prev => {
      const nextCount = Math.max(0, (prev[sides] || 0) - 1);
      return { ...prev, [sides]: nextCount };
    });
  };

  // Eliminar completamente un tipo de dado del pool
  const handleRemoveDieType = (sides) => {
    setDicePool(prev => ({
      ...prev,
      [sides]: 0
    }));
  };

  // Vaciar completamente el pool
  const handleClearPool = () => {
    setDicePool({ 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0, 100: 0 });
    setModifier(0);
  };

  // Grupos activos de dados seleccionados
  const activeDiceGroups = DICE_TYPES
    .filter(sides => (dicePool[sides] || 0) > 0)
    .map(sides => ({ count: dicePool[sides], sides }));

  const totalDiceCount = activeDiceGroups.reduce((acc, g) => acc + g.count, 0);

  // Construir la fórmula visible (ej: "1d6 + 1d4 + 2")
  const diceFormulaStr = activeDiceGroups.map(g => `${g.count}d${g.sides}`).join(' + ');
  const modStr = modifier > 0 ? ` + ${modifier}` : modifier < 0 ? ` - ${Math.abs(modifier)}` : '';
  const currentFormula = totalDiceCount > 0 ? (diceFormulaStr + modStr) : (modifier !== 0 ? `${modifier}` : '0 dados');

  const handleRoll = () => {
    if (activeDiceGroups.length === 0) return;

    const diceNotation = activeDiceGroups.map(g => `${g.count}d${g.sides}`);
    const rollReq = {
      id: Date.now() + Math.random(),
      formula: currentFormula,
      diceNotation,
      diceGroups: activeDiceGroups,
      totalDiceCount,
      modifier,
      isPublic: isPublicRoll,
      // Retrocompatibilidad con componentes que lean un solo dado
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
            background: 'linear-gradient(180deg, rgba(38, 24, 16, 0.98) 0%, rgba(18, 11, 7, 0.98) 100%)',
            border: '3px double #d4af37',
            borderRadius: '10px',
            padding: '18px 34px',
            color: '#f3e5ab',
            zIndex: 99999,
            boxShadow: '0 20px 45px rgba(0,0,0,0.95), 0 0 25px rgba(212, 175, 55, 0.35)',
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
          <div className="vtt-gothic-title" style={{ fontSize: '13px', color: '#d4af37', fontWeight: 'bold' }}>
            ⚜️ Destino: {screenRoll.formula}
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
                : '#fffbeb'
            }}
          >
            {screenRoll.total}
          </div>
          <div style={{ fontSize: '14px', color: '#c5a059', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span>Dados:</span>
            {screenRoll.detailedRolls && screenRoll.detailedRolls.length > 0 ? (
              screenRoll.detailedRolls.map((r, i) => (
                <span key={i} style={{ background: '#1c120c', border: '1px solid #8a6d3b', padding: '1px 5px', borderRadius: '4px', fontSize: '12px' }}>
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
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: '65px',
            right: '110px',
            zIndex: 5000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end'
          }}
        >
          <div
            className="vtt-wood-panel"
            style={{
              width: '330px',
              borderRadius: '10px',
              padding: '16px',
              border: '2px solid #8a6d3b',
              color: '#e6d5b8',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 12px 35px rgba(0,0,0,0.9)'
            }}
          >
            {/* Cabecera */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #6b4c2b', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>🎲</span>
                <span className="vtt-gothic-title" style={{ fontWeight: 'bold', fontSize: '14px', color: '#d4af37' }}>
                  Cubilete del Destino
                </span>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'transparent', border: 'none', color: '#c5a059', cursor: 'pointer', fontSize: '16px' }}
                title="Cerrar panel"
              >
                ✕
              </button>
            </div>

            {/* Botonera de Dados (Añadir a la reserva) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <span style={{ fontSize: '11px', color: '#a89078', fontWeight: 600 }}>Añadir dados al cubilete:</span>
                <button
                  onClick={handleClearPool}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f87171',
                    fontSize: '10px',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                  title="Vaciar todos los dados"
                >
                  ↺ Vaciar
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {DICE_TYPES.map(sides => {
                  const qty = dicePool[sides] || 0;
                  const isSelected = qty > 0;
                  return (
                    <button
                      key={sides}
                      onClick={() => handleAddDie(sides)}
                      className="vtt-gothic-title"
                      style={{
                        padding: '7px 4px',
                        borderRadius: '6px',
                        border: isSelected ? '1px solid #fbbf24' : '1px solid #5c4028',
                        background: isSelected ? 'linear-gradient(180deg, #b45309 0%, #78350f 100%)' : '#140c08',
                        color: isSelected ? '#fffbeb' : '#d5c4a1',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        position: 'relative'
                      }}
                      title={`Haz clic para añadir 1d${sides} al cubilete`}
                    >
                      <span>+ d{sides}</span>
                      {isSelected && (
                        <span style={{
                          background: '#fbbf24',
                          color: '#120b07',
                          borderRadius: '999px',
                          padding: '1px 4px',
                          fontSize: '9px',
                          fontWeight: 900,
                          lineHeight: 1
                        }}>
                          {qty}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reserva de Dados Seleccionados (Chips interactivos con - / + / ✕) */}
            <div style={{
              background: '#120b07',
              border: '1px solid #4a331d',
              borderRadius: '7px',
              padding: '8px 10px',
              minHeight: '44px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#c5a059', fontWeight: 700, textTransform: 'uppercase' }}>
                  Cubilete actual:
                </span>
                <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 800 }}>
                  {totalDiceCount} {totalDiceCount === 1 ? 'dado' : 'dados'}
                </span>
              </div>

              {activeDiceGroups.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  {activeDiceGroups.map((group, idx) => (
                    <React.Fragment key={group.sides}>
                      {idx > 0 && <span style={{ color: '#8a6d3b', fontWeight: 'bold', fontSize: '12px' }}>+</span>}
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: 'linear-gradient(180deg, #2d1a0e 0%, #1e1109 100%)',
                        border: '1px solid #b45309',
                        borderRadius: '5px',
                        padding: '2px 4px',
                        gap: '4px'
                      }}>
                        <strong style={{ color: '#fbbf24', fontSize: '12px' }}>
                          {group.count}d{group.sides}
                        </strong>
                        <div style={{ display: 'flex', gap: '1px', marginLeft: '2px' }}>
                          <button
                            type="button"
                            onClick={() => handleDecrementDie(group.sides)}
                            style={{
                              width: '16px', height: '16px', borderRadius: '3px', background: '#3b2514',
                              border: '1px solid #6b4c2b', color: '#e6d5b8', cursor: 'pointer', fontSize: '10px',
                              lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            title="Restar 1 dado de este tipo"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddDie(group.sides)}
                            style={{
                              width: '16px', height: '16px', borderRadius: '3px', background: '#3b2514',
                              border: '1px solid #6b4c2b', color: '#e6d5b8', cursor: 'pointer', fontSize: '10px',
                              lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            title="Añadir 1 dado más de este tipo"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDieType(group.sides)}
                            style={{
                              width: '16px', height: '16px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid #ef4444', color: '#fca5a5', cursor: 'pointer', fontSize: '9px',
                              lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              marginLeft: '2px'
                            }}
                            title="Quitar este tipo de dado del cubilete"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                  {modifier !== 0 && (
                    <span style={{
                      color: modifier > 0 ? '#4ade80' : '#f87171',
                      fontWeight: 800,
                      fontSize: '12px',
                      background: '#1c120c',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid #4a331d'
                    }}>
                      {modifier > 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`}
                    </span>
                  )}
                </div>
              ) : (
                <span style={{ fontSize: '11px', color: '#78624f', fontStyle: 'italic' }}>
                  El cubilete está vacío. Pulsa los dados de arriba para añadirlos.
                </span>
              )}
            </div>

            {/* Modificador numérico */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#e6d5b8' }}>Modificador numérico:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => setModifier(modifier - 1)}
                  className="vtt-brass-btn"
                  style={{ width: '26px', height: '26px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  -
                </button>
                <span
                  className="vtt-gothic-title"
                  style={{
                    minWidth: '38px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    color: modifier > 0 ? '#4ade80' : modifier < 0 ? '#f87171' : '#f3e5ab'
                  }}
                >
                  {modifier > 0 ? `+${modifier}` : modifier}
                </span>
                <button
                  onClick={() => setModifier(modifier + 1)}
                  className="vtt-brass-btn"
                  style={{ width: '26px', height: '26px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  +
                </button>
                {modifier !== 0 && (
                  <button
                    onClick={() => setModifier(0)}
                    style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '11px', cursor: 'pointer', marginLeft: '2px' }}
                    title="Restablecer a 0"
                  >
                    ↺
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
                  flex: 1, padding: '6px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
                  background: isPublicRoll ? '#166534' : '#1c120c', color: isPublicRoll ? '#dcfce7' : '#b89f7d',
                  border: isPublicRoll ? '1px solid #4ade80' : '1px solid #5c4028'
                }}
                title="Lanzamiento visible para todos los jugadores en la Pantalla 3D"
              >
                👁️ Público (3D)
              </button>
              <button
                type="button"
                onClick={() => setIsPublicRoll(false)}
                style={{
                  flex: 1, padding: '6px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
                  background: !isPublicRoll ? '#7f1d1d' : '#1c120c', color: !isPublicRoll ? '#fecaca' : '#b89f7d',
                  border: !isPublicRoll ? '1px solid #f87171' : '1px solid #5c4028'
                }}
                title="Tirada oculta: solo el Máster ve el resultado en su pantalla"
              >
                👻 Oculto (Local)
              </button>
            </div>

            {/* Botón Principal de Lanzamiento */}
            <button
              onClick={handleRoll}
              disabled={totalDiceCount === 0}
              className="vtt-gothic-title"
              style={{
                padding: '11px',
                borderRadius: '7px',
                border: totalDiceCount > 0 ? '1px solid #fbbf24' : '1px solid #5c4028',
                background: totalDiceCount > 0 ? 'linear-gradient(180deg, #b45309 0%, #78350f 100%)' : '#261a12',
                color: totalDiceCount > 0 ? '#fffbeb' : '#78624f',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: totalDiceCount > 0 ? 'pointer' : 'not-allowed',
                boxShadow: totalDiceCount > 0 ? '0 4px 14px rgba(0,0,0,0.7)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Lanzar dados ({currentFormula})
            </button>

            {/* Historial */}
            {history.length > 0 && (
              <div style={{ borderTop: '1px solid #6b4c2b', paddingTop: '8px', maxHeight: '110px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="vtt-gothic-title" style={{ fontSize: '10px', color: '#c5a059', textTransform: 'uppercase' }}>Historial</span>
                {history.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', backgroundColor: '#120b07', border: '1px solid #4a331d', padding: '4px 8px', borderRadius: '4px' }}>
                    <span style={{ color: '#e6d5b8', display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <strong>{item.formula}</strong>
                      <span style={{ color: '#a89078', fontSize: '11px' }}>
                        [{item.detailedRolls ? item.detailedRolls.map(r => `${r.dieType || 'd' + r.sides}:${r.value}`).join(', ') : item.rolls?.join(', ')}]
                      </span>
                    </span>
                    <strong style={{ color: '#fbbf24' }}>= {item.total}</strong>
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
