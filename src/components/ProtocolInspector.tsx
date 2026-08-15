import React, { useState, useEffect } from 'react';
import { ProtocolPacket } from '../types';
import { protocol } from '../utils/protocolLogger';
import { sound } from '../utils/audio';
import { Terminal, Shield, Filter, Trash2, X, ChevronRight, Binary, Info } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProtocolInspector: React.FC<Props> = ({ isOpen, onClose }) => {
  const [packets, setPackets] = useState<ProtocolPacket[]>(protocol.getPackets());
  const [filterRpcOnly, setFilterRpcOnly] = useState(false);
  const [selectedPacket, setSelectedPacket] = useState<ProtocolPacket | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);

  useEffect(() => {
    const unsub = protocol.subscribe((newPkt) => {
      setPackets([...protocol.getPackets()]);
    });
    return unsub;
  }, []);

  const handleClear = () => {
    sound.playClick();
    protocol.clear();
    setPackets([]);
    setSelectedPacket(null);
  };

  const filtered = filterRpcOnly
    ? packets.filter((p) => !!p.rpcType)
    : packets;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Binary className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-mono">Hazel Protocol Telemetry</h3>
            <span className="text-[11px] text-slate-500 font-mono">roobscoob/among-us-protocol</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowDocModal(true)}
            title="Protocol Documentation"
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-600 flex items-center justify-center"
          >
            <Info className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            title="Clear Packets"
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-600 flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-600 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-between text-xs font-mono">
        <button
          onClick={() => setFilterRpcOnly(!filterRpcOnly)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
            filterRpcOnly
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <Filter className="w-3 h-3" />
          <span>RPC Packets Only</span>
        </button>

        <span className="text-slate-400">{filtered.length} Packets Captured</span>
      </div>

      {/* Packet Stream List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 font-mono text-xs">
        {filtered.map((pkt) => {
          const isSelected = selectedPacket?.id === pkt.id;
          const isHighlight = pkt.highlight || pkt.rpcType === 'MurderPlayer' || pkt.rpcType === 'SetInfected';

          return (
            <div
              key={pkt.id}
              onClick={() => {
                sound.playClick();
                setSelectedPacket(pkt);
              }}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200'
                  : isHighlight
                  ? 'bg-rose-50/70 border-rose-200 hover:border-rose-300'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span
                  className={`px-1.5 py-0.5 rounded font-bold ${
                    pkt.sendOption === 'Reliable'
                      ? 'bg-emerald-100 text-emerald-800'
                      : pkt.sendOption === 'Unreliable'
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-sky-100 text-sky-800'
                  }`}
                >
                  {pkt.sendOption}
                </span>

                <span className="text-slate-400 text-[10px]">
                  {new Date(pkt.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>{pkt.tag}</span>
                {pkt.rpcType && (
                  <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px]">
                    RPC::{pkt.rpcType}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-600 mt-1 truncate">{pkt.payloadSummary}</p>

              <div className="mt-1 pt-1 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between">
                <span>HEX: {pkt.hexPreview}</span>
                {pkt.nonce !== undefined && <span>NONCE: #{pkt.nonce}</span>}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            No telemetry packets in buffer. Interact in the game to see live Hazel packets.
          </div>
        )}
      </div>

      {/* Packet Detail Drawer */}
      {selectedPacket && (
        <div className="p-4 bg-slate-900 text-slate-200 border-t border-slate-800 font-mono text-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-cyan-400 font-bold">PACKET INSPECTION</span>
            <button
              onClick={() => setSelectedPacket(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1 text-[11px]">
            <div>
              <span className="text-slate-400">MessageTag:</span> <strong>{selectedPacket.tag}</strong>
            </div>
            {selectedPacket.rpcType && (
              <div>
                <span className="text-slate-400">RpcMethod:</span>{' '}
                <strong className="text-indigo-300">{selectedPacket.rpcType}</strong>
              </div>
            )}
            <div>
              <span className="text-slate-400">Sender:</span> {selectedPacket.sender}
            </div>
            <div>
              <span className="text-slate-400">Payload:</span> {selectedPacket.payloadSummary}
            </div>
            <div className="p-2 bg-slate-950 rounded-lg text-emerald-400 mt-2 text-[10px] break-all border border-slate-800">
              Raw Hex: {selectedPacket.hexPreview} 00 FF 2A 1C 9B
            </div>
          </div>
        </div>
      )}

      {/* Protocol Architecture Modal */}
      {showDocModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 font-sans">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Binary className="w-5 h-5 text-indigo-600" />
                <span>Among Us Hazel Protocol Guide</span>
              </h3>
              <button
                onClick={() => setShowDocModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              <p>
                This game actively simulates the network packet architecture documented in{' '}
                <strong className="text-slate-900">roobscoob/among-us-protocol</strong>.
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 font-mono text-[11px]">
                <strong className="text-indigo-600 block">Hazel Packet Frame</strong>
                <div>• [0x00] SendOption (0x01: Reliable, 0x00: Unreliable, 0x08: Hello)</div>
                <div>• [0x01-0x02] Packet Nonce (Big Endian sequence id)</div>
                <div>• [0x03] Message Tag (0x05: GameData, 0x02: StartGame, etc.)</div>
                <div>• [0x04...] Inner RPCs & Packed Coordinates</div>
              </div>
              <p>
                RPCs like <code className="bg-slate-100 px-1 py-0.5 rounded">RpcSetInfected</code>,{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded">RpcMurderPlayer</code>,{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded">RpcCompleteTask</code>, and{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded">RpcExiled</code> are emitted in real-time as gameplay progresses.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
