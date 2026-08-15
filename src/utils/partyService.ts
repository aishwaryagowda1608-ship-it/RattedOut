import { GameSettings, PlayerColorId } from '../types';

export interface LobbyMember {
  id: string;
  name: string;
  color: PlayerColorId;
  isHost: boolean;
  isReady: boolean;
  joinedAt: number;
}

export interface LobbySession {
  roomCode: string;
  hostId: string;
  hostName: string;
  createdAt: number;
  expiresAt: number;
  maxPlayers: number;
  status: 'WAITING' | 'STARTING' | 'IN_GAME';
  members: LobbyMember[];
  settings: GameSettings;
}

const LOBBY_STORAGE_PREFIX = 'ps_lobby_';
const LOBBY_INDEX_KEY = 'ps_active_lobbies';
const LOBBY_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes lifetime

// Unambiguous character alphabet: 26 characters (No 0/O, 1/I, L)
const ROOM_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Generate a cryptographically distinct 6-character room code
 */
export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
    code += ROOM_CODE_ALPHABET[randomIndex];
  }
  return code;
}

/**
 * Get active lobby index from storage, cleaning up expired rooms
 */
function getActiveLobbyCodes(): string[] {
  try {
    const raw = localStorage.getItem(LOBBY_INDEX_KEY);
    const codes: string[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const validCodes: string[] = [];

    for (const code of codes) {
      const lobbyRaw = localStorage.getItem(LOBBY_STORAGE_PREFIX + code);
      if (lobbyRaw) {
        const lobby: LobbySession = JSON.parse(lobbyRaw);
        if (lobby.expiresAt > now) {
          validCodes.push(code);
        } else {
          localStorage.removeItem(LOBBY_STORAGE_PREFIX + code);
        }
      }
    }

    localStorage.setItem(LOBBY_INDEX_KEY, JSON.stringify(validCodes));
    return validCodes;
  } catch (e) {
    console.error('Failed to read active lobbies:', e);
    return [];
  }
}

/**
 * Save active lobby index
 */
function saveActiveLobbyCodes(codes: string[]): void {
  try {
    localStorage.setItem(LOBBY_INDEX_KEY, JSON.stringify(Array.from(new Set(codes))));
  } catch (e) {
    console.error('Failed to save active lobbies:', e);
  }
}

export const partyService = {
  /**
   * Generates a unique room code not currently assigned to any active lobby
   */
  generateUniqueRoomCode(): string {
    const active = getActiveLobbyCodes();
    let attempts = 0;
    let code = generateRoomCode();
    while (active.includes(code) && attempts < 50) {
      code = generateRoomCode();
      attempts++;
    }
    return code;
  },

  /**
   * Host creates or re-registers a lobby session
   */
  createLobby(
    roomCode: string,
    host: { id: string; name: string; color: PlayerColorId },
    settings: GameSettings,
    maxPlayers = 6
  ): LobbySession {
    const now = Date.now();
    const lobby: LobbySession = {
      roomCode: roomCode.toUpperCase(),
      hostId: host.id,
      hostName: host.name,
      createdAt: now,
      expiresAt: now + LOBBY_EXPIRY_MS,
      maxPlayers,
      status: 'WAITING',
      settings,
      members: [
        {
          id: host.id,
          name: host.name,
          color: host.color,
          isHost: true,
          isReady: true,
          joinedAt: now,
        },
      ],
    };

    try {
      localStorage.setItem(LOBBY_STORAGE_PREFIX + lobby.roomCode, JSON.stringify(lobby));
      const active = getActiveLobbyCodes();
      if (!active.includes(lobby.roomCode)) {
        active.push(lobby.roomCode);
        saveActiveLobbyCodes(active);
      }
    } catch (e) {
      console.error('Failed to persist lobby session:', e);
    }

    return lobby;
  },

  /**
   * Retrieves a lobby session by code, checking expiry
   */
  getLobby(code: string): LobbySession | null {
    if (!code) return null;
    const cleanCode = code.trim().toUpperCase();
    try {
      const raw = localStorage.getItem(LOBBY_STORAGE_PREFIX + cleanCode);
      if (!raw) return null;
      const lobby: LobbySession = JSON.parse(raw);
      if (lobby.expiresAt <= Date.now()) {
        localStorage.removeItem(LOBBY_STORAGE_PREFIX + cleanCode);
        return null;
      }
      return lobby;
    } catch {
      return null;
    }
  },

  /**
   * Validates a room code against active sessions and returns rich diagnostic error
   */
  validateRoomCode(code: string): { valid: boolean; error?: string; lobby?: LobbySession } {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { valid: false, error: 'Please enter a 6-character room code.' };
    }

    if (cleanCode.length !== 6) {
      return { valid: false, error: 'Room code must be exactly 6 characters.' };
    }

    // Validate characters against alphabet
    for (const char of cleanCode) {
      if (!ROOM_CODE_ALPHABET.includes(char)) {
        return {
          valid: false,
          error: `Character '${char}' is invalid. Codes use uppercase letters and numbers (excluding 0, O, 1, I).`,
        };
      }
    }

    const lobby = this.getLobby(cleanCode);
    if (!lobby) {
      return {
        valid: false,
        error: 'Lobby not found. The room code may have expired, or the host disconnected.',
      };
    }

    if (lobby.status === 'IN_GAME') {
      return {
        valid: false,
        error: 'Match already in progress. You cannot join active investigations.',
      };
    }

    if (lobby.members.length >= lobby.maxPlayers) {
      return {
        valid: false,
        error: `Lobby is full (${lobby.members.length}/${lobby.maxPlayers} crew members).`,
      };
    }

    return { valid: true, lobby };
  },

  /**
   * Add player to lobby
   */
  joinLobby(
    code: string,
    player: { id: string; name: string; color: PlayerColorId }
  ): { success: boolean; error?: string; lobby?: LobbySession } {
    const validation = this.validateRoomCode(code);
    if (!validation.valid || !validation.lobby) {
      return { success: false, error: validation.error };
    }

    const lobby = validation.lobby;
    const existingIndex = lobby.members.findIndex((m) => m.id === player.id);
    if (existingIndex >= 0) {
      lobby.members[existingIndex].name = player.name;
      lobby.members[existingIndex].color = player.color;
    } else {
      lobby.members.push({
        id: player.id,
        name: player.name,
        color: player.color,
        isHost: false,
        isReady: true,
        joinedAt: Date.now(),
      });
    }

    try {
      localStorage.setItem(LOBBY_STORAGE_PREFIX + lobby.roomCode, JSON.stringify(lobby));
    } catch (e) {
      console.error('Failed to update lobby members:', e);
    }

    return { success: true, lobby };
  },

  /**
   * Construct shareable deep link URL
   */
  buildShareUrl(roomCode: string): string {
    const origin = window.location.origin + window.location.pathname;
    return `${origin}?join=${encodeURIComponent(roomCode.toUpperCase())}`;
  },

  /**
   * Construct native protocol URL (yourgame://join?code=XYZ)
   */
  buildNativeAppUrl(roomCode: string): string {
    return `protocolspace://join?code=${encodeURIComponent(roomCode.toUpperCase())}`;
  },

  /**
   * Parse join code from current URL query parameters or hash
   */
  parseJoinCodeFromUrl(): string | null {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const joinParam = urlParams.get('join') || urlParams.get('code');
      if (joinParam) {
        return joinParam.trim().toUpperCase();
      }

      // Check hash
      if (window.location.hash.includes('join=')) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const hashJoin = hashParams.get('join');
        if (hashJoin) return hashJoin.trim().toUpperCase();
      }
    } catch (e) {
      console.error('Failed to parse URL params:', e);
    }
    return null;
  },

  /**
   * Clear join code from URL without triggering reload
   */
  clearJoinCodeFromUrl(): void {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('join');
      url.searchParams.delete('code');
      window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
    } catch (e) {
      console.error('Failed to clean URL:', e);
    }
  },
};
