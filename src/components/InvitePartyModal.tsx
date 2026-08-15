import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Users,
  Copy,
  Check,
  RefreshCw,
  Share2,
  Camera,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Link,
  Smartphone,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { partyService, LobbySession } from '../utils/partyService';
import { QRScannerModal } from './QRScannerModal';
import { RattedOutBadge } from './Logo';

interface InvitePartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  onRegenerateCode: () => void;
  onJoinRoom: (code: string) => void;
  activeLobby: LobbySession | null;
  initialMode?: 'HOST' | 'JOIN';
}

export const InvitePartyModal: React.FC<InvitePartyModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  onRegenerateCode,
  onJoinRoom,
  activeLobby,
  initialMode = 'HOST',
}) => {
  const [activeTab, setActiveTab] = useState<'HOST' | 'JOIN' | 'DEEP_LINKS'>(initialMode);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedProtocol, setCopiedProtocol] = useState(false);

  // Manual Join State
  const [inputCode, setInputCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Camera Scanner Modal State
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setJoinError(null);
      setInputCode('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const shareUrl = partyService.buildShareUrl(roomCode);
  const nativeProtocolUrl = partyService.buildNativeAppUrl(roomCode);

  const handleCopyCode = async () => {
    sound.playClick();
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyUrl = async () => {
    sound.playClick();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyProtocol = async () => {
    sound.playClick();
    try {
      await navigator.clipboard.writeText(nativeProtocolUrl);
      setCopiedProtocol(true);
      setTimeout(() => setCopiedProtocol(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleManualJoin = (codeToJoin: string) => {
    sound.playClick();
    setJoinError(null);
    setIsVerifying(true);

    const clean = codeToJoin.trim().toUpperCase();
    if (!clean) {
      setJoinError('Please enter a 6-character room code.');
      setIsVerifying(false);
      return;
    }

    const validation = partyService.validateRoomCode(clean);
    if (!validation.valid) {
      sound.playSabotageTrigger();
      setJoinError(validation.error || 'Invalid room code.');
      setIsVerifying(false);
      return;
    }

    sound.playTaskStep();
    setIsVerifying(false);
    onJoinRoom(clean);
  };

  const handleScannedCode = (scannedCode: string) => {
    setShowScanner(false);
    setInputCode(scannedCode);
    handleManualJoin(scannedCode);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <RattedOutBadge size={40} className="shadow-xs" />
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  Party Station Matchmaker
                </h3>
                <p className="text-xs font-mono text-slate-500">
                  Invite crewmates or join an active station lobby
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('HOST');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'HOST'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Host & Invite
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('JOIN');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'JOIN'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Join Lobby
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveTab('DEEP_LINKS');
                }}
                className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                  activeTab === 'DEEP_LINKS'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Deep Links & Integration Specs"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Links</span>
              </button>
            </div>
          </div>

          {/* TAB 1: HOST & INVITE (Code + QR side by side) */}
          {activeTab === 'HOST' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Column: Room Code & Quick Sharing */}
              <div className="md:col-span-7 flex flex-col gap-4">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold font-mono uppercase text-slate-500 tracking-wider">
                      Room Access Code
                    </span>
                    <button
                      onClick={() => {
                        sound.playClick();
                        onRegenerateCode();
                      }}
                      className="text-[11px] text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 transition-colors"
                      title="Generate fresh room code (invalidates previous codes)"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Rotate Code</span>
                    </button>
                  </div>

                  {/* Room Code Display */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border-2 border-indigo-500/40 rounded-2xl px-4 py-3 text-center shadow-xs">
                      <span className="text-2xl sm:text-3xl font-mono font-black tracking-[0.25em] text-slate-900">
                        {roomCode}
                      </span>
                    </div>

                    <button
                      onClick={handleCopyCode}
                      className="h-full px-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex flex-col items-center justify-center gap-1"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span className="text-[10px]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span className="text-[10px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Share this unambiguous 6-character code with friends to join your match directly.
                  </p>
                </div>

                {/* Direct Link Sharing */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                  <div className="truncate">
                    <span className="text-[10px] font-mono text-slate-400 block">DIRECT WEB LINK</span>
                    <span className="text-slate-700 font-mono font-medium truncate block max-w-[280px]">
                      {shareUrl}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyUrl}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 font-bold rounded-xl text-slate-700 text-xs shadow-2xs transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {copiedUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Expiry & Lobby Lifetime Indicator */}
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>
                    Session valid for 30 mins • Active members:{' '}
                    <strong className="text-slate-800">
                      {activeLobby ? activeLobby.members.length : 1}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Right Column: Dynamic Auto-Regenerating QR Code */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200/60 mb-3 flex items-center justify-center">
                  <QRCodeSVG
                    value={shareUrl}
                    size={160}
                    level="H"
                    includeMargin={false}
                    fgColor="#0F172A"
                  />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-800 block">Instant Camera Join</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Scan with smartphone or in-app scanner
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL CODE ENTRY & SCANNER */}
          {activeTab === 'JOIN' && (
            <div className="flex flex-col gap-5 py-2">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2 font-mono">
                  Enter 6-Character Room Code
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => {
                      setInputCode(e.target.value.toUpperCase().slice(0, 6));
                      setJoinError(null);
                    }}
                    placeholder="e.g. 7KM4QP"
                    maxLength={6}
                    className="w-full sm:flex-1 bg-white border-2 border-slate-300 focus:border-indigo-600 rounded-2xl px-5 py-3.5 text-center sm:text-left text-xl font-mono font-black tracking-widest text-slate-900 focus:outline-hidden transition-colors"
                  />

                  <button
                    onClick={() => handleManualJoin(inputCode)}
                    disabled={isVerifying || inputCode.length < 4}
                    className="w-full sm:w-auto px-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-xs transition-colors flex items-center justify-center gap-2 shrink-0"
                  >
                    <span>Connect</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Validation Diagnostic Alert */}
                {joinError && (
                  <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{joinError}</span>
                  </div>
                )}
              </div>

              {/* Or Scan via Camera View */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-mono font-bold text-slate-400">OR SCAN QR CODE</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between p-5 bg-indigo-50/60 rounded-2xl border border-indigo-100 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">
                      Live Viewfinder Scanner
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Point camera at host&apos;s QR code to join without typing
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    setShowScanner(true);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Open Scanner</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: DEEP-LINK SPECIFICATIONS & UNIVERSAL PROTOCOL */}
          {activeTab === 'DEEP_LINKS' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-indigo-600" />
                    <span>Native Deep Link Protocol Handler</span>
                  </span>
                  <button
                    onClick={handleCopyProtocol}
                    className="text-[11px] text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
                  >
                    {copiedProtocol ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedProtocol ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <code className="block p-2.5 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto">
                  {nativeProtocolUrl}
                </code>
                <p className="text-[11px] text-slate-500 mt-2">
                  Registered protocol handler for Windows, Android intent filters, and iOS URL schemes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-slate-800 block mb-1">🍎 iOS Universal Links</strong>
                  <span className="text-slate-500 block mb-2">
                    Configured via <code className="text-slate-700">/.well-known/apple-app-site-association</code>
                  </span>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 font-mono text-[10px] text-slate-600">
                    applinks:party.protocolspace.app
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="text-slate-800 block mb-1">🤖 Android App Links</strong>
                  <span className="text-slate-500 block mb-2">
                    Configured via <code className="text-slate-700">/.well-known/assetlinks.json</code>
                  </span>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 font-mono text-[10px] text-slate-600">
                    com.protocolspace.app (autoVerify)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Close */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="text-[11px] text-slate-400 font-mono">
              RattedOut Party Service • v1.2.0
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* QR Scanner Camera Sub-Modal */}
      <QRScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleScannedCode}
      />
    </>
  );
};
