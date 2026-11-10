import { useAppSettings } from '../hooks/useAppSettings';
import { hexToRgba } from '../constants/appSettings';

const GridLayer = ({ snapToGrid, gridSize }) => {
  const { settings } = useAppSettings();
  const isVisible =
    settings.gridVisibility === 'always' ||
    (settings.gridVisibility === 'with_snap' && snapToGrid);

  if (!isVisible) return null;

  const lineColor = hexToRgba(settings.gridColor, settings.gridOpacity);

  // Garantizamos que el borde del div sea múltiplo exacto de gridSize para que (0,0) coincida siempre con una intersección
  const offset = Math.ceil(5000 / gridSize) * gridSize;

  return (
    <div style={{
      position: 'absolute',
      top: -offset,
      left: -offset,
      width: offset * 2,
      height: offset * 2,
      backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`,
      backgroundSize: `${gridSize}px ${gridSize}px`,
      backgroundPosition: '0 0',
      pointerEvents: 'none',
      zIndex: 1
    }} />
  );
};

export default GridLayer;