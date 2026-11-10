import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import ConfirmProvider from './components/ui/ConfirmContext.jsx';
import AppSettingsProvider from './contexts/AppSettingsContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppSettingsProvider>
      <ConfirmProvider>
        <App />
      </ConfirmProvider>
    </AppSettingsProvider>
  </StrictMode>,
);
