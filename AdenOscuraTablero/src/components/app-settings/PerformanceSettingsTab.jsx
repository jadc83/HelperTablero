import { LIVING_FOG_QUALITY_OPTIONS } from '../../constants/appSettings';
import { SettingSection, SettingSelect, SettingSlider, SettingToggle } from './SettingControls';

const PerformanceSettingsTab = ({ settings, updateSettings }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <SettingSection
      title="Niebla de Guerra y Rendimiento Gráfico"
      description="Equilibra atmósfera visual y fluidez en portátiles o pantallas de doble monitor."
    >
      <SettingSlider
        label="Opacidad de niebla para el Máster"
        description="Oscuridad de las zonas no reveladas en tu pantalla (los jugadores siempre ven niebla 100% opaca)."
        value={settings.masterFogOpacity}
        min={0.2}
        max={0.95}
        step={0.05}
        formatValue={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => updateSettings({ masterFogOpacity: v })}
      />
      <SettingSelect
        label="Calidad de Bruma Viva (WebGL)"
        description="Limita los FPS del shader volumétrico o desactívalo globalmente para ahorrar batería y GPU."
        value={settings.livingFogQuality}
        options={LIVING_FOG_QUALITY_OPTIONS}
        onChange={(v) => updateSettings({ livingFogQuality: v })}
      />
      <SettingToggle
        label="Partículas de clima atmosférico"
        description="Renderiza lluvia, tormenta, nieve, ceniza o esporas animadas sobre el tablero."
        checked={settings.weatherEffectsEnabled}
        onChange={(v) => updateSettings({ weatherEffectsEnabled: v })}
      />
    </SettingSection>

    <SettingSection
      title="Tamaño Inicial de Puertas y Ventanas"
      description="Dimensiones por defecto al arrastrar elementos arquitectónicos nuevos desde la barra lateral."
    >
      <SettingSlider
        label="Ancho inicial de puertas"
        description="Longitud de la hoja y marco al soltar una puerta nueva."
        value={settings.defaultDoorWidth}
        min={20}
        max={100}
        step={2}
        formatValue={(v) => `${v}px`}
        onChange={(v) => updateSettings({ defaultDoorWidth: v })}
      />
      <SettingSlider
        label="Grosor inicial de puertas"
        description="Espesor del marco al soltar una puerta nueva."
        value={settings.defaultDoorThickness}
        min={4}
        max={24}
        step={1}
        formatValue={(v) => `${v}px`}
        onChange={(v) => updateSettings({ defaultDoorThickness: v })}
      />
      <SettingSlider
        label="Ancho inicial de ventanas"
        description="Longitud inicial al soltar una ventana nueva."
        value={settings.defaultWindowWidth}
        min={20}
        max={100}
        step={2}
        formatValue={(v) => `${v}px`}
        onChange={(v) => updateSettings({ defaultWindowWidth: v })}
      />
      <SettingSlider
        label="Grosor inicial de ventanas"
        description="Espesor del marco al soltar una ventana nueva."
        value={settings.defaultWindowThickness}
        min={4}
        max={24}
        step={1}
        formatValue={(v) => `${v}px`}
        onChange={(v) => updateSettings({ defaultWindowThickness: v })}
      />
    </SettingSection>
  </div>
);

export default PerformanceSettingsTab;
