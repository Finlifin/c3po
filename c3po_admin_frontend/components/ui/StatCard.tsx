"use client";

import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  className = "",
}: StatCardProps) {
  const isPositiveTrend = trend && trend.value >= 0;

  return (
    <div
      className={`
        bg-card rounded-[var(--border-radius)] border border-border p-6
        shadow-light hover:shadow-medium transition-shadow
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
        {icon && <div className="text-text-tertiary">{icon}</div>}
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-3xl font-bold text-text-primary">{value}</div>
        {trend && (
          <div
            className={`
              flex items-center gap-1 text-sm font-medium
              ${isPositiveTrend ? "text-success" : "text-danger"}
            `}
          >
            {isPositiveTrend ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>
              {isPositiveTrend ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-text-tertiary text-xs ml-1">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}

