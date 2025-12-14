import { apiClient, withRetry } from "./client";
import type {
  ApiResponse,
  PaginatedResponse,
} from "@/types/api";

// 通知状态
export type NotificationStatus = "DRAFT" | "SCHEDULED" | "SENT" | "FAILED";

// 通知渠道
export type NotificationChannel = "INBOX" | "EMAIL" | "SMS";

// 通知
export interface Notification {
  id: string;
  targetType: string;
  title: string;
  content: string;
  sendChannels: NotificationChannel[];
  status: NotificationStatus;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 通知查询参数
export interface NotificationQueryParams {
  page?: number;
  pageSize?: number;
  targetType?: string;
  status?: NotificationStatus;
}

// 创建通知请求
export interface CreateNotificationRequest {
  targetType: string;
  title: string;
  content: string;
  sendChannels: NotificationChannel[];
}

/**
 * 获取通知列表（支持筛选）
 */
export async function getNotifications(
  params: NotificationQueryParams = {}
): Promise<PaginatedResponse<Notification>> {
  const response = await withRetry(() =>
    apiClient.get<ApiResponse<Notification[]>>("/notifications", { params })
  );

  const apiResponse = response.data as ApiResponse<Notification[]>;
  const notifications = apiResponse.data || [];
  const meta = apiResponse.meta || {
    page: 1,
    pageSize: 20,
    total: 0,
  };

  return {
    items: notifications,
    meta: {
      page: meta.page || 1,
      pageSize: meta.pageSize || 20,
      total: meta.total || 0,
      totalPages: Math.ceil((meta.total || 0) / (meta.pageSize || 20)),
    },
  };
}

/**
 * 创建通知
 */
export async function createNotification(
  data: CreateNotificationRequest
): Promise<Notification> {
  const response = await withRetry(() =>
    apiClient.post<ApiResponse<Notification>>("/notifications", data)
  );

  const apiResponse = response.data as ApiResponse<Notification>;
  return apiResponse.data;
}

