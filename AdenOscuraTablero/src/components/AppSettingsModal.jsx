import { useState } from 'react';
import { Palette, Volume2, Grid, Dices, Sparkles, Database, SlidersHorizontal } from 'lucide-react';
import { useAppSettings } from '../hooks/useAppSettings';
import ModalShell from './ui/ModalShell';
import AppearanceSettingsTab from './app-settings/AppearanceSettingsTab';
import AudioSettingsTab from './app-settings/AudioSettingsTab';
import BoardSettingsTab from './app-settings/BoardSettingsTab';
import DiceSettingsTab from './app-settings/DiceSettingsTab';
import PerformanceSettingsTab from './app-settings/PerformanceSettingsTab';
import SystemSettingsTab from './app-settings/SystemSettingsTab';

const SETTINGS_TABS = [
  { id: 'appearance', label: 'Apariencia y Tema', icon: Palette },
  { id: 'audio', label: 'Audio y Ecos', icon: Volume2 },
  { id: 'board', label: 'Tablero y Regla', icon: Grid },
  { id: 'dice', label: 'Dados 3D', icon: Dices },
  { id: 'performance', label: 'Niebla y Rendimiento', icon: Sparkles },
  { id: 'system', label: 'Ventanas y Datos', icon: Database }
];

const AppSettingsModal = ({ isOpen, onClose, onManualSaveCampaign = null }) => {
  const [activeTab, setActiveTab] = useState('appearance');
  const [toast, setToast] = useState(null);
  const {
    settings,
    updateSettings,
    resetFloatingPositions,
    resetSettings,
    importSettings
  } = useAppSettings();

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Configuración de la Aplicación"
      subtitle="Preferencias globales independientes de cada campaña"
      icon={<SlidersHorizontal size={18} strokeWidth={2.2} />}
      width="860px"
      maxWidth="95vw"
      maxHeight="88vh"
      zIndex={100000}
      bodyStyle={{ padding: 0, display: 'flex', minHeight: '500px', maxHeight: '72vh', overflow: 'hidden' }}
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span style={{ fontSize: '11.5px', color: toast ? 'var(--vtt-gold-light)' : 'var(--vtt-text-dim)', fontWeight: toast ? 600 : 400 }}>
            {toast || 'Todos los cambios se aplican y guardan automáticamente.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="vtt-brass-btn"
            style={{ padding: '7px 18px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}
          >
            Listo
          </button>
        </div>
      }
    >
      {/* Menú Lateral de Categorías */}
      <aside
        style={{
          width: '220px',
          flexShrink: 0,
          backgroundColor: 'var(--vtt-bg-inset)',
          borderRight: '1px solid var(--vtt-border-subtle)',
          padding: '14px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          overflowY: 'auto'
        }}
      >
        {SETTINGS_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: isActive ? '1px solid var(--vtt-gold)' : '1px solid transparent',
                backgroundColor: isActive ? 'var(--vtt-gold-soft)' : 'transparent',
                color: isActive ? 'var(--vtt-gold-light)' : 'var(--vtt-text-muted)',
                fontSize: '12.5px',
                fontWeight: isActive ? 700 : 600,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <IconComponent size={15} strokeWidth={2.2} style={{ flexShrink: 0 }} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </aside>

      {/* Contenido de la Categoría Seleccionada */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: '16px 20px',
          overflowY: 'auto',
          backgroundColor: 'var(--vtt-bg-panel)'
        }}
      >
        {activeTab === 'appearance' && (
          <AppearanceSettingsTab settings={settings} updateSettings={updateSettings} />
        )}
        {activeTab === 'audio' && (
          <AudioSettingsTab settings={settings} updateSettings={updateSettings} />
        )}
        {activeTab === 'board' && (
          <BoardSettingsTab settings={settings} updateSettings={updateSettings} />
        )}
        {activeTab === 'dice' && (
          <DiceSettingsTab settings={settings} updateSettings={updateSettings} />
        )}
        {activeTab === 'performance' && (
          <PerformanceSettingsTab settings={settings} updateSettings={updateSettings} />
        )}
        {activeTab === 'system' && (
          <SystemSettingsTab
            settings={settings}
            updateSettings={updateSettings}
            resetFloatingPositions={resetFloatingPositions}
            resetSettings={resetSettings}
            importSettings={importSettings}
            onManualSaveCampaign={onManualSaveCampaign}
            onNotify={notify}
          />
        )}
      </div>
    </ModalShell>
  );
};

export default AppSettingsModal;
