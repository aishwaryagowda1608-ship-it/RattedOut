import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RattedOutBadge } from './Logo';
import {
  Rocket,
  User,
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  FileText,
  Shield,
  Palette,
  Check,
} from 'lucide-react';
import { PlayerColorId, UserAccount } from '../types';
import { authService } from '../utils/auth';
import { COLOR_LIST, PLAYER_COLORS } from '../utils/mapData';
import { sound } from '../utils/audio';

interface LoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  colorblindMode?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onOpenPrivacy = () => {},
  onOpenTerms = () => {},
  colorblindMode = false,
}) => {
  const [tab, setTab] = useState<'GUEST' | 'LOGIN' | 'REGISTER'>('GUEST');

  // Guest State
  const [guestName, setGuestName] = useState(`Cadet ${Math.floor(100 + Math.random() * 900)}`);
  const [guestColor, setGuestColor] = useState<PlayerColorId>('sky');

  // Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedColor, setSelectedColor] = useState<PlayerColorId>('coral');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    const user = authService.loginAsGuest(guestName, guestColor);
    onLoginSuccess(user);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    sound.playClick();

    setTimeout(() => {
      const res = authService.loginWithEmail(email, password);
      setIsLoading(false);
      if (res.success && res.user) {
        sound.playTaskComplete();
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Invalid email or password.');
      }
    }, 400);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    sound.playClick();

    setTimeout(() => {
      const res = authService.registerWithEmail(username, email, password, selectedColor);
      setIsLoading(false);
      if (res.success && res.user) {
        sound.playTaskComplete();
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Registration failed.');
      }
    }, 450);
  };

  const handleOAuth = (provider: 'google' | 'apple') => {
    sound.playClick();
    setIsLoading(true);
    setTimeout(() => {
      const user = authService.loginWithOAuth(provider);
      setIsLoading(false);
      sound.playTaskComplete();
      onLoginSuccess(user);
    }, 500);
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Animated Stardust Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl p-6 sm:p-8 relative z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <RattedOutBadge size={64} className="mb-3 shadow-xl" />
          <h1 className="text-2xl font-black tracking-wider text-slate-100 uppercase">RattedOut</h1>
          <p className="text-xs text-slate-400 tracking-wide mt-1">Multiplayer Social Deduction Game</p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 mb-6">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setTab('GUEST');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'GUEST'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Guest Pass
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setTab('LOGIN');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'LOGIN'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setTab('REGISTER');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === 'REGISTER'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Notification */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. GUEST MODE TAB */}
        {tab === 'GUEST' && (
          <form onSubmit={handleGuestSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Astronaut Call-Sign</span>
                <span className="text-[10px] text-slate-400 font-normal">Temporary Identity</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  maxLength={15}
                  required
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  placeholder="Enter your name"
                />
              </div>
            </div>

            {/* Suit Color Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Suit Pigment</span>
                {colorblindMode && (
                  <span className="text-[10px] text-cyan-400 font-medium">
                    {PLAYER_COLORS[guestColor].symbol} {PLAYER_COLORS[guestColor].symbolName}
                  </span>
                )}
              </label>
              <div className="grid grid-cols-6 gap-2">
                {COLOR_LIST.map((colorKey) => {
                  const c = PLAYER_COLORS[colorKey];
                  const isSelected = guestColor === colorKey;
                  return (
                    <button
                      key={colorKey}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setGuestColor(colorKey);
                      }}
                      className={`relative aspect-square rounded-xl flex items-center justify-center transition-all ${
                        isSelected
                          ? 'ring-2 ring-cyan-400 scale-105 shadow-md shadow-cyan-500/30'
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.primary }}
                      title={c.name}
                    >
                      {isSelected ? (
                        <Check className="w-4 h-4 text-white drop-shadow" />
                      ) : colorblindMode ? (
                        <span className="text-[10px] font-black text-white/90 drop-shadow">{c.symbol}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all mt-4 active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Quick Session (Guest)</span>
            </button>

            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/40 text-[11px] text-slate-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>Guest progress is saved locally on this browser. Create an account to sync cross-platform stats.</span>
            </div>
          </form>
        )}

        {/* 2. SIGN IN TAB */}
        {tab === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  placeholder="astronaut@starstation.space"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* 3. REGISTER TAB */}
        {tab === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Display Call-Sign</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={16}
                  required
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  placeholder="Commander Nova"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  placeholder="commander@protocol.space"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  placeholder="Min 6 characters"
                />
              </div>
            </div>

            {/* Suit Color Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Default Suit Color</span>
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {COLOR_LIST.slice(0, 6).map((colorKey) => {
                  const c = PLAYER_COLORS[colorKey];
                  const isSelected = selectedColor === colorKey;
                  return (
                    <button
                      key={colorKey}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setSelectedColor(colorKey);
                      }}
                      className={`relative aspect-square rounded-lg flex items-center justify-center transition-all ${
                        isSelected ? 'ring-2 ring-cyan-400 scale-105 shadow' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.primary }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all mt-3 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Cadet Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* OAuth Social Providers Divider */}
        {(tab === 'LOGIN' || tab === 'REGISTER') && (
          <div className="mt-5 pt-4 border-t border-slate-700/60">
            <p className="text-center text-[11px] text-slate-400 mb-3">Or continue with single sign-on</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-900/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuth('apple')}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-900/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-.96.04-2.12.64-2.79 1.43-.59.68-1.11 1.77-1 2.84 1.07.08 2.16-.57 2.78-1.4" />
                </svg>
                <span>Apple ID</span>
              </button>
            </div>
          </div>
        )}

        {/* In-App Legal Links (Complies with Store guidelines) */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenPrivacy();
            }}
            className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenTerms();
            }}
            className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
