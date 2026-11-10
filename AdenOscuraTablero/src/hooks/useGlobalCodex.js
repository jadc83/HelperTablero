import { useCallback, useEffect, useState } from 'react';
import { getClassificationMeta } from '../constants/gamePresets';
import {
  EMPTY_CODEX,
  loadGlobalCodex,
  saveGlobalCodex,
  upsertCodexEntities,
  upsertCodexItems
} from '../utils/codexStorage';

/**
 * Hook de gestión del Códice Global persistente (Personajes, Criaturas, Objetos y futuros Hechizos).
 * Auto-carga al iniciar la app y auto-persiste cambios en codex_global.json (Tauri) + IndexedDB.
 */
export function useGlobalCodex(isPlayerView = false) {
  const [codex, setCodex] = useState(EMPTY_CODEX);
  const [codexLoaded, setCodexLoaded] = useState(false);

  useEffect(() => {
    if (isPlayerView) return;
    let mounted = true;
    loadGlobalCodex().then((loaded) => {
      if (!mounted) return;
      setCodex((prev) => {
        const mergedEntities = prev.entities.length > 0
          ? upsertCodexEntities(loaded, prev.entities, { updateExisting: true })
          : loaded;
        return prev.items.length > 0
          ? upsertCodexItems(mergedEntities, prev.items, { updateExisting: true })
          : mergedEntities;
      });
      setCodexLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [isPlayerView]);

  useEffect(() => {
    if (isPlayerView || !codexLoaded) return;
    saveGlobalCodex(codex);
  }, [codex, codexLoaded, isPlayerView]);

  const archiveItemsToCodex = useCallback((items, options = { updateExisting: false }) => {
    if (!Array.isArray(items) || items.length === 0) return;
    setCodex(prev => upsertCodexItems(prev, items, options));
  }, []);

  const archiveEntitiesToCodex = useCallback((entities, options = { updateExisting: true }) => {
    if (!Array.isArray(entities) || entities.length === 0) return;

    const extractedItems = [];
    entities.forEach((ent) => {
      if (Array.isArray(ent?.inventory)) {
        extractedItems.push(...ent.inventory);
      }
    });

    setCodex((prev) => {
      const nextWithEntities = upsertCodexEntities(prev, entities, options);
      return extractedItems.length > 0
        ? upsertCodexItems(nextWithEntities, extractedItems, { updateExisting: false })
        : nextWithEntities;
    });
  }, []);

  const deleteCodexEntity = useCallback((entityId) => {
    setCodex(prev => ({
      ...prev,
      entities: prev.entities.filter(e => String(e.id) !== String(entityId))
    }));
  }, []);

  const deleteCodexItem = useCallback((itemId) => {
    setCodex(prev => ({
      ...prev,
      items: prev.items.filter(it => String(it.id) !== String(itemId))
    }));
  }, []);

  const clearCodexCategory = useCallback((category) => {
    setCodex((prev) => {
      if (category === 'item') {
        return { ...prev, items: [] };
      }
      if (category === 'spell') {
        return { ...prev, spells: [] };
      }
      return {
        ...prev,
        entities: prev.entities.filter(e => getClassificationMeta(e.entityType, e.faction).group !== category)
      };
    });
  }, []);

  return {
    codex,
    codexLoaded,
    archiveEntitiesToCodex,
    archiveItemsToCodex,
    deleteCodexEntity,
    deleteCodexItem,
    clearCodexCategory
  };
}
