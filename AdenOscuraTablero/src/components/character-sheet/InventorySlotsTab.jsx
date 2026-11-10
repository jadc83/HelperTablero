import { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, ArrowLeftRight, Plus, CornerDownRight, Gift, AlertTriangle } from 'lucide-react';
import {
  DEFAULT_COMMON_ITEMS,
  filterCatalogItems
} from '../../constants/commonItems';
import { getGameIconComponent, getItemIcon } from '../../utils/gameIcons';
import SearchInput from '../ui/SearchInput';
import ItemContextMenu from './ItemContextMenu';

const NORMAL_SLOTS_COUNT = 10;
const BACKPACK_SLOTS_COUNT = 10;
const createItemId = () => Date.now() + Math.random();

/**
 * Pestaña de Inventario por Huecos (1-10 Inventario, 11-20 Mochila, Almacén ilimitado).
 */
const InventorySlotsTab = ({
  inventory,
  setInventory,
  newItemName,
  setNewItemName,
  currentCharId,
  currentCharName,
  tokens = [],
  characters = [],
  onDropItemToFloor,
  onTransferItem,
  contextMenu,
  setContextMenu,
  showCommonDropdown,
  setShowCommonDropdown,
  movingItemId,
  setMovingItemId
}) => {
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [draggedItemId, setDraggedItemId] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);
  const [commonFilter, setCommonFilter] = useState('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [showTransferMenu, setShowTransferMenu] = useState(false);
  const [toastNotice, setToastNotice] = useState(null);

  const commonDropdownRef = useRef(null);
  const toastTimerRef = useRef(null);

  const showToast = (message, variant = 'success') => {
    setToastNotice({ message, variant });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastNotice(null), 3000);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (commonDropdownRef.current && !commonDropdownRef.current.contains(e.target)) {
        setShowCommonDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [setShowCommonDropdown]);

  // 1. Mochila en inventario normal
  const backpackInNormal = inventory.find(i => {
    const isBackpack = (i.extraSlots && Number(i.extraSlots) > 0) || (i.name && /mochila|backpack|morral/i.test(i.name));
    if (!isBackpack) return false;
    return (!i.state || i.state !== 'stored') && (i.container !== 'backpack') && (typeof i.slotIndex !== 'number' || i.slotIndex < NORMAL_SLOTS_COUNT);
  });
  const hasBackpack = Boolean(backpackInNormal);

  // 2. Mapeo de huecos de Inventario (1-10) y Mochila (11-20)
  const equippedItems = inventory.filter(i => i.state !== 'stored');
  const inventorySlots = Array.from({ length: NORMAL_SLOTS_COUNT }, () => null);
  const backpackSlots = hasBackpack ? Array.from({ length: BACKPACK_SLOTS_COUNT }, () => null) : [];
  const unplacedEquipped = [];

  equippedItems.forEach(item => {
    const belongsToBackpack = hasBackpack && item.id !== backpackInNormal?.id && item.container === 'backpack';
    if (belongsToBackpack) {
      const bpIdx = typeof item.slotIndex === 'number'
        ? (item.slotIndex >= NORMAL_SLOTS_COUNT ? item.slotIndex - NORMAL_SLOTS_COUNT : item.slotIndex)
        : -1;
      if (bpIdx >= 0 && bpIdx < BACKPACK_SLOTS_COUNT && !backpackSlots[bpIdx]) {
        backpackSlots[bpIdx] = item;
      } else {
        const freeBp = backpackSlots.findIndex(s => s === null);
        if (freeBp !== -1) backpackSlots[freeBp] = item;
        else unplacedEquipped.push(item);
      }
    } else {
      const invIdx = (typeof item.slotIndex === 'number' && item.slotIndex < NORMAL_SLOTS_COUNT) ? item.slotIndex : -1;
      if (invIdx >= 0 && invIdx < NORMAL_SLOTS_COUNT && !inventorySlots[invIdx]) {
        inventorySlots[invIdx] = item;
      } else {
        unplacedEquipped.push(item);
      }
    }
  });

  unplacedEquipped.forEach(item => {
    const freeInv = inventorySlots.findIndex(s => s === null);
    if (freeInv !== -1) {
      inventorySlots[freeInv] = { ...item, slotIndex: freeInv, container: 'inventory' };
    }
  });

  // 3. Mapeo de "No lo lleva" (ilimitado)
  const storedItems = inventory.filter(i => i.state === 'stored');
  const selectedItem = inventory.find(i => String(i.id) === String(selectedItemId)) || null;

  const handleMoveItemToSectionSlot = (sourceId, targetSection, targetSlotIdx) => {
    if (!sourceId) return;
    const source = inventory.find(i => String(i.id) === String(sourceId));
    if (!source) return;

    if (targetSection === 'inventory') {
      const existingInInv = inventorySlots[targetSlotIdx];
      if (existingInInv && String(existingInInv.id) !== String(source.id)) {
        setInventory(prev => prev.map(item => {
          if (String(item.id) === String(source.id)) {
            return { ...item, state: 'equipped', container: 'inventory', slotIndex: targetSlotIdx };
          }
          if (String(item.id) === String(existingInInv.id)) {
            return {
              ...item,
              state: source.state || 'equipped',
              container: source.container || (typeof source.slotIndex === 'number' && source.slotIndex >= NORMAL_SLOTS_COUNT ? 'backpack' : 'inventory'),
              slotIndex: source.slotIndex
            };
          }
          return item;
        }));
      } else {
        setInventory(prev => prev.map(item => (
          String(item.id) === String(source.id)
            ? { ...item, state: 'equipped', container: 'inventory', slotIndex: targetSlotIdx }
            : item
        )));
      }
    } else if (targetSection === 'backpack') {
      const existingInBp = backpackSlots[targetSlotIdx];
      if (existingInBp && String(existingInBp.id) !== String(source.id)) {
        setInventory(prev => prev.map(item => {
          if (String(item.id) === String(source.id)) {
            return { ...item, state: 'equipped', container: 'backpack', slotIndex: targetSlotIdx };
          }
          if (String(item.id) === String(existingInBp.id)) {
            return {
              ...item,
              state: source.state || 'equipped',
              container: source.container === 'backpack' ? 'backpack' : 'inventory',
              slotIndex: source.slotIndex ?? 0
            };
          }
          return item;
        }));
      } else {
        setInventory(prev => prev.map(item => (
          String(item.id) === String(source.id)
            ? { ...item, state: 'equipped', container: 'backpack', slotIndex: targetSlotIdx }
            : item
        )));
      }
    } else if (targetSection === 'stored') {
      setInventory(prev => prev.map(item => (
        String(item.id) === String(source.id)
          ? { ...item, state: 'stored', container: 'stored', slotIndex: targetSlotIdx }
          : item
      )));
    }

    setSelectedItemId(source.id);
    setMovingItemId(null);
    setDraggedItemId(null);
    setDragOverTarget(null);
  };

  const handleAddInventoryItem = (name, icon = null, category = 'General', extraSlots = 0, notes = '') => {
    if (!name.trim()) return;
    const isBackpack = /mochila|backpack|morral/i.test(name);
    const resolvedExtra = extraSlots || (isBackpack ? 10 : 0);

    let targetState = 'equipped';
    let targetSlot = 0;
    let targetContainer = 'inventory';

    const freeInv = inventorySlots.findIndex(s => s === null);
    if (freeInv !== -1) {
      targetState = 'equipped';
      targetSlot = freeInv;
      targetContainer = 'inventory';
    } else if (hasBackpack && !isBackpack && backpackSlots.findIndex(s => s === null) !== -1) {
      targetState = 'equipped';
      targetSlot = backpackSlots.findIndex(s => s === null);
      targetContainer = 'backpack';
    } else {
      targetState = 'stored';
      targetSlot = storedItems.length;
      targetContainer = 'stored';
    }

    const newItem = {
      id: createItemId(),
      name: name.trim(),
      state: targetState,
      container: targetContainer,
      icon: icon || getItemIcon({ name }),
      category: category || (isBackpack ? 'Supervivencia' : 'General'),
      notes: notes || '',
      slotIndex: targetSlot,
      extraSlots: resolvedExtra
    };

    setInventory(prev => [...prev, newItem]);
    setSelectedItemId(newItem.id);
    setNewItemName('');
  };

  const handleRemoveInventoryItem = (itemId) => {
    setInventory(prev => prev.filter(i => i.id !== itemId));
    if (selectedItemId === itemId) setSelectedItemId(null);
    if (movingItemId === itemId) setMovingItemId(null);
  };

  const handleDropInventoryItem = (item) => {
    if (!item) return;
    if (onDropItemToFloor) {
      onDropItemToFloor(currentCharId, item);
    }
    handleRemoveInventoryItem(item.id);
  };

  const handleUpdateItemNotes = (itemId, newNotes) => {
    setInventory(prev => prev.map(i => i.id === itemId ? { ...i, notes: newNotes } : i));
  };

  // Destinatarios disponibles para traspasar objetos
  const recipientMap = new Map();
  tokens.forEach(t => {
    if (t.id === currentCharId || t.characterId === currentCharId || (currentCharName && t.name === currentCharName)) return;
    const key = t.characterId || t.id;
    if (!recipientMap.has(key)) {
      recipientMap.set(key, {
        id: t.id,
        characterId: t.characterId,
        name: t.name || 'Combatiente',
        avatar: t.avatar || null,
        color: t.color || '#3b82f6',
        faction: t.faction || 'ally'
      });
    }
  });
  characters.forEach(c => {
    if (c.id === currentCharId || (currentCharName && c.name === currentCharName)) return;
    if (!recipientMap.has(c.id)) {
      recipientMap.set(c.id, {
        id: c.id,
        characterId: c.id,
        name: c.name || 'Personaje',
        avatar: c.avatar || null,
        color: c.color || '#3b82f6',
        faction: c.faction || 'ally'
      });
    }
  });
  const availableRecipients = Array.from(recipientMap.values());

  const renderSlotCard = (item, displayNum, section, index, isBackpackSlot = false) => {
    const isOccupied = Boolean(item);
    const isSelected = item && selectedItem?.id === item.id;
    const isMovingSource = item && movingItemId === item.id;
    const isDragOver = dragOverTarget?.section === section && dragOverTarget?.index === index;

    const matchesSearch = !inventorySearch.trim() || (
      isOccupied && filterCatalogItems([item], inventorySearch).length > 0
    );

    const sectionColors = {
      inventory: { border: '#10b981', dot: '#10b981', label: 'Inventario' },
      backpack: { border: '#f59e0b', dot: '#f59e0b', label: 'Mochila' },
      stored: { border: '#64748b', dot: '#64748b', label: 'No lo lleva' }
    };
    const sColor = sectionColors[section] || sectionColors.inventory;

    return (
      <div
        key={`slot-${section}-${index}`}
        draggable={isOccupied}
        onDragStart={(e) => {
          if (!isOccupied) return;
          e.dataTransfer.setData('text/plain', String(item.id));
          setDraggedItemId(item.id);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (dragOverTarget?.section !== section || dragOverTarget?.index !== index) {
            setDragOverTarget({ section, index });
          }
        }}
        onDragLeave={() => {
          if (dragOverTarget?.section === section && dragOverTarget?.index === index) {
            setDragOverTarget(null);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          const sourceId = draggedItemId !== null ? draggedItemId : e.dataTransfer.getData('text/plain');
          if (sourceId) handleMoveItemToSectionSlot(sourceId, section, index);
          setDraggedItemId(null);
          setDragOverTarget(null);
        }}
        onClick={() => {
          if (movingItemId !== null) {
            handleMoveItemToSectionSlot(movingItemId, section, index);
          } else if (isOccupied) {
            setSelectedItemId(item.id);
            setShowTransferMenu(false);
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isOccupied) {
            setContextMenu({ item, section, index, x: e.clientX, y: e.clientY });
            setSelectedItemId(item.id);
            setShowTransferMenu(false);
          }
        }}
        style={{
          aspectRatio: '1 / 1',
          width: '100%',
          minWidth: 0,
          overflow: 'hidden',
          boxSizing: 'border-box',
          borderRadius: '7px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '4px 5px',
          cursor: movingItemId !== null ? 'pointer' : (isOccupied ? 'grab' : 'pointer'),
          transition: 'all 0.15s ease',
          backgroundColor: isDragOver
            ? '#1d2738'
            : isSelected && isOccupied
            ? '#1e273a'
            : isOccupied
            ? '#171d2b'
            : '#0f131c',
          border: isMovingSource
            ? '2px solid #f59e0b'
            : isDragOver
            ? '2px dashed #10b981'
            : movingItemId !== null
            ? '1.5px dashed #f59e0b'
            : isSelected && isOccupied
            ? '2px solid #38bdf8'
            : isOccupied
            ? `1.5px solid ${sColor.border}`
            : isBackpackSlot
            ? '1px dashed rgba(245, 158, 11, 0.35)'
            : '1px dashed #2b3548',
          boxShadow: isSelected && isOccupied
            ? '0 0 0 2px rgba(56, 189, 248, 0.25), 0 4px 10px rgba(0,0,0,0.45)'
            : isMovingSource
            ? '0 0 12px rgba(245, 158, 11, 0.5)'
            : isOccupied
            ? 'inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 6px rgba(0,0,0,0.35)'
            : 'none',
          opacity: inventorySearch.trim() && !matchesSearch ? 0.25 : 1,
          userSelect: 'none'
        }}
        title={
          movingItemId !== null
            ? `Haz clic para mover aquí al Hueco #${displayNum} (${sColor.label})`
            : isOccupied
            ? `${item.name} (${sColor.label})${item.notes ? `\nNotas: ${item.notes}` : ''}\n• Clic derecho: Menú de acciones\n• Arrastra para mover`
            : `Hueco #${displayNum} (${sColor.label}) - Vacío`
        }
      >
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: '8px',
            fontWeight: 800,
            letterSpacing: '0.02em',
            color: isOccupied ? '#cbd5e1' : '#64748b',
            backgroundColor: isOccupied ? '#0d111a' : '#131823',
            padding: '0 3px',
            borderRadius: '3px',
            border: '1px solid #263044',
            fontFamily: 'monospace',
            lineHeight: '11px'
          }}>
            {displayNum.toString().padStart(2, '0')}
          </span>
          {isOccupied && (
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: sColor.dot,
                boxShadow: `0 0 4px ${sColor.dot}`
              }}
              title={sColor.label}
            />
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          marginTop: '-2px',
          marginBottom: '2px',
          filter: isOccupied ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.65))' : 'none',
          transform: isSelected ? 'scale(1.08)' : 'scale(1)',
          transition: 'transform 0.15s ease',
          color: movingItemId !== null ? '#f59e0b' : '#3b465c'
        }}>
          {isOccupied ? getItemIcon(item, 26) : (movingItemId !== null ? <CornerDownRight size={14} /> : <Plus size={14} strokeWidth={1.8} />)}
        </div>

        <div style={{
          width: '100%',
          borderTop: isOccupied
            ? (isSelected ? '1px solid #38bdf8' : '1px solid #263044')
            : '1px solid #1b2232',
          paddingTop: '2px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginTop: 'auto'
        }}>
          {isOccupied ? (
            <span
              style={{
                fontSize: '8.5px',
                fontWeight: 700,
                color: isSelected ? '#93c5fd' : '#f1f5f9',
                textAlign: 'right',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                lineHeight: '10px'
              }}
              title={item.name}
            >
              {item.name}
            </span>
          ) : (
            <span style={{ fontSize: '7.5px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>
              Vacío
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderTrailingEmptySlot = (displayNum, targetIndex) => {
    const isDragOver = dragOverTarget?.section === 'stored' && dragOverTarget?.index === targetIndex;
    return (
      <div
        key={`slot-stored-empty-${targetIndex}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (dragOverTarget?.section !== 'stored' || dragOverTarget?.index !== targetIndex) {
            setDragOverTarget({ section: 'stored', index: targetIndex });
          }
        }}
        onDragLeave={() => {
          if (dragOverTarget?.section === 'stored' && dragOverTarget?.index === targetIndex) {
            setDragOverTarget(null);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          const sourceId = draggedItemId !== null ? draggedItemId : e.dataTransfer.getData('text/plain');
          if (sourceId) handleMoveItemToSectionSlot(sourceId, 'stored', targetIndex);
          setDraggedItemId(null);
          setDragOverTarget(null);
        }}
        onClick={() => {
          if (movingItemId !== null) handleMoveItemToSectionSlot(movingItemId, 'stored', targetIndex);
        }}
        style={{
          aspectRatio: '1 / 1',
          width: '100%',
          minWidth: 0,
          overflow: 'hidden',
          boxSizing: 'border-box',
          borderRadius: '7px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '4px 5px',
          cursor: movingItemId !== null ? 'pointer' : 'default',
          backgroundColor: isDragOver ? '#142620' : '#0f131c',
          border: isDragOver
            ? '1.5px dashed #10b981'
            : movingItemId !== null
            ? '1.5px dashed #f59e0b'
            : '1px dashed #2b3548',
          transition: 'all 0.15s ease',
          userSelect: 'none'
        }}
        title="Arrastra un objeto aquí para guardarlo en 'No lo lleva' (huecos ilimitados)"
      >
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
          <span style={{ fontSize: '8px', fontWeight: 800, color: '#64748b', backgroundColor: '#131823', padding: '0 3px', borderRadius: '3px', border: '1px solid #263044', fontFamily: 'monospace', lineHeight: '11px' }}>
            {displayNum.toString().padStart(2, '0')}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: movingItemId !== null ? '#f59e0b' : '#475569' }}>
          {movingItemId !== null ? <CornerDownRight size={14} /> : <Plus size={14} strokeWidth={1.8} />}
        </div>
        <div style={{
          width: '100%',
          borderTop: '1px solid #1b2232',
          paddingTop: '2px',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <span style={{ fontSize: '7.5px', fontWeight: 700, color: movingItemId !== null ? '#fbbf24' : '#475569', textAlign: 'right' }}>
            {movingItemId !== null ? 'Guardar' : '+'}
          </span>
        </div>
      </div>
    );
  };

  const displayedStoredItems = inventorySearch.trim()
    ? filterCatalogItems(storedItems, inventorySearch)
    : storedItems;

  const trimmedCommonFilter = commonFilter.trim();
  const filteredCommon = trimmedCommonFilter
    ? filterCatalogItems(DEFAULT_COMMON_ITEMS, trimmedCommonFilter)
    : DEFAULT_COMMON_ITEMS;

  const currentContextItem = contextMenu
    ? (inventory.find(i => String(i.id) === String(contextMenu.item?.id)) || contextMenu.item)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Barra de Búsqueda y Gestión de Inventario */}
      <div style={{
        background: '#121620',
        border: '1px solid #242c3d',
        borderRadius: '8px',
        padding: '8px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ flex: '1 1 200px', minWidth: '180px', maxWidth: '320px' }}>
          <SearchInput
            value={inventorySearch}
            onChange={setInventorySearch}
            placeholder="Buscar en inventario o almacén..."
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddInventoryItem(newItemName);
              }
            }}
            placeholder="Nombre del objeto..."
            style={{ padding: '6px 10px', background: '#0a0d14', color: '#f8fafc', border: '1px solid #2b3548', borderRadius: '6px', fontSize: '11px', width: '150px' }}
          />
          <button
            type="button"
            onClick={() => handleAddInventoryItem(newItemName)}
            className="vtt-primary-cta"
            style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
          >
            + Añadir
          </button>
          <div style={{ position: 'relative' }} ref={commonDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setShowCommonDropdown(!showCommonDropdown);
                setCommonFilter('');
              }}
              className="vtt-brass-btn"
              style={{
                padding: '6px 11px',
                background: '#181e2b',
                color: '#93c5fd',
                border: '1px solid #334155',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Seleccionar un objeto común o herramienta de exploración para añadir al inventario"
            >
              <span>+ Objeto común</span>
              {showCommonDropdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showCommonDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                width: '290px',
                maxHeight: '320px',
                overflowY: 'auto',
                background: '#141824',
                border: '1px solid #334155',
                borderRadius: '8px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.9), 0 0 10px rgba(59, 130, 246, 0.2)',
                zIndex: 10000,
                padding: '6px'
              }}>
                <div style={{ padding: '2px 2px 6px', borderBottom: '1px solid #222c3d', marginBottom: '6px' }}>
                  <SearchInput
                    value={commonFilter}
                    onChange={setCommonFilter}
                    placeholder="Filtrar objetos comunes..."
                    autoFocus
                  />
                </div>

                {filteredCommon.map(ci => (
                  <div
                    key={ci.id}
                    onClick={() => {
                      handleAddInventoryItem(ci.name, null, ci.category, ci.extraSlots, ci.notes);
                      setShowCommonDropdown(false);
                      setCommonFilter('');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1f2738'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div style={{
                      width: '26px',
                      height: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))'
                    }}>
                      {getGameIconComponent(ci.name, 22)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ci.name}
                      </span>
                      <span style={{ fontSize: '9px', color: '#64748b' }}>{ci.category}</span>
                    </div>
                  </div>
                ))}
                {filteredCommon.length === 0 && (
                  <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', padding: '12px 6px', fontStyle: 'italic' }}>
                    No se encontraron objetos con ese nombre
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Banner de aviso cuando el modo "Mover hueco" está activo */}
      {movingItemId !== null && (
        <div style={{
          padding: '8px 14px',
          borderRadius: '8px',
          background: 'rgba(245, 158, 11, 0.2)',
          border: '1px solid #f59e0b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#fbbf24',
          fontSize: '12px',
          fontWeight: 700
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
            <ArrowLeftRight size={14} strokeWidth={2.2} />
            Modo Mover activo: Haz clic en cualquier hueco o sección para colocar o intercambiar &quot;{inventory.find(i => i.id === movingItemId)?.name || 'Objeto'}&quot;.
          </span>
          <button
            type="button"
            onClick={() => setMovingItemId(null)}
            style={{
              background: '#0e1118',
              border: '1px solid #fbbf24',
              color: '#fbbf24',
              padding: '3px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* SECCIÓN 1: INVENTARIO (1 - 10) */}
      <div style={{
        background: '#121622',
        border: '1px solid #242c3d',
        borderRadius: '8px',
        padding: '12px 14px',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 800,
          color: '#cbd5e1',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          marginBottom: '10px',
          paddingBottom: '6px',
          borderBottom: '1px solid #1f2738',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Inventario (1 - 10)</span>
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>Bolsillos y equipo que porta encima</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 74px)',
          gap: '6px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {inventorySlots.map((item, i) => renderSlotCard(item, i + 1, 'inventory', i))}
        </div>
      </div>

      {/* SECCIÓN 1b: MOCHILA (11 - 20) */}
      {hasBackpack && (
        <div style={{
          background: '#141419',
          border: '1px solid #3b352b',
          borderRadius: '8px',
          padding: '12px 14px',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 800,
            color: '#fbbf24',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            marginBottom: '10px',
            paddingBottom: '6px',
            borderBottom: '1px solid #2e281f',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Mochila (11 - 20)</span>
            <span style={{ fontSize: '10px', color: '#a18855', fontWeight: 500 }}>Capacidad expandida por la mochila de viaje</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 74px)',
            gap: '6px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            {backpackSlots.map((item, i) => renderSlotCard(item, i + 11, 'backpack', i, true))}
          </div>
        </div>
      )}

      {/* SECCIÓN 2: NO LO LLEVA (HUECOS ILIMITADOS) */}
      <div style={{
        background: '#10131b',
        border: '1px solid #1f2535',
        borderRadius: '8px',
        padding: '12px 14px',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 800,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          marginBottom: '10px',
          paddingBottom: '6px',
          borderBottom: '1px solid #1a202c',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>No lo lleva (Almacén / Guardado)</span>
            {inventorySearch.trim() && (
              <span style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 700, textTransform: 'none', background: 'rgba(59, 130, 246, 0.15)', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                Filtrados: {displayedStoredItems.length} de {storedItems.length}
              </span>
            )}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 74px)',
          gap: '6px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {displayedStoredItems.map((item, i) => renderSlotCard(item, i + 1, 'stored', i))}
          {renderTrailingEmptySlot(displayedStoredItems.length + 1, displayedStoredItems.length)}
        </div>
      </div>

      {/* Notificación flotante no bloqueante (traspaso o aviso de límite) */}
      {toastNotice && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100002,
          padding: '8px 18px',
          borderRadius: '8px',
          background: 'rgba(15, 23, 42, 0.96)',
          border: toastNotice.variant === 'warning' ? '1px solid #f59e0b' : '1px solid #10b981',
          boxShadow: toastNotice.variant === 'warning'
            ? '0 8px 24px rgba(0,0,0,0.8), 0 0 15px rgba(245, 158, 11, 0.35)'
            : '0 8px 24px rgba(0,0,0,0.8), 0 0 15px rgba(16, 185, 129, 0.4)',
          color: toastNotice.variant === 'warning' ? '#fbbf24' : '#34d399',
          fontSize: '12px',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {toastNotice.variant === 'warning' ? <AlertTriangle size={14} strokeWidth={2.2} /> : <Gift size={14} strokeWidth={2.2} />}
          <span>{toastNotice.message}</span>
        </div>
      )}

      {/* Menú contextual del objeto */}
      <ItemContextMenu
        contextMenu={contextMenu}
        currentItem={currentContextItem}
        inventorySlots={inventorySlots}
        backpackSlots={backpackSlots}
        hasBackpack={hasBackpack}
        backpackInNormal={backpackInNormal}
        storedItemsCount={storedItems.length}
        availableRecipients={availableRecipients}
        showTransferMenu={showTransferMenu}
        setShowTransferMenu={setShowTransferMenu}
        onCloseMenu={() => { setContextMenu(null); setShowTransferMenu(false); }}
        onStartMoving={setMovingItemId}
        onMoveToSectionSlot={handleMoveItemToSectionSlot}
        onUpdateItemNotes={handleUpdateItemNotes}
        onDropItemToFloor={handleDropInventoryItem}
        hasDropHandler={Boolean(onDropItemToFloor)}
        onTransferToRecipient={(recipient, item) => {
          if (onTransferItem) {
            onTransferItem(currentCharId, recipient.id || recipient.characterId, item);
          }
          handleRemoveInventoryItem(item.id);
          setContextMenu(null);
          setShowTransferMenu(false);
          showToast(`"${item.name}" entregado a ${recipient.name}`, 'success');
        }}
        onRemoveItem={handleRemoveInventoryItem}
        onNotify={showToast}
      />
    </div>
  );
};

export default InventorySlotsTab;
