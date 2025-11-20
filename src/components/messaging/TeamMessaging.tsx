import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

/**
 * GEOFORGE TEAM MESSAGING
 * 
 * Real-time messaging for geological project teams
 * 
 * Features:
 * - Project team channels (invite-only)
 * - Direct messages between geologists
 * - Typing indicators
 * - Emergency alerts for field safety
 * - Quick switch to video calls
 * 
 * Geological Use Cases:
 * - Field team coordination
 * - Assay results notifications
 * - Safety alerts (weather, equipment failures)
 * - Sample tracking updates
 * - Drill progress reports
 * 
 * ANT TEST: Can team members send/receive messages?
 *           Does switching to video call work?
 *           Are emergency keywords detected?
 */

interface Message {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
  is_emergency?: boolean;
}

interface TeamMessagingProps {
  onStartVideoCall?: () => void;
}

export const TeamMessaging: React.FC<TeamMessagingProps> = ({ onStartVideoCall }) => {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);

  // Mock messages for development
  const mockMessages: Message[] = [
    {
      id: '1',
      user_name: 'Alex Geologist',
      content: 'Morning team! DDH-001 core logging starting at 8 AM.',
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: '2',
      user_name: 'Jordan Analyst',
      content: 'Assay results from Batch 42 are back. Gold values look promising - averaging 2.5 g/t.',
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '3',
      user_name: 'Sam Senior',
      content: 'Great news! Can we schedule a video call to review the results together?',
      created_at: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: '4',
      user_name: 'Safety Team',
      content: 'Weather alert: High winds expected this afternoon. Secure all drill equipment.',
      created_at: new Date(Date.now() - 600000).toISOString(),
      is_emergency: true
    }
  ];

  useEffect(() => {
    // Load mock messages on mount
    setMessages(mockMessages);
    
    // TODO: Replace with real Ably integration when API keys available
    // const ably = new Ably.Realtime({ key: process.env.ABLY_API_KEY });
    // const channel = ably.channels.get(`project-${projectId}`);
    // channel.subscribe('message', (msg) => {
    //   setMessages(prev => [...prev, msg.data]);
    // });
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim()) return;

    setSending(true);
    
    try {
      // Check for emergency keywords
      const isEmergency = messageInput.toLowerCase().includes('emergency') || 
                          messageInput.toLowerCase().includes('urgent') ||
                          messageInput.toLowerCase().includes('accident') ||
                          messageInput.toLowerCase().includes('injury');

      // TODO: Replace with real API when backend ready
      // await fetch('/api/messaging/send', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     content: messageInput,
      //     senderId: session?.user?.id,
      //     isEmergency
      //   })
      // });

      // Mock message creation
      const newMessage: Message = {
        id: Date.now().toString(),
        user_name: session?.user?.user_metadata?.full_name || 'You',
        content: messageInput,
        created_at: new Date().toISOString(),
        is_emergency: isEmergency
      };

      setMessages(prev => [...prev, newMessage]);
      setMessageInput('');
      
      if (isEmergency) {
        alert('🚨 EMERGENCY keyword detected! In production, this triggers immediate notifications to all team members and safety officers.');
      }

      console.log('[GeoForge Messaging] Message sent (mock):', newMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="team-messaging">
      {/* Messages Area */}
      <div className="messages-container bg-gray-800/30 border border-gray-700 rounded-lg p-6 mb-4" style={{ minHeight: '500px', maxHeight: '600px', overflowY: 'auto' }}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl block mb-4">💬</span>
              <p className="text-gray-400">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                className={`message-card p-4 rounded-lg ${
                  message.is_emergency 
                    ? 'bg-red-500/10 border border-red-500/30' 
                    : 'bg-gray-800 border border-gray-700'
                }`}
              >
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="font-semibold text-white">{message.user_name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.created_at).toLocaleTimeString()}
                  </span>
                  {message.is_emergency && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                      🚨 URGENT
                    </span>
                  )}
                </div>
                <p className="text-gray-300">{message.content}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="message-input-form">
        <div className="flex gap-3">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type your message... (try 'emergency' for safety alerts)"
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!messageInput.trim() || sending}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending ? '...' : '📤 Send'}
          </button>
          {onStartVideoCall && (
            <button
              type="button"
              onClick={onStartVideoCall}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
              title="Switch to Video Call"
            >
              🎥 Video
            </button>
          )}
        </div>
      </form>

      {/* Feature Info */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-gray-800/30 border border-gray-700 rounded-lg text-center">
          <span className="text-2xl block mb-1">🔒</span>
          <p className="text-xs text-gray-400">Invite-only project channels</p>
        </div>
        <div className="p-3 bg-gray-800/30 border border-gray-700 rounded-lg text-center">
          <span className="text-2xl block mb-1">🚨</span>
          <p className="text-xs text-gray-400">Emergency keyword detection</p>
        </div>
        <div className="p-3 bg-gray-800/30 border border-gray-700 rounded-lg text-center">
          <span className="text-2xl block mb-1">⚡</span>
          <p className="text-xs text-gray-400">Real-time with Ably (coming soon)</p>
        </div>
      </div>

      <style>{`
        .team-messaging {
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message-card {
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default TeamMessaging;

