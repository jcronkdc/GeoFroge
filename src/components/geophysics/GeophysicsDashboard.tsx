import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Radio, 
  TrendingUp, 
  MapPin, 
  Activity,
  FileText,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  Plus,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * GEOPHYSICS DASHBOARD - Phase A3
 * 
 * Manages geophysical surveys and interpretations:
 * - Magnetic, gravity, IP, EM, resistivity surveys
 * - Survey data visualization and analysis
 * - Anomaly interpretation and drill target generation
 * - Integration with exploration workflow
 * 
 * Real data: Dome Mountain 2020 Airborne Magnetic Survey
 */

interface Survey {
  id: string;
  survey_name: string;
  survey_type: string;
  survey_date: string;
  contractor_name: string;
  acquisition_method: string;
  total_line_km: number;
  total_stations: number;
  status: string;
  processing_level: string;
  reading_count: number;
  interpretation_count: number;
  created_at: string;
}

interface Interpretation {
  id: string;
  interpretation_name: string;
  feature_type: string;
  target_type: string;
  drill_priority: string;
  confidence_level: string;
  anomaly_amplitude: number;
  estimated_depth_m: number;
  geological_significance: string;
}

interface SurveyReading {
  id: string;
  station_id: string;
  line_id: string;
  easting: number;
  northing: number;
  elevation: number;
  total_magnetic_field_nt: number | null;
  bouguer_gravity_mgal: number | null;
  chargeability_mv_v: number | null;
  resistivity_ohm_m: number | null;
  quality_flag: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://geoforge-backend.onrender.com';

export default function GeophysicsDashboard() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [readings, setReadings] = useState<SurveyReading[]>([]);
  const [interpretations, setInterpretations] = useState<Interpretation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSurvey, setShowAddSurvey] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    total_surveys: 0,
    magnetic_surveys: 0,
    gravity_surveys: 0,
    ip_surveys: 0,
    em_surveys: 0,
    total_km_surveyed: 0,
    total_stations: 0,
    high_priority_targets: 0
  });

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load surveys for this project
      const surveysRes = await fetch(`${API_BASE}/api/geophysics/surveys?project_id=${projectId}`);
      const surveysData = await surveysRes.json();
      setSurveys(surveysData.surveys || []);
      
      // Load summary stats
      const summaryRes = await fetch(`${API_BASE}/api/geophysics/summary/${projectId}`);
      const summaryData = await summaryRes.json();
      setStats(summaryData.summary || {});
      
      // If there are surveys, select the first one
      if (surveysData.surveys && surveysData.surveys.length > 0) {
        await selectSurvey(surveysData.surveys[0]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load geophysics data:', error);
      toast.error('Failed to load geophysics data');
      setLoading(false);
    }
  };

  const selectSurvey = async (survey: Survey) => {
    try {
      setSelectedSurvey(survey);
      
      // Load readings for this survey
      const readingsRes = await fetch(`${API_BASE}/api/geophysics/surveys/${survey.id}/readings`);
      const readingsData = await readingsRes.json();
      setReadings(readingsData.readings || []);
      
      // Load interpretations for this survey
      const interpRes = await fetch(`${API_BASE}/api/geophysics/interpretations?survey_id=${survey.id}`);
      const interpData = await interpRes.json();
      setInterpretations(interpData.interpretations || []);
    } catch (error) {
      console.error('Failed to load survey details:', error);
      toast.error('Failed to load survey details');
    }
  };

  const getSurveyTypeIcon = (type: string) => {
    switch (type) {
      case 'magnetic': return <Radio className="w-5 h-5" />;
      case 'gravity': return <TrendingUp className="w-5 h-5" />;
      case 'ip': return <Activity className="w-5 h-5" />;
      case 'em': return <Radio className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400';
      case 'completed': return 'text-blue-400';
      case 'in_progress': return 'text-yellow-400';
      case 'planned': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatSurveyType = (type: string) => {
    const types: Record<string, string> = {
      magnetic: 'Magnetic',
      gravity: 'Gravity',
      ip: 'IP (Induced Polarization)',
      em: 'EM (Electromagnetic)',
      resistivity: 'Resistivity',
      seismic: 'Seismic',
      radiometric: 'Radiometric'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading geophysics data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-slate-700 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <Radio className="w-8 h-8 text-indigo-500" />
              <div>
                <h1 className="text-2xl font-bold text-white">Geophysics</h1>
                <p className="text-sm text-gray-400">Survey Management & Analysis</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddSurvey(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg transition flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              New Survey
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Total Surveys</p>
              <FileText className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.total_surveys || 0}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.magnetic_surveys || 0} mag, {stats.gravity_surveys || 0} grav, {stats.ip_surveys || 0} IP
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Total Coverage</p>
              <MapPin className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-white">
              {(stats.total_km_surveyed || 0).toFixed(1)} km
            </p>
            <p className="text-xs text-gray-500 mt-1">Line kilometers surveyed</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">Data Points</p>
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-white">
              {(stats.total_stations || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Station readings</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">High Priority</p>
              <Target className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.high_priority_targets || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Drill targets identified</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Surveys List */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Radio className="w-5 h-5 text-indigo-500" />
                Surveys
              </h2>
              
              {surveys.length === 0 ? (
                <div className="text-center py-8">
                  <Radio className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 mb-2">No surveys yet</p>
                  <p className="text-sm text-gray-500">Create your first geophysical survey</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {surveys.map((survey) => (
                    <button
                      key={survey.id}
                      onClick={() => selectSurvey(survey)}
                      className={`w-full text-left p-4 rounded-lg border transition ${
                        selectedSurvey?.id === survey.id
                          ? 'bg-indigo-500/20 border-indigo-500'
                          : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                          {getSurveyTypeIcon(survey.survey_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm truncate">
                            {survey.survey_name}
                          </h3>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatSurveyType(survey.survey_type)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500">
                              {survey.total_line_km?.toFixed(1) || 0} km
                            </span>
                            <span className="text-gray-600">•</span>
                            <span className={`text-xs ${getStatusColor(survey.status)}`}>
                              {survey.status}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Survey Details & Interpretations */}
          <div className="lg:col-span-2 space-y-6">
            {selectedSurvey ? (
              <>
                {/* Survey Details */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                  <h2 className="text-xl font-bold text-white mb-4">Survey Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Survey Type</p>
                      <p className="text-white font-semibold">{formatSurveyType(selectedSurvey.survey_type)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Acquisition</p>
                      <p className="text-white font-semibold capitalize">{selectedSurvey.acquisition_method || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Survey Date</p>
                      <p className="text-white font-semibold">
                        {selectedSurvey.survey_date ? new Date(selectedSurvey.survey_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Contractor</p>
                      <p className="text-white font-semibold">{selectedSurvey.contractor_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Coverage</p>
                      <p className="text-white font-semibold">{selectedSurvey.total_line_km?.toFixed(1) || 0} km</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Stations</p>
                      <p className="text-white font-semibold">{selectedSurvey.total_stations?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Data Points</p>
                      <p className="text-white font-semibold">{readings.length.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Processing Level</p>
                      <p className="text-white font-semibold capitalize">{selectedSurvey.processing_level}</p>
                    </div>
                  </div>
                </div>

                {/* Sample Data (first 5 readings) */}
                {readings.length > 0 && (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-green-500" />
                      Sample Readings ({readings.length} total)
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-2 px-3 text-gray-400 font-medium">Station</th>
                            <th className="text-left py-2 px-3 text-gray-400 font-medium">Line</th>
                            <th className="text-right py-2 px-3 text-gray-400 font-medium">Easting</th>
                            <th className="text-right py-2 px-3 text-gray-400 font-medium">Northing</th>
                            {selectedSurvey.survey_type === 'magnetic' && (
                              <th className="text-right py-2 px-3 text-gray-400 font-medium">TMI (nT)</th>
                            )}
                            {selectedSurvey.survey_type === 'gravity' && (
                              <th className="text-right py-2 px-3 text-gray-400 font-medium">Gravity (mGal)</th>
                            )}
                            {selectedSurvey.survey_type === 'ip' && (
                              <th className="text-right py-2 px-3 text-gray-400 font-medium">Chargeability</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {readings.slice(0, 5).map((reading) => (
                            <tr key={reading.id} className="border-b border-slate-700/50">
                              <td className="py-2 px-3 text-white">{reading.station_id}</td>
                              <td className="py-2 px-3 text-white">{reading.line_id}</td>
                              <td className="py-2 px-3 text-white text-right">{reading.easting.toFixed(1)}</td>
                              <td className="py-2 px-3 text-white text-right">{reading.northing.toFixed(1)}</td>
                              {selectedSurvey.survey_type === 'magnetic' && (
                                <td className="py-2 px-3 text-white text-right">
                                  {reading.total_magnetic_field_nt?.toFixed(1) || 'N/A'}
                                </td>
                              )}
                              {selectedSurvey.survey_type === 'gravity' && (
                                <td className="py-2 px-3 text-white text-right">
                                  {reading.bouguer_gravity_mgal?.toFixed(2) || 'N/A'}
                                </td>
                              )}
                              {selectedSurvey.survey_type === 'ip' && (
                                <td className="py-2 px-3 text-white text-right">
                                  {reading.chargeability_mv_v?.toFixed(2) || 'N/A'}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {readings.length > 5 && (
                      <p className="text-sm text-gray-500 mt-3 text-center">
                        Showing 5 of {readings.length.toLocaleString()} readings
                      </p>
                    )}
                  </div>
                )}

                {/* Interpretations */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Target className="w-5 h-5 text-amber-500" />
                      Interpretations ({interpretations.length})
                    </h2>
                    <button
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg transition"
                      onClick={() => toast.success('Interpretation form coming soon')}
                    >
                      Add Interpretation
                    </button>
                  </div>

                  {interpretations.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No interpretations yet</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Add interpretations to identify drill targets
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {interpretations.map((interp) => (
                        <div key={interp.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-white">{interp.interpretation_name}</h3>
                            <span className={`px-2 py-1 ${getPriorityColor(interp.drill_priority)} text-white text-xs font-bold rounded`}>
                              {interp.drill_priority.toUpperCase()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                            <div>
                              <p className="text-gray-400">Feature Type</p>
                              <p className="text-white capitalize">{interp.feature_type}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Target Type</p>
                              <p className="text-white capitalize">{interp.target_type || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Anomaly Amplitude</p>
                              <p className="text-white">{interp.anomaly_amplitude?.toFixed(1) || 'N/A'} nT</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Estimated Depth</p>
                              <p className="text-white">{interp.estimated_depth_m?.toFixed(0) || 'N/A'} m</p>
                            </div>
                          </div>
                          {interp.geological_significance && (
                            <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
                              <p className="text-sm text-gray-400 mb-1">Geological Significance:</p>
                              <p className="text-sm text-white">{interp.geological_significance}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-12 border border-slate-700 text-center">
                <Radio className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">No survey selected</p>
                <p className="text-gray-500">Select a survey from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Survey Modal (placeholder) */}
      {showAddSurvey && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Add New Survey</h2>
            <p className="text-gray-400 mb-6">Survey creation form coming soon...</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddSurvey(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

