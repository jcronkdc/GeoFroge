-- ==========================================
-- SEED DATA: Dome Mountain Gold Mine Vein Systems
-- Based on 2022 MRE and historical exploration
-- ==========================================

-- Get Dome Mountain project ID
DO $$
DECLARE
    project_uuid UUID;
BEGIN
    -- Find Dome Mountain project
    SELECT id INTO project_uuid 
    FROM exploration_projects 
    WHERE project_name ILIKE '%Dome Mountain%' 
    LIMIT 1;
    
    IF project_uuid IS NULL THEN
        RAISE EXCEPTION 'Dome Mountain project not found in database';
    END IF;
    
    RAISE NOTICE 'Found Dome Mountain project: %', project_uuid;
    
    -- ==========================================
    -- 1. BOULDER VEIN (Primary Producing Vein)
    -- ==========================================
    INSERT INTO vein_systems (
        project_id, vein_name, vein_code, vein_type,
        strike, dip, dip_direction,
        average_width_m, min_width_m, max_width_m,
        strike_length_m, vertical_extent_m,
        mineralization_type, dominant_minerals, alteration_type,
        avg_au_grade_gt, avg_ag_grade_gt,
        max_au_grade_gt, max_ag_grade_gt,
        host_rock,
        discovery_date, discovered_by,
        drilling_status, intersections_count,
        production_status, in_current_mine_plan,
        estimated_tonnes, estimated_au_ounces,
        description, geological_notes,
        exploration_potential, priority_rank
    ) VALUES (
        project_uuid, 'Boulder Vein', 'BV-01', 'quartz',
        45.0, 65.0, 'NW',
        1.8, 0.5, 3.2,
        450.0, 350.0,
        ARRAY['quartz', 'pyrite', 'chalcopyrite', 'galena'],
        ARRAY['native gold', 'electrum'],
        ARRAY['silicification', 'sericitization'],
        10.32, 55.2,
        45.8, 312.5,
        'volcanoclastic',
        '2020-06-15', 'Blue Lagoon Resources',
        'systematic', 45,
        'producing', TRUE,
        15250.0, 5025.0,
        'Primary producing vein - first production shift July 2025. High-grade quartz vein with visible gold.',
        'Steep-dipping quartz vein in altered volcanic rocks. Consistent grades over 350m vertical extent. Excellent continuity.',
        'high', 1
    );
    
    -- ==========================================
    -- 2. DISCOVERY VEIN (Development Target)
    -- ==========================================
    INSERT INTO vein_systems (
        project_id, vein_name, vein_code, vein_type,
        strike, dip, dip_direction,
        average_width_m, min_width_m, max_width_m,
        strike_length_m, vertical_extent_m,
        mineralization_type, dominant_minerals, alteration_type,
        avg_au_grade_gt, avg_ag_grade_gt,
        max_au_grade_gt, max_ag_grade_gt,
        host_rock,
        discovery_date, discovered_by,
        drilling_status, intersections_count,
        production_status, in_current_mine_plan,
        description, geological_notes,
        exploration_potential, priority_rank
    ) VALUES (
        project_uuid, 'Discovery Vein', 'DV-02', 'quartz-carbonate',
        52.0, 70.0, 'NW',
        1.2, 0.3, 2.5,
        380.0, 300.0,
        ARRAY['quartz', 'carbonate', 'pyrite', 'arsenopyrite'],
        ARRAY['native gold'],
        ARRAY['silicification', 'chloritization'],
        8.15, 42.8,
        28.6, 185.4,
        'basaltic andesite',
        '2019-08-22', 'Blue Lagoon Resources',
        'systematic', 38,
        'development', TRUE,
        'Next target for production - high grade intersections at depth. Development drift in progress.',
        'Quartz-carbonate vein with arsenopyrite. Grades increase with depth. Target for 2026 production.',
        'high', 2
    );
    
    -- ==========================================
    -- 3. LYLE VEIN (Epithermal Style)
    -- ==========================================
    INSERT INTO vein_systems (
        project_id, vein_name, vein_code, vein_type,
        strike, dip, dip_direction,
        average_width_m, min_width_m, max_width_m,
        strike_length_m, vertical_extent_m,
        mineralization_type, dominant_minerals, alteration_type,
        avg_au_grade_gt, avg_ag_grade_gt,
        max_au_grade_gt, max_ag_grade_gt,
        host_rock,
        discovery_date, discovered_by,
        drilling_status, intersections_count,
        production_status, in_current_mine_plan,
        description, geological_notes,
        exploration_potential, priority_rank
    ) VALUES (
        project_uuid, 'Lyle Vein', 'LV-03', 'epithermal',
        38.0, 75.0, 'NW',
        0.9, 0.2, 1.8,
        280.0, 200.0,
        ARRAY['quartz', 'pyrite', 'galena'],
        ARRAY['native silver', 'electrum'],
        ARRAY['argillic', 'silicification'],
        6.02, 31.5,
        18.3, 142.8,
        'volcaniclastic breccia',
        '2020-11-10', 'Blue Lagoon Resources',
        'initial', 22,
        'exploration', FALSE,
        'Epithermal style - potential for expansion at depth. Lower grade but wider.',
        'Low-sulfidation epithermal vein. Narrow but consistent. Requires more drilling to define extent.',
        'moderate', 3
    );
    
    -- ==========================================
    -- 4. NORTH EXTENSION (Boulder System)
    -- ==========================================
    INSERT INTO vein_systems (
        project_id, vein_name, vein_code, vein_type,
        strike, dip, dip_direction,
        average_width_m, min_width_m, max_width_m,
        strike_length_m, vertical_extent_m,
        mineralization_type, dominant_minerals, alteration_type,
        avg_au_grade_gt, avg_ag_grade_gt,
        max_au_grade_gt, max_ag_grade_gt,
        host_rock,
        discovery_date, discovered_by,
        drilling_status, intersections_count,
        production_status, in_current_mine_plan,
        description, geological_notes,
        exploration_potential, priority_rank
    ) VALUES (
        project_uuid, 'North Extension', 'NE-04', 'quartz',
        48.0, 68.0, 'NW',
        1.1, 0.4, 2.0,
        320.0, 250.0,
        ARRAY['quartz', 'pyrite', 'chalcopyrite'],
        ARRAY['native gold'],
        ARRAY['silicification', 'sericitization'],
        7.45, 38.6,
        22.1, 156.7,
        'altered andesite',
        '2021-05-03', 'Blue Lagoon Resources',
        'initial', 18,
        'exploration', FALSE,
        'Northern extension of Boulder Vein system. Requires infill drilling.',
        'Same structural orientation as Boulder Vein. Likely connected. High priority for expansion.',
        'very high', 4
    );
    
    -- ==========================================
    -- 5. SOUTH VEIN (Parallel Structure)
    -- ==========================================
    INSERT INTO vein_systems (
        project_id, vein_name, vein_code, vein_type,
        strike, dip, dip_direction,
        average_width_m, min_width_m, max_width_m,
        strike_length_m, vertical_extent_m,
        mineralization_type, dominant_minerals, alteration_type,
        avg_au_grade_gt, avg_ag_grade_gt,
        max_au_grade_gt, max_ag_grade_gt,
        host_rock,
        discovery_date, discovered_by,
        drilling_status, intersections_count,
        production_status, in_current_mine_plan,
        description, geological_notes,
        exploration_potential, priority_rank
    ) VALUES (
        project_uuid, 'South Vein', 'SV-05', 'quartz-carbonate',
        42.0, 62.0, 'NW',
        0.8, 0.3, 1.5,
        200.0, 180.0,
        ARRAY['quartz', 'carbonate', 'pyrite', 'sphalerite', 'galena'],
        ARRAY['native gold'],
        ARRAY['chloritization', 'carbonatization'],
        5.28, 28.4,
        15.7, 98.3,
        'andesite',
        '2021-09-18', 'Blue Lagoon Resources',
        'initial', 12,
        'exploration', FALSE,
        'Southern parallel structure - requires more drilling to define extent.',
        'Parallel to main Boulder system. Lower grades but potential for resource expansion.',
        'moderate', 5
    );
    
    -- ==========================================
    -- SAMPLE HIGH-GRADE INTERSECTION (Boulder Vein)
    -- ==========================================
    -- Get Boulder Vein ID
    DECLARE
        boulder_vein_uuid UUID;
    BEGIN
        SELECT id INTO boulder_vein_uuid 
        FROM vein_systems 
        WHERE vein_name = 'Boulder Vein' AND project_id = project_uuid
        LIMIT 1;
        
        -- Add sample intersection
        INSERT INTO vein_intersections (
            vein_id, hole_id, intersection_number,
            depth_from_m, depth_to_m, true_width_m,
            au_grade_gt, ag_grade_gt,
            visible_gold, sulfide_percent, vein_texture,
            core_recovery_percent, verified, notes
        ) VALUES (
            boulder_vein_uuid, 'DM-21-045', 1,
            125.3, 128.5, 2.2,
            10.25, 55.8,
            TRUE, 15.0, 'massive quartz with pyrite bands',
            98.5, TRUE, 'High-grade intersection - visible gold in core. Production zone.'
        );
        
        RAISE NOTICE 'Seeded sample intersection for Boulder Vein';
    END;
    
    RAISE NOTICE '✅ Vein system seed data complete';
    RAISE NOTICE '   - 5 veins created';
    RAISE NOTICE '   - 1 high-grade intersection';
    RAISE NOTICE '   - Boulder Vein: 10.32 g/t Au, 450m strike, producing';
    RAISE NOTICE '   - Discovery Vein: 8.15 g/t Au, 380m strike, development';
    
END $$;

