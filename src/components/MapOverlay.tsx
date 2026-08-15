import React from 'react';
import { DeadBody, Player, SabotageState, TaskDefinition } from '../types';
import { MAP_ROOMS, MAP_CORRIDORS, MAP_VENTS, TASK_STATIONS, PLAYER_COLORS } from '../utils/mapData';
import { X, MapPin, Zap, Flame, Wind, Lightbulb, Radio } from 'lucide-react';

interface Props {
  players: Player[];
  localPlayer: Player;
  deadBodies: DeadBody[];
  sabotage: SabotageState;
  onClose: () => void;
}

export const MapOverlay: React.FC<Props> = ({
  players,
  localPlayer,
  deadBodies,
  sabotage,
  onClose,
}) => {
  const isImpostor = localPlayer.role.includes('IMPOSTOR');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 flex flex-col justify-between animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Station Architecture Blueprint</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scaled Blueprint Map Container */}
        <div className="relative w-full h-[400px] bg-[#F8FAFC] rounded-2xl border border-slate-200 overflow-hidden">
          <svg viewBox="0 0 1650 1100" className="w-full h-full">
            {/* Grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Corridors */}
            {MAP_CORRIDORS.map((c, i) => (
              <rect
                key={i}
                x={c.x}
                y={c.y}
                width={c.width}
                height={c.height}
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="2"
              />
            ))}

            {/* Rooms */}
            {MAP_ROOMS.map((room) => (
              <g key={room.id}>
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.width}
                  height={room.height}
                  rx="20"
                  fill="#FFFFFF"
                  stroke="#334155"
                  strokeWidth="4"
                />
                <text
                  x={room.x + room.width / 2}
                  y={room.y + 35}
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="22"
                  fontWeight="bold"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {room.name}
                </text>
              </g>
            ))}

            {/* Vents for Impostors */}
            {isImpostor &&
              MAP_VENTS.map((v) => (
                <circle key={v.id} cx={v.x} cy={v.y} r="14" fill="#38BDF8" opacity="0.8" />
              ))}

            {/* Pending Tasks (Yellow Dots) */}
            {localPlayer.tasks
              ?.filter((t) => !t.completed)
              .map((t) => (
                <g key={t.id}>
                  <circle cx={t.x} cy={t.y} r="16" fill="#F59E0B" className="animate-pulse" />
                  <circle cx={t.x} cy={t.y} r="8" fill="#FFF" />
                </g>
              ))}

            {/* Active Sabotage Warning Icon */}
            {sabotage.activeType === 'OXYGEN' && (
              <g transform="translate(1160, 520)">
                <circle cx="0" cy="0" r="28" fill="#EF4444" opacity="0.9" className="animate-ping" />
                <circle cx="0" cy="0" r="22" fill="#EF4444" />
                <text x="0" y="8" textAnchor="middle" fill="#FFF" fontSize="20" fontWeight="bold">!</text>
              </g>
            )}
            {sabotage.activeType === 'REACTOR' && (
              <g transform="translate(150, 520)">
                <circle cx="0" cy="0" r="28" fill="#F59E0B" opacity="0.9" className="animate-ping" />
                <circle cx="0" cy="0" r="22" fill="#F59E0B" />
                <text x="0" y="8" textAnchor="middle" fill="#FFF" fontSize="20" fontWeight="bold">!</text>
              </g>
            )}

            {/* Local Player Marker */}
            <circle
              cx={localPlayer.x}
              cy={localPlayer.y}
              r="22"
              fill={PLAYER_COLORS[localPlayer.color]?.primary || '#3B82F6'}
              stroke="#0F172A"
              strokeWidth="4"
            />
            <circle cx={localPlayer.x} cy={localPlayer.y} r="6" fill="#FFF" />
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4 text-xs font-mono text-slate-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-indigo-600" />
              <span>You</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Assigned Tasks</span>
            </div>
            {isImpostor && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-sky-400" />
                <span>Vent Network</span>
              </div>
            )}
          </div>
          <span className="text-slate-400">Press [M] or tap map button to close</span>
        </div>
      </div>
    </div>
  );
};
