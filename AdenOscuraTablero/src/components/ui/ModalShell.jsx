import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Contenedor modal unificado con Portal, cierre con tecla Escape,
 * escala de z-index controlada y cabecera estética coherente.
 */
const ModalShell = ({
  isOpen,
  onClose,
  title,
  subtitle = null,
  icon = null,
  headerActions = null,
  footer = null,
  children,
  width = '560px',
  maxWidth = '94vw',
  maxHeight = '88vh',
  zIndex = 100000,
  closeOnBackdrop = true,
  closeOnEscape = true,
  bodyStyle = undefined,
  panelStyle = undefined
}) => {
  useEffect(() => {
    if (!isOpen || !closeOnEscape || !onClose) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => {
        if (closeOnBackdrop && onClose) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        backgroundColor: 'rgba(5, 7, 12, 0.82)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          maxWidth,
          maxHeight,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #161b26 0%, #0d1017 100%)',
          border: '1.5px solid #334155',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.92), 0 0 0 1px rgba(245, 158, 11, 0.12)',
          color: '#e2e8f0',
          ...panelStyle
        }}
      >
        {(title || onClose || headerActions) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '13px 18px',
              borderBottom: '1px solid #242d3f',
              background: 'linear-gradient(180deg, rgba(22, 27, 38, 0.96) 0%, rgba(15, 19, 28, 0.98) 100%)',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
              {icon && (
                <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, color: '#fbbf24' }}>
                  {icon}
                </span>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {title && (
                  <h3
                    className="vtt-gothic-title"
                    style={{
                      margin: 0,
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#f8fafc',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    {subtitle}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {headerActions}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="vtt-brass-btn"
                  style={{ width: '30px', height: '30px', padding: 0, borderRadius: '6px', cursor: 'pointer' }}
                  title="Cerrar (Esc)"
                  aria-label="Cerrar"
                >
                  <X size={15} strokeWidth={2.2} />
                </button>
              )}
            </div>
          </div>
        )}

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 18px',
            ...bodyStyle
          }}
        >
          {children}
        </div>

        {footer && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '8px',
              padding: '12px 18px',
              borderTop: '1px solid #242d3f',
              background: '#0e121a',
              flexShrink: 0
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ModalShell;
