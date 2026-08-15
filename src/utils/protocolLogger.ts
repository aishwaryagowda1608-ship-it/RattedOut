import { HazelRpcType, HazelSendOption, ProtocolPacket } from '../types';

let packetCounter = 1;

export class ProtocolLogger {
  private packets: ProtocolPacket[] = [];
  private listeners: ((packet: ProtocolPacket) => void)[] = [];

  public log(
    sendOption: HazelSendOption,
    tag: string,
    sender: string,
    payloadSummary: string,
    rpcType?: HazelRpcType,
    highlight: boolean = false
  ): ProtocolPacket {
    packetCounter += 1;
    const nonce = sendOption === 'Reliable' ? (packetCounter * 7) % 65535 : undefined;
    const hex = this.generateSimulatedHex(sendOption, tag, rpcType);

    const packet: ProtocolPacket = {
      id: `pkt_${Date.now()}_${packetCounter}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      sendOption,
      nonce,
      tag,
      rpcType,
      sender,
      payloadSummary,
      hexPreview: hex,
      highlight,
    };

    this.packets.unshift(packet);
    if (this.packets.length > 80) {
      this.packets.pop();
    }

    // Defer listener notifications to prevent React setState-in-render errors
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => {
        this.listeners.forEach((fn) => fn(packet));
      });
    } else {
      setTimeout(() => {
        this.listeners.forEach((fn) => fn(packet));
      }, 0);
    }

    return packet;
  }

  private generateSimulatedHex(sendOption: string, tag: string, rpcType?: string): string {
    const optByte = sendOption === 'Reliable' ? '01' : sendOption === 'Unreliable' ? '00' : '08';
    const tagByte = tag === 'GameData' ? '05' : tag === 'StartGame' ? '02' : '06';
    const rpcByte = rpcType ? (rpcType.charCodeAt(0) % 255).toString(16).padStart(2, '0') : '00';
    const randomBytes = Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, '0')
    ).join(' ');

    return `${optByte} ${tagByte} ${rpcByte} ${randomBytes}`.toUpperCase();
  }

  public getPackets(): ProtocolPacket[] {
    return this.packets;
  }

  public subscribe(fn: (packet: ProtocolPacket) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  public clear() {
    this.packets = [];
  }
}

export const protocol = new ProtocolLogger();
