import React from 'react';

const Toolbar = ({
  onOpenHome,
  onOpenSettings,
  onOpenPlayerView,
  scenes = [],
  activeSceneId = null,
  onSelectScene
}) => {
  return (
    <div 
      onPointerDown={(e) => e.stopPropagation()} onWheel={(e) => e.stopPropagation()}
      style={{ display: 'flex', flexDirection: 'row', gap: '14px', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}
    >
      {/* Bloque Izquierdo: Logo Interactivo (Abre Pantalla de Inicio) + Selector de Escena */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={onOpenHome}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            padding: '5px 12px 5px 8px',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Ir a la Pantalla de Inicio (Inicio Rápido, Cargar Campaña y Archivo de Personajes)"
        >
          <div style={{
            width: '30px', height: '30px', borderRadius: '7px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(245, 158, 11, 0.35)',
            border: '1px solid #fbbf24', fontSize: '15px'
          }}>
            ⚜️
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span className="vtt-gothic-title" style={{ fontSize: '15px', color: '#f8fafc', fontWeight: 'bold', letterSpacing: '0.05em', lineHeight: 1.1 }}>
              GRIMORIO <span style={{ color: '#f59e0b' }}>VTT</span>
            </span>
            <span className="vtt-retro-badge" style={{ fontSize: '9px', color: '#fbbf24', fontWeight: 700 }}>
              🏠 MENÚ DE INICIO
            </span>
          </div>
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: '#2e3444' }}></div>

        {/* Selector Rápido de Escenas / Planos */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          backgroundColor: '#12151c', padding: '5px 12px',
          borderRadius: '8px', border: '1px solid #32394a'
        }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Selección de escena:
          </span>
          <select
            value={activeSceneId || ''}
            onChange={(e) => onSelectScene && onSelectScene(e.target.value)}
            style={{
              padding: '3px 6px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: '#f8fafc',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              minWidth: '150px',
              outline: 'none'
            }}
            title="Cambiar de plano o piso de mazmorra al instante"
          >
            {scenes.map((sc) => (
              <option key={sc.id} value={sc.id} style={{ backgroundColor: '#161922', color: '#f8fafc' }}>
                {sc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bloque Derecho: Solo Acciones Principales de Ventana y Configuración */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={onOpenPlayerView}
          style={{
            padding: '8px 15px',
            background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
            color: '#052e16',
            borderRadius: '8px',
            border: '1px solid #34d399',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
            whiteSpace: 'nowrap'
          }}
          title="Abre una ventana limpia sincronizada en tiempo real para proyectar o llevar al monitor de los jugadores"
        >
          <span>🖥️</span> Pantalla de Jugadores
        </button>

        <button
          onClick={onOpenSettings}
          className="vtt-primary-cta"
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
          title="Abre el centro de mando: Escenas, Proyector, Niebla, Personajes, Estados y Archivo"
        >
          <span>⚙️</span> Abrir centro de mando
        </button>
      </div>
    </div>
  );
};

export default Toolbar;