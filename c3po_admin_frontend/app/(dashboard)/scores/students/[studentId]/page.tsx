"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, BookOpen, Target, User, Mail, Calendar, School } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { StatCard } from "@/components/ui/StatCard";
import { LineChart } from "@/components/charts/LineChart";
import { getStudentScores } from "@/lib/api/scores";
import { getUser } from "@/lib/api/users";
import type { StudentScoresResponse, Score, User as UserType } from "@/types/api";
import { useToast } from "@/lib/hooks/useToast";

export default function StudentScoresPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.studentId as string;
  const [scoresData, setScoresData] = useState<StudentScoresResponse | null>(
    null
  );
  const [studentInfo, setStudentInfo] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { error: showError } = useToast();

  useEffect(() => {
    if (!studentId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        // 并行加载成绩数据和学生信息
        const [scores, user] = await Promise.all([
          getStudentScores(studentId),
          getUser(studentId),
        ]);
        setScoresData(scores);
        setStudentInfo(user);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "加载学生成绩失败";
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  // 准备成绩明细表格列
  const scoreColumns = [
    {
      key: "courseId",
      label: "课程",
      render: (_value: unknown, row: Score) => {
        // 从 summary.courses 中找到对应的课程名称
        const course = scoresData?.summary.courses.find(
          (c) => c.courseId === row.courseId
        );
        return <span>{course?.courseName || row.courseId}</span>;
      },
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

  // 准备学习趋势图表数据
  const trendData =
    scoresData?.trend.map((point) => ({
      name: new Date(point.timestamp).toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric",
      }),
      分数: point.value,
    })) || [];

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

  const summary = scoresData.summary;

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
          <h1 className="text-2xl font-bold text-gray-900">学生成绩详情</h1>
          <p className="text-sm text-gray-600 mt-1">
            {studentInfo?.username ? (
              <>
                {studentInfo.username}
                {studentInfo.studentProfile?.studentNo && (
                  <>（学号：{studentInfo.studentProfile.studentNo}）</>
                )}
              </>
            ) : (
              `学生 ID: ${studentId}`
            )}
          </p>
        </div>
      </div>

      {/* 学生个人信息卡片 */}
      {studentInfo && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">学生信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">用户名</p>
                <p className="text-base font-medium text-gray-900 mt-1">
                  {studentInfo.username}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">邮箱</p>
                <p className="text-base font-medium text-gray-900 mt-1">
                  {studentInfo.email}
                </p>
              </div>
            </div>
            {studentInfo.studentProfile && (
              <>
                {studentInfo.studentProfile.studentNo && (
                  <div className="flex items-start gap-3">
                    <School className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">学号</p>
                      <p className="text-base font-medium text-gray-900 mt-1">
                        {studentInfo.studentProfile.studentNo}
                      </p>
                    </div>
                  </div>
                )}
                {studentInfo.studentProfile.grade && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">年级</p>
                      <p className="text-base font-medium text-gray-900 mt-1">
                        {studentInfo.studentProfile.grade}
                      </p>
                    </div>
                  </div>
                )}
                {studentInfo.studentProfile.major && (
                  <div className="flex items-start gap-3">
                    <School className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">专业</p>
                      <p className="text-base font-medium text-gray-900 mt-1">
                        {studentInfo.studentProfile.major}
                      </p>
                    </div>
                  </div>
                )}
                {studentInfo.studentProfile.className && (
                  <div className="flex items-start gap-3">
                    <School className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">班级</p>
                      <p className="text-base font-medium text-gray-900 mt-1">
                        {studentInfo.studentProfile.className}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">账户状态</p>
                <p className="text-base font-medium mt-1">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      studentInfo.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : studentInfo.status === "LOCKED"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {studentInfo.status === "ACTIVE"
                      ? "正常"
                      : studentInfo.status === "LOCKED"
                      ? "锁定"
                      : "禁用"}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">注册时间</p>
                <p className="text-base font-medium text-gray-900 mt-1">
                  {new Date(studentInfo.createdAt).toLocaleDateString("zh-CN", {
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

      {/* 综合概览统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="平均分"
          value={
            summary.overallAverage !== null
              ? summary.overallAverage.toFixed(2)
              : "—"
          }
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <StatCard
          title="GPA"
          value={summary.gpa !== null ? summary.gpa.toFixed(2) : "—"}
          icon={<Target className="w-6 h-6" />}
        />
        <StatCard
          title="完成作业数"
          value={`${summary.progress.completedAssignments} / ${summary.progress.totalAssignments}`}
          icon={<BookOpen className="w-6 h-6" />}
        />
        <StatCard
          title="已评分作业"
          value={summary.progress.gradedAssignments.toString()}
          icon={<BookOpen className="w-6 h-6" />}
        />
      </div>

      {/* 学习进度概览 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          学习进度概览
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">总课程数</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {summary.progress.totalCourses}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">总作业数</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {summary.progress.totalAssignments}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">已完成</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {summary.progress.completedAssignments}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">已评分</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {summary.progress.gradedAssignments}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">逾期作业</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {summary.progress.overdueAssignments}
            </p>
          </div>
        </div>
      </div>

      {/* 学习趋势图表 */}
      {trendData.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            学习趋势
          </h2>
          <LineChart
            data={trendData}
            lines={[
              { dataKey: "分数", name: "分数", color: "#ef4444" },
            ]}
            height={300}
          />
        </div>
      )}

      {/* 课程成绩汇总 */}
      {summary.courses.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            各课程成绩汇总
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    课程名称
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    平均分
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    最高分
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    最低分
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    成绩数量
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    完成进度
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.courses.map((course) => (
                  <tr
                    key={course.courseId}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">{course.courseName || "—"}</td>
                    <td className="py-3 px-4">
                      {course.average !== null
                        ? course.average.toFixed(2)
                        : "—"}
                    </td>
                    <td className="py-3 px-4">
                      {course.highest !== null ? course.highest : "—"}
                    </td>
                    <td className="py-3 px-4">
                      {course.lowest !== null ? course.lowest : "—"}
                    </td>
                    <td className="py-3 px-4">{course.scoreCount}</td>
                    <td className="py-3 px-4">
                      {course.progress.totalAssignments > 0
                        ? `${course.progress.completedAssignments} / ${course.progress.totalAssignments}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 学习建议 */}
      {summary.insights.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-blue-900">
              学习分析与建议
            </h2>
          </div>
          <ul className="space-y-3">
            {summary.insights.map((insight, index) => (
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

      {/* 成绩明细表格 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          成绩明细
        </h2>
        <DataTable
          columns={scoreColumns}
          data={scoresData.items}
          emptyMessage="暂无成绩记录"
        />
      </div>

      {/* 导出功能提示 */}
      {scoresData.exportInfo.available && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-lg flex-shrink-0">
              <BookOpen className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                导出成绩数据
              </h3>
              <p className="text-gray-600 mb-3">
                需要导出该学生的成绩数据？您可以创建报表任务，系统将自动生成包含完整成绩信息的导出文件，支持 Excel 等格式。
              </p>
              <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
                <p className="text-sm text-gray-500 mb-1">提示</p>
                <p className="text-sm text-gray-700">
                  导出任务完成后，您可以通过报表管理页面下载生成的文件。
                </p>
              </div>
              <button
                onClick={() => {
                  // TODO: 实现导出功能，跳转到报表创建页面
                  // router.push("/reports?type=SCORE_EXPORT&studentId=" + studentId);
                  alert("导出功能开发中，敬请期待");
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                创建导出任务
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

