import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './components/landing/LandingPage';
import UnifiedDashboard from './components/UnifiedDashboard';
import { ExplorationProjectDashboard } from './components/exploration/ExplorationProjectDashboard';
import { DrillHoleManager } from './components/drilling/DrillHoleManager';
import { CoreLoggingInterface } from './components/logging/CoreLoggingInterface';
import { AIAssistant } from './components/ai/AIAssistant';
import { GradeInterpolationViewerWrapper } from './components/visualization/GradeInterpolationViewerWrapper';
import { BlockModelViewer3DWrapper } from './components/visualization/BlockModelViewer3DWrapper';
import { ResourceEstimationDashboardWrapper } from './components/resource/ResourceEstimationDashboardWrapper';
import ProductionDashboard from './components/production/ProductionDashboard';
import VeinSystemDashboard from './components/vein/VeinSystemDashboard';

function App() {
  const location = useLocation();
  
  // Show AI Assistant on all pages except landing
  const showAI = location.pathname !== '/';
  
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#f1f5f9',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f1f5f9',
            },
          },
        }}
      />
      
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Main Dashboard - Unified hub with all modules */}
        <Route path="/dashboard" element={<UnifiedDashboard />} />
        
        {/* Exploration Dashboard */}
        <Route path="/exploration" element={<ExplorationProjectDashboard />} />
        
        {/* Production Tracking - Phase A1 */}
        <Route path="/production" element={<ProductionDashboard />} />
        <Route path="/projects/:projectId/production" element={<ProductionDashboard />} />
        
        {/* Drill Hole Management */}
        <Route path="/projects/:projectId/drill-holes" element={<DrillHoleManager />} />
        
        {/* Core Logging */}
        <Route path="/drill-holes/:drillHoleId/core-logs" element={<CoreLoggingInterface />} />
        
        {/* Grade Interpolation - Phase 4 */}
        <Route path="/projects/:projectId/grade-interpolation" element={<GradeInterpolationViewerWrapper />} />
        
        {/* Block Model Viewer - Phase 5 */}
        <Route path="/block-models/:blockModelId/view" element={<BlockModelViewer3DWrapper />} />
        
        {/* Resource Estimation Dashboard - Phase 5 */}
        <Route path="/projects/:projectId/resource-estimation" element={<ResourceEstimationDashboardWrapper />} />
        
        {/* Vein Systems - Phase A2 */}
        <Route path="/projects/:projectId/veins" element={<VeinSystemDashboard />} />
        
        {/* Geophysics (Coming Soon placeholder) */}
        <Route path="/projects/:projectId/geophysics" element={<ExplorationProjectDashboard />} />
        
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* God-Mode AI Assistant - Available everywhere except landing */}
      {showAI && <AIAssistant />}
    </>
  );
}

export default App;

