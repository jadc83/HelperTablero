import { X, Hand, Backpack, Package, MapPin, Gift, Trash2, ArrowLeftRight, ChevronUp, ChevronDown } from 'lucide-react';
import { getItemIcon } from '../../utils/gameIcons';

/**
 * Menú contextual estilo medallón para objetos del inventario: mover de hueco,
 * transferir a mochila/almacén/otro personaje, arrojar al suelo o eliminar.
 */
const ItemContextMenu = ({
  contextMenu,
  currentItem,
  inventorySlots,
  backpackSlots,
  hasBackpack,
  backpackInNormal,
  storedItemsCount,
  availableRecipients,
  showTransferMenu,
  setShowTransferMenu,
  onCloseMenu,
  onStartMoving,
  onMoveToSectionSlot,
  onUpdateItemNotes,
  onDropItemToFloor,
  hasDropHandler,
  onTransferToRecipient,
  onRemoveItem,
  onNotify
}) => {
  if (!contextMenu || !currentItem) return null;

  const isStored = currentItem.state === 'stored' || currentItem.container === 'stored';
  const isBackpack = !isStored && currentItem.container === 'backpack';

  const menuWidth = 270;
  const posX = Math.max(16, Math.min(contextMenu.x - menuWidth / 2, window.innerWidth - menuWidth - 20));
  const posY = Math.max(16, Math.min(contextMenu.y - 50, window.innerHeight - 440));

  return (
    <>
      <div
        onClick={onCloseMenu}
        onContextMenu={(e) => { e.preventDefault(); onCloseMenu(); }}
        style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
      />

      <div
        style={{
          position: 'fixed',
          left: `${posX}px`,
          top: `${posY}px`,
          zIndex: 99999,
          width: `${menuWidth}px`,
          background: 'linear-gradient(180deg, #171d2b 0%, #0d1017 100%)',
          border: '2px solid #b45309',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.95), 0 0 25px rgba(245, 158, 11, 0.25)',
          padding: '16px 14px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <button
          type="button"
          onClick={onCloseMenu}
          style={{
            position: 'absolute',
            top: '10px',
            right: '12px',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px'
          }}
          title="Cerrar menú"
        >
          <X size={14} strokeWidth={2.4} />
        </button>

        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #fde68a 0%, #d97706 65%, #78350f 100%)',
            border: '3px solid #fef08a',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.65), inset 0 2px 4px rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {getItemIcon(currentItem, 38)}
        </div>

        <div style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#fef3c7', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            {currentItem.name}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '4px' }}>
            <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: '#1e283b', color: '#93c5fd', border: '1px solid #334155' }}>
              {currentItem.category || 'Objeto'}
            </span>
            <span style={{
              fontSize: '9px',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '4px',
              background: isStored ? 'rgba(148, 163, 184, 0.15)' : (isBackpack ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)'),
              color: isStored ? '#cbd5e1' : (isBackpack ? '#fbbf24' : '#38bdf8'),
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              {isStored ? 'No lo lleva' : (isBackpack ? `Mochila (#${((currentItem.slotIndex ?? 0) + 1).toString().padStart(2, '0')})` : `Inventario (#${((currentItem.slotIndex ?? 0) + 1).toString().padStart(2, '0')})`)}
            </span>
          </div>
        </div>

        <div style={{ width: '100%' }}>
          <input
            type="text"
            value={currentItem.notes || ''}
            onChange={(e) => onUpdateItemNotes(currentItem.id, e.target.value)}
            placeholder="Añadir notas o estado..."
            style={{
              width: '100%',
              padding: '5px 8px',
              background: '#090b10',
              border: '1px solid #334155',
              borderRadius: '5px',
              color: '#cbd5e1',
              fontSize: '11px',
              textAlign: 'center',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <button
            type="button"
            onClick={() => {
              onStartMoving(currentItem.id);
              onCloseMenu();
            }}
            className="vtt-brass-btn"
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '8px',
              borderColor: '#f59e0b',
              color: '#fbbf24'
            }}
          >
            <Hand size={13} strokeWidth={2.2} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>Mover de hueco <ArrowLeftRight size={11} /></span>
          </button>

          {(isStored || isBackpack) && (
            <button
              type="button"
              onClick={() => {
                const free = inventorySlots.findIndex(s => s === null);
                if (free === -1) {
                  onNotify('El inventario normal está lleno (10/10).', 'warning');
                  return;
                }
                onMoveToSectionSlot(currentItem.id, 'inventory', free);
                onCloseMenu();
              }}
              className="vtt-brass-btn"
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '8px',
                borderColor: '#38bdf8',
                color: '#38bdf8'
              }}
            >
              <Backpack size={13} strokeWidth={2.2} />
              <span>Poner en el Inventario</span>
            </button>
          )}

          {hasBackpack && !isBackpack && currentItem.id !== backpackInNormal?.id && (
            <button
              type="button"
              onClick={() => {
                const free = backpackSlots.findIndex(s => s === null);
                if (free === -1) {
                  onNotify('La mochila está llena (10/10).', 'warning');
                  return;
                }
                onMoveToSectionSlot(currentItem.id, 'backpack', free);
                onCloseMenu();
              }}
              className="vtt-brass-btn"
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '8px',
                borderColor: '#fbbf24',
                color: '#fbbf24'
              }}
            >
              <Backpack size={13} strokeWidth={2.2} />
              <span>Guardar en la Mochila</span>
            </button>
          )}

          {!isStored && (
            <button
              type="button"
              onClick={() => {
                onMoveToSectionSlot(currentItem.id, 'stored', storedItemsCount);
                onCloseMenu();
              }}
              className="vtt-brass-btn"
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '8px',
                borderColor: '#64748b',
                color: '#cbd5e1'
              }}
            >
              <Package size={13} strokeWidth={2.2} />
              <span>Dejar en &quot;No lo lleva&quot;</span>
            </button>
          )}

          {hasDropHandler && (
            <button
              type="button"
              onClick={() => {
                onDropItemToFloor(currentItem);
                onCloseMenu();
              }}
              className="vtt-brass-btn"
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '8px',
                borderColor: 'rgba(239, 68, 68, 0.45)',
                color: '#fca5a5'
              }}
            >
              <MapPin size={13} strokeWidth={2.2} />
              <span>Tirar al suelo del tablero</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowTransferMenu(!showTransferMenu)}
            className="vtt-brass-btn"
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderColor: '#8b5cf6',
              color: '#c084fc',
              backgroundColor: showTransferMenu ? 'rgba(124, 58, 237, 0.2)' : 'transparent'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Gift size={13} strokeWidth={2.2} />
              <span>Dar a otro personaje</span>
            </span>
            {showTransferMenu ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showTransferMenu && (
            <div style={{
              background: '#0a0d14',
              border: '1px solid #7c3aed',
              borderRadius: '6px',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              maxHeight: '140px',
              overflowY: 'auto'
            }}>
              {availableRecipients.length > 0 ? (
                availableRecipients.map(recipient => {
                  const factionLabels = {
                    player: { label: 'Jugador', bg: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '#10b981' },
                    ally: { label: 'Aliado', bg: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '#3b82f6' },
                    enemy: { label: 'Enemigo', bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '#ef4444' }
                  };
                  const fMeta = factionLabels[recipient.faction] || factionLabels.ally;

                  return (
                    <button
                      key={recipient.id || recipient.characterId}
                      type="button"
                      onClick={() => onTransferToRecipient(recipient, currentItem)}
                      style={{
                        padding: '4px 8px',
                        background: '#131824',
                        border: '1px solid #283347',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {recipient.name}
                      </span>
                      <span style={{ fontSize: '8.5px', fontWeight: 700, padding: '1px 4px', borderRadius: '3px', background: fMeta.bg, color: fMeta.color, border: `1px solid ${fMeta.border}` }}>
                        {fMeta.label}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div style={{ fontSize: '10px', color: '#94a3b8', padding: '4px', textAlign: 'center' }}>
                  No hay otros personajes disponibles.
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              onRemoveItem(currentItem.id);
              onCloseMenu();
            }}
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '8px',
              background: 'transparent',
              border: '1px solid transparent',
              color: '#ef4444'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
          >
            <Trash2 size={13} strokeWidth={2.2} />
            <span>Eliminar objeto</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default ItemContextMenu;
