import React, { useState, useEffect } from 'react';
import { BookOpen, Scroll } from 'lucide-react';
import { getClassificationMeta } from './EncyclopediaView';
import { getRecentCampaigns } from '../utils/campaignStorage';

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
  onLoadRecentCampaign,
  onOpenPlayerView,
  onOpenTutorial
}) => {
  const [isArchivesOpen, setIsArchivesOpen] = useState(false);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);

  const activeScene = scenes.find(s => s.id === activeSceneId) || scenes[0];
  const characterEntries = characters.filter(c => getClassificationMeta(c.entityType, c.faction).group === 'character');
  const monsterEntries = characters.filter(c => getClassificationMeta(c.entityType, c.faction).group === 'monster');

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    getRecentCampaigns().then(list => {
      if (!isMounted) return;
      if (list && list.length > 0) {
        setRecentCampaigns(list);
        setSelectedCampaignId(list[0].id);
      } else {
        setRecentCampaigns([]);
        setSelectedCampaignId(null);
      }
    });
    return () => { isMounted = false; };
  }, [isOpen, scenes, characters, graveyard, activeSceneId]);

  const handleExecuteLoad = (camp) => {
    if (!camp) return;
    if (camp.isCurrent) {
      onResumeGame();
    } else if (onLoadRecentCampaign) {
      onLoadRecentCampaign(camp.data);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90000,
        backgroundColor: '#090b10',
        backgroundImage: `
          linear-gradient(180deg, rgba(9, 11, 16, 0.72) 0%, rgba(9, 11, 16, 0.92) 55%, #090b10 100%),
          url("/assets/textures/hub_investigator_desk.jpg")
        `,
        backgroundSize: '100% 100%, cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat, no-repeat',
        backgroundAttachment: 'local, fixed',
        display: 'flex',
        flexDirection: 'column',
        color: '#e2e8f0',
        overflowY: 'auto'
      }}
    >
      <style>{`
        @keyframes vttKenBurnsDiceLive {
          0% {
            transform: scale(1.05) translate(0%, 0%);
          }
          50% {
            transform: scale(1.18) translate(-3%, -2%);
          }
          100% {
            transform: scale(1.05) translate(0%, 0%);
          }
        }

        @keyframes vttKenBurnsProjectorLive {
          0% {
            transform: scale(1.18) translate(-2%, 0%);
          }
          50% {
            transform: scale(1.05) translate(2%, -2%);
          }
          100% {
            transform: scale(1.18) translate(-2%, 0%);
          }
        }

        .vtt-live-kenburns-dice {
          animation: vttKenBurnsDiceLive 10s ease-in-out infinite alternate !important;
          will-change: transform;
          transform-origin: center center;
        }

        .vtt-live-kenburns-projector {
          animation: vttKenBurnsProjectorLive 12s ease-in-out infinite alternate !important;
          will-change: transform;
          transform-origin: center center;
        }

        .vtt-image-action-btn {
          transition: transform 0.16s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.16s ease, box-shadow 0.16s ease;
          cursor: pointer;
          outline: none;
          user-select: none;
        }
        .vtt-image-action-btn:hover {
          transform: translateY(-2px);
        }
        .vtt-image-action-btn:active {
          transform: translateY(1px) scale(0.99);
        }
        .vtt-image-action-btn-amber:hover {
          border-color: #fbbf24 !important;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.7), 0 0 20px rgba(245, 158, 11, 0.3) !important;
        }
        .vtt-image-action-btn-emerald:hover {
          border-color: #34d399 !important;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.7), 0 0 20px rgba(16, 185, 129, 0.3) !important;
        }
      `}</style>

      {/* Cabecera Superior del Hub */}
      <div style={{
        padding: '22px 44px',
        borderBottom: '1px solid #3d3222',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundImage: 'linear-gradient(180deg, rgba(16, 20, 28, 0.75) 0%, rgba(13, 16, 23, 0.92) 100%), url("/assets/textures/grimoire_leather_header.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
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
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(180, 83, 9, 0.5) 100%)',
            backgroundColor: '#2a1a08',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            border: '1.5px solid #f59e0b',
            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.25)',
            color: '#fbbf24'
          }}>
            <BookOpen size={22} strokeWidth={2.2} />
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
            style={{ padding: '9px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
          >
            Guía de Uso
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
        
        {/* SECCIÓN 1: ACCIONES DE INICIO RÁPIDO Y CAMPAÑA */}
        <div>
          <div className="vtt-retro-badge" style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, marginBottom: '12px' }}>
            ACCIONES DE INICIO RÁPIDO Y CRÓNICA
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            
            {/* Botón Grande: Entrar a la Mesa */}
            <button
              type="button"
              onClick={onResumeGame}
              className="vtt-image-action-btn vtt-image-action-btn-amber"
              style={{
                position: 'relative',
                overflow: 'hidden',
                border: '1.5px solid #d4af37',
                borderRadius: '14px',
                padding: '28px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textAlign: 'center',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                backgroundColor: '#11151f'
              }}
              title="Entrar directamente a la mesa y reanudar la partida"
            >
              {/* Fondo Cinematográfico con Movimiento Vivo Ken Burns */}
              <div
                className="vtt-live-kenburns-dice"
                style={{
                  position: 'absolute',
                  inset: '-30px',
                  backgroundImage: 'url("/assets/textures/dice_tower_button_bg.jpg")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  pointerEvents: 'none',
                  zIndex: 0
                }}
              />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="vtt-gothic-title" style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#f8fafc',
                  letterSpacing: '0.06em',
                  textShadow: '0 2px 14px rgba(0, 0, 0, 0.95), 0 0 8px rgba(0, 0, 0, 0.9)',
                  margin: 0
                }}>
                  Entrar a la Mesa
                </div>

                <div style={{
                  fontSize: '12px',
                  color: '#fbbf24',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '8px',
                  textShadow: '0 1px 8px rgba(0, 0, 0, 0.95), 0 0 6px rgba(0, 0, 0, 0.9)'
                }}>
                  <span>Reanudar partida</span>
                  <span style={{ fontSize: '14px' }}>→</span>
                </div>
              </div>
            </button>

            {/* Card 2: Crónicas y Partidas Recientes */}
            <div style={{
              background: 'linear-gradient(180deg, #161a24 0%, #10131b 100%)',
              border: '1px solid #2c3344',
              borderRadius: '14px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div className="vtt-gothic-title" style={{ fontSize: '15px', fontWeight: 'bold', color: '#f8fafc' }}>
                    Archivo de Campaña
                  </div>
                  <span className="vtt-retro-badge" style={{ fontSize: '10px', color: '#94a3b8' }}>
                    Recientes
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#8e9caa', marginBottom: '10px' }}>
                  Doble clic sobre una crónica para cargarla:
                </div>

                {/* Lista de las 3 últimas campañas o estado vacío */}
                {recentCampaigns.length === 0 ? (
                  <div style={{
                    padding: '16px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#0c0f16',
                    border: '1px dashed #232b3b',
                    fontSize: '11px',
                    color: '#64748b',
                    textAlign: 'center',
                    lineHeight: 1.5
                  }}>
                    Sin crónicas guardadas en el equipo. Crea tu aventura y usa «Guardar Aventura», o carga un archivo .json externo.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {recentCampaigns.slice(0, 3).map((camp, idx) => {
                      const isSelected = selectedCampaignId === camp.id;
                      return (
                        <div
                          key={camp.id || idx}
                          onClick={() => setSelectedCampaignId(camp.id)}
                          onDoubleClick={() => handleExecuteLoad(camp)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.16)' : '#0e121a',
                            border: isSelected ? '1.5px solid #f59e0b' : '1px solid #232b3b',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.14s ease'
                          }}
                          title="Doble clic para cargar esta crónica directamente"
                        >
                          <div style={{ overflow: 'hidden', paddingRight: '8px' }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: isSelected ? '#fbbf24' : '#f1f5f9',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{camp.title}</span>
                              {camp.isConcluded && (
                                <span style={{
                                  fontSize: '9px',
                                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                  color: '#fbbf24',
                                  border: '1px solid rgba(245, 158, 11, 0.45)',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  fontWeight: 700,
                                  flexShrink: 0
                                }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Scroll size={11} strokeWidth={2.2} /> Concluida</span>
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '10px', color: isSelected ? '#d4af37' : '#6b7a90', marginTop: '1px' }}>
                              {camp.dateStr} • {camp.scenesCount} esc. • {camp.charactersCount} fichas
                            </div>
                          </div>

                          {isSelected && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExecuteLoad(camp);
                              }}
                              className="vtt-primary-cta"
                              style={{ padding: '4px 8px', borderRadius: '5px', fontSize: '10px', cursor: 'pointer' }}
                            >
                              Cargar
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Botón único para cargar otro archivo externo */}
              <button
                onClick={onImportCampaign}
                className="vtt-brass-btn"
                style={{ width: '100%', padding: '9px', borderRadius: '7px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: '#cbd5e1' }}
                title="Explora tu equipo para abrir cualquier crónica .json"
              >
                Cargar archivo .JSON externo...
              </button>
            </div>

            {/* Botón Grande: Pantalla de Jugadores */}
            <button
              type="button"
              onClick={onOpenPlayerView}
              className="vtt-image-action-btn vtt-image-action-btn-emerald"
              style={{
                position: 'relative',
                overflow: 'hidden',
                border: '1.5px solid #059669',
                borderRadius: '14px',
                padding: '28px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textAlign: 'center',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                backgroundColor: '#0c1a16'
              }}
              title="Lanzar una segunda ventana sincronizada para los jugadores"
            >
              {/* Fondo Cinematográfico con Movimiento Vivo Ken Burns */}
              <div
                className="vtt-live-kenburns-projector"
                style={{
                  position: 'absolute',
                  inset: '-30px',
                  backgroundImage: 'url("/assets/textures/player_projector_button_bg.jpg")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  pointerEvents: 'none',
                  zIndex: 0
                }}
              />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="vtt-gothic-title" style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#f8fafc',
                  letterSpacing: '0.06em',
                  textShadow: '0 2px 14px rgba(0, 0, 0, 0.95), 0 0 8px rgba(0, 0, 0, 0.9)',
                  margin: 0
                }}>
                  Pantalla de Jugadores
                </div>

                <div style={{
                  fontSize: '12px',
                  color: '#34d399',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '8px',
                  textShadow: '0 1px 8px rgba(0, 0, 0, 0.95), 0 0 6px rgba(0, 0, 0, 0.9)'
                }}>
                  <span>Lanzar ventana sincronizada</span>
                  <span style={{ fontSize: '14px' }}>→</span>
                </div>
              </div>
            </button>

          </div>
        </div>

        {/* SECCIÓN 2: ARCHIVOS Y CÓDICE */}
        <div>
          <div className="vtt-retro-badge" style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, marginBottom: '12px' }}>
            ARCHIVOS Y EXPEDIENTES DE CAMPAÑA
          </div>
          
          <div
            onClick={() => setIsArchivesOpen(true)}
            style={{
              background: 'linear-gradient(180deg, #171b26 0%, #0f121a 100%)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              borderRadius: '16px',
              padding: '24px 28px',
              display: 'grid',
              gridTemplateColumns: 'minmax(240px, 280px) 1fr auto',
              alignItems: 'center',
              gap: '28px',
              cursor: 'pointer',
              boxShadow: '0 14px 35px rgba(0, 0, 0, 0.55)',
              transition: 'all 0.18s ease'
            }}
          >
            {/* Banner con textura temática */}
            <div style={{
              height: '140px',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              position: 'relative',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)'
            }}>
              <img
                src="/assets/textures/archive_characters_bg.jpg"
                alt="Archivos y Códice"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(15, 18, 26, 0.85) 100%)'
              }} />
              <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                <span className="vtt-retro-badge" style={{
                  padding: '4px 10px',
                  borderRadius: '5px',
                  backgroundColor: 'rgba(20, 24, 35, 0.94)',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  color: '#fbbf24',
                  fontSize: '11px',
                  fontWeight: 700,
                  backdropFilter: 'blur(4px)'
                }}>
                  {characterEntries.length + monsterEntries.length + graveyard.length} expedientes
                </span>
              </div>
            </div>

            <div>
              <h3 className="vtt-gothic-title" style={{ margin: '0 0 6px 0', fontSize: '22px', color: '#f8fafc' }}>
                Archivos y Códice de Campaña
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, lineHeight: 1.6, maxWidth: '640px' }}>
                Acceso centralizado al archivo de <strong>Investigadores y Aliados</strong>, el <strong>Bestiario de los Mitos</strong> y el registro fúnebre de combatientes en la <strong>Cripta de Caídos</strong>.
              </p>

              {/* Tira resumen de las 3 categorías */}
              <div style={{
                display: 'inline-flex',
                gap: '14px',
                marginTop: '16px',
                padding: '10px 16px',
                backgroundColor: '#0c0f16',
                borderRadius: '8px',
                border: '1px solid #202737'
              }}>
                <div style={{ paddingRight: '14px', borderRight: '1px solid #222b3d' }}>
                  <div style={{ fontSize: '10px', color: '#8e9caa', fontWeight: 700, textTransform: 'uppercase' }}>Personajes</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>{characterEntries.length}</div>
                </div>
                <div style={{ paddingRight: '14px', borderRight: '1px solid #222b3d' }}>
                  <div style={{ fontSize: '10px', color: '#8e9caa', fontWeight: 700, textTransform: 'uppercase' }}>Bestiario</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#c4b5fd', marginTop: '2px' }}>{monsterEntries.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#8e9caa', fontWeight: 700, textTransform: 'uppercase' }}>Cripta</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: graveyard.length > 0 ? '#fca5a5' : '#94a3b8', marginTop: '2px' }}>{graveyard.length}</div>
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsArchivesOpen(true);
                }}
                className="vtt-primary-cta"
                style={{ padding: '14px 28px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                Abrir Archivos →
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* VISTA / MODAL DE ARCHIVOS Y CÓDICE (3 OPCIONES AGRUPADAS) */}
      {isArchivesOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 96000,
          backgroundColor: '#07090e',
          backgroundImage: 'linear-gradient(180deg, rgba(8, 11, 16, 0.85) 0%, rgba(6, 8, 12, 0.96) 100%), url("/assets/textures/archive_characters_bg.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          color: '#e2e8f0',
          overflowY: 'auto'
        }}>
          {/* Header de la vista de archivos */}
          <div style={{
            padding: '18px 40px',
            borderBottom: '1px solid #3d3222',
            backgroundImage: 'linear-gradient(180deg, rgba(16, 20, 28, 0.8) 0%, rgba(13, 16, 23, 0.95) 100%), url("/assets/textures/grimoire_leather_header.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.75)',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                ARC
              </div>
              <div>
                <div className="vtt-gothic-title" style={{ fontSize: '18px', fontWeight: 'bold', color: '#f8fafc', letterSpacing: '0.06em' }}>
                  ARCHIVOS Y CÓDICE DE CAMPAÑA
                </div>
                <div className="vtt-retro-badge" style={{ fontSize: '11px', color: '#b49b78', marginTop: '2px' }}>
                  {characterEntries.length} Personajes • {monsterEntries.length} Criaturas • {graveyard.length} Caídos en Cripta
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsArchivesOpen(false)}
              className="vtt-brass-btn"
              style={{ padding: '8px 18px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              Volver al Inicio
            </button>
          </div>

          {/* Contenedor central con las 3 opciones */}
          <div style={{
            maxWidth: '1200px',
            width: '100%',
            margin: '0 auto',
            padding: '44px 36px',
            display: 'flex',
            flexDirection: 'column',
            gap: '28px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div className="vtt-gothic-title" style={{ fontSize: '24px', color: '#fdf8ea', marginBottom: '8px' }}>
                Selecciona una Sección de Archivo
              </div>
              <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '620px', margin: '0 auto', lineHeight: 1.6 }}>
                Explora el registro de combatientes, las entidades y horrores de los mitos o la cripta fúnebre para consultar trasfondos, facultades y botín.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              
              {/* Opción 1: Enciclopedia de Personajes */}
              <div style={{
                background: 'linear-gradient(180deg, rgba(23, 28, 41, 0.92) 0%, rgba(16, 19, 29, 0.95) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                borderRadius: '16px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '18px',
                boxShadow: '0 14px 35px rgba(0,0,0,0.5)'
              }}>
                <div>
                  <div style={{
                    height: '135px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    marginBottom: '16px',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    position: 'relative',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)'
                  }}>
                    <img
                      src="/assets/textures/encyclopedia_characters_banner.jpg"
                      alt="Enciclopedia de Personajes"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(16, 19, 29, 0.85) 100%)'
                    }} />
                    <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                      <span className="vtt-retro-badge" style={{
                        padding: '3px 8px',
                        borderRadius: '5px',
                        backgroundColor: 'rgba(20, 24, 35, 0.92)',
                        border: '1px solid rgba(245, 158, 11, 0.45)',
                        color: '#fbbf24',
                        fontSize: '11px',
                        fontWeight: 700,
                        backdropFilter: 'blur(4px)'
                      }}>
                        {characterEntries.length} registrados
                      </span>
                    </div>
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
                    onClick={() => {
                      setIsArchivesOpen(false);
                      if (onOpenEncyclopedia) onOpenEncyclopedia('character');
                    }}
                    className="vtt-brass-btn"
                    style={{ flex: 1, padding: '11px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, borderColor: '#f59e0b', color: '#fbbf24' }}
                  >
                    Abrir Enciclopedia
                  </button>
                  <button
                    onClick={() => {
                      setIsArchivesOpen(false);
                      if (onCreateCharacter) onCreateCharacter('human');
                    }}
                    className="vtt-brass-btn"
                    style={{ padding: '11px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                    title="Crear nuevo personaje directamente"
                  >
                    + Crear
                  </button>
                </div>
              </div>

              {/* Opción 2: Bestiario y Biblioteca de los Mitos */}
              <div style={{
                background: 'linear-gradient(180deg, rgba(25, 22, 43, 0.92) 0%, rgba(17, 15, 29, 0.95) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(139, 92, 246, 0.45)',
                borderRadius: '16px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '18px',
                boxShadow: '0 14px 35px rgba(0,0,0,0.5)'
              }}>
                <div>
                  <div style={{
                    height: '135px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    marginBottom: '16px',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    position: 'relative',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)'
                  }}>
                    <img
                      src="/assets/textures/bestiary_mythos_banner.jpg"
                      alt="Bestiario y Biblioteca de los Mitos"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(17, 15, 29, 0.85) 100%)'
                    }} />
                    <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                      <span className="vtt-retro-badge" style={{
                        padding: '3px 8px',
                        borderRadius: '5px',
                        backgroundColor: 'rgba(20, 24, 35, 0.92)',
                        border: '1px solid rgba(139, 92, 246, 0.45)',
                        color: '#c4b5fd',
                        fontSize: '11px',
                        fontWeight: 700,
                        backdropFilter: 'blur(4px)'
                      }}>
                        {monsterEntries.length} registrados
                      </span>
                    </div>
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
                    onClick={() => {
                      setIsArchivesOpen(false);
                      if (onOpenEncyclopedia) onOpenEncyclopedia('monster');
                    }}
                    className="vtt-brass-btn"
                    style={{
                      flex: 1,
                      padding: '11px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderColor: '#8b5cf6',
                      color: '#c4b5fd'
                    }}
                  >
                    Abrir Bestiario
                  </button>
                  <button
                    onClick={() => {
                      setIsArchivesOpen(false);
                      if (onCreateCharacter) onCreateCharacter('mythos_creature');
                    }}
                    className="vtt-brass-btn"
                    style={{ padding: '11px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
                    title="Registrar nueva criatura o entidad"
                  >
                    + Crear
                  </button>
                </div>
              </div>

              {/* Opción 3: Cripta y Cementerio */}
              <div style={{
                background: 'linear-gradient(180deg, rgba(23, 26, 36, 0.92) 0%, rgba(15, 18, 26, 0.95) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                borderRadius: '16px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '18px',
                boxShadow: '0 14px 35px rgba(0,0,0,0.5)'
              }}>
                <div>
                  <div style={{
                    height: '135px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    marginBottom: '16px',
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    position: 'relative',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)'
                  }}>
                    <img
                      src="/assets/textures/crypt_graveyard_banner.jpg"
                      alt="Cripta y Cementerio"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(15, 18, 26, 0.85) 100%)'
                    }} />
                    <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                      <span className="vtt-retro-badge" style={{
                        padding: '3px 8px',
                        borderRadius: '5px',
                        backgroundColor: 'rgba(20, 24, 35, 0.92)',
                        border: graveyard.length > 0 ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid rgba(148, 163, 184, 0.35)',
                        color: graveyard.length > 0 ? '#fca5a5' : '#94a3b8',
                        fontSize: '11px',
                        fontWeight: 700,
                        backdropFilter: 'blur(4px)'
                      }}>
                        {graveyard.length} caídos en batalla
                      </span>
                    </div>
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
                          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{g.name}</span>
                          <span style={{ color: '#94a3b8', fontSize: '10px' }}>{g.sceneName || 'Tablero'}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setIsArchivesOpen(false);
                      if (onOpenGraveyard) onOpenGraveyard();
                      else if (onOpenEncyclopedia) onOpenEncyclopedia('graveyard');
                    }}
                    className="vtt-brass-btn"
                    style={{
                      width: '100%',
                      padding: '11px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderColor: '#4a5568',
                      color: '#e2e8f0'
                    }}
                  >
                    Abrir Cripta / Registro ({graveyard.length})
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;