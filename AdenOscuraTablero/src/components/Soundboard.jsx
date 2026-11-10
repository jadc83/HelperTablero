import { useEffect, useRef, useState } from 'react';
import { Music, Square, X, Repeat, FolderOpen, VolumeX, Volume2, AlertTriangle, Trash2 } from 'lucide-react';
import { SOUND_CATALOG } from '../constants/gamePresets';
import { useConfirm } from '../hooks/useConfirm';
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
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: '65px',
            right: isSettingsOpen ? '526px' : '16px',
            transition: 'right 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
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
              border: '1.5px solid #334155',
              borderRadius: '10px',
              padding: '15px',
              color: '#e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'linear-gradient(180deg, #161b26 0%, #0d1017 100%)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.92)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #242d3f', paddingBottom: '9px' }}>
              <span className="vtt-gothic-title" style={{ fontWeight: 'bold', fontSize: '14px', color: '#f8fafc', display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                <Music size={15} strokeWidth={2.2} style={{ color: '#fbbf24' }} /> Órgano de Ecos
              </span>
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
            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#0c0f16', padding: '4px', borderRadius: '7px', border: '1px solid #242c3d' }}>
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
                    border: activeCategory === cat ? '1px solid #f59e0b' : '1px solid transparent',
                    cursor: 'pointer',
                    background: activeCategory === cat ? 'rgba(245, 158, 11, 0.16)' : 'transparent',
                    color: activeCategory === cat ? '#fbbf24' : '#94a3b8',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Formulario para subir audio ligero (.ogg / .mp3) en la pestaña Propios */}
            {activeCategory === 'Propios' && (
              <div style={{ backgroundColor: '#10141e', border: '1px solid #263044', borderRadius: '7px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={newSoundIcon}
                    onChange={(e) => setNewSoundIcon(e.target.value)}
                    placeholder="🎵"
                    style={{ width: '42px', padding: '6px', textAlign: 'center', backgroundColor: '#161b26', color: '#f8fafc', border: '1px solid #2b3345', borderRadius: '5px' }}
                    title="Icono del sonido"
                  />
                  <input
                    type="text"
                    value={newSoundLabel}
                    onChange={(e) => setNewSoundLabel(e.target.value)}
                    placeholder="Nombre (opcional)..."
                    style={{ flex: 1, padding: '6px 8px', backgroundColor: '#161b26', color: '#f8fafc', border: '1px solid #2b3345', borderRadius: '5px', fontSize: '12px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#cbd5e1', cursor: 'pointer' }}>
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
                  <div style={{ fontSize: '11px', color: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
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
                      border: isLooping ? '1px solid #f59e0b' : '1px solid #2b3345',
                      backgroundColor: isLooping ? 'rgba(245, 158, 11, 0.16)' : '#171c26',
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
                        color: isLooping ? '#fef08a' : '#e2e8f0',
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
                      {isLooping && <span style={{ color: '#fbbf24', fontSize: '9px' }}>●</span>}
                    </button>

                    {activeCategory === 'Propios' && onRemoveCustomSound && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSound(sound)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          borderLeft: '1px solid #263044',
                          color: '#fca5a5',
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

            <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', borderTop: '1px solid #242c3d', paddingTop: '8px' }}>
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
