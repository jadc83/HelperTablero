import { Package, Flame, Scroll, Trash2 } from 'lucide-react';
import { OBJECT_PRESETS, LIGHT_PRESETS } from '../../constants/gamePresets';
import ModalShell from '../ui/ModalShell';
import SliderControl from '../ui/SliderControl';

const MapElementModals = ({
  editingObject,
  setEditingObject,
  editingLight,
  setEditingLight,
  editingNote,
  setEditingNote,
  elements,
  setElements,
  setSelectedIds
}) => {
  const removeElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
    setSelectedIds([]);
  };

  const saveElement = (updated) => {
    setElements(elements.map(el => (el.id === updated.id ? updated : el)));
  };

  return (
    <>
      <ModalShell
        isOpen={Boolean(editingObject)}
        onClose={() => setEditingObject(null)}
        title="Configurar Objeto Interactivo"
        icon={<Package size={17} strokeWidth={2.2} />}
        width="480px"
        footer={editingObject && (
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                removeElement(editingObject.id);
                setEditingObject(null);
              }}
              className="vtt-danger-plate-btn"
            >
              <Trash2 size={13} strokeWidth={2.2} /> Eliminar Objeto
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setEditingObject(null)}
                className="vtt-brass-btn"
                style={{ padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  saveElement(editingObject);
                  setEditingObject(null);
                }}
                className="vtt-primary-cta"
                style={{ padding: '7px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
              >
                Guardar Objeto
              </button>
            </div>
          </div>
        )}
      >
        {editingObject && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {OBJECT_PRESETS.map(p => (
                <button
                  type="button"
                  key={p.presetId}
                  onClick={() => setEditingObject({
                    ...editingObject,
                    name: p.label,
                    icon: p.icon,
                    openIcon: p.openIcon,
                    blocksMovement: p.blocksMovement,
                    blocksVision: p.blocksVision
                  })}
                  className="vtt-brass-btn"
                  style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Nombre</label>
                <input
                  type="text"
                  value={editingObject.name}
                  onChange={(e) => setEditingObject({ ...editingObject, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px' }}
                />
              </div>
              <div style={{ width: '74px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Cerrado</label>
                <input
                  type="text"
                  value={editingObject.icon}
                  onChange={(e) => setEditingObject({ ...editingObject, icon: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', textAlign: 'center' }}
                />
              </div>
              <div style={{ width: '74px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Abierto</label>
                <input
                  type="text"
                  value={editingObject.openIcon}
                  onChange={(e) => setEditingObject({ ...editingObject, openIcon: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', textAlign: 'center' }}
                />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={Boolean(editingObject.blocksMovement)}
                onChange={(e) => setEditingObject({ ...editingObject, blocksMovement: e.target.checked })}
              />
              <span>Bloquea el paso mientras esté cerrado/activo</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={Boolean(editingObject.blocksVision)}
                onChange={(e) => setEditingObject({ ...editingObject, blocksVision: e.target.checked })}
              />
              <span>Bloquea el cono de visión (proyecta sombra) mientras esté cerrado</span>
            </label>
          </div>
        )}
      </ModalShell>

      <ModalShell
        isOpen={Boolean(editingLight)}
        onClose={() => setEditingLight(null)}
        title="Configurar Fuente de Luz"
        icon={<Flame size={17} strokeWidth={2.2} />}
        width="440px"
        footer={editingLight && (
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                removeElement(editingLight.id);
                setEditingLight(null);
              }}
              className="vtt-danger-plate-btn"
            >
              <Trash2 size={13} strokeWidth={2.2} /> Eliminar Luz
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setEditingLight(null)}
                className="vtt-brass-btn"
                style={{ padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  saveElement(editingLight);
                  setEditingLight(null);
                }}
                className="vtt-primary-cta"
                style={{ padding: '7px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
              >
                Guardar Luz
              </button>
            </div>
          </div>
        )}
      >
        {editingLight && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {LIGHT_PRESETS.map(p => (
                <button
                  type="button"
                  key={p.presetId}
                  onClick={() => setEditingLight({
                    ...editingLight,
                    name: p.label,
                    icon: p.icon,
                    radius: p.radius,
                    color: p.color
                  })}
                  className="vtt-brass-btn"
                  style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>

            <SliderControl
              label="Radio de Iluminación en la Niebla"
              value={editingLight.radius || 220}
              unit="px"
              min={80}
              max={550}
              step={10}
              onChange={(val) => setEditingLight({ ...editingLight, radius: val })}
              sliderWidth="100%"
            />
          </div>
        )}
      </ModalShell>

      <ModalShell
        isOpen={Boolean(editingNote)}
        onClose={() => setEditingNote(null)}
        title="Redactar Pergamino"
        icon={<Scroll size={17} strokeWidth={2.2} />}
        width="500px"
        footer={editingNote && (
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                removeElement(editingNote.id);
                setEditingNote(null);
              }}
              className="vtt-danger-plate-btn"
            >
              <Trash2 size={13} strokeWidth={2.2} /> Eliminar Nota
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setEditingNote(null)}
                className="vtt-brass-btn"
                style={{ padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  saveElement(editingNote);
                  setEditingNote(null);
                }}
                className="vtt-primary-cta"
                style={{ padding: '7px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
              >
                Guardar Pergamino
              </button>
            </div>
          </div>
        )}
      >
        {editingNote && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              value={editingNote.title}
              onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
              style={{ padding: '10px', fontSize: '15px', fontWeight: 'bold', borderRadius: '6px' }}
            />
            <textarea
              value={editingNote.content}
              onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
              style={{ padding: '12px', height: '200px', borderRadius: '6px', resize: 'vertical', fontSize: '14px', lineHeight: '1.5' }}
            />
          </div>
        )}
      </ModalShell>
    </>
  );
};

export default MapElementModals;
