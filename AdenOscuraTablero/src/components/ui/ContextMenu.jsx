import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Contenedor Portal para menús contextuales del tablero con cierre automático
 * por clic exterior o Escape y ajuste automático por bounding rect al viewport.
 */
const ContextMenu = ({
  isOpen,
  x,
  y,
  onClose,
  headerIcon = null,
  headerTitle = '',
  headerTitleAttr = undefined,
  headerAction = null,
  children
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('pointerdown', handlePointerOutside, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerOutside, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useLayoutEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const margin = 12;
    let clampedX = x;
    let clampedY = y;

    if (clampedX + rect.width > window.innerWidth - margin) {
      clampedX = Math.max(margin, window.innerWidth - rect.width - margin);
    }
    if (clampedY + rect.height > window.innerHeight - margin) {
      clampedY = Math.max(margin, window.innerHeight - rect.height - margin);
    }
    if (clampedY < margin) clampedY = margin;
    if (clampedX < margin) clampedX = margin;

    menuRef.current.style.left = `${Math.round(clampedX)}px`;
    menuRef.current.style.top = `${Math.round(clampedY)}px`;
  }, [isOpen, x, y]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      onPointerDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
      className="vtt-context-menu"
      style={{
        top: `${Math.max(12, Math.min(y, window.innerHeight - 320))}px`,
        left: `${Math.max(12, Math.min(x, window.innerWidth - 275))}px`
      }}
    >
      <div className="vtt-context-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0, flex: 1 }}>
          {headerIcon && (
            <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
              {headerIcon}
            </span>
          )}
          <span
            className="vtt-gothic-title"
            style={{
              fontSize: '13px',
              lineHeight: 1.2,
              color: '#f8fafc',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={headerTitleAttr || headerTitle}
          >
            {headerTitle}
          </span>
        </div>
        {headerAction}
      </div>

      {children}
    </div>,
    document.body
  );
};

export default ContextMenu;
