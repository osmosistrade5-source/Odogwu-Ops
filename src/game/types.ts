/**
 * Types and configurations for ODOGWU OPS: Lagos Street VR - Sims Tactical
 */

export type GameMode = 'SIMS_HUB' | 'COD_SKIRMISH' | 'DANFO_ESCORT' | 'TARGET_RANGE';
export type CameraViewMode = 'FPS' | 'SIMS_ISO' | 'VR';

export interface WeaponDef {
  id: string;
  name: string;
  category: 'AR' | 'SMG' | 'SNIPER' | 'MELEE' | 'TACTICAL';
  damage: number;
  fireRate: number; // rounds per second
  magSize: number;
  maxReserve: number;
  reloadTime: number; // seconds
  range: number;
  accuracy: number; // 0 to 1
  recoil: number;
  costNaira: number;
  description: string;
}

export interface PlayerInventory {
  weapons: {
    primary: WeaponDef;
    secondary: WeaponDef;
    melee: WeaponDef;
    tactical: WeaponDef;
  };
  ammo: {
    [weaponId: string]: number; // in magazine
  };
  reserveAmmo: {
    [weaponId: string]: number;
  };
  selectedSlot: 'primary' | 'secondary' | 'melee' | 'tactical';
}

export interface PlayerSimsProfile {
  name: string;
  alias: string;
  title: string;
  naira: number; // ₦ Currency
  streetCred: number; // Level / Respect (0 - 1000)
  jollofEnergy: number; // Hunger / Stamina (0 - 100)
  vibes: number; // Mood / Hype (0 - 100)
  outfit: {
    head: string;
    vest: string;
    pants: string;
    accessory: string;
  };
  unlockedOutfits: string[];
  upgrades: {
    extendedMag: boolean;
    redDotSight: boolean;
    suyaAdrenaline: boolean;
    bulletproofAnkara: boolean;
  };
}

export interface BotAgent {
  id: string;
  name: string;
  team: 'ENEMY' | 'FRIENDLY';
  health: number;
  maxHealth: number;
  position: { x: number; y: number; z: number };
  targetPosition: { x: number; y: number; z: number };
  rotation: number;
  state: 'PATROL' | 'COMBAT' | 'COVER' | 'DEAD';
  currentWeapon: WeaponDef;
  lastShotTime: number;
  speechBubble?: string;
  speechTimer?: number;
}

export interface KillfeedEntry {
  id: string;
  killer: string;
  victim: string;
  weapon: string;
  headshot: boolean;
  timestamp: number;
}

export interface Quest {
  id: string;
  title: string;
  targetCount: number;
  currentCount: number;
  rewardNaira: number;
  rewardCred: number;
  description: string;
  completed: boolean;
}

export interface FoodItem {
  id: string;
  name: string;
  costNaira: number;
  energyBonus: number;
  healthBonus: number;
  vibeBonus: number;
  description: string;
  tagline: string;
}

export interface LagosDistrict {
  id: string;
  name: string;
  subtitle: string;
  center: { x: number; z: number };
  color: string;
  description: string;
}
