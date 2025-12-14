"use client";

import Link from "next/link";
import { BarChart3, Users, BookOpen } from "lucide-react";

export default function ScoresLandingPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-6 h-6 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">成绩管理</h1>
        </div>
        <p className="text-gray-600">
          请选择学生或课程进入对应的成绩页面。您可以先在课程或用户列表中选择目标，
          然后访问成绩详情。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/users"
          className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
        >
          <Users className="w-6 h-6 text-gray-700" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">学生成绩</h2>
            <p className="text-sm text-gray-600">
              先在用户列表找到学生，再访问
              /scores/students/[studentId] 查看成绩明细与趋势。
            </p>
          </div>
        </Link>

        <Link
          href="/courses"
          className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
        >
          <BookOpen className="w-6 h-6 text-gray-700" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              课程成绩与分析
            </h2>
            <p className="text-sm text-gray-600">
              在课程列表选择课程后，访问
              /scores/courses/[courseId]（统计）或
              /scores/courses/[courseId]/analytics（分析）。
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

