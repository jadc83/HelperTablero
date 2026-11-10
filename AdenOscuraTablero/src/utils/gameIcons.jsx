import React from 'react';
import {
  GiBackpack,
  GiLantern,
  GiLaudanumBottle,
  GiRations,
  GiBowieKnife,
  GiRevolver,
  GiMedkit,
  GiLighter,
  GiMatchstick,
  GiRopeCoil,
  GiBook,
  GiCompass,
  GiMagnifier,
  GiCanteen,
  GiLockpicks,
  GiRelic,
  GiChest
} from '../components/icons/GameIcons';

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

  return <GiChest size={size} color="#eab308" />;
};

export const getItemIcon = (item, size = 26) => {
  if (React.isValidElement(item)) return item;
  if (React.isValidElement(item?.icon)) return item.icon;
  if (item?.icon && typeof item.icon === 'string' && item.icon.startsWith('data:image')) {
    return <img src={item.icon} alt={item.name || ''} style={{ width: size, height: size, objectFit: 'contain' }} />;
  }
  return getGameIconComponent(item, size);
};
