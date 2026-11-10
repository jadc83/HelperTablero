import { useState, useEffect } from 'react';
import { BookOpen, Scroll, ArrowRight, ArrowLeft, Settings } from 'lucide-react';
import { getClassificationMeta } from '../constants/gamePresets';
import { getRecentCampaigns } from '../utils/campaignStorage';

const HomeScreen = ({
  isOpen,
  onResumeGame,
  scenes = [],
  activeSceneId,
  characters = [],
  codexEntities,
  codexItems = [],
  graveyard = [],
  onOpenGraveyard,
  onOpenEncyclopedia,
  onCreateCharacter,
  onImportCampaign,
  onLoadRecentCampaign,
  onOpenTutorial,
  onOpenAppSettings
}) => {
  const [isArchivesOpen, setIsArchivesOpen] = useState(false);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);

  const codexSourceEntities = Array.isArray(codexEntities) ? codexEntities : characters;
  const characterEntries = codexSourceEntities.filter(c => getClassificationMeta(c.entityType, c.faction).group === 'character');
  const monsterEntries = codexSourceEntities.filter(c => getClassificationMeta(c.entityType, c.faction).group === 'monster');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (isArchivesOpen) {
          setIsArchivesOpen(false);
        } else if (onResumeGame) {
          onResumeGame();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isArchivesOpen, onResumeGame]);

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
        backgroundColor: 'var(--vtt-bg-deep)',
        backgroundImage: 'var(--vtt-hub-bg)',
        backgroundSize: '100% 100%, cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat, no-repeat',
        backgroundAttachment: 'local, fixed',
        display: 'flex',
        flexDirection: 'column',
        color: 'var(--vtt-text)',
        overflowY: 'auto'
      }}
    >
      {/* Cabecera Superior del Hub */}
      <div style={{
        padding: '22px 44px',
        borderBottom: '1px solid var(--vtt-toolbar-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--vtt-toolbar-bg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: '#0b0e14',
            border: '1.5px solid var(--vtt-gold)',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.35), 0 0 14px rgba(245, 158, 11, 0.22)',
            flexShrink: 0
          }}>
            <img
              src="/assets/textures/grimorio_emblem_logo.jpg"
              alt="Emblema Grimorio VTT"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
          <h1 className="vtt-gothic-title" style={{ margin: 0, fontSize: '24px', color: 'var(--vtt-text-strong)', letterSpacing: '0.07em' }}>
            GRIMORIO <span style={{ color: 'var(--vtt-gold)' }}>VTT</span>
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={onOpenAppSettings}
            className="vtt-brass-btn"
            style={{ padding: '9px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, gap: '6px' }}
            title="Configuración de Audio, Tablero, Dados 3D, Rendimiento y Datos"
          >
            <Settings size={14} strokeWidth={2.2} /> Configuración
          </button>
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
          <div className="vtt-retro-badge" style={{ fontSize: '11px', color: 'var(--vtt-accent-amber)', fontWeight: 700, marginBottom: '12px' }}>
            ACCIONES DE INICIO RÁPIDO Y CRÓNICA
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {/* Botón Grande: Entrar a la Mesa */}
            <button
              type="button"
              onClick={onResumeGame}
              className="vtt-image-action-btn vtt-image-action-btn-amber"
              style={{
                position: 'relative',
                overflow: 'hidden',
                border: '1.5px solid var(--vtt-gold)',
                borderRadius: '14px',
                padding: '28px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                textAlign: 'center',
                boxShadow: 'var(--vtt-shadow-panel)',
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
                  <ArrowRight size={14} strokeWidth={2.2} />
                </div>
              </div>
            </button>

            {/* Card 2: Crónicas y Partidas Recientes */}
            <div style={{
              background: 'var(--vtt-bg-panel-gradient)',
              border: '1px solid var(--vtt-border)',
              borderRadius: '14px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: 'var(--vtt-shadow-panel)'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div className="vtt-gothic-title" style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--vtt-text-strong)' }}>
                    Archivo de Campaña
                  </div>
                  <span className="vtt-retro-badge" style={{ fontSize: '10px', color: 'var(--vtt-text-muted)' }}>
                    Recientes
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--vtt-text-muted)', marginBottom: '10px' }}>
                  Doble clic sobre una crónica para cargarla:
                </div>

                {/* Lista de las 3 últimas campañas o estado vacío */}
                {recentCampaigns.length === 0 ? (
                  <div style={{
                    padding: '16px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--vtt-bg-inset)',
                    border: '1px dashed var(--vtt-border)',
                    fontSize: '11px',
                    color: 'var(--vtt-text-dim)',
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
                            backgroundColor: isSelected ? 'var(--vtt-accent-amber-bg)' : 'var(--vtt-bg-card)',
                            border: isSelected ? '1.5px solid var(--vtt-gold)' : '1px solid var(--vtt-border-subtle)',
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
                              color: isSelected ? 'var(--vtt-accent-amber)' : 'var(--vtt-text-strong)',
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
                                  backgroundColor: 'var(--vtt-accent-amber-bg)',
                                  color: 'var(--vtt-accent-amber)',
                                  border: '1px solid var(--vtt-accent-amber-border)',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  fontWeight: 700,
                                  flexShrink: 0
                                }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Scroll size={11} strokeWidth={2.2} /> Concluida</span>
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '10px', color: isSelected ? 'var(--vtt-accent-amber-soft)' : 'var(--vtt-text-muted)', marginTop: '1px' }}>
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
                style={{ width: '100%', padding: '9px', borderRadius: '7px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: 'var(--vtt-btn-text)' }}
                title="Explora tu equipo para abrir cualquier crónica .json"
              >
                Cargar archivo .JSON externo...
              </button>
            </div>

          </div>
        </div>

        {/* SECCIÓN 2: ARCHIVOS Y CÓDICE */}
        <div>
          <div className="vtt-retro-badge" style={{ fontSize: '11px', color: 'var(--vtt-accent-amber)', fontWeight: 700, marginBottom: '12px' }}>
            ARCHIVOS Y EXPEDIENTES DE CAMPAÑA
          </div>
          
          <div
            onClick={() => setIsArchivesOpen(true)}
            style={{
              background: 'var(--vtt-bg-panel-gradient)',
              border: '1px solid var(--vtt-accent-amber-border)',
              borderRadius: '16px',
              padding: '24px 28px',
              display: 'grid',
              gridTemplateColumns: 'minmax(240px, 280px) 1fr auto',
              alignItems: 'center',
              gap: '28px',
              cursor: 'pointer',
              boxShadow: 'var(--vtt-shadow-panel)',
              transition: 'all 0.18s ease'
            }}
          >
            {/* Banner con textura temática */}
            <div style={{
              height: '140px',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '1px solid var(--vtt-accent-amber-border)',
              position: 'relative',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)'
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
                  {characterEntries.length + monsterEntries.length + codexItems.length + graveyard.length} expedientes
                </span>
              </div>
            </div>

            <div>
              <h3 className="vtt-gothic-title" style={{ margin: '0 0 6px 0', fontSize: '22px', color: 'var(--vtt-text-strong)' }}>
                Archivos y Códice Global
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--vtt-text-muted)', margin: 0, lineHeight: 1.6, maxWidth: '640px' }}>
                Archivo histórico persistente de <strong>Investigadores y Aliados</strong>, <strong>Bestiario de los Mitos</strong>, <strong>Objetos Únicos</strong> y la <strong>Cripta de Caídos</strong>.
              </p>

              {/* Tira resumen de las 4 categorías */}
              <div style={{
                display: 'inline-flex',
                gap: '14px',
                marginTop: '16px',
                padding: '10px 16px',
                backgroundColor: 'var(--vtt-bg-card)',
                borderRadius: '8px',
                border: '1px solid var(--vtt-border)'
              }}>
                <div style={{ paddingRight: '14px', borderRight: '1px solid var(--vtt-border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--vtt-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Personajes</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--vtt-accent-amber)', marginTop: '2px' }}>{characterEntries.length}</div>
                </div>
                <div style={{ paddingRight: '14px', borderRight: '1px solid var(--vtt-border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--vtt-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Bestiario</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--vtt-accent-purple)', marginTop: '2px' }}>{monsterEntries.length}</div>
                </div>
                <div style={{ paddingRight: '14px', borderRight: '1px solid var(--vtt-border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--vtt-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Objetos</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--vtt-accent-sky)', marginTop: '2px' }}>{codexItems.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--vtt-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Cripta</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: graveyard.length > 0 ? 'var(--vtt-accent-red)' : 'var(--vtt-text-muted)', marginTop: '2px' }}>{graveyard.length}</div>
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
                Abrir Archivos <ArrowRight size={13} strokeWidth={2.2} />
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
          backgroundColor: 'var(--vtt-bg-deep)',
          backgroundImage: 'var(--vtt-archives-bg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--vtt-text)',
          overflowY: 'auto'
        }}>
          {/* Header de la vista de archivos */}
          <div style={{
            padding: '18px 40px',
            borderBottom: '1px solid var(--vtt-toolbar-border)',
            background: 'var(--vtt-toolbar-bg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: 'var(--vtt-shadow-panel)',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'var(--vtt-gold-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--vtt-accent-amber)',
                border: '1.5px solid var(--vtt-gold)'
              }}>
                <BookOpen size={20} strokeWidth={2.1} />
              </div>
              <div>
                <div className="vtt-gothic-title" style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--vtt-text-strong)', letterSpacing: '0.06em' }}>
                  ARCHIVOS Y CÓDICE DE CAMPAÑA
                </div>
                <div className="vtt-retro-badge" style={{ fontSize: '11px', color: 'var(--vtt-accent-amber)', marginTop: '2px' }}>
                  {characterEntries.length} Personajes • {monsterEntries.length} Criaturas • {graveyard.length} Caídos en Cripta
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsArchivesOpen(false)}
              className="vtt-brass-btn"
              style={{ padding: '8px 18px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              <ArrowLeft size={13} strokeWidth={2.2} /> Volver al Inicio
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
              <div className="vtt-gothic-title" style={{ fontSize: '24px', color: 'var(--vtt-text-strong)', marginBottom: '8px' }}>
                Selecciona una Sección de Archivo
              </div>
              <p style={{ fontSize: '13px', color: 'var(--vtt-text-muted)', maxWidth: '620px', margin: '0 auto', lineHeight: 1.6 }}>
                Explora el registro de combatientes, las entidades y horrores de los mitos o la cripta fúnebre para consultar trasfondos, facultades y botín.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              
              {/* Opción 1: Enciclopedia de Personajes */}
              <div style={{
                background: 'var(--vtt-bg-panel-gradient)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--vtt-accent-amber-border)',
                borderRadius: '16px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '18px',
                boxShadow: 'var(--vtt-shadow-panel)'
              }}>
                <div>
                  <div style={{
                    height: '135px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    marginBottom: '16px',
                    border: '1px solid var(--vtt-accent-amber-border)',
                    position: 'relative',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)'
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

                  <h3 className="vtt-gothic-title" style={{ margin: '0 0 8px 0', fontSize: '19px', color: 'var(--vtt-text-strong)' }}>
                    Enciclopedia de Personajes
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--vtt-text-muted)', margin: 0, lineHeight: 1.6 }}>
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
                    style={{ flex: 1, padding: '11px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 700, borderColor: 'var(--vtt-accent-amber-border)', color: 'var(--vtt-accent-amber)' }}
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
                background: 'var(--vtt-bg-panel-gradient)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--vtt-accent-purple-border)',
                borderRadius: '16px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '18px',
                boxShadow: 'var(--vtt-shadow-panel)'
              }}>
                <div>
                  <div style={{
                    height: '135px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    marginBottom: '16px',
                    border: '1px solid var(--vtt-accent-purple-border)',
                    position: 'relative',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)'
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

                  <h3 className="vtt-gothic-title" style={{ margin: '0 0 8px 0', fontSize: '19px', color: 'var(--vtt-text-strong)' }}>
                    Bestiario y Biblioteca de los Mitos
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--vtt-text-muted)', margin: 0, lineHeight: 1.6 }}>
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
                      borderColor: 'var(--vtt-accent-purple-border)',
                      color: 'var(--vtt-accent-purple)'
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
                background: 'var(--vtt-bg-panel-gradient)',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--vtt-border)',
                borderRadius: '16px',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '18px',
                boxShadow: 'var(--vtt-shadow-panel)'
              }}>
                <div>
                  <div style={{
                    height: '135px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    marginBottom: '16px',
                    border: '1px solid var(--vtt-border)',
                    position: 'relative',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)'
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

                  <h3 className="vtt-gothic-title" style={{ margin: '0 0 8px 0', fontSize: '19px', color: 'var(--vtt-text-strong)' }}>
                    Cripta y Cementerio
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--vtt-text-muted)', margin: 0, lineHeight: 1.6 }}>
                    Registro fúnebre de combatientes perecidos. Consulta el <strong>botín e inventario para saquearlos</strong>, inspecciona sus notas o devuélvelos a la vida.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {graveyard.length > 0 && (
                    <div style={{
                      backgroundColor: 'var(--vtt-bg-inset)',
                      border: '1px solid var(--vtt-border)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <span style={{ fontSize: '10px', color: 'var(--vtt-text-dim)', fontWeight: 700 }}>ÚLTIMAS BAJAS REGISTRADAS:</span>
                      {graveyard.slice(0, 2).map(g => (
                        <div key={g.graveyardId || g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                          <span style={{ color: 'var(--vtt-text)', fontWeight: 600 }}>{g.name}</span>
                          <span style={{ color: 'var(--vtt-text-muted)', fontSize: '10px' }}>{g.sceneName || 'Tablero'}</span>
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
                      borderColor: 'var(--vtt-border-strong)',
                      color: 'var(--vtt-btn-text)'
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