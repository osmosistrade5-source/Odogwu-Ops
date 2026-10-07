import React, { useState } from 'react';
import {
  Crosshair,
  RotateCcw,
  Zap,
  Flame,
  Shield,
  Eye,
  Glasses,
  Volume2,
  VolumeX,
  Radio,
  ShoppingBag,
  Sparkles,
  Users,
  MapPin,
  Compass,
} from 'lucide-react';
import { CameraViewMode, KillfeedEntry, PlayerInventory, PlayerSimsProfile } from '../game/types.ts';
import { soundEngine } from '../game/audio.ts';
import { VirtualJoystick } from './VirtualJoystick.tsx';

interface TacticalHUDProps {
  profile: PlayerSimsProfile;
  health: number;
  inventory: PlayerInventory;
  viewMode: CameraViewMode;
  killfeed: KillfeedEntry[];
  hitMarker: { active: boolean; isHeadshot: boolean } | null;
  currentDistrict: string;
  onFire: () => void;
  onAimToggle: () => void;
  isAiming: boolean;
  onReload: () => void;
  isReloading: boolean;
  onSwitchWeapon: (slot: keyof PlayerInventory['weapons']) => void;
  onToggleViewMode: () => void;
  onTriggerVR: () => void;
  onCallDanfoStrike: () => void;
  onCallNepaBlackout: () => void;
  onCallSuyaAdrenaline: () => void;
  onOpenSimsHub: () => void;
  onOpenWardrobe: () => void;
  onOpenQuests: () => void;
  onOpenMultiplayer: () => void;
  onOpenMap: () => void;
  onJoystickMove: (input: { forward: number; right: number }) => void;
  onlinePlayerCount: number;
  radarEnemies: { x: number; z: number }[];
}

export const TacticalHUD: React.FC<TacticalHUDProps> = ({
  profile,
  health,
  inventory,
  viewMode,
  killfeed,
  hitMarker,
  currentDistrict,
  onFire,
  onAimToggle,
  isAiming,
  onReload,
  isReloading,
  onSwitchWeapon,
  onToggleViewMode,
  onTriggerVR,
  onCallDanfoStrike,
  onCallNepaBlackout,
  onCallSuyaAdrenaline,
  onOpenSimsHub,
  onOpenWardrobe,
  onOpenQuests,
  onOpenMultiplayer,
  onOpenMap,
  onJoystickMove,
  onlinePlayerCount,
  radarEnemies,
}) => {
  const currentSlot = inventory.selectedSlot;
  const currentWeapon = inventory.weapons[currentSlot];
  const ammoInMag = inventory.ammo[currentWeapon.id] ?? currentWeapon.magSize;
  const reserveAmmo = inventory.reserveAmmo[currentWeapon.id] ?? currentWeapon.maxReserve;

  const [isMuted, setIsMuted] = useState(false);
  const [isBgmActive, setIsBgmActive] = useState(false);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
  };

  const toggleBgm = () => {
    const active = soundEngine.toggleAfrobeatBgm();
    setIsBgmActive(active);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden font-sans">
      {/* Damage Screen Flash Vignette */}
      {health < 40 && (
        <div
          className="absolute inset-0 border-8 border-red-600/50 pointer-events-none animate-pulse"
          style={{ boxShadow: 'inset 0 0 100px rgba(220, 38, 38, 0.6)' }}
        />
      )}

      {/* TOP BAR: Tactical Radar, District GPS Pill, Multiplayer, Actions */}
      <div className="flex items-start justify-between p-4 pointer-events-auto">
        {/* Left: Mini-Radar & Sims Vitals */}
        <div className="flex items-start gap-3">
          {/* Circular Tactical Radar */}
          <div
            onClick={onOpenMap}
            className="relative w-28 h-28 rounded-full bg-stone-900/85 backdrop-blur-md border-2 border-amber-500/60 shadow-lg overflow-hidden flex items-center justify-center cursor-pointer group"
            title="Click to open Full Lagos State GPS City Map"
          >
            <div className="absolute inset-2 rounded-full border border-amber-500/20" />
            <div className="absolute inset-6 rounded-full border border-amber-500/25" />
            <span className="absolute top-1 text-[10px] font-bold text-amber-400 font-heading">N</span>
            <div className="w-3 h-3 bg-amber-400 rotate-45 transform shadow-sm" />

            {/* Radar Enemy Blips */}
            {radarEnemies.map((e, idx) => {
              const px = Math.max(-42, Math.min(42, (e.x / 120) * 40));
              const py = Math.max(-42, Math.min(42, (e.z / 120) * 40));
              return (
                <div
                  key={idx}
                  className="absolute w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-400/50 animate-ping"
                  style={{
                    transform: `translate(${px}px, ${py}px)`,
                  }}
                />
              );
            })}

            <div
              className="absolute inset-0 rounded-full border-r border-amber-400/60 origin-center animate-spin"
              style={{ animationDuration: '3s' }}
            />

            <span className="absolute bottom-1 text-[8px] font-heading font-black text-amber-300 opacity-80 group-hover:opacity-100 uppercase">
              GPS MAP
            </span>
          </div>

          {/* Sims Vital Status Box */}
          <div className="flex flex-col gap-1.5 bg-stone-900/85 backdrop-blur-md border border-stone-800 rounded-xl p-2.5 min-w-[190px] shadow-lg">
            {/* Health Bar */}
            <div className="flex items-center justify-between text-xs font-heading font-bold text-stone-200">
              <span className="flex items-center gap-1 text-emerald-400">
                <Shield className="w-3.5 h-3.5" /> HP
              </span>
              <span className="tabular-nums">{health} / 100</span>
            </div>
            <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
              <div
                className={`h-full transition-all duration-300 ${health > 50 ? 'bg-emerald-500' : health > 25 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${health}%` }}
              />
            </div>

            {/* Sims Jollof Energy */}
            <div className="flex items-center justify-between text-[11px] text-stone-300">
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <Flame className="w-3 h-3" /> Jollof Energy
              </span>
              <span className="tabular-nums font-bold">{profile.jollofEnergy}%</span>
            </div>
            <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${profile.jollofEnergy}%` }} />
            </div>

            {/* Street Cred & Naira Cash */}
            <div className="flex items-center justify-between pt-1 border-t border-stone-800/80 text-[11px]">
              <span className="text-emerald-400 font-bold font-mono">₦{profile.naira.toLocaleString()}</span>
              <span className="text-amber-300 font-semibold text-[10px]">⭐ Cred: {profile.streetCred}</span>
            </div>
          </div>
        </div>

        {/* Center: Live District GPS Location Banner */}
        <div className="flex flex-col items-center">
          <button
            onClick={onOpenMap}
            className="bg-stone-900/90 backdrop-blur-md border border-amber-500/70 hover:border-amber-400 rounded-xl px-4 py-2 flex items-center gap-2 shadow-xl active:scale-95 transition-all group"
            title="Open City GPS Map"
          >
            <MapPin className="w-4 h-4 text-amber-400 animate-bounce" />
            <div className="text-left">
              <div className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                LAGOS STATE METROPOLIS
              </div>
              <div className="text-xs font-heading font-black text-amber-300 group-hover:text-white uppercase tracking-wider">
                {currentDistrict}
              </div>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-mono font-bold ml-1">
              OPEN GPS
            </span>
          </button>
        </div>

        {/* Right: Multiplayer, Mode Toggles, Killfeed */}
        <div className="flex flex-col items-end gap-2">
          {/* Top Quick Action Bar */}
          <div className="flex items-center gap-2">
            {/* MULTIPLAYER ROSTER & SHARE LINK BUTTON */}
            <button
              onClick={onOpenMultiplayer}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/60 rounded-lg text-xs font-heading font-bold transition-all shadow-md active:scale-95"
              title="Open Multiplayer Roster & Invite Players"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>MULTIPLAYER ({onlinePlayerCount + 1})</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* View Mode Toggle (FPS <-> Sims 3rd Person) */}
            <button
              onClick={onToggleViewMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all shadow-md active:scale-95 ${
                viewMode === 'FPS'
                  ? 'bg-amber-500 text-stone-950 hover:bg-amber-400'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
              title="Toggle First-Person FPS vs Sims 3rd-Person Isometric"
            >
              <Eye className="w-4 h-4" />
              <span>{viewMode === 'FPS' ? 'COD FPS' : 'SIMS 3RD'}</span>
            </button>

            {/* VR Mode Trigger */}
            <button
              onClick={onTriggerVR}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900/85 hover:bg-stone-800 text-amber-400 border border-amber-500/50 rounded-lg text-xs font-heading font-bold transition-all shadow-md active:scale-95"
              title="Enter WebXR Virtual Reality Mode"
            >
              <Glasses className="w-4 h-4" />
              <span>VR MODE</span>
            </button>

            {/* Afrobeat BGM Beat Generator */}
            <button
              onClick={toggleBgm}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                isBgmActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                  : 'bg-stone-900/80 text-stone-400 border-stone-700 hover:text-stone-200'
              }`}
              title="Toggle Procedural Afrobeat Groove"
            >
              <Radio className={`w-3.5 h-3.5 ${isBgmActive ? 'animate-pulse text-amber-400' : ''}`} />
              <span>AFROBEAT</span>
            </button>

            {/* Sound Mute */}
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-stone-900/80 border border-stone-800 text-stone-300 hover:text-white"
              title="Toggle Audio"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>
          </div>

          {/* Sims Hub & Wardrobe Quick Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSimsHub}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900/85 hover:bg-stone-800 text-stone-200 border border-stone-700 rounded-lg text-xs font-semibold shadow-md active:scale-95"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              <span>Mama Put & Hub</span>
            </button>

            <button
              onClick={onOpenWardrobe}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900/85 hover:bg-stone-800 text-stone-200 border border-stone-700 rounded-lg text-xs font-semibold shadow-md active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>Lagos Drip</span>
            </button>

            <button
              onClick={onOpenQuests}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900/85 hover:bg-stone-800 text-stone-200 border border-stone-700 rounded-lg text-xs font-semibold shadow-md active:scale-95"
            >
              <span>Contracts</span>
            </button>
          </div>

          {/* Killfeed */}
          <div className="flex flex-col gap-1 items-end mt-2 max-w-[280px]">
            {killfeed.slice(0, 3).map((k) => (
              <div
                key={k.id}
                className="bg-stone-950/80 backdrop-blur-sm border-l-2 border-amber-500 px-2.5 py-1 rounded text-[11px] text-stone-300 flex items-center gap-1.5 animate-fadeIn"
              >
                <span className="font-bold text-amber-400">{k.killer}</span>
                <span className="text-[10px] text-stone-400">✦ {k.weapon} ➔</span>
                <span className="font-medium text-stone-200">{k.victim}</span>
                {k.headshot && <span className="text-red-400 font-extrabold text-[10px]">💥 HEADSHOT</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER CROSSHAIR & HIT MARKER */}
      {viewMode === 'FPS' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {!isAiming ? (
            <div className="relative w-8 h-8 flex items-center justify-center opacity-85">
              <div className="w-1 h-1 bg-amber-400 rounded-full" />
              <div className="absolute top-0 w-0.5 h-2.5 bg-amber-400/90" />
              <div className="absolute bottom-0 w-0.5 h-2.5 bg-amber-400/90" />
              <div className="absolute left-0 w-2.5 h-0.5 bg-amber-400/90" />
              <div className="absolute right-0 w-2.5 h-0.5 bg-amber-400/90" />
            </div>
          ) : (
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border border-red-500/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-glow" />
            </div>
          )}

          {hitMarker?.active && (
            <div
              className={`absolute text-2xl font-black hitmarker-animate ${
                hitMarker.isHeadshot ? 'text-red-500 scale-125' : 'text-amber-400'
              }`}
            >
              ✕
            </div>
          )}
        </div>
      )}

      {/* SIMS CLICK-TO-MOVE HELPER HINT IN SIMS MODE */}
      {viewMode === 'SIMS_ISO' && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-stone-900/80 backdrop-blur-sm border border-emerald-500/50 px-4 py-1.5 rounded-full text-xs text-emerald-300 font-heading font-bold shadow-lg pointer-events-none">
          ✨ SIMS MODE: Click anywhere on the street to move your character, or use WASD / Joystick!
        </div>
      )}

      {/* BOTTOM-LEFT: VIRTUAL ANALOG MOVEMENT JOYSTICK & SCORESTREAKS */}
      <div className="absolute bottom-4 left-4 flex items-end gap-3 pointer-events-auto">
        <div className="flex flex-col items-center gap-1.5">
          <VirtualJoystick onMove={onJoystickMove} />
          <div className="text-[10px] font-heading font-bold text-amber-400/90 bg-stone-950/80 px-2 py-0.5 rounded border border-stone-800">
            DRAG TO MOVE / WASD
          </div>
        </div>

        {/* Scorestreak Tactical Abilities */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onCallDanfoStrike}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900/90 border border-amber-500/70 hover:bg-amber-500/20 active:scale-95 transition-all text-amber-400 shadow-lg"
            title="Call Danfo Bus Street Ram Strike"
          >
            <span className="text-lg">🚍</span>
            <span className="text-[10px] font-heading font-bold uppercase text-stone-200">Danfo Strike</span>
          </button>

          <button
            onClick={onCallNepaBlackout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900/90 border border-cyan-500/70 hover:bg-cyan-500/20 active:scale-95 transition-all text-cyan-400 shadow-lg"
            title="NEPA Generator Blackout EMP"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-heading font-bold uppercase text-stone-200">NEPA EMP</span>
          </button>

          <button
            onClick={onCallSuyaAdrenaline}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900/90 border border-orange-500/70 hover:bg-orange-500/20 active:scale-95 transition-all text-orange-400 shadow-lg"
            title="Suya Spicy Adrenaline Rush"
          >
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-[10px] font-heading font-bold uppercase text-stone-200">Suya Rush</span>
          </button>
        </div>
      </div>

      {/* BOTTOM-CENTER: QUICK WEAPON SWITCH BAR */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <div className="flex items-center gap-1.5 bg-stone-900/90 backdrop-blur-md border border-stone-800 p-1.5 rounded-xl shadow-xl">
          {(['primary', 'secondary', 'melee', 'tactical'] as const).map((slot) => {
            const w = inventory.weapons[slot];
            const isSelected = currentSlot === slot;
            return (
              <button
                key={slot}
                onClick={() => onSwitchWeapon(slot)}
                className={`flex flex-col items-center px-3 py-1.5 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                    : 'bg-stone-950/60 text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <span className="text-[10px] font-mono uppercase tracking-wider">{slot}</span>
                <span className="text-xs font-heading truncate max-w-[85px]">{w.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BOTTOM-RIGHT: FIRE, ADS, RELOAD & AMMO COUNTER */}
      <div className="absolute bottom-4 right-4 flex items-end gap-3 pointer-events-auto">
        <div className="flex flex-col items-end bg-stone-900/90 backdrop-blur-md border border-stone-800 rounded-xl px-3 py-2 shadow-lg">
          <div className="text-xs font-heading font-bold text-amber-400 truncate max-w-[130px]">
            {currentWeapon.name}
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-black font-heading tabular-nums text-white">{ammoInMag}</span>
            <span className="text-xs font-mono text-stone-400 tabular-nums">/ {reserveAmmo}</span>
          </div>
          <button
            onClick={onReload}
            disabled={isReloading}
            className="mt-1 flex items-center gap-1 text-[11px] font-bold text-stone-300 hover:text-amber-400 active:scale-95 transition-all"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isReloading ? 'RELOADING...' : 'RELOAD (R)'}</span>
          </button>
        </div>

        <button
          onClick={onAimToggle}
          className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 transition-all shadow-xl active:scale-90 ${
            isAiming
              ? 'bg-red-500/80 border-red-400 text-white'
              : 'bg-stone-900/90 border-amber-500/60 text-amber-400 hover:bg-stone-800'
          }`}
          title="Aim Down Sights (Right-Click or Tap)"
        >
          <Crosshair className="w-6 h-6" />
          <span className="text-[9px] font-heading font-bold">ADS</span>
        </button>

        <button
          onClick={onFire}
          className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 border-4 border-stone-950 flex flex-col items-center justify-center text-stone-950 font-black shadow-2xl active:scale-90 active:brightness-125 transition-transform"
          title="Fire Weapon (Left-Click or Tap)"
        >
          <Flame className="w-7 h-7" />
          <span className="text-[11px] font-heading uppercase tracking-wider font-extrabold">FIRE</span>
        </button>
      </div>
    </div>
  );
};
