import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

// Create Supabase client for browser usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'GeoForge'
    }
  }
});

// Database types will be auto-generated from Supabase schema
export type Database = {
  public: {
    Tables: {
      exploration_projects: {
        Row: {
          id: string;
          project_code: string;
          project_name: string;
          project_type: string;
          commodity_target: string[];
          location_name: string | null;
          country: string | null;
          state_province: string | null;
          latitude: number | null;
          longitude: number | null;
          elevation_m: number | null;
          coordinate_system: string;
          land_status: string | null;
          permit_numbers: string[];
          land_area_hectares: number | null;
          current_phase: string | null;
          start_date: string | null;
          expected_completion: string | null;
          project_manager_id: string | null;
          lead_geologist_id: string | null;
          company_id: string | null;
          budget_total: number | null;
          budget_spent: number | null;
          geological_setting: string | null;
          target_depth_m: number | null;
          exploration_model: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['exploration_projects']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['exploration_projects']['Insert']>;
      };
      drill_holes: {
        Row: {
          id: string;
          project_id: string;
          hole_id: string;
          hole_name: string | null;
          hole_type: string;
          collar_easting: number | null;
          collar_northing: number | null;
          collar_elevation: number | null;
          coordinate_system: string;
          azimuth: number | null;
          dip: number | null;
          total_depth_m: number | null;
          core_diameter_mm: number | null;
          planned_depth_m: number | null;
          drill_date_start: string | null;
          drill_date_end: string | null;
          driller_name: string | null;
          drill_rig_id: string | null;
          drilling_contractor: string | null;
          average_recovery_percent: number | null;
          drilling_method: string | null;
          drilling_fluid: string | null;
          weather_conditions: string | null;
          status: string;
          completion_reason: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['drill_holes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['drill_holes']['Insert']>;
      };
      core_logs: {
        Row: {
          id: string;
          drill_hole_id: string;
          depth_from_m: number;
          depth_to_m: number;
          interval_length_m: number;
          core_recovery_percent: number | null;
          rqd_percent: number | null;
          lithology: string;
          lithology_code: string | null;
          rock_type: string | null;
          rock_color: string | null;
          grain_size: string | null;
          texture: string | null;
          alteration_type: string[];
          alteration_intensity: string | null;
          alteration_percent: number | null;
          mineralization_present: boolean;
          mineralization_type: string[];
          mineralization_intensity: string | null;
          mineralization_percent: number | null;
          mineral_species: string[];
          visible_gold: boolean;
          structure_type: string[];
          structure_orientation: string | null;
          veining_percent: number | null;
          vein_type: string[];
          weathering: string | null;
          hardness: string | null;
          sample_taken: boolean;
          sample_ids: string[];
          logged_by: string | null;
          logged_date: string;
          review_status: string;
          reviewed_by: string | null;
          reviewed_date: string | null;
          photo_urls: string[];
          comments: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['core_logs']['Row'], 'id' | 'interval_length_m' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['core_logs']['Insert']>;
      };
    };
  };
};

