import { useEffect, useRef, useMemo } from 'react';
import { getVisionBlockers, raySegmentIntersection, angleDiff, computeFogBounds } from '../utils/fogGeometry';
import { useAppSettings } from '../hooks/useAppSettings';

const computeVisibilityPolygon = (ox, oy, radius, angleDeg = 0, fovDeg = 90, blockers = []) => {
  const isFullCircle = fovDeg >= 360;
  const halfFov = fovDeg / 2;
  const angles = [];
  const stepDeg = 3.0; // Optimizado para 60 FPS clavados

  if (isFullCircle) {
    for (let a = 0; a < 360; a += stepDeg) angles.push((a * Math.PI) / 180);
  } else {
    for (let offset = -halfFov; offset <= halfFov; offset += stepDeg) {
      angles.push(((angleDeg + offset) * Math.PI) / 180);
    }
  }

  const rSq = radius * radius * 1.15;
  for (let i = 0; i < blockers.length; i++) {
    const seg = blockers[i];
    const pts = [{ x: seg.x1, y: seg.y1 }, { x: seg.x2, y: seg.y2 }];
    for (let j = 0; j < 2; j++) {
      const vx = pts[j].x - ox;
      const vy = pts[j].y - oy;
      if (vx * vx + vy * vy <= rSq) {
        const deg = (Math.atan2(vy, vx) * 180) / Math.PI;
        if (isFullCircle || Math.abs(angleDiff(deg, angleDeg)) <= halfFov) {
          const rad = Math.atan2(vy, vx);
          angles.push(rad - 0.001, rad, rad + 0.001);
        }
      }
    }
  }

  const startAngleDeg = isFullCircle ? -180 : angleDeg - halfFov;
  angles.sort((ra, rb) => {
    const da = ((((ra * 180) / Math.PI - startAngleDeg) % 360) + 360) % 360;
    const db = ((((rb * 180) / Math.PI - startAngleDeg) % 360) + 360) % 360;
    return da - db;
  });

  const points = [];
  for (let i = 0; i < angles.length; i++) {
    const rad = angles[i];
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    let closestT = radius;

    for (let j = 0; j < blockers.length; j++) {
      const seg = blockers[j];
      const t = raySegmentIntersection(ox, oy, dx, dy, seg.x1, seg.y1, seg.x2, seg.y2);
      if (t !== null && t < closestT) closestT = t;
    }

    points.push({
      x: ox + dx * closestT,
      y: oy + dy * closestT
    });
  }
  return points;
};

const drawVisionMask = (ctx, ox, oy, radius, angleDeg = 0, fovDeg = 90, sourceSize = 50, blockers = [], isMemoryStamp = false) => {
  if (!Number.isFinite(ox) || !Number.isFinite(oy) || !Number.isFinite(radius) || radius <= 0) return;
  const isFullCircle = fovDeg >= 360;

  ctx.save();
  // Si es para el mapa de memoria, pintamos blanco sólido (máscara limpia sin bandas acumuladas).
  // Si es visión activa en tiempo real, recortamos la niebla con destination-out.
  ctx.globalCompositeOperation = isMemoryStamp ? 'source-over' : 'destination-out';

  const personalRadius = Math.max((sourceSize || 50) * 0.85, 36);
  if (!isFullCircle) {
    const haloPoints = computeVisibilityPolygon(ox, oy, personalRadius, 0, 360, blockers);
    if (haloPoints.length > 0) {
      ctx.beginPath();
      ctx.moveTo(haloPoints[0].x, haloPoints[0].y);
      for (let i = 1; i < haloPoints.length; i++) ctx.lineTo(haloPoints[i].x, haloPoints[i].y);
      ctx.closePath();
      ctx.fillStyle = isMemoryStamp ? '#ffffff' : 'rgba(0,0,0,1)';
      ctx.fill();
    }
  }

  const polyPoints = computeVisibilityPolygon(ox, oy, radius, angleDeg, fovDeg, blockers);
  if (polyPoints.length > 0) {
    ctx.beginPath();
    if (isFullCircle) {
      ctx.moveTo(polyPoints[0].x, polyPoints[0].y);
      for (let i = 1; i < polyPoints.length; i++) ctx.lineTo(polyPoints[i].x, polyPoints[i].y);
    } else {
      ctx.moveTo(ox, oy);
      for (let i = 0; i < polyPoints.length; i++) ctx.lineTo(polyPoints[i].x, polyPoints[i].y);
    }
    ctx.closePath();

    if (isMemoryStamp) {
      // Borde limpio en la máscara de memoria para que no deje estelas ni anillos al caminar
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else {
      const grad = ctx.createRadialGradient(ox, oy, radius * 0.72, ox, oy, radius);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  ctx.restore();
};

const FogLayer = ({
  fowEnabled,
  fowCanvasRef,
  fowActions = [],
  maps = [],
  tokens = [],
  activeSceneId = null,
  fowVisionRadius = 180,
  fowMemoryEnabled = true,
  isPlayerView = false
}) => {
  const { settings } = useAppSettings();
  const exploredMaskCanvasRef = useRef(null);
  const lastActionsCountRef = useRef(0);
  const lastSceneIdRef = useRef(activeSceneId);
  const lastMaskBoundsRef = useRef(null);

  const fogBounds = useMemo(() => computeFogBounds(maps), [maps]);

  // Caching de segmentos de muros, puertas y objetos bloqueantes para evitar recálculos por frame
  const cachedBlockers = useMemo(() => getVisionBlockers(maps), [maps]);
  const activeLightSources = useMemo(
    () => maps.filter(el => el.type === 'light' && el.isOn !== false),
    [maps]
  );

  useEffect(() => {
    if (!fowEnabled || !fowCanvasRef?.current) return;

    const { left, top, width, height, scale, canvasWidth, canvasHeight } = fogBounds;

    // Lienzo de máscara de zonas exploradas (transparente = no visto, blanco = ya explorado)
    if (!exploredMaskCanvasRef.current) {
      const off = document.createElement('canvas');
      off.width = canvasWidth;
      off.height = canvasHeight;
      exploredMaskCanvasRef.current = off;
      lastMaskBoundsRef.current = fogBounds;
    }

    const maskCanvas = exploredMaskCanvasRef.current;
    const prevBounds = lastMaskBoundsRef.current;
    const maskDimensionsChanged = maskCanvas.width !== canvasWidth || maskCanvas.height !== canvasHeight;

    // Limpiar máscara si cambiamos de escena o si se reinician las acciones de niebla;
    // si solo cambió el tamaño del mapa en la misma escena, reencuadramos lo ya explorado.
    if (activeSceneId !== lastSceneIdRef.current) {
      if (maskDimensionsChanged) {
        maskCanvas.width = canvasWidth;
        maskCanvas.height = canvasHeight;
      } else {
        maskCanvas.getContext('2d').clearRect(0, 0, canvasWidth, canvasHeight);
      }
      lastSceneIdRef.current = activeSceneId;
    } else if (fowActions.length === 0 && lastActionsCountRef.current > 0) {
      if (maskDimensionsChanged) {
        maskCanvas.width = canvasWidth;
        maskCanvas.height = canvasHeight;
      } else {
        maskCanvas.getContext('2d').clearRect(0, 0, canvasWidth, canvasHeight);
      }
    } else if (
      maskDimensionsChanged ||
      (prevBounds && (prevBounds.left !== left || prevBounds.top !== top || prevBounds.width !== width || prevBounds.height !== height))
    ) {
      const prevCopy = document.createElement('canvas');
      prevCopy.width = maskCanvas.width;
      prevCopy.height = maskCanvas.height;
      prevCopy.getContext('2d').drawImage(maskCanvas, 0, 0);

      maskCanvas.width = canvasWidth;
      maskCanvas.height = canvasHeight;
      const nextMaskCtx = maskCanvas.getContext('2d');
      nextMaskCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      if (prevBounds) {
        nextMaskCtx.save();
        nextMaskCtx.setTransform(scale, 0, 0, scale, -left * scale, -top * scale);
        nextMaskCtx.drawImage(prevCopy, prevBounds.left, prevBounds.top, prevBounds.width, prevBounds.height);
        nextMaskCtx.restore();
      }
    }

    lastMaskBoundsRef.current = fogBounds;
    lastActionsCountRef.current = fowActions.length;

    const maskCtx = maskCanvas.getContext('2d');

    const rafId = requestAnimationFrame(() => {
      // 1. Si hay memoria de exploración, registramos las zonas visitadas en una máscara limpia (sin acumular opacidad)
      if (fowMemoryEnabled) {
        maskCtx.save();
        maskCtx.setTransform(scale, 0, 0, scale, -left * scale, -top * scale);

        tokens.forEach(token => {
          if (token.isHidden || token.faction === 'enemy') return;
          const size = token.size || 50;
          const ox = token.x + size / 2;
          const oy = token.y + size / 2;
          drawVisionMask(maskCtx, ox, oy, fowVisionRadius, token.rotation || 0, 90, size, cachedBlockers, true);
        });

        activeLightSources.forEach(light => {
          const lSize = light.width || 36;
          const ox = light.x + lSize / 2;
          const oy = light.y + lSize / 2;
          drawVisionMask(maskCtx, ox, oy, light.radius || 220, 0, 360, lSize, cachedBlockers, true);
        });

        maskCtx.restore();
      }

      // 2. Componer el lienzo principal con oscuridad total ajustada al tamaño del mapa
      const mainCanvas = fowCanvasRef.current;
      if (!mainCanvas) return;
      const ctx = mainCanvas.getContext('2d');

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = '#050302';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Si la memoria está activa, rebajamos de forma 100% uniforme la opacidad en toda la zona explorada (penumbra limpia)
      if (fowMemoryEnabled) {
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.globalAlpha = 0.42; // Deja un 58% de penumbra constante y uniforme sin rayas ni solapamientos
        ctx.drawImage(maskCanvas, 0, 0);
        ctx.restore();
      }

      ctx.save();
      ctx.setTransform(scale, 0, 0, scale, -left * scale, -top * scale);

      // 3. Aplicar trazos manuales del Master
      for (let i = 0; i < fowActions.length; i++) {
        const act = fowActions[i];
        ctx.save();
        ctx.beginPath();
        ctx.arc(act.x, act.y, act.size || 80, 0, Math.PI * 2);
        if (act.mode === 'reveal') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillStyle = 'rgba(0,0,0,1)';
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#050302';
        }
        ctx.fill();
        ctx.restore();
      }

      // 4. Recortar a 100% de claridad los conos de visión actuales de héroes aliados
      tokens.forEach(token => {
        if (token.isHidden || token.faction === 'enemy') return;
        const size = token.size || 50;
        const ox = token.x + size / 2;
        const oy = token.y + size / 2;
        drawVisionMask(ctx, ox, oy, fowVisionRadius, token.rotation || 0, 90, size, cachedBlockers, false);
      });

      // 5. Recortar a 100% de claridad las Fuentes de Luz estáticas (antorchas, braseros, faroles)
      activeLightSources.forEach(light => {
        const lSize = light.width || 36;
        const ox = light.x + lSize / 2;
        const oy = light.y + lSize / 2;
        const lRadius = light.radius || 220;
        drawVisionMask(ctx, ox, oy, lRadius, 0, 360, lSize, cachedBlockers, false);

        // Tinte cálido o espectral sobre la zona iluminada por la antorcha
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        const glow = ctx.createRadialGradient(ox, oy, 4, ox, oy, lRadius * 0.85);
        glow.addColorStop(0, light.color || 'rgba(251, 146, 60, 0.22)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(ox, oy, lRadius * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      ctx.restore();
    });

    return () => cancelAnimationFrame(rafId);
  }, [fowEnabled, fowActions, cachedBlockers, activeLightSources, tokens, fowVisionRadius, fowMemoryEnabled, fowCanvasRef, activeSceneId, fogBounds]);

  if (!fowEnabled) return null;

  return (
    <canvas
      ref={fowCanvasRef}
      width={fogBounds.canvasWidth}
      height={fogBounds.canvasHeight}
      style={{
        position: 'absolute',
        top: `${fogBounds.top}px`,
        left: `${fogBounds.left}px`,
        width: `${fogBounds.width}px`,
        height: `${fogBounds.height}px`,
        pointerEvents: 'none',
        zIndex: 8,
        opacity: isPlayerView ? 1 : settings.masterFogOpacity,
        transition: 'opacity 0.25s ease'
      }}
    />
  );
};

export default FogLayer;
