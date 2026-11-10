import { Swords, Zap, MapPin, X } from 'lucide-react';

/**
 * Pestaña de Ataques y Habilidades de Combate para criaturas y bestiario.
 */
const CreatureAttacksTab = ({
  attacks,
  setAttacks,
  newAttackName,
  setNewAttackName,
  newAttackDamage,
  setNewAttackDamage,
  newAttackRange,
  setNewAttackRange,
  newAttackDesc,
  setNewAttackDesc
}) => {
  const quickPresets = [
    { label: '+ Garra (1D6)', name: 'Zarpazo', damage: '1D6+BD', range: 'Cuerpo a cuerpo', desc: 'Ataque con garras afiladas' },
    { label: '+ Mordisco (1D8)', name: 'Mordisco Desgarrador', damage: '1D8', range: 'Cuerpo a cuerpo', desc: 'Mordedura voraz contra el objetivo' },
    { label: '+ Tentáculo', name: 'Tentáculo Envolvente', damage: '1D6 + Presa', range: '2 casillas', desc: 'Atrapa e inmoviliza a la víctima' },
    { label: '+ Ácido (2D6)', name: 'Escupitajo Cáustico / Ácido', damage: '2D6', range: '4 casillas', desc: 'Rociada corrosiva a distancia' }
  ];

  const handleAddAttack = () => {
    if (!newAttackName.trim()) return;
    setAttacks(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        name: newAttackName.trim(),
        damage: newAttackDamage.trim() || '1D6',
        range: newAttackRange.trim() || 'Cuerpo a cuerpo',
        desc: newAttackDesc.trim()
      }
    ]);
    setNewAttackName('');
    setNewAttackDamage('1D6');
    setNewAttackRange('Cuerpo a cuerpo');
    setNewAttackDesc('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{
        background: '#141822',
        border: '1px solid #2a3346',
        borderRadius: '10px',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Swords size={13} strokeWidth={2.2} /> Acciones Ofensivas y Habilidades de Combate
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            Ataques naturales, zarpazos, mordiscos, presas y rasgos especiales en mesa
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Añadir rápido:</span>
          {quickPresets.map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => setAttacks(prev => [...prev, { id: Date.now() + Math.random(), name: p.name, damage: p.damage, range: p.range, desc: p.desc }])}
              className="vtt-brass-btn"
              style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '5px' }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        background: '#161b26',
        border: '1px solid #283348',
        borderRadius: '10px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>+ Inscribir Nuevo Ataque o Rasgo</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={newAttackName}
            onChange={(e) => setNewAttackName(e.target.value)}
            placeholder="Nombre del ataque (ej. Espolón venenoso)"
            style={{ padding: '7px 9px', background: '#0e1017', color: '#f8fafc', border: '1px solid #333a4d', borderRadius: '6px', fontSize: '12px' }}
          />
          <input
            type="text"
            value={newAttackDamage}
            onChange={(e) => setNewAttackDamage(e.target.value)}
            placeholder="Daño (ej. 1D8+2, 2D6)"
            style={{ padding: '7px 9px', background: '#0e1017', color: '#f8fafc', border: '1px solid #333a4d', borderRadius: '6px', fontSize: '12px' }}
          />
          <input
            type="text"
            value={newAttackRange}
            onChange={(e) => setNewAttackRange(e.target.value)}
            placeholder="Alcance (ej. Cuerpo a cuerpo, 3 cas.)"
            style={{ padding: '7px 9px', background: '#0e1017', color: '#f8fafc', border: '1px solid #333a4d', borderRadius: '6px', fontSize: '12px' }}
          />
          <button
            type="button"
            onClick={handleAddAttack}
            className="vtt-primary-cta"
            style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
          >
            Añadir Ataque
          </button>
        </div>
        <input
          type="text"
          value={newAttackDesc}
          onChange={(e) => setNewAttackDesc(e.target.value)}
          placeholder="Efecto adicional o descripción (ej. Si acierta, paraliza al objetivo durante 1 ronda)..."
          style={{ padding: '6px 9px', background: '#0e1017', color: '#cbd5e1', border: '1px solid #232b3b', borderRadius: '6px', fontSize: '11px' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {attacks.map((att, idx) => (
          <div
            key={att.id || idx}
            style={{
              background: '#141822',
              border: '1px solid #2a3346',
              borderLeft: '4px solid #ef4444',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>{att.name}</span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '2px 7px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <Zap size={11} strokeWidth={2.2} /> {att.damage || '1D6'}
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <MapPin size={11} strokeWidth={2.2} /> {att.range || 'Cuerpo a cuerpo'}
                </span>
              </div>
              {att.desc && (
                <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px', fontStyle: 'italic' }}>
                  {att.desc}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setAttacks(prev => prev.filter((_, i) => i !== idx))}
              style={{
                background: 'none',
                border: 'none',
                color: '#f87171',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px'
              }}
              title="Eliminar este ataque"
            >
              <X size={15} strokeWidth={2.3} />
            </button>
          </div>
        ))}
        {attacks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '12px', border: '1px dashed #262b38', borderRadius: '8px' }}>
            Esta criatura no tiene ataques registrados. Usa el formulario o los botones superiores para añadir.
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatureAttacksTab;
