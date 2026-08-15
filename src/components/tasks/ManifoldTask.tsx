import React, { useState, useEffect } from 'react';
import { sound } from '../../utils/audio';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

export const ManifoldTask: React.FC<Props> = ({ onComplete, onClose }) => {
  const [numbers, setNumbers] = useState<number[]>([]);
  const [nextExpected, setNextExpected] = useState<number>(1);
  const [pressed, setPressed] = useState<number[]>([]);

  useEffect(() => {
    // Generate numbers 1 to 10 in random order
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].sort(() => Math.random() - 0.5);
    setNumbers(arr);
  }, []);

  const handleClick = (num: number) => {
    if (pressed.includes(num)) return;

    if (num === nextExpected) {
      sound.playClick();
      const newPressed = [...pressed, num];
      setPressed(newPressed);

      if (num === 10) {
        sound.playTaskComplete();
        setTimeout(() => {
          onComplete();
        }, 350);
      } else {
        setNextExpected(num + 1);
      }
    } else {
      // Mistake! Reset
      sound.playError();
      setPressed([]);
      setNextExpected(1);
    }
  };

  return (
    <div className="relative w-full h-[360px] bg-[#F8FAFC] rounded-2xl p-6 border border-[#E2E8F0] shadow-sm select-none flex flex-col justify-between">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Reactor Subsystem</span>
          <h3 className="text-base font-bold text-[#0F172A]">Reactor: Unlock Manifolds (1 → 10)</h3>
        </div>
        <div className="text-xs font-mono font-bold bg-[#E2E8F0] text-[#334155] px-3 py-1 rounded-full">
          Next: <span className="text-indigo-600 font-extrabold">{nextExpected}</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 max-w-sm mx-auto my-auto w-full">
        {numbers.map((num) => {
          const isPressed = pressed.includes(num);
          return (
            <button
              key={num}
              onClick={() => handleClick(num)}
              className={`h-16 rounded-xl text-lg font-mono font-bold flex items-center justify-center transition-all ${
                isPressed
                  ? 'bg-[#10B981] text-white shadow-inner scale-95 opacity-90'
                  : 'bg-white border-2 border-[#CBD5E1] text-[#1E293B] hover:border-[#6366F1] hover:bg-[#EEF2FF] shadow-xs active:scale-95'
              }`}
            >
              {num}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-[#E2E8F0] text-xs text-[#64748B]">
        <span>Tap the digits in sequential numerical order from 1 to 10.</span>
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
