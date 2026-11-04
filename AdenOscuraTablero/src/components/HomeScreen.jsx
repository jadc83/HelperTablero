import React from 'react';
import { getClassificationMeta } from './EncyclopediaView';

const HomeScreen = ({
  isOpen,
  onResumeGame,
  scenes = [],
  activeSceneId,
  onSelectScene,
  characters = [],
  graveyard = [],
  onOpenGraveyard,
  onOpenEncyclopedia,
  onCreateCharacter,
  onOpenMapCreator,
  onImportCampaign,
  onExportCampaign,
  onOpenPlayerView,
  onOpenTutorial
}) => {
  if (!isOpen) return null;

  const activeScene = scenes.find(s => s.id === activeSceneId) || scenes[0];
  const characterEntries = characters.filter(c => getClassificationMeta(c.entityType, c.faction).group === 'character');
  const monsterEntries = characters.filter(c => getClassificationMeta(c.entityType, c.faction).group === 'monster');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90000,
        backgroundColor: '#090b10',
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(245, 158, 11, 0.08) 0%, transparent 45%),
          radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.07) 0%, transparent 45%),
          radial-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 100% 100%, 28px 28px',
        display: 'flex',
        flexDirection: 'column',
        color: '#e2e8f0',
        overflowY: 'auto'
      }}
    >
      {/* Cabecera Superior del Hub */}
      <div style={{
        padding: '22px 44px',
        borderBottom: '1px solid #1e2433',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(13, 16, 23, 0.85)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            border: '1px solid #fbbf24',
            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.35)'
          }}>
            ⚜️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 className="vtt-gothic-title" style={{ margin: 0, fontSize: '22px', color: '#f8fafc', letterSpacing: '0.06em' }}>
                GRIMORIO <span style={{ color: '#f59e0b' }}>VTT</span>
              </h1>
              <span className="vtt-retro-badge" style={{
                fontSize: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                padding: '2px 8px',
                borderRadius: '999px',
                fontWeight: 700
              }}>
                SALA DE TRONO • HUB PRINCIPAL
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              Mesa virtual táctica con iluminación dinámica, dados físicos 3D y pantalla de jugadores en tiempo real
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={onOpenTutorial}
            className="vtt-brass-btn"
            style={{ padding: '9px 15px', borderRadius: '9px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
          >
            ❓ Guía de Uso
          </button>
          <button
            onClick={onResumeGame}
            className="vtt-primary-cta"
            style={{ padding: '10px 22px', borderRadius: '9px', cursor: 'pointer', fontSize: '13px' }}
          >
            ⚔️ Ir al Tablero de Juego ➔
          </button>
        </div>
      </div>

      {/* Contenedor Central */}
      <div style={{
        maxWidth: '1240px',
        width: '100%',
        margin: '0 auto',
        padding: '36px 44px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px'
      }}>
        
        {/* SECCIÓN 1: TARJETAS DE INICIO RÁPIDO Y CAMPAÑA */}
        <div>
          <div className="vtt-retro-badge" style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, marginBottom: '12px' }}>
            ⚡ ACCIONES DE INICIO RÁPIDO Y CRÓNICA
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            
            {/* Card 1: Continuar Partida */}
            <div style={{
              background: 'linear-gradient(180deg, #191e2b 0%, #12151f 100%)',
              border: '1px solid #f59e0b',
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.5)'
            }}>
              <div>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>🏰</div>
                <div className="vtt-gothic-title" style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '6px' }}>
                  Inicio Rápido / Mesa
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                  Entra directamente a la escena activa (<strong style={{ color: '#fbbf24' }}>{activeScene?.name || 'Escena Principal'}</strong>) con todas tus fichas y muros listos.
                </p>
              </div>
              <button
                onClick={onResumeGame}
                className="vtt-primary-cta"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
              >
                ▶️ Entrar a la Mesa
              </button>
            </div>

            {/* Card 2: Cargar / Guardar Campaña */}
            <div style={{
              background: 'linear-gradient(180deg, #161a24 0%, #10131b 100%)',
              border: '1px solid #2c3344',
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>📜</div>
                <div className="vtt-gothic-title" style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '6px' }}>
                  Archivo de Campaña
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                  Carga una crónica guardada en archivo <code>.json</code> o haz una copia de seguridad completa de tus escenas y personajes.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={onImportCampaign}
                  className="vtt-brass-btn"
                  style={{ flex: 1, padding: '9px 8px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, borderColor: '#60a5fa', color: '#93c5fd' }}
                >
                  📥 Cargar .JSON
                </button>
                <button
                  onClick={onExportCampaign}
                  className="vtt-brass-btn"
                  style={{ flex: 1, padding: '9px 8px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
                >
                  📤 Exportar
                </button>
              </div>
            </div>

            {/* Card 3: Arquitecto de Mapas */}
            <div style={{
              background: 'linear-gradient(180deg, #161a24 0%, #10131b 100%)',
              border: '1px solid #2c3344',
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>🗺️</div>
                <div className="vtt-gothic-title" style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '6px' }}>
                  Forjar Escenario
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                  Sube planos de fondo, traza muros de colisión y coloca puertas, ventanas, cofres o antorchas.
                </p>
              </div>
              <button
                onClick={() => {
                  onResumeGame();
                  onOpenMapCreator();
                }}
                className="vtt-brass-btn"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
              >
                📐 Abrir Creador de Mapas
              </button>
            </div>

            {/* Card 4: Sala de Jugadores */}
            <div style={{
              background: 'linear-gradient(180deg, #161a24 0%, #10131b 100%)',
              border: '1px solid #2c3344',
              borderRadius: '14px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>🖥️</div>
                <div className="vtt-gothic-title" style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '6px' }}>
                  Pantalla de Jugadores
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                  Lanza una segunda ventana sincronizada con niebla opaca, efectos climáticos y dados 3D para tus jugadores.
                </p>
              </div>
              <button
                onClick={onOpenPlayerView}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                  color: '#052e16',
                  border: '1px solid #34d399'
                }}
              >
                🖥️ Lanzar Ventana Jugadores
              </button>
            </div>

          </div>
        </div>

        {/* SECCIÓN 2: LAS DOS GRANDES ENCICLOPEDIAS + CRIPTA/CEMENTERIO + SELECTOR DE ESCENAS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '20px' }}>
          
          {/* Portal 1: Enciclopedia de Personajes */}
          <div style={{
            background: 'linear-gradient(180deg, #171c29 0%, #10131d 100%)',
            border: '1px solid rgba(245, 158, 11, 0.45)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '18px',
            boxShadow: '0 14px 35px rgba(0,0,0,0.45)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '34px' }}>📖</span>
                <span className="vtt-retro-badge" style={{
                  padding: '3px 10px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(245, 158, 11, 0.16)',
                  color: '#fbbf24',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  {characterEntries.length} registrados
                </span>
              </div>
              <h3 className="vtt-gothic-title" style={{ margin: '0 0 8px 0', fontSize: '19px', color: '#f8fafc' }}>
                Enciclopedia de Personajes
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
                Vista dedicada estilo enciclopedia con retrato en gran formato, biografía, inventario y grimorio para <strong>Investigadores, Humanos, Aliados y Cultistas</strong>.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => onOpenEncyclopedia && onOpenEncyclopedia('character')}
                className="vtt-primary-cta"
                style={{ flex: 1, padding: '11px', borderRadius: '9px', cursor: 'pointer', fontSize: '12px' }}
              >
                📖 Abrir Enciclopedia
              </button>
              <button
                onClick={() => onCreateCharacter && onCreateCharacter('human')}
                className="vtt-brass-btn"
                style={{ padding: '11px 14px', borderRadius: '9px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                title="Crear nuevo personaje directamente"
              >
                + Crear
              </button>
            </div>
          </div>

          {/* Portal 2: Biblioteca de Monstruos, Animales y Mitos */}
          <div style={{
            background: 'linear-gradient(180deg, #19162b 0%, #110f1d 100%)',
            border: '1px solid rgba(139, 92, 246, 0.45)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '18px',
            boxShadow: '0 14px 35px rgba(0,0,0,0.45)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '34px' }}>👁️</span>
                <span className="vtt-retro-badge" style={{
                  padding: '3px 10px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(139, 92, 246, 0.2)',
                  color: '#c4b5fd',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  {monsterEntries.length} registrados
                </span>
              </div>
              <h3 className="vtt-gothic-title" style={{ margin: '0 0 8px 0', fontSize: '19px', color: '#f8fafc' }}>
                Bestiario y Biblioteca de los Mitos
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
                Códice ilustrado de <strong>Criaturas de los Mitos, Dioses Primigenios, Dioses Exteriores, Animales y Horrores</strong> clasificados por naturaleza.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => onOpenEncyclopedia && onOpenEncyclopedia('monster')}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '9px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 700,
                  background: 'linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%)',
                  color: '#ffffff',
                  border: '1px solid #c4b5fd',
                  boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)'
                }}
              >
                👁️ Abrir Bestiario
              </button>
              <button
                onClick={() => onCreateCharacter && onCreateCharacter('mythos_creature')}
                className="vtt-brass-btn"
                style={{ padding: '11px 14px', borderRadius: '9px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                title="Registrar nueva criatura o entidad"
              >
                + Crear
              </button>
            </div>
          </div>

          {/* Portal 3: Cripta y Cementerio de Caídos (Registro de Bajas) */}
          <div style={{
            background: 'linear-gradient(180deg, #171a24 0%, #0f121a 100%)',
            border: '1px solid rgba(148, 163, 184, 0.35)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '18px',
            boxShadow: '0 14px 35px rgba(0,0,0,0.45)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '34px' }}>🪦</span>
                <span className="vtt-retro-badge" style={{
                  padding: '3px 10px',
                  borderRadius: '999px',
                  backgroundColor: graveyard.length > 0 ? 'rgba(239, 68, 68, 0.18)' : 'rgba(100, 116, 139, 0.2)',
                  color: graveyard.length > 0 ? '#fca5a5' : '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  {graveyard.length} caídos en batalla
                </span>
              </div>
              <h3 className="vtt-gothic-title" style={{ margin: '0 0 8px 0', fontSize: '19px', color: '#f8fafc' }}>
                Cripta y Cementerio
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
                Registro fúnebre de combatientes perecidos. Consulta el <strong>botín e inventario para saquearlos</strong>, inspecciona sus notas o devuélvelos a la vida.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {graveyard.length > 0 && (
                <div style={{
                  backgroundColor: '#0c0e14',
                  border: '1px solid #1f2535',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>ÚLTIMAS BAJAS REGISTRADAS:</span>
                  {graveyard.slice(0, 2).map(g => (
                    <div key={g.graveyardId || g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>💀 {g.name}</span>
                      <span style={{ color: '#94a3b8', fontSize: '10px' }}>{g.sceneName || 'Tablero'}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  if (onOpenGraveyard) onOpenGraveyard();
                  else if (onOpenEncyclopedia) onOpenEncyclopedia('graveyard');
                }}
                className="vtt-brass-btn"
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '9px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderColor: '#64748b',
                  color: '#e2e8f0'
                }}
              >
                🪦 Abrir Cripta / Registro ({graveyard.length})
              </button>
            </div>
          </div>

          {/* Portal 4: Selector Directo de Escenas de la Campaña */}
          <div style={{
            background: '#131722',
            border: '1px solid #282f42',
            borderRadius: '16px',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div>
              <div className="vtt-gothic-title" style={{ fontSize: '17px', fontWeight: 'bold', color: '#f8fafc' }}>
                🗺️ Escenas de la Crónica ({scenes.length})
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Salta directamente a cualquier escenario preparado
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
              {scenes.map((sc, idx) => {
                const isCurrent = sc.id === activeSceneId;
                return (
                  <div
                    key={sc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: isCurrent ? 'rgba(245, 158, 11, 0.14)' : '#181d2a',
                      border: isCurrent ? '1px solid #f59e0b' : '1px solid #2d3548'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                        {idx + 1}. {sc.name} {isCurrent && <span style={{ color: '#4ade80', fontSize: '11px' }}>• Activa</span>}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        {(sc.maps || []).length} elem. • {(sc.tokens || []).length} fichas
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (onSelectScene) onSelectScene(sc.id);
                        onResumeGame();
                      }}
                      className={isCurrent ? 'vtt-primary-cta' : 'vtt-brass-btn'}
                      style={{ padding: '6px 12px', borderRadius: '7px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {isCurrent ? 'Ir ➔' : 'Abrir'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HomeScreen;