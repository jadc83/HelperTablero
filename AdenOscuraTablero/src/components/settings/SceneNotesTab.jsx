import { useState } from 'react';
import { MapPin, Pencil, Trash2, Check, X, Lock, Unlock } from 'lucide-react';

const SceneNotesTab = ({
  scenes = [],
  activeSceneId,
  maps = [],
  selectedNoteSceneId,
  setSelectedNoteSceneId,
  sceneNotes = {},
  onUpdateSceneNotes,
  campaignNotes = '',
  onUpdateCampaignNotes,
  onStartPlaceClue,
  onUpdateBoardClue,
  onRemoveBoardClue
}) => {
  const [newClueTitle, setNewClueTitle] = useState('');
  const [newClueContent, setNewClueContent] = useState('');
  const [editingClueId, setEditingClueId] = useState(null);
  const [editClueTitle, setEditClueTitle] = useState('');
  const [editClueContent, setEditClueContent] = useState('');

  const targetSceneId = selectedNoteSceneId || activeSceneId || (scenes[0] && scenes[0].id) || '';
  const currentNoteData = sceneNotes[targetSceneId] || { notes: '', clues: [] };
  const clues = currentNoteData.clues || [];

  const targetSceneMaps = targetSceneId === activeSceneId
    ? maps
    : (scenes.find(sc => sc.id === targetSceneId)?.maps || []);

  const findPlacedBoardClue = (clueId) =>
    targetSceneMaps.find(m => m.type === 'note' && m.clueId === clueId) || null;

  const handleCreateAndPlaceClue = (e) => {
    e.preventDefault();
    const titleTrimmed = newClueTitle.trim();
    const contentTrimmed = newClueContent.trim();
    if (!titleTrimmed && !contentTrimmed) return;

    const finalTitle = titleTrimmed || contentTrimmed.slice(0, 42);
    const newClue = {
      id: 'clue_' + Date.now() + Math.random().toString(36).slice(2, 5),
      title: finalTitle,
      text: finalTitle,
      content: contentTrimmed,
      isLocked: true,
      completed: false
    };

    const newClues = [...clues, newClue];
    if (onUpdateSceneNotes) {
      onUpdateSceneNotes(targetSceneId, { ...currentNoteData, clues: newClues });
    }
    setNewClueTitle('');
    setNewClueContent('');

    if (onStartPlaceClue) {
      onStartPlaceClue(newClue, targetSceneId);
    }
  };

  const handleSaveClueEdit = (clue) => {
    const nextTitle = editClueTitle.trim() || clue.title || clue.text || 'Pista';
    const nextContent = editClueContent.trim();
    const updated = clues.map(c =>
      c.id === clue.id
        ? { ...c, title: nextTitle, text: nextTitle, content: nextContent }
        : c
    );

    if (onUpdateSceneNotes) {
      onUpdateSceneNotes(targetSceneId, { ...currentNoteData, clues: updated });
    }
    if (onUpdateBoardClue) {
      onUpdateBoardClue(clue.id, { title: nextTitle, name: nextTitle, content: nextContent }, targetSceneId);
    }
    setEditingClueId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '2px' }}>
      {/* Crónica Global de Campaña */}
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
            rows={2}
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

      {/* Selector de Escena */}
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
            onChange={(e) => {
              setSelectedNoteSceneId(e.target.value);
              setEditingClueId(null);
            }}
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

      {/* Pistas interactivas en el tablero */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        backgroundColor: 'var(--vtt-bg-card)',
        border: '1px solid var(--vtt-border)',
        borderRadius: '8px',
        padding: '10px 12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="vtt-context-section-label" style={{ color: 'var(--vtt-text-strong)' }}>
            Pistas de la Sala
          </span>
          <span style={{ fontSize: '10px', color: 'var(--vtt-text-muted)' }}>
            {clues.filter(c => c.completed).length} / {clues.length} descubiertas
          </span>
        </div>

        <form
          onSubmit={handleCreateAndPlaceClue}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            padding: '8px',
            borderRadius: '6px',
            backgroundColor: 'var(--vtt-bg-inset)',
            border: '1px solid var(--vtt-border-subtle)'
          }}
        >
          <input
            type="text"
            value={newClueTitle}
            onChange={(e) => setNewClueTitle(e.target.value)}
            placeholder="Título de la pista (ej: Diario bajo la alfombra...)"
            style={{
              width: '100%',
              padding: '6px 8px',
              backgroundColor: 'var(--vtt-input-bg)',
              border: '1px solid var(--vtt-input-border)',
              color: 'var(--vtt-input-text)',
              borderRadius: '5px',
              fontSize: '11.5px',
              fontWeight: 600
            }}
          />
          <textarea
            value={newClueContent}
            onChange={(e) => setNewClueContent(e.target.value)}
            placeholder="Texto relacionado con la pista que se mostrará al abrirla en el tablero..."
            rows={2}
            style={{
              width: '100%',
              padding: '6px 8px',
              backgroundColor: 'var(--vtt-input-bg)',
              border: '1px solid var(--vtt-input-border)',
              color: 'var(--vtt-input-text)',
              borderRadius: '5px',
              fontSize: '11.5px',
              resize: 'vertical',
              lineHeight: '1.45'
            }}
          />
          <button
            type="submit"
            disabled={!newClueTitle.trim() && !newClueContent.trim()}
            className="vtt-primary-cta"
            style={{
              padding: '6px 10px',
              fontSize: '11.5px',
              borderRadius: '5px',
              cursor: (!newClueTitle.trim() && !newClueContent.trim()) ? 'not-allowed' : 'pointer',
              opacity: (!newClueTitle.trim() && !newClueContent.trim()) ? 0.5 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            title="Crea esta pista y elige su posición haciendo clic en el tablero"
          >
            <MapPin size={12} strokeWidth={2.3} /> Crear y colocar en el tablero
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
          {clues.map(clue => {
            const clueTitle = clue.title || clue.text || 'Pista';
            const clueContent = clue.content || '';
            const placedBoardClue = findPlacedBoardClue(clue.id);
            const placedOnBoard = Boolean(placedBoardClue);
            const isClueLocked = placedBoardClue ? Boolean(placedBoardClue.isLocked) : clue.isLocked !== false;
            const isEditing = editingClueId === clue.id;

            return (
              <div
                key={clue.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '7px 9px',
                  backgroundColor: clue.completed ? 'var(--vtt-accent-green-bg)' : 'var(--vtt-bg-inset)',
                  border: clue.completed ? '1px solid var(--vtt-accent-green-border)' : '1px solid var(--vtt-border-subtle)',
                  borderRadius: '6px',
                  gap: '5px'
                }}
              >
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <input
                      type="text"
                      value={editClueTitle}
                      onChange={(e) => setEditClueTitle(e.target.value)}
                      placeholder="Título de la pista..."
                      style={{
                        width: '100%',
                        padding: '5px 7px',
                        backgroundColor: 'var(--vtt-input-bg)',
                        border: '1px solid var(--vtt-input-border)',
                        color: 'var(--vtt-input-text)',
                        borderRadius: '4px',
                        fontSize: '11.5px',
                        fontWeight: 600
                      }}
                    />
                    <textarea
                      value={editClueContent}
                      onChange={(e) => setEditClueContent(e.target.value)}
                      placeholder="Texto de la pista..."
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '5px 7px',
                        backgroundColor: 'var(--vtt-input-bg)',
                        border: '1px solid var(--vtt-input-border)',
                        color: 'var(--vtt-input-text)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        resize: 'vertical',
                        lineHeight: '1.45'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                      <button
                        type="button"
                        onClick={() => handleSaveClueEdit(clue)}
                        className="vtt-primary-cta"
                        style={{ padding: '4px 9px', fontSize: '10.5px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Check size={11} strokeWidth={2.4} /> Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingClueId(null)}
                        className="vtt-brass-btn"
                        style={{ padding: '4px 8px', fontSize: '10.5px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <X size={11} strokeWidth={2.4} /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <label
                        style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, minWidth: 0, cursor: 'pointer' }}
                        title={clue.completed ? 'Visible en la pantalla de jugadores (desmarca para ocultarla)' : 'Oculta en la pantalla de jugadores (marca para mostrarla)'}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(clue.completed)}
                          onChange={() => {
                            const nextCompleted = !clue.completed;
                            const updated = clues.map(c => c.id === clue.id ? { ...c, completed: nextCompleted } : c);
                            if (onUpdateSceneNotes) onUpdateSceneNotes(targetSceneId, { ...currentNoteData, clues: updated });
                            if (onUpdateBoardClue) {
                              onUpdateBoardClue(clue.id, { isHidden: !nextCompleted }, targetSceneId);
                            }
                          }}
                        />
                        <span style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: clue.completed ? 'var(--vtt-accent-green-strong)' : 'var(--vtt-text-strong)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {clueTitle}
                        </span>
                      </label>

                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '999px',
                        whiteSpace: 'nowrap',
                        color: placedOnBoard ? 'var(--vtt-accent-green-strong)' : 'var(--vtt-accent-amber)',
                        backgroundColor: placedOnBoard ? 'var(--vtt-accent-green-bg)' : 'var(--vtt-accent-amber-bg)',
                        border: placedOnBoard ? '1px solid var(--vtt-accent-green-border)' : '1px solid var(--vtt-border)'
                      }}>
                        {placedOnBoard ? 'En tablero' : 'Sin colocar'}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => {
                            const nextLocked = !isClueLocked;
                            const updated = clues.map(c => c.id === clue.id ? { ...c, isLocked: nextLocked } : c);
                            if (onUpdateSceneNotes) {
                              onUpdateSceneNotes(targetSceneId, { ...currentNoteData, clues: updated });
                            }
                            if (onUpdateBoardClue) {
                              onUpdateBoardClue(clue.id, { isLocked: nextLocked }, targetSceneId);
                            }
                          }}
                          className="vtt-brass-btn"
                          style={{
                            padding: '3px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            color: isClueLocked ? 'var(--vtt-accent-amber)' : 'var(--vtt-text-muted)',
                            borderColor: isClueLocked ? 'var(--vtt-gold)' : 'var(--vtt-border)',
                            background: isClueLocked ? 'var(--vtt-accent-amber-bg)' : undefined
                          }}
                          title={isClueLocked ? 'Posición bloqueada en el tablero (clic para desbloquear y poder moverla)' : 'Posición desbloqueada (clic para bloquear y evitar moverla por error)'}
                          aria-label={isClueLocked ? 'Desbloquear pista en el tablero' : 'Bloquear pista en el tablero'}
                        >
                          {isClueLocked ? <Lock size={11} strokeWidth={2.3} /> : <Unlock size={11} strokeWidth={2.3} />}
                        </button>
                        {onStartPlaceClue && (
                          <button
                            type="button"
                            onClick={() => onStartPlaceClue({ ...clue, title: clueTitle, content: clueContent, isLocked: isClueLocked }, targetSceneId)}
                            className="vtt-brass-btn"
                            style={{ padding: '3px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            title={placedOnBoard ? 'Cambiar posición de esta pista haciendo clic en el tablero' : 'Colocar esta pista en el tablero'}
                          >
                            <MapPin size={11} strokeWidth={2.3} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingClueId(clue.id);
                            setEditClueTitle(clueTitle);
                            setEditClueContent(clueContent);
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--vtt-text-muted)', cursor: 'pointer', padding: '3px 4px', display: 'inline-flex', alignItems: 'center' }}
                          title="Editar título y texto de la pista"
                        >
                          <Pencil size={11} strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = clues.filter(c => c.id !== clue.id);
                            if (onUpdateSceneNotes) onUpdateSceneNotes(targetSceneId, { ...currentNoteData, clues: filtered });
                            if (onRemoveBoardClue) onRemoveBoardClue(clue.id, targetSceneId);
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--vtt-accent-red)', cursor: 'pointer', padding: '3px 4px', display: 'inline-flex', alignItems: 'center' }}
                          title="Eliminar pista del listado y del tablero"
                        >
                          <Trash2 size={11} strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>

                    {clueContent && (
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--vtt-text-muted)',
                        lineHeight: '1.45',
                        whiteSpace: 'pre-wrap',
                        paddingLeft: '20px'
                      }}>
                        {clueContent}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {clues.length === 0 && (
            <div style={{ fontSize: '11px', color: 'var(--vtt-text-dim)', fontStyle: 'italic', padding: '4px 0' }}>
              Sin pistas registradas para esta sala. Crea una arriba para colocarla en el tablero.
            </div>
          )}
        </div>
      </div>

      {/* Detalles y Ambientación de la Escena */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: '150px',
        backgroundColor: 'var(--vtt-bg-card)',
        border: '1px solid var(--vtt-border)',
        borderRadius: '8px',
        padding: '10px 12px',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="vtt-context-section-label" style={{ color: 'var(--vtt-text-strong)' }}>
            Detalles y Secretos de la Escena
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
            minHeight: '120px',
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
