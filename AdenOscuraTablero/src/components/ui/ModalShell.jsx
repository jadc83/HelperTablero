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
          background: 'var(--vtt-bg-panel-gradient)',
          border: '1.5px solid var(--vtt-border-strong)',
          boxShadow: 'var(--vtt-shadow-panel)',
          color: 'var(--vtt-text)',
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
              borderBottom: '1px solid var(--vtt-border-subtle)',
              background: 'var(--vtt-bg-header)',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
              {icon && (
                <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, color: 'var(--vtt-gold-light)' }}>
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
                      color: 'var(--vtt-text-strong)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <span style={{ fontSize: '11px', color: 'var(--vtt-text-muted)', marginTop: '2px' }}>
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
              borderTop: '1px solid var(--vtt-border-subtle)',
              background: 'var(--vtt-bg-inset)',
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
