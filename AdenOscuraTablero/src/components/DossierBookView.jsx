import { useEffect, useRef, useState } from 'react';
import { Pencil, Crosshair, Trash2, RotateCcw } from 'lucide-react';

const PAPER_STYLE = {
  backgroundColor: '#ece0c6',
  backgroundImage:
    'linear-gradient(180deg, rgba(255, 250, 238, 0.38) 0%, rgba(224, 206, 172, 0.25) 100%), url("/assets/textures/dossier_aged_paper.jpg")',
  backgroundSize: 'cover',
  backgroundPosition: 'center'
};

const FOLDER_STYLE = {
  backgroundColor: '#8b663d',
  backgroundImage:
    'linear-gradient(160deg, rgba(255, 235, 205, 0.14) 0%, rgba(56, 36, 16, 0.24) 100%), url("/assets/textures/dossier_manila_folder.jpg")',
  backgroundSize: 'cover',
  backgroundPosition: 'center'
};

const DossierBookView = ({
  entity,
  classificationLabel,
  isGraveyard,
  onEditCharacter,
  onSpawnOnBoard,
  onDeleteCharacter,
  onReviveCharacter,
  onDeleteFromGraveyard,
  confirm
}) => {
  const [isSecondSpread, setIsSecondSpread] = useState(false);
  const [dragProgress, setDragProgress] = useState(null);
  const [isCornerHovered, setIsCornerHovered] = useState(false);

  const spreadRef = useRef(null);
  const dragSessionRef = useRef(null);
  const dragProgressRef = useRef(null);

  const progress = dragProgress !== null ? dragProgress : (isSecondSpread ? 1 : 0);
  const isDragging = dragProgress !== null;
  const flipDeg = -180 * progress;

  const equippedItems = (entity.inventory || []).filter(i => i.state === 'equipped');
  const handItems = (entity.inventory || []).filter(i => i.state === 'hand');
  const storedItems = (entity.inventory || []).filter(i => i.state === 'stored');
  const initialLetter = (entity.name || '?').trim().charAt(0).toUpperCase();
  const dossierCode = String(entity.id || '00000').replace(/\D/g, '').slice(-5).padStart(5, '0');

  useEffect(() => {
    if (!isDragging) return undefined;

    const handleWindowMove = (e) => {
      const session = dragSessionRef.current;
      if (!session) return;
      const dx = e.clientX - session.startX;
      const dist = Math.hypot(dx, e.clientY - session.startY);
      if (dist > 6) session.didMove = true;

      const travel = Math.max(180, session.bookWidth * 0.62);
      const nextProgress = session.fromSecondSpread
        ? Math.max(0, Math.min(1, 1 - dx / travel))
        : Math.max(0, Math.min(1, -dx / travel));
      dragProgressRef.current = nextProgress;
      setDragProgress(nextProgress);
    };

    const handleWindowUp = () => {
      const session = dragSessionRef.current;
      const latestProg = dragProgressRef.current;
      dragSessionRef.current = null;
      dragProgressRef.current = null;
      if (!session) {
        setDragProgress(null);
        return;
      }

      if (!session.didMove) {
        setIsSecondSpread(!session.fromSecondSpread);
        setDragProgress(null);
        return;
      }

      const finalProg = latestProg ?? (session.fromSecondSpread ? 1 : 0);
      const targetSecond = session.fromSecondSpread ? finalProg > 0.62 : finalProg > 0.34;
      setIsSecondSpread(targetSecond);
      setDragProgress(null);
    };

    window.addEventListener('pointermove', handleWindowMove);
    window.addEventListener('pointerup', handleWindowUp);
    window.addEventListener('pointercancel', handleWindowUp);
    return () => {
      window.removeEventListener('pointermove', handleWindowMove);
      window.removeEventListener('pointerup', handleWindowUp);
      window.removeEventListener('pointercancel', handleWindowUp);
    };
  }, [isDragging]);

  const beginPageDrag = (e, fromSecondSpread) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = spreadRef.current?.getBoundingClientRect();
    dragSessionRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      bookWidth: rect?.width || 880,
      fromSecondSpread,
      didMove: false
    };
    const initialProg = fromSecondSpread ? 1 : 0;
    dragProgressRef.current = initialProg;
    setDragProgress(initialProg);
  };

  const renderHeaderActions = () => {
    if (isGraveyard) {
      return (
        <>
          {onReviveCharacter && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onReviveCharacter(entity)}
              className="vtt-primary-cta"
              style={{ padding: '5px 11px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
              title="Revive al personaje y lo devuelve al centro del tablero de juego"
            >
              <RotateCcw size={12} strokeWidth={2.2} /> Resucitar
            </button>
          )}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onEditCharacter && onEditCharacter(entity)}
            style={{ background: 'transparent', border: 'none', color: '#4a3520', padding: '5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
            title="Ver ficha completa y saquear objetos"
            aria-label="Ver ficha completa"
          >
            <Pencil size={16} strokeWidth={2} />
          </button>
          {onDeleteFromGraveyard && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={async () => {
                const ok = await confirm({
                  title: 'Purgar registro de la cripta',
                  message: `¿Eliminar permanentemente a "${entity.name}" de la cripta y perder su inventario?`,
                  confirmLabel: 'Purgar',
                  tone: 'danger'
                });
                if (ok) onDeleteFromGraveyard(entity.graveyardId || entity.id);
              }}
              style={{ background: 'transparent', border: 'none', color: '#7f1d1d', padding: '5px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
              title="Eliminar permanentemente de la cripta"
              aria-label="Eliminar de la cripta"
            >
              <Trash2 size={16} strokeWidth={2} />
            </button>
          )}
        </>
      );
    }

    return [
      {
        key: 'edit',
        show: true,
        icon: Pencil,
        title: 'Editar Ficha',
        onClick: () => onEditCharacter && onEditCharacter(entity)
      },
      {
        key: 'spawn',
        show: Boolean(onSpawnOnBoard),
        icon: Crosshair,
        title: 'Invocar en el Tablero',
        onClick: () => onSpawnOnBoard(entity)
      },
      {
        key: 'delete',
        show: Boolean(onDeleteCharacter),
        icon: Trash2,
        title: 'Eliminar permanentemente del Códice Global',
        onClick: async () => {
          const ok = await confirm({
            title: 'Eliminar del Códice Global',
            message: `¿Eliminar permanentemente a "${entity.name}" del Códice Global?`,
            confirmLabel: 'Eliminar',
            tone: 'danger'
          });
          if (ok) onDeleteCharacter(entity.id);
        }
      }
    ]
      .filter(btn => btn.show)
      .map(btn => {
        const IconComp = btn.icon;
        return (
          <button
            key={btn.key}
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={btn.onClick}
            style={{
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              color: '#4a3520',
              padding: '5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease, transform 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#1a1007';
              e.currentTarget.style.transform = 'scale(1.14)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#4a3520';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title={btn.title}
            aria-label={btn.title}
          >
            <IconComp size={16} strokeWidth={2.1} />
          </button>
        );
      });
  };

  const renderInventoryGroup = (label, items, isStored = false) => {
    if (items.length === 0) return null;
    return (
      <div>
        <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#6e5235', textTransform: 'uppercase', marginBottom: '5px', letterSpacing: '0.06em' }}>
          {label} ({items.length})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {items.map(item => (
            <span
              key={item.id}
              style={{
                padding: '4px 9px',
                borderRadius: '4px',
                background: isStored ? 'rgba(242, 232, 210, 0.65)' : 'rgba(255, 251, 242, 0.75)',
                border: isStored ? '1px solid #c7b18a' : '1px solid #bfa77e',
                fontSize: '11.5px',
                fontWeight: isStored ? 500 : 600,
                color: isStored ? '#523a24' : '#24170c'
              }}
            >
              {item.name}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const foldHighlightAlpha = Math.sin(progress * Math.PI) * 0.22;
  const pageTurnShadowAlpha = (1 - progress) * 0.35;
  const leftLandShadowAlpha = Math.max(0, (progress - 0.35) / 0.65) * 0.28;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', userSelect: isDragging ? 'none' : 'auto' }}>
      {/* Pestaña superior de carpeta marrón + selector rápido de hojas */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingLeft: '14px', paddingRight: '6px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '7px 20px 6px 16px',
          borderRadius: '10px 14px 0 0',
          ...FOLDER_STYLE,
          border: '1.5px solid #593d20',
          borderBottom: 'none',
          boxShadow: 'inset 0 1px 0 rgba(255, 234, 200, 0.35)',
          position: 'relative',
          zIndex: 2
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isGraveyard ? '#8b1e1e' : entity.faction === 'enemy' ? '#92400e' : '#3f6212',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.45)'
          }} />
          <span style={{
            fontSize: '10.5px',
            fontFamily: "'Cinzel', Georgia, serif",
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: '#231509',
            textTransform: 'uppercase'
          }}>
            {isGraveyard
              ? `REGISTRO DE BAJA • EXP-${dossierCode}`
              : `EXPEDIENTE ${entity.faction === 'enemy' ? 'HOSTIL' : 'ALIADO'} • EXP-${dossierCode}`}
          </span>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', paddingBottom: '6px' }}>
          <button
            type="button"
            onClick={() => {
              setDragProgress(null);
              setIsSecondSpread(false);
            }}
            style={{
              padding: '4px 10px',
              borderRadius: '6px 6px 0 0',
              border: '1px solid #593d20',
              borderBottom: 'none',
              background: !isSecondSpread ? '#8d683e' : 'rgba(26, 20, 14, 0.72)',
              color: !isSecondSpread ? '#1e1209' : '#cbb896',
              fontSize: '10.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            1 · Filiación y Retrato
          </button>
          <button
            type="button"
            onClick={() => {
              setDragProgress(null);
              setIsSecondSpread(true);
            }}
            style={{
              padding: '4px 10px',
              borderRadius: '6px 6px 0 0',
              border: '1px solid #593d20',
              borderBottom: 'none',
              background: isSecondSpread ? '#8d683e' : 'rgba(26, 20, 14, 0.72)',
              color: isSecondSpread ? '#1e1209' : '#cbb896',
              fontSize: '10.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            2 · Equipo y Grimorio
          </button>
        </div>
      </div>

      {/* Carpeta marrón abierta con doble página en perspectiva 3D */}
      <div style={{
        ...FOLDER_STYLE,
        border: isGraveyard ? '1.5px solid #6b2626' : '1.5px solid #593d20',
        borderRadius: '0 12px 12px 12px',
        padding: '18px 20px',
        boxShadow: '0 26px 60px rgba(0, 0, 0, 0.88), inset 0 1px 0 rgba(255, 234, 200, 0.25)',
        position: 'relative'
      }}>
        {/* Lomo / pliegue central vertical de la carpeta abierta */}
        <div style={{
          position: 'absolute',
          top: '14px',
          bottom: '14px',
          left: '50%',
          width: '28px',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(90deg, rgba(42, 24, 9, 0) 0%, rgba(36, 18, 5, 0.42) 50%, rgba(42, 24, 9, 0) 100%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        {/* Escenario 3D del libro de dos páginas */}
        <div
          ref={spreadRef}
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '470px',
            perspective: '1900px',
            perspectiveOrigin: '50% 45%',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* PÁGINA IZQUIERDA BASE (Spread 1: Fotografía de archivo) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '50%',
              height: '100%',
              ...PAPER_STYLE,
              border: '1px solid #b59a6e',
              borderRight: 'none',
              borderRadius: '4px 0 0 4px',
              padding: '24px 22px',
              boxShadow: '-3px 3px 0 rgba(226, 209, 176, 0.55), -6px 6px 18px rgba(32, 18, 6, 0.45), inset -16px 0 24px -12px rgba(68, 44, 18, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: isSecondSpread && !isDragging ? 'none' : 'auto',
              zIndex: 1
            }}
          >
            {/* Foto de archivo con clip metálico */}
            <div style={{
              position: 'relative',
              width: '240px',
              backgroundColor: '#f7f1e3',
              padding: '12px 12px 15px 12px',
              border: '1px solid #c4af89',
              borderRadius: '3px',
              boxShadow: '0 10px 22px rgba(34, 20, 8, 0.34)',
              transform: 'rotate(-1.8deg)'
            }}>
              <svg
                width="26"
                height="52"
                viewBox="0 0 26 52"
                fill="none"
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '-19px',
                  left: '22px',
                  zIndex: 4,
                  filter: 'drop-shadow(1px 2px 2px rgba(0, 0, 0, 0.35))',
                  pointerEvents: 'none'
                }}
              >
                <path
                  d="M8 14V37C8 42.5228 12.4772 47 18 47C21.3137 47 24 44.3137 24 41V10C24 5.02944 19.9706 1 15 1C10.0294 1 6 5.02944 6 10V34C6 37.3137 8.68629 40 12 40C15.3137 40 18 37.3137 18 34V13"
                  stroke="#64748b"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                <path
                  d="M8 14V37C8 42.5228 12.4772 47 18 47C21.3137 47 24 44.3137 24 41V10C24 5.02944 19.9706 1 15 1C10.0294 1 6 5.02944 6 10V34C6 37.3137 8.68629 40 12 40C15.3137 40 18 37.3137 18 34V13"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeDasharray="12 6"
                />
              </svg>

              <div style={{
                width: '100%',
                height: '264px',
                backgroundColor: '#1b1611',
                border: '1px solid #8c7553',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {entity.avatar ? (
                  <img
                    src={entity.avatar}
                    alt={entity.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: isGraveyard ? 'grayscale(0.75) sepia(0.25) contrast(1.05)' : 'sepia(0.14) contrast(1.04)'
                    }}
                  />
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(130, 98, 58, 0.14)',
                      border: '2px dashed rgba(196, 165, 117, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'Cinzel', Georgia, serif",
                      fontSize: '36px',
                      fontWeight: 700,
                      color: '#d4b483'
                    }}>
                      {initialLetter}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: '#a8967a',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      lineHeight: 1.4
                    }}>
                      Sin fotografía<br />en archivo
                    </div>
                  </div>
                )}
              </div>

              <div style={{
                marginTop: '10px',
                textAlign: 'center',
                fontSize: '10.5px',
                fontFamily: "'Cinzel', Georgia, serif",
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#3b2917',
                textTransform: 'uppercase'
              }}>
                {classificationLabel}
              </div>
            </div>

            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '16px',
              fontSize: '10px',
              color: '#7c6244',
              fontFamily: "'Cinzel', Georgia, serif",
              letterSpacing: '0.08em'
            }}>
              FOL. 01
            </div>

            {leftLandShadowAlpha > 0.01 && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(90deg, rgba(30, 16, 4, ${leftLandShadowAlpha * 0.4}) 0%, rgba(30, 16, 4, ${leftLandShadowAlpha}) 100%)`,
                pointerEvents: 'none'
              }} />
            )}
          </div>

          {/* PÁGINA DERECHA BASE (Spread 2: Grimorio y Facultades Arcanas) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              width: '50%',
              height: '100%',
              ...PAPER_STYLE,
              border: '1px solid #b59a6e',
              borderLeft: 'none',
              borderRadius: '0 4px 4px 0',
              padding: '22px 24px 30px 24px',
              boxShadow: '3px 3px 0 rgba(226, 209, 176, 0.55), 6px 6px 18px rgba(32, 18, 6, 0.45), inset 16px 0 24px -12px rgba(68, 44, 18, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              color: '#23170d',
              pointerEvents: isSecondSpread && !isDragging ? 'auto' : 'none',
              zIndex: 1
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1.5px solid rgba(72, 48, 22, 0.32)',
              paddingBottom: '8px'
            }}>
              <div>
                <div style={{ fontSize: '9.5px', color: '#78350f', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {entity.name} • EXP-{dossierCode}
                </div>
                <div className="vtt-gothic-title" style={{ fontSize: '15px', color: '#1b1108', fontWeight: 800, textShadow: 'none', marginTop: '2px' }}>
                  Grimorio y Facultades Arcanas
                </div>
              </div>
              <span style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#5c3412',
                backgroundColor: 'rgba(130, 96, 52, 0.14)',
                border: '1px solid rgba(110, 78, 40, 0.32)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {(entity.spells || []).length} inscritos
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '2px' }}>
              {(entity.spells || []).length === 0 ? (
                <div style={{ fontSize: '12.5px', color: '#6e5235', fontStyle: 'italic', padding: '14px 0' }}>
                  Sin facultades ni hechizos arcanos registrados en este expediente.
                </div>
              ) : (
                (entity.spells || []).map(sp => (
                  <div key={sp.id} style={{
                    padding: '9px 12px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 251, 242, 0.68)',
                    border: '1px solid #c2ab83'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e1209' }}>{sp.name}</span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#7c2d12',
                        backgroundColor: 'rgba(180, 83, 9, 0.12)',
                        border: '1px solid rgba(180, 83, 9, 0.32)',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap'
                      }}>
                        {sp.cost}
                      </span>
                    </div>
                    {sp.desc && <div style={{ fontSize: '11.5px', color: '#4f3823', marginTop: '4px', lineHeight: 1.45 }}>{sp.desc}</div>}
                  </div>
                ))
              )}
            </div>

            <div style={{
              position: 'absolute',
              bottom: '10px',
              right: '16px',
              fontSize: '10px',
              color: '#7c6244',
              fontFamily: "'Cinzel', Georgia, serif",
              letterSpacing: '0.08em'
            }}>
              FOL. 04
            </div>

            {pageTurnShadowAlpha > 0.01 && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(90deg, rgba(28, 15, 4, ${pageTurnShadowAlpha}) 0%, rgba(28, 15, 4, ${pageTurnShadowAlpha * 0.25}) 100%)`,
                pointerEvents: 'none'
              }} />
            )}
          </div>

          {/* HOJA GIRATORIA 3D (Anverso = Datos básicos | Reverso = Equipo y Pertinencias) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              width: '50%',
              height: '100%',
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
              transform: `rotateY(${flipDeg}deg)`,
              transition: isDragging ? 'none' : 'transform 0.68s cubic-bezier(0.24, 0.82, 0.24, 1)',
              zIndex: 5,
              pointerEvents: 'none'
            }}
          >
            {/* CARA FRONTAL (Spread 1 derecha: Datos básicos y Crónica) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                ...PAPER_STYLE,
                border: '1px solid #b59a6e',
                borderLeft: 'none',
                borderRadius: '0 4px 4px 0',
                padding: '22px 28px 30px 24px',
                boxShadow: 'inset 16px 0 24px -12px rgba(68, 44, 18, 0.34), 4px 4px 16px rgba(32, 18, 6, 0.32)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                color: '#23170d',
                pointerEvents: (!isSecondSpread && !isDragging) ? 'auto' : 'none'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '10px',
                borderBottom: '2px solid rgba(72, 48, 22, 0.35)',
                paddingBottom: '11px'
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: '9.5px',
                    fontFamily: "'Cinzel', Georgia, serif",
                    color: isGraveyard ? '#8b1e1e' : '#78350f',
                    fontWeight: 800,
                    letterSpacing: '0.11em',
                    textTransform: 'uppercase'
                  }}>
                    {isGraveyard
                      ? `INFORME NECROLÓGICO • ${(entity.sceneName || 'Tablero').toUpperCase()}`
                      : `REGISTRO DE ARCHIVO • ${entity.faction === 'enemy' ? 'SUJETO HOSTIL' : 'ALIADO'}`}
                  </div>
                  <h2 className="vtt-gothic-title" style={{
                    margin: '3px 0 0 0',
                    fontSize: '23px',
                    lineHeight: 1.15,
                    color: '#1b1108',
                    textShadow: 'none'
                  }}>
                    {entity.name}
                  </h2>
                  {isGraveyard && entity.fallenAt && (
                    <div style={{ fontSize: '10.5px', color: '#6b4c32', marginTop: '3px', fontStyle: 'italic' }}>
                      Fallecido el {new Date(entity.fallenAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                    {renderHeaderActions()}
                  </div>
                  <div style={{
                    padding: '2px 8px',
                    border: '2px solid rgba(138, 38, 38, 0.62)',
                    borderRadius: '3px',
                    color: '#8a2626',
                    fontFamily: "'Cinzel', Georgia, serif",
                    fontSize: '9px',
                    fontWeight: 900,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    transform: 'rotate(-5deg)',
                    opacity: 0.85,
                    userSelect: 'none'
                  }}>
                    {isGraveyard ? 'BAJA' : 'ARCHIVADO'}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                borderTop: '1px solid rgba(90, 62, 32, 0.3)',
                borderBottom: '1px solid rgba(90, 62, 32, 0.3)',
                backgroundColor: 'rgba(130, 96, 52, 0.07)'
              }}>
                <div style={{ padding: '8px 10px', borderRight: '1px solid rgba(90, 62, 32, 0.22)' }}>
                  <div style={{ fontSize: '9px', color: '#6e5235', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>Clasificación</div>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#24170c', marginTop: '2px' }}>{classificationLabel}</div>
                </div>
                <div style={{ padding: '8px 10px', borderRight: '1px solid rgba(90, 62, 32, 0.22)' }}>
                  <div style={{ fontSize: '9px', color: '#6e5235', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>Año / Época</div>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#24170c', marginTop: '2px' }}>{entity.birthYear || 'Desconocido'}</div>
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ fontSize: '9px', color: '#6e5235', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>Protección</div>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: entity.hasArmor ? '#24170c' : '#6e5235', marginTop: '2px' }}>
                    {entity.hasArmor ? entity.armorType : 'Sin armadura'}
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  fontSize: '10px',
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontWeight: 800,
                  color: '#5c3412',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '6px'
                }}>
                  Crónica y Trasfondo
                </div>
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  paddingRight: '4px',
                  backgroundImage: 'repeating-linear-gradient(transparent, transparent 21px, rgba(105, 78, 46, 0.16) 22px)'
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: '12.5px',
                    lineHeight: '22px',
                    color: '#2d1f13',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {entity.history || 'Sin historia o descripción registrada todavía. Pulsa el icono del lápiz para documentar su trasfondo.'}
                  </p>
                </div>
              </div>

              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '22px',
                fontSize: '10px',
                color: '#7c6244',
                fontFamily: "'Cinzel', Georgia, serif",
                letterSpacing: '0.08em'
              }}>
                FOL. 02
              </div>

              <div
                onPointerDown={(e) => beginPageDrag(e, false)}
                onMouseEnter={() => setIsCornerHovered(true)}
                onMouseLeave={() => setIsCornerHovered(false)}
                title="Arrastra hacia la izquierda o haz clic para pasar de página"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: '32px',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  zIndex: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end'
                }}
              >
                <div style={{
                  width: '12px',
                  height: '58px',
                  borderRadius: '6px 0 0 6px',
                  background: isCornerHovered ? 'rgba(139, 90, 43, 0.34)' : 'rgba(139, 90, 43, 0.18)',
                  border: '1px solid rgba(110, 78, 40, 0.32)',
                  borderRight: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s ease'
                }}>
                  <span style={{ fontSize: '10px', color: '#4a3520', fontWeight: 900 }}>›</span>
                </div>

                <div style={{
                  position: 'absolute',
                  right: 0,
                  bottom: 0,
                  width: isCornerHovered ? '40px' : '30px',
                  height: isCornerHovered ? '40px' : '30px',
                  background: 'linear-gradient(135deg, #f6eedb 0%, #d9c298 49%, rgba(92, 62, 28, 0.32) 50%, #c6ac80 100%)',
                  borderTopLeftRadius: '4px',
                  boxShadow: '-3px -3px 8px rgba(45, 26, 8, 0.24)',
                  transition: 'width 0.18s ease, height 0.18s ease',
                  pointerEvents: 'none'
                }} />
              </div>

              {foldHighlightAlpha > 0.01 && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(90deg, rgba(255,255,255,0) 40%, rgba(255,248,230,${foldHighlightAlpha}) 100%)`,
                  pointerEvents: 'none'
                }} />
              )}
            </div>

            {/* REVERSO DE LA HOJA (Spread 2 izquierda: Equipo, Pertinencias y Notas de Campo) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                ...PAPER_STYLE,
                border: '1px solid #b59a6e',
                borderRight: 'none',
                borderRadius: '4px 0 0 4px',
                padding: '22px 24px 30px 28px',
                boxShadow: 'inset -16px 0 24px -12px rgba(68, 44, 18, 0.34), -4px 4px 16px rgba(32, 18, 6, 0.32)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                color: '#23170d',
                pointerEvents: (isSecondSpread && !isDragging) ? 'auto' : 'none'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1.5px solid rgba(72, 48, 22, 0.32)',
                paddingBottom: '8px'
              }}>
                <div>
                  <div style={{ fontSize: '9.5px', color: '#78350f', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    INVENTARIO DEL EXPEDIENTE
                  </div>
                  <div className="vtt-gothic-title" style={{ fontSize: '15px', color: '#1b1108', fontWeight: 800, textShadow: 'none', marginTop: '2px' }}>
                    {isGraveyard ? 'Botín Recuperable para Saqueo' : 'Equipo, Pertinencias y Armas'}
                  </div>
                </div>
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#5c3412',
                  backgroundColor: 'rgba(130, 96, 52, 0.14)',
                  border: '1px solid rgba(110, 78, 40, 0.32)',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {(entity.inventory || []).length} objetos
                </span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '2px' }}>
                {isGraveyard && (
                  <div style={{ fontSize: '11px', color: '#6b4c32', fontStyle: 'italic' }}>
                    Posesiones disponibles para recuperación o reparto por los investigadores.
                  </div>
                )}

                {(entity.inventory || []).length === 0 ? (
                  <div style={{ fontSize: '12.5px', color: '#6e5235', fontStyle: 'italic', padding: '8px 0' }}>
                    No se han registrado objetos ni pertrechos en este expediente.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {renderInventoryGroup('Lleva Encima', equippedItems)}
                    {renderInventoryGroup('A Mano / Inmediato', handItems)}
                    {renderInventoryGroup('Guardado / Almacén', storedItems, true)}
                  </div>
                )}

                {entity.notes && (
                  <div style={{
                    marginTop: '6px',
                    paddingTop: '10px',
                    borderTop: '1px dashed rgba(90, 62, 32, 0.32)'
                  }}>
                    <div className="vtt-gothic-title" style={{ fontSize: '11.5px', color: '#5c3412', fontWeight: 800, textShadow: 'none', marginBottom: '4px' }}>
                      Notas de Campo y Apuntes
                    </div>
                    <p style={{
                      margin: 0,
                      fontSize: '12px',
                      lineHeight: '20px',
                      color: '#2d1f13',
                      whiteSpace: 'pre-wrap',
                      backgroundImage: 'repeating-linear-gradient(transparent, transparent 19px, rgba(105, 78, 46, 0.14) 20px)'
                    }}>
                      {entity.notes}
                    </p>
                  </div>
                )}
              </div>

              <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '16px',
                fontSize: '10px',
                color: '#7c6244',
                fontFamily: "'Cinzel', Georgia, serif",
                letterSpacing: '0.08em'
              }}>
                FOL. 03
              </div>

              <div
                onPointerDown={(e) => beginPageDrag(e, true)}
                onMouseEnter={() => setIsCornerHovered(true)}
                onMouseLeave={() => setIsCornerHovered(false)}
                title="Arrastra hacia la derecha o haz clic para volver a la portada del expediente"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: '32px',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  zIndex: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start'
                }}
              >
                <div style={{
                  width: '12px',
                  height: '58px',
                  borderRadius: '0 6px 6px 0',
                  background: isCornerHovered ? 'rgba(139, 90, 43, 0.34)' : 'rgba(139, 90, 43, 0.18)',
                  border: '1px solid rgba(110, 78, 40, 0.32)',
                  borderLeft: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s ease'
                }}>
                  <span style={{ fontSize: '10px', color: '#4a3520', fontWeight: 900 }}>‹</span>
                </div>

                <div style={{
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  width: isCornerHovered ? '40px' : '30px',
                  height: isCornerHovered ? '40px' : '30px',
                  background: 'linear-gradient(225deg, #f6eedb 0%, #d9c298 49%, rgba(92, 62, 28, 0.32) 50%, #c6ac80 100%)',
                  borderTopRightRadius: '4px',
                  boxShadow: '3px -3px 8px rgba(45, 26, 8, 0.24)',
                  transition: 'width 0.18s ease, height 0.18s ease',
                  pointerEvents: 'none'
                }} />
              </div>

              {foldHighlightAlpha > 0.01 && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(270deg, rgba(255,255,255,0) 40%, rgba(255,248,230,${foldHighlightAlpha}) 100%)`,
                  pointerEvents: 'none'
                }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DossierBookView;
