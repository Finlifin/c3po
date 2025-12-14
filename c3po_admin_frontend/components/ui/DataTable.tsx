"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
} from "lucide-react";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  sorting?: {
    field: string;
    order: "asc" | "desc";
    onSort: (field: string, order: "asc" | "desc") => void;
  };
  search?: {
    placeholder?: string;
    onSearch: (keyword: string) => void;
  };
  actions?: (row: T) => React.ReactNode;
  emptyMessage?: string;
  loading?: boolean;
}

export function DataTable<T = Record<string, unknown>>({
  columns,
  data,
  pagination,
  sorting,
  search,
  actions,
  emptyMessage = "暂无数据",
  loading = false,
}: DataTableProps<T>) {
  const [searchKeyword, setSearchKeyword] = useState("");

  const handleSort = (field: string) => {
    if (!sorting) return;

    const newOrder =
      sorting.field === field && sorting.order === "asc" ? "desc" : "asc";
    sorting.onSort(field, newOrder);
  };

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    search?.onSearch(keyword);
  };

  const renderCell = (column: Column<T>, row: T) => {
    const value = (row as Record<string, unknown>)[column.key];

    if (column.render) {
      return column.render(value, row);
    }

    if (value === null || value === undefined) {
      return <span className="text-gray-400">—</span>;
    }

    return <span>{String(value)}</span>;
  };

  if (loading) {
    return (
      <div className="bg-card rounded-[var(--border-radius)] border border-border p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-danger"></div>
        <p className="mt-4 text-text-secondary">加载中...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-[var(--border-radius)] border border-border p-12 text-center">
        <p className="text-text-tertiary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-[var(--border-radius)] border border-border overflow-hidden shadow-light">
      {/* Search and Filters */}
      {search && (
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              placeholder={search.placeholder || "搜索..."}
              value={searchKeyword}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-[var(--border-radius)] bg-card text-text-primary focus:ring-2 focus:ring-danger focus:border-danger transition-colors"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-bg-page border-b border-border">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider
                    ${column.width ? "" : ""}
                  `}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable && sorting && (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="hover:text-danger transition-colors"
                      >
                        {sorting.field === column.key ? (
                          sorting.order === "asc" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <div className="flex flex-col">
                            <ChevronUp className="w-3 h-3 text-text-tertiary" />
                            <ChevronDown className="w-3 h-3 text-text-tertiary -mt-1" />
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">操作</th>}
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {data.map((row, index) => (
              <tr
                key={index}
                className="hover:bg-bg-page transition-colors"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-text-primary"
                  >
                    {renderCell(column, row)}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">
              共 {pagination.total} 条
            </span>
            <select
              value={pagination.pageSize}
              onChange={(e) =>
                pagination.onPageSizeChange(Number(e.target.value))
              }
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value={10}>10 条/页</option>
              <option value={20}>20 条/页</option>
              <option value={50}>50 条/页</option>
              <option value={100}>100 条/页</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm text-gray-700">
              第 {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize)} 页
            </span>

            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={
                pagination.page >=
                Math.ceil(pagination.total / pagination.pageSize)
              }
              className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

