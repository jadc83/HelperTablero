/**
 * Control deslizante con etiqueta y lectura numérica monoespaciada.
 */
const SliderControl = ({
  label,
  value,
  unit = '',
  min,
  max,
  step = 1,
  onChange,
  title,
  sliderWidth = '84px',
  labelWidth = undefined
}) => {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11.5px',
        color: '#94a3b8',
        fontWeight: 600,
        cursor: 'pointer'
      }}
      title={title}
    >
      {label && (
        <span style={labelWidth ? { minWidth: labelWidth } : undefined}>
          {label}: <strong className="vtt-retro-badge" style={{ color: '#f8fafc' }}>{value}{unit}</strong>
        </span>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="vtt-brass-slider"
        style={{ width: sliderWidth }}
      />
    </label>
  );
};

export default SliderControl;
