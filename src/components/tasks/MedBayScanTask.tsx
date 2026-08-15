import React, { useState, useEffect } from 'react';
import { sound } from '../../utils/audio';
import { Player } from '../../types';
import { Activity, ShieldCheck } from 'lucide-react';

interface Props {
  player: Player;
  onComplete: () => void;
  onClose: () => void;
}

export const MedBayScanTask: React.FC<Props> = ({ player, onComplete, onClose }) => {
  const [scanProgress, setScanProgress] = useState(0); // 0 to 100
  const [secondsLeft, setSecondsLeft] = useState(8);

  useEffect(() => {
    sound.playClick();
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        const next = prev + 12.5;
        if (next >= 100) {
          clearInterval(interval);
          sound.playTaskComplete();
          setTimeout(() => {
            onComplete();
          }, 600);
          return 100;
        }
        return next;
      });
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="relative w-full h-[380px] bg-[#F8FAFC] rounded-2xl p-6 border border-[#E2E8F0] shadow-sm select-none flex flex-col justify-between overflow-hidden">
      <div className="flex justify-between items-center z-10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Biometric Scanner</span>
          <h3 className="text-base font-bold text-[#0F172A]">MedBay: Full Body Bio-Scan</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold bg-cyan-50 border border-cyan-200 text-cyan-800 px-3 py-1 rounded-full">
          <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-600" />
          <span>{secondsLeft > 0 ? `${secondsLeft}s Remaining` : 'Scan Complete'}</span>
        </div>
      </div>

      {/* Holographic scanner viewport */}
      <div className="relative w-full max-w-sm mx-auto h-48 bg-radial from-cyan-50/70 to-slate-100/50 rounded-2xl border border-cyan-200/80 p-4 flex items-center justify-between my-auto overflow-hidden">
        {/* Animated Scan Line */}
        <div
          style={{ top: `${scanProgress}%` }}
          className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_12px_#22d3ee] transition-all duration-300 pointer-events-none z-20"
        />

        {/* Astronaut Hologram Silhouette */}
        <div className="w-28 h-36 border border-dashed border-cyan-300 rounded-2xl flex flex-col items-center justify-center bg-white/60 backdrop-blur-xs relative z-10">
          <div className="w-12 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-500 flex items-center justify-center relative mb-1">
            <div className="w-6 h-4 bg-cyan-200 rounded-full border border-cyan-400" />
          </div>
          <div className="text-[10px] font-mono font-bold text-cyan-700 uppercase">{player.name}</div>
        </div>

        {/* Telemetry data readouts */}
        <div className="flex-1 pl-6 flex flex-col gap-2 font-mono text-xs text-[#334155] z-10">
          <div>
            <span className="text-[10px] text-[#64748B] block">ID NUMBER</span>
            <span className="font-bold">#PROT-{player.id.slice(-4).toUpperCase()}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-[#64748B] block">BLOOD TYPE</span>
              <span className="font-bold text-emerald-600">O+ (NORMAL)</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] block">WEIGHT</span>
              <span className="font-bold">92 LBS</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] block">STATUS</span>
            <span className="font-bold text-cyan-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
              {scanProgress >= 100 ? 'CLEARED / CREW' : 'SCANNING...'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-[#E2E8F0] text-xs text-[#64748B]">
        <span>Stand completely still on the scanner pad.</span>
        <button
          onClick={onClose}
          className="text-xs text-[#64748B] hover:text-[#0F172A] font-medium underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
