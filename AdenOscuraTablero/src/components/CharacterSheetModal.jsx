import React, { useState, useRef } from 'react';
import { ENTITY_CLASSIFICATIONS, getClassificationMeta } from './EncyclopediaView';
import { exportJSON, importJSON } from '../utils/fileDialog';

const DEFAULT_SPELLS = [
  { id: 'sp1', name: 'Luz Arcana', cost: '2 MP', desc: 'Crea una esfera de luz flotante que ilumina las tinieblas.' },
  { id: 'sp2', name: 'Curación Menor', cost: '4 MP', desc: 'Cierra heridas superficiales y restaura vitalidad.' }
];

const CharacterSheetModal = ({ mode = 'create', initialData = null, onSave, onClose }) => {
  // Datos de Identidad
  const [firstName, setFirstName] = useState(() => {
    if (initialData?.firstName) return initialData.firstName;
    if (initialData?.name) return initialData.name.split(' ')[0] || '';
    return '';
  });
  const [lastName, setLastName] = useState(() => {
    if (initialData?.lastName !== undefined) return initialData.lastName;
    if (initialData?.name) return initialData.name.split(' ').slice(1).join(' ') || '';
    return '';
  });
  const [birthYear, setBirthYear] = useState(initialData?.birthYear || '1890');
  const [color, setColor] = useState(initialData?.color || '#f59e0b');
  const [faction, setFaction] = useState(initialData?.faction || 'ally');
  const [entityType, setEntityType] = useState(() => {
    if (initialData?.entityType) return initialData.entityType;
    return initialData?.faction === 'enemy' ? 'mythos_creature' : 'human';
  });
  const [avatar, setAvatar] = useState(initialData?.avatar || '');

  // Puntos de Salud (Rojo), Magia (Azul) y Cordura (Amarillo)
  const [hp, setHp] = useState(initialData?.hp ?? 20);
  const [maxHp, setMaxHp] = useState(initialData?.maxHp ?? 20);
  const [mp, setMp] = useState(initialData?.mp ?? 10);
  const [maxMp, setMaxMp] = useState(initialData?.maxMp ?? 10);
  const [san, setSan] = useState(initialData?.san ?? 60);
  const [maxSan, setMaxSan] = useState(initialData?.maxSan ?? 60);

  // Armadura y Herida Grave
  const [hasArmor, setHasArmor] = useState(initialData?.hasArmor ?? Boolean(initialData?.armorType && initialData?.armorType !== 'Ninguna'));
  const [armorType, setArmorType] = useState(initialData?.armorType || 'Cuero tachonado');
  const [isGraveWound, setIsGraveWound] = useState(Boolean(initialData?.isGraveWound));

  // Historia Personal y Notas
  const [history, setHistory] = useState(initialData?.history || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Inventario: 'equipped' (Llevado encima), 'hand' (A mano / Alrededores), 'stored' (No lo lleva encima / Guardado)
  const [inventory, setInventory] = useState(initialData?.inventory || [
    { id: 1, name: 'Linterna de aceite', state: 'equipped', notes: 'Encendida' },
    { id: 2, name: 'Mochila de viaje', state: 'hand', notes: 'Dejada junto a la entrada' },
    { id: 3, name: 'Raciones secas', state: 'stored', notes: 'En el campamento' }
  ]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemState, setNewItemState] = useState('equipped');

  // Grimorio de Hechizos
  const [spells, setSpells] = useState(initialData?.spells || DEFAULT_SPELLS);
  const [newSpellName, setNewSpellName] = useState('');
  const [newSpellCost, setNewSpellCost] = useState('2 MP');
  const [newSpellDesc, setNewSpellDesc] = useState('');

  const [activeTab, setActiveTab] = useState('stats');
  const [importNotice, setImportNotice] = useState(null);

  const avatarInputRef = useRef(null);
  const importCharInputRef = useRef(null);

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const minSide = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - minSide) / 2, (img.height - minSide) / 2, minSide, minSide, 0, 0, 256, 256);
        setAvatar(canvas.toDataURL('image/webp', 0.85));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const buildCharacterObject = () => ({
    id: initialData?.id || Date.now(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    name: fullName || 'Sin Nombre',
    birthYear: birthYear.trim(),
    color,
    faction,
    entityType,
    avatar: avatar || null,
    hp: Math.max(0, Math.min(Number(hp) || 0, Number(maxHp) || 1)),
    maxHp: Math.max(1, Number(maxHp) || 1),
    mp: Math.max(0, Math.min(Number(mp) || 0, Number(maxMp) || 0)),
    maxMp: Math.max(0, Number(maxMp) || 0),
    san: Math.max(0, Math.min(Number(san) || 0, Number(maxSan) || 0)),
    maxSan: Math.max(0, Number(maxSan) || 0),
    hasArmor: Boolean(hasArmor),
    armorType: hasArmor ? (armorType.trim() || 'Armadura Ligera') : 'Ninguna',
    isGraveWound: Boolean(isGraveWound),
    history,
    notes,
    inventory,
    spells
  });

  const applyCharacterData = (data) => {
    if (!data) return;

    if (data.firstName !== undefined) setFirstName(data.firstName);
    else if (data.name) setFirstName(data.name.split(' ')[0] || '');

    if (data.lastName !== undefined) setLastName(data.lastName);
    else if (data.name) setLastName(data.name.split(' ').slice(1).join(' ') || '');

    if (data.birthYear !== undefined) setBirthYear(String(data.birthYear));
    if (data.color) setColor(data.color);
    if (data.faction) setFaction(data.faction);
    if (data.entityType) setEntityType(data.entityType);
    if (data.avatar !== undefined) setAvatar(data.avatar || '');

    if (data.hp !== undefined) setHp(Number(data.hp));
    if (data.maxHp !== undefined) setMaxHp(Number(data.maxHp));
    if (data.mp !== undefined) setMp(Number(data.mp));
    if (data.maxMp !== undefined) setMaxMp(Number(data.maxMp));
    if (data.san !== undefined) setSan(Number(data.san));
    if (data.maxSan !== undefined) setMaxSan(Number(data.maxSan));

    if (data.hasArmor !== undefined) setHasArmor(Boolean(data.hasArmor));
    if (data.armorType !== undefined) setArmorType(data.armorType);
    if (data.isGraveWound !== undefined) setIsGraveWound(Boolean(data.isGraveWound));

    if (data.history !== undefined) setHistory(data.history);
    if (data.notes !== undefined) setNotes(data.notes);
    if (Array.isArray(data.inventory)) setInventory(data.inventory);
    if (Array.isArray(data.spells)) setSpells(data.spells);

    setImportNotice('¡Datos de personaje importados en el formulario!');
    setTimeout(() => setImportNotice(null), 3000);
  };

  const handleExportSingleCharacter = async () => {
    try {
      const charObj = buildCharacterObject();
      const safeFile = (charObj.name || 'personaje').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      await exportJSON(`ficha_${safeFile}.json`, charObj);
    } catch (err) {
      console.error('Error al exportar ficha de personaje:', err);
    }
  };

  const handleImportSingleCharacter = async (e) => {
    if (e && e.target && e.target.files) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const raw = JSON.parse(evt.target.result);
          const data = Array.isArray(raw) ? raw[0] : raw;
          applyCharacterData(data);
        } catch (err) {}
      };
      reader.readAsText(file);
      e.target.value = '';
      return;
    }

    try {
      const res = await importJSON({ accept: '.json', description: 'Ficha de Personaje (*.json)' });
      if (res?.success && res.text) {
        const raw = JSON.parse(res.text);
        const data = Array.isArray(raw) ? raw[0] : raw;
        applyCharacterData(data);
      }
    } catch (err) {
      console.error('Error al importar ficha de personaje:', err);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!firstName.trim() && !lastName.trim()) return;
    onSave(buildCharacterObject());
  };

  const hpPct = Math.max(0, Math.min(100, Math.round((hp / Math.max(1, maxHp)) * 100)));
  const mpPct = Math.max(0, Math.min(100, Math.round((mp / Math.max(1, maxMp)) * 100)));
  const sanPct = Math.max(0, Math.min(100, Math.round((san / Math.max(1, maxSan)) * 100)));

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(8, 10, 15, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}
    >
      <div
        className="vtt-wood-panel"
        style={{
          width: '920px',
          maxWidth: '96vw',
          height: '88vh',
          borderRadius: '16px',
          border: '1px solid #3b4254',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 70px rgba(0,0,0,0.95)'
        }}
      >
        {/* Cabecera con Importar / Exportar Ficha */}
        <div style={{
          padding: '16px 24px',
          background: 'linear-gradient(180deg, #1b202b 0%, #131720 100%)',
          borderBottom: '1px solid #2e3446',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', border: '1px solid #fbbf24'
            }}>
              📜
            </div>
            <div>
              <div className="vtt-gothic-title" style={{ fontSize: '17px', color: '#f8fafc', fontWeight: 'bold' }}>
                {mode === 'create' ? 'NUEVO EXPEDIENTE DE PERSONAJE' : `EXPEDIENTE: ${fullName.toUpperCase()}`}
              </div>
              <div className="vtt-retro-badge" style={{ fontSize: '10px', color: '#94a3b8' }}>
                SISTEMA DE SALUD, MAGIA, CORDURA, ARMADURA, INVENTARIO Y GRIMORIO
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="file" accept=".json" ref={importCharInputRef} onChange={handleImportSingleCharacter} style={{ display: 'none' }} />
            <button
              type="button"
              onClick={() => handleImportSingleCharacter()}
              className="vtt-brass-btn"
              style={{ padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              title="Cargar datos desde un archivo JSON de personaje"
            >
              📥 Importar Ficha
            </button>
            <button
              type="button"
              onClick={handleExportSingleCharacter}
              className="vtt-brass-btn"
              style={{ padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              title="Descargar este personaje en un archivo JSON"
            >
              📤 Exportar Ficha
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                marginLeft: '6px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Resumen Permanente de Identidad y Barras en Tiempo Real */}
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#11141c',
          borderBottom: '1px solid #262b3a',
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div
              onClick={() => avatarInputRef.current.click()}
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                backgroundColor: color,
                border: isGraveWound ? '3px solid #ef4444' : '3px solid #f59e0b',
                boxShadow: isGraveWound ? '0 0 18px rgba(239, 68, 68, 0.7)' : '0 4px 14px rgba(0,0,0,0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
                flexShrink: 0
              }}
              title="Haz clic para cambiar el retrato"
            >
              {avatar ? (
                <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '26px' }}>📷</span>
              )}
            </div>
            <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarUpload} style={{ display: 'none' }} />
            {avatar && (
              <button
                type="button"
                onClick={() => setAvatar('')}
                style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '10px', cursor: 'pointer' }}
              >
                Quitar foto
              </button>
            )}
          </div>

          {/* Campos principales de identidad y clasificación */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 95px 195px 115px 50px', gap: '10px', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Nombre *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ej: Arthur / Cthulhu"
                style={{ width: '100%', padding: '8px 10px', background: '#181c26', color: '#f8fafc', border: '1px solid #333a4d', borderRadius: '7px', fontSize: '13px', fontWeight: 600 }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Apellidos / Epíteto</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ej: Pendelton / El Durmiente"
                style={{ width: '100%', padding: '8px 10px', background: '#181c26', color: '#f8fafc', border: '1px solid #333a4d', borderRadius: '7px', fontSize: '13px', fontWeight: 600 }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Año / Era</label>
              <input
                type="text"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="1890 / Eones"
                style={{ width: '100%', padding: '8px 10px', background: '#181c26', color: '#f8fafc', border: '1px solid #333a4d', borderRadius: '7px', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Clasificación / Naturaleza</label>
              <select
                value={entityType}
                onChange={(e) => {
                  const val = e.target.value;
                  setEntityType(val);
                  const meta = getClassificationMeta(val);
                  if (meta.group === 'monster') setFaction('enemy');
                }}
                style={{ width: '100%', padding: '8px 8px', background: '#181c26', color: '#f8fafc', border: '1px solid #f59e0b', borderRadius: '7px', fontSize: '12px', fontWeight: 600 }}
              >
                <optgroup label="📖 Archivo de Personajes">
                  {ENTITY_CLASSIFICATIONS.filter(c => c.group === 'character').map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </optgroup>
                <optgroup label="👁️ Bestiario y Mitos">
                  {ENTITY_CLASSIFICATIONS.filter(c => c.group === 'monster').map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Rol en Mesa</label>
              <select
                value={faction}
                onChange={(e) => setFaction(e.target.value)}
                style={{ width: '100%', padding: '8px 8px', background: '#181c26', color: '#f8fafc', border: '1px solid #333a4d', borderRadius: '7px', fontSize: '12px', fontWeight: 600 }}
              >
                <option value="ally">🛡️ Aliado</option>
                <option value="enemy">💀 Hostil</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: '100%', height: '35px', background: 'transparent', border: '1px solid #333a4d', borderRadius: '7px', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>

        {/* Navegación por Pestañas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#0e1017', borderBottom: '1px solid #262b3a' }}>
          {[
            { id: 'stats', label: '❤️ Vitalidad, Cordura y Armadura' },
            { id: 'inventory', label: `🎒 Inventario (${inventory.length})` },
            { id: 'grimoire', label: `📖 Grimorio (${spells.length})` },
            { id: 'lore', label: '🖋️ Historia Personal y Notas' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 10px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === tab.id ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.18) 0%, rgba(245, 158, 11, 0.04) 100%)' : 'transparent',
                color: activeTab === tab.id ? '#fbbf24' : '#94a3b8',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #f59e0b' : '2px solid transparent',
                transition: 'all 0.15s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido Principal */}
        <div style={{ flex: 1, padding: '22px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {importNotice && (
            <div style={{ padding: '10px 14px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '8px', color: '#6ee7b7', fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>
              {importNotice}
            </div>
          )}

          {/* PESTAÑA 1: SALUD (ROJA), MAGIA (AZUL), CORDURA (AMARILLA), ARMADURA Y HERIDA GRAVE */}
          {activeTab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                
                {/* TARJETA SALUD (ROJA) */}
                <div style={{ background: '#141822', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#f87171' }}>❤️ Puntos de Salud (HP)</span>
                    <span className="vtt-retro-badge" style={{ fontSize: '14px', fontWeight: 800, color: '#fecaca' }}>{hp} / {maxHp}</span>
                  </div>
                  {/* Barra de Salud Roja */}
                  <div style={{ width: '100%', height: '14px', backgroundColor: '#2a1215', borderRadius: '999px', overflow: 'hidden', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
                    <div style={{ width: `${hpPct}%`, height: '100%', background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)', transition: 'width 0.2s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button type="button" onClick={() => setHp(Math.max(0, hp - 5))} className="vtt-brass-btn" style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>-5</button>
                      <button type="button" onClick={() => setHp(Math.max(0, hp - 1))} className="vtt-brass-btn" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>-</button>
                      <button type="button" onClick={() => setHp(Math.min(maxHp, hp + 1))} className="vtt-brass-btn" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>+</button>
                      <button type="button" onClick={() => setHp(Math.min(maxHp, hp + 5))} className="vtt-brass-btn" style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>+5</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8' }}>
                      <span>Máx:</span>
                      <input type="number" min="1" max="999" value={maxHp} onChange={(e) => { const m = Math.max(1, Number(e.target.value)); setMaxHp(m); if (hp > m) setHp(m); }} style={{ width: '54px', padding: '4px 6px', background: '#0e1017', color: '#f8fafc', border: '1px solid #333a4d', borderRadius: '5px', textAlign: 'center' }} />
                    </div>
                  </div>
                </div>

                {/* TARJETA MAGIA / MANÁ (AZUL) */}
                <div style={{ background: '#141822', border: '1px solid rgba(59, 130, 246, 0.35)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#60a5fa' }}>💧 Puntos de Magia (MP)</span>
                    <span className="vtt-retro-badge" style={{ fontSize: '14px', fontWeight: 800, color: '#bfdbfe' }}>{mp} / {maxMp}</span>
                  </div>
                  {/* Barra de Maná Azul */}
                  <div style={{ width: '100%', height: '14px', backgroundColor: '#111c35', borderRadius: '999px', overflow: 'hidden', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
                    <div style={{ width: `${mpPct}%`, height: '100%', background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)', transition: 'width 0.2s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button type="button" onClick={() => setMp(Math.max(0, mp - 5))} className="vtt-brass-btn" style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>-5</button>
                      <button type="button" onClick={() => setMp(Math.max(0, mp - 1))} className="vtt-brass-btn" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>-</button>
                      <button type="button" onClick={() => setMp(Math.min(maxMp, mp + 1))} className="vtt-brass-btn" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>+</button>
                      <button type="button" onClick={() => setMp(Math.min(maxMp, mp + 5))} className="vtt-brass-btn" style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>+5</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8' }}>
                      <span>Máx:</span>
                      <input type="number" min="0" max="999" value={maxMp} onChange={(e) => { const m = Math.max(0, Number(e.target.value)); setMaxMp(m); if (mp > m) setMp(m); }} style={{ width: '54px', padding: '4px 6px', background: '#0e1017', color: '#f8fafc', border: '1px solid #333a4d', borderRadius: '5px', textAlign: 'center' }} />
                    </div>
                  </div>
                </div>

                {/* TARJETA CORDURA (AMARILLA) */}
                <div style={{ background: '#141822', border: '1px solid rgba(250, 204, 21, 0.35)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#facc15' }}>👁️ Cordura (SAN)</span>
                    <span className="vtt-retro-badge" style={{ fontSize: '14px', fontWeight: 800, color: '#fef08a' }}>{san} / {maxSan}</span>
                  </div>
                  {/* Barra de Cordura Amarilla */}
                  <div style={{ width: '100%', height: '14px', backgroundColor: '#2e260d', borderRadius: '999px', overflow: 'hidden', border: '1px solid rgba(250, 204, 21, 0.4)' }}>
                    <div style={{ width: `${sanPct}%`, height: '100%', background: 'linear-gradient(90deg, #eab308 0%, #facc15 100%)', transition: 'width 0.2s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button type="button" onClick={() => setSan(Math.max(0, san - 5))} className="vtt-brass-btn" style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>-5</button>
                      <button type="button" onClick={() => setSan(Math.max(0, san - 1))} className="vtt-brass-btn" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>-</button>
                      <button type="button" onClick={() => setSan(Math.min(maxSan, san + 1))} className="vtt-brass-btn" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>+</button>
                      <button type="button" onClick={() => setSan(Math.min(maxSan, san + 5))} className="vtt-brass-btn" style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>+5</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8' }}>
                      <span>Máx:</span>
                      <input type="number" min="0" max="999" value={maxSan} onChange={(e) => { const m = Math.max(0, Number(e.target.value)); setMaxSan(m); if (san > m) setSan(m); }} style={{ width: '54px', padding: '4px 6px', background: '#0e1017', color: '#f8fafc', border: '1px solid #333a4d', borderRadius: '5px', textAlign: 'center' }} />
                    </div>
                  </div>
                </div>

              </div>

              {/* FILA DE ARMADURA Y MARCADOR DE HERIDA GRAVE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                
                {/* Configuración de Armadura */}
                <div style={{ background: '#141822', border: '1px solid #2c3344', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>🛡️ Protección y Armadura</span>
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
                      {hasArmor ? '🛡️ Lleva Armadura: SÍ' : 'Sin Armadura'}
                    </button>
                  </div>

                  {hasArmor ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={armorType}
                        onChange={(e) => setArmorType(e.target.value)}
                        placeholder="Tipo de armadura (ej. Cota de malla, Placas, Cuero...)"
                        style={{ flex: 1, padding: '8px 10px', background: '#0e1017', color: '#f8fafc', border: '1px solid #3b82f6', borderRadius: '7px', fontSize: '13px' }}
                      />
                      <select
                        value=""
                        onChange={(e) => { if (e.target.value) setArmorType(e.target.value); }}
                        style={{ padding: '8px', background: '#181c26', color: '#cbd5e1', border: '1px solid #333a4d', borderRadius: '7px', fontSize: '12px' }}
                      >
                        <option value="">Preajustes...</option>
                        <option value="Ropajes Acolchados (Ligera)">Ligera: Acolchada</option>
                        <option value="Cuero Reforzado (Ligera)">Ligera: Cuero</option>
                        <option value="Cota de Malla (Media)">Media: Cota de Malla</option>
                        <option value="Coraza de Acero (Pesada)">Pesada: Coraza</option>
                        <option value="Armadura Completa de Placas (Pesada)">Pesada: Placas</option>
                      </select>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                      El personaje no porta ninguna armadura actualmente.
                    </div>
                  )}
                </div>

                {/* Marcador de Herida Grave */}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: isGraveWound ? '#fca5a5' : '#e2e8f0' }}>
                        🩸 Estado de Herida Grave
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
                        boxShadow: isGraveWound ? '0 0 16px rgba(239, 68, 68, 0.6)' : 'none'
                      }}
                    >
                      {isGraveWound ? '⚠️ HERIDA GRAVE ACTIVA' : 'Estable (Sin Herida Grave)'}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* PESTAÑA 2: INVENTARIO (LLEVADO ENCIMA / A MANO / NO LLEVADO) */}
          {activeTab === 'inventory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#141822', border: '1px solid #2c3344', borderRadius: '10px', padding: '14px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!newItemName.trim()) return;
                      setInventory([...inventory, { id: Date.now(), name: newItemName.trim(), state: newItemState }]);
                      setNewItemName('');
                    }
                  }}
                  placeholder="Nombre del objeto, arma o utensilio..."
                  style={{ flex: 1, padding: '9px 12px', background: '#0e1017', color: '#f8fafc', border: '1px solid #333a4d', borderRadius: '8px', fontSize: '13px' }}
                />
                <select
                  value={newItemState}
                  onChange={(e) => setNewItemState(e.target.value)}
                  style={{ padding: '9px 12px', background: '#0e1017', color: '#fbbf24', border: '1px solid #333a4d', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}
                >
                  <option value="equipped">🎒 Lleva encima</option>
                  <option value="hand">🤝 A mano (Alrededores)</option>
                  <option value="stored">📦 No lleva encima</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (!newItemName.trim()) return;
                    setInventory([...inventory, { id: Date.now(), name: newItemName.trim(), state: newItemState }]);
                    setNewItemName('');
                  }}
                  className="vtt-primary-cta"
                  style={{ padding: '9px 18px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                >
                  + Añadir Objeto
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {inventory.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#141822',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: item.state === 'equipped'
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : item.state === 'hand'
                        ? '1px solid rgba(245, 158, 11, 0.4)'
                        : '1px solid #262b38'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>
                        {item.state === 'equipped' ? '🎒' : item.state === 'hand' ? '🤝' : '📦'}
                      </span>
                      <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '13px' }}>{item.name}</span>
                    </div>

                    {/* Botonera de 3 estados de inventario */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {[
                        { id: 'equipped', label: '🎒 Lleva encima', activeBg: 'rgba(16, 185, 129, 0.2)', activeColor: '#6ee7b7', border: '#10b981' },
                        { id: 'hand', label: '🤝 A mano (Alrededores)', activeBg: 'rgba(245, 158, 11, 0.2)', activeColor: '#fde047', border: '#f59e0b' },
                        { id: 'stored', label: '📦 No lo lleva', activeBg: 'rgba(148, 163, 184, 0.18)', activeColor: '#cbd5e1', border: '#64748b' }
                      ].map(st => {
                        const active = item.state === st.id;
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setInventory(inventory.map(i => i.id === item.id ? { ...i, state: st.id } : i))}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: active ? 700 : 500,
                              cursor: 'pointer',
                              backgroundColor: active ? st.activeBg : '#0e1017',
                              color: active ? st.activeColor : '#64748b',
                              border: active ? `1px solid ${st.border}` : '1px solid #262b38'
                            }}
                          >
                            {st.label}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => setInventory(inventory.filter(i => i.id !== item.id))}
                        style={{ marginLeft: '6px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                        title="Eliminar objeto"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                {inventory.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '13px', border: '1px dashed #2c3344', borderRadius: '10px' }}>
                    El inventario está vacío. Añade armas, equipo o pertenencias arriba.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PESTAÑA 3: GRIMORIO DE HECHIZOS */}
          {activeTab === 'grimoire' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#141822', padding: '14px', borderRadius: '10px', border: '1px solid #2c3344', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={newSpellName}
                    onChange={(e) => setNewSpellName(e.target.value)}
                    placeholder="Nombre del hechizo, cántico o ritual..."
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
                    onClick={() => {
                      if (!newSpellName.trim()) return;
                      setSpells([...spells, { id: Date.now(), name: newSpellName.trim(), cost: newSpellCost.trim() || '1 MP', desc: newSpellDesc.trim() }]);
                      setNewSpellName('');
                      setNewSpellDesc('');
                    }}
                    className="vtt-primary-cta"
                    style={{ padding: '8px 16px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    + Inscribir Hechizo
                  </button>
                </div>
                <input
                  type="text"
                  value={newSpellDesc}
                  onChange={(e) => setNewSpellDesc(e.target.value)}
                  placeholder="Efecto, alcance o descripción del conjuro..."
                  style={{ width: '100%', padding: '8px 12px', background: '#0e1017', color: '#cbd5e1', border: '1px solid #333a4d', borderRadius: '7px', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {spells.map(sp => (
                  <div key={sp.id} style={{ background: '#141822', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px' }}>✨ {sp.name}</span>
                        <span className="vtt-retro-badge" style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>
                          {sp.cost}
                        </span>
                      </div>
                      {sp.desc && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', lineHeight: 1.4 }}>{sp.desc}</div>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSpells(spells.filter(s => s.id !== sp.id))}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {spells.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '13px', border: '1px dashed #2c3344', borderRadius: '10px' }}>
                    Este personaje no tiene hechizos inscritos en su grimorio.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PESTAÑA 4: HISTORIA PERSONAL Y NOTAS */}
          {activeTab === 'lore' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>📜 Historia Personal y Biografía</label>
                <textarea
                  value={history}
                  onChange={(e) => setHistory(e.target.value)}
                  placeholder="Origen, familia, traumas, motivaciones y pasado del personaje..."
                  style={{ flex: 1, minHeight: '220px', padding: '12px', background: '#141822', color: '#f8fafc', border: '1px solid #2c3344', borderRadius: '10px', resize: 'none', fontSize: '13px', lineHeight: 1.5 }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#60a5fa' }}>📝 Notas, Pistas y Apuntes de Partida</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contactos, deudas, cicatrices, secretos o efectos temporales..."
                  style={{ flex: 1, minHeight: '220px', padding: '12px', background: '#141822', color: '#f8fafc', border: '1px solid #2c3344', borderRadius: '10px', resize: 'none', fontSize: '13px', lineHeight: 1.5 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div style={{
          padding: '14px 24px',
          background: '#12151e',
          borderTop: '1px solid #2e3446',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            {hasArmor ? `🛡️ Armadura: ${armorType}` : 'Sin armadura'} • {isGraveWound ? '🩸 CON HERIDA GRAVE' : 'Estado estable'}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="vtt-brass-btn" style={{ padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!firstName.trim() && !lastName.trim()}
              className="vtt-primary-cta"
              style={{ padding: '9px 24px', borderRadius: '8px', cursor: (firstName.trim() || lastName.trim()) ? 'pointer' : 'not-allowed', fontSize: '13px' }}
            >
              💾 {mode === 'create' ? 'Crear y Guardar Personaje' : 'Guardar Cambios del Personaje'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheetModal;