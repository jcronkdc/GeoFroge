-- ==========================================
-- GeoForge: Core Geological Database Schema
-- Migration 001: Foundation Tables
-- Created: 2025-11-20
-- ==========================================

-- Enable PostGIS extension for spatial data
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. EXPLORATION PROJECTS
-- ==========================================

CREATE TABLE IF NOT EXISTS exploration_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code VARCHAR(50) UNIQUE NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  project_type VARCHAR(50) NOT NULL CHECK (project_type IN ('exploration', 'development', 'production', 'care_and_maintenance')),
  commodity_target VARCHAR(100)[] DEFAULT '{}',
  
  -- Location
  location_name VARCHAR(255),
  country VARCHAR(100),
  state_province VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  elevation_m DECIMAL(10, 2),
  coordinate_system VARCHAR(50) DEFAULT 'WGS84',
  
  -- Land & Permits
  land_status VARCHAR(50) CHECK (land_status IN ('claim', 'lease', 'permit', 'owned', 'option')),
  permit_numbers TEXT[] DEFAULT '{}',
  land_area_hectares DECIMAL(12, 2),
  
  -- Project Phases
  current_phase VARCHAR(50) CHECK (current_phase IN ('greenfield', 'grassroots', 'advanced', 'pre-feasibility', 'feasibility', 'mining', 'closed')),
  start_date DATE,
  expected_completion DATE,
  
  -- Team & Budget (foreign keys to be added after user tables created)
  project_manager_id UUID,
  lead_geologist_id UUID,
  company_id UUID,
  budget_total DECIMAL(15, 2),
  budget_spent DECIMAL(15, 2) DEFAULT 0,
  
  -- Geology Summary
  geological_setting TEXT,
  target_depth_m DECIMAL(10, 2),
  exploration_model TEXT,
  
  -- Metadata
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Indexes for exploration_projects
CREATE INDEX idx_exploration_projects_project_code ON exploration_projects(project_code);
CREATE INDEX idx_exploration_projects_company_id ON exploration_projects(company_id);
CREATE INDEX idx_exploration_projects_status ON exploration_projects(status);
CREATE INDEX idx_exploration_projects_project_type ON exploration_projects(project_type);
CREATE INDEX idx_exploration_projects_commodity ON exploration_projects USING GIN(commodity_target);

-- Spatial index for location
CREATE INDEX idx_exploration_projects_location ON exploration_projects USING GIST(ST_Point(longitude, latitude));

COMMENT ON TABLE exploration_projects IS 'Core table for mineral exploration and mining projects';

-- ==========================================
-- 2. DRILL HOLES
-- ==========================================

CREATE TABLE IF NOT EXISTS drill_holes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES exploration_projects(id) ON DELETE CASCADE,
  
  -- Identification
  hole_id VARCHAR(100) NOT NULL,
  hole_name VARCHAR(255),
  hole_type VARCHAR(50) NOT NULL CHECK (hole_type IN ('diamond', 'rc', 'rac', 'percussion', 'auger', 'rotary')),
  
  -- Location (collar)
  collar_easting DECIMAL(12, 3) NOT NULL,
  collar_northing DECIMAL(12, 3) NOT NULL,
  collar_elevation DECIMAL(10, 2),
  collar_rl DECIMAL(10, 2), -- Reduced Level (alternative to elevation)
  coordinate_system VARCHAR(50) DEFAULT 'WGS84',
  
  -- Orientation
  azimuth DECIMAL(5, 2) CHECK (azimuth >= 0 AND azimuth <= 360),
  dip DECIMAL(5, 2) CHECK (dip >= -90 AND dip <= 90),
  
  -- Dimensions
  total_depth_m DECIMAL(10, 2),
  core_diameter_mm DECIMAL(6, 2),
  core_size VARCHAR(10), -- 'NQ', 'HQ', 'PQ', etc.
  planned_depth_m DECIMAL(10, 2),
  
  -- Drilling Details
  drill_date_start DATE,
  drill_date_end DATE,
  driller_name VARCHAR(255),
  drill_rig_id VARCHAR(100),
  drilling_contractor VARCHAR(255),
  
  -- Recovery & Conditions
  average_recovery_percent DECIMAL(5, 2),
  drilling_method TEXT,
  drilling_fluid VARCHAR(100),
  weather_conditions TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'drilling', 'completed', 'abandoned', 'suspended')),
  completion_reason TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  
  UNIQUE(project_id, hole_id)
);

-- Indexes for drill_holes
CREATE INDEX idx_drill_holes_project_id ON drill_holes(project_id);
CREATE INDEX idx_drill_holes_hole_id ON drill_holes(hole_id);
CREATE INDEX idx_drill_holes_status ON drill_holes(status);
CREATE INDEX idx_drill_holes_hole_type ON drill_holes(hole_type);

-- Spatial index for collar location
CREATE INDEX idx_drill_holes_collar ON drill_holes USING GIST(ST_Point(collar_easting, collar_northing));

COMMENT ON TABLE drill_holes IS 'Drill hole database with collar locations, orientations, and drilling details';

-- ==========================================
-- 3. CORE LOGS (Geological Logging)
-- ==========================================

CREATE TABLE IF NOT EXISTS core_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drill_hole_id UUID NOT NULL REFERENCES drill_holes(id) ON DELETE CASCADE,
  
  -- Interval
  depth_from_m DECIMAL(10, 3) NOT NULL,
  depth_to_m DECIMAL(10, 3) NOT NULL,
  interval_length_m DECIMAL(10, 3) GENERATED ALWAYS AS (depth_to_m - depth_from_m) STORED,
  
  -- Core Recovery
  core_recovery_percent DECIMAL(5, 2) CHECK (core_recovery_percent >= 0 AND core_recovery_percent <= 100),
  rqd_percent DECIMAL(5, 2) CHECK (rqd_percent >= 0 AND rqd_percent <= 100),
  
  -- Lithology
  lithology VARCHAR(100) NOT NULL,
  lithology_code VARCHAR(20),
  rock_type VARCHAR(50) CHECK (rock_type IN ('igneous', 'sedimentary', 'metamorphic', 'mixed', 'unknown')),
  rock_color VARCHAR(50),
  grain_size VARCHAR(50) CHECK (grain_size IN ('very fine', 'fine', 'medium', 'coarse', 'very coarse', 'mixed')),
  texture VARCHAR(100),
  
  -- Alteration
  alteration_type VARCHAR(100)[] DEFAULT '{}',
  alteration_intensity VARCHAR(50) CHECK (alteration_intensity IN ('none', 'weak', 'moderate', 'strong', 'pervasive')),
  alteration_percent DECIMAL(5, 2),
  
  -- Mineralization
  mineralization_present BOOLEAN DEFAULT FALSE,
  mineralization_type VARCHAR(100)[] DEFAULT '{}',
  mineralization_intensity VARCHAR(50) CHECK (mineralization_intensity IN ('none', 'weak', 'moderate', 'strong', 'massive')),
  mineralization_percent DECIMAL(5, 2),
  mineral_species VARCHAR(100)[] DEFAULT '{}',
  visible_gold BOOLEAN DEFAULT FALSE,
  
  -- Structure
  structure_type VARCHAR(100)[] DEFAULT '{}',
  structure_orientation TEXT,
  veining_percent DECIMAL(5, 2),
  vein_type VARCHAR(100)[] DEFAULT '{}',
  
  -- Geotechnical
  weathering VARCHAR(50) CHECK (weathering IN ('fresh', 'slightly weathered', 'moderately weathered', 'highly weathered', 'completely weathered', 'residual soil')),
  hardness VARCHAR(50) CHECK (hardness IN ('very soft', 'soft', 'medium hard', 'hard', 'very hard')),
  
  -- Sample Information
  sample_taken BOOLEAN DEFAULT FALSE,
  sample_ids TEXT[] DEFAULT '{}',
  
  -- Logging Details
  logged_by UUID,
  logged_date DATE DEFAULT CURRENT_DATE,
  review_status VARCHAR(50) DEFAULT 'draft' CHECK (review_status IN ('draft', 'reviewed', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_date DATE,
  
  -- Photos & Files
  photo_urls TEXT[] DEFAULT '{}',
  
  -- Metadata
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: depth_to must be greater than depth_from
  CHECK (depth_to_m > depth_from_m)
);

-- Indexes for core_logs
CREATE INDEX idx_core_logs_drill_hole_id ON core_logs(drill_hole_id);
CREATE INDEX idx_core_logs_depth_range ON core_logs(depth_from_m, depth_to_m);
CREATE INDEX idx_core_logs_lithology ON core_logs(lithology);
CREATE INDEX idx_core_logs_mineralization ON core_logs(mineralization_present) WHERE mineralization_present = TRUE;
CREATE INDEX idx_core_logs_review_status ON core_logs(review_status);
CREATE INDEX idx_core_logs_logged_by ON core_logs(logged_by);
CREATE INDEX idx_core_logs_logged_date ON core_logs(logged_date);

COMMENT ON TABLE core_logs IS 'Geological logging of drill core with lithology, alteration, mineralization, and structure';

-- ==========================================
-- 4. FIELD SAMPLES
-- ==========================================

CREATE TABLE IF NOT EXISTS field_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES exploration_projects(id) ON DELETE CASCADE,
  drill_hole_id UUID REFERENCES drill_holes(id) ON DELETE SET NULL,
  
  -- Sample Identification
  sample_id VARCHAR(100) NOT NULL,
  sample_type VARCHAR(50) NOT NULL CHECK (sample_type IN ('core', 'chip', 'grab', 'channel', 'soil', 'stream_sediment', 'rock_chip', 'bulk', 'duplicate', 'standard', 'blank')),
  parent_sample_id VARCHAR(100),
  
  -- Location
  location_type VARCHAR(50) CHECK (location_type IN ('drill_core', 'surface', 'underground', 'trench', 'pit')),
  easting DECIMAL(12, 3),
  northing DECIMAL(12, 3),
  elevation DECIMAL(10, 2),
  depth_from_m DECIMAL(10, 3),
  depth_to_m DECIMAL(10, 3),
  
  -- Sample Details
  sample_weight_kg DECIMAL(10, 3),
  lithology VARCHAR(100),
  mineralization_observed TEXT,
  alteration_observed TEXT,
  
  -- Collection Details
  collected_by UUID,
  collection_date DATE NOT NULL,
  collection_method TEXT,
  
  -- Sample Preparation
  preparation_method TEXT[] DEFAULT '{}',
  preparation_date DATE,
  prepared_by VARCHAR(255),
  
  -- Laboratory Submission
  lab_submitted BOOLEAN DEFAULT FALSE,
  lab_name VARCHAR(255),
  lab_job_number VARCHAR(100),
  submission_date DATE,
  expected_results_date DATE,
  
  -- Chain of Custody
  custody_status VARCHAR(50) DEFAULT 'field' CHECK (custody_status IN ('field', 'in_transit', 'at_lab', 'analyzed', 'archived', 'destroyed')),
  custody_log JSONB DEFAULT '[]'::jsonb,
  
  -- QA/QC Flags
  qaqc_type VARCHAR(50) CHECK (qaqc_type IN ('regular', 'duplicate', 'standard', 'blank', 'field_duplicate', 'lab_duplicate')),
  qaqc_reference_id VARCHAR(100),
  
  -- Photos & Documentation
  photo_urls TEXT[] DEFAULT '{}',
  
  -- Metadata
  notes TEXT,
  status VARCHAR(50) DEFAULT 'collected' CHECK (status IN ('planned', 'collected', 'submitted', 'analyzed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, sample_id)
);

-- Indexes for field_samples
CREATE INDEX idx_field_samples_project_id ON field_samples(project_id);
CREATE INDEX idx_field_samples_drill_hole_id ON field_samples(drill_hole_id);
CREATE INDEX idx_field_samples_sample_id ON field_samples(sample_id);
CREATE INDEX idx_field_samples_sample_type ON field_samples(sample_type);
CREATE INDEX idx_field_samples_collection_date ON field_samples(collection_date);
CREATE INDEX idx_field_samples_lab_submitted ON field_samples(lab_submitted);
CREATE INDEX idx_field_samples_custody_status ON field_samples(custody_status);
CREATE INDEX idx_field_samples_qaqc_type ON field_samples(qaqc_type);

-- Spatial index for sample location
CREATE INDEX idx_field_samples_location ON field_samples USING GIST(ST_Point(easting, northing)) WHERE easting IS NOT NULL AND northing IS NOT NULL;

COMMENT ON TABLE field_samples IS 'Field sample tracking with chain of custody and QAQC flags';

-- ==========================================
-- 5. ASSAY RESULTS (Chemical Analysis)
-- ==========================================

CREATE TABLE IF NOT EXISTS assay_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id UUID NOT NULL REFERENCES field_samples(id) ON DELETE CASCADE,
  
  -- Lab Information
  lab_name VARCHAR(255) NOT NULL,
  lab_job_number VARCHAR(100),
  certificate_number VARCHAR(100),
  analysis_method VARCHAR(100),
  
  -- Analysis Details
  analysis_date DATE,
  received_date DATE,
  reported_date DATE,
  
  -- Element Results (flexible JSONB for any element)
  elements JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Common Elements (indexed for fast queries) - values in ppm unless noted
  au_ppm DECIMAL(12, 6), -- Gold g/t (equivalent to ppm)
  ag_ppm DECIMAL(12, 6), -- Silver
  cu_ppm DECIMAL(12, 6), -- Copper (can be % if >10000)
  cu_pct DECIMAL(8, 4),  -- Copper percent
  pb_ppm DECIMAL(12, 6), -- Lead
  zn_ppm DECIMAL(12, 6), -- Zinc
  fe_pct DECIMAL(8, 4),  -- Iron percent
  s_pct DECIMAL(8, 4),   -- Sulfur percent
  as_ppm DECIMAL(12, 6), -- Arsenic
  mo_ppm DECIMAL(12, 6), -- Molybdenum
  ni_ppm DECIMAL(12, 6), -- Nickel
  co_ppm DECIMAL(12, 6), -- Cobalt
  pt_ppm DECIMAL(12, 6), -- Platinum
  pd_ppm DECIMAL(12, 6), -- Palladium
  li_ppm DECIMAL(12, 6), -- Lithium
  
  -- QA/QC Results
  qaqc_pass BOOLEAN DEFAULT TRUE,
  qaqc_notes TEXT,
  duplicate_check BOOLEAN,
  standard_check BOOLEAN,
  blank_check BOOLEAN,
  
  -- Data Quality
  certified BOOLEAN DEFAULT FALSE,
  certified_by VARCHAR(255),
  certification_date DATE,
  data_entry_status VARCHAR(50) DEFAULT 'pending' CHECK (data_entry_status IN ('pending', 'entered', 'verified', 'approved', 'rejected')),
  entered_by UUID,
  verified_by UUID,
  
  -- Files
  certificate_url TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for assay_results
CREATE INDEX idx_assay_results_sample_id ON assay_results(sample_id);
CREATE INDEX idx_assay_results_lab_name ON assay_results(lab_name);
CREATE INDEX idx_assay_results_analysis_date ON assay_results(analysis_date);
CREATE INDEX idx_assay_results_data_entry_status ON assay_results(data_entry_status);
CREATE INDEX idx_assay_results_au_ppm ON assay_results(au_ppm) WHERE au_ppm IS NOT NULL;
CREATE INDEX idx_assay_results_cu_ppm ON assay_results(cu_ppm) WHERE cu_ppm IS NOT NULL;
CREATE INDEX idx_assay_results_ag_ppm ON assay_results(ag_ppm) WHERE ag_ppm IS NOT NULL;

-- GIN index for JSONB elements
CREATE INDEX idx_assay_results_elements ON assay_results USING GIN(elements);

COMMENT ON TABLE assay_results IS 'Chemical assay results from laboratory analysis of field samples';

-- ==========================================
-- 6. GEOLOGICAL INTERPRETATIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS geological_interpretations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES exploration_projects(id) ON DELETE CASCADE,
  
  -- Interpretation Details
  interpretation_type VARCHAR(50) NOT NULL CHECK (interpretation_type IN ('lithology', 'structure', 'alteration', 'mineralization', 'geophysics', 'resource')),
  interpretation_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Geometry (GIS)
  geometry GEOMETRY(Geometry, 4326),
  geometry_type VARCHAR(50) CHECK (geometry_type IN ('point', 'line', 'polygon', 'multipolygon', 'volume')),
  
  -- 3D Coordinates
  elevation_from_m DECIMAL(10, 2),
  elevation_to_m DECIMAL(10, 2),
  
  -- Attributes
  confidence VARCHAR(50) CHECK (confidence IN ('low', 'medium', 'high', 'very high')),
  geological_age VARCHAR(100),
  formation_name VARCHAR(255),
  
  -- Resource Estimation (if applicable)
  resource_category VARCHAR(50) CHECK (resource_category IN ('inferred', 'indicated', 'measured', 'probable', 'proven')),
  tonnage_mt DECIMAL(15, 3),
  grade_summary JSONB DEFAULT '{}'::jsonb,
  
  -- Interpretation Metadata
  interpreted_by UUID,
  interpretation_date DATE DEFAULT CURRENT_DATE,
  review_status VARCHAR(50) DEFAULT 'draft' CHECK (review_status IN ('draft', 'reviewed', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_date DATE,
  
  -- Associated Data
  supporting_data_ids UUID[] DEFAULT '{}',
  
  -- Files & Visualizations
  map_url TEXT,
  section_urls TEXT[] DEFAULT '{}',
  model_file_url TEXT,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for geological_interpretations
CREATE INDEX idx_geological_interpretations_project_id ON geological_interpretations(project_id);
CREATE INDEX idx_geological_interpretations_type ON geological_interpretations(interpretation_type);
CREATE INDEX idx_geological_interpretations_confidence ON geological_interpretations(confidence);
CREATE INDEX idx_geological_interpretations_resource_category ON geological_interpretations(resource_category);

-- Spatial index for geometry
CREATE INDEX idx_geological_interpretations_geometry ON geological_interpretations USING GIST(geometry) WHERE geometry IS NOT NULL;

COMMENT ON TABLE geological_interpretations IS 'Geological interpretations including lithology, structure, mineralization, and resource estimates';

-- ==========================================
-- 7. GEOPHYSICAL SURVEYS
-- ==========================================

CREATE TABLE IF NOT EXISTS geophysical_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES exploration_projects(id) ON DELETE CASCADE,
  
  -- Survey Details
  survey_name VARCHAR(255) NOT NULL,
  survey_type VARCHAR(100) NOT NULL CHECK (survey_type IN ('magnetic', 'gravity', 'ip', 'induced_polarization', 'em', 'electromagnetics', 'seismic', 'radiometric', 'resistivity')),
  survey_method VARCHAR(100),
  
  -- Acquisition
  contractor VARCHAR(255),
  acquisition_date_start DATE,
  acquisition_date_end DATE,
  survey_area_km2 DECIMAL(10, 3),
  
  -- Parameters
  line_spacing_m DECIMAL(10, 2),
  station_spacing_m DECIMAL(10, 2),
  survey_height_m DECIMAL(10, 2),
  survey_configuration TEXT,
  
  -- Data
  data_format VARCHAR(50),
  data_file_urls TEXT[] DEFAULT '{}',
  processed_data_urls TEXT[] DEFAULT '{}',
  
  -- Processing
  processed_by VARCHAR(255),
  processing_date DATE,
  processing_software VARCHAR(100),
  processing_notes TEXT,
  
  -- Interpretation
  interpretation_summary TEXT,
  targets_identified INTEGER DEFAULT 0,
  anomalies_detected INTEGER DEFAULT 0,
  
  -- Quality
  data_quality VARCHAR(50) CHECK (data_quality IN ('poor', 'fair', 'good', 'excellent')),
  
  -- Metadata
  notes TEXT,
  status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Indexes for geophysical_surveys
CREATE INDEX idx_geophysical_surveys_project_id ON geophysical_surveys(project_id);
CREATE INDEX idx_geophysical_surveys_survey_type ON geophysical_surveys(survey_type);
CREATE INDEX idx_geophysical_surveys_status ON geophysical_surveys(status);

COMMENT ON TABLE geophysical_surveys IS 'Geophysical survey data including magnetic, gravity, IP, EM, and seismic';

-- ==========================================
-- 8. EXPLORATION TARGETS
-- ==========================================

CREATE TABLE IF NOT EXISTS exploration_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES exploration_projects(id) ON DELETE CASCADE,
  
  -- Target Details
  target_id VARCHAR(100) NOT NULL,
  target_name VARCHAR(255) NOT NULL,
  target_type VARCHAR(50) CHECK (target_type IN ('geochemical', 'geophysical', 'geological', 'structural', 'integrated')),
  
  -- Location
  center_easting DECIMAL(12, 3),
  center_northing DECIMAL(12, 3),
  target_area_hectares DECIMAL(10, 3),
  geometry GEOMETRY(Polygon, 4326),
  
  -- Commodities
  primary_commodity VARCHAR(50),
  secondary_commodities VARCHAR(50)[] DEFAULT '{}',
  
  -- Rationale
  discovery_method TEXT,
  geological_rationale TEXT,
  geophysical_signature TEXT,
  geochemical_signature TEXT,
  
  -- Prioritization
  priority_rank INTEGER,
  priority_score DECIMAL(5, 2) CHECK (priority_score >= 0 AND priority_score <= 10),
  confidence_level VARCHAR(50) CHECK (confidence_level IN ('low', 'medium', 'high', 'very high')),
  
  -- Exploration Recommendations
  recommended_work_program TEXT,
  estimated_cost DECIMAL(12, 2),
  drill_ready BOOLEAN DEFAULT FALSE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'identified' CHECK (status IN ('identified', 'planned', 'drilling', 'tested', 'abandoned', 'advanced')),
  
  -- Metadata
  identified_by UUID,
  identification_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, target_id)
);

-- Indexes for exploration_targets
CREATE INDEX idx_exploration_targets_project_id ON exploration_targets(project_id);
CREATE INDEX idx_exploration_targets_target_id ON exploration_targets(target_id);
CREATE INDEX idx_exploration_targets_status ON exploration_targets(status);
CREATE INDEX idx_exploration_targets_priority_rank ON exploration_targets(priority_rank);
CREATE INDEX idx_exploration_targets_drill_ready ON exploration_targets(drill_ready) WHERE drill_ready = TRUE;

-- Spatial index for target geometry
CREATE INDEX idx_exploration_targets_geometry ON exploration_targets USING GIST(geometry) WHERE geometry IS NOT NULL;

COMMENT ON TABLE exploration_targets IS 'Exploration targets generated from geological, geochemical, and geophysical data';

-- ==========================================
-- TRIGGER FUNCTIONS
-- ==========================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_exploration_projects_updated_at BEFORE UPDATE ON exploration_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drill_holes_updated_at BEFORE UPDATE ON drill_holes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_core_logs_updated_at BEFORE UPDATE ON core_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_field_samples_updated_at BEFORE UPDATE ON field_samples
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assay_results_updated_at BEFORE UPDATE ON assay_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_geological_interpretations_updated_at BEFORE UPDATE ON geological_interpretations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_geophysical_surveys_updated_at BEFORE UPDATE ON geophysical_surveys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exploration_targets_updated_at BEFORE UPDATE ON exploration_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- VIEWS FOR COMMON QUERIES
-- ==========================================

-- View: Drill holes with project info
CREATE OR REPLACE VIEW v_drill_holes_summary AS
SELECT 
  dh.id,
  dh.hole_id,
  dh.hole_type,
  dh.status,
  dh.total_depth_m,
  dh.collar_easting,
  dh.collar_northing,
  dh.collar_elevation,
  dh.azimuth,
  dh.dip,
  ep.project_code,
  ep.project_name,
  ep.commodity_target
FROM drill_holes dh
JOIN exploration_projects ep ON dh.project_id = ep.id;

-- View: Samples with assay results summary
CREATE OR REPLACE VIEW v_samples_with_assays AS
SELECT 
  fs.id AS sample_uuid,
  fs.sample_id,
  fs.sample_type,
  fs.collection_date,
  fs.lithology,
  ar.au_ppm,
  ar.ag_ppm,
  ar.cu_ppm,
  ar.pb_ppm,
  ar.zn_ppm,
  ar.analysis_date,
  ar.lab_name,
  ep.project_code,
  ep.project_name
FROM field_samples fs
LEFT JOIN assay_results ar ON fs.id = ar.sample_id
JOIN exploration_projects ep ON fs.project_id = ep.id;

-- View: Core logs with drill hole info
CREATE OR REPLACE VIEW v_core_logs_detail AS
SELECT 
  cl.id,
  cl.depth_from_m,
  cl.depth_to_m,
  cl.interval_length_m,
  cl.lithology,
  cl.alteration_type,
  cl.mineralization_present,
  cl.mineral_species,
  cl.review_status,
  dh.hole_id,
  dh.project_id,
  ep.project_code,
  ep.project_name
FROM core_logs cl
JOIN drill_holes dh ON cl.drill_hole_id = dh.id
JOIN exploration_projects ep ON dh.project_id = ep.id;

-- ==========================================
-- GRANT PERMISSIONS (adjust as needed)
-- ==========================================

-- Grant read access to authenticated users
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant write access to specific roles
-- GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO geologist_role;

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================

COMMENT ON SCHEMA public IS 'GeoForge Geological Exploration Database - Migration 001 Complete';

