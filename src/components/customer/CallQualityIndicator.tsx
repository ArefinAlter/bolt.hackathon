'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface CallQualityIndicatorProps {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  showLabel?: boolean;
  className?: string;
}

export function CallQualityIndicator({ 
  quality, 
  showLabel = true,
  className = ''
}: CallQualityIndicatorProps) {
  const [color, setColor] = useState('text-green-500');
  const [icon, setIcon] = useState(<Wifi className="h-4 w-4" />);
  const [label, setLabel] = useState('Excellent');
  
  useEffect(() => {
    switch (quality) {
      case 'excellent':
        setColor('text-green-500');
        setIcon(<Wifi className="h-4 w-4" />);
        setLabel('Excellent');
        break;
      case 'good':
        setColor('text-blue-500');
        setIcon(<Wifi className="h-4 w-4" />);
        setLabel('Good');
        break;
      case 'fair':
        setColor('text-yellow-500');
        setIcon(<AlertTriangle className="h-4 w-4" />);
        setLabel('Fair');
        break;
      case 'poor':
        setColor('text-red-500');
        setIcon(<WifiOff className="h-4 w-4" />);
        setLabel('Poor');
        break;
    }
  }, [quality]);
  
  return (
    <div className={`flex items-center ${color} ${className}`}>
      {icon}
      {showLabel && <span className="ml-1 text-sm">{label}</span>}
    </div>
  );
}