"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DataTable, Column } from "@/components/ui/DataTable";
import { getCourses } from "@/lib/api/courses";
import type { Course, CourseStatus } from "@/types/api";
import { Plus, Eye, Edit, BarChart3, Activity, ClipboardList } from "lucide-react";

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

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<CourseStatus | "">("");
  const [teacherFilter, setTeacherFilter] = useState("");

  const loadCourses = async () => {
    setLoading(true);
    try {
      const filters = {
        page,
        pageSize,
        sort: `${sortField},${sortOrder}`,
        ...(keyword && { keyword }),
        ...(statusFilter && { status: statusFilter as CourseStatus }),
        ...(teacherFilter && { teacherId: teacherFilter }),
      };

      const result = await getCourses(filters);
      setCourses(result.items);
      setTotal(result.meta?.total || 0);
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [page, pageSize, sortField, sortOrder, keyword, statusFilter, teacherFilter]);

  const handleSort = (field: string, order: "asc" | "desc") => {
    setSortField(field);
    setSortOrder(order);
    setPage(1); // Reset to first page when sorting changes
  };

  const handleSearch = (searchKeyword: string) => {
    setKeyword(searchKeyword);
    setPage(1); // Reset to first page when search changes
  };

  const columns: Column<Course>[] = [
    {
      key: "name",
      label: "课程名称",
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{String(value)}</div>
          {row.semester && (
            <div className="text-sm text-gray-500">{row.semester}</div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "状态",
      sortable: true,
      render: (value) => {
        const status = value as CourseStatus;
        return (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${COURSE_STATUS_COLORS[status]}`}
          >
            {COURSE_STATUS_LABELS[status]}
          </span>
        );
      },
    },
    {
      key: "metrics_enrolled",
      label: "选课人数",
      render: (value, row) => {
        return <span>{row.metrics?.enrolledCount || 0}</span>;
      },
    },
    {
      key: "metrics_assignments",
      label: "作业数",
      render: (value, row) => {
        return <span>{row.metrics?.assignments || 0}</span>;
      },
    },
    {
      key: "metrics_modules",
      label: "章节数",
      render: (value, row) => {
        return <span>{row.metrics?.modules || 0}</span>;
      },
    },
    {
      key: "credit",
      label: "学分",
      sortable: true,
      render: (value) => <span>{value ? `${value} 学分` : "—"}</span>,
    },
    {
      key: "createdAt",
      label: "创建时间",
      sortable: true,
      render: (value) => {
        if (!value) return "—";
        return new Date(String(value)).toLocaleDateString("zh-CN");
      },
    },
  ];

  return (
    <AuthGuard>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">课程管理</h1>
            <p className="text-gray-600 mt-1">管理平台所有课程信息</p>
          </div>
          <button
            onClick={() => router.push("/courses/new")}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            创建课程
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                关键字
              </label>
              <input
                type="text"
                placeholder="搜索课程名称..."
                value={keyword}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                状态
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as CourseStatus | "");
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">全部状态</option>
                {Object.entries(COURSE_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                教师ID
              </label>
              <input
                type="text"
                placeholder="筛选教师ID..."
                value={teacherFilter}
                onChange={(e) => {
                  setTeacherFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Course Table */}
        <DataTable
          columns={columns}
          data={courses}
          loading={loading}
          pagination={{
            page,
            pageSize,
            total,
            onPageChange: setPage,
            onPageSizeChange: (newSize) => {
              setPageSize(newSize);
              setPage(1);
            },
          }}
          sorting={{
            field: sortField,
            order: sortOrder,
            onSort: handleSort,
          }}
          search={{
            placeholder: "搜索课程...",
            onSearch: handleSearch,
          }}
          actions={(row) => (
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => router.push(`/assignments?courseId=${row.id}`)}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="作业管理"
              >
                <ClipboardList className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push(`/scores/courses/${row.id}`)}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="成绩统计"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push(`/scores/courses/${row.id}/analytics`)}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="课程分析"
              >
                <Activity className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push(`/courses/${row.id}`)}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded transition-colors"
                title="查看详情"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push(`/courses/${row.id}/edit`)}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded transition-colors"
                title="编辑"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          )}
          emptyMessage="暂无课程数据"
        />
      </div>
    </AuthGuard>
  );
}

