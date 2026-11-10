const COMBAT_GROUP_COLORS = [
  { hex: '#f59e0b', border: '#fbbf24', bg: 'rgba(245, 158, 11, 0.16)' },
  { hex: '#a855f7', border: '#c084fc', bg: 'rgba(168, 85, 247, 0.16)' },
  { hex: '#06b6d4', border: '#22d3ee', bg: 'rgba(6, 182, 212, 0.16)' },
  { hex: '#ef4444', border: '#f87171', bg: 'rgba(239, 68, 68, 0.16)' },
  { hex: '#10b981', border: '#34d399', bg: 'rgba(16, 185, 129, 0.16)' },
  { hex: '#f97316', border: '#fb923c', bg: 'rgba(249, 115, 22, 0.16)' }
];

const getTokenEffectiveSpeed = (token) => {
  const baseSpeed = token?.speed || 6;
  return token?.isGraveWound ? Math.max(1, Math.floor(baseSpeed / 2)) : baseSpeed;
};

/**
 * Hook de gestión de combate por turnos y encuentros independientes (grupos de combate).
 */
export function useCombatManager({
  tokens,
  setTokens,
  combatGroups,
  setCombatGroups,
  isCombatActive,
  setIsCombatActive,
  combatRound,
  setCombatRound,
  activeTurnTokenId,
  setActiveTurnTokenId,
  setMovementLimitsEnabled,
  tokenDragOriginRef,
  setTokenDragMeasurement,
  showMasterFeedback
}) {
  const clearMovementDragState = () => {
    tokenDragOriginRef.current = null;
    setTokenDragMeasurement(null);
  };

  const getTokenCombatContext = (token) => {
    if (!token) return { isCombatActive: false, combatRound: 1, activeTurnTokenId: null, group: null };
    if (!combatGroups || combatGroups.length === 0) {
      return { isCombatActive, combatRound, activeTurnTokenId, group: null };
    }
    if (!token.combatGroupId) {
      return { isCombatActive: false, combatRound: 1, activeTurnTokenId: null, group: null };
    }
    const group = combatGroups.find(g => g.id === token.combatGroupId);
    if (!group) {
      return { isCombatActive: false, combatRound: 1, activeTurnTokenId: null, group: null };
    }
    return {
      isCombatActive: Boolean(group.isCombatActive),
      combatRound: group.combatRound || 1,
      activeTurnTokenId: group.activeTurnTokenId || null,
      group
    };
  };

  const handleReorderTokens = (fromIndex, toIndex) => {
    setTokens(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleStartCombat = () => {
    if (!tokens.length) return;
    setIsCombatActive(true);
    setCombatRound(1);
    setActiveTurnTokenId(tokens[0].id);
    setTokens(prev => prev.map(t => ({ ...t, turnMovementUsed: 0 })));
    clearMovementDragState();
    const speed = getTokenEffectiveSpeed(tokens[0]);
    showMasterFeedback(`Combate iniciado: turno de ${tokens[0].name} (${speed} casillas)`);
  };

  const handleNextTurn = () => {
    if (!tokens.length) return;
    const currentIndex = tokens.findIndex(t => t.id === activeTurnTokenId);
    let nextIndex = currentIndex + 1;
    let nextRound = combatRound;

    if (nextIndex >= tokens.length) {
      nextIndex = 0;
      nextRound += 1;
      setCombatRound(nextRound);
      showMasterFeedback(`Nueva ronda de combate: Ronda ${nextRound}`);
    }

    const nextToken = tokens[nextIndex];
    if (nextToken) {
      setActiveTurnTokenId(nextToken.id);
      setTokens(prev => prev.map(t => (t.id === nextToken.id ? { ...t, turnMovementUsed: 0 } : t)));
      clearMovementDragState();
      const speed = getTokenEffectiveSpeed(nextToken);
      showMasterFeedback(`Turno de: ${nextToken.name} (${speed} casillas)`);
    }
  };

  const handleSelectActiveTurn = (tokenId) => {
    const targetToken = tokens.find(t => t.id === tokenId);
    if (!targetToken) return;
    setActiveTurnTokenId(tokenId);
    setTokens(prev => prev.map(t => (t.id === tokenId ? { ...t, turnMovementUsed: 0 } : t)));
    clearMovementDragState();
    const speed = getTokenEffectiveSpeed(targetToken);
    showMasterFeedback(`Turno asignado a: ${targetToken.name} (${speed} casillas)`);
  };

  const handleEndCombat = () => {
    setIsCombatActive(false);
    setActiveTurnTokenId(null);
    setCombatRound(1);
    setTokens(prev => prev.map(t => ({ ...t, turnMovementUsed: 0 })));
    clearMovementDragState();
    showMasterFeedback('Combate finalizado');
  };

  const handleToggleMovementLimits = () => {
    setMovementLimitsEnabled(prev => {
      const next = !prev;
      showMasterFeedback(
        next ? 'Límites de movimiento en combate: ACTIVADOS' : 'Límites de movimiento: DESACTIVADOS (Movimiento libre)'
      );
      return next;
    });
  };

  const handleResetTokenMovement = (tokenId) => {
    setTokens(prev => prev.map(t => (t.id === tokenId ? { ...t, turnMovementUsed: 0 } : t)));
    setTokenDragMeasurement(null);
    showMasterFeedback('Presupuesto de movimiento restablecido');
  };

  const handleCreateCombatGroup = (customName) => {
    const nextIdx = combatGroups.length;
    const colorTheme = COMBAT_GROUP_COLORS[nextIdx % COMBAT_GROUP_COLORS.length];
    const newGroup = {
      id: `cg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: customName || `Encuentro ${nextIdx + 1}`,
      color: colorTheme.hex,
      borderColor: colorTheme.border,
      bgColor: colorTheme.bg,
      isCombatActive: false,
      combatRound: 1,
      activeTurnTokenId: null
    };

    setCombatGroups(prev => [...prev, newGroup]);
    showMasterFeedback(`Creado grupo de combate: "${newGroup.name}"`);
    return newGroup.id;
  };

  const handleRemoveCombatGroup = (groupId) => {
    setCombatGroups(prev => prev.filter(g => g.id !== groupId));
    setTokens(prev => prev.map(t => (t.combatGroupId === groupId ? { ...t, combatGroupId: null } : t)));
    showMasterFeedback('Grupo de combate disuelto');
  };

  const handleUpdateCombatGroup = (groupId, updates) => {
    setCombatGroups(prev => prev.map(g => (g.id === groupId ? { ...g, ...updates } : g)));
  };

  const handleAssignTokenToGroup = (tokenId, groupId) => {
    setTokens(prev => prev.map(t => (t.id === tokenId ? { ...t, combatGroupId: groupId || null } : t)));
    const targetGroup = combatGroups.find(g => g.id === groupId);
    const targetToken = tokens.find(t => t.id === tokenId);
    if (targetToken) {
      showMasterFeedback(
        targetGroup ? `"${targetToken.name}" asignado a "${targetGroup.name}"` : `"${targetToken.name}" ahora está libre`
      );
    }
  };

  const handleStartGroupCombat = (groupId) => {
    const group = combatGroups.find(g => g.id === groupId);
    if (!group) return;
    const groupTokens = tokens.filter(t => t.combatGroupId === groupId);
    if (groupTokens.length === 0) {
      showMasterFeedback(`"${group.name}" no tiene personajes asignados. Arrastra fichas al grupo primero.`);
      return;
    }

    const firstToken = groupTokens[0];
    setCombatGroups(prev => prev.map(g => (
      g.id === groupId ? { ...g, isCombatActive: true, combatRound: 1, activeTurnTokenId: firstToken.id } : g
    )));

    setTokens(prev => prev.map(t => (t.combatGroupId === groupId ? { ...t, turnMovementUsed: 0 } : t)));
    clearMovementDragState();

    const speed = getTokenEffectiveSpeed(firstToken);
    showMasterFeedback(`Combate iniciado en [${group.name}]: turno de ${firstToken.name} (${speed} casillas)`);
  };

  const handleNextGroupTurn = (groupId) => {
    const group = combatGroups.find(g => g.id === groupId);
    if (!group) return;
    const groupTokens = tokens.filter(t => t.combatGroupId === groupId);
    if (groupTokens.length === 0) return;

    const currentIndex = groupTokens.findIndex(t => t.id === group.activeTurnTokenId);
    let nextIndex = currentIndex + 1;
    let nextRound = group.combatRound || 1;

    if (nextIndex >= groupTokens.length) {
      nextIndex = 0;
      nextRound += 1;
      showMasterFeedback(`[${group.name}] Nueva ronda: Ronda ${nextRound}`);
    }

    const nextToken = groupTokens[nextIndex];
    if (nextToken) {
      setCombatGroups(prev => prev.map(g => (
        g.id === groupId ? { ...g, combatRound: nextRound, activeTurnTokenId: nextToken.id } : g
      )));
      setTokens(prev => prev.map(t => (t.id === nextToken.id ? { ...t, turnMovementUsed: 0 } : t)));
      clearMovementDragState();
      const speed = getTokenEffectiveSpeed(nextToken);
      showMasterFeedback(`[${group.name}] Turno de: ${nextToken.name} (${speed} casillas)`);
    }
  };

  const handleSelectGroupActiveTurn = (groupId, tokenId) => {
    const targetToken = tokens.find(t => t.id === tokenId);
    if (!targetToken) return;
    setCombatGroups(prev => prev.map(g => (
      g.id === groupId ? { ...g, activeTurnTokenId: tokenId } : g
    )));
    setTokens(prev => prev.map(t => (t.id === tokenId ? { ...t, turnMovementUsed: 0 } : t)));
    clearMovementDragState();
    showMasterFeedback(`Turno asignado a: ${targetToken.name}`);
  };

  const handleEndGroupCombat = (groupId) => {
    const group = combatGroups.find(g => g.id === groupId);
    setCombatGroups(prev => prev.map(g => (
      g.id === groupId ? { ...g, isCombatActive: false, activeTurnTokenId: null, combatRound: 1 } : g
    )));
    setTokens(prev => prev.map(t => (t.combatGroupId === groupId ? { ...t, turnMovementUsed: 0 } : t)));
    clearMovementDragState();
    showMasterFeedback(`Combate finalizado en [${group?.name || 'Encuentro'}]`);
  };

  const handleDisbandAllGroups = () => {
    setCombatGroups([]);
    setTokens(prev => prev.map(t => ({ ...t, combatGroupId: null })));
    showMasterFeedback('Todos los grupos de combate han sido disueltos. Modo estándar restaurado.');
  };

  return {
    getTokenCombatContext,
    handleReorderTokens,
    handleStartCombat,
    handleNextTurn,
    handleSelectActiveTurn,
    handleEndCombat,
    handleToggleMovementLimits,
    handleResetTokenMovement,
    handleCreateCombatGroup,
    handleRemoveCombatGroup,
    handleUpdateCombatGroup,
    handleAssignTokenToGroup,
    handleStartGroupCombat,
    handleNextGroupTurn,
    handleSelectGroupActiveTurn,
    handleEndGroupCombat,
    handleDisbandAllGroups
  };
}
