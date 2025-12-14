import { apiClient, withRetry } from "./client";
import type {
  ApiResponse,
  PaginatedResponse,
} from "@/types/api";

// 审批状态
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

// 审批类型
export type ApprovalType = "COURSE_PUBLISH" | "COURSE_DROP_AFTER_DEADLINE" | "SCORE_APPEAL";

// 审批请求
export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  status: ApprovalStatus;
  applicantId: string;
  payload: string; // JSON string
  processedBy?: string;
  comment?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 审批查询参数
export interface ApprovalQueryParams {
  page?: number;
  pageSize?: number;
  status?: ApprovalStatus;
  type?: ApprovalType;
}

// 审批决策请求
export interface ApprovalDecisionRequest {
  status: ApprovalStatus;
  comment?: string;
}

/**
 * 获取审批列表（支持筛选）
 */
export async function getApprovals(
  params: ApprovalQueryParams = {}
): Promise<PaginatedResponse<ApprovalRequest>> {
  const response = await withRetry(() =>
    apiClient.get<ApiResponse<ApprovalRequest[]>>("/admin/approvals", { params })
  );

  const apiResponse = response.data as ApiResponse<ApprovalRequest[]>;
  const approvals = apiResponse.data || [];
  const meta = apiResponse.meta || {
    page: 1,
    pageSize: 20,
    total: 0,
  };

  return {
    items: approvals,
    meta: {
      page: meta.page || 1,
      pageSize: meta.pageSize || 20,
      total: meta.total || 0,
      totalPages: Math.ceil((meta.total || 0) / (meta.pageSize || 20)),
    },
  };
}

/**
 * 处理审批决策
 */
export async function processApproval(
  requestId: string,
  decision: ApprovalDecisionRequest
): Promise<ApprovalRequest> {
  const response = await withRetry(() =>
    apiClient.post<ApiResponse<ApprovalRequest>>(
      `/admin/approvals/${requestId}/decision`,
      decision
    )
  );

  const apiResponse = response.data as ApiResponse<ApprovalRequest>;
  return apiResponse.data;
}

