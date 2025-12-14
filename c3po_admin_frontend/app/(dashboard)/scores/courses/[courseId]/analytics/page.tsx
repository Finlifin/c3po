"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, FileText, AlertCircle, Download, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { getCourseAnalytics } from "@/lib/api/scores";
import type { CourseAnalyticsResponse } from "@/types/api";
import { useToast } from "@/lib/hooks/useToast";

export default function CourseAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;
  const [analyticsData, setAnalyticsData] =
    useState<CourseAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { error: showError } = useToast();

  useEffect(() => {
    if (!courseId) return;

    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCourseAnalytics(courseId);
        setAnalyticsData(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "加载课程分析失败";
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <p className="ml-4 text-gray-600">加载中...</p>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <p className="text-red-700">{error || "加载失败"}</p>
        </div>
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
      {/* 页面标题和返回按钮 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">课程分析</h1>
          <p className="text-sm text-gray-600 mt-1">课程 ID: {courseId}</p>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="完成率"
          value={`${(analyticsData.completionRate * 100).toFixed(1)}%`}
          icon={<FileText className="w-6 h-6" />}
        />
        <StatCard
          title="平均分"
          value={
            analyticsData.averageScore !== null
              ? analyticsData.averageScore.toFixed(2)
              : "—"
          }
          icon={<FileText className="w-6 h-6" />}
        />
        <StatCard
          title="中位数"
          value={
            analyticsData.medianScore !== null
              ? analyticsData.medianScore.toFixed(2)
              : "—"
          }
          icon={<FileText className="w-6 h-6" />}
        />
        <StatCard
          title="选课学生数"
          value={analyticsData.enrolledStudents.toString()}
          icon={<Users className="w-6 h-6" />}
        />
      </div>

      {/* 作业提交统计 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          作业提交统计
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">总作业数</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {analyticsData.totalAssignments}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">已评分提交</p>
            <p className="text-3xl font-bold text-green-900 mt-2">
              {analyticsData.gradedSubmissions}
            </p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-700">待评分提交</p>
            <p className="text-3xl font-bold text-yellow-900 mt-2">
              {analyticsData.pendingSubmissions}
            </p>
          </div>
        </div>
      </div>

      {/* 滞后学生 */}
      {analyticsData.overdueStudents.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              滞后学生 ({analyticsData.overdueStudents.length} 人)
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {analyticsData.overdueStudents.map((studentId) => (
              <div
                key={studentId}
                className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
              >
                <span className="text-sm text-orange-800">{studentId}</span>
                <button
                  onClick={() =>
                    router.push(`/scores/students/${studentId}`)
                  }
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  查看详情 →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 风险学生 */}
      {analyticsData.atRiskStudents.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              风险学生 ({analyticsData.atRiskStudents.length} 人)
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {analyticsData.atRiskStudents.map((studentId) => (
              <div
                key={studentId}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
              >
                <span className="text-sm text-red-800">{studentId}</span>
                <button
                  onClick={() =>
                    router.push(`/scores/students/${studentId}`)
                  }
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  查看详情 →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 难度较高的作业 */}
      {analyticsData.difficultAssignments.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            难度较高的作业
          </h2>
          <ul className="space-y-2">
            {analyticsData.difficultAssignments.map((assignment, index) => (
              <li
                key={index}
                className="p-3 bg-yellow-50 rounded-lg border border-yellow-200"
              >
                <span className="text-sm text-yellow-800">{assignment}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 分析洞察 */}
      {analyticsData.insights.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-blue-900">
              数据分析洞察
            </h2>
          </div>
          <ul className="space-y-3">
            {analyticsData.insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">
                    {index + 1}
                  </span>
                </div>
                <p className="text-blue-800 flex-1 leading-relaxed">{insight}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 导出功能提示 */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 rounded-lg flex-shrink-0">
            <Download className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              导出课程分析报告
            </h3>
            <p className="text-gray-600 mb-3">
              需要导出完整的课程分析数据？创建报表任务后，系统将自动生成包含所有分析指标、学生列表和统计图表的详细报告，支持 Excel、PDF 等格式。
            </p>
            <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
              <p className="text-sm text-gray-500 mb-1">导出内容包含</p>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>课程完成率和成绩统计</li>
                <li>学生表现分析（高分学生、风险学生等）</li>
                <li>作业完成情况和难度分析</li>
                <li>所有相关数据图表</li>
              </ul>
            </div>
            <button
              onClick={() => {
                // TODO: 实现导出功能，跳转到报表创建页面
                // router.push(`/reports?type=COURSE_ANALYTICS&courseId=${courseId}`);
                alert("导出功能开发中，敬请期待");
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              创建导出任务
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

