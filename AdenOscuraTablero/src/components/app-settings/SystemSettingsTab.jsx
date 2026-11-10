import { useEffect, useState } from 'react';
import { Download, RotateCcw, Save, Upload, Layout } from 'lucide-react';
import { AUTOSAVE_INTERVAL_OPTIONS } from '../../constants/appSettings';
import { openCampaignDB } from '../../utils/campaignStorage';
import { exportJSON, importJSON } from '../../utils/fileDialog';
import { useConfirm } from '../../hooks/useConfirm';
import { SettingSection, SettingSelect, SettingToggle } from './SettingControls';

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const measureLocalStorageBytes = () => {
  try {
    let total = 0;
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i) || '';
      const v = window.localStorage.getItem(k) || '';
      total += (k.length + v.length) * 2;
    }
    return total;
  } catch {
    return 0;
  }
};

const SystemSettingsTab = ({
  settings,
  updateSettings,
  resetFloatingPositions,
  resetSettings,
  importSettings,
  onManualSaveCampaign,
  onNotify
}) => {
  const confirm = useConfirm();
  const [storageInfo, setStorageInfo] = useState({
    localBytes: 0,
    snapshotsCount: 0,
    quotaUsageBytes: null,
    quotaTotalBytes: null
  });

  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      const localBytes = measureLocalStorageBytes();
      let snapshotsCount = 0;
      let quotaUsageBytes = null;
      let quotaTotalBytes = null;

      try {
        const db = await openCampaignDB();
        snapshotsCount = await new Promise((resolve) => {
          const tx = db.transaction('campaign_snapshots', 'readonly');
          const req = tx.objectStore('campaign_snapshots').count();
          req.onsuccess = () => resolve(req.result || 0);
          req.onerror = () => resolve(0);
        });
      } catch {
        snapshotsCount = 0;
      }

      if (navigator.storage?.estimate) {
        try {
          const est = await navigator.storage.estimate();
          if (Number.isFinite(est?.usage)) quotaUsageBytes = est.usage;
          if (Number.isFinite(est?.quota)) quotaTotalBytes = est.quota;
        } catch {
          /* ignore */
        }
      }

      if (mounted) {
        setStorageInfo({ localBytes, snapshotsCount, quotaUsageBytes, quotaTotalBytes });
      }
    };

    loadStats();
    return () => {
      mounted = false;
    };
  }, []);

  const floatingCount = Object.keys(settings.floatingPositions || {}).length;

  const handleExportSettings = async () => {
    const res = await exportJSON(
      `grimorio_config_${new Date().toISOString().slice(0, 10)}.json`,
      settings
    );
    if (res?.success && onNotify) {
      onNotify(`Preferencias exportadas: ${res.filename}`);
    }
  };

  const handleImportSettings = async () => {
    const res = await importJSON({ accept: '.json', description: 'Configuración VTT (*.json)' });
    if (res?.success && res.text) {
      try {
        const parsed = JSON.parse(res.text);
        importSettings(parsed);
        if (onNotify) onNotify('Preferencias importadas correctamente');
      } catch {
        if (onNotify) onNotify('El archivo JSON no contiene una configuración válida');
      }
    }
  };

  const handleResetAll = async () => {
    const ok = await confirm({
      title: 'Restaurar configuración predeterminada',
      message: 'Se restablecerán las preferencias de audio, cuadrícula, dados 3D, niebla, ventanas y auto-guardado a sus valores iniciales. Tu campaña actual no se borrará.',
      confirmLabel: 'Restaurar',
      tone: 'warning'
    });
    if (ok) {
      resetSettings();
      if (onNotify) onNotify('Preferencias restauradas a valores de fábrica');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <SettingSection
        title="Ventanas Flotantes"
        description="Controla si el Cubilete de Dados y el Órgano de Ecos recuerdan dónde los arrastraste."
      >
        <SettingToggle
          label="Recordar posición de paneles flotantes"
          description="Mantiene guardada la ubicación del Cubilete y de Ecos al cerrar o recargar la aplicación."
          checked={settings.rememberFloatingPositions}
          onChange={(v) => updateSettings({ rememberFloatingPositions: v })}
        />
        <div style={{ paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
            Posiciones personalizadas guardadas: <strong style={{ color: '#e2e8f0' }}>{floatingCount}</strong>
          </span>
          <button
            type="button"
            disabled={floatingCount === 0}
            onClick={() => {
              resetFloatingPositions();
              if (onNotify) onNotify('Posiciones de ventanas flotantes restablecidas');
            }}
            className="vtt-brass-btn"
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: floatingCount === 0 ? 'not-allowed' : 'pointer',
              opacity: floatingCount === 0 ? 0.5 : 1,
              gap: '6px'
            }}
          >
            <Layout size={13} strokeWidth={2.2} /> Restablecer posiciones
          </button>
        </div>
      </SettingSection>

      <SettingSection
        title="Auto-guardado y Almacenamiento"
        description="Ajusta la frecuencia de guardado automático en IndexedDB para evitar tirones con mapas pesados."
      >
        <SettingToggle
          label="Auto-guardado en segundo plano"
          description="Guarda automáticamente escenas, fichas y mapas mientras editas."
          checked={settings.autoSaveEnabled}
          onChange={(v) => updateSettings({ autoSaveEnabled: v })}
        />
        <SettingSelect
          label="Cadencia de auto-guardado"
          description="El intervalo largo reduce escrituras si manejas mapas de alta resolución."
          value={String(settings.autoSaveIntervalMs)}
          options={AUTOSAVE_INTERVAL_OPTIONS.map((o) => ({ id: String(o.id), label: o.label }))}
          onChange={(v) => updateSettings({ autoSaveIntervalMs: Number(v) })}
        />
        <div
          style={{
            marginTop: '8px',
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: 'var(--vtt-bg-inset)',
            border: '1px solid var(--vtt-border)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            fontSize: '11.5px'
          }}
        >
          <div>
            <div style={{ color: 'var(--vtt-text-dim)', fontSize: '10.5px' }}>Preferencias / Cache</div>
            <div style={{ color: 'var(--vtt-text-strong)', fontWeight: 700, marginTop: '2px' }}>
              {formatBytes(storageInfo.localBytes)}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--vtt-text-dim)', fontSize: '10.5px' }}>Copias en IndexedDB</div>
            <div style={{ color: 'var(--vtt-gold-light)', fontWeight: 700, marginTop: '2px' }}>
              {storageInfo.snapshotsCount} crónicas
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--vtt-text-dim)', fontSize: '10.5px' }}>Uso total estimado</div>
            <div style={{ color: 'var(--vtt-info)', fontWeight: 700, marginTop: '2px' }}>
              {storageInfo.quotaUsageBytes !== null
                ? `${formatBytes(storageInfo.quotaUsageBytes)}${storageInfo.quotaTotalBytes ? ` / ${formatBytes(storageInfo.quotaTotalBytes)}` : ''}`
                : 'No disponible'}
            </div>
          </div>
        </div>
        {onManualSaveCampaign && (
          <div style={{ paddingTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onManualSaveCampaign}
              className="vtt-brass-btn"
              style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', gap: '6px', color: '#86efac', borderColor: '#10b981' }}
            >
              <Save size={13} strokeWidth={2.2} /> Guardar sesión en BD ahora
            </button>
          </div>
        )}
      </SettingSection>

      <SettingSection
        title="Copia de Preferencias"
        description="Exporta o importa tu perfil de configuración de la app entre ordenadores."
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
          <button
            type="button"
            onClick={handleExportSettings}
            className="vtt-brass-btn"
            style={{ padding: '7px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', gap: '6px' }}
          >
            <Download size={13} strokeWidth={2.2} /> Exportar configuración (.json)
          </button>
          <button
            type="button"
            onClick={handleImportSettings}
            className="vtt-brass-btn"
            style={{ padding: '7px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', gap: '6px' }}
          >
            <Upload size={13} strokeWidth={2.2} /> Importar configuración
          </button>
          <button
            type="button"
            onClick={handleResetAll}
            className="vtt-btn-danger"
            style={{ padding: '7px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', gap: '6px', marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', fontWeight: 600, color: '#ffffff' }}
          >
            <RotateCcw size={13} strokeWidth={2.2} /> Restaurar por defecto
          </button>
        </div>
      </SettingSection>
    </div>
  );
};

export default SystemSettingsTab;
