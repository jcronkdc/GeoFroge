-- ==========================================
-- PHASE A2: Vein System Tracking
-- Created: 2025-11-20
-- For: Dome Mountain Gold Mine (15 known veins)
-- ==========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. VEIN SYSTEMS (Structural Geology)
-- ==========================================

CREATE TABLE IF NOT EXISTS vein_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES exploration_projects(id) ON DELETE CASCADE,
    
    -- Vein identification
    vein_name VARCHAR(100) NOT NULL, -- 'Boulder Vein', 'Boulder East', 'Argillite Vein'
    vein_code VARCHAR(20), -- 'BV-01', 'BE-02', 'AV-03'
    vein_type VARCHAR(50) CHECK (vein_type IN ('quartz', 'quartz-carbonate', 'sulfide', 'epithermal', 'mesothermal', 'orogenic')),
    
    -- Structural orientation
    strike DECIMAL(5, 2) CHECK (strike >= 0 AND strike <= 360), -- Azimuth (0-360°)
    dip DECIMAL(5, 2) CHECK (dip >= 0 AND dip <= 90), -- Dip angle (0-90°)
    dip_direction VARCHAR(10) CHECK (dip_direction IN ('N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW')),
    
    -- Dimensions
    average_width_m DECIMAL(6, 3), -- Average true width in metres
    min_width_m DECIMAL(6, 3),
    max_width_m DECIMAL(6, 3),
    strike_length_m DECIMAL(10, 2), -- Known strike extent
    vertical_extent_m DECIMAL(10, 2), -- Known depth extent
    
    -- Mineralization
    mineralization_type VARCHAR(100)[] DEFAULT '{}', -- ['quartz', 'carbonate', 'pyrite', 'galena']
    dominant_minerals VARCHAR(100)[] DEFAULT '{}', -- ['native gold', 'electrum', 'silver sulfosalts']
    sulfide_content_percent DECIMAL(5, 2), -- Average sulfide %
    
    -- Host rock
    host_rock VARCHAR(100), -- 'volcanoclastic', 'basaltic andesite', 'granite'
    alteration_type VARCHAR(100)[] DEFAULT '{}', -- ['sericite', 'chlorite', 'silica']
    
    -- Grade characteristics
    avg_au_grade_gt DECIMAL(8, 4), -- Average gold grade
    avg_ag_grade_gt DECIMAL(8, 4), -- Average silver grade
    max_au_grade_gt DECIMAL(8, 4), -- Maximum encountered
    max_ag_grade_gt DECIMAL(8, 4),
    
    -- Exploration status
    discovery_date DATE,
    discovered_by VARCHAR(255), -- 'Noranda', 'Blue Lagoon Resources'
    drilling_status VARCHAR(50) DEFAULT 'unknown' CHECK (drilling_status IN ('not_tested', 'initial', 'systematic', 'infill', 'complete')),
    intersections_count INTEGER DEFAULT 0, -- Number of drill hole intersections
    
    -- Production status
    production_status VARCHAR(50) DEFAULT 'exploration' CHECK (production_status IN (
        'discovery', 'exploration', 'drilling', 'resource_defined', 'producing', 'depleted', 'closed'
    )),
    in_current_mine_plan BOOLEAN DEFAULT FALSE,
    
    -- Resource estimate (if calculated separately)
    estimated_tonnes DECIMAL(15, 3),
    estimated_au_ounces DECIMAL(15, 3),
    estimated_ag_ounces DECIMAL(15, 3),
    
    -- Metadata
    description TEXT,
    geological_notes TEXT,
    exploration_potential VARCHAR(50) CHECK (exploration_potential IN ('low', 'moderate', 'high', 'very high')),
    priority_rank INTEGER, -- 1 = highest priority
    
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    
    UNIQUE(project_id, vein_name)
);

-- Indexes
CREATE INDEX idx_vein_systems_project ON vein_systems(project_id);
CREATE INDEX idx_vein_systems_name ON vein_systems(vein_name);
CREATE INDEX idx_vein_systems_code ON vein_systems(vein_code);
CREATE INDEX idx_vein_systems_status ON vein_systems(production_status);
CREATE INDEX idx_vein_systems_priority ON vein_systems(priority_rank);
CREATE INDEX idx_vein_systems_in_plan ON vein_systems(in_current_mine_plan) WHERE in_current_mine_plan = TRUE;

COMMENT ON TABLE vein_systems IS 'Structural vein systems registry for multi-vein deposits like Dome Mountain';


-- ==========================================
-- 2. VEIN INTERSECTIONS (Drill Hole Intercepts)
-- ==========================================

CREATE TABLE IF NOT EXISTS vein_intersections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vein_id UUID NOT NULL REFERENCES vein_systems(id) ON DELETE CASCADE,
    drill_hole_id UUID REFERENCES drill_holes(id) ON DELETE SET NULL,
    
    -- Intersection details
    hole_id VARCHAR(100), -- Denormalized for when drill_holes table doesn't exist yet
    intersection_number INTEGER, -- Multiple intersections per hole possible
    
    -- Depths
    depth_from_m DECIMAL(10, 3) NOT NULL,
    depth_to_m DECIMAL(10, 3) NOT NULL,
    intersection_length_m DECIMAL(10, 3) GENERATED ALWAYS AS (depth_to_m - depth_from_m) STORED,
    
    -- True width calculation
    true_width_m DECIMAL(6, 3), -- Calculated true width perpendicular to vein
    alpha_angle DECIMAL(5, 2), -- Angle between hole and vein for true width calc
    
    -- Grades
    au_grade_gt DECIMAL(12, 6),
    ag_grade_gt DECIMAL(12, 6),
    cu_ppm DECIMAL(12, 6),
    pb_ppm DECIMAL(12, 6),
    zn_ppm DECIMAL(12, 6),
    
    -- Metallics (for grade × width)
    au_gt_m DECIMAL(12, 6) GENERATED ALWAYS AS (au_grade_gt * true_width_m) STORED,
    ag_gt_m DECIMAL(12, 6) GENERATED ALWAYS AS (ag_grade_gt * true_width_m) STORED,
    
    -- Visual observations
    visible_gold BOOLEAN DEFAULT FALSE,
    sulfide_percent DECIMAL(5, 2),
    vein_texture TEXT, -- 'massive', 'banded', 'brecciated', 'stockwork'
    
    -- Quality
    core_recovery_percent DECIMAL(5, 2),
    sample_numbers TEXT[] DEFAULT '{}', -- Associated sample IDs
    
    -- Status
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID,
    verified_date DATE,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CHECK (depth_to_m > depth_from_m),
    UNIQUE(vein_id, drill_hole_id, intersection_number)
);

-- Indexes
CREATE INDEX idx_vein_intersections_vein ON vein_intersections(vein_id);
CREATE INDEX idx_vein_intersections_hole ON vein_intersections(drill_hole_id);
CREATE INDEX idx_vein_intersections_hole_id ON vein_intersections(hole_id);
CREATE INDEX idx_vein_intersections_grade ON vein_intersections(au_grade_gt) WHERE au_grade_gt IS NOT NULL;
CREATE INDEX idx_vein_intersections_visible_gold ON vein_intersections(visible_gold) WHERE visible_gold = TRUE;

COMMENT ON TABLE vein_intersections IS 'Drill hole intersections of vein systems with grades and true widths';


-- ==========================================
-- 3. VIEWS FOR VEIN ANALYSIS
-- ==========================================

-- View: Vein summary with intersection stats
CREATE OR REPLACE VIEW v_vein_summary AS
SELECT 
    vs.id,
    vs.project_id,
    vs.vein_name,
    vs.vein_code,
    vs.average_width_m,
    vs.strike_length_m,
    vs.avg_au_grade_gt,
    vs.production_status,
    vs.in_current_mine_plan,
    vs.priority_rank,
    COUNT(vi.id) AS intersection_count,
    AVG(vi.true_width_m) AS avg_true_width,
    AVG(vi.au_grade_gt) AS avg_intersection_au_gt,
    MAX(vi.au_grade_gt) AS max_intersection_au_gt,
    SUM(vi.au_gt_m) AS total_au_gt_m,
    ep.project_name
FROM vein_systems vs
LEFT JOIN vein_intersections vi ON vs.id = vi.vein_id
JOIN exploration_projects ep ON vs.project_id = ep.id
GROUP BY vs.id, vs.vein_name, vs.vein_code, vs.average_width_m, vs.strike_length_m,
         vs.avg_au_grade_gt, vs.production_status, vs.in_current_mine_plan,
         vs.priority_rank, vs.project_id, ep.project_name
ORDER BY vs.priority_rank NULLS LAST, vs.avg_au_grade_gt DESC NULLS LAST;

COMMENT ON VIEW v_vein_summary IS 'Vein systems with intersection statistics for dashboard';


-- View: High-grade intersections (>5 g/t Au)
CREATE OR REPLACE VIEW v_high_grade_intersections AS
SELECT 
    vi.id,
    vs.vein_name,
    vs.vein_code,
    vi.hole_id,
    vi.depth_from_m,
    vi.depth_to_m,
    vi.intersection_length_m,
    vi.true_width_m,
    vi.au_grade_gt,
    vi.ag_grade_gt,
    vi.au_gt_m,
    vi.visible_gold,
    ep.project_name
FROM vein_intersections vi
JOIN vein_systems vs ON vi.vein_id = vs.id
JOIN exploration_projects ep ON vs.project_id = ep.id
WHERE vi.au_grade_gt > 5.0
ORDER BY vi.au_grade_gt DESC;

COMMENT ON VIEW v_high_grade_intersections IS 'High-grade vein intersections (>5 g/t Au) for targeting';


-- ==========================================
-- TRIGGER FUNCTIONS
-- ==========================================

-- Update vein system intersection count
CREATE OR REPLACE FUNCTION update_vein_intersection_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE vein_systems
    SET intersections_count = (
        SELECT COUNT(*) FROM vein_intersections WHERE vein_id = NEW.vein_id
    ),
    updated_at = NOW()
    WHERE id = NEW.vein_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vein_intersection_count
    AFTER INSERT ON vein_intersections
    FOR EACH ROW EXECUTE FUNCTION update_vein_intersection_count();


-- Update vein system timestamp
CREATE OR REPLACE FUNCTION update_vein_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vein_systems_updated_at
    BEFORE UPDATE ON vein_systems
    FOR EACH ROW EXECUTE FUNCTION update_vein_updated_at();


-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================

COMMENT ON SCHEMA public IS 'GeoForge - Migration 008: Vein System Tracking Complete';

