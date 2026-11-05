import React, { useState, useEffect, useRef } from 'react';
import { ENTITY_CLASSIFICATIONS, getClassificationMeta } from './EncyclopediaView';
import { exportJSON, importJSON } from '../utils/fileDialog';
import { DEFAULT_COMMON_ITEMS } from '../constants/commonItems';
import {
  getGameIconComponent,
  GiRetroCamera,
  GiBriefcase,
  GiCalendar,
  GiMapPin,
  GiHouse,
  GiGraduationCap,
  GiDetective
} from './icons/GameIcons';
import SearchableCombobox from './SearchableCombobox';
import { PROFESSIONS_CATALOG, EDUCATION_CATALOG, CITIES_CATALOG } from '../constants/biographyData';

export const getItemIcon = (item, size = 26) => {
  if (React.isValidElement(item)) return item;
  if (React.isValidElement(item?.icon)) return item.icon;
  if (item?.icon && typeof item.icon === 'string' && item.icon.startsWith('data:image')) {
    return <img src={item.icon} alt={item.name || ''} style={{ width: size, height: size, objectFit: 'contain' }} />;
  }
  return getGameIconComponent(item, size);
};

const DEFAULT_SPELLS = [
  { id: 'sp1', name: 'Luz Arcana', cost: '2 MP', desc: 'Crea una esfera de luz flotante que ilumina las tinieblas.' },
  { id: 'sp2', name: 'Curación Menor', cost: '4 MP', desc: 'Cierra heridas superficiales y restaura vitalidad.' }
];

const CharacterSheetModal = ({
  mode = 'create',
  initialData = null,
  initialTab = 'stats',
  onSave,
  onUpdate,
  onClose,
  onDropItemToFloor,
  onTransferItem,
  tokens = [],
  characters = []
}) => {
  // Modo de edición para los datos de identidad superior (Nombre, Apellidos, Año, Tipo, Bando, Color, Avatar)
  const [isEditingHeader, setIsEditingHeader] = useState(mode === 'create');
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
  const [faction, setFaction] = useState(() => {
    if (initialData?.faction) return initialData.faction;
    if (initialData?.entityType && ['mythos_creature', 'great_old_one', 'outer_god', 'animal', 'undead', 'aberration'].includes(initialData.entityType)) {
      return 'enemy';
    }
    return 'player';
  });
  const [entityType, setEntityType] = useState(() => {
    if (initialData?.entityType) return initialData.entityType;
    return initialData?.faction === 'enemy' ? 'mythos_creature' : 'human';
  });
  const [avatar, setAvatar] = useState(initialData?.avatar || '');

  // Datos Biográficos Adicionales
  const [profession, setProfession] = useState(initialData?.profession || '');
  const [education, setEducation] = useState(initialData?.education || '');
  const [birthplace, setBirthplace] = useState(initialData?.birthplace || '');
  const [residence, setResidence] = useState(initialData?.residence || '');

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
  const [speed, setSpeed] = useState(initialData?.speed ?? 6);

  // Historia Personal y Notas
  const [history, setHistory] = useState(initialData?.history || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Inventario: 'equipped' (Llevado encima en inventario/mochila), 'stored' (No lo lleva encima / Guardado)
  const [inventory, setInventory] = useState(() => {
    if (Array.isArray(initialData?.inventory)) return initialData.inventory;
    return mode === 'create' ? [
      { id: 1, name: 'Cuchillo de caza', state: 'equipped', notes: 'En el cinto' },
      { id: 2, name: 'Linterna de aceite', state: 'equipped', notes: 'Encendida' },
      { id: 3, name: 'Mochila de viaje', state: 'equipped', extraSlots: 10, notes: 'Mochila reforzada (+10 huecos)' },
      { id: 4, name: 'Raciones secas', state: 'stored', notes: 'En el campamento' }
    ] : [];
  });
  const [newItemName, setNewItemName] = useState('');

  // Grimorio de Hechizos
  const [spells, setSpells] = useState(initialData?.spells || DEFAULT_SPELLS);
  const [newSpellName, setNewSpellName] = useState('');
  const [newSpellCost, setNewSpellCost] = useState('2 MP');
  const [newSpellDesc, setNewSpellDesc] = useState('');

  const [activeTab, setActiveTab] = useState(initialTab || 'stats');
  const [importNotice, setImportNotice] = useState(null);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Sincronizar inventario y hechizos si initialData cambia
  React.useEffect(() => {
    if (initialData && Array.isArray(initialData.inventory)) {
      setInventory(initialData.inventory);
    }
  }, [initialData?.inventory]);

  // Estados para inventario por secciones (Inventario/Mochila, No lo lleva)
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [movingItemId, setMovingItemId] = useState(null);
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null); // { section, index }
  const [quickCommonItem, setQuickCommonItem] = useState('');
  const [showCommonDropdown, setShowCommonDropdown] = useState(false);
  const [commonFilter, setCommonFilter] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [showTransferMenu, setShowTransferMenu] = useState(false);
  const [transferToast, setTransferToast] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const commonDropdownRef = useRef(null);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (commonDropdownRef.current && !commonDropdownRef.current.contains(e.target)) {
        setShowCommonDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
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
    profession: profession.trim(),
    education: education.trim(),
    birthplace: birthplace.trim(),
    residence: residence.trim(),
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
    speed: Math.max(1, Number(speed) || 6),
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
    if (data.profession !== undefined) setProfession(data.profession || '');
    if (data.education !== undefined) setEducation(data.education || '');
    if (data.birthplace !== undefined) setBirthplace(data.birthplace || '');
    if (data.residence !== undefined) setResidence(data.residence || '');
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
    if (data.speed !== undefined) setSpeed(Number(data.speed) || 6);

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

  const handleToggleEditHeader = () => {
    if (isEditingHeader) {
      if (!firstName.trim() && !lastName.trim()) {
        setFirstName(initialData?.firstName || initialData?.name || 'Personaje');
      }
      const charObj = buildCharacterObject();
      if (onUpdate) {
        onUpdate(charObj);
      }
      setImportNotice('✓ Datos de identidad guardados correctamente');
      setTimeout(() => setImportNotice(null), 2500);
      setIsEditingHeader(false);
    } else {
      setIsEditingHeader(true);
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
          padding: '14px 20px',
          background: 'linear-gradient(180deg, #1b202b 0%, #131720 100%)',
          borderBottom: '1px solid #2e3446',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div>
            <div className="vtt-gothic-title" style={{ fontSize: '18px', color: '#f8fafc', fontWeight: 800 }}>
              {mode === 'create' ? 'Nuevo Personaje' : (fullName || 'Ficha de Personaje')}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Botón de Modo Edición de Cabecera (Autoguarda al cerrar) */}
            <button
              type="button"
              onClick={handleToggleEditHeader}
              className="vtt-brass-btn"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isEditingHeader
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.4) 100%)'
                  : 'rgba(30, 41, 59, 0.6)',
                borderColor: isEditingHeader ? '#f59e0b' : '#3b4356',
                color: isEditingHeader ? '#fbbf24' : '#cbd5e1',
                boxShadow: isEditingHeader ? '0 0 10px rgba(245, 158, 11, 0.45)' : 'none',
                transition: 'all 0.15s ease'
              }}
              title={isEditingHeader ? "Cerrar modo edición (autoguardar cambios)" : "Activar modo edición de identidad"}
            >
              {isEditingHeader ? '💾' : '✏️'}
            </button>
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
            /* VISTA DOSSIER / PERFIL FIJO (Diseño limpio y sobrio sin pastillas ni iconos) */
            <div style={{ display: 'flex', alignItems: 'center', gap: '22px', width: '100%' }}>
              {/* Avatar con borde de color */}
              <div
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: isGraveWound ? '3px solid #ef4444' : `3px solid ${color || '#f59e0b'}`,
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
                  <span style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', opacity: 0.75 }}>
                    {(firstName || fullName || 'P').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Datos del personaje en formato editorial limpio */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                {/* Línea 1: Nombre y subtítulo de identidad */}
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
                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                        {profession}
                      </span>
                    )}
                    {profession && <span style={{ color: '#475569' }}>•</span>}
                    <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
                      {getClassificationMeta(entityType).label}
                    </span>
                  </div>
                </div>

                {/* Línea 2: Metadatos biográficos sobrios */}
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
            </div>
          ) : (
            /* VISTA FORMULARIO ACTIVO DE EDICIÓN */
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', width: '100%' }}>
              {/* Avatar con botón de cambiar / quitar foto */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: '3px solid #f59e0b',
                    boxShadow: '0 0 14px rgba(245, 158, 11, 0.4)',
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
                    <span style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', opacity: 0.75 }}>
                      {(firstName || fullName || 'P').charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fbbf24',
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

              {/* Formulario editable de 2 filas */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
                {/* Fila 1: Datos principales */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 85px 190px 115px 45px', gap: '8px', alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#93c5fd', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Nombre *</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ej: Arthur / Cthulhu"
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
                      <optgroup label="📖 Archivo de Personajes">
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

                {/* Fila 2: Biografía y Origen (Profesión, Estudios, Lugar de Nacimiento, Residencia) */}
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
            </div>
          )}
        </div>

        {/* Navegación por Pestañas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#0e1017', borderBottom: '1px solid #262b3a' }}>
          {[
            { id: 'stats', label: 'Vitalidad, Cordura y Armadura' },
            { id: 'inventory', label: `Inventario (${inventory.length})` },
            { id: 'grimoire', label: `Grimorio (${spells.length})` },
            { id: 'lore', label: 'Historia Personal y Notas' }
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
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#f87171' }}>Puntos de Salud (PV)</span>
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
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#60a5fa' }}>Puntos de Magia (MP)</span>
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
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#facc15' }}>Cordura (SAN)</span>
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
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>Protección y Armadura</span>
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
                      {hasArmor ? 'Lleva Armadura: SÍ' : 'Sin Armadura'}
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
                        boxShadow: isGraveWound ? '0 0 16px rgba(239, 68, 68, 0.6)' : 'none'
                      }}
                    >
                      {isGraveWound ? '⚠️ HERIDA GRAVE ACTIVA' : 'Estable (Sin Herida Grave)'}
                    </button>
                  </div>
                </div>

                {/* Velocidad / Capacidad de Movimiento */}
                <div style={{
                  background: '#141822',
                  border: '1px solid #262b38',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🏃</span> Velocidad Base por Turno
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
          )}

          {/* PESTAÑA 2: INVENTARIO POR HUECOS */}
          {activeTab === 'inventory' && (() => {
            const NORMAL_SLOTS_COUNT = 10;
            const BACKPACK_SLOTS_COUNT = 10;

            // 1. Mochila: Solo expande si se lleva en el inventario normal (huecos 0 a 9)
            const backpackInNormal = inventory.find(i => {
              const isBackpack = (i.extraSlots && Number(i.extraSlots) > 0) || (i.name && /mochila|backpack|morral/i.test(i.name));
              if (!isBackpack) return false;
              return (!i.state || i.state !== 'stored') && (i.container !== 'backpack') && (typeof i.slotIndex !== 'number' || i.slotIndex < NORMAL_SLOTS_COUNT);
            });
            const hasBackpack = Boolean(backpackInNormal);

            // 2. Mapeo de huecos de "Inventario" (10 huecos) y "Mochila" (10 huecos si aplica)
            const equippedItems = inventory.filter(i => i.state !== 'stored');
            const inventorySlots = Array.from({ length: NORMAL_SLOTS_COUNT }, () => null);
            const backpackSlots = hasBackpack ? Array.from({ length: BACKPACK_SLOTS_COUNT }, () => null) : [];
            const unplacedEquipped = [];

            // Solo colocamos en la mochila si hasBackpack es true Y el objeto fue asignado explícitamente a la mochila (container === 'backpack')
            equippedItems.forEach(item => {
              const belongsToBackpack = hasBackpack && item.id !== backpackInNormal?.id && item.container === 'backpack';

              if (belongsToBackpack) {
                const bpIdx = typeof item.slotIndex === 'number'
                  ? (item.slotIndex >= NORMAL_SLOTS_COUNT ? item.slotIndex - NORMAL_SLOTS_COUNT : item.slotIndex)
                  : -1;
                if (bpIdx >= 0 && bpIdx < BACKPACK_SLOTS_COUNT && !backpackSlots[bpIdx]) {
                  backpackSlots[bpIdx] = item;
                } else {
                  const freeBp = backpackSlots.findIndex(s => s === null);
                  if (freeBp !== -1) {
                    backpackSlots[freeBp] = item;
                  } else {
                    unplacedEquipped.push(item);
                  }
                }
              } else {
                // Pertenece estrictamente al inventario normal (1 - 10)
                const invIdx = (typeof item.slotIndex === 'number' && item.slotIndex < NORMAL_SLOTS_COUNT) ? item.slotIndex : -1;
                if (invIdx >= 0 && invIdx < NORMAL_SLOTS_COUNT && !inventorySlots[invIdx]) {
                  inventorySlots[invIdx] = item;
                } else {
                  unplacedEquipped.push(item);
                }
              }
            });

            // Los objetos no ubicados se colocan estrictamente en huecos libres del inventario normal (NUNCA pasan solos a la mochila)
            unplacedEquipped.forEach(item => {
              const freeInv = inventorySlots.findIndex(s => s === null);
              if (freeInv !== -1) {
                inventorySlots[freeInv] = { ...item, slotIndex: freeInv, container: 'inventory' };
              }
            });

            // 3. Mapeo de "No lo lleva" (ilimitado)
            const storedItems = inventory.filter(i => i.state === 'stored');

            // Objeto actualmente examinado
            const selectedItem = inventory.find(i => String(i.id) === String(selectedItemId)) || null;

            // Mover objeto a cualquier sección y hueco
            const handleMoveItemToSectionSlot = (sourceId, targetSection, targetSlotIdx) => {
              if (!sourceId) return;
              const source = inventory.find(i => String(i.id) === String(sourceId));
              if (!source) return;

              if (targetSection === 'inventory') {
                const existingInInv = inventorySlots[targetSlotIdx];
                if (existingInInv && String(existingInInv.id) !== String(source.id)) {
                  setInventory(prev => prev.map(item => {
                    if (String(item.id) === String(source.id)) {
                      return { ...item, state: 'equipped', container: 'inventory', slotIndex: targetSlotIdx };
                    }
                    if (String(item.id) === String(existingInInv.id)) {
                      return {
                        ...item,
                        state: source.state || 'equipped',
                        container: source.container || (typeof source.slotIndex === 'number' && source.slotIndex >= NORMAL_SLOTS_COUNT ? 'backpack' : 'inventory'),
                        slotIndex: source.slotIndex
                      };
                    }
                    return item;
                  }));
                } else {
                  setInventory(prev => prev.map(item => {
                    if (String(item.id) === String(source.id)) {
                      return { ...item, state: 'equipped', container: 'inventory', slotIndex: targetSlotIdx };
                    }
                    return item;
                  }));
                }
              } else if (targetSection === 'backpack') {
                const existingInBp = backpackSlots[targetSlotIdx];
                if (existingInBp && String(existingInBp.id) !== String(source.id)) {
                  setInventory(prev => prev.map(item => {
                    if (String(item.id) === String(source.id)) {
                      return { ...item, state: 'equipped', container: 'backpack', slotIndex: targetSlotIdx };
                    }
                    if (String(item.id) === String(existingInBp.id)) {
                      return {
                        ...item,
                        state: source.state || 'equipped',
                        container: source.container === 'backpack' ? 'backpack' : 'inventory',
                        slotIndex: source.slotIndex ?? 0
                      };
                    }
                    return item;
                  }));
                } else {
                  setInventory(prev => prev.map(item => {
                    if (String(item.id) === String(source.id)) {
                      return { ...item, state: 'equipped', container: 'backpack', slotIndex: targetSlotIdx };
                    }
                    return item;
                  }));
                }
              } else if (targetSection === 'stored') {
                setInventory(prev => prev.map(item => {
                  if (String(item.id) === String(source.id)) {
                    return { ...item, state: 'stored', container: 'stored', slotIndex: targetSlotIdx };
                  }
                  return item;
                }));
              }

              setSelectedItemId(source.id);
              setMovingItemId(null);
              setDraggedItemId(null);
              setDragOverTarget(null);
            };

            // Añadir nuevo objeto al inventario
            const handleAddInventoryItem = (name, icon = null, category = 'General', extraSlots = 0, notes = '') => {
              if (!name.trim()) return;
              const isBackpack = /mochila|backpack|morral/i.test(name);
              const resolvedExtra = extraSlots || (isBackpack ? 10 : 0);

              let targetState = 'equipped';
              let targetSlot = 0;
              let targetContainer = 'inventory';

              const freeInv = inventorySlots.findIndex(s => s === null);
              if (freeInv !== -1) {
                targetState = 'equipped';
                targetSlot = freeInv;
                targetContainer = 'inventory';
              } else if (hasBackpack && !isBackpack && backpackSlots.findIndex(s => s === null) !== -1) {
                targetState = 'equipped';
                targetSlot = backpackSlots.findIndex(s => s === null);
                targetContainer = 'backpack';
              } else {
                targetState = 'stored';
                targetSlot = storedItems.length;
                targetContainer = 'stored';
              }

              const newItem = {
                id: Date.now() + Math.random(),
                name: name.trim(),
                state: targetState,
                container: targetContainer,
                icon: icon || getItemIcon({ name }),
                category: category || (isBackpack ? 'Supervivencia' : 'General'),
                notes: notes || '',
                slotIndex: targetSlot,
                extraSlots: resolvedExtra
              };

              setInventory(prev => [...prev, newItem]);
              setSelectedItemId(newItem.id);
              setNewItemName('');
            };

            const handleRemoveInventoryItem = (itemId) => {
              setInventory(prev => prev.filter(i => i.id !== itemId));
              if (selectedItemId === itemId) setSelectedItemId(null);
              if (movingItemId === itemId) setMovingItemId(null);
            };

            const handleDropInventoryItem = (item) => {
              if (!item) return;
              if (onDropItemToFloor) {
                onDropItemToFloor(initialData?.id, item);
              }
              handleRemoveInventoryItem(item.id);
            };

            const handleUpdateItemNotes = (itemId, newNotes) => {
              setInventory(prev => prev.map(i => i.id === itemId ? { ...i, notes: newNotes } : i));
            };

            // Lista de destinatarios disponibles para transferir objetos
            const currentId = initialData?.id;
            const currentName = initialData?.name || fullName;
            const recipientMap = new Map();

            (tokens || []).forEach(t => {
              if (t.id === currentId || t.characterId === currentId || (currentName && t.name === currentName)) return;
              const key = t.characterId || t.id;
              if (!recipientMap.has(key)) {
                recipientMap.set(key, {
                  id: t.id,
                  characterId: t.characterId,
                  name: t.name || 'Combatiente',
                  avatar: t.avatar || null,
                  color: t.color || '#3b82f6',
                  faction: t.faction || 'ally',
                  isTokenOnBoard: true
                });
              }
            });

            (characters || []).forEach(c => {
              if (c.id === currentId || (currentName && c.name === currentName)) return;
              if (!recipientMap.has(c.id)) {
                recipientMap.set(c.id, {
                  id: c.id,
                  characterId: c.id,
                  name: c.name || 'Personaje',
                  avatar: c.avatar || null,
                  color: c.color || '#3b82f6',
                  faction: c.faction || 'ally',
                  isTokenOnBoard: false
                });
              }
            });

            const availableRecipients = Array.from(recipientMap.values());

            // Renderizado de cada casilla de hueco rediseñada con fondo blanco, icono centrado y nombre alineado abajo a la derecha
            const renderSlotCard = (item, displayNum, section, index, isBackpackSlot = false) => {
              const isOccupied = Boolean(item);
              const isSelected = item && selectedItem?.id === item.id;
              const isMovingSource = item && movingItemId === item.id;
              const isDragOver = dragOverTarget?.section === section && dragOverTarget?.index === index;

              // Comprobación de coincidencia con el buscador de inventario
              const matchesSearch = !inventorySearch.trim() || (isOccupied && (
                item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                (item.notes && item.notes.toLowerCase().includes(inventorySearch.toLowerCase())) ||
                (item.category && item.category.toLowerCase().includes(inventorySearch.toLowerCase()))
              ));

              const sectionColors = {
                inventory: { border: '#10b981', dot: '#10b981', label: 'Inventario', lightBorder: '#a7f3d0' },
                backpack: { border: '#f59e0b', dot: '#f59e0b', label: 'Mochila', lightBorder: '#fde68a' },
                stored: { border: '#64748b', dot: '#64748b', label: 'No lo lleva', lightBorder: '#cbd5e1' }
              };
              const sColor = sectionColors[section] || sectionColors.inventory;

              return (
                <div
                  key={`slot-${section}-${index}`}
                  draggable={isOccupied}
                  onDragStart={(e) => {
                    if (!isOccupied) return;
                    e.dataTransfer.setData('text/plain', String(item.id));
                    setDraggedItemId(item.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverTarget?.section !== section || dragOverTarget?.index !== index) {
                      setDragOverTarget({ section, index });
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverTarget?.section === section && dragOverTarget?.index === index) {
                      setDragOverTarget(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const sourceId = draggedItemId !== null ? draggedItemId : e.dataTransfer.getData('text/plain');
                    if (sourceId) {
                      handleMoveItemToSectionSlot(sourceId, section, index);
                    }
                    setDraggedItemId(null);
                    setDragOverTarget(null);
                  }}
                  onClick={() => {
                    if (movingItemId !== null) {
                      handleMoveItemToSectionSlot(movingItemId, section, index);
                    } else if (isOccupied) {
                      setSelectedItemId(item.id);
                      setShowTransferMenu(false);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isOccupied) {
                      setContextMenu({
                        item,
                        section,
                        index,
                        x: e.clientX,
                        y: e.clientY
                      });
                      setSelectedItemId(item.id);
                      setShowTransferMenu(false);
                    }
                  }}
                  style={{
                    aspectRatio: '1 / 1',
                    width: '100%',
                    minWidth: 0,
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    borderRadius: '7px',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '4px 5px',
                    cursor: movingItemId !== null ? 'pointer' : (isOccupied ? 'grab' : 'pointer'),
                    transition: 'all 0.15s ease',
                    backgroundColor: '#ffffff',
                    border: isMovingSource
                      ? '2px solid #f59e0b'
                      : isDragOver
                      ? '2px dashed #10b981'
                      : movingItemId !== null
                      ? '1.5px dashed #f59e0b'
                      : isSelected && isOccupied
                      ? '2px solid #2563eb'
                      : isOccupied
                      ? `1.5px solid ${sColor.border}`
                      : isBackpackSlot
                      ? '1px dashed #fcd34d'
                      : '1px dashed #cbd5e1',
                    boxShadow: isSelected && isOccupied
                      ? '0 0 0 2px rgba(37, 99, 235, 0.25), 0 3px 8px rgba(0,0,0,0.15)'
                      : isMovingSource
                      ? '0 0 10px rgba(245, 158, 11, 0.5)'
                      : isOccupied
                      ? '0 1px 4px rgba(0,0,0,0.06)'
                      : 'none',
                    opacity: inventorySearch.trim() && !matchesSearch ? 0.25 : 1,
                    userSelect: 'none'
                  }}
                  title={
                    movingItemId !== null
                      ? `Haz clic para mover aquí al Hueco #${displayNum} (${sColor.label})`
                      : isOccupied
                      ? `${item.name} (${sColor.label})${item.notes ? `\nNotas: ${item.notes}` : ''}\n• Clic derecho: Menú de acciones (Monkey Island)\n• Arrastra para mover`
                      : `Hueco #${displayNum} (${sColor.label}) - Vacío`
                  }
                >
                  {/* Fila superior: Número a la izquierda en badge nítido, Punto de sección a la derecha */}
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '8px',
                      fontWeight: 800,
                      letterSpacing: '0.02em',
                      color: isOccupied ? '#475569' : '#94a3b8',
                      backgroundColor: isOccupied ? '#f1f5f9' : '#f8fafc',
                      padding: '0 3px',
                      borderRadius: '3px',
                      border: '1px solid #e2e8f0',
                      fontFamily: 'monospace',
                      lineHeight: '11px'
                    }}>
                      {displayNum.toString().padStart(2, '0')}
                    </span>
                    {isOccupied && (
                      <span
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          backgroundColor: sColor.dot,
                          boxShadow: `0 0 3px ${sColor.dot}`
                        }}
                        title={sColor.label}
                      />
                    )}
                  </div>

                  {/* Centro: Icono centrado y subido */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    marginTop: '-2px',
                    marginBottom: '2px',
                    filter: isOccupied ? 'drop-shadow(0 1px 3px rgba(0,0,0,0.18))' : 'none',
                    transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                    transition: 'transform 0.15s ease'
                  }}>
                    {isOccupied ? (
                      getItemIcon(item, 26)
                    ) : (
                      <span style={{ fontSize: '13px', color: movingItemId !== null ? '#f59e0b' : '#cbd5e1', fontWeight: 300 }}>
                        {movingItemId !== null ? '↷' : '+'}
                      </span>
                    )}
                  </div>

                  {/* Pie: Nombre del objeto alineado abajo a la derecha con solo borde superior */}
                  <div style={{
                    width: '100%',
                    borderTop: isOccupied
                      ? (isSelected ? '1px solid #3b82f6' : '1px solid #e2e8f0')
                      : '1px solid #f1f5f9',
                    paddingTop: '2px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    marginTop: 'auto'
                  }}>
                    {isOccupied ? (
                      <span
                        style={{
                          fontSize: '8px',
                          fontWeight: 800,
                          color: isSelected ? '#1d4ed8' : '#0f172a',
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%',
                          lineHeight: '10px'
                        }}
                        title={item.name}
                      >
                        {item.name}
                      </span>
                    ) : (
                      <span style={{ fontSize: '7.5px', fontWeight: 600, color: '#94a3b8', textAlign: 'right' }}>
                        Vacío
                      </span>
                    )}
                  </div>
                </div>
              );
            };

            // Renderizado del hueco dinámico extra en "No lo lleva" con fondo blanco
            const renderTrailingEmptySlot = (displayNum, targetIndex) => {
              const isDragOver = dragOverTarget?.section === 'stored' && dragOverTarget?.index === targetIndex;
              return (
                <div
                  key={`slot-stored-empty-${targetIndex}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverTarget?.section !== 'stored' || dragOverTarget?.index !== targetIndex) {
                      setDragOverTarget({ section: 'stored', index: targetIndex });
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverTarget?.section === 'stored' && dragOverTarget?.index === targetIndex) {
                      setDragOverTarget(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const sourceId = draggedItemId !== null ? draggedItemId : e.dataTransfer.getData('text/plain');
                    if (sourceId) {
                      handleMoveItemToSectionSlot(sourceId, 'stored', targetIndex);
                    }
                    setDraggedItemId(null);
                    setDragOverTarget(null);
                  }}
                  onClick={() => {
                    if (movingItemId !== null) {
                      handleMoveItemToSectionSlot(movingItemId, 'stored', targetIndex);
                    }
                  }}
                  style={{
                    aspectRatio: '1 / 1',
                    width: '100%',
                    minWidth: 0,
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    borderRadius: '7px',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '4px 5px',
                    cursor: movingItemId !== null ? 'pointer' : 'default',
                    backgroundColor: isDragOver ? '#ecfdf5' : '#ffffff',
                    border: isDragOver
                      ? '1.5px dashed #10b981'
                      : movingItemId !== null
                      ? '1.5px dashed #f59e0b'
                      : '1px dashed #cbd5e1',
                    transition: 'all 0.15s ease',
                    userSelect: 'none'
                  }}
                  title="Arrastra un objeto aquí para guardarlo en 'No lo lleva' (huecos ilimitados)"
                >
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
                    <span style={{ fontSize: '8px', fontWeight: 800, color: '#94a3b8', backgroundColor: '#f8fafc', padding: '0 3px', borderRadius: '3px', border: '1px solid #e2e8f0', fontFamily: 'monospace', lineHeight: '11px' }}>
                      {displayNum.toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: movingItemId !== null ? '#f59e0b' : '#94a3b8', fontSize: '14px', fontWeight: 300 }}>
                    {movingItemId !== null ? '↷' : '+'}
                  </div>
                  <div style={{
                    width: '100%',
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: '2px',
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}>
                    <span style={{ fontSize: '7.5px', fontWeight: 700, color: movingItemId !== null ? '#d97706' : '#64748b', textAlign: 'right' }}>
                      {movingItemId !== null ? 'Guardar' : '+'}
                    </span>
                  </div>
                </div>
              );
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Barra de Búsqueda y Gestión de Inventario */}
                <div style={{
                  background: '#121620',
                  border: '1px solid #242c3d',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  {/* Buscador de Objetos en Inventario / Almacén */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#0a0d14',
                    border: '1px solid #2b3548',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    flex: '1 1 200px',
                    minWidth: '180px',
                    maxWidth: '320px',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)'
                  }}>
                    <span style={{ color: '#64748b', fontSize: '11px', marginRight: '6px' }}>🔍</span>
                    <input
                      type="text"
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      placeholder="Buscar en inventario o almacén..."
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        color: '#f8fafc',
                        fontSize: '11px',
                        padding: '5px 0',
                        outline: 'none'
                      }}
                    />
                    {inventorySearch && (
                      <button
                        type="button"
                        onClick={() => setInventorySearch('')}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '11px', padding: '0 4px', fontWeight: 'bold' }}
                        title="Limpiar búsqueda"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Añadir Objeto Manual y Catálogo de Objetos Comunes */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddInventoryItem(newItemName);
                        }
                      }}
                      placeholder="Nombre del objeto..."
                      style={{ padding: '6px 10px', background: '#0a0d14', color: '#f8fafc', border: '1px solid #2b3548', borderRadius: '6px', fontSize: '11px', width: '150px' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddInventoryItem(newItemName)}
                      className="vtt-primary-cta"
                      style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
                    >
                      + Añadir
                    </button>
                    <div style={{ position: 'relative' }} ref={commonDropdownRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCommonDropdown(!showCommonDropdown);
                          setCommonFilter('');
                        }}
                        className="vtt-brass-btn"
                        style={{
                          padding: '6px 11px',
                          background: '#181e2b',
                          color: '#93c5fd',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        title="Seleccionar un objeto común o herramienta de exploración para añadir al inventario"
                      >
                        <span>+ Objeto común</span>
                        <span style={{ fontSize: '9px', opacity: 0.8 }}>{showCommonDropdown ? '▲' : '▼'}</span>
                      </button>

                      {showCommonDropdown && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          marginTop: '6px',
                          width: '290px',
                          maxHeight: '320px',
                          overflowY: 'auto',
                          background: '#141824',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          boxShadow: '0 12px 32px rgba(0,0,0,0.9), 0 0 10px rgba(59, 130, 246, 0.2)',
                          zIndex: 10000,
                          padding: '6px'
                        }}>
                          {/* Buscador interno del catálogo común */}
                          <div style={{ padding: '2px 2px 6px', borderBottom: '1px solid #222c3d', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#0a0d14', border: '1px solid #2f3b52', borderRadius: '5px', padding: '2px 8px' }}>
                              <span style={{ color: '#64748b', fontSize: '10px', marginRight: '5px' }}>🔍</span>
                              <input
                                type="text"
                                value={commonFilter}
                                onChange={(e) => setCommonFilter(e.target.value)}
                                placeholder="Filtrar objetos comunes..."
                                autoFocus
                                style={{
                                  width: '100%',
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#f8fafc',
                                  fontSize: '11px',
                                  padding: '4px 0',
                                  outline: 'none'
                                }}
                              />
                            </div>
                          </div>

                          {DEFAULT_COMMON_ITEMS
                            .filter(ci => !commonFilter.trim() || ci.name.toLowerCase().includes(commonFilter.toLowerCase()) || ci.category.toLowerCase().includes(commonFilter.toLowerCase()))
                            .map(ci => (
                              <div
                                key={ci.id}
                                onClick={() => {
                                  handleAddInventoryItem(ci.name, null, ci.category, ci.extraSlots, ci.notes);
                                  setShowCommonDropdown(false);
                                  setCommonFilter('');
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  transition: 'background 0.15s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1f2738'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <div style={{
                                  width: '26px',
                                  height: '26px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))'
                                }}>
                                  {getGameIconComponent(ci.name, 22)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {ci.name}
                                  </span>
                                  <span style={{ fontSize: '9px', color: '#64748b' }}>{ci.category}</span>
                                </div>
                              </div>
                            ))}
                          {DEFAULT_COMMON_ITEMS.filter(ci => !commonFilter.trim() || ci.name.toLowerCase().includes(commonFilter.toLowerCase()) || ci.category.toLowerCase().includes(commonFilter.toLowerCase())).length === 0 && (
                            <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', padding: '12px 6px', fontStyle: 'italic' }}>
                              No se encontraron objetos con ese nombre
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Banner de aviso cuando el modo "Mover hueco" está activo */}
                {movingItemId !== null && (
                  <div style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid #f59e0b',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: '#fbbf24',
                    fontSize: '12px',
                    fontWeight: 700
                  }}>
                    <span>⇄ Modo Mover activo: Haz clic en cualquier hueco o sección para colocar o intercambiar "{inventory.find(i => i.id === movingItemId)?.name || 'Objeto'}".</span>
                    <button
                      type="button"
                      onClick={() => setMovingItemId(null)}
                      style={{
                        background: '#0e1118',
                        border: '1px solid #fbbf24',
                        color: '#fbbf24',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 700
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {/* SECCIÓN 1: INVENTARIO (1 - 10) */}
                <div style={{
                  background: '#121622',
                  border: '1px solid #242c3d',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  overflow: 'hidden',
                  boxSizing: 'border-box'
                }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#cbd5e1',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    marginBottom: '10px',
                    paddingBottom: '6px',
                    borderBottom: '1px solid #1f2738',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Inventario (1 - 10)</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>Bolsillos y equipo que porta encima</span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, 74px)',
                    gap: '6px',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    {inventorySlots.map((item, i) => renderSlotCard(item, i + 1, 'inventory', i))}
                  </div>
                </div>

                {/* SECCIÓN 1b: MOCHILA (11 - 20) - SOLO SI LLEVA MOCHILA */}
                {hasBackpack && (
                  <div style={{
                    background: '#141419',
                    border: '1px solid #3b352b',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    overflow: 'hidden',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#fbbf24',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      marginBottom: '10px',
                      paddingBottom: '6px',
                      borderBottom: '1px solid #2e281f',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>Mochila (11 - 20)</span>
                      <span style={{ fontSize: '10px', color: '#a18855', fontWeight: 500 }}>Capacidad expandida por la mochila de viaje</span>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, 74px)',
                      gap: '6px',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      {backpackSlots.map((item, i) => renderSlotCard(item, i + 11, 'backpack', i, true))}
                    </div>
                  </div>
                )}

                {/* SECCIÓN 2: NO LO LLEVA (HUECOS ILIMITADOS) */}
                {(() => {
                  const displayedStoredItems = inventorySearch.trim()
                    ? storedItems.filter(item =>
                        item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                        (item.notes && item.notes.toLowerCase().includes(inventorySearch.toLowerCase())) ||
                        (item.category && item.category.toLowerCase().includes(inventorySearch.toLowerCase()))
                      )
                    : storedItems;

                  return (
                    <div style={{
                      background: '#10131b',
                      border: '1px solid #1f2535',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      overflow: 'hidden',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        marginBottom: '10px',
                        paddingBottom: '6px',
                        borderBottom: '1px solid #1a202c',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>No lo lleva (Almacén / Guardado)</span>
                          {inventorySearch.trim() && (
                            <span style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 700, textTransform: 'none', background: 'rgba(59, 130, 246, 0.15)', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                              Filtrados: {displayedStoredItems.length} de {storedItems.length}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, 74px)',
                        gap: '6px',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}>
                        {displayedStoredItems.map((item, i) => renderSlotCard(item, i + 1, 'stored', i))}
                        {renderTrailingEmptySlot(displayedStoredItems.length + 1, displayedStoredItems.length)}
                      </div>
                    </div>
                  );
                })()}

                {/* Notificación flotante de traspaso de objeto */}
                {transferToast && (
                  <div style={{
                    position: 'fixed',
                    bottom: '30px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 100002,
                    padding: '8px 18px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid #10b981',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.8), 0 0 15px rgba(16, 185, 129, 0.4)',
                    color: '#34d399',
                    fontSize: '12px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>🎁</span>
                    <span>{transferToast}</span>
                  </div>
                )}

                {/* MENÚ CONTEXTUAL ESTILO MONKEY ISLAND 3 (THE CURSE OF MONKEY ISLAND) */}
                {contextMenu && (() => {
                  const currentItem = inventory.find(i => String(i.id) === String(contextMenu.item?.id)) || contextMenu.item;
                  if (!currentItem) return null;

                  const isStored = currentItem.state === 'stored' || currentItem.container === 'stored';
                  const isBackpack = !isStored && currentItem.container === 'backpack';

                  const menuWidth = 270;
                  const posX = Math.max(16, Math.min(contextMenu.x - menuWidth / 2, window.innerWidth - menuWidth - 20));
                  const posY = Math.max(16, Math.min(contextMenu.y - 50, window.innerHeight - 420));

                  return (
                    <>
                      {/* Fondo invisible para cerrar al hacer clic fuera */}
                      <div
                        onClick={() => { setContextMenu(null); setShowTransferMenu(false); }}
                        onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); setShowTransferMenu(false); }}
                        style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
                      />

                      {/* Moneda de Acciones Monkey Island 3 */}
                      <div
                        style={{
                          position: 'fixed',
                          left: `${posX}px`,
                          top: `${posY}px`,
                          zIndex: 99999,
                          width: `${menuWidth}px`,
                          background: 'linear-gradient(180deg, #171d2b 0%, #0d1017 100%)',
                          border: '2px solid #b45309',
                          borderRadius: '16px',
                          boxShadow: '0 20px 50px rgba(0,0,0,0.95), 0 0 25px rgba(245, 158, 11, 0.25)',
                          padding: '16px 14px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        {/* Botón de cerrar ✕ */}
                        <button
                          type="button"
                          onClick={() => { setContextMenu(null); setShowTransferMenu(false); }}
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '12px',
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}
                        >
                          ✕
                        </button>

                        {/* Moneda de Oro Pirata (Emblema Central de Acción) */}
                        <div
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, #fde68a 0%, #d97706 65%, #78350f 100%)',
                            border: '3px solid #fef08a',
                            boxShadow: '0 0 20px rgba(245, 158, 11, 0.65), inset 0 2px 4px rgba(255,255,255,0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {getItemIcon(currentItem, 38)}
                        </div>

                        {/* Título y Ubicación */}
                        <div style={{ textAlign: 'center', width: '100%' }}>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#fef3c7', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                            {currentItem.name}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '4px' }}>
                            <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: '#1e283b', color: '#93c5fd', border: '1px solid #334155' }}>
                              {currentItem.category || 'Objeto'}
                            </span>
                            <span style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: isStored ? 'rgba(148, 163, 184, 0.15)' : (isBackpack ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)'),
                              color: isStored ? '#cbd5e1' : (isBackpack ? '#fbbf24' : '#38bdf8'),
                              border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                              {isStored ? 'No lo lleva' : (isBackpack ? `Mochila (#${(currentItem.slotIndex + 1).toString().padStart(2, '0')})` : `Inventario (#${((currentItem.slotIndex ?? 0) + 1).toString().padStart(2, '0')})`)}
                            </span>
                          </div>
                        </div>

                        {/* Campo de Notas del Objeto */}
                        <div style={{ width: '100%' }}>
                          <input
                            type="text"
                            value={currentItem.notes || ''}
                            onChange={(e) => handleUpdateItemNotes(currentItem.id, e.target.value)}
                            placeholder="📜 Añadir notas o estado..."
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              background: '#090b10',
                              border: '1px solid #334155',
                              borderRadius: '5px',
                              color: '#cbd5e1',
                              fontSize: '11px',
                              textAlign: 'center'
                            }}
                          />
                        </div>

                        {/* Lista de Acciones (Estilo Moneda Monkey Island 3) */}
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {/* ✋ Mover / Cambiar Hueco */}
                          <button
                            type="button"
                            onClick={() => {
                              setMovingItemId(currentItem.id);
                              setContextMenu(null);
                            }}
                            className="vtt-brass-btn"
                            style={{
                              width: '100%',
                              padding: '7px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                              gap: '8px',
                              borderColor: '#f59e0b',
                              color: '#fbbf24'
                            }}
                          >
                            <span>✋</span>
                            <span>Mover de hueco (⇄)</span>
                          </button>

                          {/* 🎒 Al Inventario */}
                          {(isStored || isBackpack) && (
                            <button
                              type="button"
                              onClick={() => {
                                const free = inventorySlots.findIndex(s => s === null);
                                if (free === -1) {
                                  alert('El inventario normal está lleno (10/10).');
                                  return;
                                }
                                handleMoveItemToSectionSlot(currentItem.id, 'inventory', free);
                                setContextMenu(null);
                              }}
                              className="vtt-brass-btn"
                              style={{
                                width: '100%',
                                padding: '7px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                gap: '8px',
                                borderColor: '#38bdf8',
                                color: '#38bdf8'
                              }}
                            >
                              <span>🎒</span>
                              <span>Poner en el Inventario</span>
                            </button>
                          )}

                          {/* 🎒 A la Mochila */}
                          {hasBackpack && !isBackpack && currentItem.id !== backpackInNormal?.id && (
                            <button
                              type="button"
                              onClick={() => {
                                const free = backpackSlots.findIndex(s => s === null);
                                if (free === -1) {
                                  alert('La mochila está llena (10/10).');
                                  return;
                                }
                                handleMoveItemToSectionSlot(currentItem.id, 'backpack', free);
                                setContextMenu(null);
                              }}
                              className="vtt-brass-btn"
                              style={{
                                width: '100%',
                                padding: '7px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                gap: '8px',
                                borderColor: '#fbbf24',
                                color: '#fbbf24'
                              }}
                            >
                              <span>🎒</span>
                              <span>Guardar en la Mochila</span>
                            </button>
                          )}

                          {/* 📦 A "No lo lleva" */}
                          {!isStored && (
                            <button
                              type="button"
                              onClick={() => {
                                handleMoveItemToSectionSlot(currentItem.id, 'stored', storedItems.length);
                                setContextMenu(null);
                              }}
                              className="vtt-brass-btn"
                              style={{
                                width: '100%',
                                padding: '7px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                gap: '8px',
                                borderColor: '#64748b',
                                color: '#cbd5e1'
                              }}
                            >
                              <span>📦</span>
                              <span>Dejar en "No lo lleva"</span>
                            </button>
                          )}

                          {/* 🫳 Al Suelo */}
                          {onDropItemToFloor && (
                            <button
                              type="button"
                              onClick={() => {
                                handleDropInventoryItem(currentItem);
                                setContextMenu(null);
                              }}
                              className="vtt-brass-btn"
                              style={{
                                width: '100%',
                                padding: '7px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                gap: '8px',
                                borderColor: 'rgba(239, 68, 68, 0.45)',
                                color: '#fca5a5'
                              }}
                            >
                              <span>🫳</span>
                              <span>Tirar al suelo del tablero</span>
                            </button>
                          )}

                          {/* 🎁 Dar a otro personaje */}
                          <button
                            type="button"
                            onClick={() => setShowTransferMenu(!showTransferMenu)}
                            className="vtt-brass-btn"
                            style={{
                              width: '100%',
                              padding: '7px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderColor: '#8b5cf6',
                              color: '#c084fc',
                              backgroundColor: showTransferMenu ? 'rgba(124, 58, 237, 0.2)' : 'transparent'
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>🎁</span>
                              <span>Dar a otro personaje</span>
                            </span>
                            <span style={{ fontSize: '10px' }}>{showTransferMenu ? '▲' : '▼'}</span>
                          </button>

                          {/* Submenú de Destinatarios de Traspaso */}
                          {showTransferMenu && (
                            <div style={{
                              background: '#0a0d14',
                              border: '1px solid #7c3aed',
                              borderRadius: '6px',
                              padding: '6px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              maxHeight: '140px',
                              overflowY: 'auto'
                            }}>
                              {availableRecipients.length > 0 ? (
                                availableRecipients.map(recipient => {
                                  const factionLabels = {
                                    player: { label: 'Jugador', bg: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '#10b981' },
                                    ally: { label: 'Aliado', bg: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '#3b82f6' },
                                    enemy: { label: 'Enemigo', bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '#ef4444' }
                                  };
                                  const fMeta = factionLabels[recipient.faction] || factionLabels.ally;

                                  return (
                                    <button
                                      key={recipient.id || recipient.characterId}
                                      type="button"
                                      onClick={() => {
                                        if (onTransferItem) {
                                          onTransferItem(initialData?.id, recipient.id || recipient.characterId, currentItem);
                                        }
                                        handleRemoveInventoryItem(currentItem.id);
                                        setContextMenu(null);
                                        setShowTransferMenu(false);
                                        setTransferToast(`"${currentItem.name}" entregado a ${recipient.name}`);
                                        setTimeout(() => setTransferToast(null), 3000);
                                      }}
                                      style={{
                                        padding: '4px 8px',
                                        background: '#131824',
                                        border: '1px solid #283347',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                      }}
                                    >
                                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {recipient.name}
                                      </span>
                                      <span style={{ fontSize: '8.5px', fontWeight: 700, padding: '1px 4px', borderRadius: '3px', background: fMeta.bg, color: fMeta.color, border: `1px solid ${fMeta.border}` }}>
                                        {fMeta.label}
                                      </span>
                                    </button>
                                  );
                                })
                              ) : (
                                <div style={{ fontSize: '10px', color: '#94a3b8', padding: '4px', textAlign: 'center' }}>
                                  No hay otros personajes disponibles.
                                </div>
                              )}
                            </div>
                          )}

                          {/* 🗑️ Eliminar */}
                          <button
                            type="button"
                            onClick={() => {
                              handleRemoveInventoryItem(currentItem.id);
                              setContextMenu(null);
                            }}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-start',
                              gap: '8px',
                              background: 'transparent',
                              border: '1px solid transparent',
                              color: '#ef4444'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
                          >
                            <span>🗑️</span>
                            <span>Eliminar objeto</span>
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            );
          })()}

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
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>Historia Personal y Biografía</label>
                <textarea
                  value={history}
                  onChange={(e) => setHistory(e.target.value)}
                  placeholder="Origen, familia, traumas, motivaciones y pasado del personaje..."
                  style={{ flex: 1, minHeight: '220px', padding: '12px', background: '#141822', color: '#f8fafc', border: '1px solid #2c3344', borderRadius: '10px', resize: 'none', fontSize: '13px', lineHeight: 1.5 }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#60a5fa' }}>Notas, Pistas y Apuntes de Partida</label>
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
            {hasArmor ? `Armadura: ${armorType}` : 'Sin armadura'} • {isGraveWound ? 'CON HERIDA GRAVE' : 'Estado estable'} • Movimiento: {speed} casillas ({speed * 5} ft)
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
              {mode === 'create' ? 'Crear y Guardar Personaje' : 'Guardar Cambios del Personaje'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheetModal;