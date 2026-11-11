import { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Skull,
  Plus,
  Upload,
  Download,
  Trash2,
  ArrowLeft,
  AlertTriangle,
  Package,
  Check
} from 'lucide-react';
import { ENTITY_CLASSIFICATIONS, getClassificationMeta } from '../constants/gamePresets';
import { getGameIconComponent } from '../utils/gameIcons';
import { useConfirm } from '../hooks/useConfirm';
import SearchInput from './ui/SearchInput';
import DossierBookView from './DossierBookView';

const EncyclopediaView = ({
  isOpen,
  initialCategory = 'character',
  characters = [],
  codexItems = [],
  tableCharacters = [],
  tableCommonItems = [],
  graveyard = [],
  onClose,
  onCreateNew,
  onEditCharacter,
  onDeleteCharacter,
  onDeleteCodexItem,
  onSpawnOnBoard,
  onBringItemToTable,
  onImportCharacters,
  onImportCodexItems,
  onExportCharacters,
  onClearCategory,
  onReviveCharacter,
  onDeleteFromGraveyard,
  onClearGraveyard,
  onExportGraveyard
}) => {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [importError, setImportError] = useState(null);
  const [prevSyncKey, setPrevSyncKey] = useState(`${isOpen}-${initialCategory}`);
  const fileInputRef = useRef(null);
  const confirm = useConfirm();

  const syncKey = `${isOpen}-${initialCategory}`;
  if (syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey);
    setActiveCategory(initialCategory);
    setSelectedFilter('all');
    setImportError(null);
  }

  useEffect(() => {
    if (!isOpen || !onClose) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const isGraveyard = activeCategory === 'graveyard';
  const isItems = activeCategory === 'item';

  const activeBackgroundTexture = isGraveyard
    ? '/assets/textures/crypt_graveyard_bg.jpg'
    : activeCategory === 'character'
    ? '/assets/textures/archive_characters_bg.jpg'
    : activeCategory === 'item'
    ? '/assets/textures/archive_characters_bg.jpg'
    : '/assets/textures/bestiary_mythos_bg.jpg';

  const categoryEntries = isGraveyard
    ? graveyard
    : isItems
    ? codexItems
    : characters.filter(c => {
        const meta = getClassificationMeta(c.entityType, c.faction);
        return meta.group === activeCategory;
      });

  const allyGraveyardCount = graveyard.filter(g => g.faction !== 'enemy').length;
  const enemyGraveyardCount = graveyard.filter(g => g.faction === 'enemy').length;
  const itemCategoryList = Array.from(new Set((codexItems || []).map(it => it.category).filter(Boolean)));
  const tableEntityIdSet = new Set((tableCharacters || []).map(c => String(c.id)));
  const tableItemNameSet = new Set((tableCommonItems || []).map(it => (it.name || '').trim().toLowerCase()));

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

    if (isItems) {
      const matchesFilter = selectedFilter === 'all' || c.category === selectedFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (c.name || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q) ||
        (c.notes || '').toLowerCase().includes(q);
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

  if (!isOpen) return null;

  const selectedEntity = filteredEntries.find(e => getEntryId(e) === selectedId) || filteredEntries[0] || null;
  const availableSubFilters = isGraveyard
    ? [
        { id: 'all', label: 'Todos', count: graveyard.length },
        { id: 'ally', label: 'Aliados caídos', count: allyGraveyardCount },
        { id: 'enemy', label: 'Enemigos caídos', count: enemyGraveyardCount }
      ]
    : isItems
    ? itemCategoryList.map(cat => ({
        id: cat,
        label: cat,
        count: (codexItems || []).filter(i => i.category === cat).length
      }))
    : ENTITY_CLASSIFICATIONS.filter(c => c.group === activeCategory);

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const rawList = Array.isArray(parsed)
          ? parsed
          : (Array.isArray(parsed?.items) && isItems)
          ? parsed.items
          : (Array.isArray(parsed?.entities) && !isItems)
          ? parsed.entities
          : [parsed];

        if (isItems) {
          if (onImportCodexItems) {
            onImportCodexItems(
              rawList
                .filter(it => it && typeof it === 'object' && it.name)
                .map(item => ({
                  ...item,
                  id: item.id || `codex_item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                  icon: item.icon || '📦',
                  category: item.category || 'Herramienta',
                  state: item.state || 'equipped',
                  notes: item.notes || ''
                }))
            );
          }
          return;
        }

        if (onImportCharacters) {
          onImportCharacters(
            rawList.map(item => ({
              ...item,
              id: item.id || `entity_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              entityType: item.entityType || (activeCategory === 'monster' ? 'mythos_creature' : 'human')
            }))
          );
        }
      } catch (err) {
        console.error('Error al importar fichas:', err);
        setImportError('El archivo seleccionado no es un JSON válido.');
      }
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
              color: '#fbbf24',
              border: '1.5px solid #7c5826',
              boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.7), 0 2px 6px rgba(0, 0, 0, 0.5)'
            }}>
              {isGraveyard ? <Skull size={20} strokeWidth={2.1} /> : isItems ? <Package size={20} strokeWidth={2.1} /> : <BookOpen size={20} strokeWidth={2.1} />}
            </div>
            <div>
              <div className="vtt-gothic-title" style={{ fontSize: '17px', fontWeight: 'bold', color: '#f8fafc', letterSpacing: '0.06em' }}>
                {isGraveyard
                  ? 'CRIPTA Y REGISTRO DE BAJAS'
                  : isItems
                  ? 'ARCHIVO HISTÓRICO DE OBJETOS'
                  : activeCategory === 'character'
                  ? 'CÓDICE DE PERSONAJES'
                  : 'CÓDICE DEL BESTIARIO Y LOS MITOS'}
              </div>
              <div className="vtt-retro-badge" style={{ fontSize: '10px', color: '#b49b78', marginTop: '2px' }}>
                {isGraveyard
                  ? `${graveyard.length} COMBATIENTES FALLECIDOS`
                  : isItems
                  ? `${categoryEntries.length} OBJETOS ÚNICOS EN CÓDICE GLOBAL`
                  : `${categoryEntries.length} EXPEDIENTES EN CÓDICE GLOBAL`}
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
                padding: '7px 14px',
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
              Personajes
            </button>
            <button
              onClick={() => { setActiveCategory('monster'); setSelectedFilter('all'); }}
              style={{
                padding: '7px 14px',
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
              Bestiario
            </button>
            <button
              onClick={() => { setActiveCategory('item'); setSelectedFilter('all'); }}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                border: activeCategory === 'item' ? '1.5px solid #f59e0b' : '1.5px solid transparent',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                background: activeCategory === 'item'
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.32) 0%, rgba(180, 83, 9, 0.45) 100%)'
                  : 'transparent',
                color: activeCategory === 'item' ? '#fbbf24' : '#94a3b8',
                boxShadow: activeCategory === 'item' ? '0 2px 8px rgba(245, 158, 11, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Objetos ({codexItems.length})
            </button>
            <button
              onClick={() => { setActiveCategory('graveyard'); setSelectedFilter('all'); }}
              style={{
                padding: '7px 14px',
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
              Cripta ({graveyard.length})
            </button>
          </div>
        </div>

        {/* Acciones superiores */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isGraveyard ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (onExportGraveyard) onExportGraveyard(graveyard);
                  else if (onExportCharacters) onExportCharacters(graveyard, 'graveyard');
                }}
                className="vtt-brass-btn"
                style={{ padding: '8px 14px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}
                title="Exportar bajas registradas en formato .json"
              >
                <Download size={13} strokeWidth={2.2} /> Exportar Bajas
              </button>

              {graveyard.length > 0 && onClearGraveyard && (
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await confirm({
                      title: 'Vaciar cripta y cementerio',
                      message: `Se eliminarán permanentemente los ${graveyard.length} registros de caídos de la cripta.`,
                      confirmLabel: 'Vaciar Cripta',
                      tone: 'danger'
                    });
                    if (ok) onClearGraveyard();
                  }}
                  className="vtt-btn-danger"
                  style={{
                    padding: '8px 14px',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Vaciar todos los registros del cementerio"
                >
                  <Trash2 size={13} strokeWidth={2.2} /> Vaciar Cementerio
                </button>
              )}
            </>
          ) : (
            <>
              {!isItems && (
                <button
                  type="button"
                  onClick={() => onCreateNew && onCreateNew(activeCategory === 'monster' ? 'mythos_creature' : 'human')}
                  className="vtt-primary-cta"
                  style={{ padding: '8px 18px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}
                >
                  <Plus size={14} strokeWidth={2.4} /> {activeCategory === 'character' ? 'Inscribir Personaje' : 'Registrar Criatura'}
                </button>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="vtt-brass-btn"
                style={{ padding: '8px 14px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}
                title="Importar al Códice desde un archivo .json"
              >
                <Upload size={13} strokeWidth={2.2} /> Importar JSON
              </button>

              <button
                type="button"
                onClick={() => onExportCharacters && onExportCharacters(categoryEntries, activeCategory)}
                className="vtt-brass-btn"
                style={{ padding: '8px 14px', borderRadius: '7px', fontSize: '12px', cursor: 'pointer' }}
                title="Exportar esta sección del Códice a un archivo .json"
              >
                <Download size={13} strokeWidth={2.2} /> Exportar
              </button>

              {categoryEntries.length > 0 && onClearCategory && (
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await confirm({
                      title: isItems ? 'Vaciar objetos del Códice' : activeCategory === 'monster' ? 'Vaciar bestiario del Códice' : 'Vaciar personajes del Códice',
                      message: `Se eliminarán permanentemente los ${categoryEntries.length} registros de esta sección del Códice Global.`,
                      confirmLabel: 'Limpiar todos',
                      tone: 'danger'
                    });
                    if (ok) onClearCategory(activeCategory);
                  }}
                  className="vtt-btn-danger"
                  style={{
                    padding: '8px 14px',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Elimina todas las entradas de esta biblioteca para empezar desde cero"
                >
                  <Trash2 size={13} strokeWidth={2.2} /> Limpiar todos
                </button>
              )}
            </>
          )}

          <div style={{ width: '1px', height: '24px', backgroundColor: '#34291c', margin: '0 4px' }} />

          <button
            type="button"
            onClick={onClose}
            className="vtt-brass-btn"
            style={{ padding: '8px 18px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            title="Volver (Esc)"
          >
            <ArrowLeft size={13} strokeWidth={2.2} /> Volver
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
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={isGraveyard ? 'Buscar caído por nombre, escena o notas...' : isItems ? 'Buscar objeto por nombre, categoría o notas...' : activeCategory === 'character' ? 'Buscar investigador o personaje...' : 'Buscar criatura o entidad...'}
            />
            {importError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 10px', borderRadius: '6px', backgroundColor: 'rgba(127, 29, 29, 0.35)', border: '1px solid #ef4444', fontSize: '11px', color: '#fca5a5' }}>
                <AlertTriangle size={13} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                <span>{importError}</span>
              </div>
            )}

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
                const count = (isGraveyard || isItems)
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
                  {/* Miniatura / Monograma / Icono de Objeto */}
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
                    {isItems ? (
                      entry.icon && entry.icon !== '📦'
                        ? <span style={{ fontSize: '20px' }}>{entry.icon}</span>
                        : getGameIconComponent(entry.name, 22)
                    ) : entry.avatar ? (
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#f8fafc',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        flex: 1
                      }}>
                        {entry.name}
                      </div>
                      {!isGraveyard && (
                        isItems
                          ? tableItemNameSet.has((entry.name || '').trim().toLowerCase())
                          : tableEntityIdSet.has(String(entry.id))
                      ) && (
                        <span style={{
                          fontSize: '9px',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(16, 185, 129, 0.16)',
                          border: '1px solid rgba(16, 185, 129, 0.45)',
                          color: '#6ee7b7',
                          fontWeight: 700,
                          flexShrink: 0
                        }}>
                          En mesa
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: isGraveyard ? '#e2a3a3' : '#94a3b8',
                      marginTop: '2px',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden'
                    }}>
                      {isGraveyard
                        ? `Caído en: ${entry.sceneName || 'Tablero'}`
                        : isItems
                        ? (entry.category || 'Objeto')
                        : meta.label}
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
                <div style={{ fontSize: '12px', lineHeight: 1.6, marginBottom: '4px' }}>
                  {isGraveyard
                    ? 'Aún no ha caído ningún combatiente. Cuando un personaje caiga o se traslade a la cripta, reposará aquí con su botín para saquearlo o devolverlo a la vida.'
                    : 'Puedes crear un registro nuevo desde la barra superior o importar un archivo JSON.'}
                </div>
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
          {selectedEntity && isItems ? (() => {
            const isItemInTable = tableItemNameSet.has((selectedEntity.name || '').trim().toLowerCase());
            return (
              <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  display: 'flex',
                  gap: '24px',
                  alignItems: 'flex-start',
                  background: 'linear-gradient(180deg, rgba(19, 23, 34, 0.92) 0%, rgba(13, 17, 25, 0.96) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid #362a1b',
                  borderRadius: '14px',
                  padding: '24px',
                  boxShadow: '0 18px 48px rgba(0, 0, 0, 0.7)'
                }}>
                  <div style={{
                    width: '104px',
                    height: '104px',
                    borderRadius: '12px',
                    backgroundColor: '#090c12',
                    border: '1.5px solid #4a3a25',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: 'inset 0 0 16px rgba(0, 0, 0, 0.8)'
                  }}>
                    {selectedEntity.icon && selectedEntity.icon !== '📦'
                      ? <span style={{ fontSize: '46px' }}>{selectedEntity.icon}</span>
                      : getGameIconComponent(selectedEntity.name, 46)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '10px', fontFamily: "'Cinzel', Georgia, serif", color: '#fbbf24', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                          ARCHIVO DE OBJETOS • {selectedEntity.category || 'HERRAMIENTA'}
                        </div>
                        <h2 className="vtt-gothic-title" style={{ margin: '4px 0 0 0', fontSize: '26px', color: '#f8fafc' }}>
                          {selectedEntity.name}
                        </h2>
                        {selectedEntity.firstSeenAt && (
                          <div style={{ fontSize: '11px', color: '#8d9bb0', marginTop: '4px' }}>
                            Registrado en el Códice el {new Date(selectedEntity.firstSeenAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {onBringItemToTable && (
                          <button
                            type="button"
                            disabled={isItemInTable}
                            onClick={() => onBringItemToTable(selectedEntity)}
                            className={isItemInTable ? 'vtt-brass-btn' : 'vtt-primary-cta'}
                            style={{ padding: '8px 14px', borderRadius: '7px', fontSize: '12px', cursor: isItemInTable ? 'default' : 'pointer', opacity: isItemInTable ? 0.65 : 1 }}
                          >
                            {isItemInTable ? <><Check size={13} strokeWidth={2.3} /> En mesa actual</> : <><Plus size={13} strokeWidth={2.3} /> Traer a la mesa</>}
                          </button>
                        )}

                        {onDeleteCodexItem && (
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = await confirm({
                                title: 'Eliminar objeto del Códice',
                                message: `¿Eliminar permanentemente "${selectedEntity.name}" del Códice Global?`,
                                confirmLabel: 'Eliminar',
                                tone: 'danger'
                              });
                              if (ok) onDeleteCodexItem(selectedEntity.id);
                            }}
                            className="vtt-btn-danger"
                            style={{
                              padding: '8px 14px',
                              borderRadius: '7px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Trash2 size={13} strokeWidth={2.2} /> Eliminar del Códice
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{
                      marginTop: '18px',
                      padding: '14px 16px',
                      borderRadius: '8px',
                      backgroundColor: '#0a0d14',
                      border: '1px solid #202737',
                      fontSize: '13px',
                      color: '#cbd5e1',
                      lineHeight: 1.6
                    }}>
                      {selectedEntity.notes || 'Sin descripción o notas adicionales en el archivo.'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })() : selectedEntity ? (() => {
            const meta = getClassificationMeta(selectedEntity.entityType, selectedEntity.faction);
            return (
              <DossierBookView
                key={selectedEntity.id}
                entity={selectedEntity}
                classificationLabel={meta.label}
                isGraveyard={isGraveyard}
                onEditCharacter={onEditCharacter}
                onSpawnOnBoard={onSpawnOnBoard}
                onDeleteCharacter={onDeleteCharacter}
                onReviveCharacter={onReviveCharacter}
                onDeleteFromGraveyard={onDeleteFromGraveyard}
                confirm={confirm}
              />
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
                  : isItems
                  ? 'Archivo Histórico de Objetos'
                  : activeCategory === 'character'
                  ? 'Archivo de Investigadores y Aliados'
                  : 'Códice del Bestiario y los Mitos'}
              </div>
              <p style={{ maxWidth: '440px', fontSize: '13px', lineHeight: 1.6, color: '#8d9bb0' }}>
                {isGraveyard
                  ? 'Selecciona un combatiente caído para saquear su botín, consultar sus últimas notas o resucitarlo.'
                  : isItems
                  ? 'Todo objeto personalizado que forjes o importes en tus aventuras se archiva aquí automáticamente.'
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
