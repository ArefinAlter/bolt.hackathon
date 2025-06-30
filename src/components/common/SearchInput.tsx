'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from 'use-debounce';

interface SearchInputProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  initialValue?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  placeholder = 'Search...',
  onSearch,
  initialValue = '',
  className = '',
  autoFocus = false
}: SearchInputProps) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue] = useDebounce(value, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue]);

  const handleClear = () => {
    setValue('');
    onSearch('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-10 pr-10"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-0 top-1/2 transform -translate-y-1/2 h-full aspect-square rounded-none"
          onClick={handleClear}
        >
          <X size={16} />
        </Button>
      )}
    </div>
  );
}