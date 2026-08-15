import React, { useEffect } from 'react';
import { Player } from '../types';
import { PLAYER_COLORS } from '../utils/mapData';
import { sound } from '../utils/audio';
import { Shield, Skull, Sparkles } from 'lucide-react';

interface Props {
  player: Player;
  onFinished: () => void;
}

export const RoleReveal: React.FC<Props> = ({ player, onFinished }) => {
  const isImpostor = player.role.includes('IMPOSTOR');
  const colorDef = PLAYER_COLORS[player.color];

  useEffect(() => {
    sound.playEmergency();
    const timer = setTimeout(() => {
      onFinished();
    }, 3200);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A] text-white flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-300">
      <div className="text-center max-w-md w-full flex flex-col items-center">
        {/* Shhh prompt */}
        <span className="text-xs font-mono font-extrabold tracking-widest text-slate-400 uppercase mb-4 animate-pulse">
          CONFIDENTIAL ASSIGNMENT
        </span>

        {/* Big Role Title */}
        <h1
          className={`text-4xl md:text-5xl font-black tracking-tight mb-2 uppercase ${
            isImpostor ? 'text-rose-500' : 'text-sky-400'
          }`}
        >
          {isImpostor ? 'IMPOSTOR' : 'CREWMATE'}
        </h1>

        <p className="text-sm text-slate-300 font-medium mb-8">
          {isImpostor
            ? 'Eliminate the crew without being detected. Sabotage station systems.'
            : 'Complete all tasks or identify and eject all Impostors.'}
        </p>

        {/* Center Astronaut Capsule Avatar */}
        <div className="relative my-4 flex items-center justify-center">
          <div
            className="w-24 h-32 rounded-3xl border-3 border-slate-900 shadow-2xl flex items-center justify-center relative animate-bounce duration-1000"
            style={{ backgroundColor: colorDef.primary }}
          >
            {/* Backpack */}
            <div
              className="absolute -left-3 w-4 h-16 rounded-md"
              style={{ backgroundColor: colorDef.shadow }}
            />
            {/* Visor */}
            <div
              className="absolute top-5 right-2 w-14 h-10 rounded-xl border-2 border-slate-900 flex items-start justify-end p-1.5"
              style={{ backgroundColor: colorDef.visor }}
            >
              <div className="w-4 h-1.5 bg-white rounded-full opacity-90" />
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs font-mono text-slate-400">
          Syncing protocol simulation...
        </div>
      </div>
    </div>
  );
};
