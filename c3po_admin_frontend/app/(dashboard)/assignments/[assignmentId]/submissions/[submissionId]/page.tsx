"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Download, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { getSubmission, getAssignment } from "@/lib/api/assignments";
import type { Submission, Assignment } from "@/types/api";
import { useToast } from "@/lib/hooks/useToast";
import Link from "next/link";

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;
  const submissionId = params.submissionId as string;
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { error: showError } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [submissionData, assignmentData] = await Promise.all([
        getSubmission(submissionId),
        getAssignment(assignmentId),
      ]);

      setSubmission(submissionData);
      setAssignment(assignmentData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "加载提交详情失败";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (submissionId && assignmentId) {
      loadData();
    }
  }, [submissionId, assignmentId]);

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

  const handleDownload = (url: string, filename?: string) => {
    // 在新窗口打开下载链接
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <p className="ml-4 text-gray-600">加载中...</p>
      </div>
    );
  }

  if (error || !submission || !assignment) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <XCircle className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900">加载失败</h3>
        </div>
        <p className="text-red-700 mb-4">{error || "提交不存在"}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          返回
        </button>
      </div>
    );
  }

  const statusInfo = getStatusLabel(submission.status);

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <Link
        href={`/assignments/${assignmentId}`}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回作业详情
      </Link>

      {/* 提交基本信息 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {assignment.title} - 提交详情
            </h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                学生 ID: {submission.studentId}
              </span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}
              >
                {statusInfo.label}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">提交时间</p>
              <p className="text-base font-medium text-gray-900">
                {formatDate(submission.submittedAt)}
              </p>
            </div>
          </div>

          {submission.score !== null && (
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">得分</p>
                <p className="text-base font-medium text-gray-900">
                  {submission.score} / 100
                </p>
              </div>
            </div>
          )}

          {submission.resubmitCount > 0 && (
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">重提交次数</p>
                <p className="text-base font-medium text-gray-900">
                  {submission.resubmitCount}
                </p>
              </div>
            </div>
          )}

          {submission.gradingTeacherId && (
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">评分教师</p>
                <p className="text-base font-medium text-gray-900">
                  {submission.gradingTeacherId}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 附件 */}
      {submission.attachments && submission.attachments.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">附件</h2>
          <div className="space-y-2">
            {submission.attachments.map((url, index) => {
              // 尝试从URL提取文件名
              const filename = url.split("/").pop() || `附件 ${index + 1}`;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-900">{filename}</span>
                  </div>
                  <button
                    onClick={() => handleDownload(url, filename)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    下载
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 评分和反馈 */}
      {(submission.score !== null || submission.feedback) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">评分和反馈</h2>
          {submission.score !== null && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">总分</p>
              <p className="text-2xl font-bold text-gray-900">
                {submission.score} / 100
              </p>
            </div>
          )}
          {submission.feedback && (
            <div>
              <p className="text-sm text-gray-600 mb-2">教师反馈</p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {submission.feedback}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rubric 评分 */}
      {submission.rubricScores && submission.rubricScores.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">评分标准详情</h2>
          <div className="space-y-3">
            {submission.rubricScores.map((rubric, index) => {
              // 尝试从作业的评分标准中获取权重
              const assignmentRubric = assignment.gradingRubric?.find(
                (r) => r.criterion === rubric.criterion
              );
              const maxScore = assignmentRubric
                ? assignmentRubric.weight * 100
                : 100;

              return (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {rubric.criterion}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {rubric.score} / {maxScore.toFixed(0)}
                    </span>
                  </div>
                  {assignmentRubric && (
                    <p className="text-xs text-gray-600">
                      权重: {(assignmentRubric.weight * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 申诉信息 */}
      {submission.appealReason && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            <h2 className="text-lg font-semibold text-orange-900">申诉信息</h2>
          </div>
          <div className="mb-4">
            <p className="text-sm text-orange-700 mb-2">申诉原因</p>
            <div className="p-4 bg-white rounded-lg border border-orange-200">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {submission.appealReason}
              </p>
            </div>
          </div>
          {submission.appealedAt && (
            <p className="text-sm text-orange-700">
              申诉时间: {formatDate(submission.appealedAt)}
            </p>
          )}
        </div>
      )}

      {/* 时间戳信息 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">时间信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">创建时间</p>
            <p className="text-base font-medium text-gray-900 mt-1">
              {formatDate(submission.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">更新时间</p>
            <p className="text-base font-medium text-gray-900 mt-1">
              {formatDate(submission.updatedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

