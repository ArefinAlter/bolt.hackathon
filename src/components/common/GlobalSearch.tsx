'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Package, MessageSquare, FileText, User, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useDebounce } from 'use-debounce';
import { useHotkeys } from 'react-hotkeys-hook';

interface SearchResult {
  id: string;
  type: 'return' | 'message' | 'policy' | 'customer';
  title: string;
  description: string;
  url: string;
}

export function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Register keyboard shortcut to open search
  useHotkeys('ctrl+k, cmd+k', (e) => {
    e.preventDefault();
    setIsOpen(true);
  });

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Search when query changes
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      
      try {
        // In a real implementation, this would call an API
        // For demo purposes, we'll use mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockResults: SearchResult[] = [
          {
            id: '1',
            type: 'return',
            title: 'ORDER-12345',
            description: 'Return request for defective product',
            url: '/return/abc123'
          },
          {
            id: '2',
            type: 'message',
            title: 'Conversation with customer',
            description: 'Last message: I need help with my return',
            url: '/customer/chat'
          },
          {
            id: '3',
            type: 'policy',
            title: 'Return Policy v1.2',
            description: 'Active policy for electronics category',
            url: '/dashboard/policy'
          },
          {
            id: '4',
            type: 'customer',
            title: 'john.smith@example.com',
            description: 'Customer profile with 3 previous returns',
            url: '/dashboard/customers/123'
          }
        ].filter(result => 
          result.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          result.description.toLowerCase().includes(debouncedQuery.toLowerCase())
        );
        
        setResults(mockResults);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    router.push(result.url);
    setIsOpen(false);
    setQuery('');
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'return':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'policy':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'customer':
        return <User className="h-4 w-4 text-orange-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-between text-gray-500 bg-gray-50 border-gray-200"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center">
          <Search className="mr-2 h-4 w-4" />
          <span>Search...</span>
        </div>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[550px] p-0" onKeyDown={handleKeyDown}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for returns, messages, policies..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0"
            />
            {query && (
              <Button
                variant="ghost"
                onClick={() => setQuery('')}
                className="h-6 w-6 p-0 rounded-md"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto p-0">
            {isLoading ? (
              <div className="p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                <p className="text-sm text-gray-500 mt-2">Searching...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((result, index) => (
                  <div
                    key={result.id}
                    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                      selectedIndex === index ? 'bg-gray-100' : ''
                    }`}
                    onClick={() => handleSelectResult(result)}
                  >
                    <div className="flex items-center">
                      <div className="mr-3">{getIconForType(result.type)}</div>
                      <div>
                        <p className="text-sm font-medium">{result.title}</p>
                        <p className="text-xs text-gray-500">{result.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : query.length > 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500">No results found for "{query}"</p>
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-500">Type to search</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-gray-50 p-2">
                    <p className="text-xs font-medium">Returns</p>
                  </div>
                  <div className="rounded-md bg-gray-50 p-2">
                    <p className="text-xs font-medium">Messages</p>
                  </div>
                  <div className="rounded-md bg-gray-50 p-2">
                    <p className="text-xs font-medium">Policies</p>
                  </div>
                  <div className="rounded-md bg-gray-50 p-2">
                    <p className="text-xs font-medium">Customers</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between border-t p-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span>↑↓</span> <span>to navigate</span>
            </div>
            <div className="flex items-center gap-2">
              <span>↵</span> <span>to select</span>
            </div>
            <div className="flex items-center gap-2">
              <span>ESC</span> <span>to close</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}