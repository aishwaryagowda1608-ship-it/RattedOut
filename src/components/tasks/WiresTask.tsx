import React, { useState, useRef, useEffect } from 'react';
import { sound } from '../../utils/audio';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

interface WireColor {
  id: string;
  name: string;
  color: string;
  darkColor: string;
}

const WIRE_COLORS: WireColor[] = [
  { id: 'red', name: 'Red', color: '#EF4444', darkColor: '#B91C1C' },
  { id: 'blue', name: 'Blue', color: '#3B82F6', darkColor: '#1D4ED8' },
  { id: 'yellow', name: 'Yellow', color: '#F59E0B', darkColor: '#B45309' },
  { id: 'magenta', name: 'Magenta', color: '#EC4899', darkColor: '#BE185D' },
];

export const WiresTask: React.FC<Props> = ({ onComplete, onClose }) => {
  const [leftOrder, setLeftOrder] = useState<WireColor[]>([]);
  const [rightOrder, setRightOrder] = useState<WireColor[]>([]);
  const [connections, setConnections] = useState<Record<string, string>>({}); // leftId -> rightId
  const [activeWire, setActiveWire] = useState<{ id: string; startY: number; currentX: number; currentY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Shuffle right order
    const left = [...WIRE_COLORS];
    const right = [...WIRE_COLORS].sort(() => Math.random() - 0.5);
    setLeftOrder(left);
    setRightOrder(right);
  }, []);

  const handlePointerDown = (wire: WireColor, index: number, e: React.PointerEvent) => {
    if (connections[wire.id]) return; // already connected
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    sound.playClick();
    const startY = 60 + index * 68;
    setActiveWire({
      id: wire.id,
      startY,
      currentX: e.clientX - rect.left,
      currentY: e.clientY - rect.top,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeWire) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setActiveWire((prev) =>
      prev
        ? {
            ...prev,
            currentX: e.clientX - rect.left,
            currentY: e.clientY - rect.top,
          }
        : null
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!activeWire) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      setActiveWire(null);
      return;
    }

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if mouse is near any right terminal
    const rightTerminalX = rect.width - 50;
    if (mouseX > rightTerminalX - 60) {
      rightOrder.forEach((rWire, idx) => {
        const targetY = 60 + idx * 68;
        if (Math.abs(mouseY - targetY) < 35) {
          if (rWire.id === activeWire.id) {
            // Correct connection!
            sound.playClick();
            const newConn = { ...connections, [activeWire.id]: rWire.id };
            setConnections(newConn);

            if (Object.keys(newConn).length === 4) {
              sound.playTaskComplete();
              setTimeout(() => {
                onComplete();
              }, 400);
            }
          } else {
            sound.playError();
          }
        }
      });
    }

    setActiveWire(null);
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative w-full h-[360px] bg-[#F1F5F9] rounded-2xl p-6 border border-[#E2E8F0] shadow-sm select-none touch-none overflow-hidden"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Task Terminal</span>
          <h3 className="text-base font-bold text-[#0F172A]">Electrical: Connect Matching Wires</h3>
        </div>
        <div className="text-xs font-mono font-bold bg-[#E2E8F0] text-[#334155] px-2.5 py-1 rounded-full">
          {Object.keys(connections).length} / 4 Connected
        </div>
      </div>

      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {/* Render already established connections */}
        {Object.entries(connections).map(([leftId, rightId]) => {
          const leftIdx = leftOrder.findIndex((w) => w.id === leftId);
          const rightIdx = rightOrder.findIndex((w) => w.id === rightId);
          const wire = WIRE_COLORS.find((w) => w.id === leftId);
          if (leftIdx === -1 || rightIdx === -1 || !wire) return null;

          const startX = 64;
          const startY = 100 + leftIdx * 68;
          const endX = (containerRef.current?.clientWidth || 400) - 64;
          const endY = 100 + rightIdx * 68;

          return (
            <path
              key={leftId}
              d={`M ${startX} ${startY} C ${(startX + endX) / 2} ${startY}, ${(startX + endX) / 2} ${endY}, ${endX} ${endY}`}
              stroke={wire.color}
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />
          );
        })}

        {/* Render currently dragged wire */}
        {activeWire && (
          <path
            d={`M 64 ${100 + leftOrder.findIndex((w) => w.id === activeWire.id) * 68} C ${activeWire.currentX / 2 + 32} ${
              100 + leftOrder.findIndex((w) => w.id === activeWire.id) * 68
            }, ${activeWire.currentX} ${activeWire.currentY}, ${activeWire.currentX} ${activeWire.currentY}`}
            stroke={WIRE_COLORS.find((w) => w.id === activeWire.id)?.color || '#333'}
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>

      {/* Left Terminals */}
      <div className="absolute left-6 top-[88px] flex flex-col gap-9 z-20">
        {leftOrder.map((wire, idx) => {
          const isConnected = !!connections[wire.id];
          return (
            <div
              key={wire.id}
              onPointerDown={(e) => handlePointerDown(wire, idx, e)}
              className={`w-10 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-transform ${
                isConnected ? 'opacity-80' : 'hover:scale-105 active:scale-95 shadow-sm'
              }`}
              style={{ backgroundColor: wire.color }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-white/70" />
            </div>
          );
        })}
      </div>

      {/* Right Terminals */}
      <div className="absolute right-6 top-[88px] flex flex-col gap-9 z-20">
        {rightOrder.map((wire) => {
          const isConnected = Object.values(connections).includes(wire.id);
          return (
            <div
              key={wire.id}
              className={`w-10 h-8 rounded-lg flex items-center justify-center ${
                isConnected ? 'opacity-80 ring-2 ring-emerald-500' : 'shadow-sm'
              }`}
              style={{ backgroundColor: wire.color }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-white/70" />
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center text-xs text-[#64748B]">
        <span>Drag from left terminals to matching color on the right.</span>
        <button
          onClick={onClose}
          className="text-xs text-[#475569] hover:text-[#0F172A] font-medium underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
