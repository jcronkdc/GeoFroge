/**
 * Vein System Service
 * API connector for vein tracking and intersection data
 * Phase A2: Dome Mountain Gold Mine vein management
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://geoforge-backend.onrender.com';

export interface VeinSystem {
  id: string;
  project_id: string;
  vein_name: string;
  vein_code?: string;
  vein_type?: 'quartz' | 'quartz-carbonate' | 'sulfide' | 'epithermal' | 'mesothermal' | 'orogenic';
  strike?: number;
  dip?: number;
  dip_direction?: string;
  average_width_m?: number;
  min_width_m?: number;
  max_width_m?: number;
  strike_length_m?: number;
  vertical_extent_m?: number;
  mineralization_type?: string[];
  dominant_minerals?: string[];
  alteration_type?: string[];
  avg_au_grade_gt?: number;
  avg_ag_grade_gt?: number;
  max_au_grade_gt?: number;
  max_ag_grade_gt?: number;
  host_rock?: string;
  discovery_date?: string;
  discovered_by?: string;
  drilling_status?: 'not_tested' | 'initial' | 'systematic' | 'infill' | 'complete';
  intersections_count?: number;
  production_status?: 'discovery' | 'exploration' | 'drilling' | 'resource_defined' | 'producing' | 'depleted' | 'closed';
  in_current_mine_plan?: boolean;
  estimated_tonnes?: number;
  estimated_au_ounces?: number;
  estimated_ag_ounces?: number;
  description?: string;
  geological_notes?: string;
  exploration_potential?: 'low' | 'moderate' | 'high' | 'very high';
  priority_rank?: number;
  status?: 'active' | 'inactive' | 'archived';
  created_at?: string;
  updated_at?: string;
}

export interface VeinSummary {
  id: string;
  project_id: string;
  vein_name: string;
  vein_code?: string;
  average_width_m?: number;
  strike_length_m?: number;
  avg_au_grade_gt?: number;
  production_status?: string;
  in_current_mine_plan?: boolean;
  priority_rank?: number;
  intersection_count?: number;
  avg_true_width?: number;
  avg_intersection_au_gt?: number;
  max_intersection_au_gt?: number;
  total_au_gt_m?: number;
  project_name?: string;
}

export interface VeinIntersection {
  id: string;
  vein_id: string;
  drill_hole_id?: string;
  hole_id?: string;
  intersection_number?: number;
  depth_from_m: number;
  depth_to_m: number;
  intersection_length_m?: number;
  true_width_m?: number;
  alpha_angle?: number;
  au_grade_gt?: number;
  ag_grade_gt?: number;
  cu_ppm?: number;
  pb_ppm?: number;
  zn_ppm?: number;
  au_gt_m?: number;
  ag_gt_m?: number;
  visible_gold?: boolean;
  sulfide_percent?: number;
  vein_texture?: string;
  core_recovery_percent?: number;
  sample_numbers?: string[];
  verified?: boolean;
  verified_by?: string;
  verified_date?: string;
  notes?: string;
  created_at?: string;
}

export interface CreateVeinRequest {
  project_id: string;
  vein_name: string;
  vein_code?: string;
  vein_type?: string;
  strike?: number;
  dip?: number;
  dip_direction?: string;
  average_width_m?: number;
  min_width_m?: number;
  max_width_m?: number;
  strike_length_m?: number;
  vertical_extent_m?: number;
  avg_au_grade_gt?: number;
  avg_ag_grade_gt?: number;
  production_status?: string;
  discovery_date?: string;
  description?: string;
}

export interface CreateIntersectionRequest {
  vein_id: string;
  drill_hole_id?: string;
  hole_id?: string;
  intersection_number?: number;
  depth_from_m: number;
  depth_to_m: number;
  true_width_m?: number;
  au_grade_gt?: number;
  ag_grade_gt?: number;
  visible_gold?: boolean;
  notes?: string;
}

/**
 * VeinService - API connector for vein system endpoints
 */
class VeinService {
  /**
   * Get all vein systems, optionally filtered by project
   */
  async getVeins(projectId?: string): Promise<VeinSummary[]> {
    try {
      const url = projectId 
        ? `${API_BASE_URL}/api/veins?project_id=${projectId}`
        : `${API_BASE_URL}/api/veins`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch veins: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.veins || [];
    } catch (error) {
      console.error('Error fetching veins:', error);
      throw error;
    }
  }

  /**
   * Get single vein system by ID with full details
   */
  async getVein(veinId: string): Promise<VeinSystem> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/veins/${veinId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch vein: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.vein;
    } catch (error) {
      console.error('Error fetching vein:', error);
      throw error;
    }
  }

  /**
   * Create a new vein system
   */
  async createVein(vein: CreateVeinRequest): Promise<VeinSystem> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/veins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vein),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create vein: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.vein;
    } catch (error) {
      console.error('Error creating vein:', error);
      throw error;
    }
  }

  /**
   * Get drill hole intersections for a vein
   */
  async getVeinIntersections(veinId: string): Promise<VeinIntersection[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/veins/${veinId}/intersections`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch intersections: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.intersections || [];
    } catch (error) {
      console.error('Error fetching intersections:', error);
      throw error;
    }
  }

  /**
   * Create a new vein intersection
   */
  async createIntersection(intersection: CreateIntersectionRequest): Promise<VeinIntersection> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/veins/intersections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(intersection),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create intersection: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.intersection;
    } catch (error) {
      console.error('Error creating intersection:', error);
      throw error;
    }
  }

  /**
   * Get high-grade vein intersections (>5 g/t Au by default)
   */
  async getHighGradeIntersections(projectId?: string, minGrade: number = 5.0): Promise<VeinIntersection[]> {
    try {
      const params = new URLSearchParams();
      if (projectId) params.append('project_id', projectId);
      params.append('min_grade', minGrade.toString());
      
      const response = await fetch(`${API_BASE_URL}/api/veins/high-grade?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch high-grade intersections: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.intersections || [];
    } catch (error) {
      console.error('Error fetching high-grade intersections:', error);
      throw error;
    }
  }
}

export const veinService = new VeinService();

