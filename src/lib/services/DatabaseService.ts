// Supabase Database Service
// REAL database queries - replaces all mock data

import { supabase } from '../supabase';
import type { Database } from '../supabase';

type Project = Database['public']['Tables']['exploration_projects']['Row'];
type ProjectInsert = Database['public']['Tables']['exploration_projects']['Insert'];
type DrillHole = Database['public']['Tables']['drill_holes']['Row'];
type CoreLog = Database['public']['Tables']['core_logs']['Row'];

// ============================================================================
// PROJECTS
// ============================================================================

export async function getProjects() {
  const { data, error } = await supabase
    .from('exploration_projects')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
  
  return data;
}

export async function getProject(id: string) {
  const { data, error } = await supabase
    .from('exploration_projects')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
  
  return data;
}

export async function createProject(project: ProjectInsert) {
  const { data, error } = await supabase
    .from('exploration_projects')
    .insert(project)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating project:', error);
    throw error;
  }
  
  return data;
}

export async function updateProject(id: string, updates: Partial<ProjectInsert>) {
  const { data, error } = await supabase
    .from('exploration_projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }
  
  return data;
}

export async function deleteProject(id: string) {
  const { error } = await supabase
    .from('exploration_projects')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

// ============================================================================
// DRILL HOLES
// ============================================================================

export async function getDrillHoles(projectId: string) {
  const { data, error } = await supabase
    .from('drill_holes')
    .select('*')
    .eq('project_id', projectId)
    .order('hole_id', { ascending: true });
  
  if (error) {
    console.error('Error fetching drill holes:', error);
    throw error;
  }
  
  return data;
}

export async function getDrillHole(id: string) {
  const { data, error } = await supabase
    .from('drill_holes')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching drill hole:', error);
    throw error;
  }
  
  return data;
}

export async function createDrillHole(drillHole: Database['public']['Tables']['drill_holes']['Insert']) {
  const { data, error } = await supabase
    .from('drill_holes')
    .insert(drillHole)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating drill hole:', error);
    throw error;
  }
  
  return data;
}

// ============================================================================
// CORE LOGS
// ============================================================================

export async function getCoreLogs(drillHoleId: string) {
  const { data, error } = await supabase
    .from('core_logs')
    .select('*')
    .eq('drill_hole_id', drillHoleId)
    .order('depth_from_m', { ascending: true });
  
  if (error) {
    console.error('Error fetching core logs:', error);
    throw error;
  }
  
  return data;
}

export async function createCoreLog(coreLog: Database['public']['Tables']['core_logs']['Insert']) {
  const { data, error} = await supabase
    .from('core_logs')
    .insert(coreLog)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating core log:', error);
    throw error;
  }
  
  return data;
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export function subscribeToProjects(callback: (payload: any) => void) {
  return supabase
    .channel('projects')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'exploration_projects'
      },
      callback
    )
    .subscribe();
}

export function subscribeToDrillHoles(projectId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`drill-holes-${projectId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'drill_holes',
        filter: `project_id=eq.${projectId}`
      },
      callback
    )
    .subscribe();
}

// ============================================================================
// SPATIAL QUERIES (PostGIS)
// ============================================================================

export async function getDrillHolesNearLocation(
  latitude: number,
  longitude: number,
  radiusKm: number
) {
  // Use PostGIS ST_DWithin for spatial search
  const { data, error } = await supabase.rpc('drill_holes_near_point', {
    lat: latitude,
    lon: longitude,
    radius_km: radiusKm
  });
  
  if (error) {
    console.error('Error fetching nearby drill holes:', error);
    throw error;
  }
  
  return data;
}

// ============================================================================
// STATISTICS
// ============================================================================

export async function getProjectStats(projectId: string) {
  // Get drill hole count
  const { count: drillHoleCount } = await supabase
    .from('drill_holes')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);
  
  // Get total depth drilled
  const { data: drillHoles } = await supabase
    .from('drill_holes')
    .select('total_depth_m')
    .eq('project_id', projectId);
  
  const totalDepth = drillHoles?.reduce((sum: number, dh: any) => sum + (dh.total_depth_m || 0), 0) || 0;
  
  // Get core log count
  const { count: coreLogCount } = await supabase
    .from('core_logs')
    .select('drill_hole_id, drill_holes!inner(project_id)', { count: 'exact', head: true })
    .eq('drill_holes.project_id', projectId);
  
  return {
    drillHoleCount: drillHoleCount || 0,
    totalDepthDrilled: totalDepth,
    coreLogCount: coreLogCount || 0
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export const dbService = {
  // Projects
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  
  // Drill Holes
  getDrillHoles,
  getDrillHole,
  createDrillHole,
  
  // Core Logs
  getCoreLogs,
  createCoreLog,
  
  // Subscriptions
  subscribeToProjects,
  subscribeToDrillHoles,
  
  // Spatial
  getDrillHolesNearLocation,
  
  // Stats
  getProjectStats
};

