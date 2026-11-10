import {
  segmentsIntersect,
  segmentIntersectsRotatedRect,
  rotateStructureCentered,
  getDefaultStructureDimensions,
  getStructureOrientationSizes
} from '../utils/fogGeometry';
import { useAppSettings } from './useAppSettings';

const segmentIntersectsRect = (fromX, fromY, toX, toY, x1, y1, w, h) => {
  const x2 = x1 + w;
  const y2 = y1 + h;
  return (
    segmentsIntersect(fromX, fromY, toX, toY, x1, y1, x2, y1) ||
    segmentsIntersect(fromX, fromY, toX, toY, x2, y1, x2, y2) ||
    segmentsIntersect(fromX, fromY, toX, toY, x2, y2, x1, y2) ||
    segmentsIntersect(fromX, fromY, toX, toY, x1, y2, x1, y1)
  );
};

/**
 * Hook de interacción directa con el tablero: zoom/pan, drag & drop de fichas/objetos,
 * colisión de movimiento con muros/puertas, pintura FOW, rotación y edición de elementos.
 */
export function useBoardInteraction({
  isPlayerView,
  maps,
  setMaps,
  tokens,
  setTokens,
  setFowActions,
  scale,
  setScale,
  pan,
  setPan,
  gridSize,
  snapToGrid,
  fowEnabled,
  fowMode,
  fowBrushSize,
  rulerActive,
  setRulerActive,
  rulerMeasure,
  setRulerMeasure,
  radialMenu,
  setRadialMenu,
  pendingTokenSpawn,
  setPendingTokenSpawn,
  pendingMapSpawn,
  setPendingMapSpawn,
  isDraggingPan,
  setIsDraggingPan,
  draggedToken,
  setDraggedToken,
  draggedMapElement,
  setDraggedMapElement,
  rotatingToken,
  setRotatingToken,
  isPaintingFow,
  setIsPaintingFow,
  tokenDragMeasurement,
  setTokenDragMeasurement,
  movementLimitsEnabled,
  combatGroups,
  customStatuses,
  setGraveyard,
  setCharacters,
  setIsDraggingCharacter,
  setHoldProgress,
  setIsSettingsOpen,
  setFowMode,
  setObjectNotesModalState,
  boardRef,
  holdTimerRef,
  holdStartPosRef,
  lastFowPointRef,
  tokenDragOriginRef,
  draggedCharacterRef,
  draggedItemRef,
  handleTriggerSound,
  getTokenCombatContext,
  handleAssignTokenToGroup,
  showMasterFeedback
}) {
  const { settings } = useAppSettings();

  const handleToggleDoor = (doorId) => {
    setMaps(prev => prev.map(el => {
      if (el.id === doorId && el.type === 'door') {
        const nextOpen = !el.isOpen;
        handleTriggerSound(nextOpen ? 'sfx_door_open' : 'sfx_door_slam');
        return { ...el, isOpen: nextOpen };
      }
      return el;
    }));
  };

  const handleToggleWindow = (windowId, breakGlass = false) => {
    setMaps(prev => prev.map(el => {
      if (el.id === windowId && el.type === 'window') {
        if (breakGlass) {
          handleTriggerSound('sfx_glass');
          return { ...el, isOpen: true, isBroken: true };
        }
        const nextOpen = !el.isOpen;
        handleTriggerSound('sfx_door_open');
        return { ...el, isOpen: nextOpen };
      }
      return el;
    }));
  };

  const handleToggleObject = (objectId) => {
    setMaps(prev => prev.map(el => {
      if (el.id === objectId && el.type === 'object') {
        const nextOpen = !el.isOpen;
        handleTriggerSound('sfx_chest');
        showMasterFeedback(`${el.name}: ${nextOpen ? 'Activado / Abierto' : 'Cerrado'}`);
        return { ...el, isOpen: nextOpen };
      }
      return el;
    }));
  };

  const handleToggleLight = (lightId) => {
    setMaps(prev => prev.map(el => {
      if (el.id === lightId && el.type === 'light') {
        const nextOn = el.isOn === false;
        handleTriggerSound('sfx_fireball');
        showMasterFeedback(`${el.name}: ${nextOn ? 'Encendida' : 'Apagada'}`);
        return { ...el, isOn: nextOn };
      }
      return el;
    }));
  };

  const isMovementBlocked = (fromX, fromY, toX, toY) => {
    if (Math.abs(toX - fromX) < 0.5 && Math.abs(toY - fromY) < 0.5) return false;

    for (let i = 0; i < maps.length; i++) {
      const el = maps[i];
      if (el.type === 'wall') {
        if (segmentsIntersect(fromX, fromY, toX, toY, el.x1, el.y1, el.x2, el.y2)) {
          return true;
        }
      } else if ((el.type === 'door' || el.type === 'window') && !el.isOpen) {
        const { width: w, height: h, cssRotation } = getStructureOrientationSizes(el);
        const cx = (el.x || 0) + w / 2;
        const cy = (el.y || 0) + h / 2;
        if (segmentIntersectsRotatedRect(fromX, fromY, toX, toY, cx, cy, w, h, cssRotation)) {
          return true;
        }
      } else if (el.type === 'object' && el.blocksMovement && !el.isOpen) {
        if (segmentIntersectsRect(fromX, fromY, toX, toY, el.x, el.y, el.width || 48, el.height || 48)) {
          return true;
        }
      }
    }
    return false;
  };

  const cancelHoldTimer = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(null);
  };

  const handleWheel = (e) => {
    if (radialMenu) setRadialMenu(null);
    const zoomFactor = -e.deltaY * 0.001;
    setScale(prev => Math.min(Math.max(0.2, prev + zoomFactor), 4));
  };

  const getLogicalCoords = (e) => {
    const rect = boardRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / scale,
      y: (e.clientY - rect.top - pan.y) / scale
    };
  };

  const spawnTokenFromCharacter = (char, spawnX, spawnY) => {
    const newToken = {
      id: Date.now() + Math.random(),
      characterId: char.id,
      firstName: char.firstName || '',
      lastName: char.lastName || '',
      birthYear: char.birthYear || '1890',
      name: char.name,
      entityType: char.entityType || (char.faction === 'enemy' ? 'mythos_creature' : 'human'),
      color: char.color,
      avatar: char.avatar || null,
      faction: char.faction || 'ally',
      x: spawnX,
      y: spawnY,
      size: gridSize,
      rotation: 0,
      visionMode: 'cone',
      isLocked: false,
      isHidden: char.faction === 'enemy',
      showName: settings.defaultShowTokenName,
      showBars: settings.defaultShowTokenBars,
      statuses: char.statuses || [],
      hp: char.hp ?? 20,
      maxHp: char.maxHp ?? 20,
      mp: char.mp ?? 10,
      maxMp: char.maxMp ?? 10,
      san: char.san ?? 60,
      maxSan: char.maxSan ?? 60,
      hasArmor: Boolean(char.hasArmor),
      armorType: char.armorType || 'Ninguna',
      isGraveWound: Boolean(char.isGraveWound),
      speed: char.speed || 6,
      turnMovementUsed: 0,
      history: char.history || '',
      notes: char.notes || '',
      inventory: char.inventory || [],
      spells: char.spells || []
    };
    if (char.fromGraveyardId) {
      setGraveyard(prev => prev.filter(g => (g.graveyardId || g.id) !== char.fromGraveyardId));
      if (setCharacters) {
        const revivedCharId = char.characterId || char.id;
        setCharacters((prev) => {
          const exists = prev.some(c => String(c.id) === String(revivedCharId));
          if (exists) {
            return prev.map(c => (String(c.id) === String(revivedCharId) ? { ...c, hp: newToken.hp } : c));
          }
          const revivedLibraryEntry = {
            ...char,
            id: revivedCharId,
            hp: newToken.hp
          };
          delete revivedLibraryEntry.fromGraveyardId;
          delete revivedLibraryEntry.characterId;
          return [...prev, revivedLibraryEntry];
        });
      }
      showMasterFeedback(`"${char.name}" ha resucitado y regresa al tablero`);
    } else {
      if (setCharacters && char.id) {
        setCharacters((prev) => (prev.some(c => String(c.id) === String(char.id)) ? prev : [...prev, { ...char }]));
      }
      showMasterFeedback(`${char.name} desplegado en escena`);
    }
    setTokens(prev => [...prev, newToken]);
  };

  const handleStartDragCharacter = (char) => {
    draggedCharacterRef.current = char;
    setIsDraggingCharacter(true);
    setPendingTokenSpawn(char);
  };

  const handleEndDragCharacter = () => {
    draggedCharacterRef.current = null;
    setIsDraggingCharacter(false);
    setPendingTokenSpawn(null);
  };

  const handleStartDragItem = (itemData) => {
    const mapItem = {
      type: 'item',
      name: itemData.name,
      icon: itemData.icon || '📦',
      category: itemData.category || 'Herramienta',
      notes: itemData.notes || '',
      state: itemData.state || 'equipped',
      width: 18,
      height: 18,
      isLocked: false
    };
    draggedItemRef.current = mapItem;
    setPendingMapSpawn(mapItem);
  };

  const handleEndDragItem = () => {
    draggedItemRef.current = null;
    setPendingMapSpawn(null);
  };

  const handleStartDragMapElement = (elementData) => {
    draggedItemRef.current = elementData;
    setPendingMapSpawn(elementData);
  };

  const handleEndDragMapElement = () => {
    draggedItemRef.current = null;
    setPendingMapSpawn(null);
  };

  const handleDropOnBoard = (e) => {
    if (isPlayerView) return;
    const coords = getLogicalCoords(e);

    let droppedElement = draggedItemRef.current || pendingMapSpawn;
    if (!droppedElement && e.dataTransfer) {
      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.type === 'ground_item' && parsed.item) {
            droppedElement = {
              type: 'item',
              name: parsed.item.name,
              icon: parsed.item.icon || '📦',
              category: parsed.item.category || 'Herramienta',
              notes: parsed.item.notes || '',
              state: parsed.item.state || 'equipped',
              width: 18,
              height: 18,
              isLocked: false
            };
          } else if (parsed && parsed.type === 'map_element' && parsed.element) {
            droppedElement = parsed.element;
          }
        }
      } catch {
        // Ignorar si no es JSON válido
      }
    }

    if (droppedElement) {
      const defaults = (droppedElement.type === 'door' || droppedElement.type === 'window')
        ? getDefaultStructureDimensions(droppedElement.type, settings)
        : { width: droppedElement.type === 'item' ? 18 : 38, height: droppedElement.type === 'item' ? 18 : 38 };
      const elWidth = droppedElement.width || defaults.width;
      const elHeight = droppedElement.height || defaults.height;
      const newElement = {
        ...droppedElement,
        id: Date.now() + Math.random(),
        width: elWidth,
        height: elHeight,
        x: Math.round(coords.x - elWidth / 2),
        y: Math.round(coords.y - elHeight / 2)
      };
      setMaps(prev => [...prev, newElement]);
      showMasterFeedback(`"${newElement.name || 'Elemento'}" colocado en el tablero`);
      draggedItemRef.current = null;
      setPendingMapSpawn(null);
      return;
    }

    const char = draggedCharacterRef.current || pendingTokenSpawn;
    if (!char) return;
    const spawnX = snapToGrid ? Math.floor(coords.x / gridSize) * gridSize : coords.x - gridSize / 2;
    const spawnY = snapToGrid ? Math.floor(coords.y / gridSize) * gridSize : coords.y - gridSize / 2;

    spawnTokenFromCharacter(char, spawnX, spawnY);
    draggedCharacterRef.current = null;
    setIsDraggingCharacter(false);
    setPendingTokenSpawn(null);
  };

  const handlePointerDown = (e) => {
    if (radialMenu) {
      setRadialMenu(null);
      return;
    }

    if (e.button === 1 || e.button === 2) {
      if (pendingTokenSpawn) {
        setPendingTokenSpawn(null);
        return;
      }
      if (pendingMapSpawn) {
        setPendingMapSpawn(null);
        return;
      }
      setIsDraggingPan(true);
      return;
    }

    if (e.button === 0) {
      if (!isPlayerView && pendingMapSpawn) {
        const coords = getLogicalCoords(e);
        const isStructure = pendingMapSpawn.type === 'door' || pendingMapSpawn.type === 'window';
        const defaults = isStructure ? getDefaultStructureDimensions(pendingMapSpawn.type, settings) : { width: 48, height: 48 };
        const w = pendingMapSpawn.width || defaults.width;
        const h = pendingMapSpawn.height || defaults.height;
        const spawnX = snapToGrid ? Math.round(coords.x / gridSize) * gridSize : coords.x - w / 2;
        const spawnY = snapToGrid ? Math.round(coords.y / gridSize) * gridSize : coords.y - h / 2;

        const newMapEl = {
          ...pendingMapSpawn,
          id: Date.now() + Math.random(),
          x: Math.round(spawnX),
          y: Math.round(spawnY),
          width: w,
          height: h,
          isLocked: false
        };

        setMaps(prev => [...prev, newMapEl]);
        showMasterFeedback(`${pendingMapSpawn.name} colocado en el tablero`);
        setPendingMapSpawn(null);
        return;
      }

      if (!isPlayerView && pendingTokenSpawn) {
        const coords = getLogicalCoords(e);
        const spawnX = snapToGrid ? Math.floor(coords.x / gridSize) * gridSize : coords.x - gridSize / 2;
        const spawnY = snapToGrid ? Math.floor(coords.y / gridSize) * gridSize : coords.y - gridSize / 2;
        spawnTokenFromCharacter(pendingTokenSpawn, spawnX, spawnY);
        setPendingTokenSpawn(null);
        return;
      }

      if (rulerActive) {
        const coords = getLogicalCoords(e);
        setRulerMeasure({ startX: coords.x, startY: coords.y, endX: coords.x, endY: coords.y });
        return;
      }

      if (!isPlayerView && fowEnabled && fowMode !== 'none') {
        setIsPaintingFow(true);
        const coords = getLogicalCoords(e);
        lastFowPointRef.current = coords;
        setFowActions(prev => [...prev, { mode: fowMode, x: coords.x, y: coords.y, size: fowBrushSize }]);
        return;
      }

      if (!isPlayerView) {
        const coords = getLogicalCoords(e);
        holdStartPosRef.current = { clientX: e.clientX, clientY: e.clientY };
        setHoldProgress({ x: coords.x, y: coords.y });

        holdTimerRef.current = setTimeout(() => {
          setIsDraggingPan(false);
          setHoldProgress(null);
          setRadialMenu({
            screenX: e.clientX,
            screenY: e.clientY,
            worldX: coords.x,
            worldY: coords.y
          });
        }, 550);
      }

      setIsDraggingPan(true);
    }
  };

  const handleTokenPointerDown = (e, token) => {
    cancelHoldTimer();

    if (e.shiftKey && !isPlayerView && !token.isLocked) {
      setRotatingToken(token.id);
      return;
    }

    if (!isPlayerView && fowEnabled && fowMode !== 'none') return;
    if (rulerActive) return;

    const tokenCombat = getTokenCombatContext(token);
    if (tokenCombat.isCombatActive && movementLimitsEnabled && !e.ctrlKey && !token.isLocked) {
      if (tokenCombat.activeTurnTokenId && token.id !== tokenCombat.activeTurnTokenId) {
        const activeTok = tokens.find(t => t.id === tokenCombat.activeTurnTokenId);
        showMasterFeedback(
          activeTok
            ? `Turno de "${activeTok.name}"${tokenCombat.group ? ` [${tokenCombat.group.name}]` : ''}. Mantén Ctrl para mover a otros.`
            : 'No es el turno de este combatiente.'
        );
        return;
      }
      const baseSpeed = token.speed || 6;
      const maxSpeed = token.isGraveWound ? Math.max(1, Math.floor(baseSpeed / 2)) : baseSpeed;
      const used = token.turnMovementUsed || 0;
      const remaining = Math.max(0, maxSpeed - used);
      if (remaining <= 0) {
        showMasterFeedback(`"${token.name}" agotó su movimiento este turno (${used}/${maxSpeed} casillas). Mantén Ctrl para forzar.`);
        return;
      }
    }

    const activeTokenStatuses = token.statuses || [];
    const isImmobilized = activeTokenStatuses.some(statusId => {
      const statusObj = customStatuses.find(s => s.id === statusId);
      return statusObj && statusObj.effect === 'immobilize';
    });
    if (isImmobilized) return;

    try {
      if (boardRef.current && e.pointerId !== undefined) {
        boardRef.current.setPointerCapture(e.pointerId);
      }
    } catch {
      // Ignorar si no soporta captura en este evento
    }

    tokenDragOriginRef.current = {
      x: token.x,
      y: token.y,
      tokenId: token.id,
      isCtrl: Boolean(e.ctrlKey)
    };
    setDraggedToken(token.id);
  };

  const handleStartTokenRotate = (e, token) => {
    cancelHoldTimer();
    if (isPlayerView || token.isLocked) return;
    setRotatingToken(token.id);
  };

  const handlePointerMove = (e) => {
    if (holdTimerRef.current && holdStartPosRef.current) {
      const dist = Math.hypot(
        e.clientX - holdStartPosRef.current.clientX,
        e.clientY - holdStartPosRef.current.clientY
      );
      if (dist > 8) cancelHoldTimer();
    }

    if (rulerMeasure) {
      const coords = getLogicalCoords(e);
      setRulerMeasure(prev => (prev ? { ...prev, endX: coords.x, endY: coords.y } : null));
      return;
    }

    if (isPaintingFow && fowEnabled && fowMode !== 'none') {
      const coords = getLogicalCoords(e);
      const lastPt = lastFowPointRef.current;
      const minDistance = Math.max(15, (fowBrushSize || 80) / 4);
      if (!lastPt || Math.hypot(coords.x - lastPt.x, coords.y - lastPt.y) >= minDistance) {
        lastFowPointRef.current = coords;
        setFowActions(prev => [...prev, { mode: fowMode, x: coords.x, y: coords.y, size: fowBrushSize }]);
      }
      return;
    }

    if (rotatingToken !== null && boardRef.current) {
      const coords = getLogicalCoords(e);
      setTokens(prev =>
        prev.map(t => {
          if (t.id !== rotatingToken) return t;
          const size = t.size || 50;
          const cx = t.x + size / 2;
          const cy = t.y + size / 2;
          const deg = (Math.atan2(coords.y - cy, coords.x - cx) * 180) / Math.PI;
          return { ...t, rotation: ((Math.round(deg) % 360) + 360) % 360 };
        })
      );
      return;
    }

    if (draggedToken !== null && boardRef.current) {
      const coords = getLogicalCoords(e);
      const currentToken = tokens.find(t => t.id === draggedToken);
      const size = currentToken?.size || 50;
      let targetX = coords.x - size / 2;
      let targetY = coords.y - size / 2;

      const tokenCombat = getTokenCombatContext(currentToken);
      if (tokenCombat.isCombatActive && movementLimitsEnabled && !e.ctrlKey && tokenDragOriginRef.current && currentToken) {
        const originX = tokenDragOriginRef.current.x;
        const originY = tokenDragOriginRef.current.y;
        const baseSpeed = currentToken.speed || 6;
        const maxSpeed = currentToken.isGraveWound ? Math.max(1, Math.floor(baseSpeed / 2)) : baseSpeed;
        const used = currentToken.turnMovementUsed || 0;
        const remaining = Math.max(0, maxSpeed - used);
        const maxPixelDist = remaining * gridSize;

        const dx = targetX - originX;
        const dy = targetY - originY;
        const currentDist = Math.hypot(dx, dy);

        if (currentDist > maxPixelDist && currentDist > 0) {
          const angle = Math.atan2(dy, dx);
          targetX = originX + Math.cos(angle) * maxPixelDist;
          targetY = originY + Math.sin(angle) * maxPixelDist;
        }

        const currentMovedSquares = Math.round(Math.hypot(targetX - originX, targetY - originY) / gridSize);
        setTokenDragMeasurement({
          startX: originX + size / 2,
          startY: originY + size / 2,
          currentX: targetX + size / 2,
          currentY: targetY + size / 2,
          movedSquares: currentMovedSquares,
          maxSquares: remaining,
          totalSpeed: maxSpeed,
          isGraveWound: Boolean(currentToken.isGraveWound)
        });
      } else if (tokenDragMeasurement) {
        setTokenDragMeasurement(null);
      }

      setTokens(prevTokens =>
        prevTokens.map(t => {
          if (t.id !== draggedToken) return t;
          const fromCenterX = t.x + size / 2;
          const fromCenterY = t.y + size / 2;
          const toCenterX = targetX + size / 2;
          const toCenterY = targetY + size / 2;

          if (!isMovementBlocked(fromCenterX, fromCenterY, toCenterX, toCenterY)) {
            return { ...t, x: targetX, y: targetY };
          }
          if (!isMovementBlocked(fromCenterX, fromCenterY, toCenterX, fromCenterY)) {
            return { ...t, x: targetX };
          }
          if (!isMovementBlocked(fromCenterX, fromCenterY, fromCenterX, toCenterY)) {
            return { ...t, y: targetY };
          }
          return t;
        })
      );
      return;
    }

    if (draggedMapElement !== null && boardRef.current) {
      const coords = getLogicalCoords(e);
      setMaps(prevMaps =>
        prevMaps.map(m => {
          if (m.id !== draggedMapElement) return m;
          const w = m.width || 48;
          const h = m.height || 48;
          return {
            ...m,
            x: Math.round(coords.x - w / 2),
            y: Math.round(coords.y - h / 2)
          };
        })
      );
      return;
    }

    if (isDraggingPan && draggedToken === null && draggedMapElement === null && rotatingToken === null) {
      setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
    }
  };

  const handlePointerUp = (e) => {
    cancelHoldTimer();
    try {
      if (boardRef.current && e?.pointerId !== undefined && boardRef.current.hasPointerCapture(e.pointerId)) {
        boardRef.current.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignorar si ya fue liberado
    }
    if (rulerMeasure) setRulerMeasure(null);

    if (draggedToken !== null) {
      if (combatGroups && combatGroups.length > 0 && e?.clientX !== undefined && e?.clientY !== undefined) {
        const elemUnder = document.elementFromPoint(e.clientX, e.clientY);
        const groupEl = elemUnder?.closest('[data-combat-group-id]');
        if (groupEl) {
          const targetGid = groupEl.getAttribute('data-combat-group-id');
          handleAssignTokenToGroup(draggedToken, targetGid === 'free' ? null : targetGid);
        }
      }

      const origin = tokenDragOriginRef.current;
      const isCtrlOverride = Boolean(e?.ctrlKey || origin?.isCtrl);

      setTokens(prevTokens =>
        prevTokens.map(t => {
          if (t.id === draggedToken) {
            let finalX = t.x;
            let finalY = t.y;
            if (snapToGrid) {
              const snappedX = Math.floor((t.x + (t.size || gridSize) / 2) / gridSize) * gridSize;
              const snappedY = Math.floor((t.y + (t.size || gridSize) / 2) / gridSize) * gridSize;
              const size = t.size || 50;
              if (!isMovementBlocked(t.x + size / 2, t.y + size / 2, snappedX + size / 2, snappedY + size / 2)) {
                finalX = snappedX;
                finalY = snappedY;
              }
            }

            const tokenCombat = getTokenCombatContext(t);
            if (tokenCombat.isCombatActive && movementLimitsEnabled && origin && !isCtrlOverride) {
              const pixelDist = Math.hypot(finalX - origin.x, finalY - origin.y);
              const squaresMoved = Math.round(pixelDist / gridSize);
              if (squaresMoved > 0) {
                const baseSpeed = t.speed || 6;
                const maxSpeed = t.isGraveWound ? Math.max(1, Math.floor(baseSpeed / 2)) : baseSpeed;
                const currentUsed = t.turnMovementUsed || 0;
                const remainingBefore = Math.max(0, maxSpeed - currentUsed);
                const actualSquares = Math.min(squaresMoved, remainingBefore);
                const newUsed = currentUsed + actualSquares;
                const remainingAfter = Math.max(0, maxSpeed - newUsed);
                showMasterFeedback(`${t.name}: avanzó ${actualSquares} casillas (${remainingAfter} restantes)`);
                return { ...t, x: finalX, y: finalY, turnMovementUsed: newUsed };
              }
            }
            return { ...t, x: finalX, y: finalY };
          }
          return t;
        })
      );
      tokenDragOriginRef.current = null;
      setTokenDragMeasurement(null);
    }

    if (draggedMapElement !== null && snapToGrid) {
      setMaps(prevMaps =>
        prevMaps.map(m => {
          if (m.id !== draggedMapElement) return m;
          return {
            ...m,
            x: Math.round(m.x / gridSize) * gridSize,
            y: Math.round(m.y / gridSize) * gridSize
          };
        })
      );
    }

    setIsDraggingPan(false);
    setDraggedToken(null);
    setDraggedMapElement(null);
    setRotatingToken(null);
    lastFowPointRef.current = null;
    setIsPaintingFow(false);
    tokenDragOriginRef.current = null;
    setTokenDragMeasurement(null);
  };

  const handleAddToken = (char) => {
    setRulerActive(false);
    setFowMode('none');
    setIsSettingsOpen(false);
    setPendingTokenSpawn(char);
    showMasterFeedback(`Haz clic en el mapa para colocar a ${char.name}`);
  };

  const handleStartPlaceMapElement = (newElement) => {
    setRulerActive(false);
    setFowMode('none');
    setIsSettingsOpen(false);
    setPendingTokenSpawn(null);
    setPendingMapSpawn(newElement);
    showMasterFeedback(`Haz clic en el mapa para colocar ${newElement.name}`);
  };

  const handleMapElementPointerDown = (e, element) => {
    cancelHoldTimer();
    if (isPlayerView || element.isLocked) return;
    setDraggedMapElement(element.id);
  };

  const handleRotateMapElement = (elId) => {
    setMaps(prev => prev.map(m => {
      if (m.id === elId) {
        return { ...m, ...rotateStructureCentered(m) };
      }
      return m;
    }));
    showMasterFeedback('Orientación rotada 90º');
  };

  const handleToggleMapElementLock = (elId) => {
    setMaps(prev => prev.map(m => {
      if (m.id === elId) {
        const next = !m.isLocked;
        showMasterFeedback(next ? 'Posición bloqueada' : 'Posición desbloqueada');
        return { ...m, isLocked: next };
      }
      return m;
    }));
  };

  const handleInspectObject = (objectItem) => {
    setObjectNotesModalState({ isOpen: true, objectItem });
  };

  const handleUpdateObject = (objectId, updatedFields) => {
    setMaps(prev => prev.map(m => (m.id === objectId ? { ...m, ...updatedFields } : m)));
    showMasterFeedback('Objeto y notas actualizados');
  };

  const handleUpdateMapElement = (elId, updatedFields, feedbackMsg = null) => {
    setMaps(prev => prev.map(m => (m.id === elId ? { ...m, ...updatedFields } : m)));
    if (feedbackMsg) showMasterFeedback(feedbackMsg);
  };

  const handleDuplicateMapElement = (el) => {
    if (!el) return;
    const copy = {
      ...el,
      id: Date.now() + Math.random(),
      x: (el.x || 0) + 28,
      y: (el.y || 0) + 28
    };
    setMaps(prev => [...prev, copy]);
    showMasterFeedback(`"${el.name || 'Elemento'}" duplicado en la escena`);
  };

  const handleToggleMapElementState = (elId) => {
    const target = maps.find(m => m.id === elId);
    if (!target) return;
    if (target.type === 'object') handleToggleObject(elId);
    else if (target.type === 'light') handleToggleLight(elId);
    else if (target.type === 'door') handleToggleDoor(elId);
    else if (target.type === 'window') handleToggleWindow(elId, false);
  };

  const handleRemoveMapElement = (elId) => {
    setMaps(prev => prev.filter(m => m.id !== elId));
  };

  const handleToggleTokenLock = (id) => {
    setTokens(prev => prev.map(t => {
      if (t.id === id) {
        const nextLock = !t.isLocked;
        showMasterFeedback(`${t.name}: ${nextLock ? 'Posición bloqueada' : 'Posición desbloqueada'}`);
        return { ...t, isLocked: nextLock };
      }
      return t;
    }));
  };

  const handleToggleTokenName = (id) => {
    setTokens(prev => prev.map(t => (t.id === id ? { ...t, showName: t.showName === false } : t)));
  };

  const handleToggleTokenBars = (id) => {
    setTokens(prev => prev.map(t => (t.id === id ? { ...t, showBars: !t.showBars } : t)));
  };

  const handleToggleTokenHidden = (id) => {
    setTokens(prev => prev.map(t => {
      if (t.id === id) {
        const nextHidden = !t.isHidden;
        showMasterFeedback(`${t.name}: ${nextHidden ? 'En Sigilo (Oculto a Jugadores)' : 'Revelado a Jugadores'}`);
        return { ...t, isHidden: nextHidden };
      }
      return t;
    }));
  };

  const handleToggleTokenFaction = (id) => {
    setTokens(prev => prev.map(t => {
      if (t.id === id) {
        const current = t.faction || 'player';
        const nextFaction = current === 'player' ? 'ally' : current === 'ally' ? 'enemy' : 'player';
        const label = nextFaction === 'enemy' ? 'Enemigo' : nextFaction === 'player' ? 'Jugador' : 'Aliado';
        showMasterFeedback(`${t.name}: ${label}`);
        return { ...t, faction: nextFaction };
      }
      return t;
    }));
  };

  const handleCenterOnToken = (token) => {
    if (!token) return;
    setPan({
      x: window.innerWidth / 2 - token.x * scale,
      y: window.innerHeight / 2 - token.y * scale
    });
    showMasterFeedback(`Cámara centrada en "${token.name}"`);
  };

  const handleUpdateTokenSize = (id, newSize) => {
    setTokens(prev => prev.map(t => (t.id === id ? { ...t, size: newSize } : t)));
  };

  const handleUpdateTokenRotation = (id, newAngle) => {
    const normalized = ((Math.round(newAngle) % 360) + 360) % 360;
    setTokens(prev => prev.map(t => (t.id === id ? { ...t, rotation: normalized } : t)));
  };

  const handleToggleTokenStatus = (tokenId, statusId) => {
    setTokens(prev => prev.map(t => {
      if (t.id !== tokenId) return t;
      const current = t.statuses || [];
      const updated = current.includes(statusId)
        ? current.filter(id => id !== statusId)
        : [...current, statusId];
      return { ...t, statuses: updated };
    }));
  };

  return {
    handleToggleDoor,
    handleToggleWindow,
    handleToggleObject,
    handleToggleLight,
    cancelHoldTimer,
    handleWheel,
    handleStartDragCharacter,
    handleEndDragCharacter,
    handleStartDragItem,
    handleEndDragItem,
    handleStartDragMapElement,
    handleEndDragMapElement,
    handleDropOnBoard,
    handlePointerDown,
    handleTokenPointerDown,
    handleStartTokenRotate,
    handlePointerMove,
    handlePointerUp,
    handleAddToken,
    handleStartPlaceMapElement,
    handleMapElementPointerDown,
    handleRotateMapElement,
    handleToggleMapElementLock,
    handleInspectObject,
    handleUpdateObject,
    handleUpdateMapElement,
    handleDuplicateMapElement,
    handleToggleMapElementState,
    handleRemoveMapElement,
    handleToggleTokenLock,
    handleToggleTokenName,
    handleToggleTokenBars,
    handleToggleTokenHidden,
    handleToggleTokenFaction,
    handleCenterOnToken,
    handleUpdateTokenSize,
    handleUpdateTokenRotation,
    handleToggleTokenStatus
  };
}
