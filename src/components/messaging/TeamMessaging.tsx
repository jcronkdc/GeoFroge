// REAL TeamMessaging with Ably Real-Time Sync
// NO MORE LOCAL STATE - Messages sync between all users

import React, { useState, useEffect, useRef } from 'react';
import { Send, Video, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ablyService, Message, PresenceData } from '../../lib/services/AblyService';

interface TeamMessagingProps {
  projectId: string;
  onStartVideoCall?: () => void;
}

export const TeamMessaging: React.FC<TeamMessagingProps> = ({ 
  projectId,
  onStartVideoCall 
}) => {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<PresenceData[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to messages and presence
  useEffect(() => {
    if (!projectId || !ablyService.isConfigured()) {
      setError('Ably not configured. Add VITE_ABLY_API_KEY to environment.');
      return;
    }

    let unsubscribeMessages: (() => void) | null = null;
    let unsubscribePresence: (() => void) | null = null;
    let unsubscribeTyping: (() => void) | null = null;

    const setup = async () => {
      try {
        setIsConnected(true);
        setError(null);

        // Subscribe to messages
        unsubscribeMessages = await ablyService.subscribeToMessages(
          projectId,
          (message) => {
            setMessages((prev) => [...prev, message]);
          }
        );

        // Subscribe to presence
        unsubscribePresence = await ablyService.subscribeToPresence(
          projectId,
          (members) => {
            setOnlineUsers(members);
          }
        );

        // Subscribe to typing indicators
        unsubscribeTyping = await ablyService.subscribeToTypingIndicators(
          projectId,
          (userId, userName) => {
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              newSet.add(userName);
              setTimeout(() => {
                setTypingUsers((current) => {
                  const updated = new Set(current);
                  updated.delete(userName);
                  return updated;
                });
              }, 3000);
              return newSet;
            });
          }
        );

        // Enter presence
        if (session?.user) {
          await ablyService.enterPresence(projectId, {
            userId: session.user.id,
            userName: session.user.email || 'Anonymous',
            status: 'online'
          });
        }

        console.log('✅ Ably messaging connected for project:', projectId);
      } catch (err) {
        console.error('Failed to setup Ably:', err);
        setError(`Ably connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsConnected(false);
      }
    };

    setup();

    // Cleanup
    return () => {
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribePresence) unsubscribePresence();
      if (unsubscribeTyping) unsubscribeTyping();
      ablyService.leavePresence(projectId).catch(console.error);
    };
  }, [projectId, session]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !session?.user) return;
    if (!ablyService.isConfigured()) {
      setError('Cannot send message - Ably not configured');
      return;
    }

    const messageContent = inputValue.trim();
    setInputValue('');

    // Check for emergency keywords
    const emergencyKeywords = ['emergency', 'urgent', 'help', 'accident', 'injury', 'danger'];
    const isEmergency = emergencyKeywords.some(keyword => 
      messageContent.toLowerCase().includes(keyword)
    );

    try {
      await ablyService.publishMessage(projectId, {
        userId: session.user.id,
        userName: session.user.email || 'Anonymous',
        content: messageContent,
        type: isEmergency ? 'alert' : 'text'
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
      // Re-add message to input
      setInputValue(messageContent);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    if (!session?.user || !ablyService.isConfigured()) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator
    if (e.target.value) {
      await ablyService.publishTypingIndicator(
        projectId,
        session.user.id,
        session.user.email || 'Anonymous'
      );
    }

    // Stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 3000);
  };

  // If not configured, show setup message
  if (!ablyService.isConfigured()) {
    return (
      <div className="p-8 text-center">
        <span className="text-6xl block mb-4">💬</span>
        <h3 className="text-2xl font-semibold text-white mb-4">
          Real-Time Messaging Not Configured
        </h3>
        <p className="text-gray-400 mb-6">
          To enable real-time team messaging, add your Ably API key:
        </p>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-left max-w-md mx-auto">
          <code className="text-sm text-green-400">
            VITE_ABLY_API_KEY=your_api_key_here
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div>
          <h3 className="text-lg font-semibold text-white">Team Chat</h3>
          <p className="text-sm text-gray-400">
            {isConnected ? (
              <>
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                {onlineUsers.length} online
              </>
            ) : (
              <>
                <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                Connecting...
              </>
            )}
          </p>
        </div>
        {onStartVideoCall && (
          <button
            onClick={onStartVideoCall}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Video className="w-4 h-4" />
            Start Video
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-red-500/10 border-b border-red-500/30">
          <p className="text-sm text-red-400">⚠️ {error}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-2">💬</span>
            <p className="text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = message.userId === session?.user?.id;
            const isAlert = message.type === 'alert';

            return (
              <div
                key={message.id || index}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    isAlert
                      ? 'bg-red-500/20 border-2 border-red-500'
                      : isCurrentUser
                      ? 'bg-blue-600'
                      : 'bg-gray-700'
                  }`}
                >
                  {!isCurrentUser && (
                    <p className="text-xs text-gray-400 mb-1">{message.userName}</p>
                  )}
                  {isAlert && (
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-semibold text-red-400">ALERT</span>
                    </div>
                  )}
                  <p className="text-sm text-white">{message.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicators */}
        {typingUsers.size > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-2xl px-4 py-2">
              <p className="text-sm text-gray-400">
                {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isConnected}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || !isConnected}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Type "emergency" or "urgent" for high-priority alerts
        </p>
      </div>
    </div>
  );
};

export default TeamMessaging;
