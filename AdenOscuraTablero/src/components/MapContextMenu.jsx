import React, { useEffect, useRef } from 'react';

const MapContextMenu = ({ x, y, mapId, onBringToFront, onDelete, onClose }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    window.addEventListener('pointerdown', handleClick, true);
    return () => window.removeEventListener('pointerdown', handleClick, true);
  }, [onClose]);

  return (
    <div 
      ref={menuRef}
      style={{ 
        position: 'fixed',
        top: y,
        left: x,
        backgroundColor: '#141824',
        border: '1px solid #2b3346',
        padding: '6px',
        borderRadius: '6px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.85)', 
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        minWidth: '150px'
      }}
    >
      <button 
        onClick={() => onBringToFront(mapId)} 
        style={{
          background: 'transparent',
          border: 'none',
          color: '#e2e8f0',
          cursor: 'pointer',
          textAlign: 'left',
          padding: '6px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 600,
          transition: 'background 0.15s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#1e2436'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        Traer al frente
      </button>
      <button 
        onClick={() => onDelete(mapId)} 
        style={{
          background: 'transparent',
          border: 'none',
          color: '#f87171',
          cursor: 'pointer',
          textAlign: 'left',
          padding: '6px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 600,
          transition: 'background 0.15s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        Eliminar imagen
      </button>
    </div>
  );
};

export default MapContextMenu;
