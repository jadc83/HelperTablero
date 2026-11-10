import { DICE_COLOR_PRESETS } from '../../constants/appSettings';
import {
  SettingColorPicker,
  SettingSection,
  SettingSelect,
  SettingSlider,
  SettingToggle
} from './SettingControls';

const DICE_TARGET_OPTIONS = [
  { id: 'auto', label: 'Jugadores si está conectada (Auto)' },
  { id: 'local_master', label: 'Siempre en pantalla del Máster' }
];

const DiceSettingsTab = ({ settings, updateSettings }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <SettingSection
      title="Motor Físico de Dados 3D"
      description="Personaliza la apariencia, física y velocidad de las tiradas desde el cubilete o fichas."
    >
      <SettingToggle
        label="Activar dados 3D animados"
        description="Si se desactiva, las tiradas se resuelven al instante en 2D sin cargar física 3D ni sobrecargar GPU."
        checked={settings.dice3DEnabled}
        onChange={(v) => updateSettings({ dice3DEnabled: v })}
      />
      <SettingColorPicker
        label="Color de los dados 3D"
        description="Material principal de los dados al rodar por la mesa."
        value={settings.diceThemeColor}
        presets={DICE_COLOR_PRESETS}
        onChange={(v) => updateSettings({ diceThemeColor: v })}
      />
      <SettingSlider
        label="Tamaño de los dados"
        description="Escala del modelo 3D sobre la pantalla."
        value={settings.diceScale}
        min={4}
        max={12}
        step={1}
        formatValue={(v) => `${v}x`}
        disabled={!settings.dice3DEnabled}
        onChange={(v) => updateSettings({ diceScale: v })}
      />
      <SettingSlider
        label="Fuerza de lanzamiento"
        description="Velocidad e impulso con el que salen disparados los dados."
        value={settings.diceThrowForce}
        min={2}
        max={10}
        step={1}
        formatValue={(v) => `${v}/10`}
        disabled={!settings.dice3DEnabled}
        onChange={(v) => updateSettings({ diceThrowForce: v })}
      />
    </SettingSection>

    <SettingSection
      title="Visualización y Comportamiento"
      description="Cómo se muestran los resultados tras cada tirada."
    >
      <SettingSelect
        label="Destino de las tiradas públicas"
        description="Decide dónde se anima la tirada cuando pulsas 'Tirada Pública'."
        value={settings.dicePublicTarget}
        options={DICE_TARGET_OPTIONS}
        onChange={(v) => updateSettings({ dicePublicTarget: v })}
      />
      <SettingSlider
        label="Duración del aviso en pantalla"
        description="Tiempo que permanece visible la notificación flotante tras una tirada."
        value={settings.diceResultDurationMs}
        min={1500}
        max={10000}
        step={500}
        formatValue={(v) => `${(v / 1000).toFixed(1)}s`}
        onChange={(v) => updateSettings({ diceResultDurationMs: v })}
      />
    </SettingSection>
  </div>
);

export default DiceSettingsTab;
