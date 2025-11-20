-- ==========================================
-- PHASE A1: Production Tracking for Operating Mines
-- Created: 2025-11-20
-- For: Dome Mountain Gold Mine (Production Q3 2025)
-- ==========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. PRODUCTION RECORDS (Daily/Shift Tracking)
-- ==========================================

CREATE TABLE IF NOT EXISTS production_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES exploration_projects(id) ON DELETE CASCADE,
    
    -- Time tracking
    production_date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL CHECK (shift_type IN ('day', 'night', 'maintenance')),
    shift_start_time TIME,
    shift_end_time TIME,
    
    -- Location in mine
    stope_name VARCHAR(100), -- 'Boulder Vein Level 1', 'Argillite Vein Level 2'
    level_number INTEGER, -- Mine level (underground)
    vein_name VARCHAR(100), -- 'Boulder Vein', 'Boulder East'
    
    -- Production quantities
    ore_tonnes DECIMAL(10, 2) DEFAULT 0,
    waste_tonnes DECIMAL(10, 2) DEFAULT 0,
    total_tonnes DECIMAL(10, 2) GENERATED ALWAYS AS (ore_tonnes + waste_tonnes) STORED,
    
    -- Grades (estimated from geological mapping)
    au_grade_gt DECIMAL(8, 4), -- Gold grade (g/t)
    ag_grade_gt DECIMAL(8, 4), -- Silver grade (g/t)
    
    -- Calculated metal content
    au_ounces DECIMAL(12, 3) GENERATED ALWAYS AS (
        (ore_tonnes * au_grade_gt * 0.0321507466) -- Convert tonnes × g/t to oz
    ) STORED,
    ag_ounces DECIMAL(12, 3) GENERATED ALWAYS AS (
        (ore_tonnes * ag_grade_gt * 0.0321507466)
    ) STORED,
    
    -- Operational details
    contractor_name VARCHAR(255), -- 'Roughstock Mining', 'Cobra Mining'
    crew_size INTEGER,
    equipment_used TEXT[], -- ['Jumbo drill', 'LHD loader', 'Haul truck']
    
    -- Blasting
    blast_conducted BOOLEAN DEFAULT FALSE,
    blast_holes_drilled INTEGER,
    explosives_used_kg DECIMAL(10, 2),
    
    -- Status & Notes
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    safety_incidents INTEGER DEFAULT 0,
    downtime_hours DECIMAL(5, 2) DEFAULT 0,
    notes TEXT,
    
    -- Collaboration
    shift_supervisor_id UUID, -- User who logged this
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Indexes
CREATE INDEX idx_production_records_project ON production_records(project_id);
CREATE INDEX idx_production_records_date ON production_records(production_date DESC);
CREATE INDEX idx_production_records_stope ON production_records(stope_name);
CREATE INDEX idx_production_records_vein ON production_records(vein_name);
CREATE INDEX idx_production_records_contractor ON production_records(contractor_name);
CREATE INDEX idx_production_records_status ON production_records(status);

COMMENT ON TABLE production_records IS 'Daily/shift production tracking for operating mines';


-- ==========================================
-- 2. MILL PROCESSING RECORDS (At Nicola Mining)
-- ==========================================

CREATE TABLE IF NOT EXISTS mill_processing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES exploration_projects(id) ON DELETE CASCADE,
    
    -- Processing details
    processing_date DATE NOT NULL,
    mill_name VARCHAR(255) DEFAULT 'Nicola Mining Inc.', -- Mill operator
    batch_number VARCHAR(100),
    
    -- Feed
    feed_tonnes DECIMAL(10, 2) NOT NULL,
    feed_au_grade_gt DECIMAL(8, 4),
    feed_ag_grade_gt DECIMAL(8, 4),
    
    -- Recovery
    recovery_au_percent DECIMAL(5, 2) DEFAULT 85.0, -- Target 85% recovery
    recovery_ag_percent DECIMAL(5, 2) DEFAULT 80.0,
    
    -- Concentrates produced
    concentrate_tonnes DECIMAL(10, 2),
    concentrate_au_grade_gt DECIMAL(10, 4),
    concentrate_ag_grade_gt DECIMAL(10, 4),
    
    -- Recovered metal
    recovered_au_ounces DECIMAL(12, 3),
    recovered_ag_ounces DECIMAL(12, 3),
    
    -- Tailings
    tailings_tonnes DECIMAL(10, 2),
    tailings_au_grade_gt DECIMAL(8, 4), -- Loss to tailings
    
    -- Processing costs
    processing_cost_total DECIMAL(12, 2),
    processing_cost_per_tonne DECIMAL(8, 2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('scheduled', 'processing', 'completed', 'failed')),
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Indexes
CREATE INDEX idx_mill_records_project ON mill_processing_records(project_id);
CREATE INDEX idx_mill_records_date ON mill_processing_records(processing_date DESC);
CREATE INDEX idx_mill_records_batch ON mill_processing_records(batch_number);
CREATE INDEX idx_mill_records_status ON mill_processing_records(status);

COMMENT ON TABLE mill_processing_records IS 'Mill processing records from Nicola Mining Inc.';


-- ==========================================
-- 3. PRODUCTION TARGETS (Annual/Monthly Goals)
-- ==========================================

CREATE TABLE IF NOT EXISTS production_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES exploration_projects(id) ON DELETE CASCADE,
    
    -- Time period
    target_year INTEGER NOT NULL,
    target_quarter INTEGER CHECK (target_quarter BETWEEN 1 AND 4),
    target_month INTEGER CHECK (target_month BETWEEN 1 AND 12),
    
    -- Tonnage targets
    target_ore_tonnes DECIMAL(12, 2),
    target_waste_tonnes DECIMAL(12, 2),
    
    -- Metal targets
    target_au_ounces DECIMAL(12, 2), -- e.g., 15,000 oz/year for Dome Mountain
    target_ag_ounces DECIMAL(12, 2),
    
    -- Grade targets
    target_au_grade_gt DECIMAL(8, 4),
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    
    UNIQUE(project_id, target_year, target_quarter, target_month)
);

CREATE INDEX idx_production_targets_project ON production_targets(project_id);
CREATE INDEX idx_production_targets_year ON production_targets(target_year);

COMMENT ON TABLE production_targets IS 'Production targets for planning (e.g., 15,000 oz Au/year)';


-- ==========================================
-- 4. VIEWS FOR REPORTING
-- ==========================================

-- Daily production summary
CREATE OR REPLACE VIEW v_daily_production_summary AS
SELECT 
    pr.project_id,
    ep.project_name,
    pr.production_date,
    COUNT(pr.id) AS shift_count,
    SUM(pr.ore_tonnes) AS total_ore_tonnes,
    SUM(pr.waste_tonnes) AS total_waste_tonnes,
    SUM(pr.total_tonnes) AS total_tonnes,
    AVG(pr.au_grade_gt) AS avg_au_grade,
    AVG(pr.ag_grade_gt) AS avg_ag_grade,
    SUM(pr.au_ounces) AS total_au_ounces,
    SUM(pr.ag_ounces) AS total_ag_ounces,
    SUM(pr.downtime_hours) AS total_downtime_hours,
    SUM(pr.safety_incidents) AS total_safety_incidents
FROM production_records pr
JOIN exploration_projects ep ON pr.project_id = ep.id
WHERE pr.status = 'completed'
GROUP BY pr.project_id, ep.project_name, pr.production_date
ORDER BY pr.production_date DESC;

COMMENT ON VIEW v_daily_production_summary IS 'Daily production rollup for dashboard';


-- Monthly production vs targets
CREATE OR REPLACE VIEW v_monthly_production_vs_target AS
SELECT 
    pt.project_id,
    pt.target_year,
    pt.target_month,
    pt.target_au_ounces,
    COALESCE(SUM(pr.au_ounces), 0) AS actual_au_ounces,
    pt.target_au_ounces - COALESCE(SUM(pr.au_ounces), 0) AS variance_au_ounces,
    CASE 
        WHEN pt.target_au_ounces > 0 THEN 
            (COALESCE(SUM(pr.au_ounces), 0) / pt.target_au_ounces * 100)
        ELSE 0 
    END AS achievement_percent
FROM production_targets pt
LEFT JOIN production_records pr ON 
    pr.project_id = pt.project_id 
    AND EXTRACT(YEAR FROM pr.production_date) = pt.target_year
    AND EXTRACT(MONTH FROM pr.production_date) = pt.target_month
    AND pr.status = 'completed'
GROUP BY pt.project_id, pt.target_year, pt.target_month, pt.target_au_ounces
ORDER BY pt.target_year DESC, pt.target_month DESC;

COMMENT ON VIEW v_monthly_production_vs_target IS 'Monthly production vs targets for KPI tracking';


-- ==========================================
-- TRIGGER FUNCTIONS
-- ==========================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_production_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_production_records_updated_at 
    BEFORE UPDATE ON production_records
    FOR EACH ROW EXECUTE FUNCTION update_production_updated_at();

CREATE TRIGGER update_mill_processing_records_updated_at 
    BEFORE UPDATE ON mill_processing_records
    FOR EACH ROW EXECUTE FUNCTION update_production_updated_at();


-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================

COMMENT ON SCHEMA public IS 'GeoForge - Migration 007: Production Tracking Complete';

