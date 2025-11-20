import React, { useState } from 'react';
import { TeamMessaging } from '../messaging/TeamMessaging';
import { ProjectCollaboration } from './ProjectCollaboration';
import { useAuth } from '../../hooks/useAuth';

/**
 * GEOFORGE COLLABORATION HUB
 * 
 * Unified interface for geological team collaboration
 * 
 * Combines:
 * - Real-time messaging (invite-only project teams)
 * - Video collaboration with Daily.co
 * - Cursor control for collaborative map interpretation
 * - Screen sharing for core logs, assays, geological maps
 * 
 * Geological Use Cases:
 * - Review core logs with remote team
 * - Discuss assay results in real-time
 * - Collaborative geological mapping with cursor control
 * - Field team coordination with video
 * - Stakeholder presentations with screen sharing
 * 
 * ANT TEST: Can geologists easily switch between messaging and video?
 *           Is invite-only project access clear?
 *           Does cursor control work for map interpretation?
 */

interface CollaborationHubProps {
  projectId?: string;
  conversationId?: string;
  contextBanner?: string; // e.g., "Core Logging • Drill Hole DDH-001 • Sample Review"
  onClose?: () => void;
}

export const CollaborationHub: React.FC<CollaborationHubProps> = ({ 
  projectId, 
  conversationId,
  contextBanner,
  onClose
}) => {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'video'>('chat');

  if (!session?.user?.id) {
    return (
      <div className="collaboration-hub-unauthorized">
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">🔒</span>
          <h3 className="text-xl font-semibold text-white mb-2">
            Sign In Required
          </h3>
          <p className="text-gray-400">
            You must be logged in to access team collaboration features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="collaboration-hub min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Close Button */}
      {onClose && (
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
        </div>
      )}

      {/* Context Banner */}
      {contextBanner && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <p className="text-white text-sm font-medium">
              📍 {contextBanner}
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="collaboration-tabs flex gap-3 bg-gray-800/50 p-2 rounded-lg border border-gray-700">
          <button
            onClick={() => setActiveTab('chat')}
            className={`tab-button flex-1 flex flex-col items-center gap-2 px-6 py-4 rounded-lg transition-all ${
              activeTab === 'chat' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <span className="text-2xl">💬</span>
            <span className="font-semibold text-sm">Team Chat</span>
            <span className="text-xs opacity-75">Real-time messaging</span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`tab-button flex-1 flex flex-col items-center gap-2 px-6 py-4 rounded-lg transition-all ${
              activeTab === 'video' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <span className="text-2xl">🎥</span>
            <span className="font-semibold text-sm">Video Collab</span>
            <span className="text-xs opacity-75">Cursor control • Screen share</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="collaboration-content">
          {activeTab === 'chat' && (
            <div className="tab-panel fade-in">
              <div className="panel-header mb-6 pb-4 border-b border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-1">
                  💬 Project Team Messaging
                </h3>
                <p className="text-sm text-gray-400">
                  Invite-only groups • Real-time sync • Emergency alerts • Field coordination
                </p>
              </div>
              <TeamMessaging onStartVideoCall={() => setActiveTab('video')} />
            </div>
          )}

          {activeTab === 'video' && (
            <div className="tab-panel fade-in">
              <div className="panel-header mb-6 pb-4 border-b border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-1">
                  🎥 Video Collaboration
                </h3>
                <p className="text-sm text-gray-400">
                  Screen sharing • Cursor control • Recording • Invite-only rooms • Core log reviews
                </p>
              </div>
              <ProjectCollaboration 
                projectId={projectId || 'default'}
                conversationId={conversationId}
              />
            </div>
          )}
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="collaboration-features grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="feature-card bg-gray-800/50 border border-gray-700 p-6 rounded-lg hover:border-gray-600 transition-all">
            <span className="feature-icon text-4xl block mb-3">🔒</span>
            <h4 className="feature-title text-white font-semibold mb-2">Invite-Only Projects</h4>
            <p className="feature-description text-sm text-gray-400">
              Only project team members can access geological data, discussions, and video calls
            </p>
          </div>

          <div className="feature-card bg-gray-800/50 border border-gray-700 p-6 rounded-lg hover:border-gray-600 transition-all">
            <span className="feature-icon text-4xl block mb-3">🖱️</span>
            <h4 className="feature-title text-white font-semibold mb-2">Cursor Control</h4>
            <p className="feature-description text-sm text-gray-400">
              Share and control cursors for collaborative geological map interpretation
            </p>
          </div>

          <div className="feature-card bg-gray-800/50 border border-gray-700 p-6 rounded-lg hover:border-gray-600 transition-all">
            <span className="feature-icon text-4xl block mb-3">⚡</span>
            <h4 className="feature-title text-white font-semibold mb-2">Real-Time Sync</h4>
            <p className="feature-description text-sm text-gray-400">
              Powered by Ably + Daily.co for instant collaboration on core logs and assays
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .collaboration-hub {
          position: relative;
        }

        .tab-panel {
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

        .collaboration-hub-unauthorized {
          background: linear-gradient(135deg, #1e293b 0%, #312e81 100%);
          border-radius: 16px;
          padding: 48px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .feature-card:hover {
          transform: translateY(-4px);
        }
      `}</style>
    </div>
  );
};

export default CollaborationHub;

