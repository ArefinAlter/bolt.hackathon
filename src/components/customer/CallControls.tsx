'use client';

import { 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  PhoneOff, 
  Volume2, 
  VolumeX,
  ScreenShare,
  StopCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface CallControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  volume: number;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onVolumeChange: (value: number[]) => void;
  onEndCall: () => void;
  isVideoCall: boolean;
}

export function CallControls({
  isMuted,
  isVideoOff,
  isScreenSharing,
  volume,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onVolumeChange,
  onEndCall,
  isVideoCall
}: CallControlsProps) {
  return (
    <div className="space-y-4">
      {/* Volume control */}
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-0 mr-2"
          onClick={() => onVolumeChange(volume === 0 ? [80] : [0])}
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
          onValueChange={onVolumeChange}
          className="flex-1"
        />
      </div>
      
      {/* Call controls */}
      <div className="flex justify-center space-x-4">
        <Button 
          variant="outline" 
          size="icon" 
          className={`rounded-full w-12 h-12 ${isMuted ? 'bg-red-100 text-red-600' : ''}`}
          onClick={onToggleMute}
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
        
        {isVideoCall && (
          <>
            <Button 
              variant="outline" 
              size="icon" 
              className={`rounded-full w-12 h-12 ${isVideoOff ? 'bg-red-100 text-red-600' : ''}`}
              onClick={onToggleVideo}
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
              onClick={onToggleScreenShare}
            >
              {isScreenSharing ? (
                <StopCircle className="h-6 w-6" />
              ) : (
                <ScreenShare className="h-6 w-6" />
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}