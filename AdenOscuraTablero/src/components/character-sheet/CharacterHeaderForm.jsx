import { Eye } from 'lucide-react';
import SearchableCombobox from '../SearchableCombobox';
import { PROFESSIONS_CATALOG, EDUCATION_CATALOG, CITIES_CATALOG } from '../../constants/biographyData';
import { ENTITY_CLASSIFICATIONS, getClassificationMeta } from '../../constants/gamePresets';

/**
 * Cabecera de identidad del personaje o criatura: alterna entre vista dossier
 * de sólo lectura y formulario editable completo.
 */
const CharacterHeaderForm = ({
  isEditingHeader,
  isMonster,
  avatar,
  setAvatar,
  avatarInputRef,
  handleAvatarUpload,
  color,
  setColor,
  isGraveWound,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  fullName,
  birthYear,
  setBirthYear,
  profession,
  setProfession,
  education,
  setEducation,
  birthplace,
  setBirthplace,
  residence,
  setResidence,
  entityType,
  setEntityType,
  faction,
  setFaction,
  sanityLoss,
  setSanityLoss,
  habitat,
  setHabitat,
  creatureNature,
  setCreatureNature,
  creatureSize,
  setCreatureSize,
  armorType,
  setArmorType,
  setHasArmor
}) => {
  const initialLetter = (firstName || fullName || (isMonster ? 'C' : 'P')).charAt(0).toUpperCase();

  return (
    <div style={{
      padding: '16px 24px',
      backgroundColor: '#11141c',
      borderBottom: isEditingHeader ? '1px solid #f59e0b' : '1px solid #262b3a',
      boxShadow: isEditingHeader ? 'inset 0 -2px 10px rgba(245, 158, 11, 0.1)' : 'none',
      display: 'flex',
      gap: '20px',
      alignItems: 'center',
      flexWrap: 'wrap',
      transition: 'all 0.2s ease',
      position: 'relative'
    }}>
      {!isEditingHeader ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px', width: '100%' }}>
          <div
            style={{
              width: '74px',
              height: '74px',
              borderRadius: '50%',
              backgroundColor: color,
              border: isGraveWound ? '3px solid #ef4444' : `3px solid ${color || (isMonster ? '#ef4444' : '#f59e0b')}`,
              boxShadow: isGraveWound ? '0 0 18px rgba(239, 68, 68, 0.7)' : `0 4px 16px ${color}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}
            title={fullName || 'Retrato'}
          >
            {avatar ? (
              <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '26px', fontWeight: 800, color: isMonster ? '#fca5a5' : '#f8fafc', opacity: 0.85 }}>
                {initialLetter}
              </span>
            )}
          </div>

          {isMonster ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap' }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#fca5a5',
                  letterSpacing: '0.02em',
                  fontFamily: "'Cinzel', 'Georgia', serif, system-ui",
                  lineHeight: 1.1
                }}>
                  {fullName || 'Criatura sin nombre'}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    fontWeight: 700,
                    fontSize: '11px'
                  }}>
                    {getClassificationMeta(entityType).label}
                  </span>
                  <span style={{ color: '#475569' }}>•</span>
                  <span style={{ color: faction === 'enemy' ? '#f87171' : faction === 'player' ? '#34d399' : '#60a5fa', fontWeight: 600, fontSize: '12px' }}>
                    {faction === 'enemy' ? 'Hostil / Enemigo' : faction === 'player' ? 'Jugador' : 'Aliado'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
                <div>
                  <span style={{ color: '#f59e0b', marginRight: '5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={12} strokeWidth={2.2} /> P. Cordura:
                  </span>
                  <span style={{ color: '#fef08a', fontWeight: 800 }}>{sanityLoss.trim() || '1/1D6'}</span>
                </div>

                {habitat && (
                  <>
                    <span style={{ color: '#334155' }}>•</span>
                    <div>
                      <span style={{ color: '#64748b', marginRight: '5px' }}>Hábitat:</span>
                      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{habitat}</span>
                    </div>
                  </>
                )}

                {creatureSize && (
                  <>
                    <span style={{ color: '#334155' }}>•</span>
                    <div>
                      <span style={{ color: '#64748b', marginRight: '5px' }}>Tamaño:</span>
                      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{creatureSize}</span>
                    </div>
                  </>
                )}

                {creatureNature && (
                  <>
                    <span style={{ color: '#334155' }}>•</span>
                    <div>
                      <span style={{ color: '#64748b', marginRight: '5px' }}>Naturaleza:</span>
                      <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{creatureNature}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap' }}>
                <h2 style={{
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#f8fafc',
                  letterSpacing: '0.02em',
                  fontFamily: "'Cinzel', 'Georgia', serif, system-ui",
                  lineHeight: 1.1
                }}>
                  {fullName || 'Sin Nombre'}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  {profession && (
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>{profession}</span>
                  )}
                  {profession && <span style={{ color: '#475569' }}>•</span>}
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
                    {getClassificationMeta(entityType).label}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
                <div>
                  <span style={{ color: '#64748b', marginRight: '5px' }}>Año:</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{birthYear.trim() || '—'}</span>
                </div>

                {birthplace && (
                  <>
                    <span style={{ color: '#334155' }}>•</span>
                    <div>
                      <span style={{ color: '#64748b', marginRight: '5px' }}>Nacimiento:</span>
                      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{birthplace}</span>
                    </div>
                  </>
                )}

                {residence && (
                  <>
                    <span style={{ color: '#334155' }}>•</span>
                    <div>
                      <span style={{ color: '#64748b', marginRight: '5px' }}>Residencia:</span>
                      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{residence}</span>
                    </div>
                  </>
                )}

                {education && (
                  <>
                    <span style={{ color: '#334155' }}>•</span>
                    <div>
                      <span style={{ color: '#64748b', marginRight: '5px' }}>Estudios:</span>
                      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{education}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <div
              onClick={() => avatarInputRef.current?.click()}
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                backgroundColor: color,
                border: isMonster ? '3px solid #ef4444' : '3px solid #f59e0b',
                boxShadow: isMonster ? '0 0 14px rgba(239, 68, 68, 0.45)' : '0 0 14px rgba(245, 158, 11, 0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
                flexShrink: 0
              }}
              title="Haz clic para cambiar el retrato o miniatura"
            >
              {avatar ? (
                <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '26px', fontWeight: 800, color: isMonster ? '#fca5a5' : '#f8fafc', opacity: 0.85 }}>
                  {initialLetter}
                </span>
              )}
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isMonster ? '#fca5a5' : '#fbbf24',
                fontSize: '11px',
                fontWeight: 700
              }}>
                Cambiar
              </div>
            </div>
            <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarUpload} style={{ display: 'none' }} />
            {avatar && (
              <button
                type="button"
                onClick={() => setAvatar('')}
                style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '10px', cursor: 'pointer', padding: '2px 4px' }}
              >
                Quitar foto
              </button>
            )}
          </div>

          {isMonster ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 190px 125px 120px 45px', gap: '8px', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#fca5a5', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Nombre de la Criatura o Entidad *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ej: Shoggoth, Profundo, Byakhee, Cthulhu..."
                    style={{ width: '100%', padding: '7px 9px', background: '#1a1315', color: '#f8fafc', border: '1px solid #ef4444', borderRadius: '7px', fontSize: '12.5px', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Clasificación</label>
                  <select
                    value={entityType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEntityType(val);
                      const meta = getClassificationMeta(val);
                      if (meta.group === 'monster') setFaction('enemy');
                    }}
                    style={{ width: '100%', padding: '7px 8px', background: '#181c26', color: '#f8fafc', border: '1px solid #f59e0b', borderRadius: '7px', fontSize: '12px', fontWeight: 600, boxSizing: 'border-box' }}
                  >
                    <optgroup label="Bestiario y Mitos">
                      {ENTITY_CLASSIFICATIONS.filter(c => c.group === 'monster').map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Archivo de Personajes">
                      {ENTITY_CLASSIFICATIONS.filter(c => c.group === 'character').map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <Eye size={11} strokeWidth={2.2} /> P. Cordura
                  </label>
                  <input
                    type="text"
                    value={sanityLoss}
                    onChange={(e) => setSanityLoss(e.target.value)}
                    placeholder="Ej: 1/1D6, 0/1D4"
                    title="Pérdida de Cordura al ver a la criatura (éxito/fallo)"
                    style={{ width: '100%', padding: '7px 8px', background: '#1c1812', color: '#fef08a', border: '1px solid #d97706', borderRadius: '7px', fontSize: '12px', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Bando</label>
                  <select
                    value={faction}
                    onChange={(e) => setFaction(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 8px',
                      background: '#181c26',
                      color: faction === 'player' ? '#34d399' : faction === 'enemy' ? '#f87171' : '#60a5fa',
                      border: '1px solid #333a4d',
                      borderRadius: '7px',
                      fontSize: '12px',
                      fontWeight: 700,
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="enemy">Enemigo / Hostil</option>
                    <option value="ally">Aliado / Neutral</option>
                    <option value="player">Jugador</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Color</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={{ width: '100%', height: '33px', background: 'transparent', border: '1px solid #333a4d', borderRadius: '7px', cursor: 'pointer', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 1fr 1fr', gap: '8px', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Hábitat / Localización</label>
                  <input
                    type="text"
                    value={habitat}
                    onChange={(e) => setHabitat(e.target.value)}
                    placeholder="Ej: Fondos marinos, Tumbas, Leng..."
                    style={{ width: '100%', padding: '7px 9px', background: '#181c26', color: '#f8fafc', border: '1px solid #333a4d', borderRadius: '7px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Fisiología / Naturaleza</label>
                  <input
                    type="text"
                    value={creatureNature}
                    onChange={(e) => setCreatureNature(e.target.value)}
                    placeholder="Ej: Masa amorfa protoplasmática, Quitinosa..."
                    style={{ width: '100%', padding: '7px 9px', background: '#181c26', color: '#f8fafc', border: '1px solid #333a4d', borderRadius: '7px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Envergadura / Tamaño</label>
                  <select
                    value={creatureSize}
                    onChange={(e) => setCreatureSize(e.target.value)}
                    style={{ width: '100%', padding: '7px 8px', background: '#181c26', color: '#f8fafc', border: '1px solid #333a4d', borderRadius: '7px', fontSize: '12px', boxSizing: 'border-box' }}
                  >
                    <option value="Pequeño">Pequeño (Diminuto)</option>
                    <option value="Medio">Medio (Humanoide)</option>
                    <option value="Grande">Grande (Byakhee / Caballo)</option>
                    <option value="Enorme">Enorme (Shoggoth)</option>
                    <option value="Colosal">Colosal / Primigenio</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Armadura Natural</label>
                  <input
                    type="text"
                    value={armorType}
                    onChange={(e) => {
                      setArmorType(e.target.value);
                      setHasArmor(Boolean(e.target.value && e.target.value !== 'Ninguna'));
                    }}
                    placeholder="Ej: Piel quitinosa (2 ptos)"
                    style={{ width: '100%', padding: '7px 9px', background: '#181c26', color: '#f8fafc', border: '1px solid #333a4d', borderRadius: '7px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 85px 190px 115px 45px', gap: '8px', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#93c5fd', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Nombre *</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ej: Arthur"
                    style={{ width: '100%', padding: '7px 9px', background: '#181c26', color: '#f8fafc', border: '1px solid #3b82f6', borderRadius: '7px', fontSize: '12.5px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#93c5fd', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Apellidos</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ej: Pendelton"
                    style={{ width: '100%', padding: '7px 9px', background: '#181c26', color: '#f8fafc', border: '1px solid #333a4d', borderRadius: '7px', fontSize: '12.5px', fontWeight: 600, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Año</label>
                  <input
                    type="text"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    placeholder="1890"
                    style={{ width: '100%', padding: '7px 9px', background: '#181c26', color: '#f8fafc', border: '1px solid #333a4d', borderRadius: '7px', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Tipo</label>
                  <select
                    value={entityType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEntityType(val);
                      const meta = getClassificationMeta(val);
                      if (meta.group === 'monster') setFaction('enemy');
                    }}
                    style={{ width: '100%', padding: '7px 8px', background: '#181c26', color: '#f8fafc', border: '1px solid #f59e0b', borderRadius: '7px', fontSize: '12px', fontWeight: 600, boxSizing: 'border-box' }}
                  >
                    <optgroup label="Archivo de Personajes">
                      {ENTITY_CLASSIFICATIONS.filter(c => c.group === 'character').map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Bestiario y Mitos">
                      {ENTITY_CLASSIFICATIONS.filter(c => c.group === 'monster').map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Bando</label>
                  <select
                    value={faction}
                    onChange={(e) => setFaction(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 8px',
                      background: '#181c26',
                      color: faction === 'player' ? '#34d399' : faction === 'enemy' ? '#f87171' : '#60a5fa',
                      border: '1px solid #333a4d',
                      borderRadius: '7px',
                      fontSize: '12px',
                      fontWeight: 700,
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="player">Jugador</option>
                    <option value="ally">Aliado</option>
                    <option value="enemy">Enemigo</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Color</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={{ width: '100%', height: '33px', background: 'transparent', border: '1px solid #333a4d', borderRadius: '7px', cursor: 'pointer', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', alignItems: 'end' }}>
                <SearchableCombobox
                  label="Profesión"
                  value={profession}
                  onChange={setProfession}
                  options={PROFESSIONS_CATALOG}
                  placeholder="Buscar o escribir profesión..."
                />
                <SearchableCombobox
                  label="Estudios / Título"
                  value={education}
                  onChange={setEducation}
                  options={EDUCATION_CATALOG}
                  placeholder="Buscar o escribir estudios..."
                />
                <SearchableCombobox
                  label="Lugar de Nacimiento"
                  value={birthplace}
                  onChange={setBirthplace}
                  options={CITIES_CATALOG}
                  placeholder="Ciudad o país de nacimiento..."
                />
                <SearchableCombobox
                  label="Lugar de Residencia"
                  value={residence}
                  onChange={setResidence}
                  options={CITIES_CATALOG}
                  placeholder="Ciudad de residencia actual..."
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CharacterHeaderForm;
