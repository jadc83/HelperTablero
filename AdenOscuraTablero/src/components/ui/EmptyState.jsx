/**
 * Estado vacío homogéneo para listados, bibliotecas y paneles sin elementos.
 */
const EmptyState = ({
  icon = null,
  title,
  description = null,
  action = null,
  style = undefined
}) => {
  return (
    <div
      style={{
        padding: '22px 16px',
        borderRadius: '8px',
        border: '1px dashed #2b3448',
        backgroundColor: 'rgba(13, 17, 25, 0.72)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '8px',
        color: '#94a3b8',
        ...style
      }}
    >
      {icon && (
        <div style={{ color: '#64748b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      )}
      {title && (
        <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#cbd5e1' }}>
          {title}
        </div>
      )}
      {description && (
        <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.45, maxWidth: '340px' }}>
          {description}
        </div>
      )}
      {action && <div style={{ marginTop: '4px' }}>{action}</div>}
    </div>
  );
};

export default EmptyState;
