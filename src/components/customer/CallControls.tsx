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
          className="p-0 mr-2 bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center"
          onClick={() => onVolumeChange(volume === 0 ? [80] : [0])}
        >
          {volume === 0 ? (
            <VolumeX className="h-4 w-4 fill-white" />
          ) : (
            <Volume2 className="h-4 w-4 fill-white" />
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
          className={`rounded-full w-12 h-12 ${isMuted ? 'bg-red-600 border-red-600' : 'bg-gray-800 border-gray-800'}`}
          onClick={onToggleMute}
        >
          {isMuted ? (
            <MicOff className="h-6 w-6 fill-white" />
          ) : (
            <Mic className="h-6 w-6 fill-white" />
          )}
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full w-12 h-12 bg-red-600 border-red-600 hover:bg-red-700"
          onClick={onEndCall}
        >
          <PhoneOff className="h-6 w-6 fill-white" />
        </Button>
        
        {isVideoCall && (
          <>
            <Button 
              variant="outline" 
              size="icon" 
              className={`rounded-full w-12 h-12 ${isVideoOff ? 'bg-red-600 border-red-600' : 'bg-gray-800 border-gray-800'}`}
              onClick={onToggleVideo}
            >
              {isVideoOff ? (
                <CameraOff className="h-6 w-6 fill-white" />
              ) : (
                <Camera className="h-6 w-6 fill-white" />
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              className={`rounded-full w-12 h-12 ${isScreenSharing ? 'bg-blue-600 border-blue-600' : 'bg-gray-800 border-gray-800'}`}
              onClick={onToggleScreenShare}
            >
              {isScreenSharing ? (
                <StopCircle className="h-6 w-6 fill-white" />
              ) : (
                <ScreenShare className="h-6 w-6 fill-white" />
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}