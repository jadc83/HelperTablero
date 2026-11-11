import {
  Eye,
  EyeOff,
  Captions,
  CaptionsOff,
  Lock,
  Unlock,
  Copy,
  Projector,
  Trash2,
  Pencil,
  Hand,
  Flame,
  Moon,
  Sun,
  LightbulbOff,
  FileText,
  Zap,
  Package,
  DoorClosed,
  AppWindow,
  ScrollText
} from 'lucide-react';
import ContextMenu from '../ui/ContextMenu';
import SliderControl from '../ui/SliderControl';
import {
  getStructureOrientationSizes,
  resizeStructureCentered,
  setStructureRotationCentered
} from '../../utils/fogGeometry';

const MapElementContextMenu = ({
  contextMenu,
  maps,
  tokens = [],
  handouts = [],
  activeTurnTokenId = null,
  isEditingMenu,
  setIsEditingMenu,
  editName,
  setEditName,
  editNotes,
  setEditNotes,
  onClose,
  onToggleMapElementLock,
  onUpdateMapElement,
  onDuplicateMapElement,
  onInspectObject,
  onRemoveMapElement,
  onToggleDoor,
  onToggleWindow,
  onToggleObject,
  onToggleLight,
  onSetAllLights,
  onProjectHandout,
  onPickUpItem,
  onReadNote
}) => {
  if (!contextMenu.visible || !contextMenu.item) return null;

  const activeItem = maps.find(m => m.id === contextMenu.item.id) || contextMenu.item;
  const isHidden = Boolean(activeItem.isHidden);
  const isLocked = Boolean(activeItem.isLocked);
  const isNameVisible = (activeItem.type === 'item' || activeItem.type === 'note')
    ? activeItem.showName !== false
    : activeItem.showName === true;
  const supportsVisibilityAndName = activeItem.type === 'item' || activeItem.type === 'object' || activeItem.type === 'light' || activeItem.type === 'note';

  const headerIcon = activeItem.type === 'door'
    ? <DoorClosed size={15} strokeWidth={2.2} style={{ color: '#d4af37' }} />
    : activeItem.type === 'window'
    ? <AppWindow size={15} strokeWidth={2.2} style={{ color: '#38bdf8' }} />
    : activeItem.type === 'light'
    ? <Flame size={15} strokeWidth={2.2} style={{ color: '#fbbf24' }} />
    : activeItem.type === 'note'
    ? <ScrollText size={15} strokeWidth={2.2} style={{ color: '#fbbf24' }} />
    : <Package size={15} strokeWidth={2.2} style={{ color: '#fbbf24' }} />;

  const headerTitle = activeItem.type === 'door'
    ? 'Control de Puerta'
    : activeItem.type === 'window'
    ? 'Control de Ventana'
    : activeItem.type === 'light'
    ? (activeItem.name || 'Fuente de Luz')
    : activeItem.type === 'note'
    ? (activeItem.title || activeItem.name || 'Pista en el Tablero')
    : activeItem.type === 'item'
    ? (activeItem.name || 'Objeto en el Suelo')
    : (activeItem.name || 'Objeto / Decorado');

  const activeTurnToken = tokens.find(t => t.id === activeTurnTokenId) || null;
  const recipientToken = activeTurnToken || (tokens.length === 1 ? tokens[0] : null);

  return (
    <ContextMenu
      isOpen={true}
      x={contextMenu.x}
      y={contextMenu.y}
      onClose={onClose}
      headerIcon={headerIcon}
      headerTitle={headerTitle}
      headerTitleAttr={activeItem.category ? `${headerTitle} (${activeItem.category})` : headerTitle}
      headerAction={
        supportsVisibilityAndName && onUpdateMapElement && (
          <button
            type="button"
            onClick={() => {
              if (!isEditingMenu) {
                setEditName(activeItem.type === 'note' ? (activeItem.title || activeItem.name || '') : (activeItem.name || ''));
                setEditNotes(activeItem.type === 'note' ? (activeItem.content || '') : (activeItem.notes || ''));
                setIsEditingMenu(true);
              } else {
                setIsEditingMenu(false);
              }
            }}
            className="vtt-context-header-btn"
            style={isEditingMenu ? {
              borderColor: '#f59e0b',
              color: '#fbbf24',
              background: 'rgba(245, 158, 11, 0.14)'
            } : undefined}
            title="Renombrar o editar descripción del objeto"
          >
            <Pencil size={13} strokeWidth={2.2} />
          </button>
        )
      }
    >
      {/* Barra compacta de iconos de acción */}
      <div className="vtt-context-icon-bar">
        {supportsVisibilityAndName && onUpdateMapElement && (
          <button
            type="button"
            onClick={() => {
              onUpdateMapElement(
                activeItem.id,
                { isHidden: !isHidden },
                !isHidden ? 'Elemento oculto a jugadores' : 'Elemento visible a jugadores',
                !isHidden ? '👁️‍🗨️' : '👁️'
              );
            }}
            className="vtt-context-icon-btn"
            style={isHidden ? {
              background: 'rgba(139, 92, 246, 0.22)',
              borderColor: '#c084fc',
              color: '#e9d5ff'
            } : undefined}
            title={isHidden ? 'Oculto a jugadores (clic para mostrar)' : 'Visible a jugadores (clic para ocultar)'}
          >
            {isHidden ? <EyeOff size={16} strokeWidth={2.2} /> : <Eye size={16} strokeWidth={2.2} />}
          </button>
        )}

        {supportsVisibilityAndName && onUpdateMapElement && (
          <button
            type="button"
            onClick={() => {
              onUpdateMapElement(
                activeItem.id,
                { showName: !isNameVisible },
                !isNameVisible ? 'Nombre visible en el tablero' : 'Nombre oculto en el tablero',
                '🏷️'
              );
            }}
            className="vtt-context-icon-btn"
            style={isNameVisible ? {
              background: 'rgba(245, 158, 11, 0.14)',
              borderColor: '#f59e0b',
              color: '#fbbf24'
            } : { color: '#64748b' }}
            title={isNameVisible ? 'Ocultar etiqueta con el nombre en el tablero' : 'Mostrar etiqueta con el nombre en el tablero'}
          >
            {isNameVisible ? <Captions size={16} strokeWidth={2.2} /> : <CaptionsOff size={16} strokeWidth={2.2} />}
          </button>
        )}

        {onToggleMapElementLock && (
          <button
            type="button"
            onClick={() => onToggleMapElementLock(activeItem.id)}
            className="vtt-context-icon-btn"
            style={isLocked ? {
              background: 'rgba(245, 158, 11, 0.14)',
              borderColor: '#f59e0b',
              color: '#fbbf24'
            } : undefined}
            title={isLocked ? 'Posición bloqueada (clic para desbloquear)' : 'Bloquear posición en el tablero'}
          >
            {isLocked ? <Lock size={16} strokeWidth={2.2} /> : <Unlock size={16} strokeWidth={2.2} />}
          </button>
        )}

        {onDuplicateMapElement && (
          <button
            type="button"
            onClick={() => {
              onDuplicateMapElement(activeItem);
              onClose();
            }}
            className="vtt-context-icon-btn"
            title="Duplicar elemento en la escena"
          >
            <Copy size={16} strokeWidth={2.2} />
          </button>
        )}

        {(activeItem.type === 'item' || activeItem.type === 'note') && onProjectHandout && (
          <button
            type="button"
            onClick={() => {
              onProjectHandout({
                type: 'note',
                title: activeItem.type === 'note'
                  ? (activeItem.title || activeItem.name || 'Pista')
                  : `${activeItem.icon || '📦'} ${activeItem.name || 'Objeto'}`,
                content: activeItem.type === 'note'
                  ? (activeItem.content || 'Sin texto adicional registrado para esta pista.')
                  : (activeItem.notes || 'Objeto encontrado sobre el terreno.')
              });
              onClose();
            }}
            className="vtt-context-icon-btn vtt-context-icon-btn-info"
            title={activeItem.type === 'note' ? 'Proyectar esta pista en la pantalla de jugadores' : 'Proyectar este objeto y sus notas en la pantalla de jugadores'}
          >
            <Projector size={16} strokeWidth={2.2} />
          </button>
        )}

        {onRemoveMapElement && (
          <button
            type="button"
            onClick={() => {
              onRemoveMapElement(activeItem.id);
              onClose();
            }}
            className="vtt-context-icon-btn vtt-context-icon-btn-danger"
            title="Retirar elemento de la escena"
          >
            <Trash2 size={16} strokeWidth={2.2} />
          </button>
        )}
      </div>

      {(isEditingMenu || activeItem.type === 'item' || activeItem.type === 'note' || activeItem.type === 'door' || activeItem.type === 'window' || activeItem.type === 'object' || activeItem.type === 'light') && (
        <div className="vtt-context-divider" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isEditingMenu && onUpdateMapElement && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              backgroundColor: '#0e1118',
              border: '1px solid #2d3748',
              borderRadius: '7px',
              padding: '8px'
            }}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nombre..."
                style={{
                  backgroundColor: '#161b26',
                  border: '1px solid #334155',
                  borderRadius: '5px',
                  padding: '5px 7px',
                  color: '#f8fafc',
                  fontSize: '11.5px',
                  outline: 'none'
                }}
              />
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Descripción o notas..."
                rows={2}
                style={{
                  backgroundColor: '#161b26',
                  border: '1px solid #334155',
                  borderRadius: '5px',
                  padding: '5px 7px',
                  color: '#cbd5e1',
                  fontSize: '11px',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (activeItem.type === 'note') {
                      const nextTitle = editName.trim() || activeItem.title || activeItem.name || 'Pista';
                      onUpdateMapElement(activeItem.id, {
                        title: nextTitle,
                        name: nextTitle,
                        content: editNotes.trim()
                      }, 'Pista actualizada', '📜');
                    } else {
                      onUpdateMapElement(activeItem.id, {
                        name: editName.trim() || activeItem.name,
                        notes: editNotes.trim()
                      }, 'Objeto actualizado', '💾');
                    }
                    setIsEditingMenu(false);
                  }}
                  className="vtt-primary-cta"
                  style={{ flex: 1, padding: '4px 8px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingMenu(false)}
                  className="vtt-brass-btn"
                  style={{ padding: '4px 8px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {activeItem.type === 'note' && !isEditingMenu && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeItem.content && (
                <div style={{
                  fontSize: '11px',
                  color: '#cbd5e1',
                  backgroundColor: '#0e1118',
                  padding: '7px 9px',
                  borderRadius: '6px',
                  borderLeft: '2px solid #f59e0b',
                  lineHeight: 1.45,
                  whiteSpace: 'pre-wrap'
                }}>
                  {activeItem.content}
                </div>
              )}
              {onReadNote && (
                <button
                  type="button"
                  onClick={() => {
                    onReadNote(activeItem);
                    onClose();
                  }}
                  className="vtt-primary-cta"
                  style={{ padding: '7px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <ScrollText size={13} strokeWidth={2.2} /> Leer Pista
                </button>
              )}
            </div>
          )}

          {activeItem.type === 'item' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeItem.notes && !isEditingMenu && (
                <div style={{
                  fontSize: '11px',
                  color: '#cbd5e1',
                  backgroundColor: '#0e1118',
                  padding: '7px 9px',
                  borderRadius: '6px',
                  borderLeft: '2px solid #f59e0b',
                  lineHeight: 1.4
                }}>
                  {activeItem.notes}
                </div>
              )}

              {tokens.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '4px 0' }}>
                  Sin fichas en la escena para recogerlo
                </div>
              ) : recipientToken ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (onPickUpItem) onPickUpItem(activeItem, recipientToken.id);
                      onClose();
                    }}
                    className="vtt-primary-cta"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Hand size={14} strokeWidth={2.2} />
                    <span>Coger ➔ {recipientToken.name}</span>
                  </button>

                  {tokens.length > 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className="vtt-context-section-label">O entregar a otro:</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '110px', overflowY: 'auto' }}>
                        {tokens.filter(t => t.id !== recipientToken.id).map(tok => (
                          <button
                            key={tok.id}
                            type="button"
                            onClick={() => {
                              if (onPickUpItem) onPickUpItem(activeItem, tok.id);
                              onClose();
                            }}
                            style={{
                              padding: '6px 9px',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: '6px',
                              textAlign: 'left',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: '#171c26',
                              border: '1px solid #2b3345',
                              color: '#e2e8f0',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Hand size={12} strokeWidth={2.2} style={{ color: '#fbbf24' }} />
                            <span>{tok.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="vtt-context-section-label">Entregar a personaje:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '130px', overflowY: 'auto' }}>
                    {tokens.map(tok => (
                      <button
                        key={tok.id}
                        type="button"
                        onClick={() => {
                          if (onPickUpItem) onPickUpItem(activeItem, tok.id);
                          onClose();
                        }}
                        style={{
                          padding: '6px 9px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#171c26',
                          border: '1px solid #2b3345',
                          color: '#e2e8f0',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Hand size={13} strokeWidth={2.2} style={{ color: '#fbbf24' }} />
                        <span>{tok.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {(activeItem.type === 'door' || activeItem.type === 'window') && (() => {
            const isDoor = activeItem.type === 'door';
            const { length, thickness, angleDeg } = getStructureOrientationSizes(activeItem);
            const handleResize = (nextLength, nextThickness) => {
              if (!onUpdateMapElement) return;
              onUpdateMapElement(activeItem.id, resizeStructureCentered(activeItem, nextLength, nextThickness));
            };
            const handleRotateTo = (nextAngleDeg) => {
              if (!onUpdateMapElement) return;
              onUpdateMapElement(activeItem.id, setStructureRotationCentered(activeItem, nextAngleDeg));
            };

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (isDoor && onToggleDoor) onToggleDoor(activeItem.id);
                    else if (!isDoor && onToggleWindow) onToggleWindow(activeItem.id, false);
                    onClose();
                  }}
                  className="vtt-primary-cta"
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11.5px' }}
                >
                  {isDoor
                    ? (activeItem.isOpen ? 'Cerrar Puerta' : 'Abrir Puerta')
                    : (activeItem.isOpen ? 'Cerrar Ventana' : 'Abrir Ventana')}
                </button>

                {!isDoor && !activeItem.isOpen && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onToggleWindow) onToggleWindow(activeItem.id, true);
                      onClose();
                    }}
                    style={{
                      padding: '7px 10px',
                      background: 'linear-gradient(180deg, #991b1b 0%, #450a0a 100%)',
                      color: '#fecaca',
                      border: '1px solid #f87171',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '11.5px'
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Zap size={13} strokeWidth={2.2} /> Romper Cristal</span>
                  </button>
                )}

                {onUpdateMapElement && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    backgroundColor: '#0e1118',
                    border: '1px solid #242d3d',
                    borderRadius: '7px',
                    padding: '9px 10px'
                  }}>
                    <SliderControl
                      label="Ángulo"
                      value={angleDeg}
                      unit="°"
                      min={0}
                      max={359}
                      step={1}
                      labelWidth="88px"
                      sliderWidth="112px"
                      onChange={handleRotateTo}
                      title="Inclinar libremente de 0° a 359°"
                    />
                    <SliderControl
                      label="Largo"
                      value={length}
                      unit="px"
                      min={14}
                      max={160}
                      step={2}
                      labelWidth="88px"
                      sliderWidth="112px"
                      onChange={(val) => handleResize(val, thickness)}
                      title="Ajustar longitud en píxeles"
                    />
                    <SliderControl
                      label="Grosor"
                      value={thickness}
                      unit="px"
                      min={6}
                      max={28}
                      step={1}
                      labelWidth="88px"
                      sliderWidth="112px"
                      onChange={(val) => handleResize(length, val)}
                      title="Ajustar grosor en píxeles"
                    />
                  </div>
                )}
              </div>
            );
          })()}

          {activeItem.type === 'object' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  if (onToggleObject) onToggleObject(activeItem.id);
                  onClose();
                }}
                className="vtt-primary-cta"
                style={{ padding: '7px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11.5px' }}
              >
                {activeItem.isOpen ? 'Cerrar / Reiniciar' : 'Abrir / Activar'}
              </button>

              {onInspectObject && (
                <button
                  type="button"
                  onClick={() => {
                    onInspectObject(activeItem);
                    onClose();
                  }}
                  className="vtt-brass-btn"
                  style={{ padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11.5px', borderColor: '#f59e0b', color: '#fbbf24' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><FileText size={13} strokeWidth={2.2} /> Notas & Pistas</span>
                </button>
              )}

              {(activeItem.customClueText || activeItem.linkedHandoutId) && onProjectHandout && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeItem.linkedHandoutId) {
                      const linked = handouts.find(h => h.id === activeItem.linkedHandoutId);
                      if (linked) {
                        onProjectHandout(linked);
                      } else if (activeItem.customClueText) {
                        onProjectHandout({
                          type: 'note',
                          title: `Pista: ${activeItem.name || 'Objeto'}`,
                          content: activeItem.customClueText
                        });
                      }
                    } else if (activeItem.customClueText) {
                      onProjectHandout({
                        type: 'note',
                        title: `Pista: ${activeItem.name || 'Objeto'}`,
                        content: activeItem.customClueText
                      });
                    }
                    onClose();
                  }}
                  className="vtt-brass-btn"
                  style={{ padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11.5px', color: '#38bdf8', borderColor: '#0284c7' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Projector size={13} strokeWidth={2.2} /> Desvelar Pista</span>
                </button>
              )}
            </div>
          )}

          {activeItem.type === 'light' && (() => {
            const isLightOn = activeItem.isOn !== false;
            const lightElements = maps.filter(m => m.type === 'light');
            const allOn = lightElements.length > 0 && lightElements.every(m => m.isOn !== false);
            const allOff = lightElements.length > 0 && lightElements.every(m => m.isOn === false);

            const lightActions = [
              {
                key: 'on-one',
                icon: Flame,
                title: 'Encender esta luz',
                isActive: isLightOn,
                activeStyle: { background: 'rgba(245, 158, 11, 0.2)', borderColor: '#f59e0b', color: '#fbbf24' },
                onClick: () => onToggleLight && onToggleLight(activeItem.id, true)
              },
              {
                key: 'off-one',
                icon: LightbulbOff,
                title: 'Apagar esta luz',
                isActive: !isLightOn,
                activeStyle: { background: 'rgba(100, 116, 139, 0.24)', borderColor: '#94a3b8', color: '#e2e8f0' },
                onClick: () => onToggleLight && onToggleLight(activeItem.id, false)
              },
              {
                key: 'on-all',
                icon: Sun,
                title: 'Encender todas las luces',
                isActive: allOn,
                activeStyle: { background: 'rgba(234, 179, 8, 0.2)', borderColor: '#eab308', color: '#fde047' },
                onClick: () => onSetAllLights && onSetAllLights(true)
              },
              {
                key: 'off-all',
                icon: Moon,
                title: 'Apagar todas las luces',
                isActive: allOff,
                activeStyle: { background: 'rgba(71, 85, 105, 0.28)', borderColor: '#64748b', color: '#cbd5e1' },
                onClick: () => onSetAllLights && onSetAllLights(false)
              }
            ];

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="vtt-context-icon-bar" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  {lightActions.map(action => {
                    const IconComp = action.icon;
                    return (
                      <button
                        key={action.key}
                        type="button"
                        onClick={() => {
                          action.onClick();
                          onClose();
                        }}
                        className="vtt-context-icon-btn"
                        style={action.isActive ? action.activeStyle : undefined}
                        title={action.title}
                        aria-label={action.title}
                      >
                        <IconComp size={16} strokeWidth={2.2} />
                      </button>
                    );
                  })}
                </div>

                {onUpdateMapElement && (
                  <div style={{
                    backgroundColor: '#0e1118',
                    border: '1px solid #242d3d',
                    borderRadius: '7px',
                    padding: '9px 10px'
                  }}>
                    <SliderControl
                      label="Radio"
                      value={activeItem.radius || 220}
                      unit="px"
                      min={60}
                      max={650}
                      step={10}
                      labelWidth="88px"
                      sliderWidth="112px"
                      onChange={(val) => onUpdateMapElement(activeItem.id, { radius: val })}
                      title="Ajustar intensidad y alcance del área iluminada en la niebla"
                    />
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </ContextMenu>
  );
};

export default MapElementContextMenu;
