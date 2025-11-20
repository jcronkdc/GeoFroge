/**
 * GradeInterpolationViewer.tsx
 * PHASE 4: Geostatistical Grade Interpolation Visualization
 * 
 * Displays kriging-interpolated grade values as an interactive heatmap.
 * Uses Canvas 2D for high-performance rendering of large grids.
 */

import React, { useState, useEffect, useRef } from 'react';

interface GridData {
  x_min: number;
  x_max: number;
  y_min: number;
  y_max: number;
  resolution: number;
  values: number[][];
}

interface SampleLocation {
  x: number;
  y: number;
  grade: number;
}

interface Statistics {
  min: number;
  max: number;
  mean: number;
  median: number;
  std_dev: number;
  data_points: number;
}

interface InterpolationResult {
  success: boolean;
  element: string;
  method: string;
  grid: GridData;
  statistics: Statistics;
  sample_locations: SampleLocation[];
}

interface AvailableElement {
  id: string;
  name: string;
  unit: string;
  sample_count: number;
}

interface GradeInterpolationViewerProps {
  projectId: string;
}

export const GradeInterpolationViewer: React.FC<GradeInterpolationViewerProps> = ({ projectId }) => {
  const [availableElements, setAvailableElements] = useState<AvailableElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string>('');
  const [interpolationMethod, setInterpolationMethod] = useState<'kriging' | 'idw'>('kriging');
  const [gridResolution, setGridResolution] = useState<number>(50);
  const [interpolationResult, setInterpolationResult] = useState<InterpolationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSamplePoints, setShowSamplePoints] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch available elements on mount
  useEffect(() => {
    fetchAvailableElements();
  }, [projectId]);

  // Render heatmap when data changes
  useEffect(() => {
    if (interpolationResult && canvasRef.current) {
      renderHeatmap();
    }
  }, [interpolationResult, showSamplePoints]);

  const fetchAvailableElements = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/model/available-elements/${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch elements');
      
      const data = await response.json();
      setAvailableElements(data.elements);
      
      // Auto-select first element if available
      if (data.elements.length > 0) {
        setSelectedElement(data.elements[0].id);
      }
    } catch (err) {
      setError(`Failed to load elements: ${err}`);
    }
  };

  const runInterpolation = async () => {
    if (!selectedElement) {
      setError('Please select an element to interpolate');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/model/section-grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          element: selectedElement,
          grid_resolution: gridResolution,
          interpolation_method: interpolationMethod
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Interpolation failed');
      }

      const result = await response.json();
      setInterpolationResult(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeatmap = () => {
    const canvas = canvasRef.current;
    if (!canvas || !interpolationResult) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { grid, statistics, sample_locations } = interpolationResult;
    const { values, resolution } = grid;

    // Set canvas size
    const width = 800;
    const height = 600;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Calculate cell dimensions
    const cellWidth = width / resolution;
    const cellHeight = height / resolution;

    // Render grid cells with color based on grade
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const value = values[i][j];
        const normalized = (value - statistics.min) / (statistics.max - statistics.min);
        
        // Color gradient: blue (low) -> green -> yellow -> red (high)
        const color = getHeatmapColor(normalized);
        
        ctx.fillStyle = color;
        ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
      }
    }

    // Overlay sample points
    if (showSamplePoints) {
      const xRange = grid.x_max - grid.x_min;
      const yRange = grid.y_max - grid.y_min;

      sample_locations.forEach(sample => {
        // Convert world coordinates to canvas coordinates
        const canvasX = ((sample.x - grid.x_min) / xRange) * width;
        const canvasY = height - ((sample.y - grid.y_min) / yRange) * height;

        // Draw sample point
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 4, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    // Draw legend
    drawLegend(ctx, statistics, width, height);
  };

  const getHeatmapColor = (normalized: number): string => {
    // Clamp between 0 and 1
    const value = Math.max(0, Math.min(1, normalized));

    // Color stops: blue -> cyan -> green -> yellow -> red
    if (value < 0.25) {
      // Blue to Cyan
      const t = value / 0.25;
      return `rgb(0, ${Math.floor(t * 255)}, 255)`;
    } else if (value < 0.5) {
      // Cyan to Green
      const t = (value - 0.25) / 0.25;
      return `rgb(0, 255, ${Math.floor((1 - t) * 255)})`;
    } else if (value < 0.75) {
      // Green to Yellow
      const t = (value - 0.5) / 0.25;
      return `rgb(${Math.floor(t * 255)}, 255, 0)`;
    } else {
      // Yellow to Red
      const t = (value - 0.75) / 0.25;
      return `rgb(255, ${Math.floor((1 - t) * 255)}, 0)`;
    }
  };

  const drawLegend = (ctx: CanvasRenderingContext2D, stats: Statistics, width: number, height: number) => {
    const legendWidth = 30;
    const legendHeight = 200;
    const legendX = width - legendWidth - 20;
    const legendY = height - legendHeight - 20;

    // Draw gradient bar
    for (let i = 0; i < legendHeight; i++) {
      const normalized = 1 - (i / legendHeight);
      ctx.fillStyle = getHeatmapColor(normalized);
      ctx.fillRect(legendX, legendY + i, legendWidth, 1);
    }

    // Draw border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

    // Draw labels
    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';
    ctx.fillText(stats.max.toFixed(2), legendX + legendWidth + 5, legendY + 5);
    ctx.fillText(stats.min.toFixed(2), legendX + legendWidth + 5, legendY + legendHeight);
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-gray-900 rounded-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          Grade Interpolation Viewer
        </h2>
        <span className="text-sm text-gray-400">Phase 4: Geostatistics</span>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-800 rounded">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Element
          </label>
          <select
            value={selectedElement}
            onChange={(e) => setSelectedElement(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-emerald-500 focus:outline-none"
            disabled={isLoading}
          >
            <option value="">Select Element</option>
            {availableElements.map(el => (
              <option key={el.id} value={el.id}>
                {el.name} ({el.sample_count} samples)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Method
          </label>
          <select
            value={interpolationMethod}
            onChange={(e) => setInterpolationMethod(e.target.value as 'kriging' | 'idw')}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-emerald-500 focus:outline-none"
            disabled={isLoading}
          >
            <option value="kriging">Kriging (Geostatistical)</option>
            <option value="idw">IDW (Inverse Distance)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Resolution
          </label>
          <select
            value={gridResolution}
            onChange={(e) => setGridResolution(Number(e.target.value))}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-emerald-500 focus:outline-none"
            disabled={isLoading}
          >
            <option value={30}>Low (30×30)</option>
            <option value={50}>Medium (50×50)</option>
            <option value={100}>High (100×100)</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={runInterpolation}
            disabled={isLoading || !selectedElement}
            className={`w-full px-4 py-2 rounded font-medium transition-colors ${
              isLoading || !selectedElement
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isLoading ? 'Interpolating...' : 'Run Interpolation'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-600 rounded text-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Statistics */}
      {interpolationResult && (
        <div className="p-4 bg-gray-800 rounded">
          <h3 className="text-lg font-semibold text-white mb-2">Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Min</div>
              <div className="text-white font-mono">{interpolationResult.statistics.min.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-gray-400">Max</div>
              <div className="text-white font-mono">{interpolationResult.statistics.max.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-gray-400">Mean</div>
              <div className="text-white font-mono">{interpolationResult.statistics.mean.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-gray-400">Median</div>
              <div className="text-white font-mono">{interpolationResult.statistics.median.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-gray-400">Std Dev</div>
              <div className="text-white font-mono">{interpolationResult.statistics.std_dev.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-gray-400">Samples</div>
              <div className="text-white font-mono">{interpolationResult.statistics.data_points}</div>
            </div>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="relative bg-gray-800 rounded p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">Grade Distribution Heatmap</h3>
          {interpolationResult && (
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={showSamplePoints}
                onChange={(e) => setShowSamplePoints(e.target.checked)}
                className="rounded"
              />
              Show Sample Points
            </label>
          )}
        </div>
        <canvas
          ref={canvasRef}
          className="w-full border border-gray-700 rounded"
          style={{ maxWidth: '800px', height: 'auto' }}
        />
        {!interpolationResult && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-500 text-center">
              <p className="text-lg">No interpolation results yet</p>
              <p className="text-sm mt-2">Select an element and click "Run Interpolation"</p>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 bg-gray-800 rounded text-sm text-gray-300">
        <p><strong>How it works:</strong></p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li><strong>Kriging:</strong> Geostatistical method that uses spatial correlation (variogram) to estimate grades between sample points</li>
          <li><strong>IDW:</strong> Simpler method that weights nearby samples more heavily</li>
          <li><strong>Heatmap:</strong> Blue = low grades, Red = high grades</li>
          <li><strong>White dots:</strong> Actual sample locations from drill holes</li>
        </ul>
      </div>
    </div>
  );
};

export default GradeInterpolationViewer;

