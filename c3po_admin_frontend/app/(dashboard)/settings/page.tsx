"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings, Save, AlertCircle } from "lucide-react";
import { FormField } from "@/components/forms/FormField";
import {
  getSystemSettings,
  updateSystemSettings,
  type SystemSettings,
  type UpdateSystemSettingsRequest,
} from "@/lib/api/settings";
import { useToast } from "@/lib/hooks/useToast";

// 维护窗口表单验证 schema
const maintenanceWindowSchema = z
  .object({
    enabled: z.boolean(),
    startTime: z.string().min(1, "开始时间是必填项"),
    endTime: z.string().min(1, "结束时间是必填项"),
  })
  .refine(
    (data) => {
      if (!data.enabled) return true;
      if (!data.startTime || !data.endTime) return true;
      return new Date(data.startTime) < new Date(data.endTime);
    },
    {
      message: "开始时间必须早于结束时间",
      path: ["endTime"],
    }
  );

// 密码策略表单验证 schema
const passwordPolicySchema = z.object({
  minLength: z
    .number()
    .min(6, "最小长度不能少于6")
    .max(128, "最小长度不能超过128"),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumbers: z.boolean(),
  requireSpecialChars: z.boolean(),
  expirationDays: z
    .number()
    .min(0, "过期天数不能为负数")
    .max(3650, "过期天数不能超过3650天"),
});

// 告警阈值表单验证 schema
const alertThresholdsSchema = z.object({
  maxFailedLoginAttempts: z
    .number()
    .min(1, "最大失败登录次数至少为1")
    .max(100, "最大失败登录次数不能超过100"),
  systemLoadThreshold: z
    .number()
    .min(0, "系统负载阈值不能为负数")
    .max(100, "系统负载阈值不能超过100"),
  diskUsageThreshold: z
    .number()
    .min(0, "磁盘使用率阈值不能为负数")
    .max(100, "磁盘使用率阈值不能超过100"),
  memoryUsageThreshold: z
    .number()
    .min(0, "内存使用率阈值不能为负数")
    .max(100, "内存使用率阈值不能超过100"),
});

// 完整表单 schema
const settingsFormSchema = z.object({
  maintenanceWindow: maintenanceWindowSchema,
  passwordPolicy: passwordPolicySchema,
  alertThresholds: alertThresholdsSchema,
});

type SettingsFormData = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      maintenanceWindow: {
        enabled: false,
        startTime: "",
        endTime: "",
      },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: false,
        requireLowercase: false,
        requireNumbers: false,
        requireSpecialChars: false,
        expirationDays: 90,
      },
      alertThresholds: {
        maxFailedLoginAttempts: 5,
        systemLoadThreshold: 80,
        diskUsageThreshold: 85,
        memoryUsageThreshold: 90,
      },
    },
  });

  const maintenanceWindowEnabled = watch("maintenanceWindow.enabled");

  // 加载系统设置
  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSystemSettings();
      setSettings(data);

      // 将数据填充到表单
      reset({
        maintenanceWindow: data.maintenanceWindow,
        passwordPolicy: data.passwordPolicy,
        alertThresholds: data.alertThresholds,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "加载系统设置失败";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // 提交设置更新
  const onSubmit = async (data: SettingsFormData) => {
    try {
      setSaving(true);
      setError(null);

      const updateRequest: UpdateSystemSettingsRequest = {
        maintenanceWindow: data.maintenanceWindow,
        passwordPolicy: data.passwordPolicy,
        alertThresholds: data.alertThresholds,
      };

      const updated = await updateSystemSettings(updateRequest);
      setSettings(updated);

      // 刷新表单数据
      reset({
        maintenanceWindow: updated.maintenanceWindow,
        passwordPolicy: updated.passwordPolicy,
        alertThresholds: updated.alertThresholds,
      });

      success("系统设置已成功更新");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "更新系统设置失败";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <p className="ml-4 text-gray-600">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 维护窗口设置 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            维护窗口设置
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                {...register("maintenanceWindow.enabled")}
                type="checkbox"
                id="maintenanceEnabled"
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label
                htmlFor="maintenanceEnabled"
                className="text-sm font-medium text-gray-700"
              >
                启用维护窗口
              </label>
            </div>

            {maintenanceWindowEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label
                    htmlFor="maintenanceStartTime"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    开始时间 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("maintenanceWindow.startTime")}
                    type="datetime-local"
                    id="maintenanceStartTime"
                    className={`
                      w-full px-4 py-2 border rounded-lg
                      focus:ring-2 focus:ring-red-500 focus:border-red-500
                      ${
                        errors.maintenanceWindow?.startTime
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    `}
                  />
                  {errors.maintenanceWindow?.startTime && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.maintenanceWindow.startTime.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="maintenanceEndTime"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    结束时间 <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("maintenanceWindow.endTime")}
                    type="datetime-local"
                    id="maintenanceEndTime"
                    className={`
                      w-full px-4 py-2 border rounded-lg
                      focus:ring-2 focus:ring-red-500 focus:border-red-500
                      ${
                        errors.maintenanceWindow?.endTime
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    `}
                  />
                  {errors.maintenanceWindow?.endTime && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.maintenanceWindow.endTime.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {settings?.maintenanceWindow && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  当前配置：{" "}
                  {settings.maintenanceWindow.enabled
                    ? `${new Date(
                        settings.maintenanceWindow.startTime
                      ).toLocaleString("zh-CN")} - ${new Date(
                        settings.maintenanceWindow.endTime
                      ).toLocaleString("zh-CN")}`
                    : "未启用"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 密码策略设置 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            密码策略设置
          </h2>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="passwordMinLength"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                最小长度 <span className="text-red-500">*</span>
              </label>
              <input
                {...register("passwordPolicy.minLength", {
                  valueAsNumber: true,
                })}
                type="number"
                id="passwordMinLength"
                min="6"
                max="128"
                className={`
                  w-full px-4 py-2 border rounded-lg
                  focus:ring-2 focus:ring-red-500 focus:border-red-500
                  ${
                    errors.passwordPolicy?.minLength
                      ? "border-red-500"
                      : "border-gray-300"
                  }
                `}
              />
              {errors.passwordPolicy?.minLength && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.passwordPolicy.minLength.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <input
                  {...register("passwordPolicy.requireUppercase")}
                  type="checkbox"
                  id="requireUppercase"
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label
                  htmlFor="requireUppercase"
                  className="text-sm font-medium text-gray-700"
                >
                  要求包含大写字母
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  {...register("passwordPolicy.requireLowercase")}
                  type="checkbox"
                  id="requireLowercase"
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label
                  htmlFor="requireLowercase"
                  className="text-sm font-medium text-gray-700"
                >
                  要求包含小写字母
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  {...register("passwordPolicy.requireNumbers")}
                  type="checkbox"
                  id="requireNumbers"
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label
                  htmlFor="requireNumbers"
                  className="text-sm font-medium text-gray-700"
                >
                  要求包含数字
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  {...register("passwordPolicy.requireSpecialChars")}
                  type="checkbox"
                  id="requireSpecialChars"
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label
                  htmlFor="requireSpecialChars"
                  className="text-sm font-medium text-gray-700"
                >
                  要求包含特殊字符
                </label>
              </div>
            </div>

            <div>
              <label
                htmlFor="passwordExpirationDays"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                密码过期天数（0表示永不过期） <span className="text-red-500">*</span>
              </label>
              <input
                {...register("passwordPolicy.expirationDays", {
                  valueAsNumber: true,
                })}
                type="number"
                id="passwordExpirationDays"
                min="0"
                max="3650"
                className={`
                  w-full px-4 py-2 border rounded-lg
                  focus:ring-2 focus:ring-red-500 focus:border-red-500
                  ${
                    errors.passwordPolicy?.expirationDays
                      ? "border-red-500"
                      : "border-gray-300"
                  }
                `}
              />
              {errors.passwordPolicy?.expirationDays && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.passwordPolicy.expirationDays.message}
                </p>
              )}
            </div>

            {settings?.passwordPolicy && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  当前配置：最小长度 {settings.passwordPolicy.minLength}，过期天数{" "}
                  {settings.passwordPolicy.expirationDays === 0
                    ? "永不过期"
                    : `${settings.passwordPolicy.expirationDays} 天`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 告警阈值设置 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            告警阈值设置
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="maxFailedLoginAttempts"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                最大失败登录次数 <span className="text-red-500">*</span>
              </label>
              <input
                {...register("alertThresholds.maxFailedLoginAttempts", {
                  valueAsNumber: true,
                })}
                type="number"
                id="maxFailedLoginAttempts"
                min="1"
                max="100"
                className={`
                  w-full px-4 py-2 border rounded-lg
                  focus:ring-2 focus:ring-red-500 focus:border-red-500
                  ${
                    errors.alertThresholds?.maxFailedLoginAttempts
                      ? "border-red-500"
                      : "border-gray-300"
                  }
                `}
              />
              {errors.alertThresholds?.maxFailedLoginAttempts && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.alertThresholds.maxFailedLoginAttempts.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="systemLoadThreshold"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                系统负载阈值 (%) <span className="text-red-500">*</span>
              </label>
              <input
                {...register("alertThresholds.systemLoadThreshold", {
                  valueAsNumber: true,
                })}
                type="number"
                id="systemLoadThreshold"
                min="0"
                max="100"
                className={`
                  w-full px-4 py-2 border rounded-lg
                  focus:ring-2 focus:ring-red-500 focus:border-red-500
                  ${
                    errors.alertThresholds?.systemLoadThreshold
                      ? "border-red-500"
                      : "border-gray-300"
                  }
                `}
              />
              {errors.alertThresholds?.systemLoadThreshold && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.alertThresholds.systemLoadThreshold.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="diskUsageThreshold"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                磁盘使用率阈值 (%) <span className="text-red-500">*</span>
              </label>
              <input
                {...register("alertThresholds.diskUsageThreshold", {
                  valueAsNumber: true,
                })}
                type="number"
                id="diskUsageThreshold"
                min="0"
                max="100"
                className={`
                  w-full px-4 py-2 border rounded-lg
                  focus:ring-2 focus:ring-red-500 focus:border-red-500
                  ${
                    errors.alertThresholds?.diskUsageThreshold
                      ? "border-red-500"
                      : "border-gray-300"
                  }
                `}
              />
              {errors.alertThresholds?.diskUsageThreshold && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.alertThresholds.diskUsageThreshold.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="memoryUsageThreshold"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                内存使用率阈值 (%) <span className="text-red-500">*</span>
              </label>
              <input
                {...register("alertThresholds.memoryUsageThreshold", {
                  valueAsNumber: true,
                })}
                type="number"
                id="memoryUsageThreshold"
                min="0"
                max="100"
                className={`
                  w-full px-4 py-2 border rounded-lg
                  focus:ring-2 focus:ring-red-500 focus:border-red-500
                  ${
                    errors.alertThresholds?.memoryUsageThreshold
                      ? "border-red-500"
                      : "border-gray-300"
                  }
                `}
              />
              {errors.alertThresholds?.memoryUsageThreshold && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.alertThresholds.memoryUsageThreshold.message}
                </p>
              )}
            </div>
          </div>

          {settings?.alertThresholds && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                当前配置：失败登录 {settings.alertThresholds.maxFailedLoginAttempts} 次，系统负载{" "}
                {settings.alertThresholds.systemLoadThreshold}%，磁盘使用率{" "}
                {settings.alertThresholds.diskUsageThreshold}%，内存使用率{" "}
                {settings.alertThresholds.memoryUsageThreshold}%
              </p>
            </div>
          )}
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => loadSettings()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={saving}
          >
            重置
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存设置
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

