import React, { useRef, useState } from 'react';

interface Props {
  onMove: (vx: number, vy: number) => void;
}

export const TouchJoystick: React.FC<Props> = ({ onMove }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isPointerDown, setIsPointerDown] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsPointerDown(true);
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown && e.type !== 'pointerdown') return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    let dx = e.clientX - rect.left - centerX;
    let dy = e.clientY - rect.top - centerY;

    const dist = Math.hypot(dx, dy);
    const maxRadius = 40;

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setKnobPos({ x: dx, y: dy });
    onMove(dx / maxRadius, dy / maxRadius);
  };

  const handlePointerUp = () => {
    setIsPointerDown(false);
    setKnobPos({ x: 0, y: 0 });
    onMove(0, 0);
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-28 h-28 rounded-full bg-slate-900/15 backdrop-blur-xs border-2 border-slate-300/40 flex items-center justify-center touch-none select-none shadow-inner"
    >
      <div
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
        }}
        className="w-12 h-12 rounded-full bg-white/90 border border-slate-300 shadow-md flex items-center justify-center transition-transform duration-75"
      >
        <div className="w-4 h-4 rounded-full bg-slate-400/50" />
      </div>
    </div>
  );
};
