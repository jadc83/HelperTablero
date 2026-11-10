import { useEffect, useRef, useState } from 'react';
import { useAppSettings } from './useAppSettings';

const clampPos = (x, y, width, height) => {
  const maxLeft = Math.max(8, window.innerWidth - width - 8);
  const maxTop = Math.max(8, window.innerHeight - height - 8);
  return {
    x: Math.round(Math.min(Math.max(8, x), maxLeft)),
    y: Math.round(Math.min(Math.max(8, y), maxTop))
  };
};

/**
 * Hook reutilizable para paneles flotantes arrastrables con persistencia opcional de posición
 * y reajuste automático dentro del viewport al redimensionar la ventana.
 */
export function useDraggablePanel(panelId, { fallbackWidth = 340, fallbackHeight = 420 } = {}) {
  const { settings, updateFloatingPosition } = useAppSettings();
  const rememberedPos = settings.rememberFloatingPositions
    ? settings.floatingPositions?.[panelId] || null
    : null;

  const [sessionPos, setSessionPos] = useState(() => rememberedPos);
  const [prevRememberedKey, setPrevRememberedKey] = useState(
    rememberedPos ? `${rememberedPos.x},${rememberedPos.y}` : 'none'
  );
  const [isDragging, setIsDragging] = useState(false);

  const panelRef = useRef(null);
  const dragStateRef = useRef(null);

  const currentRememberedKey = rememberedPos ? `${rememberedPos.x},${rememberedPos.y}` : 'none';
  if (currentRememberedKey !== prevRememberedKey) {
    setPrevRememberedKey(currentRememberedKey);
    if (!isDragging) {
      setSessionPos(rememberedPos);
    }
  }

  useEffect(() => {
    if (!sessionPos) return;
    const handleResize = () => {
      const rect = panelRef.current?.getBoundingClientRect();
      const width = rect?.width || fallbackWidth;
      const height = rect?.height || fallbackHeight;
      setSessionPos((prev) => {
        if (!prev) return null;
        const clamped = clampPos(prev.x, prev.y, width, height);
        return clamped.x === prev.x && clamped.y === prev.y ? prev : clamped;
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sessionPos, fallbackWidth, fallbackHeight]);

  const handleGripPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originLeft: rect.left,
      originTop: rect.top,
      width: rect.width,
      height: rect.height
    };
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const handleGripPointerMove = (e) => {
    const drag = dragStateRef.current;
    if (!drag) return;
    const rawLeft = drag.originLeft + (e.clientX - drag.startX);
    const rawTop = drag.originTop + (e.clientY - drag.startY);
    setSessionPos(clampPos(rawLeft, rawTop, drag.width, drag.height));
  };

  const finishDrag = (e) => {
    const drag = dragStateRef.current;
    if (!drag) return;
    try {
      e.currentTarget.releasePointerCapture?.(drag.pointerId);
    } catch {
      /* ignore */
    }
    const finalPos = clampPos(
      drag.originLeft + (e.clientX - drag.startX),
      drag.originTop + (e.clientY - drag.startY),
      drag.width,
      drag.height
    );
    dragStateRef.current = null;
    setIsDragging(false);
    setSessionPos(finalPos);
    if (settings.rememberFloatingPositions && panelId) {
      updateFloatingPosition(panelId, finalPos);
    }
  };

  const resetPosition = () => {
    dragStateRef.current = null;
    setIsDragging(false);
    setSessionPos(null);
    if (panelId) updateFloatingPosition(panelId, null);
  };

  return {
    panelRef,
    panelPos: sessionPos,
    isDragging,
    resetPosition,
    gripProps: {
      onPointerDown: handleGripPointerDown,
      onPointerMove: handleGripPointerMove,
      onPointerUp: finishDrag,
      onPointerCancel: finishDrag,
      onDoubleClick: resetPosition
    }
  };
}
