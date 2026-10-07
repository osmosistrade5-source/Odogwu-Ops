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
  radarCivilians?: { x: number; z: number }[];
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
  radarCivilians = [],
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
      {health < 35 && (
        <div
          className="absolute inset-0 border-[6px] border-red-900/60 pointer-events-none animate-pulse"
          style={{ boxShadow: 'inset 0 0 120px rgba(153, 27, 27, 0.7)' }}
        />
      )}

      {/* TOP TACTICAL COMPASS STRIP (Modern Warfare style) */}
      <div className="absolute top-2 inset-x-0 flex justify-center pointer-events-none z-10">
        <div className="bg-stone-950/80 backdrop-blur-md border border-white/10 px-6 py-1 rounded-full flex items-center gap-6 text-[10px] font-mono tracking-widest text-stone-400">
          <span>045° NE</span>
          <span className="text-amber-400 font-bold">▲ 090° E</span>
          <span>135° SE</span>
          <span className="text-stone-300 font-bold">180° S</span>
          <span>225° SW</span>
        </div>
      </div>

      {/* TOP BAR: Tactical Radar, District GPS Pill, Multiplayer, Actions */}
      <div className="flex items-start justify-between p-4 pt-8 pointer-events-auto">
        {/* Left: Mini-Radar & Sims Vitals */}
        <div className="flex items-start gap-3">
          {/* Tactical Mini-Radar */}
          <div
            onClick={onOpenMap}
            className="relative w-28 h-28 rounded-xl bg-stone-950/85 backdrop-blur-md border border-white/15 shadow-2xl overflow-hidden flex items-center justify-center cursor-pointer group"
            title="Click to open Full Lagos State GPS City Map"
          >
            <div className="absolute inset-2 rounded-full border border-white/10" />
            <div className="absolute inset-6 rounded-full border border-white/15" />
            <span className="absolute top-1 text-[9px] font-mono font-bold text-amber-400">N</span>
            <div className="w-2.5 h-2.5 bg-amber-400 rotate-45 transform shadow-sm" />

            {/* Radar Civilian Blips (Green dots) */}
            {radarCivilians.map((c, idx) => {
              const px = Math.max(-42, Math.min(42, (c.x / 120) * 40));
              const py = Math.max(-42, Math.min(42, (c.z / 120) * 40));
              return (
                <div
                  key={`civ-${idx}`}
                  className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-80"
                  style={{ transform: `translate(${px}px, ${py}px)` }}
                />
              );
            })}

            {/* Radar Hostile Blips (Red dots) */}
            {radarEnemies.map((e, idx) => {
              const px = Math.max(-42, Math.min(42, (e.x / 120) * 40));
              const py = Math.max(-42, Math.min(42, (e.z / 120) * 40));
              return (
                <div
                  key={`enemy-${idx}`}
                  className="absolute w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-400/50"
                  style={{ transform: `translate(${px}px, ${py}px)` }}
                />
              );
            })}

            <div
              className="absolute inset-0 rounded-full border-r border-amber-400/50 origin-center animate-spin"
              style={{ animationDuration: '3.5s' }}
            />

            <span className="absolute bottom-1 text-[8px] font-mono font-bold text-stone-400 group-hover:text-amber-300 uppercase">
              GPS MAP
            </span>
          </div>

          {/* Photorealistic Tactical Operative Avatar Badge */}
          <div
            onClick={onOpenWardrobe}
            className="relative w-14 h-28 rounded-xl bg-stone-950/90 backdrop-blur-md border-2 border-amber-500/70 shadow-2xl overflow-hidden flex flex-col justify-end cursor-pointer group hover:border-amber-400 active:scale-95 transition-all flex-shrink-0"
            title="Click to customize Tactical Operative Gear & Drip"
          >
            <img
              src="/src/assets/images/realistic_nigerian_operative_1791372075310.jpg"
              alt="Realistic Nigerian Tactical Operative Avatar"
              className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent" />
            <div className="relative p-1 text-center">
              <span className="text-[8px] font-mono font-bold text-amber-300 block uppercase tracking-wider">
                DRIP
              </span>
            </div>
          </div>

          {/* Sims Vital Status Box */}
          <div className="flex flex-col gap-1.5 bg-stone-950/85 backdrop-blur-md border border-white/10 rounded-xl p-2.5 min-w-[190px] shadow-2xl">
            {/* Health Bar */}
            <div className="flex items-center justify-between text-xs font-mono font-bold text-stone-200">
              <span className="flex items-center gap-1 text-emerald-400">
                <Shield className="w-3.5 h-3.5" /> HP
              </span>
              <span className="tabular-nums">{health} / 100</span>
            </div>
            <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full transition-all duration-300 ${health > 50 ? 'bg-emerald-500' : health > 25 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${health}%` }}
              />
            </div>

            {/* Jollof Stamina */}
            <div className="flex items-center justify-between text-[11px] text-stone-300">
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <Flame className="w-3 h-3" /> Stamina
              </span>
              <span className="tabular-nums font-bold font-mono">{profile.jollofEnergy}%</span>
            </div>
            <div className="w-full h-1 bg-stone-900 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${profile.jollofEnergy}%` }} />
            </div>

            {/* Street Cred & Naira Cash */}
            <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
              <span className="text-emerald-400 font-bold font-mono">₦{profile.naira.toLocaleString()}</span>
              <span className="text-stone-300 font-semibold text-[10px] font-mono">CRED: {profile.streetCred}</span>
            </div>
          </div>
        </div>

        {/* Center: Live District GPS Location Banner */}
        <div className="flex flex-col items-center">
          <button
            onClick={onOpenMap}
            className="bg-stone-950/90 backdrop-blur-md border border-white/15 hover:border-amber-500/80 rounded-xl px-4 py-2 flex items-center gap-2.5 shadow-2xl active:scale-95 transition-all group"
            title="Open City GPS Map"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono text-stone-500 uppercase tracking-widest">
                  LAGOS METROPOLIS
                </span>
                <span className="text-[8px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.2 rounded">
                  ● {radarCivilians.length > 0 ? radarCivilians.length : 35} LAGOSIANS
                </span>
              </div>
              <div className="text-xs font-heading font-black text-stone-200 group-hover:text-amber-300 uppercase tracking-wide">
                {currentDistrict}
              </div>
            </div>
            <span className="text-[9px] bg-white/5 text-stone-400 border border-white/10 px-1.5 py-0.5 rounded font-mono font-bold ml-1">
              GPS
            </span>
          </button>
        </div>

        {/* Right: Multiplayer, Mode Toggles, Audio, Killfeed */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {/* MULTIPLAYER ROSTER BUTTON */}
            <button
              onClick={onOpenMultiplayer}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-950/90 hover:bg-stone-900 text-stone-200 border border-emerald-500/50 rounded-lg text-xs font-mono font-bold transition-all shadow-md active:scale-95"
              title="Open Multiplayer Roster & Invite Players"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>SQUAD ({onlinePlayerCount + 1})</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* View Mode Toggle */}
            <button
              onClick={onToggleViewMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shadow-md active:scale-95 border ${
                viewMode === 'FPS'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
              }`}
              title="Toggle First-Person FPS vs Sims 3rd-Person Isometric"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{viewMode === 'FPS' ? 'FPS CAM' : 'SIMS CAM'}</span>
            </button>

            {/* VR Mode Trigger */}
            <button
              onClick={onTriggerVR}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-950/90 hover:bg-stone-900 text-stone-300 border border-white/15 rounded-lg text-xs font-mono font-bold transition-all shadow-md active:scale-95"
              title="Enter WebXR Virtual Reality Mode"
            >
              <Glasses className="w-3.5 h-3.5 text-amber-400" />
              <span>VR</span>
            </button>

            {/* Afrobeat BGM */}
            <button
              onClick={toggleBgm}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all border ${
                isBgmActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                  : 'bg-stone-950/80 text-stone-400 border-white/10 hover:text-stone-200'
              }`}
              title="Toggle Procedural Afrobeat Groove"
            >
              <Radio className={`w-3 h-3 ${isBgmActive ? 'animate-pulse text-amber-400' : ''}`} />
              <span>AUDIO</span>
            </button>

            {/* Sound Mute */}
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-stone-950/80 border border-white/10 text-stone-300 hover:text-white"
              title="Toggle Audio"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
            </button>
          </div>

          {/* Quick Hub Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSimsHub}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-950/85 hover:bg-stone-900 text-stone-300 border border-white/10 rounded-lg text-xs font-medium shadow-md active:scale-95"
            >
              <ShoppingBag className="w-3 h-3 text-amber-400" />
              <span>Armory & Kitchen</span>
            </button>

            <button
              onClick={onOpenWardrobe}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-950/85 hover:bg-stone-900 text-stone-300 border border-white/10 rounded-lg text-xs font-medium shadow-md active:scale-95"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Tactical Drip</span>
            </button>

            <button
              onClick={onOpenQuests}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-950/85 hover:bg-stone-900 text-stone-300 border border-white/10 rounded-lg text-xs font-medium shadow-md active:scale-95"
            >
              <span>Contracts</span>
            </button>
          </div>

          {/* Killfeed */}
          <div className="flex flex-col gap-1 items-end mt-1 max-w-[280px]">
            {killfeed.slice(0, 3).map((k) => (
              <div
                key={k.id}
                className="bg-stone-950/90 backdrop-blur-md border-l-2 border-amber-500 px-2.5 py-1 rounded text-[11px] text-stone-300 flex items-center gap-1.5 shadow-lg animate-fadeIn"
              >
                <span className="font-bold text-stone-200">{k.killer}</span>
                <span className="text-[10px] text-stone-500">[{k.weapon}] ➔</span>
                <span className="font-medium text-stone-400">{k.victim}</span>
                {k.headshot && <span className="text-red-400 font-mono text-[9px] font-bold">CRIT</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER CROSSHAIR, FULL ADS OPTICS & HIT MARKER */}
      {viewMode === 'FPS' && (
        <>
          {/* Subtle cinematic edge vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 50%, transparent 60%, rgba(0,0,0,0.38) 100%)',
            }}
          />

          {/* Full-Screen ADS Holographic Reflex Sight / Tactical Scope Overlay */}
          {isAiming && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 animate-fadeIn">
              {/* Peripheral Blur / Dark Ring Mask */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, transparent 180px, rgba(15,23,42,0.72) 260px, rgba(2,6,23,0.94) 100%)',
                }}
              />

              {/* Scope Reticle Body */}
              <div className="relative w-84 h-84 md:w-96 md:h-96 rounded-full border border-sky-400/30 flex items-center justify-center">
                {/* Outer Glass Bezel Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-slate-700/70 shadow-[inset_0_0_50px_rgba(56,189,248,0.18)]" />
                <div className="absolute inset-4 rounded-full border border-white/10" />

                {/* Rangefinder Tick Marks */}
                <div className="absolute w-full h-[1px] bg-sky-400/30" />
                <div className="absolute h-full w-[1px] bg-sky-400/30" />

                {/* Stadia Milliradian Marks */}
                {[-100, -50, 50, 100].map((offset) => (
                  <div
                    key={`h-${offset}`}
                    className="absolute w-3 h-[1px] bg-sky-400/60"
                    style={{ transform: `translateX(${offset}px)` }}
                  />
                ))}
                {[-100, -50, 50, 100].map((offset) => (
                  <div
                    key={`v-${offset}`}
                    className="absolute h-3 w-[1px] bg-sky-400/60"
                    style={{ transform: `translateY(${offset}px)` }}
                  />
                ))}

                {/* Center Precision Chevron & Glowing Red Dot */}
                <div className="relative flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_12px_#ef4444]" />
                  <div className="absolute w-6 h-6 rounded-full border border-red-500/60" />
                </div>

                {/* Scope Telemetry Data */}
                <div className="absolute top-10 flex items-center gap-4 text-[9px] font-mono text-sky-400/90 font-bold tracking-widest uppercase">
                  <span>RNG: 78M</span>
                  <span>CAL: 7.62</span>
                  <span>OPTIC: EOTECH</span>
                </div>
                <div className="absolute bottom-10 text-[9px] font-mono text-emerald-400/90 font-bold tracking-widest uppercase">
                  <span>TAC-LOCK: ACQUIRED</span>
                </div>
              </div>
            </div>
          )}

          {/* Regular Hipfire Crosshair */}
          {!isAiming && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-8 h-8 flex items-center justify-center opacity-85">
                <div className="w-1 h-1 bg-white/90 rounded-full shadow-sm" />
                <div className="absolute -top-1 w-0.5 h-2.5 bg-white/80" />
                <div className="absolute -bottom-1 w-0.5 h-2.5 bg-white/80" />
                <div className="absolute -left-1 w-2.5 h-0.5 bg-white/80" />
                <div className="absolute -right-1 w-2.5 h-0.5 bg-white/80" />
              </div>
            </div>
          )}

          {/* Hitmarker */}
          {hitMarker?.active && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div
                className={`text-2xl font-black hitmarker-animate ${
                  hitMarker.isHeadshot ? 'text-red-500 scale-125' : 'text-amber-400'
                }`}
              >
                ✕
              </div>
            </div>
          )}
        </>
      )}

      {/* SIMS CLICK-TO-MOVE HELPER HINT IN SIMS MODE */}
      {viewMode === 'SIMS_ISO' && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-stone-950/80 backdrop-blur-md border border-emerald-500/40 px-4 py-1.5 rounded-full text-xs text-emerald-300 font-mono font-medium shadow-xl pointer-events-none">
          SIMS MODE: Click pavement to navigate · WASD / Joystick
        </div>
      )}

      {/* BOTTOM-LEFT: VIRTUAL ANALOG MOVEMENT JOYSTICK & SCORESTREAKS */}
      <div className="absolute bottom-4 left-4 flex items-end gap-3 pointer-events-auto">
        <div className="flex flex-col items-center gap-1.5">
          <VirtualJoystick onMove={onJoystickMove} />
          <div className="text-[9px] font-mono text-stone-400 bg-stone-950/90 px-2 py-0.5 rounded border border-white/10">
            WASD / TOUCH
          </div>
        </div>

        {/* Scorestreak Tactical Abilities */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={onCallDanfoStrike}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-950/90 border border-white/15 hover:border-amber-500/70 active:scale-95 transition-all text-amber-400 shadow-xl"
            title="Call Danfo Bus Street Ram Strike"
          >
            <span className="text-base">🚍</span>
            <span className="text-[10px] font-mono font-bold uppercase text-stone-200">Danfo Ram</span>
          </button>

          <button
            onClick={onCallNepaBlackout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-950/90 border border-white/15 hover:border-cyan-500/70 active:scale-95 transition-all text-cyan-400 shadow-xl"
            title="NEPA Generator Blackout EMP"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-mono font-bold uppercase text-stone-200">NEPA EMP</span>
          </button>

          <button
            onClick={onCallSuyaAdrenaline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-950/90 border border-white/15 hover:border-orange-500/70 active:scale-95 transition-all text-orange-400 shadow-xl"
            title="Suya Spicy Adrenaline Rush"
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] font-mono font-bold uppercase text-stone-200">Adrenaline</span>
          </button>
        </div>
      </div>

      {/* BOTTOM-CENTER: QUICK WEAPON SWITCH BAR */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <div className="flex items-center gap-1 bg-stone-950/90 backdrop-blur-md border border-white/15 p-1 rounded-xl shadow-2xl">
          {(['primary', 'secondary', 'melee', 'tactical'] as const).map((slot) => {
            const w = inventory.weapons[slot];
            const isSelected = currentSlot === slot;
            return (
              <button
                key={slot}
                onClick={() => onSwitchWeapon(slot)}
                className={`flex flex-col items-center px-3 py-1.5 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-white/15 text-white font-bold border border-white/20 shadow-md'
                    : 'text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-[9px] font-mono uppercase tracking-wider text-stone-500">{slot}</span>
                <span className="text-xs font-mono font-semibold truncate max-w-[85px]">{w.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BOTTOM-RIGHT: FIRE, ADS, RELOAD & AMMO COUNTER */}
      <div className="absolute bottom-4 right-4 flex items-end gap-3 pointer-events-auto">
        <div className="flex flex-col items-end bg-stone-950/90 backdrop-blur-md border border-white/15 rounded-xl px-3 py-2 shadow-2xl">
          <div className="text-xs font-mono font-bold text-amber-400 truncate max-w-[130px]">
            {currentWeapon.name}
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-black font-mono tabular-nums text-white">{ammoInMag}</span>
            <span className="text-xs font-mono text-stone-500 tabular-nums">/ {reserveAmmo}</span>
          </div>
          <button
            onClick={onReload}
            disabled={isReloading}
            className="mt-1 flex items-center gap-1 text-[10px] font-mono font-bold text-stone-400 hover:text-amber-400 active:scale-95 transition-all"
          >
            <RotateCcw className={`w-3 h-3 ${isReloading ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isReloading ? 'RELOADING...' : 'RELOAD [R]'}</span>
          </button>
        </div>

        <button
          onClick={onAimToggle}
          className={`w-13 h-13 rounded-full flex flex-col items-center justify-center border transition-all shadow-xl active:scale-90 ${
            isAiming
              ? 'bg-sky-500/20 border-sky-400 text-sky-300'
              : 'bg-stone-950/90 border-white/20 text-stone-300 hover:border-amber-400'
          }`}
          title="Aim Down Sights (Right-Click or Tap)"
        >
          <Crosshair className="w-5 h-5" />
          <span className="text-[8px] font-mono font-bold">ADS</span>
        </button>

        <button
          onClick={onFire}
          className="w-18 h-18 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 border-2 border-white/20 flex flex-col items-center justify-center text-stone-950 font-black shadow-2xl active:scale-90 active:brightness-110 transition-transform"
          title="Fire Weapon (Left-Click or Tap)"
        >
          <Flame className="w-6 h-6" />
          <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold">FIRE</span>
        </button>
      </div>
    </div>
  );
};
