'use client';

import { useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { CallTranscript } from '@/types/call';
import { format } from 'date-fns';

interface TranscriptPanelProps {
  transcripts: CallTranscript[];
  className?: string;
}

export function TranscriptPanel({ transcripts, className = '' }: TranscriptPanelProps) {
  const transcriptsEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when transcripts change
  useEffect(() => {
    if (transcriptsEndRef.current) {
      transcriptsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts]);
  
  return (
    <div className={`bg-gray-50 rounded-lg p-4 overflow-y-auto ${className}`}>
      <h3 className="text-sm font-medium text-gray-700 mb-2">Transcripts</h3>
      {transcripts.length > 0 ? (
        <div className="space-y-2">
          {transcripts.map((transcript) => (
            <div 
              key={transcript.id}
              className={`p-2 rounded-lg text-sm ${
                transcript.speaker === 'user' 
                  ? 'bg-primary/10 ml-auto max-w-[80%]' 
                  : transcript.speaker === 'system'
                    ? 'bg-gray-200 mx-auto max-w-[80%] text-center'
                    : 'bg-white border border-gray-200 mr-auto max-w-[80%]'
              }`}
            >
              <p className="font-medium text-xs text-gray-500 mb-1">
                {transcript.speaker === 'user' 
                  ? 'You' 
                  : transcript.speaker === 'system'
                    ? 'System'
                    : 'AI Assistant'}
                <span className="ml-2 font-normal">
                  {format(new Date(transcript.timestamp_seconds * 1000), 'h:mm a')}
                </span>
              </p>
              <p>{transcript.message}</p>
            </div>
          ))}
          <div ref={transcriptsEndRef} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-32 text-center">
          <MessageSquare className="h-6 w-6 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No transcripts yet</p>
        </div>
      )}
    </div>
  );
}