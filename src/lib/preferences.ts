import { supabase } from './supabase';
import { UserPreferences } from '@/types/user';

// Get user preferences
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    // Call the get-user-preferences function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-user-preferences?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user preferences');
    }
    
    const data = await response.json();
    return data.preferences;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }
}

// Update user preferences
export async function updateUserPreferences(userId: string, preferences: UserPreferences, demoMode = false): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-user-preferences`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ preferences, demo_mode: demoMode })
    });

    const result = await response.json();
    if (!response.ok || result.error) {
      throw new Error(result.error || 'Failed to update preferences');
    }
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
}

// Apply user preferences to the application
export function applyUserPreferences(preferences: UserPreferences): void {
  // Apply theme
  if (preferences.theme) {
    document.documentElement.classList.toggle('dark', preferences.theme === 'dark');
  }
  
  // Apply accessibility settings
  if (preferences.accessibility) {
    // High contrast
    document.documentElement.classList.toggle('high-contrast', preferences.accessibility.high_contrast || false);
    
    // Large text
    document.documentElement.classList.toggle('large-text', preferences.accessibility.large_text || false);
    
    // Screen reader optimization
    document.documentElement.classList.toggle('screen-reader', preferences.accessibility.screen_reader_optimized || false);
  }
}