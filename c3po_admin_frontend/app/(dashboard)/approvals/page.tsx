"use client";

import { useEffect, useState, useMemo } from "react";
import { CheckCircle2, XCircle, Clock, Eye } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FormModal } from "@/components/ui/FormModal";
import { FormField } from "@/components/forms/FormField";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getApprovals,
  processApproval,
  type ApprovalRequest,
  type ApprovalStatus,
  type ApprovalType,
} from "@/lib/api/approvals";
import { useToast } from "@/lib/hooks/useToast";

// 审批决策表单 schema
const approvalDecisionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().optional(),
}).refine(
  (data) => {
    // 如果状态是 REJECTED，必须提供 comment
    if (data.status === "REJECTED") {
      return data.comment && data.comment.trim().length > 0;
    }
    return true;
  },
  {
    message: "驳回时必须填写处理意见",
    path: ["comment"],
  }
);

type ApprovalDecisionForm = z.infer<typeof approvalDecisionSchema>;

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "">("");
  const [typeFilter, setTypeFilter] = useState<ApprovalType | "">("");
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<ApprovalDecisionForm>({
    resolver: zodResolver(approvalDecisionSchema),
    defaultValues: {
      status: "APPROVED",
      comment: "",
    },
  });

  const decisionStatus = watch("status");

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const params: {
        page: number;
        pageSize: number;
        status?: ApprovalStatus;
        type?: ApprovalType;
      } = {
        page,
        pageSize,
      };

      if (statusFilter) {
        params.status = statusFilter;
      }
      if (typeFilter) {
        params.type = typeFilter;
      }

      const response = await getApprovals(params);
      setApprovals(response.items);
      setTotal(response.meta.total);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "加载审批列表失败";
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, [page, pageSize, statusFilter, typeFilter]);

  // 解析 payload
  const parsePayload = (payload: string): Record<string, unknown> | null => {
    try {
      return JSON.parse(payload);
    } catch {
      return null;
    }
  };

  // 格式化审批类型
  const formatApprovalType = (type: ApprovalType): string => {
    const typeMap: Record<ApprovalType, string> = {
      COURSE_PUBLISH: "课程发布",
      COURSE_DROP_AFTER_DEADLINE: "逾期退课",
      SCORE_APPEAL: "成绩申诉",
    };
    return typeMap[type] || type;
  };

  // 格式化审批状态
  const formatApprovalStatus = (status: ApprovalStatus) => {
    const statusMap: Record<ApprovalStatus, { label: string; icon: React.ReactNode; color: string }> = {
      PENDING: {
        label: "待审批",
        icon: <Clock className="w-4 h-4" />,
        color: "text-yellow-600",
      },
      APPROVED: {
        label: "已通过",
        icon: <CheckCircle2 className="w-4 h-4" />,
        color: "text-green-600",
      },
      REJECTED: {
        label: "已驳回",
        icon: <XCircle className="w-4 h-4" />,
        color: "text-red-600",
      },
    };
    return statusMap[status];
  };

  const handleDecision = async (data: ApprovalDecisionForm) => {
    if (!selectedApproval) return;

    try {
      await processApproval(selectedApproval.id, {
        status: data.status,
        comment: data.comment,
      });
      showSuccess("审批处理成功");
      setDecisionModalOpen(false);
      setSelectedApproval(null);
      reset();
      loadApprovals();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "处理审批失败";
      showError(errorMessage);
    }
  };

  const openDecisionModal = (approval: ApprovalRequest) => {
    if (approval.status !== "PENDING") {
      showError("只能处理待审批的申请");
      return;
    }
    setSelectedApproval(approval);
    reset({
      status: "APPROVED",
      comment: "",
    });
    setDecisionModalOpen(true);
  };

  const columns: Column<ApprovalRequest>[] = [
    {
      key: "type",
      label: "类型",
      render: (value) => (
        <span className="font-medium">{formatApprovalType(value as ApprovalType)}</span>
      ),
    },
    {
      key: "status",
      label: "状态",
      render: (value) => {
        const statusInfo = formatApprovalStatus(value as ApprovalStatus);
        return (
          <div className={`flex items-center gap-2 ${statusInfo.color}`}>
            {statusInfo.icon}
            <span>{statusInfo.label}</span>
          </div>
        );
      },
    },
    {
      key: "payload",
      label: "申请内容",
      render: (value, row) => {
        const payload = parsePayload(value as string);
        if (!payload) {
          return <span className="text-gray-400">—</span>;
        }
        return (
          <div className="max-w-md">
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        );
      },
    },
    {
      key: "createdAt",
      label: "申请时间",
      render: (value) => (
        <span>{new Date(value as string).toLocaleString("zh-CN")}</span>
      ),
    },
    {
      key: "processedAt",
      label: "处理时间",
      render: (value) =>
        value ? (
          <span>{new Date(value as string).toLocaleString("zh-CN")}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "comment",
      label: "处理意见",
      render: (value) =>
        value ? (
          <span className="text-sm">{value as string}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">审批管理</h1>
      </div>

      {/* 筛选器 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              状态
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ApprovalStatus | "");
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">全部</option>
              <option value="PENDING">待审批</option>
              <option value="APPROVED">已通过</option>
              <option value="REJECTED">已驳回</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              类型
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as ApprovalType | "");
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">全部</option>
              <option value="COURSE_PUBLISH">课程发布</option>
              <option value="COURSE_DROP_AFTER_DEADLINE">逾期退课</option>
              <option value="SCORE_APPEAL">成绩申诉</option>
            </select>
          </div>
        </div>
      </div>

      {/* 审批列表 */}
      <DataTable<ApprovalRequest>
        columns={columns}
        data={approvals}
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
        actions={(row) => (
          <div className="flex items-center gap-2">
            {row.status === "PENDING" && (
              <button
                onClick={() => openDecisionModal(row)}
                className="px-3 py-1 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                处理
              </button>
            )}
          </div>
        )}
        emptyMessage="暂无审批记录"
      />

      {/* 审批决策模态框 */}
      <FormModal
        open={decisionModalOpen}
        title="审批决策"
        onClose={() => {
          setDecisionModalOpen(false);
          setSelectedApproval(null);
          reset();
        }}
        onSubmit={handleSubmit(handleDecision)}
        loading={isSubmitting}
        submitText="提交"
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              决策 <span className="text-red-500">*</span>
            </label>
            <select
              {...register("status")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="APPROVED">通过</option>
              <option value="REJECTED">驳回</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              处理意见 {decisionStatus === "REJECTED" && <span className="text-red-500">*</span>}
            </label>
            <textarea
              {...register("comment")}
              rows={4}
              placeholder={
                decisionStatus === "REJECTED"
                  ? "请填写驳回原因（必填）"
                  : "可选，填写处理意见"
              }
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                errors.comment ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.comment && (
              <p className="mt-1 text-sm text-red-600">{errors.comment.message}</p>
            )}
          </div>

          {selectedApproval && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">申请详情</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">类型：</span>
                  {formatApprovalType(selectedApproval.type)}
                </p>
                <p>
                  <span className="font-medium">申请时间：</span>
                  {new Date(selectedApproval.createdAt).toLocaleString("zh-CN")}
                </p>
                {selectedApproval.payload && (
                  <div>
                    <span className="font-medium">申请内容：</span>
                    <pre className="mt-1 text-xs bg-white p-2 rounded overflow-x-auto">
                      {JSON.stringify(parsePayload(selectedApproval.payload), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </FormModal>
    </div>
  );
}

