import React from 'react';

const Toolbar = ({
  onOpenHome,
  onOpenSettings,
  onOpenTutorial,
  onOpenPlayerView,
  onOpenHandouts,
  handoutsCount = 0,
  hasActiveHandout = false,
  onOpenMasterNotes,
  scenes = [],
  activeSceneId = null,
  onSelectScene,
  onOpenGraveyard,
  graveyardCount = 0,
  isCombatActive = false,
  combatRound = 1,
  activeTurnToken = null,
  onNextTurn = null,
  onEndCombat = null
}) => {
  return (
    <div 
      onPointerDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '14px',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'space-between',
        userSelect: 'none'
      }}
    >
      {/* Bloque Izquierdo: Identidad + Selector de Escena */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onOpenHome}
          className="vtt-brass-btn"
          style={{
            padding: '4px 10px 4px 6px',
            borderRadius: '7px',
            cursor: 'pointer',
            border: '1px solid #2f384c',
            background: '#131722',
            gap: '8px'
          }}
          title="Abrir Hub de Inicio (Campañas, Crónica y Enciclopedia)"
        >
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '5px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(180, 83, 9, 0.5) 100%)',
            backgroundColor: '#2a1a08',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px solid #f59e0b',
            fontSize: '13px',
            color: '#fbbf24',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)'
          }}>
            ⚜
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span className="vtt-gothic-title" style={{ fontSize: '13px', color: '#f8fafc', fontWeight: 800, letterSpacing: '0.05em', lineHeight: 1.1 }}>
              GRIMORIO <span style={{ color: '#f59e0b', fontWeight: 700 }}>VTT</span>
            </span>
            <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.02em' }}>
              Inicio &amp; Crónica
            </span>
          </div>
        </button>

        <div style={{ width: '1px', height: '20px', backgroundColor: '#222938' }}></div>

        {/* Selector Rápido de Escenas */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#121622',
          padding: '3px 8px',
          borderRadius: '6px',
          border: '1px solid #262e40'
        }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Escena
          </span>
          <select
            value={activeSceneId || ''}
            onChange={(e) => onSelectScene && onSelectScene(e.target.value)}
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              color: '#f1f5f9',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              minWidth: '130px',
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

        {/* Botón Cripta trasladado justo después del selector de escena */}
        {onOpenGraveyard && (
          <button
            type="button"
            onClick={onOpenGraveyard}
            className="vtt-brass-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 9px',
              fontSize: '11px',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#cbd5e1',
              backgroundColor: '#121622',
              border: '1px solid #262e40',
              fontWeight: 600,
              height: '26px'
            }}
            title="Abrir Cripta y Cementerio de Caídos"
          >
            <span style={{ fontSize: '13px' }}>⚰️</span>
            <span>Cripta</span>
            {graveyardCount > 0 && (
              <span style={{
                backgroundColor: '#dc2626',
                color: '#fff',
                borderRadius: '8px',
                padding: '0 5px',
                fontSize: '9px',
                fontWeight: 700
              }}>
                {graveyardCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Indicador Central de Turnos / Modo Combate */}
      {isCombatActive && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#10141f',
          border: '1px solid rgba(245, 158, 11, 0.45)',
          borderRadius: '7px',
          padding: '4px 10px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              display: 'inline-block',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
              boxShadow: '0 0 6px #f59e0b'
            }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.04em' }}>
              RONDA {combatRound}
            </span>
          </div>

          {activeTurnToken && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              borderLeft: '1px solid #232b3c',
              paddingLeft: '10px'
            }}>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Turno:</span>
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
                  <span style={{ fontSize: '10px', fontWeight: 800, color: activeTurnToken.faction === 'enemy' ? '#fca5a5' : '#93c5fd' }}>
                    {(activeTurnToken.name || '?').charAt(0).toUpperCase()}
                  </span>
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
                background: '#182030',
                border: '1px solid #26334d',
                padding: '1px 6px',
                borderRadius: '4px'
              }} title="Movimiento restante en este turno">
                {Math.max(0, (activeTurnToken.isGraveWound ? Math.max(1, Math.floor((activeTurnToken.speed || 6) / 2)) : (activeTurnToken.speed || 6)) - (activeTurnToken.turnMovementUsed || 0))} c.
              </span>
            </div>
          )}

          {onNextTurn && (
            <button
              type="button"
              onClick={onNextTurn}
              className="vtt-primary-cta"
              style={{
                padding: '2px 8px',
                fontSize: '10px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginLeft: '3px'
              }}
              title="Avanzar al siguiente turno"
            >
              Sig. Turno →
            </button>
          )}

          {onEndCombat && (
            <button
              type="button"
              onClick={onEndCombat}
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                padding: '2px 6px',
                fontSize: '10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 700
              }}
              title="Finalizar el combate"
            >
              Terminar
            </button>
          )}
        </div>
      )}

      {/* Bloque Derecho: Acciones Globales */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={onOpenMasterNotes}
          className="vtt-brass-btn"
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            borderColor: '#f59e0b',
            color: '#fbbf24'
          }}
          title="Abrir Diario y Notas del Máster (Atajo: Tecla N)"
        >
          Notas
        </button>

        <button
          onClick={onOpenPlayerView}
          className="vtt-brass-btn"
          style={{
            padding: '6px 13px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            borderColor: '#059669',
            color: '#6ee7b7',
            gap: '7px'
          }}
          title="Abre la ventana sincronizada en tiempo real para proyectar o llevar a la pantalla de jugadores"
        >
          <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 5px #10b981' }}></span>
          Pantalla Jugadores
        </button>

        <button
          onClick={onOpenHandouts}
          className="vtt-brass-btn"
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            borderColor: hasActiveHandout ? '#10b981' : '#38bdf8',
            color: hasActiveHandout ? '#86efac' : '#bae6fd',
            gap: '6px'
          }}
          title="Abrir Proyector de Ilustraciones y Pistas para la Pantalla de Jugadores"
        >
          <span style={{
            display: 'inline-block',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: hasActiveHandout ? '#10b981' : '#38bdf8',
            boxShadow: hasActiveHandout ? '0 0 6px #10b981' : '0 0 4px #38bdf8'
          }} />
          Proyector {handoutsCount > 0 ? `(${handoutsCount})` : ''}
        </button>

        <button
          onClick={onOpenSettings}
          className="vtt-brass-btn"
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          title="Abre el Centro de Mando: Escenas, Niebla, Estados y Decorado"
        >
          Ajustes
        </button>

        <button
          onClick={onOpenTutorial}
          className="vtt-brass-btn"
          style={{
            padding: '6px 11px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            color: '#fbbf24',
            borderColor: 'rgba(212, 175, 55, 0.45)',
            gap: '5px'
          }}
          title="Guía rápida y tutorial del Grimorio VTT"
        >
          <span style={{ fontSize: '11px' }}>❓</span>
          Ayuda
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
