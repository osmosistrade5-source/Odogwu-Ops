import React from 'react';
import { X, MapPin, Navigation, Car, Shield } from 'lucide-react';
import { LAGOS_DISTRICTS } from '../game/constants.ts';
import { soundEngine } from '../game/audio.ts';

interface CityMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerPos: { x: number; z: number };
  onFastTravel: (x: number, z: number, districtName: string) => void;
}

export const CityMapModal: React.FC<CityMapModalProps> = ({
  isOpen,
  onClose,
  playerPos,
  onFastTravel,
}) => {
  if (!isOpen) return null;

  // Convert world coordinates (-120 to +120) into map percentage (0% to 100%)
  const getMapPercent = (coord: number) => {
    return Math.max(8, Math.min(92, ((coord + 120) / 240) * 100));
  };

  const playerMapX = getMapPercent(playerPos.x);
  const playerMapY = getMapPercent(playerPos.z);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 select-none">
      <div className="relative w-full max-w-4xl bg-stone-900 border-2 border-amber-500 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-black text-xl font-heading shadow-md">
              <Navigation className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-black text-white flex items-center gap-2">
                <span>LAGOS STATE VIRTUAL METROPOLIS GPS</span>
                <span className="text-xs bg-amber-500 text-stone-950 px-2 py-0.5 rounded font-mono font-bold">
                  260m² MAP
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Lekki High-Rises · Balogun Market · Oshodi Transit Interchange · Computer Village
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

        {/* Map Grid & Interactive Districts */}
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden p-6 gap-6">
          {/* Left 2 Cols: 2D Tactical GPS Map View */}
          <div className="md:col-span-2 relative bg-stone-950 rounded-2xl border-2 border-amber-500/50 shadow-inner overflow-hidden aspect-square max-h-[500px]">
            {/* Grid overlay lines */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #f59e0b 1px, transparent 1px), linear-gradient(to bottom, #f59e0b 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />

            {/* Main North-South & East-West Expressways */}
            <div className="absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 bg-stone-800 border-x border-amber-500/40 flex items-center justify-center">
              <div className="w-0.5 h-full border-r border-dashed border-amber-400" />
            </div>
            <div className="absolute top-1/2 left-0 right-0 h-8 -translate-y-1/2 bg-stone-800 border-y border-amber-500/40 flex items-center justify-center">
              <div className="h-0.5 w-full border-b border-dashed border-amber-400" />
            </div>

            {/* Elevated Flyover Highway Bridge running diagonally */}
            <div
              className="absolute w-[80%] h-5 bg-stone-700/80 border-y border-cyan-400/80 top-[35%] left-[10%] rotate-12 shadow-lg flex items-center justify-center pointer-events-none"
            >
              <span className="text-[9px] font-heading font-black text-cyan-300 tracking-widest">
                ▲ LAGOS ELEVATED FLYOVER EXPRESSWAY ▲
              </span>
            </div>

            {/* Central Roundabout */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-4 border-amber-500 bg-stone-900 shadow-xl flex items-center justify-center z-10">
              <span className="text-xl">🏛️</span>
            </div>

            {/* District Quadrant Labels & Click Targets */}
            {LAGOS_DISTRICTS.map((dist) => {
              const xPct = getMapPercent(dist.center.x);
              const yPct = getMapPercent(dist.center.z);
              return (
                <button
                  key={dist.id}
                  onClick={() => {
                    onFastTravel(dist.center.x, dist.center.z, dist.name);
                    soundEngine.playDanfoHorn();
                    onClose();
                  }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-20"
                  style={{ left: `${xPct}%`, top: `${yPct}%` }}
                >
                  <div
                    className="flex flex-col items-center p-2 rounded-xl border bg-stone-900/90 shadow-xl transition-all duration-200 group-hover:scale-110 group-hover:bg-amber-500/20"
                    style={{ borderColor: dist.color }}
                  >
                    <MapPin className="w-5 h-5 mb-0.5 animate-bounce" style={{ color: dist.color }} />
                    <span className="text-[11px] font-heading font-black text-white whitespace-nowrap">
                      {dist.name}
                    </span>
                    <span className="text-[9px] text-amber-300 font-bold opacity-80 group-hover:opacity-100 flex items-center gap-1 mt-0.5">
                      <Car className="w-3 h-3" /> Hail Danfo Hop
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Live Player Position Blip */}
            <div
              className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300"
              style={{ left: `${playerMapX}%`, top: `${playerMapY}%` }}
            >
              <div className="relative flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-emerald-500/40 animate-ping absolute" />
                <div className="w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-lg flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-950" />
                </div>
                <span className="absolute -bottom-4 text-[9px] font-heading font-black text-emerald-300 bg-stone-950/90 px-1 rounded whitespace-nowrap">
                  YOU ARE HERE
                </span>
              </div>
            </div>
          </div>

          {/* Right Col: District Details & Fast Travel Directory */}
          <div className="space-y-3 overflow-y-auto pr-1">
            <h3 className="text-xs font-heading font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> Lagos Districts & Transit
            </h3>

            {LAGOS_DISTRICTS.map((dist) => (
              <div
                key={dist.id}
                className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 hover:border-amber-500/60 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-bold text-sm text-stone-100">{dist.name}</h4>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dist.color }} />
                  </div>
                  <div className="text-[11px] text-amber-400 mt-0.5">{dist.subtitle}</div>
                  <p className="text-xs text-stone-400 mt-1.5">{dist.description}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-stone-800/80 flex items-center justify-end">
                  <button
                    onClick={() => {
                      onFastTravel(dist.center.x, dist.center.z, dist.name);
                      soundEngine.playDanfoHorn();
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-heading font-bold text-xs shadow-md active:scale-95 transition-all"
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>HAIL DANFO TRANSIT</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
