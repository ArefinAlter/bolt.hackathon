'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AudioVisualizer } from './AudioVisualizer';
import { CallQualityIndicator } from './CallQualityIndicator';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  MessageSquare,
  Clock,
  User
} from 'lucide-react';
import { CallSession } from '@/types/call';
import { supabase } from '@/lib/supabase';

interface VoiceCallInterfaceProps {
  callSession: CallSession;
  isDemoMode?: boolean;
  onEndCall: () => Promise<void>;
  onError: (error: string | null) => void;
  onSendMessage?: (message: string) => void;
}

export function VoiceCallInterface({ 
  callSession, 
  isDemoMode = false, 
  onEndCall, 
  onError,
  onSendMessage 
}: VoiceCallInterfaceProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [callQuality, setCallQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    initializeCall();
    return () => cleanupCall();
  }, []);

  // Send initial greeting from AI as soon as call is connected
  useEffect(() => {
    if (callSession && isConnected) {
      sendInitialGreeting();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callSession, isConnected]);

  useEffect(() => {
    if (isConnected) {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isConnected]);

  const initializeCall = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      setIsConnected(true);

      // Initialize audio context for visualizer
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      // Start monitoring audio levels
      monitorAudioLevels();

      // Add initial greeting for demo mode
      if (isDemoMode) {
        setTimeout(() => {
          setTranscript(prev => [...prev, 'Agent: Hello! I\'m here to help you with your return request. How can I assist you today?']);
        }, 1000);
      }

    } catch (error) {
      console.error('Error initializing call:', error);
      setCallQuality('poor');
      onError('Failed to initialize microphone access');
    }
  };

  const monitorAudioLevels = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    const updateAudioLevel = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      // Calculate average audio level
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        sum += dataArrayRef.current[i];
      }
      const average = sum / dataArrayRef.current.length;
      const normalizedLevel = average / 255; // Normalize to 0-1
      
      setAudioLevel(normalizedLevel);
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };

    updateAudioLevel();
  };

  const cleanupCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const startRecording = async () => {
    if (!streamRef.current || isRecording) return;

    try {
      setIsRecording(true);
      audioChunksRef.current = [];

      // Create MediaRecorder with audio/webm format for better compatibility
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await processAudioChunks();
      };

      // Start recording with 1-second timeslices for real-time processing
      mediaRecorder.start(1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudioChunks = async () => {
    if (audioChunksRef.current.length === 0) return;

    try {
      setIsProcessing(true);

      // Combine audio chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Convert to base64 for API
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64Audio = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));

      // Get session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      // Send to Supabase function for processing
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-voice-input`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          call_session_id: callSession.id,
          audio_data: base64Audio,
          user_message: undefined,
          demo_mode: isDemoMode
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process audio');
      }

      const result = await response.json();
      
      if (result.success) {
        // Add user message to transcript
        if (result.user_input) {
          setTranscript(prev => [...prev, `You: ${result.user_input}`]);
        }
        
        // Add AI response to transcript
        if (result.ai_response) {
          setTranscript(prev => [...prev, `Agent: ${result.ai_response}`]);
        }

        // Play AI response audio if available
        if (result.audio_data && !result.no_audio) {
          playAudioResponse(result.audio_data);
        }
      } else {
        throw new Error(result.error || 'Failed to process audio');
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      onError('Failed to process audio. Please try again.');
      setTranscript(prev => [...prev, 'Agent: I\'m sorry, I couldn\'t process that. Could you please repeat?']);
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
    }
  };

  const playAudioResponse = (audioData: string) => {
    try {
      console.log('🎵 Playing audio response:', audioData?.substring(0, 100) + '...');
      
      let audioUrl: string;
      
      if (audioData.startsWith('data:audio/')) {
        // Handle data URL format (base64 encoded audio)
        const audioBlob = new Blob([
          Uint8Array.from(atob(audioData.split(',')[1]), c => c.charCodeAt(0))
        ], { type: 'audio/mpeg' });
        
        audioUrl = URL.createObjectURL(audioBlob);
        console.log('🔧 Created blob URL for audio:', audioUrl);
      } else if (audioData.startsWith('http')) {
        // Handle URL format (direct URL to audio file)
        audioUrl = audioData;
        console.log('🔗 Using direct URL for audio:', audioUrl);
      } else {
        console.error('❌ Unknown audio data format:', audioData?.substring(0, 50));
        return;
      }
      
      const audio = new Audio();
      
      // Add event listeners for debugging
      audio.onloadstart = () => console.log('🎵 Audio loading started');
      audio.oncanplay = () => console.log('🎵 Audio can play');
      audio.oncanplaythrough = () => console.log('🎵 Audio can play through');
      audio.onended = () => {
        console.log('🎵 Audio playback ended');
        if (audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(audioUrl);
        }
      };
      
      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        console.error('❌ Audio error details:', audio.error);
        
        // Check for common browser issues
        if (audio.error?.code === 4) {
          console.error('❌ Audio format not supported by browser');
        } else if (audio.error?.code === 3) {
          console.error('❌ Audio decoding failed');
        } else if (audio.error?.code === 2) {
          console.error('❌ Audio network error');
        }
      };
      
      // Set audio properties for better compatibility
      audio.preload = 'auto';
      audio.volume = 1.0;
      audio.src = audioUrl;
      
      // Try to play with user interaction requirement handling
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Audio playback started successfully');
          })
          .catch(error => {
            console.error('❌ Error playing audio:', error);
            
            // Handle autoplay policy issues
            if (error.name === 'NotAllowedError') {
              console.error('❌ Autoplay blocked by browser. User interaction required.');
              // Try to play again after a short delay
              setTimeout(() => {
                audio.play().catch(e => console.error('❌ Retry failed:', e));
              }, 100);
            }
          });
      }
      
    } catch (error) {
      console.error('❌ Error creating audio response:', error);
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    cleanupCall();
    await onEndCall();
  };

  const sendInitialGreeting = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setIsProcessing(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-voice-input`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          call_session_id: callSession.id,
          user_message: '__init__', // special trigger for greeting
          demo_mode: isDemoMode
        }),
      });
      const result = await response.json();
      if (result.success && result.audio_data) {
        playAudioResponse(result.audio_data);
        setTranscript(prev => [...prev, `Agent: ${result.ai_response}`]);
      } else if (result.success && result.ai_response) {
        setTranscript(prev => [...prev, `Agent: ${result.ai_response}`]);
      }
    } catch (error) {
      console.error('Error sending initial greeting:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* Call Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Voice Call</CardTitle>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(callDuration)}</span>
                  <CallQualityIndicator quality={callQuality} />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isDemoMode && (
                <Badge variant="secondary">Demo Mode</Badge>
              )}
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Audio Visualizer */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <AudioVisualizer 
            audioLevel={audioLevel}
            isRecording={isRecording}
            isProcessing={isProcessing}
          />
        </CardContent>
      </Card>

      {/* Call Controls */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-4">
            <Button
              size="lg"
              variant="outline"
              onClick={toggleMute}
              className={`w-16 h-16 rounded-full ${
                isMuted ? 'bg-red-100 border-red-300' : 'bg-gray-100'
              }`}
            >
              {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </Button>

            <Button
              size="lg"
              variant="outline"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={isProcessing || isMuted}
              className={`w-20 h-20 rounded-full ${
                isRecording 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </Button>

            <Button
              size="lg"
              variant="destructive"
              onClick={handleEndCall}
              className="w-16 h-16 rounded-full"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              {isRecording 
                ? 'Recording... Release to send' 
                : isProcessing 
                  ? 'Processing your message...' 
                  : 'Press and hold to speak'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Live Transcript */}
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            Live Transcript
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {transcript.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Start speaking to see the transcript</p>
              </div>
            ) : (
              transcript.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    message.startsWith('You:')
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'bg-gray-50 border-l-4 border-gray-500'
                  }`}
                >
                  <p className="text-sm">{message}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}