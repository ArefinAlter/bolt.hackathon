'use client';

import React, { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useHotkeys } from 'react-hotkeys-hook';

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  // Register keyboard shortcut to open help
  useHotkeys('shift+?', () => {
    setIsOpen(true);
  });

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: ['Ctrl', 'K'], description: 'Open global search' },
        { keys: ['G', 'D'], description: 'Go to dashboard' },
        { keys: ['G', 'R'], description: 'Go to returns' },
        { keys: ['G', 'P'], description: 'Go to policies' },
        { keys: ['G', 'A'], description: 'Go to analytics' },
        { keys: ['G', 'S'], description: 'Go to settings' },
      ]
    },
    {
      category: 'Chat & Communication',
      items: [
        { keys: ['Ctrl', 'Enter'], description: 'Send message' },
        { keys: ['Alt', 'V'], description: 'Start voice call' },
        { keys: ['Alt', 'C'], description: 'Start video call' },
        { keys: ['Alt', 'U'], description: 'Upload file' },
        { keys: ['Esc'], description: 'Cancel current action' },
      ]
    },
    {
      category: 'Return Management',
      items: [
        { keys: ['N', 'R'], description: 'New return request' },
        { keys: ['F'], description: 'Filter returns' },
        { keys: ['R'], description: 'Refresh data' },
        { keys: ['A'], description: 'Approve selected return' },
        { keys: ['D'], description: 'Deny selected return' },
      ]
    },
    {
      category: 'Accessibility',
      items: [
        { keys: ['Alt', 'Z'], description: 'Toggle high contrast mode' },
        { keys: ['Alt', 'X'], description: 'Toggle large text mode' },
        { keys: ['Shift', '?'], description: 'Show keyboard shortcuts' },
      ]
    }
  ];

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        aria-label="Keyboard shortcuts"
      >
        <Keyboard className="h-5 w-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Use these keyboard shortcuts to navigate and perform actions quickly.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            {shortcuts.map((category) => (
              <div key={category.category}>
                <h3 className="text-lg font-medium mb-3">{category.category}</h3>
                <div className="space-y-2">
                  {category.items.map((shortcut, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        {shortcut.keys.map((key, keyIndex) => (
                          <>
                            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-gray-500">+</span>
                            )}
                          </>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">{shortcut.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}