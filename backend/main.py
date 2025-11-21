"""
GeoForge Backend API
Open-Source Micromine-Class Architecture
Python FastAPI Backend
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel
import numpy as np
from pykrige.ok import OrdinaryKriging
from scipy.interpolate import griddata
import json

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL")

app = FastAPI(
    title="GeoForge API",
    description="Open-Source Geological Data Management System",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev port
        "https://*.vercel.app",   # Vercel deployments
        "https://*.onrender.com", # Render deployments
        os.getenv("FRONTEND_URL", ""),  # Custom frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Database connection helper
def get_db_connection():
    """Create database connection to Supabase PostGIS"""
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")


# Pydantic models
class Project(BaseModel):
    id: Optional[str] = None
    name: str
    location: Optional[str] = None
    status: Optional[str] = "active"
    start_date: Optional[str] = None
    description: Optional[str] = None


class DrillHole(BaseModel):
    id: Optional[str] = None
    project_id: str
    hole_name: str
    easting: Optional[float] = None
    northing: Optional[float] = None
    elevation: Optional[float] = None
    total_depth: Optional[float] = None
    dip: Optional[float] = None
    azimuth: Optional[float] = None
    status: Optional[str] = "planned"


class GradeInterpolationRequest(BaseModel):
    project_id: str
    element: str  # e.g., "au_ppm", "cu_ppm"
    grid_resolution: Optional[int] = 50  # Grid cells per axis
    interpolation_method: Optional[str] = "kriging"  # "kriging" or "idw"
    section_line: Optional[Dict[str, float]] = None  # For 2D section: {x1, y1, x2, y2}


class BlockModelRequest(BaseModel):
    project_id: str
    model_name: str
    description: Optional[str] = None
    
    # Model extents (bounding box in project coordinates)
    x_min: float
    x_max: float
    y_min: float
    y_max: float
    z_min: float
    z_max: float
    
    # Block dimensions (meters)
    block_size_x: float = 10.0
    block_size_y: float = 10.0
    block_size_z: float = 5.0
    
    # Estimation parameters
    interpolation_method: Optional[str] = "ordinary_kriging"
    search_radius: Optional[float] = 50.0
    min_samples: Optional[int] = 3
    max_samples: Optional[int] = 12
    
    # Elements to estimate
    elements: Optional[List[str]] = ["au_ppm"]


class ResourceEstimateRequest(BaseModel):
    block_model_id: str
    estimate_name: str
    element: str
    cutoff_grade: float
    reporting_standard: Optional[str] = "CIM"
    qualified_person: Optional[str] = None


class EconomicScenarioRequest(BaseModel):
    project_id: str
    scenario_name: str
    description: Optional[str] = None
    is_base_case: Optional[bool] = False
    
    # Metal prices
    au_price_usd_oz: Optional[float] = 1800
    ag_price_usd_oz: Optional[float] = 24
    cu_price_usd_lb: Optional[float] = 3.50
    
    # Operating costs
    mining_cost_per_tonne: Optional[float] = 3.0
    processing_cost_per_tonne: Optional[float] = 15.0
    g_and_a_cost_per_tonne: Optional[float] = 2.0
    
    # Capital costs
    initial_capex: Optional[float] = 50000000
    sustaining_capex_per_year: Optional[float] = 5000000
    closure_cost: Optional[float] = 10000000
    
    # Metallurgy
    au_recovery_rate: Optional[float] = 0.85
    dilution_factor: Optional[float] = 0.05
    mining_loss_factor: Optional[float] = 0.03
    
    # Financial
    discount_rate: Optional[float] = 0.10
    
    # Mine design
    overall_pit_slope: Optional[float] = 45.0
    mining_rate_tpd: Optional[float] = 50000
    processing_rate_tpd: Optional[float] = 15000


class PitShellRequest(BaseModel):
    block_model_id: str
    shell_name: str
    economic_scenario_id: str
    shell_number: Optional[int] = 1


# ==================== ENDPOINTS ====================

@app.get("/")
def root():
    """Root endpoint - API status"""
    return {
        "message": "GeoForge API - Open-Source Micromine Architecture",
        "version": "1.0.0",
        "status": "operational",
        "documentation": "/docs"
    }


@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
        conn.close()
        return {
            "status": "healthy",
            "database": "connected",
            "postgis": "available"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }


# ==================== PROJECTS ENDPOINTS ====================

@app.get("/api/projects")
def get_projects():
    """Get all exploration projects"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                id,
                name,
                location,
                status,
                start_date,
                description,
                created_at,
                updated_at
            FROM exploration_projects
            ORDER BY created_at DESC
        """)
        
        projects = cur.fetchall()
        cur.close()
        conn.close()
        
        return {"projects": projects, "count": len(projects)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch projects: {str(e)}")


@app.get("/api/projects/{project_id}")
def get_project(project_id: str):
    """Get single project by ID"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                id,
                name,
                location,
                status,
                start_date,
                description,
                created_at,
                updated_at
            FROM exploration_projects
            WHERE id = %s
        """, (project_id,))
        
        project = cur.fetchone()
        cur.close()
        conn.close()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {"project": project}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch project: {str(e)}")


@app.post("/api/projects")
def create_project(project: Project):
    """Create new exploration project"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO exploration_projects 
            (name, location, status, start_date, description)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, name, location, status, start_date, description, created_at
        """, (
            project.name,
            project.location,
            project.status,
            project.start_date,
            project.description
        ))
        
        new_project = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {"project": new_project, "message": "Project created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")


# ==================== DRILL HOLES ENDPOINTS ====================

@app.get("/api/drill-holes")
def get_drill_holes(project_id: Optional[str] = None):
    """Get drill holes, optionally filtered by project"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if project_id:
            cur.execute("""
                SELECT 
                    id,
                    project_id,
                    hole_name,
                    easting,
                    northing,
                    elevation,
                    total_depth,
                    dip,
                    azimuth,
                    status,
                    drill_start_date,
                    drill_end_date,
                    ST_AsGeoJSON(collar_location) as collar_geojson,
                    created_at,
                    updated_at
                FROM drill_holes
                WHERE project_id = %s
                ORDER BY hole_name
            """, (project_id,))
        else:
            cur.execute("""
                SELECT 
                    id,
                    project_id,
                    hole_name,
                    easting,
                    northing,
                    elevation,
                    total_depth,
                    dip,
                    azimuth,
                    status,
                    drill_start_date,
                    drill_end_date,
                    ST_AsGeoJSON(collar_location) as collar_geojson,
                    created_at,
                    updated_at
                FROM drill_holes
                ORDER BY created_at DESC
            """)
        
        holes = cur.fetchall()
        cur.close()
        conn.close()
        
        return {"drill_holes": holes, "count": len(holes)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch drill holes: {str(e)}")


@app.get("/api/drill-holes/{hole_id}")
def get_drill_hole(hole_id: str):
    """Get single drill hole by ID"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                id,
                project_id,
                hole_name,
                easting,
                northing,
                elevation,
                total_depth,
                dip,
                azimuth,
                status,
                drill_start_date,
                drill_end_date,
                ST_AsGeoJSON(collar_location) as collar_geojson,
                created_at,
                updated_at
            FROM drill_holes
            WHERE id = %s
        """, (hole_id,))
        
        hole = cur.fetchone()
        cur.close()
        conn.close()
        
        if not hole:
            raise HTTPException(status_code=404, detail="Drill hole not found")
        
        return {"drill_hole": hole}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch drill hole: {str(e)}")


@app.post("/api/drill-holes")
def create_drill_hole(hole: DrillHole):
    """Create new drill hole"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Create PostGIS POINT geometry from easting/northing/elevation
        cur.execute("""
            INSERT INTO drill_holes 
            (project_id, hole_name, easting, northing, elevation, 
             total_depth, dip, azimuth, status, collar_location)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 
                    ST_SetSRID(ST_MakePoint(%s, %s, %s), 4326))
            RETURNING id, project_id, hole_name, easting, northing, elevation,
                      total_depth, dip, azimuth, status, created_at
        """, (
            hole.project_id,
            hole.hole_name,
            hole.easting,
            hole.northing,
            hole.elevation,
            hole.total_depth,
            hole.dip,
            hole.azimuth,
            hole.status,
            hole.easting,
            hole.northing,
            hole.elevation
        ))
        
        new_hole = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {"drill_hole": new_hole, "message": "Drill hole created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create drill hole: {str(e)}")


# ==================== ASSAYS ENDPOINTS ====================

@app.get("/api/assays")
def get_assays(drill_hole_id: Optional[str] = None, sample_id: Optional[str] = None):
    """Get assays, optionally filtered by drill hole or sample"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if sample_id:
            cur.execute("""
                SELECT 
                    a.id,
                    a.sample_id,
                    a.lab_name,
                    a.certificate_number,
                    a.au_ppm,
                    a.ag_ppm,
                    a.cu_ppm,
                    a.pb_ppm,
                    a.zn_ppm,
                    a.assay_date,
                    a.created_at,
                    s.drill_hole_id,
                    s.sample_number,
                    s.from_depth,
                    s.to_depth
                FROM assays a
                JOIN core_samples s ON s.id = a.sample_id
                WHERE a.sample_id = %s
                ORDER BY a.created_at DESC
            """, (sample_id,))
        elif drill_hole_id:
            cur.execute("""
                SELECT 
                    a.id,
                    a.sample_id,
                    a.lab_name,
                    a.certificate_number,
                    a.au_ppm,
                    a.ag_ppm,
                    a.cu_ppm,
                    a.pb_ppm,
                    a.zn_ppm,
                    a.assay_date,
                    a.created_at,
                    s.drill_hole_id,
                    s.sample_number,
                    s.from_depth,
                    s.to_depth
                FROM assays a
                JOIN core_samples s ON s.id = a.sample_id
                WHERE s.drill_hole_id = %s
                ORDER BY s.from_depth
            """, (drill_hole_id,))
        else:
            cur.execute("""
                SELECT 
                    a.id,
                    a.sample_id,
                    a.lab_name,
                    a.certificate_number,
                    a.au_ppm,
                    a.ag_ppm,
                    a.cu_ppm,
                    a.pb_ppm,
                    a.zn_ppm,
                    a.assay_date,
                    a.created_at
                FROM assays a
                ORDER BY a.created_at DESC
                LIMIT 100
            """)
        
        assays = cur.fetchall()
        cur.close()
        conn.close()
        
        return {"assays": assays, "count": len(assays)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch assays: {str(e)}")


# ==================== 3D VISUALIZATION ENDPOINTS ====================

@app.get("/api/drill-holes/3d/{project_id}")
def get_drill_holes_3d(project_id: str):
    """Get drill hole data formatted for Three.js 3D visualization"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get drill holes with traces
        cur.execute("""
            SELECT 
                dh.id,
                dh.hole_name,
                dh.easting as collar_x,
                dh.northing as collar_y,
                dh.elevation as collar_z,
                dh.total_depth,
                dh.dip,
                dh.azimuth,
                dh.status
            FROM drill_holes dh
            WHERE dh.project_id = %s
            ORDER BY dh.hole_name
        """, (project_id,))
        
        holes = cur.fetchall()
        
        # For each hole, get lithology data for coloring
        holes_3d = []
        for hole in holes:
            cur.execute("""
                SELECT 
                    from_depth,
                    to_depth,
                    lithology,
                    color_code
                FROM geological_units
                WHERE drill_hole_id = %s
                ORDER BY from_depth
            """, (hole['id'],))
            
            lithology = cur.fetchall()
            
            holes_3d.append({
                "id": hole['id'],
                "name": hole['hole_name'],
                "collar": {
                    "x": float(hole['collar_x']) if hole['collar_x'] else 0,
                    "y": float(hole['collar_y']) if hole['collar_y'] else 0,
                    "z": float(hole['collar_z']) if hole['collar_z'] else 0
                },
                "total_depth": float(hole['total_depth']) if hole['total_depth'] else 0,
                "dip": float(hole['dip']) if hole['dip'] else -90,
                "azimuth": float(hole['azimuth']) if hole['azimuth'] else 0,
                "status": hole['status'],
                "lithology": [
                    {
                        "from": float(lith['from_depth']),
                        "to": float(lith['to_depth']),
                        "name": lith['lithology'],
                        "color": lith['color_code'] or "#808080"
                    }
                    for lith in lithology
                ]
            })
        
        cur.close()
        conn.close()
        
        return {"holes": holes_3d, "count": len(holes_3d)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch 3D drill hole data: {str(e)}")


# ==================== GEOSTATISTICS & MODELING ENDPOINTS ====================

@app.post("/api/model/section-grade")
def interpolate_grade(request: GradeInterpolationRequest):
    """
    PHASE 4: Grade Interpolation using PyKrige (Ordinary Kriging)
    
    Interpolates element grades across a 2D grid for visualization.
    Returns a grid of estimated grades that can be visualized as a heatmap.
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Validate element column exists
        valid_elements = ["au_ppm", "ag_ppm", "cu_ppm", "pb_ppm", "zn_ppm"]
        if request.element not in valid_elements:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid element. Must be one of: {', '.join(valid_elements)}"
            )
        
        # Fetch assay data with spatial coordinates
        # Join: assays -> core_samples -> drill_holes
        cur.execute(f"""
            SELECT 
                dh.easting,
                dh.northing,
                cs.from_depth,
                cs.to_depth,
                a.{request.element} as grade
            FROM assays a
            JOIN core_samples cs ON cs.id = a.sample_id
            JOIN drill_holes dh ON dh.id = cs.drill_hole_id
            WHERE dh.project_id = %s
              AND a.{request.element} IS NOT NULL
              AND a.{request.element} > 0
        """, (request.project_id,))
        
        assay_data = cur.fetchall()
        cur.close()
        conn.close()
        
        if len(assay_data) < 3:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough data points for interpolation. Found {len(assay_data)}, need at least 3."
            )
        
        # Extract coordinates and grades
        x = np.array([float(row['easting']) for row in assay_data])
        y = np.array([float(row['northing']) for row in assay_data])
        z = np.array([float(row['grade']) for row in assay_data])
        
        # Create interpolation grid
        grid_resolution = request.grid_resolution
        xi = np.linspace(x.min(), x.max(), grid_resolution)
        yi = np.linspace(y.min(), y.max(), grid_resolution)
        xi_grid, yi_grid = np.meshgrid(xi, yi)
        
        # Perform interpolation
        if request.interpolation_method == "kriging":
            # Ordinary Kriging (geostatistical interpolation)
            try:
                OK = OrdinaryKriging(
                    x, y, z,
                    variogram_model='spherical',  # Can be: linear, power, gaussian, spherical, exponential
                    verbose=False,
                    enable_plotting=False
                )
                zi, ss = OK.execute('grid', xi, yi)
                zi_grid = zi.data  # Extract masked array data
            except Exception as e:
                # Fallback to IDW if kriging fails
                print(f"Kriging failed: {e}. Falling back to IDW.")
                zi_grid = griddata((x, y), z, (xi_grid, yi_grid), method='linear')
        else:
            # Inverse Distance Weighting (simpler, faster)
            zi_grid = griddata((x, y), z, (xi_grid, yi_grid), method='linear')
        
        # Handle NaN values (areas outside data coverage)
        zi_grid = np.nan_to_num(zi_grid, nan=0.0)
        
        # Calculate statistics
        stats = {
            "min": float(np.min(z)),
            "max": float(np.max(z)),
            "mean": float(np.mean(z)),
            "median": float(np.median(z)),
            "std_dev": float(np.std(z)),
            "data_points": len(assay_data)
        }
        
        # Return grid data and metadata
        return {
            "success": True,
            "element": request.element,
            "method": request.interpolation_method,
            "grid": {
                "x_min": float(xi.min()),
                "x_max": float(xi.max()),
                "y_min": float(yi.min()),
                "y_max": float(yi.max()),
                "resolution": grid_resolution,
                "values": zi_grid.tolist()  # 2D array of interpolated grades
            },
            "statistics": stats,
            "sample_locations": [
                {"x": float(xi), "y": float(yi), "grade": float(gi)} 
                for xi, yi, gi in zip(x, y, z)
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Grade interpolation failed: {str(e)}"
        )


@app.get("/api/model/available-elements/{project_id}")
def get_available_elements(project_id: str):
    """
    Get list of elements with data for a project
    Helps frontend know which elements can be interpolated
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check which element columns have data
        cur.execute("""
            SELECT 
                COUNT(CASE WHEN a.au_ppm IS NOT NULL AND a.au_ppm > 0 THEN 1 END) as au_count,
                COUNT(CASE WHEN a.ag_ppm IS NOT NULL AND a.ag_ppm > 0 THEN 1 END) as ag_count,
                COUNT(CASE WHEN a.cu_ppm IS NOT NULL AND a.cu_ppm > 0 THEN 1 END) as cu_count,
                COUNT(CASE WHEN a.pb_ppm IS NOT NULL AND a.pb_ppm > 0 THEN 1 END) as pb_count,
                COUNT(CASE WHEN a.zn_ppm IS NOT NULL AND a.zn_ppm > 0 THEN 1 END) as zn_count
            FROM assays a
            JOIN core_samples cs ON cs.id = a.sample_id
            JOIN drill_holes dh ON dh.id = cs.drill_hole_id
            WHERE dh.project_id = %s
        """, (project_id,))
        
        counts = cur.fetchone()
        cur.close()
        conn.close()
        
        elements = []
        element_map = {
            "au_ppm": {"name": "Gold (Au)", "unit": "ppm", "count": counts['au_count']},
            "ag_ppm": {"name": "Silver (Ag)", "unit": "ppm", "count": counts['ag_count']},
            "cu_ppm": {"name": "Copper (Cu)", "unit": "ppm", "count": counts['cu_count']},
            "pb_ppm": {"name": "Lead (Pb)", "unit": "ppm", "count": counts['pb_count']},
            "zn_ppm": {"name": "Zinc (Zn)", "unit": "ppm", "count": counts['zn_count']}
        }
        
        for key, value in element_map.items():
            if value['count'] > 0:
                elements.append({
                    "id": key,
                    "name": value['name'],
                    "unit": value['unit'],
                    "sample_count": value['count']
                })
        
        return {"elements": elements, "count": len(elements)}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch available elements: {str(e)}"
        )


# ==================== BLOCK MODEL & RESOURCE ESTIMATION ENDPOINTS (PHASE 5) ====================

@app.post("/api/block-models/create")
def create_block_model(request: BlockModelRequest):
    """
    PHASE 5: Create a 3D block model grid
    
    Generates a regular 3D grid of blocks (voxels) for resource estimation.
    Each block will later be populated with grade estimates via kriging.
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Calculate grid dimensions
        nx = int(np.ceil((request.x_max - request.x_min) / request.block_size_x))
        ny = int(np.ceil((request.y_max - request.y_min) / request.block_size_y))
        nz = int(np.ceil((request.z_max - request.z_min) / request.block_size_z))
        
        total_blocks = nx * ny * nz
        
        # Limit block count for performance
        if total_blocks > 1000000:  # 1 million blocks
            raise HTTPException(
                status_code=400,
                detail=f"Block model too large: {total_blocks:,} blocks. Maximum is 1,000,000. "
                       f"Increase block size or reduce extents."
            )
        
        # Create block model definition
        cur.execute("""
            INSERT INTO block_models (
                project_id, model_name, description,
                x_min, x_max, y_min, y_max, z_min, z_max,
                block_size_x, block_size_y, block_size_z,
                nx, ny, nz,
                interpolation_method, search_radius, min_samples, max_samples,
                status
            ) VALUES (
                %s, %s, %s,
                %s, %s, %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s,
                'draft'
            ) RETURNING id, model_name, total_blocks, created_at
        """, (
            request.project_id, request.model_name, request.description,
            request.x_min, request.x_max, request.y_min, request.y_max, request.z_min, request.z_max,
            request.block_size_x, request.block_size_y, request.block_size_z,
            nx, ny, nz,
            request.interpolation_method, request.search_radius, request.min_samples, request.max_samples
        ))
        
        block_model = cur.fetchone()
        block_model_id = block_model['id']
        
        conn.commit()
        
        # Generate individual block cells (voxels)
        # For large models, this could be done asynchronously
        blocks_created = 0
        batch_size = 1000
        blocks_batch = []
        
        for i in range(nx):
            for j in range(ny):
                for k in range(nz):
                    # Calculate block centroid
                    centroid_x = request.x_min + (i + 0.5) * request.block_size_x
                    centroid_y = request.y_min + (j + 0.5) * request.block_size_y
                    centroid_z = request.z_min + (k + 0.5) * request.block_size_z
                    
                    # Calculate block volume
                    volume = request.block_size_x * request.block_size_y * request.block_size_z
                    
                    blocks_batch.append((
                        block_model_id, i, j, k,
                        centroid_x, centroid_y, centroid_z,
                        volume
                    ))
                    
                    # Insert in batches for performance
                    if len(blocks_batch) >= batch_size:
                        cur.executemany("""
                            INSERT INTO block_model_cells (
                                block_model_id, i, j, k,
                                centroid_x, centroid_y, centroid_z,
                                volume_m3,
                                geometry
                            ) VALUES (
                                %s, %s, %s, %s,
                                %s, %s, %s,
                                %s,
                                ST_SetSRID(ST_MakePoint(%s, %s, %s), 4326)
                            )
                        """, [(b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7], b[4], b[5], b[6]) for b in blocks_batch])
                        blocks_created += len(blocks_batch)
                        conn.commit()
                        blocks_batch = []
        
        # Insert remaining blocks
        if blocks_batch:
            cur.executemany("""
                INSERT INTO block_model_cells (
                    block_model_id, i, j, k,
                    centroid_x, centroid_y, centroid_z,
                    volume_m3,
                    geometry
                ) VALUES (
                    %s, %s, %s, %s,
                    %s, %s, %s,
                    %s,
                    ST_SetSRID(ST_MakePoint(%s, %s, %s), 4326)
                )
            """, [(b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7], b[4], b[5], b[6]) for b in blocks_batch])
            blocks_created += len(blocks_batch)
            conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "block_model_id": block_model_id,
            "model_name": block_model['model_name'],
            "grid_dimensions": {
                "nx": nx,
                "ny": ny,
                "nz": nz
            },
            "total_blocks": block_model['total_blocks'],
            "blocks_created": blocks_created,
            "message": f"Block model '{block_model['model_name']}' created with {blocks_created:,} blocks"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create block model: {str(e)}"
        )


@app.post("/api/block-models/{block_model_id}/estimate")
def estimate_block_grades(block_model_id: str, elements: List[str] = ["au_ppm"]):
    """
    PHASE 5: Estimate grades into block model using 3D Ordinary Kriging
    
    For each block in the model, estimates grade values by interpolating
    from nearby drill hole assay samples using geostatistical kriging.
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get block model definition
        cur.execute("""
            SELECT * FROM block_models WHERE id = %s
        """, (block_model_id,))
        
        block_model = cur.fetchone()
        if not block_model:
            raise HTTPException(status_code=404, detail="Block model not found")
        
        # Get all block cells
        cur.execute("""
            SELECT id, centroid_x, centroid_y, centroid_z
            FROM block_model_cells
            WHERE block_model_id = %s
            ORDER BY i, j, k
        """, (block_model_id,))
        
        blocks = cur.fetchall()
        
        # For each element, get sample data and run kriging
        for element in elements:
            # Validate element
            valid_elements = ["au_ppm", "ag_ppm", "cu_ppm", "pb_ppm", "zn_ppm"]
            if element not in valid_elements:
                continue
            
            # Fetch assay sample data with 3D coordinates
            cur.execute(f"""
                SELECT 
                    dh.easting as x,
                    dh.northing as y,
                    dh.elevation - cs.from_depth as z,
                    a.{element} as grade
                FROM assays a
                JOIN core_samples cs ON cs.id = a.sample_id
                JOIN drill_holes dh ON dh.id = cs.drill_hole_id
                WHERE dh.project_id = %s
                  AND a.{element} IS NOT NULL
                  AND a.{element} > 0
            """, (block_model['project_id'],))
            
            samples = cur.fetchall()
            
            if len(samples) < 3:
                continue  # Not enough data for kriging
            
            # Extract sample coordinates and grades
            sample_x = np.array([float(s['x']) for s in samples])
            sample_y = np.array([float(s['y']) for s in samples])
            sample_z = np.array([float(s['z']) for s in samples])
            sample_grades = np.array([float(s['grade']) for s in samples])
            
            # Estimate grades for each block
            # Note: PyKrige's OrdinaryKriging doesn't support 3D natively in all versions
            # For true 3D kriging, we'd use PyKrige3D or loop with search ellipsoid
            # Here we'll use a simplified 3D approach with weighted nearest neighbors
            
            search_radius = float(block_model['search_radius'])
            min_samples = int(block_model['min_samples'])
            max_samples = int(block_model['max_samples'])
            
            updates_batch = []
            for block in blocks:
                block_x = float(block['centroid_x'])
                block_y = float(block['centroid_y'])
                block_z = float(block['centroid_z'])
                
                # Calculate 3D distances to all samples
                distances = np.sqrt(
                    (sample_x - block_x)**2 +
                    (sample_y - block_y)**2 +
                    (sample_z - block_z)**2
                )
                
                # Find samples within search radius
                within_radius = distances <= search_radius
                if np.sum(within_radius) < min_samples:
                    continue  # Not enough samples nearby
                
                # Get closest samples (up to max_samples)
                sorted_indices = np.argsort(distances)
                selected_indices = sorted_indices[within_radius][:max_samples]
                
                if len(selected_indices) < min_samples:
                    continue
                
                # Inverse Distance Weighting (IDW) for 3D estimation
                # More sophisticated: Use full 3D kriging with PyKrige3D
                selected_distances = distances[selected_indices]
                selected_grades = sample_grades[selected_indices]
                
                # IDW weights (power = 2)
                weights = 1.0 / (selected_distances ** 2 + 1e-10)
                weights /= weights.sum()
                
                # Estimated grade
                estimated_grade = np.sum(weights * selected_grades)
                
                # Variance (simplified - use kriging variance for better estimate)
                variance = np.var(selected_grades)
                
                updates_batch.append((
                    estimated_grade,
                    variance,
                    len(selected_indices),
                    float(np.max(selected_distances)),
                    block['id']
                ))
                
                # Batch update for performance
                if len(updates_batch) >= 500:
                    grade_column = element.replace('_ppm', '_grade')
                    cur.executemany(f"""
                        UPDATE block_model_cells
                        SET {grade_column} = %s,
                            au_variance = %s,
                            sample_count = %s,
                            search_distance = %s,
                            is_estimated = TRUE,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    """, updates_batch)
                    conn.commit()
                    updates_batch = []
            
            # Update remaining blocks
            if updates_batch:
                grade_column = element.replace('_ppm', '_grade')
                cur.executemany(f"""
                    UPDATE block_model_cells
                    SET {grade_column} = %s,
                        au_variance = %s,
                        sample_count = %s,
                        search_distance = %s,
                        is_estimated = TRUE,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, updates_batch)
                conn.commit()
        
        # Update block model status
        cur.execute("""
            UPDATE block_models
            SET status = 'estimated',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (block_model_id,))
        conn.commit()
        
        # Get summary statistics
        cur.execute("""
            SELECT 
                COUNT(*) as total_blocks,
                COUNT(*) FILTER (WHERE is_estimated = TRUE) as estimated_blocks,
                AVG(au_grade) FILTER (WHERE au_grade > 0) as avg_au_grade,
                MAX(au_grade) as max_au_grade,
                MIN(au_grade) FILTER (WHERE au_grade > 0) as min_au_grade
            FROM block_model_cells
            WHERE block_model_id = %s
        """, (block_model_id,))
        
        stats = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "block_model_id": block_model_id,
            "elements_estimated": elements,
            "statistics": {
                "total_blocks": stats['total_blocks'],
                "estimated_blocks": stats['estimated_blocks'],
                "avg_au_grade": float(stats['avg_au_grade']) if stats['avg_au_grade'] else 0,
                "max_au_grade": float(stats['max_au_grade']) if stats['max_au_grade'] else 0,
                "min_au_grade": float(stats['min_au_grade']) if stats['min_au_grade'] else 0
            },
            "message": f"Estimated grades for {stats['estimated_blocks']:,} blocks"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to estimate block grades: {str(e)}"
        )


@app.get("/api/block-models")
def list_block_models(project_id: Optional[str] = None):
    """Get all block models, optionally filtered by project"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if project_id:
            cur.execute("""
                SELECT * FROM v_block_model_summary
                WHERE project_id = %s
                ORDER BY created_at DESC
            """, (project_id,))
        else:
            cur.execute("""
                SELECT * FROM v_block_model_summary
                ORDER BY created_at DESC
            """)
        
        models = cur.fetchall()
        cur.close()
        conn.close()
        
        return {"block_models": models, "count": len(models)}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch block models: {str(e)}"
        )


@app.get("/api/block-models/{block_model_id}/blocks")
def get_block_model_blocks(
    block_model_id: str,
    classification: Optional[str] = None,
    min_grade: Optional[float] = None
):
    """
    Get block model cells for 3D visualization
    Can filter by classification or minimum grade
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        query = """
            SELECT 
                i, j, k,
                centroid_x, centroid_y, centroid_z,
                au_grade, cu_grade,
                classification,
                tonnage,
                is_estimated
            FROM block_model_cells
            WHERE block_model_id = %s
        """
        
        params = [block_model_id]
        
        if classification:
            query += " AND classification = %s"
            params.append(classification)
        
        if min_grade is not None:
            query += " AND au_grade >= %s"
            params.append(min_grade)
        
        query += " ORDER BY k DESC, j, i LIMIT 100000"  # Limit for performance
        
        cur.execute(query, params)
        blocks = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return {
            "blocks": blocks,
            "count": len(blocks)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch block model cells: {str(e)}"
        )


@app.post("/api/block-models/{block_model_id}/classify")
def classify_resources(block_model_id: str, cutoff_grade: float = 0.5):
    """
    PHASE 5: Classify blocks as Measured/Indicated/Inferred based on drill hole spacing
    
    Classification criteria (simplified CIM/JORC approach):
    - Measured: Samples within 25m radius, 4+ holes
    - Indicated: Samples within 50m radius, 2+ holes
    - Inferred: Samples within 100m radius, 1+ hole
    - Unclassified: Outside drill coverage
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Classify blocks based on drill hole proximity
        cur.execute("""
            UPDATE block_model_cells bmc
            SET classification = CASE
                WHEN bmc.search_distance <= 25 AND bmc.sample_count >= 4 THEN 'measured'
                WHEN bmc.search_distance <= 50 AND bmc.sample_count >= 2 THEN 'indicated'
                WHEN bmc.search_distance <= 100 AND bmc.sample_count >= 1 THEN 'inferred'
                ELSE 'unclassified'
            END
            WHERE bmc.block_model_id = %s
              AND bmc.is_estimated = TRUE
              AND bmc.au_grade >= %s
        """, (block_model_id, cutoff_grade))
        
        conn.commit()
        
        # Get classification summary
        cur.execute("""
            SELECT 
                classification,
                COUNT(*) as block_count,
                SUM(tonnage) as total_tonnage,
                AVG(au_grade) as avg_grade,
                SUM(tonnage * au_grade * 0.029166667) as total_au_oz
            FROM block_model_cells
            WHERE block_model_id = %s
              AND classification IS NOT NULL
              AND classification != 'unclassified'
              AND au_grade >= %s
            GROUP BY classification
        """, (block_model_id, cutoff_grade))
        
        classifications = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "block_model_id": block_model_id,
            "cutoff_grade": cutoff_grade,
            "classifications": [
                {
                    "category": c['classification'],
                    "blocks": c['block_count'],
                    "tonnage": float(c['total_tonnage']) if c['total_tonnage'] else 0,
                    "avg_grade_au": float(c['avg_grade']) if c['avg_grade'] else 0,
                    "metal_au_oz": float(c['total_au_oz']) if c['total_au_oz'] else 0
                }
                for c in classifications
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to classify resources: {str(e)}"
        )


@app.post("/api/resource-estimates/create")
def create_resource_estimate(request: ResourceEstimateRequest):
    """
    PHASE 5: Generate a resource estimate report
    
    Calculates M+I+I tonnage, grades, and metal content for reporting.
    Compliant with CIM/JORC/NI 43-101 standards.
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get block model data
        cur.execute("""
            SELECT * FROM block_models WHERE id = %s
        """, (request.block_model_id,))
        
        block_model = cur.fetchone()
        if not block_model:
            raise HTTPException(status_code=404, detail="Block model not found")
        
        # Calculate statistics for each classification
        element_column = request.element.replace('_ppm', '_grade')
        
        # Measured resources
        cur.execute(f"""
            SELECT 
                COUNT(*) as block_count,
                SUM(tonnage) as total_tonnage,
                AVG({element_column}) as avg_grade,
                SUM(tonnage * {element_column} * 0.029166667) as total_oz
            FROM block_model_cells
            WHERE block_model_id = %s
              AND classification = 'measured'
              AND {element_column} >= %s
        """, (request.block_model_id, request.cutoff_grade))
        
        measured = cur.fetchone()
        
        # Indicated resources
        cur.execute(f"""
            SELECT 
                COUNT(*) as block_count,
                SUM(tonnage) as total_tonnage,
                AVG({element_column}) as avg_grade,
                SUM(tonnage * {element_column} * 0.029166667) as total_oz
            FROM block_model_cells
            WHERE block_model_id = %s
              AND classification = 'indicated'
              AND {element_column} >= %s
        """, (request.block_model_id, request.cutoff_grade))
        
        indicated = cur.fetchone()
        
        # Inferred resources
        cur.execute(f"""
            SELECT 
                COUNT(*) as block_count,
                SUM(tonnage) as total_tonnage,
                AVG({element_column}) as avg_grade,
                SUM(tonnage * {element_column} * 0.029166667) as total_oz
            FROM block_model_cells
            WHERE block_model_id = %s
              AND classification = 'inferred'
              AND {element_column} >= %s
        """, (request.block_model_id, request.cutoff_grade))
        
        inferred = cur.fetchone()
        
        # Create resource estimate record
        cur.execute("""
            INSERT INTO resource_estimates (
                block_model_id,
                estimate_name,
                element,
                cutoff_grade,
                measured_tonnes,
                measured_grade,
                measured_metal_oz,
                measured_block_count,
                indicated_tonnes,
                indicated_grade,
                indicated_metal_oz,
                indicated_block_count,
                inferred_tonnes,
                inferred_grade,
                inferred_metal_oz,
                inferred_block_count,
                reporting_standard,
                qualified_person,
                status
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, 'draft'
            ) RETURNING id, estimate_name, total_tonnes, total_metal_oz, created_at
        """, (
            request.block_model_id,
            request.estimate_name,
            request.element,
            request.cutoff_grade,
            measured['total_tonnage'] or 0,
            measured['avg_grade'] or 0,
            measured['total_oz'] or 0,
            measured['block_count'] or 0,
            indicated['total_tonnage'] or 0,
            indicated['avg_grade'] or 0,
            indicated['total_oz'] or 0,
            indicated['block_count'] or 0,
            inferred['total_tonnage'] or 0,
            inferred['avg_grade'] or 0,
            inferred['total_oz'] or 0,
            inferred['block_count'] or 0,
            request.reporting_standard,
            request.qualified_person
        ))
        
        estimate = cur.fetchone()
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "estimate_id": estimate['id'],
            "estimate_name": estimate['estimate_name'],
            "cutoff_grade": request.cutoff_grade,
            "element": request.element,
            "reporting_standard": request.reporting_standard,
            "summary": {
                "measured": {
                    "tonnage": float(measured['total_tonnage']) if measured['total_tonnage'] else 0,
                    "grade": float(measured['avg_grade']) if measured['avg_grade'] else 0,
                    "metal_oz": float(measured['total_oz']) if measured['total_oz'] else 0,
                    "blocks": measured['block_count'] or 0
                },
                "indicated": {
                    "tonnage": float(indicated['total_tonnage']) if indicated['total_tonnage'] else 0,
                    "grade": float(indicated['avg_grade']) if indicated['avg_grade'] else 0,
                    "metal_oz": float(indicated['total_oz']) if indicated['total_oz'] else 0,
                    "blocks": indicated['block_count'] or 0
                },
                "inferred": {
                    "tonnage": float(inferred['total_tonnage']) if inferred['total_tonnage'] else 0,
                    "grade": float(inferred['avg_grade']) if inferred['avg_grade'] else 0,
                    "metal_oz": float(inferred['total_oz']) if inferred['total_oz'] else 0,
                    "blocks": inferred['block_count'] or 0
                },
                "total": {
                    "tonnage": float(estimate['total_tonnes']) if estimate['total_tonnes'] else 0,
                    "metal_oz": float(estimate['total_metal_oz']) if estimate['total_metal_oz'] else 0
                }
            },
            "created_at": str(estimate['created_at'])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create resource estimate: {str(e)}"
        )


@app.get("/api/resource-estimates")
def list_resource_estimates(block_model_id: Optional[str] = None):
    """Get all resource estimates, optionally filtered by block model"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if block_model_id:
            cur.execute("""
                SELECT * FROM resource_estimates
                WHERE block_model_id = %s
                ORDER BY estimate_date DESC
            """, (block_model_id,))
        else:
            cur.execute("""
                SELECT * FROM resource_estimates
                ORDER BY estimate_date DESC
            """)
        
        estimates = cur.fetchall()
        cur.close()
        conn.close()
        
        return {"resource_estimates": estimates, "count": len(estimates)}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch resource estimates: {str(e)}"
        )


# ==========================================
# PRODUCTION TRACKING ENDPOINTS (Phase A1)
# For: Dome Mountain Gold Mine
# ==========================================

class ProductionRecordCreate(BaseModel):
    project_id: str
    production_date: str
    shift_type: str
    stope_name: Optional[str] = None
    ore_tonnes: float = 0
    waste_tonnes: float = 0
    au_grade_gt: Optional[float] = None
    ag_grade_gt: Optional[float] = None
    contractor_name: Optional[str] = None
    notes: Optional[str] = None

class ProductionTargetCreate(BaseModel):
    project_id: str
    target_year: int
    target_month: int
    target_au_ounces: float


@app.get("/api/production/records")
def get_production_records(project_id: Optional[str] = None, limit: int = 50):
    """Get production records with optional project filter"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if project_id:
            cur.execute("""
                SELECT 
                    pr.id,
                    pr.project_id,
                    pr.production_date,
                    pr.shift_type,
                    pr.stope_name,
                    pr.ore_tonnes,
                    pr.waste_tonnes,
                    pr.au_grade_gt,
                    pr.ag_grade_gt,
                    pr.contractor_name,
                    pr.status,
                    pr.notes,
                    pr.created_at,
                    ep.project_name
                FROM production_records pr
                JOIN exploration_projects ep ON pr.project_id = ep.id
                WHERE pr.project_id = %s
                ORDER BY pr.production_date DESC, pr.created_at DESC
                LIMIT %s
            """, (project_id, limit))
        else:
            cur.execute("""
                SELECT 
                    pr.id,
                    pr.project_id,
                    pr.production_date,
                    pr.shift_type,
                    pr.stope_name,
                    pr.ore_tonnes,
                    pr.waste_tonnes,
                    pr.au_grade_gt,
                    pr.ag_grade_gt,
                    pr.contractor_name,
                    pr.status,
                    pr.notes,
                    pr.created_at,
                    ep.project_name
                FROM production_records pr
                JOIN exploration_projects ep ON pr.project_id = ep.id
                ORDER BY pr.production_date DESC, pr.created_at DESC
                LIMIT %s
            """, (limit,))
        
        records = cur.fetchall()
        cur.close()
        conn.close()
        
        return {"records": records, "count": len(records)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch production records: {str(e)}")


@app.post("/api/production/records")
def create_production_record(record: ProductionRecordCreate):
    """Create a new production record (shift entry)"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO production_records (
                project_id, production_date, shift_type, stope_name,
                ore_tonnes, waste_tonnes, au_grade_gt, ag_grade_gt,
                contractor_name, notes, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'completed')
            RETURNING id, production_date, shift_type, ore_tonnes, au_grade_gt
        """, (
            record.project_id,
            record.production_date,
            record.shift_type,
            record.stope_name,
            record.ore_tonnes,
            record.waste_tonnes,
            record.au_grade_gt,
            record.ag_grade_gt,
            record.contractor_name,
            record.notes
        ))
        
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "message": "Production record created",
            "record": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create production record: {str(e)}")


@app.get("/api/production/summary")
def get_production_summary(project_id: str):
    """Get production summary/KPIs for a project"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get totals and averages
        cur.execute("""
            SELECT 
                COUNT(*) as shift_count,
                SUM(ore_tonnes) as total_ore,
                SUM(waste_tonnes) as total_waste,
                AVG(au_grade_gt) as avg_au_grade,
                AVG(ag_grade_gt) as avg_ag_grade,
                SUM(ore_tonnes * au_grade_gt * 0.0321507466) as estimated_au_ounces,
                SUM(ore_tonnes * ag_grade_gt * 0.0321507466) as estimated_ag_ounces
            FROM production_records
            WHERE project_id = %s AND status = 'completed'
        """, (project_id,))
        
        summary = cur.fetchone()
        
        # Get monthly target
        cur.execute("""
            SELECT target_au_ounces, target_year, target_month
            FROM production_targets
            WHERE project_id = %s
            ORDER BY target_year DESC, target_month DESC
            LIMIT 1
        """, (project_id,))
        
        target = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return {
            "summary": summary,
            "target": target,
            "achievement_percent": (
                (summary['estimated_au_ounces'] / target['target_au_ounces'] * 100) 
                if target and target['target_au_ounces'] > 0 
                else 0
            )
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch production summary: {str(e)}")


@app.get("/api/production/targets")
def get_production_targets(project_id: str):
    """Get production targets for a project"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                id, project_id, target_year, target_month, 
                target_au_ounces, status, created_at
            FROM production_targets
            WHERE project_id = %s
            ORDER BY target_year DESC, target_month DESC
        """, (project_id,))
        
        targets = cur.fetchall()
        cur.close()
        conn.close()
        
        return {"targets": targets, "count": len(targets)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch production targets: {str(e)}")


@app.post("/api/production/targets")
def create_production_target(target: ProductionTargetCreate):
    """Create a new production target"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO production_targets (
                project_id, target_year, target_month, target_au_ounces
            ) VALUES (%s, %s, %s, %s)
            RETURNING id, target_year, target_month, target_au_ounces
        """, (
            target.project_id,
            target.target_year,
            target.target_month,
            target.target_au_ounces
        ))
        
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "message": "Production target created",
            "target": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create production target: {str(e)}")


# ==========================================
# VEIN SYSTEMS ENDPOINTS (Phase A2)
# For: Vein tracking at Dome Mountain
# ==========================================

class VeinSystemCreate(BaseModel):
    project_id: str
    vein_name: str
    vein_code: Optional[str] = None
    vein_type: Optional[str] = None
    strike: Optional[float] = None
    dip: Optional[float] = None
    dip_direction: Optional[str] = None
    average_width_m: Optional[float] = None
    min_width_m: Optional[float] = None
    max_width_m: Optional[float] = None
    strike_length_m: Optional[float] = None
    vertical_extent_m: Optional[float] = None
    avg_au_grade_gt: Optional[float] = None
    avg_ag_grade_gt: Optional[float] = None
    production_status: Optional[str] = 'exploration'
    discovery_date: Optional[str] = None
    description: Optional[str] = None


class VeinIntersectionCreate(BaseModel):
    vein_id: str
    drill_hole_id: Optional[str] = None
    hole_id: Optional[str] = None
    intersection_number: Optional[int] = 1
    depth_from_m: float
    depth_to_m: float
    true_width_m: Optional[float] = None
    au_grade_gt: Optional[float] = None
    ag_grade_gt: Optional[float] = None
    visible_gold: Optional[bool] = False
    notes: Optional[str] = None


@app.get("/api/veins")
def get_veins(project_id: Optional[str] = None):
    """Get all vein systems, optionally filtered by project"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if project_id:
            cur.execute("""
                SELECT * FROM v_vein_summary
                WHERE project_id = %s
                ORDER BY priority_rank NULLS LAST, avg_au_grade_gt DESC NULLS LAST
            """, (project_id,))
        else:
            cur.execute("""
                SELECT * FROM v_vein_summary
                ORDER BY priority_rank NULLS LAST, avg_au_grade_gt DESC NULLS LAST
            """)
        
        veins = cur.fetchall()
        cur.close()
        conn.close()
        
        return {"veins": veins, "count": len(veins)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch veins: {str(e)}")


@app.get("/api/veins/{vein_id}")
def get_vein(vein_id: str):
    """Get single vein system by ID"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                id, project_id, vein_name, vein_code, vein_type,
                strike, dip, dip_direction,
                average_width_m, min_width_m, max_width_m,
                strike_length_m, vertical_extent_m,
                mineralization_type, dominant_minerals, alteration_type,
                avg_au_grade_gt, avg_ag_grade_gt,
                max_au_grade_gt, max_ag_grade_gt,
                discovery_date, discovered_by,
                drilling_status, intersections_count,
                production_status, in_current_mine_plan,
                estimated_tonnes, estimated_au_ounces,
                description, geological_notes,
                exploration_potential, priority_rank,
                created_at, updated_at
            FROM vein_systems
            WHERE id = %s
        """, (vein_id,))
        
        vein = cur.fetchone()
        cur.close()
        conn.close()
        
        if not vein:
            raise HTTPException(status_code=404, detail="Vein not found")
        
        return {"vein": vein}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch vein: {str(e)}")


@app.post("/api/veins")
def create_vein(vein: VeinSystemCreate):
    """Create a new vein system"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO vein_systems (
                project_id, vein_name, vein_code, vein_type,
                strike, dip, dip_direction,
                average_width_m, min_width_m, max_width_m,
                strike_length_m, vertical_extent_m,
                avg_au_grade_gt, avg_ag_grade_gt,
                production_status, discovery_date, description
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, vein_name, vein_code, created_at
        """, (
            vein.project_id, vein.vein_name, vein.vein_code, vein.vein_type,
            vein.strike, vein.dip, vein.dip_direction,
            vein.average_width_m, vein.min_width_m, vein.max_width_m,
            vein.strike_length_m, vein.vertical_extent_m,
            vein.avg_au_grade_gt, vein.avg_ag_grade_gt,
            vein.production_status, vein.discovery_date, vein.description
        ))
        
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "message": "Vein system created",
            "vein": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create vein: {str(e)}")


@app.get("/api/veins/{vein_id}/intersections")
def get_vein_intersections(vein_id: str):
    """Get drill hole intersections for a vein"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                id, vein_id, drill_hole_id, hole_id,
                intersection_number, depth_from_m, depth_to_m,
                intersection_length_m, true_width_m, alpha_angle,
                au_grade_gt, ag_grade_gt, au_gt_m, ag_gt_m,
                visible_gold, sulfide_percent, vein_texture,
                core_recovery_percent, verified, notes,
                created_at
            FROM vein_intersections
            WHERE vein_id = %s
            ORDER BY au_grade_gt DESC NULLS LAST
        """, (vein_id,))
        
        intersections = cur.fetchall()
        cur.close()
        conn.close()
        
        return {"intersections": intersections, "count": len(intersections)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch intersections: {str(e)}")


@app.post("/api/veins/intersections")
def create_vein_intersection(intersection: VeinIntersectionCreate):
    """Create a new vein intersection"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO vein_intersections (
                vein_id, drill_hole_id, hole_id, intersection_number,
                depth_from_m, depth_to_m, true_width_m,
                au_grade_gt, ag_grade_gt, visible_gold, notes
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, hole_id, depth_from_m, depth_to_m, au_grade_gt
        """, (
            intersection.vein_id,
            intersection.drill_hole_id,
            intersection.hole_id,
            intersection.intersection_number,
            intersection.depth_from_m,
            intersection.depth_to_m,
            intersection.true_width_m,
            intersection.au_grade_gt,
            intersection.ag_grade_gt,
            intersection.visible_gold,
            intersection.notes
        ))
        
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "message": "Vein intersection created",
            "intersection": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create intersection: {str(e)}")


@app.get("/api/veins/high-grade")
def get_high_grade_intersections(project_id: Optional[str] = None, min_grade: float = 5.0):
    """Get high-grade vein intersections"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        query = """
            SELECT 
                vi.id, vs.vein_name, vs.vein_code, vi.hole_id,
                vi.depth_from_m, vi.depth_to_m, vi.intersection_length_m,
                vi.true_width_m, vi.au_grade_gt, vi.ag_grade_gt,
                vi.au_gt_m, vi.visible_gold
            FROM vein_intersections vi
            JOIN vein_systems vs ON vi.vein_id = vs.id
            WHERE vi.au_grade_gt >= %s
        """
        params = [min_grade]
        
        if project_id:
            query += " AND vs.project_id = %s"
            params.append(project_id)
        
        query += " ORDER BY vi.au_grade_gt DESC"
        
        cur.execute(query, params)
        intersections = cur.fetchall()
        cur.close()
        conn.close()
        
        return {"intersections": intersections, "count": len(intersections)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch high-grade intersections: {str(e)}")


# ==========================================
# GEOPHYSICS ENDPOINTS (Phase A3)
# For: Geophysical Survey Management
# ==========================================

class GeophysicalSurveyCreate(BaseModel):
    project_id: str
    survey_name: str
    survey_type: str  # magnetic, gravity, ip, em, resistivity, seismic, radiometric, other
    survey_date: Optional[str] = None
    contractor_name: Optional[str] = None
    description: Optional[str] = None
    acquisition_method: Optional[str] = None  # airborne, ground, borehole, marine
    line_spacing_m: Optional[float] = None
    station_spacing_m: Optional[float] = None
    terrain_clearance_m: Optional[float] = None
    instrument_type: Optional[str] = None
    total_line_km: Optional[float] = None
    total_stations: Optional[int] = None


class GeophysicalReadingCreate(BaseModel):
    survey_id: str
    station_id: Optional[str] = None
    line_id: Optional[str] = None
    easting: float
    northing: float
    elevation: Optional[float] = None
    total_magnetic_field_nt: Optional[float] = None
    bouguer_gravity_mgal: Optional[float] = None
    chargeability_mv_v: Optional[float] = None
    resistivity_ohm_m: Optional[float] = None
    em_conductivity_s_m: Optional[float] = None


class GeophysicalInterpretationCreate(BaseModel):
    survey_id: str
    interpretation_name: str
    feature_type: str
    anomaly_amplitude: Optional[float] = None
    estimated_depth_m: Optional[float] = None
    geological_significance: Optional[str] = None
    target_type: Optional[str] = None
    drill_priority: Optional[str] = "low"
    confidence_level: Optional[str] = "moderate"


@app.get("/api/geophysics/surveys")
def get_geophysical_surveys(project_id: Optional[str] = None):
    """Get all geophysical surveys, optionally filtered by project"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if project_id:
            cur.execute("""
                SELECT * FROM v_geophysics_survey_summary
                WHERE project_id = %s
                ORDER BY survey_date DESC
            """, (project_id,))
        else:
            cur.execute("""
                SELECT * FROM v_geophysics_survey_summary
                ORDER BY survey_date DESC
            """)
        
        surveys = cur.fetchall()
        cur.close()
        conn.close()
        
        return {"surveys": surveys, "count": len(surveys)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch surveys: {str(e)}")


@app.get("/api/geophysics/surveys/{survey_id}")
def get_geophysical_survey(survey_id: str):
    """Get single geophysical survey by ID"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                id, project_id, survey_name, survey_type, survey_date,
                contractor_name, description, acquisition_method,
                line_spacing_m, station_spacing_m, terrain_clearance_m,
                instrument_type, total_line_km, total_stations,
                processing_level, status, data_quality_score,
                min_easting, max_easting, min_northing, max_northing,
                created_at, updated_at
            FROM geophysical_surveys
            WHERE id = %s
        """, (survey_id,))
        
        survey = cur.fetchone()
        cur.close()
        conn.close()
        
        if not survey:
            raise HTTPException(status_code=404, detail="Survey not found")
        
        return {"survey": survey}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch survey: {str(e)}")


@app.post("/api/geophysics/surveys")
def create_geophysical_survey(survey: GeophysicalSurveyCreate):
    """Create a new geophysical survey"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO geophysical_surveys (
                project_id, survey_name, survey_type, survey_date,
                contractor_name, description, acquisition_method,
                line_spacing_m, station_spacing_m, terrain_clearance_m,
                instrument_type, total_line_km, total_stations, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'planned')
            RETURNING id, survey_name, survey_type, created_at
        """, (
            survey.project_id,
            survey.survey_name,
            survey.survey_type,
            survey.survey_date,
            survey.contractor_name,
            survey.description,
            survey.acquisition_method,
            survey.line_spacing_m,
            survey.station_spacing_m,
            survey.terrain_clearance_m,
            survey.instrument_type,
            survey.total_line_km,
            survey.total_stations
        ))
        
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "message": "Geophysical survey created",
            "survey": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create survey: {str(e)}")


@app.get("/api/geophysics/surveys/{survey_id}/readings")
def get_survey_readings(survey_id: str, limit: int = 1000):
    """Get readings for a specific survey"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                id, station_id, line_id, easting, northing, elevation,
                total_magnetic_field_nt, bouguer_gravity_mgal,
                chargeability_mv_v, resistivity_ohm_m, em_conductivity_s_m,
                quality_flag, created_at
            FROM geophysical_readings
            WHERE survey_id = %s
            ORDER BY line_id, station_id
            LIMIT %s
        """, (survey_id, limit))
        
        readings = cur.fetchall()
        cur.close()
        conn.close()
        
        return {"readings": readings, "count": len(readings)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch readings: {str(e)}")


@app.post("/api/geophysics/readings")
def create_geophysical_reading(reading: GeophysicalReadingCreate):
    """Create a new geophysical reading"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO geophysical_readings (
                survey_id, station_id, line_id, easting, northing, elevation,
                total_magnetic_field_nt, bouguer_gravity_mgal,
                chargeability_mv_v, resistivity_ohm_m, em_conductivity_s_m,
                location
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                      ST_SetSRID(ST_MakePoint(%s, %s, COALESCE(%s, 0)), 4326))
            RETURNING id, station_id, easting, northing
        """, (
            reading.survey_id,
            reading.station_id,
            reading.line_id,
            reading.easting,
            reading.northing,
            reading.elevation,
            reading.total_magnetic_field_nt,
            reading.bouguer_gravity_mgal,
            reading.chargeability_mv_v,
            reading.resistivity_ohm_m,
            reading.em_conductivity_s_m,
            reading.easting,
            reading.northing,
            reading.elevation
        ))
        
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "message": "Reading created",
            "reading": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create reading: {str(e)}")


@app.get("/api/geophysics/interpretations")
def get_interpretations(survey_id: Optional[str] = None, priority: Optional[str] = None):
    """Get geophysical interpretations"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        query = """
            SELECT 
                id, survey_id, interpretation_name, feature_type,
                anomaly_amplitude, estimated_depth_m, geological_significance,
                target_type, drill_priority, confidence_level,
                ST_AsGeoJSON(feature_geometry) as geometry_json,
                created_at, updated_at
            FROM geophysical_interpretations
            WHERE 1=1
        """
        params = []
        
        if survey_id:
            query += " AND survey_id = %s"
            params.append(survey_id)
        
        if priority:
            query += " AND drill_priority = %s"
            params.append(priority)
        
        query += " ORDER BY drill_priority, created_at DESC"
        
        cur.execute(query, params)
        interpretations = cur.fetchall()
        cur.close()
        conn.close()
        
        return {"interpretations": interpretations, "count": len(interpretations)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch interpretations: {str(e)}")


@app.post("/api/geophysics/interpretations")
def create_interpretation(interp: GeophysicalInterpretationCreate):
    """Create a new geophysical interpretation"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO geophysical_interpretations (
                survey_id, interpretation_name, feature_type,
                anomaly_amplitude, estimated_depth_m, geological_significance,
                target_type, drill_priority, confidence_level
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, interpretation_name, drill_priority
        """, (
            interp.survey_id,
            interp.interpretation_name,
            interp.feature_type,
            interp.anomaly_amplitude,
            interp.estimated_depth_m,
            interp.geological_significance,
            interp.target_type,
            interp.drill_priority,
            interp.confidence_level
        ))
        
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "message": "Interpretation created",
            "interpretation": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create interpretation: {str(e)}")


@app.get("/api/geophysics/summary/{project_id}")
def get_geophysics_summary(project_id: str):
    """Get summary statistics for project geophysics"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get survey counts by type
        cur.execute("""
            SELECT 
                COUNT(*) as total_surveys,
                COUNT(CASE WHEN survey_type = 'magnetic' THEN 1 END) as magnetic_surveys,
                COUNT(CASE WHEN survey_type = 'gravity' THEN 1 END) as gravity_surveys,
                COUNT(CASE WHEN survey_type = 'ip' THEN 1 END) as ip_surveys,
                COUNT(CASE WHEN survey_type = 'em' THEN 1 END) as em_surveys,
                SUM(total_line_km) as total_km_surveyed,
                SUM(total_stations) as total_stations
            FROM geophysical_surveys
            WHERE project_id = %s
        """, (project_id,))
        
        summary = cur.fetchone()
        
        # Get high priority targets
        cur.execute("""
            SELECT COUNT(*) as high_priority_targets
            FROM geophysical_interpretations gi
            JOIN geophysical_surveys gs ON gi.survey_id = gs.id
            WHERE gs.project_id = %s AND gi.drill_priority = 'high'
        """, (project_id,))
        
        targets = cur.fetchone()
        
        cur.close()
        conn.close()
        
        return {
            "summary": dict(summary) if summary else {},
            "high_priority_targets": targets['high_priority_targets'] if targets else 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch geophysics summary: {str(e)}")


# ==================== PROJECT MEMBERSHIP ENDPOINTS (INVITE-ONLY GROUPS) ====================

class ProjectMemberCreate(BaseModel):
    project_id: str
    user_id: str
    role: str = "viewer"
    can_invite_others: bool = False
    invited_by: Optional[str] = None

class ProjectInvitationCreate(BaseModel):
    project_id: str
    invitee_email: str
    invitee_name: Optional[str] = None
    role: str = "viewer"
    invited_by: str
    invitation_message: Optional[str] = None

class CollaborationSessionCreate(BaseModel):
    project_id: str
    session_type: str  # 'video', 'chat', 'screen_share', 'cursor_control'
    session_title: Optional[str] = None
    session_context: Optional[str] = None
    started_by: str
    daily_room_url: Optional[str] = None
    ably_channel_name: Optional[str] = None


@app.get("/api/projects/{project_id}/members")
def get_project_members(project_id: str):
    """Get all members of a project (invite-only group)"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT * FROM v_project_members_extended
            WHERE project_id = %s
            ORDER BY 
                CASE role
                    WHEN 'owner' THEN 1
                    WHEN 'admin' THEN 2
                    WHEN 'geologist' THEN 3
                    WHEN 'engineer' THEN 4
                    WHEN 'viewer' THEN 5
                END,
                joined_at ASC
        """, (project_id,))
        
        members = cur.fetchall()
        cur.close()
        conn.close()
        
        return {"members": members, "count": len(members)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch project members: {str(e)}")


@app.post("/api/projects/{project_id}/members")
def add_project_member(project_id: str, member: ProjectMemberCreate):
    """Add a new member to a project (requires admin/owner role)"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if already a member
        cur.execute("""
            SELECT id FROM project_members 
            WHERE project_id = %s AND user_id = %s
        """, (project_id, member.user_id))
        
        existing = cur.fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="User is already a project member")
        
        # Add member
        cur.execute("""
            INSERT INTO project_members (
                project_id, user_id, role, invited_by,
                can_invite_others, invitation_status
            ) VALUES (%s, %s, %s, %s, %s, 'accepted')
            RETURNING id, user_id, role, joined_at
        """, (
            project_id,
            member.user_id,
            member.role,
            member.invited_by,
            member.can_invite_others
        ))
        
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "message": "Member added to project",
            "member": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add project member: {str(e)}")


@app.delete("/api/projects/{project_id}/members/{user_id}")
def remove_project_member(project_id: str, user_id: str):
    """Remove a member from a project (requires admin/owner role)"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Cannot remove owner
        cur.execute("""
            SELECT role FROM project_members
            WHERE project_id = %s AND user_id = %s
        """, (project_id, user_id))
        
        member = cur.fetchone()
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        
        if member['role'] == 'owner':
            raise HTTPException(status_code=403, detail="Cannot remove project owner")
        
        # Remove member
        cur.execute("""
            DELETE FROM project_members
            WHERE project_id = %s AND user_id = %s
        """, (project_id, user_id))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {"success": True, "message": "Member removed from project"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove project member: {str(e)}")


@app.post("/api/projects/{project_id}/invitations")
def send_project_invitation(project_id: str, invitation: ProjectInvitationCreate):
    """Send an invitation to join a project"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Generate unique invitation token
        import secrets
        token = secrets.token_urlsafe(32)
        
        cur.execute("""
            INSERT INTO project_invitations (
                project_id, invitee_email, invitee_name, role,
                invited_by, invitation_message, invitation_token
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, invitation_token, expires_at
        """, (
            project_id,
            invitation.invitee_email,
            invitation.invitee_name,
            invitation.role,
            invitation.invited_by,
            invitation.invitation_message,
            token
        ))
        
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "message": "Invitation sent",
            "invitation_token": result['invitation_token'],
            "expires_at": result['expires_at']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send invitation: {str(e)}")


@app.get("/api/projects/{project_id}/invitations")
def get_project_invitations(project_id: str):
    """Get all pending invitations for a project"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT * FROM v_pending_invitations
            WHERE project_id = %s
            ORDER BY created_at DESC
        """, (project_id,))
        
        invitations = cur.fetchall()
        cur.close()
        conn.close()
        
        return {"invitations": invitations, "count": len(invitations)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch invitations: {str(e)}")


@app.post("/api/projects/{project_id}/collaboration/sessions")
def start_collaboration_session(project_id: str, session: CollaborationSessionCreate):
    """Start a new collaboration session (video/chat)"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO collaboration_sessions (
                project_id, session_type, session_title, session_context,
                started_by, daily_room_url, ably_channel_name, participants
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, ARRAY[%s])
            RETURNING id, session_type, started_at
        """, (
            project_id,
            session.session_type,
            session.session_title,
            session.session_context,
            session.started_by,
            session.daily_room_url,
            session.ably_channel_name,
            session.started_by  # Add starter to participants array
        ))
        
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "message": "Collaboration session started",
            "session": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start collaboration session: {str(e)}")


@app.get("/api/projects/{project_id}/collaboration/sessions")
def get_collaboration_sessions(project_id: str, active_only: bool = True):
    """Get collaboration sessions for a project"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if active_only:
            cur.execute("""
                SELECT * FROM v_active_collaboration_sessions
                WHERE project_id = %s
            """, (project_id,))
        else:
            cur.execute("""
                SELECT * FROM collaboration_sessions
                WHERE project_id = %s
                ORDER BY started_at DESC
                LIMIT 50
            """, (project_id,))
        
        sessions = cur.fetchall()
        cur.close()
        conn.close()
        
        return {"sessions": sessions, "count": len(sessions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch collaboration sessions: {str(e)}")


@app.put("/api/collaboration/sessions/{session_id}/end")
def end_collaboration_session(session_id: str):
    """End a collaboration session"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            UPDATE collaboration_sessions
            SET status = 'ended', ended_at = NOW()
            WHERE id = %s
            RETURNING id, status, ended_at
        """, (session_id,))
        
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "message": "Session ended",
            "session": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to end collaboration session: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

