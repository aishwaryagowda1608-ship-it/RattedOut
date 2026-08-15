import React from 'react';
import { Player, TaskDefinition } from '../types';
import { WiresTask } from './tasks/WiresTask';
import { SwipeCardTask } from './tasks/SwipeCardTask';
import { ManifoldTask } from './tasks/ManifoldTask';
import { AsteroidsTask } from './tasks/AsteroidsTask';
import { DownloadDataTask } from './tasks/DownloadDataTask';
import { MedBayScanTask } from './tasks/MedBayScanTask';
import { DivertPowerTask } from './tasks/DivertPowerTask';
import { CalibrateTask } from './tasks/CalibrateTask';
import { X } from 'lucide-react';

interface Props {
  task: TaskDefinition;
  player: Player;
  onComplete: (taskId: string) => void;
  onClose: () => void;
}

export const TaskModal: React.FC<Props> = ({ task, player, onComplete, onClose }) => {
  const handleTaskFinish = () => {
    onComplete(task.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {task.type === 'WIRES' && <WiresTask onComplete={handleTaskFinish} onClose={onClose} />}
        {task.type === 'SWIPE_CARD' && <SwipeCardTask onComplete={handleTaskFinish} onClose={onClose} />}
        {task.type === 'MANIFOLD' && <ManifoldTask onComplete={handleTaskFinish} onClose={onClose} />}
        {task.type === 'ASTEROIDS' && <AsteroidsTask onComplete={handleTaskFinish} onClose={onClose} />}
        {task.type === 'DOWNLOAD_DATA' && <DownloadDataTask onComplete={handleTaskFinish} onClose={onClose} />}
        {task.type === 'MEDBAY_SCAN' && <MedBayScanTask player={player} onComplete={handleTaskFinish} onClose={onClose} />}
        {task.type === 'DIVERT_POWER' && <DivertPowerTask onComplete={handleTaskFinish} onClose={onClose} />}
        {task.type === 'CALIBRATE' && <CalibrateTask onComplete={handleTaskFinish} onClose={onClose} />}
      </div>
    </div>
  );
};
