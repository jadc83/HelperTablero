import { useState } from 'react';
import {
  Map,
  Trash2,
  Plus,
  Grip,
  Check,
  X,
  Pencil,
  ChevronUp,
  ChevronDown,
  Save,
  Upload,
  Scroll
} from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';

const ScenesManagerTab = ({
  scenes = [],
  activeSceneId,
  onSelectScene,
  onCreateNewScene,
  onRenameScene,
  onDeleteScene,
  onDeleteAllScenes,
  onMoveSceneOrder,
  onReorderScenes,
  openMapCreator,
  onClose,
  onSaveAdventure,
  onImportCampaign,
  onConcludeAdventure,
  onOpenSaveModal,
  onOpenConcludeModal,
  notify
}) => {
  const [newSceneTitle, setNewSceneTitle] = useState('');
  const [draggedSceneIndex, setDraggedSceneIndex] = useState(null);
  const [dragOverSceneIndex, setDragOverSceneIndex] = useState(null);
  const [editingSceneId, setEditingSceneId] = useState(null);
  const [editingSceneName, setEditingSceneName] = useState('');
  const [confirmDeleteSceneId, setConfirmDeleteSceneId] = useState(null);
  const confirm = useConfirm();

  const handleStartRename = (sc) => {
    setEditingSceneId(sc.id);
    setEditingSceneName(sc.name);
  };

  const handleSaveRename = (sceneId) => {
    if (editingSceneName.trim() && onRenameScene) {
      onRenameScene(sceneId, editingSceneName.trim());
      notify('Escena renombrada');
    }
    setEditingSceneId(null);
  };

  const handleDeleteAll = async () => {
    if (!onDeleteAllScenes) return;
    const ok = await confirm({
      title: 'Eliminar todas las escenas',
      message: `¿Seguro que quieres borrar todas las escenas (${scenes.length}) de esta crónica?`,
      confirmLabel: 'Borrar todas',
      tone: 'danger'
    });
    if (ok) {
      onDeleteAllScenes();
      notify('Todas las escenas han sido eliminadas');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflow: 'hidden' }}>
      <div className="vtt-wood-panel" style={{ padding: '12px 14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="vtt-gothic-title" style={{ fontSize: '13px', color: 'var(--vtt-accent-amber)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Map size={14} strokeWidth={2.2} style={{ color: 'var(--vtt-accent-amber)' }} />
            <span>Selector de Escenas y Planos ({scenes.length})</span>
          </div>

          {onDeleteAllScenes && (
            <button
              type="button"
              onClick={handleDeleteAll}
              className="vtt-icon-tool-btn"
              style={{ padding: '4px 6px', color: 'var(--vtt-accent-red)', borderColor: 'var(--vtt-danger-border)' }}
              title="Borrar todas las escenas"
            >
              <Trash2 size={13} strokeWidth={2.2} />
            </button>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newSceneTitle.trim() || !onCreateNewScene) return;
            onCreateNewScene(newSceneTitle.trim());
            setNewSceneTitle('');
            notify('Nueva escena creada y activada');
          }}
          style={{ display: 'flex', gap: '6px' }}
        >
          <input
            type="text"
            value={newSceneTitle}
            onChange={(e) => setNewSceneTitle(e.target.value)}
            placeholder="Nombre de nueva escena (ej. Cripta Piso 2)..."
            className="vtt-dossier-input"
            style={{ flex: 1 }}
          />
          <button type="submit" className="vtt-brass-plate-btn" style={{ padding: '6px 14px' }}>
            <Plus size={13} strokeWidth={2.4} />
            <span>Crear Escena</span>
          </button>
        </form>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '2px' }}>
          {scenes.map((sc, idx) => {
            const isCurrent = sc.id === activeSceneId;
            const isDragOver = dragOverSceneIndex === idx && draggedSceneIndex !== idx;
            return (
              <div
                key={sc.id}
                draggable={editingSceneId !== sc.id}
                onClick={() => {
                  if (editingSceneId === sc.id) return;
                  if (!isCurrent && onSelectScene) onSelectScene(sc.id);
                }}
                onDragStart={(e) => {
                  if (editingSceneId === sc.id) {
                    e.preventDefault();
                    return;
                  }
                  setDraggedSceneIndex(idx);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverSceneIndex !== idx) setDragOverSceneIndex(idx);
                }}
                onDragLeave={() => {
                  if (dragOverSceneIndex === idx) setDragOverSceneIndex(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedSceneIndex !== null && draggedSceneIndex !== idx && onReorderScenes) {
                    onReorderScenes(draggedSceneIndex, idx);
                    notify('Orden de escenas actualizado');
                  }
                  setDraggedSceneIndex(null);
                  setDragOverSceneIndex(null);
                }}
                onDragEnd={() => {
                  setDraggedSceneIndex(null);
                  setDragOverSceneIndex(null);
                }}
                className={`vtt-scene-dossier-card ${isCurrent ? 'vtt-scene-dossier-card-active' : ''}`}
                style={{
                  borderStyle: isDragOver ? 'dashed' : 'solid',
                  borderColor: isDragOver ? '#38bdf8' : undefined,
                  opacity: draggedSceneIndex === idx ? 0.45 : 1,
                  cursor: editingSceneId === sc.id ? 'default' : isCurrent ? 'default' : 'pointer'
                }}
                title={
                  editingSceneId === sc.id
                    ? ''
                    : isCurrent
                    ? 'Escena activa (arrastra para reordenar)'
                    : 'Haz clic para activar esta escena'
                }
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', overflow: 'hidden' }}>
                  <span
                    style={{
                      color: isCurrent ? 'var(--vtt-accent-amber)' : 'var(--vtt-text-dim)',
                      display: 'inline-flex',
                      cursor: editingSceneId === sc.id ? 'default' : 'grab',
                      userSelect: 'none',
                      padding: '2px'
                    }}
                    title="Arrastrar para ordenar escena"
                  >
                    <Grip size={12} strokeWidth={2.2} />
                  </span>

                  <span style={{
                    padding: '1px 6px',
                    borderRadius: '4px',
                    background: isCurrent ? 'var(--vtt-badge-active-bg)' : 'var(--vtt-bg-inset)',
                    color: isCurrent ? 'var(--vtt-badge-active-text)' : 'var(--vtt-text-muted)',
                    fontWeight: 800,
                    fontSize: '11px',
                    fontFamily: 'ui-monospace, monospace',
                    border: isCurrent ? '1px solid var(--vtt-badge-active-border)' : '1px solid var(--vtt-border)',
                    boxShadow: isCurrent ? '0 1px 4px rgba(0,0,0,0.25)' : 'none'
                  }}>
                    {idx + 1}
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {editingSceneId === sc.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingSceneName}
                            onChange={(e) => setEditingSceneName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveRename(sc.id);
                              } else if (e.key === 'Escape') {
                                setEditingSceneId(null);
                              }
                            }}
                            autoFocus
                            className="vtt-dossier-input"
                            style={{ padding: '2px 6px', fontSize: '11px', maxWidth: '140px' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(sc.id)}
                            className="vtt-icon-tool-btn"
                            style={{ color: 'var(--vtt-accent-green)' }}
                            title="Guardar nombre"
                          >
                            <Check size={12} strokeWidth={2.4} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSceneId(null)}
                            className="vtt-icon-tool-btn"
                            style={{ color: 'var(--vtt-text-muted)' }}
                            title="Cancelar"
                          >
                            <X size={12} strokeWidth={2.4} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span
                            onDoubleClick={() => handleStartRename(sc)}
                            style={{
                              fontWeight: 700,
                              fontFamily: "'Cinzel', Georgia, serif",
                              color: isCurrent ? 'var(--vtt-text-strong)' : 'var(--vtt-text)',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              fontSize: '13px',
                              letterSpacing: '0.03em'
                            }}
                            title="Doble clic para cambiar nombre"
                          >
                            {sc.name}
                          </span>
                          {onRenameScene && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartRename(sc);
                              }}
                              className="vtt-icon-tool-btn"
                              title="Cambiar nombre a la escena"
                            >
                              <Pencil size={11} strokeWidth={2.2} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    <span style={{ fontSize: '10px', color: isCurrent ? 'var(--vtt-accent-amber-soft)' : 'var(--vtt-text-muted)', marginTop: '1px' }}>
                      {(sc.maps || []).length} elem. mapa • {(sc.tokens || []).length} fichas
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                  {onMoveSceneOrder && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '3px' }}>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveSceneOrder(idx, 'up');
                        }}
                        className="vtt-icon-tool-btn"
                        style={{ opacity: idx === 0 ? 0.3 : 1, cursor: idx === 0 ? 'default' : 'pointer', padding: '2px 4px' }}
                        title="Subir escena"
                      >
                        <ChevronUp size={11} strokeWidth={2.4} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === scenes.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveSceneOrder(idx, 'down');
                        }}
                        className="vtt-icon-tool-btn"
                        style={{ opacity: idx === scenes.length - 1 ? 0.3 : 1, cursor: idx === scenes.length - 1 ? 'default' : 'pointer', padding: '2px 4px' }}
                        title="Bajar escena"
                      >
                        <ChevronDown size={11} strokeWidth={2.4} />
                      </button>
                    </div>
                  )}
                  {openMapCreator && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isCurrent && onSelectScene) onSelectScene(sc.id);
                        if (onClose) onClose();
                        openMapCreator(sc.id);
                      }}
                      className="vtt-icon-tool-btn"
                      style={{ color: 'var(--vtt-accent-amber)', padding: '4px 6px' }}
                      title={`Editar plano de "${sc.name}" en el Creador de Mapas`}
                    >
                      <Map size={12} strokeWidth={2.2} />
                    </button>
                  )}
                  {confirmDeleteSceneId === sc.id ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: 'var(--vtt-accent-red-bg)',
                        border: '1px solid var(--vtt-danger-border)',
                        borderRadius: '5px',
                        padding: '2px 5px'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span style={{ fontSize: '9.5px', color: 'var(--vtt-accent-red-soft)', fontWeight: 700 }}>
                        ¿Borrar?
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteScene(sc.id);
                          setConfirmDeleteSceneId(null);
                        }}
                        style={{
                          background: '#dc2626',
                          border: 'none',
                          color: '#ffffff',
                          borderRadius: '3px',
                          padding: '1px 5px',
                          fontSize: '9.5px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title={`Confirmar eliminación definitiva de "${sc.name}"`}
                      >
                        Sí
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteSceneId(null);
                        }}
                        style={{
                          background: 'var(--vtt-btn-bg)',
                          border: '1px solid var(--vtt-btn-border)',
                          color: 'var(--vtt-btn-text)',
                          borderRadius: '3px',
                          padding: '1px 5px',
                          fontSize: '9.5px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        title="Cancelar borrado"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    onDeleteScene && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteSceneId(sc.id);
                        }}
                        className="vtt-icon-tool-btn"
                        style={{ color: 'var(--vtt-accent-red)', padding: '4px 6px' }}
                        title={`Eliminar escena "${sc.name}"`}
                      >
                        <Trash2 size={11} strokeWidth={2.2} />
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--vtt-border-subtle)', marginTop: '6px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {onSaveAdventure && (
              <button
                type="button"
                onClick={onOpenSaveModal}
                className="vtt-brass-plate-btn"
                title="Guardar la aventura completa con todas las escenas, mapas, fichas y estado"
              >
                <Save size={13} strokeWidth={2.2} />
                <span>Guardar Aventura</span>
              </button>
            )}

            {onImportCampaign && (
              <button
                type="button"
                onClick={onImportCampaign}
                className="vtt-brass-plate-btn"
                title="Cargar e importar una aventura guardada previamente en formato .json"
              >
                <Upload size={13} strokeWidth={2.2} />
                <span>Cargar Aventura</span>
              </button>
            )}

            {onConcludeAdventure && (
              <button
                type="button"
                onClick={onOpenConcludeModal}
                className="vtt-conclude-plate-btn"
                title="Concluir y sellar la crónica actual de forma inmutable, archivándola y dejando la mesa limpia"
              >
                <Scroll size={13} strokeWidth={2.2} />
                <span>Concluir Aventura</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenesManagerTab;
