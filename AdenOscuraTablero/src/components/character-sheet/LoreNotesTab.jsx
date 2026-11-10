/**
 * Pestaña de Historia Personal/Biografía y Apuntes de Partida (o Fisiología y Tácticas para criaturas).
 */
const LoreNotesTab = ({ isMonster, history, setHistory, notes, setNotes }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '12px', fontWeight: 700, color: isMonster ? '#ef4444' : '#f59e0b' }}>
        {isMonster ? 'Descripción, Fisiología y Manifestación' : 'Historia Personal y Biografía'}
      </label>
      <textarea
        value={history}
        onChange={(e) => setHistory(e.target.value)}
        placeholder={isMonster
          ? 'Detalles anatómicos blasfemos, olor, secreciones, anatomía alienígena o corrupta, sonidos emitidos y perturbación ambiental...'
          : 'Origen, familia, traumas, motivaciones y pasado del personaje...'}
        style={{ flex: 1, minHeight: '220px', padding: '12px', background: '#141822', color: '#f8fafc', border: '1px solid #2c3344', borderRadius: '10px', resize: 'none', fontSize: '13px', lineHeight: 1.5 }}
      />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '12px', fontWeight: 700, color: isMonster ? '#fbbf24' : '#60a5fa' }}>
        {isMonster ? 'Comportamiento, Tácticas del Guardián y Debilidades' : 'Notas, Pistas y Apuntes de Partida'}
      </label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={isMonster
          ? 'Patrones de ataque, debilidades elementales, motivaciones primigenias, destierros y pistas clave para el Guardián...'
          : 'Contactos, deudas, cicatrices, secretos o efectos temporales...'}
        style={{ flex: 1, minHeight: '220px', padding: '12px', background: '#141822', color: '#f8fafc', border: '1px solid #2c3344', borderRadius: '10px', resize: 'none', fontSize: '13px', lineHeight: 1.5 }}
      />
    </div>
  </div>
);

export default LoreNotesTab;
