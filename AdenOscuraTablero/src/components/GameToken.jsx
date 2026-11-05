import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const GameToken = ({
  token,
  isDragging,
  isRotating,
  isPlayerView = false,
  onPointerDown,
  onStartRotate,
  onToggleLock,
  onToggleName,
  onToggleBars,
  onToggleHidden,
  onToggleFaction,
  onUpdateSize,
  onUpdateRotation,
  onUpdateVisionMode,
  onToggleStatus,
  onUpdateStats,
  onOpenSheet,
  customStatuses,
  isActiveTurn = false
}) => {
  const [menuState, setMenuState] = useState({ visible: false, x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isRotatingLocally, setIsRotatingLocally] = useState(false);
  const menuRef = useRef(null);
  const tokenRef = useRef(null);
  const currentSize = token.size || 50;
  const rotation = token.rotation || 0;
  const visionMode = token.visionMode || 'cone';
  const faction = token.faction || 'ally';
  const isHidden = Boolean(token.isHidden);
  const activeStatuses = token.statuses || [];

  const hp = token.hp ?? 20;
  const maxHp = Math.max(1, token.maxHp ?? 20);
  const mp = token.mp ?? 10;
  const maxMp = Math.max(1, token.maxMp ?? 10);
  const san = token.san ?? 60;
  const maxSan = Math.max(1, token.maxSan ?? 60);
  const isGraveWound = Boolean(token.isGraveWound);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuState(prev => ({ ...prev, visible: false }));
      }
    };

    if (menuState.visible) {
      document.addEventListener('pointerdown', handleClickOutside, true);
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside, true);
    };
  }, [menuState.visible]);

  // Reposicionamiento inteligente para que el menú nunca se salga de la pantalla (evita cortes si el token está abajo o a los bordes)
  useEffect(() => {
    if (menuState.visible && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const margin = 12;
      let x = menuState.x;
      let y = menuState.y;

      if (x + rect.width > window.innerWidth - margin) {
        x = Math.max(margin, window.innerWidth - rect.width - margin);
      }
      if (y + rect.height > window.innerHeight - margin) {
        y = Math.max(margin, window.innerHeight - rect.height - margin);
      }
      if (y < margin) y = margin;
      if (x < margin) x = margin;

      menuRef.current.style.left = `${Math.round(x)}px`;
      menuRef.current.style.top = `${Math.round(y)}px`;
    }
  }, [menuState.visible, menuState.x, menuState.y]);

  // Listener nativo no-pasivo para que Shift+Rueda gire el cono con suavidad sin activar navegación del navegador
  useEffect(() => {
    const el = tokenRef.current;
    if (!el || isPlayerView) return;

    const onNativeWheel = (e) => {
      if (e.shiftKey && onUpdateRotation && !token.isLocked) {
        e.stopPropagation();
        e.preventDefault();
        const step = e.deltaY > 0 ? 6 : -6;
        onUpdateRotation(token.id, (token.rotation || 0) + step);
      }
    };

    el.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => el.removeEventListener('wheel', onNativeWheel);
  }, [token.id, token.rotation, token.isLocked, onUpdateRotation, isPlayerView]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPlayerView) return;
    setMenuState({ visible: true, x: e.clientX, y: e.clientY });
  };

  const handlePointerDown = (e) => {
    // Bloqueamos siempre la propagación en cualquier botón (incluido clic derecho) para no activar el paneo del mapa
    e.stopPropagation();
    if (e.button !== 0) return;
    e.preventDefault();
    if (menuState.visible) setMenuState({ visible: false, x: 0, y: 0 });
    
    if (!token.isLocked && onPointerDown) {
      onPointerDown(e, token);
    }
  };

  return (
    <div
      ref={tokenRef}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDown}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onDragStart={(e) => e.preventDefault()}
      style={{
        position: 'absolute',
        left: `${token.x}px`,
        top: `${token.y}px`,
        width: `${currentSize}px`,
        height: `${currentSize}px`,
        backgroundColor: token.color,
        borderRadius: '50%',
        cursor: token.isLocked ? 'not-allowed' : (isDragging || isRotating ? 'grabbing' : 'grab'),
        boxShadow: isActiveTurn
          ? '0 0 25px rgba(251, 191, 36, 0.9), 0 0 10px rgba(245, 158, 11, 0.7), 0 6px 14px rgba(0,0,0,0.9)'
          : faction === 'enemy'
          ? '0 6px 14px rgba(0,0,0,0.9), 0 0 10px rgba(220, 38, 38, 0.45)'
          : faction === 'player'
          ? '0 6px 14px rgba(0,0,0,0.85), 0 0 10px rgba(16, 185, 129, 0.35)'
          : '0 6px 14px rgba(0,0,0,0.85), inset 0 0 8px rgba(0,0,0,0.6)',
        border: isActiveTurn
          ? '3px solid #fbbf24'
          : token.isLocked
          ? '3px solid #dc2626'
          : isHidden
          ? '3px dashed #a855f7'
          : faction === 'enemy'
          ? '3px solid #ef4444'
          : `3px solid ${token.color || '#d4af37'}`,
        outline: isActiveTurn
          ? '2px solid rgba(251, 191, 36, 0.7)'
          : isRotating
          ? '2px solid #fbbf24'
          : '1px solid #d4af37',
        opacity: !isPlayerView && isHidden ? 0.52 : 1,
        zIndex: isDragging || isRotating ? 100 : 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none'
      }}
      title="Arrastra la punta dorada (o Shift + Arrastrar) para orientar el cono con el ratón | Shift + Rueda para giro fino"
    >
      {/* Indicador de Sigilo para el Master */}
      {!isPlayerView && isHidden && (
        <div
          style={{
            position: 'absolute',
            bottom: '-8px',
            right: '-8px',
            backgroundColor: '#3b0764',
            border: '1px solid #c084fc',
            borderRadius: '50%',
            width: '22px',
            height: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            zIndex: 15,
            pointerEvents: 'none',
            boxShadow: '0 2px 6px rgba(0,0,0,0.9)'
          }}
          title="En Sigilo (Invisible en Pantalla de Jugadores)"
        >
          👻
        </div>
      )}

      {/* Haz sutil del Cono de Visión y Tirador de Orientación */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: `${currentSize * 2.2}px`,
          height: `${currentSize * 2.2}px`,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          pointerEvents: 'none',
          zIndex: 2
        }}
      >
        {visionMode === 'cone' && (isHovered || isDragging || isRotating || menuState.visible) && (
          <svg
            viewBox="0 0 100 100"
            style={{ width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
          >
            <defs>
              <radialGradient id={`coneGrad_${token.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="15%" stopColor="#fbbf24" stopOpacity="0.34" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.0" />
              </radialGradient>
            </defs>
            <path
              d="M 50 50 L 100 0 A 70 70 0 0 1 100 100 Z"
              fill={`url(#coneGrad_${token.id})`}
              stroke="rgba(251, 191, 36, 0.45)"
              strokeWidth="0.7"
              strokeDasharray="2,2"
            />
          </svg>
        )}

        {/* Tirador interactivo dorado en el borde del token para apuntar con el ratón */}
        <div
          onPointerDown={(e) => {
            if (isPlayerView || token.isLocked) return;
            e.stopPropagation();
            e.preventDefault();
            if (onStartRotate) onStartRotate(e, token);
          }}
          title="Arrastra para orientar la mirada hacia el ratón"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(${currentSize / 2 + 2}px, -50%)`,
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isPlayerView || token.isLocked ? 'default' : 'grab',
            pointerEvents: isPlayerView ? 'none' : 'auto'
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderLeft: '11px solid #fbbf24',
              filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.95))'
            }}
          />
        </div>
      </div>

      {token.avatar && (
        <img
          src={token.avatar}
          alt={token.name}
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        />
      )}

      {token.showName !== false && (
        <div
          className="vtt-gothic-title"
          style={{
            position: 'absolute',
            top: '-28px',
            background: isGraveWound
              ? 'linear-gradient(180deg, rgba(153, 27, 27, 0.96) 0%, rgba(69, 10, 10, 0.96) 100%)'
              : 'linear-gradient(180deg, rgba(24, 28, 38, 0.95) 0%, rgba(14, 16, 22, 0.95) 100%)',
            color: '#f8fafc',
            border: isGraveWound ? '1px solid #f87171' : '1px solid #475569',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 3px 6px rgba(0,0,0,0.85)'
          }}
        >
          {isGraveWound ? '🩸 ' : ''}{token.name}
        </div>
      )}

      {/* Barras Flotantes bajo el Token: Roja (Salud), Azul (Magia), Amarilla (Cordura) */}
      {Boolean(token.showBars) && (
        <div
          style={{
            position: 'absolute',
            bottom: '-18px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${Math.max(46, currentSize)}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            backgroundColor: 'rgba(11, 13, 18, 0.88)',
            padding: '2px',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.18)',
            pointerEvents: 'none',
            zIndex: 16
          }}
        >
          <div style={{ width: '100%', height: '4px', backgroundColor: '#2a1215', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.max(0, (hp / maxHp) * 100))}%`, height: '100%', backgroundColor: '#ef4444' }} />
          </div>
          <div style={{ width: '100%', height: '3px', backgroundColor: '#111c35', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.max(0, (mp / maxMp) * 100))}%`, height: '100%', backgroundColor: '#3b82f6' }} />
          </div>
          <div style={{ width: '100%', height: '3px', backgroundColor: '#2e260d', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.max(0, (san / maxSan) * 100))}%`, height: '100%', backgroundColor: '#facc15' }} />
          </div>
        </div>
      )}

      {menuState.visible && createPortal(
        <div 
          ref={menuRef}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed', 
            top: `${Math.max(12, Math.min(menuState.y, window.innerHeight - 380))}px`, 
            left: `${Math.max(12, Math.min(menuState.x, window.innerWidth - 250))}px`,
            background: 'linear-gradient(180deg, #1b202c 0%, #11141c 100%)', 
            padding: '12px 14px', 
            borderRadius: '10px',
            border: '1px solid #3b4254',
            boxShadow: '0 15px 35px rgba(0,0,0,0.95)', 
            zIndex: 999999, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            width: '235px',
            maxHeight: 'calc(100vh - 24px)',
            overflowY: 'auto',
            color: '#e2e8f0',
            scrollbarWidth: 'thin',
            scrollbarColor: '#475569 transparent'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #283144', paddingBottom: '7px' }}>
            <span className="vtt-gothic-title" style={{ fontSize: '13px', color: '#f8fafc', fontWeight: 'bold' }}>
              {token.name}
            </span>
            {onOpenSheet && (
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setMenuState({ visible: false, x: 0, y: 0 });
                  onOpenSheet(token);
                }}
                className="vtt-primary-cta"
                style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
              >
                Ficha
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (onToggleHidden) onToggleHidden(token.id);
              }}
              style={{
                flex: 1,
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: '5px',
                fontWeight: 700,
                fontSize: '11px',
                background: isHidden ? 'linear-gradient(180deg, #6b21a8 0%, #3b0764 100%)' : '#171c26',
                border: isHidden ? '1px solid #c084fc' : '1px solid #2b3345',
                color: isHidden ? '#f3e8ff' : '#cbd5e1'
              }}
              title="Oculta o revela esta ficha en la pantalla de los jugadores"
            >
              {isHidden ? 'Oculto' : 'Visible'}
            </button>

            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (onToggleFaction) onToggleFaction(token.id);
              }}
              style={{
                flex: 1,
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: '5px',
                fontWeight: 700,
                fontSize: '11px',
                background: faction === 'enemy'
                  ? 'linear-gradient(180deg, #991b1b 0%, #450a0a 100%)'
                  : faction === 'player'
                  ? 'linear-gradient(180deg, #065f46 0%, #022c22 100%)'
                  : 'linear-gradient(180deg, #1e3a8a 0%, #172554 100%)',
                border: faction === 'enemy'
                  ? '1px solid #f87171'
                  : faction === 'player'
                  ? '1px solid #34d399'
                  : '1px solid #60a5fa',
                color: '#fff'
              }}
              title="Alternar bando: Jugador (PJ), Aliado (PNJ) o Enemigo"
            >
              {faction === 'enemy' ? 'Enemigo' : faction === 'player' ? 'Jugador' : 'Aliado'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (onToggleName) onToggleName(token.id);
              }}
              className="vtt-brass-btn"
              style={{
                flex: 1,
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: '5px',
                fontWeight: 700,
                fontSize: '11px',
                borderColor: token.showName !== false ? '#f59e0b' : '#2b3345',
                color: token.showName !== false ? '#fbbf24' : '#94a3b8'
              }}
              title="Muestra u oculta la etiqueta con el nombre sobre la ficha en el tablero"
            >
              {token.showName !== false ? 'Ocultar Nombre' : 'Mostrar Nombre'}
            </button>

            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (onToggleBars) onToggleBars(token.id);
              }}
              className="vtt-brass-btn"
              style={{
                flex: 1,
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: '5px',
                fontWeight: 700,
                fontSize: '11px',
                borderColor: token.showBars ? '#10b981' : '#2b3345',
                color: token.showBars ? '#34d399' : '#94a3b8'
              }}
              title="Muestra u oculta las barras de Salud, Magia y Cordura sobre el mapa"
            >
              {token.showBars ? 'Ocultar Barras' : 'Mostrar Barras'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (onToggleLock) onToggleLock(token.id);
                setMenuState({ visible: false, x: 0, y: 0 });
              }}
              className="vtt-brass-btn"
              style={{
                flex: 1,
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: '5px',
                fontWeight: 700,
                fontSize: '11px'
              }}
            >
              {token.isLocked ? 'Desbloquear posición' : 'Bloquear posición'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid #242c3d', paddingTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', width: '100%', textAlign: 'center', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>Condiciones</span>
            {customStatuses.map(status => {
              const isActive = activeStatuses.includes(status.id);
              const isImage = status.icon.startsWith('data:image');
              return (
                <button
                  key={status.id}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (onToggleStatus) onToggleStatus(token.id, status.id);
                  }}
                  style={{
                    backgroundColor: isActive ? '#2a1a08' : '#161a25',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(180, 83, 9, 0.5) 100%)'
                      : '#161a25',
                    border: isActive ? '1.5px solid #f59e0b' : '1px solid #262e3f',
                    borderRadius: '4px',
                    padding: isImage ? '2px' : '4px 6px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isActive ? '0 2px 8px rgba(245, 158, 11, 0.25)' : 'none'
                  }}
                  title={status.label}
                >
                  {isImage ? <img src={status.icon} alt={status.label} style={{ width: '18px', height: '18px', borderRadius: '2px', objectFit: 'cover' }} /> : status.icon}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default GameToken;