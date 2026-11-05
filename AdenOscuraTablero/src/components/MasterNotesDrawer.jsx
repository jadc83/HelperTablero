import React, { useState } from 'react';
import { createPortal } from 'react-dom';

const NPC_FIRST_NAMES = [
  'Arthur', 'Cordelia', 'Silas', 'Beatrice', 'Vincent', 'Eleanor', 'Edgar', 'Lucille',
  'Gideon', 'Agatha', 'Cornelius', 'Victoria', 'Bartholomew', 'Clara', 'Thaddeus', 'Miriam',
  'Alistair', 'Evelyn', 'Tobias', 'Florence', 'Julian', 'Constance', 'Malachi', 'Gwendolyn'
];

const NPC_LAST_NAMES = [
  'Blackwood', 'Pendelton', 'Sterling', 'Vance', 'Holloway', 'Abernathy', 'Ravencroft', 'Crowley',
  'Whitmore', 'Ashford', 'Hawthorne', 'Moriarty', 'Sinclair', 'Winterbottom', 'Lockwood', 'Thorne',
  'Carver', 'Morrigan', 'Danvers', 'Kingsley', 'Fairchild', 'Graves', 'Mercer', 'Vandermeer'
];

const NPC_ROLES = [
  'Anticuario y tasador de reliquias',
  'Médico forense retirado',
  'Detective privado aficionado al láudano',
  'Bibliotecario de manuscritos prohibidos',
  'Cura de parroquia atormentado',
  'Periodista de sucesos sensacionalista',
  'Arqueólogo obsesionado con lenguas muertas',
  'Tabernero que oye demasiados secretos',
  'Vagabundo que duerme en el camposanto',
  'Noble decadente arruinado por el juego',
  'Catedrático de historia natural',
  'Fotógrafo de escenas del crimen',
  'Boticario sospechoso de fabricar venenos',
  'Conductor de coches de caballos nocturno'
];

const NPC_TRAITS = [
  'Habla en susurros y mira constantemente a los rincones oscuros.',
  'Olor persistente a tabaco inglés rancio y agua de colonia barata.',
  'Tiene un tic involuntario en el párpado izquierdo cuando miente.',
  'Cojera pronunciada; se apoya en un bastón con empuñadura de plata gastada.',
  'Dedos manchados perpetuamente de tinta púrpura y nicotina.',
  'Sonrisa forzada e inquietante; nunca pestañea durante la conversación.',
  'Lleva siempre guantes negros de cuero incluso en pleno verano.',
  'Voz carrasposa y tos seca que intenta disimular con un pañuelo bordado.'
];

const NPC_SECRETS = [
  'Debe una suma exorbitante a prestamistas de los bajos fondos que amenazan a su familia.',
  'Oye cánticos guturales cada medianoche procedentes del desagüe de su sótano.',
  'Conserva en un relicario bajo la camisa el dedo amputado de su hermano gemelo.',
  'Sufre pérdidas de memoria de varias horas y despierta con tierra bajo las uñas.',
  'Pertenece en secreto a una fraternidad que rinde culto a los astros alineados.',
  'Fue testigo de un asesinato ritual en los muelles y teme ser el siguiente objetivo.',
  'Falsificó el testamento de su mentor para heredar sus libros de ocultismo.'
];

const LOOT_ODDITIES = [
  'Reloj de bolsillo de plata parado exactamente a las 03:17.',
  'Llave de latón numerada (#14) con una cinta de terciopelo deshilachada.',
  'Frasco de vidrio ámbar con restos de láudano cristalizado.',
  'Caja de cerillas de azufre del club nocturno "La Sirena Ahogada".',
  'Fragmento de carta quemada donde solo se lee: "...sabían lo que había bajo el altar".',
  'Moneda de plata extranjera con una efigie borrada a lima.',
  'Navaja plegable de barbero con iniciales "E.B." grabadas en el mango.',
  'Boleto de tren arrugado con destino al puerto para dentro de dos días.',
  'Trozo de tiza negra que deja un olor acre a carbón quemado.',
  'Tarjetón de visita manchado de té con una dirección anotada a lápiz.'
];

const MasterNotesDrawer = ({
  isOpen,
  onClose,
  activeSceneId,
  scenes = [],
  sceneNotes = {},
  onUpdateSceneNotes,
  campaignNotes = '',
  onUpdateCampaignNotes,
  onSaveCharacter
}) => {
  const [activeTab, setActiveTab] = useState('scene'); // 'scene' | 'campaign' | 'generator'
  const [newClueText, setNewClueText] = useState('');

  // Estados del generador rápido
  const [generatedNpc, setGeneratedNpc] = useState(null);
  const [generatedLoot, setGeneratedLoot] = useState([]);

  if (!isOpen) return null;

  const currentScene = scenes.find(s => s.id === activeSceneId) || { name: 'Escena Principal', id: 'default' };
  const currentSceneData = sceneNotes[activeSceneId] || { notes: '', clues: [] };

  const handleSceneTextChange = (text) => {
    if (onUpdateSceneNotes) {
      onUpdateSceneNotes(activeSceneId, {
        ...currentSceneData,
        notes: text
      });
    }
  };

  const handleAddClue = (e) => {
    e.preventDefault();
    if (!newClueText.trim()) return;

    const newClues = [
      ...(currentSceneData.clues || []),
      {
        id: 'clue_' + Date.now() + Math.random().toString(36).slice(2, 5),
        text: newClueText.trim(),
        completed: false
      }
    ];

    if (onUpdateSceneNotes) {
      onUpdateSceneNotes(activeSceneId, {
        ...currentSceneData,
        clues: newClues
      });
    }
    setNewClueText('');
  };

  const handleToggleClue = (clueId) => {
    const updated = (currentSceneData.clues || []).map(c => 
      c.id === clueId ? { ...c, completed: !c.completed } : c
    );
    if (onUpdateSceneNotes) {
      onUpdateSceneNotes(activeSceneId, {
        ...currentSceneData,
        clues: updated
      });
    }
  };

  const handleDeleteClue = (clueId) => {
    const filtered = (currentSceneData.clues || []).filter(c => c.id !== clueId);
    if (onUpdateSceneNotes) {
      onUpdateSceneNotes(activeSceneId, {
        ...currentSceneData,
        clues: filtered
      });
    }
  };

  const rollNewNpc = () => {
    const fName = NPC_FIRST_NAMES[Math.floor(Math.random() * NPC_FIRST_NAMES.length)];
    const lName = NPC_LAST_NAMES[Math.floor(Math.random() * NPC_LAST_NAMES.length)];
    const role = NPC_ROLES[Math.floor(Math.random() * NPC_ROLES.length)];
    const trait = NPC_TRAITS[Math.floor(Math.random() * NPC_TRAITS.length)];
    const secret = NPC_SECRETS[Math.floor(Math.random() * NPC_SECRETS.length)];

    setGeneratedNpc({
      fullName: `${fName} ${lName}`,
      role,
      trait,
      secret
    });
  };

  const rollNewLoot = () => {
    const shuffled = [...LOOT_ODDITIES].sort(() => 0.5 - Math.random());
    setGeneratedLoot(shuffled.slice(0, 3));
  };

  const appendToSceneNotes = (textToAppend) => {
    const existing = currentSceneData.notes || '';
    const updated = existing ? `${existing}\n\n${textToAppend}` : textToAppend;
    handleSceneTextChange(updated);
  };

  return createPortal(
    <div
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(2px)',
        zIndex: 999990,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
    >
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          width: '450px',
          maxWidth: '100vw',
          height: '100%',
          backgroundColor: '#12151d',
          borderLeft: '1px solid #2d3546',
          boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          color: '#e2e8f0',
          overflow: 'hidden',
          animation: 'vttSlideLeft 0.2s ease-out'
        }}
      >
        <style>{`
          @keyframes vttSlideLeft {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Cabecera */}
        <div style={{
          padding: '14px 18px',
          backgroundColor: '#171b26',
          borderBottom: '1px solid #283040',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div>
              <div className="vtt-gothic-title" style={{ fontSize: '14px', color: '#f8fafc', fontWeight: 'bold', letterSpacing: '0.04em' }}>
                DIARIO & NOTAS DEL MÁSTER
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                Solo visible para ti (Atajo rápido: Tecla N)
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Pestañas */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #283040',
          backgroundColor: '#0f121a'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('scene')}
            style={{
              flex: 1,
              padding: '10px 6px',
              fontSize: '11px',
              fontWeight: 700,
              border: 'none',
              borderBottom: activeTab === 'scene' ? '2px solid #f59e0b' : '2px solid transparent',
              background: activeTab === 'scene' ? '#141822' : 'transparent',
              color: activeTab === 'scene' ? '#fbbf24' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            📍 Escena Actual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('campaign')}
            style={{
              flex: 1,
              padding: '10px 6px',
              fontSize: '11px',
              fontWeight: 700,
              border: 'none',
              borderBottom: activeTab === 'campaign' ? '2px solid #f59e0b' : '2px solid transparent',
              background: activeTab === 'campaign' ? '#141822' : 'transparent',
              color: activeTab === 'campaign' ? '#fbbf24' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            🌍 Crónica Global
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('generator');
              if (!generatedNpc) rollNewNpc();
              if (generatedLoot.length === 0) rollNewLoot();
            }}
            style={{
              flex: 1,
              padding: '10px 6px',
              fontSize: '11px',
              fontWeight: 700,
              border: 'none',
              borderBottom: activeTab === 'generator' ? '2px solid #f59e0b' : '2px solid transparent',
              background: activeTab === 'generator' ? '#141822' : 'transparent',
              color: activeTab === 'generator' ? '#fbbf24' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            🎲 Emergencia (1-Clic)
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '16px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* PESTAÑA: NOTAS DE ESCENA */}
          {activeTab === 'scene' && (
            <>
              <div style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                borderRadius: '8px',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 600 }}>
                  Mapa: <strong>{currentScene.name}</strong>
                </span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Vinculadas a esta escena
                </span>
              </div>

              {/* Checklist de Pistas y Secretos de la Sala */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
                  Checklist de Pistas & Objetivos de la Sala:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '8px' }}>
                  {(currentSceneData.clues || []).map(clue => (
                    <div
                      key={clue.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        backgroundColor: clue.completed ? 'rgba(16, 185, 129, 0.08)' : '#161922',
                        border: clue.completed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #262c3b',
                        borderRadius: '6px',
                        gap: '8px'
                      }}
                    >
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer', overflow: 'hidden' }}>
                        <input
                          type="checkbox"
                          checked={clue.completed}
                          onChange={() => handleToggleClue(clue.id)}
                        />
                        <span style={{
                          fontSize: '11px',
                          color: clue.completed ? '#94a3b8' : '#f8fafc',
                          textDecoration: clue.completed ? 'line-through' : 'none',
                          lineHeight: '1.4',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {clue.text}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteClue(clue.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          fontSize: '11px',
                          padding: '2px 4px'
                        }}
                        title="Eliminar pista"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {(currentSceneData.clues || []).length === 0 && (
                    <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', padding: '6px 0' }}>
                      No hay pistas registradas para esta sala.
                    </div>
                  )}
                </div>

                <form onSubmit={handleAddClue} style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={newClueText}
                    onChange={(e) => setNewClueText(e.target.value)}
                    placeholder="Añadir pista (ej: Diario bajo la cama, puerta secreta...)"
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      backgroundColor: '#0d1017',
                      border: '1px solid #283042',
                      color: '#f8fafc',
                      borderRadius: '5px',
                      fontSize: '11px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    className="vtt-brass-btn"
                    style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '5px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    + Añadir
                  </button>
                </form>
              </div>

              {/* Área de Notas Libres de la Escena */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
                  Apuntes Narrativos, Dificultades y Trampas de la Sala:
                </label>
                <textarea
                  value={currentSceneData.notes || ''}
                  onChange={(e) => handleSceneTextChange(e.target.value)}
                  placeholder="Escribe aquí los secretos de la sala, qué sienten los investigadores al entrar, dificultades de tiradas, diálogos clave..."
                  style={{
                    width: '100%',
                    minHeight: '220px',
                    flex: 1,
                    backgroundColor: '#0b0d13',
                    border: '1px solid #283042',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    resize: 'none',
                    outline: 'none',
                    lineHeight: '1.6'
                  }}
                />
              </div>
            </>
          )}

          {/* PESTAÑA: CRÓNICA GLOBAL */}
          {activeTab === 'campaign' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>
                Notas globales persistentes para toda la campaña (sospechosos, trama principal, calendario de la partida):
              </div>
              <textarea
                value={campaignNotes}
                onChange={(e) => onUpdateCampaignNotes && onUpdateCampaignNotes(e.target.value)}
                placeholder="Diario de campaña general: sucesos de sesiones anteriores, pactos, nombres de aliados, conspiraciones..."
                style={{
                  width: '100%',
                  flex: 1,
                  minHeight: '400px',
                  backgroundColor: '#0b0d13',
                  border: '1px solid #283042',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#e2e8f0',
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  resize: 'none',
                  outline: 'none',
                  lineHeight: '1.6'
                }}
              />
            </div>
          )}

          {/* PESTAÑA: GENERADOR DE EMERGENCIA */}
          {activeTab === 'generator' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Generador de PNJs */}
              <div style={{
                padding: '14px',
                backgroundColor: '#161a24',
                borderRadius: '8px',
                border: '1px solid #2d3648'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>
                    🕵️ PNJ Improvisado
                  </div>
                  <button
                    type="button"
                    onClick={rollNewNpc}
                    className="vtt-brass-btn"
                    style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    🎲 Generar Otro
                  </button>
                </div>

                {generatedNpc && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#cbd5e1' }}>
                    <div>
                      <strong style={{ color: '#f8fafc', fontSize: '13px' }}>{generatedNpc.fullName}</strong>
                      <span style={{ color: '#94a3b8', marginLeft: '6px' }}>({generatedNpc.role})</span>
                    </div>
                    <div>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>Rasgo:</span> {generatedNpc.trait}
                    </div>
                    <div>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>Secreto:</span> {generatedNpc.secret}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => appendToSceneNotes(`[PNJ] ${generatedNpc.fullName} (${generatedNpc.role})\nRasgo: ${generatedNpc.trait}\nSecreto: ${generatedNpc.secret}`)}
                        className="vtt-brass-btn"
                        style={{ padding: '3px 7px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        📋 Copiar a Notas de Escena
                      </button>

                      {onSaveCharacter && (
                        <button
                          type="button"
                          onClick={() => {
                            onSaveCharacter({
                              id: Date.now() + Math.random(),
                              name: generatedNpc.fullName,
                              entityType: 'human',
                              faction: 'neutral',
                              color: '#b45309',
                              notes: `Rol: ${generatedNpc.role}\nRasgo: ${generatedNpc.trait}\nSecreto: ${generatedNpc.secret}`
                            });
                            alert(`"${generatedNpc.fullName}" añadido a la Enciclopedia de Personajes.`);
                          }}
                          className="vtt-primary-cta"
                          style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Guardar a Personajes
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Generador de Registro de Bolsillos / Cajón */}
              <div style={{
                padding: '14px',
                backgroundColor: '#161a24',
                borderRadius: '8px',
                border: '1px solid #2d3648'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24' }}>
                    🔍 Registro de Bolsillos / Cajón
                  </div>
                  <button
                    type="button"
                    onClick={rollNewLoot}
                    className="vtt-brass-btn"
                    style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    🎲 Tirar Objetos
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '11px', color: '#cbd5e1' }}>
                  {generatedLoot.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#f59e0b' }}>•</span>
                      <span>{item}</span>
                    </div>
                  ))}

                  <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => appendToSceneNotes(`[Objetos encontrados]:\n${generatedLoot.map(item => `• ${item}`).join('\n')}`)}
                      className="vtt-brass-btn"
                      style={{ padding: '3px 7px', fontSize: '10px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      📋 Copiar a Notas de Escena
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MasterNotesDrawer;
