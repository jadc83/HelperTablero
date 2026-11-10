import { useRef, useState } from 'react';
import { ImagePlus, Lock, X } from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';

const PRESET_ICONS = ['🩸', '🤢', '💫', '🔥', '🛡️', '⚔️', '👁️', '🕸️', '❄️', '💤', '💀', '🎯', '💔', '⚡'];

const StatusesTab = ({ customStatuses = [], onAddCustomStatus, onRemoveCustomStatus, notify }) => {
  const [statusIcon, setStatusIcon] = useState('🩸');
  const [statusLabel, setStatusLabel] = useState('');
  const [statusEffect, setStatusEffect] = useState('none');
  const statusIconInputRef = useRef(null);
  const confirm = useConfirm();

  const handleStatusIconUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 64, 64);
        setStatusIcon(canvas.toDataURL('image/webp', 0.85));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleStatusSubmit = (e) => {
    e.preventDefault();
    if (!statusLabel.trim() || !statusIcon.trim()) return;
    onAddCustomStatus({
      id: `custom_${Date.now()}`,
      icon: statusIcon.trim(),
      label: statusLabel.trim(),
      effect: statusEffect
    });
    setStatusLabel('');
    notify('Condición añadida');
  };

  const handleRemoveStatus = async (status) => {
    if (!onRemoveCustomStatus) return;
    const ok = await confirm({
      title: 'Eliminar condición',
      message: `¿Eliminar la condición "${status.label}" de la mesa?`,
      confirmLabel: 'Eliminar',
      tone: 'danger'
    });
    if (ok) onRemoveCustomStatus(status.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflow: 'hidden' }}>
      <div className="vtt-wood-panel" style={{ padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflow: 'hidden' }}>
        <div>
          <div className="vtt-gothic-title" style={{ fontSize: '13px', color: 'var(--vtt-accent-amber)', fontWeight: 'bold' }}>
            Estados Alterados y Condiciones de Combate
          </div>
          <div style={{ fontSize: '11px', color: 'var(--vtt-text-muted)', marginTop: '2px' }}>
            Se asignan haciendo clic derecho sobre cualquier ficha en el tablero
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {PRESET_ICONS.map(icon => (
            <button
              key={icon}
              type="button"
              onClick={() => setStatusIcon(icon)}
              style={{
                background: statusIcon === icon ? 'var(--vtt-accent-amber-bg)' : 'var(--vtt-btn-bg)',
                border: statusIcon === icon ? '1px solid var(--vtt-gold)' : '1px solid var(--vtt-btn-border)',
                borderRadius: '6px',
                padding: '5px 7px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {icon}
            </button>
          ))}
          <button
            type="button"
            onClick={() => statusIconInputRef.current.click()}
            title="Subir icono de imagen personalizado"
            className="vtt-brass-btn"
            style={{ borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
          >
            <ImagePlus size={12} strokeWidth={2.2} /> Subir Icono
          </button>
          <input type="file" accept="image/*" ref={statusIconInputRef} onChange={handleStatusIconUpload} style={{ display: 'none' }} />
        </div>

        <form onSubmit={handleStatusSubmit} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <div style={{
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--vtt-input-bg)',
            border: '1px solid var(--vtt-gold)',
            borderRadius: '6px',
            flexShrink: 0
          }}>
            {statusIcon.startsWith('data:image') ? (
              <img src={statusIcon} alt="Custom Icon" style={{ width: '24px', height: '24px', borderRadius: '2px', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '16px' }}>{statusIcon}</span>
            )}
          </div>
          <input
            type="text"
            value={statusLabel}
            onChange={(e) => setStatusLabel(e.target.value)}
            placeholder="Nombre (ej. Envenenado, Aturdido)..."
            style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'var(--vtt-input-bg)', color: 'var(--vtt-input-text)', border: '1px solid var(--vtt-input-border)', fontSize: '12px' }}
          />
          <select
            value={statusEffect}
            onChange={(e) => setStatusEffect(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', background: 'var(--vtt-input-bg)', color: 'var(--vtt-input-text)', border: '1px solid var(--vtt-input-border)', fontSize: '11px' }}
          >
            <option value="none">Visual</option>
            <option value="immobilize">Inmoviliza</option>
          </select>
          <button type="submit" className="vtt-primary-cta" style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
            + Añadir
          </button>
        </form>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1, overflowY: 'auto', alignContent: 'flex-start', paddingTop: '4px' }}>
          {customStatuses.map(status => {
            const isImage = status.icon.startsWith('data:image');
            return (
              <div key={status.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--vtt-bg-card)', border: '1px solid var(--vtt-border)', color: 'var(--vtt-text)', padding: '6px 10px', borderRadius: '7px', fontSize: '12px' }}>
                {isImage ? <img src={status.icon} style={{ width: '16px', height: '16px', borderRadius: '2px', objectFit: 'cover' }} alt="" /> : <span>{status.icon}</span>}
                <span style={{ fontWeight: 600 }}>{status.label}</span>
                {status.effect === 'immobilize' && <span style={{ fontSize: '10px', color: 'var(--vtt-accent-red)' }}><Lock size={11} strokeWidth={2.2} /></span>}
                <button
                  type="button"
                  onClick={() => handleRemoveStatus(status)}
                  style={{ background: 'none', border: 'none', color: 'var(--vtt-accent-red)', cursor: 'pointer', padding: '2px', display: 'inline-flex' }}
                  title={`Eliminar "${status.label}"`}
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatusesTab;
