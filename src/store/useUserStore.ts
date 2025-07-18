import { create } from 'zustand';
import { UserPreferences, UserProfile } from '@/types/user';
import { getUserPreferences, updateUserPreferences } from '@/lib/preferences';
import { supabase } from '@/lib/supabase';
import { createProfileIfMissing } from '@/lib/auth';

interface UserState {
  user: {
    id: string;
    email: string | undefined;
  } | null;
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadUser: () => Promise<void>;
  updatePreferences: (preferences: UserPreferences) => Promise<void>;
  signOut: () => Promise<void>;
  switchRole: (role: 'business' | 'customer') => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  profile: null,
  preferences: null,
  isLoading: true,
  error: null,
  
  loadUser: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        set({ user: null, profile: null, preferences: null, isLoading: false });
        return;
      }
      
      // Get user profile with fallback creation
      let profile: UserProfile | null = null;
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          // Profile doesn't exist, create it
          console.log('Profile not found, creating...');
          const createdProfile = await createProfileIfMissing(
            session.user.id, 
            session.user.user_metadata?.business_name
          );
          
          // Fetch the created profile
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          profile = newProfile;
        } else {
          profile = profileData;
        }
      } catch (error) {
        console.error('Error handling profile:', error);
        set({ 
          error: 'Failed to load user profile', 
          isLoading: false 
        });
        return;
      }
      
      // Get user preferences
      let preferences = null;
      try {
        preferences = await getUserPreferences(session.user.id);
      } catch (error) {
        console.error('Error loading preferences:', error);
        // Don't fail the entire load for preferences
      }
      
      set({
        user: {
          id: session.user.id,
          email: session.user.email
        },
        profile,
        preferences,
        isLoading: false
      });
    } catch (error: unknown) {
      console.error('Error loading user:', error);
      set({ 
        error: 'Failed to load user data', 
        isLoading: false 
      });
    }
  },
  
  updatePreferences: async (preferences: UserPreferences) => {
    const { user } = get();
    
    if (!user) {
      set({ error: 'User not authenticated' });
      return;
    }
    
    try {
      await updateUserPreferences(user.id, preferences);
      set({ preferences });
    } catch (error: unknown) {
      console.error('Error updating preferences:', error);
      set({ error: 'Failed to update preferences' });
    }
  },
  
  signOut: async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('userRole');
      set({ user: null, profile: null, preferences: null });
    } catch (error: unknown) {
      console.error('Error signing out:', error);
      set({ error: 'Failed to sign out' });
    }
  },
  
  switchRole: (role: 'business' | 'customer') => {
    localStorage.setItem('userRole', role);
  }
}));