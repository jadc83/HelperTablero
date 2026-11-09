import React, { useState, useRef, useEffect } from 'react';
import { exportJSON, importJSON } from '../utils/fileDialog';
import {
  MousePointer2,
  BrickWall,
  DoorClosed,
  AppWindow,
  Package,
  Flame,
  Scroll
} from 'lucide-react';

export const OBJECT_PRESETS = [
  { presetId: 'chest', label: 'Cofre del Tesoro', icon: '📦', openIcon: '🪙', blocksMovement: true, blocksVision: false, interactable: true },
  { presetId: 'lever', label: 'Palanca / Mecanismo', icon: '🕹️', openIcon: '⚙️', blocksMovement: false, blocksVision: false, interactable: true },
  { presetId: 'barricade', label: 'Barricada Pesada', icon: '🚧', openIcon: '🪵', blocksMovement: true, blocksVision: true, interactable: true },
  { presetId: 'altar', label: 'Altar Arcano', icon: '⛩️', openIcon: '✨', blocksMovement: true, blocksVision: false, interactable: true },
  { presetId: 'trap', label: 'Trampa de Suelo', icon: '🕸️', openIcon: '💥', blocksMovement: false, blocksVision: false, interactable: true }
];

export const LIGHT_PRESETS = [
  { presetId: 'torch', label: 'Antorcha de Pared', icon: '🔥', radius: 210, color: 'rgba(251, 146, 60, 0.22)' },
  { presetId: 'brazier', label: 'Brasero Real', icon: '🏮', radius: 300, color: 'rgba(245, 158, 11, 0.26)' },
  { presetId: 'arcane_lantern', label: 'Farol Espectral', icon: '🔮', radius: 240, color: 'rgba(56, 189, 248, 0.24)' }
];

const MapCreator = ({ initialElements, onLoadMapToBoard, onClose, onReturnToSettings, sceneName, sceneId }) => {
  const [elements, setElements] = useState(initialElements || []);

  useEffect(() => {
    if (initialElements) {
      setElements(initialElements);
    }
  }, [initialElements, sceneId]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.85);
  
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [draggingElements, setDraggingElements] = useState(false);
  
  const [clipboard, setClipboard] = useState([]);
  const [editingNote, setEditingNote] = useState(null); 
  const [editingObject, setEditingObject] = useState(null);
  const [editingLight, setEditingLight] = useState(null);
  const [toolMode, setToolMode] = useState('select'); // 'select' | 'wall'
  const [drawingWall, setDrawingWall] = useState(null);

  const boardRef = useRef(null);
  const fileInputRef = useRef(null);
  const importRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editingNote || editingObject || editingLight) return; 

      if (e.key === 'Delete' || e.key === 'Backspace') {
        setElements(prev => prev.filter(el => !selectedIds.includes(el.id)));
        setSelectedIds([]);
      }

      if (e.key === 'Escape') {
        setToolMode('select');
        setDrawingWall(null);
        setSelectedIds([]);
      }
      
      if (e.ctrlKey && e.key === 'c') {
        const copied = elements.filter(el => selectedIds.includes(el.id));
        setClipboard(copied);
      }
      
      if (e.ctrlKey && e.key === 'v') {
        if (clipboard.length > 0) {
          const newElements = clipboard.map(el => ({
            ...el,
            id: Date.now() + Math.random(), 
            x: el.x + 50, 
            y: el.y + 50
          }));
          setElements(prev => [...prev, ...newElements]);
          setSelectedIds(newElements.map(el => el.id));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, elements, clipboard, editingNote, editingObject, editingLight]);

  const getViewportCenter = () => {
    const rect = boardRef.current ? boardRef.current.getBoundingClientRect() : { width: window.innerWidth - 290, height: window.innerHeight - 60 };
    return {
      x: -pan.x / scale + rect.width / 2 / scale,
      y: -pan.y / scale + rect.height / 2 / scale
    };
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const center = getViewportCenter();
          const newMap = {
            id: Date.now(), type: 'image', src: event.target.result,
            x: center.x - img.width / 2,
            y: center.y - img.height / 2,
            width: img.width, height: img.height, zIndex: elements.length
          };
          setElements(prev => [...prev, newMap]);
          setSelectedIds([newMap.id]);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleExportMapConfig = async () => {
    try {
      await exportJSON('layout_mapa.json', elements);
    } catch (err) {
      console.error('Error al exportar mapa:', err);
    }
  };

  const handleImportMapConfig = async (e) => {
    if (e && e.target && e.target.files) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try { 
          const importedData = JSON.parse(evt.target.result);
          if (Array.isArray(importedData)) {
            setElements(importedData);
          }
        } catch (err) {}
        e.target.value = '';
      };
      reader.readAsText(file);
      return;
    }

    try {
      const res = await importJSON({ accept: '.json', description: 'Diseño de Escenario (*.json)' });
      if (res?.success && res.text) {
        const importedData = JSON.parse(res.text);
        if (Array.isArray(importedData)) {
          setElements(importedData);
        }
      }
    } catch (err) {
      console.error('Error al importar mapa:', err);
    }
  };

  const handleCreateNote = (posX, posY) => {
    const center = (posX !== undefined && posY !== undefined) ? { x: posX, y: posY } : getViewportCenter();
    const newNote = {
      id: Date.now(), type: 'note', title: 'Pergamino Antiguo', content: 'Escribe aquí la pista o inscripción...',
      x: Math.round(center.x - 20), y: Math.round(center.y - 20),
      width: 40, height: 40, zIndex: elements.length
    };
    setElements(prev => [...prev, newNote]);
    setSelectedIds([newNote.id]);
    setEditingNote(newNote);
  };

  const handleCreateDoor = (posX, posY) => {
    const center = (posX !== undefined && posY !== undefined) ? { x: posX, y: posY } : getViewportCenter();
    const newDoor = {
      id: Date.now(),
      type: 'door',
      x: Math.round(center.x - 30),
      y: Math.round(center.y - 8),
      width: 60,
      height: 16,
      isOpen: false,
      zIndex: elements.length + 10
    };
    setElements(prev => [...prev, newDoor]);
    setSelectedIds([newDoor.id]);
  };

  const handleCreateWindow = (posX, posY) => {
    const center = (posX !== undefined && posY !== undefined) ? { x: posX, y: posY } : getViewportCenter();
    const newWindow = {
      id: Date.now(),
      type: 'window',
      x: Math.round(center.x - 30),
      y: Math.round(center.y - 7),
      width: 60,
      height: 14,
      isOpen: false,
      isBroken: false,
      zIndex: elements.length + 10
    };
    setElements(prev => [...prev, newWindow]);
    setSelectedIds([newWindow.id]);
  };

  const handleCreateInteractiveObject = (posX, posY) => {
    const center = (posX !== undefined && posY !== undefined) ? { x: posX, y: posY } : getViewportCenter();
    const preset = OBJECT_PRESETS[0];
    const newObj = {
      id: Date.now(),
      type: 'object',
      name: preset.label,
      icon: preset.icon,
      openIcon: preset.openIcon,
      x: Math.round(center.x - 24),
      y: Math.round(center.y - 24),
      width: 48,
      height: 48,
      isOpen: false,
      blocksMovement: preset.blocksMovement,
      blocksVision: preset.blocksVision,
      isHidden: false,
      zIndex: elements.length + 8
    };
    setElements(prev => [...prev, newObj]);
    setSelectedIds([newObj.id]);
    setEditingObject(newObj);
  };

  const handleCreateLightSource = (posX, posY) => {
    const center = (posX !== undefined && posY !== undefined) ? { x: posX, y: posY } : getViewportCenter();
    const preset = LIGHT_PRESETS[0];
    const newLight = {
      id: Date.now(),
      type: 'light',
      name: preset.label,
      icon: preset.icon,
      x: Math.round(center.x - 19),
      y: Math.round(center.y - 19),
      width: 38,
      height: 38,
      radius: preset.radius,
      color: preset.color,
      isOn: true,
      zIndex: elements.length + 12
    };
    setElements(prev => [...prev, newLight]);
    setSelectedIds([newLight.id]);
    setEditingLight(newLight);
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const rawData = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/json');
    if (!rawData) return;
    try {
      const data = JSON.parse(rawData);
      if (!data || !data.itemType) return;
      const rect = boardRef.current ? boardRef.current.getBoundingClientRect() : { left: 0, top: 0 };
      const dropX = (e.clientX - rect.left - pan.x) / scale;
      const dropY = (e.clientY - rect.top - pan.y) / scale;

      switch (data.itemType) {
        case 'door':
          handleCreateDoor(dropX, dropY);
          break;
        case 'window':
          handleCreateWindow(dropX, dropY);
          break;
        case 'object':
          handleCreateInteractiveObject(dropX, dropY);
          break;
        case 'light':
          handleCreateLightSource(dropX, dropY);
          break;
        case 'note':
          handleCreateNote(dropX, dropY);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Error procesando arrastre en el lienzo:', err);
    }
  };

  const handlePointerDown = (e) => {
    if (e.button === 1 || e.button === 2) {
      setIsDraggingPan(true);
      return;
    }

    if (toolMode === 'wall' && e.button === 0) {
      const rect = boardRef.current.getBoundingClientRect();
      const logicalX = (e.clientX - rect.left - pan.x) / scale;
      const logicalY = (e.clientY - rect.top - pan.y) / scale;
      setDrawingWall({
        id: Date.now(),
        type: 'wall',
        x1: logicalX,
        y1: logicalY,
        x2: logicalX,
        y2: logicalY
      });
      return;
    }

    setIsDraggingPan(true);
    setSelectedIds([]);
  };

  const handleElementPointerDown = (e, el) => {
    if (toolMode === 'wall') return;
    e.stopPropagation();
    if (e.button === 2) return; 

    if (e.shiftKey || e.ctrlKey) {
      setSelectedIds(prev => prev.includes(el.id) ? prev.filter(id => id !== el.id) : [...prev, el.id]);
    } else {
      if (!selectedIds.includes(el.id)) {
        setSelectedIds([el.id]);
      }
    }
    setDraggingElements(true);
  };

  const handlePointerMove = (e) => {
    if (drawingWall) {
      const rect = boardRef.current.getBoundingClientRect();
      const logicalX = (e.clientX - rect.left - pan.x) / scale;
      const logicalY = (e.clientY - rect.top - pan.y) / scale;
      setDrawingWall(prev => ({ ...prev, x2: logicalX, y2: logicalY }));
      return;
    }

    if (isDraggingPan && !draggingElements) {
      setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
      return;
    }

    if (draggingElements) {
      const dx = e.movementX / scale;
      const dy = e.movementY / scale;
      
      setElements(prev => prev.map(el => {
        if (selectedIds.includes(el.id)) {
          if (el.type === 'wall') {
            return { ...el, x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy };
          }
          return { ...el, x: el.x + dx, y: el.y + dy };
        }
        return el;
      }));
    }
  };

  const handlePointerUp = () => {
    if (drawingWall) {
      const dist = Math.hypot(drawingWall.x2 - drawingWall.x1, drawingWall.y2 - drawingWall.y1);
      if (dist > 10) {
        setElements(prev => [...prev, drawingWall]);
      }
      setDrawingWall(null);
    }
    setIsDraggingPan(false);
    setDraggingElements(false);
  };

  const handleWheel = (e) => {
    const zoomFactor = -e.deltaY * 0.001;
    setScale(prev => Math.min(Math.max(0.1, prev + zoomFactor), 5));
  };

  const selectedElement = selectedIds.length === 1 ? elements.find(el => el.id === selectedIds[0]) : null;
  const wallsCount = elements.filter(el => el.type === 'wall').length;

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setElements(prev => prev.filter(el => !selectedIds.includes(el.id)));
    setSelectedIds([]);
  };

  const handleDuplicateSelected = () => {
    if (selectedIds.length === 0) return;
    const toCopy = elements.filter(el => selectedIds.includes(el.id));
    const clones = toCopy.map(el => ({
      ...el,
      id: Date.now() + Math.random(),
      x: el.type === 'wall' ? undefined : (el.x || 0) + 40,
      y: el.type === 'wall' ? undefined : (el.y || 0) + 40,
      x1: el.type === 'wall' ? el.x1 + 40 : undefined,
      y1: el.type === 'wall' ? el.y1 + 40 : undefined,
      x2: el.type === 'wall' ? el.x2 + 40 : undefined,
      y2: el.type === 'wall' ? el.y2 + 40 : undefined
    }));
    setElements(prev => [...prev, ...clones]);
    setSelectedIds(clones.map(c => c.id));
  };

  const handleRotateSelected = () => {
    if (!selectedElement) return;
    setElements(prev => prev.map(item =>
      item.id === selectedElement.id
        ? { ...item, width: item.height || 60, height: item.width || 60 }
        : item
    ));
  };

  const handleScaleSelectedImage = (factor) => {
    if (!selectedElement) return;
    setElements(prev => prev.map(item =>
      item.id === selectedElement.id
        ? {
            ...item,
            width: Math.max(40, Math.round((item.width || 200) * factor)),
            height: Math.max(40, Math.round((item.height || 200) * factor))
          }
        : item
    ));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#0b0d12', color: '#e2e8f0' }}>
      
      {/* Inputs de Archivo Ocultos */}
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
      <input type="file" accept=".json" ref={importRef} onChange={handleImportMapConfig} style={{ display: 'none' }} />

      {/* 1. CABECERA SUPERIOR LIMPIA Y ENFOCADA */}
      <div style={{
        minHeight: '66px',
        padding: '0 24px',
        backgroundImage: 'linear-gradient(180deg, rgba(24, 28, 36, 0.72) 0%, rgba(17, 20, 27, 0.92) 100%), url("/assets/textures/grimoire_leather_header.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderBottom: '1px solid #3d3222',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 30,
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)'
      }}>
        {/* Izquierda: Identidad + Encabezado H1 de la Escena + Acciones */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid #fbbf24', fontSize: '20px',
              boxShadow: '0 2px 10px rgba(245, 158, 11, 0.35)'
            }}>
              🗺️
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h1 className="vtt-gothic-title" style={{
                margin: 0,
                fontSize: '21px',
                fontWeight: 900,
                color: '#fbbf24',
                letterSpacing: '0.04em',
                lineHeight: 1.2,
                textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 14px rgba(245, 158, 11, 0.35)'
              }}>
                {sceneName || 'Escena Principal'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#cbd5e1', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Arquitecto de Escenarios
                </span>
                <span style={{ color: '#475569' }}>•</span>
                <span className="vtt-retro-badge" style={{ fontSize: '10px', color: '#94a3b8' }}>
                  {elements.length} ELEMENTOS • {wallsCount} MUROS • ZOOM {Math.round(scale * 100)}%
                </span>
              </div>
            </div>
          </div>

          <div style={{ width: '1px', height: '28px', backgroundColor: '#333c50' }}></div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => handleImportMapConfig()} className="vtt-brass-btn" style={{ padding: '6px 11px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
              <span>📥</span> Importar escena
            </button>
            <button onClick={handleExportMapConfig} className="vtt-brass-btn" style={{ padding: '6px 11px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
              <span>📤</span> Exportar escena
            </button>
            <button onClick={() => { setPan({ x: 0, y: 0 }); setScale(0.85); }} className="vtt-brass-btn" style={{ padding: '6px 11px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
              <span>🎯</span> Centrar Lienzo
            </button>
          </div>
        </div>

        {/* Derecha: Botones de Guardado y Salida con Jerarquía Clara */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => { if (onClose) onClose(); }}
            style={{
              padding: '8px 14px',
              background: 'rgba(127, 29, 29, 0.2)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600
            }}
            title="Salir sin guardar los cambios recientes"
          >
            ✕ Cancelar
          </button>

          <button
            onClick={() => {
              onLoadMapToBoard(elements);
              if (onReturnToSettings) {
                onReturnToSettings();
              } else if (onClose) {
                onClose();
              }
            }}
            className="vtt-primary-cta"
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            title="Guardar plano y volver a Ajustes"
          >
            <span>💾</span> Guardar y volver
          </button>
        </div>
      </div>

      {/* 2. CUERPO CENTRAL: PALETA LATERAL DE HERRAMIENTAS + LIENZO */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        
        {/* PALETA LATERAL IZQUIERDA (Ordenada por pasos lógicos) */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            width: '290px',
            backgroundColor: '#13161f',
            borderRight: '1px solid #2b3040',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            overflowY: 'auto',
            zIndex: 25,
            boxShadow: '6px 0 24px rgba(0,0,0,0.5)'
          }}
        >
          {/* PUNTO 1: SUBIR IMAGEN DE FONDO */}
          <div>
            <div className="vtt-retro-badge" style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, marginBottom: '8px' }}>
              1. SUBIR IMAGEN
            </div>
            <button
              onClick={() => { setToolMode('select'); fileInputRef.current.click(); }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                cursor: 'pointer',
                background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                border: '1px dashed #60a5fa',
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '24px' }}>🗺️</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#93c5fd' }}>Subir imagen</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Imagen PNG, JPG o WebP</div>
              </div>
            </button>
          </div>

          {/* PUNTO 2: HERRAMIENTAS DE EDICIÓN (Barra de iconos estilo Paint) */}
          <div>
            <div className="vtt-retro-badge" style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, marginBottom: '8px' }}>
              2. HERRAMIENTAS DE EDICIÓN
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px'
            }}>
              {/* 1. Puntero / Selección */}
              <button
                type="button"
                onClick={() => { setToolMode('select'); setDrawingWall(null); }}
                style={{
                  height: '46px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: toolMode === 'select'
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(245, 158, 11, 0.1) 100%)'
                    : '#191d27',
                  border: toolMode === 'select' ? '1.5px solid #f59e0b' : '1px solid #2c3344',
                  color: toolMode === 'select' ? '#fbbf24' : '#cbd5e1',
                  boxShadow: toolMode === 'select' ? '0 0 10px rgba(245, 158, 11, 0.3)' : 'none',
                  transition: 'all 0.15s ease'
                }}
                title="Puntero: Seleccionar y Mover (Arrastrar mapas, puertas, objetos o luces)"
              >
                <MousePointer2 size={21} strokeWidth={2.2} />
              </button>

              {/* 2. Muros de Colisión */}
              <button
                type="button"
                onClick={() => { setToolMode('wall'); setSelectedIds([]); }}
                style={{
                  height: '46px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: toolMode === 'wall'
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.1) 100%)'
                    : '#191d27',
                  border: toolMode === 'wall' ? '1.5px solid #ef4444' : '1px solid #2c3344',
                  color: toolMode === 'wall' ? '#fca5a5' : '#cbd5e1',
                  boxShadow: toolMode === 'wall' ? '0 0 10px rgba(239, 68, 68, 0.3)' : 'none',
                  transition: 'all 0.15s ease'
                }}
                title="Muros: Trazar paredes de colisión (Bloquean paso y visión)"
              >
                <BrickWall size={21} strokeWidth={2.2} />
              </button>

              {/* 3. Puerta (Arrastrar o Clic) */}
              <button
                type="button"
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify({ itemType: 'door' }));
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => { setToolMode('select'); handleCreateDoor(); }}
                className="vtt-brass-btn"
                style={{
                  height: '46px',
                  borderRadius: '8px',
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
                title="Puerta: Arrastra al mapa para situarla exactamente donde sueltes, o haz clic (Abrir/Cerrar/Bloquear)"
              >
                <DoorClosed size={21} strokeWidth={2.2} />
              </button>

              {/* 4. Ventana (Arrastrar o Clic) */}
              <button
                type="button"
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify({ itemType: 'window' }));
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => { setToolMode('select'); handleCreateWindow(); }}
                className="vtt-brass-btn"
                style={{
                  height: '46px',
                  borderRadius: '8px',
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
                title="Ventana: Arrastra al mapa para situarla exactamente donde sueltes, o haz clic (Permite visión pero bloquea paso)"
              >
                <AppWindow size={21} strokeWidth={2.2} />
              </button>

              {/* 5. Objeto Interactivo (Arrastrar o Clic) */}
              <button
                type="button"
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify({ itemType: 'object' }));
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => { setToolMode('select'); handleCreateInteractiveObject(); }}
                className="vtt-brass-btn"
                style={{
                  height: '46px',
                  borderRadius: '8px',
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
                title="Objeto: Arrastra al mapa para situarlo exactamente donde sueltes, o haz clic (Cofre, mecanismo, altar...)"
              >
                <Package size={21} strokeWidth={2.2} />
              </button>

              {/* 6. Luz / Antorcha (Arrastrar o Clic) */}
              <button
                type="button"
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify({ itemType: 'light' }));
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => { setToolMode('select'); handleCreateLightSource(); }}
                className="vtt-brass-btn"
                style={{
                  height: '46px',
                  borderRadius: '8px',
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  borderColor: 'rgba(245, 158, 11, 0.45)',
                  color: '#fbbf24'
                }}
                title="Antorcha: Arrastra al mapa para situarla exactamente donde sueltes, o haz clic (Luz ambiental)"
              >
                <Flame size={21} strokeWidth={2.2} />
              </button>

              {/* 7. Nota / Pergamino (Arrastrar o Clic) */}
              <button
                type="button"
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify({ itemType: 'note' }));
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => { setToolMode('select'); handleCreateNote(); }}
                className="vtt-brass-btn"
                style={{
                  height: '46px',
                  borderRadius: '8px',
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }}
                title="Nota: Arrastra al mapa para situarla exactamente donde sueltes, o haz clic (Pistas y descripciones)"
              >
                <Scroll size={21} strokeWidth={2.2} />
              </button>
            </div>
          </div>

          {/* SECCIÓN 3: ATAJOS ÚTILES */}
          <div style={{
            marginTop: 'auto',
            backgroundColor: '#0e1016',
            border: '1px solid #222634',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '11px',
            color: '#94a3b8',
            lineHeight: '1.5'
          }}>
            <div style={{ fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>💡 Controles Rápidos:</div>
            <div>• <strong>Doble clic</strong> en Puerta/Ventana para rotar 90º.</div>
            <div>• <strong>Doble clic</strong> en Objeto/Luz/Nota para editar.</div>
            <div>• <strong>Supr / Backspace</strong> elimina lo seleccionado.</div>
            <div>• <strong>Ctrl+C / Ctrl+V</strong> duplica elementos.</div>
          </div>
        </div>

        {/* LIENZO PRINCIPAL DEL CREADOR (Con cuadrícula táctica de referencia) */}
        <div 
          ref={boardRef}
          onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} 
          onPointerUp={handlePointerUp} 
          onPointerLeave={handlePointerUp} 
          onWheel={handleWheel} onContextMenu={(e) => e.preventDefault()}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={handleCanvasDrop}
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            cursor: toolMode === 'wall' ? 'crosshair' : (isDraggingPan ? 'grabbing' : 'grab'),
            backgroundColor: '#0b0d13',
            backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.14) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        >
          {/* Inspector Contextual Flotante en la parte superior del lienzo */}
          {(selectedIds.length > 0 || toolMode === 'wall') && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: '14px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(19, 22, 31, 0.95)',
                border: toolMode === 'wall' ? '1px solid #ef4444' : '1px solid #f59e0b',
                borderRadius: '10px',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '12px',
                color: '#f8fafc',
                zIndex: 40,
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                backdropFilter: 'blur(8px)',
                whiteSpace: 'nowrap'
              }}
            >
              {toolMode === 'wall' ? (
                <>
                  <span>
                    <strong style={{ color: '#f87171' }}>🧱 Modo Trazar Muros:</strong> Arrastra con clic izquierdo en el lienzo para levantar paredes.
                  </span>
                  <button
                    onClick={() => setToolMode('select')}
                    className="vtt-brass-btn"
                    style={{ padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, borderColor: '#f59e0b' }}
                  >
                    Terminar (Esc)
                  </button>
                </>
              ) : (
                <>
                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                    {selectedIds.length === 1
                      ? `Seleccionado: ${selectedElement?.name || selectedElement?.title || selectedElement?.type?.toUpperCase() || 'MAPA'}`
                      : `${selectedIds.length} elementos`}
                  </span>

                  <div style={{ width: '1px', height: '18px', backgroundColor: '#2e3444' }}></div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {selectedElement && (selectedElement.type === 'image' || !selectedElement.type) && (
                      <>
                        <button onClick={() => handleScaleSelectedImage(0.9)} className="vtt-brass-btn" style={{ padding: '4px 9px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>🔍 -10%</button>
                        <button onClick={() => handleScaleSelectedImage(1.1)} className="vtt-brass-btn" style={{ padding: '4px 9px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>🔍 +10%</button>
                      </>
                    )}

                    {selectedElement && (selectedElement.type === 'door' || selectedElement.type === 'window') && (
                      <button onClick={handleRotateSelected} className="vtt-brass-btn" style={{ padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                        🔄 Rotar 90º
                      </button>
                    )}

                    {selectedElement && selectedElement.type === 'object' && (
                      <button onClick={() => setEditingObject(selectedElement)} className="vtt-brass-btn" style={{ padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                        Propiedades
                      </button>
                    )}

                    {selectedElement && selectedElement.type === 'light' && (
                      <button onClick={() => setEditingLight(selectedElement)} className="vtt-brass-btn" style={{ padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                        Radio de Luz
                      </button>
                    )}

                    {selectedElement && selectedElement.type === 'note' && (
                      <button onClick={() => setEditingNote(selectedElement)} className="vtt-brass-btn" style={{ padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                        Editar Texto
                      </button>
                    )}

                    <button onClick={handleDuplicateSelected} className="vtt-brass-btn" style={{ padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>
                      Duplicar
                    </button>

                    <button
                      onClick={handleDeleteSelected}
                      style={{
                        padding: '4px 10px',
                        background: '#7f1d1d',
                        color: '#fecaca',
                        border: '1px solid #f87171',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 700
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Estado vacío orientativo cuando no hay ningún elemento en el lienzo */}
          {elements.length === 0 && !drawingWall && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
              backgroundColor: 'rgba(19, 22, 31, 0.75)',
              border: '1px dashed #334155',
              padding: '28px 36px',
              borderRadius: '14px',
              maxWidth: '420px'
            }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>🗺️</div>
              <div className="vtt-gothic-title" style={{ fontSize: '16px', color: '#f8fafc', fontWeight: 'bold', marginBottom: '6px' }}>
                Lienzo de Escenario Listo
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
                Pulsa <strong>"Subir imagen"</strong> en el panel izquierdo para cargar una imagen, o empieza a trazar muros y colocar puertas directamente.
              </div>
            </div>
          )}

          <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: '0 0', position: 'absolute', width: '100%', height: '100%' }}>
            {/* Cuadrícula de Coordenadas de Referencia en el Lienzo Lógico */}
            <div style={{
              position: 'absolute',
              top: -4000,
              left: -4000,
              width: 8000,
              height: 8000,
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
              pointerEvents: 'none'
            }} />

            {elements.map((el) => {
              const isSelected = selectedIds.includes(el.id);
              const borderStyle = isSelected ? '3px solid #fbbf24' : 'none';

              if (el.type === 'image' || !el.type) {
                return (
                  <img 
                    key={el.id} src={el.src} alt="map" 
                    onPointerDown={(e) => handleElementPointerDown(e, el)} 
                    style={{ position: 'absolute', left: `${el.x}px`, top: `${el.y}px`, width: `${el.width}px`, height: `${el.height}px`, cursor: 'grab', border: borderStyle, boxSizing: 'border-box' }} 
                    draggable={false} 
                  />
                );
              }

              if (el.type === 'note') {
                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => handleElementPointerDown(e, el)}
                    onDoubleClick={(e) => { e.stopPropagation(); setEditingNote(el); }}
                    style={{
                      position: 'absolute', left: `${el.x}px`, top: `${el.y}px`,
                      width: '40px', height: '40px', backgroundColor: '#e6ccb2',
                      borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'grab', border: borderStyle || '2px solid #8a6d3b', boxShadow: '0 4px 10px rgba(0,0,0,0.7)',
                      fontSize: '22px', zIndex: 100
                    }}
                    title={el.title}
                  >
                    📜
                  </div>
                );
              }

              if (el.type === 'object') {
                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => handleElementPointerDown(e, el)}
                    onDoubleClick={(e) => { e.stopPropagation(); setEditingObject(el); }}
                    style={{
                      position: 'absolute',
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      width: `${el.width || 48}px`,
                      height: `${el.height || 48}px`,
                      background: 'radial-gradient(circle, #283044 0%, #141824 100%)',
                      border: isSelected ? '3px solid #fbbf24' : '2px solid #d4af37',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'grab',
                      zIndex: 105,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.85)',
                      fontSize: '24px'
                    }}
                    title={`${el.name} (Doble clic para configurar propiedades)`}
                  >
                    {el.isOpen ? (el.openIcon || '🪙') : (el.icon || '📦')}
                  </div>
                );
              }

              if (el.type === 'light') {
                const r = el.radius || 220;
                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => handleElementPointerDown(e, el)}
                    onDoubleClick={(e) => { e.stopPropagation(); setEditingLight(el); }}
                    style={{
                      position: 'absolute',
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      width: `${el.width || 38}px`,
                      height: `${el.height || 38}px`,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, #78350f 0%, #1c120c 100%)',
                      border: isSelected ? '3px solid #fffbeb' : '2px solid #fbbf24',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'grab',
                      zIndex: 115,
                      boxShadow: '0 0 18px rgba(251, 191, 36, 0.85)',
                      fontSize: '20px'
                    }}
                    title={`${el.name} - Radio: ${r}px (Doble clic para configurar luz)`}
                  >
                    <div style={{
                      position: 'absolute',
                      width: `${r * 2}px`,
                      height: `${r * 2}px`,
                      borderRadius: '50%',
                      border: '1px dashed rgba(251, 191, 36, 0.45)',
                      background: 'radial-gradient(circle, rgba(251, 146, 60, 0.14) 0%, transparent 70%)',
                      pointerEvents: 'none'
                    }} />
                    {el.icon || '🔥'}
                  </div>
                );
              }

              if (el.type === 'door') {
                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => handleElementPointerDown(e, el)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setElements(prev => prev.map(item => item.id === el.id ? { ...item, width: item.height, height: item.width } : item));
                    }}
                    style={{
                      position: 'absolute',
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      width: `${el.width || 60}px`,
                      height: `${el.height || 16}px`,
                      backgroundColor: '#5c2d0c',
                      border: isSelected ? '3px solid #fbbf24' : '2px solid #d4af37',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'grab',
                      zIndex: 110,
                      boxShadow: '0 4px 8px rgba(0,0,0,0.75)',
                      fontSize: '12px'
                    }}
                    title="Puerta (Doble clic para rotar Horizontal/Vertical)"
                  >
                    🚪
                  </div>
                );
              }

              if (el.type === 'window') {
                return (
                  <div
                    key={el.id}
                    onPointerDown={(e) => handleElementPointerDown(e, el)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setElements(prev => prev.map(item => item.id === el.id ? { ...item, width: item.height, height: item.width } : item));
                    }}
                    style={{
                      position: 'absolute',
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      width: `${el.width || 60}px`,
                      height: `${el.height || 14}px`,
                      background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.45), rgba(186, 230, 253, 0.75), rgba(56, 189, 248, 0.45))',
                      border: isSelected ? '3px solid #fbbf24' : '2px solid #7dd3fc',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'grab',
                      zIndex: 110,
                      boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)',
                      fontSize: '11px'
                    }}
                    title="Ventana (Deja pasar la visión. Doble clic para rotar Horizontal/Vertical)"
                  >
                    🪟
                  </div>
                );
              }
              return null;
            })}

            {/* Capa SVG para dibujar y seleccionar Paredes */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '8000px', height: '8000px', overflow: 'visible', pointerEvents: 'none', zIndex: 95 }}>
              {elements.filter(el => el.type === 'wall').map(wall => {
                const isSelected = selectedIds.includes(wall.id);
                return (
                  <g key={wall.id} style={{ pointerEvents: 'stroke', cursor: 'pointer' }} onPointerDown={(e) => handleElementPointerDown(e, wall)}>
                    <line
                      x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2}
                      stroke={isSelected ? '#fbbf24' : '#dc2626'}
                      strokeWidth={10}
                      strokeLinecap="round"
                    />
                    <line
                      x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2}
                      stroke="#fca5a5"
                      strokeWidth={2}
                      strokeDasharray="6,6"
                    />
                  </g>
                );
              })}
              {drawingWall && (
                <line
                  x1={drawingWall.x1} y1={drawingWall.y1} x2={drawingWall.x2} y2={drawingWall.y2}
                  stroke="#fbbf24"
                  strokeWidth={8}
                  strokeLinecap="round"
                />
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Modal Editor de Objetos Interactivos */}
      {editingObject && (
        <div
          onClick={() => setEditingObject(null)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="vtt-wood-panel"
            style={{ padding: '26px', borderRadius: '12px', width: '480px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid #475569', color: '#e2e8f0' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="vtt-gothic-title" style={{ margin: 0, color: '#f59e0b' }}>Configurar Objeto Interactivo</h3>
              <button onClick={() => setEditingObject(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {OBJECT_PRESETS.map(p => (
                <button
                  key={p.presetId}
                  onClick={() => setEditingObject({
                    ...editingObject,
                    name: p.label,
                    icon: p.icon,
                    openIcon: p.openIcon,
                    blocksMovement: p.blocksMovement,
                    blocksVision: p.blocksVision
                  })}
                  className="vtt-brass-btn"
                  style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Nombre</label>
                <input
                  type="text"
                  value={editingObject.name}
                  onChange={(e) => setEditingObject({ ...editingObject, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#12151c', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px' }}
                />
              </div>
              <div style={{ width: '70px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Cerrado</label>
                <input
                  type="text"
                  value={editingObject.icon}
                  onChange={(e) => setEditingObject({ ...editingObject, icon: e.target.value })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#12151c', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', textAlign: 'center' }}
                />
              </div>
              <div style={{ width: '70px' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Abierto</label>
                <input
                  type="text"
                  value={editingObject.openIcon}
                  onChange={(e) => setEditingObject({ ...editingObject, openIcon: e.target.value })}
                  style={{ width: '100%', padding: '8px', backgroundColor: '#12151c', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px', textAlign: 'center' }}
                />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={Boolean(editingObject.blocksMovement)}
                onChange={(e) => setEditingObject({ ...editingObject, blocksMovement: e.target.checked })}
              />
              <span>Bloquea el paso mientras esté cerrado/activo</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={Boolean(editingObject.blocksVision)}
                onChange={(e) => setEditingObject({ ...editingObject, blocksVision: e.target.checked })}
              />
              <span>Bloquea el cono de visión (proyecta sombra) mientras esté cerrado</span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => {
                  setElements(elements.filter(el => el.id !== editingObject.id));
                  setSelectedIds([]);
                  setEditingObject(null);
                }}
                style={{ padding: '8px 14px', background: '#7f1d1d', color: '#fecaca', border: '1px solid #f87171', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              >
                Eliminar Objeto
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setEditingObject(null)}
                  className="vtt-brass-btn"
                  style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setElements(elements.map(el => el.id === editingObject.id ? editingObject : el));
                    setEditingObject(null);
                  }}
                  className="vtt-primary-cta"
                  style={{ padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Guardar Objeto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editor de Fuentes de Luz */}
      {editingLight && (
        <div
          onClick={() => setEditingLight(null)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="vtt-wood-panel"
            style={{ padding: '26px', borderRadius: '12px', width: '440px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid #f59e0b', color: '#e2e8f0' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="vtt-gothic-title" style={{ margin: 0, color: '#fbbf24' }}>Configurar Fuente de Luz</h3>
              <button onClick={() => setEditingLight(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {LIGHT_PRESETS.map(p => (
                <button
                  key={p.presetId}
                  onClick={() => setEditingLight({
                    ...editingLight,
                    name: p.label,
                    icon: p.icon,
                    radius: p.radius,
                    color: p.color
                  })}
                  className="vtt-brass-btn"
                  style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1', fontSize: '13px' }}>
                Radio de Iluminación en la Niebla: <strong style={{ color: '#fbbf24' }}>{editingLight.radius || 220}px</strong>
              </label>
              <input
                type="range"
                min="80"
                max="550"
                value={editingLight.radius || 220}
                onChange={(e) => setEditingLight({ ...editingLight, radius: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#fbbf24' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => {
                  setElements(elements.filter(el => el.id !== editingLight.id));
                  setSelectedIds([]);
                  setEditingLight(null);
                }}
                style={{ padding: '8px 14px', background: '#7f1d1d', color: '#fecaca', border: '1px solid #f87171', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              >
                Eliminar Luz
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setEditingLight(null)}
                  className="vtt-brass-btn"
                  style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setElements(elements.map(el => el.id === editingLight.id ? editingLight : el));
                    setEditingLight(null);
                  }}
                  className="vtt-primary-cta"
                  style={{ padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Guardar Luz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editor de Notas estilo Grimorio */}
      {editingNote && (
        <div
          onClick={() => setEditingNote(null)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="vtt-wood-panel"
            style={{ padding: '26px', borderRadius: '12px', width: '500px', display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid #475569' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="vtt-gothic-title" style={{ margin: 0, color: '#f59e0b' }}>Redactar Pergamino</h3>
              <button onClick={() => setEditingNote(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
            <input 
              type="text" value={editingNote.title} 
              onChange={(e) => setEditingNote({...editingNote, title: e.target.value})}
              style={{ padding: '10px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#12151c', color: '#f8fafc', border: '1px solid #334155', borderRadius: '6px' }}
            />
            <textarea 
              value={editingNote.content}
              onChange={(e) => setEditingNote({...editingNote, content: e.target.value})}
              style={{ padding: '12px', height: '200px', backgroundColor: '#12151c', color: '#e2e8f0', border: '1px solid #334155', borderRadius: '6px', resize: 'none', fontSize: '15px', lineHeight: '1.5' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <button
                onClick={() => {
                  setElements(elements.filter(el => el.id !== editingNote.id));
                  setSelectedIds([]);
                  setEditingNote(null);
                }}
                style={{ padding: '8px 14px', background: '#7f1d1d', color: '#fecaca', border: '1px solid #f87171', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              >
                Eliminar Nota
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setEditingNote(null)}
                  className="vtt-brass-btn"
                  style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    setElements(elements.map(el => el.id === editingNote.id ? editingNote : el));
                    setEditingNote(null);
                  }} 
                  className="vtt-primary-cta"
                  style={{ padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Guardar Pergamino
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapCreator;