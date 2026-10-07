import React, { useState } from 'react';
import { X, Utensils, Wrench, MessageSquare, Flame, Check, Coins } from 'lucide-react';
import { FoodItem, PlayerSimsProfile, WeaponDef } from '../game/types.ts';
import { FOOD_MENU, WEAPONS } from '../game/constants.ts';
import { soundEngine } from '../game/audio.ts';

interface SimsHubOverlayProps {
  profile: PlayerSimsProfile;
  isOpen: boolean;
  onClose: () => void;
  onBuyFood: (food: FoodItem) => void;
  onUpgradeWeapon: (upgradeKey: keyof PlayerSimsProfile['upgrades'], cost: number) => void;
}

export const SimsHubOverlay: React.FC<SimsHubOverlayProps> = ({
  profile,
  isOpen,
  onClose,
  onBuyFood,
  onUpgradeWeapon,
}) => {
  const [activeTab, setActiveTab] = useState<'KITCHEN' | 'GUNSMITH' | 'NEIGHBORS'>('KITCHEN');
  const [activeNpc, setActiveNpc] = useState<'MAMA_PUT' | 'ALAO_DRIVER' | 'OCHIE_TECH'>('MAMA_PUT');

  if (!isOpen) return null;

  const npcs = {
    MAMA_PUT: {
      name: 'Mama Cash Put',
      role: 'Master Chef & Lagos Street Oracle',
      avatar: '🍲',
      quote: '“Eat beta jollof rice my pikin! Person wey hunger dey catch no fit aim weapon straight!”',
      advice: 'Pro Tip: Eating Suya gives you a 45-second sprint speed overdrive during Balogun skirmishes.',
    },
    ALAO_DRIVER: {
      name: 'Driver Alao (Danfo 01)',
      role: 'Yellow Bus Syndicate Chieftain',
      avatar: '🚍',
      quote: '“Oya enter with your 500 Naira change! We dey move convoy pass checkpoint now now!”',
      advice: 'Call in the Danfo Express Strike whenever enemy bots gather near the market zebra crossing.',
    },
    OCHIE_TECH: {
      name: 'Oche Computer Village',
      role: 'Tactical Gear & Electronics Hacker',
      avatar: '⚡',
      quote: '“Original red-dot sight imported from Otigba Street! No fake parts here, my brother!”',
      advice: 'Upgrade your Lekki AK-47 with Extended Mag to withstand long wave ambushes.',
    },
  };

  const gunsmithUpgrades = [
    {
      id: 'extendedMag' as const,
      name: 'Otigba Extended Magazine',
      desc: '+10 rounds capacity in magazine for rapid engagements.',
      cost: 12000,
      unlocked: profile.upgrades.extendedMag,
    },
    {
      id: 'redDotSight' as const,
      name: 'Lekki Holographic Red-Dot',
      desc: 'Precision reticle with faster ADS target acquisition.',
      cost: 18000,
      unlocked: profile.upgrades.redDotSight,
    },
    {
      id: 'suyaAdrenaline' as const,
      name: 'Suya Pepper Stim Injector',
      desc: 'Automatic health regen boost when falling below 30% HP.',
      cost: 24000,
      unlocked: profile.upgrades.suyaAdrenaline,
    },
    {
      id: 'bulletproofAnkara' as const,
      name: 'Wax-Coated Ankara Body Armor',
      desc: 'Reduces incoming ballistic bullet damage by 20%.',
      cost: 30000,
      unlocked: profile.upgrades.bulletproofAnkara,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="relative w-full max-w-3xl bg-stone-900 border-2 border-amber-500 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-black text-xl font-heading shadow-md">
              ₦
            </div>
            <div>
              <h2 className="text-lg font-black font-heading tracking-wide text-white">
                LAGOS COMPOUND & STREET HUB
              </h2>
              <p className="text-xs text-stone-400">
                Sims Street Life · Food & Fuel · Computer Village Gunsmith
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-stone-900 px-3 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-400 font-mono font-bold text-sm flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>₦{profile.naira.toLocaleString()}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-800 bg-stone-950/60 px-6">
          <button
            onClick={() => setActiveTab('KITCHEN')}
            className={`flex items-center gap-2 py-3 px-4 font-heading text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'KITCHEN'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>MAMA PUT KITCHEN</span>
          </button>

          <button
            onClick={() => setActiveTab('GUNSMITH')}
            className={`flex items-center gap-2 py-3 px-4 font-heading text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'GUNSMITH'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>COMPUTER VILLAGE GUNSMITH</span>
          </button>

          <button
            onClick={() => setActiveTab('NEIGHBORS')}
            className={`flex items-center gap-2 py-3 px-4 font-heading text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'NEIGHBORS'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>STREET NPCS & CREW</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: MAMA PUT KITCHEN */}
          {activeTab === 'KITCHEN' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300">
                <span>
                  🔥 Fuel up your Sims stamina! Eating boosts Jollof Energy, restores Health, and elevates your Street Vibes.
                </span>
                <span className="font-bold">Hunger: {profile.jollofEnergy}%</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {FOOD_MENU.map((item) => {
                  const canAfford = profile.naira >= item.costNaira;
                  return (
                    <div
                      key={item.id}
                      className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 flex flex-col justify-between hover:border-stone-700 transition-colors"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <h3 className="font-heading font-bold text-stone-100 text-sm">{item.name}</h3>
                          <span className="font-mono font-bold text-emerald-400 text-xs">
                            ₦{item.costNaira.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 mt-1">{item.description}</p>
                        <div className="mt-2 text-[11px] text-amber-400/90 font-medium">{item.tagline}</div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[11px] text-stone-400">
                          <span className="text-amber-400">+{item.energyBonus} Energy</span>
                          <span>·</span>
                          <span className="text-emerald-400">+{item.healthBonus} HP</span>
                        </div>

                        <button
                          onClick={() => {
                            if (canAfford) {
                              onBuyFood(item);
                              soundEngine.playCashEarned();
                            }
                          }}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md active:scale-95'
                              : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                          }`}
                        >
                          {canAfford ? 'CHOP NOW' : 'NO CASH'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: GUNSMITH UPGRADES */}
          {activeTab === 'GUNSMITH' && (
            <div className="space-y-4">
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 text-xs text-cyan-300">
                ⚙️ Direct modifications from Ikeja Computer Village technicians. Equip tactical attachments to gain upper hand in skirmishes.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {gunsmithUpgrades.map((upg) => {
                  const canAfford = profile.naira >= upg.cost;
                  return (
                    <div
                      key={upg.id}
                      className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <h4 className="font-heading font-bold text-stone-100 text-sm">{upg.name}</h4>
                          {upg.unlocked ? (
                            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> EQUIPPED
                            </span>
                          ) : (
                            <span className="font-mono font-bold text-amber-400 text-xs">
                              ₦{upg.cost.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-400 mt-1">{upg.desc}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-end">
                        {upg.unlocked ? (
                          <div className="text-xs text-stone-500 font-medium">Installed on all weapons</div>
                        ) : (
                          <button
                            onClick={() => {
                              if (canAfford) {
                                onUpgradeWeapon(upg.id, upg.cost);
                                soundEngine.playCashEarned();
                              }
                            }}
                            disabled={!canAfford}
                            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold transition-all ${
                              canAfford
                                ? 'bg-cyan-500 hover:bg-cyan-400 text-stone-950 shadow-md active:scale-95'
                                : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                            }`}
                          >
                            {canAfford ? 'INSTALL UPGRADE' : 'NEED MORE NAIRA'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: STREET NPCS & CREW */}
          {activeTab === 'NEIGHBORS' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.keys(npcs) as Array<keyof typeof npcs>).map((key) => {
                const npc = npcs[key];
                const isSelected = activeNpc === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveNpc(key)}
                    className={`p-4 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 shadow-md'
                        : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="text-3xl mb-2">{npc.avatar}</div>
                    <div className="font-heading font-bold text-stone-100 text-sm">{npc.name}</div>
                    <div className="text-[11px] text-amber-400 mt-0.5">{npc.role}</div>
                  </button>
                );
              })}

              {/* Selected NPC dialogue box */}
              <div className="md:col-span-3 bg-stone-950/90 border border-stone-800 rounded-xl p-5 mt-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{npcs[activeNpc].avatar}</span>
                  <div>
                    <h4 className="font-heading font-bold text-white text-base">{npcs[activeNpc].name}</h4>
                    <span className="text-xs text-amber-400">{npcs[activeNpc].role}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-stone-900 rounded-lg border-l-4 border-amber-500 text-sm text-stone-200 italic">
                  {npcs[activeNpc].quote}
                </div>

                <div className="mt-3 text-xs text-stone-400">
                  <span className="font-bold text-stone-300">Street Advice: </span>
                  {npcs[activeNpc].advice}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
