import React, { useState, useEffect } from 'react';
import { sound } from '../../utils/audio';
import { Compass, CheckCircle2 } from 'lucide-react';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

export const CalibrateTask: React.FC<Props> = ({ onComplete, onClose }) => {
  const [stage, setStage] = useState<number>(0); // 0, 1, 2 (3 rings to align)
  const [angles, setAngles] = useState<number[]>([0, 0, 0]);
  const [locked, setLocked] = useState<boolean[]>([false, false, false]);

  useEffect(() => {
    const speeds = [4, 6, 8];
    const interval = setInterval(() => {
      setAngles((prev) =>
        prev.map((ang, idx) => {
          if (locked[idx]) return ang;
          return (ang + speeds[idx]) % 360;
        })
      );
    }, 30);

    return () => clearInterval(interval);
  }, [locked]);

  const handleStopCurrentStage = () => {
    sound.playClick();
    const currentAngle = angles[stage];
    // Target is around 0 or 360 (top / right position, e.g. within 345 - 15 deg or 80 - 100 deg)
    // Let's say target is 90 deg (facing right towards node)
    const diff = Math.abs(currentAngle - 90);
    const isValid = diff < 28 || diff > 332;

    if (isValid) {
      sound.playClick();
      const updatedLocked = [...locked];
      updatedLocked[stage] = true;
      setLocked(updatedLocked);

      if (stage === 2) {
        sound.playTaskComplete();
        setTimeout(() => {
          onComplete();
        }, 500);
      } else {
        setStage(stage + 1);
      }
    } else {
      // Failed timing! Reset current stage
      sound.playError();
      const updatedLocked = [...locked];
      updatedLocked[stage] = false;
      setLocked(updatedLocked);
    }
  };

  return (
    <div className="relative w-full h-[370px] bg-[#F8FAFC] rounded-2xl p-6 border border-[#E2E8F0] shadow-sm select-none flex flex-col justify-between">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Core Synchronization</span>
          <h3 className="text-base font-bold text-[#0F172A]">Calibrate Distributor Rings</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
          <Compass className="w-3.5 h-3.5 text-indigo-600" />
          <span>Stage {stage + 1} / 3</span>
        </div>
      </div>

      {/* 3 Rings Visualizer */}
      <div className="flex items-center justify-center gap-8 my-auto">
        {[0, 1, 2].map((idx) => {
          const isCurrent = stage === idx;
          const isDone = locked[idx];
          return (
            <div key={idx} className="flex flex-col items-center gap-3">
              <div
                className={`relative w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all ${
                  isDone
                    ? 'border-emerald-500 bg-emerald-50 shadow-xs'
                    : isCurrent
                    ? 'border-indigo-500 bg-white ring-4 ring-indigo-100'
                    : 'border-slate-300 bg-slate-100 opacity-60'
                }`}
              >
                {/* Center dot */}
                <div className="w-4 h-4 rounded-full bg-slate-700" />

                {/* Rotating needle */}
                <div
                  style={{ transform: `rotate(${angles[idx]}deg)` }}
                  className="absolute w-full h-1 bg-transparent flex justify-end items-center pr-1"
                >
                  <div
                    className={`w-4 h-4 rounded-full ${
                      isDone ? 'bg-emerald-500' : isCurrent ? 'bg-indigo-600 shadow-xs' : 'bg-slate-400'
                    }`}
                  />
                </div>

                {/* Target node indicator on the right (90 deg) */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1.5 w-3 h-3 rounded-full border-2 border-slate-700 bg-white" />
              </div>

              {/* Status button */}
              {isDone ? (
                <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>SYNCED</span>
                </div>
              ) : isCurrent ? (
                <button
                  onClick={handleStopCurrentStage}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-xs transition-transform"
                >
                  LOCK #{idx + 1}
                </button>
              ) : (
                <span className="text-[11px] font-mono text-slate-400">WAITING</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-[#E2E8F0] text-xs text-[#64748B]">
        <span>Lock each ring when the rotating node aligns with the right marker.</span>
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
