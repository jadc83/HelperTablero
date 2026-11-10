import { Sparkles, X } from 'lucide-react';

/**
 * Pestaña de Grimorio de Hechizos (personajes) o Poderes y Conjuros (criaturas).
 */
const GrimoireTab = ({
  isMonster,
  spells,
  setSpells,
  newSpellName,
  setNewSpellName,
  newSpellCost,
  setNewSpellCost,
  newSpellDesc,
  setNewSpellDesc
}) => {
  const handleAddSpell = () => {
    if (!newSpellName.trim()) return;
    setSpells([
      ...spells,
      { id: Date.now(), name: newSpellName.trim(), cost: newSpellCost.trim() || '1 MP', desc: newSpellDesc.trim() }
    ]);
    setNewSpellName('');
    setNewSpellDesc('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: '#141822', padding: '14px', borderRadius: '10px', border: '1px solid #2c3344', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newSpellName}
            onChange={(e) => setNewSpellName(e.target.value)}
            placeholder={isMonster ? 'Nombre del poder, don o conjuro de los Mitos...' : 'Nombre del hechizo, cántico o ritual...'}
            style={{ flex: 1, padding: '8px 12px', background: '#0e1017', color: '#f8fafc', border: '1px solid #333a4d', borderRadius: '7px', fontSize: '13px' }}
          />
          <input
            type="text"
            value={newSpellCost}
            onChange={(e) => setNewSpellCost(e.target.value)}
            placeholder="Coste (ej. 3 MP / 2 SAN)"
            style={{ width: '160px', padding: '8px 12px', background: '#0e1017', color: '#93c5fd', border: '1px solid #333a4d', borderRadius: '7px', fontSize: '13px' }}
          />
          <button
            type="button"
            onClick={handleAddSpell}
            className="vtt-primary-cta"
            style={{ padding: '8px 16px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}
          >
            + Inscribir {isMonster ? 'Poder' : 'Hechizo'}
          </button>
        </div>
        <input
          type="text"
          value={newSpellDesc}
          onChange={(e) => setNewSpellDesc(e.target.value)}
          placeholder="Efecto, alcance o descripción del conjuro..."
          style={{ width: '100%', padding: '8px 12px', background: '#0e1017', color: '#cbd5e1', border: '1px solid #333a4d', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {spells.map(sp => (
          <div key={sp.id} style={{ background: '#141822', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Sparkles size={13} strokeWidth={2.2} style={{ color: '#fbbf24' }} /> {sp.name}
                </span>
                <span className="vtt-retro-badge" style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>
                  {sp.cost}
                </span>
              </div>
              {sp.desc && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', lineHeight: 1.4 }}>{sp.desc}</div>}
            </div>
            <button
              type="button"
              onClick={() => setSpells(spells.filter(s => s.id !== sp.id))}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
              title="Eliminar"
            >
              <X size={15} strokeWidth={2.3} />
            </button>
          </div>
        ))}
        {spells.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '13px', border: '1px dashed #2c3344', borderRadius: '10px' }}>
            {isMonster ? 'Esta criatura no tiene poderes o conjuros inscritos.' : 'Este personaje no tiene hechizos inscritos en su grimorio.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default GrimoireTab;
