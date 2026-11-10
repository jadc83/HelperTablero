import { useCallback, useRef, useState } from 'react';
import ConfirmDialog from './ConfirmDialog';
import { ConfirmContext } from '../../hooks/useConfirm';

const ConfirmProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((options) => {
    const normalized = typeof options === 'string'
      ? { message: options }
      : (options || {});

    return new Promise((resolve) => {
      if (resolverRef.current) {
        resolverRef.current(false);
      }
      resolverRef.current = resolve;
      setDialogState({
        title: normalized.title || 'Confirmar acción',
        message: normalized.message || '',
        confirmLabel: normalized.confirmLabel || 'Confirmar',
        cancelLabel: normalized.cancelLabel || 'Cancelar',
        tone: normalized.tone || 'danger'
      });
    });
  }, []);

  const handleClose = useCallback((result) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setDialogState(null);
    if (resolve) resolve(result);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        isOpen={Boolean(dialogState)}
        title={dialogState?.title}
        message={dialogState?.message}
        confirmLabel={dialogState?.confirmLabel}
        cancelLabel={dialogState?.cancelLabel}
        tone={dialogState?.tone}
        onConfirm={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </ConfirmContext.Provider>
  );
};

export default ConfirmProvider;
