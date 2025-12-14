"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, AlertCircle, ClipboardList, BookOpen, Users } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { getAssignments, getSubmissions } from "@/lib/api/assignments";
import type { Assignment } from "@/types/api";
import { useToast } from "@/lib/hooks/useToast";

export default function AssignmentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get("courseId");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { error: showError } = useToast();

  const loadAssignments = async () => {
    try {
      setLoading(true);
      // 无 courseId 时仅展示指引，不请求数据
      if (!courseId) {
        setAssignments([]);
        setError(null);
        setLoading(false);
        return;
      }
      setError(null);

      const assignmentsData = await getAssignments(courseId);

      // 如果后端没有返回提交率和逾期率，我们需要计算它们
      const assignmentsWithMetrics = await Promise.all(
        assignmentsData.map(async (assignment) => {
          // 如果已经有指标，直接返回
          if (
            assignment.submissionRate !== undefined &&
            assignment.overdueRate !== undefined
          ) {
            return assignment;
          }

          // 否则，通过获取提交数据来计算
          try {
            const submissions = await getSubmissions(assignment.id);
            const now = new Date();
            const deadline = new Date(assignment.deadline);

            // 计算提交率（假设需要知道总学生数，这里简化处理）
            // 实际应该从课程学生数获取，这里暂时用提交数作为参考
            const submittedCount = submissions.filter(
              (s) => s.submittedAt !== null
            ).length;
            const totalCount = submissions.length;
            const submissionRate =
              totalCount > 0 ? (submittedCount / totalCount) * 100 : 0;

            // 计算逾期率
            const overdueCount = submissions.filter((s) => {
              if (!s.submittedAt) return false;
              const submittedAt = new Date(s.submittedAt);
              return submittedAt > deadline;
            }).length;
            const overdueRate =
              totalCount > 0 ? (overdueCount / totalCount) * 100 : 0;

            return {
              ...assignment,
              submissionRate: Math.round(submissionRate * 100) / 100,
              overdueRate: Math.round(overdueRate * 100) / 100,
            };
          } catch (err) {
            // 如果获取提交失败，返回默认值
            return {
              ...assignment,
              submissionRate: 0,
              overdueRate: 0,
            };
          }
        })
      );

      setAssignments(assignmentsWithMetrics);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "加载作业列表失败";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [courseId]);

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

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined) return "—";
    return `${value.toFixed(1)}%`;
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      ASSIGNMENT: "作业",
      QUIZ: "测验",
      PROJECT: "项目",
    };
    return typeMap[type] || type;
  };

  const columns: Column<Assignment>[] = [
    {
      key: "title",
      label: "作业标题",
      sortable: true,
    },
    {
      key: "type",
      label: "类型",
      render: (value) => (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
          {getTypeLabel(String(value))}
        </span>
      ),
    },
    {
      key: "deadline",
      label: "截止时间",
      render: (value) => (
        <span className="text-sm text-gray-900">
          {formatDate(value as string | null)}
        </span>
      ),
    },
    {
      key: "submissionRate",
      label: "提交率",
      render: (value, row) => {
        const rate = row.submissionRate ?? 0;
        const colorClass =
          rate >= 80
            ? "text-green-600"
            : rate >= 50
            ? "text-yellow-600"
            : "text-red-600";
        return (
          <span className={`font-medium ${colorClass}`}>
            {formatPercentage(rate)}
          </span>
        );
      },
    },
    {
      key: "overdueRate",
      label: "逾期率",
      render: (value, row) => {
        const rate = row.overdueRate ?? 0;
        const colorClass =
          rate === 0
            ? "text-green-600"
            : rate <= 20
            ? "text-yellow-600"
            : "text-red-600";
        return (
          <span className={`font-medium ${colorClass}`}>
            {formatPercentage(rate)}
          </span>
        );
      },
    },
    {
      key: "published",
      label: "状态",
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${
            value
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {value ? "已发布" : "未发布"}
        </span>
      ),
    },
  ];

  const handleViewDetails = (assignment: Assignment) => {
    router.push(`/assignments/${assignment.id}`);
  };

  if (error && !assignments.length) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900">加载失败</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={loadAssignments}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  // 无 courseId 时提供导航指引（从 Dashboard 入口进入时）
  if (!courseId) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardList className="w-6 h-6 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">作业管理</h1>
          </div>
          <p className="text-gray-600">
            请选择课程进入对应的作业页面。先在课程列表中选择课程，然后查看该课程的作业及提交情况。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/courses"
            className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <BookOpen className="w-6 h-6 text-gray-700" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">按课程查看作业</h2>
              <p className="text-sm text-gray-600">
                在课程列表选择课程后，点击操作列的“作业”图标进入该课程的作业列表。
              </p>
            </div>
          </Link>

          <Link
            href="/users"
            className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <Users className="w-6 h-6 text-gray-700" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">按学生查看提交</h2>
              <p className="text-sm text-gray-600">
                在用户列表选择学生后，使用“作业”入口再去课程列表选择课程，即可查看该学生的提交。
              </p>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">作业列表</h1>
          <p className="mt-1 text-sm text-gray-600">
            查看课程的所有作业及其提交情况
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={assignments}
        loading={loading}
        emptyMessage="暂无作业"
        actions={(assignment) => (
          <button
            onClick={() => handleViewDetails(assignment)}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            查看详情
          </button>
        )}
      />
    </div>
  );
}

