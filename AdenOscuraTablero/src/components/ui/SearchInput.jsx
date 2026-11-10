import { Search, X } from 'lucide-react';

/**
 * Campo de búsqueda reutilizable con icono izquierdo y botón de limpieza rápido.
 */
const SearchInput = ({
  value,
  onChange,
  placeholder = 'Buscar...',
  style = undefined,
  inputStyle = undefined,
  autoFocus = false
}) => {
  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      <Search
        size={13}
        strokeWidth={2.2}
        style={{
          position: 'absolute',
          left: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--vtt-text-dim)',
          pointerEvents: 'none'
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: '100%',
          padding: value ? '7px 28px 7px 30px' : '7px 10px 7px 30px',
          borderRadius: '6px',
          backgroundColor: 'var(--vtt-input-bg)',
          border: '1px solid var(--vtt-input-border)',
          color: 'var(--vtt-input-text)',
          fontSize: '12px',
          boxSizing: 'border-box',
          ...inputStyle
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          title="Limpiar búsqueda"
          aria-label="Limpiar búsqueda"
          style={{
            position: 'absolute',
            right: '6px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '20px',
            height: '20px',
            padding: 0,
            border: 'none',
            borderRadius: '4px',
            background: 'transparent',
            color: 'var(--vtt-text-muted)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={13} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
