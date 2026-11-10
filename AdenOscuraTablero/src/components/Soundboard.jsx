import { useEffect, useRef, useState } from 'react';
import { Music, Grip, Square, X, Repeat, FolderOpen, VolumeX, Volume2, AlertTriangle, Trash2 } from 'lucide-react';
import { SOUND_CATALOG } from '../constants/gamePresets';
import { useConfirm } from '../hooks/useConfirm';
import { useDraggablePanel } from '../hooks/useDraggablePanel';
import EmptyState from './ui/EmptyState';

const MAX_AUDIO_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5 MB máximo para mantener ligereza

const Soundboard = ({
  isOpen,
  onClose,
  onTriggerSound,
  onStopAllSounds,
  activeLoops = [],
  masterToast,
  customSounds = [],
  onAddCustomSound,
  onRemoveCustomSound,
  isSettingsOpen = false
}) => {
  const [activeCategory, setActiveCategory] = useState('Ambiente');
  const [newSoundLabel, setNewSoundLabel] = useState('');
  const [newSoundIcon, setNewSoundIcon] = useState('🎵');
  const [newSoundLoop, setNewSoundLoop] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  const confirm = useConfirm();
  const { panelRef, panelPos, isDragging, gripProps } = useDraggablePanel('soundboard', {
    fallbackWidth: 360,
    fallbackHeight: 460
  });

  const categories = ['Ambiente', 'Entorno', 'Combate', 'Criaturas', 'Propios'];

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

  const handleAudioFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadError(null);

    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      setUploadError('El archivo supera 1.5 MB. Usa un .ogg o .mp3 corto y ligero.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const cleanName = newSoundLabel.trim() || file.name.replace(/\.[^/.]+$/, '').slice(0, 18);
      const customObj = {
        id: `custom_snd_${Date.now()}`,
        label: cleanName,
        icon: newSoundIcon.trim() || '🎵',
        category: 'Propios',
        loop: newSoundLoop,
        audioDataUrl: evt.target.result
      };
      if (onAddCustomSound) onAddCustomSound(customObj);
      setNewSoundLabel('');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveSound = async (sound) => {
    if (!onRemoveCustomSound) return;
    const ok = await confirm({
      title: 'Eliminar sonido',
      message: `¿Eliminar el sonido personalizado "${sound.label}"?`,
      confirmLabel: 'Eliminar',
      tone: 'danger'
    });
    if (ok) onRemoveCustomSound(sound.id);
  };

  const displayedSounds = activeCategory === 'Propios'
    ? customSounds
    : SOUND_CATALOG.filter(s => s.category === activeCategory);

  return (
    <>
      {/* Toast Informativo Exclusivo para la Pantalla del Master */}
      {masterToast && (
        <div style={{
          position: 'fixed',
          top: '72px',
          right: '24px',
          background: 'linear-gradient(180deg, rgba(22, 27, 38, 0.97) 0%, rgba(12, 15, 22, 0.98) 100%)',
          border: '1px solid #3b4254',
          borderLeft: '4px solid #f59e0b',
          borderRadius: '8px',
          padding: '10px 16px',
          color: '#f8fafc',
          zIndex: 110000,
          boxShadow: '0 12px 30px rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          pointerEvents: 'none'
        }}>
          <span style={{
            width: '30px',
            height: '30px',
            borderRadius: '7px',
            background: 'rgba(245, 158, 11, 0.14)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fbbf24',
            flexShrink: 0
          }}>
            {typeof masterToast.icon === 'string' && masterToast.icon !== '🔊' && masterToast.icon !== '⚜️'
              ? <span style={{ fontSize: '15px', lineHeight: 1 }}>{masterToast.icon}</span>
              : <Volume2 size={16} strokeWidth={2.2} />}
          </span>
          <div>
            <div className="vtt-gothic-title" style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase' }}>
              Mesa del Director
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#f8fafc' }}>
              {masterToast.label}
            </div>
          </div>
        </div>
      )}

      {/* Panel Flotante de Efectos de Sonido */}
      {isOpen && (
        <div
          ref={panelRef}
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            ...(panelPos
              ? {
                  left: `${panelPos.x}px`,
                  top: `${panelPos.y}px`
                }
              : {
                  top: '65px',
                  right: isSettingsOpen ? '526px' : '16px',
                  transition: 'right 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
                }),
            zIndex: 5500,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end'
          }}
        >
          <div
            className="vtt-wood-panel"
            style={{
              width: '360px',
              maxWidth: 'calc(100vw - 32px)',
              border: '1.5px solid var(--vtt-border-strong)',
              borderRadius: '10px',
              padding: '15px',
              color: 'var(--vtt-text)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'var(--vtt-bg-panel-gradient)',
              boxShadow: 'var(--vtt-shadow-panel)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--vtt-border-subtle)', paddingBottom: '9px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div
                  {...gripProps}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    color: isDragging ? 'var(--vtt-info)' : 'var(--vtt-text-dim)',
                    padding: '4px',
                    marginLeft: '-4px',
                    borderRadius: '4px',
                    backgroundColor: isDragging ? 'rgba(2, 132, 199, 0.25)' : 'transparent',
                    touchAction: 'none',
                    userSelect: 'none',
                    transition: 'color 0.15s ease, background-color 0.15s ease'
                  }}
                  title="Arrastra desde aquí para mover el Órgano de Ecos (doble clic para restaurar)"
                  aria-label="Mover Órgano de Ecos"
                >
                  <Grip size={14} strokeWidth={2.2} />
                </div>
                <Music size={15} strokeWidth={2.2} style={{ color: 'var(--vtt-gold-light)' }} />
                <span className="vtt-gothic-title" style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--vtt-text-strong)' }}>
                  Órgano de Ecos
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {activeLoops.length > 0 && (
                  <button
                    type="button"
                    onClick={onStopAllSounds}
                    className="vtt-btn-danger"
                    style={{ borderRadius: '5px', padding: '4px 9px', fontSize: '11px', cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Square size={10} strokeWidth={2.4} /> Silenciar
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="vtt-brass-btn"
                  style={{ width: '28px', height: '28px', padding: 0, borderRadius: '6px', cursor: 'pointer' }}
                  title="Cerrar (Esc)"
                  aria-label="Cerrar"
                >
                  <X size={14} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* Pestañas de Categorías */}
            <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--vtt-bg-inset)', padding: '4px', borderRadius: '7px', border: '1px solid var(--vtt-border)' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { setActiveCategory(cat); setUploadError(null); }}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    borderRadius: '5px',
                    border: activeCategory === cat ? '1px solid var(--vtt-gold)' : '1px solid transparent',
                    cursor: 'pointer',
                    background: activeCategory === cat ? 'var(--vtt-accent-amber-bg)' : 'transparent',
                    color: activeCategory === cat ? 'var(--vtt-accent-amber)' : 'var(--vtt-text-muted)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Formulario para subir audio ligero (.ogg / .mp3) en la pestaña Propios */}
            {activeCategory === 'Propios' && (
              <div style={{ backgroundColor: 'var(--vtt-bg-card)', border: '1px solid var(--vtt-border)', borderRadius: '7px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={newSoundIcon}
                    onChange={(e) => setNewSoundIcon(e.target.value)}
                    placeholder="🎵"
                    style={{ width: '42px', padding: '6px', textAlign: 'center', backgroundColor: 'var(--vtt-input-bg)', color: 'var(--vtt-input-text)', border: '1px solid var(--vtt-input-border)', borderRadius: '5px' }}
                    title="Icono del sonido"
                  />
                  <input
                    type="text"
                    value={newSoundLabel}
                    onChange={(e) => setNewSoundLabel(e.target.value)}
                    placeholder="Nombre (opcional)..."
                    style={{ flex: 1, padding: '6px 8px', backgroundColor: 'var(--vtt-input-bg)', color: 'var(--vtt-input-text)', border: '1px solid var(--vtt-input-border)', borderRadius: '5px', fontSize: '12px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--vtt-text)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newSoundLoop}
                      onChange={(e) => setNewSoundLoop(e.target.checked)}
                    />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Repeat size={12} strokeWidth={2.2} /> En bucle</span>
                  </label>

                  <input
                    type="file"
                    accept=".ogg,.mp3,.wav,audio/ogg,audio/mpeg,audio/wav"
                    ref={fileInputRef}
                    onChange={handleAudioFileUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="vtt-primary-cta"
                    style={{ padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px' }}
                  >
                    <FolderOpen size={12} strokeWidth={2.2} /> Subir audio (≤1.5MB)
                  </button>
                </div>

                {uploadError && (
                  <div style={{ fontSize: '11px', color: 'var(--vtt-accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <AlertTriangle size={12} strokeWidth={2.2} />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Botonera de Sonidos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', maxHeight: '240px', overflowY: 'auto' }}>
              {displayedSounds.map(sound => {
                const isLooping = activeLoops.includes(sound.id);
                return (
                  <div
                    key={sound.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '6px',
                      border: isLooping ? '1px solid var(--vtt-gold)' : '1px solid var(--vtt-border)',
                      backgroundColor: isLooping ? 'var(--vtt-accent-amber-bg)' : 'var(--vtt-bg-card)',
                      overflow: 'hidden'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onTriggerSound(sound)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '8px 9px',
                        background: 'transparent',
                        border: 'none',
                        color: isLooping ? 'var(--vtt-accent-amber-soft)' : 'var(--vtt-text)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: 600,
                        overflow: 'hidden'
                      }}
                    >
                      <span style={{ fontSize: '15px', lineHeight: 1 }}>{sound.icon}</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sound.label}
                      </span>
                      {isLooping && <span style={{ color: 'var(--vtt-accent-amber)', fontSize: '9px' }}>●</span>}
                    </button>

                    {activeCategory === 'Propios' && onRemoveCustomSound && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSound(sound)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          borderLeft: '1px solid var(--vtt-border-subtle)',
                          color: 'var(--vtt-accent-red)',
                          cursor: 'pointer',
                          padding: '8px 7px',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                        title="Eliminar sonido personalizado"
                      >
                        <Trash2 size={12} strokeWidth={2.2} />
                      </button>
                    )}
                  </div>
                );
              })}
              {activeCategory === 'Propios' && customSounds.length === 0 && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <EmptyState
                    icon={<Music size={22} strokeWidth={1.8} />}
                    title="Sin sonidos propios"
                    description="Sube archivos .ogg o .mp3 cortos para usarlos en la mesa o en el menú radial."
                  />
                </div>
              )}
            </div>

            <div style={{ fontSize: '11px', color: 'var(--vtt-text-muted)', textAlign: 'center', borderTop: '1px solid var(--vtt-border-subtle)', paddingTop: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                <VolumeX size={13} strokeWidth={2.2} /> Silenciado en la mesa del Master para evitar eco.
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Soundboard;
