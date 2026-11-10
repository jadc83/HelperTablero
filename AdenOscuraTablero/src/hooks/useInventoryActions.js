/**
 * Hook de gestión de objetos en catálogo común, plantillas personalizadas,
 * recogida en mapa, descarte al suelo y traspaso entre personajes.
 */
export function useInventoryActions({
  tokens,
  characters,
  activeTurnTokenId,
  pan,
  scale,
  snapToGrid,
  gridSize,
  setMaps,
  setTokens,
  setCharacters,
  setCustomObjects,
  setCommonItems,
  onStartPlaceMapElement,
  onArchiveItemsToCodex,
  showMasterFeedback
}) {
  const handleSaveCustomObject = (obj) => {
    setCustomObjects(prev => {
      const exists = prev.some(o => o.id === obj.id);
      return exists ? prev.map(o => (o.id === obj.id ? obj : o)) : [...prev, obj];
    });
    showMasterFeedback(`Plantilla "${obj.name}" guardada en el catálogo`);
  };

  const handleDeleteCustomObject = (id) => {
    setCustomObjects(prev => prev.filter(o => o.id !== id));
    showMasterFeedback('Plantilla eliminada del catálogo');
  };

  const addItemToCombatantAndLibrary = (resolvedId, itemData) => {
    const newItem = {
      id: Date.now() + Math.random(),
      name: itemData.name,
      icon: itemData.icon || '📦',
      category: itemData.category || 'Herramienta',
      state: itemData.state || 'equipped',
      notes: itemData.notes || ''
    };

    const targetToken = tokens.find(t => t.id === resolvedId || t.characterId === resolvedId);
    const linkedCharId = targetToken?.characterId || resolvedId;
    let assignedName = targetToken?.name || '';

    setTokens(prev => prev.map(t => {
      if (t.id === resolvedId || t.characterId === resolvedId || (targetToken && t.characterId === targetToken.characterId)) {
        if (!assignedName) assignedName = t.name;
        const currentInv = Array.isArray(t.inventory) ? t.inventory : [];
        return { ...t, inventory: [...currentInv, newItem] };
      }
      return t;
    }));

    setCharacters(prev => prev.map(c => {
      if (c.id === linkedCharId || c.id === resolvedId || (targetToken && c.name === targetToken.name)) {
        if (!assignedName) assignedName = c.name;
        const currentInv = Array.isArray(c.inventory) ? c.inventory : [];
        return { ...c, inventory: [...currentInv, newItem] };
      }
      return c;
    }));

    if (!assignedName) {
      const found = characters.find(c => c.id === linkedCharId || c.id === resolvedId);
      assignedName = found ? found.name : 'combatiente';
    }

    if (onArchiveItemsToCodex) {
      onArchiveItemsToCodex([newItem], { updateExisting: false });
    }

    return { newItem, assignedName };
  };

  const handleGiveItemToCharacter = (targetId, itemData) => {
    const resolvedId = targetId || activeTurnTokenId || (tokens.length === 1 ? tokens[0].id : null);
    if (!resolvedId) {
      showMasterFeedback('No hay combatiente seleccionado ni turno activo para recibir el objeto');
      return false;
    }
    const { newItem, assignedName } = addItemToCombatantAndLibrary(resolvedId, itemData);
    showMasterFeedback(`"${newItem.name}" entregado a ${assignedName}`);
    return true;
  };

  const handleSaveCommonItem = (item) => {
    setCommonItems(prev => {
      const exists = prev.some(it => it.id === item.id);
      return exists ? prev.map(it => (it.id === item.id ? item : it)) : [...prev, item];
    });
    if (onArchiveItemsToCodex) {
      onArchiveItemsToCodex([item], { updateExisting: true });
    }
    showMasterFeedback(`Objeto "${item.name}" guardado en el catálogo`);
  };

  const handleImportCommonItems = (importedList) => {
    if (!Array.isArray(importedList) || importedList.length === 0) return;
    setCommonItems(prev => {
      const existingIds = new Set(prev.map(it => String(it.id)));
      const existingNames = new Set(prev.map(it => (it.name || '').trim().toLowerCase()));
      const additions = importedList.filter(it =>
        !existingIds.has(String(it.id)) && !existingNames.has((it.name || '').trim().toLowerCase())
      );
      return additions.length > 0 ? [...prev, ...additions] : prev;
    });
    if (onArchiveItemsToCodex) {
      onArchiveItemsToCodex(importedList, { updateExisting: false });
    }
    showMasterFeedback(`Importados ${importedList.length} objeto(s) a la mesa y al Códice`, '📦');
  };

  const handleDeleteCommonItem = (id) => {
    setCommonItems(prev => prev.filter(it => it.id !== id));
    showMasterFeedback('Objeto retirado del catálogo común');
  };

  const handlePickUpItem = (itemElement, targetId) => {
    const resolvedId = targetId || activeTurnTokenId || (tokens.length === 1 ? tokens[0].id : null);
    if (!resolvedId) {
      showMasterFeedback('Selecciona qué combatiente recoge el objeto');
      return false;
    }

    const { assignedName } = addItemToCombatantAndLibrary(resolvedId, itemElement);
    setMaps(prev => prev.filter(m => m.id !== itemElement.id));
    showMasterFeedback(`${assignedName} recogió "${itemElement.name}"`);
    return true;
  };

  const handleDropItemToFloor = (characterOrTokenId, itemToDrop) => {
    const targetToken = tokens.find(t => t.id === characterOrTokenId || t.characterId === characterOrTokenId);
    const linkedCharId = targetToken?.characterId || characterOrTokenId;

    let dropX = targetToken ? targetToken.x + (targetToken.size || 50) + 8 : (-pan.x / scale + 250);
    let dropY = targetToken ? targetToken.y : (-pan.y / scale + 250);

    if (snapToGrid) {
      dropX = Math.round(dropX / gridSize) * gridSize;
      dropY = Math.round(dropY / gridSize) * gridSize;
    }

    const floorItem = {
      id: Date.now() + Math.random(),
      type: 'item',
      name: itemToDrop.name,
      icon: itemToDrop.icon || '📦',
      category: itemToDrop.category || 'Herramienta',
      notes: itemToDrop.notes || '',
      state: itemToDrop.state || 'equipped',
      x: dropX,
      y: dropY,
      width: 18,
      height: 18,
      isLocked: false
    };

    setMaps(prev => [...prev, floorItem]);

    setTokens(prev => prev.map(t => {
      if (t.id === characterOrTokenId || t.characterId === characterOrTokenId || (targetToken && t.characterId === targetToken.characterId)) {
        const inv = Array.isArray(t.inventory) ? t.inventory : [];
        return { ...t, inventory: inv.filter(i => i.id !== itemToDrop.id && i.name !== itemToDrop.name) };
      }
      return t;
    }));

    setCharacters(prev => prev.map(c => {
      if (c.id === linkedCharId || c.id === characterOrTokenId || (targetToken && c.name === targetToken.name)) {
        const inv = Array.isArray(c.inventory) ? c.inventory : [];
        return { ...c, inventory: inv.filter(i => i.id !== itemToDrop.id && i.name !== itemToDrop.name) };
      }
      return c;
    }));

    const charName = targetToken ? targetToken.name : 'Personaje';
    showMasterFeedback(`${charName} descartó "${itemToDrop.name}" al suelo`);
  };

  const handleTransferItemBetweenCharacters = (senderId, recipientId, itemData) => {
    if (!recipientId || !itemData) return false;

    if (senderId) {
      const senderToken = tokens.find(t => t.id === senderId || t.characterId === senderId);
      const senderCharId = senderToken?.characterId || senderId;

      setTokens(prev => prev.map(t => {
        if (t.id === senderId || t.characterId === senderId || (senderToken && t.characterId === senderToken.characterId)) {
          const inv = Array.isArray(t.inventory) ? t.inventory : [];
          return { ...t, inventory: inv.filter(i => i.id !== itemData.id) };
        }
        return t;
      }));

      setCharacters(prev => prev.map(c => {
        if (c.id === senderCharId || c.id === senderId || (senderToken && c.name === senderToken.name)) {
          const inv = Array.isArray(c.inventory) ? c.inventory : [];
          return { ...c, inventory: inv.filter(i => i.id !== itemData.id) };
        }
        return c;
      }));
    }

    return handleGiveItemToCharacter(recipientId, itemData);
  };

  const handleStartPlaceGroundItem = (itemData) => {
    onStartPlaceMapElement({
      type: 'item',
      name: itemData.name,
      icon: itemData.icon || '📦',
      category: itemData.category || 'Herramienta',
      notes: itemData.notes || '',
      state: itemData.state || 'equipped',
      width: 18,
      height: 18,
      isLocked: false
    });
  };

  return {
    handleSaveCustomObject,
    handleDeleteCustomObject,
    handleGiveItemToCharacter,
    handleSaveCommonItem,
    handleImportCommonItems,
    handleDeleteCommonItem,
    handlePickUpItem,
    handleDropItemToFloor,
    handleTransferItemBetweenCharacters,
    handleStartPlaceGroundItem
  };
}
