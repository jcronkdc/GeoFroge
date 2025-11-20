// Daily.co Real-Time Video Service
// ACTUAL integration - no more mocks

const DAILY_API_KEY = import.meta.env.VITE_DAILY_API_KEY;
const DAILY_API_URL = 'https://api.daily.co/v1';

export interface DailyRoom {
  id: string;
  name: string;
  url: string;
  privacy: 'public' | 'private';
  config: {
    enable_screenshare: boolean;
    enable_chat: boolean;
    enable_recording: boolean;
    max_participants: number;
  };
}

export interface DailyParticipant {
  session_id: string;
  user_name: string;
  joined_at: Date;
  local: boolean;
}

export class DailyService {
  private apiKey: string;

  constructor() {
    this.apiKey = DAILY_API_KEY;
    if (!this.apiKey) {
      console.warn('⚠️ Daily.co API key not found. Video collaboration will be limited.');
    }
  }

  async createRoom(projectId: string, roomName: string): Promise<DailyRoom> {
    if (!this.apiKey) {
      throw new Error('Daily.co API key not configured');
    }

    try {
      const response = await fetch(`${DAILY_API_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          name: `geoforge-${projectId}-${Date.now()}`,
          privacy: 'private', // Invite-only
          properties: {
            enable_screenshare: true,
            enable_chat: true,
            enable_recording: 'cloud', // For compliance
            max_participants: 50,
            enable_knocking: true, // Knock to enter (invite-only)
            enable_network_ui: true,
            enable_prejoin_ui: true
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Daily.co API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      return {
        id: data.id,
        name: data.name,
        url: data.url,
        privacy: data.privacy,
        config: {
          enable_screenshare: true,
          enable_chat: true,
          enable_recording: true,
          max_participants: 50
        }
      };
    } catch (error) {
      console.error('Failed to create Daily.co room:', error);
      throw error;
    }
  }

  async getRooms(): Promise<DailyRoom[]> {
    if (!this.apiKey) {
      throw new Error('Daily.co API key not configured');
    }

    try {
      const response = await fetch(`${DAILY_API_URL}/rooms`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch rooms: ${response.status}`);
      }

      const data = await response.json();
      
      return data.data.map((room: any) => ({
        id: room.id,
        name: room.name,
        url: room.url,
        privacy: room.privacy,
        config: {
          enable_screenshare: room.config?.enable_screenshare || false,
          enable_chat: room.config?.enable_chat || false,
          enable_recording: room.config?.enable_recording || false,
          max_participants: room.config?.max_participants || 50
        }
      }));
    } catch (error) {
      console.error('Failed to fetch Daily.co rooms:', error);
      throw error;
    }
  }

  async deleteRoom(roomName: string): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Daily.co API key not configured');
    }

    try {
      const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete room: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to delete Daily.co room:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const rooms = await this.getRooms();
      console.log(`✅ Daily.co connected successfully. Found ${rooms.length} rooms.`);
      return true;
    } catch (error) {
      console.error('❌ Daily.co connection failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const dailyService = new DailyService();

