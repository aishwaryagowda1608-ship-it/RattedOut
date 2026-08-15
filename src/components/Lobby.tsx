import React, { useState } from 'react';
import { GameSettings, PlayerColorId, UserAccount } from '../types';
import { COLOR_LIST, PLAYER_COLORS } from '../utils/mapData';
import { sound } from '../utils/audio';
import { RattedOutBadge } from './Logo';
import {
  Play,
  Settings,
  Users,
  Shield,
  Zap,
  Sparkles,
  Volume2,
  VolumeX,
  Binary,
  User,
  Sliders,
  FileText,
  LogOut,
  Check,
  Copy,
  QrCode,
  UserPlus,
  ArrowRight,
} from 'lucide-react';
import { LobbySession } from '../utils/partyService';

interface Props {
  playerName: string;
  setPlayerName: (name: string) => void;
  playerColor: PlayerColorId;
  setPlayerColor: (color: PlayerColorId) => void;
  settings: GameSettings;
  setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  totalPlayers: number;
  setTotalPlayers: (count: number) => void;
  onStartGame: (roleOverride?: 'CREWMATE' | 'IMPOSTOR') => void;
  onToggleProtocol: () => void;
  currentUser: UserAccount | null;
  onOpenSettings: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onLogout: () => void;
  colorblindMode: boolean;
  roomCode: string;
  onOpenInviteModal: (mode?: 'HOST' | 'JOIN') => void;
  activeLobby: LobbySession | null;
}

export const Lobby: React.FC<Props> = ({
  playerName,
  setPlayerName,
  playerColor,
  setPlayerColor,
  settings,
  setSettings,
  totalPlayers,
  setTotalPlayers,
  onStartGame,
  onToggleProtocol,
  currentUser,
  onOpenSettings,
  onOpenPrivacy,
  onOpenTerms,
  onLogout,
  colorblindMode,
  roomCode,
  onOpenInviteModal,
  activeLobby,
}) => {
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [showMatchSettingsModal, setShowMatchSettingsModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleToggleAudio = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleColorPick = (col: PlayerColorId) => {
    sound.playClick();
    setPlayerColor(col);
  };

  const handleQuickCopyCode = async () => {
    sound.playClick();
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F8F9FA] text-[#1E293B] flex flex-col justify-between p-4 sm:p-8 md:p-12 overflow-y-auto">
      {/* Top Bar */}
      <div className="w-full max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <RattedOutBadge size={40} className="shadow-xs" />
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#0F172A]">RATTED OUT</h1>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 font-semibold">
              <span>Station Matchmaker</span>
              {currentUser && (
                <>
                  <span>•</span>
                  <span className="text-indigo-600 font-bold">Lvl {currentUser.stats?.level || 1}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* User Account / Navigation Controls */}
        <div className="flex items-center gap-2">
          {/* Room Code Badge & Invite Trigger */}
          <div className="flex items-center bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
            <button
              onClick={handleQuickCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-50 text-xs font-mono font-black text-slate-800 transition-colors border-r border-slate-200"
              title="Click to copy 6-character room code"
            >
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ROOM:</span>
              <span className="text-indigo-600 tracking-wider font-extrabold">{roomCode}</span>
              {copiedCode ? <Check className="w-3 h-3 text-emerald-600 ml-0.5" /> : <Copy className="w-3 h-3 text-slate-400 ml-0.5" />}
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onOpenInviteModal('HOST');
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
              title="Open Party Invite & QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Invite</span>
            </button>
          </div>

          {/* Join Party by Code Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenInviteModal('JOIN');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl shadow-2xs transition-colors"
            title="Join friend's room with code or QR scanner"
          >
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Join Party</span>
          </button>

          {/* User Profile Badge */}
          {currentUser && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenSettings();
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs text-xs font-medium text-slate-700 transition-colors"
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
                style={{ backgroundColor: PLAYER_COLORS[currentUser.favoriteColor]?.primary || '#4F46E5' }}
              >
                {colorblindMode
                  ? PLAYER_COLORS[currentUser.favoriteColor]?.symbol
                  : currentUser.username.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-[100px] truncate font-bold">{currentUser.username}</span>
              {currentUser.isGuest && (
                <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-mono">Guest</span>
              )}
            </button>
          )}

          {/* Preferences / Settings Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenSettings();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl shadow-2xs transition-colors"
            title="Preferences & Audio"
          >
            <Settings className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Protocol Inspector Button */}
          <button
            onClick={onToggleProtocol}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-indigo-600 rounded-xl shadow-2xs transition-colors"
            title="Hazel Protocol Live Stream"
          >
            <Binary className="w-4 h-4" />
            <span className="hidden md:inline">Protocol</span>
          </button>

          {/* Mute Button */}
          <button
            onClick={handleToggleAudio}
            className="w-9 h-9 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center shadow-2xs transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Logout Button */}
          <button
            onClick={() => {
              sound.playClick();
              onLogout();
            }}
            className="w-9 h-9 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 flex items-center justify-center shadow-2xs transition-colors"
            title="Logout / Exit Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Container: Astronaut preview + Setup Card */}
      <div className="w-full max-w-4xl mx-auto my-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center py-6">
        {/* Left: Astronaut Avatar Display */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-radial from-slate-50 to-transparent pointer-events-none" />

          {/* Minimalist 2D Astronaut Preview */}
          <div className="relative my-4 flex items-center justify-center">
            {/* Soft shadow */}
            <div className="absolute -bottom-3 w-28 h-6 bg-slate-300/40 rounded-full blur-xs" />

            {/* Astronaut Capsule */}
            <div
              className="relative w-28 h-36 rounded-3xl border-3 border-slate-900 shadow-md flex items-center justify-center transition-colors duration-300"
              style={{ backgroundColor: PLAYER_COLORS[playerColor].primary }}
            >
              {/* Backpack */}
              <div
                className="absolute -left-4 w-5 h-20 rounded-lg border-2 border-slate-900 shadow-xs"
                style={{ backgroundColor: PLAYER_COLORS[playerColor].shadow }}
              />

              {/* Glass Visor */}
              <div
                className="absolute top-6 right-3 w-16 h-12 rounded-2xl border-2 border-slate-900 shadow-xs flex items-start justify-end p-2"
                style={{ backgroundColor: PLAYER_COLORS[playerColor].visor }}
              >
                <div className="w-5 h-2 bg-white rounded-full opacity-90" />
              </div>

              {/* Colorblind symbol on suit chest */}
              {colorblindMode && (
                <div className="absolute bottom-4 left-4 z-10 w-6 h-6 rounded-full bg-slate-900/60 flex items-center justify-center text-xs font-black text-white drop-shadow">
                  {PLAYER_COLORS[playerColor].symbol}
                </div>
              )}

              {/* Legs */}
              <div
                className="absolute -bottom-4 left-3 w-8 h-6 rounded-b-xl border-2 border-slate-900"
                style={{ backgroundColor: PLAYER_COLORS[playerColor].primary }}
              />
              <div
                className="absolute -bottom-4 right-3 w-8 h-6 rounded-b-xl border-2 border-slate-900"
                style={{ backgroundColor: PLAYER_COLORS[playerColor].primary }}
              />
            </div>
          </div>

          <div className="mt-6 text-center z-10">
            <span
              className="text-xs font-mono font-bold px-3 py-1 rounded-full uppercase flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: PLAYER_COLORS[playerColor].badgeBg,
                color: PLAYER_COLORS[playerColor].badgeText,
              }}
            >
              {colorblindMode && <span>{PLAYER_COLORS[playerColor].symbol}</span>}
              <span>{PLAYER_COLORS[playerColor].name}</span>
            </span>
          </div>
        </div>

        {/* Right: Customization & Launch Panel */}
        <div className="md:col-span-7 flex flex-col gap-5">
          {/* Player Name Input */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2 font-mono">
              Agent Identity Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value || 'Player')}
              maxLength={14}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-base font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Color Palette Grid */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                Suit Color Hue
              </label>
              {colorblindMode && (
                <span className="text-[11px] text-indigo-600 font-mono font-semibold">
                  {PLAYER_COLORS[playerColor].symbol} {PLAYER_COLORS[playerColor].symbolName}
                </span>
              )}
            </div>
            <div className="grid grid-cols-6 gap-2.5">
              {COLOR_LIST.map((col) => {
                const isSelected = playerColor === col;
                const c = PLAYER_COLORS[col];
                return (
                  <button
                    key={col}
                    onClick={() => handleColorPick(col)}
                    className={`h-10 rounded-xl transition-all flex items-center justify-center relative ${
                      isSelected ? 'ring-3 ring-indigo-500 scale-105 shadow-xs' : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.primary }}
                    title={`${c.name} (${c.symbolName})`}
                  >
                    {isSelected ? (
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    ) : colorblindMode ? (
                      <span className="text-xs font-bold text-white drop-shadow">{c.symbol}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lobby Configuration Badges */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                Match Parameters
              </span>
              <button
                onClick={() => setShowMatchSettingsModal(true)}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust Rules</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 block text-[10px]">CREW TOTAL</span>
                <strong className="text-slate-800 text-sm">{totalPlayers} Players</strong>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 block text-[10px]">IMPOSTORS</span>
                <strong className="text-rose-600 text-sm">{settings.numImpostors} Killer</strong>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-slate-400 block text-[10px]">KILL CD</span>
                <strong className="text-slate-800 text-sm">{settings.killCooldown}s</strong>
              </div>
            </div>

            {/* Invite Friends Bar */}
            <div className="flex items-center justify-between p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-xs">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-xs text-indigo-950 font-bold block">Party Room Code: {roomCode}</strong>
                  <span className="text-[10px] text-indigo-700/80 font-mono">Share code or QR to invite friends</span>
                </div>
              </div>

              <button
                onClick={() => {
                  sound.playClick();
                  onOpenInviteModal('HOST');
                }}
                className="px-3.5 py-1.5 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <span>Invite</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Launch Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  sound.playClick();
                  onStartGame();
                }}
                className="flex items-center justify-center gap-2 py-3.5 px-6 bg-[#0F172A] hover:bg-[#1E293B] active:scale-95 text-white font-bold rounded-2xl shadow-sm transition-transform"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play (Random Role)</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onStartGame('IMPOSTOR');
                }}
                className="flex items-center justify-center gap-2 py-3.5 px-6 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-2xl shadow-sm transition-transform"
              >
                <Shield className="w-4 h-4" />
                <span>Force Impostor Role</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Match Rules Quick Modal */}
      {showMatchSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Match Rule Configuration</h3>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Total Crew Capacity</span>
                  <span>{totalPlayers}</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="10"
                  value={totalPlayers}
                  onChange={(e) => setTotalPlayers(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Kill Cooldown</span>
                  <span>{settings.killCooldown}s</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="45"
                  step="5"
                  value={settings.killCooldown}
                  onChange={(e) => setSettings((s) => ({ ...s, killCooldown: Number(e.target.value) }))}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Number of Impostors</span>
                  <span>{settings.numImpostors}</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2].map((num) => (
                    <button
                      key={num}
                      onClick={() => setSettings((s) => ({ ...s, numImpostors: num }))}
                      className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
                        settings.numImpostors === num
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {num} Impostor{num > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowMatchSettingsModal(false)}
              className="mt-6 w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Footer with Store Compliant Links */}
      <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono pt-4 border-t border-slate-200">
        <div>RattedOut • Social Deduction</div>
        <div className="flex items-center gap-4 text-slate-500">
          <button
            onClick={() => {
              sound.playClick();
              onOpenPrivacy();
            }}
            className="hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            <Shield className="w-3 h-3" />
            <span>Privacy Policy</span>
          </button>
          <span>•</span>
          <button
            onClick={() => {
              sound.playClick();
              onOpenTerms();
            }}
            className="hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            <FileText className="w-3 h-3" />
            <span>Terms of Service</span>
          </button>
        </div>
      </div>
    </div>
  );
};

