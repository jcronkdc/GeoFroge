// Collaborative Cursor Control Service
// Real-time cursor sharing for geological map interpretation
// Uses Ably Realtime for low-latency cursor position sync

import Ably from 'ably';

const ABLY_API_KEY = import.meta.env.VITE_ABLY_API_KEY;

export interface CursorPosition {
  userId: string;
  userName: string;
  userColor: string; // Unique color for each user
  x: number; // Normalized coordinates (0-1)
  y: number; // Normalized coordinates (0-1)
  timestamp: number;
  isActive: boolean; // Is cursor currently visible?
}

export interface CursorClick {
  userId: string;
  userName: string;
  x: number;
  y: number;
  timestamp: number;
  annotation?: string; // Optional text annotation
}

export class CursorControlService {
  private client: Ably.Realtime | null = null;
  private apiKey: string;
  private userColors: Map<string, string> = new Map();
  
  // Predefined colors for users (high contrast for visibility)
  private colorPalette = [
    '#FF6B6B', // Red
    '#4ECDC4', // Cyan
    '#FFE66D', // Yellow
    '#A8E6CF', // Mint
    '#FF8B94', // Pink
    '#C7CEEA', // Lavender
    '#FFDAC1', // Peach
    '#95E1D3', // Teal
    '#F38181', // Coral
    '#AA96DA', // Purple
  ];

  constructor() {
    this.apiKey = ABLY_API_KEY;
    if (this.apiKey) {
      this.client = new Ably.Realtime(this.apiKey);
      this.setupErrorHandling();
    } else {
      console.warn('⚠️ Ably API key not found. Cursor control will be disabled.');
    }
  }

  private setupErrorHandling(): void {
    if (!this.client) return;

    this.client.connection.on('connected', () => {
      console.log('✅ Cursor control connected');
    });

    this.client.connection.on('disconnected', () => {
      console.warn('⚠️ Cursor control disconnected');
    });

    this.client.connection.on('failed', (error) => {
      console.error('❌ Cursor control failed:', error);
    });
  }

  // Assign unique color to user
  private getUserColor(userId: string): string {
    if (!this.userColors.has(userId)) {
      const colorIndex = this.userColors.size % this.colorPalette.length;
      this.userColors.set(userId, this.colorPalette[colorIndex]);
    }
    return this.userColors.get(userId)!;
  }

  // Get channel for cursor control in a specific context
  private getCursorChannel(sessionId: string): Ably.Types.RealtimeChannelCallbacks {
    if (!this.client) {
      throw new Error('Ably client not initialized');
    }
    const channelName = `cursor-control-${sessionId}`;
    return this.client.channels.get(channelName);
  }

  /**
   * Publish cursor position to all users in session
   * 
   * @param sessionId - Unique session ID (e.g., project ID, map view ID)
   * @param userId - Current user's ID
   * @param userName - Current user's display name
   * @param x - Normalized X coordinate (0-1)
   * @param y - Normalized Y coordinate (0-1)
   * @param isActive - Whether cursor is currently in view
   */
  async publishCursorPosition(
    sessionId: string,
    userId: string,
    userName: string,
    x: number,
    y: number,
    isActive: boolean = true
  ): Promise<void> {
    if (!this.client) {
      throw new Error('Ably client not initialized');
    }

    const channel = this.getCursorChannel(sessionId);
    const userColor = this.getUserColor(userId);

    const position: CursorPosition = {
      userId,
      userName,
      userColor,
      x,
      y,
      timestamp: Date.now(),
      isActive
    };

    await channel.publish('cursor-move', position);
  }

  /**
   * Publish cursor click (for annotations, markers)
   * 
   * @param sessionId - Unique session ID
   * @param userId - Current user's ID
   * @param userName - Current user's display name
   * @param x - Normalized X coordinate (0-1)
   * @param y - Normalized Y coordinate (0-1)
   * @param annotation - Optional text annotation (e.g., "Check this vein")
   */
  async publishCursorClick(
    sessionId: string,
    userId: string,
    userName: string,
    x: number,
    y: number,
    annotation?: string
  ): Promise<void> {
    if (!this.client) {
      throw new Error('Ably client not initialized');
    }

    const channel = this.getCursorChannel(sessionId);

    const click: CursorClick = {
      userId,
      userName,
      x,
      y,
      timestamp: Date.now(),
      annotation
    };

    await channel.publish('cursor-click', click);
  }

  /**
   * Subscribe to cursor movements from other users
   * 
   * @param sessionId - Unique session ID
   * @param callback - Called when any user moves their cursor
   * @returns Unsubscribe function
   */
  async subscribeToCursorMovements(
    sessionId: string,
    callback: (position: CursorPosition) => void
  ): Promise<() => void> {
    if (!this.client) {
      throw new Error('Ably client not initialized');
    }

    const channel = this.getCursorChannel(sessionId);

    const cursorHandler = (message: Ably.Types.Message) => {
      const position: CursorPosition = message.data;
      callback(position);
    };

    channel.subscribe('cursor-move', cursorHandler);

    // Return unsubscribe function
    return () => {
      channel.unsubscribe('cursor-move', cursorHandler);
    };
  }

  /**
   * Subscribe to cursor clicks from other users
   * 
   * @param sessionId - Unique session ID
   * @param callback - Called when any user clicks
   * @returns Unsubscribe function
   */
  async subscribeToCursorClicks(
    sessionId: string,
    callback: (click: CursorClick) => void
  ): Promise<() => void> {
    if (!this.client) {
      throw new Error('Ably client not initialized');
    }

    const channel = this.getCursorChannel(sessionId);

    const clickHandler = (message: Ably.Types.Message) => {
      const click: CursorClick = message.data;
      callback(click);
    };

    channel.subscribe('cursor-click', clickHandler);

    // Return unsubscribe function
    return () => {
      channel.unsubscribe('cursor-click', clickHandler);
    };
  }

  /**
   * Leave cursor control session (hide cursor from all users)
   */
  async leaveCursorSession(
    sessionId: string,
    userId: string,
    userName: string
  ): Promise<void> {
    // Publish final "inactive" cursor position
    await this.publishCursorPosition(sessionId, userId, userName, 0, 0, false);
  }

  isConfigured(): boolean {
    return !!this.client;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
  }
}

// Singleton instance
export const cursorControlService = new CursorControlService();

