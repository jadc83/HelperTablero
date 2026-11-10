import { useState } from 'react';
import {
  Grip, Pencil, FolderOpen, Plus, ChevronUp, ChevronDown,
  Flame, Sparkles, Sun, AlertTriangle, DoorClosed, AppWindow
} from 'lucide-react';
import { importJSON } from '../../utils/fileDialog';
import { LIGHT_PRESETS } from '../../constants/gamePresets';
import { filterCatalogItems } from '../../constants/commonItems';
import { getGameIconComponent } from '../../utils/gameIcons';
import SearchInput from '../ui/SearchInput';

const MONSTER_TYPES = ['mythos_creature', 'great_old_one', 'outer_god', 'animal', 'undead', 'aberration'];
const isMonsterEntity = (c) => MONSTER_TYPES.includes(c.entityType) || (!c.entityType && c.faction === 'enemy');

const LIGHT_ICONS = {
  torch: Flame,
  brazier: Sun,
  arcane_lantern: Sparkles
};

/**
 * Acordeón reutilizable para las secciones de la biblioteca lateral.
 */
const SectionAccordion = ({ title, isExpanded, onClick, tooltip, children }) => (
  <div style={{
    marginBottom: '12px',
    borderRadius: '8px',
    overflow: 'hidden',
    border: isExpanded ? '1px solid var(--vtt-gold)' : '1px solid var(--vtt-border)',
    backgroundColor: 'var(--vtt-bg-panel)',
    boxShadow: isExpanded ? '0 0 12px rgba(212, 175, 55, 0.14)' : '0 2px 6px rgba(0,0,0,0.18)',
    flexShrink: 0,
    transition: 'all 0.15s ease'
  }}>
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        padding: '10px 14px',
        backgroundColor: isExpanded ? 'var(--vtt-bg-elevated)' : 'var(--vtt-btn-bg)',
        border: 'none',
        borderBottom: isExpanded ? '1px solid var(--vtt-border-subtle)' : 'none',
        color: isExpanded ? 'var(--vtt-gold-light)' : 'var(--vtt-text-strong)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background-color 0.15s ease'
      }}
      title={tooltip || 'Haz clic para desplegar o plegar esta sección'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em' }}>{title}</span>
      </div>
      <span style={{ display: 'inline-flex', color: isExpanded ? 'var(--vtt-gold-light)' : 'var(--vtt-text-dim)' }}>
        {isExpanded ? <ChevronUp size={15} strokeWidth={2.3} /> : <ChevronDown size={15} strokeWidth={2.3} />}
      </span>
    </button>

    {isExpanded && (
      <div style={{
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        backgroundColor: 'var(--vtt-bg-inset)'
      }}>
        {children}
      </div>
    )}
  </div>
);

/**
 * Tarjeta compartida de personaje o criatura arrastrable hacia el tablero.
 */
const CharacterLibraryRow = ({
  char,
  variant = 'human',
  onStartDragCharacter,
  onEndDragCharacter,
  onEditCharacter,
  onBringToTable,
  isInTable = true
}) => {
  const isMonster = variant === 'monster';
  const borderColor = isMonster ? '#ef4444' : char.isGraveWound ? '#ef4444' : 'var(--vtt-border)';
  const avatarBorder = isMonster ? '1px solid #ef4444' : '1px solid #3b82f6';
  const titleColor = isMonster ? '#ef4444' : char.isGraveWound ? '#ef4444' : 'var(--vtt-text-strong)';
  const subtitle = isMonster
    ? (char.entityType ? char.entityType.replace('_', ' ') : 'Monstruo')
    : (char.hasArmor ? `Arm. ${char.armorType}` : 'Investigador / Humano');

  return (
    <div
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'character', id: char.id }));
        e.dataTransfer.effectAllowed = 'copy';
        if (onStartDragCharacter) onStartDragCharacter(char);
      }}
      onDragEnd={() => {
        if (onEndDragCharacter) onEndDragCharacter();
      }}
      style={{
        background: 'var(--vtt-bg-card)',
        border: `1px solid ${borderColor}`,
        borderRadius: '7px',
        padding: '7px 9px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        cursor: 'grab',
        userSelect: 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s'
      }}
      title={isMonster ? 'Arrastra esta criatura al tablero para desplegarla' : 'Arrastra este personaje al tablero para desplegarlo'}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <span style={{ color: 'var(--vtt-text-dim)', display: 'inline-flex', cursor: 'grab', userSelect: 'none' }} title="Arrastrar al tablero">
            <Grip size={12} strokeWidth={2.2} />
          </span>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: char.color,
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            border: avatarBorder
          }}>
            {char.avatar ? (
              <img src={char.avatar} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '11px' }}>
                {(char.name || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: titleColor, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {char.name}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--vtt-text-muted)' }}>
              {subtitle}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
          {!isInTable && onBringToTable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBringToTable(char);
              }}
              className="vtt-brass-btn"
              style={{
                borderRadius: '6px',
                padding: '5px 7px',
                cursor: 'pointer',
                fontSize: '10.5px',
                fontWeight: 700,
                color: 'var(--vtt-accent-amber)',
                borderColor: 'var(--vtt-accent-amber-border)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
              title="Añadir este personaje del Códice a la mesa actual"
            >
              <Plus size={11} strokeWidth={2.4} />
            </button>
          )}
          {onEditCharacter && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditCharacter(char);
              }}
              className="vtt-brass-btn"
              style={{ borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', fontSize: '11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              title="Abrir y editar ficha"
            >
              <Pencil size={12} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const JsonImportButton = ({
  onImportJson,
  title,
  accentColor = 'var(--vtt-accent-amber)',
  borderColor = 'var(--vtt-accent-amber-border)',
  bgColor = 'var(--vtt-accent-amber-bg)'
}) => (
  <button
    type="button"
    onClick={onImportJson}
    className="vtt-brass-btn"
    style={{
      width: '32px',
      height: '32px',
      padding: 0,
      borderRadius: '6px',
      cursor: 'pointer',
      borderColor,
      color: accentColor,
      background: bgColor,
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
    title={title}
    aria-label={title}
  >
    <FolderOpen size={15} strokeWidth={2.2} />
  </button>
);

const CodexEntitySearchBody = ({
  query,
  onChangeQuery,
  placeholder,
  emptyMessage,
  matches,
  variant,
  tableCharacterIds,
  onBringToTable,
  onStartDragCharacter,
  onEndDragCharacter,
  onEditCharacter,
  importAction
}) => (
  <>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <SearchInput
        value={query}
        onChange={onChangeQuery}
        placeholder={placeholder}
        style={{ flex: 1, minWidth: 0 }}
      />
      {importAction}
    </div>
    {query.trim().length >= 3 && (
      matches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: 'var(--vtt-text-dim)', fontStyle: 'italic' }}>
          {emptyMessage}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', overflowY: 'auto' }}>
          {matches.map(char => (
            <CharacterLibraryRow
              key={char.id}
              char={char}
              variant={variant}
              isInTable={tableCharacterIds.has(String(char.id))}
              onBringToTable={onBringToTable}
              onStartDragCharacter={onStartDragCharacter}
              onEndDragCharacter={onEndDragCharacter}
              onEditCharacter={onEditCharacter}
            />
          ))}
        </div>
      )
    )}
  </>
);

/**
 * Pestaña "Elementos" del panel lateral: personajes, criaturas, loot buscable, luces y estructuras.
 */
const LibraryTab = ({
  characters = [],
  codexEntities = [],
  graveyard = [],
  commonItems = [],
  activeTurnTokenId,
  onImportCharacters,
  onImportCommonItems,
  onBringToTable,
  onStartDragCharacter,
  onEndDragCharacter,
  onEditCharacter,
  onStartDragItem,
  onEndDragItem,
  onStartDragMapElement,
  onEndDragMapElement,
  onGiveItemToCharacter
}) => {
  const [isCharactersExpanded, setIsCharactersExpanded] = useState(true);
  const [characterSearch, setCharacterSearch] = useState('');
  const [isMonstersExpanded, setIsMonstersExpanded] = useState(false);
  const [monsterSearch, setMonsterSearch] = useState('');
  const [isObjectsExpanded, setIsObjectsExpanded] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [isLightsExpanded, setIsLightsExpanded] = useState(false);
  const [isStructuresExpanded, setIsStructuresExpanded] = useState(false);
  const [importError, setImportError] = useState(null);

  const deadEntityIds = new Set(
    (graveyard || [])
      .flatMap(g => [g.characterId, g.id])
      .filter(Boolean)
      .map(String)
  );
  const livingCharacters = characters.filter(c => !deadEntityIds.has(String(c.id)));
  const tableCharacterIds = new Set(livingCharacters.map(c => String(c.id)));

  const filterLivingCodexByGroup = (isMonster, rawQuery) => {
    const q = rawQuery.trim().toLowerCase();
    if (q.length < 3) return [];
    return (codexEntities || []).filter(c =>
      (isMonster ? isMonsterEntity(c) : !isMonsterEntity(c)) &&
      !deadEntityIds.has(String(c.id)) &&
      (c.name || '').toLowerCase().includes(q)
    );
  };

  const filteredCodexHumans = filterLivingCodexByGroup(false, characterSearch);
  const filteredCodexMonsters = filterLivingCodexByGroup(true, monsterSearch);

  const importEntityList = async ({ description, defaultFaction, defaultEntityType }) => {
    setImportError(null);
    const res = await importJSON({ accept: '.json', description });
    if (res?.success && res.text) {
      try {
        const parsed = JSON.parse(res.text);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        const formatted = list.map(c => ({
          ...c,
          id: c.id || `entity_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          faction: c.faction || defaultFaction,
          entityType: c.entityType || defaultEntityType
        }));
        if (onImportCharacters) onImportCharacters(formatted);
      } catch {
        setImportError('El archivo seleccionado no es un JSON válido de personajes.');
      }
    }
  };

  const importItemsList = async () => {
    setImportError(null);
    const res = await importJSON({ accept: '.json', description: 'Objetos VTT (*.json)' });
    if (res?.success && res.text) {
      try {
        const parsed = JSON.parse(res.text);
        const rawList = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.items) ? parsed.items : [parsed]);
        const formatted = rawList
          .filter(it => it && typeof it === 'object' && it.name)
          .map(it => ({
            ...it,
            id: it.id || `custom_item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            icon: it.icon || '📦',
            category: it.category || 'Herramienta',
            state: it.state || 'equipped',
            notes: it.notes || ''
          }));
        if (formatted.length === 0) {
          setImportError('El JSON no contiene objetos válidos.');
          return;
        }
        if (onImportCommonItems) onImportCommonItems(formatted);
      } catch {
        setImportError('El archivo seleccionado no es un JSON válido de objetos.');
      }
    }
  };

  const trimmedQuery = itemSearch.trim();
  const filteredItems = trimmedQuery ? filterCatalogItems(commonItems || [], trimmedQuery) : [];

  return (
    <div style={{
      padding: '12px',
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto'
    }}>
      {importError && (
        <div style={{
          marginBottom: '10px',
          padding: '8px 10px',
          borderRadius: '6px',
          backgroundColor: 'rgba(127, 29, 29, 0.35)',
          border: '1px solid #ef4444',
          color: '#fca5a5',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={13} strokeWidth={2.2} />
            {importError}
          </span>
          <button
            type="button"
            onClick={() => setImportError(null)}
            style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
          >
            Cerrar
          </button>
        </div>
      )}

      {/* 1. Personajes */}
      <SectionAccordion
        title="Personajes"
        isExpanded={isCharactersExpanded}
        onClick={() => setIsCharactersExpanded(!isCharactersExpanded)}
        tooltip="Investigadores y personajes aliados vivos"
      >
        <CodexEntitySearchBody
          query={characterSearch}
          onChangeQuery={setCharacterSearch}
          placeholder="Buscar personajes vivos (mín. 3 letras)..."
          emptyMessage={`No se encontraron personajes vivos para "${characterSearch.trim()}".`}
          matches={filteredCodexHumans}
          variant="human"
          tableCharacterIds={tableCharacterIds}
          onBringToTable={onBringToTable}
          onStartDragCharacter={onStartDragCharacter}
          onEndDragCharacter={onEndDragCharacter}
          onEditCharacter={onEditCharacter}
          importAction={(
            <JsonImportButton
              onImportJson={() => importEntityList({
                description: 'Personajes VTT (*.json)',
                defaultFaction: 'ally',
                defaultEntityType: 'human'
              })}
              title="Cargar personajes desde archivo JSON"
            />
          )}
        />
      </SectionAccordion>

      {/* 2. Criaturas */}
      <SectionAccordion
        title="Criaturas"
        isExpanded={isMonstersExpanded}
        onClick={() => setIsMonstersExpanded(!isMonstersExpanded)}
        tooltip="Criaturas y monstruos vivos en el Códice"
      >
        <CodexEntitySearchBody
          query={monsterSearch}
          onChangeQuery={setMonsterSearch}
          placeholder="Buscar criaturas vivas (mín. 3 letras)..."
          emptyMessage={`No se encontraron criaturas vivas para "${monsterSearch.trim()}".`}
          matches={filteredCodexMonsters}
          variant="monster"
          tableCharacterIds={tableCharacterIds}
          onBringToTable={onBringToTable}
          onStartDragCharacter={onStartDragCharacter}
          onEndDragCharacter={onEndDragCharacter}
          onEditCharacter={onEditCharacter}
          importAction={(
            <JsonImportButton
              onImportJson={() => importEntityList({
                description: 'Criaturas VTT (*.json)',
                defaultFaction: 'enemy',
                defaultEntityType: 'mythos_creature'
              })}
              title="Cargar criaturas desde archivo JSON"
              accentColor="var(--vtt-accent-red)"
              borderColor="var(--vtt-danger-border)"
              bgColor="var(--vtt-accent-red-bg)"
            />
          )}
        />
      </SectionAccordion>

      {/* 3. Objetos de Inventario (Loot) — sólo visibles tras buscar */}
      <SectionAccordion
        title="Objetos de Inventario (Loot)"
        isExpanded={isObjectsExpanded}
        onClick={() => setIsObjectsExpanded(!isObjectsExpanded)}
        tooltip="Busca objetos del catálogo para arrastrarlos al tablero o entregarlos"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SearchInput
            value={itemSearch}
            onChange={setItemSearch}
            placeholder="Buscar en el catálogo de objetos..."
            style={{ flex: 1, minWidth: 0 }}
          />
          <JsonImportButton
            onImportJson={importItemsList}
            title="Cargar objetos desde archivo JSON"
          />
        </div>

        {trimmedQuery.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', overflowY: 'auto' }}>
            {filteredItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: 'var(--vtt-text-dim)', fontStyle: 'italic' }}>
                No se encontraron objetos para &quot;{trimmedQuery}&quot;.
              </div>
            ) : (
              filteredItems.map(item => (
                <div
                  key={item.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'ground_item', item }));
                    e.dataTransfer.effectAllowed = 'copy';
                    if (onStartDragItem) onStartDragItem(item);
                  }}
                  onDragEnd={() => {
                    if (onEndDragItem) onEndDragItem();
                  }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--vtt-bg-card)',
                    padding: '6px 8px',
                    borderRadius: '7px',
                    border: '1px solid var(--vtt-border-subtle)',
                    gap: '6px',
                    cursor: 'grab',
                    userSelect: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s'
                  }}
                  title="Arrastra este objeto directamente al tablero para soltarlo en el suelo"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', overflow: 'hidden', flex: 1 }}>
                    <span style={{ color: 'var(--vtt-text-dim)', display: 'inline-flex', cursor: 'grab', flexShrink: 0 }} title="Arrastrar al tablero">
                      <Grip size={11} strokeWidth={2.2} />
                    </span>
                    <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {getGameIconComponent(item.name, 18)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: '11px', color: 'var(--vtt-text)', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {item.name}
                      </span>
                      {item.notes && (
                        <span style={{ fontSize: '9px', color: 'var(--vtt-text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={item.notes}>
                          {item.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onGiveItemToCharacter) onGiveItemToCharacter(activeTurnTokenId, item);
                      }}
                      className="vtt-brass-btn"
                      style={{
                        padding: '3px 8px',
                        fontSize: '10px',
                        borderRadius: '5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        color: 'var(--vtt-gold-light)',
                        borderColor: 'var(--vtt-gold)'
                      }}
                      title="Añadir inmediatamente al inventario del turno activo"
                    >
                      Dar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </SectionAccordion>

      {/* 4. Fuentes de Luz */}
      <SectionAccordion
        title="Fuentes de Luz"
        isExpanded={isLightsExpanded}
        onClick={() => setIsLightsExpanded(!isLightsExpanded)}
        tooltip="Arrastra antorchas y luces al tablero para iluminar zonas"
      >
        {LIGHT_PRESETS.map(preset => {
          const LightIcon = LIGHT_ICONS[preset.presetId] || Flame;
          const lightPayload = {
            type: 'light',
            name: preset.label,
            icon: preset.icon,
            width: 38,
            height: 38,
            radius: preset.radius,
            color: preset.color,
            isOn: true,
            isLocked: false
          };

          return (
            <div
              key={preset.presetId}
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'map_element', element: lightPayload }));
                e.dataTransfer.effectAllowed = 'copy';
                if (onStartDragMapElement) onStartDragMapElement(lightPayload);
              }}
              onDragEnd={() => {
                if (onEndDragMapElement) onEndDragMapElement();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--vtt-bg-card)',
                padding: '7px 10px',
                borderRadius: '7px',
                border: '1px solid var(--vtt-border-subtle)',
                cursor: 'grab',
                userSelect: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s'
              }}
              title="Arrastra esta fuente de luz directamente al tablero"
            >
              <span style={{ color: 'var(--vtt-text-dim)', display: 'inline-flex', cursor: 'grab', flexShrink: 0 }}>
                <Grip size={11} strokeWidth={2.2} />
              </span>
              <LightIcon size={14} strokeWidth={2.2} style={{ color: 'var(--vtt-gold-light)', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--vtt-text)', fontWeight: 500 }}>{preset.label}</span>
            </div>
          );
        })}
      </SectionAccordion>

      {/* 5. Puertas y Ventanas */}
      <SectionAccordion
        title="Puertas y Ventanas"
        isExpanded={isStructuresExpanded}
        onClick={() => setIsStructuresExpanded(!isStructuresExpanded)}
        tooltip="Arrastra puertas y ventanas directamente sobre el mapa"
      >
        {[
          {
            key: 'door',
            label: 'Puerta de madera',
            Icon: DoorClosed,
            iconColor: 'var(--vtt-accent-amber)',
            payload: { type: 'door', name: 'Puerta', width: 36, height: 10, rotation: 0, isOpen: false, isLocked: false }
          },
          {
            key: 'window',
            label: 'Ventana',
            Icon: AppWindow,
            iconColor: 'var(--vtt-accent-sky)',
            payload: { type: 'window', name: 'Ventana', width: 36, height: 8, rotation: 0, isOpen: false, isBroken: false, isLocked: false }
          }
        ].map(({ key, label, Icon, iconColor, payload }) => (
          <div
            key={key}
            draggable={true}
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'map_element', element: payload }));
              e.dataTransfer.effectAllowed = 'copy';
              if (onStartDragMapElement) onStartDragMapElement(payload);
            }}
            onDragEnd={() => {
              if (onEndDragMapElement) onEndDragMapElement();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--vtt-bg-card)',
              padding: '7px 10px',
              borderRadius: '7px',
              border: '1px solid var(--vtt-border-subtle)',
              cursor: 'grab',
              userSelect: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s'
            }}
            title={`Arrastra "${label}" directamente al tablero para colocarla`}
          >
            <span style={{ color: 'var(--vtt-text-dim)', display: 'inline-flex', cursor: 'grab', flexShrink: 0 }}>
              <Grip size={11} strokeWidth={2.2} />
            </span>
            <Icon size={14} strokeWidth={2.2} style={{ color: iconColor, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--vtt-text)', fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </SectionAccordion>
    </div>
  );
};

export default LibraryTab;
