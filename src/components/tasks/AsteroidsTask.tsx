import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../utils/audio';
import { Crosshair, Zap } from 'lucide-react';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

interface Asteroid {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  destroyed: boolean;
}

export const AsteroidsTask: React.FC<Props> = ({ onComplete, onClose }) => {
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [destroyedCount, setDestroyedCount] = useState<number>(0);
  const [lasers, setLasers] = useState<{ id: number; x: number; y: number }[]>([]);
  const targetCount = 12;
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate initial asteroids
    const initial: Asteroid[] = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      size: Math.random() * 16 + 24,
      speedX: (Math.random() - 0.5) * 0.8,
      speedY: (Math.random() - 0.5) * 0.8,
      destroyed: false,
    }));
    setAsteroids(initial);

    // Animation loop for floating asteroids
    const interval = setInterval(() => {
      setAsteroids((prev) => {
        let active = prev.filter((a) => !a.destroyed);
        // Spawn more if low
        if (active.length < 5) {
          active.push({
            id: Date.now() + Math.random(),
            x: Math.random() < 0.5 ? -5 : 105,
            y: Math.random() * 90 + 5,
            size: Math.random() * 16 + 24,
            speedX: (Math.random() - 0.5) * 0.8,
            speedY: (Math.random() - 0.5) * 0.8,
            destroyed: false,
          });
        }

        return active.map((a) => {
          let nextX = a.x + a.speedX;
          let nextY = a.y + a.speedY;
          if (nextX < -10 || nextX > 110) a.speedX *= -1;
          if (nextY < -10 || nextY > 110) a.speedY *= -1;
          return { ...a, x: nextX, y: nextY };
        });
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const shootAsteroid = (ast: Asteroid, e: React.MouseEvent) => {
    if (ast.destroyed) return;
    sound.playLaser();

    // Laser visual flash
    const laserId = Date.now();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setLasers((prev) => [...prev, { id: laserId, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      setTimeout(() => {
        setLasers((prev) => prev.filter((l) => l.id !== laserId));
      }, 200);
    }

    setAsteroids((prev) =>
      prev.map((item) => (item.id === ast.id ? { ...item, destroyed: true } : item))
    );

    const newCount = destroyedCount + 1;
    setDestroyedCount(newCount);

    if (newCount >= targetCount) {
      sound.playTaskComplete();
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  };

  const handleShootEmpty = (e: React.MouseEvent) => {
    sound.playLaser();
    const laserId = Date.now();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setLasers((prev) => [...prev, { id: laserId, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      setTimeout(() => {
        setLasers((prev) => prev.filter((l) => l.id !== laserId));
      }, 200);
    }
  };

  return (
    <div className="relative w-full h-[380px] bg-[#0F172A] text-white rounded-2xl p-6 border border-[#334155] shadow-sm select-none flex flex-col justify-between overflow-hidden">
      {/* HUD Header */}
      <div className="flex justify-between items-center z-10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">Tactical Defense</span>
          <h3 className="text-base font-bold text-white">Weapons: Clear Asteroid Field</h3>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-full text-xs font-mono">
          <Crosshair className="w-4 h-4 text-rose-400" />
          <span>
            Destroyed: <strong className="text-emerald-400">{destroyedCount}</strong> / {targetCount}
          </span>
        </div>
      </div>

      {/* Target Canvas */}
      <div
        ref={canvasRef}
        onClick={handleShootEmpty}
        className="relative w-full h-56 bg-radial from-slate-900 to-slate-950 rounded-xl border border-slate-800 my-auto overflow-hidden cursor-crosshair"
      >
        {/* Radar grid lines */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <div className="w-48 h-48 rounded-full border border-sky-400" />
          <div className="w-32 h-32 rounded-full border border-sky-400" />
          <div className="absolute w-full h-px bg-sky-400" />
          <div className="absolute h-full w-px bg-sky-400" />
        </div>

        {/* Asteroids */}
        {asteroids.map((ast) => {
          if (ast.destroyed) return null;
          return (
            <button
              key={ast.id}
              onClick={(e) => {
                e.stopPropagation();
                shootAsteroid(ast, e);
              }}
              style={{
                left: `${ast.x}%`,
                top: `${ast.y}%`,
                width: `${ast.size}px`,
                height: `${ast.size}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute bg-gradient-to-tr from-stone-600 via-stone-500 to-stone-400 rounded-lg rotate-45 border-2 border-stone-300/40 hover:scale-110 active:scale-95 shadow-md flex items-center justify-center cursor-crosshair transition-transform"
            >
              <div className="w-2 h-2 rounded-full bg-stone-700/60" />
            </button>
          );
        })}

        {/* Laser flashes */}
        {lasers.map((laser) => (
          <div
            key={laser.id}
            style={{ left: laser.x, top: laser.y }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-rose-500/80 animate-ping pointer-events-none flex items-center justify-center"
          >
            <Zap className="w-4 h-4 text-yellow-300" />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs text-slate-400 z-10">
        <span>Click or tap asteroids within the radar to neutralize them.</span>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-white font-medium underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
