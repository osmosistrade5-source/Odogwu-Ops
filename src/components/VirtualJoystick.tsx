import React, { useRef, useState, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (input: { forward: number; right: number }) => void;
  className?: string;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const maxRadius = 45; // max movement radius in px

  const handlePointerDown = (clientX: number, clientY: number, touchId?: number) => {
    setIsDragging(true);
    if (touchId !== undefined) {
      touchIdRef.current = touchId;
    }
    updateKnob(clientX, clientY);
  };

  const updateKnob = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let clampedX = dx;
    let clampedY = dy;

    if (distance > maxRadius) {
      clampedX = (dx / distance) * maxRadius;
      clampedY = (dy / distance) * maxRadius;
    }

    setKnobPos({ x: clampedX, y: clampedY });

    // Normalize forward (-1 to 1) and right (-1 to 1)
    // Forward is negative Y in screen coordinates
    const forward = -(clampedY / maxRadius);
    const right = clampedX / maxRadius;

    onMove({ forward, right });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    touchIdRef.current = null;
    setKnobPos({ x: 0, y: 0 });
    onMove({ forward: 0, right: 0 });
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateKnob(e.clientX, e.clientY);
      }
    };

    const onMouseUp = () => {
      if (isDragging) {
        handlePointerUp();
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && touchIdRef.current !== null) {
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === touchIdRef.current) {
            updateKnob(e.touches[i].clientX, e.touches[i].clientY);
            break;
          }
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (isDragging && touchIdRef.current !== null) {
        let found = false;
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === touchIdRef.current) {
            found = true;
            break;
          }
        }
        if (!found) {
          handlePointerUp();
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        handlePointerDown(touch.clientX, touch.clientY, touch.identifier);
      }}
      className={`relative w-28 h-28 rounded-full bg-stone-900/85 backdrop-blur-md border-2 border-amber-500/60 shadow-2xl flex items-center justify-center cursor-pointer select-none touch-none ${className}`}
    >
      {/* Outer directional arrows */}
      <span className="absolute top-1 text-[9px] font-bold text-amber-400 font-mono">▲</span>
      <span className="absolute bottom-1 text-[9px] font-bold text-amber-400 font-mono">▼</span>
      <span className="absolute left-1.5 text-[9px] font-bold text-amber-400 font-mono">◀</span>
      <span className="absolute right-1.5 text-[9px] font-bold text-amber-400 font-mono">▶</span>

      {/* Guide crosshair lines */}
      <div className="absolute w-full h-[1px] bg-amber-500/20" />
      <div className="absolute h-full w-[1px] bg-amber-500/20" />

      {/* Center Analog Thumb Knob */}
      <div
        className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 border-2 border-stone-950 shadow-lg flex items-center justify-center transform transition-transform duration-75 active:scale-105"
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
        }}
      >
        <div className="w-4 h-4 rounded-full bg-stone-950/40 border border-stone-950/60" />
      </div>
    </div>
  );
};
