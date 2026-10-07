import React, { useState } from 'react';
import { X, Sparkles, Check, Shield, User, Award } from 'lucide-react';
import { PlayerSimsProfile } from '../game/types.ts';
import { soundEngine } from '../game/audio.ts';

const REALISTIC_PORTRAIT = '/src/assets/images/realistic_nigerian_operative_1791372075310.jpg';
const REALISTIC_FULLBODY = '/src/assets/images/realistic_operative_fullbody_1791372092064.jpg';

interface WardrobeModalProps {
  profile: PlayerSimsProfile;
  isOpen: boolean;
  onClose: () => void;
  onSelectOutfit: (category: keyof PlayerSimsProfile['outfit'], value: string) => void;
}

export const WardrobeModal: React.FC<WardrobeModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSelectOutfit,
}) => {
  const [viewAngle, setViewAngle] = useState<'portrait' | 'fullbody'>('portrait');
  const [activeSpecialist, setActiveSpecialist] = useState('Odogwu Alpha');

  if (!isOpen) return null;

  const specialists = [
    {
      id: 'Odogwu Alpha',
      role: 'Special Forces Commander',
      callsign: 'ODOGWU-01',
      description: 'Lagos Island Task Force veteran with Crye tactical armor & NVG shroud',
      credReq: 0,
      image: REALISTIC_PORTRAIT,
    },
    {
      id: 'Lagos Vanguard',
      role: 'Heavy Breacher & Pointman',
      callsign: 'VANGUARD-07',
      description: 'Frontline heavy armor operative with Stanag pouches and tactical radio',
      credReq: 150,
      image: REALISTIC_FULLBODY,
    },
    {
      id: 'Marina Ghost',
      role: 'Designated Recon Marksman',
      callsign: 'GHOST-09',
      description: 'Lekki Tollgate sector surveillance with low-profile ballistic kit',
      credReq: 300,
      image: REALISTIC_PORTRAIT,
    },
  ];

  const outfitOptions = {
    head: [
      { id: 'FAST Ballistic Helmet', name: 'FAST Ballistic Helmet with NVG Shroud', credReq: 0 },
      { id: 'Tactical Balaclava & Goggles', name: 'Polarized Goggles & Nomex Balaclava', credReq: 80 },
      { id: 'Command Comms Headset', name: 'Tactical Ear-Pro with Boom Mic', credReq: 180 },
      { id: 'Afro Tactical Bucket Hat', name: 'Wax-Print Ankara Tactical Bush Hat', credReq: 260 },
      { id: 'Traditional Velvet Fila', name: 'Velvet Yoruba Commander Fila', credReq: 380 },
    ],
    vest: [
      { id: 'Crye Precision JPC 2.0', name: 'Crye JPC Plate Carrier with MOLLE', credReq: 0 },
      { id: 'Ankara Ballistic Kevlar', name: 'Wax-Print Heavy Ballistic Kevlar', credReq: 120 },
      { id: 'Lagos S.W.A.T. Plate Carrier', name: 'Urban SWAT High-Threat Carrier', credReq: 240 },
      { id: 'Danfo Stripe Tactical Rig', name: 'Danfo Highway Yellow Tactical Chest Rig', credReq: 350 },
    ],
    pants: [
      { id: 'Crye G3 Combat Pants', name: 'Crye G3 Combat Cargo with Knee Pads', credReq: 0 },
      { id: 'Ankara Ripstop Trousers', name: 'Ankara Wax Ripstop Camouflage', credReq: 160 },
      { id: 'Heavy Drop-Leg Tactical Denim', name: 'Deep Indigo Heavy Combat Denim', credReq: 280 },
    ],
    accessory: [
      { id: 'Heavy 24k Gold Chain & Tags', name: 'Heavy 24k Odogwu Sovereign Chain', credReq: 0 },
      { id: 'PTT Tactical Radio Unit', name: 'Dual-Band Military Radio & Antenna', credReq: 100 },
      { id: 'Royal Benin Coral Beads', name: 'Ancient Benin Royal Chieftain Coral Beads', credReq: 320 },
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-5xl bg-stone-900 border-2 border-amber-500 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        {/* Left Side: Photorealistic Character Card */}
        <div className="w-full md:w-88 bg-stone-950 p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-stone-800">
          <div className="text-center w-full">
            <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold uppercase text-amber-400 tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              <span>TACTICAL OPERATOR PROFILE</span>
            </div>
            <h3 className="font-heading font-black text-white text-xl mt-1">{profile.name}</h3>
            <p className="text-xs text-stone-400 font-mono">{profile.title}</p>
          </div>

          {/* Photorealistic Character Portrait / Full-Body Display */}
          <div className="relative my-3 w-56 h-72 rounded-2xl overflow-hidden border-2 border-amber-500/80 shadow-2xl group bg-stone-900">
            <img
              src={viewAngle === 'portrait' ? REALISTIC_PORTRAIT : REALISTIC_FULLBODY}
              alt="Real Nigerian Tactical Operative"
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />

            {/* View angle toggle */}
            <div className="absolute top-2 left-2 flex gap-1 z-10">
              <button
                onClick={() => setViewAngle('portrait')}
                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
                  viewAngle === 'portrait'
                    ? 'bg-amber-500 text-stone-950 shadow-md'
                    : 'bg-black/70 text-stone-300 hover:text-white'
                }`}
              >
                PORTRAIT
              </button>
              <button
                onClick={() => setViewAngle('fullbody')}
                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
                  viewAngle === 'fullbody'
                    ? 'bg-amber-500 text-stone-950 shadow-md'
                    : 'bg-black/70 text-stone-300 hover:text-white'
                }`}
              >
                FULL BODY
              </button>
            </div>

            {/* Faction Callout */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent p-2.5 text-center">
              <div className="text-[10px] font-mono font-bold text-amber-400 flex items-center justify-center gap-1">
                <span>NIGERIAN ARMED FORCES</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-[9px] text-stone-400 font-mono">SPEC-OPS DIVISION • LAGOS</div>
            </div>
          </div>

          {/* Specialist Operative Archetypes Selector */}
          <div className="w-full space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest block text-center">
              OPERATIVE SPECIALIST LOADOUTS
            </span>
            <div className="grid grid-cols-3 gap-1">
              {specialists.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSpecialist(s.id);
                    soundEngine.playCashEarned();
                  }}
                  className={`p-1.5 rounded-lg border text-center transition-all ${
                    activeSpecialist === s.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <div className="text-[9px] font-mono truncate">{s.callsign}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Vitals Summary */}
          <div className="w-full space-y-1 text-xs pt-2 border-t border-stone-800">
            <div className="flex justify-between text-stone-400">
              <span>Street Credibility:</span>
              <span className="text-amber-400 font-bold font-mono">{profile.streetCred} REP</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Tactical Vest:</span>
              <span className="text-stone-200 font-medium truncate max-w-[140px]">{profile.outfit.vest}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Tactical Wardrobe & Drip Selection */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-stone-800">
            <div>
              <h2 className="text-lg font-heading font-black text-white flex items-center gap-2">
                <span>LAGOS TACTICAL ARMORY & DRIP</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold">
                  MIL-SPEC REALISM
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Authentic military ballistic gear & high-status Nigerian operative apparel
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 mt-4">
            {/* HEADGEAR */}
            <div>
              <h4 className="text-xs font-heading font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Headgear & Optical Eyewear</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {outfitOptions.head.map((item) => {
                  const isEquipped = profile.outfit.head === item.id;
                  const isLocked = profile.streetCred < item.credReq;
                  return (
                    <button
                      key={item.id}
                      disabled={isLocked}
                      onClick={() => {
                        onSelectOutfit('head', item.id);
                        soundEngine.playCashEarned();
                      }}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isEquipped
                          ? 'bg-amber-500/20 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                          : isLocked
                          ? 'bg-stone-950/40 border-stone-900 opacity-50 cursor-not-allowed'
                          : 'bg-stone-950/70 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-heading font-bold text-stone-200">{item.name}</div>
                        {isLocked && (
                          <div className="text-[10px] text-stone-500 mt-0.5">Req: {item.credReq} Street Cred</div>
                        )}
                      </div>
                      {isEquipped && <Check className="w-4 h-4 text-amber-400 flex-shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BALLISTIC BODY ARMOR */}
            <div>
              <h4 className="text-xs font-heading font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Ballistic Plate Carriers & Vests</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {outfitOptions.vest.map((item) => {
                  const isEquipped = profile.outfit.vest === item.id;
                  const isLocked = profile.streetCred < item.credReq;
                  return (
                    <button
                      key={item.id}
                      disabled={isLocked}
                      onClick={() => {
                        onSelectOutfit('vest', item.id);
                        soundEngine.playCashEarned();
                      }}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isEquipped
                          ? 'bg-amber-500/20 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                          : isLocked
                          ? 'bg-stone-950/40 border-stone-900 opacity-50 cursor-not-allowed'
                          : 'bg-stone-950/70 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-heading font-bold text-stone-200">{item.name}</div>
                        {isLocked && (
                          <div className="text-[10px] text-stone-500 mt-0.5">Req: {item.credReq} Street Cred</div>
                        )}
                      </div>
                      {isEquipped && <Check className="w-4 h-4 text-amber-400 flex-shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COMBAT TROUSERS */}
            <div>
              <h4 className="text-xs font-heading font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tactical Combat Cargo Trousers</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {outfitOptions.pants.map((item) => {
                  const isEquipped = profile.outfit.pants === item.id;
                  const isLocked = profile.streetCred < item.credReq;
                  return (
                    <button
                      key={item.id}
                      disabled={isLocked}
                      onClick={() => {
                        onSelectOutfit('pants', item.id);
                        soundEngine.playCashEarned();
                      }}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isEquipped
                          ? 'bg-amber-500/20 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                          : isLocked
                          ? 'bg-stone-950/40 border-stone-900 opacity-50 cursor-not-allowed'
                          : 'bg-stone-950/70 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-heading font-bold text-stone-200">{item.name}</div>
                        {isLocked && (
                          <div className="text-[10px] text-stone-500 mt-0.5">Req: {item.credReq} Street Cred</div>
                        )}
                      </div>
                      {isEquipped && <Check className="w-4 h-4 text-amber-400 flex-shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ACCESSORIES */}
            <div>
              <h4 className="text-xs font-heading font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Tactical Hardware & Odogwu Status Chains</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {outfitOptions.accessory.map((item) => {
                  const isEquipped = profile.outfit.accessory === item.id;
                  const isLocked = profile.streetCred < item.credReq;
                  return (
                    <button
                      key={item.id}
                      disabled={isLocked}
                      onClick={() => {
                        onSelectOutfit('accessory', item.id);
                        soundEngine.playCashEarned();
                      }}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isEquipped
                          ? 'bg-amber-500/20 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                          : isLocked
                          ? 'bg-stone-950/40 border-stone-900 opacity-50 cursor-not-allowed'
                          : 'bg-stone-950/70 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-heading font-bold text-stone-200">{item.name}</div>
                        {isLocked && (
                          <div className="text-[10px] text-stone-500 mt-0.5">Req: {item.credReq} Street Cred</div>
                        )}
                      </div>
                      {isEquipped && <Check className="w-4 h-4 text-amber-400 flex-shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
