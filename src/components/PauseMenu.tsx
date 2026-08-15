import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Settings as SettingsIcon, LogOut, Home, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { sound } from '../utils/audio';
import { RattedOutBadge } from './Logo';

interface PauseMenuProps {
  isOpen: boolean;
  onResume: () => void;
  onOpenSettings: () => void;
  onLeaveGame: () => void;
  onExitToMenu: () => void;
  isImpostor: boolean;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  isOpen,
  onResume,
  onOpenSettings,
  onLeaveGame,
  onExitToMenu,
  isImpostor,
}) => {
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);
  const [showConfirmExitMenu, setShowConfirmExitMenu] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <RattedOutBadge size={38} className="shadow-md" />
            <div>
              <h2 className="text-lg font-black tracking-wider text-slate-100 uppercase">
                Game Paused
              </h2>
              <p className="text-xs text-slate-400">RattedOut Terminal</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onResume();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Resume"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmation Dialog 1: Leave Active Round */}
        {showConfirmLeave ? (
          <div className="space-y-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Round In Progress</span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                Leaving mid-round will disconnect you from the active station.
                {isImpostor
                  ? ' As an Impostor, leaving will immediately forfeit the round for sabotaged forces.'
                  : ' This unbalances crewmate task quotas and may trigger automatic vote forfeiture.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowConfirmLeave(false);
                }}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onLeaveGame();
                }}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-rose-600/30"
              >
                Confirm Leave
              </button>
            </div>
          </div>
        ) : showConfirmExitMenu ? (
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                <Home className="w-5 h-5 shrink-0 text-cyan-400" />
                <span>Return to Main Terminal</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to end this game session and return to the main login terminal?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowConfirmExitMenu(false);
                }}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onExitToMenu();
                }}
                className="py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-cyan-600/30"
              >
                Exit to Menu
              </button>
            </div>
          </div>
        ) : (
          /* Main Pause Menu Options */
          <div className="space-y-2.5">
            {/* Resume */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onResume();
              }}
              className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Mission</span>
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenSettings();
              }}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-colors"
            >
              <SettingsIcon className="w-4 h-4 text-cyan-400" />
              <span>Audio & Controls Settings</span>
            </button>

            {/* Leave Game (Return to Lobby) */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setShowConfirmLeave(true);
              }}
              className="w-full py-3 px-4 bg-slate-800/80 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800/50 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700/80 flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4 text-amber-400" />
              <span>Leave Game (Return to Lobby)</span>
            </button>

            {/* Exit to Main Menu / Login */}
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setShowConfirmExitMenu(true);
              }}
              className="w-full py-2.5 px-4 text-slate-400 hover:text-slate-200 text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Exit to Main Menu</span>
            </button>
          </div>
        )}

        {/* Shortcut notice */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center">
          <span className="text-[10px] text-slate-400">
            Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono text-[9px]">Esc</kbd> anytime to toggle this menu
          </span>
        </div>
      </motion.div>
    </div>
  );
};
