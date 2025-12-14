"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Calendar, CheckCircle, XCircle } from "lucide-react";
import { getAssignment, getSubmissions, getQuizAttempts } from "@/lib/api/assignments";
import type { Assignment, Submission, QuizAttempt } from "@/types/api";
import { useToast } from "@/lib/hooks/useToast";
import Link from "next/link";

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { error: showError } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [assignmentData, submissionsData] = await Promise.all([
        getAssignment(assignmentId),
        getSubmissions(assignmentId),
      ]);

      setAssignment(assignmentData);
      setSubmissions(submissionsData);

      // 如果是测验类型，加载测验尝试记录
      if (assignmentData.type === "QUIZ") {
        try {
          const attempts = await getQuizAttempts(assignmentId);
          setQuizAttempts(attempts);
        } catch (err) {
          // 如果获取测验尝试失败，不影响主流程
          console.error("Failed to load quiz attempts:", err);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "加载作业详情失败";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assignmentId) {
      loadData();
    }
  }, [assignmentId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      ASSIGNMENT: "作业",
      QUIZ: "测验",
      PROJECT: "项目",
    };
    return typeMap[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      SUBMITTED: { label: "已提交", color: "bg-blue-100 text-blue-800" },
      RESUBMITTED: { label: "已重提", color: "bg-yellow-100 text-yellow-800" },
      GRADED: { label: "已评分", color: "bg-green-100 text-green-800" },
      APPEALED: { label: "已申诉", color: "bg-orange-100 text-orange-800" },
      IN_PROGRESS: { label: "进行中", color: "bg-gray-100 text-gray-800" },
    };
    return statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <p className="ml-4 text-gray-600">加载中...</p>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <XCircle className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900">加载失败</h3>
        </div>
        <p className="text-red-700 mb-4">{error || "作业不存在"}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <Link
        href="/assignments"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回作业列表
      </Link>

      {/* 作业基本信息 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                {getTypeLabel(assignment.type)}
              </span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  assignment.published
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {assignment.published ? "已发布" : "未发布"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">截止时间</p>
              <p className="text-base font-medium text-gray-900">
                {formatDate(assignment.deadline)}
              </p>
            </div>
          </div>

          {assignment.releaseAt && (
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">发布时间</p>
                <p className="text-base font-medium text-gray-900">
                  {formatDate(assignment.releaseAt)}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">重提交设置</p>
              <p className="text-base font-medium text-gray-900">
                {assignment.allowResubmit
                  ? `允许，最多 ${assignment.maxResubmit} 次`
                  : "不允许"}
              </p>
            </div>
          </div>
        </div>

        {/* 评分标准 */}
        {assignment.gradingRubric && assignment.gradingRubric.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">评分标准</h3>
            <div className="space-y-2">
              {assignment.gradingRubric.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-900">
                    {item.criterion}
                  </span>
                  <span className="text-sm text-gray-600">
                    权重: {(item.weight * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 提交列表 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">提交列表</h2>
          <span className="text-sm text-gray-600">
            共 {submissions.length} 份提交
          </span>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无提交</div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => {
              const statusInfo = getStatusLabel(submission.status);
              return (
                <Link
                  key={submission.id}
                  href={`/assignments/${assignmentId}/submissions/${submission.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          学生 ID: {submission.studentId}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                        {submission.score !== null && (
                          <span className="text-sm font-semibold text-gray-900">
                            得分: {submission.score}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {submission.submittedAt && (
                          <span>提交时间: {formatDate(submission.submittedAt)}</span>
                        )}
                        {submission.resubmitCount > 0 && (
                          <span>重提交次数: {submission.resubmitCount}</span>
                        )}
                        {submission.attachments.length > 0 && (
                          <span>附件数: {submission.attachments.length}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 text-red-600">查看详情 →</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* 测验尝试记录（仅测验类型显示） */}
      {assignment.type === "QUIZ" && quizAttempts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">测验尝试记录</h2>
          <div className="space-y-4">
            {quizAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    学生 ID: {attempt.studentId}
                  </span>
                  {attempt.score !== null && (
                    <span className="text-sm font-semibold text-gray-900">
                      得分: {attempt.score}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>开始时间: {formatDate(attempt.startedAt)}</span>
                  {attempt.submittedAt && (
                    <span>提交时间: {formatDate(attempt.submittedAt)}</span>
                  )}
                  {attempt.durationSeconds && (
                    <span>
                      用时: {Math.floor(attempt.durationSeconds / 60)} 分钟
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

