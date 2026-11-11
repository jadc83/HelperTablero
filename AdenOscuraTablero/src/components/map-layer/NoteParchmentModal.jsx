import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const NoteParchmentModal = ({ note, isPlayerView, onProjectHandout, onClose }) => {
  useEffect(() => {
    if (!note) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [note, onClose]);

  if (!note) return null;

  return createPortal(
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        onClose();
      }}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.8)',
        zIndex: 100000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          background: 'radial-gradient(circle, #f7ebd2 0%, #dcc196 100%)',
          padding: '34px',
          borderRadius: '8px',
          width: '480px',
          maxWidth: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          color: '#3b2314',
          boxShadow: '0 25px 50px rgba(0,0,0,0.95), inset 0 0 35px rgba(120, 53, 15, 0.35)',
          border: '4px double #5c3a21'
        }}
      >
        <h2 className="vtt-gothic-title" style={{ margin: '0 0 15px 0', borderBottom: '2px solid #8a6d3b', paddingBottom: '10px', fontSize: '24px', color: '#451a03', textShadow: 'none' }}>
          {note.title || note.name || 'Pista'}
        </h2>
        <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7', margin: 0, fontSize: '18px', fontFamily: "'Crimson Text', Georgia, serif" }}>
          {note.content || 'Sin texto adicional registrado para esta pista.'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', gap: '10px' }}>
          {!isPlayerView && onProjectHandout && (
            <button
              type="button"
              onClick={() => {
                onProjectHandout({
                  type: 'note',
                  title: note.title,
                  content: note.content
                });
                onClose();
              }}
              className="vtt-gothic-title"
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px',
                background: 'linear-gradient(180deg, #b45309 0%, #78350f 100%)',
                color: '#fffbeb',
                border: '1px solid #fbbf24'
              }}
            >
              Proyectar en Pantalla de Jugadores
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="vtt-brass-btn"
            style={{ padding: '10px 22px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginLeft: 'auto' }}
          >
            Cerrar Pergamino
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NoteParchmentModal;
