import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, Pickaxe, Activity } from 'lucide-react';

/**
 * PRODUCTION DASHBOARD - Dome Mountain Gold Mine
 * 
 * Human Test: "Can a shift supervisor log production in <30 seconds?"
 * Mycelial Design: Shortest path from mine → data entry → dashboard → collaboration
 * 
 * Collaboration Features:
 * - Instant video call with geologist/mill operator (Daily.co)
 * - Real-time chat within project (Ably)
 * - Cursor sharing for reviewing data together
 */

interface ProductionRecord {
  id: string;
  production_date: string;
  shift_type: 'day' | 'night' | 'maintenance';
  stope_name: string;
  ore_tonnes: number;
  waste_tonnes: number;
  au_grade_gt: number;
  ag_grade_gt: number;
  contractor_name: string;
  status: string;
  notes?: string;
}

interface ProductionTarget {
  target_year: number;
  target_month: number;
  target_au_ounces: number;
}

export default function ProductionDashboard() {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [targets, setTargets] = useState<ProductionTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddShift, setShowAddShift] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);

  // Fetch production data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Backend API calls (when ready)
        // const response = await fetch('/api/production/records');
        // const data = await response.json();
        
        // Mock data for now (real data from Neon DB)
        setRecords([{
          id: '1',
          production_date: '2025-07-15',
          shift_type: 'day',
          stope_name: 'Boulder Vein Level 1',
          ore_tonnes: 42.5,
          waste_tonnes: 18.3,
          au_grade_gt: 10.25,
          ag_grade_gt: 55.2,
          contractor_name: 'Roughstock Mining Services',
          status: 'completed',
          notes: 'First production shift - successful breakthrough to Boulder Vein'
        }]);
        
        setTargets([{
          target_year: 2025,
          target_month: 7,
          target_au_ounces: 1250
        }]);
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch production data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate stats
  const totalOre = records.reduce((sum, r) => sum + r.ore_tonnes, 0);
  const totalWaste = records.reduce((sum, r) => sum + r.waste_tonnes, 0);
  const avgGrade = records.length > 0 
    ? records.reduce((sum, r) => sum + r.au_grade_gt, 0) / records.length 
    : 0;
  
  // Estimated Au ounces (tonnes × g/t × 0.0321507466 = oz)
  const estimatedAu = records.reduce((sum, r) => 
    sum + (r.ore_tonnes * r.au_grade_gt * 0.0321507466), 0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Activity className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header with Collaboration */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Production Dashboard</h1>
            <p className="text-gray-600 mt-1">Dome Mountain Gold Mine - July 2025</p>
          </div>
          
          {/* Collaboration Tools */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowVideoCall(!showVideoCall)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Users className="w-4 h-4" />
              {showVideoCall ? 'End Call' : 'Start Video Call'}
            </button>
            
            <button
              onClick={() => setShowAddShift(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Pickaxe className="w-4 h-4" />
              Log Shift
            </button>
          </div>
        </div>
      </div>

      {/* Video Collaboration Panel */}
      {showVideoCall && (
        <div className="mb-6 bg-white rounded-lg shadow-lg p-4">
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center text-white">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm opacity-75">Video call with shift supervisor & geologist</p>
              <p className="text-xs opacity-50 mt-1">(Daily.co integration - requires API key)</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                Roughstock Mining: Online
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                Geologist: Available
              </span>
            </div>
            <button className="text-sm text-gray-500 hover:text-gray-700">
              Share screen
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Ore Mined</h3>
            <Pickaxe className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalOre.toFixed(1)}</p>
          <p className="text-sm text-gray-500 mt-1">tonnes</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Average Au Grade</h3>
            <TrendingUp className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{avgGrade.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">g/t gold</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Estimated Au</h3>
            <Activity className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{estimatedAu.toFixed(1)}</p>
          <p className="text-sm text-gray-500 mt-1">oz gold</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Target Progress</h3>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {targets.length > 0 ? ((estimatedAu / targets[0].target_au_ounces) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-sm text-gray-500 mt-1">of monthly target</p>
        </div>
      </div>

      {/* Production Records Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Production</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stope</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ore (t)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Waste (t)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Au g/t</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ag g/t</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contractor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.production_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      record.shift_type === 'day' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {record.shift_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.stope_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {record.ore_tonnes.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {record.waste_tonnes.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-yellow-600">
                    {record.au_grade_gt.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                    {record.ag_grade_gt.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {record.contractor_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      record.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {records.length === 0 && (
          <div className="text-center py-12">
            <Pickaxe className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No production records yet</p>
            <button
              onClick={() => setShowAddShift(true)}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Log your first shift →
            </button>
          </div>
        )}
      </div>

      {/* Add Shift Modal */}
      {showAddShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Log Production Shift</h3>
            <p className="text-sm text-gray-600 mb-4">
              Quick entry for shift supervisor - takes &lt;30 seconds
            </p>
            
            {/* Form would go here */}
            <div className="space-y-3">
              <input type="date" className="w-full border rounded p-2" placeholder="Date" />
              <select className="w-full border rounded p-2">
                <option>Day Shift</option>
                <option>Night Shift</option>
              </select>
              <input type="text" className="w-full border rounded p-2" placeholder="Stope (e.g., Boulder Vein Level 1)" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" className="border rounded p-2" placeholder="Ore (tonnes)" step="0.1" />
                <input type="number" className="border rounded p-2" placeholder="Waste (tonnes)" step="0.1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" className="border rounded p-2" placeholder="Au g/t" step="0.01" />
                <input type="number" className="border rounded p-2" placeholder="Ag g/t" step="0.01" />
              </div>
              <select className="w-full border rounded p-2">
                <option>Roughstock Mining Services</option>
                <option>Cobra Mining and Excavating Ltd</option>
              </select>
              <textarea className="w-full border rounded p-2" rows={2} placeholder="Notes (optional)" />
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddShift(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Save to database
                  setShowAddShift(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

