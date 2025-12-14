import { apiClient, withRetry } from "./client";
import type {
  StudentScoresResponse,
  CourseScoresResponse,
  CourseAnalyticsResponse,
} from "@/types/api";

/**
 * 获取学生成绩
 * @param studentId 学生 ID
 */
export async function getStudentScores(
  studentId: string
): Promise<StudentScoresResponse> {
  const response = await withRetry(() =>
    apiClient.get<StudentScoresResponse>(`/students/${studentId}/scores`)
  );

  return (
    (response.data as unknown as { data?: StudentScoresResponse }).data ||
    (response.data as StudentScoresResponse)
  );
}

/**
 * 获取课程成绩统计
 * @param courseId 课程 ID
 * @param component 可选：成绩组件筛选（如 "作业"、"考试"）
 * @param studentId 可选：学生 ID 筛选
 */
export async function getCourseScores(
  courseId: string,
  component?: string,
  studentId?: string
): Promise<CourseScoresResponse> {
  const params: Record<string, string> = {};
  if (component) {
    params.component = component;
  }
  if (studentId) {
    params.studentId = studentId;
  }

  const response = await withRetry(() =>
    apiClient.get<CourseScoresResponse>(`/courses/${courseId}/scores`, {
      params,
    })
  );

  return (
    (response.data as unknown as { data?: CourseScoresResponse }).data ||
    (response.data as CourseScoresResponse)
  );
}

/**
 * 获取课程分析
 * @param courseId 课程 ID
 */
export async function getCourseAnalytics(
  courseId: string
): Promise<CourseAnalyticsResponse> {
  const response = await withRetry(() =>
    apiClient.get<CourseAnalyticsResponse>(
      `/courses/${courseId}/analytics/overview`
    )
  );

  return (
    (response.data as unknown as { data?: CourseAnalyticsResponse }).data ||
    (response.data as CourseAnalyticsResponse)
  );
}

