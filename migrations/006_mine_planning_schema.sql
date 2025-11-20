-- PHASE 6: Mine Planning & Economic Analysis Schema
-- Pit optimization, scheduling, and financial modeling

-- ==================== PIT SHELLS & OPTIMIZATION ====================

CREATE TABLE IF NOT EXISTS pit_shells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_model_id UUID NOT NULL REFERENCES block_models(id) ON DELETE CASCADE,
    
    -- Shell metadata
    shell_name VARCHAR(255) NOT NULL,
    shell_number INTEGER NOT NULL, -- 1 = innermost, N = outermost
    description TEXT,
    
    -- Optimization parameters
    commodity_price DOUBLE PRECISION NOT NULL, -- $/oz or $/lb
    mining_cost DOUBLE PRECISION NOT NULL DEFAULT 3.0, -- $/tonne
    processing_cost DOUBLE PRECISION NOT NULL DEFAULT 15.0, -- $/tonne
    g_and_a_cost DOUBLE PRECISION NOT NULL DEFAULT 2.0, -- $/tonne
    recovery_rate DOUBLE PRECISION NOT NULL DEFAULT 0.85, -- 85% recovery
    dilution_factor DOUBLE PRECISION NOT NULL DEFAULT 0.05, -- 5% dilution
    mining_loss DOUBLE PRECISION NOT NULL DEFAULT 0.03, -- 3% loss
    
    -- Pit slope angles (degrees)
    overall_slope_angle DOUBLE PRECISION NOT NULL DEFAULT 45.0,
    
    -- Results
    total_tonnes DOUBLE PRECISION,
    ore_tonnes DOUBLE PRECISION,
    waste_tonnes DOUBLE PRECISION,
    strip_ratio DOUBLE PRECISION, -- waste/ore
    average_grade DOUBLE PRECISION,
    contained_metal_oz DOUBLE PRECISION,
    recovered_metal_oz DOUBLE PRECISION,
    
    -- Economics
    gross_revenue DOUBLE PRECISION,
    total_mining_cost DOUBLE PRECISION,
    total_processing_cost DOUBLE PRECISION,
    total_g_and_a_cost DOUBLE PRECISION,
    net_revenue DOUBLE PRECISION,
    npv_5 DOUBLE PRECISION, -- NPV at 5% discount
    npv_10 DOUBLE PRECISION, -- NPV at 10% discount
    irr DOUBLE PRECISION, -- Internal Rate of Return (%)
    payback_period_years DOUBLE PRECISION,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'optimized', 'selected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    UNIQUE(block_model_id, shell_number)
);

CREATE INDEX idx_pit_shells_model ON pit_shells(block_model_id);
CREATE INDEX idx_pit_shells_status ON pit_shells(status);

COMMENT ON TABLE pit_shells IS 'Pit shell definitions from optimization (nested shells)';


-- ==================== PIT SHELL BLOCKS ====================

CREATE TABLE IF NOT EXISTS pit_shell_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pit_shell_id UUID NOT NULL REFERENCES pit_shells(id) ON DELETE CASCADE,
    block_cell_id UUID NOT NULL REFERENCES block_model_cells(id) ON DELETE CASCADE,
    
    -- Block economics
    block_value DOUBLE PRECISION, -- Net value of this block
    cumulative_value DOUBLE PRECISION, -- Value including blocks above
    
    -- Mining sequence
    mining_period INTEGER, -- Which period this block is mined (1, 2, 3...)
    mining_year INTEGER, -- Calendar year
    mining_quarter INTEGER, -- Quarter within year
    
    -- Classification
    is_ore BOOLEAN DEFAULT FALSE, -- Above cutoff grade
    is_waste BOOLEAN DEFAULT FALSE,
    is_in_pit BOOLEAN DEFAULT TRUE, -- Inside optimized pit boundary
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(pit_shell_id, block_cell_id)
);

CREATE INDEX idx_pit_shell_blocks_shell ON pit_shell_blocks(pit_shell_id);
CREATE INDEX idx_pit_shell_blocks_cell ON pit_shell_blocks(block_cell_id);
CREATE INDEX idx_pit_shell_blocks_period ON pit_shell_blocks(mining_period);
CREATE INDEX idx_pit_shell_blocks_ore ON pit_shell_blocks(is_ore);

COMMENT ON TABLE pit_shell_blocks IS 'Blocks included in each pit shell with mining sequence';


-- ==================== MINING SCHEDULES ====================

CREATE TABLE IF NOT EXISTS mining_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pit_shell_id UUID NOT NULL REFERENCES pit_shells(id) ON DELETE CASCADE,
    
    -- Schedule metadata
    schedule_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Mining rates
    mining_rate_tpd DOUBLE PRECISION NOT NULL DEFAULT 50000, -- tonnes per day
    processing_rate_tpd DOUBLE PRECISION NOT NULL DEFAULT 15000,
    operating_days_per_year INTEGER NOT NULL DEFAULT 350,
    
    -- Mine life
    total_years DOUBLE PRECISION,
    production_start_date DATE,
    production_end_date DATE,
    
    -- Totals
    total_ore_mined DOUBLE PRECISION,
    total_waste_mined DOUBLE PRECISION,
    total_metal_recovered_oz DOUBLE PRECISION,
    
    -- Economics
    total_revenue DOUBLE PRECISION,
    total_operating_cost DOUBLE PRECISION,
    total_capital_cost DOUBLE PRECISION,
    npv DOUBLE PRECISION,
    irr DOUBLE PRECISION,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    UNIQUE(pit_shell_id, schedule_name)
);

CREATE INDEX idx_mining_schedules_shell ON mining_schedules(pit_shell_id);
CREATE INDEX idx_mining_schedules_status ON mining_schedules(status);

COMMENT ON TABLE mining_schedules IS 'Mine production schedules (mining sequence by period)';


-- ==================== SCHEDULE PERIODS ====================

CREATE TABLE IF NOT EXISTS schedule_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mining_schedule_id UUID NOT NULL REFERENCES mining_schedules(id) ON DELETE CASCADE,
    
    -- Period identification
    period_number INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    period_quarter INTEGER,
    period_start_date DATE,
    period_end_date DATE,
    
    -- Production
    ore_mined_tonnes DOUBLE PRECISION DEFAULT 0,
    waste_mined_tonnes DOUBLE PRECISION DEFAULT 0,
    ore_processed_tonnes DOUBLE PRECISION DEFAULT 0,
    
    -- Grade & Recovery
    head_grade DOUBLE PRECISION, -- Average grade fed to mill
    metal_recovered_oz DOUBLE PRECISION,
    recovery_rate DOUBLE PRECISION,
    
    -- Costs (period specific)
    mining_cost DOUBLE PRECISION,
    processing_cost DOUBLE PRECISION,
    g_and_a_cost DOUBLE PRECISION,
    total_operating_cost DOUBLE PRECISION,
    capital_cost DOUBLE PRECISION DEFAULT 0, -- Major equipment purchases
    
    -- Revenue
    metal_price DOUBLE PRECISION, -- Price assumption for this period
    gross_revenue DOUBLE PRECISION,
    net_revenue DOUBLE PRECISION, -- Revenue - costs
    
    -- Cash flow
    operating_cash_flow DOUBLE PRECISION,
    cumulative_cash_flow DOUBLE PRECISION,
    discounted_cash_flow DOUBLE PRECISION, -- NPV calculation
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(mining_schedule_id, period_number)
);

CREATE INDEX idx_schedule_periods_schedule ON schedule_periods(mining_schedule_id);
CREATE INDEX idx_schedule_periods_period ON schedule_periods(period_number);
CREATE INDEX idx_schedule_periods_year ON schedule_periods(period_year);

COMMENT ON TABLE schedule_periods IS 'Detailed production and cash flow by period (quarter/year)';


-- ==================== ECONOMIC PARAMETERS ====================

CREATE TABLE IF NOT EXISTS economic_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES exploration_projects(id) ON DELETE CASCADE,
    
    -- Scenario metadata
    scenario_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_base_case BOOLEAN DEFAULT FALSE,
    
    -- Metal prices
    au_price_usd_oz DOUBLE PRECISION DEFAULT 1800, -- Gold
    ag_price_usd_oz DOUBLE PRECISION DEFAULT 24, -- Silver
    cu_price_usd_lb DOUBLE PRECISION DEFAULT 3.50, -- Copper
    
    -- Operating costs
    mining_cost_per_tonne DOUBLE PRECISION DEFAULT 3.0,
    processing_cost_per_tonne DOUBLE PRECISION DEFAULT 15.0,
    g_and_a_cost_per_tonne DOUBLE PRECISION DEFAULT 2.0,
    
    -- Capital costs
    initial_capex DOUBLE PRECISION DEFAULT 50000000, -- $50M
    sustaining_capex_per_year DOUBLE PRECISION DEFAULT 5000000, -- $5M/year
    closure_cost DOUBLE PRECISION DEFAULT 10000000, -- $10M
    
    -- Metallurgy
    au_recovery_rate DOUBLE PRECISION DEFAULT 0.85,
    ag_recovery_rate DOUBLE PRECISION DEFAULT 0.75,
    cu_recovery_rate DOUBLE PRECISION DEFAULT 0.88,
    
    -- Mining parameters
    dilution_factor DOUBLE PRECISION DEFAULT 0.05,
    mining_loss_factor DOUBLE PRECISION DEFAULT 0.03,
    
    -- Financial
    discount_rate DOUBLE PRECISION DEFAULT 0.10, -- 10%
    tax_rate DOUBLE PRECISION DEFAULT 0.30, -- 30%
    royalty_rate DOUBLE PRECISION DEFAULT 0.02, -- 2%
    
    -- Mine design
    overall_pit_slope DOUBLE PRECISION DEFAULT 45.0, -- degrees
    mining_rate_tpd DOUBLE PRECISION DEFAULT 50000,
    processing_rate_tpd DOUBLE PRECISION DEFAULT 15000,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    UNIQUE(project_id, scenario_name)
);

CREATE INDEX idx_economic_scenarios_project ON economic_scenarios(project_id);
CREATE INDEX idx_economic_scenarios_base ON economic_scenarios(is_base_case);

COMMENT ON TABLE economic_scenarios IS 'Economic parameters and assumptions for NPV calculations';


-- ==================== GRADE-TONNAGE CURVES ====================

CREATE TABLE IF NOT EXISTS grade_tonnage_curves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_model_id UUID NOT NULL REFERENCES block_models(id) ON DELETE CASCADE,
    
    -- Curve metadata
    curve_name VARCHAR(255) NOT NULL,
    element VARCHAR(50) NOT NULL, -- 'au', 'cu', etc.
    
    -- Cutoff grade
    cutoff_grade DOUBLE PRECISION NOT NULL,
    
    -- Tonnage above cutoff
    tonnes DOUBLE PRECISION NOT NULL,
    average_grade DOUBLE PRECISION NOT NULL,
    metal_content_oz DOUBLE PRECISION NOT NULL,
    
    -- Percentage of total
    percent_of_total_tonnes DOUBLE PRECISION,
    
    -- Economics at this cutoff
    strip_ratio DOUBLE PRECISION,
    net_value_per_tonne DOUBLE PRECISION,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(block_model_id, element, cutoff_grade)
);

CREATE INDEX idx_grade_tonnage_model ON grade_tonnage_curves(block_model_id);
CREATE INDEX idx_grade_tonnage_element ON grade_tonnage_curves(element);

COMMENT ON TABLE grade_tonnage_curves IS 'Grade-tonnage relationship for cutoff grade optimization';


-- ==================== TRIGGERS ====================

CREATE TRIGGER trigger_update_pit_shells
    BEFORE UPDATE ON pit_shells
    FOR EACH ROW
    EXECUTE FUNCTION update_block_model_timestamp();

CREATE TRIGGER trigger_update_mining_schedules
    BEFORE UPDATE ON mining_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_block_model_timestamp();

CREATE TRIGGER trigger_update_economic_scenarios
    BEFORE UPDATE ON economic_scenarios
    FOR EACH ROW
    EXECUTE FUNCTION update_block_model_timestamp();


-- ==================== HELPER VIEWS ====================

-- View: Pit shell summary
CREATE OR REPLACE VIEW v_pit_shell_summary AS
SELECT 
    ps.id,
    ps.block_model_id,
    ps.shell_name,
    ps.shell_number,
    ps.total_tonnes,
    ps.ore_tonnes,
    ps.waste_tonnes,
    ps.strip_ratio,
    ps.average_grade,
    ps.recovered_metal_oz,
    ps.net_revenue,
    ps.npv_10,
    ps.irr,
    COUNT(psb.id) as block_count,
    ps.status,
    ps.created_at
FROM pit_shells ps
LEFT JOIN pit_shell_blocks psb ON psb.pit_shell_id = ps.id
GROUP BY ps.id;

COMMENT ON VIEW v_pit_shell_summary IS 'Summary statistics for each pit shell';


-- View: Mining schedule summary
CREATE OR REPLACE VIEW v_mining_schedule_summary AS
SELECT 
    ms.id,
    ms.pit_shell_id,
    ms.schedule_name,
    ms.total_years,
    ms.total_ore_mined,
    ms.total_waste_mined,
    ms.total_metal_recovered_oz,
    ms.total_revenue,
    ms.total_operating_cost,
    ms.npv,
    ms.irr,
    COUNT(sp.id) as period_count,
    ms.status
FROM mining_schedules ms
LEFT JOIN schedule_periods sp ON sp.mining_schedule_id = ms.id
GROUP BY ms.id;

COMMENT ON VIEW v_mining_schedule_summary IS 'Summary of mining schedules';


-- ==================== SAMPLE DATA ====================

-- Example: Create base case economic scenario
/*
INSERT INTO economic_scenarios (
    project_id,
    scenario_name,
    description,
    is_base_case,
    au_price_usd_oz,
    mining_cost_per_tonne,
    processing_cost_per_tonne,
    initial_capex
) VALUES (
    'a76821f7-e2be-4ebf-8830-dc9b9b0c02f6', -- Red Lake
    'Base Case',
    'Conservative commodity prices and standard costs',
    TRUE,
    1800, -- $1800/oz Au
    3.0,  -- $3/t mining
    15.0, -- $15/t processing
    50000000 -- $50M initial capex
);
*/

