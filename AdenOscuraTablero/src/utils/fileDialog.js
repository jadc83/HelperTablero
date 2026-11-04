/**
 * fileDialog.js
 * Utilidad multiplataforma para guardar y cargar archivos en Grimorio VTT.
 * Compatible con:
 * 1. Microsoft Edge WebView2 / Chromium (Tauri v2 en Windows) mediante File System Access API nativa (showSaveFilePicker / showOpenFilePicker).
 * 2. Navegadores Web estándar mediante Blob URL + elemento <a> de descarga / <input type="file">.
 */

export const exportJSON = async (suggestedName, data) => {
  const contentString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  // 1. Prioridad: API nativa del sistema File System Access (abre el diálogo real de Windows "Guardar como")
  if (typeof window.showSaveFilePicker === 'function') {
    try {
      const ext = suggestedName.includes('.') ? `.${suggestedName.split('.').pop()}` : '.json';
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [{
          description: 'Archivo de Crónica VTT (*' + ext + ')',
          accept: { 'application/json': [ext] }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(contentString);
      await writable.close();
      return { success: true, filename: handle.name || suggestedName, method: 'native-picker' };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, cancelled: true };
      }
      console.warn('showSaveFilePicker falló, recurriendo al método de descarga:', err);
    }
  }

  // 2. Fallback estándar para navegadores web
  try {
    const blob = new Blob([contentString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    return { success: true, filename: suggestedName, method: 'download-anchor' };
  } catch (err) {
    console.error('Error al exportar archivo:', err);
    return { success: false, error: err.message };
  }
};

export const importJSON = async (options = {}) => {
  const acceptExt = options.accept || '.json';
  const description = options.description || 'Archivo de Crónica VTT (*.json)';

  // 1. Prioridad: API nativa del sistema File System Access (abre el diálogo real de Windows "Abrir")
  if (typeof window.showOpenFilePicker === 'function') {
    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{
          description,
          accept: { 'application/json': [acceptExt] }
        }]
      });
      const file = await handle.getFile();
      const text = await file.text();
      return { success: true, text, filename: file.name, method: 'native-picker' };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, cancelled: true };
      }
      console.warn('showOpenFilePicker falló, recurriendo al selector clásico:', err);
    }
  }

  // 2. Fallback clásico mediante input type="file" en el DOM
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptExt;
    input.style.display = 'none';

    input.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) {
        resolve({ success: false, cancelled: true });
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        resolve({ success: true, text: ev.target.result, filename: file.name, method: 'dom-input' });
      };
      reader.onerror = () => {
        resolve({ success: false, error: 'Error al leer el archivo seleccionado' });
      };
      reader.readAsText(file);
    };

    document.body.appendChild(input);
    input.click();
    setTimeout(() => {
      if (input.parentNode) input.parentNode.removeChild(input);
    }, 60000);
  });
};
