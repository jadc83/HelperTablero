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
  onReorderTokens,
  onMoveTokenOrder,
  onCenterOnToken,
  activeTurnTokenId = null,
  combatRound = 1,
  isCombatActive = false,
  onStartCombat,
  onNextTurn,
  onEndCombat,
  onRollAllInitiatives
}) => {
  // Acordeones superiores de compendio
  const [isCharactersExpanded, setIsCharactersExpanded] = useState(true);
  const [isMonstersExpanded, setIsMonstersExpanded] = useState(true);
  const [isObjectsExpanded, setIsObjectsExpanded] = useState(false);
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
      width: '300px',
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
      {/* Cabecera de Biblioteca + Botón Directo al Creador de Mapas */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid #262b38',
        background: '#11141b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px'
      }}>
        {onOpenMapCreator && (
          <button
            type="button"
            onClick={onOpenMapCreator}
            className="vtt-brass-btn"
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              borderColor: '#f59e0b',
              color: '#fbbf24',
              width: '100%',
              justifyContent: 'center'
            }}
            title="Abrir el Creador y Editor de Mapas"
          >
            🗺️ Editor de mapas
          </button>
        )}
      </div>

      {/* Acordeones de Recursos y Compendio */}
      <div style={{ 
        padding: '12px', 
        borderBottom: '1px solid #262b38', 
        maxHeight: '44%', 
        display: 'flex', 
        flexDirection: 'column',
        overflowY: 'auto'
      }}>
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

        {/* 2. OBJETOS INTERACTIVOS */}
        <SectionAccordionHeader
          icon="📦"
          title="Objetos Interactivos"
          count={OBJECT_PRESETS.length}
          isExpanded={isObjectsExpanded}
          onClick={() => setIsObjectsExpanded(!isObjectsExpanded)}
        />

        {isObjectsExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px', paddingLeft: '4px' }}>
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

      {/* SECCIÓN INFERIOR: PERSONAJES DESPLEGADOS EN ESCENA Y GESTIÓN DE TURNOS DE COMBATE */}
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
                    {onNextTurn && (
                      <button
                        type="button"
                        onClick={onNextTurn}
                        className="vtt-primary-cta"
                        style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer' }}
                        title="Pasar al siguiente turno en la lista"
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
            {!isCombatActive && (
              <span style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>
                Arrastra cualquier ficha de la lista para ordenar los turnos.
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
                {/* Cabecera Desplegable Compacta */}
                <div
                  onClick={() => toggleTokenExpand(token.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 9px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    gap: '7px',
                    background: isExpanded ? '#181d28' : 'transparent',
                    borderBottom: isExpanded ? '1px solid #282f3f' : 'none'
                  }}
                  title={isExpanded ? "Haz clic para plegar y ahorrar espacio" : "Haz clic para desplegar controles completos"}
                >
                  {/* Izquierda: Asa de arrastre + Turno + Avatar + Nombre */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', overflow: 'hidden', flex: 1 }}>
                    <span
                      style={{ color: '#64748b', fontSize: '13px', cursor: 'grab', userSelect: 'none', flexShrink: 0 }}
                      title="Arrastra para cambiar el orden de turno"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ⠿
                    </span>

                    <span
                      className="vtt-retro-badge"
                      style={{
                        fontSize: '10px',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: isCurrentTurn ? '#fbbf24' : '#222735',
                        color: isCurrentTurn ? '#0f1115' : '#94a3b8',
                        fontWeight: 800,
                        flexShrink: 0
                      }}
                      title={`Turno #${idx + 1}`}
                    >
                      #{idx + 1}
                    </span>

                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: token.color,
                      border: token.faction === 'enemy' ? '2px solid #ef4444' : '2px solid #3b82f6',
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px'
                    }}>
                      {token.avatar ? (
                        <img src={token.avatar} alt={token.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>{token.faction === 'enemy' ? '💀' : '🛡️'}</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: isCurrentTurn ? '#fffbeb' : '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {token.isHidden ? '👻 ' : ''}{token.isGraveWound ? '🩸 ' : ''}{token.name}
                      </span>
                    </div>
                  </div>

                  {/* Derecha: Píldora de salud compacta + Centrar + Subir/Bajar + Flecha */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                    {/* Al estar plegado, muestra la píldora compacta de salud o de caída */}
                    {!isExpanded && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: hp <= 0 ? '#7f1d1d' : hp <= maxHp * 0.25 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(30, 36, 48, 0.9)',
                            color: hp <= 0 ? '#ffffff' : hp <= maxHp * 0.25 ? '#fca5a5' : '#f87171',
                            border: hp <= 0 ? '1px solid #ef4444' : hp <= maxHp * 0.25 ? '1px solid #ef4444' : '1px solid #333c50'
                          }}
                          title={`Salud: ${hp}/${maxHp}${hp <= 0 ? ' (Combatiente caído)' : ''}`}
                        >
                          {hp <= 0 ? '💀 Caído' : `❤️ ${hp}`}
                        </span>

                        {hp <= 0 && onSendToGraveyard && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSendToGraveyard(token);
                            }}
                            style={{
                              background: '#334155',
                              border: '1px solid #94a3b8',
                              color: '#f8fafc',
                              borderRadius: '4px',
                              padding: '2px 5px',
                              cursor: 'pointer',
                              fontSize: '10px',
                              fontWeight: 700
                            }}
                            title="Enviar combatiente caído a la Cripta / Cementerio"
                          >
                            🪦
                          </button>
                        )}
                      </div>
                    )}

                    {onCenterOnToken && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCenterOnToken(token);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '2px 3px',
                          fontSize: '12px'
                        }}
                        title="Centrar mapa en este personaje"
                      >
                        🎯
                      </button>
                    )}

                    {onMoveTokenOrder && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => onMoveTokenOrder(idx, 'up')}
                          style={{
                            padding: '0 4px',
                            fontSize: '8px',
                            background: '#222735',
                            border: '1px solid #384257',
                            color: '#cbd5e1',
                            borderRadius: '2px',
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
                          style={{
                            padding: '0 4px',
                            fontSize: '8px',
                            background: '#222735',
                            border: '1px solid #384257',
                            color: '#cbd5e1',
                            borderRadius: '2px',
                            cursor: idx === tokens.length - 1 ? 'default' : 'pointer',
                            opacity: idx === tokens.length - 1 ? 0.3 : 1
                          }}
                          title="Bajar turno"
                        >
                          ▼
                        </button>
                      </div>
                    )}

                    <span
                      style={{
                        fontSize: '9px',
                        color: isExpanded ? '#fbbf24' : '#64748b',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.18s ease',
                        marginLeft: '2px'
                      }}
                    >
                      ▶
                    </span>
                  </div>
                </div>

                {/* Contenido Completo Desplegado */}
                {isExpanded && (
                  <div style={{ padding: '9px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {token.hasArmor ? `🛡️ ${token.armorType}` : 'Investigador / Criatura'}
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {onSendToGraveyard && (
                          <button 
                            type="button"
                            onClick={() => onSendToGraveyard(token)}
                            style={{
                              backgroundColor: 'rgba(71, 85, 105, 0.35)',
                              border: '1px solid rgba(148, 163, 184, 0.45)',
                              borderRadius: '6px',
                              color: '#e2e8f0', 
                              cursor: 'pointer',
                              fontSize: '11px',
                              padding: '2px 8px',
                              fontWeight: 700
                            }}
                            title="Enviar a la Cripta / Cementerio (registra la baja y conserva el botín)"
                          >
                            🪦 Cripta
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={() => onRemoveToken(token.id)}
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#fca5a5', 
                            cursor: 'pointer', fontSize: '11px', padding: '2px 7px', fontWeight: 700
                          }}
                          title="Retirar ficha de la mesa sin guardar en la cripta"
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

                    {/* Botonera de estados rápidos */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => onToggleTokenName && onToggleTokenName(token.id)}
                        style={{
                          backgroundColor: '#12151c',
                          border: token.showName !== false ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid #262b38',
                          borderRadius: '5px',
                          color: token.showName !== false ? '#fbbf24' : '#64748b',
                          cursor: 'pointer',
                          fontSize: '10px',
                          padding: '4px 2px',
                          fontWeight: 600
                        }}
                        title="Mostrar u ocultar nombre en el tablero"
                      >
                        🏷️ {token.showName !== false ? 'Nombre' : 'Sin Nom.'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleTokenBars && onToggleTokenBars(token.id)}
                        style={{
                          backgroundColor: '#12151c',
                          border: token.showBars ? '1px solid rgba(74, 222, 128, 0.45)' : '1px solid #262b38',
                          borderRadius: '5px',
                          color: token.showBars ? '#4ade80' : '#64748b',
                          cursor: 'pointer',
                          fontSize: '10px',
                          padding: '4px 2px',
                          fontWeight: 600
                        }}
                        title="Mostrar u ocultar barras en el tablero"
                      >
                        📊 {token.showBars ? 'Barras' : 'Ocultas'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleTokenFaction && onToggleTokenFaction(token.id)}
                        style={{
                          backgroundColor: '#12151c',
                          border: token.faction === 'enemy' ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid rgba(59, 130, 246, 0.45)',
                          borderRadius: '5px',
                          color: token.faction === 'enemy' ? '#f87171' : '#60a5fa',
                          cursor: 'pointer',
                          fontSize: '10px',
                          padding: '4px 2px',
                          fontWeight: 600
                        }}
                      >
                        {token.faction === 'enemy' ? '💀 Enem.' : '🛡️ Aliado'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleTokenHidden && onToggleTokenHidden(token.id)}
                        style={{
                          backgroundColor: '#12151c',
                          border: token.isHidden ? '1px solid rgba(192, 132, 252, 0.5)' : '1px solid #262b38',
                          borderRadius: '5px',
                          color: token.isHidden ? '#c084fc' : '#cbd5e1',
                          cursor: 'pointer',
                          fontSize: '10px',
                          padding: '4px 2px',
                          fontWeight: 600
                        }}
                      >
                        {token.isHidden ? '👻 Sigilo' : '👁️ Visib.'}
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
            textAlign: 'center', color: '#64748b', fontSize: '12px', marginTop: '12px',
            padding: '20px 12px', backgroundColor: '#11141b', borderRadius: '8px', border: '1px dashed #262b38'
          }}>
            El tablero aguarda a los aventureros. Pulsa <strong>Invocar</strong> en cualquier personaje para colocarlo.
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenSidebar;
