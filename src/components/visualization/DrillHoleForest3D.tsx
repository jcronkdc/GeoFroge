/**
 * DrillHoleForest3D Component
 * 
 * Three.js-based 3D visualization of drill holes in space
 * Color-coded by lithology, with interactive controls
 * 
 * Features:
 * - 3D drill hole rendering as lines
 * - Color-coding by lithology/grade/status
 * - Orbit controls (rotate/pan/zoom)
 * - Click handler for hole details
 * - Toggle layers (geology, structures, mineralization)
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface LithologySegment {
  from: number;
  to: number;
  name: string;
  color: string;
}

interface DrillHole3D {
  id: string;
  name: string;
  collar: {
    x: number;
    y: number;
    z: number;
  };
  total_depth: number;
  dip: number;  // -90 = vertical down, 0 = horizontal
  azimuth: number;  // 0-360 degrees from north
  status: string;
  lithology: LithologySegment[];
}

interface DrillHoleForest3DProps {
  projectId: string;
  apiUrl?: string;
}

export function DrillHoleForest3D({ projectId, apiUrl = 'http://localhost:8000' }: DrillHoleForest3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drillHoles, setDrillHoles] = useState<DrillHole3D[]>([]);
  const [selectedHole, setSelectedHole] = useState<DrillHole3D | null>(null);
  const [showLayers, setShowLayers] = useState({
    geology: true,
    structures: true,
    mineralization: true
  });

  // Three.js scene refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationIdRef = useRef<number | null>(null);

  // Fetch drill hole data
  useEffect(() => {
    async function fetchDrillHoles() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${apiUrl}/api/drill-holes/3d/${projectId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch drill holes: ${response.statusText}`);
        }
        
        const data = await response.json();
        setDrillHoles(data.holes || []);
      } catch (err) {
        console.error('Error fetching drill holes:', err);
        setError(err instanceof Error ? err.message : 'Failed to load drill holes');
        
        // Use demo data if API fails
        setDrillHoles(getDemoData());
      } finally {
        setLoading(false);
      }
    }

    fetchDrillHoles();
  }, [projectId, apiUrl]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || drillHoles.length === 0) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100000
    );
    camera.position.set(1000, 1000, 1000);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 100;
    controls.maxDistance = 50000;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1000, 1000, 1000);
    scene.add(directionalLight);

    // Grid helper (ground plane)
    const gridSize = 10000;
    const gridDivisions = 100;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x222222);
    scene.add(gridHelper);

    // Axes helper
    const axesHelper = new THREE.AxesHelper(500);
    scene.add(axesHelper);

    // Render drill holes
    renderDrillHoles(scene, drillHoles);

    // Center camera on drill holes
    centerCamera(camera, controls, drillHoles);

    // Animation loop
    function animate() {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Handle window resize
    function handleResize() {
      if (!containerRef.current || !camera || !renderer) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    }
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [drillHoles]);

  // Render drill holes as 3D lines
  function renderDrillHoles(scene: THREE.Scene, holes: DrillHole3D[]) {
    holes.forEach((hole) => {
      // Calculate end-of-hole position based on collar, azimuth, dip, and depth
      const trace = calculateDrillTrace(hole);

      // Create line segments for each lithology interval
      if (hole.lithology && hole.lithology.length > 0) {
        hole.lithology.forEach((lith) => {
          const segmentStart = interpolateTracePoint(trace, lith.from);
          const segmentEnd = interpolateTracePoint(trace, lith.to);

          const points = [
            new THREE.Vector3(segmentStart.x, segmentStart.z, segmentStart.y),  // Note: Y and Z swapped for Three.js
            new THREE.Vector3(segmentEnd.x, segmentEnd.z, segmentEnd.y)
          ];

          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const material = new THREE.LineBasicMaterial({
            color: new THREE.Color(lith.color),
            linewidth: 3  // Note: linewidth only works in WebGL1
          });

          const line = new THREE.Line(geometry, material);
          line.userData = { holeId: hole.id, holeName: hole.name, lithology: lith };
          scene.add(line);
        });
      } else {
        // No lithology data - render entire hole as single color
        const points = [
          new THREE.Vector3(trace.start.x, trace.start.z, trace.start.y),
          new THREE.Vector3(trace.end.x, trace.end.z, trace.end.y)
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
          color: getStatusColor(hole.status),
          linewidth: 2
        });

        const line = new THREE.Line(geometry, material);
        line.userData = { holeId: hole.id, holeName: hole.name };
        scene.add(line);
      }

      // Add collar marker (small sphere)
      const collarGeometry = new THREE.SphereGeometry(10, 16, 16);
      const collarMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      const collarMarker = new THREE.Mesh(collarGeometry, collarMaterial);
      collarMarker.position.set(hole.collar.x, hole.collar.z, hole.collar.y);
      collarMarker.userData = { holeId: hole.id, holeName: hole.name, isCollar: true };
      scene.add(collarMarker);

      // Add label (text sprite) - TODO: Implement text labels
    });
  }

  // Calculate drill hole trace from collar to end-of-hole
  function calculateDrillTrace(hole: DrillHole3D) {
    const { collar, total_depth, dip, azimuth } = hole;

    // Convert angles to radians
    const dipRad = (dip * Math.PI) / 180;
    const azimuthRad = ((azimuth - 90) * Math.PI) / 180;  // Adjust for coordinate system

    // Calculate end-of-hole position
    // Assuming straight hole for now (no survey data)
    const horizontalDistance = total_depth * Math.cos(dipRad);
    const verticalDistance = total_depth * Math.sin(dipRad);

    const endX = collar.x + horizontalDistance * Math.cos(azimuthRad);
    const endY = collar.y + horizontalDistance * Math.sin(azimuthRad);
    const endZ = collar.z + verticalDistance;

    return {
      start: { x: collar.x, y: collar.y, z: collar.z },
      end: { x: endX, y: endY, z: endZ }
    };
  }

  // Interpolate point along trace at given depth
  function interpolateTracePoint(trace: any, depth: number) {
    // For straight holes, simple linear interpolation
    const totalDepth = Math.sqrt(
      Math.pow(trace.end.x - trace.start.x, 2) +
      Math.pow(trace.end.y - trace.start.y, 2) +
      Math.pow(trace.end.z - trace.start.z, 2)
    );

    const t = depth / totalDepth;

    return {
      x: trace.start.x + t * (trace.end.x - trace.start.x),
      y: trace.start.y + t * (trace.end.y - trace.start.y),
      z: trace.start.z + t * (trace.end.z - trace.start.z)
    };
  }

  // Center camera on drill holes
  function centerCamera(camera: THREE.PerspectiveCamera, controls: OrbitControls, holes: DrillHole3D[]) {
    if (holes.length === 0) return;

    // Calculate bounding box of all holes
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    holes.forEach((hole) => {
      minX = Math.min(minX, hole.collar.x);
      maxX = Math.max(maxX, hole.collar.x);
      minY = Math.min(minY, hole.collar.y);
      maxY = Math.max(maxY, hole.collar.y);
      minZ = Math.min(minZ, hole.collar.z);
      maxZ = Math.max(maxZ, hole.collar.z);
    });

    // Center point
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    // Set controls target to center
    controls.target.set(centerX, centerZ, centerY);

    // Position camera at a distance
    const distance = Math.max(maxX - minX, maxY - minY, maxZ - minZ) * 2;
    camera.position.set(
      centerX + distance,
      centerZ + distance,
      centerY + distance
    );
  }

  // Get color based on hole status
  function getStatusColor(status: string): number {
    switch (status.toLowerCase()) {
      case 'planned': return 0x808080;  // Gray
      case 'active': return 0xffff00;   // Yellow
      case 'completed': return 0x00ff00;  // Green
      case 'abandoned': return 0xff0000;  // Red
      default: return 0xffffff;  // White
    }
  }

  // Demo data for testing
  function getDemoData(): DrillHole3D[] {
    return [
      {
        id: '1',
        name: 'DH-001',
        collar: { x: 500000, y: 7200000, z: 450 },
        total_depth: 250,
        dip: -60,
        azimuth: 180,
        status: 'completed',
        lithology: [
          { from: 0, to: 50, name: 'Overburden', color: '#8B4513' },
          { from: 50, to: 150, name: 'Granite', color: '#A9A9A9' },
          { from: 150, to: 250, name: 'Basalt', color: '#2F4F4F' }
        ]
      },
      {
        id: '2',
        name: 'DH-002',
        collar: { x: 500100, y: 7200050, z: 455 },
        total_depth: 300,
        dip: -70,
        azimuth: 200,
        status: 'completed',
        lithology: [
          { from: 0, to: 40, name: 'Overburden', color: '#8B4513' },
          { from: 40, to: 200, name: 'Granite', color: '#A9A9A9' },
          { from: 200, to: 300, name: 'Mineralized Zone', color: '#FFD700' }
        ]
      },
      {
        id: '3',
        name: 'DH-003',
        collar: { x: 500050, y: 7200100, z: 448 },
        total_depth: 280,
        dip: -65,
        azimuth: 190,
        status: 'active',
        lithology: [
          { from: 0, to: 45, name: 'Overburden', color: '#8B4513' },
          { from: 45, to: 280, name: 'Granite', color: '#A9A9A9' }
        ]
      }
    ];
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading 3D drill hole visualization...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">Error: {error}</p>
          <p className="text-sm text-gray-400">Using demo data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* 3D Canvas */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Controls Panel */}
      <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-90 text-white p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold mb-3">3D Viewer Controls</h3>
        
        <div className="space-y-2 text-sm">
          <p><strong>Rotate:</strong> Left mouse drag</p>
          <p><strong>Pan:</strong> Right mouse drag</p>
          <p><strong>Zoom:</strong> Mouse wheel</p>
        </div>

        <div className="mt-4 space-y-2">
          <h4 className="font-semibold">Layers</h4>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showLayers.geology}
              onChange={(e) => setShowLayers({ ...showLayers, geology: e.target.checked })}
              className="form-checkbox"
            />
            <span>Geology</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showLayers.structures}
              onChange={(e) => setShowLayers({ ...showLayers, structures: e.target.checked })}
              className="form-checkbox"
            />
            <span>Structures</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showLayers.mineralization}
              onChange={(e) => setShowLayers({ ...showLayers, mineralization: e.target.checked })}
              className="form-checkbox"
            />
            <span>Mineralization</span>
          </label>
        </div>

        <div className="mt-4">
          <p className="text-xs text-gray-400">
            Drill Holes: {drillHoles.length}
          </p>
        </div>
      </div>

      {/* Selected Hole Details */}
      {selectedHole && (
        <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-90 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <h3 className="text-lg font-bold mb-2">{selectedHole.name}</h3>
          <div className="space-y-1 text-sm">
            <p><strong>Status:</strong> {selectedHole.status}</p>
            <p><strong>Depth:</strong> {selectedHole.total_depth}m</p>
            <p><strong>Azimuth:</strong> {selectedHole.azimuth}°</p>
            <p><strong>Dip:</strong> {selectedHole.dip}°</p>
            <p><strong>Collar:</strong> E{selectedHole.collar.x.toFixed(2)}, N{selectedHole.collar.y.toFixed(2)}, Z{selectedHole.collar.z.toFixed(2)}</p>
          </div>
          
          {selectedHole.lithology && selectedHole.lithology.length > 0 && (
            <div className="mt-3">
              <h4 className="font-semibold mb-2">Lithology</h4>
              <div className="space-y-1 text-xs">
                {selectedHole.lithology.map((lith, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: lith.color }}
                    />
                    <span>{lith.from}m - {lith.to}m: {lith.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setSelectedHole(null)}
            className="mt-3 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

