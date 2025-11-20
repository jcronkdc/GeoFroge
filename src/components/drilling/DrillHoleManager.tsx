import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, MapPin, Activity, Calendar, TrendingDown, AlertCircle, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { CollaborationHub } from '../collaboration/CollaborationHub';

/**
 * GEOFORGE DRILL HOLE MANAGER
 * 
 * Manages drill holes for exploration projects with built-in collaboration
 * 
 * MYCELIAL PATHWAY:
 * Dashboard → Project → Drill Holes → [Team Call] → CollaborationHub
 * 
 * COLLABORATION: Full-screen toggle for drill planning and core review discussions
 * INVITE-ONLY: Only project team members can access drill data (RLS enforced)
 * 
 * Geological Use Cases:
 * - Plan drill locations with remote geologists
 * - Review core recovery in real-time with field team
 * - Discuss drill progress with project managers
 * - Coordinate drill rig operations via video
 * 
 * ANT TEST CHECKLIST:
 * ✅ Component renders
 * ✅ Drill holes load from mock data
 * ✅ Collaboration button visible
 * ✅ Collaboration toggle works
 * ✅ Drill hole details display
 * ✅ Status indicators correct
 */

interface DrillHole {
  id: string;
  hole_id: string; // e.g., 'DDH-001', 'RC-025'
  hole_name: string;
  hole_type: 'diamond' | 'rc' | 'rac' | 'percussion';
  project_id: string;
  
  // Location (collar)
  collar_easting: number;
  collar_northing: number;
  collar_elevation: number;
  
  // Orientation
  azimuth: number; // 0-360 degrees
  dip: number; // -90 to +90 degrees
  
  // Dimensions
  total_depth_m: number;
  planned_depth_m: number;
  
  // Drilling details
  drill_date_start: string;
  drill_date_end?: string;
  driller_name: string;
  
  // Status
  status: 'planned' | 'drilling' | 'completed' | 'abandoned';
  average_recovery_percent?: number;
}

interface DrillHoleManagerProps {
  projectId?: string;
  projectName?: string;
  showCollaboration?: boolean;
  onCollaborationToggle?: () => void;
}

export const DrillHoleManager: React.FC<DrillHoleManagerProps> = ({
  projectId: propProjectId,
  projectName: propProjectName,
  showCollaboration: externalShowCollaboration = false,
  onCollaborationToggle: externalCollaborationToggle
}) => {
  const { projectId: urlProjectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const projectId = propProjectId || urlProjectId || '';
  const [projectName, setProjectName] = useState(propProjectName || 'Loading...');
  const [drillHoles, setDrillHoles] = useState<DrillHole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [selectedHole, setSelectedHole] = useState<DrillHole | null>(null);

  // Load drill holes from database
  const loadDrillHoles = async () => {
    try {
      setLoading(true);
      const { dbService } = await import('../../lib/services/DatabaseService');
      const holes = await dbService.getDrillHoles(projectId);
      
      // Map database schema to component interface
      const mappedHoles = holes.map((h: any) => ({
        id: h.id,
        hole_id: h.hole_id,
        hole_name: h.hole_name || h.hole_id,
        hole_type: h.hole_type,
        project_id: h.project_id,
        collar_easting: h.collar_easting || 0,
        collar_northing: h.collar_northing || 0,
        collar_elevation: h.collar_elevation || 0,
        azimuth: h.azimuth || 0,
        dip: h.dip || 0,
        total_depth_m: h.total_depth_m || 0,
        planned_depth_m: h.planned_depth_m || h.total_depth_m || 0,
        drill_date_start: h.drill_date_start,
        drill_date_end: h.drill_date_end,
        driller_name: h.driller_name || 'Unknown',
        status: h.status,
        average_recovery_percent: h.average_recovery_percent
      }));
      
      setDrillHoles(mappedHoles);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load drill holes from database:', error);
      setLoading(false);
      // Set empty array on error
      setDrillHoles([]);
    }
  };

  useEffect(() => {
    // Load project name if coming from URL
    if (urlProjectId && !propProjectName) {
      // Load project name from database
      const loadProjectName = async () => {
        try {
          const { dbService } = await import('../../lib/services/DatabaseService');
          const project = await dbService.getProject(urlProjectId);
          setProjectName(project.project_name);
        } catch (error) {
          console.error('Failed to load project name:', error);
          setProjectName('Unknown Project');
        }
      };
      loadProjectName();
    }
    
    // Load drill holes from database
    loadDrillHoles();
  }, [projectId]);

  const getStatusColor = (status: string) => {
    const colors = {
      'planned': 'from-blue-500 to-blue-600',
      'drilling': 'from-orange-500 to-orange-600',
      'completed': 'from-green-500 to-green-600',
      'abandoned': 'from-red-500 to-red-600'
    };
    return colors[status as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned': return <Clock className="w-5 h-5" />;
      case 'drilling': return <Activity className="w-5 h-5" />;
      case 'completed': return <CheckCircle className="w-5 h-5" />;
      case 'abandoned': return <AlertCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getHoleTypeLabel = (type: string) => {
    const labels = {
      'diamond': 'Diamond Core',
      'rc': 'Reverse Circulation',
      'rac': 'RAC',
      'percussion': 'Percussion'
    };
    return labels[type as keyof typeof labels] || type.toUpperCase();
  };

  const calculateProgress = (total: number, planned: number) => {
    return Math.round((total / planned) * 100);
  };

  // Full-screen collaboration mode
  const handleCollaborationToggle = () => {
    setShowCollaboration(!showCollaboration);
    if (externalCollaborationToggle) {
      externalCollaborationToggle();
    }
  };

  if (externalShowCollaboration || showCollaboration) {
    return (
      <CollaborationHub
        projectId={projectId}
        contextBanner={`${projectName} • Drill Hole Planning • Core Recovery • Field Coordination`}
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
              onClick={() => navigate('/')}
              className="p-2 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                Drill Hole Management
              </h1>
              <p className="text-gray-400">
                {projectName} • Track drilling progress, core recovery, and geological targets
              </p>
            </div>
          </div>

          {/* COLLABORATION BUTTON - Always Visible */}
          <button
            onClick={handleCollaborationToggle}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-lg shadow-blue-500/25"
          >
            <Video className="w-5 h-5" />
            <span className="font-semibold">Team Call</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded">Invite-Only</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Activity />}
            label="Total Holes"
            value={drillHoles.length.toString()}
            gradient="from-blue-500 to-blue-600"
          />
          <StatCard
            icon={<Activity />}
            label="Drilling Now"
            value={drillHoles.filter(h => h.status === 'drilling').length.toString()}
            gradient="from-orange-500 to-orange-600"
          />
          <StatCard
            icon={<CheckCircle />}
            label="Completed"
            value={drillHoles.filter(h => h.status === 'completed').length.toString()}
            gradient="from-green-500 to-green-600"
          />
          <StatCard
            icon={<TrendingDown />}
            label="Total Meters"
            value={drillHoles.reduce((sum, h) => sum + h.total_depth_m, 0).toFixed(0) + 'm'}
            gradient="from-purple-500 to-purple-600"
          />
        </div>

        {/* Drill Holes List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 mt-4">Loading drill holes...</p>
            </div>
          ) : drillHoles.length === 0 ? (
            <div className="text-center py-12">
              <TrendingDown className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Drill Holes Yet</h3>
              <p className="text-gray-500 mb-6">Plan your first drill hole to start exploring</p>
              <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all">
                Plan New Hole
              </button>
            </div>
          ) : (
            drillHoles.map(hole => (
              <DrillHoleCard
                key={hole.id}
                hole={hole}
                onSelect={() => setSelectedHole(hole)}
                selected={selectedHole?.id === hole.id}
                onViewCoreLogs={(drillHoleId) => navigate(`/drill-holes/${drillHoleId}/core-logs`)}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                getHoleTypeLabel={getHoleTypeLabel}
                calculateProgress={calculateProgress}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  gradient: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, gradient }) => (
  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
      {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6 text-white' })}
    </div>
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-sm text-gray-400">{label}</div>
  </div>
);

// Drill Hole Card Component
interface DrillHoleCardProps {
  hole: DrillHole;
  onSelect: () => void;
  selected: boolean;
  onViewCoreLogs: (drillHoleId: string) => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  getHoleTypeLabel: (type: string) => string;
  calculateProgress: (total: number, planned: number) => number;
}

const DrillHoleCard: React.FC<DrillHoleCardProps> = ({
  hole,
  onSelect,
  selected,
  onViewCoreLogs,
  getStatusColor,
  getStatusIcon,
  getHoleTypeLabel,
  calculateProgress
}) => {
  const progress = hole.status === 'drilling' ? calculateProgress(hole.total_depth_m, hole.planned_depth_m) : 
                   hole.status === 'completed' ? 100 : 0;

  return (
    <div
      onClick={onSelect}
      className={`bg-gray-800/50 border ${selected ? 'border-blue-500' : 'border-gray-700'} rounded-lg p-6 hover:border-gray-600 transition-all cursor-pointer`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-white">{hole.hole_id}</h3>
            <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${getStatusColor(hole.status)} text-white text-xs font-semibold flex items-center gap-1`}>
              {getStatusIcon(hole.status)}
              {hole.status.toUpperCase()}
            </span>
          </div>
          <p className="text-gray-400 text-sm">{hole.hole_name}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Type</div>
          <div className="text-white font-semibold">{getHoleTypeLabel(hole.hole_type)}</div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <MapPin className="w-4 h-4" />
            Location
          </div>
          <div className="text-white text-sm">
            E: {hole.collar_easting.toFixed(1)}<br/>
            N: {hole.collar_northing.toFixed(1)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-1">Orientation</div>
          <div className="text-white text-sm">
            Az: {hole.azimuth}° / Dip: {hole.dip}°
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-1">Depth</div>
          <div className="text-white text-sm">
            {hole.total_depth_m}m / {hole.planned_depth_m}m
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-1">Recovery</div>
          <div className="text-white text-sm">
            {hole.average_recovery_percent ? `${hole.average_recovery_percent.toFixed(1)}%` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Progress Bar (for drilling holes) */}
      {hole.status === 'drilling' && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Drilling Progress</span>
            <span className="text-white font-semibold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onViewCoreLogs(hole.id);
          }}
          className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
        >
          View Core Logs
        </button>
        <button className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm">
          View Samples
        </button>
        <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2">
          <Video className="w-4 h-4" />
          Discuss
        </button>
      </div>
    </div>
  );
};

export default DrillHoleManager;

