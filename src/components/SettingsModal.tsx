import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Music,
  Sliders,
  Eye,
  Globe,
  User,
  Shield,
  FileText,
  X,
  LogOut,
  Trash2,
  Lock,
  Check,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { AppSettings, PlayerColorId, SupportedLanguage, UserAccount } from '../types';
import { COLOR_LIST, PLAYER_COLORS } from '../utils/mapData';
import { sound } from '../utils/audio';
import { authService } from '../utils/auth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings?: (newSettings: Partial<AppSettings>) => void;
  onSaveSettings?: (newSettings: AppSettings) => void;
  currentUser: UserAccount | null;
  onUserUpdated?: (user: UserAccount | null) => void;
  onLogout: () => void;
  initialTab?: 'SETTINGS' | 'PRIVACY' | 'TERMS' | 'AUDIO' | 'CONTROLS' | 'ACCESSIBILITY' | 'ACCOUNT' | 'TOS';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onSaveSettings,
  currentUser,
  onUserUpdated = (_user: UserAccount | null) => {},
  onLogout,
  initialTab = 'SETTINGS',
}) => {
  const getInitialView = (tab: string): 'SETTINGS' | 'PRIVACY' | 'TERMS' => {
    if (tab === 'PRIVACY') return 'PRIVACY';
    if (tab === 'TERMS' || tab === 'TOS') return 'TERMS';
    return 'SETTINGS';
  };

  const getInitialSettingsTab = (tab: string): 'GAMEPLAY' | 'ACCOUNT' => {
    if (tab === 'ACCOUNT') return 'ACCOUNT';
    return 'GAMEPLAY';
  };

  const [activeView, setActiveView] = useState<'SETTINGS' | 'PRIVACY' | 'TERMS'>(getInitialView(initialTab));
  const [activeSettingsTab, setActiveSettingsTab] = useState<'GAMEPLAY' | 'ACCOUNT'>(getInitialSettingsTab(initialTab));

  // Sync state when modal opens or initialTab changes
  React.useEffect(() => {
    if (isOpen) {
      setActiveView(getInitialView(initialTab));
      setActiveSettingsTab(getInitialSettingsTab(initialTab));
      if (currentUser) {
        setEditingName(currentUser.username);
        setEditingColor(currentUser.favoriteColor);
      }
    }
  }, [isOpen, initialTab, currentUser]);

  const handleUpdate = (partial: Partial<AppSettings>) => {
    if (onUpdateSettings) {
      onUpdateSettings(partial);
    }
    if (onSaveSettings) {
      onSaveSettings({ ...settings, ...partial });
    }
  };

  // Account editing states
  const [editingName, setEditingName] = useState(currentUser?.username || '');
  const [editingColor, setEditingColor] = useState<PlayerColorId>(currentUser?.favoriteColor || 'sky');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playTaskComplete();
    const updated = authService.updateProfile(editingName, editingColor);
    if (updated) {
      onUserUpdated(updated);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    sound.playTaskComplete();
    setPasswordMsg({ type: 'success', text: 'Password successfully updated!' });
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordMsg(null);
      setNewPassword('');
      setConfirmPassword('');
    }, 1200);
  };

  const handleDeleteAccount = () => {
    sound.playClick();
    authService.deleteAccount();
    onLogout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sound.playClick();
                setActiveView('SETTINGS');
              }}
              className={`text-sm font-bold tracking-wider uppercase transition-colors ${
                activeView === 'SETTINGS' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Preferences
            </button>
            <span className="text-slate-600">/</span>
            <button
              onClick={() => {
                sound.playClick();
                setActiveView('PRIVACY');
              }}
              className={`text-sm font-bold tracking-wider uppercase transition-colors ${
                activeView === 'PRIVACY' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Privacy Policy
            </button>
            <span className="text-slate-600">/</span>
            <button
              onClick={() => {
                sound.playClick();
                setActiveView('TERMS');
              }}
              className={`text-sm font-bold tracking-wider uppercase transition-colors ${
                activeView === 'TERMS' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Terms of Service
            </button>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* VIEW 1: SETTINGS / PREFERENCES */}
          {activeView === 'SETTINGS' && (
            <>
              {/* Settings Sub-Tabs */}
              <div className="flex gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800 max-w-xs">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setActiveSettingsTab('GAMEPLAY');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeSettingsTab === 'GAMEPLAY'
                      ? 'bg-cyan-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Audio & Controls
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setActiveSettingsTab('ACCOUNT');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeSettingsTab === 'ACCOUNT'
                      ? 'bg-cyan-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Account Profile
                </button>
              </div>

              {activeSettingsTab === 'GAMEPLAY' ? (
                <div className="space-y-5">
                  {/* 1. Audio Section */}
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-cyan-400" />
                      <span>Sound & Audio Sliders</span>
                    </h3>

                    {/* SFX Volume */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Sound Effects (SFX)</span>
                        <span className="font-mono text-cyan-400">{settings.soundVolume}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={settings.soundVolume}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          handleUpdate({ soundVolume: val });
                          sound.setVolumes(val, settings.musicVolume);
                          if (val > 0 && Math.random() < 0.2) sound.playClick();
                        }}
                        className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-950 rounded-lg"
                      />
                    </div>

                    {/* Music Volume */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Ambient Space Synthesis</span>
                        <span className="font-mono text-cyan-400">{settings.musicVolume}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={settings.musicVolume}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          handleUpdate({ musicVolume: val });
                          sound.setVolumes(settings.soundVolume, val);
                        }}
                        className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-950 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* 2. Controls & Accessibility */}
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-cyan-400" />
                      <span>Controls & Accessibility</span>
                    </h3>

                    {/* Touch / Joystick Sensitivity */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          <span>Joystick & Touch Sensitivity</span>
                        </span>
                        <span className="font-mono text-cyan-400">{settings.touchSensitivity.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        value={settings.touchSensitivity}
                        onChange={(e) => handleUpdate({ touchSensitivity: Number(e.target.value) })}
                        className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-950 rounded-lg"
                      />
                    </div>

                    {/* Colorblind Mode Toggle */}
                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                          <Eye className="w-4 h-4 text-cyan-400" />
                          <span>Colorblind Mode (Symbol Badges)</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Adds distinct geometric glyphs to players and wire tasks for visual clarity.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          handleUpdate({ colorblindMode: !settings.colorblindMode });
                        }}
                        className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                          settings.colorblindMode ? 'bg-cyan-500' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            settings.colorblindMode ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Language Selector */}
                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                        <Globe className="w-4 h-4 text-cyan-400" />
                        <span>Game Language</span>
                      </div>
                      <select
                        value={settings.language}
                        onChange={(e) => {
                          sound.playClick();
                          handleUpdate({ language: e.target.value as SupportedLanguage });
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="en">English (US)</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="ja">日本語</option>
                        <option value="ko">한국어</option>
                        <option value="pt">Português</option>
                      </select>
                    </div>

                    {/* Protocol Inspector Toggle */}
                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-200">Hazel Protocol Inspector HUD</div>
                        <p className="text-[11px] text-slate-400 mt-0.5">Show real-time simulated packet telemetry.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          handleUpdate({ showProtocolInspector: !settings.showProtocolInspector });
                        }}
                        className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                          settings.showProtocolInspector ? 'bg-cyan-500' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            settings.showProtocolInspector ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* ACCOUNT TAB */
                <div className="space-y-5">
                  {currentUser ? (
                    <>
                      {/* Stats Overview */}
                      <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/80">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow"
                              style={{ backgroundColor: PLAYER_COLORS[currentUser.favoriteColor]?.primary || '#38BDF8' }}
                            >
                              {settings.colorblindMode
                                ? PLAYER_COLORS[currentUser.favoriteColor]?.symbol
                                : currentUser.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                                <span>{currentUser.username}</span>
                                {currentUser.isGuest && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded font-normal">
                                    Guest
                                  </span>
                                )}
                              </h4>
                              <p className="text-xs text-slate-400">
                                {currentUser.email || 'Local session (Unregistered)'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-cyan-400">Level {currentUser.stats?.level || 1}</span>
                            <p className="text-[10px] text-slate-400">{currentUser.stats?.xp || 0} XP</p>
                          </div>
                        </div>

                        {/* Performance Grid */}
                        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-700/60 text-center">
                          <div className="p-2 bg-slate-900/60 rounded-lg">
                            <div className="text-sm font-bold text-slate-100">{currentUser.stats?.gamesPlayed || 0}</div>
                            <div className="text-[10px] text-slate-400">Games</div>
                          </div>
                          <div className="p-2 bg-slate-900/60 rounded-lg">
                            <div className="text-sm font-bold text-emerald-400">{currentUser.stats?.crewmateWins || 0}</div>
                            <div className="text-[10px] text-slate-400">Crew Wins</div>
                          </div>
                          <div className="p-2 bg-slate-900/60 rounded-lg">
                            <div className="text-sm font-bold text-rose-400">{currentUser.stats?.impostorWins || 0}</div>
                            <div className="text-[10px] text-slate-400">Imp Wins</div>
                          </div>
                          <div className="p-2 bg-slate-900/60 rounded-lg">
                            <div className="text-sm font-bold text-cyan-400">{currentUser.stats?.tasksCompleted || 0}</div>
                            <div className="text-[10px] text-slate-400">Tasks</div>
                          </div>
                        </div>
                      </div>

                      {/* Edit Profile Form */}
                      <form onSubmit={handleSaveProfile} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-3">
                        <h4 className="text-xs font-bold text-slate-300 uppercase">Edit Cadet Identity</h4>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Call-Sign</label>
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            maxLength={16}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Favorite Suit Color</label>
                          <div className="grid grid-cols-6 gap-1.5">
                            {COLOR_LIST.map((colorKey) => {
                              const c = PLAYER_COLORS[colorKey];
                              const isSelected = editingColor === colorKey;
                              return (
                                <button
                                  key={colorKey}
                                  type="button"
                                  onClick={() => {
                                    sound.playClick();
                                    setEditingColor(colorKey);
                                  }}
                                  className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                                    isSelected ? 'ring-2 ring-cyan-400 scale-105 shadow' : 'opacity-70 hover:opacity-100'
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
                          className="py-1.5 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg transition-colors"
                        >
                          Save Profile
                        </button>
                      </form>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {!currentUser.isGuest && (
                          <button
                            type="button"
                            onClick={() => {
                              sound.playClick();
                              setShowPasswordModal(true);
                            }}
                            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5"
                          >
                            <Lock className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Change Password</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            onLogout();
                            onClose();
                          }}
                          className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5"
                        >
                          <LogOut className="w-3.5 h-3.5 text-amber-400" />
                          <span>Logout</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setShowDeleteConfirm(true);
                          }}
                          className="py-2 px-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold rounded-xl border border-rose-800/50 flex items-center gap-1.5 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Account</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No active session detected. Please sign in or play as guest.
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* VIEW 2: PRIVACY POLICY (In-App Compliant Document) */}
          {activeView === 'PRIVACY' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-w-none">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center gap-2.5 text-cyan-300 text-xs">
                <Shield className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>
                  <strong>Privacy Notice:</strong> Effective August 15, 2026. This policy discloses how RattedOut
                  handles player telemetry, local sessions, and user privacy in compliance with GDPR, CCPA, and COPPA.
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-1">1. Information We Collect</h4>
                <p className="mb-2">We collect only minimal information necessary to deliver seamless multiplayer gameplay:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li>
                    <strong className="text-slate-200">Account Credentials:</strong> If you register, we store your chosen username, email address, suit customization preferences, and encrypted credentials.
                  </li>
                  <li>
                    <strong className="text-slate-200">Gameplay Metrics:</strong> Match outcomes (wins/losses), task completions, impostor eliminations, and meeting call statistics to power your career progression level.
                  </li>
                  <li>
                    <strong className="text-slate-200">Device & Telemetry Data:</strong> Operating system platform (iOS, Android, macOS, Windows), browser client characteristics, and touch/joystick input rates to optimize performance.
                  </li>
                  <li>
                    <strong className="text-slate-200">Crash Reporting:</strong> Aggregated diagnostic error stacks and protocol packet logs to troubleshoot client-server synchronization issues.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-1">2. Third-Party Services & Analytics</h4>
                <p className="mb-1 text-slate-400">
                  We integrate industry-standard SDKs solely for infrastructure and matchmaking support:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li><strong>Matchmaking Relay:</strong> Real-time packet relay and lobby matchmaking.</li>
                  <li><strong>Diagnostic Analytics:</strong> Anonymous crash reporting and performance telemetry.</li>
                </ul>
                <p className="mt-1 text-slate-400">We do <strong>not</strong> sell your personal information or share it with third-party ad brokers.</p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-1">3. Your Data Rights (GDPR / CCPA)</h4>
                <p className="text-slate-400 mb-2">Under global privacy regulations, all players possess the following enforceable rights:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li><strong>Right to Access & Portability:</strong> View your stats and stored profile in the Account Settings tab at any time.</li>
                  <li><strong>Right to Rectification:</strong> Edit your call-sign, suit colors, and security passwords directly in-app.</li>
                  <li><strong>Right to Erasure (Deletion):</strong> You may permanently delete your account and all associated match history by clicking "Delete Account" in the Account tab.</li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-1">4. Children's Privacy (COPPA Compliance)</h4>
                <p className="text-slate-400">
                  RattedOut does not knowingly collect personally identifiable information from children under the age of 13 without verifiable parental consent. If you are under 13, you may enjoy RattedOut anonymously using our <strong>Guest Pass</strong> mode without submitting an email address.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-1">5. Data Retention & Security</h4>
                <p className="text-slate-400">
                  Authentication tokens and local settings are secured using modern cryptographic storage. Inactive accounts with no activity for more than 24 months are automatically purged from our databases.
                </p>
              </div>
            </div>
          )}

          {/* VIEW 3: FULL TERMS OF SERVICE (In-App Compliant Document) */}
          {activeView === 'TERMS' && (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-w-none">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center gap-2.5 text-cyan-300 text-xs">
                <FileText className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>
                  <strong>Terms of Service:</strong> Effective August 15, 2026. By accessing RattedOut across any platform, you agree to these Terms.
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-1">1. Acceptable Use & Player Code of Conduct</h4>
                <p className="text-slate-400 mb-2">RattedOut is a cooperative and competitive social deduction game. Players agree not to:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li>Use abusive, harassing, defamatory, or discriminatory language in meeting text chat.</li>
                  <li>Deploy third-party cheating software, memory injectors, or radar hacks that reveal secret roles.</li>
                  <li>Intentionally disconnect repeatedly mid-game to disrupt active crewmate sessions.</li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-1">2. Intellectual Property Notice</h4>
                <p className="text-slate-400">
                  All characters, station architecture, graphics, sound effects, and code in RattedOut are original proprietary intellectual property. This game is an independent social deduction simulation.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-1">3. In-App Features & Virtual Content</h4>
                <p className="text-slate-400">
                  Any cosmetics, suit pigments, badges, and titles unlocked in RattedOut represent limited, non-exclusive, revocable licenses for in-game entertainment and have no real-world monetary redemption value.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-1">4. Disclaimer of Warranties</h4>
                <p className="text-slate-400">
                  RattedOut is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind. We do not guarantee uninterrupted server uptime or error-free network latency during peak multiplayer operations.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100 mb-1">5. Account Suspension & Termination</h4>
                <p className="text-slate-400">
                  We reserve the right to suspend or terminate accounts that violate our anti-cheating policy or community conduct rules without prior notice.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Change Password Modal Overlay */}
        <AnimatePresence>
          {showPasswordModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm p-6 flex flex-col justify-center items-center"
            >
              <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
                <h3 className="text-sm font-bold text-slate-100 uppercase mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span>Update Password</span>
                </h3>

                {passwordMsg && (
                  <div
                    className={`mb-3 p-2 text-xs rounded-lg ${
                      passwordMsg.type === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {passwordMsg.text}
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPasswordMsg(null);
                      }}
                      className="flex-1 py-1.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-1.5 bg-cyan-500 text-slate-950 text-xs font-bold rounded-lg"
                    >
                      Save Password
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal Overlay */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm p-6 flex flex-col justify-center items-center"
            >
              <div className="w-full max-w-sm bg-slate-900 border border-rose-800/80 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>Permanent Account Deletion</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  This action is irreversible under GDPR/CCPA compliance. All stats, XP levels, and credentials will be immediately wiped from storage.
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30"
                  >
                    Delete Forever
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
