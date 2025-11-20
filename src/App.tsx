import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './components/landing/LandingPage';
import { ExplorationProjectDashboard } from './components/exploration/ExplorationProjectDashboard';
import { DrillHoleManager } from './components/drilling/DrillHoleManager';
import { CoreLoggingInterface } from './components/logging/CoreLoggingInterface';

function App() {
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
        
        {/* Main Dashboard */}
        <Route path="/dashboard" element={<ExplorationProjectDashboard />} />
        
        {/* Drill Hole Management */}
        <Route path="/projects/:projectId/drill-holes" element={<DrillHoleManager />} />
        
        {/* Core Logging */}
        <Route path="/drill-holes/:drillHoleId/core-logs" element={<CoreLoggingInterface />} />
        
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;

