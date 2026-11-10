import { useState, useEffect, useCallback } from 'react';
import { X, FileText, Lock, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useConfirm } from '../hooks/useConfirm';

const ObjectNotesModal = ({
  isOpen,
  onClose,
  objectItem,
  handouts = [],
  onUpdateObject,
  onProjectHandout,
  onRemoveObject
}) => {
  const [name, setName] = useState(objectItem?.name || 'Objeto');
  const [notes, setNotes] = useState(objectItem?.notes || '');
  const [isLockedWithKey, setIsLockedWithKey] = useState(Boolean(objectItem?.isLockedWithKey));
  const [lockDifficulty, setLockDifficulty] = useState(objectItem?.lockDifficulty || '40');
  const [isTrapped, setIsTrapped] = useState(Boolean(objectItem?.isTrapped));
  const [trapDetails, setTrapDetails] = useState(objectItem?.trapDetails || '');
  const [selectedHandoutId, setSelectedHandoutId] = useState(objectItem?.linkedHandoutId || '');
  const [customClueText, setCustomClueText] = useState(objectItem?.customClueText || '');
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'clue'
  const [prevObjectItem, setPrevObjectItem] = useState(objectItem);
  const confirm = useConfirm();

  if (objectItem !== prevObjectItem) {
    setPrevObjectItem(objectItem);
    if (objectItem) {
      setName(objectItem.name || 'Objeto');
      setNotes(objectItem.notes || '');
      setIsLockedWithKey(Boolean(objectItem.isLockedWithKey));
      setLockDifficulty(objectItem.lockDifficulty || '40');
      setIsTrapped(Boolean(objectItem.isTrapped));
      setTrapDetails(objectItem.trapDetails || '');
      setSelectedHandoutId(objectItem.linkedHandoutId || '');
      setCustomClueText(objectItem.customClueText || '');
    }
  }

  const isDirty = Boolean(objectItem) && (
    name !== (objectItem.name || 'Objeto') ||
    notes !== (objectItem.notes || '') ||
    isLockedWithKey !== Boolean(objectItem.isLockedWithKey) ||
    lockDifficulty !== (objectItem.lockDifficulty || '40') ||
    isTrapped !== Boolean(objectItem.isTrapped) ||
    trapDetails !== (objectItem.trapDetails || '') ||
    selectedHandoutId !== (objectItem.linkedHandoutId || '') ||
    customClueText !== (objectItem.customClueText || '')
  );

  const handleAttemptClose = useCallback(async () => {
    if (isDirty) {
      const ok = await confirm({
        title: 'Descartar cambios',
        message: 'Tienes cambios sin guardar en las notas de este objeto. ¿Salir sin guardar?',
        confirmLabel: 'Descartar',
        tone: 'warning'
      });
      if (!ok) return;
    }
    onClose();
  }, [isDirty, confirm, onClose]);

  useEffect(() => {
    if (!isOpen || !objectItem) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleAttemptClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, objectItem, handleAttemptClose]);

  if (!isOpen || !objectItem) return null;

  const handleSave = () => {
    if (onUpdateObject) {
      onUpdateObject(objectItem.id, {
        name: name.trim() || objectItem.name,
        notes,
        isLockedWithKey,
        lockDifficulty,
        isTrapped,
        trapDetails,
        linkedHandoutId: selectedHandoutId,
        customClueText
      });
    }
    onClose();
  };

  const handleProjectClue = () => {
    if (!onProjectHandout) return;

    if (selectedHandoutId) {
      const found = handouts.find(h => h.id === selectedHandoutId);
      if (found) {
        onProjectHandout(found);
        return;
      }
    }

    if (customClueText.trim()) {
      onProjectHandout({
        id: 'clue_' + objectItem.id,
        type: 'note',
        title: `Pista: ${name}`,
        content: customClueText.trim()
      });
    }
  };

  return createPortal(
    <div
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) handleAttemptClose();
      }}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(3px)',
        zIndex: 105000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          width: '540px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          backgroundColor: '#131620',
          border: '1px solid #384257',
          borderRadius: '12px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Cabecera */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid #262c3a',
          backgroundColor: '#181c28',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>{objectItem.icon || '📦'}</span>
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  background: 'transparent',
                  border: '1px solid transparent',
                  borderBottom: '1px dashed #475569',
                  color: '#f8fafc',
                  fontSize: '15px',
                  fontWeight: 700,
                  outline: 'none',
                  padding: '2px 4px',
                  width: '260px'
                }}
                placeholder="Nombre del objeto"
              />
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                Notas secretas del Máster y Pistas para jugadores
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAttemptClose}
            className="vtt-brass-btn"
            style={{ width: '30px', height: '30px', padding: 0, borderRadius: '6px', cursor: 'pointer' }}
            title="Cerrar (Esc)"
          >
            <X size={15} strokeWidth={2.4} />
          </button>
        </div>

        {/* Pestañas */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #262c3a',
          backgroundColor: '#0f121a'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '12px',
              fontWeight: 700,
              border: 'none',
              borderBottom: activeTab === 'notes' ? '2px solid #f59e0b' : '2px solid transparent',
              background: activeTab === 'notes' ? '#141822' : 'transparent',
              color: activeTab === 'notes' ? '#fbbf24' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><FileText size={13} strokeWidth={2.2} /> Notas Secretas &amp; Trampas</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clue')}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: '12px',
              fontWeight: 700,
              border: 'none',
              borderBottom: activeTab === 'clue' ? '2px solid #f59e0b' : '2px solid transparent',
              background: activeTab === 'clue' ? '#141822' : 'transparent',
              color: activeTab === 'clue' ? '#fbbf24' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            Pista / Documento Vinculado
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {activeTab === 'notes' && (
            <>
              {/* Contenido / Botín secreto */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
                  Contenido Secreto, Botín o Descripción (Solo visible para el Máster):
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Contiene 45 libras en billetes antiguos, una carta manchada de sangre dirigida al inspector y un frasco de láudano..."
                  style={{
                    width: '100%',
                    height: '110px',
                    backgroundColor: '#0c0e14',
                    border: '1px solid #283042',
                    borderRadius: '7px',
                    padding: '8px 10px',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    lineHeight: '1.5'
                  }}
                />
              </div>

              {/* Trampas y Cerraduras */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Cerradura */}
                <div style={{
                  padding: '10px',
                  backgroundColor: '#0d1017',
                  borderRadius: '8px',
                  border: isLockedWithKey ? '1px solid #f59e0b' : '1px solid #232938'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
                    <input
                      type="checkbox"
                      checked={isLockedWithKey}
                      onChange={(e) => setIsLockedWithKey(e.target.checked)}
                    />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><Lock size={13} strokeWidth={2.2} /> Cerrado con llave</span>
                  </label>
                  {isLockedWithKey && (
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>Dificultad de ganzúa:</span>
                      <input
                        type="text"
                        value={lockDifficulty}
                        onChange={(e) => setLockDifficulty(e.target.value)}
                        placeholder="Ej: Cerrajería 40%"
                        style={{
                          width: '100%',
                          marginTop: '3px',
                          padding: '4px 7px',
                          backgroundColor: '#161a24',
                          border: '1px solid #2f374a',
                          color: '#e2e8f0',
                          borderRadius: '5px',
                          fontSize: '11px'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Trampa */}
                <div style={{
                  padding: '10px',
                  backgroundColor: '#0d1017',
                  borderRadius: '8px',
                  border: isTrapped ? '1px solid #ef4444' : '1px solid #232938'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: isTrapped ? '#fca5a5' : '#f8fafc' }}>
                    <input
                      type="checkbox"
                      checked={isTrapped}
                      onChange={(e) => setIsTrapped(e.target.checked)}
                    />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}><AlertTriangle size={13} strokeWidth={2.2} /> Con trampa</span>
                  </label>
                  {isTrapped && (
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>Efecto y detección:</span>
                      <input
                        type="text"
                        value={trapDetails}
                        onChange={(e) => setTrapDetails(e.target.value)}
                        placeholder="Ej: Aguja con veneno (Percepción 50, 1d6 daño)"
                        style={{
                          width: '100%',
                          marginTop: '3px',
                          padding: '4px 7px',
                          backgroundColor: '#161a24',
                          border: '1px solid #2f374a',
                          color: '#e2e8f0',
                          borderRadius: '5px',
                          fontSize: '11px'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'clue' && (
            <>
              {/* Vincular Handout existente */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
                  Vincular Documento / Imagen existente (Handout de la Campaña):
                </label>
                <select
                  value={selectedHandoutId}
                  onChange={(e) => setSelectedHandoutId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#0c0e14',
                    border: '1px solid #283042',
                    borderRadius: '7px',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">-- Ningún Handout vinculado --</option>
                  {handouts.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.title || 'Documento sin título'} ({h.type === 'image' ? 'Imagen' : 'Texto'})
                    </option>
                  ))}
                </select>
              </div>

              {/* O redactar un texto de pista directo */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
                  O redactar Pista / Nota manuscrita rápida:
                </label>
                <textarea
                  value={customClueText}
                  onChange={(e) => setCustomClueText(e.target.value)}
                  placeholder="Texto que verán los jugadores en grande al proyectar esta pista..."
                  style={{
                    width: '100%',
                    height: '90px',
                    backgroundColor: '#0c0e14',
                    border: '1px solid #283042',
                    borderRadius: '7px',
                    padding: '8px 10px',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    lineHeight: '1.5'
                  }}
                />
              </div>

              {/* Botón de proyección instantánea */}
              {(selectedHandoutId || customClueText.trim()) && (
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  borderRadius: '8px',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div style={{ fontSize: '11px', color: '#fbbf24' }}>
                    Esta pista se enviará a pantalla completa al monitor de los jugadores.
                  </div>
                  <button
                    type="button"
                    onClick={handleProjectClue}
                    className="vtt-primary-cta"
                    style={{ padding: '6px 14px', fontSize: '11px', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Proyectar a Jugadores
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pie de modal */}
        <div style={{
          padding: '12px 18px',
          borderTop: '1px solid #262c3a',
          backgroundColor: '#181c28',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {onRemoveObject && (
            <button
              type="button"
              onClick={async () => {
                const ok = await confirm({
                  title: 'Retirar objeto de la mesa',
                  message: `¿Eliminar "${name}" de la mesa?`,
                  confirmLabel: 'Retirar',
                  tone: 'danger'
                });
                if (ok) {
                  onRemoveObject(objectItem.id);
                  onClose();
                }
              }}
              className="vtt-btn-danger"
              style={{
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Retirar Objeto
            </button>
          )}

          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={handleAttemptClose}
              className="vtt-brass-btn"
              style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="vtt-primary-cta"
              style={{ padding: '6px 18px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ObjectNotesModal;
