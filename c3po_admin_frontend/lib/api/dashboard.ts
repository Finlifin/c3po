import { apiClient, withRetry } from "./client";
import type {
  DashboardOverview,
  UsageTrend,
  PendingTasks,
} from "@/types/api";

/**
 * 获取仪表板概览数据
 */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  const response = await withRetry(() =>
    apiClient.get<DashboardOverview>("/dashboard/overview")
  );

  return (
    (response.data as unknown as { data?: DashboardOverview }).data ||
    (response.data as DashboardOverview)
  );
}

/**
 * 获取使用趋势数据
 * @param days 天数，默认 7 天
 */
export async function getDashboardUsageTrend(
  days: number = 7
): Promise<UsageTrend> {
  const response = await withRetry(() =>
    apiClient.get<UsageTrend>("/dashboard/usage-trend", {
      params: { days },
    })
  );

  return (
    (response.data as unknown as { data?: UsageTrend }).data ||
    (response.data as UsageTrend)
  );
}

/**
 * 获取待处理任务
 */
export async function getDashboardPendingTasks(): Promise<PendingTasks> {
  const response = await withRetry(() =>
    apiClient.get<PendingTasks>("/dashboard/pending-tasks")
  );

  return (
    (response.data as unknown as { data?: PendingTasks }).data ||
    (response.data as PendingTasks)
  );
}

