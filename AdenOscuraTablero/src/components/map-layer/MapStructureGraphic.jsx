/**
 * Gráfico arquitectónico cenital (SVG) para puertas y ventanas en el tablero y editor.
 * Se adapta proporcionalmente al largo/grosor y muestra bisagra, picaporte y arco de
 * apertura (en puertas) o doble acristalamiento / rotura (en ventanas).
 */
const MapStructureGraphic = ({
  type,
  width,
  height,
  isOpen = false,
  isBroken = false,
  isDragging = false,
  isSelected = false
}) => {
  const w = Math.max(12, width || 36);
  const h = Math.max(6, height || 10);
  const jambW = Math.max(2.5, Math.min(5, w * 0.14));
  const innerSpan = Math.max(6, w - jambW * 2);

  if (type === 'door') {
    const strokeAccent = isDragging || isSelected
      ? '#fbbf24'
      : isOpen
      ? '#34d399'
      : '#d4af37';
    const leafThickness = Math.max(2.5, Math.min(h - 2, h * 0.55));
    const leafY = (h - leafThickness) / 2;
    const hingeX = jambW;
    const hingeY = h / 2;
    // Apertura ~72° hacia abajo en coordenadas locales del plano
    const swingRad = (72 * Math.PI) / 180;
    const tipX = hingeX + Math.cos(swingRad) * innerSpan;
    const tipY = hingeY + Math.sin(swingRad) * innerSpan;

    return (
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ display: 'block', overflow: 'visible', pointerEvents: 'none' }}
      >
        {/* Sombra bajo el umbral cuando está cerrada */}
        {!isOpen && (
          <rect
            x={0.5}
            y={0.5}
            width={w - 1}
            height={h - 1}
            fill="rgba(0,0,0,0.45)"
          />
        )}

        {/* Umbral punteado + arco de barrido + hoja batida cuando está ABIERTA */}
        {isOpen ? (
          <>
            <line
              x1={jambW}
              y1={hingeY}
              x2={w - jambW}
              y2={hingeY}
              stroke="#34d399"
              strokeWidth={1}
              strokeDasharray="2.5 2"
              strokeOpacity={0.65}
            />
            <path
              d={`M ${hingeX} ${hingeY} L ${w - jambW} ${hingeY} A ${innerSpan} ${innerSpan} 0 0 1 ${tipX.toFixed(2)} ${tipY.toFixed(2)} Z`}
              fill="rgba(52, 211, 153, 0.1)"
            />
            <path
              d={`M ${w - jambW} ${hingeY} A ${innerSpan} ${innerSpan} 0 0 1 ${tipX.toFixed(2)} ${tipY.toFixed(2)}`}
              fill="none"
              stroke="#34d399"
              strokeWidth={1}
              strokeDasharray="2.5 2"
              strokeOpacity={0.85}
            />
            <g transform={`rotate(72 ${hingeX} ${hingeY})`}>
              <rect
                x={hingeX}
                y={leafY}
                width={innerSpan}
                height={leafThickness}
                fill="#7c3a14"
                stroke={strokeAccent}
                strokeWidth={1}
              />
            </g>
          </>
        ) : (
          <>
            {/* Hoja de madera cerrada entre jambas */}
            <rect
              x={jambW}
              y={leafY}
              width={innerSpan}
              height={leafThickness}
              fill="#7c3a14"
              stroke={strokeAccent}
              strokeWidth={1.1}
            />
            {/* Línea de veta central */}
            <line
              x1={jambW + 1.5}
              y1={hingeY}
              x2={w - jambW - 1.5}
              y2={hingeY}
              stroke="#451a03"
              strokeWidth={0.9}
            />
            {/* Pequeño pomo/manilla en el lado opuesto a la bisagra */}
            <rect
              x={w - jambW - 4.5}
              y={leafY - 1.2}
              width={3}
              height={leafThickness + 2.4}
              rx={0.6}
              fill="#fbbf24"
              stroke="#451a03"
              strokeWidth={0.5}
            />
          </>
        )}

        {/* Jambas laterales cuadradas */}
        <rect x={0} y={0} width={jambW} height={h} fill="#241308" stroke={strokeAccent} strokeWidth={1} />
        <rect x={w - jambW} y={0} width={jambW} height={h} fill="#241308" stroke={strokeAccent} strokeWidth={1} />
      </svg>
    );
  }

  // Ventana cenital: alféizar + jambas + doble acristalamiento arquitectónico
  const winStroke = isDragging || isSelected
    ? '#fbbf24'
    : isBroken
    ? '#f87171'
    : isOpen
    ? '#7dd3fc'
    : '#38bdf8';

  const glassY1 = h * 0.34;
  const glassY2 = h * 0.66;
  const midX = w / 2;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ display: 'block', overflow: 'visible', pointerEvents: 'none' }}
    >
      {/* Marco / alféizar */}
      <rect
        x={jambW * 0.5}
        y={0.5}
        width={w - jambW}
        height={h - 1}
        fill={isBroken ? 'rgba(239, 68, 68, 0.14)' : isOpen ? 'rgba(56, 189, 248, 0.08)' : 'rgba(14, 116, 144, 0.38)'}
        stroke={winStroke}
        strokeWidth={1.1}
        strokeDasharray={isOpen || isBroken ? '2.5 2' : undefined}
      />

      {!isOpen && !isBroken && (
        <>
          {/* Doble línea de cristal paralela */}
          <line x1={jambW} y1={glassY1} x2={w - jambW} y2={glassY1} stroke="#bae6fd" strokeWidth={1} />
          <line x1={jambW} y1={glassY2} x2={w - jambW} y2={glassY2} stroke="#bae6fd" strokeWidth={1} />
          {/* Parteluz central */}
          <line x1={midX} y1={0.5} x2={midX} y2={h - 0.5} stroke="#7dd3fc" strokeWidth={1.1} />
        </>
      )}

      {isBroken && (
        <polyline
          points={`${jambW},${h * 0.25} ${w * 0.35},${h * 0.78} ${w * 0.52},${h * 0.2} ${w * 0.72},${h * 0.8} ${w - jambW},${h * 0.3}`}
          fill="none"
          stroke="#fca5a5"
          strokeWidth={1.1}
        />
      )}

      {/* Jambas laterales */}
      <rect x={0} y={0} width={jambW} height={h} fill="#0f172a" stroke={winStroke} strokeWidth={1} />
      <rect x={w - jambW} y={0} width={jambW} height={h} fill="#0f172a" stroke={winStroke} strokeWidth={1} />
    </svg>
  );
};

export default MapStructureGraphic;
