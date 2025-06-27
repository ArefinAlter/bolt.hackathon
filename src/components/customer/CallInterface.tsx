'use client';

import { useState, useEffect } from 'react';
import { 
  Phone, 
  Video, 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  PhoneOff, 
  Volume2, 
  VolumeX 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CallInterfaceProps {
  callType: 'voice' | 'video';
  onEndCall: () => void;
}

export function CallInterface({ callType, onEndCall }: CallInterfaceProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  // Start call timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
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
            {callType === 'voice' ? (
              <Phone className="h-10 w-10 text-primary" />
            ) : (
              <Video className="h-10 w-10 text-primary" />
            )}
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            {callType === 'voice' ? 'Voice Call' : 'Video Call'}
          </h2>
          <p className="text-gray-500 mt-1">
            {callType === 'voice' ? 'AI Voice Assistant' : 'AI Video Assistant'}
          </p>
          <p className="text-lg font-medium mt-2">
            {formatDuration(callDuration)}
          </p>
        </div>
        
        {callType === 'video' && (
          <div className="bg-gray-100 rounded-lg aspect-video mb-6 flex items-center justify-center">
            {isVideoOff ? (
              <div className="text-center">
                <CameraOff className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Camera is off</p>
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-gray-300 to-gray-200 animate-pulse flex items-center justify-center">
                <Video className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-center space-x-4">
          <Button 
            variant="outline" 
            size="icon" 
            className={`rounded-full w-12 h-12 ${isMuted ? 'bg-red-100 text-red-600' : ''}`}
            onClick={() => setIsMuted(!isMuted)}
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
            onClick={onEndCall}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
          
          {callType === 'video' ? (
            <Button 
              variant="outline" 
              size="icon" 
              className={`rounded-full w-12 h-12 ${isVideoOff ? 'bg-red-100 text-red-600' : ''}`}
              onClick={() => setIsVideoOff(!isVideoOff)}
            >
              {isVideoOff ? (
                <CameraOff className="h-6 w-6" />
              ) : (
                <Camera className="h-6 w-6" />
              )}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full w-12 h-12"
              onClick={() => {}}
            >
              <Volume2 className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}