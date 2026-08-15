import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChatMessage,
  DeadBody,
  GameSettings,
  GameState,
  MeetingState,
  Player,
  PlayerColorId,
  Role,
  SabotageState,
  SabotageType,
  TaskDefinition,
  UserAccount,
  AppSettings,
} from './types';
import {
  COLOR_LIST,
  MAP_ROOMS,
  MAP_VENTS,
  TASK_STATIONS,
  EMERGENCY_BUTTON_POS,
  ADMIN_TABLE_POS,
  SECURITY_DESK_POS,
  PLAYER_COLORS,
} from './utils/mapData';
import { sound } from './utils/audio';
import { protocol } from './utils/protocolLogger';
import { authService, DEFAULT_SETTINGS } from './utils/auth';
import { partyService, LobbySession } from './utils/partyService';
import { LoginScreen } from './components/LoginScreen';
import { PauseMenu } from './components/PauseMenu';
import { SettingsModal } from './components/SettingsModal';
import { InvitePartyModal } from './components/InvitePartyModal';
import { Lobby } from './components/Lobby';
import { RoleReveal } from './components/RoleReveal';
import { GameCanvas } from './components/GameCanvas';
import { TaskModal } from './components/TaskModal';
import { EmergencyMeeting } from './components/EmergencyMeeting';
import { ExileAnimation } from './components/ExileAnimation';
import { GameOver } from './components/GameOver';
import { SabotagePanel } from './components/SabotagePanel';
import { SabotageFixModal } from './components/SabotageFixModal';
import { SecurityConsole } from './components/SecurityConsole';
import { AdminConsole } from './components/AdminConsole';
import { MapOverlay } from './components/MapOverlay';
import { TouchJoystick } from './components/TouchJoystick';
import { ProtocolInspector } from './components/ProtocolInspector';
import {
  Skull,
  Megaphone,
  Zap,
  MapPin,
  Flame,
  Wind,
  Lightbulb,
  Radio,
  Binary,
  Volume2,
  VolumeX,
  Eye,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  Shield,
  Menu,
} from 'lucide-react';

const BOT_NAMES = [
  'Atlas',
  'Nova',
  'Orion',
  'Vega',
  'Cosmo',
  'Echo',
  'Sol',
  'Luna',
  'Aero',
  'Helix',
  'Phoenix',
];

let msgCounter = 1;
const generateMessageId = (prefix = 'msg') => {
  msgCounter += 1;
  return `${prefix}_${Date.now()}_${msgCounter}_${Math.random().toString(36).slice(2, 7)}`;
};

let bodyCounter = 1;
const generateBodyId = () => {
  bodyCounter += 1;
  return `body_${Date.now()}_${bodyCounter}_${Math.random().toString(36).slice(2, 7)}`;
};

export default function App() {
  // Session & Settings State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => authService.loadSession());
  const [appSettings, setAppSettings] = useState<AppSettings>(() => authService.loadSettings());

  // Navigation & Game State (Starts at AUTH if no active session, otherwise LOBBY)
  const [gameState, setGameState] = useState<GameState>(() => (authService.loadSession() ? 'LOBBY' : 'AUTH'));
  const [playerName, setPlayerName] = useState<string>(() => authService.loadSession()?.username || 'Crew-Alpha');
  const [playerColor, setPlayerColor] = useState<PlayerColorId>(() => authService.loadSession()?.favoriteColor || 'sky');
  const [totalPlayersCount, setTotalPlayersCount] = useState<number>(6);

  // App Settings & Pause Modals
  const [showPauseMenu, setShowPauseMenu] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [settingsModalTab, setSettingsModalTab] = useState<'AUDIO' | 'CONTROLS' | 'ACCESSIBILITY' | 'ACCOUNT' | 'PRIVACY' | 'TOS'>('AUDIO');

  // Party / Room Code & Friend Invite State
  const [roomCode, setRoomCode] = useState<string>(() => partyService.generateUniqueRoomCode());
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteModalMode, setInviteModalMode] = useState<'HOST' | 'JOIN'>('HOST');
  const [activeLobby, setActiveLobby] = useState<LobbySession | null>(null);

  const [settings, setSettings] = useState<GameSettings>({
    playerSpeed: 1.0,
    killCooldown: 20,
    emergencyMeetings: 1,
    discussionTime: 15,
    votingTime: 20,
    numImpostors: 1,
    totalTasksPerPlayer: 3,
    visualTasks: true,
    anonymousVoting: false,
    impostorVision: 1.4,
    crewVision: 1.0,
    autoBotSpeed: 1.0,
  });

  // Gameplay entities
  const [players, setPlayers] = useState<Player[]>([]);
  const [deadBodies, setDeadBodies] = useState<DeadBody[]>([]);
  const [localPlayerId, setLocalPlayerId] = useState<string>('player_local');

  // Sabotage State
  const [sabotage, setSabotage] = useState<SabotageState>({
    activeType: null,
    timer: 30,
    maxTimer: 30,
    fixedBy: [],
    oxygenCodes: { station1: '48291', station2: '48291' },
    reactorPads: { pad1: false, pad2: false },
    lightSwitches: [false, true, false, false, true],
    commsFrequency: { target: 72, current: 40 },
  });

  // Active Modals
  const [activeTask, setActiveTask] = useState<TaskDefinition | null>(null);
  const [showSabotagePanel, setShowSabotagePanel] = useState<boolean>(false);
  const [showSabotageFix, setShowSabotageFix] = useState<boolean>(false);
  const [showSecurityConsole, setShowSecurityConsole] = useState<boolean>(false);
  const [showAdminConsole, setShowAdminConsole] = useState<boolean>(false);
  const [showMapOverlay, setShowMapOverlay] = useState<boolean>(false);
  const [isProtocolOpen, setIsProtocolOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());

  // Meeting & End Game
  const [meeting, setMeeting] = useState<MeetingState | null>(null);
  const [ejectedPlayer, setEjectedPlayer] = useState<Player | null | 'TIE' | 'SKIP'>(null);
  const [gameOverInfo, setGameOverInfo] = useState<{ winner: 'CREW' | 'IMPOSTORS'; reason: string } | null>(null);

  // Sync sound volumes whenever appSettings changes
  useEffect(() => {
    sound.setVolumes(appSettings.soundVolume, appSettings.musicVolume);
  }, [appSettings.soundVolume, appSettings.musicVolume]);

  // Host auto-registers/creates party lobby session
  useEffect(() => {
    if (gameState === 'LOBBY') {
      const lobby = partyService.createLobby(
        roomCode,
        {
          id: localPlayerId,
          name: playerName,
          color: playerColor,
        },
        settings,
        totalPlayersCount
      );
      setActiveLobby(lobby);
    }
  }, [gameState, roomCode, playerName, playerColor, settings, totalPlayersCount, localPlayerId]);

  // Handle Incoming Deep Link / Query Param on mount
  useEffect(() => {
    const queryJoinCode = partyService.parseJoinCodeFromUrl();
    if (queryJoinCode) {
      partyService.clearJoinCodeFromUrl();
      const validation = partyService.validateRoomCode(queryJoinCode);
      if (validation.valid && validation.lobby) {
        setRoomCode(queryJoinCode);
        setTotalPlayersCount(validation.lobby.maxPlayers);
        setSettings(validation.lobby.settings);
        setActiveLobby(validation.lobby);
        sound.playTaskStep();
        protocol.log(
          'Reliable',
          'Hello',
          playerName,
          `Joined party via Deep Link room code [${queryJoinCode}]`,
          undefined,
          true
        );
      } else {
        // Show join modal with diagnostic error
        setInviteModalMode('JOIN');
        setShowInviteModal(true);
      }
    }
  }, [playerName]);

  // Auth Callbacks
  const handleAuthSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setPlayerName(user.username);
    setPlayerColor(user.favoriteColor);
    setGameState('LOBBY');
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setShowPauseMenu(false);
    setShowSettingsModal(false);
    setShowInviteModal(false);
    setGameState('AUTH');
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    const saved = authService.saveSettings(newSettings);
    setAppSettings(saved);
  };

  const handleUpdateSettings = (partial: Partial<AppSettings>) => {
    const updated = { ...appSettings, ...partial };
    const saved = authService.saveSettings(updated);
    setAppSettings(saved);
  };

  const handleOpenSettingsTab = (tab: 'AUDIO' | 'CONTROLS' | 'ACCESSIBILITY' | 'ACCOUNT' | 'PRIVACY' | 'TOS') => {
    setSettingsModalTab(tab);
    setShowSettingsModal(true);
  };

  const handleOpenInviteModal = (mode: 'HOST' | 'JOIN' = 'HOST') => {
    sound.playClick();
    setInviteModalMode(mode);
    setShowInviteModal(true);
  };

  const handleRegenerateRoomCode = () => {
    const newCode = partyService.generateUniqueRoomCode();
    setRoomCode(newCode);
    const updated = partyService.createLobby(
      newCode,
      {
        id: localPlayerId,
        name: playerName,
        color: playerColor,
      },
      settings,
      totalPlayersCount
    );
    setActiveLobby(updated);
    protocol.log(
      'Reliable',
      'SyncSettings',
      playerName,
      `Host rotated party room code to [${newCode}]`,
      undefined,
      true
    );
  };

  const handleJoinPartyRoom = (code: string) => {
    const result = partyService.joinLobby(code, {
      id: localPlayerId,
      name: playerName,
      color: playerColor,
    });

    if (result.success && result.lobby) {
      setRoomCode(code);
      setTotalPlayersCount(result.lobby.maxPlayers);
      setSettings(result.lobby.settings);
      setActiveLobby(result.lobby);
      setShowInviteModal(false);
      sound.playTaskStep();
      protocol.log(
        'Reliable',
        'Hello',
        playerName,
        `Connected to lobby session [${code}] (Host: ${result.lobby.hostName})`,
        undefined,
        true
      );
    }
  };

  const handleLeaveGame = () => {
    sound.playClick();
    protocol.log(
      'Reliable',
      'Disconnect',
      localPlayer.name,
      'Client requested graceful round exit (Pause Menu)',
      undefined,
      true
    );

    // Reset gameplay modals & state
    setShowPauseMenu(false);
    setActiveTask(null);
    setShowSabotagePanel(false);
    setShowSabotageFix(false);
    setShowSecurityConsole(false);
    setShowAdminConsole(false);
    setShowMapOverlay(false);
    setMeeting(null);
    setSabotage((prev) => ({ ...prev, activeType: null }));
    setGameState('LOBBY');
  };

  // Keyboard controls tracking
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const joystickVector = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const localPlayer = players.find((p) => p.id === localPlayerId) || {
    id: localPlayerId,
    name: playerName,
    color: playerColor,
    isAI: false,
    role: 'CREWMATE',
    x: 800,
    y: 260,
    vx: 0,
    vy: 0,
    facing: 'right',
    isMoving: false,
    isDead: false,
    currentRoom: 'Cafeteria',
    tasks: [],
    votedFor: null,
    hasVoted: false,
    killCooldown: 20,
    isVenting: false,
    alibiHistory: [],
    suspicionScore: 0,
    aiPersonality: 'analytical',
  };

  // Helper: Find current room from X, Y
  const getRoomAt = useCallback((x: number, y: number): string => {
    for (const room of MAP_ROOMS) {
      if (x >= room.x && x <= room.x + room.width && y >= room.y && y <= room.y + room.height) {
        return room.name;
      }
    }
    return 'Corridor';
  }, []);

  // Initialize Game Players & Tasks
  const initializeGame = (roleOverride?: 'CREWMATE' | 'IMPOSTOR') => {
    sound.playClick();
    const availableColors = [...COLOR_LIST].filter((c) => c !== playerColor);
    const shuffledBots = [...BOT_NAMES].sort(() => Math.random() - 0.5);

    // Determine Impostor count
    const numImps = settings.numImpostors;
    const isLocalImp = roleOverride ? roleOverride === 'IMPOSTOR' : Math.random() < numImps / totalPlayersCount;

    // Create Local Player
    const userRole: Role = isLocalImp ? 'IMPOSTOR' : 'CREWMATE';
    const localTasks: TaskDefinition[] = isLocalImp
      ? []
      : TASK_STATIONS.slice(0, settings.totalTasksPerPlayer).map((t, idx) => ({
          id: `task_local_${idx}`,
          type: t.type,
          name: t.name,
          room: t.room,
          x: t.x,
          y: t.y,
          completed: false,
        }));

    const newPlayers: Player[] = [
      {
        id: 'player_local',
        name: playerName,
        color: playerColor,
        isAI: false,
        role: userRole,
        x: 780 + (Math.random() * 40 - 20),
        y: 240 + (Math.random() * 40 - 20),
        vx: 0,
        vy: 0,
        facing: 'right',
        isMoving: false,
        isDead: false,
        currentRoom: 'Cafeteria',
        tasks: localTasks,
        votedFor: null,
        hasVoted: false,
        killCooldown: settings.killCooldown,
        isVenting: false,
        alibiHistory: [{ room: 'Cafeteria', time: Date.now() }],
        suspicionScore: 0,
        aiPersonality: 'analytical',
      },
    ];

    let remainingImps = isLocalImp ? numImps - 1 : numImps;

    // Create AI Players
    for (let i = 0; i < totalPlayersCount - 1; i++) {
      const isBotImp = remainingImps > 0 && Math.random() < 0.45;
      if (isBotImp) remainingImps--;

      const botColor = availableColors[i % availableColors.length];
      const botName = shuffledBots[i % shuffledBots.length];
      const botTasks: TaskDefinition[] = isBotImp
        ? []
        : TASK_STATIONS.slice((i * 2) % 10, ((i * 2) % 10) + settings.totalTasksPerPlayer).map((t, idx) => ({
            id: `task_bot_${i}_${idx}`,
            type: t.type,
            name: t.name,
            room: t.room,
            x: t.x,
            y: t.y,
            completed: false,
          }));

      newPlayers.push({
        id: `bot_${i}`,
        name: botName,
        color: botColor,
        isAI: true,
        role: isBotImp ? 'IMPOSTOR' : 'CREWMATE',
        x: 740 + (i % 3) * 40,
        y: 200 + Math.floor(i / 3) * 40,
        vx: 0,
        vy: 0,
        facing: 'left',
        isMoving: false,
        isDead: false,
        currentRoom: 'Cafeteria',
        tasks: botTasks,
        votedFor: null,
        hasVoted: false,
        killCooldown: settings.killCooldown,
        isVenting: false,
        alibiHistory: [{ room: 'Cafeteria', time: Date.now() }],
        suspicionScore: 0,
        aiPersonality: ['observant', 'aggressive', 'defensive', 'quiet', 'analytical'][i % 5] as any,
      });
    }

    setPlayers(newPlayers);
    setDeadBodies([]);
    setSabotage({
      activeType: null,
      timer: 30,
      maxTimer: 30,
      fixedBy: [],
      oxygenCodes: { station1: '58291', station2: '58291' },
      reactorPads: { pad1: false, pad2: false },
      lightSwitches: [false, true, false, false, true],
      commsFrequency: { target: 72, current: 40 },
    });

    // Log Hazel Protocol Event (roobscoob/among-us-protocol)
    protocol.log('Reliable', 'StartGame', 'Host', `Session initialized with ${totalPlayersCount} players`, undefined, true);
    protocol.log('Reliable', 'GameData', 'Host', `RpcSetInfected assigned to ${numImps} Impostors`, 'SetInfected', true);

    setGameState('ROLE_REVEAL');
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;

      if (e.key === 'm' || e.key === 'M') {
        setShowMapOverlay((prev) => !prev);
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        setIsProtocolOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        if (showInviteModal) {
          setShowInviteModal(false);
        } else if (showSettingsModal) {
          setShowSettingsModal(false);
        } else if (activeTask) {
          setActiveTask(null);
        } else if (showSabotagePanel) {
          setShowSabotagePanel(false);
        } else if (showSabotageFix) {
          setShowSabotageFix(false);
        } else if (showSecurityConsole) {
          setShowSecurityConsole(false);
        } else if (showAdminConsole) {
          setShowAdminConsole(false);
        } else if (showMapOverlay) {
          setShowMapOverlay(false);
        } else if (isProtocolOpen) {
          setIsProtocolOpen(false);
        } else if (gameState === 'PLAYING' || gameState === 'EMERGENCY_MEETING') {
          sound.playClick();
          setShowPauseMenu((prev) => !prev);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    gameState,
    showInviteModal,
    showSettingsModal,
    activeTask,
    showSabotagePanel,
    showSabotageFix,
    showSecurityConsole,
    showAdminConsole,
    showMapOverlay,
    isProtocolOpen,
  ]);

  // Proximity Detections for Action Buttons
  const nearbyTask = React.useMemo(() => {
    if (localPlayer.isDead) return null;
    return (
      localPlayer.tasks?.find((t) => {
        if (t.completed) return false;
        const dist = Math.hypot(localPlayer.x - t.x, localPlayer.y - t.y);
        return dist < 65;
      }) || null
    );
  }, [localPlayer]);

  const nearbyBody = React.useMemo(() => {
    if (localPlayer.isDead) return null;
    return (
      deadBodies.find((b) => {
        const dist = Math.hypot(localPlayer.x - b.x, localPlayer.y - b.y);
        return dist < 85;
      }) || null
    );
  }, [localPlayer, deadBodies]);

  const nearbyVent = React.useMemo(() => {
    if (!localPlayer.role.includes('IMPOSTOR') || localPlayer.isDead) return null;
    const vent = MAP_VENTS.find((v) => Math.hypot(localPlayer.x - v.x, localPlayer.y - v.y) < 55);
    return vent ? vent.id : null;
  }, [localPlayer]);

  const nearbyKillTarget = React.useMemo(() => {
    if (!localPlayer.role.includes('IMPOSTOR') || localPlayer.isDead || localPlayer.killCooldown > 0) return null;
    return (
      players.find((p) => {
        if (p.id === localPlayer.id || p.isDead || p.role.includes('IMPOSTOR') || p.isVenting) return false;
        const dist = Math.hypot(localPlayer.x - p.x, localPlayer.y - p.y);
        return dist < 75;
      }) || null
    );
  }, [localPlayer, players]);

  const canCallEmergency = React.useMemo(() => {
    if (localPlayer.isDead) return false;
    const dist = Math.hypot(localPlayer.x - EMERGENCY_BUTTON_POS.x, localPlayer.y - EMERGENCY_BUTTON_POS.y);
    return dist < 65 && sabotage.activeType === null;
  }, [localPlayer, sabotage.activeType]);

  const canUseAdmin = React.useMemo(() => {
    if (localPlayer.isDead) return false;
    const dist = Math.hypot(localPlayer.x - ADMIN_TABLE_POS.x, localPlayer.y - ADMIN_TABLE_POS.y);
    return dist < 60;
  }, [localPlayer]);

  const canUseSecurity = React.useMemo(() => {
    if (localPlayer.isDead) return false;
    const dist = Math.hypot(localPlayer.x - SECURITY_DESK_POS.x, localPlayer.y - SECURITY_DESK_POS.y);
    return dist < 60;
  }, [localPlayer]);

  const canFixSabotage = React.useMemo(() => {
    if (!sabotage.activeType || localPlayer.isDead) return false;
    const room = localPlayer.currentRoom;
    if (sabotage.activeType === 'OXYGEN' && (room.includes('O2') || room.includes('Admin'))) return true;
    if (sabotage.activeType === 'REACTOR' && room.includes('Reactor')) return true;
    if (sabotage.activeType === 'LIGHTS' && room.includes('Electrical')) return true;
    if (sabotage.activeType === 'COMMS' && room.includes('Comms')) return true;
    return false;
  }, [sabotage.activeType, localPlayer]);

  // Execute Kill Action
  const handleKill = (victim: Player) => {
    sound.playKill();
    protocol.log(
      'Reliable',
      'GameData',
      localPlayer.name,
      `RpcMurderPlayer executed on ${victim.name}`,
      'MurderPlayer',
      true
    );

    // Update Victim State
    setPlayers((prev) =>
      prev.map((p) => (p.id === victim.id ? { ...p, isDead: true, role: 'GHOST_CREW' } : p))
    );

    // Spawn Dead Body
    const newBody: DeadBody = {
      id: generateBodyId(),
      victimId: victim.id,
      victimName: victim.name,
      victimColor: victim.color,
      x: victim.x,
      y: victim.y,
      room: victim.currentRoom,
      reported: false,
    };
    setDeadBodies((prev) => [...prev, newBody]);

    // Reset Kill Cooldown
    setPlayers((prev) =>
      prev.map((p) => (p.id === localPlayer.id ? { ...p, killCooldown: settings.killCooldown } : p))
    );

    // Check Win Condition
    checkWinConditions();
  };

  // Report Dead Body
  const handleReport = (body: DeadBody) => {
    sound.playEmergency();
    protocol.log(
      'Reliable',
      'GameData',
      localPlayer.name,
      `RpcReportDeadBody (Victim: ${body.victimName})`,
      'ReportDeadBody',
      true
    );

    startEmergencyMeeting(localPlayer, true, body);
  };

  // Call Emergency Button
  const handleCallEmergency = () => {
    sound.playEmergency();
    protocol.log(
      'Reliable',
      'GameData',
      localPlayer.name,
      'RpcReportDeadBody (Emergency Console Activated)',
      'ReportDeadBody',
      true
    );

    startEmergencyMeeting(localPlayer, false);
  };

  // Vent Hop Action
  const handleVent = (ventId: string) => {
    sound.playVent();
    const currentVent = MAP_VENTS.find((v) => v.id === ventId);
    if (!currentVent) return;

    if (!localPlayer.isVenting) {
      // Enter Vent
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === localPlayer.id ? { ...p, isVenting: true, ventId: currentVent.id } : p
        )
      );
      protocol.log('Reliable', 'GameData', localPlayer.name, `RpcVent (Entered ${currentVent.room})`, 'Vent');
    } else {
      // Cycle to next connected vent or exit
      const targetVentId = currentVent.connectedVents[0];
      const targetVent = MAP_VENTS.find((v) => v.id === targetVentId);

      if (targetVent) {
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === localPlayer.id
              ? {
                  ...p,
                  isVenting: false,
                  x: targetVent.x,
                  y: targetVent.y + 20,
                  currentRoom: targetVent.room,
                }
              : p
          )
        );
        protocol.log(
          'Reliable',
          'GameData',
          localPlayer.name,
          `RpcVent (Exited in ${targetVent.room})`,
          'Vent'
        );
      }
    }
  };

  // Sabotage Trigger
  const handleTriggerSabotage = (type: SabotageType) => {
    if (!type) return;
    sound.playEmergency();
    protocol.log('Reliable', 'GameData', localPlayer.name, `RpcRepairSystem sabotage triggered: ${type}`, 'RepairSystem', true);

    setSabotage((prev) => ({
      ...prev,
      activeType: type,
      timer: type === 'REACTOR' ? 25 : 30,
      maxTimer: type === 'REACTOR' ? 25 : 30,
    }));
  };

  // Sabotage Fixed
  const handleFixSabotage = () => {
    sound.playTaskComplete();
    protocol.log('Reliable', 'GameData', localPlayer.name, `RpcRepairSystem resolved: ${sabotage.activeType}`, 'RepairSystem', true);
    setSabotage((prev) => ({ ...prev, activeType: null }));
    setShowSabotageFix(false);
  };

  // Task Completion
  const handleCompleteTask = (taskId: string) => {
    sound.playTaskComplete();
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === localPlayer.id) {
          const updated = p.tasks.map((t) => (t.id === taskId ? { ...t, completed: true } : t));
          return { ...p, tasks: updated };
        }
        return p;
      })
    );

    const taskObj = localPlayer.tasks.find((t) => t.id === taskId);
    protocol.log(
      'Reliable',
      'GameData',
      localPlayer.name,
      `RpcCompleteTask [${taskObj?.name || 'Task'}]`,
      'CompleteTask',
      true
    );

    setActiveTask(null);
    checkWinConditions();
  };

  // Start Meeting Flow
  const startEmergencyMeeting = (caller: Player, isBody: boolean, body?: DeadBody) => {
    // Reset player states
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        hasVoted: false,
        votedFor: null,
        isVenting: false,
        x: 800 + (Math.random() * 40 - 20),
        y: 240 + (Math.random() * 40 - 20),
      }))
    );

    const initialMessages: ChatMessage[] = [
      {
        id: generateMessageId('msg_sys'),
        senderId: 'SYSTEM',
        senderName: 'STATION AI',
        senderColor: 'graphite',
        text: isBody
          ? `Dead body of ${body?.victimName} discovered in ${body?.room}!`
          : `Emergency meeting initiated by ${caller.name}!`,
        timestamp: Date.now(),
        isSystem: true,
      },
    ];

    // Initial AI discussion message from caller
    if (isBody && body) {
      initialMessages.push({
        id: generateMessageId('msg_caller'),
        senderId: caller.id,
        senderName: caller.name,
        senderColor: caller.color,
        text: `Found ${body.victimName}'s body in ${body.room}! Anyone else nearby?`,
        timestamp: Date.now(),
      });
    }

    setMeeting({
      callerId: caller.id,
      callerName: caller.name,
      callerColor: caller.color,
      isBodyReport: isBody,
      bodyVictimName: body?.victimName,
      bodyVictimColor: body?.victimColor,
      phase: 'DISCUSSION',
      timeLeft: settings.discussionTime + settings.votingTime,
      votes: {},
      messages: initialMessages,
      ejectedPlayerId: null,
      impostorsRemaining: players.filter((p) => p.role.includes('IMPOSTOR') && !p.isDead).length,
    });

    setGameState('EMERGENCY_MEETING');
  };

  // Cast Vote
  const handleCastVote = (targetId: string | 'SKIP') => {
    if (!meeting) return;
    sound.playClick();
    protocol.log(
      'Reliable',
      'GameData',
      localPlayer.name,
      `RpcVotingComplete (Voted for: ${targetId})`,
      'VotingComplete'
    );

    setPlayers((prev) =>
      prev.map((p) => (p.id === localPlayer.id ? { ...p, hasVoted: true, votedFor: targetId } : p))
    );

    setMeeting((prev) => (prev ? { ...prev, votes: { ...prev.votes, [localPlayer.id]: targetId } } : null));
  };

  // Send Chat Message during Meeting
  const handleSendMeetingChat = (text: string) => {
    if (!meeting) return;
    const newMsg: ChatMessage = {
      id: generateMessageId('msg_user'),
      senderId: localPlayer.id,
      senderName: localPlayer.name,
      senderColor: localPlayer.color,
      text,
      timestamp: Date.now(),
      isAccusation: text.toLowerCase().includes('sus') || text.toLowerCase().includes('impostor'),
    };

    setMeeting((prev) => (prev ? { ...prev, messages: [...prev.messages, newMsg] } : null));
    protocol.log('Unreliable', 'GameData', localPlayer.name, `RpcSendChat: "${text}"`, 'SendChat');
  };

  // Tally Votes and Conclude Meeting
  const concludeMeeting = () => {
    if (!meeting) return;

    // Count votes
    const voteCounts: Record<string, number> = { SKIP: 0 };
    Object.values(meeting.votes).forEach((target) => {
      const targetKey = String(target);
      voteCounts[targetKey] = (voteCounts[targetKey] || 0) + 1;
    });

    let maxVotes = 0;
    let ejectedId: string | null | 'TIE' | 'SKIP' = 'SKIP';
    let isTie = false;

    Object.entries(voteCounts).forEach(([candidate, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        ejectedId = candidate;
        isTie = false;
      } else if (count === maxVotes && maxVotes > 0) {
        isTie = true;
      }
    });

    if (isTie) ejectedId = 'TIE';

    const ejectedPlayerObj =
      ejectedId && ejectedId !== 'SKIP' && ejectedId !== 'TIE'
        ? players.find((p) => p.id === ejectedId) || null
        : (ejectedId as any);

    // Apply ejection to player state
    if (typeof ejectedPlayerObj === 'object' && ejectedPlayerObj !== null) {
      setPlayers((prev) =>
        prev.map((p) => (p.id === ejectedPlayerObj.id ? { ...p, isDead: true, role: 'GHOST_CREW' } : p))
      );
      protocol.log('Reliable', 'GameData', 'Host', `RpcExiled (${ejectedPlayerObj.name})`, 'Exiled', true);
    }

    setEjectedPlayer(ejectedPlayerObj);
    setGameState('EXILE_ANIMATION');
  };

  // Check Win Conditions
  const checkWinConditions = () => {
    const aliveImps = players.filter((p) => p.role.includes('IMPOSTOR') && !p.isDead).length;
    const aliveCrew = players.filter((p) => !p.role.includes('IMPOSTOR') && !p.isDead).length;

    // Condition 1: All Impostors eliminated
    if (aliveImps === 0) {
      const isImp = localPlayer.role.includes('IMPOSTOR');
      const won = !isImp;
      const tasksDone = localPlayer.tasks.filter((t) => t.completed).length;
      authService.recordGameResult(won, isImp, tasksDone, 0, 0);
      setCurrentUser(authService.loadSession());

      setGameOverInfo({
        winner: 'CREW',
        reason: 'All Impostors have been successfully identified and ejected!',
      });
      setGameState('GAME_OVER');
      return;
    }

    // Condition 2: Impostors equal or outnumber living Crew
    if (aliveImps >= aliveCrew) {
      const isImp = localPlayer.role.includes('IMPOSTOR');
      const won = isImp;
      const tasksDone = localPlayer.tasks.filter((t) => t.completed).length;
      authService.recordGameResult(won, isImp, tasksDone, 0, 0);
      setCurrentUser(authService.loadSession());

      setGameOverInfo({
        winner: 'IMPOSTORS',
        reason: 'Impostors equaled the living crew and took control of the station.',
      });
      setGameState('GAME_OVER');
      return;
    }

    // Condition 3: All Crew Tasks Complete
    const allCrewTasks = players
      .filter((p) => !p.role.includes('IMPOSTOR'))
      .flatMap((p) => p.tasks);

    if (allCrewTasks.length > 0 && allCrewTasks.every((t) => t.completed)) {
      const isImp = localPlayer.role.includes('IMPOSTOR');
      const won = !isImp;
      const tasksDone = localPlayer.tasks.filter((t) => t.completed).length;
      authService.recordGameResult(won, isImp, tasksDone, 0, 0);
      setCurrentUser(authService.loadSession());

      setGameOverInfo({
        winner: 'CREW',
        reason: 'The crew completed all station maintenance tasks before sabotage succeeded!',
      });
      setGameState('GAME_OVER');
      return;
    }
  };

  // Main Simulation Loop (Movement, AI decisions, Timers)
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const interval = setInterval(() => {
      // 1. Move Local Player
      let dx = 0;
      let dy = 0;
      const speed = 4.2 * settings.playerSpeed;

      if (keysPressed.current['w'] || keysPressed.current['arrowup']) dy -= speed;
      if (keysPressed.current['s'] || keysPressed.current['arrowdown']) dy += speed;
      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) dx -= speed;
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) dx += speed;

      // Joystick inputs
      if (joystickVector.current.x !== 0 || joystickVector.current.y !== 0) {
        dx += joystickVector.current.x * speed;
        dy += joystickVector.current.y * speed;
      }

      // Collect pending game events outside setState
      const pendingBodies: DeadBody[] = [];
      const pendingKills: { killerName: string; victimName: string; victimId: string }[] = [];
      let reportedEvent: { reporter: Player; body: DeadBody } | null = null;

      setPlayers((prev) => {
        const nextPlayers = prev.map((p) => {
          if (p.id === localPlayer.id) {
            if (p.isVenting) return p;

            let nextX = p.x + dx;
            let nextY = p.y + dy;

            // Bounds constrain
            nextX = Math.max(40, Math.min(1600, nextX));
            nextY = Math.max(40, Math.min(1060, nextY));

            const isMoving = Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1;
            const facing = dx < -0.1 ? 'left' : dx > 0.1 ? 'right' : p.facing;
            const currentRoom = getRoomAt(nextX, nextY);

            if (isMoving && Math.random() < 0.15) {
              sound.playFootstep();
            }

            const killCooldown = Math.max(0, p.killCooldown - 0.05);

            return {
              ...p,
              x: nextX,
              y: nextY,
              vx: dx,
              vy: dy,
              isMoving,
              facing,
              currentRoom,
              killCooldown,
            };
          }

          // AI BOT Logic
          if (p.isAI && !p.isDead && !p.isVenting) {
            let botTargetX = p.targetX || p.x;
            let botTargetY = p.targetY || p.y;

            const distToTarget = Math.hypot(p.x - botTargetX, p.y - botTargetY);
            if (distToTarget < 30 || !p.targetX) {
              const randomStation = TASK_STATIONS[Math.floor(Math.random() * TASK_STATIONS.length)];
              botTargetX = randomStation.x + (Math.random() * 30 - 15);
              botTargetY = randomStation.y + (Math.random() * 30 - 15);
            }

            const angle = Math.atan2(botTargetY - p.y, botTargetX - p.x);
            const botSpeed = 2.8 * settings.autoBotSpeed;
            const bdx = Math.cos(angle) * botSpeed;
            const bdy = Math.sin(angle) * botSpeed;

            const nextBX = p.x + bdx;
            const nextBY = p.y + bdy;
            const currentRoom = getRoomAt(nextBX, nextBY);

            let nextKillCD = Math.max(0, p.killCooldown - 0.05);

            // Bot Impostor Kill Chance
            if (p.role.includes('IMPOSTOR') && nextKillCD <= 0) {
              const victim = prev.find(
                (other) =>
                  other.id !== p.id &&
                  !other.isDead &&
                  !other.role.includes('IMPOSTOR') &&
                  Math.hypot(p.x - other.x, p.y - other.y) < 65
              );

              if (victim) {
                pendingKills.push({ killerName: p.name, victimName: victim.name, victimId: victim.id });
                pendingBodies.push({
                  id: generateBodyId(),
                  victimId: victim.id,
                  victimName: victim.name,
                  victimColor: victim.color,
                  x: victim.x,
                  y: victim.y,
                  room: victim.currentRoom,
                  reported: false,
                });
                nextKillCD = settings.killCooldown;
              }
            }

            // AI Crewmate Body Detection
            if (!p.role.includes('IMPOSTOR') && !reportedEvent) {
              const spottedBody = deadBodies.find(
                (b) => !b.reported && Math.hypot(p.x - b.x, p.y - b.y) < 110
              );
              if (spottedBody) {
                spottedBody.reported = true;
                reportedEvent = { reporter: p, body: spottedBody };
              }
            }

            return {
              ...p,
              x: nextBX,
              y: nextBY,
              targetX: botTargetX,
              targetY: botTargetY,
              isMoving: true,
              facing: bdx < 0 ? 'left' : 'right',
              currentRoom,
              killCooldown: nextKillCD,
            };
          }

          return p;
        });

        // Apply any pending kills to the players list
        if (pendingKills.length > 0) {
          const victimIds = new Set(pendingKills.map((k) => k.victimId));
          return nextPlayers.map((p) => (victimIds.has(p.id) ? { ...p, isDead: true, role: 'GHOST_CREW' } : p));
        }

        return nextPlayers;
      });

      // Process side effects outside setPlayers
      if (pendingKills.length > 0) {
        sound.playKill();
        pendingKills.forEach((k) => {
          protocol.log('Reliable', 'GameData', k.killerName, `RpcMurderPlayer executed on ${k.victimName}`, 'MurderPlayer', true);
        });
        setDeadBodies((prev) => [...prev, ...pendingBodies]);
      }

      if (reportedEvent) {
        startEmergencyMeeting((reportedEvent as any).reporter, true, (reportedEvent as any).body);
      }

      // 3. Sabotage Countdown Timer
      if (sabotage.activeType === 'OXYGEN' || sabotage.activeType === 'REACTOR') {
        setSabotage((prev) => {
          const nextTimer = prev.timer - 0.05;
          if (nextTimer <= 0) {
            setGameOverInfo({
              winner: 'IMPOSTORS',
              reason: `Station ${prev.activeType} failure reached critical point! Impostors sabotaged life support.`,
            });
            setGameState('GAME_OVER');
            return { ...prev, timer: 0 };
          }
          return { ...prev, timer: nextTimer };
        });
      }
    }, 50);

    return () => clearInterval(interval);
  }, [gameState, settings, localPlayer, deadBodies, sabotage.activeType, getRoomAt]);

  // Meeting Timer Countdown & AI Bots Discussion / Voting
  useEffect(() => {
    if (gameState !== 'EMERGENCY_MEETING' || !meeting) return;

    const interval = setInterval(() => {
      setMeeting((prev) => {
        if (!prev) return null;
        const nextTime = prev.timeLeft - 1;

        let updatedMessages = prev.messages;
        let updatedVotes = { ...prev.votes };

        // Trigger AI chat messages periodically
        if (nextTime === settings.votingTime + 8) {
          const aliveBots = players.filter((p) => p.isAI && !p.isDead);
          if (aliveBots.length > 0) {
            const randomBot = aliveBots[Math.floor(Math.random() * aliveBots.length)];
            const textOptions = [
              `I was in ${randomBot.currentRoom} doing tasks.`,
              `Where was the body found?`,
              `Did anyone see anyone venting?`,
              `I was with ${players[0]?.name || 'someone'} earlier.`,
              `Skip vote if we are not sure?`,
            ];
            const text = textOptions[Math.floor(Math.random() * textOptions.length)];
            const aiMsg: ChatMessage = {
              id: generateMessageId('msg_ai'),
              senderId: randomBot.id,
              senderName: randomBot.name,
              senderColor: randomBot.color,
              text,
              timestamp: Date.now(),
            };
            updatedMessages = [...prev.messages, aiMsg];
          }
        }

        // Trigger AI Bots Voting around voting phase
        if (nextTime <= settings.votingTime && Object.keys(updatedVotes).length < players.filter((p) => !p.isDead).length - 1) {
          const aliveBots = players.filter((p) => p.isAI && !p.isDead && !updatedVotes[p.id]);
          if (aliveBots.length > 0) {
            const votingBot = aliveBots[0];
            const candidatePool = players.filter((p) => !p.isDead && p.id !== votingBot.id);
            const botVote = Math.random() < 0.3 ? 'SKIP' : candidatePool[Math.floor(Math.random() * candidatePool.length)]?.id || 'SKIP';
            updatedVotes[votingBot.id] = botVote;
          }
        }

        // If time reaches 0, conclude meeting
        if (nextTime <= 0) {
          clearInterval(interval);
          setTimeout(() => {
            concludeMeeting();
          }, 0);
          return { ...prev, timeLeft: 0, messages: updatedMessages, votes: updatedVotes };
        }

        return { ...prev, timeLeft: nextTime, messages: updatedMessages, votes: updatedVotes };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, meeting?.phase, players, settings]);

  // Overall Task Completion Progress
  const totalTasks = players.filter((p) => !p.role.includes('IMPOSTOR')).flatMap((p) => p.tasks).length;
  const completedTasks = players
    .filter((p) => !p.role.includes('IMPOSTOR'))
    .flatMap((p) => p.tasks)
    .filter((t) => t.completed).length;
  const taskProgressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="relative w-screen h-screen bg-[#F8F9FA] text-[#1E293B] overflow-hidden flex flex-col font-sans select-none">
      {/* 0. AUTH / ONBOARDING VIEW */}
      {gameState === 'AUTH' && (
        <LoginScreen
          onLoginSuccess={handleAuthSuccess}
          onOpenPrivacy={() => handleOpenSettingsTab('PRIVACY')}
          onOpenTerms={() => handleOpenSettingsTab('TOS')}
          colorblindMode={appSettings.colorblindMode}
        />
      )}

      {/* 1. LOBBY VIEW */}
      {gameState === 'LOBBY' && (
        <Lobby
          playerName={playerName}
          setPlayerName={setPlayerName}
          playerColor={playerColor}
          setPlayerColor={setPlayerColor}
          settings={settings}
          setSettings={setSettings}
          totalPlayers={totalPlayersCount}
          setTotalPlayers={setTotalPlayersCount}
          onStartGame={initializeGame}
          onToggleProtocol={() => setIsProtocolOpen(true)}
          currentUser={currentUser}
          onOpenSettings={() => handleOpenSettingsTab('AUDIO')}
          onOpenPrivacy={() => handleOpenSettingsTab('PRIVACY')}
          onOpenTerms={() => handleOpenSettingsTab('TOS')}
          onLogout={handleLogout}
          colorblindMode={appSettings.colorblindMode}
          roomCode={roomCode}
          onOpenInviteModal={handleOpenInviteModal}
          activeLobby={activeLobby}
        />
      )}

      {/* 2. ROLE REVEAL VIEW */}
      {gameState === 'ROLE_REVEAL' && (
        <RoleReveal player={localPlayer} onFinished={() => setGameState('PLAYING')} />
      )}

      {/* 3. ACTIVE PLAYING VIEW */}
      {gameState === 'PLAYING' && (
        <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
          {/* Top HUD Bar */}
          <header className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
            {/* Task Progress Bar & Room Indicator */}
            <div className="flex flex-col gap-1.5 pointer-events-auto">
              {/* Task Bar */}
              <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 p-2.5 px-4 rounded-2xl shadow-sm flex items-center gap-3">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  TOTAL TASKS
                </span>
                <div className="w-36 sm:w-56 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    style={{ width: `${taskProgressPercent}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                  />
                </div>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {completedTasks} / {totalTasks}
                </span>
              </div>

              {/* Current Room Badge */}
              <div className="flex items-center gap-2">
                <span className="bg-slate-900 text-white text-xs font-mono font-bold px-3 py-1 rounded-xl shadow-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{localPlayer.currentRoom}</span>
                </span>
                {localPlayer.role.includes('IMPOSTOR') && (
                  <span className="bg-rose-600 text-white text-xs font-mono font-bold px-3 py-1 rounded-xl shadow-xs">
                    IMPOSTOR
                  </span>
                )}
              </div>
            </div>

            {/* Sabotage Alert Banner (if active) */}
            {sabotage.activeType && (
              <div className="bg-rose-600 text-white px-4 py-2 rounded-2xl shadow-lg flex items-center gap-2 animate-bounce pointer-events-auto">
                <AlertTriangle className="w-4 h-4 text-yellow-300" />
                <span className="text-xs font-mono font-bold uppercase">
                  CRITICAL: {sabotage.activeType} SABOTAGED ({Math.max(0, sabotage.timer).toFixed(0)}s)
                </span>
              </div>
            )}

            {/* Quick Action Icons (Top Right) */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={() => {
                  sound.playClick();
                  setShowPauseMenu(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/90 hover:bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700 rounded-2xl shadow-xs transition-colors"
                title="Pause / Options [Esc]"
              >
                <Menu className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Menu</span>
              </button>

              <button
                onClick={() => setShowMapOverlay(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/90 hover:bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700 rounded-2xl shadow-xs transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Map [M]</span>
              </button>

              <button
                onClick={() => setIsProtocolOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/90 hover:bg-white border border-slate-200 text-xs font-mono font-bold text-indigo-600 rounded-2xl shadow-xs transition-colors"
              >
                <Binary className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Protocol</span>
              </button>

              <button
                onClick={() => {
                  const m = sound.toggleMute();
                  setIsMuted(m);
                }}
                className="w-10 h-10 rounded-2xl bg-white/90 hover:bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-xs transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-slate-700" />}
              </button>
            </div>
          </header>

          {/* Canvas Viewport */}
          <main className="w-full h-full flex items-center justify-center">
            <GameCanvas
              players={players}
              localPlayer={localPlayer}
              deadBodies={deadBodies}
              sabotage={sabotage}
              nearbyTask={nearbyTask}
              nearbyBody={nearbyBody}
              nearbyVent={nearbyVent}
              nearbyKillTarget={nearbyKillTarget}
              canCallEmergency={canCallEmergency}
              canUseAdmin={canUseAdmin}
              canUseSecurity={canUseSecurity}
              canFixSabotage={canFixSabotage}
              colorblindMode={appSettings.colorblindMode}
            />
          </main>

          {/* Bottom HUD: Virtual Joystick + Action Buttons */}
          <footer className="absolute bottom-6 left-6 right-6 z-30 flex items-end justify-between pointer-events-none">
            {/* Left: Touch Joystick for Mobile / Touch */}
            <div className="pointer-events-auto">
              <TouchJoystick
                onMove={(vx, vy) => {
                  joystickVector.current = { x: vx, y: vy };
                }}
              />
            </div>

            {/* Right: Floating Action Control Matrix */}
            <div className="flex items-center gap-3 pointer-events-auto">
              {/* Report Button */}
              {nearbyBody && (
                <button
                  onClick={() => handleReport(nearbyBody)}
                  className="flex flex-col items-center justify-center w-20 h-20 rounded-3xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white shadow-xl transition-transform border-2 border-amber-300 animate-pulse"
                >
                  <Megaphone className="w-7 h-7" />
                  <span className="text-[11px] font-mono font-bold mt-1">REPORT</span>
                </button>
              )}

              {/* Emergency Button */}
              {canCallEmergency && (
                <button
                  onClick={handleCallEmergency}
                  className="flex flex-col items-center justify-center w-20 h-20 rounded-3xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-xl transition-transform border-2 border-rose-400 animate-pulse"
                >
                  <Skull className="w-7 h-7" />
                  <span className="text-[11px] font-mono font-bold mt-1">EMERGENCY</span>
                </button>
              )}

              {/* Impostor Kill Button */}
              {localPlayer.role.includes('IMPOSTOR') && (
                <button
                  disabled={!nearbyKillTarget || localPlayer.killCooldown > 0}
                  onClick={() => nearbyKillTarget && handleKill(nearbyKillTarget)}
                  className={`flex flex-col items-center justify-center w-20 h-20 rounded-3xl border-2 shadow-xl transition-transform ${
                    nearbyKillTarget && localPlayer.killCooldown <= 0
                      ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-400 active:scale-95 animate-bounce'
                      : 'bg-slate-800 text-slate-400 border-slate-700 opacity-60'
                  }`}
                >
                  <Skull className="w-7 h-7" />
                  <span className="text-[10px] font-mono font-bold mt-1">
                    {localPlayer.killCooldown > 0 ? `${localPlayer.killCooldown.toFixed(0)}s` : 'KILL [Q]'}
                  </span>
                </button>
              )}

              {/* Impostor Sabotage Menu Button */}
              {localPlayer.role.includes('IMPOSTOR') && (
                <button
                  onClick={() => setShowSabotagePanel(true)}
                  className="flex flex-col items-center justify-center w-18 h-18 rounded-3xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-rose-400 shadow-xl transition-transform border border-slate-700"
                >
                  <Flame className="w-6 h-6" />
                  <span className="text-[10px] font-mono font-bold mt-1">SABOTAGE</span>
                </button>
              )}

              {/* Impostor Vent Button */}
              {localPlayer.role.includes('IMPOSTOR') && nearbyVent && (
                <button
                  onClick={() => handleVent(nearbyVent)}
                  className="flex flex-col items-center justify-center w-18 h-18 rounded-3xl bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white shadow-xl transition-transform border-2 border-cyan-400"
                >
                  <RotateCcw className="w-6 h-6" />
                  <span className="text-[10px] font-mono font-bold mt-1">
                    {localPlayer.isVenting ? 'EXIT VENT' : 'VENT [V]'}
                  </span>
                </button>
              )}

              {/* Repair Sabotage Button */}
              {canFixSabotage && (
                <button
                  onClick={() => setShowSabotageFix(true)}
                  className="flex flex-col items-center justify-center w-20 h-20 rounded-3xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-xl transition-transform border-2 border-yellow-300 animate-bounce"
                >
                  <AlertTriangle className="w-7 h-7" />
                  <span className="text-[10px] font-mono font-bold mt-1">REPAIR</span>
                </button>
              )}

              {/* Admin Console Button */}
              {canUseAdmin && (
                <button
                  onClick={() => setShowAdminConsole(true)}
                  className="flex flex-col items-center justify-center w-18 h-18 rounded-3xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-xl transition-transform border-2 border-indigo-300"
                >
                  <Eye className="w-6 h-6" />
                  <span className="text-[10px] font-mono font-bold mt-1">ADMIN</span>
                </button>
              )}

              {/* Security Console Button */}
              {canUseSecurity && (
                <button
                  onClick={() => setShowSecurityConsole(true)}
                  className="flex flex-col items-center justify-center w-18 h-18 rounded-3xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-xl transition-transform border-2 border-emerald-300"
                >
                  <Eye className="w-6 h-6" />
                  <span className="text-[10px] font-mono font-bold mt-1">CAMERAS</span>
                </button>
              )}

              {/* Primary USE / TASK Button */}
              {nearbyTask && (
                <button
                  onClick={() => setActiveTask(nearbyTask)}
                  className="flex flex-col items-center justify-center w-20 h-20 rounded-3xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-xl transition-transform border-2 border-indigo-400 animate-pulse"
                >
                  <Zap className="w-7 h-7" />
                  <span className="text-[10px] font-mono font-bold mt-1">USE [E]</span>
                </button>
              )}
            </div>
          </footer>
        </div>
      )}

      {/* 4. EMERGENCY MEETING & VOTING VIEW */}
      {gameState === 'EMERGENCY_MEETING' && meeting && (
        <EmergencyMeeting
          meeting={meeting}
          players={players}
          localPlayer={localPlayer}
          onCastVote={handleCastVote}
          onSendMessage={handleSendMeetingChat}
          onConcludeMeeting={concludeMeeting}
        />
      )}

      {/* 5. EXILE ANIMATION VIEW */}
      {gameState === 'EXILE_ANIMATION' && (
        <ExileAnimation
          ejectedPlayer={ejectedPlayer}
          impostorsRemaining={players.filter((p) => p.role.includes('IMPOSTOR') && !p.isDead).length}
          onFinished={() => {
            checkWinConditions();
            if (gameState !== 'GAME_OVER') {
              setGameState('PLAYING');
            }
          }}
        />
      )}

      {/* 6. GAME OVER VIEW */}
      {gameState === 'GAME_OVER' && gameOverInfo && (
        <GameOver
          winner={gameOverInfo.winner}
          reason={gameOverInfo.reason}
          players={players}
          localPlayer={localPlayer}
          onPlayAgain={() => setGameState('LOBBY')}
        />
      )}

      {/* Interactive Modals */}
      {activeTask && (
        <TaskModal
          task={activeTask}
          player={localPlayer}
          onComplete={handleCompleteTask}
          onClose={() => setActiveTask(null)}
        />
      )}

      {showSabotagePanel && (
        <SabotagePanel
          sabotage={sabotage}
          onTriggerSabotage={handleTriggerSabotage}
          onClose={() => setShowSabotagePanel(false)}
        />
      )}

      {showSabotageFix && (
        <SabotageFixModal
          sabotage={sabotage}
          onFixSabotage={handleFixSabotage}
          onClose={() => setShowSabotageFix(false)}
        />
      )}

      {showSecurityConsole && (
        <SecurityConsole players={players} onClose={() => setShowSecurityConsole(false)} />
      )}

      {showAdminConsole && (
        <AdminConsole players={players} onClose={() => setShowAdminConsole(false)} />
      )}

      {showMapOverlay && (
        <MapOverlay
          players={players}
          localPlayer={localPlayer}
          deadBodies={deadBodies}
          sabotage={sabotage}
          onClose={() => setShowMapOverlay(false)}
        />
      )}

      {/* In-Game Pause Menu */}
      <PauseMenu
        isOpen={showPauseMenu}
        onResume={() => setShowPauseMenu(false)}
        onOpenSettings={() => {
          setShowPauseMenu(false);
          handleOpenSettingsTab('AUDIO');
        }}
        onLeaveGame={handleLeaveGame}
      />

      {/* Comprehensive Settings & Legal Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={appSettings}
        onUpdateSettings={handleUpdateSettings}
        onSaveSettings={handleSaveSettings}
        currentUser={currentUser}
        onUserUpdated={(user) => {
          if (user) {
            setCurrentUser(user);
            setPlayerName(user.username);
            setPlayerColor(user.favoriteColor);
          }
        }}
        onLogout={handleLogout}
        initialTab={settingsModalTab}
      />

      {/* Invite Party & Join by Code Modal */}
      <InvitePartyModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomCode={roomCode}
        onRegenerateCode={handleRegenerateRoomCode}
        onJoinRoom={handleJoinPartyRoom}
        activeLobby={activeLobby}
        initialMode={inviteModalMode}
      />

      {/* Protocol Stream Inspector */}
      <ProtocolInspector isOpen={isProtocolOpen} onClose={() => setIsProtocolOpen(false)} />
    </div>
  );
}
