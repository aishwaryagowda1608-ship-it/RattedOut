import React, { useEffect } from 'react';
import { Player } from '../types';
import { PLAYER_COLORS } from '../utils/mapData';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Trophy, Skull, RotateCcw, Shield, CheckCircle2 } from 'lucide-react';

interface Props {
  winner: 'CREW' | 'IMPOSTORS';
  reason: string;
  players: Player[];
  localPlayer: Player;
  onPlayAgain: () => void;
}

export const GameOver: React.FC<Props> = ({
  winner,
  reason,
  players,
  localPlayer,
  onPlayAgain,
}) => {
  const isLocalImpostor = localPlayer.role.includes('IMPOSTOR');
  const isLocalWinner = (winner === 'CREW' && !isLocalImpostor) || (winner === 'IMPOSTORS' && isLocalImpostor);

  useEffect(() => {
    sound.playFanfare(isLocalWinner);
    if (isLocalWinner) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isLocalWinner]);

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-6 select-none animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl flex flex-col items-center text-center">
        {/* Victory/Defeat Icon */}
        <div
          className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-4 ${
            isLocalWinner
              ? 'bg-emerald-100 text-emerald-600 shadow-sm'
              : 'bg-rose-100 text-rose-600 shadow-sm'
          }`}
        >
          {isLocalWinner ? <Trophy className="w-8 h-8" /> : <Skull className="w-8 h-8" />}
        </div>

        {/* Title */}
        <h1
          className={`text-3xl md:text-4xl font-black tracking-tight uppercase mb-2 ${
            winner === 'CREW' ? 'text-indigo-600' : 'text-rose-600'
          }`}
        >
          {winner === 'CREW' ? 'Crewmate Victory' : 'Impostor Victory'}
        </h1>

        <p className="text-sm font-medium text-slate-600 mb-6">{reason}</p>

        {/* Impostor Reveal Manifest */}
        <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 block mb-3">
            Impostors Revealed
          </span>

          <div className="flex flex-wrap justify-center gap-3">
            {players
              .filter((p) => p.role.includes('IMPOSTOR'))
              .map((p) => {
                const colorDef = PLAYER_COLORS[p.color];
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: colorDef.primary }}
                    />
                    <span className="text-xs font-bold text-rose-950">{p.name}</span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            sound.playClick();
            onPlayAgain();
          }}
          className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-sm font-bold rounded-2xl shadow-sm transition-transform"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Play Again</span>
        </button>
      </div>
    </div>
  );
};
