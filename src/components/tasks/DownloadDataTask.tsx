import React, { useState, useEffect } from 'react';
import { sound } from '../../utils/audio';
import { Download, CheckCircle2, FileCode2, HardDrive } from 'lucide-react';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

export const DownloadDataTask: React.FC<Props> = ({ onComplete, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [speed, setSpeed] = useState(0); // KB/s

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (downloading && progress < 100) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + (Math.random() * 4 + 2);
          setSpeed(Math.floor(Math.random() * 80 + 320));
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
      }, 150);
    }
    return () => clearInterval(interval);
  }, [downloading, progress, onComplete]);

  const startDownload = () => {
    sound.playClick();
    setDownloading(true);
  };

  return (
    <div className="relative w-full h-[360px] bg-[#F8FAFC] rounded-2xl p-6 border border-[#E2E8F0] shadow-sm select-none flex flex-col justify-between">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Data Uplink</span>
          <h3 className="text-base font-bold text-[#0F172A]">Terminal: Download Protocol Telemetry</h3>
        </div>
        <div className="text-xs font-mono font-bold bg-[#E2E8F0] text-[#334155] px-3 py-1 rounded-full">
          {progress.toFixed(0)}% Completed
        </div>
      </div>

      <div className="my-auto max-w-md mx-auto w-full flex flex-col items-center">
        {/* Animated file transfer visual */}
        <div className="flex items-center justify-between w-full mb-6 px-8">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <HardDrive className="w-7 h-7" />
            </div>
            <span className="text-[11px] font-mono font-medium text-[#64748B]">STATION_SRC</span>
          </div>

          {/* Transfer packets */}
          <div className="flex-1 flex items-center justify-center px-4 relative">
            <div className="w-full h-1 bg-[#E2E8F0] rounded-full overflow-hidden">
              {downloading && (
                <div
                  style={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 transition-all duration-150"
                />
              )}
            </div>
            {downloading && progress < 100 && (
              <div className="absolute animate-bounce text-indigo-600">
                <FileCode2 className="w-5 h-5" />
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-xs transition-colors ${
                progress === 100
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              {progress === 100 ? <CheckCircle2 className="w-7 h-7" /> : <HardDrive className="w-7 h-7" />}
            </div>
            <span className="text-[11px] font-mono font-medium text-[#64748B]">LOCAL_MEM</span>
          </div>
        </div>

        {/* Action button or progress stats */}
        {!downloading ? (
          <button
            onClick={startDownload}
            className="flex items-center gap-2 px-6 py-3 bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm font-semibold rounded-xl shadow-sm transition-transform active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Start Download</span>
          </button>
        ) : (
          <div className="w-full bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-2xs">
            <div className="flex justify-between items-center text-xs font-mono mb-1.5 text-[#334155]">
              <span>Packet Stream: Hazel/Reliable</span>
              <span>{speed} KB/s</span>
            </div>
            <div className="w-full h-3 bg-[#F1F5F9] rounded-full overflow-hidden border border-[#E2E8F0]">
              <div
                style={{ width: `${progress}%` }}
                className="h-full bg-indigo-600 rounded-full transition-all duration-150"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-[#E2E8F0] text-xs text-[#64748B]">
        <span>Hold connection until telemetry packet stream concludes.</span>
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
