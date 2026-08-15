import React from 'react';
import { SabotageState, SabotageType } from '../types';
import { sound } from '../utils/audio';
import { Wind, Flame, Lightbulb, Radio, X } from 'lucide-react';

interface Props {
  sabotage: SabotageState;
  onTriggerSabotage: (type: SabotageType) => void;
  onClose: () => void;
}

export const SabotagePanel: React.FC<Props> = ({ sabotage, onTriggerSabotage, onClose }) => {
  const isAnyActive = sabotage.activeType !== null;

  const handleSelect = (type: SabotageType) => {
    if (isAnyActive) return;
    sound.playClick();
    onTriggerSabotage(type);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-rose-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 font-mono">
              IMPOSTOR PROTOCOL
            </span>
            <h3 className="text-lg font-bold text-[#0F172A]">Sabotage Station Systems</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isAnyActive && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            <span>Sabotage currently active: <strong>{sabotage.activeType}</strong></span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Oxygen */}
          <button
            disabled={isAnyActive}
            onClick={() => handleSelect('OXYGEN')}
            className="p-4 rounded-2xl border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 flex flex-col items-center gap-2 text-center transition-all disabled:opacity-50 active:scale-95 group"
          >
            <div className="w-12 h-12 rounded-xl bg-rose-100 group-hover:bg-rose-200 text-rose-600 flex items-center justify-center transition-colors">
              <Wind className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 block">Deplete Oxygen</span>
              <span className="text-[11px] text-slate-500">30s critical countdown</span>
            </div>
          </button>

          {/* Reactor */}
          <button
            disabled={isAnyActive}
            onClick={() => handleSelect('REACTOR')}
            className="p-4 rounded-2xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 flex flex-col items-center gap-2 text-center transition-all disabled:opacity-50 active:scale-95 group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 group-hover:bg-amber-200 text-amber-600 flex items-center justify-center transition-colors">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 block">Reactor Meltdown</span>
              <span className="text-[11px] text-slate-500">25s countdown, dual hand</span>
            </div>
          </button>

          {/* Lights */}
          <button
            disabled={isAnyActive}
            onClick={() => handleSelect('LIGHTS')}
            className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 flex flex-col items-center gap-2 text-center transition-all disabled:opacity-50 active:scale-95 group"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 text-indigo-600 flex items-center justify-center transition-colors">
              <Lightbulb className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 block">Cut Electrical</span>
              <span className="text-[11px] text-slate-500">Reduces crew vision</span>
            </div>
          </button>

          {/* Comms */}
          <button
            disabled={isAnyActive}
            onClick={() => handleSelect('COMMS')}
            className="p-4 rounded-2xl border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/50 flex flex-col items-center gap-2 text-center transition-all disabled:opacity-50 active:scale-95 group"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-100 group-hover:bg-cyan-200 text-cyan-600 flex items-center justify-center transition-colors">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 block">Jam Comms</span>
              <span className="text-[11px] text-slate-500">Disables cams & task HUD</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
