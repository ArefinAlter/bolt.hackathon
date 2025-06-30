'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Settings, 
  User, 
  Bell, 
  Moon, 
  Sun, 
  Globe, 
  Volume2, 
  Video, 
  Shield, 
  Save,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Grid, GridItem, Flex, Container } from '@/components/ui/grid';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from 'next-themes';
import { getUserPreferences, updateUserPreferences } from '@/lib/preferences';
import { supabase } from '@/lib/supabase';
import { UserPreferences } from '@/types/user';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences>({
    language: 'en',
    theme: 'light',
    notifications_enabled: true,
    auto_escalate: false,
    voice_enabled: true,
    video_enabled: true,
    auto_transcript: true,
    call_history_enabled: true,
    preferred_chat_mode: 'normal',
    accessibility: {
      high_contrast: false,
      large_text: false,
      screen_reader_optimized: false
    },
    keyboard_shortcuts_enabled: true,
    data_saving_mode: false
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/login');
          return;
        }
        
        setUserId(session.user.id);
        
        // Load user preferences
        const userPreferences = await getUserPreferences(session.user.id);
        if (userPreferences) {
          setPreferences(userPreferences);
          
          // Set theme based on preferences
          if (userPreferences.theme) {
            setTheme(userPreferences.theme);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        setError('An error occurred while loading your preferences');
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [router, setTheme]);

  const handleSavePreferences = async () => {
    if (!userId) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      await updateUserPreferences(userId, preferences, isDemoMode);
      
      // Update theme if changed
      if (preferences.theme !== theme) {
        setTheme(preferences.theme);
      }
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      setError(error?.message || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/main_logo.svg"
                alt="Dokani"
                width={240}
                height={64}
                className="h-16 w-auto"
              />
            </Link>
            <div className="text-sm text-gray-500">
              Settings
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-500">
                Manage your account settings and preferences
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch checked={isDemoMode} onCheckedChange={setIsDemoMode} />
                <Badge variant={isDemoMode ? 'default' : 'secondary'}>{isDemoMode ? 'Demo' : 'Live'}</Badge>
              </div>
              <Button 
                className="bg-primary hover:bg-primary/90 text-black"
                onClick={handleSavePreferences}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <Tabs defaultValue="general">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
              <TabsTrigger value="general" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center">
                <Moon className="mr-2 h-4 w-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="accessibility" className="flex items-center">
                <Globe className="mr-2 h-4 w-4" />
                Accessibility
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="general">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      Profile Settings
                    </CardTitle>
                    <CardDescription>
                      Manage your personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select 
                        value={preferences.language} 
                        onValueChange={(value) => setPreferences({...preferences, language: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="chat-mode">Preferred Chat Mode</Label>
                      <Select 
                        value={preferences.preferred_chat_mode} 
                        onValueChange={(value) => setPreferences({
                          ...preferences,
                          preferred_chat_mode: value as 'normal' | 'messenger' | 'whatsapp' | 'shopify' | 'woocommerce'
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select chat mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="messenger">Messenger</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="shopify">Shopify</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Data Saving Mode</Label>
                        <p className="text-sm text-gray-500">
                          Reduce data usage for calls and media
                        </p>
                      </div>
                      <Switch 
                        checked={preferences.data_saving_mode}
                        onCheckedChange={(checked) => setPreferences({...preferences, data_saving_mode: checked})}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Keyboard Shortcuts</Label>
                        <p className="text-sm text-gray-500">
                          Enable keyboard shortcuts for faster navigation
                        </p>
                      </div>
                      <Switch 
                        checked={preferences.keyboard_shortcuts_enabled}
                        onCheckedChange={(checked) => setPreferences({...preferences, keyboard_shortcuts_enabled: checked})}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="mr-2 h-5 w-5" />
                      Privacy & Security
                    </CardTitle>
                    <CardDescription>
                      Manage your privacy and security settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Call History</Label>
                        <p className="text-sm text-gray-500">
                          Save history of voice and video calls
                        </p>
                      </div>
                      <Switch 
                        checked={preferences.call_history_enabled}
                        onCheckedChange={(checked) => setPreferences({...preferences, call_history_enabled: checked})}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto Transcription</Label>
                        <p className="text-sm text-gray-500">
                          Automatically transcribe voice conversations
                        </p>
                      </div>
                      <Switch 
                        checked={preferences.auto_transcript}
                        onCheckedChange={(checked) => setPreferences({...preferences, auto_transcript: checked})}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto Escalation</Label>
                        <p className="text-sm text-gray-500">
                          Automatically escalate complex issues to human agents
                        </p>
                      </div>
                      <Switch 
                        checked={preferences.auto_escalate}
                        onCheckedChange={(checked) => setPreferences({...preferences, auto_escalate: checked})}
                      />
                    </div>
                    
                    <div className="pt-4">
                      <Button variant="outline" className="w-full">
                        Change Password
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="mr-2 h-5 w-5" />
                    Notification Settings
                  </CardTitle>
                  <CardDescription>
                    Manage how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Notifications</Label>
                      <p className="text-sm text-gray-500">
                        Receive notifications about your return requests
                      </p>
                    </div>
                    <Switch 
                      checked={preferences.notifications_enabled}
                      onCheckedChange={(checked) => setPreferences({...preferences, notifications_enabled: checked})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Notification Methods</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="email-notifications" 
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          checked={true}
                          disabled
                        />
                        <Label htmlFor="email-notifications">Email</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="browser-notifications" 
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          checked={preferences.notifications_enabled}
                          onChange={(e) => setPreferences({...preferences, notifications_enabled: e.target.checked})}
                        />
                        <Label htmlFor="browser-notifications">Browser</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="mobile-notifications" 
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          disabled
                        />
                        <Label htmlFor="mobile-notifications">Mobile (Coming Soon)</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Notification Types</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="status-notifications" 
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          checked={true}
                          disabled
                        />
                        <Label htmlFor="status-notifications">Status Changes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="message-notifications" 
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          checked={true}
                          disabled
                        />
                        <Label htmlFor="message-notifications">New Messages</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id="call-notifications" 
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          checked={true}
                          disabled
                        />
                        <Label htmlFor="call-notifications">Call Notifications</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="appearance">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Moon className="mr-2 h-5 w-5" />
                    Appearance Settings
                  </CardTitle>
                  <CardDescription>
                    Customize the look and feel of the application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div 
                        className={`border rounded-lg p-4 cursor-pointer ${
                          preferences.theme === 'light' ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setPreferences({...preferences, theme: 'light'})}
                      >
                        <div className="w-full h-24 bg-white border rounded-md mb-2"></div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Light</span>
                          <Sun className="h-4 w-4" />
                        </div>
                      </div>
                      
                      <div 
                        className={`border rounded-lg p-4 cursor-pointer ${
                          preferences.theme === 'dark' ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setPreferences({...preferences, theme: 'dark'})}
                      >
                        <div className="w-full h-24 bg-gray-900 border rounded-md mb-2"></div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Dark</span>
                          <Moon className="h-4 w-4" />
                        </div>
                      </div>
                      
                      <div 
                        className={`border rounded-lg p-4 cursor-pointer ${
                          preferences.theme === 'system' ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setPreferences({...preferences, theme: 'system'})}
                      >
                        <div className="w-full h-24 bg-gradient-to-r from-white to-gray-900 border rounded-md mb-2"></div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">System</span>
                          <Settings className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Font Size</Label>
                    <Select 
                      value={preferences.accessibility?.large_text ? 'large' : 'normal'} 
                      onValueChange={(value) => setPreferences({
                        ...preferences, 
                        accessibility: {
                          ...preferences.accessibility,
                          large_text: value === 'large'
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select font size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Density</Label>
                    <Select defaultValue="comfortable">
                      <SelectTrigger>
                        <SelectValue placeholder="Select density" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="comfortable">Comfortable</SelectItem>
                        <SelectItem value="spacious">Spacious</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="accessibility">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="mr-2 h-5 w-5" />
                    Accessibility Settings
                  </CardTitle>
                  <CardDescription>
                    Customize accessibility options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>High Contrast Mode</Label>
                      <p className="text-sm text-gray-500">
                        Increase contrast for better visibility
                      </p>
                    </div>
                    <Switch 
                      checked={preferences.accessibility?.high_contrast || false}
                      onCheckedChange={(checked) => setPreferences({
                        ...preferences, 
                        accessibility: {
                          ...preferences.accessibility,
                          high_contrast: checked
                        }
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Large Text</Label>
                      <p className="text-sm text-gray-500">
                        Increase text size throughout the application
                      </p>
                    </div>
                    <Switch 
                      checked={preferences.accessibility?.large_text || false}
                      onCheckedChange={(checked) => setPreferences({
                        ...preferences, 
                        accessibility: {
                          ...preferences.accessibility,
                          large_text: checked
                        }
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Screen Reader Optimization</Label>
                      <p className="text-sm text-gray-500">
                        Optimize for screen readers and assistive technologies
                      </p>
                    </div>
                    <Switch 
                      checked={preferences.accessibility?.screen_reader_optimized || false}
                      onCheckedChange={(checked) => setPreferences({
                        ...preferences, 
                        accessibility: {
                          ...preferences.accessibility,
                          screen_reader_optimized: checked
                        }
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2 pt-4">
                    <Label>Voice & Video Settings</Label>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Enable Voice Calls</Label>
                          <p className="text-sm text-gray-500">
                            Allow voice calls with AI assistant
                          </p>
                        </div>
                        <Switch 
                          checked={preferences.voice_enabled}
                          onCheckedChange={(checked) => setPreferences({...preferences, voice_enabled: checked})}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Enable Video Calls</Label>
                          <p className="text-sm text-gray-500">
                            Allow video calls with AI assistant
                          </p>
                        </div>
                        <Switch 
                          checked={preferences.video_enabled}
                          onCheckedChange={(checked) => setPreferences({...preferences, video_enabled: checked})}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}