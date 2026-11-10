import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DiceBox from '@3d-dice/dice-box';
import { Dices, X } from 'lucide-react';

const Dice3D = ({ rollReq, resultData = null, onComplete, onRollLanded }) => {
  const diceBoxRef = useRef(null);
  const [result, setResult] = useState(() => resultData || null);
  const [prevResultData, setPrevResultData] = useState(resultData);
  const rawReactId = useId();
  const containerId = `dice-canvas-${rawReactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  if (resultData !== prevResultData) {
    setPrevResultData(resultData);
    setResult(resultData || null);
  }

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const onRollLandedRef = useRef(onRollLanded);
  useEffect(() => {
    onRollLandedRef.current = onRollLanded;
  }, [onRollLanded]);

  const rollReqRef = useRef(rollReq);
  useEffect(() => {
    rollReqRef.current = rollReq;
  }, [rollReq]);

  useEffect(() => {
    // Si ya recibimos datos de resultado (modo visualización en espejo), no iniciamos el motor 3D
    if (resultData) {
      document.querySelectorAll('.dice-box-canvas').forEach(canvas => {
        try { canvas.remove(); } catch { /* ignore */ }
      });
      return;
    }

    const reqSnapshot = rollReqRef.current;

    const containerEl = document.getElementById(containerId);
    if (!containerEl) return;

    let isCancelled = false;
    containerEl.innerHTML = '';

    const startDiceEngine = async () => {
      try {
        const box = new DiceBox({
          container: `#${containerId}`,
          assetPath: '/assets/dice-box/',
          theme: 'default',
          themeColor: '#d4af37',
          scale: 7,
          spinForce: 5,
          throwForce: 5,
          gravity: 1.8,
          startingHeight: 8
        });

        await box.init();

        if (isCancelled) {
          if (typeof box.clear === 'function') {
            try { box.clear(); } catch { /* ignore */ }
          }
          return;
        }

        diceBoxRef.current = box;

        // Extraer notaciones: soporte para dados mixtos (ej: ['1d6', '1d4']) o dado único ('1d20')
        let notation = reqSnapshot?.diceNotation;
        if (!notation || (Array.isArray(notation) && notation.length === 0)) {
          if (Array.isArray(reqSnapshot?.diceGroups) && reqSnapshot.diceGroups.length > 0) {
            notation = reqSnapshot.diceGroups.map(g => `${g.count}d${g.sides}`);
          } else {
            const count = Number(reqSnapshot?.diceCount) || 1;
            const sides = Number(reqSnapshot?.diceSides) || 20;
            notation = [`${count}d${sides}`];
          }
        }
        const boxNotation = Array.isArray(notation) && notation.length === 1 ? notation[0] : notation;

        const res = await box.roll(boxNotation);
        if (isCancelled) return;

        let rolls = [];
        let detailedRolls = [];
        let diceSum = 0;

        if (Array.isArray(res) && res.length > 0) {
          if (Array.isArray(res[0]?.rolls)) {
            // Resultado devuelto agrupado por grupos
            res.forEach(grp => {
              if (Array.isArray(grp.rolls)) {
                grp.rolls.forEach(r => {
                  if (typeof r.value === 'number') {
                    rolls.push(r.value);
                    const sideVal = r.sides || grp.sides || (r.dieType ? parseInt(r.dieType.replace(/\D/g, ''), 10) : 20);
                    detailedRolls.push({ sides: sideVal, dieType: r.dieType || `d${sideVal}`, value: r.value });
                  }
                });
              }
            });
            diceSum = rolls.reduce((acc, v) => acc + v, 0);
          } else {
            // Resultado devuelto como array plano de dados
            res.forEach(r => {
              if (typeof r.value === 'number') {
                rolls.push(r.value);
                const sideVal = r.sides || (r.dieType ? parseInt(r.dieType.replace(/\D/g, ''), 10) : 20);
                detailedRolls.push({ sides: sideVal, dieType: r.dieType || `d${sideVal}`, value: r.value });
              }
            });
            diceSum = rolls.reduce((acc, v) => acc + v, 0);
          }
        }

        // Si por alguna razón la física no devuelve tiradas, generamos valores coherentes para cada grupo
        if (rolls.length === 0) {
          const groups = Array.isArray(reqSnapshot?.diceGroups) && reqSnapshot.diceGroups.length > 0
            ? reqSnapshot.diceGroups
            : (Array.isArray(notation) ? notation : [notation]).map(n => {
                const m = String(n).match(/(\d+)\s*d\s*(\d+)/i);
                return m ? { count: parseInt(m[1], 10), sides: parseInt(m[2], 10) } : { count: 1, sides: 20 };
              });

          groups.forEach(g => {
            const cnt = g.count || 1;
            const sds = g.sides || 20;
            for (let i = 0; i < cnt; i++) {
              const val = Math.floor(Math.random() * sds) + 1;
              rolls.push(val);
              detailedRolls.push({ sides: sds, dieType: `d${sds}`, value: val });
            }
          });
          diceSum = rolls.reduce((acc, v) => acc + v, 0);
        }

        const mod = Number(reqSnapshot?.modifier) || 0;
        const total = diceSum + mod;

        const finalObj = {
          id: reqSnapshot?.id || (Date.now() + Math.random()),
          formula: reqSnapshot?.formula || (Array.isArray(notation) ? notation.join(' + ') : notation),
          modifier: mod,
          diceSides: reqSnapshot?.diceSides || (detailedRolls[0]?.sides) || 20,
          rolls,
          detailedRolls,
          total,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };

        setResult(finalObj);
        if (onRollLandedRef.current) {
          onRollLandedRef.current(finalObj);
        }
      } catch (err) {
        console.error('Error en el motor 3D:', err);
        if (!isCancelled) {
          const groups = Array.isArray(reqSnapshot?.diceGroups) && reqSnapshot.diceGroups.length > 0
            ? reqSnapshot.diceGroups
            : [{ count: Number(reqSnapshot?.diceCount) || 1, sides: Number(reqSnapshot?.diceSides) || 20 }];

          const rolls = [];
          const detailedRolls = [];
          groups.forEach(g => {
            const cnt = g.count || 1;
            const sds = g.sides || 20;
            for (let i = 0; i < cnt; i++) {
              const val = Math.floor(Math.random() * sds) + 1;
              rolls.push(val);
              detailedRolls.push({ sides: sds, dieType: `d${sds}`, value: val });
            }
          });
          const mod = Number(reqSnapshot?.modifier) || 0;
          const total = rolls.reduce((a, b) => a + b, 0) + mod;
          const fallback = {
            id: reqSnapshot?.id || Date.now(),
            formula: reqSnapshot?.formula || groups.map(g => `${g.count}d${g.sides}`).join(' + '),
            modifier: mod,
            diceSides: groups[0]?.sides || 20,
            rolls,
            detailedRolls,
            total,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          };
          setResult(fallback);
          if (onRollLandedRef.current) {
            onRollLandedRef.current(fallback);
          }
        }
      }
    };

    startDiceEngine();

    return () => {
      isCancelled = true;
      if (diceBoxRef.current) {
        try {
          if (typeof diceBoxRef.current.clear === 'function') diceBoxRef.current.clear();
          if (typeof diceBoxRef.current.hide === 'function') diceBoxRef.current.hide();
        } catch { /* ignore */ }
      }
      document.querySelectorAll('.dice-box-canvas').forEach(c => {
        try { c.remove(); } catch { /* ignore */ }
      });
      if (containerEl) {
        containerEl.innerHTML = '';
      }
    };
  }, [rollReq?.id, containerId, resultData]);

  const handleCloseRoll = (finalVal = null) => {
    document.querySelectorAll('.dice-box-canvas').forEach(c => {
      try { c.remove(); } catch { /* ignore */ }
    });
    if (onCompleteRef.current) {
      onCompleteRef.current(finalVal);
    }
  };

  const isSingle = result?.rolls?.length === 1;
  const v = isSingle ? result.rolls[0] : null;
  const d = result?.diceSides;

  let type = 'normal';
  if (isSingle) {
    if ((d === 100 && v === 1) || (d === 20 && v === 20)) type = 'crit';
    if ((d === 100 && v === 100) || (d === 20 && v === 1)) type = 'fumble';
  }

  // Usamos createPortal para montar siempre directamente en document.body
  // Esto garantiza que el modal y el lienzo 3D estén perfectamente centrados en la ventana,
  // sin verse afectados ni desplazados por barras laterales, paneles o flexboxes.
  return createPortal(
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        pointerEvents: 'auto',
        backgroundColor: result ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      <style>{`
        #${containerId},
        #${containerId} canvas,
        .dice-box-canvas {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          display: block !important;
          pointer-events: none !important;
          z-index: 999998 !important;
        }
        @keyframes vttPulse { from { transform: translateX(-50%) scale(0.98); opacity: 0.85; } to { transform: translateX(-50%) scale(1.02); opacity: 1; } }
        @keyframes vttCritExplosion {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; box-shadow: 0 0 120px rgba(239, 68, 68, 0.95); }
          100% { transform: scale(1); opacity: 1; box-shadow: 0 0 50px rgba(239, 68, 68, 0.6); }
        }
        @keyframes vttFumbleShake {
          0%, 100% { transform: translateX(0); filter: grayscale(1); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-15px) rotate(-4deg); }
          20%, 40%, 60%, 80% { transform: translateX(15px) rotate(4deg); }
        }
        @keyframes vttHoldCharge {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .vtt-firework {
          position: absolute; top: 50%; left: 50%;
          width: 300px; height: 300px; transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(251, 191, 36, 0.8) 10%, transparent 60%);
          opacity: 0; animation: vttFireworkBurst 1s ease-out forwards;
          pointer-events: none;
        }
        .vtt-firework-red {
          background: radial-gradient(circle, rgba(239, 68, 68, 0.8) 10%, transparent 65%);
          animation-delay: 0.2s;
          width: 450px; height: 450px;
        }
        @keyframes vttFireworkBurst {
          0% { transform: translate(-50%, -50%) scale(0.1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }
      `}</style>

      {/* Contenedor del lienzo de dados 3D */}
      {!resultData && <div id={containerId} />}

      {!result ? (
        <div style={{
          position: 'fixed',
          top: '75px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(180deg, rgba(38,24,16,0.96), rgba(18,11,7,0.98))',
          padding: '12px 26px',
          borderRadius: '10px',
          border: '2px solid #d4af37',
          color: '#f3e5ab',
          fontSize: '18px',
          fontWeight: 'bold',
          fontFamily: "'Cinzel', serif",
          textShadow: '0 2px 4px rgba(0,0,0,0.9)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          zIndex: 1000000,
          animation: 'vttPulse 1s infinite alternate'
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Dices size={18} strokeWidth={2.2} /> Los dados giran... ({rollReq?.formula})</span>
          <button
            onClick={() => handleCloseRoll(null)}
            className="vtt-brass-btn"
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '1px solid #8a6d3b'
            }}
            title="Cerrar"
          >
            <X size={13} strokeWidth={2.4} /> Cerrar
          </button>
        </div>
      ) : (
        <div style={{
          position: 'relative',
          zIndex: 1000001,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{
            background: type === 'crit' ? 'linear-gradient(180deg, rgba(69,10,10,0.96), rgba(30,5,5,0.96))' 
                      : type === 'fumble' ? 'linear-gradient(180deg, rgba(15,15,15,0.96), rgba(0,0,0,0.96))' 
                      : 'linear-gradient(180deg, rgba(38,24,16,0.96), rgba(18,11,7,0.96))',
            border: type === 'crit' ? '5px double #ef4444' : type === 'fumble' ? '5px dashed #6b7280' : '4px double #d4af37',
            borderRadius: '16px',
            padding: '36px 70px',
            animation: type === 'crit' ? 'vttCritExplosion 0.8s ease-out' : type === 'fumble' ? 'vttFumbleShake 0.7s ease-out' : 'vttHoldCharge 0.4s ease-out',
            textAlign: 'center',
            position: 'relative',
            boxShadow: '0 25px 70px rgba(0,0,0,0.95), 0 0 35px rgba(212, 175, 55, 0.3)'
          }}>
            {type === 'crit' && <div className="vtt-firework" />}
            {type === 'crit' && <div className="vtt-firework vtt-firework-red" />}

            <div className="vtt-gothic-title" style={{ fontSize: '22px', color: type === 'crit' ? '#fca5a5' : type === 'fumble' ? '#9ca3af' : '#d4af37', fontWeight: 'bold' }}>
              {type === 'crit' ? `¡EL DESTINO HA HABLADO! (${result.formula})` 
             : type === 'fumble' ? `LA TRAGEDIA AZOTA... (${result.formula})` 
             : `El Destino ha hablado: ${result.formula}`}
            </div>

            {type === 'crit' && <div className="vtt-gothic-title" style={{ fontSize: '52px', color: '#ef4444', textShadow: '0 0 25px #ef4444, 0 0 10px #fbbf24', marginTop: '8px' }}>¡CRÍTICO!</div>}
            {type === 'fumble' && <div className="vtt-gothic-title" style={{ fontSize: '52px', color: '#991b1b', textShadow: '0 0 15px #ef4444', marginTop: '8px' }}>¡PIFIA!</div>}

            <div className="vtt-gothic-title" style={{
              fontSize: type !== 'normal' ? '110px' : '96px',
              fontWeight: '900',
              lineHeight: '1.15',
              color: type === 'crit' ? '#fbbf24' : type === 'fumble' ? '#ef4444' : '#fffbeb',
              marginTop: '8px'
            }}>
              {result.total}
            </div>

            <div style={{
              fontSize: '15px',
              color: '#c5a059',
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '6px'
            }}>
              <span>Dados:</span>
              {result.detailedRolls && result.detailedRolls.length > 0 && new Set(result.detailedRolls.map(r => r.dieType || `d${r.sides}`)).size > 1 ? (
                <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {result.detailedRolls.map((r, i) => (
                    <span key={i} style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid #8a6d3b',
                      borderRadius: '4px',
                      padding: '2px 7px',
                      fontSize: '13px'
                    }}>
                      <strong style={{ color: '#fbbf24' }}>{r.dieType || `d${r.sides}`}:</strong> {r.value}
                    </span>
                  ))}
                </div>
              ) : (
                <span>[{result.rolls.join(', ')}]</span>
              )}
              {result.modifier !== 0 && (
                <span style={{ color: result.modifier > 0 ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                  {result.modifier > 0 ? `+ ${result.modifier}` : `- ${Math.abs(result.modifier)}`}
                </span>
              )}
            </div>

            <button
              onClick={() => handleCloseRoll(result)}
              className="vtt-brass-btn"
              style={{
                marginTop: '28px',
                padding: '12px 34px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                border: '2px solid #d4af37',
                background: 'linear-gradient(180deg, #b45309 0%, #78350f 100%)',
                color: '#fffbeb',
                boxShadow: '0 4px 15px rgba(0,0,0,0.8)'
              }}
            >
              Cerrar Tirada
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default Dice3D;
