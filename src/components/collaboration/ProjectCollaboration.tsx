// REAL ProjectCollaboration with Daily.co Video Integration
// NO MORE MOCKS - This is the production-ready version

import React, { useState, useEffect, useRef } from 'react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { useAuth } from '../../hooks/useAuth';
import { dailyService, DailyRoom } from '../../lib/services/DailyService';

interface ProjectCollaborationProps {
  projectId: string;
  conversationId?: string;
  onClose?: () => void;
}

export const ProjectCollaboration: React.FC<ProjectCollaborationProps> = ({ 
  projectId, 
  conversationId,
  onClose 
}) => {
  const { session } = useAuth();
  const [room, setRoom] = useState<DailyRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<DailyRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showRoomBrowser, setShowRoomBrowser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const callFrameRef = useRef<HTMLDivElement>(null);
  const callInstanceRef = useRef<DailyCall | null>(null);

  // Load available rooms on mount
  useEffect(() => {
    if (projectId && dailyService.isConfigured()) {
      loadAvailableRooms();
    }
  }, [projectId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callInstanceRef.current) {
        callInstanceRef.current.destroy();
        callInstanceRef.current = null;
      }
    };
  }, []);

  const loadAvailableRooms = async () => {
    setLoadingRooms(true);
    setError(null);
    try {
      const rooms = await dailyService.getRooms();
      // Filter rooms for this project (by naming convention)
      const projectRooms = rooms.filter(r => r.name.includes(`geoforge-${projectId}`));
      setAvailableRooms(projectRooms);
    } catch (err) {
      console.error('Failed to load rooms:', err);
      setError('Failed to load collaboration rooms. Check your Daily.co API key.');
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const createRoom = async () => {
    if (!session?.user?.id) {
      setError('You must be logged in to create a collaboration room');
      return;
    }

    if (!dailyService.isConfigured()) {
      setError('Daily.co is not configured. Add VITE_DAILY_API_KEY to your environment.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const newRoom = await dailyService.createRoom(
        projectId,
        `Project ${projectId} - ${new Date().toLocaleTimeString()}`
      );
      
      setRoom(newRoom);
      await joinRoomVideo(newRoom.url);
    } catch (err) {
      console.error('Failed to create room:', err);
      setError(`Failed to create room: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const joinRoomVideo = async (roomUrl: string) => {
    if (!callFrameRef.current) {
      setError('Video container not ready');
      return;
    }

    try {
      // Destroy existing call if any
      if (callInstanceRef.current) {
        await callInstanceRef.current.destroy();
      }

      // Create new Daily call
      const callFrame = DailyIframe.createFrame(callFrameRef.current, {
        showLeaveButton: true,
        showFullscreenButton: true,
        iframeStyle: {
          width: '100%',
          height: '600px',
          border: 'none',
          borderRadius: '12px'
        }
      });

      callInstanceRef.current = callFrame;

      // Join the room
      await callFrame.join({ 
        url: roomUrl,
        userName: session?.user?.email || 'Anonymous Geologist'
      });

      console.log('✅ Joined Daily.co room:', roomUrl);

      // Listen for when user leaves
      callFrame.on('left-meeting', () => {
        console.log('👋 Left meeting');
        setRoom(null);
        if (callInstanceRef.current) {
          callInstanceRef.current.destroy();
          callInstanceRef.current = null;
        }
      });

    } catch (err) {
      console.error('Failed to join room:', err);
      setError(`Failed to join video: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const leaveCall = async () => {
    if (callInstanceRef.current) {
      await callInstanceRef.current.leave();
      await callInstanceRef.current.destroy();
      callInstanceRef.current = null;
    }
    setRoom(null);
  };

  // If Daily.co not configured, show setup instructions
  if (!dailyService.isConfigured()) {
    return (
      <div className="p-8 text-center">
        <span className="text-6xl block mb-4">🎥</span>
        <h3 className="text-2xl font-semibold text-white mb-4">
          Daily.co Video Not Configured
        </h3>
        <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
          To enable video collaboration, add your Daily.co API key to the environment:
        </p>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-left max-w-2xl mx-auto">
          <code className="text-sm text-green-400">
            VITE_DAILY_API_KEY=your_api_key_here
          </code>
        </div>
        <p className="text-gray-500 text-sm mt-4">
          Get your API key from: <a href="https://dashboard.daily.co" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">dashboard.daily.co</a>
        </p>
      </div>
    );
  }

  return (
    <div className="collaboration-container p-6">
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400">⚠️ {error}</p>
        </div>
      )}

      {/* No active room - Show create/join options */}
      {!room && !loading && !showRoomBrowser && (
        <div className="text-center py-12">
          <span className="text-6xl block mb-4">🤝</span>
          <h3 className="text-2xl font-semibold text-white mb-4">
            Start Video Collaboration
          </h3>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Create a video room to collaborate with your geological team in real-time.
            Share screens for core log reviews, discuss assay results, and interpret maps together.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={createRoom}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Creating Room...' : '🎥 Create New Room'}
            </button>
            {availableRooms.length > 0 && (
              <button
                onClick={() => setShowRoomBrowser(true)}
                className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                🏠 Browse {availableRooms.length} Active Room{availableRooms.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Room Browser */}
      {showRoomBrowser && !room && (
        <div className="room-browser">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-white">
              🏠 Active Collaboration Rooms
            </h3>
            <button
              onClick={() => setShowRoomBrowser(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              ← Back
            </button>
          </div>

          {loadingRooms ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : availableRooms.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📭</span>
              <p className="text-gray-400 mb-6">No active rooms for this project</p>
              <button
                onClick={() => {
                  setShowRoomBrowser(false);
                  createRoom();
                }}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                Create First Room
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {availableRooms.map((availableRoom) => (
                <div 
                  key={availableRoom.id} 
                  className="p-6 bg-gray-800 border border-gray-700 rounded-lg hover:border-blue-500 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-semibold text-white mb-2">
                        {availableRoom.name}
                      </h4>
                      <div className="flex gap-2">
                        {availableRoom.config.enable_screenshare && (
                          <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded">
                            🖥️ Screen Share
                          </span>
                        )}
                        {availableRoom.config.enable_recording && (
                          <span className="px-2 py-1 bg-red-500/10 text-red-400 text-xs rounded">
                            ⏺️ Recording
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        setRoom(availableRoom);
                        setShowRoomBrowser(false);
                        await joinRoomVideo(availableRoom.url);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                    >
                      Join Room →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Video Call */}
      {room && (
        <div className="video-room">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">{room.name}</h3>
              <p className="text-sm text-gray-400">🔴 Live collaboration session</p>
            </div>
            <button
              onClick={leaveCall}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              📞 Leave Call
            </button>
          </div>

          {/* Daily.co Video Container */}
          <div 
            ref={callFrameRef} 
            className="video-container bg-gray-900 rounded-xl overflow-hidden"
            style={{ minHeight: '600px' }}
          />

          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">
              💡 <strong>Pro Tip:</strong> Use screen share to collaboratively review core logs, geological maps, and assay results with your team in real-time.
            </p>
          </div>
        </div>
      )}

      <style>{`
        .collaboration-container {
          min-height: 500px;
        }

        .room-browser {
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ProjectCollaboration;
