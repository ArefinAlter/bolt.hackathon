'use client';

import { useState } from 'react';

interface InfoCardProps {
  title: string;
  description?: string;
  items?: string[];
  icon: string;
}

export function InfoCard({ title, description, items, icon }: InfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">{icon}</span>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-white mb-1">{title}</h3>
            {description && (
              <p className="text-xs text-gray-200">{description}</p>
            )}
            {items && isExpanded && (
              <ul className="text-xs text-gray-200 mt-2 space-y-1">
                {items.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {items && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white/70 hover:text-white text-sm"
          >
            {isExpanded ? '−' : '+'}
          </button>
        )}
      </div>
    </div>
  );
} 