import React, { useState, useRef, useEffect, useMemo } from 'react';

const SearchableCombobox = ({
  value = '',
  onChange,
  options = [],
  placeholder = 'Selecciona o escribe...',
  label = '',
  icon = null,
  style = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrado de opciones por categoría
  const filteredGroups = useMemo(() => {
    const q = (filterText || '').trim().toLowerCase();
    if (!q) return options;

    const result = [];
    options.forEach(group => {
      const matchingItems = group.items.filter(item =>
        item.toLowerCase().includes(q)
      );
      if (matchingItems.length > 0) {
        result.push({
          category: group.category,
          items: matchingItems
        });
      }
    });
    return result;
  }, [options, filterText]);

  const handleSelect = (item) => {
    onChange(item);
    setFilterText('');
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);
    setFilterText(val);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
      {label && (
        <label style={{
          fontSize: '11px',
          color: '#93c5fd',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginBottom: '4px'
        }}>
          {icon && <span>{icon}</span>}
          <span>{label}</span>
        </label>
      )}

      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        background: '#181c26',
        border: isOpen ? '1px solid #f59e0b' : '1px solid #333a4d',
        borderRadius: '7px',
        boxShadow: isOpen ? '0 0 8px rgba(245, 158, 11, 0.25)' : 'none',
        transition: 'all 0.15s ease'
      }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            setFilterText('');
            setIsOpen(true);
          }}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '8px 30px 8px 10px',
            background: 'transparent',
            border: 'none',
            color: '#f8fafc',
            fontSize: '12.5px',
            fontWeight: 600,
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />

        {/* Botón borrar o desplegar */}
        <div style={{
          position: 'absolute',
          right: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setFilterText('');
                inputRef.current?.focus();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '11px',
                padding: '2px',
                lineHeight: 1
              }}
              title="Borrar"
            >
              ✕
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '9px',
              padding: '2px',
              lineHeight: 1
            }}
          >
            {isOpen ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Menú Flotante de Opciones con Categorías */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          maxHeight: '260px',
          overflowY: 'auto',
          background: '#121622',
          border: '1px solid #3b4254',
          borderRadius: '8px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.85), 0 0 1px rgba(255,255,255,0.1)',
          zIndex: 100010,
          padding: '6px 0'
        }}>
          {filteredGroups.length === 0 ? (
            <div style={{ padding: '10px 12px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
              Sin coincidencias de catálogo. Puedes dejar tu texto personalizado libremente.
            </div>
          ) : (
            filteredGroups.map(group => (
              <div key={group.category} style={{ marginBottom: '6px' }}>
                <div style={{
                  padding: '4px 12px',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#fbbf24',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  background: 'rgba(245, 158, 11, 0.08)',
                  borderBottom: '1px solid rgba(245, 158, 11, 0.15)'
                }}>
                  {group.category}
                </div>
                {group.items.map(item => {
                  const isSelected = item === value;
                  return (
                    <div
                      key={item}
                      onClick={() => handleSelect(item)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        color: isSelected ? '#fbbf24' : '#e2e8f0',
                        fontWeight: isSelected ? 700 : 500,
                        backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.1s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isSelected ? 'rgba(245, 158, 11, 0.25)' : '#1e2436';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isSelected ? 'rgba(245, 158, 11, 0.15)' : 'transparent';
                      }}
                    >
                      <span>{item}</span>
                      {isSelected && <span style={{ fontSize: '11px', color: '#fbbf24' }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableCombobox;
