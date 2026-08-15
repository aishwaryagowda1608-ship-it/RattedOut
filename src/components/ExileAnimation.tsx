import React, { useEffect } from 'react';
import { Player } from '../types';
import { PLAYER_COLORS } from '../utils/mapData';
import { sound } from '../utils/audio';

interface Props {
  ejectedPlayer: Player | null | 'TIE' | 'SKIP';
  impostorsRemaining: number;
  onFinished: () => void;
}

export const ExileAnimation: React.FC<Props> = ({
  ejectedPlayer,
  impostorsRemaining,
  onFinished,
}) => {
  const isSkipOrTie = ejectedPlayer === 'SKIP' || ejectedPlayer === 'TIE' || !ejectedPlayer;
  const isPlayerObj = typeof ejectedPlayer === 'object' && ejectedPlayer !== null;
  const colorDef = isPlayerObj ? PLAYER_COLORS[ejectedPlayer.color] : null;

  useEffect(() => {
    sound.playEmergency();
    const timer = setTimeout(() => {
      onFinished();
    }, 3800);
    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0F1D] text-white flex flex-col items-center justify-center p-6 select-none overflow-hidden animate-in fade-in duration-300">
      {/* Starry space dots */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Floating ejected astronaut */}
      {isPlayerObj && colorDef && (
        <div className="relative mb-8 animate-[spin_6s_linear_infinite]">
          <div
            className="w-20 h-28 rounded-2xl border-2 border-slate-900 flex items-center justify-center relative shadow-2xl"
            style={{ backgroundColor: colorDef.primary }}
          >
            <div
              className="absolute -left-2.5 w-3 h-14 rounded-sm"
              style={{ backgroundColor: colorDef.shadow }}
            />
            <div
              className="absolute top-4 right-1.5 w-11 h-8 rounded-lg border border-slate-900"
              style={{ backgroundColor: colorDef.visor }}
            />
          </div>
        </div>
      )}

      {/* Result Text */}
      <div className="text-center z-10 max-w-lg">
        {isSkipOrTie ? (
          <h2 className="text-2xl font-bold text-slate-200">
            {ejectedPlayer === 'TIE' ? 'Tie in voting. No one was ejected.' : 'No one was ejected. (Skipped)'}
          </h2>
        ) : (
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
              {ejectedPlayer.name} was ejected.
            </h2>
            <p className="text-sm font-mono text-slate-400">
              {ejectedPlayer.role.includes('IMPOSTOR')
                ? `${ejectedPlayer.name} was An Impostor.`
                : `${ejectedPlayer.name} was not An Impostor.`}
            </p>
          </div>
        )}

        <div className="mt-6 text-xs font-mono font-bold text-indigo-400 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800 inline-block">
          {impostorsRemaining} Impostor{impostorsRemaining !== 1 ? 's' : ''} remain.
        </div>
      </div>
    </div>
  );
};
