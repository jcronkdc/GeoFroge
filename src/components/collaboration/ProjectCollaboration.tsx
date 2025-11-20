import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';

/**
 * GEOFORGE PROJECT COLLABORATION - Daily.co Video Integration
 * 
 * Provides video rooms for geological team collaboration:
 * - Core log reviews with remote teams
 * - Assay results discussions
 * - Geological map interpretation with cursor control
 * - Field team coordination
 * - Stakeholder presentations
 * 
 * Features:
 * - Daily.co video rooms (invite-only)
 * - Screen sharing for core logs, maps, assay charts
 * - Cursor control for collaborative interpretation
 * - Recording for compliance and training
 * - Room discovery (see who's in which geological discussion)
 * 
 * ANT TEST: Can geologists join existing rooms or create new ones?
 *           Does screen share work for geological data review?
 *           Is cursor control functional for map interpretation?
 */

interface CollaborationRoom {
  id: string;
  roomName: string;
  url: string;
  projectId: string;
  conversationId?: string;
  createdBy: string;
  settings: {
    enableCursorControl: boolean;
    enableScreenShare: boolean;
    enableRecording: boolean;
    maxParticipants: number;
  };
}

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
  const [room, setRoom] = useState<CollaborationRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showRoomBrowser, setShowRoomBrowser] = useState(false);
  const callFrameRef = useRef<HTMLDivElement>(null);

  // Mock available rooms for development (no Daily.co API keys yet)
  const mockRooms = [
    {
      id: 'room-1',
      roomName: 'Core Log Review - DDH-001',
      dailyRoomUrl: 'https://geoforge.daily.co/core-log-ddh001',
      projectId: projectId,
      createdBy: 'mock-user-1',
      createdAt: new Date().toISOString(),
      status: 'active',
      participants: [
        { id: '1', name: 'Alex Geologist' },
        { id: '2', name: 'Jordan Analyst' }
      ],
      settings: {
        enableCursorControl: true,
        enableScreenShare: true,
        enableRecording: true,
        maxParticipants: 10
      }
    },
    {
      id: 'room-2',
      roomName: 'Assay Results Discussion',
      dailyRoomUrl: 'https://geoforge.daily.co/assay-results',
      projectId: projectId,
      createdBy: 'mock-user-2',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      status: 'active',
      participants: [
        { id: '3', name: 'Sam Senior' }
      ],
      settings: {
        enableCursorControl: false,
        enableScreenShare: true,
        enableRecording: false,
        maxParticipants: 5
      }
    }
  ];

  // Load available rooms for this project
  const loadAvailableRooms = async () => {
    setLoadingRooms(true);
    try {
      // TODO: Replace with real API when Daily.co integration ready
      // const response = await fetch(`/api/collaboration/projects/${projectId}/rooms`);
      // const data = await response.json();
      
      // Mock data for development
      setTimeout(() => {
        setAvailableRooms(mockRooms);
        setLoadingRooms(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load available rooms:', error);
      setAvailableRooms([]);
      setLoadingRooms(false);
    }
  };

  // Load rooms on mount
  useEffect(() => {
    if (projectId) {
      loadAvailableRooms();
    }
  }, [projectId]);

  // Create a new collaboration room
  const createRoom = async () => {
    if (!session?.user?.id) {
      alert('You must be logged in to create a collaboration room');
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with real API when Daily.co integration ready
      // const response = await fetch('/api/collaboration/rooms', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     projectId,
      //     conversationId,
      //     createdBy: session.user.id,
      //     roomName: `Project ${projectId} Collaboration`,
      //     privacy: 'private'
      //   })
      // });

      // Mock room creation
      const newRoom = {
        id: `room-${Date.now()}`,
        roomName: 'New Geological Discussion',
        url: 'https://geoforge.daily.co/new-room',
        dailyRoomUrl: 'https://geoforge.daily.co/new-room',
        projectId,
        conversationId,
        createdBy: session.user.id,
        settings: {
          enableCursorControl: true,
          enableScreenShare: true,
          enableRecording: true,
          maxParticipants: 10
        }
      };

      setRoom(newRoom);
      console.log('[GeoForge Collaboration] Mock room created:', newRoom);
      alert('Room created! In production, this will use Daily.co video API.');
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to create collaboration room');
    } finally {
      setLoading(false);
    }
  };

  // Join a collaboration room
  const joinRoom = async (roomUrl: string, roomId: string) => {
    console.log('[GeoForge Collaboration] Joining room:', roomId);
    // TODO: Initialize Daily.co iframe when API keys available
    // For now, show placeholder
    alert(`Joining room: ${roomUrl}\n\nIn production, this will launch Daily.co video interface with:\n- Screen sharing for core logs/maps\n- Cursor control for interpretation\n- Recording for compliance`);
  };

  return (
    <div className="collaboration-container">
      <div className="collaboration-content">
        {!room && !loading && !showRoomBrowser && (
          <div className="text-center py-12">
            <div className="mb-6">
              <span className="text-6xl">🤝</span>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">
              Start Video Collaboration
            </h3>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Create a video room to collaborate with your geological team in real-time.
              Share screens for core log reviews, discuss assay results, and interpret maps together with cursor control.
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

        {/* Room Discovery Browser */}
        {showRoomBrowser && !room && (
          <div className="room-browser">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  🏠 Active Collaboration Rooms
                </h3>
                <p className="text-sm text-gray-400 mt-2">
                  {availableRooms.length} geological discussion room{availableRooms.length !== 1 ? 's' : ''} in this project
                </p>
              </div>
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
                <p className="text-gray-400 mb-6">No active rooms in this project</p>
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
                {availableRooms.map((availableRoom: any) => {
                  const createdAt = new Date(availableRoom.createdAt);
                  const participantCount = availableRoom.participants?.length || 0;
                  const isHost = availableRoom.createdBy === session?.user?.id;
                  
                  return (
                    <div 
                      key={availableRoom.id} 
                      className="room-card p-6 bg-gray-800 border border-gray-700 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="text-xl font-semibold text-white">
                              {availableRoom.roomName || 'Collaboration Room'}
                            </h4>
                            {isHost && (
                              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                                Host
                              </span>
                            )}
                            {availableRoom.status === 'active' && (
                              <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Live
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-400 mb-4">
                            <div className="flex items-center gap-2">
                              <span>👥</span>
                              <span>{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>🕐</span>
                              <span>Created {createdAt.toLocaleTimeString()}</span>
                            </div>
                          </div>

                          {availableRoom.settings && (
                            <div className="flex gap-2 flex-wrap">
                              {availableRoom.settings.enableCursorControl && (
                                <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-full border border-purple-500/20">
                                  🖱️ Cursor Control
                                </span>
                              )}
                              {availableRoom.settings.enableScreenShare && (
                                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded-full border border-indigo-500/20">
                                  🖥️ Screen Share
                                </span>
                              )}
                              {availableRoom.settings.enableRecording && (
                                <span className="px-3 py-1 bg-red-500/10 text-red-400 text-xs rounded-full border border-red-500/20">
                                  ⏺️ Recording
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setRoom(availableRoom);
                            setShowRoomBrowser(false);
                            joinRoom(availableRoom.dailyRoomUrl, availableRoom.id);
                          }}
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                        >
                          Join Room →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-300">
                🔒 <strong>Invite-Only:</strong> You can see all rooms for transparency, but only project members with permissions can join.
                Room hosts control who can participate in geological discussions.
              </p>
            </div>
          </div>
        )}

        {/* Active Room (placeholder for Daily.co iframe) */}
        {room && (
          <>
            <div className="video-container bg-gray-800 border border-gray-700 rounded-lg p-8 text-center" ref={callFrameRef}>
              <div className="max-w-2xl mx-auto">
                <span className="text-6xl block mb-4">🎥</span>
                <h3 className="text-2xl font-semibold text-white mb-3">
                  Daily.co Video Interface
                </h3>
                <p className="text-gray-400 mb-6">
                  This area will display the Daily.co video iframe when API integration is complete.
                </p>
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 text-left">
                  <h4 className="text-white font-semibold mb-3">Room Details:</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>🏷️ Room: {room.roomName}</li>
                    <li>🔗 URL: {room.url}</li>
                    <li>🖱️ Cursor Control: {room.settings.enableCursorControl ? 'Enabled' : 'Disabled'}</li>
                    <li>🖥️ Screen Share: {room.settings.enableScreenShare ? 'Enabled' : 'Disabled'}</li>
                    <li>⏺️ Recording: {room.settings.enableRecording ? 'Enabled' : 'Disabled'}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="collaboration-controls mt-6 flex justify-center gap-4">
              <button
                onClick={() => setRoom(null)}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                📞 Leave Call
              </button>
            </div>

            {/* Cursor Control Info */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                💡 <strong>Cursor Control for Geologists:</strong> When you share your screen with core logs or geological maps, 
                team members can request cursor control to collaboratively mark features, interpret structures, and annotate mineralization zones together.
              </p>
            </div>
          </>
        )}
      </div>

      <style>{`
        .collaboration-container {
          min-height: 500px;
        }

        .room-browser {
          animation: fadeIn 0.3s ease-in;
        }

        .room-card {
          transition: all 0.2s ease;
        }

        .room-card:hover {
          transform: translateY(-2px);
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

        .video-container {
          min-height: 500px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
};

export default ProjectCollaboration;

