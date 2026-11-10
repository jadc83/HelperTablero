import { useState } from 'react';
import { X, Plus } from 'lucide-react';

const SceneNotesTab = ({
  scenes = [],
  activeSceneId,
  selectedNoteSceneId,
  setSelectedNoteSceneId,
  sceneNotes = {},
  onUpdateSceneNotes,
  campaignNotes = '',
  onUpdateCampaignNotes
}) => {
  const [newClueText, setNewClueText] = useState('');
  const targetSceneId = selectedNoteSceneId || activeSceneId || (scenes[0] && scenes[0].id) || '';
  const currentNoteData = sceneNotes[targetSceneId] || { notes: '', clues: [] };
  const clues = currentNoteData.clues || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '2px' }}>
      {/* Notas Generales de Campaña */}
      {onUpdateCampaignNotes && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          backgroundColor: '#121620',
          border: '1px solid #283144',
          borderRadius: '8px',
          padding: '10px 12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="vtt-context-section-label" style={{ color: '#fbbf24' }}>
              Crónica Global de la Campaña
            </span>
            <span style={{ fontSize: '10px', color: '#64748b' }}>
              Persistido con la partida
            </span>
          </div>
          <textarea
            value={campaignNotes}
            onChange={(e) => onUpdateCampaignNotes(e.target.value)}
            placeholder="Trama general, PNJs recurrentes, pistas transversales entre escenarios..."
            rows={3}
            style={{
              width: '100%',
              backgroundColor: '#0a0d14',
              border: '1px solid #232b3b',
              borderRadius: '6px',
              padding: '8px 10px',
              color: '#e2e8f0',
              fontSize: '12px',
              resize: 'vertical',
              lineHeight: '1.5'
            }}
          />
        </div>
      )}

      {/* Selector de Escena para las Notas */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        backgroundColor: '#121620',
        border: '1px solid #283144',
        borderRadius: '8px',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 700, whiteSpace: 'nowrap' }}>
            Escena:
          </span>
          <select
            value={targetSceneId}
            onChange={(e) => setSelectedNoteSceneId(e.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '5px 8px',
              borderRadius: '5px',
              backgroundColor: '#0a0d14',
              border: '1px solid #3b4255',
              color: '#f8fafc',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {scenes.map(sc => (
              <option key={sc.id} value={sc.id}>
                {sc.name}{sc.id === activeSceneId ? ' (En mesa activa)' : ''}
              </option>
            ))}
          </select>
        </div>

        {targetSceneId === activeSceneId && (
          <span style={{
            fontSize: '10px',
            color: '#34d399',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            padding: '2px 7px',
            borderRadius: '999px',
            fontWeight: 700,
            whiteSpace: 'nowrap'
          }}>
            ● En Mesa
          </span>
        )}
      </div>

      {/* Checklist de Pistas */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        backgroundColor: '#121620',
        border: '1px solid #283144',
        borderRadius: '8px',
        padding: '10px 12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="vtt-context-section-label" style={{ color: '#f8fafc' }}>
            Pistas y Secretos de la Sala
          </span>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
            {clues.filter(c => c.completed).length} / {clues.length} descubiertas
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '140px', overflowY: 'auto' }}>
          {clues.map(clue => (
            <div
              key={clue.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 8px',
                backgroundColor: clue.completed ? 'rgba(16, 185, 129, 0.08)' : '#0d1017',
                border: clue.completed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #232b3b',
                borderRadius: '5px',
                gap: '8px'
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer', overflow: 'hidden' }}>
                <input
                  type="checkbox"
                  checked={Boolean(clue.completed)}
                  onChange={() => {
                    const updated = clues.map(c => c.id === clue.id ? { ...c, completed: !c.completed } : c);
                    if (onUpdateSceneNotes) onUpdateSceneNotes(targetSceneId, { ...currentNoteData, clues: updated });
                  }}
                />
                <span style={{
                  fontSize: '11px',
                  color: clue.completed ? '#94a3b8' : '#e2e8f0',
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
                onClick={() => {
                  const filtered = clues.filter(c => c.id !== clue.id);
                  if (onUpdateSceneNotes) onUpdateSceneNotes(targetSceneId, { ...currentNoteData, clues: filtered });
                }}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px 4px' }}
                title="Eliminar pista"
              >
                <X size={12} strokeWidth={2.4} />
              </button>
            </div>
          ))}

          {clues.length === 0 && (
            <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', padding: '4px 0' }}>
              Sin pistas registradas para esta sala.
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newClueText.trim()) return;
            const newClues = [
              ...clues,
              {
                id: 'clue_' + Date.now() + Math.random().toString(36).slice(2, 5),
                text: newClueText.trim(),
                completed: false
              }
            ];
            if (onUpdateSceneNotes) {
              onUpdateSceneNotes(targetSceneId, { ...currentNoteData, clues: newClues });
            }
            setNewClueText('');
          }}
          style={{ display: 'flex', gap: '6px', marginTop: '4px' }}
        >
          <input
            type="text"
            value={newClueText}
            onChange={(e) => setNewClueText(e.target.value)}
            placeholder="Añadir pista (ej: Diario bajo la alfombra...)"
            style={{
              flex: 1,
              padding: '5px 8px',
              backgroundColor: '#0a0d14',
              border: '1px solid #283144',
              color: '#f8fafc',
              borderRadius: '5px',
              fontSize: '11px'
            }}
          />
          <button
            type="submit"
            className="vtt-brass-btn"
            style={{ padding: '4px 9px', fontSize: '11px', borderRadius: '5px', fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={11} strokeWidth={2.4} /> Añadir
          </button>
        </form>
      </div>

      {/* Cuaderno de Notas Narrativas de la Escena */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: '210px',
        backgroundColor: '#121620',
        border: '1px solid #283144',
        borderRadius: '8px',
        padding: '10px 12px',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="vtt-context-section-label" style={{ color: '#f8fafc' }}>
            Apuntes y Secretos de la Escena
          </span>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
            Guardado automático
          </span>
        </div>
        <textarea
          value={currentNoteData.notes || ''}
          onChange={(e) => {
            if (onUpdateSceneNotes) {
              onUpdateSceneNotes(targetSceneId, {
                ...currentNoteData,
                notes: e.target.value
              });
            }
          }}
          placeholder="Escribe aquí los secretos de la sala, atmósfera, descripciones para leer a los jugadores, tiradas requeridas, trampas..."
          style={{
            width: '100%',
            flex: 1,
            minHeight: '180px',
            backgroundColor: '#0a0d14',
            border: '1px solid #232b3b',
            borderRadius: '6px',
            padding: '10px 12px',
            color: '#e2e8f0',
            fontSize: '12px',
            resize: 'none',
            lineHeight: '1.6'
          }}
        />
      </div>
    </div>
  );
};

export default SceneNotesTab;
