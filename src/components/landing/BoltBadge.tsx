import React from 'react';
import Image from 'next/image'

export function BoltBadge() {
  return (
    <div className="fixed left-6 bottom-8 z-50 flex flex-col items-center animate-float">
      <Image
        src="/bolt_badge.png"
        alt="Built with Bolt"
        width={64}
        height={64}
        className="w-16 h-16 drop-shadow-lg"
        priority
      />
      <span className="mt-2 text-xs text-gray-700 bg-white/80 rounded px-2 py-1 shadow">Built with Bolt</span>
    </div>
  )
} 