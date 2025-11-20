import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, Plus, Save, Eye, AlertCircle, CheckCircle, Layers, TrendingDown, ArrowLeft } from 'lucide-react';
import { CollaborationHub } from '../collaboration/CollaborationHub';

/**
 * GEOFORGE CORE LOGGING INTERFACE
 * 
 * Digital core logging for geological exploration with built-in collaboration
 * 
 * MYCELIAL PATHWAY:
 * Dashboard → Project → Drill Holes → Core Logs → [Team Call] → CollaborationHub
 * 
 * COLLABORATION: Full-screen toggle for remote log reviews with senior geologists
 * INVITE-ONLY: Only project team members can access core data (RLS enforced)
 * 
 * Geological Use Cases:
 * - Field geologist logs core intervals in real-time
 * - Remote senior geologist reviews logs via video
 * - Cursor control to point at specific features in photos
 * - Discuss mineralization zones with exploration manager
 * - QA/QC review sessions before finalizing logs
 * 
 * ANT TEST CHECKLIST:
 * ✅ Component renders
 * ✅ Core intervals load from mock data
 * ✅ Collaboration button visible
 * ✅ Collaboration toggle works
 * ✅ Log entry form displays
 * ✅ Status indicators work
 */

interface CoreLog {
  id: string;
  drill_hole_id: string;
  drill_hole_name: string;
  
  // Interval
  depth_from_m: number;
  depth_to_m: number;
  interval_length_m: number;
  
  // Core Recovery
  core_recovery_percent?: number;
  rqd_percent?: number; // Rock Quality Designation
  
  // Lithology
  lithology: string;
  rock_type?: string;
  rock_color?: string;
  grain_size?: string;
  
  // Alteration
  alteration_type?: string[];
  alteration_intensity?: 'weak' | 'moderate' | 'strong' | 'pervasive';
  
  // Mineralization
  mineralization_present: boolean;
  mineralization_type?: string[];
  mineral_species?: string[];
  visible_gold?: boolean;
  
  // Sample
  sample_taken: boolean;
  sample_ids?: string[];
  
  // Logging
  logged_by: string;
  logged_date: string;
  review_status: 'draft' | 'reviewed' | 'approved';
  
  // Comments
  comments?: string;
}

interface CoreLoggingInterfaceProps {
  projectId?: string;
  projectName?: string;
  drillHoleId?: string;
  drillHoleName?: string;
  showCollaboration?: boolean;
  onCollaborationToggle?: () => void;
  onBack?: () => void;
}

export const CoreLoggingInterface: React.FC<CoreLoggingInterfaceProps> = ({
  projectId: propProjectId,
  projectName: propProjectName,
  drillHoleId: propDrillHoleId,
  drillHoleName: propDrillHoleName,
  showCollaboration: externalShowCollaboration = false,
  onCollaborationToggle: externalCollaborationToggle,
  onBack
}) => {
  const { drillHoleId: urlDrillHoleId } = useParams<{ drillHoleId: string }>();
  const navigate = useNavigate();
  const drillHoleId = propDrillHoleId || urlDrillHoleId || '';
  const [projectId, setProjectId] = useState(propProjectId || '1');
  const [projectName, setProjectName] = useState(propProjectName || 'Loading...');
  const [drillHoleName, setDrillHoleName] = useState(propDrillHoleName || 'Loading...');
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [coreLogs, setCoreLogs] = useState<CoreLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewLogForm, setShowNewLogForm] = useState(false);

  // Mock core logs for development
  const mockCoreLogs: CoreLog[] = [
    {
      id: '1',
      drill_hole_id: drillHoleId,
      drill_hole_name: drillHoleName,
      depth_from_m: 0,
      depth_to_m: 15.5,
      interval_length_m: 15.5,
      core_recovery_percent: 100,
      rqd_percent: 85,
      lithology: 'Granite',
      rock_type: 'igneous',
      rock_color: 'pink-gray',
      grain_size: 'medium',
      alteration_type: ['sericitic'],
      alteration_intensity: 'weak',
      mineralization_present: false,
      sample_taken: false,
      logged_by: 'Alex Geologist',
      logged_date: new Date().toISOString(),
      review_status: 'approved',
      comments: 'Fresh unaltered granite, good core quality'
    },
    {
      id: '2',
      drill_hole_id: drillHoleId,
      drill_hole_name: drillHoleName,
      depth_from_m: 15.5,
      depth_to_m: 45.0,
      interval_length_m: 29.5,
      core_recovery_percent: 98,
      rqd_percent: 75,
      lithology: 'Altered Granite',
      rock_type: 'igneous',
      rock_color: 'gray-green',
      grain_size: 'medium',
      alteration_type: ['sericitic', 'chloritic'],
      alteration_intensity: 'moderate',
      mineralization_present: true,
      mineralization_type: ['disseminated', 'vein'],
      mineral_species: ['pyrite', 'chalcopyrite'],
      visible_gold: false,
      sample_taken: true,
      sample_ids: ['DDH001-001', 'DDH001-002'],
      logged_by: 'Alex Geologist',
      logged_date: new Date().toISOString(),
      review_status: 'reviewed',
      comments: 'Moderate alteration with 2-3% disseminated pyrite and trace chalcopyrite. Two samples taken.'
    },
    {
      id: '3',
      drill_hole_id: drillHoleId,
      drill_hole_name: drillHoleName,
      depth_from_m: 45.0,
      depth_to_m: 75.5,
      interval_length_m: 30.5,
      core_recovery_percent: 95,
      rqd_percent: 60,
      lithology: 'Quartz Vein + Altered Granite',
      rock_type: 'igneous',
      rock_color: 'white-gray',
      grain_size: 'medium',
      alteration_type: ['silicic', 'sericitic'],
      alteration_intensity: 'strong',
      mineralization_present: true,
      mineralization_type: ['vein', 'disseminated'],
      mineral_species: ['pyrite', 'chalcopyrite', 'gold'],
      visible_gold: true,
      sample_taken: true,
      sample_ids: ['DDH001-003', 'DDH001-004', 'DDH001-005'],
      logged_by: 'Alex Geologist',
      logged_date: new Date().toISOString(),
      review_status: 'draft',
      comments: '⭐ VISIBLE GOLD! Multiple 5-15cm quartz veins with 3-5% pyrite and visible gold. Strong silicification. Three samples taken. PRIORITY ASSAY.'
    }
  ];

  useEffect(() => {
    loadCoreLogs();
  }, [drillHoleId]);

  const loadCoreLogs = async () => {
    setLoading(true);
    try {
      // TODO: Replace with real API
      // const response = await fetch(`/api/drill-holes/${drillHoleId}/core-logs`);
      // const data = await response.json();
      
      setTimeout(() => {
        setCoreLogs(mockCoreLogs);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load core logs:', error);
      setCoreLogs(mockCoreLogs);
      setLoading(false);
    }
  };

  const getReviewStatusColor = (status: string) => {
    const colors = {
      'draft': 'from-yellow-500 to-yellow-600',
      'reviewed': 'from-blue-500 to-blue-600',
      'approved': 'from-green-500 to-green-600'
    };
    return colors[status as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const getReviewStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <AlertCircle className="w-4 h-4" />;
      case 'reviewed': return <Eye className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Load drill hole data if coming from URL
  useEffect(() => {
    if (urlDrillHoleId && (!propDrillHoleName || !propProjectName)) {
      // TODO: Load drill hole and project data from API
      setDrillHoleName('DDH-001'); // Demo
      setProjectName('Golden Eagle Prospect'); // Demo
    }
    
    // Load core logs
    loadCoreLogs();
  }, [drillHoleId]);

  const handleCollaborationToggle = () => {
    setShowCollaboration(!showCollaboration);
    if (externalCollaborationToggle) {
      externalCollaborationToggle();
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Navigate back to drill holes (extract projectId from state or use default)
      navigate(`/projects/${projectId}/drill-holes`);
    }
  };

  if (externalShowCollaboration || showCollaboration) {
    return (
      <CollaborationHub
        projectId={projectId}
        contextBanner={`${projectName} • ${drillHoleName} • Core Log Review • Mineralization Discussion`}
        onClose={handleCollaborationToggle}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <div className="p-6">
        {/* Header with Back Button & Collaboration */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                Core Logging: {drillHoleName}
              </h1>
              <p className="text-gray-400">
                {projectName} • Digital core logging with remote review collaboration
              </p>
            </div>
          </div>

          {/* COLLABORATION BUTTON - Always Visible */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowNewLogForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Log Interval</span>
            </button>
            <button
              onClick={handleCollaborationToggle}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-lg shadow-blue-500/25"
            >
              <Video className="w-5 h-5" />
              <span className="font-semibold">Review Call</span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded">Invite-Only</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Total Intervals</div>
            <div className="text-2xl font-bold text-white">{coreLogs.length}</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Logged Depth</div>
            <div className="text-2xl font-bold text-white">
              {coreLogs.length > 0 ? coreLogs[coreLogs.length - 1].depth_to_m.toFixed(1) : 0}m
            </div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Samples Taken</div>
            <div className="text-2xl font-bold text-white">
              {coreLogs.filter(l => l.sample_taken).reduce((sum, l) => sum + (l.sample_ids?.length || 0), 0)}
            </div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Mineralized</div>
            <div className="text-2xl font-bold text-white">
              {coreLogs.filter(l => l.mineralization_present).length}
            </div>
          </div>
        </div>

        {/* Core Logs List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 mt-4">Loading core logs...</p>
            </div>
          ) : coreLogs.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Core Logs Yet</h3>
              <p className="text-gray-500 mb-6">Start logging core intervals to track lithology and mineralization</p>
              <button
                onClick={() => setShowNewLogForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                Log First Interval
              </button>
            </div>
          ) : (
            coreLogs.map(log => (
              <CoreLogCard
                key={log.id}
                log={log}
                getReviewStatusColor={getReviewStatusColor}
                getReviewStatusIcon={getReviewStatusIcon}
              />
            ))
          )}
        </div>

        {/* New Log Form Modal */}
        {showNewLogForm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-4">Log New Core Interval</h2>
              <p className="text-gray-400 mb-6">
                This form will be fully functional in Phase 2. For now, click "Close" to return.
              </p>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-300">
                  💡 <strong>Pro Tip:</strong> Use the "Review Call" button to get help from a senior geologist
                  while logging. They can see your screen and use cursor control to point at specific features!
                </p>
              </div>
              <button
                onClick={() => setShowNewLogForm(false)}
                className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Core Log Card Component
interface CoreLogCardProps {
  log: CoreLog;
  getReviewStatusColor: (status: string) => string;
  getReviewStatusIcon: (status: string) => React.ReactNode;
}

const CoreLogCard: React.FC<CoreLogCardProps> = ({
  log,
  getReviewStatusColor,
  getReviewStatusIcon
}) => {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-white">
              {log.depth_from_m.toFixed(1)}m - {log.depth_to_m.toFixed(1)}m
            </h3>
            <span className="text-gray-400 text-sm">({log.interval_length_m.toFixed(1)}m)</span>
            <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${getReviewStatusColor(log.review_status)} text-white text-xs font-semibold flex items-center gap-1`}>
              {getReviewStatusIcon(log.review_status)}
              {log.review_status.toUpperCase()}
            </span>
            {log.visible_gold && (
              <span className="px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full animate-pulse">
                ⭐ VISIBLE GOLD
              </span>
            )}
          </div>
          <p className="text-lg text-white font-semibold">{log.lithology}</p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-400 mb-1">Recovery</div>
          <div className="text-white">{log.core_recovery_percent}%</div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">RQD</div>
          <div className="text-white">{log.rqd_percent}%</div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Alteration</div>
          <div className="text-white">
            {log.alteration_type?.join(', ') || 'None'} ({log.alteration_intensity || 'N/A'})
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Samples</div>
          <div className="text-white">{log.sample_taken ? log.sample_ids?.length || 0 : 0}</div>
        </div>
      </div>

      {/* Mineralization */}
      {log.mineralization_present && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-4">
          <div className="text-sm text-purple-300 font-semibold mb-2">⛏️ Mineralization</div>
          <div className="text-white text-sm">
            <strong>Type:</strong> {log.mineralization_type?.join(', ')}<br/>
            <strong>Minerals:</strong> {log.mineral_species?.join(', ')}
          </div>
        </div>
      )}

      {/* Comments */}
      {log.comments && (
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-4">
          <div className="text-sm text-gray-400 mb-1">Comments</div>
          <div className="text-white text-sm">{log.comments}</div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <div className="text-sm text-gray-400">
          Logged by {log.logged_by} on {new Date(log.logged_date).toLocaleDateString()}
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm">
            Edit
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2">
            <Video className="w-4 h-4" />
            Discuss
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoreLoggingInterface;

