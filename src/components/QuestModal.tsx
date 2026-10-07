import React from 'react';
import { X, Award, CheckCircle2, ShieldAlert, Target } from 'lucide-react';
import { GameMode, Quest } from '../game/types.ts';
import { soundEngine } from '../game/audio.ts';

interface QuestModalProps {
  quests: Quest[];
  currentMode: GameMode;
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: GameMode) => void;
}

export const QuestModal: React.FC<QuestModalProps> = ({
  quests,
  currentMode,
  isOpen,
  onClose,
  onSelectMode,
}) => {
  if (!isOpen) return null;

  const gameModes: { id: GameMode; title: string; desc: string; icon: string }[] = [
    {
      id: 'COD_SKIRMISH',
      title: 'Balogun Market Skirmish',
      desc: 'Call of Duty Mobile street deathmatch against rival Agbero bots behind Danfo buses and stalls.',
      icon: '🎯',
    },
    {
      id: 'DANFO_ESCORT',
      title: 'Oshodi Danfo Convoy Escort',
      desc: 'Tactical escort mission: guard the moving yellow Danfo bus as it advances through ambush checkpoints.',
      icon: '🚍',
    },
    {
      id: 'SIMS_HUB',
      title: 'Lagos Compound Free Roam',
      desc: 'Sims street life mode: chill at your base, eat Mama Put food, chat with locals, customize drip.',
      icon: '🏡',
    },
    {
      id: 'TARGET_RANGE',
      title: 'Computer Village Firing Range',
      desc: 'Test weapon accuracy, recoil control, and ADS handling on urban targets.',
      icon: '⚡',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="relative w-full max-w-3xl bg-stone-900 border-2 border-amber-500 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-black text-xl font-heading shadow-md">
              ⚡
            </div>
            <div>
              <h2 className="text-lg font-heading font-black text-white">
                STREET OPS & MISSION DISPATCH
              </h2>
              <p className="text-xs text-stone-400">
                Choose Game Mode & Track Active Street Bounty Contracts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* GAME MODES */}
          <div>
            <h3 className="text-xs font-heading font-bold text-amber-400 uppercase tracking-wider mb-3">
              Deployment Game Modes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {gameModes.map((m) => {
                const isActive = currentMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectMode(m.id);
                      soundEngine.playCashEarned();
                    }}
                    className={`p-4 rounded-xl text-left border transition-all ${
                      isActive
                        ? 'bg-amber-500/20 border-amber-500 shadow-lg'
                        : 'bg-stone-950/70 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{m.icon}</span>
                        <h4 className="font-heading font-bold text-sm text-stone-100">{m.title}</h4>
                      </div>
                      {isActive && (
                        <span className="text-[10px] font-heading font-black bg-amber-500 text-stone-950 px-2 py-0.5 rounded">
                          DEPLOYED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400 pl-8">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE STREET CONTRACTS */}
          <div>
            <h3 className="text-xs font-heading font-bold text-amber-400 uppercase tracking-wider mb-3">
              Active Street Bounties & Contracts
            </h3>
            <div className="space-y-3">
              {quests.map((q) => {
                const progressPct = Math.min(100, Math.round((q.currentCount / q.targetCount) * 100));
                return (
                  <div
                    key={q.id}
                    className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-bold text-sm text-stone-100">{q.title}</h4>
                        {q.completed ? (
                          <span className="text-emerald-400 text-xs flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETED
                          </span>
                        ) : (
                          <span className="text-xs text-amber-400 font-mono">
                            {q.currentCount} / {q.targetCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-400 mt-1">{q.description}</p>

                      {/* Progress bar */}
                      <div className="w-full max-w-md h-1.5 bg-stone-900 rounded-full overflow-hidden mt-2 border border-stone-800">
                        <div
                          className="h-full bg-amber-500 transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-emerald-400">
                          +₦{q.rewardNaira.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-amber-300 font-medium">
                          +{q.rewardCred} Street Cred
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
