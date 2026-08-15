import { AppSettings, PlayerColorId, UserAccount, UserStats } from '../types';

const STORAGE_KEY_USER = 'protocol_space_user_session';
const STORAGE_KEY_ACCOUNTS = 'protocol_space_accounts_db';
const STORAGE_KEY_SETTINGS = 'protocol_space_app_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  soundVolume: 80,
  musicVolume: 60,
  touchSensitivity: 1.0,
  colorblindMode: false,
  language: 'en',
  hapticFeedback: true,
  showProtocolInspector: true,
  virtualJoystickFixed: false,
};

const DEFAULT_STATS: UserStats = {
  gamesPlayed: 0,
  crewmateWins: 0,
  impostorWins: 0,
  tasksCompleted: 0,
  impostorKills: 0,
  meetingsCalled: 0,
  level: 1,
  xp: 0,
};

export class AuthService {
  private currentUser: UserAccount | null = null;
  private settings: AppSettings = DEFAULT_SETTINGS;

  constructor() {
    this.loadSettings();
    this.loadSession();
  }

  public loadSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (data) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch {
      this.settings = DEFAULT_SETTINGS;
    }
    return this.settings;
  }

  public saveSettings(newSettings: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }
    return this.settings;
  }

  public getSettings(): AppSettings {
    return this.settings;
  }

  public loadSession(): UserAccount | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_USER);
      if (data) {
        this.currentUser = JSON.parse(data);
      }
    } catch {
      this.currentUser = null;
    }
    return this.currentUser;
  }

  public getCurrentUser(): UserAccount | null {
    return this.currentUser;
  }

  public saveSession(user: UserAccount) {
    this.currentUser = user;
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      // Also update in accounts DB if non-guest
      if (!user.isGuest) {
        const accounts = this.getAccountsDb();
        accounts[user.email || user.username] = user;
        localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
      }
    } catch (e) {
      console.warn('Failed to persist user session', e);
    }
  }

  public loginAsGuest(customName?: string, color?: PlayerColorId): UserAccount {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const guestUser: UserAccount = {
      id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      username: customName?.trim() || `Cadet #${randomSuffix}`,
      email: null,
      isGuest: true,
      provider: 'guest',
      createdAt: Date.now(),
      favoriteColor: color || 'sky',
      stats: { ...DEFAULT_STATS },
    };

    this.saveSession(guestUser);
    return guestUser;
  }

  public loginWithEmail(email: string, pass: string): { success: boolean; user?: UserAccount; error?: string } {
    if (!email || !pass) {
      return { success: false, error: 'Email and password are required.' };
    }

    const accounts = this.getAccountsDb();
    const existing = accounts[email.toLowerCase().trim()];

    if (!existing) {
      return { success: false, error: 'Account not found. Please register or play as Guest.' };
    }

    this.saveSession(existing);
    return { success: true, user: existing };
  }

  public registerWithEmail(
    username: string,
    email: string,
    pass: string,
    favoriteColor: PlayerColorId = 'sky'
  ): { success: boolean; user?: UserAccount; error?: string } {
    if (!username.trim() || username.length < 2) {
      return { success: false, error: 'Username must be at least 2 characters.' };
    }
    if (!email || !email.includes('@') || !email.includes('.')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!pass || pass.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const accounts = this.getAccountsDb();
    const cleanEmail = email.toLowerCase().trim();

    if (accounts[cleanEmail]) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const newUser: UserAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      username: username.trim(),
      email: cleanEmail,
      isGuest: false,
      provider: 'email',
      createdAt: Date.now(),
      favoriteColor,
      stats: { ...DEFAULT_STATS },
    };

    accounts[cleanEmail] = newUser;
    try {
      localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
    } catch {}

    this.saveSession(newUser);
    return { success: true, user: newUser };
  }

  public loginWithOAuth(provider: 'google' | 'apple'): UserAccount {
    const randomId = Math.floor(100 + Math.random() * 900);
    const username = provider === 'google' ? `Cosmonaut_${randomId}` : `Stargazer_${randomId}`;
    const email = `${username.toLowerCase()}@${provider === 'google' ? 'gmail.com' : 'icloud.com'}`;

    const accounts = this.getAccountsDb();
    let user = accounts[email];

    if (!user) {
      user = {
        id: `oauth_${provider}_${Date.now()}`,
        username,
        email,
        isGuest: false,
        provider,
        createdAt: Date.now(),
        favoriteColor: provider === 'google' ? 'coral' : 'graphite',
        stats: { ...DEFAULT_STATS, xp: 120, level: 2 },
      };
      accounts[email] = user;
      try {
        localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
      } catch {}
    }

    this.saveSession(user);
    return user;
  }

  public updateProfile(username: string, favoriteColor: PlayerColorId): UserAccount | null {
    if (!this.currentUser) return null;
    const updated: UserAccount = {
      ...this.currentUser,
      username: username.trim() || this.currentUser.username,
      favoriteColor,
    };
    this.saveSession(updated);
    return updated;
  }

  public recordGameResult(won: boolean, wasImpostor: boolean, tasksDone: number, kills: number, meetings: number) {
    if (!this.currentUser) return;
    const prev = this.currentUser.stats || { ...DEFAULT_STATS };
    const xpGained = (won ? 200 : 80) + tasksDone * 30 + kills * 50;
    const newXp = prev.xp + xpGained;
    const newLevel = Math.floor(newXp / 500) + 1;

    const updatedStats: UserStats = {
      gamesPlayed: prev.gamesPlayed + 1,
      crewmateWins: prev.crewmateWins + (!wasImpostor && won ? 1 : 0),
      impostorWins: prev.impostorWins + (wasImpostor && won ? 1 : 0),
      tasksCompleted: prev.tasksCompleted + tasksDone,
      impostorKills: prev.impostorKills + kills,
      meetingsCalled: prev.meetingsCalled + meetings,
      level: newLevel,
      xp: newXp,
    };

    const updatedUser: UserAccount = {
      ...this.currentUser,
      stats: updatedStats,
    };

    this.saveSession(updatedUser);
  }

  public logout() {
    this.currentUser = null;
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch {}
  }

  public deleteAccount(): boolean {
    if (!this.currentUser) return false;
    if (this.currentUser.email) {
      const accounts = this.getAccountsDb();
      delete accounts[this.currentUser.email];
      try {
        localStorage.setItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
      } catch {}
    }
    this.logout();
    return true;
  }

  private getAccountsDb(): Record<string, UserAccount> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ACCOUNTS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
}

export const authService = new AuthService();
