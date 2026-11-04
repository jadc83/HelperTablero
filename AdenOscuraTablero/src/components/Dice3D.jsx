import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DiceBox from '@3d-dice/dice-box';

const Dice3D = ({ rollReq, resultData = null, onComplete, onRollLanded, isPlayerView = false }) => {
  const diceBoxRef = useRef(null);
  const [result, setResult] = useState(() => resultData || null);
  const containerId = useRef(`dice-canvas-${Math.random().toString(36).substring(2, 9)}`).current;

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const onRollLandedRef = useRef(onRollLanded);
  useEffect(() => {
    onRollLandedRef.current = onRollLanded;
  }, [onRollLanded]);

  useEffect(() => {
    // Si ya recibimos datos de resultado (modo visualización en espejo), no iniciamos el motor 3D
    if (resultData) {
      setResult(resultData);
      // Limpiar de inmediato cualquier lienzo 3D residual huérfano en segundo plano
      document.querySelectorAll('.dice-box-canvas').forEach(canvas => {
        try { canvas.remove(); } catch (e) {}
      });
      return;
    }

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
            try { box.clear(); } catch (e) {}
          }
          return;
        }

        diceBoxRef.current = box;

        const count = Number(rollReq?.diceCount) || 1;
        const sides = Number(rollReq?.diceSides) || 20;
        const cleanDiceNotation = `${count}d${sides}`;

        const res = await box.roll(cleanDiceNotation);
        if (isCancelled) return;

        let rolls = [];
        let diceSum = 0;

        if (Array.isArray(res) && res.length > 0) {
          if (Array.isArray(res[0]?.rolls)) {
            rolls = res[0].rolls.map(r => r.value);
            diceSum = typeof res[0].value === 'number' ? res[0].value : rolls.reduce((acc, v) => acc + v, 0);
          } else {
            rolls = res.map(r => r.value).filter(v => typeof v === 'number');
            diceSum = rolls.reduce((acc, v) => acc + v, 0);
          }
        }

        // Si por alguna razón la física no devuelve tiradas, generamos valores coherentes
        if (rolls.length === 0) {
          rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
          diceSum = rolls.reduce((acc, v) => acc + v, 0);
        }

        const mod = Number(rollReq?.modifier) || 0;
        const total = diceSum + mod;

        const finalObj = {
          id: rollReq?.id || (Date.now() + Math.random()),
          formula: rollReq?.formula || cleanDiceNotation,
          modifier: mod,
          diceSides: sides,
          rolls,
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
          const count = Number(rollReq?.diceCount) || 1;
          const sides = Number(rollReq?.diceSides) || 20;
          const mod = Number(rollReq?.modifier) || 0;
          const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
          const total = rolls.reduce((a, b) => a + b, 0) + mod;
          const fallback = {
            id: rollReq?.id || Date.now(),
            formula: rollReq?.formula || `${count}d${sides}`,
            modifier: mod,
            diceSides: sides,
            rolls,
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
        } catch (e) {}
      }
      document.querySelectorAll('.dice-box-canvas').forEach(c => {
        try { c.remove(); } catch (e) {}
      });
      if (containerEl) {
        containerEl.innerHTML = '';
      }
    };
  }, [rollReq?.id, containerId, resultData]);

  const handleCloseRoll = (finalVal = null) => {
    document.querySelectorAll('.dice-box-canvas').forEach(c => {
      try { c.remove(); } catch (e) {}
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
          <span>🎲 Los dados giran... ({rollReq?.formula})</span>
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
            ✕ Cerrar
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

            <div style={{ fontSize: '15px', color: '#c5a059', marginTop: '6px' }}>
              Dados: [{result.rolls.join(', ')}]
              {result.modifier !== 0 && (
                <span> {result.modifier > 0 ? `+ ${result.modifier}` : `- ${Math.abs(result.modifier)}`}</span>
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
