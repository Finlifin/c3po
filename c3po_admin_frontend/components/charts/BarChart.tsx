"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface BarChartDataPoint {
  name: string;
  [key: string]: string | number;
}

interface BarChartProps {
  data: BarChartDataPoint[];
  bars: Array<{
    dataKey: string;
    name: string;
    color?: string;
  }>;
  height?: number;
}

export function BarChart({ data, bars, height = 300 }: BarChartProps) {
  const colors = [
    "#ef4444", // red
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#8b5cf6", // purple
  ];

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
            }}
          />
          <Legend />
          {bars.map((bar, index) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.color || colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

