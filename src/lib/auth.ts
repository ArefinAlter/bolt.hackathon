import { supabase } from './supabase';
import { AuthFormData, SignUpFormData } from '@/types/auth';

export async function signIn({ email, password }: AuthFormData) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signUp({ email, password, business_name }: SignUpFormData) {
  // First create the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    throw authError;
  }

  if (!authData.user) {
    throw new Error('User creation failed');
  }

  // Then create the profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([
      {
        id: authData.user.id,
        business_name: business_name || email.split('@')[0],
        subscription_plan: 'free',
        onboarded: false,
      },
    ]);

  if (profileError) {
    // If profile creation fails, we should ideally delete the user
    // but Supabase doesn't expose a direct API for this
    throw profileError;
  }

  return authData;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    throw error;
  }
  
  return data.session;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  
  if (error) {
    throw error;
  }
  
  return true;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({
    password,
  });
  
  if (error) {
    throw error;
  }
  
  return true;
}