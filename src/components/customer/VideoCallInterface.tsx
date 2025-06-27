'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  PhoneOff, 
  Volume2, 
  VolumeX,
  Loader2,
  AlertTriangle,
  MessageSquare,
  ScreenShare,
  StopCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { CallSession, CallTranscript, VideoFrame } from '@/types/call';
import { endCall, connectToCallWebSocket, sendVideoFrame } from '@/lib/call';

interface VideoCallInterfaceProps {
  callSession: CallSession;
  onEndCall: () => void;
  onError: (error: string) => void;
}

export function VideoCallInterface({ 
  callSession, 
  onEndCall,
  onError
}: VideoCallInterfaceProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [volume, setVolume] = useState(80);
  const [callDuration, setCallDuration] = useState(0);
  const [transcripts, setTranscripts] = useState<CallTranscript[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [callQuality, setCallQuality] = useState({
    quality: 'Good',
    color: 'text-blue-500',
    message: 'Call quality is good'
  });
  const [videoResponse, setVideoResponse] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);
  const videoFrameCountRef = useRef<number>(0);
  
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
  
  // Initialize video
  useEffect(() => {
    const initializeVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: true
        });
        
        mediaStreamRef.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Start sending video frames
        startSendingVideoFrames();
        
        // Simulate remote video (AI avatar)
        // In a real implementation, this would come from the Tavus API
        setTimeout(() => {
          if (remoteVideoRef.current) {
            // For demo purposes, we'll use a placeholder video
            remoteVideoRef.current.src = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
            remoteVideoRef.current.play();
          }
        }, 2000);
      } catch (error) {
        console.error('Error initializing video:', error);
        onError('Failed to access camera. Please check your permissions.');
      }
    };
    
    initializeVideo();
    
    return () => {
      // Clean up
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [onError]);
  
  // Start sending video frames
  const startSendingVideoFrames = () => {
    if (!mediaStreamRef.current) return;
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const video = localVideoRef.current;
    
    if (!context || !video) return;
    
    const captureFrame = () => {
      if (!video || !context || !mediaStreamRef.current || isVideoOff) return;
      
      // Only capture frames if video is playing and not paused
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        const base64Frame = canvas.toDataURL('image/jpeg', 0.5);
        const base64Data = base64Frame.split(',')[1];
        
        // Send frame to server (only every 5th frame to reduce bandwidth)
        if (videoFrameCountRef.current % 5 === 0) {
          const isKeyFrame = videoFrameCountRef.current % 30 === 0;
          
          if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
            const videoFrame: VideoFrame = {
              data: base64Data,
              timestamp: Date.now(),
              sequence: videoFrameCountRef.current,
              isKeyFrame,
              width: canvas.width,
              height: canvas.height
            };
            
            webSocketRef.current.send(JSON.stringify({
              type: 'video_data',
              data: videoFrame,
              timestamp: Date.now()
            }));
          } else {
            // Fallback to REST API if WebSocket is not available
            sendVideoFrame(callSession.id, {
              data: base64Data,
              timestamp: Date.now(),
              sequence: videoFrameCountRef.current,
              isKeyFrame,
              width: canvas.width,
              height: canvas.height
            }).catch(error => {
              console.error('Error sending video frame:', error);
            });
          }
        }
        
        videoFrameCountRef.current++;
      }
      
      // Request next frame
      requestAnimationFrame(captureFrame);
    };
    
    // Start capturing frames
    captureFrame();
  };
  
  // Handle WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    if (message.type === 'video_response') {
      // Set video response URL
      setVideoResponse(message.videoUrl);
      
      // Add to transcripts
      if (message.script) {
        setTranscripts(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            call_session_id: callSession.id,
            speaker: 'agent',
            message: message.script,
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
    } else if (message.type === 'call_quality') {
      // Update call quality
      setCallQuality({
        quality: message.quality,
        color: message.color,
        message: message.message
      });
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };
  
  // Toggle screen sharing
  const toggleScreenSharing = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Restore camera video
      if (mediaStreamRef.current && localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStreamRef.current;
      }
      
      setIsScreenSharing(false);
    } else {
      try {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true 
        });
        
        screenStreamRef.current = screenStream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        // Listen for when user stops screen sharing
        screenStream.getVideoTracks()[0].onended = () => {
          if (mediaStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = mediaStreamRef.current;
          }
          setIsScreenSharing(false);
        };
        
        setIsScreenSharing(true);
      } catch (error) {
        console.error('Error starting screen sharing:', error);
        onError('Failed to start screen sharing');
      }
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.volume = value[0] / 100;
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
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Main video area */}
          <div className="flex-1">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              {/* Remote video (AI avatar) */}
              {isConnecting ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-12 w-12 text-white animate-spin" />
                  <p className="text-white ml-2">Connecting...</p>
                </div>
              ) : (
                <video 
                  ref={remoteVideoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  autoPlay
                  muted={volume === 0}
                />
              )}
              
              {/* Local video (picture-in-picture) */}
              <div className="absolute bottom-4 right-4 w-1/4 aspect-video bg-gray-900 rounded overflow-hidden border-2 border-white shadow-lg">
                {isVideoOff ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <CameraOff className="h-6 w-6 text-white" />
                  </div>
                ) : (
                  <video 
                    ref={localVideoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    autoPlay
                    muted
                  />
                )}
              </div>
              
              {/* Call duration and quality */}
              <div className="absolute top-4 left-4 bg-black bg-opacity-50 rounded-full px-3 py-1 text-white text-sm">
                {formatDuration(callDuration)}
              </div>
              
              <div className={`absolute top-4 right-4 bg-black bg-opacity-50 rounded-full px-3 py-1 text-sm ${callQuality.color}`}>
                {callQuality.quality} Quality
              </div>
            </div>
            
            {/* Call controls */}
            <div className="mt-4 flex justify-center space-x-4">
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
                variant="outline" 
                size="icon" 
                className={`rounded-full w-12 h-12 ${isVideoOff ? 'bg-red-100 text-red-600' : ''}`}
                onClick={toggleVideo}
              >
                {isVideoOff ? (
                  <CameraOff className="h-6 w-6" />
                ) : (
                  <Camera className="h-6 w-6" />
                )}
              </Button>
              
              <Button 
                variant="outline" 
                size="icon" 
                className={`rounded-full w-12 h-12 ${isScreenSharing ? 'bg-blue-100 text-blue-600' : ''}`}
                onClick={toggleScreenSharing}
              >
                {isScreenSharing ? (
                  <StopCircle className="h-6 w-6" />
                ) : (
                  <ScreenShare className="h-6 w-6" />
                )}
              </Button>
            </div>
            
            {/* Volume control */}
            <div className="mt-4 flex items-center">
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
          </div>
          
          {/* Transcripts and info */}
          <div className="w-full md:w-80">
            <div className="bg-gray-50 rounded-lg p-4 h-[calc(100vh-16rem)] overflow-y-auto">
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
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <MessageSquare className="h-6 w-6 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No transcripts yet</p>
                </div>
              )}
            </div>
            
            {/* Call info */}
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Call Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Call Type:</span>
                  <span className="font-medium">Video</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Provider:</span>
                  <span className="font-medium">Tavus</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className="font-medium">{callSession.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-medium">{formatDuration(callDuration)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}