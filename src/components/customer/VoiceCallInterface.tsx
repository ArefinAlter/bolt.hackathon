'use client';

import { useState, useEffect, useRef } from 'react';
import { Phone, Mic, MicOff, PhoneOff, Volume2, VolumeX, Loader2, AlertTriangle, MessageSquare, AudioWaveform as Waveform } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { CallSession, CallTranscript, AudioChunk } from '@/types/call';
import { endCall, processVoiceInput, connectToCallWebSocket, sendAudioData } from '@/lib/call';

interface VoiceCallInterfaceProps {
  callSession: CallSession;
  onEndCall: () => void;
  onError: (error: string) => void;
}

export function VoiceCallInterface({ 
  callSession, 
  onEndCall,
  onError
}: VoiceCallInterfaceProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [callDuration, setCallDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<CallTranscript[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [callQuality, setCallQuality] = useState({
    quality: 'Good',
    color: 'text-blue-500',
    message: 'Call quality is good'
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const webSocketRef = useRef<WebSocket | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  
  // Start call timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (callSession.websocket_url) {
      const ws = connectToCallWebSocket(
        callSession.websocket_url,
        handleWebSocketMessage,
        () => setIsConnecting(false),
        () => console.log('WebSocket closed'),
        () => onError('WebSocket connection error')
      );
      
      webSocketRef.current = ws;
      
      return () => {
        ws.close();
      };
    }
  }, [callSession.websocket_url, onError]);
  
  // Initialize audio recording
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Set up audio context and analyser for audio levels
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        
        // Set up media recorder
        const mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = async () => {
          if (audioChunksRef.current.length === 0) return;
          
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioChunksRef.current = [];
          
          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64data = reader.result as string;
            const base64Audio = base64data.split(',')[1]; // Remove data URL prefix
            
            // Send audio data to server
            if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
              const audioChunk: AudioChunk = {
                data: base64Audio,
                timestamp: Date.now(),
                sequence: 0,
                isFinal: true
              };
              
              webSocketRef.current.send(JSON.stringify({
                type: 'audio_data',
                data: audioChunk,
                timestamp: Date.now()
              }));
            } else {
              // Fallback to REST API if WebSocket is not available
              setIsProcessing(true);
              try {
                const result = await processVoiceInput(callSession.id, base64Audio);
                
                if (result.success && result.audio_data) {
                  // Play audio response
                  if (audioElementRef.current) {
                    audioElementRef.current.src = result.audio_data;
                    audioElementRef.current.play();
                  }
                  
                  // Add to transcripts
                  if (result.ai_response) {
                    setTranscripts(prev => [
                      ...prev,
                      {
                        id: Date.now().toString(),
                        call_session_id: callSession.id,
                        speaker: 'agent',
                        message: result.ai_response || '',
                        timestamp_seconds: Date.now() / 1000,
                        created_at: new Date().toISOString()
                      }
                    ]);
                  }
                }
              } catch (error) {
                console.error('Error processing voice input:', error);
                onError('Failed to process voice input');
              } finally {
                setIsProcessing(false);
              }
            }
          };
        };
        
        mediaRecorderRef.current = mediaRecorder;
        
        // Start monitoring audio levels
        monitorAudioLevels();
      } catch (error) {
        console.error('Error initializing audio:', error);
        onError('Failed to access microphone. Please check your permissions.');
      }
    };
    
    initializeAudio();
    
    return () => {
      // Clean up
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [callSession.id, onError]);
  
  // Monitor audio levels
  const monitorAudioLevels = () => {
    if (!analyserRef.current) return;
    
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateAudioLevel = () => {
      if (!analyser) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const normalizedLevel = average / 255; // Normalize to 0-1
      
      setAudioLevel(normalizedLevel);
      
      // Update call quality based on audio level and simulated network metrics
      const networkLatency = Math.random() * 100; // Simulated latency (0-100ms)
      const packetLoss = Math.random() * 0.05; // Simulated packet loss (0-5%)
      
      // Calculate quality score
      const audioScore = Math.min(100, normalizedLevel * 100);
      const latencyScore = Math.max(0, 100 - (networkLatency / 10));
      const packetLossScore = Math.max(0, 100 - (packetLoss * 100));
      
      const overallScore = (audioScore + latencyScore + packetLossScore) / 3;
      
      if (overallScore >= 80) {
        setCallQuality({
          quality: 'Excellent',
          color: 'text-green-500',
          message: 'Call quality is excellent'
        });
      } else if (overallScore >= 60) {
        setCallQuality({
          quality: 'Good',
          color: 'text-blue-500',
          message: 'Call quality is good'
        });
      } else if (overallScore >= 40) {
        setCallQuality({
          quality: 'Fair',
          color: 'text-yellow-500',
          message: 'Call quality is fair'
        });
      } else {
        setCallQuality({
          quality: 'Poor',
          color: 'text-red-500',
          message: 'Call quality is poor'
        });
      }
      
      requestAnimationFrame(updateAudioLevel);
    };
    
    updateAudioLevel();
  };
  
  // Handle WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    if (message.type === 'audio_response') {
      // Play audio response
      if (audioElementRef.current && message.audioUrl) {
        audioElementRef.current.src = message.audioUrl;
        audioElementRef.current.play();
      }
      
      // Add to transcripts
      if (message.text) {
        setTranscripts(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            call_session_id: callSession.id,
            speaker: 'agent',
            message: message.text || '',
            timestamp_seconds: Date.now() / 1000,
            created_at: new Date().toISOString()
          }
        ]);
      }
    } else if (message.type === 'transcript') {
      // Add user transcript
      setTranscripts(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          call_session_id: callSession.id,
          speaker: 'user',
          message: message.text || '',
          timestamp_seconds: Date.now() / 1000,
          created_at: new Date().toISOString()
        }
      ]);
    }
  };
  
  // Toggle recording
  const toggleRecording = () => {
    if (!mediaRecorderRef.current) return;
    
    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, 10000);
    }
  };
  
  // Handle mute toggle
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    
    if (audioElementRef.current) {
      audioElementRef.current.volume = value[0] / 100;
    }
  };
  
  // Handle end call
  const handleEndCall = async () => {
    try {
      await endCall(callSession.id);
      onEndCall();
    } catch (error) {
      console.error('Error ending call:', error);
      onError('Failed to end call properly');
      onEndCall(); // Still end the call on the client side
    }
  };
  
  // Format call duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            Voice Call
          </h2>
          <p className="text-gray-500 mt-1">
            {isConnecting ? 'Connecting...' : 'AI Voice Assistant'}
          </p>
          <p className="text-lg font-medium mt-2">
            {formatDuration(callDuration)}
          </p>
          
          {/* Call quality indicator */}
          <div className={`mt-2 text-sm ${callQuality.color}`}>
            {callQuality.quality} Quality
          </div>
        </div>
        
        {/* Audio visualizer */}
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center h-16">
            {isConnecting ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : isProcessing ? (
              <div className="text-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Processing...</p>
              </div>
            ) : isRecording ? (
              <div className="flex items-center space-x-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div 
                    key={i}
                    className="w-1 bg-primary rounded-full animate-pulse"
                    style={{ 
                      height: `${Math.max(4, Math.min(64, 4 + Math.random() * 60))}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  ></div>
                ))}
              </div>
            ) : (
              <div className="text-center">
                <Waveform className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Press and hold to speak</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Transcripts */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 h-40 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Transcripts</h3>
          {transcripts.length > 0 ? (
            <div className="space-y-2">
              {transcripts.map((transcript) => (
                <div 
                  key={transcript.id}
                  className={`p-2 rounded-lg text-sm ${
                    transcript.speaker === 'user' 
                      ? 'bg-primary/10 ml-auto max-w-[80%]' 
                      : 'bg-white border border-gray-200 mr-auto max-w-[80%]'
                  }`}
                >
                  <p className="font-medium text-xs text-gray-500 mb-1">
                    {transcript.speaker === 'user' ? 'You' : 'AI Assistant'}
                  </p>
                  <p>{transcript.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="h-6 w-6 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No transcripts yet</p>
            </div>
          )}
        </div>
        
        {/* Volume control */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-0 mr-2"
            onClick={() => setVolume(0)}
          >
            {volume === 0 ? (
              <VolumeX className="h-5 w-5 text-gray-500" />
            ) : (
              <Volume2 className="h-5 w-5 text-gray-500" />
            )}
          </Button>
          <Slider
            value={[volume]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="flex-1"
          />
        </div>
        
        {/* Call controls */}
        <div className="flex justify-center space-x-4">
          <Button 
            variant="outline" 
            size="icon" 
            className={`rounded-full w-12 h-12 ${isMuted ? 'bg-red-100 text-red-600' : ''}`}
            onClick={toggleMute}
          >
            {isMuted ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
          
          <Button 
            variant="destructive" 
            size="icon" 
            className="rounded-full w-12 h-12"
            onClick={handleEndCall}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
          
          <Button 
            variant={isRecording ? "default" : "outline"}
            size="icon" 
            className={`rounded-full w-12 h-12 ${isRecording ? 'bg-primary text-black' : ''}`}
            onMouseDown={toggleRecording}
            onMouseUp={toggleRecording}
            onTouchStart={toggleRecording}
            onTouchEnd={toggleRecording}
            disabled={isMuted || isProcessing}
          >
            <Mic className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Hidden audio element for playing responses */}
        <audio ref={audioElementRef} className="hidden" />
      </div>
    </div>
  );
}