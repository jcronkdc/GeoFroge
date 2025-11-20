import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard,
  Pickaxe, 
  Mountain,
  Layers,
  Database,
  FileText,
  Users,
  Settings,
  BarChart3,
  MapPin,
  TrendingUp,
  Video
} from 'lucide-react';
import { CollaborationHub } from './collaboration/CollaborationHub';

/**
 * UNIFIED DASHBOARD - Main hub for GeoForge
 * 
 * Shows:
 * - Quick stats from Dome Mountain
 * - Navigation to all modules
 * - Recent activity
 * - Collaboration status
 */

export default function UnifiedDashboard() {
  const navigate = useNavigate();
  const [showCollaboration, setShowCollaboration] = useState(false);

  const modules = [
    {
      icon: <Pickaxe className="w-8 h-8" />,
      title: "Production Tracking",
      description: "Daily shift logging, KPIs, mill processing",
      path: "/production",
      color: "from-orange-500 to-red-500",
      badge: "NEW",
      stats: "42.5t ore @ 10.25 g/t Au"
    },
    {
      icon: <Mountain className="w-8 h-8" />,
      title: "Vein Systems",
      description: "10 veins tracked, Boulder Vein producing",
      path: "/projects/dome-mountain/veins",
      color: "from-emerald-500 to-teal-500",
      badge: "NEW",
      stats: "15,000 oz Au/year target"
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: "Drill Holes",
      description: "596 holes, 89,982m drilled",
      path: "/exploration",
      color: "from-blue-500 to-cyan-500",
      stats: "Boulder Vein intersected"
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Core Logging",
      description: "Lithology, alteration, mineralization",
      path: "/exploration", // Goes to exploration first, then to drill holes
      color: "from-purple-500 to-pink-500",
      stats: "AI-assisted logging"
    },
    {
      icon: <Layers className="w-8 h-8" />,
      title: "Resource Estimation",
      description: "3D block models, M/I/I classification",
      path: "/projects/dome-mountain/resource-estimation",
      color: "from-amber-500 to-orange-500",
      stats: "234,000 oz Au total"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Grade Interpolation",
      description: "PyKrige geostatistics, variograms",
      path: "/projects/dome-mountain/grade-interpolation",
      color: "from-green-500 to-emerald-500",
      stats: "2D/3D interpolation"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Geophysics",
      description: "Mag, gravity, IP, EM surveys",
      path: "/projects/dome-mountain/geophysics",
      color: "from-indigo-500 to-blue-500",
      stats: "2020 airborne survey"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Collaboration",
      description: "Video calls, team chat, screen share",
      action: "openCollaboration", // Special action instead of path
      color: "from-pink-500 to-rose-500",
      stats: "Daily.co + Ably"
    }
  ];

  const quickStats = [
    { label: "Ore Mined", value: "42.5t", change: "+12% vs target", positive: true },
    { label: "Au Grade", value: "10.25 g/t", change: "Above MRE avg", positive: true },
    { label: "Estimated Au", value: "13.9 oz", change: "1.1% of monthly", positive: true },
    { label: "Drill Holes", value: "596", change: "89,982m total", positive: true }
  ];

  // If collaboration hub is open, show it full-screen
  if (showCollaboration) {
    return (
      <CollaborationHub
        projectId="dome-mountain"
        contextBanner="Dome Mountain Gold Mine - Team Collaboration"
        onClose={() => setShowCollaboration(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mountain className="w-8 h-8 text-amber-500" />
              <div>
                <h1 className="text-2xl font-bold text-white">GeoForge</h1>
                <p className="text-sm text-gray-400">Dome Mountain Gold Mine</p>
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
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, idx) => (
            <div key={idx} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white mb-2">{stat.value}</p>
              <p className={`text-sm ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
                {stat.change}
              </p>
            </div>
          ))}
        </div>

        {/* Module Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-amber-500" />
            Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {modules.map((module, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (module.action === 'openCollaboration') {
                    setShowCollaboration(true);
                  } else if (module.path) {
                    navigate(module.path);
                  }
                }}
                className="group relative bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-all hover:scale-105"
              >
                {/* Badge */}
                {module.badge && (
                  <span className="absolute top-3 right-3 px-2 py-1 bg-amber-500 text-slate-900 text-xs font-bold rounded">
                    {module.badge}
                  </span>
                )}

                {/* Icon with gradient */}
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${module.color} text-white mb-4`}>
                  {module.icon}
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-amber-400 transition">
                  {module.title}
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  {module.description}
                </p>
                <p className="text-xs text-gray-500 font-mono">
                  {module.stats}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Project Overview */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">Dome Mountain Gold Mine - Active Project</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Project Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Owner:</span>
                  <span className="text-white">Blue Lagoon Resources (CSE: BLLG)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Location:</span>
                  <span className="text-white">Smithers, BC, Canada</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-green-400 font-semibold">Permitted - Production Q3 2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Property:</span>
                  <span className="text-white">21,541 ha (26 claims)</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">2022 Mineral Resource Estimate</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Measured:</span>
                  <span className="text-white">45,000 oz Au @ 10.32 g/t</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Indicated:</span>
                  <span className="text-white">173,000 oz Au @ 8.15 g/t</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Inferred:</span>
                  <span className="text-white">16,000 oz Au @ 6.02 g/t</span>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                  <span className="text-gray-400 font-semibold">Total:</span>
                  <span className="text-amber-400 font-bold">234,000 oz Au</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

