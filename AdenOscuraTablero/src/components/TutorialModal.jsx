import { useState } from 'react';
import { Map, Eye, BookOpen, Dices, Monitor, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import ModalShell from './ui/ModalShell';

const TUTORIAL_STEPS = [
  {
    title: 'Mesa Táctica y Múltiples Escenarios',
    subtitle: 'Arquitectura del tablero y preparación de escenas',
    icon: <Map size={32} strokeWidth={1.8} />,
    text: 'Prepara y organiza múltiples escenarios para tu crónica. Desde el Centro de Mando (pestaña Escenas) puedes pulsar "Editar plano" para trazar muros infranqueables, puertas que se abren o cierran con clic derecho, ventanas que permiten la visión pero bloquean el paso, y mobiliario interactivo como cofres, antorchas y barricadas.'
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

  const step = TUTORIAL_STEPS[currentStep];
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="GUÍA DE LA MESA DE JUEGO (VTT)"
      subtitle="Manual táctico para el Guardián de la mesa"
      icon={<BookOpen size={17} strokeWidth={2.2} />}
      width="600px"
      zIndex={105000}
      panelStyle={{
        backgroundImage: 'linear-gradient(180deg, rgba(20, 26, 38, 0.96) 0%, rgba(13, 16, 24, 0.98) 100%), url("/assets/textures/parchment_dossier_texture.jpg")',
        backgroundBlendMode: 'overlay'
      }}
      bodyStyle={{ padding: '14px 22px 22px 22px' }}
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontSize: '12px', color: '#8e9caa', fontWeight: 600 }}>
              Paso {currentStep + 1} de {TUTORIAL_STEPS.length}
            </span>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="vtt-brass-btn"
                  style={{ padding: '7px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
                >
                  <ChevronLeft size={14} strokeWidth={2.2} /> Anterior
                </button>
              )}

              {!isLast ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="vtt-brass-btn"
                  style={{ padding: '7px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '12px', color: '#fef3c7', borderColor: '#d4af37' }}
                >
                  Siguiente <ChevronRight size={14} strokeWidth={2.2} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="vtt-primary-cta"
                  style={{ padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Comenzar Partida
                </button>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
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
      }
    >
      {/* Indicadores de pasos con área clicable cómoda */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '18px' }}>
        {TUTORIAL_STEPS.map((s, idx) => (
          <button
            type="button"
            key={idx}
            onClick={() => setCurrentStep(idx)}
            style={{
              flex: 1,
              padding: '7px 0',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
            title={`Paso ${idx + 1}: ${s.title}`}
            aria-label={`Paso ${idx + 1}: ${s.title}`}
          >
            <div style={{
              height: '5px',
              borderRadius: '3px',
              backgroundColor: idx === currentStep ? '#f59e0b' : idx < currentStep ? 'rgba(245, 158, 11, 0.45)' : 'rgba(255, 255, 255, 0.12)',
              transition: 'all 0.2s ease'
            }} />
          </button>
        ))}
      </div>

      {/* Contenido Principal del Paso */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
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
          <h3 className="vtt-gothic-title" style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#ffffff', letterSpacing: '0.03em' }}>
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
    </ModalShell>
  );
};

export default TutorialModal;
