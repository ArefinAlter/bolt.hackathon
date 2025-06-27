'use client';

import { useState } from 'react';
import { 
  Mic, 
  Video, 
  Star, 
  Clock, 
  Play, 
  Settings, 
  MoreVertical,
  Trash2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Persona } from '@/types/persona';
import { setDefaultPersona, deletePersona } from '@/lib/persona';
import { format } from 'date-fns';

interface PersonaCardProps {
  persona: Persona;
  onTest: () => void;
  onRefresh: () => void;
}

export function PersonaCard({ persona, onTest, onRefresh }: PersonaCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetDefault = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await setDefaultPersona(persona.id, persona.business_id, persona.provider);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Error setting default persona:', err);
    } finally {
      setIsLoading(false);
      setIsMenuOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this persona? This action cannot be undone.')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await deletePersona(persona.id);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Error deleting persona:', err);
    } finally {
      setIsLoading(false);
      setIsMenuOpen(false);
    }
  };

  const isVoicePersona = persona.provider === 'elevenlabs';
  const personaName = isVoicePersona 
    ? persona.config_data.persona_name 
    : (persona as any).config_data.persona_name;
  
  const isDefault = isVoicePersona 
    ? persona.config_data.is_default 
    : (persona as any).config_data.is_default;
  
  const status = isVoicePersona 
    ? 'ready' 
    : (persona as any).config_data.status || 'ready';

  return (
    <Card className={`border-0 shadow-md hover:shadow-lg transition-all ${isDefault ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isVoicePersona ? 'bg-green-50' : 'bg-purple-50'
            }`}>
              {isVoicePersona ? (
                <Mic className="h-5 w-5 text-green-600" />
              ) : (
                <Video className="h-5 w-5 text-purple-600" />
              )}
            </div>
            <div className="ml-3">
              <CardTitle className="text-lg">{personaName}</CardTitle>
              <CardDescription>
                {isVoicePersona ? 'Voice Persona' : 'Video Persona'}
              </CardDescription>
            </div>
          </div>
          
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
            
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                <div className="py-1">
                  <button
                    onClick={handleSetDefault}
                    disabled={isDefault || isLoading}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Star className="h-4 w-4 mr-3 text-yellow-500" />
                    Set as Default
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4 mr-3" />
                    Delete Persona
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {isDefault && (
          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            <Star className="w-3 h-3 mr-1" />
            Default
          </div>
        )}
        
        {status === 'training' && (
          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1 animate-spin" />
            Training
          </div>
        )}
        
        {status === 'failed' && (
          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Failed
          </div>
        )}
        
        {status === 'ready' && !isDefault && (
          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ready
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Created</span>
            <span className="text-gray-700">{format(new Date(persona.created_at), 'MMM d, yyyy')}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Usage Count</span>
            <span className="text-gray-700">{persona.usage_count || 0}</span>
          </div>
          
          {persona.last_used_at && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Last Used</span>
              <span className="text-gray-700">{format(new Date(persona.last_used_at), 'MMM d, yyyy')}</span>
            </div>
          )}
          
          {!isVoicePersona && (persona as any).config_data.training_estimated_time && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Training Time</span>
              <span className="text-gray-700">{(persona as any).config_data.training_estimated_time}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-black"
          onClick={onTest}
        >
          <Play className="mr-2 h-4 w-4" />
          Test Persona
        </Button>
      </CardFooter>
    </Card>
  );
}