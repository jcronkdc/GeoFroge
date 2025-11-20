import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * GEOFORGE AUTH HOOK
 * 
 * Adapted from FieldForge for geological exploration platform
 * Supports geological user roles: Field Geologist, Senior Geologist, Exploration Manager, etc.
 * 
 * TODO: Wire to Supabase Auth when database is ready
 * For now, provides mock authentication structure
 */

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    [key: string]: any;
  };
}

interface Session {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  job_title?: string; // 'Field Geologist', 'Senior Geologist', 'Exploration Manager', etc.
  company_id?: string;
  role?: string;
  is_admin?: boolean;
  employee_id?: string;
  // Geological-specific fields
  license_number?: string; // Professional Geoscience license
  specialization?: string; // 'hard rock', 'sedimentary', 'geochemistry', 'geophysics'
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const INITIAL_STATE: AuthState = {
  user: null,
  session: null,
  profile: null,
  loading: false, // Set to false for mock data
  error: null,
  isAuthenticated: false,
  isAdmin: false,
};

/**
 * Manage authentication state for GeoForge
 * Currently using mock data - will connect to Supabase when database ready
 */
export function useAuth(): AuthState & {
  signIn(email: string, password: string): Promise<any>;
  signUp(email: string, password: string, userData: any): Promise<any>;
  signOut(): Promise<void>;
  updateProfile(updates: Partial<UserProfile>): Promise<UserProfile>;
  refreshSession(): Promise<Session | null>;
  checkSession(): Promise<void>;
} {
  const [authState, setAuthState] = useState<AuthState>({
    ...INITIAL_STATE,
    // Mock logged-in user for development
    user: {
      id: 'mock-user-1',
      email: 'geologist@geoforge.com',
      user_metadata: {
        full_name: 'Alex Geologist',
        first_name: 'Alex',
        last_name: 'Geologist'
      }
    },
    session: {
      user: {
        id: 'mock-user-1',
        email: 'geologist@geoforge.com',
        user_metadata: {
          full_name: 'Alex Geologist',
          first_name: 'Alex',
          last_name: 'Geologist'
        }
      },
      access_token: 'mock-token',
      refresh_token: 'mock-refresh'
    },
    profile: {
      id: 'mock-user-1',
      email: 'geologist@geoforge.com',
      first_name: 'Alex',
      last_name: 'Geologist',
      job_title: 'Senior Geologist',
      role: 'geologist',
      is_admin: true,
      license_number: 'P.Geo. 12345',
      specialization: 'hard rock'
    },
    isAuthenticated: true,
    isAdmin: true
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const updateAuthState = useCallback(
    (updater: AuthState | ((prev: AuthState) => AuthState)) => {
      if (!mountedRef.current) return;
      setAuthState((prev) => 
        typeof updater === 'function' ? updater(prev) : updater
      );
    },
    []
  );

  const checkSession = useCallback(async (): Promise<void> => {
    // Mock - in production, check Supabase session
    console.log('[GeoForge Auth] Mock session check - user authenticated');
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<any> => {
      // Mock sign-in - always succeeds for development
      console.log('[GeoForge Auth] Mock sign-in:', email);
      return {
        user: authState.user,
        session: authState.session
      };
    },
    [authState]
  );

  const signUp = useCallback(
    async (email: string, password: string, userData: any): Promise<any> => {
      // Mock sign-up
      console.log('[GeoForge Auth] Mock sign-up:', email);
      return {
        user: authState.user,
        session: authState.session
      };
    },
    [authState]
  );

  const signOut = useCallback(async (): Promise<void> => {
    console.log('[GeoForge Auth] Mock sign-out');
    updateAuthState(INITIAL_STATE);
  }, [updateAuthState]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>): Promise<UserProfile> => {
      console.log('[GeoForge Auth] Mock profile update:', updates);
      const updatedProfile = { ...authState.profile, ...updates } as UserProfile;
      updateAuthState((prev) => ({
        ...prev,
        profile: updatedProfile
      }));
      return updatedProfile;
    },
    [authState.profile, updateAuthState]
  );

  const refreshSession = useCallback(async (): Promise<Session | null> => {
    console.log('[GeoForge Auth] Mock session refresh');
    return authState.session;
  }, [authState.session]);

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshSession,
    checkSession,
  };
}

