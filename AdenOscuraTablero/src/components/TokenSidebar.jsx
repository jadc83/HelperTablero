import React, { useState } from 'react';
import { OBJECT_PRESETS, LIGHT_PRESETS } from './MapCreator';

const SectionAccordionHeader = ({ icon, title, count, isExpanded, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '9px 12px',
      backgroundColor: isExpanded ? '#1e2330' : '#151922',
      border: isExpanded ? '1px solid #3b4358' : '1px solid #262b38',
      borderRadius: '8px',
      cursor: 'pointer',
      color: isExpanded ? '#f8fafc' : '#cbd5e1',
      transition: 'all 0.15s ease',
      marginBottom: isExpanded ? '8px' : '6px'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '14px' }}>{icon}</span>
      <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.02em' }}>{title}</span>
      {typeof count === 'number' && (
        <span
          className="vtt-retro-badge"
          style={{
            fontSize: '10px',
            padding: '1px 6px',
            borderRadius: '999px',
            backgroundColor: isExpanded ? 'rgba(245, 158, 11, 0.2)' : '#232834',
            color: isExpanded ? '#fbbf24' : '#94a3b8',
            border: isExpanded ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
            fontWeight: 700
          }}
        >
          {count}
        </span>
      )}
    </div>
    <span style={{
      fontSize: '10px',
      color: isExpanded ? '#fbbf24' : '#64748b',
      transition: 'transform 0.2s',
      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
    }}>
      ▶
    </span>
  </button>
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
  onRollAllInitiatives,
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
  const [isLightsExpanded, setIsLightsExpanded] = useState(false);
  const [isStructuresExpanded, setIsStructuresExpanded] = useState(false);

  // Estados de acordeón y Drag & Drop para los personajes en escena (turnos de combate)
  const [expandedTokenIds, setExpandedTokenIds] = useState(new Set());
  const [draggedTokenIndex, setDraggedTokenIndex] = useState(null);
  const [dragOverTokenIndex, setDragOverTokenIndex] = useState(null);

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
        display: 'flex',
        borderBottom: '1px solid #262c38',
        backgroundColor: '#0c0e15',
        flexShrink: 0
      }}>
        <button
          type="button"
          onClick={() => setActiveMainTab('scene')}
          style={{
            flex: 1,
            padding: '11px 6px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            borderBottom: activeMainTab === 'scene' ? '2px solid #f59e0b' : '2px solid transparent',
            backgroundColor: activeMainTab === 'scene' ? '#141822' : 'transparent',
            color: activeMainTab === 'scene' ? '#f8fafc' : '#94a3b8',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>⚔️</span> En Escena
          <span
            className="vtt-retro-badge"
            style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '999px',
              backgroundColor: activeMainTab === 'scene' ? 'rgba(245, 158, 11, 0.2)' : '#1e2330',
              color: activeMainTab === 'scene' ? '#fbbf24' : '#94a3b8'
            }}
          >
            {tokens.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('library')}
          style={{
            flex: 1,
            padding: '11px 6px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            borderBottom: activeMainTab === 'library' ? '2px solid #f59e0b' : '2px solid transparent',
            backgroundColor: activeMainTab === 'library' ? '#141822' : 'transparent',
            color: activeMainTab === 'library' ? '#f8fafc' : '#94a3b8',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>📚</span> Invocación
        </button>
      </div>

      {/* PESTAÑA: BIBLIOTECA E INVOCACIÓN */}
      {activeMainTab === 'library' && (
        <div style={{ 
          padding: '12px', 
          flex: 1, 
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
                marginBottom: '12px'
              }}
              title="Abrir el Creador y Editor de Mapas"
            >
              🗺️ Editor de Mapas y Muros
            </button>
          )}

          {/* 1. ARCHIVO DE PERSONAJES */}
          <SectionAccordionHeader
            icon="🕵️"
          title="Personajes"
          count={humanCharacters.length}
          isExpanded={isCharactersExpanded}
          onClick={() => setIsCharactersExpanded(!isCharactersExpanded)}
        />

        {isCharactersExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', paddingLeft: '4px' }}>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '4px' }}>
              {onOpenEncyclopedia && (
                <button
                  type="button"
                  onClick={() => onOpenEncyclopedia('character')}
                  className="vtt-brass-btn"
                  style={{ flex: 1, padding: '6px 8px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', borderColor: '#f59e0b', color: '#fbbf24' }}
                >
                  📖 Enciclopedia
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
                        <span>🛡️</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {char.isGraveWound ? '🩸 ' : ''}{char.name}
                      </span>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {char.hasArmor ? `🛡️ ${char.armorType}` : 'Investigador / Humano'}
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
          </div>
        )}

        {/* 1B. BESTIARIO, MONSTRUOS Y MITOS */}
        <SectionAccordionHeader
          icon="🦑"
          title="Bestiario y Mitos"
          count={monsterCharacters.length}
          isExpanded={isMonstersExpanded}
          onClick={() => setIsMonstersExpanded(!isMonstersExpanded)}
        />

        {isMonstersExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', paddingLeft: '4px' }}>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '4px' }}>
              {onOpenEncyclopedia && (
                <button
                  type="button"
                  onClick={() => onOpenEncyclopedia('monster')}
                  className="vtt-brass-btn"
                  style={{ flex: 1, padding: '6px 8px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', borderColor: '#8b5cf6', color: '#c4b5fd' }}
                >
                  👁️ Bestiario
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
                        <span>💀</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#fca5a5', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {char.isGraveWound ? '🩸 ' : ''}{char.name}
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
          </div>
        )}

        {/* 2. DECORADO & MOBILIARIO DEL TABLERO */}
        <SectionAccordionHeader
          icon="🪑"
          title="Decorado & Mobiliario"
          count={OBJECT_PRESETS.length + (customObjects?.length || 0)}
          isExpanded={isObjectsExpanded}
          onClick={() => setIsObjectsExpanded(!isObjectsExpanded)}
        />

        {isObjectsExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px', paddingLeft: '4px' }}>
            {/* Decorado Personalizado del Catálogo */}
            {customObjects && customObjects.length > 0 && (
              <div style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>
                  ⭐ Catálogo de Decorado ({customObjects.length})
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
          </div>
        )}

        {/* 3. OBJETOS DE INVENTARIO Y LOOT COMÚN */}
        <SectionAccordionHeader
          icon="🎒"
          title="Objetos de Inventario (Loot)"
          count={commonItems.length}
          isExpanded={isItemsExpanded}
          onClick={() => setIsItemsExpanded(!isItemsExpanded)}
        />

        {isItemsExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px', paddingLeft: '4px' }}>
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
                  <span>{activeTurnToken ? '🎯' : 'ℹ️'}</span>
                  <span style={{ fontWeight: 600 }}>
                    {activeTurnToken ? `Entregando al turno activo: ${activeTurnToken.name}` : 'Entrega directa a personajes'}
                  </span>
                </div>
              );
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '220px', overflowY: 'auto' }}>
              {commonItems.map(item => (
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
                    <span style={{ fontSize: '15px', flexShrink: 0 }}>{item.icon || '📦'}</span>
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
                        📍 Suelo
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
                      🎁 Dar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. FUENTES DE LUZ */}
        <SectionAccordionHeader
          icon="🔥"
          title="Fuentes de Luz"
          count={LIGHT_PRESETS.length}
          isExpanded={isLightsExpanded}
          onClick={() => setIsLightsExpanded(!isLightsExpanded)}
        />

        {isLightsExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px', paddingLeft: '4px' }}>
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
          </div>
        )}

        {/* 4. ESTRUCTURAS */}
        <SectionAccordionHeader
          icon="🚪"
          title="Puertas y Ventanas"
          count={2}
          isExpanded={isStructuresExpanded}
          onClick={() => setIsStructuresExpanded(!isStructuresExpanded)}
        />

        {isStructuresExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '4px', paddingLeft: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#191d27', padding: '6px 10px', borderRadius: '7px', border: '1px solid #2c3344' }}>
              <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 500 }}>🚪 Puerta de Madera</span>
              <button 
                type="button"
                onClick={() => onAddMapElement && onAddMapElement({ id: Date.now() + Math.random(), type: 'door', name: 'Puerta', width: 60, height: 16, isOpen: false })}
                className="vtt-brass-btn" style={{ padding: '4px 9px', fontSize: '11px', borderRadius: '5px', fontWeight: 600, cursor: 'pointer' }}
              >+ Colocar</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#191d27', padding: '6px 10px', borderRadius: '7px', border: '1px solid #2c3344' }}>
              <span style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 500 }}>🪟 Ventana Acristalada</span>
              <button 
                type="button"
                onClick={() => onAddMapElement && onAddMapElement({ id: Date.now() + Math.random(), type: 'window', name: 'Ventana', width: 60, height: 14, isOpen: false, isBroken: false })}
                className="vtt-brass-btn" style={{ padding: '4px 9px', fontSize: '11px', borderRadius: '5px', fontWeight: 600, cursor: 'pointer' }}
              >+ Colocar</button>
            </div>
          </div>
        )}
        </div>
      )}

      {/* PESTAÑA: EN ESCENA Y GESTIÓN DE COMBATE */}
      {activeMainTab === 'scene' && (
        <div style={{ padding: '12px 10px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* Cabecera de En Escena con botón Plegar/Abrir Todos */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="vtt-gothic-title" style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 'bold' }}>
              ⚔️ En Escena
            </span>
            <span
              className="vtt-retro-badge"
              style={{
                fontSize: '10px',
                backgroundColor: '#1e2330',
                color: '#cbd5e1',
                padding: '1px 6px',
                borderRadius: '999px',
                border: '1px solid #32394a',
                fontWeight: 700
              }}
            >
              {tokens.length}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {onOpenGraveyard && (
              <button
                type="button"
                onClick={onOpenGraveyard}
                className="vtt-brass-btn"
                style={{ padding: '2px 6px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer', color: '#cbd5e1' }}
                title="Abrir Cripta y Cementerio de Caídos"
              >
                🪦 {graveyard?.length ? `(${graveyard.length})` : 'Cripta'}
              </button>
            )}
            {tokens.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="vtt-brass-btn"
                  style={{ padding: '2px 6px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer' }}
                  title="Plegar todas las fichas para ahorrar espacio"
                >
                  Plegar
                </button>
                <button
                  type="button"
                  onClick={expandAll}
                  className="vtt-brass-btn"
                  style={{ padding: '2px 6px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer' }}
                  title="Desplegar todas las fichas"
                >
                  Abrir
                </button>
              </>
            )}
          </div>
        </div>

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
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: isCombatActive ? '#fbbf24' : '#94a3b8', fontWeight: 600 }}>
                  {isCombatActive ? `⚔️ Ronda ${combatRound}` : '↕️ Orden de Turnos'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                {onRollAllInitiatives && (
                  <button
                    type="button"
                    onClick={onRollAllInitiatives}
                    className="vtt-brass-btn"
                    style={{ padding: '3px 7px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer', borderColor: '#f59e0b', color: '#fbbf24' }}
                    title="Tirar iniciativa 1d20 para todos y ordenar de arriba a abajo"
                  >
                    🎲 Iniciativa
                  </button>
                )}

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
                        {movementLimitsEnabled ? '🚶 Límites: ON' : '🔓 Límites: OFF'}
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
                💡 En combate solo se mueve el turno activo. <strong style={{ color: '#fbbf24' }}>Ctrl + Arrastre</strong> para mover libre.
              </span>
            ) : (
              <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px' }}>
                💡 Pulsa <strong style={{ color: '#fbbf24' }}>▶ Iniciar</strong> para comenzar el combate y activar el límite de movimiento por turno.
              </span>
            )}
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
                draggable={true}
                onDragStart={(e) => {
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
                }}
                onDragEnd={() => {
                  setDraggedTokenIndex(null);
                  setDragOverTokenIndex(null);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: isCurrentTurn
                    ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.18) 0%, #151922 100%)'
                    : isDragOver
                    ? '#1f2533'
                    : '#151922',
                  borderRadius: '8px',
                  border: isCurrentTurn
                    ? '1px solid #fbbf24'
                    : isDragOver
                    ? '2px dashed #f59e0b'
                    : token.isGraveWound
                    ? '1px solid #ef4444'
                    : token.isLocked
                    ? '1px solid #f59e0b'
                    : '1px solid #282f3f',
                  boxShadow: isCurrentTurn
                    ? '0 0 12px rgba(245, 158, 11, 0.35)'
                    : '0 2px 5px rgba(0,0,0,0.4)',
                  opacity: draggedTokenIndex === idx ? 0.45 : 1,
                  transition: 'background 0.15s, border 0.15s',
                  overflow: 'hidden'
                }}
              >
                {/* Cabecera Desplegable Limpia, Espaciosa y sin Cortes */}
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
                    gap: '9px',
                    background: isExpanded ? '#181d28' : 'transparent',
                    borderBottom: isExpanded ? '1px solid #282f3f' : 'none'
                  }}
                  title={isExpanded ? "Haz clic para plegar controles" : "Haz clic para ver controles (Doble clic: centrar en el tablero)"}
                >
                  {/* Asa de arrastre */}
                  <span
                    style={{ color: '#475569', fontSize: '13px', cursor: 'grab', userSelect: 'none', flexShrink: 0, padding: '0 2px' }}
                    title="Arrastra para reordenar el orden de turno"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ⠿
                  </span>

                  {/* Número de Turno */}
                  <span
                    style={{
                      fontSize: '11px',
                      color: isCurrentTurn ? '#0f172a' : '#94a3b8',
                      backgroundColor: isCurrentTurn ? '#fbbf24' : '#1e2433',
                      border: isCurrentTurn ? '1px solid #f59e0b' : '1px solid #2d3748',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      flexShrink: 0,
                      lineHeight: '14px'
                    }}
                    title={`Turno #${idx + 1}`}
                  >
                    #{idx + 1}
                  </span>

                  {/* Avatar con borde de Facción */}
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: token.color || '#3b82f6',
                    border: token.faction === 'enemy' ? '2px solid #ef4444' : '2px solid #3b82f6',
                    boxShadow: isCurrentTurn ? '0 0 8px rgba(245, 158, 11, 0.45)' : 'none',
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                  }}>
                    {token.avatar ? (
                      <img src={token.avatar} alt={token.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span>{token.faction === 'enemy' ? '💀' : '🛡️'}</span>
                    )}
                  </div>

                  {/* Bloque Central: Nombre Completo + Micro-Barra de Salud */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: isCurrentTurn ? '#fbbf24' : '#f8fafc',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          flex: 1
                        }}
                        title={token.name}
                      >
                        {token.isHidden ? '👻 ' : ''}{token.isGraveWound ? '🩸 ' : ''}{token.name}
                      </span>
                      {token.hasArmor && (
                        <span style={{ fontSize: '9px', color: '#94a3b8', background: '#1c2230', padding: '1px 4px', borderRadius: '3px', flexShrink: 0 }} title={`Armadura: ${token.armorType}`}>
                          🛡️
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
                            padding: '1px 5px',
                            borderRadius: '4px',
                            flexShrink: 0
                          }}
                          title={`Movimiento restante este turno: ${remainingSpeed} de ${maxSpeed} casillas (${remainingSpeed * 5} ft)`}
                        >
                          {token.isGraveWound ? '🩸' : '🏃'} {remainingSpeed}/{maxSpeed} c.
                        </span>
                      )}
                    </div>

                    {/* Micro-Barra de Salud y Valores numéricos */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                        {hp <= 0 ? '💀 Caído' : `${hp}/${maxHp} PV`}
                      </span>
                    </div>
                  </div>

                  {/* Acciones Rápidas a la Derecha */}
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
                        ⚔️ Turno
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
                        title="Centrar mapa en este combatiente (o doble clic)"
                      >
                        🎯
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleTokenExpand(token.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isExpanded ? '#fbbf24' : '#64748b',
                        fontSize: '11px',
                        cursor: 'pointer',
                        padding: '2px 3px',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.18s ease, color 0.15s'
                      }}
                      title={isExpanded ? "Plegar tarjeta" : "Desplegar controles completos"}
                    >
                      ▶
                    </button>
                  </div>
                </div>

                {/* Contenido Completo Desplegado */}
                {isExpanded && (
                  <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '9px', background: 'rgba(15, 18, 25, 0.65)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                        {token.hasArmor ? `🛡️ Armadura ${token.armorType}` : (token.faction === 'enemy' ? '💀 Combatiente Hostil' : '🛡️ Aliado')}
                      </span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {isCombatActive && !isCurrentTurn && onSelectActiveTurn && (
                          <button
                            type="button"
                            onClick={() => onSelectActiveTurn(token.id)}
                            className="vtt-brass-btn"
                            style={{
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              cursor: 'pointer',
                              borderColor: '#f59e0b',
                              color: '#fbbf24'
                            }}
                            title="Asignar el turno activo a este combatiente"
                          >
                            ⚔️ Dar Turno
                          </button>
                        )}
                        {onOpenTokenSheet && (
                          <button
                            type="button"
                            onClick={() => onOpenTokenSheet(token.id)}
                            className="vtt-brass-btn"
                            style={{
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              cursor: 'pointer',
                              borderColor: '#3b82f6',
                              color: '#60a5fa'
                            }}
                            title="Abrir hoja de personaje completa"
                          >
                            📋 Ficha
                          </button>
                        )}
                        {onCenterOnToken && (
                          <button
                            type="button"
                            onClick={() => onCenterOnToken(token)}
                            className="vtt-brass-btn"
                            style={{
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                            title="Centrar tablero en este personaje"
                          >
                            🎯 Centrar
                          </button>
                        )}
                        {onMoveTokenOrder && (
                          <div style={{ display: 'flex', gap: '2px' }}>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => onMoveTokenOrder(idx, 'up')}
                              className="vtt-brass-btn"
                              style={{
                                padding: '2px 5px',
                                fontSize: '9px',
                                borderRadius: '4px',
                                cursor: idx === 0 ? 'default' : 'pointer',
                                opacity: idx === 0 ? 0.3 : 1
                              }}
                              title="Subir turno"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              disabled={idx === tokens.length - 1}
                              onClick={() => onMoveTokenOrder(idx, 'down')}
                              className="vtt-brass-btn"
                              style={{
                                padding: '2px 5px',
                                fontSize: '9px',
                                borderRadius: '4px',
                                cursor: idx === tokens.length - 1 ? 'default' : 'pointer',
                                opacity: idx === tokens.length - 1 ? 0.3 : 1
                              }}
                              title="Bajar turno"
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
                              backgroundColor: 'rgba(71, 85, 105, 0.35)',
                              border: '1px solid rgba(148, 163, 184, 0.45)',
                              borderRadius: '4px',
                              color: '#e2e8f0', 
                              cursor: 'pointer',
                              fontSize: '10px',
                              padding: '2px 6px',
                              fontWeight: 700
                            }}
                            title="Enviar a la Cripta / Cementerio"
                          >
                            🪦
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={() => onRemoveToken(token.id)}
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '4px',
                            color: '#fca5a5', 
                            cursor: 'pointer',
                            fontSize: '10px',
                            padding: '2px 6px',
                            fontWeight: 700
                          }}
                          title="Retirar ficha de la mesa"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Barras completas de Salud, Magia y Cordura */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                        <span style={{ width: '48px', color: '#f87171', fontWeight: 700 }}>❤️ {hp}/{maxHp}</span>
                        <div style={{ flex: 1, height: '6px', background: '#2a1215', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${hpPct}%`, height: '100%', background: '#ef4444' }} />
                        </div>
                        {onUpdateTokenStats && (
                          <>
                            <button type="button" onClick={() => onUpdateTokenStats(token.id, { hp: Math.max(0, hp - 1) })} style={{ background: '#12151c', border: '1px solid #2e3444', color: '#cbd5e1', borderRadius: '3px', padding: '0 5px', cursor: 'pointer', fontSize: '10px' }}>-</button>
                            <button type="button" onClick={() => onUpdateTokenStats(token.id, { hp: Math.min(maxHp, hp + 1) })} style={{ background: '#12151c', border: '1px solid #2e3444', color: '#cbd5e1', borderRadius: '3px', padding: '0 5px', cursor: 'pointer', fontSize: '10px' }}>+</button>
                          </>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                        <span style={{ width: '48px', color: '#60a5fa', fontWeight: 700 }}>💧 {mp}/{maxMp}</span>
                        <div style={{ flex: 1, height: '6px', background: '#111c35', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${mpPct}%`, height: '100%', background: '#3b82f6' }} />
                        </div>
                        {onUpdateTokenStats && (
                          <>
                            <button type="button" onClick={() => onUpdateTokenStats(token.id, { mp: Math.max(0, mp - 1) })} style={{ background: '#12151c', border: '1px solid #2e3444', color: '#cbd5e1', borderRadius: '3px', padding: '0 5px', cursor: 'pointer', fontSize: '10px' }}>-</button>
                            <button type="button" onClick={() => onUpdateTokenStats(token.id, { mp: Math.min(maxMp, mp + 1) })} style={{ background: '#12151c', border: '1px solid #2e3444', color: '#cbd5e1', borderRadius: '3px', padding: '0 5px', cursor: 'pointer', fontSize: '10px' }}>+</button>
                          </>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                        <span style={{ width: '48px', color: '#facc15', fontWeight: 700 }}>👁️ {san}/{maxSan}</span>
                        <div style={{ flex: 1, height: '6px', background: '#2e260d', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${sanPct}%`, height: '100%', background: '#eab308' }} />
                        </div>
                        {onUpdateTokenStats && (
                          <>
                            <button type="button" onClick={() => onUpdateTokenStats(token.id, { san: Math.max(0, san - 1) })} style={{ background: '#12151c', border: '1px solid #2e3444', color: '#cbd5e1', borderRadius: '3px', padding: '0 5px', cursor: 'pointer', fontSize: '10px' }}>-</button>
                            <button type="button" onClick={() => onUpdateTokenStats(token.id, { san: Math.min(maxSan, san + 1) })} style={{ background: '#12151c', border: '1px solid #2e3444', color: '#cbd5e1', borderRadius: '3px', padding: '0 5px', cursor: 'pointer', fontSize: '10px' }}>+</button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Presupuesto de Movimiento */}
                    <div style={{
                      backgroundColor: '#11141c',
                      borderRadius: '7px',
                      padding: '7px 9px',
                      border: isCurrentTurn ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid #232a3a',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: token.isGraveWound ? '#f87171' : '#34d399', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {token.isGraveWound ? '🩸 Movimiento (Herida Grave)' : '🏃 Movimiento por Turno'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: remainingSpeed === 0 ? '#ef4444' : '#e2e8f0' }}>
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
                                padding: '1px 5px',
                                cursor: 'pointer',
                                fontSize: '10px'
                              }}
                              title="Restablecer movimiento al máximo en este turno"
                            >
                              ↺ Reset
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: '#1c2230', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${speedPct}%`,
                          height: '100%',
                          background: token.isGraveWound ? '#ef4444' : speedPct < 30 ? '#ef4444' : speedPct < 60 ? '#f59e0b' : '#10b981',
                          transition: 'width 0.2s ease'
                        }} />
                      </div>
                      {token.isGraveWound && (
                        <span style={{ fontSize: '9px', color: '#fca5a5', fontStyle: 'italic' }}>
                          ⚠️ Reducido a la mitad por Herida Grave (velocidad base: {baseSpeed} c.)
                        </span>
                      )}
                    </div>

                    {/* Inventario del Combatiente */}
                    <div style={{ backgroundColor: '#11141c', borderRadius: '7px', padding: '7px 9px', border: '1px solid #232a3a' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: (token.inventory?.length > 0) ? '6px' : '0' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          🎒 Inventario ({token.inventory?.length || 0})
                        </span>
                        {onOpenTokenSheet && (
                          <button
                            type="button"
                            onClick={() => onOpenTokenSheet(token.id)}
                            style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: '10px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Ver en Ficha ➔
                          </button>
                        )}
                      </div>
                      {token.inventory && token.inventory.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {token.inventory.map(invItem => (
                            <span
                              key={invItem.id}
                              style={{
                                fontSize: '10px',
                                backgroundColor: '#181e2b',
                                border: '1px solid #2c364c',
                                color: '#e2e8f0',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title={invItem.notes ? `${invItem.name}: ${invItem.notes}` : invItem.name}
                            >
                              <span>{invItem.icon || '📦'} {invItem.name}</span>
                              {onDropItemToFloor && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDropItemToFloor(token.id, invItem);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#f87171',
                                    fontSize: '10px',
                                    padding: '0 2px',
                                    fontWeight: 'bold',
                                    lineHeight: 1
                                  }}
                                  title="Tirar al suelo en esta casilla"
                                >
                                  🫳
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>
                          Sin objetos en inventario.
                        </div>
                      )}
                    </div>

                    {/* Botonera de estados rápidos 2x2 amplia y sin cortes */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                      <button
                        type="button"
                        onClick={() => onToggleTokenName && onToggleTokenName(token.id)}
                        style={{
                          backgroundColor: '#12151c',
                          border: token.showName !== false ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid #262b38',
                          borderRadius: '6px',
                          color: token.showName !== false ? '#fbbf24' : '#64748b',
                          cursor: 'pointer',
                          fontSize: '11px',
                          padding: '5px 4px',
                          fontWeight: 600
                        }}
                        title="Mostrar u ocultar nombre en el tablero"
                      >
                        🏷️ {token.showName !== false ? 'Nombre: ON' : 'Nombre: OFF'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleTokenBars && onToggleTokenBars(token.id)}
                        style={{
                          backgroundColor: '#12151c',
                          border: token.showBars ? '1px solid rgba(74, 222, 128, 0.45)' : '1px solid #262b38',
                          borderRadius: '6px',
                          color: token.showBars ? '#4ade80' : '#64748b',
                          cursor: 'pointer',
                          fontSize: '11px',
                          padding: '5px 4px',
                          fontWeight: 600
                        }}
                        title="Mostrar u ocultar barras en el tablero"
                      >
                        📊 {token.showBars ? 'Barras: ON' : 'Barras: OFF'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleTokenFaction && onToggleTokenFaction(token.id)}
                        style={{
                          backgroundColor: '#12151c',
                          border: token.faction === 'enemy' ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid rgba(59, 130, 246, 0.45)',
                          borderRadius: '6px',
                          color: token.faction === 'enemy' ? '#f87171' : '#60a5fa',
                          cursor: 'pointer',
                          fontSize: '11px',
                          padding: '5px 4px',
                          fontWeight: 600
                        }}
                        title="Alternar entre aliado o enemigo"
                      >
                        {token.faction === 'enemy' ? '💀 Enemigo' : '🛡️ Aliado'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleTokenHidden && onToggleTokenHidden(token.id)}
                        style={{
                          backgroundColor: '#12151c',
                          border: token.isHidden ? '1px solid rgba(192, 132, 252, 0.5)' : '1px solid #262b38',
                          borderRadius: '6px',
                          color: token.isHidden ? '#c084fc' : '#cbd5e1',
                          cursor: 'pointer',
                          fontSize: '11px',
                          padding: '5px 4px',
                          fontWeight: 600
                        }}
                        title="Ocultar ficha a los jugadores (sigilo/invisibilidad)"
                      >
                        {token.isHidden ? '👻 Sigilo (Oculto)' : '👁️ Visible'}
                      </button>
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
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚔️</div>
            <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>Mesa Despejada</div>
            <div style={{ fontSize: '11px', marginBottom: '14px', lineHeight: 1.4 }}>
              No hay combatientes en la escena activa.
            </div>
            <button
              type="button"
              onClick={() => setActiveMainTab('library')}
              className="vtt-brass-btn"
              style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', color: '#fbbf24', borderColor: '#f59e0b' }}
            >
              📚 Abrir Invocación ➔
            </button>
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default TokenSidebar;
