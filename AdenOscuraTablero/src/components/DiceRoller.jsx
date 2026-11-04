import React, { useState, useEffect } from 'react';

const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100];

const DiceRoller = ({ isOpen, onClose, onPublicRoll, onHiddenRoll, incomingResult }) => {
  const [diceCount, setDiceCount] = useState(1);
  const [diceSides, setDiceSides] = useState(20);
  const [modifier, setModifier] = useState(0);
  const [history, setHistory] = useState([]);
  const [screenRoll, setScreenRoll] = useState(null);
  const [isPublicRoll, setIsPublicRoll] = useState(true);

  // Escuchamos los resultados que nos devuelve la Pantalla de Jugadores tras tirar
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

  const handleRoll = () => {
    const count = Number(diceCount) || 1;
    const sides = Number(diceSides) || 20;
    const mod = Number(modifier) || 0;

    const rollReq = {
      id: Date.now() + Math.random(),
      diceCount: count,
      diceSides: sides,
      modifier: mod,
      formula: `${count}d${sides}${mod > 0 ? '+' + mod : mod < 0 ? mod : ''}`,
      isPublic: isPublicRoll
    };

    if (isPublicRoll && onPublicRoll) {
      onPublicRoll(rollReq);
    } else if (!isPublicRoll && onHiddenRoll) {
      onHiddenRoll(rollReq);
    }
  };

  const currentModText = modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : '';
  const currentFormula = `${diceCount}d${diceSides}${currentModText}`;

  return (
    <>
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
              color: (screenRoll.rolls.length === 1 && screenRoll.diceSides === 20 && screenRoll.rolls[0] === 20)
                ? '#4ade80'
                : (screenRoll.rolls.length === 1 && screenRoll.diceSides === 20 && screenRoll.rolls[0] === 1)
                ? '#f87171'
                : '#fffbeb'
            }}
          >
            {screenRoll.total}
          </div>
          <div style={{ fontSize: '14px', color: '#c5a059', marginTop: '2px' }}>
            Dados: [{screenRoll.rolls.join(', ')}]
            {screenRoll.modifier !== 0 && (
              <span> {screenRoll.modifier > 0 ? `+ ${screenRoll.modifier}` : `- ${Math.abs(screenRoll.modifier)}`}</span>
            )}
          </div>
        </div>
      )}

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
              width: '310px',
              borderRadius: '10px',
              padding: '16px',
              border: '2px solid #8a6d3b',
              color: '#e6d5b8',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: '0 12px 35px rgba(0,0,0,0.9)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #6b4c2b', paddingBottom: '8px' }}>
              <span className="vtt-gothic-title" style={{ fontWeight: 'bold', fontSize: '14px', color: '#d4af37' }}>🎲 Cubilete del Destino</span>
              <button
                onClick={onClose}
                style={{ background: 'transparent', border: 'none', color: '#c5a059', cursor: 'pointer', fontSize: '16px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#e6d5b8' }}>Cantidad de dados:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => setDiceCount(Math.max(1, diceCount - 1))} className="vtt-brass-btn" style={{ width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                <span className="vtt-gothic-title" style={{ width: '28px', textAlign: 'center', fontWeight: 'bold', fontSize: '15px', color: '#f3e5ab' }}>{diceCount}</span>
                <button onClick={() => setDiceCount(Math.min(30, diceCount + 1))} className="vtt-brass-btn" style={{ width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '14px', color: '#e6d5b8', display: 'block', marginBottom: '6px' }}>Poliedro:</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {DICE_TYPES.map(sides => (
                  <button
                    key={sides} onClick={() => setDiceSides(sides)} className="vtt-gothic-title"
                    style={{
                      padding: '6px 4px', borderRadius: '6px', border: diceSides === sides ? '1px solid #fbbf24' : '1px solid #6b4c2b',
                      background: diceSides === sides ? 'linear-gradient(180deg, #b45309 0%, #78350f 100%)' : '#120b07',
                      color: '#f3e5ab', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                    }}
                  >
                    d{sides}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#e6d5b8' }}>Modificador:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button onClick={() => setModifier(modifier - 1)} className="vtt-brass-btn" style={{ width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                <span className="vtt-gothic-title" style={{ minWidth: '36px', textAlign: 'center', fontWeight: 'bold', fontSize: '15px', color: modifier > 0 ? '#4ade80' : modifier < 0 ? '#f87171' : '#f3e5ab' }}>
                  {modifier > 0 ? `+${modifier}` : modifier}
                </span>
                <button onClick={() => setModifier(modifier + 1)} className="vtt-brass-btn" style={{ width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', margin: '4px 0' }}>
              <button
                onClick={() => setIsPublicRoll(true)}
                style={{
                  flex: 1, padding: '6px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
                  background: isPublicRoll ? '#166534' : '#1c120c', color: isPublicRoll ? '#dcfce7' : '#b89f7d',
                  border: isPublicRoll ? '1px solid #4ade80' : '1px solid #5c4028'
                }}
              >
                👁️ Público (3D)
              </button>
              <button
                onClick={() => setIsPublicRoll(false)}
                style={{
                  flex: 1, padding: '6px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold',
                  background: !isPublicRoll ? '#7f1d1d' : '#1c120c', color: !isPublicRoll ? '#fecaca' : '#b89f7d',
                  border: !isPublicRoll ? '1px solid #f87171' : '1px solid #5c4028'
                }}
              >
                👻 Oculto (Local)
              </button>
            </div>

            <button
              onClick={handleRoll}
              className="vtt-gothic-title"
              style={{
                padding: '10px', borderRadius: '6px', border: '1px solid #fbbf24',
                background: 'linear-gradient(180deg, #b45309 0%, #78350f 100%)',
                color: '#fffbeb', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.7)', transition: 'transform 0.1s'
              }}
            >
              🎲 Lanzar dados ({currentFormula})
            </button>

            {history.length > 0 && (
              <div style={{ borderTop: '1px solid #6b4c2b', paddingTop: '8px', maxHeight: '110px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span className="vtt-gothic-title" style={{ fontSize: '10px', color: '#c5a059' }}>Historial</span>
                {history.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', backgroundColor: '#120b07', border: '1px solid #4a331d', padding: '4px 8px', borderRadius: '4px' }}>
                    <span style={{ color: '#e6d5b8' }}>{item.formula} <span style={{ color: '#8a6d3b' }}>[{item.rolls.join(',')}]</span></span>
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