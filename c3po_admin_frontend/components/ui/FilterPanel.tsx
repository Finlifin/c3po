"use client";

import { useState, ReactNode } from "react";
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string | number | boolean;
}

export interface FilterField {
  /**
   * Unique identifier for the filter field
   */
  key: string;
  /**
   * Label displayed in the filter panel
   */
  label: string;
  /**
   * Filter type: 'select', 'text', 'date', 'checkbox'
   */
  type: "select" | "text" | "date" | "checkbox";
  /**
   * Options for select type filters
   */
  options?: FilterOption[];
  /**
   * Placeholder text for text/date inputs
   */
  placeholder?: string;
  /**
   * Default value
   */
  defaultValue?: string | number | boolean;
}

export interface FilterPanelProps {
  /**
   * Filter fields configuration
   */
  fields: FilterField[];
  /**
   * Current filter values (controlled)
   */
  values?: Record<string, string | number | boolean | undefined>;
  /**
   * Callback fired when filter values change
   */
  onFilterChange?: (filters: Record<string, string | number | boolean | undefined>) => void;
  /**
   * Callback fired when clear filters button is clicked
   */
  onClear?: () => void;
  /**
   * Whether the panel is expanded by default
   */
  defaultExpanded?: boolean;
  /**
   * Custom empty results message
   */
  emptyResultsMessage?: ReactNode;
  /**
   * Whether to show empty results message
   */
  showEmptyResults?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Advanced filter panel component with expand/collapse functionality
 * 
 * Supports multiple filter types and combines all active filters when calling onFilterChange.
 * 
 * @example
 * ```tsx
 * <FilterPanel
 *   fields={[
 *     { key: 'role', label: '角色', type: 'select', options: [
 *       { label: '全部', value: '' },
 *       { label: '学生', value: 'STUDENT' },
 *     ]},
 *     { key: 'status', label: '状态', type: 'select', options: [
 *       { label: '全部', value: '' },
 *       { label: '活跃', value: 'ACTIVE' },
 *     ]},
 *   ]}
 *   onFilterChange={(filters) => {
 *     // filters contains all active filter values
 *     fetchData(filters);
 *   }}
 *   onClear={() => {
 *     // Reset all filters to default
 *     fetchData({});
 *   }}
 * />
 * ```
 */
export function FilterPanel({
  fields,
  values: controlledValues,
  onFilterChange,
  onClear,
  defaultExpanded = false,
  emptyResultsMessage = "未找到匹配结果",
  showEmptyResults = false,
  className = "",
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [internalValues, setInternalValues] = useState<Record<string, string | number | boolean | undefined>>(() => {
    const initial: Record<string, string | number | boolean | undefined> = {};
    fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        initial[field.key] = field.defaultValue;
      }
    });
    return initial;
  });

  // Use controlled values if provided, otherwise use internal state
  const values = controlledValues !== undefined ? controlledValues : internalValues;

  const hasActiveFilters = fields.some((field) => {
    const value = values[field.key];
    if (value === undefined || value === null || value === "") {
      return false;
    }
    return true;
  });

  const handleFilterChange = (key: string, value: string | number | boolean | undefined) => {
    const newValues = { ...values, [key]: value };
    
    if (controlledValues === undefined) {
      setInternalValues(newValues);
    }
    
    if (onFilterChange) {
      onFilterChange(newValues);
    }
  };

  const handleClear = () => {
    const clearedValues: Record<string, string | number | boolean | undefined> = {};
    fields.forEach((field) => {
      clearedValues[field.key] = field.defaultValue;
    });

    if (controlledValues === undefined) {
      setInternalValues(clearedValues);
    }

    if (onClear) {
      onClear();
    } else if (onFilterChange) {
      onFilterChange(clearedValues);
    }
  };

  const renderFilterField = (field: FilterField) => {
    const value = values[field.key] ?? field.defaultValue;

    switch (field.type) {
      case "select":
        return (
          <div key={field.key} className="flex flex-col gap-1">
            <label htmlFor={field.key} className="text-sm font-medium text-gray-700">{field.label}</label>
            <select
              id={field.key}
              value={String(value ?? "")}
              onChange={(e) => {
                const newValue = e.target.value === "" ? undefined : e.target.value;
                handleFilterChange(field.key, newValue);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
            >
              {field.options?.map((option) => (
                <option key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case "text":
        return (
          <div key={field.key} className="flex flex-col gap-1">
            <label htmlFor={field.key} className="text-sm font-medium text-gray-700">{field.label}</label>
            <input
              id={field.key}
              type="text"
              value={String(value ?? "")}
              onChange={(e) => {
                const newValue = e.target.value === "" ? undefined : e.target.value;
                handleFilterChange(field.key, newValue);
              }}
              placeholder={field.placeholder}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
            />
          </div>
        );

      case "date":
        return (
          <div key={field.key} className="flex flex-col gap-1">
            <label htmlFor={field.key} className="text-sm font-medium text-gray-700">{field.label}</label>
            <input
              id={field.key}
              type="date"
              value={String(value ?? "")}
              onChange={(e) => {
                const newValue = e.target.value === "" ? undefined : e.target.value;
                handleFilterChange(field.key, newValue);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
            />
          </div>
        );

      case "checkbox":
        return (
          <div key={field.key} className="flex items-center gap-2">
            <input
              id={field.key}
              type="checkbox"
              checked={Boolean(value ?? false)}
              onChange={(e) => {
                handleFilterChange(field.key, e.target.checked);
              }}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label htmlFor={field.key} className="text-sm font-medium text-gray-700">{field.label}</label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-card rounded-[var(--border-radius)] border border-border shadow-light ${className}`}>
      {/* Filter Panel Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-bg-page transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-text-secondary" />
          <span className="font-medium text-text-primary">高级筛选</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-[rgba(255,59,48,0.1)] text-danger text-xs font-medium rounded-full">
              {fields.filter((f) => {
                const v = values[f.key];
                return v !== undefined && v !== null && v !== "";
              }).length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-text-secondary" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-secondary" />
        )}
      </button>

      {/* Filter Panel Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border">
          <div className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map(renderFilterField)}
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClear}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-card border border-border rounded-[var(--border-radius)] hover:bg-bg-page transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                清除筛选
              </button>
            </div>
          )}

          {/* Empty Results Message */}
          {showEmptyResults && (
            <div className="mt-4 p-4 text-center text-text-tertiary bg-bg-page rounded-[var(--border-radius)]">
              {emptyResultsMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

