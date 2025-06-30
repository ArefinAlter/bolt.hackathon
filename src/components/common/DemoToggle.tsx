'use client';

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils"

interface DemoToggleProps {
  isDemoMode: boolean;
  onDemoModeChange: (value: boolean) => void;
  showLabel?: boolean;
  className?: string;
}

export function DemoToggle({ 
  isDemoMode, 
  onDemoModeChange, 
  showLabel = false,
  className = ''
}: DemoToggleProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <SwitchPrimitives.Root
        checked={isDemoMode}
        onCheckedChange={onDemoModeChange}
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-yellow-500 data-[state=unchecked]:bg-green-500"
        )}
      >
        <SwitchPrimitives.Thumb
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
            "bg-white border border-gray-200"
          )}
        />
      </SwitchPrimitives.Root>
      {showLabel && (
        <span className="text-sm text-gray-600">
          Demo Mode
        </span>
      )}
      <Badge 
        className={isDemoMode 
          ? 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200' 
          : 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
        }
        variant="outline"
      >
        {isDemoMode ? 'Demo' : 'Live'}
      </Badge>
    </div>
  );
} 