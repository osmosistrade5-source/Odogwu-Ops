import React from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { PlayerSimsProfile } from '../game/types.ts';
import { soundEngine } from '../game/audio.ts';

const CHARACTER_AVATAR = '/src/assets/images/sims_drip_character_1791368652442.jpg';

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
  if (!isOpen) return null;

  const outfitOptions = {
    head: [
      { id: 'Afro Bucket Hat', name: 'Yellow Afro Bucket Hat', credReq: 0 },
      { id: 'VR Cyber Visor', name: 'Tactical VR HUD Visor', credReq: 100 },
      { id: 'Commander Beret', name: 'Red Command Beret', credReq: 250 },
      { id: 'Traditional Fila', name: 'Velvet Yoruba Fila Cap', credReq: 400 },
    ],
    vest: [
      { id: 'Ankara Tactical Kevlar', name: 'Wax-Print Ankara Kevlar', credReq: 0 },
      { id: 'Lagos Street Hoodie', name: 'Odogwu Street Camo Hoodie', credReq: 150 },
      { id: 'Danfo Stripe Jersey', name: 'Danfo Yellow #10 Combat Jersey', credReq: 300 },
    ],
    pants: [
      { id: 'Combat Cargo Denim', name: 'Deep Indigo Tactical Cargo', credReq: 0 },
      { id: 'Ankara Combat Joggers', name: 'Ankara Splatter Combat Pants', credReq: 200 },
    ],
    accessory: [
      { id: 'Gold Chain & Dogtags', name: 'Heavy 24k Odogwu Neck Chain', credReq: 0 },
      { id: 'Coral Chieftain Beads', name: 'Benin Royal Coral Beads', credReq: 350 },
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="relative w-full max-w-4xl bg-stone-900 border-2 border-amber-500 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]">
        {/* Left Side: 3D Character Card with generated portrait */}
        <div className="w-full md:w-80 bg-stone-950 p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-stone-800">
          <div className="text-center w-full">
            <span className="text-xs font-mono font-bold uppercase text-amber-400 tracking-wider">
              ✦ Street Drip Customizer ✦
            </span>
            <h3 className="font-heading font-black text-white text-lg mt-1">{profile.name}</h3>
            <p className="text-xs text-stone-400">{profile.title}</p>
          </div>

          {/* Character Portrait with Monkeypost aesthetic */}
          <div className="relative my-4 w-48 h-48 rounded-2xl overflow-hidden border-2 border-amber-500/70 shadow-2xl group">
            <img
              src={CHARACTER_AVATAR}
              alt="Sims Nigerian Tactical Character"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            {/* Sims Plumbob overlay icon */}
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-xs shadow-md animate-bounce">
              💎
            </div>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent p-2 text-center">
              <span className="text-[10px] font-heading font-bold text-amber-300">
                ACTIVE STREET DRIP
              </span>
            </div>
          </div>

          {/* Summary Badges */}
          <div className="w-full space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-400">
              <span>Street Cred:</span>
              <span className="text-amber-400 font-bold font-mono">{profile.streetCred} REP</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Headwear:</span>
              <span className="text-stone-200 font-medium truncate max-w-[130px]">{profile.outfit.head}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Tactical Vest:</span>
              <span className="text-stone-200 font-medium truncate max-w-[130px]">{profile.outfit.vest}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Wardrobe Gear Selection */}
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-stone-800">
            <div>
              <h2 className="text-lg font-heading font-black text-white">LAGOS WARDROBE & DRIP</h2>
              <p className="text-xs text-stone-400">
                Unlock high-status Afropop tactical apparel with Street Cred
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5 mt-4">
            {/* HEADWEAR */}
            <div>
              <h4 className="text-xs font-heading font-bold text-amber-400 uppercase tracking-wider mb-2">
                Headgear & Eyewear
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
                          ? 'bg-amber-500/20 border-amber-500 shadow-md'
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
                      {isEquipped && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TACTICAL VEST / TOP */}
            <div>
              <h4 className="text-xs font-heading font-bold text-amber-400 uppercase tracking-wider mb-2">
                Tactical Vests & Native Prints
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
                          ? 'bg-amber-500/20 border-amber-500 shadow-md'
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
                      {isEquipped && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PANTS & ACCESSORIES */}
            <div>
              <h4 className="text-xs font-heading font-bold text-amber-400 uppercase tracking-wider mb-2">
                Combat Pants & Jewelry
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
                          ? 'bg-amber-500/20 border-amber-500 shadow-md'
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
                      {isEquipped && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
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
