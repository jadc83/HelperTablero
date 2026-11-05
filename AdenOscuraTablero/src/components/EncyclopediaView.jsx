import React, { useState, useRef, useEffect } from 'react';

export const ENTITY_CLASSIFICATIONS = [
  { id: 'human', label: 'Humano / Investigador', group: 'character', badgeColor: '#3b82f6' },
  { id: 'npc', label: 'Aliado / PNJ', group: 'character', badgeColor: '#10b981' },
  { id: 'cultist', label: 'Cultista / Sectario', group: 'character', badgeColor: '#a855f7' },
  { id: 'mythos_creature', label: 'Criatura de los Mitos', group: 'monster', badgeColor: '#ec4899' },
  { id: 'great_old_one', label: 'Dios Primigenio', group: 'monster', badgeColor: '#ef4444' },
  { id: 'outer_god', label: 'Dios Exterior', group: 'monster', badgeColor: '#8b5cf6' },
  { id: 'animal', label: 'Animal / Fauna', group: 'monster', badgeColor: '#eab308' },
  { id: 'undead', label: 'No-Muerto / Horror', group: 'monster', badgeColor: '#64748b' },
  { id: 'aberration', label: 'Aberración Arcana', group: 'monster', badgeColor: '#06b6d4' }
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

  const activeBackgroundTexture = isGraveyard
    ? '/assets/textures/crypt_graveyard_bg.jpg'
    : activeCategory === 'character'
    ? '/assets/textures/archive_characters_bg.jpg'
    : '/assets/textures/bestiary_mythos_bg.jpg';

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
        { id: 'all', label: 'Todos', count: graveyard.length },
        { id: 'ally', label: 'Aliados caídos', count: allyGraveyardCount },
        { id: 'enemy', label: 'Enemigos caídos', count: enemyGraveyardCount }
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
        backgroundColor: '#07090e',
        backgroundImage: `
          linear-gradient(180deg, rgba(7, 9, 14, 0.88) 0%, rgba(5, 7, 10, 0.96) 100%),
          url("${activeBackgroundTexture}")
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
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

      {/* Barra superior con textura temática */}
      <div style={{
        height: '68px',
        padding: '0 28px',
        backgroundImage: isGraveyard
          ? 'linear-gradient(180deg, rgba(14, 18, 26, 0.8) 0%, rgba(9, 12, 18, 0.96) 100%), url("/assets/textures/crypt_graveyard_banner.jpg")'
          : activeCategory === 'character'
          ? 'linear-gradient(180deg, rgba(14, 18, 26, 0.8) 0%, rgba(9, 12, 18, 0.96) 100%), url("/assets/textures/encyclopedia_characters_banner.jpg")'
          : 'linear-gradient(180deg, rgba(14, 18, 26, 0.8) 0%, rgba(9, 12, 18, 0.96) 100%), url("/assets/textures/bestiary_mythos_banner.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderBottom: '1px solid #3d3020',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.75)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(180, 83, 9, 0.45) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Cinzel', Georgia, serif",
              fontSize: '13px',
              fontWeight: 800,
              color: '#fbbf24',
              letterSpacing: '0.08em',
              border: '1.5px solid #7c5826',
              boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.7), 0 2px 6px rgba(0, 0, 0, 0.5)'
            }}>
              {isGraveyard ? 'RIP' : activeCategory === 'character' ? 'ARC' : 'COD'}
            </div>
            <div>
              <div className="vtt-gothic-title" style={{ fontSize: '17px', fontWeight: 'bold', color: '#f8fafc', letterSpacing: '0.06em' }}>
                {isGraveyard
                  ? 'CRIPTA Y REGISTRO DE BAJAS'
                  : activeCategory === 'character'
                  ? 'ENCICLOPEDIA DE PERSONAJES'
                  : 'BIBLIOTECA DEL BESTIARIO Y LOS MITOS'}
              </div>
              <div className="vtt-retro-badge" style={{ fontSize: '10px', color: '#b49b78', marginTop: '2px' }}>
                {isGraveyard ? `${graveyard.length} COMBATIENTES FALLECIDOS` : `${categoryEntries.length} EXPEDIENTES EN ARCHIVO`}
              </div>
            </div>
          </div>

          {/* Selector de categoría sin iconos ni pastillas chillonas */}
          <div style={{
            display: 'flex',
            gap: '4px',
            backgroundColor: 'rgba(9, 12, 18, 0.88)',
            padding: '4px',
            borderRadius: '8px',
            border: '1px solid #2b3548',
            marginLeft: '8px'
          }}>
            <button
              onClick={() => { setActiveCategory('character'); setSelectedFilter('all'); }}
              style={{
                padding: '7px 16px',
                borderRadius: '6px',
                border: activeCategory === 'character' ? '1.5px solid #f59e0b' : '1.5px solid transparent',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                background: activeCategory === 'character'
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.32) 0%, rgba(180, 83, 9, 0.45) 100%)'
                  : 'transparent',
                color: activeCategory === 'character' ? '#fbbf24' : '#94a3b8',
                boxShadow: activeCategory === 'character' ? '0 2px 8px rgba(245, 158, 11, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Archivo de Personajes
            </button>
            <button
              onClick={() => { setActiveCategory('monster'); setSelectedFilter('all'); }}
              style={{
                padding: '7px 16px',
                borderRadius: '6px',
                border: activeCategory === 'monster' ? '1.5px solid #f59e0b' : '1.5px solid transparent',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                background: activeCategory === 'monster'
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.32) 0%, rgba(180, 83, 9, 0.45) 100%)'
                  : 'transparent',
                color: activeCategory === 'monster' ? '#fbbf24' : '#94a3b8',
                boxShadow: activeCategory === 'monster' ? '0 2px 8px rgba(245, 158, 11, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Criaturas de los Mitos
            </button>
            <button
              onClick={() => { setActiveCategory('graveyard'); setSelectedFilter('all'); }}
              style={{
                padding: '7px 16px',
                borderRadius: '6px',
                border: activeCategory === 'graveyard' ? '1.5px solid #f59e0b' : '1.5px solid transparent',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                background: activeCategory === 'graveyard'
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.32) 0%, rgba(180, 83, 9, 0.45) 100%)'
                  : 'transparent',
                color: activeCategory === 'graveyard' ? '#fbbf24' : '#94a3b8',
                boxShadow: activeCategory === 'graveyard' ? '0 2px 8px rgba(245, 158, 11, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Cripta y Cementerio ({graveyard.length})
            </button>
          </div>
        </div>

        {/* Acciones superiores sin iconos */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isGraveyard ? (
            <>
              <button
                onClick={() => {
                  if (onExportGraveyard) onExportGraveyard(graveyard);
                  else if (onExportCharacters) onExportCharacters(graveyard, 'graveyard');
                }}
                className="vtt-brass-btn"
                style={{ padding: '8px 14px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}
                title="Exportar bajas registradas en formato .json"
              >
                Exportar Bajas
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
                  className="vtt-btn-danger"
                  style={{
                    padding: '8px 14px',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Vaciar todos los registros del cementerio"
                >
                  {confirmClearAll ? 'Confirmar Vaciar Cripta' : 'Vaciar Cementerio'}
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => onCreateNew && onCreateNew(activeCategory === 'monster' ? 'mythos_creature' : 'human')}
                className="vtt-primary-cta"
                style={{ padding: '8px 18px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}
              >
                {activeCategory === 'character' ? 'Inscribir Personaje' : 'Registrar Criatura'}
              </button>

              <button
                onClick={() => fileInputRef.current.click()}
                className="vtt-brass-btn"
                style={{ padding: '8px 14px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}
                title="Importar fichas desde un archivo .json"
              >
                Importar JSON
              </button>

              <button
                onClick={() => onExportCharacters && onExportCharacters(categoryEntries, activeCategory)}
                className="vtt-brass-btn"
                style={{ padding: '8px 14px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}
                title="Exportar esta biblioteca a un archivo .json"
              >
                Exportar
              </button>

              {onLoadStarterPack && (
                <button
                  onClick={() => onLoadStarterPack(activeCategory)}
                  className="vtt-brass-btn"
                  style={{ padding: '8px 14px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer', color: '#fbbf24', borderColor: '#7c5826' }}
                  title="Añade fichas de muestra listas para usar"
                >
                  Cargar Ejemplos
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
                  className="vtt-btn-danger"
                  style={{
                    padding: '8px 14px',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Elimina todas las entradas de esta biblioteca para empezar desde cero"
                >
                  {confirmClearAll ? 'Confirmar vaciar' : 'Limpiar todos'}
                </button>
              )}
            </>
          )}

          <div style={{ width: '1px', height: '24px', backgroundColor: '#34291c', margin: '0 4px' }} />

          <button
            onClick={onClose}
            className="vtt-brass-btn"
            style={{ padding: '8px 18px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
          >
            Volver
          </button>
        </div>
      </div>

      {/* Contenedor principal: Índice lateral y panel de expediente */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Barra lateral izquierda */}
        <div style={{
          width: '340px',
          backgroundColor: 'rgba(10, 13, 20, 0.93)',
          backdropFilter: 'blur(10px)',
          borderRight: '1px solid #232b3b',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}>
          {/* Cabecera del buscador y filtros */}
          <div style={{ padding: '16px', borderBottom: '1px solid #1c2331', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isGraveyard ? 'Buscar caído por nombre, escena o notas...' : activeCategory === 'character' ? 'Buscar investigador o personaje...' : 'Buscar criatura o entidad...'}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: '#121622',
                border: '1px solid #2a3447',
                borderRadius: '7px',
                color: '#f8fafc',
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
            />

            {/* Filtros estructurados sin pastillas redondeadas */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              <button
                onClick={() => setSelectedFilter('all')}
                style={{
                  padding: '5px 10px',
                  borderRadius: '5px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: selectedFilter === 'all' ? '1px solid #f59e0b' : '1px solid #252e3f',
                  backgroundColor: selectedFilter === 'all' ? 'rgba(245, 158, 11, 0.16)' : '#10141e',
                  color: selectedFilter === 'all' ? '#fbbf24' : '#8b97a8',
                  transition: 'all 0.15s ease'
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
                      padding: '5px 10px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: active ? '1px solid #f59e0b' : '1px solid #252e3f',
                      backgroundColor: active ? 'rgba(245, 158, 11, 0.16)' : '#10141e',
                      color: active ? '#fbbf24' : '#8b97a8',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {sub.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lista de entradas */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredEntries.map(entry => {
              const entryId = getEntryId(entry);
              const isSelected = selectedEntity && getEntryId(selectedEntity) === entryId;
              const meta = getClassificationMeta(entry.entityType, entry.faction);
              const initialLetter = (entry.name || '?').trim().charAt(0).toUpperCase();

              return (
                <div
                  key={entryId}
                  onClick={() => setSelectedId(entryId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected
                      ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.16) 0%, rgba(18, 23, 33, 0.95) 100%)'
                      : '#111520',
                    border: isSelected ? '1px solid #f59e0b' : '1px solid #202738',
                    borderLeft: isSelected ? '3.5px solid #f59e0b' : '1px solid #202738',
                    transition: 'all 0.14s ease'
                  }}
                >
                  {/* Miniatura / Monograma */}
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '7px',
                    backgroundColor: '#161c28',
                    border: isSelected ? '1.5px solid #f59e0b' : '1px solid #2d384c',
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    {entry.avatar ? (
                      <img
                        src={entry.avatar}
                        alt={entry.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isGraveyard ? 'grayscale(0.65)' : 'none' }}
                      />
                    ) : (
                      <span style={{
                        fontFamily: "'Cinzel', Georgia, serif",
                        fontSize: '18px',
                        fontWeight: 700,
                        color: isSelected ? '#fbbf24' : '#8291a5'
                      }}>
                        {initialLetter}
                      </span>
                    )}
                  </div>

                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: entry.isGraveWound || isGraveyard ? '#f8fafc' : '#f8fafc',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                    }}>
                      {entry.name}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: isGraveyard ? '#e2a3a3' : '#94a3b8',
                      marginTop: '2px',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                    }}>
                      {isGraveyard ? `Caído en: ${entry.sceneName || 'Tablero'}` : meta.label}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredEntries.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '36px 18px',
                color: '#6b7a90',
                fontSize: '13px',
                border: '1px dashed #242c3d',
                borderRadius: '10px',
                marginTop: '12px'
              }}>
                <div style={{
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontWeight: 700,
                  color: '#cbd5e1',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  {isGraveyard ? 'La Cripta Descansa en Silencio' : 'No Hay Registros Disponibles'}
                </div>
                <div style={{ fontSize: '12px', lineHeight: 1.6, marginBottom: '16px' }}>
                  {isGraveyard
                    ? 'Aún no ha caído ningún combatiente. Cuando un personaje caiga o se traslade a la cripta, reposará aquí con su botín para saquearlo o devolverlo a la vida.'
                    : 'Puedes crear uno nuevo desde la barra superior, importar un archivo JSON o cargar ejemplos predefinidos.'}
                </div>
                {!isGraveyard && onLoadStarterPack && (
                  <button
                    onClick={() => onLoadStarterPack(activeCategory)}
                    className="vtt-brass-btn"
                    style={{ padding: '7px 16px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', color: '#fbbf24', borderColor: '#7c5826' }}
                  >
                    Cargar Ejemplos Iniciales
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho de detalle del expediente */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '28px 40px',
          backgroundImage: `
            linear-gradient(180deg, rgba(8, 11, 16, 0.78) 0%, rgba(6, 8, 12, 0.92) 100%),
            url("${activeBackgroundTexture}")
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          position: 'relative'
        }}>
          {selectedEntity ? (() => {
            const meta = getClassificationMeta(selectedEntity.entityType, selectedEntity.faction);
            const equippedItems = (selectedEntity.inventory || []).filter(i => i.state === 'equipped');
            const handItems = (selectedEntity.inventory || []).filter(i => i.state === 'hand');
            const storedItems = (selectedEntity.inventory || []).filter(i => i.state === 'stored');
            const initialLetter = (selectedEntity.name || '?').trim().charAt(0).toUpperCase();

            return (
              <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                
                {/* Tarjeta principal del expediente */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '250px 1fr',
                  gap: '28px',
                  background: 'linear-gradient(180deg, rgba(19, 23, 34, 0.92) 0%, rgba(13, 17, 25, 0.96) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: isGraveyard ? '1.5px solid rgba(239, 68, 68, 0.45)' : '1px solid #362a1b',
                  borderRadius: '14px',
                  padding: '24px',
                  boxShadow: '0 18px 48px rgba(0, 0, 0, 0.7)'
                }}>
                  {/* Columna izquierda: Retrato y clasificación sobria */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{
                      width: '250px',
                      height: '280px',
                      borderRadius: '10px',
                      backgroundColor: '#090c12',
                      border: '1.5px solid #4a3a25',
                      boxShadow: 'inset 0 0 16px rgba(0, 0, 0, 0.8), 0 8px 24px rgba(0, 0, 0, 0.6)',
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
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            filter: isGraveyard ? 'grayscale(0.55)' : 'none'
                          }}
                        />
                      ) : (
                        <div style={{
                          textAlign: 'center',
                          padding: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <div style={{
                            width: '84px',
                            height: '84px',
                            borderRadius: '50%',
                            backgroundColor: '#141a26',
                            border: '1.5px solid #36445c',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: "'Cinzel', Georgia, serif",
                            fontSize: '36px',
                            fontWeight: 700,
                            color: '#fbbf24',
                            boxShadow: 'inset 0 0 12px rgba(0,0,0,0.8)'
                          }}>
                            {initialLetter}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6b7a90', letterSpacing: '0.04em' }}>
                            Sin retrato en el expediente
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Clasificación sobria debajo del marco del retrato */}
                    <div style={{
                      background: '#0a0d14',
                      border: '1px solid #252e3f',
                      borderRadius: '7px',
                      padding: '7px 12px',
                      textAlign: 'center',
                      fontSize: '11px',
                      fontFamily: "'Cinzel', Georgia, serif",
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      color: '#d4c7b2',
                      textTransform: 'uppercase'
                    }}>
                      {meta.label}
                    </div>
                  </div>

                  {/* Columna derecha: Datos del combatiente, trasfondo y atributos */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                      {/* Cabecera del expediente con sello y botones */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{
                            fontSize: '10px',
                            fontFamily: "'Cinzel', Georgia, serif",
                            color: isGraveyard ? '#f87171' : '#fbbf24',
                            fontWeight: 800,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase'
                          }}>
                            {isGraveyard
                              ? `REGISTRO FÚNEBRE • CAÍDO EN: ${(selectedEntity.sceneName || 'Tablero de Juego').toUpperCase()}`
                              : `EXPEDIENTE DE ARCHIVO • ${selectedEntity.faction === 'enemy' ? 'HOSTIL' : 'ALIADO'}`}
                          </div>
                          <h2 className="vtt-gothic-title" style={{ margin: '4px 0 0 0', fontSize: '28px', color: '#f8fafc' }}>
                            {selectedEntity.name}
                          </h2>
                          {isGraveyard && selectedEntity.fallenAt && (
                            <div style={{ fontSize: '11px', color: '#8d9bb0', marginTop: '3px' }}>
                              Fallecido el {new Date(selectedEntity.fallenAt).toLocaleDateString()} a las {new Date(selectedEntity.fallenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>

                        {/* Botones de acción sin iconos */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {isGraveyard ? (
                            <>
                              {onReviveCharacter && (
                                <button
                                  onClick={() => onReviveCharacter(selectedEntity)}
                                  className="vtt-primary-cta"
                                  style={{ padding: '8px 16px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}
                                  title="Revive al personaje y lo devuelve al centro del tablero de juego"
                                >
                                  Resucitar al Tablero
                                </button>
                              )}
                              <button
                                onClick={() => onEditCharacter && onEditCharacter(selectedEntity)}
                                className="vtt-brass-btn"
                                style={{ padding: '8px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                                title="Ver ficha completa y saquear objetos"
                              >
                                Ver Ficha
                              </button>
                              {onDeleteFromGraveyard && (
                                <button
                                  onClick={() => onDeleteFromGraveyard(selectedEntity.graveyardId || selectedEntity.id)}
                                  className="vtt-btn-danger"
                                  style={{
                                    padding: '8px 14px',
                                    borderRadius: '7px',
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
                                style={{ padding: '8px 14px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                              >
                                Editar Ficha
                              </button>
                              {onSpawnOnBoard && (
                                <button
                                  onClick={() => onSpawnOnBoard(selectedEntity)}
                                  className="vtt-primary-cta"
                                  style={{ padding: '8px 16px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}
                                >
                                  Invocar en el Tablero
                                </button>
                              )}
                              {onDeleteCharacter && (
                                <button
                                  onClick={() => onDeleteCharacter(selectedEntity.id)}
                                  className="vtt-btn-danger"
                                  style={{
                                    padding: '8px 14px',
                                    borderRadius: '7px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 700
                                  }}
                                  title="Eliminar permanentemente de la enciclopedia"
                                >
                                  Eliminar
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Fila de metadatos limpios */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '12px',
                        marginTop: '16px',
                        padding: '12px 14px',
                        backgroundColor: '#0a0d14',
                        borderRadius: '8px',
                        border: '1px solid #202737'
                      }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#6e7d94', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Clasificación</div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', marginTop: '2px' }}>{meta.label}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#6e7d94', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Año / Época</div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', marginTop: '2px' }}>{selectedEntity.birthYear || 'Desconocido'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#6e7d94', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Protección / Armadura</div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: selectedEntity.hasArmor ? '#cbd5e1' : '#64748b', marginTop: '2px' }}>
                            {selectedEntity.hasArmor ? selectedEntity.armorType : 'Sin armadura'}
                          </div>
                        </div>
                      </div>

                      {/* Crónica y Trasfondo */}
                      <div style={{ marginTop: '16px' }}>
                        <div style={{
                          fontSize: '11px',
                          fontFamily: "'Cinzel', Georgia, serif",
                          fontWeight: 700,
                          color: '#d4a359',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          marginBottom: '6px'
                        }}>
                          Crónica y Trasfondo
                        </div>
                        <p style={{
                          margin: 0,
                          fontSize: '13px',
                          lineHeight: 1.6,
                          color: '#cbd5e1',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {selectedEntity.history || 'Sin historia o descripción registrada todavía. Pulsa "Editar Ficha" para documentar su trasfondo.'}
                        </p>
                      </div>
                    </div>

                    {/* Fila de Atributos Base: Estructurada, sobria y sin pastillas redondeadas */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '10px',
                      paddingTop: '16px',
                      borderTop: '1px solid #202737'
                    }}>
                      {/* Salud */}
                      <div style={{
                        padding: '10px 12px',
                        borderRadius: '7px',
                        backgroundColor: isGraveyard ? 'rgba(239, 68, 68, 0.08)' : '#10141e',
                        border: isGraveyard ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid #263042',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px'
                      }}>
                        <div style={{ fontSize: '10px', color: '#8e9caa', fontWeight: 700, letterSpacing: '0.06em' }}>
                          SALUD (PV)
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: isGraveyard ? '#f87171' : '#f8fafc' }}>
                          {isGraveyard ? '0' : (selectedEntity.hp ?? 20)} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>/ {selectedEntity.maxHp ?? 20}</span>
                        </div>
                      </div>

                      {/* Magia */}
                      <div style={{
                        padding: '10px 12px',
                        borderRadius: '7px',
                        backgroundColor: '#10141e',
                        border: '1px solid #263042',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px'
                      }}>
                        <div style={{ fontSize: '10px', color: '#8e9caa', fontWeight: 700, letterSpacing: '0.06em' }}>
                          MAGIA (PM)
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#93c5fd' }}>
                          {selectedEntity.mp ?? 10} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>/ {selectedEntity.maxMp ?? 10}</span>
                        </div>
                      </div>

                      {/* Cordura */}
                      <div style={{
                        padding: '10px 12px',
                        borderRadius: '7px',
                        backgroundColor: '#10141e',
                        border: '1px solid #263042',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px'
                      }}>
                        <div style={{ fontSize: '10px', color: '#8e9caa', fontWeight: 700, letterSpacing: '0.06em' }}>
                          CORDURA (SAN)
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#fbbf24' }}>
                          {selectedEntity.san ?? 60} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>/ {selectedEntity.maxSan ?? 60}</span>
                        </div>
                      </div>

                      {/* Estado */}
                      <div style={{
                        padding: '10px 12px',
                        borderRadius: '7px',
                        backgroundColor: isGraveyard ? 'rgba(239, 68, 68, 0.12)' : '#10141e',
                        border: isGraveyard ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid #263042',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px'
                      }}>
                        <div style={{ fontSize: '10px', color: '#8e9caa', fontWeight: 700, letterSpacing: '0.06em' }}>
                          ESTADO
                        </div>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: isGraveyard ? '#f87171' : selectedEntity.isGraveWound ? '#fca5a5' : '#86efac',
                          marginTop: '2px'
                        }}>
                          {isGraveyard ? 'En la Cripta' : selectedEntity.isGraveWound ? 'Herida Grave' : 'Consciente'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secciones inferiores: Inventario y Grimorio con diseño sobrio */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  
                  {/* Inventario / Botín */}
                  <div style={{
                    background: 'rgba(17, 21, 32, 0.90)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid #222b3c',
                    borderRadius: '12px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #1f2737',
                      paddingBottom: '8px'
                    }}>
                      <div className="vtt-gothic-title" style={{ fontSize: '14px', color: '#f8fafc', fontWeight: 'bold' }}>
                        {isGraveyard ? 'Botín Recuperable para Saqueo' : 'Equipo, Pertinencias y Armas'}
                      </div>
                      <span className="vtt-retro-badge" style={{ fontSize: '11px', color: '#fbbf24' }}>
                        {(selectedEntity.inventory || []).length} objetos
                      </span>
                    </div>

                    {isGraveyard && (
                      <div style={{ fontSize: '11px', color: '#b8a37e', fontStyle: 'italic' }}>
                        Posesiones del combatiente disponibles para su recuperación o reparto por los investigadores.
                      </div>
                    )}

                    {(selectedEntity.inventory || []).length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', padding: '12px 0' }}>
                        No se han registrado objetos ni pertrechos en este expediente.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {equippedItems.length > 0 && (
                          <div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#8e9caa', textTransform: 'uppercase', marginBottom: '5px', letterSpacing: '0.05em' }}>
                              Lleva Encima ({equippedItems.length})
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {equippedItems.map(item => (
                                <span key={item.id} style={{
                                  padding: '5px 10px',
                                  borderRadius: '5px',
                                  background: '#171e2c',
                                  border: '1px solid #2e3a50',
                                  fontSize: '12px',
                                  color: '#e2e8f0'
                                }}>
                                  {item.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {handItems.length > 0 && (
                          <div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#8e9caa', textTransform: 'uppercase', marginBottom: '5px', letterSpacing: '0.05em' }}>
                              A Mano / Inmediato ({handItems.length})
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {handItems.map(item => (
                                <span key={item.id} style={{
                                  padding: '5px 10px',
                                  borderRadius: '5px',
                                  background: '#171e2c',
                                  border: '1px solid #2e3a50',
                                  fontSize: '12px',
                                  color: '#e2e8f0'
                                }}>
                                  {item.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {storedItems.length > 0 && (
                          <div>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#8e9caa', textTransform: 'uppercase', marginBottom: '5px', letterSpacing: '0.05em' }}>
                              Guardado / Almacén ({storedItems.length})
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {storedItems.map(item => (
                                <span key={item.id} style={{
                                  padding: '5px 10px',
                                  borderRadius: '5px',
                                  background: '#141822',
                                  border: '1px solid #232c3d',
                                  fontSize: '12px',
                                  color: '#94a3b8'
                                }}>
                                  {item.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Grimorio y Facultades */}
                  <div style={{
                    background: 'rgba(17, 21, 32, 0.90)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid #222b3c',
                    borderRadius: '12px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #1f2737',
                      paddingBottom: '8px'
                    }}>
                      <div className="vtt-gothic-title" style={{ fontSize: '14px', color: '#f8fafc', fontWeight: 'bold' }}>
                        Grimorio y Facultades Arcanas
                      </div>
                      <span className="vtt-retro-badge" style={{ fontSize: '11px', color: '#fbbf24' }}>
                        {(selectedEntity.spells || []).length} inscritos
                      </span>
                    </div>

                    {(selectedEntity.spells || []).length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', padding: '12px 0' }}>
                        Sin facultades ni hechizos arcanos registrados.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(selectedEntity.spells || []).map(sp => (
                          <div key={sp.id} style={{
                            padding: '9px 12px',
                            borderRadius: '7px',
                            backgroundColor: '#0c0f16',
                            border: '1px solid #222a3a'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>{sp.name}</span>
                              <span className="vtt-retro-badge" style={{
                                fontSize: '10px',
                                color: '#fbbf24',
                                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                padding: '2px 7px',
                                borderRadius: '4px'
                              }}>
                                {sp.cost}
                              </span>
                            </div>
                            {sp.desc && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', lineHeight: 1.4 }}>{sp.desc}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notas de campo */}
                {selectedEntity.notes && (
                  <div style={{
                    background: 'rgba(17, 21, 32, 0.90)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid #222b3c',
                    borderRadius: '12px',
                    padding: '18px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
                  }}>
                    <div className="vtt-gothic-title" style={{ fontSize: '14px', color: '#d4a359', fontWeight: 'bold', marginBottom: '8px' }}>
                      Notas de Campo y Apuntes
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
              textAlign: 'center',
              padding: '24px'
            }}>
              <div style={{
                width: '420px',
                maxWidth: '92%',
                height: '210px',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '20px',
                border: '1.5px solid #3d3020',
                boxShadow: '0 16px 36px rgba(0, 0, 0, 0.75)',
                position: 'relative'
              }}>
                <img
                  src={
                    isGraveyard
                      ? '/assets/textures/crypt_graveyard_banner.jpg'
                      : activeCategory === 'character'
                      ? '/assets/textures/encyclopedia_characters_banner.jpg'
                      : '/assets/textures/bestiary_mythos_banner.jpg'
                  }
                  alt={isGraveyard ? 'Cripta' : activeCategory === 'character' ? 'Personajes' : 'Bestiario'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 40%, rgba(9, 12, 18, 0.9) 100%)'
                }} />
              </div>

              <div className="vtt-gothic-title" style={{ fontSize: '19px', color: '#e2e8f0', marginBottom: '8px' }}>
                {isGraveyard
                  ? 'Cripta y Registro de Bajas'
                  : activeCategory === 'character'
                  ? 'Archivo de Investigadores y Aliados'
                  : 'Códice del Bestiario y los Mitos'}
              </div>
              <p style={{ maxWidth: '440px', fontSize: '13px', lineHeight: 1.6, color: '#8d9bb0' }}>
                {isGraveyard
                  ? 'Selecciona un combatiente caído para saquear su botín, consultar sus últimas notas o resucitarlo.'
                  : `Selecciona un expediente del índice lateral o pulsa "${activeCategory === 'character' ? 'Inscribir Personaje' : 'Registrar Criatura'}" para forjar un nuevo registro.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EncyclopediaView;
