import { Image as ImageIcon } from 'lucide-react';

const HandoutFullscreenOverlay = ({ handout, isPlayerView, onStopProjection }) => {
  if (!handout) return null;

  if (!isPlayerView) {
    return (
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '68px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9500,
          background: 'linear-gradient(180deg, rgba(24, 28, 38, 0.96) 0%, rgba(14, 16, 22, 0.98) 100%)',
          border: '1px solid #f59e0b',
          borderRadius: '10px',
          padding: '8px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          color: '#f8fafc',
          boxShadow: '0 10px 25px rgba(0,0,0,0.9)'
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
          <ImageIcon size={15} strokeWidth={2.2} style={{ color: '#fbbf24' }} />
          <span>Proyectando en Sala de Jugadores: <strong style={{ color: '#fbbf24' }}>{handout.title}</strong></span>
        </span>
        <button
          onClick={onStopProjection}
          className="vtt-btn-danger"
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Cerrar Proyección
        </button>
      </div>
    );
  }

  const isImageFullscreen = Boolean(handout.fullscreen && handout.type !== 'note' && handout.src);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: isImageFullscreen ? '#000000' : 'rgba(5, 3, 2, 0.95)',
        zIndex: 99990,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isImageFullscreen ? 0 : '40px'
      }}
    >
      {handout.type === 'note' ? (
        <div
          style={{
            background: 'radial-gradient(circle, #f7ebd2 0%, #dcc196 100%)',
            padding: '42px',
            borderRadius: '10px',
            width: '680px',
            maxWidth: '90vw',
            maxHeight: '82vh',
            overflowY: 'auto',
            color: '#3b2314',
            boxShadow: '0 25px 60px rgba(0,0,0,0.98), inset 0 0 40px rgba(120, 53, 15, 0.35)',
            border: '5px double #5c3a21'
          }}
        >
          <h2 className="vtt-gothic-title" style={{ margin: '0 0 18px 0', borderBottom: '2px solid #8a6d3b', paddingBottom: '12px', fontSize: '28px', color: '#451a03', textShadow: 'none' }}>
            {handout.title}
          </h2>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.75', margin: 0, fontSize: '21px', fontFamily: "'Crimson Text', Georgia, serif" }}>
            {handout.content}
          </p>
        </div>
      ) : isImageFullscreen ? (
        <img
          src={handout.src}
          alt={handout.title}
          style={{
            width: '100vw',
            height: '100vh',
            objectFit: 'contain',
            display: 'block'
          }}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '92vw',
            maxHeight: '90vh'
          }}
        >
          <div
            style={{
              border: '4px double #d4af37',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 25px 70px rgba(0,0,0,0.98), 0 0 35px rgba(212, 175, 55, 0.25)',
              backgroundColor: '#090604',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <img
              src={handout.src}
              alt={handout.title}
              style={{
                maxWidth: '88vw',
                maxHeight: '78vh',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>
          {handout.title && (
            <div
              className="vtt-gothic-title"
              style={{
                marginTop: '16px',
                padding: '8px 24px',
                background: 'linear-gradient(180deg, #261810 0%, #120b07 100%)',
                border: '2px solid #d4af37',
                borderRadius: '6px',
                color: '#f3e5ab',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: '0 8px 20px rgba(0,0,0,0.9)'
              }}
            >
              {handout.title}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HandoutFullscreenOverlay;
