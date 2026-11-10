import { Volume2 } from 'lucide-react';
import { SettingSection, SettingSlider, SettingToggle } from './SettingControls';
import { playerSoundEngine } from '../../utils/soundEngine';

const AudioSettingsTab = ({ settings, updateSettings }) => {
  const handleTestSfx = () => {
    playerSoundEngine.updateSettings({
      masterVolume: settings.masterVolume,
      ambientVolume: settings.ambientVolume,
      sfxVolume: settings.sfxVolume,
      isMuted: false
    });
    playerSoundEngine.play('sfx_magic');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <SettingSection
        title="Niveles de Volumen"
        description="Controla en tiempo real la mezcla de ambientes en bucle y efectos del Órgano de Ecos."
      >
        <SettingSlider
          label="Volumen Maestro"
          description="Nivel general aplicado a todo el audio de la mesa."
          value={settings.masterVolume}
          min={0}
          max={100}
          step={5}
          formatValue={(v) => `${v}%`}
          onChange={(v) => updateSettings({ masterVolume: v })}
        />
        <SettingSlider
          label="Ambiente y Música en Bucle"
          description="Lluvia, viento, hoguera, mazmorra o pistas personalizadas en loop."
          value={settings.ambientVolume}
          min={0}
          max={100}
          step={5}
          formatValue={(v) => `${v}%`}
          onChange={(v) => updateSettings({ ambientVolume: v })}
        />
        <SettingSlider
          label="Efectos Puntuales (SFX)"
          description="Puertas, cristales, armas, hechizos y rugidos lanzados desde los ecos o el mapa."
          value={settings.sfxVolume}
          min={0}
          max={100}
          step={5}
          formatValue={(v) => `${v}%`}
          onChange={(v) => updateSettings({ sfxVolume: v })}
        />
        <div style={{ paddingTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleTestSfx}
            className="vtt-brass-btn"
            style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', gap: '6px' }}
          >
            <Volume2 size={14} strokeWidth={2.2} /> Probar volumen de efecto
          </button>
        </div>
      </SettingSection>

      <SettingSection
        title="Enrutado entre Ventanas"
        description="Elige dónde deben reproducirse los sonidos durante la partida."
      >
        <SettingToggle
          label="Silenciar Vista de Jugadores"
          description="Detiene el audio en la pantalla proyectada para jugadores sin detener los indicadores del Máster."
          checked={settings.mutePlayerAudio}
          onChange={(v) => updateSettings({ mutePlayerAudio: v })}
        />
        <SettingToggle
          label="Escuchar también en la Pantalla del Máster"
          description="Reproduce localmente efectos y ambientes en la ventana del Máster (útil si usas auriculares o juegas a una pantalla)."
          checked={settings.playAudioOnMaster}
          onChange={(v) => updateSettings({ playAudioOnMaster: v })}
        />
      </SettingSection>
    </div>
  );
};

export default AudioSettingsTab;
