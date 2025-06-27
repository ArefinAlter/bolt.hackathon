'use client';

import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  audioLevel: number;
  isRecording: boolean;
  isProcessing: boolean;
  className?: string;
}

export function AudioVisualizer({ 
  audioLevel, 
  isRecording, 
  isProcessing,
  className = ''
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (isProcessing) {
      // Draw processing animation (spinning circle)
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) * 0.7;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#eace0a';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      const angle = (Date.now() / 1000) % (Math.PI * 2);
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, angle, angle + Math.PI / 2);
      ctx.strokeStyle = '#eace0a';
      ctx.lineWidth = 6;
      ctx.stroke();
    } else if (isRecording) {
      // Draw audio waveform
      const barCount = 30;
      const barWidth = canvas.width / barCount;
      const barMaxHeight = canvas.height * 0.8;
      
      ctx.fillStyle = '#eace0a';
      
      for (let i = 0; i < barCount; i++) {
        // Calculate bar height based on audio level and add some randomness for visual effect
        const randomFactor = Math.random() * 0.3 + 0.7;
        const barHeight = audioLevel * barMaxHeight * randomFactor;
        
        // Draw bar
        ctx.fillRect(
          i * barWidth,
          (canvas.height - barHeight) / 2,
          barWidth * 0.8,
          barHeight
        );
      }
    } else {
      // Draw idle state (flat line with small bumps)
      const lineY = canvas.height / 2;
      const amplitude = canvas.height * 0.05;
      const frequency = 0.05;
      
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      
      for (let x = 0; x < canvas.width; x++) {
        const y = lineY + Math.sin(x * frequency) * amplitude;
        ctx.lineTo(x, y);
      }
      
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [audioLevel, isRecording, isProcessing]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className={`w-full h-full ${className}`}
    />
  );
}