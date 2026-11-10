import {
  GRID_COLOR_PRESETS,
  GRID_VISIBILITY_OPTIONS,
  MEASURE_UNIT_OPTIONS,
  formatBoardDistance
} from '../../constants/appSettings';
import {
  SettingColorPicker,
  SettingSection,
  SettingSelect,
  SettingSlider,
  SettingToggle
} from './SettingControls';

const BoardSettingsTab = ({ settings, updateSettings }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <SettingSection
      title="Cuadrícula Táctica"
      description="Personaliza cómo y cuándo se dibujan las líneas de cuadrícula sobre el mapa."
    >
      <SettingSelect
        label="Visibilidad de líneas de cuadrícula"
        description="Puedes mantener las líneas visibles aunque desactives el imán magnético en la barra inferior."
        value={settings.gridVisibility}
        options={GRID_VISIBILITY_OPTIONS}
        onChange={(v) => updateSettings({ gridVisibility: v })}
      />
      <SettingSlider
        label="Tamaño de casilla (cuadrícula)"
        description="Escala en píxeles de cada celda para el ajuste magnético y el tamaño base de las fichas."
        value={settings.gridSize}
        min={20}
        max={150}
        step={5}
        formatValue={(v) => `${v} px`}
        onChange={(v) => updateSettings({ gridSize: v })}
      />
      <SettingColorPicker
        label="Color de cuadrícula"
        description="Elige un tono con buen contraste según tus mapas habituales."
        value={settings.gridColor}
        presets={GRID_COLOR_PRESETS}
        onChange={(v) => updateSettings({ gridColor: v })}
      />
      <SettingSlider
        label="Opacidad de líneas"
        description="Transparencia de la rejilla sobre la textura del mapa."
        value={settings.gridOpacity}
        min={0.05}
        max={0.85}
        step={0.05}
        formatValue={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => updateSettings({ gridOpacity: v })}
      />
    </SettingSection>

    <SettingSection
      title="Regla y Escala de Distancias"
      description={`Vista previa actual de 3 casillas: ${formatBoardDistance(3, settings, true)}`}
    >
      <SettingSelect
        label="Sistema de unidades"
        description="Afecta a la regla táctica y a las etiquetas de movimiento en combate."
        value={settings.measureUnit}
        options={MEASURE_UNIT_OPTIONS}
        onChange={(v) => updateSettings({ measureUnit: v })}
      />
      <SettingSlider
        label="Metros por casilla"
        description="Equivalencia métrica de una casilla estándar."
        value={settings.metersPerSquare}
        min={0.5}
        max={10}
        step={0.5}
        formatValue={(v) => `${v} m`}
        disabled={settings.measureUnit === 'feet' || settings.measureUnit === 'squares'}
        onChange={(v) => updateSettings({ metersPerSquare: v })}
      />
      <SettingSlider
        label="Pies por casilla"
        description="Equivalencia en pies (ft) de una casilla estándar."
        value={settings.feetPerSquare}
        min={1}
        max={30}
        step={1}
        formatValue={(v) => `${v} ft`}
        disabled={settings.measureUnit === 'meters' || settings.measureUnit === 'squares'}
        onChange={(v) => updateSettings({ feetPerSquare: v })}
      />
    </SettingSection>

    <SettingSection
      title="Fichas Recién Colocadas"
      description="Opciones visuales iniciales al arrastrar personajes o criaturas al tablero."
    >
      <SettingToggle
        label="Mostrar nombre debajo de la ficha"
        description="Activa la etiqueta con el nombre por defecto al desplegar fichas."
        checked={settings.defaultShowTokenName}
        onChange={(v) => updateSettings({ defaultShowTokenName: v })}
      />
      <SettingToggle
        label="Mostrar barras de estado por defecto"
        description="Muestra barras de vida/cordura nada más soltar una ficha."
        checked={settings.defaultShowTokenBars}
        onChange={(v) => updateSettings({ defaultShowTokenBars: v })}
      />
    </SettingSection>
  </div>
);

export default BoardSettingsTab;
