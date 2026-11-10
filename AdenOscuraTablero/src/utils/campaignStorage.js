import { exportJSON } from './fileDialog';
import { invoke, isTauri } from '@tauri-apps/api/core';

export const openCampaignDB = () => new Promise((resolve, reject) => {
  const req = window.indexedDB.open('vtt_robust_campaign_db', 3);
  req.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains('campaign_store')) {
      db.createObjectStore('campaign_store');
    }
    if (!db.objectStoreNames.contains('campaign_snapshots')) {
      db.createObjectStore('campaign_snapshots', { keyPath: 'timestamp' });
    }
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

export const saveCampaignToDB = async (stateData, createSnapshot = false) => {
  try {
    const db = await openCampaignDB();
    const payload = {
      ...stateData,
      version: '1.4.0',
      updatedAt: new Date().toISOString()
    };

    const tx = db.transaction(['campaign_store', 'campaign_snapshots'], 'readwrite');
    tx.objectStore('campaign_store').put(payload, 'active_campaign');

    if (createSnapshot) {
      const snapStore = tx.objectStore('campaign_snapshots');
      const activeScene = (payload.scenes || []).find(sc => sc.id === payload.activeSceneId) || payload.scenes?.[0];
      const title = activeScene ? `Crónica: ${activeScene.name}` : 'Crónica de Campaña';
      const dateStr = new Date().toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      snapStore.put({
        timestamp: Date.now(),
        title,
        dateStr,
        scenesCount: (payload.scenes || []).length,
        charactersCount: (payload.characters || []).length,
        data: payload
      });

      // Mantener las últimas 10 copias automáticas
      const keysReq = snapStore.getAllKeys();
      keysReq.onsuccess = () => {
        const keys = keysReq.result || [];
        if (keys.length > 10) {
          const toDelete = keys.slice(0, keys.length - 10);
          toDelete.forEach(k => snapStore.delete(k));
        }
      };
    }
    return true;
  } catch (e) {
    console.error('Error guardando campaña en IndexedDB:', e);
    return false;
  }
};

export const saveCampaignSnapshot = async (stateData, customTitle, isConcluded = false) => {
  try {
    const payload = {
      ...stateData,
      isConcluded: Boolean(isConcluded),
      version: '1.4.0',
      updatedAt: new Date().toISOString()
    };
    const activeScene = (payload.scenes || []).find(sc => sc.id === payload.activeSceneId) || payload.scenes?.[0];
    const title = customTitle || (activeScene ? `Crónica: ${activeScene.name}` : 'Crónica de Partida');
    const dateStr = new Date().toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Guardar en carpeta nativa de Tauri si está empaquetado en escritorio
    if (isTauri()) {
      try {
        const safeTitle = (customTitle || payload.adventureName || activeScene?.name || 'cronica').replace(/[^a-z0-9]/gi, '_');
        const filename = `${Date.now()}_${safeTitle}.json`;
        await invoke('save_campaign_file', {
          fileName: filename,
          content: JSON.stringify(payload, null, 2)
        });
      } catch (tauriErr) {
        console.warn('Error guardando archivo en carpeta de Tauri:', tauriErr);
      }
    }

    // 2. Guardar en IndexedDB para disponibilidad instantánea y multiplataforma
    const db = await openCampaignDB();
    const tx = db.transaction('campaign_snapshots', 'readwrite');
    const snapStore = tx.objectStore('campaign_snapshots');
    snapStore.put({
      timestamp: Date.now(),
      title,
      dateStr,
      isConcluded: Boolean(isConcluded),
      scenesCount: (payload.scenes || []).length,
      charactersCount: (payload.characters || []).length,
      data: payload
    });

    const keysReq = snapStore.getAllKeys();
    keysReq.onsuccess = () => {
      const keys = keysReq.result || [];
      if (keys.length > 15) {
        const toDelete = keys.slice(0, keys.length - 15);
        toDelete.forEach(k => snapStore.delete(k));
      }
    };
    return true;
  } catch (e) {
    console.error('Error guardando snapshot de campaña:', e);
    return false;
  }
};

export const clearActiveCampaignDB = async () => {
  try {
    const db = await openCampaignDB();
    const tx = db.transaction('campaign_store', 'readwrite');
    tx.objectStore('campaign_store').delete('active_campaign');
    return true;
  } catch (e) {
    console.error('Error limpiando active_campaign en IndexedDB:', e);
    return false;
  }
};

export const getRecentCampaigns = async () => {
  // 1. Si está ejecutándose en Tauri, intentar leer la carpeta dedicada 'campaigns' en disco
  if (isTauri()) {
    try {
      const files = await invoke('list_campaign_files');
      if (Array.isArray(files) && files.length > 0) {
        return files.slice(0, 3).map(file => {
          let parsedData = null;
          try {
            parsedData = JSON.parse(file.content);
          } catch {
            // Ignorar archivos JSON corruptos
          }

          const advTitle = parsedData?.adventureName;
          const activeScene = parsedData?.scenes?.find(sc => sc.id === parsedData?.activeSceneId) || parsedData?.scenes?.[0];
          const sceneTitle = advTitle || (activeScene ? `Crónica: ${activeScene.name}` : file.file_name.replace('.json', ''));
          const scenesCount = (parsedData?.scenes || []).length;
          const charactersCount = (parsedData?.characters || []).length;
          const formattedDate = new Date(file.modified_timestamp || Date.now()).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date(file.modified_timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return {
            id: file.modified_timestamp || file.file_name,
            title: advTitle || `Crónica: ${sceneTitle}`,
            dateStr: formattedDate,
            isConcluded: Boolean(parsedData?.isConcluded),
            scenesCount,
            charactersCount,
            data: parsedData,
            filePath: file.file_path
          };
        });
      }
    } catch (tauriErr) {
      console.warn('Error listando archivos de campañas en Tauri:', tauriErr);
    }
  }

  // 2. Fallback a IndexedDB (navegador web o cuando no hay archivos en disco)
  try {
    const snapshots = await getCampaignSnapshots();
    return snapshots.slice(0, 3).map(s => {
      const activeScene = s.data?.scenes?.find(sc => sc.id === s.data?.activeSceneId) || s.data?.scenes?.[0];
      const sceneTitle = activeScene ? activeScene.name : 'Crónica Principal';
      const scenesCount = s.scenesCount ?? (s.data?.scenes || []).length;
      const charactersCount = s.charactersCount ?? (s.data?.characters || []).length;
      const formattedDate = new Date(s.timestamp || Date.now()).toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date(s.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return {
        id: s.timestamp,
        title: s.title || `Crónica: ${sceneTitle}`,
        dateStr: s.dateStr || formattedDate,
        isConcluded: Boolean(s.isConcluded || s.data?.isConcluded),
        scenesCount,
        charactersCount,
        data: s.data
      };
    });
  } catch {
    return [];
  }
};

export const loadCampaignFromDB = async () => {
  try {
    const db = await openCampaignDB();
    return await new Promise((resolve) => {
      const tx = db.transaction('campaign_store', 'readonly');
      const req = tx.objectStore('campaign_store').get('active_campaign');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

export const getCampaignSnapshots = async () => {
  try {
    const db = await openCampaignDB();
    return await new Promise((resolve) => {
      const tx = db.transaction('campaign_snapshots', 'readonly');
      const req = tx.objectStore('campaign_snapshots').getAll();
      req.onsuccess = () => resolve((req.result || []).reverse());
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
};

export const exportCampaignJSON = async (stateData) => {
  const cleanPayload = {
    ...stateData,
    exportedAt: new Date().toISOString(),
    app: 'Grimorio VTT'
  };
  const activeScene = (stateData?.scenes || []).find(sc => sc.id === stateData?.activeSceneId) || stateData?.scenes?.[0];
  const sceneName = activeScene?.name ? `_${activeScene.name.toLowerCase().replace(/[^a-z0-9]/gi, '_')}` : '';
  const filename = `cronica_vtt${sceneName}_${new Date().toISOString().slice(0, 10)}.json`;

  // Registrar copia en el historial de campañas recientes
  try {
    await saveCampaignSnapshot(cleanPayload, `Copia Exportada: ${activeScene?.name || 'Mesa'}`);
  } catch {
    // Continuar con descarga aunque falle el historial local
  }

  return await exportJSON(filename, cleanPayload);
};