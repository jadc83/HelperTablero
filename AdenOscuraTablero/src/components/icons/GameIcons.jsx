import React from 'react';

/**
 * Catálogo vectorial de iconos estilo Game-Icons.net (CC-BY 3.0)
 * Optimizados con viewBox="0 0 512 512", trazos nítidos y escalado vectorial limpio.
 */

const baseSvg = (pathD, size = 24, color = 'currentColor', className = '', style = {}) => (
  <svg
    viewBox="0 0 512 512"
    width={size}
    height={size}
    fill={color}
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={pathD} />
  </svg>
);

// 1. Farol de Aceite / Linterna de Queroseno (Estilo Delapouite / Game-Icons)
export const GiLantern = ({ size = 24, color = '#f59e0b', ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} {...props}>
    {/* Asa superior */}
    <path d="M256 24 C190 24 140 70 140 130 L168 130 C168 85 205 52 256 52 C307 52 344 85 344 130 L372 130 C372 70 322 24 256 24 Z" />
    {/* Cúpula de latón */}
    <path d="M200 120 L312 120 L336 170 L176 170 Z" />
    <path d="M150 170 L362 170 L380 200 L132 200 Z" />
    {/* Cristal y llama interior */}
    <path d="M150 208 L362 208 L340 370 L172 370 Z" opacity="0.35" fill="none" stroke={color} strokeWidth="20" />
    <path d="M256 230 C275 270 295 300 280 335 C270 355 242 355 232 335 C217 300 237 270 256 230 Z" fill="#fbbf24" />
    {/* Rejillas protectoras laterales */}
    <path d="M142 200 L166 370 L146 370 L122 200 Z" />
    <path d="M370 200 L346 370 L366 370 L390 200 Z" />
    {/* Base y depósito de combustible */}
    <path d="M140 370 L372 370 L390 410 L122 410 Z" />
    <path d="M110 415 L402 415 C410 415 416 422 416 430 L416 450 C416 465 404 476 388 476 L124 476 C108 476 96 465 96 450 L96 430 C96 422 102 415 110 415 Z" />
  </svg>
);

// 2. Mochila de Expedición / Viaje (Estilo Lorc / Game-Icons)
export const GiBackpack = ({ size = 24, color = '#f59e0b', ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} {...props}>
    {/* Asa superior */}
    <path d="M216 36 C190 36 170 56 170 82 L170 96 L202 96 L202 82 C202 74 208 68 216 68 L296 68 C304 68 310 74 310 82 L310 96 L342 96 L342 82 C342 56 322 36 296 36 Z" />
    {/* Solapa superior */}
    <path d="M128 96 L384 96 C406 96 424 114 424 136 L424 220 L88 220 L88 136 C88 114 106 96 128 96 Z" />
    {/* Correas de cuero frontales */}
    <path d="M176 96 L204 96 L204 250 L176 250 Z" fill="#d97706" />
    <path d="M308 96 L336 96 L336 250 L308 250 Z" fill="#d97706" />
    <rect x="170" y="240" width="40" height="20" rx="4" fill="#fbbf24" />
    <rect x="302" y="240" width="40" height="20" rx="4" fill="#fbbf24" />
    {/* Cuerpo principal */}
    <path d="M96 220 L416 220 L428 440 C428 462 410 480 388 480 L124 480 C102 480 84 462 84 440 Z" />
    {/* Bolsillo central frontal */}
    <rect x="156" y="290" width="200" height="150" rx="14" fill="#181e2b" stroke={color} strokeWidth="18" />
    <path d="M236 340 L276 340 L276 380 L236 380 Z" fill="#fbbf24" />
    {/* Bolsillos laterales de petate */}
    <path d="M52 240 L84 230 L84 420 L52 400 C44 395 40 386 40 376 L40 264 C40 252 45 243 52 240 Z" />
    <path d="M460 240 L428 230 L428 420 L460 400 C468 395 472 386 472 376 L472 264 C472 252 467 243 460 240 Z" />
  </svg>
);

// 3. Frasco de Láudano / Poción de Boticario (Estilo Lorc / Game-Icons)
export const GiLaudanumBottle = ({ size = 24, color = '#a855f7', ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} {...props}>
    {/* Tapón de corcho */}
    <path d="M220 32 L292 32 L284 88 L228 88 Z" fill="#d97706" />
    {/* Cuello del frasco con reborde */}
    <rect x="200" y="88" width="112" height="24" rx="6" />
    <path d="M224 112 L288 112 L288 160 L224 160 Z" />
    {/* Hombros y bulbo redondeado de vidrio */}
    <path d="M224 160 C180 170 120 210 100 270 C80 330 90 400 130 445 C170 490 230 496 256 496 C282 496 342 490 382 445 C422 400 432 330 412 270 C392 210 332 170 288 160 Z" />
    {/* Líquido medicinal interior */}
    <path d="M124 330 C134 300 170 310 210 320 C250 330 300 310 330 320 C360 330 380 310 392 330 C410 375 390 430 360 455 C330 480 270 484 256 484 C242 484 182 480 152 455 C122 430 110 375 124 330 Z" fill="#7c3aed" opacity="0.85" />
    {/* Cráneo o marca medicinal en el frasco */}
    <circle cx="256" cy="390" r="24" fill="#ffffff" />
    <rect x="248" y="414" width="16" height="14" rx="2" fill="#ffffff" />
    <circle cx="248" cy="386" r="4" fill="#181e2b" />
    <circle cx="264" cy="386" r="4" fill="#181e2b" />
  </svg>
);

// 4. Raciones Secas / Víveres de Campaña (Estilo Delapouite / Game-Icons)
export const GiRations = ({ size = 24, color = '#fbbf24', ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} {...props}>
    {/* Lata de conserva victoriana de raciones */}
    <ellipse cx="256" cy="120" rx="140" ry="46" />
    <path d="M116 120 L116 380 C116 405 178 426 256 426 C334 426 396 405 396 380 L396 120 Z" />
    <ellipse cx="256" cy="380" rx="140" ry="46" opacity="0.3" />
    {/* Franja de etiqueta central con espiga / comida */}
    <path d="M116 200 C178 220 334 220 396 200 L396 300 C334 320 178 320 116 300 Z" fill="#1e293b" />
    <circle cx="256" cy="254" r="28" fill="#fbbf24" />
    <path d="M256 234 L260 254 L274 254 L262 262 L266 276 L256 266 L246 276 L250 262 L238 254 L252 254 Z" fill="#1e293b" />
    {/* Llave abrelatas en la tapa */}
    <ellipse cx="256" cy="120" rx="90" ry="28" fill="#1e293b" />
    <circle cx="220" cy="120" r="14" fill="#fbbf24" />
    <rect x="230" y="116" width="50" height="8" rx="4" fill="#fbbf24" />
  </svg>
);

// 5. Cuchillo de Caza / Machete (Estilo Lorc / Game-Icons)
export const GiBowieKnife = ({ size = 24, color = '#94a3b8', ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} {...props}>
    {/* Hoja afilada tipo Bowie/Machete */}
    <path d="M472 40 C430 70 360 120 280 180 L230 220 L270 260 L320 210 C380 160 440 100 488 48 C492 44 480 34 472 40 Z" fill="#e2e8f0" />
    <path d="M230 220 C180 270 120 340 60 430 C80 440 110 440 150 400 C210 340 260 270 270 260 Z" fill="#cbd5e1" />
    {/* Guarda de latón */}
    <rect x="240" y="240" width="80" height="22" rx="6" transform="rotate(-45 280 251)" fill="#f59e0b" />
    {/* Mango de madera con remaches */}
    <path d="M280 290 L380 390 C395 405 395 430 380 445 C365 460 340 460 325 445 L225 345 Z" fill="#78350f" />
    <circle cx="280" cy="345" r="7" fill="#fbbf24" />
    <circle cx="330" cy="395" r="7" fill="#fbbf24" />
  </svg>
);

// 6. Revólver de Tambor / Arma de Fuego (Estilo Lorc / Game-Icons)
export const GiRevolver = ({ size = 24, color = '#cbd5e1', ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} {...props}>
    {/* Cañón estriado */}
    <path d="M120 140 L380 140 L380 190 L120 190 Z" />
    <path d="M360 115 L380 115 L380 140 L360 140 Z" fill="#f59e0b" /> {/* Mira delantera */}
    <path d="M120 190 L200 190 L200 215 L120 215 Z" /> {/* Varilla de extracción */}
    {/* Tambor cilíndrico */}
    <rect x="170" y="145" width="85" height="75" rx="8" fill="#475569" stroke="#cbd5e1" strokeWidth="8" />
    <circle cx="212" cy="182" r="12" fill="#1e293b" />
    {/* Armazón y percutor */}
    <path d="M110 140 L170 140 L170 230 L130 230 C120 210 115 180 110 140 Z" />
    <path d="M80 130 L110 135 L105 160 L85 150 Z" fill="#94a3b8" /> {/* Martillo percutor */}
    {/* Guardamonte y gatillo */}
    <path d="M165 230 C165 280 225 280 225 230" fill="none" stroke="#cbd5e1" strokeWidth="12" />
    <path d="M185 232 C185 255 198 255 198 232" fill="none" stroke="#f59e0b" strokeWidth="8" />
    {/* Empuñadura de nogal */}
    <path d="M130 230 L160 230 L140 370 C135 400 100 410 75 390 C55 370 65 340 85 320 L110 230 Z" fill="#78350f" />
    <circle cx="105" cy="340" r="6" fill="#fbbf24" />
  </svg>
);

// 7. Botiquín / Vendas de Primeros Auxilios (Estilo Delapouite / Game-Icons)
export const GiMedkit = ({ size = 24, color = '#ef4444', ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} {...props}>
    {/* Asa del maletín */}
    <path d="M190 70 C190 50 205 34 225 34 L287 34 C307 34 322 50 322 70 L322 96 L190 96 Z" fill="none" stroke="#cbd5e1" strokeWidth="24" />
    {/* Maletín médico de campaña */}
    <rect x="56" y="96" width="400" height="340" rx="32" fill="#1e293b" stroke="#cbd5e1" strokeWidth="20" />
    {/* Cierres metálicos */}
    <rect x="140" y="86" width="36" height="36" rx="6" fill="#f59e0b" />
    <rect x="336" y="86" width="36" height="36" rx="6" fill="#f59e0b" />
    {/* Cruz roja de socorro */}
    <rect x="226" y="176" width="60" height="180" rx="8" fill="#ef4444" />
    <rect x="166" y="236" width="180" height="60" rx="8" fill="#ef4444" />
  </svg>
);

// 8. Mechero de Latón / Encendedor Antiguo (Estilo Lorc / Game-Icons)
export const GiLighter = ({ size = 24, color = '#f59e0b', ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} {...props}>
    {/* Llama */}
    <path d="M236 30 C260 70 280 100 260 140 C240 120 220 100 220 80 C200 110 200 140 236 170 C200 160 180 130 190 100 C170 130 180 180 230 200 C270 200 300 160 290 110 C280 70 250 40 236 30 Z" fill="#fbbf24" />
    {/* Rueda de chispa y mecha */}
    <circle cx="210" cy="200" r="26" fill="#94a3b8" />
    <rect x="236" y="190" width="30" height="26" fill="#cbd5e1" />
    {/* Tapa abierta hacia la izquierda */}
    <path d="M170 216 L80 140 C70 130 50 140 55 155 L110 240 Z" fill="#d97706" />
    {/* Cuerpo de latón */}
    <rect x="150" y="216" width="180" height="260" rx="16" fill="#f59e0b" stroke="#78350f" strokeWidth="16" />
    <line x1="160" y1="280" x2="320" y2="280" stroke="#b45309" strokeWidth="8" />
  </svg>
);

// 9. Cerillas de Azufre (Estilo Lorc / Game-Icons)
export const GiMatchstick = ({ size = 24, color = '#fbbf24', ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} {...props}>
    {/* Fuego de la cerilla */}
    <path d="M370 40 C390 80 410 110 390 150 C370 130 350 110 350 90 C330 120 330 150 366 180 C330 170 310 140 320 110 C300 140 310 190 360 210 C400 210 430 170 420 120 C410 80 384 50 370 40 Z" fill="#f59e0b" />
    {/* Cabeza de azufre encendida */}
    <circle cx="340" cy="180" r="32" fill="#ef4444" />
    {/* Palo de madera inclinado */}
    <path d="M330 190 L90 430 C80 440 65 440 55 430 C45 420 45 405 55 395 L295 155 Z" fill="#fde68a" />
  </svg>
);

// 10. Rollo de Cuerda de Cáñamo (Estilo Delapouite / Game-Icons)
export const GiRopeCoil = ({ size = 24, color = '#d97706', ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} {...props}>
    <ellipse cx="256" cy="180" rx="180" ry="70" fill="none" stroke={color} strokeWidth="40" />
    <ellipse cx="256" cy="260" rx="180" ry="70" fill="none" stroke={color} strokeWidth="40" />
    <ellipse cx="256" cy="340" rx="180" ry="70" fill="none" stroke={color} strokeWidth="40" />
    {/* Nudo central envolvente */}
    <rect x="216" y="140" width="80" height="240" rx="20" fill="#92400e" stroke="#fef3c7" strokeWidth="12" />
    <line x1="216" y1="200" x2="296" y2="200" stroke="#fef3c7" strokeWidth="8" />
    <line x1="216" y1="260" x2="296" y2="260" stroke="#fef3c7" strokeWidth="8" />
    <line x1="216" y1="320" x2="296" y2="320" stroke="#fef3c7" strokeWidth="8" />
  </svg>
);

// 11. Cuaderno de Notas / Grimorio Antiguo (Estilo Lorc / Game-Icons)
export const GiBook = ({ size = 24, color = '#60a5fa', ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} {...props}>
    {/* Cubierta de cuero grueso */}
    <path d="M96 64 C80 64 64 78 64 96 L64 424 C64 442 80 456 96 456 L400 456 C422 456 440 438 440 416 L440 64 Z" fill="#1e293b" stroke="#3b82f6" strokeWidth="20" />
    {/* Lomo y esquinas de bronce */}
    <path d="M64 64 L120 64 L120 456 L64 456 Z" fill="#3b82f6" />
    <path d="M380 64 L440 64 L440 124 Z" fill="#f59e0b" />
    <path d="M380 456 L440 456 L440 396 Z" fill="#f59e0b" />
    {/* Sello arcano / Ojo de la Providencia en la portada */}
    <polygon points="270,190 340,310 200,310" fill="none" stroke="#f59e0b" strokeWidth="14" />
    <circle cx="270" cy="265" r="18" fill="#f59e0b" />
    <circle cx="270" cy="265" r="8" fill="#1e293b" />
  </svg>
);

// 12. Brújula Magnética de Bolsillo (Estilo Lorc / Game-Icons)
export const GiCompass = ({ size = 24, color = '#38bdf8', ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} {...props}>
    {/* Corona y anilla para cadena */}
    <circle cx="256" cy="50" r="30" fill="none" stroke="#f59e0b" strokeWidth="16" />
    <rect x="242" y="70" width="28" height="24" fill="#f59e0b" />
    {/* Caja exterior de latón */}
    <circle cx="256" cy="280" r="190" fill="#1e293b" stroke="#f59e0b" strokeWidth="24" />
    <circle cx="256" cy="280" r="150" fill="#0f172a" stroke="#475569" strokeWidth="10" />
    {/* Puntos cardinales */}
    <text x="256" y="170" fill="#f8fafc" fontSize="32" fontWeight="900" textAnchor="middle">N</text>
    <text x="256" y="415" fill="#94a3b8" fontSize="26" fontWeight="700" textAnchor="middle">S</text>
    <text x="375" y="290" fill="#94a3b8" fontSize="26" fontWeight="700" textAnchor="middle">E</text>
    <text x="135" y="290" fill="#94a3b8" fontSize="26" fontWeight="700" textAnchor="middle">O</text>
    {/* Aguja imantada (Norte rojo, Sur plateado) */}
    <polygon points="256,175 272,280 256,268 240,280" fill="#ef4444" />
    <polygon points="256,385 272,280 256,292 240,280" fill="#cbd5e1" />
    <circle cx="256" cy="280" r="14" fill="#f59e0b" />
  </svg>
);

// 13. Lupa de Investigación (Estilo Lorc / Game-Icons)
export const GiMagnifier = ({ size = 24, color = '#38bdf8', ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} {...props}>
    {/* Lente de aumento */}
    <circle cx="200" cy="200" r="130" fill="#0284c7" opacity="0.25" />
    <circle cx="200" cy="200" r="130" fill="none" stroke="#f59e0b" strokeWidth="32" />
    {/* Brillo de reflejo en cristal curvo */}
    <path d="M130 140 C150 110 180 95 215 95" fill="none" stroke="#ffffff" strokeWidth="16" strokeLinecap="round" />
    {/* Enganche y mango de caoba */}
    <rect x="290" y="290" width="36" height="30" rx="4" transform="rotate(-45 308 305)" fill="#f59e0b" />
    <path d="M305 305 L435 435 C445 445 445 465 435 475 C425 485 405 485 395 475 L265 345 Z" fill="#78350f" stroke="#f59e0b" strokeWidth="8" />
  </svg>
);

// 14. Cantimplora de Campaña (Estilo Delapouite / Game-Icons)
export const GiCanteen = ({ size = 24, color = '#38bdf8', ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} {...props}>
    {/* Tapón con cadenilla */}
    <rect x="228" y="40" width="56" height="36" rx="6" fill="#f59e0b" />
    <path d="M284 58 C320 70 330 110 320 140" fill="none" stroke="#cbd5e1" strokeWidth="8" strokeDasharray="6,6" />
    {/* Cuello */}
    <rect x="236" y="76" width="40" height="34" fill="#94a3b8" />
    {/* Cuerpo de cantimplora redondeada con forro */}
    <circle cx="256" cy="290" r="170" fill="#1e293b" stroke="#64748b" strokeWidth="24" />
    {/* Correa transversal de cuero */}
    <path d="M96 220 L416 360" stroke="#b45309" strokeWidth="28" />
    <circle cx="256" cy="290" r="60" fill="none" stroke="#f59e0b" strokeWidth="12" />
  </svg>
);

// 15. Ganzúas de Cerrajero (Estilo Delapouite / Game-Icons)
export const GiLockpicks = ({ size = 24, color = '#cbd5e1', ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} {...props}>
    {/* Ganzúa de tensión curvada */}
    <path d="M120 460 L120 180 L80 180" fill="none" stroke="#94a3b8" strokeWidth="24" strokeLinecap="round" />
    {/* Ganzúa de gancho fino */}
    <path d="M256 460 L256 120 C256 90 280 80 290 100 C300 120 280 140 270 140" fill="none" stroke="#f59e0b" strokeWidth="24" strokeLinecap="round" />
    {/* Ganzúa de rastrillado en zigzag */}
    <path d="M380 460 L380 200 L400 180 L380 160 L400 140 L380 120 L400 100" fill="none" stroke="#e2e8f0" strokeWidth="20" strokeLinecap="round" />
    {/* Anillo de unión de acero */}
    <circle cx="256" cy="450" r="40" fill="none" stroke="#f59e0b" strokeWidth="18" />
  </svg>
);

// 16. Caja / Arcón / Genérico (Estilo Lorc / Game-Icons)
export const GiChest = ({ size = 24, color = '#a16207', ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} {...props}>
    {/* Tapa abovedada */}
    <path d="M64 210 C64 140 130 96 256 96 C382 96 448 140 448 210 Z" fill="#854d0e" stroke="#ca8a04" strokeWidth="20" />
    {/* Refuerzos de hierro forjado en la tapa */}
    <path d="M136 120 C146 170 146 210 146 210" stroke="#1e293b" strokeWidth="24" fill="none" />
    <path d="M376 120 C366 170 366 210 366 210" stroke="#1e293b" strokeWidth="24" fill="none" />
    {/* Caja inferior */}
    <rect x="64" y="210" width="384" height="210" rx="8" fill="#713f12" stroke="#ca8a04" strokeWidth="20" />
    {/* Cerradura y pestillo de latón */}
    <rect x="226" y="190" width="60" height="80" rx="8" fill="#f59e0b" stroke="#78350f" strokeWidth="10" />
    <circle cx="256" cy="225" r="8" fill="#181e2b" />
    <polygon points="252,225 260,225 262,250 250,250" fill="#181e2b" />
  </svg>
);

// 17. Reliquia Misteriosa / Ídolo Arcano (Estilo Lorc / Game-Icons)
export const GiRelic = ({ size = 24, color = '#10b981', ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} {...props}>
    {/* Ojo primordial de jade */}
    <path d="M64 256 C120 160 200 110 256 110 C312 110 392 160 448 256 C392 352 312 402 256 402 C200 402 120 352 64 256 Z" fill="#064e3b" stroke="#10b981" strokeWidth="24" />
    <circle cx="256" cy="256" r="70" fill="#10b981" />
    <ellipse cx="256" cy="256" rx="20" ry="55" fill="#022c22" />
    {/* Destellos místicos */}
    <circle cx="242" cy="235" r="10" fill="#ecfdf5" />
  </svg>
);

// 18. Maletín de Investigación / Profesión (Estilo Lorc / Game-Icons)
export const GiBriefcase = ({ size = 20, color = 'currentColor', style = {}, ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }} {...props}>
    <path d="M192 48 C174 48 160 62 160 80 L160 112 L196 112 L196 84 L316 84 L316 112 L352 112 L352 80 C352 62 338 48 320 48 Z" />
    <rect x="48" y="112" width="416" height="336" rx="28" />
    <rect x="48" y="240" width="416" height="24" fill="#0f172a" opacity="0.3" />
    <rect x="144" y="224" width="40" height="56" rx="6" fill="#fbbf24" />
    <rect x="328" y="224" width="40" height="56" rx="6" fill="#fbbf24" />
    <circle cx="164" cy="252" r="5" fill="#1e293b" />
    <circle cx="348" cy="252" r="5" fill="#1e293b" />
    <path d="M48 168 L104 112 L48 112 Z" opacity="0.25" fill="#ffffff" />
    <path d="M464 168 L408 112 L464 112 Z" opacity="0.25" fill="#ffffff" />
  </svg>
);

// 19. Calendario / Año y Época (Estilo Delapouite / Game-Icons)
export const GiCalendar = ({ size = 20, color = 'currentColor', style = {}, ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }} {...props}>
    <rect x="120" y="32" width="32" height="72" rx="14" fill="#f59e0b" />
    <rect x="360" y="32" width="32" height="72" rx="14" fill="#f59e0b" />
    <rect x="64" y="80" width="384" height="384" rx="28" />
    <rect x="64" y="80" width="384" height="100" rx="28" fill="#ef4444" />
    <rect x="64" y="160" width="384" height="20" fill="#ef4444" />
    <g fill="#1e293b" opacity="0.45">
      <rect x="112" y="212" width="48" height="40" rx="6" />
      <rect x="184" y="212" width="48" height="40" rx="6" />
      <rect x="256" y="212" width="48" height="40" rx="6" />
      <rect x="328" y="212" width="56" height="40" rx="6" />
      <rect x="112" y="276" width="48" height="40" rx="6" />
      <rect x="184" y="276" width="48" height="40" rx="6" fill="#f59e0b" opacity="1" />
      <rect x="256" y="276" width="48" height="40" rx="6" />
      <rect x="328" y="276" width="56" height="40" rx="6" />
      <rect x="112" y="340" width="48" height="40" rx="6" />
      <rect x="184" y="340" width="48" height="40" rx="6" />
      <rect x="256" y="340" width="48" height="40" rx="6" />
      <rect x="328" y="340" width="56" height="40" rx="6" />
    </g>
  </svg>
);

// 20. Marcador de Mapa / Nacimiento (Estilo Delapouite / Game-Icons)
export const GiMapPin = ({ size = 20, color = 'currentColor', style = {}, ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }} {...props}>
    <path d="M256 32 C150 32 64 118 64 224 C64 330 220 460 244 476 C250 480 262 480 268 476 C292 460 448 330 448 224 C448 118 362 32 256 32 Z" />
    <circle cx="256" cy="216" r="72" fill="#0f172a" />
    <circle cx="256" cy="216" r="32" fill="#38bdf8" />
  </svg>
);

// 21. Casa / Residencia (Estilo Delapouite / Game-Icons)
export const GiHouse = ({ size = 20, color = 'currentColor', style = {}, ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }} {...props}>
    <rect x="340" y="80" width="48" height="100" rx="4" />
    <rect x="330" y="72" width="68" height="16" rx="4" fill="#f59e0b" />
    <polygon points="256,64 480,240 448,272 256,120 64,272 32,240" />
    <rect x="80" y="240" width="352" height="224" rx="8" />
    <circle cx="256" cy="190" r="32" fill="#0f172a" />
    <circle cx="256" cy="190" r="26" fill="#38bdf8" opacity="0.6" />
    <rect x="216" y="320" width="80" height="144" rx="6" fill="#0f172a" />
    <circle cx="280" cy="390" r="6" fill="#fbbf24" />
    <rect x="116" y="280" width="64" height="72" rx="6" fill="#38bdf8" opacity="0.5" />
    <rect x="332" y="280" width="64" height="72" rx="6" fill="#38bdf8" opacity="0.5" />
  </svg>
);

// 22. Birrete de Estudios / Grado Académico (Estilo Delapouite / Game-Icons)
export const GiGraduationCap = ({ size = 20, color = 'currentColor', style = {}, ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }} {...props}>
    <polygon points="256,64 496,160 256,256 16,160" />
    <path d="M128 205 L128 320 C128 390 200 432 256 432 C312 432 384 390 384 320 L384 205 L256 256 Z" fill="#312e81" opacity="0.8" />
    <ellipse cx="256" cy="160" rx="16" ry="12" fill="#fbbf24" />
    <path d="M256 160 C320 180 390 230 400 300 L408 400" fill="none" stroke="#fbbf24" strokeWidth="14" strokeLinecap="round" />
    <rect x="396" y="390" width="24" height="48" rx="6" fill="#f59e0b" />
  </svg>
);

// 23. Cámara Fotográfica Vintage / Retrato (Estilo Delapouite / Game-Icons)
export const GiRetroCamera = ({ size = 24, color = 'currentColor', style = {}, ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }} {...props}>
    <rect x="120" y="70" width="50" height="30" rx="6" fill="#94a3b8" />
    <rect x="330" y="60" width="70" height="40" rx="8" fill="#f59e0b" />
    <rect x="48" y="100" width="416" height="320" rx="36" />
    <rect x="48" y="150" width="416" height="220" fill="#0f172a" opacity="0.4" />
    <circle cx="256" cy="260" r="110" fill="#1e293b" stroke="#f59e0b" strokeWidth="20" />
    <circle cx="256" cy="260" r="76" fill="#0284c7" opacity="0.6" stroke="#e2e8f0" strokeWidth="10" />
    <circle cx="256" cy="260" r="40" fill="#0f172a" />
    <circle cx="230" cy="235" r="14" fill="#ffffff" opacity="0.8" />
    <rect x="80" y="130" width="36" height="28" rx="6" fill="#38bdf8" />
  </svg>
);

// 24. Silueta de Detective / Investigador (Estilo Lorc / Game-Icons)
export const GiDetective = ({ size = 20, color = 'currentColor', style = {}, ...props }) => (
  <svg viewBox="0 0 512 512" width={size} height={size} fill={color} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }} {...props}>
    <path d="M176 150 C176 100 210 70 256 70 C302 70 336 100 336 150 L346 170 L166 170 Z" />
    <rect x="166" y="160" width="180" height="24" rx="4" fill="#f59e0b" />
    <ellipse cx="256" cy="184" rx="190" ry="28" />
    <path d="M190 200 C190 260 215 285 256 285 C297 285 322 260 322 200 Z" fill="#0f172a" opacity="0.5" />
    <polygon points="170,260 220,380 256,330 292,380 342,260 410,448 102,448" />
    <polygon points="180,260 240,360 256,290" fill="#f59e0b" opacity="0.8" />
    <polygon points="332,260 272,360 256,290" fill="#f59e0b" opacity="0.8" />
  </svg>
);

/**
 * Función inteligente para resolver el icono vectorial de Game-Icons adecuado
 * según el nombre, categoría o ID del objeto.
 */
export const getGameIconComponent = (itemOrName, size = 22) => {
  const name = (typeof itemOrName === 'string' ? itemOrName : itemOrName?.name || '').toLowerCase();
  
  if (name.includes('mochila') || name.includes('backpack') || name.includes('morral') || name.includes('petate')) {
    return <GiBackpack size={size} color="#f59e0b" />;
  }
  if (name.includes('linterna') || name.includes('farol') || name.includes('lámpara') || name.includes('lampara') || name.includes('candil')) {
    return <GiLantern size={size} color="#fbbf24" />;
  }
  if (name.includes('láudano') || name.includes('laudano') || name.includes('medicina') || name.includes('poción') || name.includes('pocion') || name.includes('calmante')) {
    return <GiLaudanumBottle size={size} color="#c084fc" />;
  }
  if (name.includes('ración') || name.includes('racion') || name.includes('comida') || name.includes('víveres') || name.includes('viveres') || name.includes('conserva') || name.includes('pan')) {
    return <GiRations size={size} color="#fbbf24" />;
  }
  if (name.includes('machete') || name.includes('cuchillo') || name.includes('daga') || name.includes('navaja')) {
    return <GiBowieKnife size={size} color="#e2e8f0" />;
  }
  if (name.includes('revólver') || name.includes('revolver') || name.includes('pistola') || name.includes('escopeta') || name.includes('rifle') || name.includes('arma')) {
    return <GiRevolver size={size} color="#cbd5e1" />;
  }
  if (name.includes('botiquín') || name.includes('botiquin') || name.includes('venda') || name.includes('cura') || name.includes('primeros auxilios')) {
    return <GiMedkit size={size} color="#ef4444" />;
  }
  if (name.includes('mechero') || name.includes('encendedor') || name.includes('chisquero')) {
    return <GiLighter size={size} color="#f59e0b" />;
  }
  if (name.includes('cerilla') || name.includes('fósforo') || name.includes('fosforo')) {
    return <GiMatchstick size={size} color="#fbbf24" />;
  }
  if (name.includes('cuerda') || name.includes('maroma') || name.includes('soga')) {
    return <GiRopeCoil size={size} color="#d97706" />;
  }
  if (name.includes('cuaderno') || name.includes('diario') || name.includes('libro') || name.includes('grimorio') || name.includes('nota') || name.includes('mapa') || name.includes('pergamino')) {
    return <GiBook size={size} color="#60a5fa" />;
  }
  if (name.includes('brújula') || name.includes('brujula')) {
    return <GiCompass size={size} color="#38bdf8" />;
  }
  if (name.includes('lupa') || name.includes('lente')) {
    return <GiMagnifier size={size} color="#38bdf8" />;
  }
  if (name.includes('cantimplora') || name.includes('agua') || name.includes('frasco')) {
    return <GiCanteen size={size} color="#38bdf8" />;
  }
  if (name.includes('ganzúa') || name.includes('ganzua') || name.includes('llave') || name.includes('cerrojo')) {
    return <GiLockpicks size={size} color="#cbd5e1" />;
  }
  if (name.includes('reliquia') || name.includes('amuleto') || name.includes('ídolo') || name.includes('idolo') || name.includes('tótem') || name.includes('totem')) {
    return <GiRelic size={size} color="#10b981" />;
  }

  // Por defecto: Arcón / Caja de suministros
  return <GiChest size={size} color="#eab308" />;
};
