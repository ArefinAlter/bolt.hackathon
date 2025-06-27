'use client';

import { useState, useRef } from 'react';
import { 
  Mic, 
  Video, 
  Play, 
  X, 
  Loader2, 
  AlertTriangle,
  Volume2,
  Pause,
  Save,
  Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Persona, PersonaTestResult } from '@/types/persona';
import { testPersona } from '@/lib/persona';

interface PersonaTestPanelProps {
  persona: Persona;
  onClose: () => void;
}

export function PersonaTestPanel({ persona, onClose }: PersonaTestPanelProps) {
  const [testContent, setTestContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<PersonaTestResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const isVoicePersona = persona.provider === 'elevenlabs';
  const personaName = isVoicePersona 
    ? persona.config_data.persona_name 
    : (persona as any).config_data.persona_name;

  const handleTest = async () => {
    if (!testContent.trim()) {
      setError('Please enter some content to test');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      const result = await testPersona(
        persona.id, 
        testContent, 
        isVoicePersona ? 'voice' : 'video'
      );
      
      setTestResult(result);
      
      // Auto-play audio if it's a voice test
      if (isVoicePersona && result.test_result.audio_url) {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play()
              .then(() => setIsPlaying(true))
              .catch(err => console.error('Error playing audio:', err));
          }
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during testing');
      console.error('Persona test error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.error('Error playing audio:', err));
      }
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
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
              <CardTitle>Test {personaName}</CardTitle>
              <CardDescription>
                {isVoicePersona ? 'Test your voice persona with custom text' : 'Test your video persona with custom script'}
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
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
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isVoicePersona ? 'Test Text' : 'Test Script'}
              </label>
              {isVoicePersona ? (
                <Input
                  placeholder="Enter text to convert to speech..."
                  value={testContent}
                  onChange={(e) => setTestContent(e.target.value)}
                />
              ) : (
                <Textarea
                  placeholder="Enter script for your video persona..."
                  value={testContent}
                  onChange={(e) => setTestContent(e.target.value)}
                  rows={5}
                />
              )}
            </div>
            
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-black"
              onClick={handleTest}
              disabled={isLoading || !testContent.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isVoicePersona ? 'Generating Audio...' : 'Generating Video...'}
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  {isVoicePersona ? 'Generate Speech' : 'Generate Video'}
                </>
              )}
            </Button>
            
            <div className="text-sm text-gray-500">
              <p>
                {isVoicePersona 
                  ? 'Test how your voice persona sounds with different text inputs.' 
                  : 'Test how your video persona performs with different scripts.'}
              </p>
              <p className="mt-1">
                {isVoicePersona
                  ? 'For best results, try sentences with different emotions and tones.'
                  : 'For best results, keep scripts between 10-30 seconds in length.'}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Test Results</h3>
            
            {testResult ? (
              <div className="space-y-4">
                {isVoicePersona && testResult.test_result.audio_url ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Generated Audio</h4>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={toggleAudio}
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="h-4 w-4 mr-1" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-1" />
                              Play
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (testResult.test_result.audio_url) {
                              const a = document.createElement('a');
                              a.href = testResult.test_result.audio_url;
                              a.download = `${personaName}-test.mp3`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                    
                    <audio 
                      ref={audioRef}
                      src={testResult.test_result.audio_url} 
                      className="w-full" 
                      controls 
                      onEnded={() => setIsPlaying(false)}
                      hidden
                    />
                    
                    <div className="bg-white p-3 rounded border flex items-center">
                      <Volume2 className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: isPlaying ? '100%' : '0%', transition: 'width 0.1s linear' }}></div>
                      </div>
                    </div>
                  </div>
                ) : !isVoicePersona && testResult.test_result.video_id ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Generated Video</h4>
                    <div className="bg-white p-4 rounded border">
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Status:</span> {testResult.test_result.status}
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Video ID:</span> {testResult.test_result.video_id}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Estimated Duration:</span> {testResult.test_result.estimated_duration}
                      </p>
                      
                      <div className="mt-4 flex justify-center">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center animate-pulse">
                          <Video className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 text-center mt-4">
                        Video generation in progress. This may take a few minutes.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-center py-6">
                      <AlertTriangle className="h-10 w-10 text-orange-500 mx-auto mb-2" />
                      <p className="text-gray-700">No media generated</p>
                      <p className="text-sm text-gray-500 mt-1">
                        There was an issue generating the test media
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Performance</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Response Time</span>
                      <span className="text-gray-700">{testResult.response_time_ms}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Model Used</span>
                      <span className="text-gray-700">
                        {isVoicePersona 
                          ? testResult.test_result.model_used || 'eleven_flash_v2.5'
                          : 'Tavus CVI'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg flex flex-col items-center justify-center h-64">
                {isVoicePersona ? (
                  <>
                    <Mic className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-center">
                      Test results will appear here after generating speech
                    </p>
                  </>
                ) : (
                  <>
                    <Video className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-center">
                      Test results will appear here after generating video
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={onClose}
        >
          <X className="mr-2 h-4 w-4" />
          Close
        </Button>
      </CardFooter>
    </Card>
  );
}