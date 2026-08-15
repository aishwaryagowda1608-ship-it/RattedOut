import React, { useState } from 'react';
import { Player, SecurityCamera } from '../types';
import { SECURITY_CAMERAS, PLAYER_COLORS } from '../utils/mapData';
import { sound } from '../utils/audio';
import { Video, ChevronLeft, ChevronRight, X, Circle } from 'lucide-react';

interface Props {
  players: Player[];
  onClose: () => void;
}

export const SecurityConsole: React.FC<Props> = ({ players, onClose }) => {
  const [selectedCamIndex, setSelectedCamIndex] = useState(0);
  const currentCam: SecurityCamera = SECURITY_CAMERAS[selectedCamIndex];

  const handleNext = () => {
    sound.playClick();
    setSelectedCamIndex((prev) => (prev + 1) % SECURITY_CAMERAS.length);
  };

  const handlePrev = () => {
    sound.playClick();
    setSelectedCamIndex((prev) => (prev - 1 + SECURITY_CAMERAS.length) % SECURITY_CAMERAS.length);
  };

  // Find players within range of this camera
  const playersInCam = players.filter((p) => {
    if (p.isVenting) return false;
    const dist = Math.hypot(p.x - currentCam.x, p.y - currentCam.y);
    return dist < 180;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-slate-950 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              CCTV Surveillance Feed — [CAM #{selectedCamIndex + 1}]
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Monitor Frame */}
        <div className="relative w-full h-72 bg-radial from-slate-900 via-slate-950 to-black rounded-2xl border-2 border-slate-800 overflow-hidden flex flex-col justify-between p-4">
          {/* Scanline CRT overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none opacity-40 animate-pulse" />

          {/* Top HUD */}
          <div className="flex justify-between items-center text-xs font-mono text-cyan-400 z-10">
            <div className="flex items-center gap-2">
              <Circle className="w-3 h-3 fill-rose-500 text-rose-500 animate-pulse" />
              <span className="font-bold tracking-wider">REC: {currentCam.name}</span>
            </div>
            <span>STATION://SKELD_FEED</span>
          </div>

          {/* Camera Viewport: Visual rendering of hallway & players */}
          <div className="relative flex-1 my-2 flex items-center justify-center border border-slate-800/80 rounded-xl bg-slate-900/60 overflow-hidden">
            {/* Grid Floor */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415515_1px,transparent_1px),linear-gradient(to_bottom,#33415515_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Hallway walls outline */}
            <div className="w-3/4 h-28 border-2 border-dashed border-slate-700/60 rounded-xl flex items-center justify-center relative">
              <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                {currentCam.room}
              </span>

              {/* Players in view */}
              <div className="absolute inset-0 flex items-center justify-center gap-6">
                {playersInCam.map((p) => {
                  const colorDef = PLAYER_COLORS[p.color];
                  return (
                    <div key={p.id} className="flex flex-col items-center animate-bounce duration-700">
                      <div
                        className="w-7 h-9 rounded-lg relative flex items-center justify-center shadow-xs"
                        style={{ backgroundColor: colorDef.primary }}
                      >
                        <div
                          className="w-3.5 h-2 rounded-full absolute top-1.5 right-1"
                          style={{ backgroundColor: colorDef.visor }}
                        />
                      </div>
                      <span className="text-[9px] font-mono font-bold text-slate-300 mt-1">
                        {p.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {playersInCam.length === 0 && (
              <span className="text-xs font-mono text-slate-500 absolute bottom-3">
                No active motion detected in zone.
              </span>
            )}
          </div>

          {/* Bottom HUD info */}
          <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 z-10">
            <span>COORDS: X:{currentCam.x} Y:{currentCam.y}</span>
            <span>FPS: 30.0 / PROTOCOL STREAM</span>
          </div>
        </div>

        {/* Cam Switcher Controls */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={handlePrev}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-mono font-bold rounded-xl transition-transform"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev Cam</span>
          </button>

          <div className="flex gap-2">
            {SECURITY_CAMERAS.map((cam, idx) => (
              <button
                key={cam.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedCamIndex(idx);
                }}
                className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition-all ${
                  selectedCamIndex === idx
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_#06b6d4]'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-mono font-bold rounded-xl transition-transform"
          >
            <span>Next Cam</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
