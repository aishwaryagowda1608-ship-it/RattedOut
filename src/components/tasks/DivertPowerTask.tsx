import React, { useState } from 'react';
import { sound } from '../../utils/audio';
import { Sliders, Zap } from 'lucide-react';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

export const DivertPowerTask: React.FC<Props> = ({ onComplete, onClose }) => {
  const [sliderValue, setSliderValue] = useState(0); // 0 to 100
  const [switches, setSwitches] = useState<boolean[]>([false, false, true, false, false]);
  const activeSwitchIndex = 1; // the second one needs to be pushed up

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderValue(val);
    if (val >= 98) {
      sound.playClick();
    }
  };

  const toggleSwitch = (index: number) => {
    sound.playClick();
    const updated = [...switches];
    updated[index] = !updated[index];
    setSwitches(updated);

    // Check if the target slider and switches are satisfied
    if (updated[activeSwitchIndex] && sliderValue >= 90) {
      sound.playTaskComplete();
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  };

  return (
    <div className="relative w-full h-[360px] bg-[#F8FAFC] rounded-2xl p-6 border border-[#E2E8F0] shadow-sm select-none flex flex-col justify-between">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Power Grid</span>
          <h3 className="text-base font-bold text-[#0F172A]">Electrical: Divert Power to Subsystems</h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full">
          <Zap className="w-3.5 h-3.5 text-amber-600" />
          <span>Output: {sliderValue}%</span>
        </div>
      </div>

      <div className="my-auto max-w-sm mx-auto w-full flex flex-col gap-6">
        {/* Main Slider */}
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-2xs">
          <div className="flex justify-between text-xs font-medium text-[#475569] mb-2">
            <span>Primary Core Output</span>
            <span className="font-mono font-bold text-indigo-600">{sliderValue}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={handleSliderChange}
            className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* Node Switches */}
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-2xs">
          <span className="text-xs font-medium text-[#475569] block mb-3">
            Engage Target Subsystem Relay (Relay #2)
          </span>
          <div className="flex justify-between items-center gap-2">
            {switches.map((isOn, idx) => (
              <button
                key={idx}
                onClick={() => toggleSwitch(idx)}
                className={`flex-1 py-3 rounded-lg text-xs font-mono font-bold border transition-all ${
                  isOn
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                R{idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-[#E2E8F0] text-xs text-[#64748B]">
        <span>Raise power slider to 100% and activate target relay switch.</span>
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
