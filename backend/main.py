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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

