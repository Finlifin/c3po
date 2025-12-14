"use client";

import { useEffect, useState } from "react";
import { Plus, FileText, Mail, MessageSquare, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FormModal } from "@/components/ui/FormModal";
import { FormField } from "@/components/forms/FormField";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getNotifications,
  createNotification,
  type Notification,
  type NotificationStatus,
  type NotificationChannel,
} from "@/lib/api/notifications";
import { useToast } from "@/lib/hooks/useToast";

// 通知创建表单 schema
const notificationSchema = z.object({
  targetType: z.string().min(1, "目标类型不能为空"),
  title: z.string().min(1, "标题不能为空").max(128, "标题最多128个字符"),
  content: z.string().min(1, "内容不能为空").max(4096, "内容最多4096个字符"),
  sendChannels: z
    .array(z.enum(["INBOX", "EMAIL", "SMS"]))
    .min(1, "至少选择一个发送渠道"),
});

type NotificationForm = z.infer<typeof notificationSchema>;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [targetTypeFilter, setTargetTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | "">("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<NotificationForm>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      targetType: "",
      title: "",
      content: "",
      sendChannels: [],
    },
  });

  const selectedChannels = watch("sendChannels") || [];

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params: {
        page: number;
        pageSize: number;
        targetType?: string;
        status?: NotificationStatus;
      } = {
        page,
        pageSize,
      };

      if (targetTypeFilter) {
        params.targetType = targetTypeFilter;
      }
      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await getNotifications(params);
      setNotifications(response.items);
      setTotal(response.meta.total);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "加载通知列表失败";
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [page, pageSize, targetTypeFilter, statusFilter]);

  // 格式化通知状态
  const formatNotificationStatus = (status: NotificationStatus) => {
    const statusMap: Record<NotificationStatus, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
      DRAFT: {
        label: "草稿",
        icon: <FileText className="w-4 h-4" />,
        color: "text-gray-600",
        bgColor: "bg-gray-100",
      },
      SCHEDULED: {
        label: "已计划",
        icon: <Clock className="w-4 h-4" />,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      SENT: {
        label: "已发送",
        icon: <CheckCircle2 className="w-4 h-4" />,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
      FAILED: {
        label: "发送失败",
        icon: <XCircle className="w-4 h-4" />,
        color: "text-red-600",
        bgColor: "bg-red-100",
      },
    };
    return statusMap[status];
  };

  // 格式化发送渠道
  const formatChannel = (channel: NotificationChannel): string => {
    const channelMap: Record<NotificationChannel, string> = {
      INBOX: "站内信",
      EMAIL: "邮件",
      SMS: "短信",
    };
    return channelMap[channel] || channel;
  };

  const handleCreate = async (data: NotificationForm) => {
    try {
      await createNotification(data);
      showSuccess("通知创建成功");
      setCreateModalOpen(false);
      reset();
      loadNotifications();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "创建通知失败";
      showError(errorMessage);
    }
  };

  const toggleChannel = (channel: NotificationChannel) => {
    const current = selectedChannels;
    if (current.includes(channel)) {
      setValue(
        "sendChannels",
        current.filter((c) => c !== channel)
      );
    } else {
      setValue("sendChannels", [...current, channel]);
    }
  };

  const columns: Column<Notification>[] = [
    {
      key: "targetType",
      label: "目标类型",
      render: (value) => <span className="font-medium">{value as string}</span>,
    },
    {
      key: "title",
      label: "标题",
      render: (value) => <span className="font-medium">{value as string}</span>,
    },
    {
      key: "content",
      label: "内容",
      render: (value) => (
        <div className="max-w-md">
          <p className="text-sm text-gray-600 line-clamp-2">
            {value as string}
          </p>
        </div>
      ),
    },
    {
      key: "sendChannels",
      label: "发送渠道",
      render: (value) => {
        const channels = value as NotificationChannel[];
        return (
          <div className="flex flex-wrap gap-2">
            {channels.map((channel) => (
              <span
                key={channel}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {channel === "INBOX" && <MessageSquare className="w-3 h-3" />}
                {channel === "EMAIL" && <Mail className="w-3 h-3" />}
                {channel === "SMS" && <MessageSquare className="w-3 h-3" />}
                {formatChannel(channel)}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: "status",
      label: "状态",
      render: (value) => {
        const statusInfo = formatNotificationStatus(value as NotificationStatus);
        return (
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} ${statusInfo.bgColor}`}
          >
            {statusInfo.icon}
            {statusInfo.label}
          </span>
        );
      },
    },
    {
      key: "sentAt",
      label: "发送时间",
      render: (value) =>
        value ? (
          <span>{new Date(value as string).toLocaleString("zh-CN")}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "createdAt",
      label: "创建时间",
      render: (value) => (
        <span>{new Date(value as string).toLocaleString("zh-CN")}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">通知管理</h1>
        <button
          onClick={() => {
            reset();
            setCreateModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          创建通知
        </button>
      </div>

      {/* 筛选器 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目标类型
            </label>
            <input
              type="text"
              value={targetTypeFilter}
              onChange={(e) => {
                setTargetTypeFilter(e.target.value);
                setPage(1);
              }}
              placeholder="输入目标类型"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              状态
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as NotificationStatus | "");
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">全部</option>
              <option value="DRAFT">草稿</option>
              <option value="SCHEDULED">已计划</option>
              <option value="SENT">已发送</option>
              <option value="FAILED">发送失败</option>
            </select>
          </div>
        </div>
      </div>

      {/* 通知列表 */}
      <DataTable
        columns={columns}
        data={notifications}
        loading={loading}
        pagination={{
          page,
          pageSize,
          total,
          onPageChange: setPage,
          onPageSizeChange: (newPageSize) => {
            setPageSize(newPageSize);
            setPage(1);
          },
        }}
        emptyMessage="暂无通知记录"
      />

      {/* 创建通知模态框 */}
      <FormModal
        open={createModalOpen}
        title="创建通知"
        onClose={() => {
          setCreateModalOpen(false);
          reset();
        }}
        onSubmit={handleSubmit(handleCreate)}
        loading={isSubmitting}
        submitText="创建并发送"
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目标类型 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("targetType")}
              type="text"
              placeholder="例如：ALL, STUDENT, TEACHER"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                errors.targetType ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.targetType && (
              <p className="mt-1 text-sm text-red-600">{errors.targetType.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题 <span className="text-red-500">*</span>
            </label>
            <input
              {...register("title")}
              type="text"
              placeholder="输入通知标题"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("content")}
              rows={6}
              placeholder="输入通知内容"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                errors.content ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              发送渠道 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {(["INBOX", "EMAIL", "SMS"] as NotificationChannel[]).map((channel) => (
                <label
                  key={channel}
                  className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedChannels.includes(channel)}
                    onChange={() => toggleChannel(channel)}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <div className="flex items-center gap-2">
                    {channel === "INBOX" && <MessageSquare className="w-4 h-4 text-gray-600" />}
                    {channel === "EMAIL" && <Mail className="w-4 h-4 text-gray-600" />}
                    {channel === "SMS" && <MessageSquare className="w-4 h-4 text-gray-600" />}
                    <span>{formatChannel(channel)}</span>
                  </div>
                </label>
              ))}
            </div>
            {errors.sendChannels && (
              <p className="mt-1 text-sm text-red-600">{errors.sendChannels.message}</p>
            )}
          </div>
        </form>
      </FormModal>
    </div>
  );
}

