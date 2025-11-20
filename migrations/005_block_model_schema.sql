-- PHASE 5: Block Model Schema
-- Creates tables for 3D block model storage and resource estimation
-- Compatible with PostGIS for spatial queries

-- ==================== BLOCK MODEL DEFINITIONS ====================

CREATE TABLE IF NOT EXISTS block_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES exploration_projects(id) ON DELETE CASCADE,
    
    -- Model metadata
    model_name VARCHAR(255) NOT NULL,
    description TEXT,
    model_type VARCHAR(50) DEFAULT 'regular', -- 'regular', 'subblock', 'adaptive'
    
    -- Model extents (bounding box)
    x_min DOUBLE PRECISION NOT NULL,
    x_max DOUBLE PRECISION NOT NULL,
    y_min DOUBLE PRECISION NOT NULL,
    y_max DOUBLE PRECISION NOT NULL,
    z_min DOUBLE PRECISION NOT NULL,
    z_max DOUBLE PRECISION NOT NULL,
    
    -- Block dimensions
    block_size_x DOUBLE PRECISION NOT NULL DEFAULT 10.0, -- meters
    block_size_y DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    block_size_z DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    
    -- Grid dimensions (calculated)
    nx INTEGER NOT NULL, -- number of blocks in X
    ny INTEGER NOT NULL,
    nz INTEGER NOT NULL,
    total_blocks INTEGER GENERATED ALWAYS AS (nx * ny * nz) STORED,
    
    -- Estimation parameters
    interpolation_method VARCHAR(50) DEFAULT 'ordinary_kriging',
    search_radius DOUBLE PRECISION DEFAULT 50.0,
    min_samples INTEGER DEFAULT 3,
    max_samples INTEGER DEFAULT 12,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'estimated', 'classified', 'reported'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    UNIQUE(project_id, model_name)
);

CREATE INDEX idx_block_models_project ON block_models(project_id);
CREATE INDEX idx_block_models_status ON block_models(status);

COMMENT ON TABLE block_models IS 'Block model definitions - defines 3D grid structure for resource estimation';


-- ==================== INDIVIDUAL BLOCKS (Voxels) ====================

CREATE TABLE IF NOT EXISTS block_model_cells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_model_id UUID NOT NULL REFERENCES block_models(id) ON DELETE CASCADE,
    
    -- Block position (centroid)
    i INTEGER NOT NULL, -- X index
    j INTEGER NOT NULL, -- Y index
    k INTEGER NOT NULL, -- Z index
    
    -- Block centroid coordinates
    centroid_x DOUBLE PRECISION NOT NULL,
    centroid_y DOUBLE PRECISION NOT NULL,
    centroid_z DOUBLE PRECISION NOT NULL,
    
    -- PostGIS geometry (for spatial queries)
    geometry GEOMETRY(PointZ, 4326), -- 3D point
    block_volume GEOMETRY(PolyhedronZ, 4326), -- 3D box (optional, for advanced queries)
    
    -- Geological attributes
    lithology VARCHAR(100),
    domain_code VARCHAR(50), -- geological domain
    
    -- Grade estimates
    au_grade DOUBLE PRECISION, -- Gold (ppm or g/t)
    ag_grade DOUBLE PRECISION, -- Silver
    cu_grade DOUBLE PRECISION, -- Copper (%)
    pb_grade DOUBLE PRECISION, -- Lead (%)
    zn_grade DOUBLE PRECISION, -- Zinc (%)
    
    -- Estimation metadata
    au_variance DOUBLE PRECISION, -- Kriging variance (measure of confidence)
    sample_count INTEGER, -- Number of samples used in estimation
    search_distance DOUBLE PRECISION, -- Distance to furthest sample
    
    -- Tonnage calculation
    volume_m3 DOUBLE PRECISION, -- Block volume (m³)
    density DOUBLE PRECISION DEFAULT 2.7, -- Rock density (t/m³)
    tonnage DOUBLE PRECISION GENERATED ALWAYS AS (volume_m3 * density) STORED,
    
    -- Metal content (calculated)
    au_metal_oz DOUBLE PRECISION, -- Gold ounces = tonnage * au_grade * 0.029166667
    au_metal_kg DOUBLE PRECISION, -- Gold kilograms
    
    -- Resource classification
    classification VARCHAR(50), -- 'measured', 'indicated', 'inferred', 'unclassified'
    
    -- Status
    is_estimated BOOLEAN DEFAULT FALSE,
    is_inside_wireframe BOOLEAN DEFAULT TRUE, -- Set FALSE if outside ore zone
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(block_model_id, i, j, k)
);

CREATE INDEX idx_block_cells_model ON block_model_cells(block_model_id);
CREATE INDEX idx_block_cells_position ON block_model_cells(i, j, k);
CREATE INDEX idx_block_cells_classification ON block_model_cells(classification);
CREATE INDEX idx_block_cells_estimated ON block_model_cells(is_estimated);
CREATE INDEX idx_block_cells_geometry ON block_model_cells USING GIST(geometry);

COMMENT ON TABLE block_model_cells IS 'Individual block cells (voxels) - stores grade estimates for each 3D block';


-- ==================== RESOURCE ESTIMATES ====================

CREATE TABLE IF NOT EXISTS resource_estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_model_id UUID NOT NULL REFERENCES block_models(id) ON DELETE CASCADE,
    
    -- Estimate metadata
    estimate_name VARCHAR(255) NOT NULL,
    estimate_date DATE NOT NULL DEFAULT CURRENT_DATE,
    cutoff_grade DOUBLE PRECISION, -- Minimum grade to include (e.g., 0.5 g/t Au)
    element VARCHAR(50) NOT NULL, -- 'au', 'cu', etc.
    
    -- Tonnage & Grade (by classification)
    measured_tonnes DOUBLE PRECISION DEFAULT 0,
    measured_grade DOUBLE PRECISION DEFAULT 0,
    measured_metal_oz DOUBLE PRECISION DEFAULT 0,
    measured_block_count INTEGER DEFAULT 0,
    
    indicated_tonnes DOUBLE PRECISION DEFAULT 0,
    indicated_grade DOUBLE PRECISION DEFAULT 0,
    indicated_metal_oz DOUBLE PRECISION DEFAULT 0,
    indicated_block_count INTEGER DEFAULT 0,
    
    inferred_tonnes DOUBLE PRECISION DEFAULT 0,
    inferred_grade DOUBLE PRECISION DEFAULT 0,
    inferred_metal_oz DOUBLE PRECISION DEFAULT 0,
    inferred_block_count INTEGER DEFAULT 0,
    
    -- Total M+I+I
    total_tonnes DOUBLE PRECISION GENERATED ALWAYS AS (
        measured_tonnes + indicated_tonnes + inferred_tonnes
    ) STORED,
    total_metal_oz DOUBLE PRECISION GENERATED ALWAYS AS (
        measured_metal_oz + indicated_metal_oz + inferred_metal_oz
    ) STORED,
    
    -- Reporting standards
    reporting_standard VARCHAR(50) DEFAULT 'CIM', -- 'CIM', 'JORC', 'NI43-101'
    qualified_person VARCHAR(255), -- Name of QP
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'reviewed', 'published'
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    UNIQUE(block_model_id, estimate_name)
);

CREATE INDEX idx_resource_estimates_model ON resource_estimates(block_model_id);
CREATE INDEX idx_resource_estimates_element ON resource_estimates(element);
CREATE INDEX idx_resource_estimates_date ON resource_estimates(estimate_date DESC);

COMMENT ON TABLE resource_estimates IS 'Resource estimate reports - summary of M/I/I resources with tonnage and grades';


-- ==================== TRIGGERS ====================

-- Update block_models.updated_at
CREATE OR REPLACE FUNCTION update_block_model_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_block_models
    BEFORE UPDATE ON block_models
    FOR EACH ROW
    EXECUTE FUNCTION update_block_model_timestamp();

CREATE TRIGGER trigger_update_block_cells
    BEFORE UPDATE ON block_model_cells
    FOR EACH ROW
    EXECUTE FUNCTION update_block_model_timestamp();

CREATE TRIGGER trigger_update_resource_estimates
    BEFORE UPDATE ON resource_estimates
    FOR EACH ROW
    EXECUTE FUNCTION update_block_model_timestamp();


-- ==================== HELPER VIEWS ====================

-- View: Block model summary stats
CREATE OR REPLACE VIEW v_block_model_summary AS
SELECT 
    bm.id,
    bm.project_id,
    bm.model_name,
    bm.nx, bm.ny, bm.nz,
    bm.total_blocks,
    COUNT(DISTINCT bc.id) as estimated_blocks,
    COUNT(DISTINCT bc.id) FILTER (WHERE bc.classification = 'measured') as measured_blocks,
    COUNT(DISTINCT bc.id) FILTER (WHERE bc.classification = 'indicated') as indicated_blocks,
    COUNT(DISTINCT bc.id) FILTER (WHERE bc.classification = 'inferred') as inferred_blocks,
    SUM(bc.tonnage) as total_tonnage,
    AVG(bc.au_grade) FILTER (WHERE bc.au_grade > 0) as avg_au_grade,
    MAX(bc.au_grade) as max_au_grade,
    bm.status,
    bm.created_at
FROM block_models bm
LEFT JOIN block_model_cells bc ON bc.block_model_id = bm.id
GROUP BY bm.id;

COMMENT ON VIEW v_block_model_summary IS 'Summary statistics for each block model';


-- ==================== SAMPLE DATA ====================

-- Example: Create a demo block model for Red Lake Gold Project
-- (This would be executed via API, included here for reference)

/*
INSERT INTO block_models (
    project_id, 
    model_name, 
    description,
    x_min, x_max,
    y_min, y_max,
    z_min, z_max,
    block_size_x, block_size_y, block_size_z,
    nx, ny, nz
) VALUES (
    'a76821f7-e2be-4ebf-8830-dc9b9b0c02f6', -- Red Lake project
    'RED-LAKE-MODEL-2025',
    'Resource estimation model for Red Lake Gold Prospect',
    400000, 401000,  -- 1km x 1km area
    5500000, 5501000,
    200, 400,         -- 200m vertical extent
    10, 10, 5,        -- 10x10x5 meter blocks
    100, 100, 40      -- 100x100x40 = 400,000 blocks
);
*/


-- ==================== PERMISSIONS ====================

-- Grant access to authenticated users (adjust as needed)
-- ALTER TABLE block_models ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE block_model_cells ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE resource_estimates ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (to be customized):
-- CREATE POLICY "Users can view block models for their projects"
-- ON block_models FOR SELECT
-- USING (project_id IN (SELECT id FROM exploration_projects WHERE created_by = auth.uid()));

