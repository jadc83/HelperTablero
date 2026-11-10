import { Save, Scroll, FileText, Loader2, Info } from 'lucide-react';
import ModalShell from '../ui/ModalShell';

const AdventureActionModals = ({
  isSaveOpen,
  onCloseSave,
  adventureNameInput,
  setAdventureNameInput,
  exportJsonFile,
  setExportJsonFile,
  isSavingAdventure,
  onConfirmSave,
  isConcludeOpen,
  onCloseConclude,
  concludeNameInput,
  setConcludeNameInput,
  concludeExportJson,
  setConcludeExportJson,
  isConcluding,
  onConfirmConclude,
  scenesCount,
  charactersCount,
  tokensCount
}) => {
  return (
    <>
      <ModalShell
        isOpen={isSaveOpen}
        onClose={() => { if (!isSavingAdventure) onCloseSave(); }}
        title="Guardar Aventura y Escenarios"
        subtitle="Preserva el estado íntegro de la crónica para continuar la partida en cualquier momento."
        icon={<Save size={17} strokeWidth={2.2} />}
        width="560px"
        closeOnBackdrop={!isSavingAdventure}
        closeOnEscape={!isSavingAdventure}
        footer={
          <>
            <button
              type="button"
              onClick={onCloseSave}
              disabled={isSavingAdventure}
              className="vtt-brass-btn"
              style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '12.5px', cursor: isSavingAdventure ? 'not-allowed' : 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmSave}
              disabled={isSavingAdventure}
              className="vtt-brass-plate-btn"
              style={{ padding: '9px 20px', fontSize: '12.5px', cursor: isSavingAdventure ? 'not-allowed' : 'pointer', opacity: isSavingAdventure ? 0.7 : 1 }}
            >
              {isSavingAdventure ? (
                <>
                  <Loader2 size={14} strokeWidth={2.2} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Guardando Aventura...</span>
                </>
              ) : (
                <>
                  <Save size={14} strokeWidth={2.2} />
                  <span>Guardar Aventura</span>
                </>
              )}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Nombre de la Aventura / Crónica
            </label>
            <input
              type="text"
              value={adventureNameInput}
              onChange={(e) => setAdventureNameInput(e.target.value)}
              placeholder="Ej. La Mansión Corbitt - Acto I"
              className="vtt-dossier-input"
              style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px' }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#e2e8f0', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={exportJsonFile}
              onChange={(e) => setExportJsonFile(e.target.checked)}
              style={{ accentColor: '#d4af37', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span>Exportar además una copia en archivo <strong>.json</strong> descargable a tu equipo</span>
          </label>
        </div>
      </ModalShell>

      <ModalShell
        isOpen={isConcludeOpen}
        onClose={() => { if (!isConcluding) onCloseConclude(); }}
        title="Concluir Aventura y Archivar"
        subtitle="Sella esta crónica de forma permanente, archívala y despeja la mesa para tu próxima historia."
        icon={<Scroll size={17} strokeWidth={2.2} />}
        width="580px"
        closeOnBackdrop={!isConcluding}
        closeOnEscape={!isConcluding}
        footer={
          <>
            <button
              type="button"
              onClick={onCloseConclude}
              disabled={isConcluding}
              className="vtt-brass-btn"
              style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '12.5px', cursor: isConcluding ? 'not-allowed' : 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmConclude}
              disabled={isConcluding}
              className="vtt-conclude-plate-btn"
              style={{ padding: '9px 20px', fontSize: '12.5px', cursor: isConcluding ? 'not-allowed' : 'pointer', opacity: isConcluding ? 0.7 : 1 }}
            >
              {isConcluding ? (
                <>
                  <Loader2 size={14} strokeWidth={2.2} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Sellando Crónica...</span>
                </>
              ) : (
                <>
                  <FileText size={14} strokeWidth={2.2} />
                  <span>Sellar y Vaciar Mesa</span>
                </>
              )}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Título Definitivo de la Crónica Concluida
            </label>
            <input
              type="text"
              value={concludeNameInput}
              onChange={(e) => setConcludeNameInput(e.target.value)}
              placeholder="Ej. Las Máscaras de Nyarlathotep — Concluida"
              className="vtt-dossier-input"
              style={{ width: '100%', padding: '10px 14px', fontSize: '13.5px' }}
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(15, 20, 30, 0.7)',
            border: '1px solid rgba(245, 158, 11, 0.25)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f8fafc' }}>{scenesCount}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Escenarios</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#60a5fa' }}>{charactersCount}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Personajes</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f87171' }}>{tokensCount}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Fichas Activas</div>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#e2e8f0', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={concludeExportJson}
              onChange={(e) => setConcludeExportJson(e.target.checked)}
              style={{ accentColor: '#f59e0b', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span>Descargar copia final de seguridad en archivo <strong>.json</strong></span>
          </label>

          <div style={{
            padding: '10px 12px',
            borderRadius: '6px',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            fontSize: '11.5px',
            color: '#cbd5e1',
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <Info size={15} strokeWidth={2.2} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Mesa Limpia:</strong> La crónica quedará archivada en tu historial como <em>«Concluida»</em> y el tablero se vaciará por completo. Cuando abras de nuevo el Grimorio VTT, arrancará <strong>100% limpio y vacío</strong> hasta que inicies una nueva aventura o cargues una anterior.
            </span>
          </div>
        </div>
      </ModalShell>
    </>
  );
};

export default AdventureActionModals;
