import { AlertTriangle } from 'lucide-react';
import ModalShell from './ModalShell';

/**
 * Diálogo de confirmación homogéneo para reemplazar window.confirm y temporizadores dispares.
 */
const ConfirmDialog = ({
  isOpen,
  title = 'Confirmar acción',
  message = '',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  onConfirm,
  onCancel,
  zIndex = 120000
}) => {
  const isDanger = tone === 'danger';

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      icon={<AlertTriangle size={18} strokeWidth={2.2} style={{ color: isDanger ? '#f87171' : '#fbbf24' }} />}
      width="420px"
      zIndex={zIndex}
      closeOnBackdrop={true}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="vtt-brass-btn"
            style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={isDanger ? 'vtt-danger-plate-btn' : 'vtt-primary-cta'}
            style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ fontSize: '13px', lineHeight: 1.55, color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
        {message}
      </p>
    </ModalShell>
  );
};

export default ConfirmDialog;
