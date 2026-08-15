import React, { useState } from 'react';
import { Player } from '../types';
import { MAP_ROOMS, PLAYER_COLORS } from '../utils/mapData';
import { sound } from '../utils/audio';
import { LayoutGrid, HeartPulse, X, Users } from 'lucide-react';

interface Props {
  players: Player[];
  onClose: () => void;
}

export const AdminConsole: React.FC<Props> = ({ players, onClose }) => {
  const [tab, setTab] = useState<'MAP' | 'VITALS'>('MAP');

  // Calculate room occupants for alive players
  const roomCounts: Record<string, number> = {};
  MAP_ROOMS.forEach((r) => {
    roomCounts[r.id] = 0;
  });

  players.forEach((p) => {
    if (!p.isDead && !p.isVenting && p.currentRoom) {
      if (roomCounts[p.currentRoom] !== undefined) {
        roomCounts[p.currentRoom]++;
      }
    }
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => {
                  sound.playClick();
                  setTab('MAP');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === 'MAP' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Station Occupancy</span>
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setTab('VITALS');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === 'VITALS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                <span>Crew Vitals</span>
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab 1: Room Occupancy Map */}
        {tab === 'MAP' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Real-time presence sensors across all station compartments:</span>
              <span className="font-mono font-bold text-slate-700">
                {players.filter((p) => !p.isDead).length} Active Crew
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
              {MAP_ROOMS.map((room) => {
                const count = roomCounts[room.id] || 0;
                return (
                  <div
                    key={room.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      count > 0
                        ? 'bg-indigo-50/70 border-indigo-200 shadow-2xs'
                        : 'bg-slate-50/50 border-slate-200 opacity-70'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-slate-800 leading-tight">
                        {room.name}
                      </span>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                          count > 0
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {count}
                      </div>
                    </div>

                    {/* Mini occupant icons */}
                    <div className="flex gap-1 mt-2">
                      {Array.from({ length: count }).map((_, i) => (
                        <div
                          key={i}
                          className="w-3.5 h-3.5 rounded-full bg-indigo-500 animate-pulse"
                        />
                      ))}
                      {count === 0 && <span className="text-[10px] text-slate-400 font-mono">Empty</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Crew Vitals */}
        {tab === 'VITALS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Bio-monitor telemetry tracking pulse and life signs:</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {players.map((p) => {
                const colorDef = PLAYER_COLORS[p.color];
                return (
                  <div
                    key={p.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between ${
                      p.isDead
                        ? 'bg-rose-50 border-rose-200'
                        : 'bg-emerald-50/60 border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-9 rounded-lg relative flex items-center justify-center shadow-xs"
                        style={{ backgroundColor: colorDef.primary }}
                      >
                        <div
                          className="w-3.5 h-2 rounded-full absolute top-1.5 right-1"
                          style={{ backgroundColor: colorDef.visor }}
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block leading-tight">
                          {p.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold ${
                            p.isDead ? 'text-rose-700' : 'text-emerald-700'
                          }`}
                        >
                          {p.isDead ? 'DEAD' : 'OK'}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-3 h-3 rounded-full ${
                        p.isDead ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
