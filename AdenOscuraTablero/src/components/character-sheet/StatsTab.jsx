import { Eye, Shield, AlertTriangle, Footprints } from 'lucide-react';

/**
 * Tarjeta reutilizable de barra vital (PV, MP o SAN).
 */
const ResourceCard = ({
  title,
  value,
  maxValue,
  minMax = 0,
  pct,
  borderColor,
  titleColor,
  badgeColor,
  trackBg,
  trackBorder,
  fillBg,
  onChangeValue,
  onChangeMax
}) => (
  <div style={{ background: '#141822', border: `1px solid ${borderColor}`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '13px', fontWeight: 700, color: titleColor }}>{title}</span>
      <span className="vtt-retro-badge" style={{ fontSize: '14px', fontWeight: 800, color: badgeColor }}>{value} / {maxValue}</span>
    </div>
    <div style={{ width: '100%', height: '14px', backgroundColor: trackBg, borderRadius: '999px', overflow: 'hidden', border: `1px solid ${trackBorder}` }}>
      <div style={{ width: `${pct}%`, height: '100%', background: fillBg, transition: 'width 0.2s ease' }} />
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        <button type="button" onClick={() => onChangeValue(Math.max(0, value - 5))} className="vtt-brass-btn" style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>-5</button>
        <button type="button" onClick={() => onChangeValue(Math.max(0, value - 1))} className="vtt-brass-btn" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>-</button>
        <button type="button" onClick={() => onChangeValue(Math.min(maxValue, value + 1))} className="vtt-brass-btn" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>+</button>
        <button type="button" onClick={() => onChangeValue(Math.min(maxValue, value + 5))} className="vtt-brass-btn" style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>+5</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8' }}>
        <span>Máx:</span>
        <input
          type="number"
          min={minMax}
          max="999"
          value={maxValue}
          onChange={(e) => {
            const m = Math.max(minMax, Number(e.target.value));
            onChangeMax(m);
            if (value > m) onChangeValue(m);
          }}
          style={{ width: '54px', padding: '4px 6px', background: '#0e1017', color: '#f8fafc', border: '1px solid #333a4d', borderRadius: '5px', textAlign: 'center' }}
        />
      </div>
    </div>
  </div>
);

/**
 * Pestaña de Vitalidad, Magia, Cordura/Horror, Armadura, Herida Grave y Velocidad.
 */
const StatsTab = ({
  isMonster,
  hp, setHp, maxHp, setMaxHp, hpPct,
  mp, setMp, maxMp, setMaxMp, mpPct,
  san, setSan, maxSan, setMaxSan, sanPct,
  sanityLoss, setSanityLoss,
  hasArmor, setHasArmor, armorType, setArmorType,
  isGraveWound, setIsGraveWound,
  speed, setSpeed
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
      <ResourceCard
        title="Puntos de Salud (PV)"
        value={hp}
        maxValue={maxHp}
        minMax={1}
        pct={hpPct}
        borderColor="rgba(239, 68, 68, 0.35)"
        titleColor="#f87171"
        badgeColor="#fecaca"
        trackBg="#2a1215"
        trackBorder="rgba(239, 68, 68, 0.4)"
        fillBg="linear-gradient(90deg, #dc2626 0%, #ef4444 100%)"
        onChangeValue={setHp}
        onChangeMax={setMaxHp}
      />

      <ResourceCard
        title="Puntos de Magia (MP)"
        value={mp}
        maxValue={maxMp}
        minMax={0}
        pct={mpPct}
        borderColor="rgba(59, 130, 246, 0.35)"
        titleColor="#60a5fa"
        badgeColor="#bfdbfe"
        trackBg="#111c35"
        trackBorder="rgba(59, 130, 246, 0.4)"
        fillBg="linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)"
        onChangeValue={setMp}
        onChangeMax={setMaxMp}
      />

      {isMonster ? (
        <div style={{ background: '#181420', border: '1px solid rgba(245, 158, 11, 0.45)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#facc15', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Eye size={13} strokeWidth={2.2} /> Pérdida de Cordura (Horror)
            </span>
            <span className="vtt-retro-badge" style={{ fontSize: '14px', fontWeight: 800, color: '#fef08a' }}>{sanityLoss || '1/1D6'}</span>
          </div>

          <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }}>
            Tirada de Cordura provocada a los investigadores al avistar esta entidad (Éxito / Fallo).
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: 'auto' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Tirada al avistamiento:</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
              {['0/1D4', '1/1D6', '1/1D10', '1D10/1D100'].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSanityLoss(preset)}
                  className="vtt-brass-btn"
                  style={{
                    padding: '5px 2px',
                    borderRadius: '5px',
                    fontSize: '10px',
                    fontWeight: sanityLoss === preset ? 800 : 600,
                    color: sanityLoss === preset ? '#fef08a' : '#cbd5e1',
                    borderColor: sanityLoss === preset ? '#f59e0b' : '#333a4d',
                    backgroundColor: sanityLoss === preset ? 'rgba(245, 158, 11, 0.25)' : 'transparent'
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <ResourceCard
          title="Cordura (SAN)"
          value={san}
          maxValue={maxSan}
          minMax={0}
          pct={sanPct}
          borderColor="rgba(250, 204, 21, 0.35)"
          titleColor="#facc15"
          badgeColor="#fef08a"
          trackBg="#2e260d"
          trackBorder="rgba(250, 204, 21, 0.4)"
          fillBg="linear-gradient(90deg, #eab308 0%, #facc15 100%)"
          onChangeValue={setSan}
          onChangeMax={setMaxSan}
        />
      )}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
      <div style={{ background: '#141822', border: '1px solid #2c3344', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>
            {isMonster ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Shield size={13} strokeWidth={2.2} /> Armadura Natural y Resistencia</span> : 'Protección y Armadura'}
          </span>
          <button
            type="button"
            onClick={() => setHasArmor(!hasArmor)}
            style={{
              padding: '5px 12px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: hasArmor ? 'rgba(59, 130, 246, 0.2)' : '#1e2330',
              color: hasArmor ? '#93c5fd' : '#64748b',
              border: hasArmor ? '1px solid #3b82f6' : '1px solid #333a4d'
            }}
          >
            {hasArmor ? 'Lleva Protección: SÍ' : 'Sin Protección'}
          </button>
        </div>

        {hasArmor ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={armorType}
              onChange={(e) => setArmorType(e.target.value)}
              placeholder={isMonster ? 'Ej: Piel quitinosa (2 ptos), Masa amorfa...' : 'Tipo de armadura (ej. Cota de malla, Placas, Cuero...)'}
              style={{ flex: 1, padding: '8px 10px', background: '#0e1017', color: '#f8fafc', border: '1px solid #3b82f6', borderRadius: '7px', fontSize: '13px' }}
            />
            <select
              value=""
              onChange={(e) => { if (e.target.value) setArmorType(e.target.value); }}
              style={{ padding: '8px', background: '#181c26', color: '#cbd5e1', border: '1px solid #333a4d', borderRadius: '7px', fontSize: '12px' }}
            >
              <option value="">Preajustes...</option>
              {isMonster ? (
                <>
                  <option value="Piel quitinosa dura (2 ptos)">Quitina: 2 ptos</option>
                  <option value="Masa protoplasmática (reduce mitad daño)">Masa amorfa: Reduce 50%</option>
                  <option value="Caparazón espeso (4 ptos)">Caparazón: 4 ptos</option>
                  <option value="Inmune a daño no mágico">Inmunidad armas no mágicas</option>
                  <option value="Incorpóreo / Espectral (inmune físico)">Incorpóreo</option>
                </>
              ) : (
                <>
                  <option value="Ropajes Acolchados (Ligera)">Ligera: Acolchada</option>
                  <option value="Cuero Reforzado (Ligera)">Ligera: Cuero</option>
                  <option value="Cota de Malla (Media)">Media: Cota de Malla</option>
                  <option value="Coraza de Acero (Pesada)">Pesada: Coraza</option>
                  <option value="Armadura Completa de Placas (Pesada)">Pesada: Placas</option>
                </>
              )}
            </select>
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
            {isMonster ? 'La criatura no cuenta con armadura natural o exoesqueleto.' : 'El personaje no lleva ningún tipo de protección corporal.'}
          </div>
        )}
      </div>

      <div style={{
        background: isGraveWound ? 'linear-gradient(135deg, rgba(127, 29, 29, 0.45) 0%, rgba(20, 24, 34, 0.95) 100%)' : '#141822',
        border: isGraveWound ? '2px solid #ef4444' : '1px solid #2c3344',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: isGraveWound ? '#fca5a5' : '#e2e8f0' }}>
              Estado de Herida Grave
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Destaca la ficha en el tablero con alerta crítica carmesí
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsGraveWound(!isGraveWound)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              backgroundColor: isGraveWound ? '#dc2626' : '#1e2330',
              color: isGraveWound ? '#ffffff' : '#94a3b8',
              border: isGraveWound ? '1px solid #fca5a5' : '1px solid #333a4d',
              boxShadow: isGraveWound ? '0 0 16px rgba(239, 68, 68, 0.6)' : 'none',
              flexShrink: 0
            }}
          >
            {isGraveWound ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><AlertTriangle size={12} strokeWidth={2.2} /> HERIDA GRAVE</span> : 'Estable'}
          </button>
        </div>
      </div>

      <div style={{
        gridColumn: '1 / -1',
        background: '#141822',
        border: '1px solid #262b38',
        borderRadius: '10px',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Footprints size={13} strokeWidth={2.2} /> Velocidad Base por Turno
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
            Distancia máxima en combate ({speed * 5} ft / {(speed * 1.5).toFixed(1)} m). Con Herida Grave se reduce a {Math.max(1, Math.floor(speed / 2))} casillas.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="number"
            min="1"
            max="30"
            value={speed}
            onChange={(e) => setSpeed(Math.max(1, Number(e.target.value) || 1))}
            style={{
              width: '60px',
              padding: '6px 8px',
              backgroundColor: '#0e1017',
              border: '1px solid #333a4d',
              borderRadius: '6px',
              color: '#fbbf24',
              fontWeight: 700,
              fontSize: '13px',
              textAlign: 'center'
            }}
          />
          <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>casillas</span>
        </div>
      </div>
    </div>
  </div>
);

export default StatsTab;
