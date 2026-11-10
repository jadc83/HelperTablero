import { useEffect, useState } from 'react';
import { Map, FileText, Zap, Package, Settings, X } from 'lucide-react';
import ScenesManagerTab from './settings/ScenesManagerTab';
import SceneNotesTab from './settings/SceneNotesTab';
import ItemsCatalogTab from './settings/ItemsCatalogTab';
import StatusesTab from './settings/StatusesTab';
import AdventureActionModals from './settings/AdventureActionModals';

const TABS = [
  { id: 'escenario', label: 'Escenas', icon: Map },
  { id: 'notas', label: 'Notas', icon: FileText },
  { id: 'estados', label: 'Estados', icon: Zap },
  { id: 'items', label: 'Objetos', icon: Package }
];

const SettingsDrawer = ({
  isOpen,
  onClose,
  characters = [],
  customStatuses = [],
  onAddCustomStatus,
  onRemoveCustomStatus,
  onImportCampaign,
  openMapCreator,
  scenes = [],
  activeSceneId = null,
  onSelectScene,
  onCreateNewScene,
  onRenameScene,
  onDeleteScene,
  onDeleteAllScenes,
  onMoveSceneOrder,
  onReorderScenes,
  tokens = [],
  activeTurnTokenId = null,
  commonItems = [],
  onGiveItemToCharacter,
  onSaveCommonItem,
  onDeleteCommonItem,
  onPlaceGroundItem,
  onTransferItem,
  onSaveAdventure,
  onConcludeAdventure,
  sceneNotes = {},
  onUpdateSceneNotes,
  campaignNotes = '',
  onUpdateCampaignNotes,
  initialTab = null
}) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'escenario');
  const [selectedNoteSceneId, setSelectedNoteSceneId] = useState(activeSceneId || (scenes[0] && scenes[0].id));
  const [statusMessage, setStatusMessage] = useState(null);

  const [isSaveAdventureModalOpen, setIsSaveAdventureModalOpen] = useState(false);
  const [adventureNameInput, setAdventureNameInput] = useState('');
  const [exportJsonFile, setExportJsonFile] = useState(true);
  const [isSavingAdventure, setIsSavingAdventure] = useState(false);

  const [isConcludeModalOpen, setIsConcludeModalOpen] = useState(false);
  const [concludeNameInput, setConcludeNameInput] = useState('');
  const [concludeExportJson, setConcludeExportJson] = useState(true);
  const [isConcluding, setIsConcluding] = useState(false);

  const [prevActiveSceneId, setPrevActiveSceneId] = useState(activeSceneId);
  const [prevOpenTabKey, setPrevOpenTabKey] = useState(`${isOpen}-${initialTab || ''}`);

  if (activeSceneId !== prevActiveSceneId) {
    setPrevActiveSceneId(activeSceneId);
    if (activeSceneId) setSelectedNoteSceneId(activeSceneId);
  }

  const openTabKey = `${isOpen}-${initialTab || ''}`;
  if (openTabKey !== prevOpenTabKey) {
    setPrevOpenTabKey(openTabKey);
    if (initialTab && isOpen) setActiveTab(initialTab);
  }

  useEffect(() => {
    if (!isOpen || !onClose || isSaveAdventureModalOpen || isConcludeModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSaveAdventureModalOpen, isConcludeModalOpen]);

  const notify = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleOpenSaveModal = () => {
    const cur = scenes.find(s => s.id === activeSceneId) || scenes[0];
    setAdventureNameInput(cur?.name ? `Crónica: ${cur.name}` : 'Mi Aventura');
    setIsSaveAdventureModalOpen(true);
  };

  const handleConfirmSaveAdventure = async () => {
    if (!onSaveAdventure) return;
    setIsSavingAdventure(true);
    try {
      await onSaveAdventure(adventureNameInput.trim() || 'Aventura de Campaña', exportJsonFile);
      notify('¡Aventura guardada exitosamente!');
      setIsSaveAdventureModalOpen(false);
    } catch (err) {
      console.error('Error al guardar aventura:', err);
      notify('Error al guardar la aventura');
    } finally {
      setIsSavingAdventure(false);
    }
  };

  const handleOpenConcludeModal = () => {
    const cur = scenes.find(s => s.id === activeSceneId) || scenes[0];
    setConcludeNameInput(cur?.name ? `Crónica: ${cur.name} — Concluida` : 'Crónica Concluida');
    setConcludeExportJson(true);
    setIsConcludeModalOpen(true);
  };

  const handleConfirmConcludeAdventure = async () => {
    if (!onConcludeAdventure) return;
    setIsConcluding(true);
    try {
      await onConcludeAdventure(concludeNameInput.trim() || 'Crónica Concluida', concludeExportJson);
      setIsConcludeModalOpen(false);
      if (onClose) onClose();
    } catch (err) {
      console.error('Error al concluir aventura:', err);
      notify('Error al concluir la aventura');
    } finally {
      setIsConcluding(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '58px',
      right: isOpen ? '0' : '-520px',
      width: '510px',
      maxWidth: '100vw',
      bottom: '0',
      transition: 'right 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
      zIndex: 4500,
      background: 'linear-gradient(180deg, #131722 0%, #0a0d14 100%)',
      borderLeft: '1.5px solid #2a3448',
      boxShadow: isOpen ? '-16px 0 50px rgba(0,0,0,0.92)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      color: '#e2e8f0',
      overflow: 'hidden'
    }}>
      {/* Cabecera Superior */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 18px',
        backgroundImage: 'linear-gradient(180deg, rgba(16, 19, 27, 0.75) 0%, rgba(13, 16, 23, 0.95) 100%), url("/assets/textures/grimoire_leather_header.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '5px',
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(180, 83, 9, 0.4) 100%)',
            border: '1px solid #d4af37',
            color: '#fbbf24',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
          }}>
            <Settings size={14} strokeWidth={2.2} />
          </span>
          <span className="vtt-gothic-title" style={{ fontSize: '16px', fontWeight: 'bold', color: '#f8fafc', letterSpacing: '0.06em' }}>
            CENTRO DE MANDO
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="vtt-brass-plate-btn"
          style={{ padding: '4px 11px', fontSize: '11px' }}
          title="Cerrar Centro de Mando (Esc)"
        >
          <X size={13} strokeWidth={2.4} /> Cerrar
        </button>
      </div>

      {/* Navegación en Lengüetas */}
      <div className="vtt-dossier-tab-container">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`vtt-dossier-tab ${isActive ? 'vtt-dossier-tab-active' : ''}`}
              title={`Expediente: ${tab.label}`}
            >
              <IconComponent size={13} strokeWidth={2.2} style={{ color: isActive ? '#fef08a' : '#8e9caa' }} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Cuerpo Compacto */}
      <div style={{ flex: 1, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
        {statusMessage && (
          <div style={{
            padding: '7px 12px',
            backgroundColor: '#261810',
            border: '1px solid #d4af37',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#fbbf24',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            {statusMessage}
          </div>
        )}

        {activeTab === 'escenario' && (
          <ScenesManagerTab
            scenes={scenes}
            activeSceneId={activeSceneId}
            onSelectScene={onSelectScene}
            onCreateNewScene={onCreateNewScene}
            onRenameScene={onRenameScene}
            onDeleteScene={onDeleteScene}
            onDeleteAllScenes={onDeleteAllScenes}
            onMoveSceneOrder={onMoveSceneOrder}
            onReorderScenes={onReorderScenes}
            openMapCreator={openMapCreator}
            onClose={onClose}
            onSaveAdventure={onSaveAdventure}
            onImportCampaign={onImportCampaign}
            onConcludeAdventure={onConcludeAdventure}
            onOpenSaveModal={handleOpenSaveModal}
            onOpenConcludeModal={handleOpenConcludeModal}
            notify={notify}
          />
        )}

        {activeTab === 'notas' && (
          <SceneNotesTab
            scenes={scenes}
            activeSceneId={activeSceneId}
            selectedNoteSceneId={selectedNoteSceneId}
            setSelectedNoteSceneId={setSelectedNoteSceneId}
            sceneNotes={sceneNotes}
            onUpdateSceneNotes={onUpdateSceneNotes}
            campaignNotes={campaignNotes}
            onUpdateCampaignNotes={onUpdateCampaignNotes}
          />
        )}

        {activeTab === 'items' && (
          <ItemsCatalogTab
            commonItems={commonItems}
            tokens={tokens}
            characters={characters}
            activeTurnTokenId={activeTurnTokenId}
            onGiveItemToCharacter={onGiveItemToCharacter}
            onSaveCommonItem={onSaveCommonItem}
            onDeleteCommonItem={onDeleteCommonItem}
            onPlaceGroundItem={onPlaceGroundItem}
            onTransferItem={onTransferItem}
            onClose={onClose}
            notify={notify}
          />
        )}

        {activeTab === 'estados' && (
          <StatusesTab
            customStatuses={customStatuses}
            onAddCustomStatus={onAddCustomStatus}
            onRemoveCustomStatus={onRemoveCustomStatus}
            notify={notify}
          />
        )}
      </div>

      <AdventureActionModals
        isSaveOpen={isSaveAdventureModalOpen}
        onCloseSave={() => setIsSaveAdventureModalOpen(false)}
        adventureNameInput={adventureNameInput}
        setAdventureNameInput={setAdventureNameInput}
        exportJsonFile={exportJsonFile}
        setExportJsonFile={setExportJsonFile}
        isSavingAdventure={isSavingAdventure}
        onConfirmSave={handleConfirmSaveAdventure}
        isConcludeOpen={isConcludeModalOpen}
        onCloseConclude={() => setIsConcludeModalOpen(false)}
        concludeNameInput={concludeNameInput}
        setConcludeNameInput={setConcludeNameInput}
        concludeExportJson={concludeExportJson}
        setConcludeExportJson={setConcludeExportJson}
        isConcluding={isConcluding}
        onConfirmConclude={handleConfirmConcludeAdventure}
        scenesCount={scenes.length}
        charactersCount={characters.length}
        tokensCount={tokens.length}
      />
    </div>
  );
};

export default SettingsDrawer;
