"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Activity, ClipboardList, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { LineChart } from "@/components/charts/LineChart";
import {
  getDashboardOverview,
  getDashboardUsageTrend,
  getDashboardPendingTasks,
} from "@/lib/api/dashboard";
import type { DashboardOverview, UsageTrend, PendingTasks } from "@/types/api";
import { useToast } from "@/lib/hooks/useToast";

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [usageTrend, setUsageTrend] = useState<UsageTrend | null>(null);
  const [pendingTasks, setPendingTasks] = useState<PendingTasks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { error: showError } = useToast();

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 并行加载所有数据
      const [overviewData, trendData, tasksData] = await Promise.all([
        getDashboardOverview(),
        getDashboardUsageTrend(7),
        getDashboardPendingTasks(),
      ]);

      setOverview(overviewData);
      setUsageTrend(trendData);
      setPendingTasks(tasksData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "加载仪表板数据失败";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // 设置自动刷新（每30秒）
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 转换使用趋势数据为图表格式
  const chartData =
    usageTrend?.dates.map((date, index) => ({
      name: new Date(date).toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric",
      }),
      活跃用户: usageTrend.activeUsers[index] || 0,
      课程访问: usageTrend.courseVisits[index] || 0,
      作业提交: usageTrend.assignmentSubmissions[index] || 0,
    })) || [];

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-danger"></div>
        <p className="ml-4 text-text-secondary">加载中...</p>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.2)] rounded-[var(--border-radius)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-danger" />
          <h3 className="text-lg font-semibold text-danger">加载失败</h3>
        </div>
        <p className="text-danger mb-4">{error}</p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-danger text-white rounded-[var(--border-radius)] hover:opacity-90 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 概览统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="总成员数"
          value={overview?.totalMembers.toLocaleString() || "0"}
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard
          title="活跃成员数"
          value={overview?.activeMembers.toLocaleString() || "0"}
          icon={<Activity className="w-6 h-6" />}
        />
        <StatCard
          title="活动总数"
          value={overview?.totalActivities.toLocaleString() || "0"}
          icon={<ClipboardList className="w-6 h-6" />}
        />
        <StatCard
          title="待审批数"
          value={overview?.pendingApplications.toLocaleString() || "0"}
          icon={<AlertCircle className="w-6 h-6" />}
        />
      </div>

      {/* 使用趋势图表 */}
      <div className="bg-card rounded-[var(--border-radius)] border border-border p-6 shadow-light">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          使用趋势（最近 7 天）
        </h2>
        {chartData.length > 0 ? (
          <LineChart
            data={chartData}
            lines={[
              { dataKey: "活跃用户", name: "活跃用户", color: "#FF3B30" },
              { dataKey: "课程访问", name: "课程访问", color: "#007AFF" },
              { dataKey: "作业提交", name: "作业提交", color: "#34C759" },
            ]}
            height={300}
          />
        ) : (
          <div className="h-64 flex items-center justify-center text-text-tertiary">
            暂无数据
          </div>
        )}
      </div>

      {/* 待处理任务 */}
      <div className="bg-card rounded-[var(--border-radius)] border border-border p-6 shadow-light">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">待处理任务</h2>
          {pendingTasks && pendingTasks.pendingApplications > 0 && (
            <Link
              href="/approvals"
              className="text-sm text-danger hover:opacity-80 font-medium transition-colors"
            >
              查看全部 →
            </Link>
          )}
        </div>

        {pendingTasks ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[rgba(255,59,48,0.1)] rounded-[var(--border-radius)]">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-danger" />
                <div>
                  <p className="font-medium text-text-primary">待审批申请</p>
                  <p className="text-sm text-text-secondary">
                    有 {pendingTasks.pendingApplications} 个待审批申请
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-danger">
                {pendingTasks.pendingApplications}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-bg-page rounded-[var(--border-radius)]">
                <p className="text-sm text-text-secondary">活动总数</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {pendingTasks.activityCount}
                </p>
              </div>
              <div className="p-4 bg-bg-page rounded-[var(--border-radius)]">
                <p className="text-sm text-text-secondary">活跃成员</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {pendingTasks.activeMembers}
                </p>
              </div>
              <div className="p-4 bg-bg-page rounded-[var(--border-radius)]">
                <p className="text-sm text-text-secondary">总成员数</p>
                <p className="text-2xl font-bold text-text-primary mt-1">
                  {pendingTasks.totalMembers}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-text-tertiary py-8">暂无待处理任务</div>
        )}
      </div>
    </div>
  );
}

