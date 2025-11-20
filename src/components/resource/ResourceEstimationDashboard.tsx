/**
 * ResourceEstimationDashboard.tsx
 * PHASE 5: Resource Estimation Dashboard
 * 
 * Complete workflow for creating and managing resource estimates:
 * 1. Create block model
 * 2. Estimate grades
 * 3. Classify resources (M/I/I)
 * 4. Generate reports
 */

import React, { useState, useEffect } from 'react';
import { Layers, Zap, Target, FileText, CheckCircle } from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

interface BlockModel {
  id: string;
  model_name: string;
  total_blocks: number;
  estimated_blocks: number;
  status: string;
  created_at: string;
}

interface ResourceEstimate {
  id: string;
  estimate_name: string;
  element: string;
  cutoff_grade: number;
  measured_tonnes: number;
  measured_grade: number;
  measured_metal_oz: number;
  indicated_tonnes: number;
  indicated_grade: number;
  indicated_metal_oz: number;
  inferred_tonnes: number;
  inferred_grade: number;
  inferred_metal_oz: number;
  total_tonnes: number;
  total_metal_oz: number;
  reporting_standard: string;
  status: string;
  estimate_date: string;
}

interface ResourceEstimationDashboardProps {
  projectId: string;
}

export const ResourceEstimationDashboard: React.FC<ResourceEstimationDashboardProps> = ({ projectId }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [blockModels, setBlockModels] = useState<BlockModel[]>([]);
  const [resourceEstimates, setResourceEstimates] = useState<ResourceEstimate[]>([]);
  const [selectedBlockModel, setSelectedBlockModel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Block model creation form
  const [modelName, setModelName] = useState('');
  const [blockSizeX, setBlockSizeX] = useState(10);
  const [blockSizeY, setBlockSizeY] = useState(10);
  const [blockSizeZ, setBlockSizeZ] = useState(5);

  // Resource estimate form
  const [estimateName, setEstimateName] = useState('');
  const [cutoffGrade, setCutoffGrade] = useState(0.5);
  const [qp, setQp] = useState('');

  useEffect(() => {
    loadBlockModels();
    loadResourceEstimates();
  }, [projectId]);

  const loadBlockModels = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/block-models?project_id=${projectId}`);
      const data = await response.json();
      setBlockModels(data.block_models || []);
    } catch (err) {
      console.error('Failed to load block models:', err);
    }
  };

  const loadResourceEstimates = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/resource-estimates`);
      const data = await response.json();
      setResourceEstimates(data.resource_estimates || []);
    } catch (err) {
      console.error('Failed to load resource estimates:', err);
    }
  };

  const createBlockModel = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/block-models/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          model_name: modelName,
          description: `Block model for resource estimation`,
          x_min: 400000,
          x_max: 401000,
          y_min: 5500000,
          y_max: 5501000,
          z_min: 200,
          z_max: 400,
          block_size_x: blockSizeX,
          block_size_y: blockSizeY,
          block_size_z: blockSizeZ,
          elements: ['au_ppm']
        })
      });

      if (!response.ok) throw new Error('Failed to create block model');
      
      const data = await response.json();
      setSuccessMessage(`Created block model: ${data.blocks_created.toLocaleString()} blocks`);
      setSelectedBlockModel(data.block_model_id);
      loadBlockModels();
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const estimateGrades = async () => {
    if (!selectedBlockModel) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/api/block-models/${selectedBlockModel}/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elements: ['au_ppm'] })
      });

      if (!response.ok) throw new Error('Failed to estimate grades');
      
      const data = await response.json();
      setSuccessMessage(`Estimated grades for ${data.statistics.estimated_blocks.toLocaleString()} blocks`);
      loadBlockModels();
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const classifyResources = async () => {
    if (!selectedBlockModel) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/api/block-models/${selectedBlockModel}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cutoff_grade: cutoffGrade })
      });

      if (!response.ok) throw new Error('Failed to classify resources');
      
      const data = await response.json();
      const summary = data.classifications.map((c: any) => 
        `${c.category}: ${c.tonnage.toLocaleString()} t @ ${c.avg_grade_au.toFixed(2)} g/t`
      ).join(', ');
      setSuccessMessage(`Classified: ${summary}`);
      setCurrentStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async () => {
    if (!selectedBlockModel) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/api/resource-estimates/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          block_model_id: selectedBlockModel,
          estimate_name: estimateName,
          element: 'au_ppm',
          cutoff_grade: cutoffGrade,
          reporting_standard: 'CIM',
          qualified_person: qp
        })
      });

      if (!response.ok) throw new Error('Failed to generate report');
      
      const data = await response.json();
      setSuccessMessage(`Resource estimate created: ${data.summary.total.tonnage.toLocaleString()} total tonnes`);
      loadResourceEstimates();
      setCurrentStep(5);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-gray-900 rounded-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          Resource Estimation Workflow
        </h2>
        <span className="text-sm text-gray-400">Phase 5: Resource & Mining</span>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between p-4 bg-gray-800 rounded">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              currentStep >= step ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-400'
            }`}>
              {currentStep > step ? <CheckCircle size={20} /> : step}
            </div>
            {step < 5 && (
              <div className={`w-20 h-1 mx-2 ${
                currentStep > step ? 'bg-emerald-600' : 'bg-gray-700'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-600 rounded text-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-900/50 border border-emerald-600 rounded text-emerald-200">
          <strong>Success:</strong> {successMessage}
        </div>
      )}

      {/* Step 1: Create Block Model */}
      {currentStep === 1 && (
        <div className="p-6 bg-gray-800 rounded">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="text-emerald-500" size={24} />
            <h3 className="text-xl font-semibold text-white">Step 1: Create Block Model</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Model Name</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g., RED-LAKE-2025"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Block Size X (m)</label>
              <input
                type="number"
                value={blockSizeX}
                onChange={(e) => setBlockSizeX(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Block Size Y (m)</label>
              <input
                type="number"
                value={blockSizeY}
                onChange={(e) => setBlockSizeY(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Block Size Z (m)</label>
              <input
                type="number"
                value={blockSizeZ}
                onChange={(e) => setBlockSizeZ(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
              />
            </div>
          </div>
          <button
            onClick={createBlockModel}
            disabled={isLoading || !modelName}
            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:bg-gray-600"
          >
            {isLoading ? 'Creating...' : 'Create Block Model'}
          </button>
        </div>
      )}

      {/* Step 2: Estimate Grades */}
      {currentStep === 2 && (
        <div className="p-6 bg-gray-800 rounded">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="text-emerald-500" size={24} />
            <h3 className="text-xl font-semibold text-white">Step 2: Estimate Grades</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Run kriging interpolation to populate block grades from drill hole assay data.
          </p>
          <button
            onClick={estimateGrades}
            disabled={isLoading}
            className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:bg-gray-600"
          >
            {isLoading ? 'Estimating...' : 'Estimate Grades'}
          </button>
        </div>
      )}

      {/* Step 3: Classify Resources */}
      {currentStep === 3 && (
        <div className="p-6 bg-gray-800 rounded">
          <div className="flex items-center gap-2 mb-4">
            <Target className="text-emerald-500" size={24} />
            <h3 className="text-xl font-semibold text-white">Step 3: Classify Resources</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Cutoff Grade (g/t Au)</label>
            <input
              type="number"
              value={cutoffGrade}
              onChange={(e) => setCutoffGrade(Number(e.target.value))}
              step="0.1"
              className="w-64 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
            />
          </div>
          <button
            onClick={classifyResources}
            disabled={isLoading}
            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:bg-gray-600"
          >
            {isLoading ? 'Classifying...' : 'Classify Resources (M/I/I)'}
          </button>
        </div>
      )}

      {/* Step 4: Generate Report */}
      {currentStep === 4 && (
        <div className="p-6 bg-gray-800 rounded">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="text-emerald-500" size={24} />
            <h3 className="text-xl font-semibold text-white">Step 4: Generate Report</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Estimate Name</label>
              <input
                type="text"
                value={estimateName}
                onChange={(e) => setEstimateName(e.target.value)}
                placeholder="e.g., 2025-Q1-Estimate"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Qualified Person</label>
              <input
                type="text"
                value={qp}
                onChange={(e) => setQp(e.target.value)}
                placeholder="Name, P.Geo"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
              />
            </div>
          </div>
          <button
            onClick={generateReport}
            disabled={isLoading || !estimateName}
            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:bg-gray-600"
          >
            {isLoading ? 'Generating...' : 'Generate Resource Estimate'}
          </button>
        </div>
      )}

      {/* Step 5: Complete */}
      {currentStep === 5 && (
        <div className="p-6 bg-gray-800 rounded text-center">
          <CheckCircle className="mx-auto text-emerald-500 mb-4" size={64} />
          <h3 className="text-2xl font-semibold text-white mb-2">Resource Estimate Complete!</h3>
          <p className="text-gray-300">Your resource estimate has been successfully generated.</p>
        </div>
      )}

      {/* Resource Estimates Table */}
      {resourceEstimates.length > 0 && (
        <div className="p-6 bg-gray-800 rounded">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Resource Estimates</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs uppercase bg-gray-700">
                <tr>
                  <th className="px-4 py-3">Estimate Name</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">M+I+I Tonnes</th>
                  <th className="px-4 py-3">Au (oz)</th>
                  <th className="px-4 py-3">Cutoff</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {resourceEstimates.slice(0, 10).map((est) => (
                  <tr key={est.id} className="border-b border-gray-700">
                    <td className="px-4 py-3 font-medium">{est.estimate_name}</td>
                    <td className="px-4 py-3">{est.estimate_date}</td>
                    <td className="px-4 py-3">{est.total_tonnes.toLocaleString()}</td>
                    <td className="px-4 py-3">{est.total_metal_oz.toLocaleString()}</td>
                    <td className="px-4 py-3">{est.cutoff_grade} g/t</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        est.status === 'published' ? 'bg-emerald-900 text-emerald-200' : 'bg-yellow-900 text-yellow-200'
                      }`}>
                        {est.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceEstimationDashboard;

