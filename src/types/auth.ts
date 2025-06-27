export interface AuthFormData {
  email: string;
  password: string;
}

export interface SignUpFormData extends AuthFormData {
  business_name?: string;
  confirm_password: string;
}

export interface UserProfile {
  id: string;
  business_name: string;
  website?: string;
  subscription_plan: string;
  onboarded: boolean;
  business_id: string;
}

export interface UserSession {
  user: {
    id: string;
    email: string;
  } | null;
  profile?: UserProfile;
  isLoading: boolean;
  error: Error | null;
}

export type UserRole = 'business' | 'customer';