'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Building2, 
  User, 
  BarChart3, 
  FileText, 
  Shield, 
  Users,
  MessageSquare,
  Phone,
  Video,
  Package
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';
import { supabase } from '@/lib/supabase';
import { createProfileIfMissing } from '@/lib/auth';

export function RoleSelectionPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Role selection page - Session:', session);
        
        if (!session) {
          console.log('No session found, redirecting to login');
          router.push('/auth/login');
          return;
        }
        
        setUser(session.user);
        
        // Verify profile exists and create if missing
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            console.log('Profile not found, creating...');
            // Create profile if missing
            await createProfileIfMissing(
              session.user.id,
              session.user.user_metadata?.business_name
            );
            
            // Fetch the created profile
            const { data: newProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            setProfile(newProfile);
          } else {
            setProfile(profileData);
          }
        } catch (error) {
          console.error('Error handling profile:', error);
          // Continue anyway, profile creation is not critical for role selection
        }
        
        setIsPageLoading(false);
      } catch (error) {
        console.error('Error checking auth in role selection:', error);
        router.push('/auth/login');
      }
    };
    
    checkAuth();
  }, [router]);

  const handleRoleSelection = async (role: UserRole) => {
    setSelectedRole(role);
    setIsLoading(true);
    
    try {
      console.log('Setting role:', role);
      // Store the selected role in localStorage for persistence
      localStorage.setItem('userRole', role);
      
      // Redirect based on role
      if (role === 'business') {
        console.log('Redirecting to business dashboard');
        router.push('/dashboard');
      } else {
        console.log('Redirecting to customer portal');
        router.push('/return');
      }
    } catch (error) {
      console.error('Error setting user role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-black">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="py-6 px-4 sm:px-6 lg:px-8 border-b bg-white">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Image
              src="/main_logo.svg"
              alt="Dokani"
              width={180}
              height={48}
              className="h-12 w-auto"
            />
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <span className="text-sm text-gray-600">
                Welcome, {user.email}
                {profile && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({profile.business_name})
                  </span>
                )}
              </span>
            )}
            <Button 
              variant="ghost" 
              className="text-sm text-black"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">Choose Your Experience</h1>
            <p className="text-black max-w-2xl mx-auto">
              Select how you'd like to experience the Dokani platform. You can switch between views at any time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Business Card */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-xl ${
                selectedRole === 'business' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleRoleSelection('business')}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Business Dashboard</CardTitle>
                <CardDescription>
                  Manage returns, configure policies, and analyze performance
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-md flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-black">Analytics</h3>
                      <p className="text-xs text-black">Track return metrics and performance</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-50 rounded-md flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-black">Policy Management</h3>
                      <p className="text-xs text-black">Configure return rules and automation</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-50 rounded-md flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-black">Return Monitoring</h3>
                      <p className="text-xs text-black">Review and manage return requests</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-orange-50 rounded-md flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-black">Persona Builder</h3>
                      <p className="text-xs text-black">Create voice and video AI personas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-2 pb-6 flex justify-center">
                <Button 
                  className="bg-primary hover:bg-primary/90 text-black font-medium px-8"
                  onClick={() => handleRoleSelection('business')}
                  disabled={isLoading}
                >
                  {isLoading && selectedRole === 'business' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  ) : null}
                  Access Dashboard
                </Button>
              </CardFooter>
            </Card>
            
            {/* Customer Card */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-xl ${
                selectedRole === 'customer' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleRoleSelection('customer')}
            >
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Customer Portal</CardTitle>
                <CardDescription>
                  Experience AI-powered customer service and return processing
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-md flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-black">AI Chat</h3>
                      <p className="text-xs text-black">Intelligent conversation support</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-50 rounded-md flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-black">Voice Calls</h3>
                      <p className="text-xs text-black">Natural voice interactions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-50 rounded-md flex items-center justify-center flex-shrink-0">
                      <Video className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-black">Video Calls</h3>
                      <p className="text-xs text-black">Face-to-face AI assistance</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-orange-50 rounded-md flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-black">Secure Returns</h3>
                      <p className="text-xs text-black">Safe and efficient processing</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-2 pb-6 flex justify-center">
                <Button 
                  className="bg-primary hover:bg-primary/90 text-black font-medium px-8"
                  onClick={() => handleRoleSelection('customer')}
                  disabled={isLoading}
                >
                  {isLoading && selectedRole === 'customer' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  ) : null}
                  Start Experience
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="text-center mt-8 text-sm text-gray-600">
            <p>
              You can switch between these views at any time from the navigation menu.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 sm:px-6 lg:px-8 border-t bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-black">
            &copy; {new Date().getFullYear()} Dokani. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <Link href="/privacy" className="text-sm text-black hover:text-gray-900">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-black hover:text-gray-900">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}