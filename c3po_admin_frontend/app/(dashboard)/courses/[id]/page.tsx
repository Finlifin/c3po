"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DataTable, Column } from "@/components/ui/DataTable";
import {
  getCourse,
  getCourseStudents,
  getCourseModules,
} from "@/lib/api/courses";
import type { Course, CourseStatus, CourseStudent, CourseModule } from "@/types/api";
import { ArrowLeft, Edit, Calendar, User, BookOpen, FileText } from "lucide-react";

const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  DRAFT: "草稿",
  PENDING_REVIEW: "待审核",
  PUBLISHED: "已发布",
  ARCHIVED: "已归档",
};

const COURSE_STATUS_COLORS: Record<CourseStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-800",
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

const STUDENT_STATUS_LABELS: Record<string, string> = {
  ENROLLED: "已选课",
  DROPPED: "已退课",
  PENDING: "待确认",
};

const STUDENT_STATUS_COLORS: Record<string, string> = {
  ENROLLED: "bg-green-100 text-green-800",
  DROPPED: "bg-gray-100 text-gray-600",
  PENDING: "bg-yellow-100 text-yellow-800",
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "students" | "modules">(
    "info"
  );

  useEffect(() => {
    const loadCourseData = async () => {
      setLoading(true);
      try {
        const [courseData, studentsData, modulesData] = await Promise.all([
          getCourse(courseId),
          getCourseStudents(courseId),
          getCourseModules(courseId),
        ]);
        setCourse(courseData);
        setStudents(studentsData);
        setModules(modulesData);
      } catch (error) {
        console.error("Failed to load course data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  if (loading) {
    return (
      <AuthGuard>
        <div className="p-6">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!course) {
    return (
      <AuthGuard>
        <div className="p-6">
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">课程不存在</p>
            <button
              onClick={() => router.push("/courses")}
              className="mt-4 text-red-600 hover:text-red-700"
            >
              返回课程列表
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const studentColumns: Column<CourseStudent>[] = [
    {
      key: "username",
      label: "用户名",
    },
    {
      key: "email",
      label: "邮箱",
    },
    {
      key: "status",
      label: "状态",
      render: (value) => {
        const status = String(value);
        return (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${STUDENT_STATUS_COLORS[status] || "bg-gray-100 text-gray-800"}`}
          >
            {STUDENT_STATUS_LABELS[status] || status}
          </span>
        );
      },
    },
    {
      key: "enrolledAt",
      label: "选课时间",
      render: (value) => {
        if (!value) return "—";
        return new Date(String(value)).toLocaleString("zh-CN");
      },
    },
  ];

  const moduleColumns: Column<CourseModule>[] = [
    {
      key: "displayOrder",
      label: "顺序",
      render: (value) => <span className="font-medium">{String(value)}</span>,
    },
    {
      key: "title",
      label: "章节标题",
    },
    {
      key: "resources",
      label: "资源数量",
      render: (value) => {
        const resources = value as CourseModule["resources"];
        return <span>{resources?.length || 0} 个资源</span>;
      },
    },
    {
      key: "releaseAt",
      label: "发布时间",
      render: (value) => {
        if (!value) return "—";
        return new Date(String(value)).toLocaleString("zh-CN");
      },
    },
  ];

  return (
    <AuthGuard>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push("/courses")}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
            <p className="text-gray-600 mt-1">课程详情</p>
          </div>
          <button
            onClick={() => router.push(`/courses/${courseId}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Edit className="w-5 h-5" />
            编辑课程
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab("info")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "info"
                  ? "text-red-600 border-b-2 border-red-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              基本信息
            </button>
            <button
              onClick={() => setActiveTab("students")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "students"
                  ? "text-red-600 border-b-2 border-red-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              选课学生 ({students.length})
            </button>
            <button
              onClick={() => setActiveTab("modules")}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === "modules"
                  ? "text-red-600 border-b-2 border-red-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              课程章节 ({modules.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === "info" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  基本信息
                </h2>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">课程名称</dt>
                    <dd className="mt-1 text-sm text-gray-900">{course.name}</dd>
                  </div>
                  {course.semester && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">学期</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {course.semester}
                      </dd>
                    </div>
                  )}
                  {course.credit && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">学分</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {course.credit} 学分
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">状态</dt>
                    <dd className="mt-1">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${COURSE_STATUS_COLORS[course.status]}`}
                      >
                        {COURSE_STATUS_LABELS[course.status]}
                      </span>
                    </dd>
                  </div>
                  {course.enrollLimit && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        选课上限
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {course.enrollLimit} 人
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  统计信息
                </h2>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      选课人数
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {course.metrics?.enrolledCount || 0} 人
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">作业数量</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {course.metrics?.assignments || 0} 个
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">章节数量</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {course.metrics?.modules || 0} 个
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">教师ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">
                      {course.teacherId}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">创建时间</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(course.createdAt).toLocaleString("zh-CN")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">更新时间</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(course.updatedAt).toLocaleString("zh-CN")}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {activeTab === "students" && (
          <DataTable
            columns={studentColumns}
            data={students}
            loading={false}
            emptyMessage="暂无选课学生"
          />
        )}

        {activeTab === "modules" && (
          <div className="space-y-4">
            {modules.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-gray-500">暂无课程章节</p>
              </div>
            ) : (
              modules.map((module, index) => (
                <div
                  key={module.id}
                  className="bg-white rounded-lg border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-semibold">
                        {module.displayOrder}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {module.title}
                        </h3>
                        {module.releaseAt && (
                          <p className="text-sm text-gray-500 mt-1">
                            发布时间:{" "}
                            {new Date(module.releaseAt).toLocaleString("zh-CN")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {module.resources && module.resources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">
                        资源列表
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {module.resources.map((resource) => (
                          <div
                            key={resource.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {resource.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {resource.type}
                                {resource.fileSize &&
                                  ` · ${(resource.fileSize / 1024).toFixed(2)} KB`}
                              </p>
                            </div>
                            {resource.downloadUrl && (
                              <a
                                href={resource.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                下载
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

