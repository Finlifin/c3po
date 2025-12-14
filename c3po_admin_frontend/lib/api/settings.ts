import { apiClient, withRetry } from "./client";
import type { ApiResponse } from "@/types/api";

// 系统设置类型定义
export interface MaintenanceWindow {
  startTime: string; // ISO 8601 datetime string
  endTime: string; // ISO 8601 datetime string
  enabled: boolean;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expirationDays: number;
}

export interface AlertThresholds {
  maxFailedLoginAttempts: number;
  systemLoadThreshold: number;
  diskUsageThreshold: number; // percentage
  memoryUsageThreshold: number; // percentage
}

export interface SystemSettings {
  maintenanceWindow: MaintenanceWindow;
  passwordPolicy: PasswordPolicy;
  alertThresholds: AlertThresholds;
  updatedAt?: string;
}

export interface UpdateSystemSettingsRequest {
  maintenanceWindow?: Partial<MaintenanceWindow>;
  passwordPolicy?: Partial<PasswordPolicy>;
  alertThresholds?: Partial<AlertThresholds>;
}

/**
 * 获取系统设置
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  const response = await withRetry(() =>
    apiClient.get<ApiResponse<SystemSettings>>("/admin/system/settings")
  );

  const apiResponse = response.data as ApiResponse<SystemSettings>;
  return apiResponse.data;
}

/**
 * 更新系统设置
 */
export async function updateSystemSettings(
  settings: UpdateSystemSettingsRequest
): Promise<SystemSettings> {
  const response = await withRetry(() =>
    apiClient.put<ApiResponse<SystemSettings>>(
      "/admin/system/settings",
      settings
    )
  );

  const apiResponse = response.data as ApiResponse<SystemSettings>;
  return apiResponse.data;
}

