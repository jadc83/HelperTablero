import React, { useState, useRef } from 'react';

const HandoutProjectorModal = ({
  isOpen,
  onClose,
  handouts = [],
  activeHandout = null,
  onAddHandout,
  onRemoveHandout,
  onProjectHandout
}) => {
  const [handoutTitle, setHandoutTitle] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newHandout = {
        id: 'handout_' + Date.now(),
        title: handoutTitle.trim() || file.name.replace(/\.[^/.]+$/, ''),
        src: event.target.result,
        createdAt: new Date().toISOString()
      };
      if (onAddHandout) onAddHandout(newHandout);
      setHandoutTitle('');
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(5, 7, 12, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="vtt-wood-panel"
        style={{
          width: '740px',
          maxWidth: '96vw',
          maxHeight: '88vh',
          backgroundColor: '#121622',
          backgroundImage: 'linear-gradient(180deg, rgba(20, 26, 38, 0.96) 0%, rgba(13, 16, 24, 0.98) 100%), url("/assets/textures/parchment_dossier_texture.jpg")',
          backgroundBlendMode: 'overlay',
          borderRadius: '14px',
          border: '1.5px solid rgba(212, 175, 55, 0.5)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(212, 175, 55, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Cabecera del Proyector */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 22px',
          borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
          background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.12) 0%, rgba(0, 0, 0, 0.35) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.35) 0%, rgba(180, 83, 9, 0.5) 100%)',
              border: '1px solid #d4af37',
              color: '#fef08a',
              boxShadow: '0 2px 8px rgba(0,0,0,0.6)'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </span>
            <div>
              <h2 className="vtt-gothic-title" style={{ margin: 0, fontSize: '17px', color: '#f8fafc', letterSpacing: '0.05em' }}>
                PROYECTOR DE PISTAS E ILUSTRACIONES
              </h2>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                Proyecta cartas, fotografías o documentos en vivo hacia la Pantalla de Jugadores
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="vtt-brass-plate-btn"
            style={{ padding: '5px 12px', fontSize: '11px' }}
            title="Cerrar proyector"
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Banner de Proyección Activa (si hay algo proyectándose ahora mismo) */}
        {activeHandout && (
          <div style={{
            padding: '10px 22px',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.4)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
                flexShrink: 0
              }} />
              <span style={{ fontSize: '12px', color: '#a7f3d0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                En pantalla de jugadores: <strong style={{ color: '#ffffff' }}>{activeHandout.title}</strong>
              </span>
            </div>
            <button
              onClick={() => onProjectHandout && onProjectHandout(null)}
              className="vtt-danger-plate-btn"
              style={{ padding: '4px 10px', fontSize: '11px', flexShrink: 0 }}
            >
              ⏹ Detener Proyección
            </button>
          </div>
        )}

        {/* Barra de Subida de Nuevo Handout */}
        <div style={{
          padding: '14px 22px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(12, 16, 24, 0.65)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            value={handoutTitle}
            onChange={(e) => setHandoutTitle(e.target.value)}
            placeholder="Título de la pista (ej. Diario de Walter Gilman, Telegrama de Boston)..."
            className="vtt-dossier-input"
            style={{ flex: 1, padding: '9px 12px' }}
          />
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="vtt-brass-plate-btn"
            style={{ padding: '9px 16px', fontSize: '12px', flexShrink: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span>Subir Documento o Imagen</span>
          </button>
        </div>

        {/* Galería de Handouts y Pistas */}
        <div style={{
          flex: 1,
          padding: '20px 22px',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: '14px',
          alignContent: 'flex-start'
        }}>
          {handouts.map((h) => {
            const isShowing = activeHandout && activeHandout.id === h.id;
            return (
              <div
                key={h.id}
                style={{
                  borderRadius: '9px',
                  backgroundColor: isShowing ? 'rgba(43, 31, 19, 0.95)' : 'rgba(18, 22, 32, 0.85)',
                  border: isShowing ? '1.5px solid #d4af37' : '1px solid #283244',
                  boxShadow: isShowing
                    ? '0 6px 20px rgba(0,0,0,0.8), 0 0 15px rgba(212, 175, 55, 0.25)'
                    : '0 4px 12px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Miniatura de la Imagen */}
                <div style={{
                  width: '100%',
                  height: '130px',
                  backgroundColor: '#0a0d14',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {h.src ? (
                    <img
                      src={h.src}
                      alt={h.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: isShowing ? 'brightness(1.05)' : 'brightness(0.9)'
                      }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                      Sin previsualización
                    </div>
                  )}

                  {isShowing && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.9)',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      letterSpacing: '0.04em',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.7)'
                    }}>
                      EN PANTALLA
                    </div>
                  )}
                </div>

                {/* Pie de la Tarjeta con Título y Botones */}
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'space-between' }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: isShowing ? '#fef08a' : '#f1f5f9',
                    fontFamily: "'Cinzel', Georgia, serif",
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }} title={h.title}>
                    {h.title}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      onClick={() => onProjectHandout && onProjectHandout(isShowing ? null : h)}
                      className={isShowing ? 'vtt-conclude-plate-btn' : 'vtt-brass-plate-btn'}
                      style={{
                        flex: 1,
                        padding: '5px 8px',
                        fontSize: '11px',
                        borderColor: isShowing ? '#10b981' : undefined,
                        color: isShowing ? '#86efac' : undefined
                      }}
                      title={isShowing ? 'Ocultar documento de la pantalla de jugadores' : 'Proyectar este documento a pantalla completa a los jugadores'}
                    >
                      {isShowing ? '⏹ Ocultar' : '👁️ Proyectar'}
                    </button>

                    {onRemoveHandout && (
                      <button
                        onClick={() => onRemoveHandout(h.id)}
                        className="vtt-icon-tool-btn"
                        style={{ color: '#f87171', padding: '5px 7px' }}
                        title="Eliminar de la galería"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {handouts.length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              padding: '40px 20px',
              textAlign: 'center',
              color: '#8e9caa',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '36px', opacity: 0.6 }}>📜</span>
              <div style={{ maxWidth: '420px', lineHeight: 1.6 }}>
                Aún no has añadido pistas a la crónica. Usa el campo superior para subir cartas, retratos o mapas de investigación y mostrárselos a tus jugadores en tiempo real.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HandoutProjectorModal;
