-- ============================================
-- GEOPHYSICS MODULE SCHEMA
-- Phase A3: Geophysical Survey Management
-- ============================================
-- Purpose: Track and analyze geophysical surveys (Mag, Gravity, IP, EM, etc.)
-- Status: NEW (2025-11-20)

-- ============================================
-- 1. GEOPHYSICAL SURVEYS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS geophysical_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES exploration_projects(id) ON DELETE CASCADE,
    
    -- Survey identification
    survey_name VARCHAR(255) NOT NULL,
    survey_type VARCHAR(50) NOT NULL CHECK (survey_type IN (
        'magnetic', 'gravity', 'ip', 'em', 'resistivity', 
        'seismic', 'radiometric', 'other'
    )),
    
    -- Survey metadata
    survey_date DATE,
    contractor_name VARCHAR(255),
    description TEXT,
    
    -- Acquisition details
    acquisition_method VARCHAR(50) CHECK (acquisition_method IN (
        'airborne', 'ground', 'borehole', 'marine'
    )),
    line_spacing_m DECIMAL(10,2),
    station_spacing_m DECIMAL(10,2),
    terrain_clearance_m DECIMAL(10,2),  -- For airborne surveys
    
    -- Instrument details
    instrument_type VARCHAR(255),
    sensor_configuration TEXT,
    
    -- Data specifications
    total_line_km DECIMAL(10,2),
    total_stations INTEGER,
    data_format VARCHAR(50),  -- e.g., 'XYZ', 'GXF', 'GEOSOFT', 'ASCII'
    
    -- Processing status
    processing_level VARCHAR(50) DEFAULT 'raw' CHECK (processing_level IN (
        'raw', 'corrected', 'leveled', 'gridded', 'interpreted'
    )),
    processing_notes TEXT,
    
    -- Quality metrics
    data_quality_score DECIMAL(3,2),  -- 0-1 scale
    noise_level_nt DECIMAL(10,4),  -- For magnetic surveys (nanoTesla)
    
    -- Survey coverage (bounding box)
    min_easting DECIMAL(12,3),
    max_easting DECIMAL(12,3),
    min_northing DECIMAL(12,3),
    max_northing DECIMAL(12,3),
    
    -- File references
    raw_data_path TEXT,
    processed_data_path TEXT,
    grid_data_path TEXT,
    report_path TEXT,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'planned' CHECK (status IN (
        'planned', 'in_progress', 'completed', 'qc_review', 'approved', 'archived'
    )),
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

-- Index for fast project-based queries
CREATE INDEX idx_geophysical_surveys_project ON geophysical_surveys(project_id);
CREATE INDEX idx_geophysical_surveys_type ON geophysical_surveys(survey_type);
CREATE INDEX idx_geophysical_surveys_date ON geophysical_surveys(survey_date DESC);

-- ============================================
-- 2. GEOPHYSICAL READINGS TABLE
-- ============================================
-- Stores individual station/point readings from surveys
CREATE TABLE IF NOT EXISTS geophysical_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES geophysical_surveys(id) ON DELETE CASCADE,
    
    -- Spatial location
    station_id VARCHAR(100),
    line_id VARCHAR(100),
    easting DECIMAL(12,3) NOT NULL,
    northing DECIMAL(12,3) NOT NULL,
    elevation DECIMAL(10,3),
    location GEOMETRY(PointZ, 4326),  -- PostGIS spatial point
    
    -- Magnetic data
    total_magnetic_field_nt DECIMAL(12,4),  -- Total Magnetic Intensity (TMI) in nanoTesla
    magnetic_gradient_nt_m DECIMAL(10,4),   -- Vertical gradient
    
    -- Gravity data
    bouguer_gravity_mgal DECIMAL(10,4),     -- Bouguer anomaly in milligals
    free_air_gravity_mgal DECIMAL(10,4),    -- Free-air anomaly
    terrain_correction_mgal DECIMAL(10,4),
    
    -- IP (Induced Polarization) data
    chargeability_mv_v DECIMAL(10,4),       -- Chargeability in mV/V
    resistivity_ohm_m DECIMAL(10,2),        -- Apparent resistivity
    
    -- EM (Electromagnetic) data
    em_inphase_ppm DECIMAL(10,2),           -- In-phase component (ppm)
    em_quadrature_ppm DECIMAL(10,2),        -- Quadrature component (ppm)
    em_conductivity_s_m DECIMAL(10,4),      -- Conductivity (S/m)
    
    -- Radiometric data
    potassium_percent DECIMAL(8,4),
    uranium_ppm DECIMAL(8,4),
    thorium_ppm DECIMAL(8,4),
    total_count_cps INTEGER,                -- Counts per second
    
    -- Quality flags
    quality_flag VARCHAR(20) DEFAULT 'good' CHECK (quality_flag IN (
        'good', 'acceptable', 'poor', 'rejected'
    )),
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Spatial index for geographic queries
CREATE INDEX idx_geophysical_readings_location ON geophysical_readings USING GIST(location);
CREATE INDEX idx_geophysical_readings_survey ON geophysical_readings(survey_id);
CREATE INDEX idx_geophysical_readings_line ON geophysical_readings(survey_id, line_id);

-- ============================================
-- 3. GEOPHYSICAL INTERPRETATIONS TABLE
-- ============================================
-- Stores geological interpretations from geophysical data
CREATE TABLE IF NOT EXISTS geophysical_interpretations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES geophysical_surveys(id) ON DELETE CASCADE,
    
    -- Interpretation details
    interpretation_name VARCHAR(255) NOT NULL,
    feature_type VARCHAR(100) NOT NULL,  -- e.g., 'anomaly', 'contact', 'fault', 'conductor'
    
    -- Anomaly characteristics
    anomaly_amplitude DECIMAL(10,4),      -- Peak amplitude of anomaly
    anomaly_wavelength_m DECIMAL(10,2),   -- Spatial wavelength
    estimated_depth_m DECIMAL(10,2),      -- Estimated source depth
    
    -- Geological interpretation
    geological_significance TEXT,
    target_type VARCHAR(100),             -- e.g., 'sulfide', 'iron_formation', 'contact'
    drill_priority VARCHAR(20) CHECK (drill_priority IN ('high', 'medium', 'low', 'none')),
    
    -- Geometry of interpreted feature
    feature_geometry GEOMETRY(Geometry, 4326),  -- Can be point, line, or polygon
    
    -- Confidence and notes
    confidence_level VARCHAR(20) CHECK (confidence_level IN ('high', 'moderate', 'low')),
    interpretation_notes TEXT,
    interpreted_by VARCHAR(255),
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for spatial queries on interpretations
CREATE INDEX idx_geophysical_interpretations_survey ON geophysical_interpretations(survey_id);
CREATE INDEX idx_geophysical_interpretations_geom ON geophysical_interpretations USING GIST(feature_geometry);
CREATE INDEX idx_geophysical_interpretations_priority ON geophysical_interpretations(drill_priority);

-- ============================================
-- 4. SURVEY LINE FILES TABLE
-- ============================================
-- Tracks individual survey line data files
CREATE TABLE IF NOT EXISTS survey_line_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES geophysical_surveys(id) ON DELETE CASCADE,
    
    line_id VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT,
    file_size_bytes BIGINT,
    file_format VARCHAR(50),
    
    -- Line geometry
    line_geometry GEOMETRY(LineString, 4326),
    line_length_m DECIMAL(10,2),
    
    -- Processing metadata
    processing_status VARCHAR(50) DEFAULT 'raw',
    qc_status VARCHAR(50) DEFAULT 'pending',
    qc_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_survey_line_files_survey ON survey_line_files(survey_id);
CREATE INDEX idx_survey_line_files_line ON survey_line_files(line_id);

-- ============================================
-- 5. VIEWS FOR DASHBOARD QUERIES
-- ============================================

-- Survey summary view
CREATE OR REPLACE VIEW v_geophysics_survey_summary AS
SELECT 
    gs.id,
    gs.survey_name,
    gs.survey_type,
    gs.survey_date,
    gs.contractor_name,
    gs.acquisition_method,
    gs.total_line_km,
    gs.total_stations,
    gs.status,
    gs.processing_level,
    ep.name as project_name,
    COUNT(DISTINCT gr.id) as reading_count,
    COUNT(DISTINCT gi.id) as interpretation_count,
    AVG(gr.total_magnetic_field_nt) as avg_magnetic_field,
    AVG(gr.bouguer_gravity_mgal) as avg_bouguer_gravity,
    gs.created_at,
    gs.updated_at
FROM geophysical_surveys gs
LEFT JOIN exploration_projects ep ON gs.project_id = ep.id
LEFT JOIN geophysical_readings gr ON gs.id = gr.survey_id
LEFT JOIN geophysical_interpretations gi ON gs.id = gi.survey_id
GROUP BY gs.id, ep.name;

-- High priority targets view
CREATE OR REPLACE VIEW v_geophysics_high_priority_targets AS
SELECT 
    gi.id,
    gi.interpretation_name,
    gi.feature_type,
    gi.target_type,
    gi.drill_priority,
    gi.estimated_depth_m,
    gi.confidence_level,
    gs.survey_name,
    gs.survey_type,
    ep.name as project_name,
    ST_AsGeoJSON(gi.feature_geometry) as geometry_json
FROM geophysical_interpretations gi
JOIN geophysical_surveys gs ON gi.survey_id = gs.id
JOIN exploration_projects ep ON gs.project_id = ep.id
WHERE gi.drill_priority IN ('high', 'medium')
ORDER BY 
    CASE gi.drill_priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        ELSE 3 
    END,
    gi.confidence_level DESC;

-- ============================================
-- COMMENTS & DOCUMENTATION
-- ============================================

COMMENT ON TABLE geophysical_surveys IS 'Master table for all geophysical surveys (airborne, ground, borehole)';
COMMENT ON TABLE geophysical_readings IS 'Individual station/point readings from geophysical surveys';
COMMENT ON TABLE geophysical_interpretations IS 'Geological interpretations derived from geophysical data';
COMMENT ON TABLE survey_line_files IS 'File tracking for individual survey lines';

COMMENT ON COLUMN geophysical_surveys.survey_type IS 'Type: magnetic, gravity, ip, em, resistivity, seismic, radiometric, other';
COMMENT ON COLUMN geophysical_surveys.acquisition_method IS 'Method: airborne, ground, borehole, marine';
COMMENT ON COLUMN geophysical_surveys.processing_level IS 'Processing stage: raw, corrected, leveled, gridded, interpreted';
COMMENT ON COLUMN geophysical_readings.total_magnetic_field_nt IS 'Total Magnetic Intensity (TMI) in nanoTesla';
COMMENT ON COLUMN geophysical_readings.chargeability_mv_v IS 'IP Chargeability in mV/V';
COMMENT ON COLUMN geophysical_interpretations.drill_priority IS 'Drilling priority based on geophysical anomaly';

-- ============================================
-- SEED DATA: Dome Mountain 2020 Airborne Survey
-- ============================================

-- Insert the 2020 airborne magnetic survey
DO $$
DECLARE
    dome_mountain_id UUID;
    survey_id UUID;
BEGIN
    -- Get Dome Mountain project ID
    SELECT id INTO dome_mountain_id
    FROM exploration_projects
    WHERE name ILIKE '%Dome Mountain%'
    LIMIT 1;
    
    IF dome_mountain_id IS NOT NULL THEN
        -- Insert 2020 airborne magnetic survey
        INSERT INTO geophysical_surveys (
            id,
            project_id,
            survey_name,
            survey_type,
            survey_date,
            contractor_name,
            description,
            acquisition_method,
            line_spacing_m,
            terrain_clearance_m,
            instrument_type,
            total_line_km,
            total_stations,
            processing_level,
            status,
            min_easting,
            max_easting,
            min_northing,
            max_northing
        ) VALUES (
            gen_random_uuid(),
            dome_mountain_id,
            'Dome Mountain 2020 Airborne Magnetic Survey',
            'magnetic',
            '2020-09-15',
            'Precision GeoSurveys Inc.',
            'High-resolution aeromagnetic survey covering the entire Dome Mountain property. Survey aimed at defining structural controls and identifying new magnetic anomalies related to gold mineralization.',
            'airborne',
            100.0,
            80.0,
            'Scintrex CS-3 Cesium Magnetometer',
            486.5,
            12500,
            'gridded',
            'approved',
            589000,
            596000,
            6050000,
            6058000
        )
        RETURNING id INTO survey_id;
        
        -- Insert sample magnetic readings for visualization
        -- Boulder Vein high-mag anomaly
        INSERT INTO geophysical_readings (
            survey_id, station_id, line_id, easting, northing, elevation,
            total_magnetic_field_nt, quality_flag, location
        ) VALUES
            (survey_id, 'L1000_S100', 'L1000', 592500, 6054200, 1850, 58450.5, 'good', 
             ST_SetSRID(ST_MakePoint(592500, 6054200, 1850), 4326)),
            (survey_id, 'L1000_S101', 'L1000', 592550, 6054200, 1850, 58520.3, 'good',
             ST_SetSRID(ST_MakePoint(592550, 6054200, 1850), 4326)),
            (survey_id, 'L1000_S102', 'L1000', 592600, 6054200, 1850, 58610.8, 'good',
             ST_SetSRID(ST_MakePoint(592600, 6054200, 1850), 4326)),
            (survey_id, 'L1050_S100', 'L1050', 592500, 6054250, 1850, 58380.2, 'good',
             ST_SetSRID(ST_MakePoint(592500, 6054250, 1850), 4326)),
            (survey_id, 'L1050_S101', 'L1050', 592550, 6054250, 1850, 58490.6, 'good',
             ST_SetSRID(ST_MakePoint(592550, 6054250, 1850), 4326));
        
        -- Insert interpretation: Boulder Vein magnetic anomaly
        INSERT INTO geophysical_interpretations (
            survey_id,
            interpretation_name,
            feature_type,
            anomaly_amplitude,
            estimated_depth_m,
            geological_significance,
            target_type,
            drill_priority,
            confidence_level,
            interpreted_by,
            feature_geometry
        ) VALUES (
            survey_id,
            'Boulder Vein Magnetic High',
            'anomaly',
            280.5,
            150.0,
            'Strong magnetic anomaly coincident with known Boulder Vein gold mineralization. Anomaly extends 800m along strike, suggesting vein continuity beyond current drilling. Elevated magnetic response likely due to pyrrhotite-bearing alteration zones.',
            'sulfide',
            'high',
            'high',
            'GeoForge AI System',
            ST_SetSRID(ST_MakePoint(592550, 6054200), 4326)
        );
        
        RAISE NOTICE 'Dome Mountain 2020 airborne survey seeded successfully';
    ELSE
        RAISE NOTICE 'Dome Mountain project not found - skipping geophysics seed data';
    END IF;
END $$;

-- ============================================
-- SUCCESS CONFIRMATION
-- ============================================

DO $$ 
BEGIN 
    RAISE NOTICE '✅ GEOPHYSICS SCHEMA MIGRATION COMPLETE';
    RAISE NOTICE 'Tables created: geophysical_surveys, geophysical_readings, geophysical_interpretations, survey_line_files';
    RAISE NOTICE 'Views created: v_geophysics_survey_summary, v_geophysics_high_priority_targets';
    RAISE NOTICE 'Seed data: Dome Mountain 2020 Airborne Magnetic Survey';
END $$;

