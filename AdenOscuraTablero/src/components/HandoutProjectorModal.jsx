import { useState, useRef, useEffect } from 'react';
import { Monitor, X, Square, Upload, Eye, EyeOff, Trash2, Scroll, Maximize2, Minimize2 } from 'lucide-react';
import { useConfirm } from '../hooks/useConfirm';
import EmptyState from './ui/EmptyState';

const HandoutProjectorModal = ({
  isOpen,
  onClose,
  handouts = [],
  activeHandout = null,
  onAddHandout,
  onRemoveHandout,
  onProjectHandout,
  isImageFullscreen = false,
  onToggleImageFullscreen
}) => {
  const [handoutTitle, setHandoutTitle] = useState('');
  const fileInputRef = useRef(null);
  const confirm = useConfirm();

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
      onPointerDown={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget && onClose) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        backgroundColor: 'rgba(5, 7, 12, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        onPointerDown={(e) => e.stopPropagation()}
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
              <Monitor size={18} strokeWidth={2.2} />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {onToggleImageFullscreen && (
              <button
                type="button"
                onClick={onToggleImageFullscreen}
                className="vtt-brass-plate-btn"
                style={{
                  padding: '5px 11px',
                  fontSize: '11px',
                  borderColor: isImageFullscreen ? '#10b981' : undefined,
                  background: isImageFullscreen ? 'rgba(16, 185, 129, 0.2)' : undefined,
                  color: isImageFullscreen ? '#6ee7b7' : undefined
                }}
                title={isImageFullscreen
                  ? 'Desactivar pantalla completa para imágenes en la Pantalla de Jugadores'
                  : 'Activar pantalla completa para imágenes en la Pantalla de Jugadores'}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  {isImageFullscreen ? <Minimize2 size={13} strokeWidth={2.2} /> : <Maximize2 size={13} strokeWidth={2.2} />}
                  Pantalla completa: {isImageFullscreen ? 'ON' : 'OFF'}
                </span>
              </button>
            )}
            <button
              onClick={onClose}
              className="vtt-brass-plate-btn"
              style={{ padding: '5px 12px', fontSize: '11px' }}
              title="Cerrar proyector"
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><X size={13} strokeWidth={2.4} /> Cerrar</span>
            </button>
          </div>
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
                {activeHandout.fullscreen && activeHandout.type !== 'note' && activeHandout.src && (
                  <span style={{ marginLeft: '8px', fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.25)', border: '1px solid rgba(16, 185, 129, 0.5)', color: '#6ee7b7' }}>
                    Pantalla completa
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={() => onProjectHandout && onProjectHandout(null)}
              className="vtt-danger-plate-btn"
              style={{ padding: '4px 10px', fontSize: '11px', flexShrink: 0 }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Square size={11} strokeWidth={2.4} /> Detener Proyección</span>
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
            <Upload size={14} strokeWidth={2.2} />
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
                      {isShowing ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><EyeOff size={12} strokeWidth={2.2} /> Ocultar</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Eye size={12} strokeWidth={2.2} /> Proyectar</span>}
                    </button>

                    {onRemoveHandout && (
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Eliminar documento',
                            message: `¿Eliminar "${h.title}" de la galería de proyecciones?`,
                            confirmLabel: 'Eliminar',
                            tone: 'danger'
                          });
                          if (ok) onRemoveHandout(h.id);
                        }}
                        className="vtt-icon-tool-btn"
                        style={{ color: '#f87171', padding: '5px 7px' }}
                        title="Eliminar de la galería"
                      >
                        <Trash2 size={13} strokeWidth={2.2} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {handouts.length === 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <EmptyState
                icon={<Scroll size={32} strokeWidth={1.75} style={{ color: '#d4af37' }} />}
                title="Galería de pistas vacía"
                description="Usa el campo superior para subir cartas, retratos o mapas de investigación y mostrárselos a tus jugadores en tiempo real."
                style={{ padding: '36px 20px' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HandoutProjectorModal;
