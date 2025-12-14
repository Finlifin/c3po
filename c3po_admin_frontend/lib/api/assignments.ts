import { apiClient, withRetry } from "./client";
import type { ApiResponse, Assignment, Submission, QuizAttempt } from "@/types/api";

/**
 * 获取课程的所有作业列表
 * @param courseId 课程ID
 * @returns 作业列表（包含提交率、逾期率）
 */
export async function getAssignments(
  courseId: string
): Promise<Assignment[]> {
  const response = await withRetry(() =>
    apiClient.get<ApiResponse<Assignment[]>>(
      `/courses/${courseId}/assignments`
    )
  );

  const apiResponse = response.data as ApiResponse<Assignment[]>;
  return apiResponse.data || [];
}

/**
 * 获取单个作业详情
 * @param assignmentId 作业ID
 * @returns 作业详情
 */
export async function getAssignment(
  assignmentId: string
): Promise<Assignment> {
  const response = await withRetry(() =>
    apiClient.get<ApiResponse<Assignment>>(`/assignments/${assignmentId}`)
  );

  const apiResponse = response.data as ApiResponse<Assignment>;
  return apiResponse.data;
}

/**
 * 获取作业的所有提交列表
 * @param assignmentId 作业ID
 * @returns 提交列表
 */
export async function getSubmissions(
  assignmentId: string
): Promise<Submission[]> {
  const response = await withRetry(() =>
    apiClient.get<ApiResponse<Submission[]>>(
      `/assignments/${assignmentId}/submissions`
    )
  );

  const apiResponse = response.data as ApiResponse<Submission[]>;
  return apiResponse.data || [];
}

/**
 * 获取单个提交详情
 * @param submissionId 提交ID
 * @returns 提交详情（包含附件、评分、反馈、Rubric）
 */
export async function getSubmission(
  submissionId: string
): Promise<Submission> {
  const response = await withRetry(() =>
    apiClient.get<ApiResponse<Submission>>(`/submissions/${submissionId}`)
  );

  const apiResponse = response.data as ApiResponse<Submission>;
  return apiResponse.data;
}

/**
 * 获取作业的所有测验尝试记录
 * @param assignmentId 作业ID（必须是 QUIZ 类型）
 * @returns 测验尝试列表
 */
export async function getQuizAttempts(
  assignmentId: string
): Promise<QuizAttempt[]> {
  const response = await withRetry(() =>
    apiClient.get<ApiResponse<QuizAttempt[]>>(
      `/assignments/${assignmentId}/quiz-attempts`
    )
  );

  const apiResponse = response.data as ApiResponse<QuizAttempt[]>;
  return apiResponse.data || [];
}

