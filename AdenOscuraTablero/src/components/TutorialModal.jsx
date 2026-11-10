import React, { useState } from 'react';
import { Map, Eye, BookOpen, Dices, Monitor, Save, X } from 'lucide-react';

const TUTORIAL_STEPS = [
  {
    title: 'Mesa Táctica y Múltiples Escenarios',
    subtitle: 'Arquitectura del tablero y preparación de escenas',
    icon: <Map size={32} strokeWidth={1.8} />,
    text: 'Prepara y organiza múltiples escenarios para tu crónica. Desde el Centro de Mando (pestaña Escenas) puedes pulsar "Editar Escena" para trazar muros infranqueables, puertas que se abren o cierran con clic derecho, ventanas que permiten la visión pero bloquean el paso, y mobiliario interactivo como cofres, antorchas y barricadas.'
  },
  {
    title: 'Niebla de Guerra y Visión Dinámica',
    subtitle: 'Exploración con memoria y línea de visión realista',
    icon: <Eye size={32} strokeWidth={1.8} />,
    text: 'Controla la exploración mediante niebla de guerra con memoria. Las fichas de los investigadores cuentan con conos de visión de 90º o halos de 360º. Usa Shift + Rueda sobre una ficha (o arrastra su guía dorada) para orientar su mirada. Las criaturas hostiles en la penumbra se ocultan automáticamente a los jugadores.'
  },
  {
    title: 'Archivos, Bestiario y Cripta de Caídos',
    subtitle: 'Expedientes de campaña, criaturas y botín saqueable',
    icon: <BookOpen size={32} strokeWidth={1.8} />,
    text: 'Gestiona todos los recursos narrativos desde el Códice: fichas completas de Investigadores y Aliados, el Bestiario ilustrado de Criaturas de los Mitos, y el Registro Fúnebre de la Cripta, donde los combatientes caídos conservan su inventario y equipo listo para ser saqueado por los supervivientes.'
  },
  {
    title: 'Dados Físicos 3D y Tiradas del Guardián',
    subtitle: 'Simulación física de dados poliédricos en la mesa',
    icon: <Dices size={32} strokeWidth={1.8} />,
    text: 'Lanza dados poliédricos (D4, D6, D8, D10, D12, D20 y D100) simulados con físicas tridimensionales realistas. Puedes ejecutar tiradas públicas visibles para todos los participantes o tiradas secretas tras la pantalla del Guardián que solo tú podrás ver.'
  },
  {
    title: 'Pantalla de Jugadores y Proyector de Pistas',
    subtitle: 'Ventana secundaria sincronizada en tiempo real',
    icon: <Monitor size={32} strokeWidth={1.8} />,
    text: 'Abre una ventana secundaria sincronizada en tiempo real para proyectarla en una segunda pantalla o monitor de mesa. Los jugadores experimentarán la niebla opaca, la iluminación dinámica y las tiradas 3D sin ver las notas secretas ni los controles del Guardián. También puedes proyectarles documentos, cartas y fotografías.'
  },
  {
    title: 'Guardado Íntegro y Archivo de Aventuras',
    subtitle: 'Persistencia de crónicas completa y multiplataforma',
    icon: <Save size={32} strokeWidth={1.8} />,
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
            <X size={16} strokeWidth={2.4} />
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
