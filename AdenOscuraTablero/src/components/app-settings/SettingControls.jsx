const ROW_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  padding: '10px 0',
  borderBottom: '1px solid var(--vtt-border-subtle)'
};

export const SettingSection = ({ title, description, children }) => (
  <div
    style={{
      backgroundColor: 'var(--vtt-bg-card)',
      border: '1px solid var(--vtt-border)',
      borderRadius: '10px',
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }}
  >
    <div style={{ marginBottom: '6px' }}>
      <div className="vtt-gothic-title" style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--vtt-gold-light)' }}>
        {title}
      </div>
      {description && (
        <div style={{ fontSize: '11.5px', color: 'var(--vtt-text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
          {description}
        </div>
      )}
    </div>
    {children}
  </div>
);

export const SettingToggle = ({ label, description, checked, onChange }) => (
  <div style={ROW_STYLE}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--vtt-text-strong)' }}>{label}</div>
      {description && (
        <div style={{ fontSize: '11px', color: 'var(--vtt-text-dim)', marginTop: '2px', lineHeight: 1.35 }}>
          {description}
        </div>
      )}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={Boolean(checked)}
      onClick={() => onChange(!checked)}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '999px',
        padding: '2px',
        border: `1px solid ${checked ? 'var(--vtt-gold)' : 'var(--vtt-border)'}`,
        backgroundColor: checked ? 'var(--vtt-gold-soft)' : 'var(--vtt-bg-inset)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: checked ? 'flex-end' : 'flex-start',
        transition: 'all 0.15s ease',
        flexShrink: 0
      }}
    >
      <span
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: checked ? 'var(--vtt-gold-light)' : 'var(--vtt-text-dim)',
          boxShadow: checked ? '0 0 8px rgba(251, 191, 36, 0.55)' : 'none',
          transition: 'all 0.15s ease'
        }}
      />
    </button>
  </div>
);

export const SettingSlider = ({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  formatValue,
  onChange,
  disabled = false
}) => (
  <div style={{ ...ROW_STYLE, opacity: disabled ? 0.45 : 1 }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--vtt-text-strong)' }}>{label}</span>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--vtt-gold-light)',
            backgroundColor: 'var(--vtt-gold-soft)',
            border: '1px solid var(--vtt-gold)',
            borderRadius: '4px',
            padding: '1px 7px'
          }}
        >
          {formatValue ? formatValue(value) : value}
        </span>
      </div>
      {description && (
        <div style={{ fontSize: '11px', color: 'var(--vtt-text-dim)', marginTop: '2px', lineHeight: 1.35 }}>
          {description}
        </div>
      )}
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className="vtt-brass-slider"
      style={{ width: '150px', flexShrink: 0, cursor: disabled ? 'not-allowed' : 'pointer' }}
    />
  </div>
);

export const SettingSelect = ({ label, description, value, options, onChange }) => (
  <div style={ROW_STYLE}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--vtt-text-strong)' }}>{label}</div>
      {description && (
        <div style={{ fontSize: '11px', color: 'var(--vtt-text-dim)', marginTop: '2px', lineHeight: 1.35 }}>
          {description}
        </div>
      )}
    </div>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '6px 10px',
        borderRadius: '6px',
        backgroundColor: 'var(--vtt-input-bg)',
        color: 'var(--vtt-input-text)',
        border: '1px solid var(--vtt-input-border)',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        outline: 'none',
        minWidth: '205px',
        flexShrink: 0
      }}
    >
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

export const SettingColorPicker = ({ label, description, value, presets = [], onChange }) => (
  <div style={ROW_STYLE}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--vtt-text-strong)' }}>{label}</div>
      {description && (
        <div style={{ fontSize: '11px', color: 'var(--vtt-text-dim)', marginTop: '2px', lineHeight: 1.35 }}>
          {description}
        </div>
      )}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
      {presets.map((p) => {
        const active = value.toLowerCase() === p.color.toLowerCase();
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.color)}
            title={p.label}
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: p.color,
              border: active ? '2px solid var(--vtt-gold-light)' : '1px solid var(--vtt-border-strong)',
              boxShadow: active ? '0 0 8px rgba(251, 191, 36, 0.7)' : 'none',
              cursor: 'pointer',
              padding: 0
            }}
          />
        );
      })}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        title="Color personalizado"
        style={{
          width: '26px',
          height: '24px',
          padding: 0,
          border: '1px solid var(--vtt-border-strong)',
          borderRadius: '5px',
          backgroundColor: 'transparent',
          cursor: 'pointer'
        }}
      />
    </div>
  </div>
);
