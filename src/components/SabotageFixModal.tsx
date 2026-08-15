import React, { useState } from 'react';
import { SabotageState } from '../types';
import { sound } from '../utils/audio';
import { Lightbulb, Radio, Flame, Wind, X, CheckCircle2 } from 'lucide-react';

interface Props {
  sabotage: SabotageState;
  onFixSabotage: () => void;
  onClose: () => void;
}

export const SabotageFixModal: React.FC<Props> = ({ sabotage, onFixSabotage, onClose }) => {
  // Oxygen code state
  const [pinInput, setPinInput] = useState('');
  const o2TargetCode = sabotage.oxygenCodes.station1 || '58291';

  // Lights switches state (5 switches)
  const [switches, setSwitches] = useState<boolean[]>(sabotage.lightSwitches || [false, true, false, false, true]);

  // Reactor hand press
  const [holdingReactor, setHoldingReactor] = useState(false);
  const [reactorProgress, setReactorProgress] = useState(0);

  // Comms frequency state
  const [frequency, setFrequency] = useState(50);
  const targetFrequency = sabotage.commsFrequency.target || 72;

  // Handle O2 pin digit click
  const handleDigit = (digit: string) => {
    sound.playClick();
    if (pinInput.length < 5) {
      const next = pinInput + digit;
      setPinInput(next);
      if (next === o2TargetCode) {
        sound.playTaskComplete();
        setTimeout(() => {
          onFixSabotage();
        }, 400);
      } else if (next.length === 5) {
        sound.playError();
        setTimeout(() => setPinInput(''), 400);
      }
    }
  };

  // Handle light switch toggle
  const toggleLightSwitch = (index: number) => {
    sound.playClick();
    const updated = [...switches];
    updated[index] = !updated[index];
    setSwitches(updated);

    if (updated.every(Boolean)) {
      sound.playTaskComplete();
      setTimeout(() => {
        onFixSabotage();
      }, 400);
    }
  };

  // Handle Reactor hold
  const handleHoldStart = () => {
    sound.playClick();
    setHoldingReactor(true);
    let prog = 0;
    const interval = setInterval(() => {
      prog += 20;
      setReactorProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
        sound.playTaskComplete();
        setTimeout(() => {
          onFixSabotage();
        }, 400);
      }
    }, 200);

    const handleUp = () => {
      clearInterval(interval);
      setHoldingReactor(false);
      setReactorProgress(0);
      window.removeEventListener('pointerup', handleUp);
    };
    window.addEventListener('pointerup', handleUp);
  };

  // Handle Comms dial
  const handleFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setFrequency(val);
    if (Math.abs(val - targetFrequency) <= 2) {
      sound.playTaskComplete();
      setTimeout(() => {
        onFixSabotage();
      }, 400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-rose-300 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
            <h3 className="text-base font-bold text-rose-950 uppercase tracking-tight font-mono">
              Emergency Repair: {sabotage.activeType}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Oxygen Repair */}
        {sabotage.activeType === 'OXYGEN' && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center bg-amber-50 border border-amber-200 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-amber-900 text-xs font-semibold">
                <Wind className="w-4 h-4 text-amber-600" />
                <span>Station Passcode:</span>
              </div>
              <span className="font-mono text-base font-extrabold tracking-widest text-amber-950 bg-white px-2 py-0.5 rounded-md border border-amber-300 shadow-2xs">
                {o2TargetCode}
              </span>
            </div>

            {/* Display Screen */}
            <div className="h-12 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xl tracking-widest flex items-center justify-center border border-slate-800">
              {pinInput || '-----'}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDigit(d)}
                  className="py-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-mono font-bold rounded-xl text-base transition-colors"
                >
                  {d}
                </button>
              ))}
              <button
                onClick={() => setPinInput('')}
                className="py-3 bg-rose-100 text-rose-700 font-bold rounded-xl text-xs uppercase"
              >
                Clear
              </button>
              <button
                onClick={() => handleDigit('0')}
                className="py-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-mono font-bold rounded-xl text-base"
              >
                0
              </button>
              <div />
            </div>
          </div>
        )}

        {/* Lights Repair */}
        {sabotage.activeType === 'LIGHTS' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 p-3 rounded-xl">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Flip all 5 breaker switches up to restore main generator power.</span>
            </div>

            <div className="flex justify-between items-center gap-2 bg-slate-900 p-6 rounded-2xl border border-slate-800">
              {switches.map((isOn, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleLightSwitch(idx)}
                  className={`w-12 h-20 rounded-xl flex flex-col items-center justify-between p-2 transition-all ${
                    isOn
                      ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]'
                      : 'bg-slate-800 border border-slate-700'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isOn ? 'bg-white' : 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'
                    }`}
                  />
                  <div
                    className={`w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-mono text-xs font-bold text-white transition-transform ${
                      isOn ? '-translate-y-1' : 'translate-y-1 opacity-60'
                    }`}
                  >
                    {isOn ? 'ON' : 'OFF'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reactor Meltdown Repair */}
        {sabotage.activeType === 'REACTOR' && (
          <div className="flex flex-col gap-4 text-center">
            <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-xl text-left">
              <Flame className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Press and hold the biometric stabilization pad until the core synchronizes.</span>
            </div>

            <div className="my-4 flex flex-col items-center">
              <button
                onPointerDown={handleHoldStart}
                className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center transition-all ${
                  holdingReactor
                    ? 'border-emerald-500 bg-emerald-50 ring-8 ring-emerald-100 scale-95'
                    : 'border-amber-500 bg-amber-50 hover:bg-amber-100 shadow-md cursor-pointer'
                }`}
              >
                <Flame className={`w-10 h-10 ${holdingReactor ? 'text-emerald-600' : 'text-amber-600'}`} />
                <span className="text-[11px] font-mono font-bold mt-1 text-slate-800">
                  {holdingReactor ? `${reactorProgress}%` : 'HOLD PAD'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Comms Repair */}
        {sabotage.activeType === 'COMMS' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs text-cyan-900 bg-cyan-50 border border-cyan-200 p-3 rounded-xl">
              <Radio className="w-4 h-4 text-cyan-600" />
              <span>Tune the radio frequency dial until signal alignment locks.</span>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs font-mono text-cyan-400">
                <span>Signal Frequency</span>
                <span>{frequency} MHz</span>
              </div>

              {/* Waveform graphic */}
              <div className="h-16 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden relative">
                <div
                  style={{
                    opacity: 1 - Math.min(1, Math.abs(frequency - targetFrequency) / 25),
                  }}
                  className="absolute inset-0 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>SIGNAL CLEAN</span>
                </div>
                {/* Visual Sine Wave */}
                <div className="w-full h-8 border-b border-t border-cyan-500/30 flex items-center justify-around px-2">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        height: `${Math.abs(Math.sin((i + frequency / 10) * 0.8) * 24)}px`,
                      }}
                      className="w-1 bg-cyan-400 rounded-full transition-all"
                    />
                  ))}
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={frequency}
                onChange={handleFrequencyChange}
                className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer mt-2"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
