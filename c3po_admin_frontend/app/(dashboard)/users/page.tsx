"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DataTable, Column } from "@/components/ui/DataTable";
import { FormModal } from "@/components/ui/FormModal";
import { FormField } from "@/components/forms/FormField";
import { BatchUserCreateForm } from "@/components/forms/BatchUserCreateForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getUsers, createUsers, updateUser, updateUserStatus } from "@/lib/api/users";
import type { UserQueryParams } from "@/lib/api/users";
import type { User } from "@/types/api";
import { Plus, Edit, Eye, Lock, Unlock, X, Trash2, BarChart3 } from "lucide-react";
import Link from "next/link";

// 用户列表列定义
const userColumns: Column<User>[] = [
  {
    key: "username",
    label: "用户名",
    sortable: true,
  },
  {
    key: "email",
    label: "邮箱",
    sortable: true,
  },
  {
    key: "role",
    label: "角色",
    render: (value) => {
      const roleMap: Record<string, string> = {
        STUDENT: "学生",
        TEACHER: "教师",
        ADMIN: "管理员",
      };
      return (
        <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
          {roleMap[value as string] || String(value)}
        </span>
      );
    },
  },
  {
    key: "status",
    label: "状态",
    sortable: true,
    render: (value) => {
      const statusMap: Record<string, { text: string; className: string }> = {
        ACTIVE: { text: "正常", className: "bg-green-100 text-green-800" },
        LOCKED: { text: "锁定", className: "bg-yellow-100 text-yellow-800" },
        DISABLED: { text: "禁用", className: "bg-red-100 text-red-800" },
      };
      const status = statusMap[value as string] || { text: String(value), className: "bg-gray-100 text-gray-800" };
      return (
        <span className={`px-2 py-1 text-xs font-medium rounded ${status.className}`}>
          {status.text}
        </span>
      );
    },
  },
  {
    key: "createdAt",
    label: "创建时间",
    sortable: true,
    render: (value) => {
      if (!value) return "—";
      return new Date(value as string).toLocaleString("zh-CN");
    },
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  });
  const [sorting, setSorting] = useState<{ field: string; order: "asc" | "desc" }>({
    field: "createdAt",
    order: "desc",
  });
  const [filters, setFilters] = useState<UserQueryParams>({});
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // 加载用户列表
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: UserQueryParams = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        sort: `${sorting.field},${sorting.order}`,
        ...filters,
      };
      const response = await getUsers(params);
      setUsers(response.items);
      setPagination((prev) => ({
        ...prev,
        total: response.meta.total,
      }));
    } catch (error) {
      console.error("Failed to load users:", error);
      // TODO: Show error toast
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, sorting, filters]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 筛选器表单
  const filterForm = useForm<{
    role: string;
    status: string;
    keyword: string;
    department: string;
  }>({
    defaultValues: {
      role: "",
      status: "",
      keyword: "",
      department: "",
    },
  });

  const handleFilter = (data: { role: string; status: string; keyword: string; department: string }) => {
    const newFilters: UserQueryParams = {};
    if (data.role) newFilters.role = data.role as "STUDENT" | "TEACHER" | "ADMIN";
    if (data.status) newFilters.status = data.status as "ACTIVE" | "LOCKED" | "DISABLED";
    if (data.keyword) newFilters.keyword = data.keyword;
    if (data.department) newFilters.department = data.department;
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    filterForm.reset();
    setFilters({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // 创建用户表单
  const createForm = useForm({
    resolver: zodResolver(
      z.object({
        users: z.array(
          z.object({
            username: z.string().min(3, "用户名至少3个字符").max(64, "用户名最多64个字符"),
            email: z.string().email("请输入有效的邮箱地址"),
            password: z.string().min(8, "密码至少8个字符"),
            role: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
            status: z.enum(["ACTIVE", "LOCKED", "DISABLED"]).optional(),
            statusReason: z.string().optional(),
            studentProfile: z.object({
              studentNo: z.string().optional(),
              grade: z.string().optional(),
              major: z.string().optional(),
              className: z.string().optional(),
            }).optional(),
            teacherProfile: z.object({
              teacherNo: z.string().optional(),
              department: z.string().optional(),
              title: z.string().optional(),
              subjects: z.array(z.string()).optional(),
            }).optional(),
          })
        ).min(1, "至少添加一个用户"),
      })
    ),
    defaultValues: {
      users: [
        {
          username: "",
          email: "",
          password: "",
          role: "STUDENT" as const,
          status: "ACTIVE" as const,
          statusReason: "",
        },
      ],
    },
  });

  const [createResult, setCreateResult] = useState<{
    created: User[];
    errors: Array<{ index: number; username?: string; email?: string; message: string }>;
  } | null>(null);

  const handleCreate = async () => {
    const isValid = await createForm.trigger();
    if (!isValid) return;

    const formData = createForm.getValues();
    try {
      // Clean up the data - remove empty profiles and statusReason if status is ACTIVE
      const cleanedUsers = formData.users.map((user) => {
        const cleaned: any = {
          username: user.username,
          email: user.email,
          password: user.password,
          role: user.role,
        };
        if (user.status && user.status !== "ACTIVE") {
          cleaned.status = user.status;
          if (user.statusReason) {
            cleaned.statusReason = user.statusReason;
          }
        }
        if (user.role === "STUDENT" && user.studentProfile) {
          const profile = user.studentProfile;
          if (profile.studentNo || profile.grade || profile.major || profile.className) {
            cleaned.studentProfile = {
              studentNo: profile.studentNo || "",
              grade: profile.grade || "",
              major: profile.major || "",
              className: profile.className || "",
            };
          }
        }
        if (user.role === "TEACHER" && user.teacherProfile) {
          const profile = user.teacherProfile;
          if (profile.teacherNo || profile.department || profile.title) {
            cleaned.teacherProfile = {
              teacherNo: profile.teacherNo || "",
              department: profile.department || "",
              title: profile.title || "",
              subjects: profile.subjects || [],
            };
          }
        }
        return cleaned;
      });

      const result = await createUsers(cleanedUsers);
      setCreateResult(result);
      if (result.errors.length === 0) {
        // All succeeded, close modal and refresh
        setTimeout(() => {
          setCreateModalOpen(false);
          setCreateResult(null);
          createForm.reset();
          loadUsers();
        }, 2000);
      }
      // If there are errors, keep modal open to show results
    } catch (error) {
      console.error("Failed to create users:", error);
      // TODO: Show error toast
    }
  };

  // 编辑用户表单
  const editForm = useForm({
    resolver: zodResolver(
      z.object({
        username: z.string().min(3, "用户名至少3个字符").max(64, "用户名最多64个字符").optional(),
        email: z.string().email("请输入有效的邮箱地址").optional(),
        status: z.enum(["ACTIVE", "LOCKED", "DISABLED"]).optional(),
        statusReason: z.string().optional(),
      })
    ),
  });

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    editForm.reset({
      username: user.username,
      email: user.email,
      status: user.status,
      statusReason: user.statusReason || "",
    });
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    const isValid = await editForm.trigger();
    if (!isValid || !selectedUser) return;

    const formData = editForm.getValues();
    try {
      await updateUser(selectedUser.id, formData);
      setEditModalOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error("Failed to update user:", error);
      // TODO: Show error toast
    }
  };

  // 状态管理表单
  const statusForm = useForm({
    resolver: zodResolver(
      z.object({
        status: z.enum(["ACTIVE", "LOCKED", "DISABLED"]),
        reason: z.string().optional(),
      }).refine(
        (data) => {
          // If status is not ACTIVE, reason is required
          if (data.status !== "ACTIVE" && !data.reason) {
            return false;
          }
          return true;
        },
        {
          message: "状态变更原因不能为空",
          path: ["reason"],
        }
      )
    ),
  });

  const handleStatusChange = (user: User) => {
    setSelectedUser(user);
    statusForm.reset({
      status: user.status,
      reason: "",
    });
    setStatusModalOpen(true);
  };

  const handleStatusUpdate = async () => {
    const isValid = await statusForm.trigger();
    if (!isValid || !selectedUser) return;

    const formData = statusForm.getValues();
    try {
      await updateUserStatus(selectedUser.id, formData.status, formData.reason || "");
      setStatusModalOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error("Failed to update user status:", error);
      // TODO: Show error toast
    }
  };

  return (
    <AuthGuard>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">用户管理</h1>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            创建用户
          </button>
        </div>

        {/* 筛选器 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <form onSubmit={filterForm.handleSubmit(handleFilter)}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">角色</label>
                <select
                  {...filterForm.register("role")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">全部</option>
                  <option value="STUDENT">学生</option>
                  <option value="TEACHER">教师</option>
                  <option value="ADMIN">管理员</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                <select
                  {...filterForm.register("status")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">全部</option>
                  <option value="ACTIVE">正常</option>
                  <option value="LOCKED">锁定</option>
                  <option value="DISABLED">禁用</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">关键字</label>
                <input
                  {...filterForm.register("keyword")}
                  type="text"
                  placeholder="用户名或邮箱"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">院系</label>
                <input
                  {...filterForm.register("department")}
                  type="text"
                  placeholder="教师院系"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                筛选
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                清除
              </button>
            </div>
          </form>
        </div>

        {/* 用户列表表格 */}
        <DataTable
          columns={userColumns}
          data={users}
          loading={loading}
          pagination={{
            page: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onPageChange: (page) => setPagination((prev) => ({ ...prev, page })),
            onPageSizeChange: (pageSize) => setPagination((prev) => ({ ...prev, pageSize, page: 1 })),
          }}
          sorting={{
            field: sorting.field,
            order: sorting.order,
            onSort: (field, order) => setSorting({ field, order }),
          }}
          search={{
            placeholder: "搜索用户名或邮箱...",
            onSearch: (keyword) => {
              filterForm.setValue("keyword", keyword);
              handleFilter({ ...filterForm.getValues(), keyword });
            },
          }}
          actions={(user) => (
            <div className="flex items-center gap-2 justify-end">
              {user.role === "STUDENT" ? (
                <Link
                  href={`/scores/students/${user.id}`}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="成绩管理"
                >
                  <BarChart3 className="w-4 h-4" />
                </Link>
              ) : (
                <div
                  className="p-2 text-gray-300 rounded cursor-not-allowed"
                  title="仅学生支持成绩管理"
                >
                  <BarChart3 className="w-4 h-4" />
                </div>
              )}
              <button
                onClick={() => handleEdit(user)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="编辑"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleStatusChange(user)}
                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                title="修改状态"
              >
                {user.status === "ACTIVE" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
            </div>
          )}
          emptyMessage="暂无用户数据"
        />

        {/* 创建用户模态框 */}
        <FormModal
          open={createModalOpen}
          title="批量创建用户"
          onClose={() => {
            setCreateModalOpen(false);
            setCreateResult(null);
            createForm.reset();
          }}
          onSubmit={handleCreate}
          submitText={createResult ? "关闭" : "创建"}
        >
          {createResult ? (
            <div className="space-y-4">
              {createResult.created.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-green-700 mb-2">
                    成功创建 {createResult.created.length} 个用户：
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <ul className="space-y-1">
                      {createResult.created.map((user) => (
                        <li key={user.id} className="text-sm text-green-800">
                          {user.username} ({user.email})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {createResult.errors.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-red-700 mb-2">
                    创建失败 {createResult.errors.length} 个用户：
                  </h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <ul className="space-y-1">
                      {createResult.errors.map((error, idx) => (
                        <li key={idx} className="text-sm text-red-800">
                          用户 {error.index + 1}: {error.username || error.email} - {error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <FormProvider {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreate)}>
                <BatchUserCreateForm />
              </form>
            </FormProvider>
          )}
        </FormModal>

        {/* 编辑用户模态框 */}
        <FormModal
          open={editModalOpen}
          title="编辑用户"
          onClose={() => {
            setEditModalOpen(false);
            setSelectedUser(null);
          }}
          onSubmit={handleUpdate}
          submitText="保存"
        >
          <FormProvider {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleUpdate)}>
              <FormField
                name="username"
                label="用户名"
              />
              <FormField
                name="email"
                label="邮箱"
                type="email"
              />
              <FormField
                name="status"
                label="状态"
              >
                <select
                  {...editForm.register("status")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="ACTIVE">正常</option>
                  <option value="LOCKED">锁定</option>
                  <option value="DISABLED">禁用</option>
                </select>
              </FormField>
              {editForm.watch("status") !== "ACTIVE" && (
                <FormField
                  name="statusReason"
                  label="状态原因"
                  required
                />
              )}
            </form>
          </FormProvider>
        </FormModal>

        {/* 状态管理模态框 */}
        <FormModal
          open={statusModalOpen}
          title="修改用户状态"
          onClose={() => {
            setStatusModalOpen(false);
            setSelectedUser(null);
          }}
          onSubmit={handleStatusUpdate}
          submitText="确认"
        >
          <FormProvider {...statusForm}>
            <form onSubmit={statusForm.handleSubmit(handleStatusUpdate)}>
              <FormField
                name="status"
                label="状态"
                required
              >
                <select
                  {...statusForm.register("status")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="ACTIVE">正常</option>
                  <option value="LOCKED">锁定</option>
                  <option value="DISABLED">禁用</option>
                </select>
              </FormField>
              <FormField
                name="reason"
                label="状态变更原因"
                required
              >
                <textarea
                  {...statusForm.register("reason")}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="请输入状态变更原因..."
                />
              </FormField>
            </form>
          </FormProvider>
        </FormModal>

        {/* 确认对话框 */}
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        />
      </div>
    </AuthGuard>
  );
}

