"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/lib/hooks/useDebounce";

export interface SearchInputProps {
  /**
   * Placeholder text for the search input
   */
  placeholder?: string;
  /**
   * Debounce delay in milliseconds (default: 300ms)
   */
  debounceMs?: number;
  /**
   * Callback fired when the search keyword changes (after debounce)
   */
  onSearch?: (keyword: string) => void;
  /**
   * Callback fired immediately when the input value changes (before debounce)
   */
  onChange?: (value: string) => void;
  /**
   * Initial search keyword value
   */
  defaultValue?: string;
  /**
   * Controlled value (if provided, component becomes controlled)
   */
  value?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Generic search input component with built-in debouncing
 * 
 * This component automatically debounces search input to avoid excessive API calls.
 * The onSearch callback is called after the user stops typing for the debounce duration.
 * 
 * @example
 * ```tsx
 * <SearchInput
 *   placeholder="搜索用户、课程..."
 *   onSearch={(keyword) => {
 *     // This is called after user stops typing for 300ms
 *     fetchData({ keyword });
 *   }}
 * />
 * ```
 */
export function SearchInput({
  placeholder = "搜索...",
  debounceMs = 300,
  onSearch,
  onChange,
  defaultValue = "",
  value: controlledValue,
  className = "",
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  
  // Use controlled value if provided, otherwise use internal state
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  
  // Debounce the value
  const debouncedValue = useDebounce(value, debounceMs);

  // Track if this is the initial mount
  const isInitialMount = useRef(true);

  // Call onSearch when debounced value changes (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (onSearch) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch]);

  // Call onChange immediately when value changes
  useEffect(() => {
    if (onChange) {
      onChange(value);
    }
  }, [value, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    // If controlled, onChange is handled by parent
  };

  const handleClear = () => {
    const newValue = "";
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    if (onChange) {
      onChange(newValue);
    }
    if (onSearch) {
      onSearch(newValue);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="w-full pl-10 pr-10 py-2 border border-border rounded-[var(--border-radius)] bg-card text-text-primary focus:ring-2 focus:ring-danger focus:border-danger outline-none transition-colors"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
          aria-label="清除搜索"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

