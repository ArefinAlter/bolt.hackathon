'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mic, 
  Video, 
  Plus, 
  RefreshCw, 
  Star, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  BarChart3,
  Headphones,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid, GridItem, Flex } from '@/components/ui/grid';
import { VoicePersonaCreator } from '@/components/dashboard/personas/VoicePersonaCreator';
import { VideoPersonaCreator } from '@/components/dashboard/personas/VideoPersonaCreator';
import { PersonaCard } from '@/components/dashboard/personas/PersonaCard';
import { PersonaTestPanel } from '@/components/dashboard/personas/PersonaTestPanel';
import { Persona } from '@/types/persona';
import { fetchPersonas } from '@/lib/persona';
import { supabase } from '@/lib/supabase';

export default function PersonasPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('voice');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [voicePersonas, setVoicePersonas] = useState<Persona[]>([]);
  const [videoPersonas, setVideoPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isTestingPersona, setIsTestingPersona] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Check if user has selected a role
        const userRole = localStorage.getItem('userRole');
        
        if (!userRole) {
          router.push('/dashboard/role-selection');
          return;
        } else if (userRole !== 'business') {
          router.push('/return');
          return;
        }
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/login');
          return;
        }
        
        // Get user profile to get business_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('business_id')
          .eq('id', session.user.id)
          .single();
        
        if (!profile) {
          console.error('Profile not found');
          setError('Unable to load profile data');
          setIsLoading(false);
          return;
        }
        
        setBusinessId(profile.business_id);
        
        // Load personas
        await loadPersonas(profile.business_id);
      } catch (error) {
        console.error('Error loading user data:', error);
        setError('An error occurred while loading data');
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [router]);

  const loadPersonas = async (businessId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { voice_personas, video_personas } = await fetchPersonas(businessId);
      setVoicePersonas(voice_personas);
      setVideoPersonas(video_personas);
    } catch (error) {
      console.error('Error loading personas:', error);
      setError('Failed to load personas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (businessId) {
      loadPersonas(businessId);
    }
  };

  const handleCreateSuccess = () => {
    setIsCreating(false);
    if (businessId) {
      loadPersonas(businessId);
    }
  };

  const handleSelectPersona = (persona: Persona) => {
    setSelectedPersona(persona);
    setIsTestingPersona(true);
  };

  const handleCloseTest = () => {
    setIsTestingPersona(false);
    setSelectedPersona(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div></div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isLoading}
            size="sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90 text-black"
            onClick={() => setIsCreating(true)}
            disabled={isCreating}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Persona
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
      
      {isCreating ? (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Create New Persona</CardTitle>
            <CardDescription>
              Create a new voice or video persona for customer interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="voice" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="voice" className="flex items-center">
                  <Mic className="mr-2 h-4 w-4" />
                  Voice Persona
                </TabsTrigger>
                <TabsTrigger value="video" className="flex items-center">
                  <Video className="mr-2 h-4 w-4" />
                  Video Persona
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="voice">
                <VoicePersonaCreator 
                  businessId={businessId || ''}
                  onSuccess={handleCreateSuccess}
                  onCancel={() => setIsCreating(false)}
                />
              </TabsContent>
              
              <TabsContent value="video">
                <VideoPersonaCreator 
                  businessId={businessId || ''}
                  onSuccess={handleCreateSuccess}
                  onCancel={() => setIsCreating(false)}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : isTestingPersona && selectedPersona ? (
        <PersonaTestPanel 
          persona={selectedPersona}
          onClose={handleCloseTest}
        />
      ) : (
        <Tabs defaultValue="voice" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="voice" className="flex items-center">
              <Headphones className="mr-2 h-4 w-4" />
              Voice Personas
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center">
              <Video className="mr-2 h-4 w-4" />
              Video Personas
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="voice">
            {voicePersonas.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {voicePersonas.map((persona) => (
                  <PersonaCard 
                    key={persona.id}
                    persona={persona}
                    onTest={() => handleSelectPersona(persona)}
                    onRefresh={handleRefresh}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-md">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Mic className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Voice Personas Yet</h3>
                  <p className="text-gray-500 text-center max-w-md mb-6">
                    Create your first voice persona to enhance your customer interactions with natural-sounding AI voices.
                  </p>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-black"
                    onClick={() => {
                      setActiveTab('voice');
                      setIsCreating(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Voice Persona
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="video">
            {videoPersonas.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videoPersonas.map((persona) => (
                  <PersonaCard 
                    key={persona.id}
                    persona={persona}
                    onTest={() => handleSelectPersona(persona)}
                    onRefresh={handleRefresh}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-md">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Video className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Video Personas Yet</h3>
                  <p className="text-gray-500 text-center max-w-md mb-6">
                    Create your first video persona to provide face-to-face AI interactions with your customers.
                  </p>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-black"
                    onClick={() => {
                      setActiveTab('video');
                      setIsCreating(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Video Persona
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {/* Persona Usage Analytics */}
      {(voicePersonas.length > 0 || videoPersonas.length > 0) && !isCreating && !isTestingPersona && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Persona Usage Analytics
            </CardTitle>
            <CardDescription>
              Performance metrics for your AI personas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Personas</p>
                    <p className="text-2xl font-bold">{voicePersonas.length + videoPersonas.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <Settings className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Voice Personas</p>
                    <p className="text-2xl font-bold">{voicePersonas.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                    <Headphones className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Video Personas</p>
                    <p className="text-2xl font-bold">{videoPersonas.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
                    <Video className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Usage chart would go here in a real implementation */}
                          <div className="mt-6 h-64 bg-white border rounded-lg flex items-center justify-center shadow-sm">
              <p className="text-gray-500">Persona usage analytics will appear here as you use your personas</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}