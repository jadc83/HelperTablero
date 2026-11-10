import { Check, Palette } from 'lucide-react';
import { BOARD_SURFACE_OPTIONS, THEME_OPTIONS } from '../../constants/appSettings';
import { SettingSection } from './SettingControls';

const AppearanceSettingsTab = ({ settings, updateSettings }) => {
  const currentTheme = settings.theme || 'dark';
  const currentSurface = settings.boardSurface || 'dark_wood';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <SettingSection
        title="Tema Visual de la Interfaz"
        description="Cambia el esquema de colores de toda la aplicación (menús, paneles, formularios y ventana de jugadores)."
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '6px' }}>
          {THEME_OPTIONS.map((themeOpt) => {
            const isSelected = currentTheme === themeOpt.id;
            const [bg, panel, border, accent, text] = themeOpt.swatches;
            return (
              <button
                key={themeOpt.id}
                type="button"
                onClick={() => updateSettings({ theme: themeOpt.id })}
                style={{
                  textAlign: 'left',
                  padding: '12px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--vtt-gold-soft)' : 'var(--vtt-bg-inset)',
                  border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? 'var(--vtt-gold)' : 'var(--vtt-border)'}`,
                  color: 'var(--vtt-text)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Mini vista previa del esquema */}
                <div
                  style={{
                    width: '100%',
                    height: '58px',
                    borderRadius: '7px',
                    backgroundColor: bg,
                    border: `1.5px solid ${border}`,
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ width: '48%', height: '6px', borderRadius: '3px', backgroundColor: text, opacity: 0.88 }} />
                    <div style={{ width: '16px', height: '6px', borderRadius: '3px', backgroundColor: accent }} />
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <div style={{ flex: 1, height: '24px', borderRadius: '4px', backgroundColor: panel, border: `1px solid ${border}` }} />
                    <div style={{ width: '28px', height: '24px', borderRadius: '4px', backgroundColor: accent, opacity: 0.9 }} />
                  </div>
                </div>

                {/* Título y estado */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: isSelected ? 'var(--vtt-gold-light)' : 'var(--vtt-text-strong)' }}>
                      {themeOpt.label}
                    </span>
                    {isSelected && (
                      <span
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--vtt-gold)',
                          color: themeOpt.id === 'high-contrast' ? '#000000' : '#ffffff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Check size={12} strokeWidth={2.8} />
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--vtt-text-muted)', marginTop: '4px', lineHeight: 1.35 }}>
                    {themeOpt.description}
                  </div>
                </div>

                {/* Paleta de muestras */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: 'auto' }}>
                  <Palette size={11} style={{ color: 'var(--vtt-text-dim)' }} />
                  {themeOpt.swatches.map((hex, i) => (
                    <span
                      key={i}
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: hex,
                        border: '1px solid var(--vtt-border-strong)'
                      }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </SettingSection>

      <SettingSection
        title="Superficie y Textura del Tablero"
        description="Elige el acabado de fondo de la mesa virtual debajo de mapas, cuadrícula y fichas (también sincronizado con Jugadores)."
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '6px' }}>
          {BOARD_SURFACE_OPTIONS.map((surfaceOpt) => {
            const isSelected = currentSurface === surfaceOpt.id;
            return (
              <button
                key={surfaceOpt.id}
                type="button"
                onClick={() => updateSettings({ boardSurface: surfaceOpt.id })}
                style={{
                  textAlign: 'left',
                  padding: '10px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--vtt-gold-soft)' : 'var(--vtt-bg-inset)',
                  border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? 'var(--vtt-gold)' : 'var(--vtt-border)'}`,
                  color: 'var(--vtt-text)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '62px',
                    borderRadius: '7px',
                    border: '1px solid var(--vtt-border-strong)',
                    backgroundImage: `${surfaceOpt.overlay}, url("${surfaceOpt.image}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {isSelected && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--vtt-gold)',
                        color: '#ffffff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.5)'
                      }}
                    >
                      <Check size={12} strokeWidth={2.8} />
                    </span>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: isSelected ? 'var(--vtt-gold-light)' : 'var(--vtt-text-strong)' }}>
                    {surfaceOpt.label}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--vtt-text-muted)', marginTop: '2px', lineHeight: 1.35 }}>
                    {surfaceOpt.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </SettingSection>
    </div>
  );
};

export default AppearanceSettingsTab;
