import { apiClient, withRetry } from "./client";
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  StudentProfile,
  TeacherProfile,
} from "@/types/api";

// 用户查询参数
export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  role?: "STUDENT" | "TEACHER" | "ADMIN";
  status?: "ACTIVE" | "LOCKED" | "DISABLED";
  keyword?: string;
  department?: string;
  sort?: string; // format: "field,(asc|desc)"
}

// 创建用户 DTO
export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  status?: "ACTIVE" | "LOCKED" | "DISABLED";
  statusReason?: string;
  studentProfile?: StudentProfile;
  teacherProfile?: TeacherProfile;
}

// 批量创建用户请求
export interface BatchCreateUsersRequest {
  users: CreateUserDto[];
}

// 批量创建用户响应
export interface BatchCreateResponse {
  created: User[];
  errors: Array<{
    index: number;
    username?: string;
    email?: string;
    message: string;
  }>;
}

// 更新用户 DTO
export interface UpdateUserDto {
  username?: string;
  email?: string;
  status?: "ACTIVE" | "LOCKED" | "DISABLED";
  statusReason?: string;
}

// 更新用户状态请求
export interface UpdateUserStatusRequest {
  status: "ACTIVE" | "LOCKED" | "DISABLED";
  reason: string;
}

/**
 * 获取用户列表（支持分页、排序、筛选）
 */
export async function getUsers(
  params: UserQueryParams = {}
): Promise<PaginatedResponse<User>> {
  const response = await withRetry(() =>
    apiClient.get<ApiResponse<User[]>>("/admin/users", { params })
  );

  const apiResponse = response.data as ApiResponse<User[]>;
  const users = apiResponse.data || [];
  const meta = apiResponse.meta || {
    page: 1,
    pageSize: 20,
    total: 0,
  };

  return {
    items: users,
    meta: {
      page: meta.page || 1,
      pageSize: meta.pageSize || 20,
      total: meta.total || 0,
      totalPages: Math.ceil((meta.total || 0) / (meta.pageSize || 20)),
    },
  };
}

/**
 * 批量创建用户
 */
export async function createUsers(
  users: CreateUserDto[]
): Promise<BatchCreateResponse> {
  const response = await withRetry(() =>
    apiClient.post<ApiResponse<BatchCreateResponse>>("/admin/users", {
      users,
    })
  );

  const apiResponse = response.data as ApiResponse<BatchCreateResponse>;
  return apiResponse.data || { created: [], errors: [] };
}

/**
 * 更新用户信息
 */
export async function updateUser(
  userId: string,
  data: UpdateUserDto
): Promise<User> {
  const response = await withRetry(() =>
    apiClient.patch<ApiResponse<User>>(`/admin/users/${userId}`, data)
  );

  const apiResponse = response.data as ApiResponse<User>;
  return apiResponse.data;
}

/**
 * 更新用户状态
 */
export async function updateUserStatus(
  userId: string,
  status: "ACTIVE" | "LOCKED" | "DISABLED",
  reason: string
): Promise<User> {
  const response = await withRetry(() =>
    apiClient.put<ApiResponse<User>>(`/admin/users/${userId}/status`, {
      status,
      reason,
    })
  );

  const apiResponse = response.data as ApiResponse<User>;
  return apiResponse.data;
}

/**
 * 获取单个用户信息
 * 通过查询用户列表并过滤 ID 来获取
 */
export async function getUser(userId: string): Promise<User | null> {
  try {
    // 尝试通过查询获取，使用关键字搜索（虽然不太精确，但可能匹配到用户名或邮箱）
    // 更好的方法是通过 ID 筛选，但后端 API 可能不支持，所以先查询所有然后过滤
    const response = await getUsers({ pageSize: 1000 }); // 获取大量数据来查找
    const user = response.items.find((u) => u.id === userId);
    return user || null;
  } catch (error) {
    console.error("Failed to get user:", error);
    return null;
  }
}

