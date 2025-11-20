// Ably Real-Time Messaging Service
// ACTUAL integration - real-time sync between users

import Ably from 'ably';

const ABLY_API_KEY = import.meta.env.VITE_ABLY_API_KEY;

export interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'alert';
}

export interface PresenceData {
  userId: string;
  userName: string;
  status: 'online' | 'away';
}

export class AblyService {
  private client: Ably.Realtime | null = null;
  private apiKey: string;

  constructor() {
    this.apiKey = ABLY_API_KEY;
    if (this.apiKey) {
      this.client = new Ably.Realtime(this.apiKey);
      this.setupErrorHandling();
    } else {
      console.warn('⚠️ Ably API key not found. Real-time features will be limited.');
    }
  }

  private setupErrorHandling(): void {
    if (!this.client) return;

    this.client.connection.on('connected', () => {
      console.log('✅ Ably connected');
    });

    this.client.connection.on('disconnected', () => {
      console.warn('⚠️ Ably disconnected');
    });

    this.client.connection.on('failed', (error) => {
      console.error('❌ Ably connection failed:', error);
    });
  }

  // Get channel for a project
  getProjectChannel(projectId: string): Ably.Types.RealtimeChannelCallbacks {
    if (!this.client) {
      throw new Error('Ably client not initialized');
    }

    const channelName = `project-${projectId}`;
    return this.client.channels.get(channelName);
  }

  // Subscribe to messages
  async subscribeToMessages(
    projectId: string,
    callback: (message: Message) => void
  ): Promise<() => void> {
    if (!this.client) {
      throw new Error('Ably client not initialized');
    }

    const channel = this.getProjectChannel(projectId);

    const messageHandler = (ablyMessage: Ably.Types.Message) => {
      const message: Message = {
        id: ablyMessage.id || `${Date.now()}`,
        userId: ablyMessage.data.userId,
        userName: ablyMessage.data.userName,
        content: ablyMessage.data.content,
        timestamp: new Date(ablyMessage.timestamp),
        type: ablyMessage.data.type || 'text'
      };
      callback(message);
    };

    channel.subscribe('message', messageHandler);

    // Return unsubscribe function
    return () => {
      channel.unsubscribe('message', messageHandler);
    };
  }

  // Publish a message
  async publishMessage(
    projectId: string,
    message: Omit<Message, 'id' | 'timestamp'>
  ): Promise<void> {
    if (!this.client) {
      throw new Error('Ably client not initialized');
    }

    const channel = this.getProjectChannel(projectId);

    await channel.publish('message', {
      userId: message.userId,
      userName: message.userName,
      content: message.content,
      type: message.type
    });
  }

  // Presence - who's online
  async enterPresence(
    projectId: string,
    userData: PresenceData
  ): Promise<void> {
    if (!this.client) {
      throw new Error('Ably client not initialized');
    }

    const channel = this.getProjectChannel(projectId);
    await channel.presence.enter(userData);
  }

  async leavePresence(projectId: string): Promise<void> {
    if (!this.client) {
      throw new Error('Ably client not initialized');
    }

    const channel = this.getProjectChannel(projectId);
    await channel.presence.leave();
  }

  async subscribeToPresence(
    projectId: string,
    callback: (members: PresenceData[]) => void
  ): Promise<() => void> {
    if (!this.client) {
      throw new Error('Ably client not initialized');
    }

    const channel = this.getProjectChannel(projectId);

      const updatePresence = async () => {
        try {
          const membersArray: any = await channel.presence.get();
          if (Array.isArray(membersArray)) {
            const presenceData: PresenceData[] = membersArray.map((member: any) => member.data as PresenceData);
            callback(presenceData);
          } else {
            callback([]);
          }
        } catch (error) {
          console.error('Error getting presence:', error);
          callback([]);
        }
      };

    // Initial presence load
    updatePresence();

    // Subscribe to presence changes
    channel.presence.subscribe(['enter', 'leave', 'update'], () => {
      updatePresence();
    });

    // Return unsubscribe function
    return () => {
      channel.presence.unsubscribe();
    };
  }

  // Typing indicators
  async publishTypingIndicator(projectId: string, userId: string, userName: string): Promise<void> {
    if (!this.client) {
      throw new Error('Ably client not initialized');
    }

    const channel = this.getProjectChannel(projectId);
    await channel.publish('typing', { userId, userName });
  }

  async subscribeToTypingIndicators(
    projectId: string,
    callback: (userId: string, userName: string) => void
  ): Promise<() => void> {
    if (!this.client) {
      throw new Error('Ably client not initialized');
    }

    const channel = this.getProjectChannel(projectId);

    const typingHandler = (message: Ably.Types.Message) => {
      callback(message.data.userId, message.data.userName);
    };

    channel.subscribe('typing', typingHandler);

    return () => {
      channel.unsubscribe('typing', typingHandler);
    };
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

  // Test connection
  async testConnection(): Promise<boolean> {
    if (!this.client) {
      console.error('❌ Ably client not initialized');
      return false;
    }

    try {
      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        if (this.client!.connection.state === 'connected') {
          resolve();
        } else {
          this.client!.connection.once('connected', () => resolve());
          this.client!.connection.once('failed', (error) => reject(error));
          
          // Timeout after 10 seconds
          setTimeout(() => reject(new Error('Connection timeout')), 10000);
        }
      });

      console.log('✅ Ably connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Ably connection failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const ablyService = new AblyService();

