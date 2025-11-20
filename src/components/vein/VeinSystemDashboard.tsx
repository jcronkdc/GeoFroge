import React, { useState, useEffect } from 'react';
import { Mountain, Plus, TrendingUp, Layers, MapPin, Video, X, Save, Edit2, Trash2 } from 'lucide-react';
import { CollaborationHub } from '../collaboration/CollaborationHub';

/**
 * VEIN SYSTEMS DASHBOARD - Dome Mountain Gold Mine
 * 
 * Track 10+ vein structures with geometry, mineralization, and production
 * Boulder Vein, Discovery Vein, Lyle Vein, etc.
 * 
 * Human Test: "Can I add a vein and see it in the table?"
 * Mycelial Design: Vein → Geometry → Mineralization → Production tracking
 */

interface Vein {
  id: string;
  name: string;
  type: 'quartz' | 'sulfide' | 'quartz-sulfide' | 'epithermal' | 'mesothermal';
  strike: number; // 0-360 degrees (azimuth)
  dip: number; // 0-90 degrees
  width_min: number; // meters
  width_max: number; // meters
  width_avg: number; // meters
  length: number; // meters along strike
  depth_extent: number; // meters vertical
  au_grade_avg: number; // g/t
  ag_grade_avg: number; // g/t
  mineralization: string[]; // e.g., ['pyrite', 'galena', 'chalcopyrite']
  alteration: string[]; // e.g., ['silicification', 'sericitization']
  status: 'exploration' | 'development' | 'production' | 'depleted';
  production_tonnes?: number; // cumulative ore mined
  intersections: number; // number of drill hole intersections
  discovery_date: string;
  notes?: string;
}

const MINERALIZATION_OPTIONS = [
  'pyrite', 'chalcopyrite', 'galena', 'sphalerite', 'arsenopyrite',
  'gold-native', 'silver-native', 'tetrahedrite', 'bournonite'
];

const ALTERATION_OPTIONS = [
  'silicification', 'sericitization', 'chloritization', 'argillic',
  'propylitic', 'potassic', 'phyllic', 'carbonatization'
];

export default function VeinSystemDashboard() {
  const [veins, setVeins] = useState<Vein[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddVein, setShowAddVein] = useState(false);
  const [editingVein, setEditingVein] = useState<Vein | null>(null);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [formData, setFormData] = useState<Partial<Vein>>({
    name: '',
    type: 'quartz',
    strike: 0,
    dip: 60,
    width_min: 0,
    width_max: 0,
    width_avg: 0,
    length: 0,
    depth_extent: 0,
    au_grade_avg: 0,
    ag_grade_avg: 0,
    mineralization: [],
    alteration: [],
    status: 'exploration',
    intersections: 0,
    discovery_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Load vein data
  useEffect(() => {
    const fetchVeins = async () => {
      try {
        // Backend API call (when ready)
        // const response = await fetch('/api/veins?project_id=dome-mountain');
        // const data = await response.json();
        
        // Mock data - Real Dome Mountain veins from 2022 MRE
        setVeins([
          {
            id: '1',
            name: 'Boulder Vein',
            type: 'quartz',
            strike: 45,
            dip: 65,
            width_min: 0.5,
            width_max: 3.2,
            width_avg: 1.8,
            length: 450,
            depth_extent: 350,
            au_grade_avg: 10.32,
            ag_grade_avg: 55.2,
            mineralization: ['pyrite', 'chalcopyrite', 'galena', 'gold-native'],
            alteration: ['silicification', 'sericitization'],
            status: 'production',
            production_tonnes: 42.5,
            intersections: 45,
            discovery_date: '2020-06-15',
            notes: 'Primary producing vein - first production shift July 2025'
          },
          {
            id: '2',
            name: 'Discovery Vein',
            type: 'quartz-sulfide',
            strike: 52,
            dip: 70,
            width_min: 0.3,
            width_max: 2.5,
            width_avg: 1.2,
            length: 380,
            depth_extent: 300,
            au_grade_avg: 8.15,
            ag_grade_avg: 42.8,
            mineralization: ['pyrite', 'arsenopyrite', 'gold-native'],
            alteration: ['silicification', 'chloritization'],
            status: 'development',
            intersections: 38,
            discovery_date: '2019-08-22',
            notes: 'Next target for production - high grade intersections at depth'
          },
          {
            id: '3',
            name: 'Lyle Vein',
            type: 'epithermal',
            strike: 38,
            dip: 75,
            width_min: 0.2,
            width_max: 1.8,
            width_avg: 0.9,
            length: 280,
            depth_extent: 200,
            au_grade_avg: 6.02,
            ag_grade_avg: 31.5,
            mineralization: ['pyrite', 'galena', 'silver-native'],
            alteration: ['argillic', 'silicification'],
            status: 'exploration',
            intersections: 22,
            discovery_date: '2020-11-10',
            notes: 'Epithermal style - potential for expansion at depth'
          },
          {
            id: '4',
            name: 'North Extension',
            type: 'quartz',
            strike: 48,
            dip: 68,
            width_min: 0.4,
            width_max: 2.0,
            width_avg: 1.1,
            length: 320,
            depth_extent: 250,
            au_grade_avg: 7.45,
            ag_grade_avg: 38.6,
            mineralization: ['pyrite', 'chalcopyrite', 'gold-native'],
            alteration: ['silicification', 'sericitization'],
            status: 'exploration',
            intersections: 18,
            discovery_date: '2021-05-03',
            notes: 'Northern extension of Boulder Vein system'
          },
          {
            id: '5',
            name: 'South Vein',
            type: 'quartz-sulfide',
            strike: 42,
            dip: 62,
            width_min: 0.3,
            width_max: 1.5,
            width_avg: 0.8,
            length: 200,
            depth_extent: 180,
            au_grade_avg: 5.28,
            ag_grade_avg: 28.4,
            mineralization: ['pyrite', 'sphalerite', 'galena'],
            alteration: ['chloritization', 'carbonatization'],
            status: 'exploration',
            intersections: 12,
            discovery_date: '2021-09-18',
            notes: 'Southern parallel structure - requires more drilling'
          }
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch veins:', error);
        setLoading(false);
      }
    };

    fetchVeins();
  }, []);

  const handleAddVein = () => {
    const newVein: Vein = {
      ...formData as Omit<Vein, 'id'>,
      id: Date.now().toString()
    };
    
    setVeins([...veins, newVein]);
    setShowAddVein(false);
    resetForm();
    
    // Backend API call (when ready)
    // await fetch('/api/veins', { method: 'POST', body: JSON.stringify(newVein) });
  };

  const handleUpdateVein = () => {
    if (!editingVein) return;
    
    setVeins(veins.map(v => v.id === editingVein.id ? { ...editingVein, ...formData } : v));
    setEditingVein(null);
    resetForm();
    
    // Backend API call (when ready)
    // await fetch(`/api/veins/${editingVein.id}`, { method: 'PUT', body: JSON.stringify(formData) });
  };

  const handleDeleteVein = (id: string) => {
    if (confirm('Are you sure you want to delete this vein?')) {
      setVeins(veins.filter(v => v.id !== id));
      
      // Backend API call (when ready)
      // await fetch(`/api/veins/${id}`, { method: 'DELETE' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'quartz',
      strike: 0,
      dip: 60,
      width_min: 0,
      width_max: 0,
      width_avg: 0,
      length: 0,
      depth_extent: 0,
      au_grade_avg: 0,
      ag_grade_avg: 0,
      mineralization: [],
      alteration: [],
      status: 'exploration',
      intersections: 0,
      discovery_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const startEdit = (vein: Vein) => {
    setEditingVein(vein);
    setFormData(vein);
    setShowAddVein(true);
  };

  // Calculate summary stats
  const totalLength = veins.reduce((sum, v) => sum + v.length, 0);
  const avgGrade = veins.length > 0 
    ? veins.reduce((sum, v) => sum + v.au_grade_avg, 0) / veins.length 
    : 0;
  const productionVeins = veins.filter(v => v.status === 'production').length;
  const totalProduction = veins.reduce((sum, v) => sum + (v.production_tonnes || 0), 0);

  // If collaboration hub is open, show it full-screen
  if (showCollaboration) {
    return (
      <CollaborationHub
        projectId="dome-mountain"
        contextBanner="Vein Systems - Team Collaboration"
        onClose={() => setShowCollaboration(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
              <Mountain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Vein Systems</h1>
              <p className="text-gray-400">Dome Mountain Gold Mine - {veins.length} veins tracked</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCollaboration(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition flex items-center gap-2 shadow-lg"
            >
              <Video className="w-4 h-4" />
              Team Call
            </button>
            <button
              onClick={() => {
                resetForm();
                setEditingVein(null);
                setShowAddVein(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg transition flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Vein
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <p className="text-gray-400 text-sm">Total Veins</p>
            </div>
            <p className="text-3xl font-bold text-white">{veins.length}</p>
            <p className="text-sm text-gray-500 mt-1">{productionVeins} in production</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              <p className="text-gray-400 text-sm">Total Strike Length</p>
            </div>
            <p className="text-3xl font-bold text-white">{totalLength.toFixed(0)}m</p>
            <p className="text-sm text-gray-500 mt-1">Combined extent</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <p className="text-gray-400 text-sm">Average Au Grade</p>
            </div>
            <p className="text-3xl font-bold text-white">{avgGrade.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">g/t gold</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Mountain className="w-5 h-5 text-orange-400" />
              <p className="text-gray-400 text-sm">Ore Produced</p>
            </div>
            <p className="text-3xl font-bold text-white">{totalProduction.toFixed(1)}t</p>
            <p className="text-sm text-gray-500 mt-1">Boulder Vein</p>
          </div>
        </div>

        {/* Add/Edit Vein Form */}
        {showAddVein && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingVein ? 'Edit Vein' : 'Add New Vein'}
              </h2>
              <button
                onClick={() => {
                  setShowAddVein(false);
                  setEditingVein(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Vein Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="e.g., Boulder Vein"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Vein Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="quartz">Quartz Vein</option>
                    <option value="sulfide">Sulfide Vein</option>
                    <option value="quartz-sulfide">Quartz-Sulfide</option>
                    <option value="epithermal">Epithermal</option>
                    <option value="mesothermal">Mesothermal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="exploration">Exploration</option>
                    <option value="development">Development</option>
                    <option value="production">Production</option>
                    <option value="depleted">Depleted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Discovery Date
                  </label>
                  <input
                    type="date"
                    value={formData.discovery_date}
                    onChange={(e) => setFormData({ ...formData, discovery_date: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Geometry */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Strike (degrees) *
                  </label>
                  <input
                    type="number"
                    value={formData.strike}
                    onChange={(e) => setFormData({ ...formData, strike: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                    min="0"
                    max="360"
                    step="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">0-360° (North = 0°)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dip (degrees) *
                  </label>
                  <input
                    type="number"
                    value={formData.dip}
                    onChange={(e) => setFormData({ ...formData, dip: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                    min="0"
                    max="90"
                    step="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">0-90° (from horizontal)</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Width Min (m)
                    </label>
                    <input
                      type="number"
                      value={formData.width_min}
                      onChange={(e) => setFormData({ ...formData, width_min: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max (m)
                    </label>
                    <input
                      type="number"
                      value={formData.width_max}
                      onChange={(e) => setFormData({ ...formData, width_max: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Avg (m)
                    </label>
                    <input
                      type="number"
                      value={formData.width_avg}
                      onChange={(e) => setFormData({ ...formData, width_avg: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Strike Length (m)
                  </label>
                  <input
                    type="number"
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                    min="0"
                    step="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Depth Extent (m)
                  </label>
                  <input
                    type="number"
                    value={formData.depth_extent}
                    onChange={(e) => setFormData({ ...formData, depth_extent: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                    min="0"
                    step="10"
                  />
                </div>
              </div>

              {/* Mineralization & Grades */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Au Grade (g/t)
                    </label>
                    <input
                      type="number"
                      value={formData.au_grade_avg}
                      onChange={(e) => setFormData({ ...formData, au_grade_avg: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Ag Grade (g/t)
                    </label>
                    <input
                      type="number"
                      value={formData.ag_grade_avg}
                      onChange={(e) => setFormData({ ...formData, ag_grade_avg: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mineralization
                  </label>
                  <div className="bg-slate-700 border border-slate-600 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {MINERALIZATION_OPTIONS.map(mineral => (
                      <label key={mineral} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-slate-600/50 rounded px-2">
                        <input
                          type="checkbox"
                          checked={formData.mineralization?.includes(mineral)}
                          onChange={(e) => {
                            const current = formData.mineralization || [];
                            setFormData({
                              ...formData,
                              mineralization: e.target.checked
                                ? [...current, mineral]
                                : current.filter(m => m !== mineral)
                            });
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-300">{mineral}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Alteration
                  </label>
                  <div className="bg-slate-700 border border-slate-600 rounded-lg p-3 max-h-32 overflow-y-auto">
                    {ALTERATION_OPTIONS.map(alt => (
                      <label key={alt} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-slate-600/50 rounded px-2">
                        <input
                          type="checkbox"
                          checked={formData.alteration?.includes(alt)}
                          onChange={(e) => {
                            const current = formData.alteration || [];
                            setFormData({
                              ...formData,
                              alteration: e.target.checked
                                ? [...current, alt]
                                : current.filter(a => a !== alt)
                            });
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-300">{alt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Drill Hole Intersections
                  </label>
                  <input
                    type="number"
                    value={formData.intersections}
                    onChange={(e) => setFormData({ ...formData, intersections: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                    min="0"
                    step="1"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                rows={3}
                placeholder="Additional vein information, observations, etc."
              />
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddVein(false);
                  setEditingVein(null);
                  resetForm();
                }}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={editingVein ? handleUpdateVein : handleAddVein}
                disabled={!formData.name || formData.strike === undefined || formData.dip === undefined}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {editingVein ? 'Update Vein' : 'Add Vein'}
              </button>
            </div>
          </div>
        )}

        {/* Veins Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white">Tracked Veins</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">
              Loading vein data...
            </div>
          ) : veins.length === 0 ? (
            <div className="p-12 text-center">
              <Mountain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No veins tracked yet</p>
              <button
                onClick={() => setShowAddVein(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
              >
                Add First Vein
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Vein Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Geometry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Width (m)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Au g/t
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Intersections
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {veins.map((vein) => (
                    <tr key={vein.id} className="hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-medium">{vein.name}</p>
                          <p className="text-xs text-gray-400">{vein.length}m × {vein.depth_extent}m</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-700 text-gray-300 rounded text-xs">
                          {vein.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {vein.strike}° / {vein.dip}°
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {vein.width_min.toFixed(1)} - {vein.width_max.toFixed(1)}
                        <br />
                        <span className="text-xs text-gray-500">avg {vein.width_avg.toFixed(1)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-bold">{vein.au_grade_avg.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">{vein.ag_grade_avg.toFixed(1)} g/t Ag</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          vein.status === 'production' ? 'bg-green-500/20 text-green-400' :
                          vein.status === 'development' ? 'bg-blue-500/20 text-blue-400' :
                          vein.status === 'exploration' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {vein.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {vein.intersections}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(vein)}
                            className="p-2 text-blue-400 hover:bg-slate-700 rounded transition"
                            title="Edit vein"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteVein(vein.id)}
                            className="p-2 text-red-400 hover:bg-slate-700 rounded transition"
                            title="Delete vein"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

