"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, Users, AlertCircle, BookOpen, Calendar, Award, User } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { StatCard } from "@/components/ui/StatCard";
import { BarChart } from "@/components/charts/BarChart";
import { getCourseScores } from "@/lib/api/scores";
import { getCourse } from "@/lib/api/courses";
import type { CourseScoresResponse, Score, Course } from "@/types/api";
import { useToast } from "@/lib/hooks/useToast";

export default function CourseScoresPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;
  const [scoresData, setScoresData] = useState<CourseScoresResponse | null>(
    null
  );
  const [courseInfo, setCourseInfo] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [componentFilter, setComponentFilter] = useState<string>("");
  const { error: showError } = useToast();

  useEffect(() => {
    if (!courseId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        // 并行加载成绩数据和课程信息
        const [scores, course] = await Promise.all([
          getCourseScores(courseId, componentFilter || undefined),
          getCourse(courseId),
        ]);
        setScoresData(scores);
        setCourseInfo(course);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "加载课程成绩失败";
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, componentFilter]);

  // 准备分数分布图表数据
  const distributionData =
    scoresData?.distribution.map((bucket) => ({
      name: bucket.label,
      人数: bucket.count,
    })) || [];

  // 准备成绩明细表格列
  const scoreColumns = [
    {
      key: "studentId",
      label: "学生 ID",
    },
    {
      key: "component",
      label: "成绩类型",
    },
    {
      key: "value",
      label: "分数",
      render: (value: unknown) => {
        if (value === null || value === undefined) {
          return <span className="text-gray-400">未评分</span>;
        }
        return (
          <span className="font-semibold text-gray-900">{String(value)}</span>
        );
      },
    },
    {
      key: "releasedAt",
      label: "发布时间",
      render: (value: unknown) => {
        if (!value) return <span className="text-gray-400">—</span>;
        return (
          <span>
            {new Date(value as string).toLocaleString("zh-CN", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <p className="ml-4 text-gray-600">加载中...</p>
      </div>
    );
  }

  if (error || !scoresData) {
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

  const overview = scoresData.overview;
  const components = Object.keys(scoresData.componentAverages);

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
          <h1 className="text-2xl font-bold text-gray-900">课程成绩统计</h1>
          <p className="text-sm text-gray-600 mt-1">
            {courseInfo?.name ? (
              <>
                {courseInfo.name}
                {courseInfo.semester && `（${courseInfo.semester}）`}
              </>
            ) : (
              `课程 ID: ${courseId}`
            )}
          </p>
        </div>
      </div>

      {/* 课程概要信息卡片 */}
      {courseInfo && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">课程信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">课程名称</p>
                <p className="text-base font-medium text-gray-900 mt-1">
                  {courseInfo.name}
                </p>
              </div>
            </div>
            {courseInfo.semester && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">学期</p>
                  <p className="text-base font-medium text-gray-900 mt-1">
                    {courseInfo.semester}
                  </p>
                </div>
              </div>
            )}
            {courseInfo.credit && (
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">学分</p>
                  <p className="text-base font-medium text-gray-900 mt-1">
                    {courseInfo.credit} 学分
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">选课人数</p>
                <p className="text-base font-medium text-gray-900 mt-1">
                  {courseInfo.metrics?.enrolledCount || 0}
                  {courseInfo.enrollLimit && ` / ${courseInfo.enrollLimit}`}
                </p>
              </div>
            </div>
            {courseInfo.metrics && (
              <>
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">作业数量</p>
                    <p className="text-base font-medium text-gray-900 mt-1">
                      {courseInfo.metrics.assignments}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">章节数量</p>
                    <p className="text-base font-medium text-gray-900 mt-1">
                      {courseInfo.metrics.modules}
                    </p>
                  </div>
                </div>
              </>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">课程状态</p>
                <p className="text-base font-medium mt-1">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      courseInfo.status === "PUBLISHED"
                        ? "bg-green-100 text-green-800"
                        : courseInfo.status === "PENDING_REVIEW"
                        ? "bg-yellow-100 text-yellow-800"
                        : courseInfo.status === "DRAFT"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {courseInfo.status === "PUBLISHED"
                      ? "已发布"
                      : courseInfo.status === "PENDING_REVIEW"
                      ? "待审核"
                      : courseInfo.status === "DRAFT"
                      ? "草稿"
                      : "已归档"}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">创建时间</p>
                <p className="text-base font-medium text-gray-900 mt-1">
                  {new Date(courseInfo.createdAt).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 总体统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="平均分"
          value={overview.average !== null ? overview.average.toFixed(2) : "—"}
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <StatCard
          title="中位数"
          value={overview.median !== null ? overview.median.toFixed(2) : "—"}
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <StatCard
          title="学生数"
          value={overview.studentCount.toString()}
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard
          title="完成率"
          value={
            overview.completionRate !== null
              ? `${(overview.completionRate * 100).toFixed(1)}%`
              : "—"
          }
          icon={<Users className="w-6 h-6" />}
        />
      </div>

      {/* 分数分布图表 */}
      {distributionData.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            分数分布
          </h2>
          <BarChart
            data={distributionData}
            bars={[{ dataKey: "人数", name: "人数", color: "#ef4444" }]}
            height={300}
          />
        </div>
      )}

      {/* 各成绩类型平均分 */}
      {components.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            各成绩类型平均分
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {components.map((component) => (
              <div
                key={component}
                className="p-4 bg-gray-50 rounded-lg"
                onClick={() => {
                  setComponentFilter(
                    componentFilter === component ? "" : component
                  );
                }}
                style={{ cursor: "pointer" }}
              >
                <p className="text-sm text-gray-600">{component}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {scoresData.componentAverages[component].toFixed(2)}
                </p>
                {componentFilter === component && (
                  <p className="text-xs text-red-600 mt-1">(已筛选)</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 统计摘要 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 高分学生 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              高分学生 (Top 5)
            </h2>
          </div>
          {scoresData.topPerformers.length > 0 ? (
            <ul className="space-y-2">
              {scoresData.topPerformers.map((studentId, index) => (
                <li
                  key={studentId}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <span className="text-sm text-gray-600">
                    {index + 1}. {studentId}
                  </span>
                  <button
                    onClick={() =>
                      router.push(`/scores/students/${studentId}`)
                    }
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    查看详情 →
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">暂无数据</p>
          )}
        </div>

        {/* 需要关注的学生 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              需要关注的学生
            </h2>
          </div>
          {scoresData.needsAttention.length > 0 ? (
            <ul className="space-y-2">
              {scoresData.needsAttention.map((studentId) => (
                <li
                  key={studentId}
                  className="flex items-center justify-between p-2 bg-red-50 rounded"
                >
                  <span className="text-sm text-red-800">{studentId}</span>
                  <button
                    onClick={() =>
                      router.push(`/scores/students/${studentId}`)
                    }
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    查看详情 →
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">暂无需要关注的学生</p>
          )}
        </div>
      </div>

      {/* 成绩明细表格 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">成绩明细</h2>
          {componentFilter && (
            <button
              onClick={() => setComponentFilter("")}
              className="text-sm text-red-600 hover:text-red-700"
            >
              清除筛选
            </button>
          )}
        </div>
        <DataTable
          columns={scoreColumns}
          data={scoresData.items}
          emptyMessage="暂无成绩记录"
        />
      </div>

      {/* 统计摘要 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          统计摘要
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">最高分</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {overview.highest !== null ? overview.highest : "—"}
            </p>
          </div>
          <div>
            <p className="text-gray-600">最低分</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {overview.lowest !== null ? overview.lowest : "—"}
            </p>
          </div>
          <div>
            <p className="text-gray-600">成绩总数</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {overview.scoreCount}
            </p>
          </div>
          <div>
            <p className="text-gray-600">有成绩学生数</p>
            <p className="text-xl font-bold text-gray-900 mt-1">
              {overview.studentCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

