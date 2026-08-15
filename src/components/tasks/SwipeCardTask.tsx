import React, { useState, useRef } from 'react';
import { sound } from '../../utils/audio';
import { CreditCard, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

export const SwipeCardTask: React.FC<Props> = ({ onComplete, onClose }) => {
  const [cardTaken, setCardTaken] = useState(false);
  const [cardX, setCardX] = useState(0); // 0 to 1 progress (0 to max)
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'SWIPING' | 'ACCEPTED' | 'TOO_FAST' | 'TOO_SLOW' | 'BAD_READ'>('IDLE');
  const [message, setMessage] = useState('Please insert / swipe ID card.');
  
  const startTimeRef = useRef<number>(0);
  const dragStartRef = useRef<number>(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const takeCard = () => {
    sound.playClick();
    setCardTaken(true);
    setCardX(0);
    setStatus('SWIPING');
    setMessage('Swipe card across reader at a steady speed.');
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!cardTaken || status === 'ACCEPTED') return;
    setIsDragging(true);
    startTimeRef.current = Date.now();
    dragStartRef.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !trackRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const trackWidth = trackRect.width - 90; // card width offset

    let currentX = e.clientX - trackRect.left;
    if (currentX < 0) currentX = 0;
    if (currentX > trackWidth) currentX = trackWidth;

    setCardX(currentX);
  };

  const handlePointerUp = () => {
    if (!isDragging || !trackRef.current) return;
    setIsDragging(false);

    const trackWidth = trackRef.current.clientWidth - 90;
    const swipeDuration = (Date.now() - startTimeRef.current) / 1000;
    const completionRatio = cardX / trackWidth;

    if (completionRatio < 0.85) {
      sound.playError();
      setStatus('BAD_READ');
      setMessage('Bad read. Try again.');
      setCardX(0);
    } else if (swipeDuration < 0.35) {
      sound.playError();
      setStatus('TOO_FAST');
      setMessage('Too fast! Swipe with steady speed.');
      setCardX(0);
    } else if (swipeDuration > 1.3) {
      sound.playError();
      setStatus('TOO_SLOW');
      setMessage('Too slow! Try again.');
      setCardX(0);
    } else {
      // SUCCESS!
      sound.playSwipe();
      sound.playTaskComplete();
      setStatus('ACCEPTED');
      setMessage('Accepted. Biometrics verified.');
      setTimeout(() => {
        onComplete();
      }, 600);
    }
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative w-full h-[380px] bg-[#F8FAFC] rounded-2xl p-6 border border-[#E2E8F0] shadow-sm select-none touch-none overflow-hidden flex flex-col justify-between"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Security Terminal</span>
          <h3 className="text-base font-bold text-[#0F172A]">Admin: Swipe ID Card</h3>
        </div>
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
            status === 'ACCEPTED'
              ? 'bg-emerald-100 text-emerald-800'
              : status === 'TOO_FAST' || status === 'TOO_SLOW' || status === 'BAD_READ'
              ? 'bg-rose-100 text-rose-800'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {status === 'ACCEPTED' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : status === 'TOO_FAST' || status === 'TOO_SLOW' || status === 'BAD_READ' ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          ) : (
            <CreditCard className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span>{message}</span>
        </div>
      </div>

      {/* Reader Slot Track */}
      <div className="my-auto">
        <div className="text-xs font-medium text-[#64748B] mb-2 flex justify-between">
          <span>Card Reader Terminal (Magnetic Strip)</span>
          <span className="font-mono text-[11px]">OPTIMAL: 0.5s – 1.0s</span>
        </div>

        <div
          ref={trackRef}
          className="relative w-full h-24 bg-[#E2E8F0] rounded-xl border border-[#CBD5E1] p-2 flex items-center overflow-hidden"
        >
          {/* LED light */}
          <div className="absolute right-3 top-3 flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-mono text-[#64748B]">STATUS</span>
            <div
              className={`w-3 h-3 rounded-full transition-colors ${
                status === 'ACCEPTED'
                  ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                  : status === 'TOO_FAST' || status === 'TOO_SLOW' || status === 'BAD_READ'
                  ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
          </div>

          {/* Reader middle groove line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 bg-[#CBD5E1] rounded" />

          {/* Draggable Card inside reader */}
          {cardTaken && (
            <div
              onPointerDown={handlePointerDown}
              style={{ transform: `translateX(${cardX}px)` }}
              className={`absolute top-2.5 h-[72px] w-[88px] rounded-lg bg-gradient-to-br from-[#0284C7] to-[#0369A1] text-white p-2 flex flex-col justify-between shadow-md cursor-grab active:cursor-grabbing transition-transform ${
                isDragging ? 'scale-105' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <Sparkles className="w-3 h-3 text-cyan-200" />
                <span className="text-[9px] font-mono font-bold tracking-tighter opacity-80">HAZEL-ID</span>
              </div>
              <div>
                <div className="w-6 h-1.5 bg-amber-300 rounded-sm mb-1" />
                <div className="text-[8px] font-mono tracking-tight text-cyan-100">PROTOCOL AGENT</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Area (Bottom) */}
      <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
        {!cardTaken ? (
          <button
            onClick={takeCard}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#CBD5E1] hover:border-[#0284C7] hover:bg-[#F0F9FF] text-[#0F172A] rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <CreditCard className="w-4 h-4 text-[#0284C7]" />
            <span>Tap to pull ID card from pocket</span>
          </button>
        ) : (
          <div className="text-xs text-[#64748B]">
            Drag the blue card from the left to the right end of the slot.
          </div>
        )}

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
