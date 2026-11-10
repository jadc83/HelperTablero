import { useState, useRef, useEffect } from 'react';
import { X, Save, Pencil, Upload, Download } from 'lucide-react';
import { exportJSON, importJSON } from '../utils/fileDialog';
import { getClassificationMeta } from '../constants/gamePresets';
import CharacterHeaderForm from './character-sheet/CharacterHeaderForm';

const DEFAULT_SPELLS = [
  { id: 'sp1', name: 'Luz Arcana', cost: '2 MP', desc: 'Crea una esfera de luz flotante que ilumina las tinieblas.' },
  { id: 'sp2', name: 'Curación Menor', cost: '4 MP', desc: 'Cierra heridas superficiales y restaura vitalidad.' }
];
import StatsTab from './character-sheet/StatsTab';
import CreatureAttacksTab from './character-sheet/CreatureAttacksTab';
import InventorySlotsTab from './character-sheet/InventorySlotsTab';
import GrimoireTab from './character-sheet/GrimoireTab';
import LoreNotesTab from './character-sheet/LoreNotesTab';

/**
 * Ficha modal unificada para personajes investigadores y criaturas/bestiario.
 * Divide su contenido en cabecera dossier/editable, vitalidad, inventario/ataques,
 * grimorio y biografía/notas.
 */
const CharacterSheetModal = ({
  mode = 'create',
  initialData = null,
  initialTab = 'stats',
  initialEntityType = 'human',
  onSave,
  onUpdate,
  onClose,
  tokens = [],
  characters = [],
  onDropItemToFloor,
  onTransferItem
}) => {
  const resolvedInitialType = initialData?.entityType || initialEntityType || (initialData?.faction === 'enemy' ? 'mythos_creature' : 'human');
  const initialIsMonster = getClassificationMeta(resolvedInitialType).group === 'monster';

  const [entityType, setEntityType] = useState(resolvedInitialType);
  const isMonster = getClassificationMeta(entityType).group === 'monster';

  const [isEditingHeader, setIsEditingHeader] = useState(mode === 'create');
  const [firstName, setFirstName] = useState(() => {
    if (initialData?.firstName !== undefined) return initialData.firstName;
    if (!initialData?.name) return '';
    return initialIsMonster ? initialData.name : (initialData.name.split(' ')[0] || '');
  });
  const [lastName, setLastName] = useState(() => {
    if (initialData?.lastName !== undefined) return initialData.lastName;
    if (!initialData?.name || initialIsMonster) return '';
    return initialData.name.split(' ').slice(1).join(' ') || '';
  });

  const [birthYear, setBirthYear] = useState(initialData?.birthYear ? String(initialData.birthYear) : '');
  const [profession, setProfession] = useState(initialData?.profession || '');
  const [education, setEducation] = useState(initialData?.education || '');
  const [birthplace, setBirthplace] = useState(initialData?.birthplace || '');
  const [residence, setResidence] = useState(initialData?.residence || '');

  // Campos exclusivos de criatura / bestiario
  const [sanityLoss, setSanityLoss] = useState(initialData?.sanityLoss || '1/1D6');
  const [habitat, setHabitat] = useState(initialData?.habitat || '');
  const [creatureNature, setCreatureNature] = useState(initialData?.creatureNature || '');
  const [creatureSize, setCreatureSize] = useState(initialData?.creatureSize || 'Medio');
  const [attacks, setAttacks] = useState(initialData?.attacks || []);
  const [newAttackName, setNewAttackName] = useState('');
  const [newAttackDamage, setNewAttackDamage] = useState('1D6');
  const [newAttackRange, setNewAttackRange] = useState('Cuerpo a cuerpo');
  const [newAttackDesc, setNewAttackDesc] = useState('');

  const [color, setColor] = useState(initialData?.color || (initialIsMonster ? '#ef4444' : '#3b82f6'));
  const [faction, setFaction] = useState(initialData?.faction || (initialIsMonster ? 'enemy' : 'player'));
  const [avatar, setAvatar] = useState(initialData?.avatar || '');

  // Vitalidad, Magia y Cordura
  const [hp, setHp] = useState(initialData?.hp ?? 20);
  const [maxHp, setMaxHp] = useState(initialData?.maxHp ?? 20);
  const [mp, setMp] = useState(initialData?.mp ?? 10);
  const [maxMp, setMaxMp] = useState(initialData?.maxMp ?? 10);
  const [san, setSan] = useState(initialData?.san ?? 60);
  const [maxSan, setMaxSan] = useState(initialData?.maxSan ?? 60);

  // Armadura y Herida Grave
  const [hasArmor, setHasArmor] = useState(initialData?.hasArmor ?? Boolean(initialData?.armorType && initialData?.armorType !== 'Ninguna'));
  const [armorType, setArmorType] = useState(initialData?.armorType || 'Cuero tachonado');
  const [isGraveWound, setIsGraveWound] = useState(Boolean(initialData?.isGraveWound));
  const [speed, setSpeed] = useState(initialData?.speed ?? 6);

  // Historia Personal y Notas
  const [history, setHistory] = useState(initialData?.history || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Inventario
  const [inventory, setInventory] = useState(() => {
    if (Array.isArray(initialData?.inventory)) return initialData.inventory;
    return mode === 'create' ? [
      { id: 1, name: 'Cuchillo de caza', state: 'equipped', notes: 'En el cinto' },
      { id: 2, name: 'Linterna de aceite', state: 'equipped', notes: 'Encendida' },
      { id: 3, name: 'Mochila de viaje', state: 'equipped', extraSlots: 10, notes: 'Mochila reforzada (+10 huecos)' },
      { id: 4, name: 'Raciones secas', state: 'stored', notes: 'En el campamento' }
    ] : [];
  });
  const [newItemName, setNewItemName] = useState('');

  // Grimorio
  const [spells, setSpells] = useState(initialData?.spells || DEFAULT_SPELLS);
  const [newSpellName, setNewSpellName] = useState('');
  const [newSpellCost, setNewSpellCost] = useState('2 MP');
  const [newSpellDesc, setNewSpellDesc] = useState('');

  const [activeTab, setActiveTab] = useState(initialTab || 'stats');
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  const [prevInitialInventory, setPrevInitialInventory] = useState(initialData?.inventory);
  const [importNotice, setImportNotice] = useState(null);

  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    if (initialTab) setActiveTab(initialTab);
  }

  if (initialData?.inventory !== prevInitialInventory) {
    setPrevInitialInventory(initialData?.inventory);
    if (Array.isArray(initialData?.inventory)) {
      setInventory(initialData.inventory);
    }
  }

  // Sub-estados elevados para coordinar Escape jerárquico
  const [movingItemId, setMovingItemId] = useState(null);
  const [showCommonDropdown, setShowCommonDropdown] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);

  const avatarInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (contextMenu) {
        setContextMenu(null);
      } else if (showCommonDropdown) {
        setShowCommonDropdown(false);
      } else if (movingItemId !== null) {
        setMovingItemId(null);
      } else {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contextMenu, showCommonDropdown, movingItemId, onClose]);

  const fullName = isMonster ? firstName.trim() : `${firstName.trim()} ${lastName.trim()}`.trim();

  const showNotice = (text, isError = false) => {
    setImportNotice({ text, isError });
    setTimeout(() => setImportNotice(null), 3200);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const minSide = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - minSide) / 2, (img.height - minSide) / 2, minSide, minSide, 0, 0, 256, 256);
        setAvatar(canvas.toDataURL('image/webp', 0.85));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const buildCharacterObject = () => ({
    id: initialData?.id || Date.now(),
    firstName: firstName.trim(),
    lastName: isMonster ? '' : lastName.trim(),
    name: isMonster ? (firstName.trim() || 'Criatura sin nombre') : (fullName || 'Sin Nombre'),
    birthYear: isMonster ? '' : birthYear.trim(),
    profession: isMonster ? '' : profession.trim(),
    education: isMonster ? '' : education.trim(),
    birthplace: isMonster ? '' : birthplace.trim(),
    residence: isMonster ? '' : residence.trim(),
    sanityLoss: isMonster ? sanityLoss.trim() : (initialData?.sanityLoss || ''),
    habitat: isMonster ? habitat.trim() : (initialData?.habitat || ''),
    creatureNature: isMonster ? creatureNature.trim() : (initialData?.creatureNature || ''),
    creatureSize: isMonster ? creatureSize : (initialData?.creatureSize || 'Medio'),
    attacks: isMonster ? attacks : (initialData?.attacks || []),
    color,
    faction,
    entityType,
    avatar: avatar || null,
    hp: Math.max(0, Math.min(Number(hp) || 0, Number(maxHp) || 1)),
    maxHp: Math.max(1, Number(maxHp) || 1),
    mp: Math.max(0, Math.min(Number(mp) || 0, Number(maxMp) || 0)),
    maxMp: Math.max(0, Number(maxMp) || 0),
    san: isMonster ? 0 : Math.max(0, Math.min(Number(san) || 0, Number(maxSan) || 0)),
    maxSan: isMonster ? 0 : Math.max(0, Number(maxSan) || 0),
    hasArmor: Boolean(hasArmor),
    armorType: hasArmor ? (armorType.trim() || (isMonster ? 'Piel blindada' : 'Armadura Ligera')) : 'Ninguna',
    isGraveWound: Boolean(isGraveWound),
    speed: Math.max(1, Number(speed) || 6),
    history,
    notes,
    inventory,
    spells
  });

  const applyCharacterData = (data) => {
    if (!data) return;

    if (data.firstName !== undefined) setFirstName(data.firstName);
    else if (data.name) setFirstName(data.name.split(' ')[0] || '');

    if (data.lastName !== undefined) setLastName(data.lastName);
    else if (data.name && !isMonster) setLastName(data.name.split(' ').slice(1).join(' ') || '');

    if (data.birthYear !== undefined) setBirthYear(String(data.birthYear));
    if (data.profession !== undefined) setProfession(data.profession || '');
    if (data.education !== undefined) setEducation(data.education || '');
    if (data.birthplace !== undefined) setBirthplace(data.birthplace || '');
    if (data.residence !== undefined) setResidence(data.residence || '');
    if (data.sanityLoss !== undefined) setSanityLoss(data.sanityLoss);
    if (data.habitat !== undefined) setHabitat(data.habitat);
    if (data.creatureNature !== undefined) setCreatureNature(data.creatureNature);
    if (data.creatureSize !== undefined) setCreatureSize(data.creatureSize);
    if (Array.isArray(data.attacks)) setAttacks(data.attacks);
    if (data.color) setColor(data.color);
    if (data.faction) setFaction(data.faction);
    if (data.entityType) setEntityType(data.entityType);
    if (data.avatar !== undefined) setAvatar(data.avatar || '');

    if (data.hp !== undefined) setHp(Number(data.hp));
    if (data.maxHp !== undefined) setMaxHp(Number(data.maxHp));
    if (data.mp !== undefined) setMp(Number(data.mp));
    if (data.maxMp !== undefined) setMaxMp(Number(data.maxMp));
    if (data.san !== undefined) setSan(Number(data.san));
    if (data.maxSan !== undefined) setMaxSan(Number(data.maxSan));

    if (data.hasArmor !== undefined) setHasArmor(Boolean(data.hasArmor));
    if (data.armorType !== undefined) setArmorType(data.armorType);
    if (data.isGraveWound !== undefined) setIsGraveWound(Boolean(data.isGraveWound));
    if (data.speed !== undefined) setSpeed(Number(data.speed) || 6);

    if (data.history !== undefined) setHistory(data.history);
    if (data.notes !== undefined) setNotes(data.notes);
    if (Array.isArray(data.inventory)) setInventory(data.inventory);
    if (Array.isArray(data.spells)) setSpells(data.spells);

    showNotice(isMonster ? 'Datos de la criatura importados.' : 'Datos de personaje importados en el formulario.');
  };

  const handleExportSingleCharacter = async () => {
    try {
      const charObj = buildCharacterObject();
      const safeFile = (charObj.name || (isMonster ? 'criatura' : 'personaje')).toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      await exportJSON(isMonster ? `criatura_${safeFile}.json` : `ficha_${safeFile}.json`, charObj);
    } catch {
      showNotice('No se pudo exportar el archivo JSON.', true);
    }
  };

  const handleImportSingleCharacter = async () => {
    try {
      const res = await importJSON({ accept: '.json', description: isMonster ? 'Criatura VTT (*.json)' : 'Ficha de Personaje (*.json)' });
      if (res?.success && res.text) {
        const raw = JSON.parse(res.text);
        const data = Array.isArray(raw) ? raw[0] : raw;
        applyCharacterData(data);
      }
    } catch {
      showNotice('El archivo seleccionado no es un JSON válido de ficha.', true);
    }
  };

  const handleToggleEditHeader = () => {
    if (isEditingHeader) {
      if (isMonster && !firstName.trim()) {
        setFirstName(initialData?.firstName || initialData?.name || 'Criatura');
      } else if (!isMonster && !firstName.trim() && !lastName.trim()) {
        setFirstName(initialData?.firstName || initialData?.name || 'Personaje');
      }
      const charObj = buildCharacterObject();
      if (onUpdate) onUpdate(charObj);
      showNotice(isMonster ? 'Datos de la criatura guardados.' : 'Datos de identidad guardados correctamente.');
      setIsEditingHeader(false);
    } else {
      setIsEditingHeader(true);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (isMonster ? !firstName.trim() : (!firstName.trim() && !lastName.trim())) return;
    onSave(buildCharacterObject());
  };

  const hpPct = Math.max(0, Math.min(100, Math.round((hp / Math.max(1, maxHp)) * 100)));
  const mpPct = Math.max(0, Math.min(100, Math.round((mp / Math.max(1, maxMp)) * 100)));
  const sanPct = Math.max(0, Math.min(100, Math.round((san / Math.max(1, maxSan)) * 100)));

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(8, 10, 15, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}
    >
      <div
        className="vtt-wood-panel"
        style={{
          width: '920px',
          maxWidth: '96vw',
          height: '88vh',
          borderRadius: '16px',
          border: '1.5px solid #4a3820',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 70px rgba(0,0,0,0.95)',
          backgroundColor: '#121620',
          backgroundImage: `
            linear-gradient(180deg, rgba(16, 20, 29, 0.68) 0%, rgba(10, 13, 19, 0.80) 100%),
            url("/assets/textures/parchment_dossier_texture.jpg")
          `,
          backgroundSize: '100% 100%, cover',
          backgroundRepeat: 'no-repeat, no-repeat'
        }}
      >
        {/* Cabecera superior */}
        <div style={{
          padding: '14px 20px',
          backgroundImage: 'linear-gradient(180deg, rgba(27, 32, 43, 0.72) 0%, rgba(19, 23, 32, 0.92) 100%), url("/assets/textures/grimoire_leather_header.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderBottom: '1px solid #3d3222',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div className="vtt-gothic-title" style={{ fontSize: '18px', color: isMonster ? '#fca5a5' : '#f8fafc', fontWeight: 800 }}>
            {mode === 'create'
              ? (isMonster ? 'Registrar Nueva Criatura o Entidad' : 'Nuevo Personaje')
              : (fullName || (isMonster ? 'Ficha de Criatura' : 'Ficha de Personaje'))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleToggleEditHeader}
              className="vtt-brass-btn"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isEditingHeader
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.4) 100%)'
                  : 'rgba(30, 41, 59, 0.6)',
                borderColor: isEditingHeader ? '#f59e0b' : '#3b4356',
                color: isEditingHeader ? '#fbbf24' : '#cbd5e1',
                boxShadow: isEditingHeader ? '0 0 10px rgba(245, 158, 11, 0.45)' : 'none',
                transition: 'all 0.15s ease'
              }}
              title={isEditingHeader ? 'Cerrar modo edición (autoguardar cambios)' : 'Activar modo edición'}
            >
              {isEditingHeader ? <Save size={14} strokeWidth={2.2} /> : <Pencil size={14} strokeWidth={2.2} />}
            </button>
            <button
              type="button"
              onClick={handleImportSingleCharacter}
              className="vtt-brass-btn"
              style={{ padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              title={isMonster ? 'Cargar datos desde un archivo JSON de criatura' : 'Cargar datos desde un archivo JSON de personaje'}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Upload size={13} strokeWidth={2.2} /> {isMonster ? 'Importar Criatura' : 'Importar Ficha'}
              </span>
            </button>
            <button
              type="button"
              onClick={handleExportSingleCharacter}
              className="vtt-brass-btn"
              style={{ padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              title={isMonster ? 'Descargar esta criatura en un archivo JSON' : 'Descargar este personaje en un archivo JSON'}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Download size={13} strokeWidth={2.2} /> {isMonster ? 'Exportar Criatura' : 'Exportar Ficha'}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                marginLeft: '6px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Cerrar ficha (Escape)"
            >
              <X size={16} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        <CharacterHeaderForm
          isEditingHeader={isEditingHeader}
          isMonster={isMonster}
          avatar={avatar}
          setAvatar={setAvatar}
          avatarInputRef={avatarInputRef}
          handleAvatarUpload={handleAvatarUpload}
          color={color}
          setColor={setColor}
          isGraveWound={isGraveWound}
          firstName={firstName}
          setFirstName={setFirstName}
          lastName={lastName}
          setLastName={setLastName}
          fullName={fullName}
          birthYear={birthYear}
          setBirthYear={setBirthYear}
          profession={profession}
          setProfession={setProfession}
          education={education}
          setEducation={setEducation}
          birthplace={birthplace}
          setBirthplace={setBirthplace}
          residence={residence}
          setResidence={setResidence}
          entityType={entityType}
          setEntityType={setEntityType}
          faction={faction}
          setFaction={setFaction}
          sanityLoss={sanityLoss}
          setSanityLoss={setSanityLoss}
          habitat={habitat}
          setHabitat={setHabitat}
          creatureNature={creatureNature}
          setCreatureNature={setCreatureNature}
          creatureSize={creatureSize}
          setCreatureSize={setCreatureSize}
          armorType={armorType}
          setArmorType={setArmorType}
          setHasArmor={setHasArmor}
        />

        {/* Navegación por Pestañas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#0e1017', borderBottom: '1px solid #262b3a' }}>
          {[
            { id: 'stats', label: isMonster ? 'Atributos y Combate' : 'Vitalidad, Cordura y Armadura' },
            { id: 'inventory', label: isMonster ? `Ataques y Habilidades (${attacks.length})` : `Inventario (${inventory.length})` },
            { id: 'grimoire', label: isMonster ? `Poderes y Conjuros (${spells.length})` : `Grimorio (${spells.length})` },
            { id: 'lore', label: isMonster ? 'Fisiología y Tácticas' : 'Historia Personal y Notas' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 10px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === tab.id ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.18) 0%, rgba(245, 158, 11, 0.04) 100%)' : 'transparent',
                color: activeTab === tab.id ? '#fbbf24' : '#94a3b8',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #f59e0b' : '2px solid transparent',
                transition: 'all 0.15s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido Principal */}
        <div style={{ flex: 1, padding: '22px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {importNotice && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: importNotice.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: importNotice.isError ? '1px solid #ef4444' : '1px solid #10b981',
              borderRadius: '8px',
              color: importNotice.isError ? '#fca5a5' : '#6ee7b7',
              fontSize: '12px',
              fontWeight: 600,
              textAlign: 'center'
            }}>
              {importNotice.text}
            </div>
          )}

          {activeTab === 'stats' && (
            <StatsTab
              isMonster={isMonster}
              hp={hp} setHp={setHp} maxHp={maxHp} setMaxHp={setMaxHp} hpPct={hpPct}
              mp={mp} setMp={setMp} maxMp={maxMp} setMaxMp={setMaxMp} mpPct={mpPct}
              san={san} setSan={setSan} maxSan={maxSan} setMaxSan={setMaxSan} sanPct={sanPct}
              sanityLoss={sanityLoss} setSanityLoss={setSanityLoss}
              hasArmor={hasArmor} setHasArmor={setHasArmor} armorType={armorType} setArmorType={setArmorType}
              isGraveWound={isGraveWound} setIsGraveWound={setIsGraveWound}
              speed={speed} setSpeed={setSpeed}
            />
          )}

          {activeTab === 'inventory' && (isMonster ? (
            <CreatureAttacksTab
              attacks={attacks}
              setAttacks={setAttacks}
              newAttackName={newAttackName}
              setNewAttackName={setNewAttackName}
              newAttackDamage={newAttackDamage}
              setNewAttackDamage={setNewAttackDamage}
              newAttackRange={newAttackRange}
              setNewAttackRange={setNewAttackRange}
              newAttackDesc={newAttackDesc}
              setNewAttackDesc={setNewAttackDesc}
            />
          ) : (
            <InventorySlotsTab
              inventory={inventory}
              setInventory={setInventory}
              newItemName={newItemName}
              setNewItemName={setNewItemName}
              currentCharId={initialData?.id}
              currentCharName={initialData?.name || fullName}
              tokens={tokens}
              characters={characters}
              onDropItemToFloor={onDropItemToFloor}
              onTransferItem={onTransferItem}
              contextMenu={contextMenu}
              setContextMenu={setContextMenu}
              showCommonDropdown={showCommonDropdown}
              setShowCommonDropdown={setShowCommonDropdown}
              movingItemId={movingItemId}
              setMovingItemId={setMovingItemId}
            />
          ))}

          {activeTab === 'grimoire' && (
            <GrimoireTab
              isMonster={isMonster}
              spells={spells}
              setSpells={setSpells}
              newSpellName={newSpellName}
              setNewSpellName={setNewSpellName}
              newSpellCost={newSpellCost}
              setNewSpellCost={setNewSpellCost}
              newSpellDesc={newSpellDesc}
              setNewSpellDesc={setNewSpellDesc}
            />
          )}

          {activeTab === 'lore' && (
            <LoreNotesTab
              isMonster={isMonster}
              history={history}
              setHistory={setHistory}
              notes={notes}
              setNotes={setNotes}
            />
          )}
        </div>

        {/* Pie del Modal */}
        <div style={{
          padding: '14px 24px',
          background: '#12151e',
          borderTop: '1px solid #2e3446',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            {hasArmor ? `Armadura: ${armorType}` : (isMonster ? 'Sin armadura natural' : 'Sin armadura')} • {isGraveWound ? 'CON HERIDA GRAVE' : 'Estado estable'} • Movimiento: {speed} casillas ({speed * 5} ft)
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="vtt-brass-btn" style={{ padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isMonster ? !firstName.trim() : (!firstName.trim() && !lastName.trim())}
              className="vtt-primary-cta"
              style={{
                padding: '9px 24px',
                borderRadius: '8px',
                cursor: (isMonster ? firstName.trim() : (firstName.trim() || lastName.trim())) ? 'pointer' : 'not-allowed',
                fontSize: '13px',
                background: isMonster ? 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)' : undefined,
                borderColor: isMonster ? '#ef4444' : undefined
              }}
            >
              {mode === 'create'
                ? (isMonster ? 'Registrar Criatura' : 'Crear y Guardar Personaje')
                : (isMonster ? 'Guardar Cambios de la Criatura' : 'Guardar Cambios del Personaje')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheetModal;
