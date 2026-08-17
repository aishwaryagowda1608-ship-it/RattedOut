import React, { useState, useEffect } from 'react';
import { MeetingState, Player, PlayerColorId } from '../types';
import { PLAYER_COLORS } from '../utils/mapData';
import { sound } from '../utils/audio';
import { Megaphone, Skull, Send, Check, ShieldAlert, SkipForward } from 'lucide-react';

interface Props {
  meeting: MeetingState;
  players: Player[];
  localPlayer: Player;
  onCastVote: (targetId: string | 'SKIP') => void;
  onSendMessage: (text: string) => void;
  onConcludeMeeting: () => void;
}

export const EmergencyMeeting: React.FC<Props> = ({
  meeting,
  players,
  localPlayer,
  onCastVote,
  onSendMessage,
  onConcludeMeeting,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<string | 'SKIP' | null>(null);
  const [hasConfirmedVote, setHasConfirmedVote] = useState(localPlayer.hasVoted);

  const alivePlayers = players.filter((p) => !p.isDead);
  const isLocalAlive = !localPlayer.isDead;

  useEffect(() => {
    sound.playEmergency();
  }, []);

  const handleVoteClick = (targetId: string | 'SKIP') => {
    if (!isLocalAlive || hasConfirmedVote) return;
    sound.playClick();
    setSelectedTarget(targetId);
  };

  const handleConfirmVote = () => {
    if (!selectedTarget || hasConfirmedVote) return;
    sound.playClick();
    setHasConfirmedVote(true);
    onCastVote(selectedTarget);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !isLocalAlive) return;
    sound.playClick();
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Meeting Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 px-6 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                meeting.isBodyReport ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {meeting.isBodyReport ? <Skull className="w-6 h-6" /> : <Megaphone className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
                  {meeting.isBodyReport ? 'DEAD BODY REPORTED' : 'EMERGENCY MEETING CALLED'}
                </span>
                <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-mono">
                  {meeting.phase}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>By</span>
                <span
                  className="font-extrabold px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: PLAYER_COLORS[meeting.callerColor]?.badgeBg || '#333',
                    color: PLAYER_COLORS[meeting.callerColor]?.badgeText || '#fff',
                  }}
                >
                  {meeting.callerName}
                </span>
                {meeting.isBodyReport && meeting.bodyVictimName && (
                  <span className="text-sm font-normal text-slate-300">
                    (Victim:{' '}
                    <strong className="text-rose-400 font-bold">{meeting.bodyVictimName}</strong>)
                  </span>
                )}
              </h2>
            </div>
          </div>

          <div className="text-right font-mono">
            <span className="text-xs text-slate-400 block uppercase">Voting Timer</span>
            <span className="text-2xl font-black text-amber-400">{Math.max(0, meeting.timeLeft)}s</span>
          </div>
        </div>

        {/* Main Content Grid: Voting Board + Discussion Feed */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left / Center: Players Voting Grid (7 cols) */}
          <div className="md:col-span-7 p-6 overflow-y-auto bg-slate-50 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Crew Manifest & Voting
                </span>
                <div className="flex items-center gap-2">
                  {meeting.phase === 'DISCUSSION' ? (
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-mono">
                      Discussion Phase
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-mono">
                      {Object.keys(meeting.votes).length} / {alivePlayers.length} Voted
                    </span>
                  )}
                </div>
              </div>

              {/* Ghost Mode Notice if local player is dead */}
              {!isLocalAlive && (
                <div className="mb-3 p-2 rounded-xl bg-slate-200 border border-slate-300 text-slate-700 text-xs flex items-center gap-2">
                  <Skull className="w-4 h-4 text-slate-500" />
                  <span className="font-medium">You are deceased (Ghost Spectator). You can read discussion but cannot vote.</span>
                </div>
              )}

              {/* Player Cards */}
              <div className="grid grid-cols-2 gap-3">
                {players.map((p) => {
                  const colorDef = PLAYER_COLORS[p.color];
                  const hasVoted = p.hasVoted || !!meeting.votes[p.id];
                  const isSelected = selectedTarget === p.id;
                  const isSelf = p.id === localPlayer.id;
                  const isVotingLocked = meeting.phase === 'DISCUSSION';

                  return (
                    <button
                      key={p.id}
                      disabled={p.isDead || !isLocalAlive || hasConfirmedVote || isVotingLocked}
                      onClick={() => handleVoteClick(p.id)}
                      className={`relative p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        p.isDead
                          ? 'opacity-40 bg-slate-200 border-slate-300 cursor-not-allowed'
                          : isVotingLocked
                          ? 'bg-white border-slate-200 cursor-default opacity-85'
                          : isSelected
                          ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-300 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Astronaut capsule avatar */}
                        <div
                          className="w-9 h-11 rounded-xl relative flex items-center justify-center shadow-xs shrink-0"
                          style={{ backgroundColor: colorDef.primary }}
                        >
                          <div
                            className="w-5 h-3 rounded-full absolute top-2 right-1.5"
                            style={{ backgroundColor: colorDef.visor }}
                          />
                          {p.isDead && (
                            <div className="absolute inset-0 bg-slate-900/60 rounded-xl flex items-center justify-center">
                              <Skull className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800 leading-tight">
                              {p.name}
                            </span>
                            {isSelf && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono font-medium">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            {p.isDead ? 'Deceased' : hasVoted ? 'Voted' : 'Thinking...'}
                          </span>
                        </div>
                      </div>

                      {/* Vote indicator badge */}
                      <div>
                        {!p.isDead && (
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                              hasVoted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {hasVoted ? <Check className="w-3.5 h-3.5" /> : '...'}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Voting Control Actions */}
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
              {/* Skip Vote Button */}
              <button
                disabled={!isLocalAlive || hasConfirmedVote || meeting.phase === 'DISCUSSION'}
                onClick={() => handleVoteClick('SKIP')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  selectedTarget === 'SKIP'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                } disabled:opacity-50`}
              >
                <SkipForward className="w-4 h-4" />
                <span>Skip Vote</span>
              </button>

              {meeting.phase === 'DISCUSSION' && (
                <span className="text-xs font-mono font-medium text-amber-600">
                  Discuss findings with the crew...
                </span>
              )}

              {/* Confirm Vote Button */}
              {isLocalAlive && !hasConfirmedVote && selectedTarget && meeting.phase !== 'DISCUSSION' && (
                <button
                  onClick={handleConfirmVote}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-transform"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Vote for {selectedTarget === 'SKIP' ? 'Skip' : players.find((p) => p.id === selectedTarget)?.name}</span>
                </button>
              )}

              {hasConfirmedVote && (
                <span className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Your vote is cast</span>
                </span>
              )}
            </div>
          </div>

          {/* Right: Discussion Chat Feed (5 cols) */}
          <div className="md:col-span-5 p-4 bg-white border-l border-slate-200 flex flex-col justify-between h-[420px] md:h-auto">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                Discussion Log
              </span>
              <span className="text-[11px] text-slate-400 font-mono">AI Protocol Sync</span>
            </div>

            {/* Chat messages list */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1 text-xs">
              {meeting.messages.map((msg) => {
                const isSystem = msg.isSystem;
                const senderColor = PLAYER_COLORS[msg.senderColor];

                if (isSystem) {
                  return (
                    <div
                      key={msg.id}
                      className="p-2 rounded-lg bg-amber-50/70 border border-amber-200/60 text-amber-900 text-[11px] text-center font-mono font-medium"
                    >
                      {msg.text}
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: senderColor?.primary || '#666' }}
                      />
                      <span className="font-bold text-slate-800 text-[11px]">{msg.senderName}</span>
                    </div>
                    <div
                      className={`p-2.5 rounded-xl rounded-tl-xs max-w-[92%] border ${
                        msg.isAccusation
                          ? 'bg-rose-50 border-rose-200 text-rose-950 font-medium'
                          : 'bg-slate-100 border-slate-200/80 text-slate-800'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input form */}
            {isLocalAlive ? (
              <form onSubmit={handleSendChat} className="mt-2 pt-2 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  placeholder="Share alibi, accuse, or ask location..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="w-9 h-9 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl flex items-center justify-center transition-transform shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="p-2 text-center text-xs text-slate-400 font-mono">
                Deceased players cannot communicate during meeting.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
