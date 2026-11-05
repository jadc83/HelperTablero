import React, { useState, useEffect } from 'react';
import { OBJECT_PRESETS, LIGHT_PRESETS } from './MapCreator';
import { getGameIconComponent } from './icons/GameIcons';

const SectionAccordion = ({ title, count, isExpanded, onClick, children, tooltip }) => (
  <div
    style={{
      borderRadius: '8px',
      border: isExpanded ? '1px solid #f59e0b' : '1px solid #242c3d',
      borderLeft: isExpanded ? '4px solid #f59e0b' : '1px solid #242c3d',
      backgroundColor: isExpanded ? '#141824' : '#131720',
      marginBottom: '10px',
      overflow: 'hidden',
      boxShadow: isExpanded ? '0 4px 14px rgba(245, 158, 11, 0.15)' : 'none',
      transition: 'border 0.15s, background 0.15s',
      flexShrink: 0
    }}
  >
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 12px',
        backgroundColor: isExpanded ? '#1b2232' : 'transparent',
        border: 'none',
        borderBottom: isExpanded ? '1px solid rgba(245, 158, 11, 0.25)' : 'none',
        cursor: 'pointer',
        color: isExpanded ? '#f8fafc' : '#94a3b8',
        transition: 'all 0.15s ease'
      }}
      title={tooltip || (isExpanded ? "Haz clic para plegar esta sección" : "Haz clic para desplegar esta sección")}
    >
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
        <span style={{
          fontSize: '12px',
          fontWeight: isExpanded ? 800 : 700,
          letterSpacing: '0.02em',
          color: isExpanded ? '#f8fafc' : '#cbd5e1',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {title}
        </span>
      </div>
      <span style={{
        fontSize: '10px',
        width: '20px',
        height: '20px',
        borderRadius: '4px',
        backgroundColor: isExpanded ? 'rgba(245, 158, 11, 0.25)' : '#1e2433',
        color: isExpanded ? '#fbbf24' : '#8593a8',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        flexShrink: 0
      }}>
        {isExpanded ? '▲' : '▼'}
      </span>
    </button>

    {isExpanded && (
      <div style={{ padding: '8px 9px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {children}
      </div>
    )}
  </div>
);

const TokenSidebar = ({ 
  tokens = [], 
  characters = [], 
  graveyard = [],
  onOpenGraveyard,
  onSendToGraveyard,
  onAddToken, 
  onAddMapElement,
  onOpenMapCreator,
  onOpenEncyclopedia,
  onRemoveToken, 
  onRemoveCharacter,
  onEditCharacter,
  onCreateNewCharacter,
  onUpdateTokenStats,
  onUpdateTokenSize,
  onUpdateTokenVisionMode,
  onToggleTokenName,
  onToggleTokenBars,
  onToggleTokenHidden,
  onToggleTokenFaction,
  customStatuses = [],
  customObjects = [],
  commonItems = [],
  onGiveItemToCharacter,
  onPlaceGroundItem,
  onDropItemToFloor,
  onOpenTokenSheet,
  onReorderTokens,
  onMoveTokenOrder,
  onCenterOnToken,
  activeTurnTokenId = null,
  combatRound = 1,
  isCombatActive = false,
  onStartCombat,
  onNextTurn,
  onEndCombat,
  movementLimitsEnabled = true,
  onToggleMovementLimits,
  onResetTokenMovement,
  onSelectActiveTurn
}) => {
  // Pestaña principal: 'scene' (En Escena) o 'library' (Biblioteca/Invocación)
  const [activeMainTab, setActiveMainTab] = useState('scene');

  // Acordeones de compendio dentro de la pestaña Biblioteca
  const [isCharactersExpanded, setIsCharactersExpanded] = useState(true);
  const [isMonstersExpanded, setIsMonstersExpanded] = useState(true);
  const [isObjectsExpanded, setIsObjectsExpanded] = useState(false);
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);
  const [lootSearchQuery, setLootSearchQuery] = useState('');
  const [isLightsExpanded, setIsLightsExpanded] = useState(false);
  const [isStructuresExpanded, setIsStructuresExpanded] = useState(false);

  // Estados de acordeón y Drag & Drop para los personajes en escena (turnos de combate)
  const [expandedTokenIds, setExpandedTokenIds] = useState(new Set());
  const [draggedTokenIndex, setDraggedTokenIndex] = useState(null);
  const [dragOverTokenIndex, setDragOverTokenIndex] = useState(null);
  const [dragHandleActiveTokenId, setDragHandleActiveTokenId] = useState(null);

  useEffect(() => {
    const handleGlobalMouseUp = () => setDragHandleActiveTokenId(null);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const toggleTokenExpand = (id) => {
    setExpandedTokenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const collapseAll = () => setExpandedTokenIds(new Set());
  const expandAll = () => setExpandedTokenIds(new Set(tokens.map(t => t.id)));

  const MONSTER_TYPES = ['mythos_creature', 'great_old_one', 'outer_god', 'animal', 'undead', 'aberration'];
  const isMonsterEntity = (c) => MONSTER_TYPES.includes(c.entityType) || (!c.entityType && c.faction === 'enemy');

  const humanCharacters = (characters || []).filter(c => !isMonsterEntity(c));
  const monsterCharacters = (characters || []).filter(c => isMonsterEntity(c));

  return (
    <div style={{
      width: '320px',
      height: '100%',
      background: 'linear-gradient(180deg, #14171f 0%, #0e1016 100%)',
      color: '#e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #2b3040',
      boxShadow: '6px 0 24px rgba(0,0,0,0.65)',
      zIndex: 20,
      flexShrink: 0
    }}>
      {/* Selector de Pestañas Superiores: En Escena vs Invocación */}
      <div style={{
        padding: '8px 10px',
        backgroundColor: '#0c0e15',
        borderBottom: '1px solid #242c3d',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          backgroundColor: '#131722',
          padding: '3px',
          borderRadius: '8px',
          border: '1px solid #242d40',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => setActiveMainTab('scene')}
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              border: activeMainTab === 'scene' ? '1px solid #f59e0b' : '1px solid transparent',
              borderRadius: '6px',
              backgroundColor: activeMainTab === 'scene' ? '#1e2638' : 'transparent',
              color: activeMainTab === 'scene' ? '#fbbf24' : '#8593a8',
              boxShadow: activeMainTab === 'scene' ? '0 2px 8px rgba(0,0,0,0.45)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Personajes y criaturas en juego en el mapa activo (turnos, PV, movimientos)"
          >
            <span>En Escena</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('library')}
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              border: activeMainTab === 'library' ? '1px solid #f59e0b' : '1px solid transparent',
              borderRadius: '6px',
              backgroundColor: activeMainTab === 'library' ? '#1e2638' : 'transparent',
              color: activeMainTab === 'library' ? '#fbbf24' : '#8593a8',
              boxShadow: activeMainTab === 'library' ? '0 2px 8px rgba(0,0,0,0.45)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px'
            }}
            title="Biblioteca de personajes, criaturas, mobiliario y elementos para colocar en el mapa"
          >
            <span>Elementos</span>
          </button>
        </div>
      </div>

      {/* PESTAÑA: BIBLIOTECA E INVOCACIÓN */}
      {activeMainTab === 'library' && (
        <div style={{ 
          padding: '12px', 
          flex: 1, 
          minHeight: 0,
          display: 'flex', 
          flexDirection: 'column',
          overflowY: 'auto'
        }}>
          {onOpenMapCreator && (
            <button
              type="button"
              onClick={onOpenMapCreator}
              className="vtt-brass-btn"
              style={{
                padding: '7px 10px',
                borderRadius: '7px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                borderColor: '#f59e0b',
                color: '#fbbf24',
                width: '100%',
                justifyContent: 'center',
                marginBottom: '12px',
                flexShrink: 0
              }}
              title="Abrir el Creador y Editor de Mapas"
            >
              Editor de Mapas y Muros
            </button>
          )}

          {/* 1. ARCHIVO DE PERSONAJES */}
          <SectionAccordion
            title="Personajes"
            count={humanCharacters.length}
            isExpanded={isCharactersExpanded}
            onClick={() => setIsCharactersExpanded(!isCharactersExpanded)}
            tooltip="Investigadores y personajes aliados"
          >
            <div style={{ display: 'flex', gap: '5px', marginBottom: '2px' }}>
              {onOpenEncyclopedia && (
                <button
                  type="button"
                  onClick={() => onOpenEncyclopedia('character')}
                  className="vtt-brass-btn"
                  style={{ flex: 1, padding: '6px 8px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', borderColor: '#f59e0b', color: '#fbbf24' }}
                >
                  Enciclopedia
                </button>
              )}
              {onCreateNewCharacter && (
                <button
                  type="button"
                  onClick={() => onCreateNewCharacter('human')}
                  className="vtt-primary-cta"
                  style={{ flex: 1, padding: '6px 8px', borderRadius: '7px', fontSize: '11px', cursor: 'pointer' }}
                >
                  + Personaje
                </button>
              )}
            </div>
            {humanCharacters.map(char => (
              <div 
                key={char.id}
                style={{
                  background: '#191d27',
                  border: char.isGraveWound ? '1px solid #ef4444' : '1px solid #2c3344',
                  borderRadius: '7px',
                  padding: '7px 9px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
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
                      border: '1px solid #3b82f6'
                    }}>
                      {char.avatar ? (
                        <img src={char.avatar} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontWeight: 800, color: '#93c5fd', fontSize: '11px' }}>{(char.name || '?').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: char.isGraveWound ? '#fca5a5' : '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {char.name}
                      </span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {char.hasArmor ? `Arm. ${char.armorType}` : 'Investigador / Humano'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                    {onEditCharacter && (
                      <button
                        type="button"
                        onClick={() => onEditCharacter(char)}
                        className="vtt-brass-btn"
                        style={{ borderRadius: '6px', padding: '4px 7px', cursor: 'pointer', fontSize: '11px' }}
                        title="Abrir y editar ficha"
                      >
                        ✏️
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={() => onAddToken(char)} 
                      className="vtt-primary-cta"
                      style={{ borderRadius: '6px', padding: '4px 9px', cursor: 'pointer', fontSize: '11px' }}
                      title="Seleccionar casilla para desplegar en el tablero"
                    >
                      Invocar
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {humanCharacters.length === 0 && (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: '11px', padding: '8px', backgroundColor: '#12151c', borderRadius: '6px', border: '1px dashed #2c3344' }}>
                Sin personajes. Abre la <strong>Enciclopedia</strong> o pulsa <strong>+ Personaje</strong>.
              </div>
            )}
          </SectionAccordion>

          {/* 1B. BESTIARIO, MONSTRUOS Y MITOS */}
          <SectionAccordion
            title="Bestiario y Mitos"
            count={monsterCharacters.length}
            isExpanded={isMonstersExpanded}
            onClick={() => setIsMonstersExpanded(!isMonstersExpanded)}
            tooltip="Criaturas y monstruos de los Mitos"
          >
            <div style={{ display: 'flex', gap: '5px', marginBottom: '2px' }}>
              {onOpenEncyclopedia && (
                <button
                  type="button"
                  onClick={() => onOpenEncyclopedia('monster')}
                  className="vtt-brass-btn"
                  style={{ flex: 1, padding: '6px 8px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', borderColor: '#8b5cf6', color: '#c4b5fd' }}
                >
                  Bestiario
                </button>
              )}
              {onCreateNewCharacter && (
                <button
                  type="button"
                  onClick={() => onCreateNewCharacter('mythos_creature')}
                  className="vtt-brass-btn"
                  style={{ flex: 1, padding: '6px 8px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', borderColor: '#ef4444', color: '#fca5a5' }}
                >
                  + Criatura
                </button>
              )}
            </div>
            {monsterCharacters.map(char => (
              <div 
                key={char.id}
                style={{
                  background: '#191d27',
                  border: '1px solid #7f1d1d',
                  borderRadius: '7px',
                  padding: '7px 9px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
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
                      border: '1px solid #ef4444'
                    }}>
                      {char.avatar ? (
                        <img src={char.avatar} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontWeight: 800, color: '#fca5a5', fontSize: '11px' }}>{(char.name || '?').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#fca5a5', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {char.name}
                      </span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {char.entityType ? char.entityType.replace('_', ' ') : 'Monstruo'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                    {onEditCharacter && (
                      <button
                        type="button"
                        onClick={() => onEditCharacter(char)}
                        className="vtt-brass-btn"
                        style={{ borderRadius: '6px', padding: '4px 7px', cursor: 'pointer', fontSize: '11px' }}
                        title="Abrir y editar ficha"
                      >
                        ✏️
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={() => onAddToken(char)} 
                      className="vtt-primary-cta"
                      style={{ borderRadius: '6px', padding: '4px 9px', cursor: 'pointer', fontSize: '11px' }}
                    >
                      Invocar
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {monsterCharacters.length === 0 && (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: '11px', padding: '8px', backgroundColor: '#12151c', borderRadius: '6px', border: '1px dashed #2c3344' }}>
                Sin criaturas registradas. Abre el <strong>Bestiario</strong> o pulsa <strong>+ Criatura</strong>.
              </div>
            )}
          </SectionAccordion>

          {/* 2. DECORADO & MOBILIARIO DEL TABLERO */}
          <SectionAccordion
            title="Decorado & Mobiliario"
            count={OBJECT_PRESETS.length + (customObjects?.length || 0)}
            isExpanded={isObjectsExpanded}
            onClick={() => setIsObjectsExpanded(!isObjectsExpanded)}
            tooltip="Elementos decorativos y mobiliario para el mapa"
          >
            {/* Decorado Personalizado del Catálogo */}
            {customObjects && customObjects.length > 0 && (
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>
                  Catálogo personalizado ({customObjects.length})
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {customObjects.map(obj => (
                    <div
                      key={obj.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#1c2230',
                        padding: '6px 10px',
                        borderRadius: '7px',
                        border: '1px solid #3b4255'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', overflow: 'hidden' }}>
                        <span style={{ fontSize: '14px' }}>{obj.icon || '🪑'}</span>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '12px', color: '#f8fafc', fontWeight: 600 }}>{obj.name}</span>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                            {obj.w}x{obj.h}px • {obj.blocksMovement ? 'Bloquea paso' : 'Paso libre'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onAddMapElement && onAddMapElement({
                          type: obj.category || 'object',
                          name: obj.name,
                          icon: obj.icon,
                          openIcon: obj.openIcon,
                          w: obj.w,
                          h: obj.h,
                          blocksMovement: obj.blocksMovement,
                          blocksVision: obj.blocksVision,
                          notes: obj.notes,
                          secretNotes: obj.secretNotes,
                          linkedHandoutId: obj.linkedHandoutId,
                          lightRadius: obj.lightRadius,
                          lightColor: obj.lightColor
                        })}
                        className="vtt-brass-btn"
                        style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '5px', fontWeight: 700, cursor: 'pointer', color: '#fbbf24', borderColor: '#f59e0b' }}
                        title="Colocar en el mapa"
                      >
                        + Colocar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {OBJECT_PRESETS.map(preset => (
              <div key={preset.presetId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#191d27', padding: '6px 10px', borderRadius: '7px', border: '1px solid #2c3344' }}>
                <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 500 }}>{preset.icon} {preset.label}</span>
                <button 
                  type="button"
                  onClick={() => onAddMapElement && onAddMapElement({
                    id: Date.now() + Math.random(), type: 'object', name: preset.label, icon: preset.icon, openIcon: preset.openIcon,
                    width: 48, height: 48, isOpen: false, blocksMovement: preset.blocksMovement, blocksVision: preset.blocksVision, isHidden: false
                  })}
                  className="vtt-brass-btn" style={{ padding: '4px 9px', fontSize: '11px', borderRadius: '5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Colocar
                </button>
              </div>
            ))}
          </SectionAccordion>

          {/* 3. OBJETOS DE INVENTARIO Y LOOT COMÚN */}
          <SectionAccordion
            title="Objetos de Inventario (Loot)"
            count={commonItems.length}
            isExpanded={isItemsExpanded}
            onClick={() => setIsItemsExpanded(!isItemsExpanded)}
            tooltip="Objetos comunes y botín para equipar o soltar"
          >
            {/* Aviso de turno activo destinatario */}
            {(() => {
              const activeTurnToken = tokens.find(t => t.id === activeTurnTokenId) || null;
              return (
                <div style={{
                  padding: '5px 8px',
                  borderRadius: '6px',
                  backgroundColor: activeTurnToken ? 'rgba(245, 158, 11, 0.15)' : '#171b26',
                  border: activeTurnToken ? '1px solid #f59e0b' : '1px solid #282f40',
                  fontSize: '10px',
                  color: activeTurnToken ? '#fbbf24' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  marginBottom: '2px'
                }}>
                  <span style={{ fontWeight: 600 }}>
                    {activeTurnToken ? `Entregando al turno activo: ${activeTurnToken.name}` : 'Entrega directa a personajes'}
                  </span>
                </div>
              );
            })()}

            {/* Buscador de botín / objetos comunes */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#0e1117', border: '1px solid #232a3a', borderRadius: '6px', padding: '3px 8px', marginBottom: '6px' }}>
              <span style={{ color: '#64748b', fontSize: '11px', marginRight: '6px' }}>🔍</span>
              <input
                type="text"
                value={lootSearchQuery}
                onChange={(e) => setLootSearchQuery(e.target.value)}
                placeholder="Buscar en el catálogo de objetos..."
                style={{ flex: 1, background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '11px', outline: 'none' }}
              />
              {lootSearchQuery && (
                <button
                  type="button"
                  onClick={() => setLootSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '10px' }}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {commonItems
                .filter(item => !lootSearchQuery.trim() || item.name.toLowerCase().includes(lootSearchQuery.toLowerCase()) || (item.notes && item.notes.toLowerCase().includes(lootSearchQuery.toLowerCase())))
                .map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#191d27',
                    padding: '5px 8px',
                    borderRadius: '7px',
                    border: '1px solid #2c3344',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', overflow: 'hidden', flex: 1 }}>
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
                    {onPlaceGroundItem && (
                      <button
                        type="button"
                        onClick={() => onPlaceGroundItem(item)}
                        className="vtt-brass-btn"
                        style={{
                          padding: '2px 6px',
                          fontSize: '10px',
                          borderRadius: '5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          color: '#38bdf8',
                          borderColor: '#0284c7'
                        }}
                        title="Colocar en el suelo del mapa"
                      >
                        En suelo
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onGiveItemToCharacter && onGiveItemToCharacter(activeTurnTokenId, item)}
                      className="vtt-brass-btn"
                      style={{
                        padding: '2px 7px',
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
              ))}
            </div>
          </SectionAccordion>

          {/* 3. FUENTES DE LUZ */}
          <SectionAccordion
            title="Fuentes de Luz"
            count={LIGHT_PRESETS.length}
            isExpanded={isLightsExpanded}
            onClick={() => setIsLightsExpanded(!isLightsExpanded)}
            tooltip="Antorchas y luces para visión dinámica"
          >
            {LIGHT_PRESETS.map(preset => (
              <div key={preset.presetId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#191d27', padding: '6px 10px', borderRadius: '7px', border: '1px solid #2c3344' }}>
                <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 500 }}>{preset.icon} {preset.label}</span>
                <button 
                  type="button"
                  onClick={() => onAddMapElement && onAddMapElement({
                    id: Date.now() + Math.random(), type: 'light', name: preset.label, icon: preset.icon,
                    width: 38, height: 38, radius: preset.radius, color: preset.color, isOn: true
                  })}
                  className="vtt-brass-btn" style={{ padding: '4px 9px', fontSize: '11px', borderRadius: '5px', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Colocar
                </button>
              </div>
            ))}
          </SectionAccordion>

          {/* 4. ESTRUCTURAS */}
          <SectionAccordion
            title="Puertas y Ventanas"
            count={2}
            isExpanded={isStructuresExpanded}
            onClick={() => setIsStructuresExpanded(!isStructuresExpanded)}
            tooltip="Estructuras de paso y visión"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#191d27', padding: '6px 10px', borderRadius: '7px', border: '1px solid #2c3344' }}>
              <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 500 }}>Puerta de madera</span>
              <button 
                type="button"
                onClick={() => onAddMapElement && onAddMapElement({ id: Date.now() + Math.random(), type: 'door', name: 'Puerta', width: 60, height: 16, isOpen: false })}
                className="vtt-brass-btn" style={{ padding: '4px 9px', fontSize: '11px', borderRadius: '5px', fontWeight: 600, cursor: 'pointer' }}
              >+ Colocar</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#191d27', padding: '6px 10px', borderRadius: '7px', border: '1px solid #2c3344' }}>
              <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 500 }}>Ventana</span>
              <button 
                type="button"
                onClick={() => onAddMapElement && onAddMapElement({ id: Date.now() + Math.random(), type: 'window', name: 'Ventana', width: 60, height: 14, isOpen: false, isBroken: false })}
                className="vtt-brass-btn" style={{ padding: '4px 9px', fontSize: '11px', borderRadius: '5px', fontWeight: 600, cursor: 'pointer' }}
              >+ Colocar</button>
            </div>
          </SectionAccordion>
        </div>
      )}

      {/* PESTAÑA: EN ESCENA Y GESTIÓN DE COMBATE */}
      {activeMainTab === 'scene' && (
        <div style={{ padding: '12px 10px', flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* Barra de Gestión de Turnos e Iniciativa */}
        {tokens.length > 1 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginBottom: '10px',
            padding: '7px 8px',
            background: isCombatActive
              ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.18) 0%, rgba(20, 24, 34, 0.95) 100%)'
              : '#131620',
            border: isCombatActive ? '1px solid #fbbf24' : '1px solid #282f3f',
            borderRadius: '8px',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: isCombatActive ? '#fbbf24' : '#94a3b8', fontWeight: 600 }}>
                  {isCombatActive ? `Ronda ${combatRound}` : 'Orden de turnos'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                {!isCombatActive ? (
                  onStartCombat && (
                    <button
                      type="button"
                      onClick={onStartCombat}
                      className="vtt-primary-cta"
                      style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer' }}
                      title="Iniciar el combate siguiendo el orden de la lista"
                    >
                      ▶ Iniciar
                    </button>
                  )
                ) : (
                  <>
                    {onToggleMovementLimits && (
                      <button
                        type="button"
                        onClick={onToggleMovementLimits}
                        style={{
                          background: movementLimitsEnabled ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.15)',
                          border: movementLimitsEnabled ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(239, 68, 68, 0.4)',
                          color: movementLimitsEnabled ? '#34d399' : '#fca5a5',
                          padding: '3px 6px',
                          fontSize: '10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                        title={movementLimitsEnabled ? "Límites de movimiento activados. Clic para desactivar" : "Límites de movimiento desactivados. Clic para activar"}
                      >
                        {movementLimitsEnabled ? 'Mov.: ON' : 'Mov.: OFF'}
                      </button>
                    )}
                    {onNextTurn && (
                      <button
                        type="button"
                        onClick={onNextTurn}
                        className="vtt-primary-cta"
                        style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer' }}
                        title="Pasar al siguiente turno en la lista y restablecer movimiento"
                      >
                        ▶ Sig. Turno
                      </button>
                    )}
                    {onEndCombat && (
                      <button
                        type="button"
                        onClick={onEndCombat}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          color: '#fca5a5',
                          padding: '3px 6px',
                          fontSize: '10px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                        title="Finalizar el combate"
                      >
                        ⏹
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            {isCombatActive ? (
              <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
                En combate solo se mueve el turno activo. <strong style={{ color: '#fbbf24' }}>Ctrl + Arrastre</strong> para mover libre.
              </span>
            ) : (
              <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
                Pulsa <strong style={{ color: '#fbbf24' }}>▶ Iniciar</strong> para comenzar el combate y activar el límite de movimiento por turno.
              </span>
            )}
          </div>
        )}

        {/* Botón para abrir y cerrar desplegables de personajes */}
        {tokens.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginBottom: '8px',
            paddingRight: '2px'
          }}>
            <button
              type="button"
              onClick={expandedTokenIds.size > 0 ? collapseAll : expandAll}
              className="vtt-brass-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                fontSize: '10px',
                borderRadius: '4px',
                cursor: 'pointer',
                background: expandedTokenIds.size > 0 ? 'rgba(245, 158, 11, 0.15)' : '#131620',
                border: expandedTokenIds.size > 0 ? '1px solid #f59e0b' : '1px solid #282f3f',
                color: expandedTokenIds.size > 0 ? '#fbbf24' : '#94a3b8',
                fontWeight: 600
              }}
              title={expandedTokenIds.size > 0 ? "Plegar todas las fichas de personajes" : "Desplegar todas las fichas de personajes"}
            >
              <span>{expandedTokenIds.size > 0 ? 'Plegar fichas' : 'Desplegar fichas'}</span>
              <span style={{ fontSize: '8px' }}>{expandedTokenIds.size > 0 ? '▲' : '▼'}</span>
            </button>
          </div>
        )}
        
        {/* Lista de Fichas Desplegables con Soporte Drag & Drop */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {tokens.map((token, idx) => {
            const isExpanded = expandedTokenIds.has(token.id);
            const isCurrentTurn = isCombatActive && token.id === activeTurnTokenId;
            const isDragOver = dragOverTokenIndex === idx && draggedTokenIndex !== idx;

            const hp = token.hp ?? 20;
            const maxHp = Math.max(1, token.maxHp ?? 20);
            const mp = token.mp ?? 10;
            const maxMp = Math.max(1, token.maxMp ?? 10);
            const san = token.san ?? 60;
            const maxSan = Math.max(1, token.maxSan ?? 60);

            const hpPct = Math.min(100, Math.max(0, (hp / maxHp) * 100));
            const mpPct = Math.min(100, Math.max(0, (mp / maxMp) * 100));
            const sanPct = Math.min(100, Math.max(0, (san / maxSan) * 100));

            const baseSpeed = Math.max(1, Number(token.speed) || 6);
            const maxSpeed = token.isGraveWound ? Math.max(1, Math.floor(baseSpeed / 2)) : baseSpeed;
            const usedSpeed = Math.max(0, Number(token.turnMovementUsed) || 0);
            const remainingSpeed = Math.max(0, maxSpeed - usedSpeed);
            const speedPct = Math.min(100, Math.max(0, (remainingSpeed / maxSpeed) * 100));

            return (
              <div 
                key={token.id}
                draggable={dragHandleActiveTokenId === token.id}
                onDragStart={(e) => {
                  if (dragHandleActiveTokenId !== token.id) {
                    e.preventDefault();
                    return;
                  }
                  setDraggedTokenIndex(idx);
                  e.dataTransfer.setData('text/plain', String(idx));
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverTokenIndex !== idx) setDragOverTokenIndex(idx);
                }}
                onDragLeave={() => {
                  if (dragOverTokenIndex === idx) setDragOverTokenIndex(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedTokenIndex !== null && draggedTokenIndex !== idx && onReorderTokens) {
                    onReorderTokens(draggedTokenIndex, idx);
                  }
                  setDraggedTokenIndex(null);
                  setDragOverTokenIndex(null);
                  setDragHandleActiveTokenId(null);
                }}
                onDragEnd={() => {
                  setDraggedTokenIndex(null);
                  setDragOverTokenIndex(null);
                  setDragHandleActiveTokenId(null);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flexShrink: 0,
                  background: isCurrentTurn
                    ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.22) 0%, #161a24 100%)'
                    : isExpanded
                    ? '#161b26'
                    : isDragOver
                    ? '#1f2533'
                    : '#131720',
                  borderRadius: '8px',
                  border: isCurrentTurn
                    ? '1px solid #fbbf24'
                    : isExpanded
                    ? '1px solid #f59e0b'
                    : isDragOver
                    ? '2px dashed #f59e0b'
                    : token.isGraveWound
                    ? '1px solid #ef4444'
                    : token.isLocked
                    ? '1px solid #f59e0b'
                    : '1px solid #252c3c',
                  borderLeft: isCurrentTurn
                    ? '4px solid #fbbf24'
                    : isExpanded
                    ? '4px solid #f59e0b'
                    : '4px solid transparent',
                  boxShadow: isCurrentTurn
                    ? '0 0 14px rgba(245, 158, 11, 0.35)'
                    : isExpanded
                    ? '0 4px 14px rgba(0,0,0,0.5)'
                    : '0 2px 5px rgba(0,0,0,0.35)',
                  opacity: draggedTokenIndex === idx ? 0.45 : 1,
                  transition: 'background 0.15s, border 0.15s',
                  overflow: 'hidden'
                }}
              >
                {/* Cabecera Desplegable Limpia, Centrada y Equilibrada */}
                <div
                  onClick={() => toggleTokenExpand(token.id)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (onCenterOnToken) onCenterOnToken(token);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    gap: '8px',
                    background: isExpanded ? 'rgba(20, 25, 36, 0.95)' : 'transparent',
                    borderBottom: isExpanded ? '1px solid #232b3c' : 'none'
                  }}
                  title={isExpanded ? "Haz clic para plegar controles (Doble clic: centrar en el tablero)" : "Haz clic para ver controles completos (Doble clic: centrar en el tablero)"}
                >
                  {/* Izquierda: Asa de arrastre (4 cuadraditos) + Turno */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                    <span
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDragHandleActiveTokenId(token.id);
                      }}
                      onMouseUp={() => setDragHandleActiveTokenId(null)}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        setDragHandleActiveTokenId(token.id);
                      }}
                      onTouchEnd={() => setDragHandleActiveTokenId(null)}
                      style={{
                        color: dragHandleActiveTokenId === token.id ? '#fbbf24' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'grab',
                        userSelect: 'none',
                        padding: '2px',
                        borderRadius: '3px',
                        transition: 'color 0.15s, transform 0.15s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#fbbf24'; }}
                      onMouseLeave={(e) => {
                        if (dragHandleActiveTokenId !== token.id) e.currentTarget.style.color = '#64748b';
                      }}
                      title="Arrastra desde estos 4 puntos para cambiar el orden de los turnos"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor">
                        <rect x="2" y="2" width="3.5" height="3.5" rx="0.8" />
                        <rect x="8.5" y="2" width="3.5" height="3.5" rx="0.8" />
                        <rect x="2" y="8.5" width="3.5" height="3.5" rx="0.8" />
                        <rect x="8.5" y="8.5" width="3.5" height="3.5" rx="0.8" />
                      </svg>
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: isCurrentTurn ? '#0f172a' : '#94a3b8',
                        backgroundColor: isCurrentTurn ? '#fbbf24' : '#1e2433',
                        border: isCurrentTurn ? '1px solid #f59e0b' : '1px solid #2d3748',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        minWidth: '22px',
                        textAlign: 'center',
                        lineHeight: '14px'
                      }}
                      title={`Posición de turno #${idx + 1}`}
                    >
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Centro: Nombre Centrado + Micro-Barra de Salud */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: isCurrentTurn
                            ? '#fbbf24'
                            : token.faction === 'enemy'
                            ? '#f87171'
                            : token.faction === 'player'
                            ? '#34d399'
                            : '#f8fafc',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          textAlign: 'center',
                          fontStyle: token.isHidden ? 'italic' : 'normal',
                          opacity: token.isHidden ? 0.75 : 1,
                          lineHeight: '15px'
                        }}
                        title={`Combatiente: ${token.name}${token.faction === 'enemy' ? ' (Enemigo)' : ''}${token.isHidden ? ' (Oculto a jugadores)' : ''}`}
                      >
                        {token.name}
                      </span>
                      {token.hasArmor && (
                        <span style={{ fontSize: '9px', color: '#94a3b8', background: '#1c2230', padding: '1px 4px', borderRadius: '3px', flexShrink: 0 }} title={`Armadura equipada: ${token.armorType}`}>
                          ARM
                        </span>
                      )}
                      {isCombatActive && isCurrentTurn && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            color: token.isGraveWound ? '#fca5a5' : '#6ee7b7',
                            background: token.isGraveWound ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                            border: `1px solid ${token.isGraveWound ? 'rgba(239, 68, 68, 0.45)' : 'rgba(16, 185, 129, 0.45)'}`,
                            padding: '1px 4px',
                            borderRadius: '4px',
                            flexShrink: 0
                          }}
                          title={`Movimiento restante este turno: ${remainingSpeed} de ${maxSpeed} casillas (${remainingSpeed * 5} ft)`}
                        >
                          {remainingSpeed}/{maxSpeed} c.
                        </span>
                      )}
                    </div>

                    {/* Micro-Barra de Salud Centrada */}
                    <div style={{ width: '100%', maxWidth: '140px', display: 'flex', alignItems: 'center', gap: '6px' }} title={`Salud actual: ${hp} de ${maxHp} PV (${Math.round(hpPct)}%)`}>
                      <div style={{
                        flex: 1,
                        height: '4px',
                        background: '#231215',
                        borderRadius: '999px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        <div style={{
                          width: `${hpPct}%`,
                          height: '100%',
                          background: hp <= 0 ? '#ef4444' : hpPct < 30 ? '#ef4444' : hpPct < 60 ? '#f59e0b' : '#22c55e',
                          transition: 'width 0.25s ease'
                        }} />
                      </div>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: hp <= 0 ? '#ef4444' : hpPct < 30 ? '#fca5a5' : '#94a3b8',
                        flexShrink: 0
                      }}>
                        {hp <= 0 ? 'Caído' : `${hp}/${maxHp} PV`}
                      </span>
                    </div>
                  </div>

                  {/* Derecha: Botón Centrar + Botón Colapsar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    {isCombatActive && !isCurrentTurn && onSelectActiveTurn && (
                      <button
                        type="button"
                        onClick={() => onSelectActiveTurn(token.id)}
                        style={{
                          background: 'rgba(245, 158, 11, 0.12)',
                          border: '1px solid rgba(245, 158, 11, 0.35)',
                          color: '#fbbf24',
                          fontSize: '10px',
                          cursor: 'pointer',
                          padding: '2px 5px',
                          borderRadius: '4px',
                          fontWeight: 600
                        }}
                        title="Asignar el turno activo a este combatiente"
                      >
                        Turno
                      </button>
                    )}
                    {onCenterOnToken && (
                      <button
                        type="button"
                        onClick={() => onCenterOnToken(token)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          fontSize: '13px',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          transition: 'color 0.15s, transform 0.15s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#fbbf24'; e.currentTarget.style.transform = 'scale(1.15)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = 'scale(1)'; }}
                        title="Centrar mapa en este combatiente (o doble clic en la tarjeta)"
                      >
                        ⊙
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleTokenExpand(token.id)}
                      style={{
                        background: isExpanded ? 'rgba(245, 158, 11, 0.2)' : '#191f2c',
                        border: isExpanded ? '1px solid #f59e0b' : '1px solid #2a3449',
                        color: isExpanded ? '#fbbf24' : '#94a3b8',
                        fontSize: '10px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        padding: '2px 0',
                        width: '24px',
                        height: '22px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}
                      title={isExpanded ? "Plegar tarjeta" : "Desplegar controles detallados"}
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Contenido Completo Desplegado Bien Organizado */}
                {isExpanded && (
                  <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '9px', background: 'rgba(14, 18, 26, 0.8)' }}>
                    {/* A. Barra de Acciones Equilibrada de Extremo a Extremo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingBottom: '8px', borderBottom: '1px solid #1f2738' }}>
                      {isCombatActive && !isCurrentTurn && onSelectActiveTurn && (
                        <button
                          type="button"
                          onClick={() => onSelectActiveTurn(token.id)}
                          className="vtt-brass-btn"
                          style={{
                            flex: 1,
                            padding: '4px 0',
                            borderRadius: '4px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            borderColor: '#f59e0b',
                            color: '#fbbf24',
                            textAlign: 'center'
                          }}
                          title="Asignar el turno activo a este combatiente"
                        >
                          Turno
                        </button>
                      )}
                      {onOpenTokenSheet && (
                        <button
                          type="button"
                          onClick={() => onOpenTokenSheet(token.id, 'stats')}
                          className="vtt-brass-btn"
                          style={{
                            flex: 1,
                            padding: '4px 0',
                            borderRadius: '4px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            borderColor: '#3b82f6',
                            color: '#60a5fa',
                            textAlign: 'center'
                          }}
                          title="Abrir hoja de personaje completa (atributos, equipo, notas)"
                        >
                          Ficha
                        </button>
                      )}
                      {onCenterOnToken && (
                        <button
                          type="button"
                          onClick={() => onCenterOnToken(token)}
                          className="vtt-brass-btn"
                          style={{
                            flex: 1,
                            padding: '4px 0',
                            borderRadius: '4px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                          title="Centrar la cámara del tablero sobre este personaje"
                        >
                          Centrar
                        </button>
                      )}
                      {onMoveTokenOrder && (
                        <div style={{ display: 'flex', flexShrink: 0 }}>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => onMoveTokenOrder(idx, 'up')}
                            className="vtt-brass-btn"
                            style={{
                              padding: '4px 6px',
                              fontSize: '9px',
                              borderRadius: '4px 0 0 4px',
                              cursor: idx === 0 ? 'default' : 'pointer',
                              opacity: idx === 0 ? 0.3 : 1
                            }}
                            title="Subir un puesto en la iniciativa de turnos"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={idx === tokens.length - 1}
                            onClick={() => onMoveTokenOrder(idx, 'down')}
                            className="vtt-brass-btn"
                            style={{
                              padding: '4px 6px',
                              fontSize: '9px',
                              borderRadius: '0 4px 4px 0',
                              cursor: idx === tokens.length - 1 ? 'default' : 'pointer',
                              opacity: idx === tokens.length - 1 ? 0.3 : 1
                            }}
                            title="Bajar un puesto en la iniciativa de turnos"
                          >
                            ▼
                          </button>
                        </div>
                      )}
                      {onSendToGraveyard && (
                        <button 
                          type="button"
                          onClick={() => onSendToGraveyard(token)}
                          style={{
                            width: '28px',
                            backgroundColor: 'rgba(71, 85, 105, 0.35)',
                            border: '1px solid rgba(148, 163, 184, 0.45)',
                            borderRadius: '4px',
                            color: '#cbd5e1', 
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '4px 0',
                            fontWeight: 700,
                            textAlign: 'center',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
                            e.currentTarget.style.borderColor = '#ef4444';
                            e.currentTarget.style.color = '#fca5a5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(71, 85, 105, 0.35)';
                            e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.45)';
                            e.currentTarget.style.color = '#cbd5e1';
                          }}
                          title="Abatir personaje (enviar a la Cripta de caídos)"
                        >
                          💀
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={() => onRemoveToken(token.id)}
                        style={{
                          width: '28px',
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          borderRadius: '4px',
                          color: '#fca5a5', 
                          cursor: 'pointer',
                          fontSize: '10px',
                          padding: '4px 0',
                          fontWeight: 700,
                          textAlign: 'center',
                          flexShrink: 0
                        }}
                        title="Eliminar de la partida (borrar del mapa sin enviar a la cripta)"
                      >
                        ✕
                      </button>
                    </div>

                    {/* B. Bloque de Estadísticas Vitales con Textos Centrados Dentro de las Barras */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      background: '#10141d',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #1f2738'
                    }}>
                      {/* Barra de PV */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '30px', fontSize: '10px', fontWeight: 800, color: '#f87171', textAlign: 'center', flexShrink: 0 }}>
                          PV
                        </span>
                        <div style={{
                          position: 'relative',
                          flex: 1,
                          height: '16px',
                          background: '#221113',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: '1px solid rgba(239, 68, 68, 0.25)'
                        }} title={`Puntos de Vida: ${hp}/${maxHp} (${Math.round(hpPct)}%)`}>
                          <div style={{
                            width: `${hpPct}%`,
                            height: '100%',
                            background: '#ef4444',
                            transition: 'width 0.2s ease'
                          }} />
                          <span style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#ffffff',
                            textShadow: '0 1px 3px rgba(0,0,0,0.95)',
                            letterSpacing: '0.02em',
                            userSelect: 'none'
                          }}>
                            {hp} / {maxHp}
                          </span>
                        </div>
                        {onUpdateTokenStats && (
                          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => onUpdateTokenStats(token.id, { hp: Math.max(0, hp - 1) })}
                              style={{ width: '20px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#161b26', border: '1px solid #2b3548', color: '#cbd5e1', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                              title="Restar 1 Punto de Vida (PV)"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateTokenStats(token.id, { hp: Math.min(maxHp, hp + 1) })}
                              style={{ width: '20px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#161b26', border: '1px solid #2b3548', color: '#cbd5e1', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                              title="Sumar 1 Punto de Vida (PV)"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Barra de MP */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '30px', fontSize: '10px', fontWeight: 800, color: '#60a5fa', textAlign: 'center', flexShrink: 0 }}>
                          MP
                        </span>
                        <div style={{
                          position: 'relative',
                          flex: 1,
                          height: '16px',
                          background: '#0d1629',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: '1px solid rgba(59, 130, 246, 0.25)'
                        }} title={`Puntos de Magia: ${mp}/${maxMp} (${Math.round(mpPct)}%)`}>
                          <div style={{
                            width: `${mpPct}%`,
                            height: '100%',
                            background: '#3b82f6',
                            transition: 'width 0.2s ease'
                          }} />
                          <span style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#ffffff',
                            textShadow: '0 1px 3px rgba(0,0,0,0.95)',
                            letterSpacing: '0.02em',
                            userSelect: 'none'
                          }}>
                            {mp} / {maxMp}
                          </span>
                        </div>
                        {onUpdateTokenStats && (
                          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => onUpdateTokenStats(token.id, { mp: Math.max(0, mp - 1) })}
                              style={{ width: '20px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#161b26', border: '1px solid #2b3548', color: '#cbd5e1', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                              title="Restar 1 Punto de Magia (MP)"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateTokenStats(token.id, { mp: Math.min(maxMp, mp + 1) })}
                              style={{ width: '20px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#161b26', border: '1px solid #2b3548', color: '#cbd5e1', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                              title="Sumar 1 Punto de Magia (MP)"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Barra de SAN */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '30px', fontSize: '10px', fontWeight: 800, color: '#facc15', textAlign: 'center', flexShrink: 0 }}>
                          SAN
                        </span>
                        <div style={{
                          position: 'relative',
                          flex: 1,
                          height: '16px',
                          background: '#241f0b',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          border: '1px solid rgba(234, 179, 8, 0.25)'
                        }} title={`Cordura: ${san}/${maxSan} (${Math.round(sanPct)}%)`}>
                          <div style={{
                            width: `${sanPct}%`,
                            height: '100%',
                            background: '#eab308',
                            transition: 'width 0.2s ease'
                          }} />
                          <span style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#ffffff',
                            textShadow: '0 1px 3px rgba(0,0,0,0.95)',
                            letterSpacing: '0.02em',
                            userSelect: 'none'
                          }}>
                            {san} / {maxSan}
                          </span>
                        </div>
                        {onUpdateTokenStats && (
                          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => onUpdateTokenStats(token.id, { san: Math.max(0, san - 1) })}
                              style={{ width: '20px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#161b26', border: '1px solid #2b3548', color: '#cbd5e1', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                              title="Restar 1 Punto de Cordura (SAN)"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateTokenStats(token.id, { san: Math.min(maxSan, san + 1) })}
                              style={{ width: '20px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#161b26', border: '1px solid #2b3548', color: '#cbd5e1', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                              title="Sumar 1 Punto de Cordura (SAN)"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* C. Presupuesto de Movimiento */}
                    <div style={{
                      backgroundColor: '#10141d',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      border: isCurrentTurn ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid #1f2738',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }} title="Presupuesto de movimiento táctico por turno (5 ft por casilla)">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: token.isGraveWound ? '#f87171' : '#34d399' }}>
                          {token.isGraveWound ? 'Movimiento (Herida Grave)' : 'Movimiento por Turno'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: remainingSpeed === 0 ? '#ef4444' : '#e2e8f0' }} title="Casillas restantes en este turno y distancia en pies">
                            {remainingSpeed} / {maxSpeed} c. ({remainingSpeed * 5} ft)
                          </span>
                          {onResetTokenMovement && (
                            <button
                              type="button"
                              onClick={() => onResetTokenMovement(token.id)}
                              style={{
                                background: 'rgba(148, 163, 184, 0.15)',
                                border: '1px solid rgba(148, 163, 184, 0.3)',
                                color: '#cbd5e1',
                                borderRadius: '4px',
                                padding: '1px 6px',
                                cursor: 'pointer',
                                fontSize: '10px',
                                fontWeight: 600
                              }}
                              title="Restablecer el movimiento completo del personaje a su máximo en este turno"
                            >
                              ↺ Reset
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: '#1c2230', borderRadius: '999px', overflow: 'hidden' }} title={`Movimiento restante: ${Math.round(speedPct)}%`}>
                        <div style={{
                          width: `${speedPct}%`,
                          height: '100%',
                          background: token.isGraveWound ? '#ef4444' : speedPct < 30 ? '#ef4444' : speedPct < 60 ? '#f59e0b' : '#10b981',
                          transition: 'width 0.2s ease'
                        }} />
                      </div>
                      {token.isGraveWound && (
                        <span style={{ fontSize: '9px', color: '#fca5a5', fontStyle: 'italic', textAlign: 'center' }}>
                          Reducido a la mitad por Herida Grave (velocidad base: {baseSpeed} c.)
                        </span>
                      )}
                    </div>

                    {/* D. Acceso Directo al Inventario (sin listar ítems) */}
                    <div
                      onClick={() => onOpenTokenSheet && onOpenTokenSheet(token.id, 'inventory')}
                      style={{
                        backgroundColor: '#10141d',
                        borderRadius: '8px',
                        padding: '7px 10px',
                        border: '1px solid #1f2738',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: onOpenTokenSheet ? 'pointer' : 'default',
                        transition: 'border-color 0.15s, background-color 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        if (onOpenTokenSheet) {
                          e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.45)';
                          e.currentTarget.style.backgroundColor = '#141824';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#1f2738';
                        e.currentTarget.style.backgroundColor = '#10141d';
                      }}
                      title="Abrir la ficha del personaje en la pestaña de inventario"
                    >
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24' }}>
                        Inventario ({token.inventory?.length || 0})
                      </span>
                      {onOpenTokenSheet && (
                        <span style={{ color: '#60a5fa', fontSize: '10px', fontWeight: 600 }}>
                          Ver en Ficha →
                        </span>
                      )}
                    </div>

                    {/* E. Configuración de Visión y Tamaño del Token */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#10131a', padding: '8px 10px', borderRadius: '8px', border: '1px solid #1e2433' }}>
                      {/* Tipo de Visión */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                            Tipo de Visión
                          </span>
                          <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 600 }}>
                            {token.visionMode === 'cone' ? 'Cono 90º' : '360º'}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => onUpdateTokenVisionMode && onUpdateTokenVisionMode(token.id, 'cone')}
                            style={{
                              backgroundColor: token.visionMode === 'cone' ? '#2a1a08' : '#141824',
                              background: token.visionMode === 'cone'
                                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.32) 0%, rgba(180, 83, 9, 0.45) 100%)'
                                : '#141824',
                              border: token.visionMode === 'cone' ? '1.5px solid #f59e0b' : '1px solid #232836',
                              borderRadius: '6px',
                              color: token.visionMode === 'cone' ? '#fbbf24' : '#94a3b8',
                              cursor: 'pointer',
                              fontSize: '11px',
                              padding: '5px 4px',
                              fontWeight: 700,
                              textAlign: 'center',
                              boxShadow: token.visionMode === 'cone' ? '0 2px 8px rgba(245, 158, 11, 0.25)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            Cono 90º
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateTokenVisionMode && onUpdateTokenVisionMode(token.id, 'circle')}
                            style={{
                              backgroundColor: token.visionMode !== 'cone' ? '#2a1a08' : '#141824',
                              background: token.visionMode !== 'cone'
                                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.32) 0%, rgba(180, 83, 9, 0.45) 100%)'
                                : '#141824',
                              border: token.visionMode !== 'cone' ? '1.5px solid #f59e0b' : '1px solid #232836',
                              borderRadius: '6px',
                              color: token.visionMode !== 'cone' ? '#fbbf24' : '#94a3b8',
                              cursor: 'pointer',
                              fontSize: '11px',
                              padding: '5px 4px',
                              fontWeight: 700,
                              textAlign: 'center',
                              boxShadow: token.visionMode !== 'cone' ? '0 2px 8px rgba(245, 158, 11, 0.25)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            Visión 360º
                          </button>
                        </div>
                      </div>

                      {/* Escala / Tamaño del Token */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid #1a202c', paddingTop: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                            Tamaño de Ficha
                          </span>
                          <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700 }}>
                            {token.size || 50}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="250"
                          value={token.size || 50}
                          draggable={false}
                          onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            if (onUpdateTokenSize) onUpdateTokenSize(token.id, Number(e.target.value));
                          }}
                          style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {tokens.length === 0 && (
          <div style={{
            textAlign: 'center', color: '#64748b', fontSize: '12px', marginTop: '16px',
            padding: '28px 14px', backgroundColor: '#11141b', borderRadius: '10px', border: '1px dashed #262b38'
          }}>
            <div style={{ fontSize: '20px', marginBottom: '8px', color: '#3b4255' }}>—</div>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>Mesa Despejada</div>
            <div style={{ fontSize: '11px', marginBottom: '14px', lineHeight: 1.4 }}>
              No hay personajes ni criaturas en juego.
            </div>
            <button
              type="button"
              onClick={() => setActiveMainTab('library')}
              className="vtt-brass-btn"
              style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', color: '#fbbf24', borderColor: '#f59e0b' }}
            >
              Abrir Elementos →
            </button>
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default TokenSidebar;
