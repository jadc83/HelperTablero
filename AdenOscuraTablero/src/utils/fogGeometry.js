export const raySegmentIntersection = (ox, oy, dx, dy, x1, y1, x2, y2) => {
  const s_dx = x2 - x1;
  const s_dy = y2 - y1;
  const denom = s_dx * dy - s_dy * dx;
  if (Math.abs(denom) < 1e-7) return null;

  const t2 = (dx * (y1 - oy) + dy * (ox - x1)) / denom;
  if (t2 < -0.0001 || t2 > 1.0001) return null;

  const t1 = Math.abs(dx) > Math.abs(dy)
    ? (x1 + s_dx * t2 - ox) / dx
    : (y1 + s_dy * t2 - oy) / dy;

  return t1 >= 0 ? t1 : null;
};

export const angleDiff = (a, b) => ((a - b + 180) % 360 + 360) % 360 - 180;

export const segmentsIntersect = (ax, ay, bx, by, cx, cy, dx, dy) => {
  const ccw = (p1x, p1y, p2x, p2y, p3x, p3y) =>
    (p3y - p1y) * (p2x - p1x) > (p2y - p1y) * (p3x - p1x);
  return (
    ccw(ax, ay, cx, cy, dx, dy) !== ccw(bx, by, cx, cy, dx, dy) &&
    ccw(ax, ay, bx, by, cx, cy) !== ccw(ax, ay, bx, by, dx, dy)
  );
};

export const segmentIntersectsRotatedRect = (fromX, fromY, toX, toY, cx, cy, w, h, angleDeg = 0) => {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const hw = w / 2;
  const hh = h / 2;

  const toWorld = (lx, ly) => ({
    x: cx + lx * cos - ly * sin,
    y: cy + lx * sin + ly * cos
  });

  const p1 = toWorld(-hw, -hh);
  const p2 = toWorld(hw, -hh);
  const p3 = toWorld(hw, hh);
  const p4 = toWorld(-hw, hh);

  return (
    segmentsIntersect(fromX, fromY, toX, toY, p1.x, p1.y, p2.x, p2.y) ||
    segmentsIntersect(fromX, fromY, toX, toY, p2.x, p2.y, p3.x, p3.y) ||
    segmentsIntersect(fromX, fromY, toX, toY, p3.x, p3.y, p4.x, p4.y) ||
    segmentsIntersect(fromX, fromY, toX, toY, p4.x, p4.y, p1.x, p1.y)
  );
};

export const getDefaultStructureDimensions = (type, settings = null) => {
  if (type === 'window') {
    return {
      width: settings?.defaultWindowWidth || 36,
      height: settings?.defaultWindowThickness || 8
    };
  }
  return {
    width: settings?.defaultDoorWidth || 36,
    height: settings?.defaultDoorThickness || 10
  };
};

const normalizeDeg = (deg) => ((Math.round(deg) % 360) + 360) % 360;

export const getStructureOrientationSizes = (el) => {
  const defaults = getDefaultStructureDimensions(el?.type);
  const w = el?.width || defaults.width;
  const h = el?.height || defaults.height;
  const hasExplicitRotation = typeof el?.rotation === 'number' && !Number.isNaN(el.rotation);

  if (hasExplicitRotation) {
    return {
      width: w,
      height: h,
      isVertical: false,
      hasExplicitRotation: true,
      angleDeg: normalizeDeg(el.rotation),
      cssRotation: normalizeDeg(el.rotation),
      length: w,
      thickness: h
    };
  }

  const isLegacyVertical = Boolean(el?.isVertical) || h > w;
  return {
    width: w,
    height: h,
    isVertical: isLegacyVertical,
    hasExplicitRotation: false,
    angleDeg: isLegacyVertical ? 90 : 0,
    cssRotation: 0,
    length: isLegacyVertical ? h : w,
    thickness: isLegacyVertical ? w : h
  };
};

export const setStructureRotationCentered = (el, nextAngleDeg) => {
  const { width: oldW, height: oldH, length, thickness } = getStructureOrientationSizes(el);
  const cx = (el?.x || 0) + oldW / 2;
  const cy = (el?.y || 0) + oldH / 2;
  return {
    width: length,
    height: thickness,
    isVertical: false,
    rotation: normalizeDeg(nextAngleDeg),
    x: Math.round(cx - length / 2),
    y: Math.round(cy - thickness / 2)
  };
};

export const resizeStructureCentered = (el, nextLength, nextThickness) => {
  const { width: oldW, height: oldH, isVertical, hasExplicitRotation, angleDeg } = getStructureOrientationSizes(el);
  const clampedLength = Math.max(14, Math.min(200, Math.round(nextLength)));
  const clampedThickness = Math.max(6, Math.min(36, Math.round(nextThickness)));

  // Si ya usa rotación libre en grados, conservamos width=largo y height=grosor
  if (hasExplicitRotation) {
    const cx = (el?.x || 0) + oldW / 2;
    const cy = (el?.y || 0) + oldH / 2;
    return {
      width: clampedLength,
      height: clampedThickness,
      rotation: angleDeg,
      isVertical: false,
      x: Math.round(cx - clampedLength / 2),
      y: Math.round(cy - clampedThickness / 2)
    };
  }

  const nextW = isVertical ? clampedThickness : clampedLength;
  const nextH = isVertical ? clampedLength : clampedThickness;
  return {
    width: nextW,
    height: nextH,
    x: Math.round((el?.x || 0) + (oldW - nextW) / 2),
    y: Math.round((el?.y || 0) + (oldH - nextH) / 2)
  };
};

export const rotateStructureCentered = (el) => {
  const { angleDeg } = getStructureOrientationSizes(el);
  return setStructureRotationCentered(el, angleDeg + 90);
};

export const getStructureRenderBox = (el) => {
  const { width: rawW, height: rawH, length, thickness, angleDeg } = getStructureOrientationSizes(el);
  const cx = (el?.x || 0) + rawW / 2;
  const cy = (el?.y || 0) + rawH / 2;
  return {
    x: cx - length / 2,
    y: cy - thickness / 2,
    width: length,
    height: thickness,
    angleDeg
  };
};

export const getVisionBlockers = (maps = []) => {
  const segments = [];
  for (let i = 0; i < maps.length; i++) {
    const el = maps[i];
    if (el.type === 'wall') {
      segments.push({ x1: el.x1, y1: el.y1, x2: el.x2, y2: el.y2 });
    } else if (el.type === 'door' && !el.isOpen) {
      const { width: w, height: h, length, angleDeg } = getStructureOrientationSizes(el);
      const cx = (el.x || 0) + w / 2;
      const cy = (el.y || 0) + h / 2;
      const rad = (angleDeg * Math.PI) / 180;
      const halfL = length / 2;
      const dx = Math.cos(rad) * halfL;
      const dy = Math.sin(rad) * halfL;
      segments.push({ x1: cx - dx, y1: cy - dy, x2: cx + dx, y2: cy + dy });
    } else if (el.type === 'object' && el.blocksVision && !el.isOpen) {
      const w = el.width || 48;
      const h = el.height || 48;
      segments.push(
        { x1: el.x, y1: el.y, x2: el.x + w, y2: el.y },
        { x1: el.x + w, y1: el.y, x2: el.x + w, y2: el.y + h },
        { x1: el.x + w, y1: el.y + h, x2: el.x, y2: el.y + h },
        { x1: el.x, y1: el.y + h, x2: el.x, y2: el.y }
      );
    }
  }
  return segments;
};

export const isPointVisibleToPlayers = (tx, ty, viewerTokens = [], maps = [], visionRadius = 180) => {
  const blockers = getVisionBlockers(maps);

  for (let i = 0; i < viewerTokens.length; i++) {
    const viewer = viewerTokens[i];
    if (viewer.isHidden || viewer.faction === 'enemy') continue;

    const size = viewer.size || 50;
    const ox = viewer.x + size / 2;
    const oy = viewer.y + size / 2;
    const dx = tx - ox;
    const dy = ty - oy;
    const dist = Math.hypot(dx, dy);

    if (dist > visionRadius) continue;

    const personalRadius = Math.max(size * 0.85, 36);
    const fov = 90;

    if (dist > personalRadius) {
      const targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const diff = Math.abs(angleDiff(targetAngle, viewer.rotation || 0));
      if (diff > fov / 2) continue;
    }

    if (dist < 2) return true;

    const rayDx = dx / dist;
    const rayDy = dy / dist;
    let blocked = false;

    for (let j = 0; j < blockers.length; j++) {
      const seg = blockers[j];
      const hitT = raySegmentIntersection(ox, oy, rayDx, rayDy, seg.x1, seg.y1, seg.x2, seg.y2);
      if (hitT !== null && hitT < dist - 2) {
        blocked = true;
        break;
      }
    }
    if (!blocked) return true;
  }

  for (let i = 0; i < maps.length; i++) {
    const light = maps[i];
    if (light.type !== 'light' || light.isOn === false) continue;

    const lSize = light.width || 36;
    const ox = light.x + lSize / 2;
    const oy = light.y + lSize / 2;
    const lRadius = light.radius || 220;
    const dx = tx - ox;
    const dy = ty - oy;
    const dist = Math.hypot(dx, dy);

    if (dist > lRadius) continue;
    if (dist < 2) return true;

    const rayDx = dx / dist;
    const rayDy = dy / dist;
    let blocked = false;

    for (let j = 0; j < blockers.length; j++) {
      const seg = blockers[j];
      const hitT = raySegmentIntersection(ox, oy, rayDx, rayDy, seg.x1, seg.y1, seg.x2, seg.y2);
      if (hitT !== null && hitT < dist - 2) {
        blocked = true;
        break;
      }
    }
    if (!blocked) return true;
  }

  return false;
};
