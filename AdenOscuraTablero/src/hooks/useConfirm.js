import { createContext, useContext } from 'react';

export const ConfirmContext = createContext(null);

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    return async ({ message }) => window.confirm(message || '¿Confirmar acción?');
  }
  return ctx;
};
