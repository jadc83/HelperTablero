import { invoke, isTauri } from '@tauri-apps/api/core';
import { DEFAULT_COMMON_ITEMS } from '../constants/commonItems';

const CODEX_DB_NAME = 'vtt_global_codex_db';
const CODEX_DB_VERSION = 1;
const CODEX_STORE_NAME = 'codex_store';
const CODEX_KEY = 'global_codex';

export const EMPTY_CODEX = {
  version: '1.0.0',
  updatedAt: null,
  entities: [],
  items: [],
  spells: []
};

const BUILT_IN_ITEM_IDS = new Set(DEFAULT_COMMON_ITEMS.map(item => String(item.id)));

const getItemSignature = (item) => {
  const name = (item?.name || '').trim().toLowerCase();
  const category = (item?.category || '').trim().toLowerCase();
  const notes = (item?.notes || '').trim().toLowerCase();
  return `${name}::${category}::${notes}`;
};

const BUILT_IN_ITEM_SIGNATURES = new Set(DEFAULT_COMMON_ITEMS.map(getItemSignature));

export const isBuiltInCatalogItem = (item) => {
  if (!item || typeof item !== 'object') return false;
  if (item.id && BUILT_IN_ITEM_IDS.has(String(item.id))) return true;
  return BUILT_IN_ITEM_SIGNATURES.has(getItemSignature(item));
};

export const normalizeCodex = (raw) => {
  if (!raw || typeof raw !== 'object') {
    return { ...EMPTY_CODEX };
  }
  return {
    version: raw.version || '1.0.0',
    updatedAt: raw.updatedAt || null,
    entities: Array.isArray(raw.entities) ? raw.entities.filter(e => e && typeof e === 'object' && e.name) : [],
    items: Array.isArray(raw.items) ? raw.items.filter(it => it && typeof it === 'object' && it.name && !isBuiltInCatalogItem(it)) : [],
    spells: Array.isArray(raw.spells) ? raw.spells : []
  };
};

const openCodexDB = () => new Promise((resolve, reject) => {
  if (typeof window === 'undefined' || !window.indexedDB) {
    reject(new Error('IndexedDB unavailable'));
    return;
  }
  const req = window.indexedDB.open(CODEX_DB_NAME, CODEX_DB_VERSION);
  req.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains(CODEX_STORE_NAME)) {
      db.createObjectStore(CODEX_STORE_NAME);
    }
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const readCodexFromIDB = async () => {
  try {
    const db = await openCodexDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(CODEX_STORE_NAME, 'readonly');
      const req = tx.objectStore(CODEX_STORE_NAME).get(CODEX_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

const writeCodexToIDB = async (codex) => {
  try {
    const db = await openCodexDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(CODEX_STORE_NAME, 'readwrite');
      tx.objectStore(CODEX_STORE_NAME).put(codex, CODEX_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
    return true;
  } catch (err) {
    console.warn('Error guardando Códice en IndexedDB:', err);
    return false;
  }
};

export const saveGlobalCodex = async (codex) => {
  const payload = {
    ...normalizeCodex(codex),
    updatedAt: new Date().toISOString()
  };

  await writeCodexToIDB(payload);

  if (isTauri()) {
    try {
      await invoke('save_codex_file', { content: JSON.stringify(payload, null, 2) });
    } catch (err) {
      console.warn('Error guardando codex_global.json en disco:', err);
    }
  }

  return payload;
};

export const loadGlobalCodex = async () => {
  const idbData = await readCodexFromIDB();

  if (isTauri()) {
    try {
      const rawContent = await invoke('load_codex_file');
      if (rawContent && rawContent.trim().length > 0) {
        const parsed = normalizeCodex(JSON.parse(rawContent));
        await writeCodexToIDB(parsed);
        return parsed;
      }
      if (idbData) {
        const migrated = normalizeCodex(idbData);
        await invoke('save_codex_file', { content: JSON.stringify(migrated, null, 2) });
        return migrated;
      }
    } catch (err) {
      console.warn('Error cargando codex_global.json de Tauri, usando IndexedDB:', err);
    }
  }

  return normalizeCodex(idbData);
};

export const upsertCodexEntities = (prevCodex, list, { updateExisting = true } = {}) => {
  if (!Array.isArray(list) || list.length === 0) return prevCodex;

  const base = normalizeCodex(prevCodex);
  const byId = new Map(base.entities.map(ent => [String(ent.id), ent]));
  const now = new Date().toISOString();
  let changed = false;

  list.forEach((raw) => {
    if (!raw || typeof raw !== 'object') return;
    const name = (raw.name || '').trim();
    if (!name) return;

    const entityId = String(raw.id || `entity_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
    const existing = byId.get(entityId);

    if (existing && !updateExisting) {
      return;
    }

    const sanitized = {
      ...raw,
      id: raw.id ?? entityId,
      name,
      firstSeenAt: existing?.firstSeenAt || raw.firstSeenAt || now,
      lastUpdatedAt: now
    };
    delete sanitized.turnMovementUsed;
    delete sanitized.x;
    delete sanitized.y;
    delete sanitized.rotation;
    delete sanitized.combatGroupId;

    byId.set(entityId, sanitized);
    changed = true;
  });

  if (!changed) return prevCodex;
  return {
    ...base,
    updatedAt: now,
    entities: Array.from(byId.values())
  };
};

export const upsertCodexItems = (prevCodex, list, { updateExisting = false } = {}) => {
  if (!Array.isArray(list) || list.length === 0) return prevCodex;

  const base = normalizeCodex(prevCodex);
  const byId = new Map();
  const sigToId = new Map();

  base.items.forEach((it) => {
    const idKey = String(it.id);
    byId.set(idKey, it);
    sigToId.set(getItemSignature(it), idKey);
  });

  const now = new Date().toISOString();
  let changed = false;

  list.forEach((raw) => {
    if (!raw || typeof raw !== 'object') return;
    const name = (raw.name || '').trim();
    if (!name || isBuiltInCatalogItem(raw)) return;

    const sig = getItemSignature(raw);
    const matchedExistingId = (raw.id && byId.has(String(raw.id)))
      ? String(raw.id)
      : sigToId.get(sig);

    if (matchedExistingId && !updateExisting) {
      return;
    }

    const itemId = matchedExistingId || String(raw.id || `codex_item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
    const existing = byId.get(itemId);

    const sanitized = {
      id: existing?.id ?? raw.id ?? itemId,
      name,
      icon: raw.icon || '📦',
      category: raw.category || 'Herramienta',
      state: raw.state || 'equipped',
      notes: raw.notes || '',
      ...(raw.extraSlots ? { extraSlots: raw.extraSlots } : {}),
      firstSeenAt: existing?.firstSeenAt || raw.firstSeenAt || now,
      lastUpdatedAt: now
    };

    byId.set(itemId, sanitized);
    sigToId.set(sig, itemId);
    changed = true;
  });

  if (!changed) return prevCodex;
  return {
    ...base,
    updatedAt: now,
    items: Array.from(byId.values())
  };
};
