-- ==========================================
-- GeoForge: Project Access Control & Invite-Only Groups
-- Migration 011: Project Membership & RLS Enforcement
-- Created: 2025-11-21
-- Purpose: Implement invite-only groups with database-level security
-- ==========================================

-- Enable Row Level Security extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. PROJECT MEMBERS TABLE (Invite-Only Groups)
-- ==========================================

CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES exploration_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- References auth.users or neon_auth.users_sync
  
  -- Role within project (fine-grained permissions)
  role VARCHAR(50) NOT NULL DEFAULT 'viewer' CHECK (role IN (
    'owner',        -- Full control, can delete project
    'admin',        -- Can add/remove members, edit all data
    'geologist',    -- Can edit geological data (drill holes, logs, assays)
    'engineer',     -- Can edit engineering data (production, planning)
    'viewer'        -- Read-only access
  )),
  
  -- Invitation tracking
  invited_by UUID, -- User who sent invitation
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  invitation_status VARCHAR(50) DEFAULT 'accepted' CHECK (invitation_status IN (
    'pending',      -- Invitation sent, not yet accepted
    'accepted',     -- User has joined project
    'declined',     -- User declined invitation
    'revoked'       -- Invitation was cancelled
  )),
  
  -- Access control
  can_invite_others BOOLEAN DEFAULT false,
  can_edit_data BOOLEAN DEFAULT true,
  can_delete_data BOOLEAN DEFAULT false,
  can_export_data BOOLEAN DEFAULT true,
  can_start_collaboration BOOLEAN DEFAULT true, -- Video/chat access
  
  -- Metadata
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  access_expires_at TIMESTAMPTZ, -- Optional: time-limited access for contractors
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate memberships
  UNIQUE(project_id, user_id)
);

-- Indexes for project_members
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_role ON project_members(role);
CREATE INDEX idx_project_members_status ON project_members(invitation_status);

COMMENT ON TABLE project_members IS 'Invite-only project membership with role-based access control';

-- ==========================================
-- 2. PENDING INVITATIONS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS project_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES exploration_projects(id) ON DELETE CASCADE,
  
  -- Invitee identification (before they have user account)
  invitee_email VARCHAR(255) NOT NULL,
  invitee_name VARCHAR(255),
  
  -- Invitation details
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
  invited_by UUID NOT NULL, -- User who sent invite
  invitation_message TEXT,
  invitation_token VARCHAR(255) UNIQUE NOT NULL, -- Secure token for accepting invite
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'), -- Invites expire after 7 days
  
  -- Response tracking
  accepted_at TIMESTAMPTZ,
  accepted_by_user_id UUID, -- Gets populated when user accepts
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for project_invitations
CREATE INDEX idx_project_invitations_project_id ON project_invitations(project_id);
CREATE INDEX idx_project_invitations_email ON project_invitations(invitee_email);
CREATE INDEX idx_project_invitations_token ON project_invitations(invitation_token);
CREATE INDEX idx_project_invitations_status ON project_invitations(status);
CREATE INDEX idx_project_invitations_expires_at ON project_invitations(expires_at);

COMMENT ON TABLE project_invitations IS 'Pending invitations for users to join projects';

-- ==========================================
-- 3. COLLABORATION SESSIONS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES exploration_projects(id) ON DELETE CASCADE,
  
  -- Session identification
  session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('video', 'chat', 'screen_share', 'cursor_control')),
  daily_room_url VARCHAR(500), -- Daily.co room URL
  ably_channel_name VARCHAR(255), -- Ably channel name
  
  -- Session details
  session_title VARCHAR(255),
  session_context TEXT, -- e.g., "Core Logging • Drill Hole DDH-001"
  started_by UUID NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  -- Participants (array of user IDs who joined)
  participants UUID[] DEFAULT '{}',
  max_participants INTEGER DEFAULT 50,
  
  -- Recording (for compliance)
  is_recorded BOOLEAN DEFAULT false,
  recording_url VARCHAR(500),
  recording_duration_seconds INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for collaboration_sessions
CREATE INDEX idx_collaboration_sessions_project_id ON collaboration_sessions(project_id);
CREATE INDEX idx_collaboration_sessions_started_by ON collaboration_sessions(started_by);
CREATE INDEX idx_collaboration_sessions_status ON collaboration_sessions(status);
CREATE INDEX idx_collaboration_sessions_started_at ON collaboration_sessions(started_at);

COMMENT ON TABLE collaboration_sessions IS 'Tracks video calls, chats, and screen sharing sessions';

-- ==========================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all project-related tables
ALTER TABLE exploration_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE drill_holes ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assay_results ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see projects they're members of
CREATE POLICY project_member_access ON exploration_projects
  FOR ALL
  USING (
    id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid() 
      AND invitation_status = 'accepted'
    )
  );

-- RLS Policy: Users can only see drill holes from their projects
CREATE POLICY drill_hole_member_access ON drill_holes
  FOR ALL
  USING (
    project_id IN (
      SELECT project_id 
      FROM project_members 
      WHERE user_id = auth.uid() 
      AND invitation_status = 'accepted'
    )
  );

-- RLS Policy: Users can only see core logs from their projects
CREATE POLICY core_log_member_access ON core_logs
  FOR ALL
  USING (
    drill_hole_id IN (
      SELECT dh.id 
      FROM drill_holes dh
      JOIN project_members pm ON dh.project_id = pm.project_id
      WHERE pm.user_id = auth.uid() 
      AND pm.invitation_status = 'accepted'
    )
  );

-- RLS Policy: Users can only see assay results from their projects
CREATE POLICY assay_member_access ON assay_results
  FOR ALL
  USING (
    sample_id IN (
      SELECT cl.id 
      FROM core_logs cl
      JOIN drill_holes dh ON cl.drill_hole_id = dh.id
      JOIN project_members pm ON dh.project_id = pm.project_id
      WHERE pm.user_id = auth.uid() 
      AND pm.invitation_status = 'accepted'
    )
  );

-- ==========================================
-- 5. HELPER FUNCTIONS
-- ==========================================

-- Function: Check if user has access to project
CREATE OR REPLACE FUNCTION has_project_access(
  p_user_id UUID,
  p_project_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM project_members
    WHERE user_id = p_user_id
    AND project_id = p_project_id
    AND invitation_status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user has specific role in project
CREATE OR REPLACE FUNCTION has_project_role(
  p_user_id UUID,
  p_project_id UUID,
  p_required_role VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM project_members
    WHERE user_id = p_user_id
    AND project_id = p_project_id
    AND invitation_status = 'accepted'
    AND (
      role = p_required_role
      OR role IN ('owner', 'admin') -- Owners/admins have all permissions
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Auto-add project creator as owner
CREATE OR REPLACE FUNCTION auto_add_project_creator()
RETURNS TRIGGER AS $$
BEGIN
  -- Add creator as project owner
  INSERT INTO project_members (
    project_id,
    user_id,
    role,
    invited_by,
    invitation_status,
    can_invite_others,
    can_edit_data,
    can_delete_data,
    can_export_data
  ) VALUES (
    NEW.id,
    NEW.created_by,
    'owner',
    NEW.created_by,
    'accepted',
    true,
    true,
    true,
    true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-add creator when project is created
CREATE TRIGGER trigger_auto_add_project_creator
  AFTER INSERT ON exploration_projects
  FOR EACH ROW
  WHEN (NEW.created_by IS NOT NULL)
  EXECUTE FUNCTION auto_add_project_creator();

-- Function: Update last_active_at when user accesses project
CREATE OR REPLACE FUNCTION update_member_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE project_members
  SET last_active_at = NOW()
  WHERE project_id = NEW.project_id
  AND user_id = auth.uid();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 6. VIEWS FOR EASY ACCESS
-- ==========================================

-- View: Project members with user details
CREATE OR REPLACE VIEW v_project_members_extended AS
SELECT 
  pm.id,
  pm.project_id,
  ep.project_name,
  pm.user_id,
  pm.role,
  pm.invitation_status,
  pm.can_invite_others,
  pm.can_edit_data,
  pm.can_delete_data,
  pm.can_start_collaboration,
  pm.joined_at,
  pm.last_active_at,
  pm.access_expires_at,
  pm.invited_by,
  pm.invited_at
FROM project_members pm
JOIN exploration_projects ep ON pm.project_id = ep.id
WHERE pm.invitation_status = 'accepted';

COMMENT ON VIEW v_project_members_extended IS 'Project members with extended details';

-- View: Active collaboration sessions
CREATE OR REPLACE VIEW v_active_collaboration_sessions AS
SELECT 
  cs.id,
  cs.project_id,
  ep.project_name,
  cs.session_type,
  cs.session_title,
  cs.session_context,
  cs.started_by,
  cs.started_at,
  cs.participants,
  ARRAY_LENGTH(cs.participants, 1) AS participant_count,
  cs.daily_room_url,
  cs.ably_channel_name,
  cs.is_recorded
FROM collaboration_sessions cs
JOIN exploration_projects ep ON cs.project_id = ep.id
WHERE cs.status = 'active'
ORDER BY cs.started_at DESC;

COMMENT ON VIEW v_active_collaboration_sessions IS 'Currently active video/chat sessions';

-- View: Pending invitations that haven't expired
CREATE OR REPLACE VIEW v_pending_invitations AS
SELECT 
  pi.id,
  pi.project_id,
  ep.project_name,
  pi.invitee_email,
  pi.invitee_name,
  pi.role,
  pi.invited_by,
  pi.invitation_message,
  pi.expires_at,
  EXTRACT(DAYS FROM (pi.expires_at - NOW())) AS days_until_expiry,
  pi.created_at
FROM project_invitations pi
JOIN exploration_projects ep ON pi.project_id = ep.id
WHERE pi.status = 'pending'
AND pi.expires_at > NOW()
ORDER BY pi.expires_at ASC;

COMMENT ON VIEW v_pending_invitations IS 'Active invitations that haven\'t expired';

-- ==========================================
-- 7. SEED DATA: Add existing project members
-- ==========================================

-- Note: This will be populated by the application when users are created
-- For now, we'll add a placeholder for the Dome Mountain project

-- This assumes the Dome Mountain project exists and has a created_by user
-- The trigger will automatically add them as owner

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================

-- Summary of changes:
-- ✅ project_members table (invite-only groups)
-- ✅ project_invitations table (pending invites)
-- ✅ collaboration_sessions table (video/chat tracking)
-- ✅ RLS policies on all project tables
-- ✅ Helper functions for access control
-- ✅ Auto-add project creator as owner
-- ✅ Views for easy querying
-- ✅ Indexes for performance

SELECT 'Migration 011: Project Access Control - COMPLETE' AS status;

