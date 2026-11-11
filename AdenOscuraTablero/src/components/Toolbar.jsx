import {
  Map,
  SkipForward,
  Monitor,
  Projector,
  Compass,
  Settings,
  HelpCircle
} from 'lucide-react';

const Toolbar = ({
  onOpenHome,
  onOpenSettings,
  isSettingsOpen = false,
  onOpenAppSettings,
  onOpenTutorial,
  onOpenPlayerView,
  onOpenHandouts,
  handoutsCount = 0,
  hasActiveHandout = false,
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
      <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onOpenHome}
          className="vtt-brass-btn"
          style={{
            padding: '4px 10px 4px 6px',
            borderRadius: '7px',
            cursor: 'pointer',
            border: '1px solid var(--vtt-border)',
            background: 'var(--vtt-btn-bg)',
            gap: '8px'
          }}
          title="Abrir Hub de Inicio (Campañas, Crónica y Enciclopedia)"
        >
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: '#0b0e14',
            border: '1.5px solid var(--vtt-gold)',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
            flexShrink: 0
          }}>
            <img
              src="/assets/textures/grimorio_emblem_logo.jpg"
              alt="Grimorio VTT"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span className="vtt-gothic-title" style={{ fontSize: '13px', color: 'var(--vtt-text-strong)', fontWeight: 800, letterSpacing: '0.05em', lineHeight: 1.1 }}>
              GRIMORIO <span style={{ color: 'var(--vtt-gold)', fontWeight: 700 }}>VTT</span>
            </span>
            <span style={{ fontSize: '9px', color: 'var(--vtt-text-muted)', fontWeight: 500, letterSpacing: '0.02em' }}>
              Inicio &amp; Crónica
            </span>
          </div>
        </button>

        <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--vtt-border-subtle)' }}></div>

        {/* Selector Rápido de Escenas */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'var(--vtt-bg-inset)',
          padding: '3px 8px',
          borderRadius: '6px',
          border: '1px solid var(--vtt-border)'
        }}>
          <Map size={13} strokeWidth={2.2} style={{ color: 'var(--vtt-text-muted)' }} />
          <span style={{ fontSize: '11px', color: 'var(--vtt-text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Escena
          </span>
          <select
            value={activeSceneId || ''}
            onChange={(e) => onSelectScene && onSelectScene(e.target.value)}
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              color: 'var(--vtt-text-strong)',
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
              <option key={sc.id} value={sc.id} style={{ backgroundColor: 'var(--vtt-bg-panel)', color: 'var(--vtt-text-strong)' }}>
                {sc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bloque Central: Mesa de Juego, Proyección y Combate */}
      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <button
          onClick={onOpenPlayerView}
          className="vtt-brass-btn"
          style={{
            height: '32px',
            padding: '0 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            borderColor: 'var(--vtt-accent-green-border)',
            color: 'var(--vtt-accent-green)',
            boxSizing: 'border-box'
          }}
          title="Pantalla Jugadores: abre la ventana sincronizada en tiempo real para proyectar o llevar a la pantalla de jugadores"
          aria-label="Pantalla Jugadores"
        >
          <Monitor size={18} strokeWidth={2.1} />
        </button>

        <button
          onClick={onOpenHandouts}
          className="vtt-brass-btn"
          style={{
            height: '32px',
            padding: '0 10px',
            borderRadius: '6px',
            cursor: 'pointer',
            borderColor: hasActiveHandout ? 'var(--vtt-accent-green-border)' : 'var(--vtt-accent-sky-border)',
            color: hasActiveHandout ? 'var(--vtt-accent-green)' : 'var(--vtt-accent-sky-soft)',
            boxSizing: 'border-box'
          }}
          title={`Proyector de Ilustraciones y Pistas${handoutsCount > 0 ? ` (${handoutsCount})` : ''}`}
          aria-label="Proyector"
        >
          <Projector size={18} strokeWidth={2.1} />
        </button>

        <button
          onClick={onOpenSettings}
          className={`vtt-primary-cta ${isSettingsOpen ? 'vtt-btn-active' : ''}`}
          style={{
            height: '32px',
            padding: '0 14px',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            gap: '7px',
            boxSizing: 'border-box'
          }}
          title="Abre el Centro de Mando: Escenas, Pistas, Estados y Objetos"
        >
          <Compass size={15} strokeWidth={2.2} style={{ color: 'currentColor' }} />
          <span className="vtt-gothic-title" style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '0.06em' }}>
            Centro de mando
          </span>
        </button>

        {/* Indicador Central de Turnos / Modo Combate */}
        {isCombatActive && (
          <>
            <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--vtt-border-subtle)', margin: '0 2px' }}></div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'var(--vtt-bg-panel)',
              border: '1px solid var(--vtt-accent-amber-border)',
              borderRadius: '7px',
              padding: '4px 10px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)'
            }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              display: 'inline-block',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: 'var(--vtt-gold)',
              boxShadow: '0 0 6px var(--vtt-gold)'
            }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--vtt-accent-amber)', letterSpacing: '0.04em' }}>
              RONDA {combatRound}
            </span>
          </div>

          {activeTurnToken && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              borderLeft: '1px solid var(--vtt-border)',
              paddingLeft: '10px'
            }}>
              <span style={{ fontSize: '10px', color: 'var(--vtt-text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>Turno:</span>
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
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#ffffff' }}>
                    {(activeTurnToken.name || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span style={{
                fontSize: '12px',
                fontWeight: 700,
                color: activeTurnToken.faction === 'enemy' ? 'var(--vtt-accent-red)' : 'var(--vtt-accent-sky)',
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
                color: activeTurnToken.isGraveWound ? 'var(--vtt-accent-red)' : 'var(--vtt-accent-green)',
                background: 'var(--vtt-bg-inset)',
                border: '1px solid var(--vtt-border)',
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
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Sig. Turno <SkipForward size={11} strokeWidth={2.5} />
              </span>
            </button>
          )}

          {onEndCombat && (
            <button
              type="button"
              onClick={onEndCombat}
              className="vtt-btn-danger"
              style={{
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
          </>
        )}
      </div>

      {/* Bloque Derecho: Preferencias y Ayuda */}
      <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
        <button
          onClick={onOpenAppSettings}
          className="vtt-brass-btn"
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            gap: '6px'
          }}
          title="Configuración global de la aplicación (Audio, Cuadrícula, Dados, Rendimiento)"
        >
          <Settings size={14} strokeWidth={2.2} />
          Config.
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
            color: 'var(--vtt-accent-amber)',
            borderColor: 'var(--vtt-accent-amber-border)',
            gap: '5px'
          }}
          title="Guía rápida y tutorial del Grimorio VTT"
        >
          <HelpCircle size={14} strokeWidth={2.2} />
          Ayuda
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
