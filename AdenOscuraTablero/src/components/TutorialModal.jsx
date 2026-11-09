import React, { useState } from 'react';

const TUTORIAL_STEPS = [
  {
    title: 'Mesa Táctica y Múltiples Escenarios',
    subtitle: 'Arquitectura del tablero y preparación de escenas',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="15" rx="2" />
        <line x1="2" y1="8" x2="22" y2="8" />
        <line x1="8" y1="3" x2="8" y2="18" />
        <line x1="16" y1="3" x2="16" y2="18" />
        <circle cx="12" cy="13" r="2" fill="currentColor" />
        <path d="M6 21h12" />
      </svg>
    ),
    text: 'Prepara y organiza múltiples escenarios para tu crónica. Desde la barra lateral izquierda puedes abrir el editor de mapas para trazar muros infranqueables, puertas que se abren o cierran con clic derecho, ventanas que permiten la visión pero bloquean el paso, y mobiliario interactivo como cofres, antorchas y barricadas.'
  },
  {
    title: 'Niebla de Guerra y Visión Dinámica',
    subtitle: 'Exploración con memoria y línea de visión realista',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41" />
      </svg>
    ),
    text: 'Controla la exploración mediante niebla de guerra con memoria. Las fichas de los investigadores cuentan con conos de visión de 90º o halos de 360º. Usa Shift + Rueda sobre una ficha (o arrastra su guía dorada) para orientar su mirada. Las criaturas hostiles en la penumbra se ocultan automáticamente a los jugadores.'
  },
  {
    title: 'Archivos, Bestiario y Cripta de Caídos',
    subtitle: 'Expedientes de campaña, criaturas y botín saqueable',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
    text: 'Gestiona todos los recursos narrativos desde el Códice: fichas completas de Investigadores y Aliados, el Bestiario ilustrado de Criaturas de los Mitos, y el Registro Fúnebre de la Cripta, donde los combatientes caídos conservan su inventario y equipo listo para ser saqueado por los supervivientes.'
  },
  {
    title: 'Dados Físicos 3D y Tiradas del Guardián',
    subtitle: 'Simulación física de dados poliédricos en la mesa',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
    text: 'Lanza dados poliédricos (D4, D6, D8, D10, D12, D20 y D100) simulados con físicas tridimensionales realistas. Puedes ejecutar tiradas públicas visibles para todos los participantes o tiradas secretas tras la pantalla del Guardián que solo tú podrás ver.'
  },
  {
    title: 'Pantalla de Jugadores y Proyector de Pistas',
    subtitle: 'Ventana secundaria sincronizada en tiempo real',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <polygon points="10 8 16 11 10 14 10 8" />
      </svg>
    ),
    text: 'Abre una ventana secundaria sincronizada en tiempo real para proyectarla en una segunda pantalla o monitor de mesa. Los jugadores experimentarán la niebla opaca, la iluminación dinámica y las tiradas 3D sin ver las notas secretas ni los controles del Guardián. También puedes proyectarles documentos, cartas y fotografías.'
  },
  {
    title: 'Guardado Íntegro y Archivo de Aventuras',
    subtitle: 'Persistencia de crónicas completa y multiplataforma',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
    ),
    text: 'Guarda la aventura al completo en cualquier momento desde el selector de escenas o la pantalla de inicio. Se almacena íntegramente el estado de todas las escenas, planos, muros, posiciones de fichas, objetos y niebla en la carpeta interna de la app (compatible con Windows y Linux) o expórtalo como archivo .JSON.'
  }
];

const TutorialModal = ({ isOpen, onClose, onNeverShowAgain }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(4, 7, 12, 0.88)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999999,
      padding: '20px'
    }}>
      <div 
        className="vtt-wood-panel"
        style={{
          width: '600px',
          maxWidth: '100%',
          borderRadius: '14px',
          border: '1.5px solid rgba(212, 175, 55, 0.5)',
          backgroundColor: '#121622',
          backgroundImage: 'linear-gradient(180deg, rgba(20, 26, 38, 0.95) 0%, rgba(13, 16, 24, 0.98) 100%), url("/assets/textures/parchment_dossier_texture.jpg")',
          backgroundBlendMode: 'overlay',
          display: 'flex',
          flexDirection: 'column',
          color: '#e2e8f0',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(212, 175, 55, 0.15)',
          overflow: 'hidden'
        }}
      >
        {/* Cabecera Superior */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 22px',
          borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
          background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.1) 0%, rgba(0, 0, 0, 0.25) 100%)'
        }}>
          <div>
            <div className="vtt-gothic-title" style={{ fontSize: '16px', color: '#f3e8c8', letterSpacing: '0.05em', fontWeight: 'bold' }}>
              GUÍA DE LA MESA DE JUEGO (VTT)
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Manual táctico para el Guardián de la mesa
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '4px 8px',
              lineHeight: 1
            }}
            title="Cerrar guía"
          >
            ✕
          </button>
        </div>

        {/* Indicador de pasos sutil */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '12px 22px 0 22px'
        }}>
          {TUTORIAL_STEPS.map((s, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentStep(idx)}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                backgroundColor: idx === currentStep ? '#f59e0b' : idx < currentStep ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title={`Paso ${idx + 1}: ${s.title}`}
            />
          ))}
        </div>

        {/* Contenido Principal del Paso */}
        <div style={{ padding: '24px 22px', display: 'flex', gap: '22px', alignItems: 'flex-start' }}>
          {/* Contenedor del Icono Táctico Dorado */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(180, 83, 9, 0.45) 100%)',
            border: '1.5px solid #f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 6px 18px rgba(245, 158, 11, 0.25)',
            color: '#fbbf24'
          }}>
            {step.icon}
          </div>

          <div style={{ flex: 1 }}>
            <h3 className="vtt-gothic-title" style={{ margin: '0 0 3px 0', fontSize: '18px', color: '#ffffff', letterSpacing: '0.03em' }}>
              {step.title}
            </h3>
            <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              {step.subtitle}
            </div>
            <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0, color: '#cbd5e1' }}>
              {step.text}
            </p>
          </div>
        </div>

        {/* Barra de Navegación Inferior */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '14px 22px',
          background: 'rgba(10, 13, 20, 0.6)'
        }}>
          <span style={{ fontSize: '12px', color: '#8e9caa', fontWeight: 600 }}>
            Paso {currentStep + 1} de {TUTORIAL_STEPS.length}
          </span>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="vtt-brass-btn"
                style={{ padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
              >
                ← Anterior
              </button>
            )}

            {!isLast ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="vtt-brass-btn"
                style={{ padding: '7px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '12px', color: '#fef3c7', borderColor: '#d4af37' }}
              >
                Siguiente →
              </button>
            ) : (
              <button
                onClick={onClose}
                className="vtt-primary-cta"
                style={{
                  padding: '8px 22px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px'
                }}
              >
                Comenzar Partida
              </button>
            )}
          </div>
        </div>

        {/* Opción de no volver a mostrar */}
        <div style={{ textAlign: 'center', padding: '8px 22px 14px 22px', background: 'rgba(10, 13, 20, 0.6)' }}>
          <button
            onClick={() => {
              if (onNeverShowAgain) onNeverShowAgain();
              onClose();
            }}
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' }}
          >
            No volver a mostrar automáticamente al iniciar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
