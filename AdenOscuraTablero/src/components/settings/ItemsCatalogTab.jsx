import { useState } from 'react';
import {
  BookOpen,
  MapPin,
  Gift,
  Trash2,
  Hammer,
  ChevronUp,
  ChevronDown,
  Save,
  ArrowLeftRight,
  ArrowRight
} from 'lucide-react';
import {
  ITEM_CATEGORIES,
  POPULAR_ITEM_ICONS,
  filterCatalogItems
} from '../../constants/commonItems';
import { useConfirm } from '../../hooks/useConfirm';
import SearchInput from '../ui/SearchInput';
import EmptyState from '../ui/EmptyState';

const ItemsCatalogTab = ({
  commonItems = [],
  tokens = [],
  characters = [],
  activeTurnTokenId = null,
  onGiveItemToCharacter,
  onSaveCommonItem,
  onDeleteCommonItem,
  onPlaceGroundItem,
  onTransferItem,
  onClose,
  notify
}) => {
  const [isCreatorExpanded, setIsCreatorExpanded] = useState(false);
  const [commonItemName, setCommonItemName] = useState('');
  const [commonItemIcon, setCommonItemIcon] = useState('🚬');
  const [commonItemCategory, setCommonItemCategory] = useState('Herramienta');
  const [commonItemState, setCommonItemState] = useState('equipped');
  const [commonItemNotes, setCommonItemNotes] = useState('');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [selectedGiverId, setSelectedGiverId] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const confirm = useConfirm();

  const activeTurnToken = tokens.find(t => String(t.id) === String(activeTurnTokenId)) || null;
  const effectiveGiverId = selectedGiverId || (activeTurnToken ? String(activeTurnToken.id) : 'master');

  const giverToken = tokens.find(tok => String(tok.id) === String(effectiveGiverId) || (tok.characterId && String(tok.characterId) === String(effectiveGiverId)));
  const giverChar = characters.find(ch => String(ch.id) === String(effectiveGiverId));
  const effectiveGiverName = (() => {
    if (effectiveGiverId === 'master') return 'El Máster (Alijo)';
    if (giverToken) return giverToken.name;
    if (giverChar) return giverChar.name;
    return 'Emisor';
  })();

  const giverInventory = Array.isArray(giverToken?.inventory)
    ? giverToken.inventory
    : (Array.isArray(giverChar?.inventory) ? giverChar.inventory : []);

  const recipientTokens = tokens.filter(t => {
    if (effectiveGiverId === 'master') return true;
    if (String(t.id) === String(effectiveGiverId)) return false;
    if (t.characterId && String(t.characterId) === String(effectiveGiverId)) return false;
    if (giverToken && t.characterId && giverToken.characterId && String(t.characterId) === String(giverToken.characterId)) return false;
    if (effectiveGiverName && t.name.trim().toLowerCase() === effectiveGiverName.trim().toLowerCase()) return false;
    return true;
  });

  const recipientCharacters = characters.filter(c => {
    if (effectiveGiverId === 'master') return true;
    if (String(c.id) === String(effectiveGiverId)) return false;
    if (giverToken && giverToken.characterId && String(c.id) === String(giverToken.characterId)) return false;
    if (effectiveGiverName && c.name.trim().toLowerCase() === effectiveGiverName.trim().toLowerCase()) return false;
    return true;
  });

  const isValidRecipient = (id) => {
    if (!id) return false;
    return recipientTokens.some(t => String(t.id) === String(id) || (t.characterId && String(t.characterId) === String(id))) ||
           recipientCharacters.some(c => String(c.id) === String(id));
  };

  const effectiveRecipientId = isValidRecipient(selectedRecipientId)
    ? selectedRecipientId
    : (recipientTokens[0] ? String(recipientTokens[0].id) : (recipientCharacters[0] ? String(recipientCharacters[0].id) : ''));

  const effectiveRecipientName = (() => {
    const foundT = recipientTokens.find(t => String(t.id) === String(effectiveRecipientId) || (t.characterId && String(t.characterId) === String(effectiveRecipientId)));
    if (foundT) return foundT.name;
    const foundC = recipientCharacters.find(c => String(c.id) === String(effectiveRecipientId));
    return foundC ? foundC.name : 'Nadie disponible';
  })();

  const q = itemSearchQuery.trim();
  const filteredCommonItems = q ? filterCatalogItems(commonItems, q) : [];

  const handleDeleteTemplate = async (item) => {
    if (!onDeleteCommonItem) return;
    const ok = await confirm({
      title: 'Eliminar plantilla de objeto',
      message: `¿Eliminar "${item.name}" del catálogo común?`,
      confirmLabel: 'Eliminar',
      tone: 'danger'
    });
    if (ok) onDeleteCommonItem(item.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
      {/* 1. Catálogo común */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        backgroundColor: 'var(--vtt-bg-card)',
        border: '1px solid var(--vtt-border)',
        borderRadius: '8px',
        padding: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={15} strokeWidth={2.2} style={{ color: 'var(--vtt-accent-amber)' }} />
            <span className="vtt-gothic-title" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--vtt-accent-amber)', letterSpacing: '0.04em' }}>
              Catálogo Común de Objetos
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--vtt-text-muted)', fontWeight: 700, backgroundColor: 'var(--vtt-bg-inset)', padding: '2px 7px', borderRadius: '4px', border: '1px solid var(--vtt-border)' }}>
            {commonItems.length} plantillas
          </span>
        </div>

        <SearchInput
          value={itemSearchQuery}
          onChange={setItemSearchQuery}
          placeholder="Buscar mechero, cuerda, linterna, ganzúa, botiquín..."
          inputStyle={{ backgroundColor: 'var(--vtt-input-bg)', fontSize: '11px' }}
        />

        {q.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto', marginTop: '4px' }}>
            {filteredCommonItems.length === 0 ? (
              <EmptyState
                title="Sin coincidencias"
                description={`No se encontraron objetos para "${itemSearchQuery}".`}
                style={{ padding: '14px 10px' }}
              />
            ) : (
              filteredCommonItems.map(item => {
                const isDefaultPreset = typeof item.id === 'string' && item.id.startsWith('item_');
                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: 'var(--vtt-bg-inset)',
                      border: '1px solid var(--vtt-border)',
                      borderRadius: '7px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                      <span style={{ fontSize: '17px', flexShrink: 0 }}>{item.icon || '📦'}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--vtt-text-strong)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {item.name}
                          </span>
                          {item.category && (
                            <span style={{
                              fontSize: '9px',
                              backgroundColor: 'var(--vtt-accent-sky-bg)',
                              color: 'var(--vtt-accent-sky)',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              fontWeight: 600,
                              border: '1px solid var(--vtt-accent-sky-border)'
                            }}>
                              {item.category}
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <span style={{ fontSize: '9.5px', color: 'var(--vtt-text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title={item.notes}>
                            {item.notes}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                      {onPlaceGroundItem && (
                        <button
                          type="button"
                          onClick={() => {
                            onPlaceGroundItem(item);
                            onClose();
                          }}
                          className="vtt-brass-btn"
                          style={{ padding: '3px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', color: 'var(--vtt-accent-sky)', borderColor: 'var(--vtt-accent-sky-border)' }}
                          title="Colocar en el suelo del tablero para que los personajes puedan recogerlo"
                        >
                          <MapPin size={11} strokeWidth={2.2} /> Suelo
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (onGiveItemToCharacter) {
                            if (effectiveRecipientId) {
                              onGiveItemToCharacter(effectiveRecipientId, item);
                            } else {
                              notify('Selecciona un destinatario abajo para entregar');
                            }
                          }
                        }}
                        disabled={!effectiveRecipientId}
                        className="vtt-brass-btn"
                        style={{
                          padding: '3px 8px',
                          borderRadius: '5px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: effectiveRecipientId ? 'pointer' : 'default',
                          color: 'var(--vtt-accent-amber)',
                          borderColor: 'var(--vtt-gold)',
                          opacity: effectiveRecipientId ? 1 : 0.4
                        }}
                        title={effectiveRecipientId ? `Entregar a ${effectiveRecipientName}` : 'Selecciona un destinatario abajo'}
                      >
                        <Gift size={11} strokeWidth={2.2} /> Entregar
                      </button>
                      {!isDefaultPreset && onDeleteCommonItem && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(item)}
                          style={{ background: 'none', border: 'none', color: 'var(--vtt-accent-red)', cursor: 'pointer', padding: '2px 4px' }}
                          title="Eliminar plantilla del catálogo"
                        >
                          <Trash2 size={13} strokeWidth={2.2} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 2. Forjar nuevo objeto */}
      <div style={{
        backgroundColor: 'var(--vtt-bg-card)',
        border: '1px solid var(--vtt-border)',
        borderRadius: '8px',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <button
          type="button"
          onClick={() => setIsCreatorExpanded(!isCreatorExpanded)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Hammer size={15} strokeWidth={2.2} style={{ color: 'var(--vtt-accent-amber)' }} />
            <span className="vtt-gothic-title" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--vtt-accent-amber)', letterSpacing: '0.04em' }}>
              Forjar Nuevo Objeto
            </span>
          </span>
          <span style={{ fontSize: '10px', color: 'var(--vtt-text-muted)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {isCreatorExpanded ? <><ChevronUp size={13} strokeWidth={2.2} /> Plegar</> : <><ChevronDown size={13} strokeWidth={2.2} /> Desplegar</>}
          </span>
        </button>

        {isCreatorExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '6px', borderTop: '1px solid var(--vtt-border-subtle)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '10px', color: 'var(--vtt-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Nombre del Objeto:
              </label>
              <input
                type="text"
                value={commonItemName}
                onChange={(e) => setCommonItemName(e.target.value)}
                placeholder="Ej: Mechero de latón con iniciales / Daga ritual"
                style={{ backgroundColor: 'var(--vtt-input-bg)', border: '1px solid var(--vtt-input-border)', borderRadius: '6px', padding: '7px 9px', color: 'var(--vtt-input-text)', fontSize: '11px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '10px', color: 'var(--vtt-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Icono:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', backgroundColor: 'var(--vtt-bg-inset)', padding: '5px', borderRadius: '6px', border: '1px solid var(--vtt-border)' }}>
                {POPULAR_ITEM_ICONS.map(ic => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setCommonItemIcon(ic)}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '4px',
                      border: commonItemIcon === ic ? '1.5px solid var(--vtt-gold)' : '1px solid transparent',
                      backgroundColor: commonItemIcon === ic ? 'var(--vtt-accent-amber-bg)' : 'transparent',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <label style={{ fontSize: '10px', color: 'var(--vtt-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Categoría:
                </label>
                <select
                  value={commonItemCategory}
                  onChange={(e) => setCommonItemCategory(e.target.value)}
                  style={{ backgroundColor: 'var(--vtt-input-bg)', border: '1px solid var(--vtt-input-border)', borderRadius: '6px', padding: '6px 8px', color: 'var(--vtt-input-text)', fontSize: '11px', cursor: 'pointer' }}
                >
                  {ITEM_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <label style={{ fontSize: '10px', color: 'var(--vtt-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Ubicación:
                </label>
                <select
                  value={commonItemState}
                  onChange={(e) => setCommonItemState(e.target.value)}
                  style={{ backgroundColor: 'var(--vtt-input-bg)', border: '1px solid var(--vtt-input-border)', borderRadius: '6px', padding: '6px 8px', color: 'var(--vtt-input-text)', fontSize: '11px', cursor: 'pointer' }}
                >
                  <option value="equipped">Equipado (Puesto)</option>
                  <option value="hand">A mano (Bolsillo / Cinturón)</option>
                  <option value="stored">Guardado (Mochila)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <label style={{ fontSize: '10px', color: 'var(--vtt-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Notas / Propiedades:
              </label>
              <input
                type="text"
                value={commonItemNotes}
                onChange={(e) => setCommonItemNotes(e.target.value)}
                placeholder="Detalles sobre el objeto, inscripciones, bonificaciones..."
                style={{ backgroundColor: 'var(--vtt-input-bg)', border: '1px solid var(--vtt-input-border)', borderRadius: '6px', padding: '6px 9px', color: 'var(--vtt-input-text)', fontSize: '11px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  if (!commonItemName.trim()) return;
                  const itemObj = {
                    id: `custom_item_${Date.now()}`,
                    name: commonItemName.trim(),
                    icon: commonItemIcon,
                    category: commonItemCategory,
                    state: commonItemState,
                    notes: commonItemNotes.trim()
                  };
                  if (onSaveCommonItem) onSaveCommonItem(itemObj);
                  setCommonItemName('');
                  setCommonItemNotes('');
                  notify(`Objeto "${itemObj.name}" guardado en el catálogo`);
                }}
                disabled={!commonItemName.trim()}
                className="vtt-brass-btn"
                style={{ flex: 1, padding: '7px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 700, cursor: commonItemName.trim() ? 'pointer' : 'default', opacity: commonItemName.trim() ? 1 : 0.4 }}
              >
                <Save size={12} strokeWidth={2.2} /> Guardar
              </button>

              {onPlaceGroundItem && (
                <button
                  type="button"
                  onClick={() => {
                    if (!commonItemName.trim()) return;
                    const itemObj = {
                      id: `custom_item_${Date.now()}`,
                      name: commonItemName.trim(),
                      icon: commonItemIcon,
                      category: commonItemCategory,
                      state: commonItemState,
                      notes: commonItemNotes.trim()
                    };
                    onPlaceGroundItem(itemObj);
                    setCommonItemName('');
                    setCommonItemNotes('');
                    onClose();
                  }}
                  disabled={!commonItemName.trim()}
                  className="vtt-brass-btn"
                  style={{ flex: 1, padding: '7px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 700, cursor: commonItemName.trim() ? 'pointer' : 'default', color: 'var(--vtt-accent-sky)', borderColor: 'var(--vtt-accent-sky-border)', opacity: commonItemName.trim() ? 1 : 0.4 }}
                  title="Colocar directamente en el suelo del tablero"
                >
                  <MapPin size={11} strokeWidth={2.2} /> En Suelo
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (!commonItemName.trim()) return;
                  if (!effectiveRecipientId) {
                    notify('Selecciona un destinatario abajo para entregar');
                    return;
                  }
                  const itemObj = {
                    id: `custom_item_${Date.now()}`,
                    name: commonItemName.trim(),
                    icon: commonItemIcon,
                    category: commonItemCategory,
                    state: commonItemState,
                    notes: commonItemNotes.trim()
                  };
                  if (onGiveItemToCharacter) onGiveItemToCharacter(effectiveRecipientId, itemObj);
                  setCommonItemName('');
                  setCommonItemNotes('');
                }}
                disabled={!commonItemName.trim() || !effectiveRecipientId}
                className="vtt-brass-btn"
                style={{ flex: 1.2, padding: '7px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: 700, cursor: commonItemName.trim() && effectiveRecipientId ? 'pointer' : 'default', color: 'var(--vtt-accent-amber)', borderColor: 'var(--vtt-gold)', opacity: commonItemName.trim() && effectiveRecipientId ? 1 : 0.4 }}
                title={effectiveRecipientId ? `Entregar directamente a ${effectiveRecipientName}` : 'Selecciona un destinatario abajo'}
              >
                <Gift size={11} strokeWidth={2.2} /> Entregar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Traspaso entre personajes */}
      <div style={{
        backgroundColor: 'var(--vtt-bg-card)',
        border: '1px solid var(--vtt-border)',
        borderRadius: '8px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeftRight size={15} strokeWidth={2.2} style={{ color: 'var(--vtt-accent-amber)' }} />
          <div>
            <span className="vtt-gothic-title" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--vtt-accent-amber)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Traspaso de Objetos entre Personajes
            </span>
            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: 'var(--vtt-text-muted)' }}>
              Transfiere pertenencias directamente del inventario de un personaje a otro.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
            <span className="vtt-context-section-label">Quién lo da:</span>
            <select
              value={effectiveGiverId}
              onChange={(e) => setSelectedGiverId(e.target.value)}
              style={{ backgroundColor: 'var(--vtt-input-bg)', color: 'var(--vtt-input-text)', border: '1px solid var(--vtt-input-border)', borderRadius: '5px', padding: '5px 7px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', width: '100%' }}
            >
              <option value="master">El Máster (Alijo)</option>
              {tokens.length > 0 && (
                <optgroup label="En Tablero (Escena)">
                  {tokens.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.id === activeTurnTokenId ? '(Turno) ' : ''}{t.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {characters.length > 0 && (
                <optgroup label="Biblioteca">
                  {characters.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '14px', color: 'var(--vtt-accent-amber)' }}>
            <ArrowRight size={14} strokeWidth={2.4} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
            <span className="vtt-context-section-label" style={{ color: 'var(--vtt-accent-sky)' }}>Destinatario de Entrega:</span>
            <select
              value={effectiveRecipientId}
              onChange={(e) => setSelectedRecipientId(e.target.value)}
              style={{ backgroundColor: 'var(--vtt-input-bg)', color: effectiveRecipientId ? 'var(--vtt-input-text)' : 'var(--vtt-accent-red)', border: '1px solid var(--vtt-input-border)', borderRadius: '5px', padding: '5px 7px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', width: '100%' }}
            >
              {recipientTokens.length > 0 && (
                <optgroup label="En Tablero (Escena)">
                  {recipientTokens.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </optgroup>
              )}
              {recipientCharacters.length > 0 && (
                <optgroup label="Biblioteca de Personajes">
                  {recipientCharacters.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              )}
              {recipientTokens.length === 0 && recipientCharacters.length === 0 && (
                <option value="" disabled>Sin otros destinatarios disponibles</option>
              )}
            </select>
          </div>
        </div>

        {effectiveGiverId !== 'master' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
            <span className="vtt-context-section-label">
              Inventario de {effectiveGiverName} ({giverInventory.length}):
            </span>
            {giverInventory.length === 0 ? (
              <EmptyState
                title="Inventario vacío"
                description={`${effectiveGiverName} no tiene objetos para transferir.`}
                style={{ padding: '12px' }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
                {giverInventory.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      backgroundColor: 'var(--vtt-bg-inset)',
                      border: '1px solid var(--vtt-border)',
                      borderRadius: '6px',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                      <span style={{ fontSize: '15px' }}>{item.icon || '📦'}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--vtt-text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </span>
                        {item.notes && (
                          <span style={{ fontSize: '9px', color: 'var(--vtt-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.notes}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onTransferItem && effectiveRecipientId) {
                          onTransferItem(effectiveGiverId, effectiveRecipientId, item);
                        }
                      }}
                      disabled={!effectiveRecipientId}
                      className="vtt-brass-btn"
                      style={{
                        padding: '3px 8px',
                        borderRadius: '5px',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: effectiveRecipientId ? 'pointer' : 'default',
                        color: 'var(--vtt-accent-sky)',
                        borderColor: 'var(--vtt-accent-sky-border)',
                        whiteSpace: 'nowrap',
                        opacity: effectiveRecipientId ? 1 : 0.4
                      }}
                      title={effectiveRecipientId ? `Transferir "${item.name}" a ${effectiveRecipientName}` : 'Selecciona un destinatario'}
                    >
                      Traspasar <ArrowRight size={11} strokeWidth={2.4} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemsCatalogTab;
