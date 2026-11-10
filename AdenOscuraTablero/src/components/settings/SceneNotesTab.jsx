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
          backgroundColor: 'var(--vtt-bg-card)',
          border: '1px solid var(--vtt-border)',
          borderRadius: '8px',
          padding: '10px 12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="vtt-context-section-label" style={{ color: 'var(--vtt-accent-amber)' }}>
              Crónica Global de la Campaña
            </span>
            <span style={{ fontSize: '10px', color: 'var(--vtt-text-dim)' }}>
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
              backgroundColor: 'var(--vtt-input-bg)',
              border: '1px solid var(--vtt-input-border)',
              borderRadius: '6px',
              padding: '8px 10px',
              color: 'var(--vtt-input-text)',
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
        backgroundColor: 'var(--vtt-bg-card)',
        border: '1px solid var(--vtt-border)',
        borderRadius: '8px',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: '12px', color: 'var(--vtt-accent-amber)', fontWeight: 700, whiteSpace: 'nowrap' }}>
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
              backgroundColor: 'var(--vtt-input-bg)',
              border: '1px solid var(--vtt-input-border)',
              color: 'var(--vtt-input-text)',
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
            color: 'var(--vtt-accent-green)',
            backgroundColor: 'var(--vtt-accent-green-bg)',
            border: '1px solid var(--vtt-accent-green-border)',
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
        backgroundColor: 'var(--vtt-bg-card)',
        border: '1px solid var(--vtt-border)',
        borderRadius: '8px',
        padding: '10px 12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="vtt-context-section-label" style={{ color: 'var(--vtt-text-strong)' }}>
            Pistas y Secretos de la Sala
          </span>
          <span style={{ fontSize: '10px', color: 'var(--vtt-text-muted)' }}>
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
                backgroundColor: clue.completed ? 'var(--vtt-accent-green-bg)' : 'var(--vtt-bg-inset)',
                border: clue.completed ? '1px solid var(--vtt-accent-green-border)' : '1px solid var(--vtt-border-subtle)',
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
                  color: clue.completed ? 'var(--vtt-text-muted)' : 'var(--vtt-text)',
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
                style={{ background: 'transparent', border: 'none', color: 'var(--vtt-text-dim)', cursor: 'pointer', padding: '2px 4px' }}
                title="Eliminar pista"
              >
                <X size={12} strokeWidth={2.4} />
              </button>
            </div>
          ))}

          {clues.length === 0 && (
            <div style={{ fontSize: '11px', color: 'var(--vtt-text-dim)', fontStyle: 'italic', padding: '4px 0' }}>
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
              backgroundColor: 'var(--vtt-input-bg)',
              border: '1px solid var(--vtt-input-border)',
              color: 'var(--vtt-input-text)',
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
        backgroundColor: 'var(--vtt-bg-card)',
        border: '1px solid var(--vtt-border)',
        borderRadius: '8px',
        padding: '10px 12px',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="vtt-context-section-label" style={{ color: 'var(--vtt-text-strong)' }}>
            Apuntes y Secretos de la Escena
          </span>
          <span style={{ fontSize: '10px', color: 'var(--vtt-text-muted)' }}>
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
            backgroundColor: 'var(--vtt-input-bg)',
            border: '1px solid var(--vtt-input-border)',
            borderRadius: '6px',
            padding: '10px 12px',
            color: 'var(--vtt-input-text)',
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
