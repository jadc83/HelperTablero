import React, { useState, useRef, useEffect } from 'react';

export const ENTITY_CLASSIFICATIONS = [
  { id: 'human', label: 'Humano / Investigador', group: 'character', icon: '🕵️', badgeColor: '#3b82f6' },
  { id: 'npc', label: 'Aliado / PNJ', group: 'character', icon: '🛡️', badgeColor: '#10b981' },
  { id: 'cultist', label: 'Cultista / Sectario', group: 'character', icon: '🗡️', badgeColor: '#a855f7' },
  { id: 'mythos_creature', label: 'Criatura de los Mitos', group: 'monster', icon: '🦑', badgeColor: '#ec4899' },
  { id: 'great_old_one', label: 'Dios Primigenio', group: 'monster', icon: '👁️', badgeColor: '#ef4444' },
  { id: 'outer_god', label: 'Dios Exterior', group: 'monster', icon: '🌌', badgeColor: '#8b5cf6' },
  { id: 'animal', label: 'Animal / Fauna', group: 'monster', icon: '🐺', badgeColor: '#eab308' },
  { id: 'undead', label: 'No-Muerto / Horror', group: 'monster', icon: '💀', badgeColor: '#64748b' },
  { id: 'aberration', label: 'Aberración Arcana', group: 'monster', icon: '🔮', badgeColor: '#06b6d4' }
];

export const getClassificationMeta = (entityType, faction = 'ally') => {
  const found = ENTITY_CLASSIFICATIONS.find(c => c.id === entityType);
  if (found) return found;
  return faction === 'enemy'
    ? ENTITY_CLASSIFICATIONS.find(c => c.id === 'mythos_creature')
    : ENTITY_CLASSIFICATIONS.find(c => c.id === 'human');
};

const EncyclopediaView = ({
  isOpen,
  initialCategory = 'character',
  characters = [],
  graveyard = [],
  onClose,
  onCreateNew,
  onEditCharacter,
  onDeleteCharacter,
  onSpawnOnBoard,
  onImportCharacters,
  onExportCharacters,
  onClearCategory,
  onLoadStarterPack,
  onReviveCharacter,
  onDeleteFromGraveyard,
  onClearGraveyard,
  onExportGraveyard
}) => {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setActiveCategory(initialCategory);
    setSelectedFilter('all');
  }, [initialCategory, isOpen]);

  const isGraveyard = activeCategory === 'graveyard';

  const categoryEntries = isGraveyard
    ? graveyard
    : characters.filter(c => {
        const meta = getClassificationMeta(c.entityType, c.faction);
        return meta.group === activeCategory;
      });

  const allyGraveyardCount = graveyard.filter(g => g.faction !== 'enemy').length;
  const enemyGraveyardCount = graveyard.filter(g => g.faction === 'enemy').length;

  const getEntryId = (e) => e?.graveyardId || e?.id;

  const filteredEntries = categoryEntries.filter(c => {
    if (isGraveyard) {
      const matchesFilter =
        selectedFilter === 'all' ||
        (selectedFilter === 'ally' && c.faction !== 'enemy') ||
        (selectedFilter === 'enemy' && c.faction === 'enemy');
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.sceneName || '').toLowerCase().includes(q) ||
        (c.notes || '').toLowerCase().includes(q) ||
        (c.history || '').toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    }

    const meta = getClassificationMeta(c.entityType, c.faction);
    const matchesFilter = selectedFilter === 'all' || meta.id === selectedFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.history || '').toLowerCase().includes(q) ||
      (c.notes || '').toLowerCase().includes(q) ||
      meta.label.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  useEffect(() => {
    if (filteredEntries.length > 0) {
      if (!selectedId || !filteredEntries.some(e => getEntryId(e) === selectedId)) {
        setSelectedId(getEntryId(filteredEntries[0]));
      }
    } else {
      setSelectedId(null);
    }
  }, [activeCategory, selectedFilter, searchQuery, characters, graveyard]);

  if (!isOpen) return null;

  const selectedEntity = filteredEntries.find(e => getEntryId(e) === selectedId) || filteredEntries[0] || null;
  const availableSubFilters = isGraveyard
    ? [
        { id: 'all', label: 'Todos', icon: '🪦', count: graveyard.length, badgeColor: '#94a3b8' },
        { id: 'ally', label: 'Aliados caídos', icon: '🛡️', count: allyGraveyardCount, badgeColor: '#3b82f6' },
        { id: 'enemy', label: 'Enemigos caídos', icon: '💀', count: enemyGraveyardCount, badgeColor: '#ef4444' }
      ]
    : ENTITY_CLASSIFICATIONS.filter(c => c.group === activeCategory);

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        if (onImportCharacters) {
          onImportCharacters(
            list.map(item => ({
              ...item,
              id: Date.now() + Math.random(),
              entityType: item.entityType || (activeCategory === 'monster' ? 'mythos_creature' : 'human')
            }))
          );
        }
      } catch (err) {}
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 95000,
        backgroundColor: '#080a0f',
        backgroundImage: `
          radial-gradient(circle at 15% 15%, rgba(245, 158, 11, 0.07) 0%, transparent 45%),
          radial-gradient(circle at 85% 85%, rgba(139, 92, 246, 0.07) 0%, transparent 45%)
        `,
        display: 'flex',
        flexDirection: 'column',
        color: '#e2e8f0',
        overflow: 'hidden'
      }}
    >
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={handleImportFile}
        style={{ display: 'none' }}
      />

      <div style={{
        height: '66px',
        padding: '0 28px',
        background: 'linear-gradient(180deg, #151924 0%, #0e1118 100%)',
        borderBottom: '1px solid #282f42',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: isGraveyard
                ? 'linear-gradient(135deg, #475569 0%, #1e293b 100%)'
                : activeCategory === 'character'
                ? 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)'
                : 'linear-gradient(135deg, #8b5cf6 0%, #4c1d95 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              border: isGraveyard ? '1px solid #94a3b8' : activeCategory === 'character' ? '1px solid #fbbf24' : '1px solid #c4b5fd'
            }}>
              {isGraveyard ? '🪦' : activeCategory === 'character' ? '📖' : '👁️'}
            </div>
            <div>
              <div className="vtt-gothic-title" style={{ fontSize: '18px', fontWeight: 'bold', color: '#f8fafc' }}>
                {isGraveyard
                  ? 'CRIPTA Y REGISTRO DE BAJAS'
                  : activeCategory === 'character'
                  ? 'ENCICLOPEDIA DE PERSONAJES'
                  : 'BIBLIOTECA DEL BESTIARIO Y LOS MITOS'}
              </div>
              <div className="vtt-retro-badge" style={{ fontSize: '10px', color: '#94a3b8' }}>
                {isGraveyard ? `${graveyard.length} CAÍDOS EN BATALLA` : `${categoryEntries.length} REGISTROS EN ESTA BIBLIOTECA`}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '6px',
            backgroundColor: '#090b10',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid #262c3d',
            marginLeft: '10px'
          }}>
            <button
              onClick={() => { setActiveCategory('character'); setSelectedFilter('all'); }}
              style={{
                padding: '7px 14px',
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                background: activeCategory === 'character' ? '#f59e0b' : 'transparent',
                color: activeCategory === 'character' ? '#0f1115' : '#94a3b8',
                transition: 'all 0.15s'
              }}
            >
              🕵️ Archivo de Personajes
            </button>
            <button
              onClick={() => { setActiveCategory('monster'); setSelectedFilter('all'); }}
              style={{
                padding: '7px 14px',
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                background: activeCategory === 'monster' ? '#8b5cf6' : 'transparent',
                color: activeCategory === 'monster' ? '#ffffff' : '#94a3b8',
                transition: 'all 0.15s'
              }}
            >
              🦑 Criaturas de los mitos
            </button>
            <button
              onClick={() => { setActiveCategory('graveyard'); setSelectedFilter('all'); }}
              style={{
                padding: '7px 14px',
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                background: activeCategory === 'graveyard' ? '#475569' : 'transparent',
                color: activeCategory === 'graveyard' ? '#f8fafc' : '#94a3b8',
                transition: 'all 0.15s'
              }}
            >
              🪦 Cripta y Cementerio ({graveyard.length})
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isGraveyard ? (
            <>
              <button
                onClick={() => {
                  if (onExportGraveyard) onExportGraveyard(graveyard);
                  else if (onExportCharacters) onExportCharacters(graveyard, 'graveyard');
                }}
                className="vtt-brass-btn"
                style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                title="Exportar bajas registradas en formato .json"
              >
                📤 Exportar Bajas
              </button>

              {graveyard.length > 0 && onClearGraveyard && (
                <button
                  onClick={() => {
                    if (confirmClearAll) {
                      onClearGraveyard();
                      setConfirmClearAll(false);
                    } else {
                      setConfirmClearAll(true);
                      setTimeout(() => setConfirmClearAll(false), 3000);
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: confirmClearAll ? '#dc2626' : 'rgba(127, 29, 29, 0.25)',
                    color: confirmClearAll ? '#fff' : '#fca5a5',
                    border: '1px solid rgba(239, 68, 68, 0.45)'
                  }}
                  title="Vaciar todos los registros del cementerio"
                >
                  {confirmClearAll ? '⚠️ ¿Confirmar Vaciar Cripta?' : '⚰️ Vaciar Cementerio'}
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => onCreateNew && onCreateNew(activeCategory === 'monster' ? 'mythos_creature' : 'human')}
                className="vtt-primary-cta"
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
              >
                + {activeCategory === 'character' ? 'Inscribir Personaje' : 'Registrar Criatura / Entidad'}
              </button>

              <button
                onClick={() => fileInputRef.current.click()}
                className="vtt-brass-btn"
                style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                title="Importar fichas desde un archivo .json"
              >
                📥 Importar JSON
              </button>

              <button
                onClick={() => onExportCharacters && onExportCharacters(categoryEntries, activeCategory)}
                className="vtt-brass-btn"
                style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                title="Exportar esta biblioteca a un archivo .json"
              >
                📤 Exportar
              </button>

              {onLoadStarterPack && (
                <button
                  onClick={() => onLoadStarterPack(activeCategory)}
                  className="vtt-brass-btn"
                  style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: '#93c5fd', borderColor: '#3b82f6' }}
                  title="Añade fichas de muestra listas para usar"
                >
                  ✨ Cargar Ejemplos
                </button>
              )}

              {categoryEntries.length > 0 && onClearCategory && (
                <button
                  onClick={() => {
                    if (confirmClearAll) {
                      onClearCategory(activeCategory);
                      setConfirmClearAll(false);
                    } else {
                      setConfirmClearAll(true);
                      setTimeout(() => setConfirmClearAll(false), 3000);
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: confirmClearAll ? '#dc2626' : 'rgba(127, 29, 29, 0.25)',
                    color: confirmClearAll ? '#fff' : '#fca5a5',
                    border: '1px solid rgba(239, 68, 68, 0.45)'
                  }}
                  title="Elimina todas las entradas de esta biblioteca para empezar desde cero"
                >
                  {confirmClearAll ? '¿Confirmar vaciar?' : 'Limpiar todos'}
                </button>
              )}
            </>
          )}

          <div style={{ width: '1px', height: '24px', backgroundColor: '#282f42', margin: '0 4px' }} />

          <button
            onClick={onClose}
            className="vtt-brass-btn"
            style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            ⬅️ Volver
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{
          width: '350px',
          backgroundColor: '#0e1118',
          borderRight: '1px solid #242a3a',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #1f2533', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isGraveyard ? '🔍 Buscar caído por nombre, escena o notas...' : activeCategory === 'character' ? '🔍 Buscar investigador, PNJ o sectario...' : '🔍 Buscar criatura, dios o animal...'}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: '#151924',
                border: '1px solid #2e364a',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '13px'
              }}
            />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              <button
                onClick={() => setSelectedFilter('all')}
                style={{
                  padding: '4px 9px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: selectedFilter === 'all' ? (isGraveyard ? '1px solid #94a3b8' : '1px solid #fbbf24') : '1px solid #293042',
                  backgroundColor: selectedFilter === 'all' ? (isGraveyard ? 'rgba(148, 163, 184, 0.2)' : 'rgba(245, 158, 11, 0.2)') : '#141822',
                  color: selectedFilter === 'all' ? (isGraveyard ? '#f8fafc' : '#fbbf24') : '#94a3b8'
                }}
              >
                Todos ({categoryEntries.length})
              </button>
              {availableSubFilters.map(sub => {
                const count = isGraveyard
                  ? sub.count
                  : categoryEntries.filter(e => getClassificationMeta(e.entityType, e.faction).id === sub.id).length;
                const active = selectedFilter === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedFilter(sub.id)}
                    style={{
                      padding: '4px 9px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: active ? `1px solid ${sub.badgeColor}` : '1px solid #293042',
                      backgroundColor: active ? 'rgba(255, 255, 255, 0.08)' : '#141822',
                      color: active ? '#f8fafc' : '#94a3b8'
                    }}
                  >
                    {sub.icon} {sub.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredEntries.map(entry => {
              const entryId = getEntryId(entry);
              const isSelected = selectedEntity && getEntryId(selectedEntity) === entryId;
              const meta = getClassificationMeta(entry.entityType, entry.faction);
              return (
                <div
                  key={entryId}
                  onClick={() => setSelectedId(entryId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: isSelected
                      ? (isGraveyard ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.2) 0%, rgba(24, 29, 42, 0.9) 100%)' : 'linear-gradient(90deg, rgba(245, 158, 11, 0.18) 0%, rgba(24, 29, 42, 0.9) 100%)')
                      : '#141822',
                    border: isSelected ? (isGraveyard ? '1px solid #ef4444' : '1px solid #f59e0b') : '1px solid #242a3a',
                    transition: 'all 0.14s ease'
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    backgroundColor: entry.color || '#334155',
                    border: isGraveyard ? '2px solid #ef4444' : `2px solid ${meta.badgeColor}`,
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    position: 'relative'
                  }}>
                    {entry.avatar ? (
                      <img src={entry.avatar} alt={entry.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isGraveyard ? 'grayscale(0.6)' : 'none' }} />
                    ) : (
                      <span>{isGraveyard ? '💀' : meta.icon}</span>
                    )}
                    {isGraveyard && (
                      <div style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        backgroundColor: '#dc2626',
                        borderRadius: '50%',
                        width: '14px',
                        height: '14px',
                        fontSize: '9px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span style={{ fontWeight: 800, color: entry.faction === 'enemy' ? '#fca5a5' : '#93c5fd' }}>
                          {(entry.name || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: entry.isGraveWound ? '#fca5a5' : '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {entry.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                      <span style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        color: isGraveyard ? '#fca5a5' : meta.badgeColor,
                        fontWeight: 700
                      }}>
                        {isGraveyard ? `Caído en ${entry.sceneName || 'Tablero'}` : meta.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredEntries.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '32px 16px',
                color: '#64748b',
                fontSize: '13px',
                border: '1px dashed #282f42',
                borderRadius: '12px',
                marginTop: '12px'
              }}>
                <div style={{ fontSize: '30px', marginBottom: '8px' }}>
                  {isGraveyard ? '🪦' : activeCategory === 'character' ? '🕵️' : '🦑'}
                </div>
                <div style={{ fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                  {isGraveyard ? 'La Cripta Descansa en Silencio' : 'No hay registros en esta vista'}
                </div>
                <div style={{ fontSize: '12px', lineHeight: 1.5, marginBottom: '14px' }}>
                  {isGraveyard
                    ? 'Aún no ha caído ningún combatiente en la partida. Cuando un personaje caiga a 0 HP o pulses "Cripta" en el menú lateral, reposará aquí con todo su botín para saquearlo o resucitarlo.'
                    : 'Puedes crear uno nuevo desde cero, importar un archivo JSON o cargar ejemplos predefinidos.'}
                </div>
                {!isGraveyard && onLoadStarterPack && (
                  <button
                    onClick={() => onLoadStarterPack(activeCategory)}
                    className="vtt-brass-btn"
                    style={{ padding: '7px 14px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', color: '#fbbf24', borderColor: '#f59e0b' }}
                  >
                    ✨ Cargar Ejemplos Iniciales
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 44px' }}>
          {selectedEntity ? (() => {
            const meta = getClassificationMeta(selectedEntity.entityType, selectedEntity.faction);
            const equippedItems = (selectedEntity.inventory || []).filter(i => i.state === 'equipped');
            const handItems = (selectedEntity.inventory || []).filter(i => i.state === 'hand');
            const storedItems = (selectedEntity.inventory || []).filter(i => i.state === 'stored');

            return (
              <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '26px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '260px 1fr',
                  gap: '28px',
                  background: 'linear-gradient(180deg, #151924 0%, #0f131c 100%)',
                  border: selectedEntity.isGraveWound ? '2px solid #ef4444' : '1px solid #2b3346',
                  borderRadius: '16px',
                  padding: '26px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.65)'
                }}>
                  <div style={{
                    width: '260px',
                    height: '300px',
                    borderRadius: '12px',
                    backgroundColor: '#090b10',
                    border: `2px solid ${meta.badgeColor}`,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    {selectedEntity.avatar ? (
                      <img
                        src={selectedEntity.avatar}
                        alt={selectedEntity.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ fontSize: '68px', marginBottom: '10px' }}>{meta.icon}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Sin retrato ilustrado</div>
                      </div>
                    )}

                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      right: '10px',
                      background: 'rgba(9, 11, 16, 0.88)',
                      backdropFilter: 'blur(6px)',
                      border: `1px solid ${meta.badgeColor}`,
                      borderRadius: '8px',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#f8fafc'
                    }}>
                      <span>{meta.icon}</span>
                      <span>{meta.label}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '18px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                        <div>
                          <span className="vtt-retro-badge" style={{
                            fontSize: '10px',
                            color: isGraveyard ? '#f87171' : meta.badgeColor,
                            fontWeight: 800,
                            letterSpacing: '0.08em'
                          }}>
                            {isGraveyard
                              ? `REGISTRO FÚNEBRE • CAÍDO EN: ${(selectedEntity.sceneName || 'Tablero de Juego').toUpperCase()}`
                              : `EXPEDIENTE DE ARCHIVO • ${selectedEntity.faction === 'enemy' ? 'HOSTIL / BESTIARIO' : 'ALIADO / DRAMATIS PERSONAE'}`}
                          </span>
                          <h2 className="vtt-gothic-title" style={{ margin: '4px 0 0 0', fontSize: '30px', color: '#f8fafc' }}>
                            {isGraveyard ? '☠️ ' : ''}{selectedEntity.name}
                          </h2>
                          {isGraveyard && selectedEntity.fallenAt && (
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                              ⏳ Fallecido el {new Date(selectedEntity.fallenAt).toLocaleDateString()} a las {new Date(selectedEntity.fallenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {isGraveyard ? (
                            <>
                              {onReviveCharacter && (
                                <button
                                  onClick={() => onReviveCharacter(selectedEntity)}
                                  style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                                    color: '#ffffff',
                                    border: '1px solid #34d399',
                                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                                  }}
                                  title="Revive al personaje y lo devuelve al centro del tablero de juego"
                                >
                                  ✨ Resucitar al Tablero
                                </button>
                              )}
                              <button
                                onClick={() => onEditCharacter && onEditCharacter(selectedEntity)}
                                className="vtt-brass-btn"
                                style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                                title="Ver ficha completa y saquear objetos"
                              >
                                📋 Ver Ficha
                              </button>
                              {onDeleteFromGraveyard && (
                                <button
                                  onClick={() => onDeleteFromGraveyard(selectedEntity.graveyardId || selectedEntity.id)}
                                  style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    background: 'rgba(127, 29, 29, 0.25)',
                                    color: '#fca5a5',
                                    border: '1px solid rgba(239, 68, 68, 0.35)',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 700
                                  }}
                                  title="Eliminar permanentemente de la cripta"
                                >
                                  Purgar
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => onEditCharacter && onEditCharacter(selectedEntity)}
                                className="vtt-brass-btn"
                                style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                              >
                                Editar Ficha
                              </button>
                              {onSpawnOnBoard && (
                                <button
                                  onClick={() => onSpawnOnBoard(selectedEntity)}
                                  className="vtt-primary-cta"
                                  style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                                >
                                  🎯 Invocar en el Tablero
                                </button>
                              )}
                              {onDeleteCharacter && (
                                <button
                                  onClick={() => onDeleteCharacter(selectedEntity.id)}
                                  style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    background: 'rgba(127, 29, 29, 0.25)',
                                    color: '#fca5a5',
                                    border: '1px solid rgba(239, 68, 68, 0.35)',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 700
                                  }}
                                  title="Eliminar permanentemente de la enciclopedia"
                                >
                                  🗑️
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '10px',
                        marginTop: '18px',
                        padding: '12px 14px',
                        backgroundColor: '#0b0e15',
                        borderRadius: '10px',
                        border: '1px solid #222838'
                      }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Clasificación</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', marginTop: '2px' }}>{meta.icon} {meta.label}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Año / Época</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0', marginTop: '2px' }}>{selectedEntity.birthYear || 'Desconocido'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Protección / Armadura</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: selectedEntity.hasArmor ? '#93c5fd' : '#94a3b8', marginTop: '2px' }}>
                            {selectedEntity.hasArmor ? `🛡️ ${selectedEntity.armorType}` : 'Sin armadura'}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '6px' }}>
                          📜 Crónica y Descripción
                        </div>
                        <p style={{
                          margin: 0,
                          fontSize: '14px',
                          lineHeight: 1.65,
                          color: '#cbd5e1',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {selectedEntity.history || 'Sin historia o descripción registrada todavía. Pulsa "Editar Ficha" para documentar su trasfondo.'}
                        </p>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '14px',
                      borderTop: '1px solid #222838',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>ATRIBUTOS BASE:</span>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: isGraveyard ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.12)',
                          border: isGraveyard ? '1px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.35)',
                          color: isGraveyard ? '#f87171' : '#fca5a5',
                          fontSize: '12px',
                          fontWeight: 700
                        }}>
                          ❤️ Salud: {isGraveyard ? 0 : (selectedEntity.hp ?? 20)} / {selectedEntity.maxHp ?? 20} {isGraveyard ? '(Caído)' : ''}
                        </span>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(59, 130, 246, 0.12)',
                          border: '1px solid rgba(59, 130, 246, 0.35)',
                          color: '#93c5fd',
                          fontSize: '12px',
                          fontWeight: 700
                        }}>
                          💧 Magia: {selectedEntity.mp ?? 10} / {selectedEntity.maxMp ?? 10}
                        </span>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(250, 204, 21, 0.12)',
                          border: '1px solid rgba(250, 204, 21, 0.35)',
                          color: '#fde047',
                          fontSize: '12px',
                          fontWeight: 700
                        }}>
                          👁️ Cordura: {selectedEntity.san ?? 60} / {selectedEntity.maxSan ?? 60}
                        </span>
                      </div>

                      {isGraveyard ? (
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#475569',
                          border: '1px solid #94a3b8',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 800
                        }}>
                          🪦 EN LA CRIPTA
                        </span>
                      ) : selectedEntity.isGraveWound && (
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 800
                        }}>
                          🩸 HERIDA GRAVE ACTIVA
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px' }}>
                  <div style={{
                    background: '#131722',
                    border: '1px solid #262d40',
                    borderRadius: '14px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div className="vtt-gothic-title" style={{ fontSize: '15px', color: '#f8fafc', fontWeight: 'bold', borderBottom: '1px solid #222838', paddingBottom: '8px' }}>
                      🎒 {isGraveyard ? 'Botín Recuperable para Saqueo' : 'Pertenencias, Armas y Equipo'} ({(selectedEntity.inventory || []).length})
                    </div>

                    {isGraveyard && (
                      <div style={{ fontSize: '11px', color: '#fbbf24', fontStyle: 'italic', marginBottom: '2px' }}>
                        💰 Posesiones y botín del combatiente caído listas para ser saqueadas por los jugadores.
                      </div>
                    )}

                    {(selectedEntity.inventory || []).length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', padding: '12px 0' }}>
                        No se han registrado objetos ni armas en su ficha.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {equippedItems.length > 0 && (
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#4ade80', marginBottom: '4px' }}>🎒 Lleva Encima ({equippedItems.length})</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {equippedItems.map(item => (
                                <span key={item.id} style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.14)', border: '1px solid rgba(16, 185, 129, 0.35)', fontSize: '12px', color: '#d1fae5' }}>
                                  {item.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {handItems.length > 0 && (
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>🤝 A Mano / En los Alrededores ({handItems.length})</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {handItems.map(item => (
                                <span key={item.id} style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.14)', border: '1px solid rgba(245, 158, 11, 0.35)', fontSize: '12px', color: '#fef3c7' }}>
                                  {item.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {storedItems.length > 0 && (
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>📦 Guardado / No lo lleva encima ({storedItems.length})</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {storedItems.map(item => (
                                <span key={item.id} style={{ padding: '4px 10px', borderRadius: '6px', background: '#1a1f2e', border: '1px solid #2e364a', fontSize: '12px', color: '#94a3b8' }}>
                                  {item.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{
                    background: '#131722',
                    border: '1px solid #262d40',
                    borderRadius: '14px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div className="vtt-gothic-title" style={{ fontSize: '15px', color: '#f8fafc', fontWeight: 'bold', borderBottom: '1px solid #222838', paddingBottom: '8px' }}>
                      📖 Grimorio de Hechizos y Facultades ({(selectedEntity.spells || []).length})
                    </div>

                    {(selectedEntity.spells || []).length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', padding: '12px 0' }}>
                        Sin hechizos ni facultades arcanas inscritas.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(selectedEntity.spells || []).map(sp => (
                          <div key={sp.id} style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#0d1017', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>✨ {sp.name}</span>
                              <span className="vtt-retro-badge" style={{ fontSize: '10px', color: '#93c5fd', backgroundColor: 'rgba(59, 130, 246, 0.18)', padding: '2px 7px', borderRadius: '999px' }}>
                                {sp.cost}
                              </span>
                            </div>
                            {sp.desc && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{sp.desc}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedEntity.notes && (
                  <div style={{
                    background: '#131722',
                    border: '1px solid #262d40',
                    borderRadius: '14px',
                    padding: '20px'
                  }}>
                    <div className="vtt-gothic-title" style={{ fontSize: '15px', color: '#60a5fa', fontWeight: 'bold', marginBottom: '8px' }}>
                      📝 Notas, Debilidades y Apuntes de Partida
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
                      {selectedEntity.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })() : (
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '54px', marginBottom: '12px' }}>
                {activeCategory === 'character' ? '📖' : '👁️'}
              </div>
              <div className="vtt-gothic-title" style={{ fontSize: '20px', color: '#cbd5e1', marginBottom: '8px' }}>
                Selecciona una ficha del índice o crea un nuevo registro
              </div>
              <p style={{ maxWidth: '460px', fontSize: '13px', lineHeight: 1.6 }}>
                Usa el botón superior <strong>"+ {activeCategory === 'character' ? 'Inscribir Personaje' : 'Registrar Criatura / Entidad'}"</strong> para abrir el formulario con retrato, clasificación cósmica, historia, inventario y grimorio.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EncyclopediaView;