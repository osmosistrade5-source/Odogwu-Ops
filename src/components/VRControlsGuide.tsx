import React from 'react';
import { X, MousePointer, Smartphone, Glasses, Keyboard } from 'lucide-react';

interface VRControlsGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VRControlsGuide: React.FC<VRControlsGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 select-none">
      <div className="relative w-full max-w-2xl bg-stone-900 border-2 border-amber-500 rounded-2xl shadow-2xl overflow-hidden p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎮</span>
            <h2 className="text-lg font-heading font-black text-white">
              ODOGWU OPS: VR & CONTROLS GUIDE
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 mt-4 text-xs text-stone-300">
          {/* Virtual Reality Headset */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-400 font-heading font-bold text-sm mb-1">
              <Glasses className="w-4 h-4" />
              <span>WebXR Virtual Reality (VR) Experience</span>
            </div>
            <p className="text-stone-300 leading-relaxed">
              Step inside the vibrant Lagos streetscape in full stereoscopic 3D! Tap the{' '}
              <strong className="text-amber-400">VR MODE</strong> button on the HUD using any WebXR-compatible browser
              (Meta Quest 2/3/Pro, Apple Vision Pro, or Mobile VR headset). Your head rotation controls the tactical view.
            </p>
          </div>

          {/* Desktop Keyboard & Mouse */}
          <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-stone-100 font-heading font-bold text-sm mb-2">
              <Keyboard className="w-4 h-4 text-amber-400" />
              <span>Desktop COD PC Bindings</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><kbd className="px-1.5 py-0.5 bg-stone-800 rounded font-mono text-amber-400">W A S D</kbd> : Tactical Walk</div>
              <div><kbd className="px-1.5 py-0.5 bg-stone-800 rounded font-mono text-amber-400">Left Click</kbd> : Fire Weapon</div>
              <div><kbd className="px-1.5 py-0.5 bg-stone-800 rounded font-mono text-amber-400">Right Click</kbd> : Aim Down Sights (ADS)</div>
              <div><kbd className="px-1.5 py-0.5 bg-stone-800 rounded font-mono text-amber-400">R</kbd> : Reload Magazine</div>
              <div><kbd className="px-1.5 py-0.5 bg-stone-800 rounded font-mono text-amber-400">Shift</kbd> : Tactical Sprint</div>
              <div><kbd className="px-1.5 py-0.5 bg-stone-800 rounded font-mono text-amber-400">C</kbd> : Crouch / Slide</div>
              <div><kbd className="px-1.5 py-0.5 bg-stone-800 rounded font-mono text-amber-400">V</kbd> : Toggle FPS / Sims 3rd Person</div>
              <div><kbd className="px-1.5 py-0.5 bg-stone-800 rounded font-mono text-amber-400">Click Screen</kbd> : Lock Mouse Aim</div>
            </div>
          </div>

          {/* Mobile COD Touchscreen */}
          <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-stone-100 font-heading font-bold text-sm mb-1">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>Mobile Touchscreen Controls</span>
            </div>
            <p className="text-stone-300 leading-relaxed">
              Full touch compatibility! Use the circular on-screen buttons on the bottom-right for{' '}
              <strong className="text-white">FIRE</strong>, <strong className="text-white">ADS</strong>, and{' '}
              <strong className="text-white">RELOAD</strong>. Quick weapon switcher lets you rapidly toggle between AK-47, SMG, Cutlass, and Pepper Grenade.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-stone-800 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-heading font-bold rounded-xl transition-all shadow-lg active:scale-95 text-xs"
          >
            LET'S PLAY (ENTER LAGOS)
          </button>
        </div>
      </div>
    </div>
  );
};
