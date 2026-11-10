import { useState } from 'react';
import {
  Grip, Pencil, FolderOpen, ChevronUp, ChevronDown,
  Flame, Sparkles, Sun, AlertTriangle, DoorClosed, AppWindow
} from 'lucide-react';
import { importJSON } from '../../utils/fileDialog';
import { LIGHT_PRESETS } from '../../constants/gamePresets';
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
    border: isExpanded ? '1px solid #d4af37' : '1px solid #2b3040',
    backgroundColor: '#12151e',
    boxShadow: isExpanded ? '0 0 12px rgba(212, 175, 55, 0.14)' : '0 2px 6px rgba(0,0,0,0.4)',
    flexShrink: 0,
    transition: 'all 0.15s ease'
  }}>
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        padding: '10px 14px',
        backgroundColor: isExpanded ? '#1e2433' : '#161a24',
        border: 'none',
        borderBottom: isExpanded ? '1px solid #2c3549' : 'none',
        color: isExpanded ? '#fbbf24' : '#f1f5f9',
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
      <span style={{ display: 'inline-flex', color: isExpanded ? '#fbbf24' : '#64748b' }}>
        {isExpanded ? <ChevronUp size={15} strokeWidth={2.3} /> : <ChevronDown size={15} strokeWidth={2.3} />}
      </span>
    </button>

    {isExpanded && (
      <div style={{
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        backgroundColor: '#0f1219'
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
  onEditCharacter
}) => {
  const isMonster = variant === 'monster';
  const borderColor = isMonster ? '#7f1d1d' : char.isGraveWound ? '#ef4444' : '#2c3344';
  const avatarBorder = isMonster ? '1px solid #ef4444' : '1px solid #3b82f6';
  const titleColor = isMonster ? '#fca5a5' : char.isGraveWound ? '#fca5a5' : '#f8fafc';
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
        background: '#191d27',
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
          <span style={{ color: '#64748b', display: 'inline-flex', cursor: 'grab', userSelect: 'none' }} title="Arrastrar al tablero">
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
              <span style={{ fontWeight: 800, color: isMonster ? '#fca5a5' : '#93c5fd', fontSize: '11px' }}>
                {(char.name || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: titleColor, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {char.name}
            </span>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
              {subtitle}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
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

/**
 * Pestaña "Elementos" del panel lateral: personajes, bestiario, loot buscable, luces y estructuras.
 */
const LibraryTab = ({
  characters = [],
  commonItems = [],
  activeTurnTokenId,
  onImportCharacters,
  onCreateNewCharacter,
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
  const [isMonstersExpanded, setIsMonstersExpanded] = useState(false);
  const [isObjectsExpanded, setIsObjectsExpanded] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [isLightsExpanded, setIsLightsExpanded] = useState(false);
  const [isStructuresExpanded, setIsStructuresExpanded] = useState(false);
  const [importError, setImportError] = useState(null);

  const humanCharacters = characters.filter(c => !isMonsterEntity(c));
  const monsterCharacters = characters.filter(c => isMonsterEntity(c));

  const importEntityList = async ({ description, defaultFaction, defaultEntityType }) => {
    setImportError(null);
    const res = await importJSON({ accept: '.json', description });
    if (res?.success && res.text) {
      try {
        const parsed = JSON.parse(res.text);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        const formatted = list.map(c => ({
          ...c,
          id: c.id || Date.now() + Math.random(),
          faction: c.faction || defaultFaction,
          entityType: c.entityType || defaultEntityType
        }));
        if (onImportCharacters) onImportCharacters(formatted);
      } catch {
        setImportError('El archivo seleccionado no es un JSON válido de personajes.');
      }
    }
  };

  const trimmedQuery = itemSearch.trim().toLowerCase();
  const filteredItems = trimmedQuery
    ? (commonItems || []).filter(item =>
        (item.name || '').toLowerCase().includes(trimmedQuery) ||
        (item.notes || '').toLowerCase().includes(trimmedQuery) ||
        (item.category || '').toLowerCase().includes(trimmedQuery)
      )
    : [];

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
        tooltip="Investigadores y personajes aliados"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Investigadores</span>
          {onCreateNewCharacter && (
            <button
              type="button"
              onClick={() => onCreateNewCharacter('human')}
              className="vtt-brass-btn"
              style={{ padding: '4px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', color: '#fbbf24', borderColor: '#f59e0b' }}
              title="Inscribir nuevo personaje o investigador"
            >
              + Inscribir
            </button>
          )}
        </div>

        {humanCharacters.map(char => (
          <CharacterLibraryRow
            key={char.id}
            char={char}
            variant="human"
            onStartDragCharacter={onStartDragCharacter}
            onEndDragCharacter={onEndDragCharacter}
            onEditCharacter={onEditCharacter}
          />
        ))}

        {humanCharacters.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '16px 12px',
            backgroundColor: '#12151c',
            borderRadius: '7px',
            border: '1px dashed #2c3344',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Sin personajes cargados en la mesa.</span>
            <button
              type="button"
              onClick={() => importEntityList({
                description: 'Personajes VTT (*.json)',
                defaultFaction: 'ally',
                defaultEntityType: 'human'
              })}
              className="vtt-brass-btn"
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                borderColor: '#f59e0b',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(180, 83, 9, 0.3) 100%)'
              }}
              title="Cargar archivo JSON de personajes"
            >
              <FolderOpen size={13} strokeWidth={2.2} />
              <span>Cargar Personajes (JSON)</span>
            </button>
          </div>
        )}
      </SectionAccordion>

      {/* 2. Bestiario y Mitos */}
      <SectionAccordion
        title="Bestiario y Mitos"
        isExpanded={isMonstersExpanded}
        onClick={() => setIsMonstersExpanded(!isMonstersExpanded)}
        tooltip="Criaturas y monstruos de los Mitos"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          <span style={{ fontSize: '10px', color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Entidades y Horrores</span>
          {onCreateNewCharacter && (
            <button
              type="button"
              onClick={() => onCreateNewCharacter('mythos_creature')}
              className="vtt-brass-btn"
              style={{ padding: '4px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', color: '#fca5a5', borderColor: '#ef4444' }}
              title="Registrar nueva criatura o monstruo de los Mitos"
            >
              + Criatura
            </button>
          )}
        </div>

        {monsterCharacters.map(char => (
          <CharacterLibraryRow
            key={char.id}
            char={char}
            variant="monster"
            onStartDragCharacter={onStartDragCharacter}
            onEndDragCharacter={onEndDragCharacter}
            onEditCharacter={onEditCharacter}
          />
        ))}

        {monsterCharacters.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '16px 12px',
            backgroundColor: '#12151c',
            borderRadius: '7px',
            border: '1px dashed #3a1d1d',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Sin criaturas registradas en el bestiario.</span>
            <button
              type="button"
              onClick={() => importEntityList({
                description: 'Bestiario VTT (*.json)',
                defaultFaction: 'enemy',
                defaultEntityType: 'mythos_creature'
              })}
              className="vtt-brass-btn"
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                borderColor: '#ef4444',
                color: '#fca5a5',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(153, 27, 27, 0.3) 100%)'
              }}
              title="Cargar archivo JSON de criaturas y monstruos"
            >
              <FolderOpen size={13} strokeWidth={2.2} />
              <span>Cargar Bestiario (JSON)</span>
            </button>
          </div>
        )}
      </SectionAccordion>

      {/* 3. Objetos de Inventario (Loot) — sólo visibles tras buscar */}
      <SectionAccordion
        title="Objetos de Inventario (Loot)"
        isExpanded={isObjectsExpanded}
        onClick={() => setIsObjectsExpanded(!isObjectsExpanded)}
        tooltip="Busca objetos del catálogo para arrastrarlos al tablero o entregarlos"
      >
        <SearchInput
          value={itemSearch}
          onChange={setItemSearch}
          placeholder="Buscar en el catálogo de objetos..."
        />

        {trimmedQuery && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', overflowY: 'auto' }}>
            {filteredItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '12px', fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                No se encontraron objetos para &quot;{itemSearch.trim()}&quot;.
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
                    backgroundColor: '#191d27',
                    padding: '6px 8px',
                    borderRadius: '7px',
                    border: '1px solid #2c3344',
                    gap: '6px',
                    cursor: 'grab',
                    userSelect: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s'
                  }}
                  title="Arrastra este objeto directamente al tablero para soltarlo en el suelo"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', overflow: 'hidden', flex: 1 }}>
                    <span style={{ color: '#64748b', display: 'inline-flex', cursor: 'grab', flexShrink: 0 }} title="Arrastrar al tablero">
                      <Grip size={11} strokeWidth={2.2} />
                    </span>
                    <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {getGameIconComponent(item.name, 18)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {item.name}
                      </span>
                      {item.notes && (
                        <span style={{ fontSize: '9px', color: '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={item.notes}>
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
                        color: '#fbbf24',
                        borderColor: '#f59e0b'
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
                backgroundColor: '#191d27',
                padding: '7px 10px',
                borderRadius: '7px',
                border: '1px solid #2c3344',
                cursor: 'grab',
                userSelect: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s'
              }}
              title="Arrastra esta fuente de luz directamente al tablero"
            >
              <span style={{ color: '#64748b', display: 'inline-flex', cursor: 'grab', flexShrink: 0 }}>
                <Grip size={11} strokeWidth={2.2} />
              </span>
              <LightIcon size={14} strokeWidth={2.2} style={{ color: '#fbbf24', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 500 }}>{preset.label}</span>
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
            iconColor: '#d4af37',
            payload: { type: 'door', name: 'Puerta', width: 36, height: 10, rotation: 0, isOpen: false, isLocked: false }
          },
          {
            key: 'window',
            label: 'Ventana',
            Icon: AppWindow,
            iconColor: '#38bdf8',
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
              backgroundColor: '#191d27',
              padding: '7px 10px',
              borderRadius: '7px',
              border: '1px solid #2c3344',
              cursor: 'grab',
              userSelect: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s'
            }}
            title={`Arrastra "${label}" directamente al tablero para colocarla`}
          >
            <span style={{ color: '#64748b', display: 'inline-flex', cursor: 'grab', flexShrink: 0 }}>
              <Grip size={11} strokeWidth={2.2} />
            </span>
            <Icon size={14} strokeWidth={2.2} style={{ color: iconColor, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </SectionAccordion>
    </div>
  );
};

export default LibraryTab;
