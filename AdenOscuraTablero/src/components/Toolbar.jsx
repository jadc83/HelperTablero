import React from 'react';

const Toolbar = ({
  onOpenHome,
  onOpenSettings,
  onOpenPlayerView,
  onOpenMasterNotes,
  scenes = [],
  activeSceneId = null,
  onSelectScene,
  isCombatActive = false,
  combatRound = 1,
  activeTurnToken = null,
  onNextTurn = null,
  onEndCombat = null
}) => {
  return (
    <div 
      onPointerDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}
      style={{ display: 'flex', flexDirection: 'row', gap: '14px', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}
    >
      {/* Bloque Izquierdo: Logo (Abre Hub de Inicio) + Selector de Escena */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={onOpenHome}
          className="vtt-brass-btn"
          style={{
            padding: '5px 12px 5px 8px',
            borderRadius: '9px',
            cursor: 'pointer',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            background: 'rgba(24, 28, 38, 0.9)'
          }}
          title="Abrir Hub de Inicio (Campañas, Crónica y Enciclopedia)"
        >
          <div style={{
            width: '28px', height: '28px', borderRadius: '7px',
            background: 'linear-gradient(135deg, #d97706 0%, #78350f 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid #f59e0b', fontSize: '14px'
          }}>
            ⚜️
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginLeft: '3px' }}>
            <span className="vtt-gothic-title" style={{ fontSize: '14px', color: '#f8fafc', fontWeight: 'bold', letterSpacing: '0.04em', lineHeight: 1.1 }}>
              GRIMORIO <span style={{ color: '#f59e0b' }}>VTT</span>
            </span>
            <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>
              Inicio & Crónica
            </span>
          </div>
        </button>

        <div style={{ width: '1px', height: '22px', backgroundColor: '#262d3d' }}></div>

        {/* Selector Rápido de Escenas */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          backgroundColor: '#121620', padding: '4px 10px',
          borderRadius: '8px', border: '1px solid #262e40'
        }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
            Escena:
          </span>
          <select
            value={activeSceneId || ''}
            onChange={(e) => onSelectScene && onSelectScene(e.target.value)}
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: '#f8fafc',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              minWidth: '140px',
              outline: 'none'
            }}
            title="Cambiar de mapa o escena activa"
          >
            {scenes.map((sc) => (
              <option key={sc.id} value={sc.id} style={{ backgroundColor: '#141822', color: '#f8fafc' }}>
                {sc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Indicador Central de Turnos / Modo Combate en la Interfaz */}
      {isCombatActive && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#111520',
          border: '1px solid rgba(245, 158, 11, 0.55)',
          borderRadius: '8px',
          padding: '4px 12px',
          boxShadow: '0 0 14px rgba(245, 158, 11, 0.25)',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
              boxShadow: '0 0 8px #f59e0b'
            }} />
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.04em' }}>
              COMBATE • RONDA {combatRound}
            </span>
          </div>

          {activeTurnToken && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              borderLeft: '1px solid #283042',
              paddingLeft: '10px'
            }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Turno:</span>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: activeTurnToken.color || '#3b82f6',
                border: activeTurnToken.faction === 'enemy' ? '1.5px solid #ef4444' : '1.5px solid #3b82f6',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                flexShrink: 0
              }}>
                {activeTurnToken.avatar ? (
                  <img src={activeTurnToken.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{activeTurnToken.faction === 'enemy' ? '💀' : '🛡️'}</span>
                )}
              </div>
              <span style={{
                fontSize: '12px',
                fontWeight: 700,
                color: activeTurnToken.faction === 'enemy' ? '#fca5a5' : '#93c5fd',
                maxWidth: '130px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }} title={activeTurnToken.name}>
                {activeTurnToken.name}
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                color: activeTurnToken.isGraveWound ? '#fca5a5' : '#6ee7b7',
                background: '#1a2234',
                padding: '1px 6px',
                borderRadius: '4px'
              }} title="Movimiento restante en este turno">
                {activeTurnToken.isGraveWound ? '🩸' : '🏃'} {Math.max(0, (activeTurnToken.isGraveWound ? Math.max(1, Math.floor((activeTurnToken.speed || 6) / 2)) : (activeTurnToken.speed || 6)) - (activeTurnToken.turnMovementUsed || 0))} c.
              </span>
            </div>
          )}

          {onNextTurn && (
            <button
              type="button"
              onClick={onNextTurn}
              className="vtt-primary-cta"
              style={{
                padding: '3px 9px',
                fontSize: '10px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginLeft: '4px'
              }}
              title="Avanzar al siguiente turno"
            >
              ▶ Sig. Turno
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
              ⏹
            </button>
          )}
        </div>
      )}

      {/* Bloque Derecho: Pantalla de Jugadores, Notas del Máster y Ajustes */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={onOpenMasterNotes}
          className="vtt-brass-btn"
          style={{
            padding: '7px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            borderColor: '#f59e0b',
            color: '#fbbf24'
          }}
          title="Abrir Diario y Notas del Máster (Atajo: Tecla N)"
        >
          📜 Notas
        </button>

        <button
          onClick={onOpenPlayerView}
          className="vtt-brass-btn"
          style={{
            padding: '7px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            borderColor: '#059669',
            color: '#6ee7b7'
          }}
          title="Abre la ventana sincronizada en tiempo real para proyectar o llevar a la pantalla de jugadores"
        >
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
          Pantalla Jugadores
        </button>

        <button
          onClick={onOpenSettings}
          className="vtt-brass-btn"
          style={{
            padding: '7px 13px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          title="Abre la configuración: Niebla, Cuadrícula y Proyección"
        >
          ⚙️ Ajustes
        </button>
      </div>
    </div>
  );
};

export default Toolbar;