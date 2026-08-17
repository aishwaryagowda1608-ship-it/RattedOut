/**
 * Types & Interfaces for RattedOut (Social Deduction Game)
 * Inspired by Among Us & the Hazel Protocol documentation (roobscoob/among-us-protocol)
 */

export type GameState =
  | 'AUTH'
  | 'LOBBY'
  | 'ROLE_REVEAL'
  | 'PLAYING'
  | 'EMERGENCY_MEETING'
  | 'VOTING_RESULTS'
  | 'EXILE_ANIMATION'
  | 'GAME_OVER';

export type Role = 'CREWMATE' | 'IMPOSTOR' | 'GHOST_CREW' | 'GHOST_IMPOSTOR';

export type PlayerColorId =
  | 'coral'
  | 'mint'
  | 'sky'
  | 'butter'
  | 'lavender'
  | 'rosewood'
  | 'cerulean'
  | 'emerald'
  | 'graphite'
  | 'cream'
  | 'tangerine'
  | 'lilac';

export interface PlayerColor {
  id: PlayerColorId;
  name: string;
  primary: string;
  shadow: string;
  visor: string;
  badgeBg: string;
  badgeText: string;
  symbol: string; // Colorblind symbol / glyph
  symbolName: string;
}

export interface UserStats {
  gamesPlayed: number;
  crewmateWins: number;
  impostorWins: number;
  tasksCompleted: number;
  impostorKills: number;
  meetingsCalled: number;
  level: number;
  xp: number;
}

export interface UserAccount {
  id: string;
  username: string;
  email: string | null;
  isGuest: boolean;
  provider: 'guest' | 'email' | 'google' | 'apple';
  createdAt: number;
  favoriteColor: PlayerColorId;
  stats: UserStats;
}

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'pt';

export interface AppSettings {
  soundVolume: number; // 0 to 100
  musicVolume: number; // 0 to 100
  touchSensitivity: number; // 0.5 to 2.0 (default 1.0)
  colorblindMode: boolean;
  language: SupportedLanguage;
  hapticFeedback: boolean;
  showProtocolInspector: boolean;
  virtualJoystickFixed: boolean;
}

export type TaskType =
  | 'WIRES'
  | 'SWIPE_CARD'
  | 'DIVERT_POWER'
  | 'ASTEROIDS'
  | 'MANIFOLD'
  | 'DOWNLOAD_DATA'
  | 'MEDBAY_SCAN'
  | 'CALIBRATE';

export interface TaskDefinition {
  id: string;
  type: TaskType;
  name: string;
  room: string;
  x: number;
  y: number;
  completed: boolean;
  progress?: number; // 0 to 1
  totalSteps?: number;
  currentStep?: number;
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColorId;
  isAI: boolean;
  role: Role;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX?: number;
  targetY?: number;
  facing: 'left' | 'right';
  isMoving: boolean;
  isDead: boolean;
  killerId?: string;
  currentRoom: string;
  tasks: TaskDefinition[];
  votedFor: string | null | 'SKIP';
  hasVoted: boolean;
  killCooldown: number; // in seconds
  emergencyMeetingsRemaining?: number;
  isVenting: boolean;
  ventId?: string;
  alibiHistory: { room: string; time: number }[];
  suspicionScore: number; // 0 - 100 for AI logic
  aiPersonality: 'aggressive' | 'observant' | 'defensive' | 'quiet' | 'analytical';
}

export interface DeadBody {
  id: string;
  victimId: string;
  victimName: string;
  victimColor: PlayerColorId;
  x: number;
  y: number;
  room: string;
  reported: boolean;
}

export type SabotageType = 'OXYGEN' | 'REACTOR' | 'LIGHTS' | 'COMMS' | null;

export interface SabotageState {
  activeType: SabotageType;
  timer: number; // countdown in seconds
  maxTimer: number;
  fixedBy: string[]; // ids of fixed stations
  oxygenCodes: { station1: string; station2: string; entered1?: string; entered2?: string };
  reactorPads: { pad1: boolean; pad2: boolean };
  lightSwitches: boolean[]; // 5 switches, all must be on
  commsFrequency: { target: number; current: number };
}

export interface GameSettings {
  playerSpeed: number; // multiplier (e.g. 1.0)
  killCooldown: number; // seconds (e.g. 25)
  emergencyMeetings: number; // count per player (e.g. 1)
  discussionTime: number; // seconds
  votingTime: number; // seconds
  numImpostors: number; // 1 or 2
  totalTasksPerPlayer: number; // e.g. 4
  visualTasks: boolean; // e.g. MedBay scan shows animation
  anonymousVoting: boolean;
  impostorVision: number; // multiplier (1.5)
  crewVision: number; // multiplier (1.0)
  autoBotSpeed: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: PlayerColorId;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  isAccusation?: boolean;
}

export interface MeetingState {
  callerId: string;
  callerName: string;
  callerColor: PlayerColorId;
  isBodyReport: boolean;
  bodyVictimName?: string;
  bodyVictimColor?: PlayerColorId;
  phase: 'DISCUSSION' | 'VOTING' | 'TALLY';
  timeLeft: number;
  votes: Record<string, string | 'SKIP'>; // voterId -> targetId | 'SKIP'
  messages: ChatMessage[];
  ejectedPlayerId: string | null | 'TIE' | 'SKIP';
  impostorsRemaining: number;
}

// Hazel / Among Us Protocol simulation types (from roobscoob/among-us-protocol)
export type HazelSendOption = 'Reliable' | 'Unreliable' | 'Hello' | 'Disconnect' | 'Acknowledge' | 'Ping';

export type HazelRpcType =
  | 'PlayAnimation'
  | 'CompleteTask'
  | 'SyncSettings'
  | 'SetInfected'
  | 'Exiled'
  | 'CheckColor'
  | 'ReportDeadBody'
  | 'VotingComplete'
  | 'SendChat'
  | 'UpdateGameData'
  | 'MurderPlayer'
  | 'Vent'
  | 'RepairSystem'
  | 'CloseDoors'
  | 'SetScanner';

export interface ProtocolPacket {
  id: string;
  timestamp: number;
  sendOption: HazelSendOption;
  nonce?: number;
  tag: string;
  rpcType?: HazelRpcType;
  sender: string;
  payloadSummary: string;
  hexPreview: string;
  highlight?: boolean;
}

export interface MapRoom {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  hasVent?: boolean;
  ventIds?: string[];
  tasks?: TaskType[];
  isSecurity?: boolean;
  isAdmin?: boolean;
  isEmergency?: boolean;
}

export interface MapVent {
  id: string;
  room: string;
  x: number;
  y: number;
  connectedVents: string[];
}

export interface SecurityCamera {
  id: string;
  name: string;
  x: number;
  y: number;
  room: string;
  fovAngle: number;
}
