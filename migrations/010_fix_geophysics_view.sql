-- Fix v_geophysics_survey_summary view - add missing project_id column
-- Run this on Neon database to fix "column project_id does not exist" error

CREATE OR REPLACE VIEW v_geophysics_survey_summary AS
SELECT 
    gs.id,
    gs.project_id,
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

