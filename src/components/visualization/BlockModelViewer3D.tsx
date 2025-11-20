/**
 * BlockModelViewer3D.tsx
 * PHASE 5: 3D Block Model Visualization with Three.js
 * 
 * Renders a 3D voxel grid showing block model with grade-based coloring.
 * Supports rotation, zoom, pan, and classification filtering.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface BlockModelBlock {
  i: number;
  j: number;
  k: number;
  centroid_x: number;
  centroid_y: number;
  centroid_z: number;
  au_grade: number;
  cu_grade: number;
  classification: string;
  tonnage: number;
  is_estimated: boolean;
}

interface BlockModel {
  id: string;
  model_name: string;
  nx: number;
  ny: number;
  nz: number;
  total_blocks: number;
  estimated_blocks: number;
  avg_au_grade: number;
}

interface BlockModelViewer3DProps {
  blockModelId: string;
}

export const BlockModelViewer3D: React.FC<BlockModelViewer3DProps> = ({ blockModelId }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  
  const [blocks, setBlocks] = useState<BlockModelBlock[]>([]);
  const [blockModel, setBlockModel] = useState<BlockModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [filterClassification, setFilterClassification] = useState<string>('all');
  const [minGrade, setMinGrade] = useState<number>(0);
  const [showAxes, setShowAxes] = useState(true);
  const [colorBy, setColorBy] = useState<'grade' | 'classification'>('grade');

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      10000
    );
    camera.position.set(500, 500, 500);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    canvasRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 100;
    controls.maxDistance = 2000;
    controls.maxPolarAngle = Math.PI;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 100);
    scene.add(directionalLight);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(200);
    scene.add(axesHelper);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!canvasRef.current) return;
      camera.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      canvasRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Load block model data
  useEffect(() => {
    loadBlockModel();
  }, [blockModelId]);

  // Render blocks when data changes
  useEffect(() => {
    if (blocks.length > 0 && sceneRef.current) {
      renderBlocks();
    }
  }, [blocks, filterClassification, minGrade, colorBy]);

  const loadBlockModel = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load block model metadata
      const modelResponse = await fetch(`http://localhost:8000/api/block-models?project_id=`);
      const modelData = await modelResponse.json();
      
      const model = modelData.block_models.find((m: BlockModel) => m.id === blockModelId);
      if (model) {
        setBlockModel(model);
      }

      // Load block cells
      const blocksResponse = await fetch(`http://localhost:8000/api/block-models/${blockModelId}/blocks`);
      if (!blocksResponse.ok) throw new Error('Failed to load blocks');
      
      const blocksData = await blocksResponse.json();
      setBlocks(blocksData.blocks);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderBlocks = () => {
    if (!sceneRef.current) return;

    // Clear existing blocks
    const scene = sceneRef.current;
    scene.children = scene.children.filter(
      child => !(child instanceof THREE.Mesh && child.userData.isBlock)
    );

    // Calculate block size (assuming uniform for now)
    const blockSize = 10; // meters

    // Filter blocks
    const filteredBlocks = blocks.filter(block => {
      if (!block.is_estimated) return false;
      if (filterClassification !== 'all' && block.classification !== filterClassification) return false;
      if (block.au_grade < minGrade) return false;
      return true;
    });

    // Limit blocks for performance
    const maxBlocks = 50000;
    const blocksToRender = filteredBlocks.slice(0, maxBlocks);

    // Create instanced mesh for performance
    const geometry = new THREE.BoxGeometry(blockSize * 0.9, blockSize * 0.9, blockSize * 0.9);
    
    // Get grade range for coloring
    const grades = blocksToRender.map(b => b.au_grade).filter(g => g > 0);
    const minGradeValue = Math.min(...grades);
    const maxGradeValue = Math.max(...grades);

    // Render blocks
    blocksToRender.forEach(block => {
      const material = new THREE.MeshPhongMaterial({
        color: getBlockColor(block, minGradeValue, maxGradeValue),
        transparent: true,
        opacity: 0.8
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        block.centroid_x - blocks[0]?.centroid_x || 0, // Normalize to origin
        block.centroid_z - blocks[0]?.centroid_z || 0,
        block.centroid_y - blocks[0]?.centroid_y || 0
      );
      mesh.userData = { isBlock: true, blockData: block };
      scene.add(mesh);
    });

    console.log(`Rendered ${blocksToRender.length} blocks`);
  };

  const getBlockColor = (block: BlockModelBlock, minGrade: number, maxGrade: number): THREE.Color => {
    if (colorBy === 'classification') {
      switch (block.classification) {
        case 'measured': return new THREE.Color(0x00ff00); // Green
        case 'indicated': return new THREE.Color(0xffff00); // Yellow
        case 'inferred': return new THREE.Color(0xff8800); // Orange
        default: return new THREE.Color(0x808080); // Gray
      }
    } else {
      // Color by grade
      const normalized = (block.au_grade - minGrade) / (maxGrade - minGrade);
      
      if (normalized < 0.25) {
        const t = normalized / 0.25;
        return new THREE.Color().setRGB(0, t, 1);
      } else if (normalized < 0.5) {
        const t = (normalized - 0.25) / 0.25;
        return new THREE.Color().setRGB(0, 1, 1 - t);
      } else if (normalized < 0.75) {
        const t = (normalized - 0.5) / 0.25;
        return new THREE.Color().setRGB(t, 1, 0);
      } else {
        const t = (normalized - 0.75) / 0.25;
        return new THREE.Color().setRGB(1, 1 - t, 0);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-gray-900 rounded-lg h-screen">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          3D Block Model Viewer
        </h2>
        <span className="text-sm text-gray-400">Phase 5: Resource Estimation</span>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-800 rounded">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Classification
          </label>
          <select
            value={filterClassification}
            onChange={(e) => setFilterClassification(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
          >
            <option value="all">All Blocks</option>
            <option value="measured">Measured</option>
            <option value="indicated">Indicated</option>
            <option value="inferred">Inferred</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Min Grade (g/t)
          </label>
          <input
            type="number"
            value={minGrade}
            onChange={(e) => setMinGrade(Number(e.target.value))}
            step="0.1"
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Color By
          </label>
          <select
            value={colorBy}
            onChange={(e) => setColorBy(e.target.value as 'grade' | 'classification')}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
          >
            <option value="grade">Grade</option>
            <option value="classification">Classification</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={loadBlockModel}
            disabled={isLoading}
            className={`w-full px-4 py-2 rounded font-medium transition-colors ${
              isLoading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-600 rounded text-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Stats */}
      {blockModel && (
        <div className="p-4 bg-gray-800 rounded">
          <h3 className="text-lg font-semibold text-white mb-2">Model Statistics</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Total Blocks</div>
              <div className="text-white font-mono">{blockModel.total_blocks.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-400">Estimated</div>
              <div className="text-white font-mono">{blockModel.estimated_blocks.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-400">Avg Grade</div>
              <div className="text-white font-mono">{blockModel.avg_au_grade.toFixed(2)} g/t</div>
            </div>
            <div>
              <div className="text-gray-400">Displayed</div>
              <div className="text-white font-mono">{blocks.length.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* 3D Canvas */}
      <div 
        ref={canvasRef} 
        className="flex-1 bg-gray-950 rounded border border-gray-700"
        style={{ minHeight: '600px' }}
      />

      {/* Legend */}
      <div className="p-4 bg-gray-800 rounded text-sm text-gray-300">
        <p><strong>Controls:</strong></p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li><strong>Rotate:</strong> Left mouse drag</li>
          <li><strong>Pan:</strong> Right mouse drag</li>
          <li><strong>Zoom:</strong> Mouse wheel</li>
          <li><strong>Color Legend:</strong> {colorBy === 'grade' ? 'Blue = low, Red = high' : 'Green = Measured, Yellow = Indicated, Orange = Inferred'}</li>
        </ul>
      </div>
    </div>
  );
};

export default BlockModelViewer3D;

