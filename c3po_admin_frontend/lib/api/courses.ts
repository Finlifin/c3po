import { apiClient, withRetry } from "./client";
import type {
    ApiResponse,
    PaginatedResponse,
    Course,
    CourseStudent,
    CourseModule,
    CreateCourseRequest,
    UpdateCourseRequest,
    CourseListFilters,
} from "@/types/api";

/**
 * 获取课程列表（支持分页、排序、筛选）
 */
export async function getCourses(
    filters: CourseListFilters = {}
): Promise<PaginatedResponse<Course>> {
    const response = await withRetry(() =>
        apiClient.get<ApiResponse<Course[]>>("/courses", { params: filters })
    );

    const apiResponse = response.data as ApiResponse<Course[]>;
    const courses = apiResponse.data || [];
    const meta = apiResponse.meta || {
        page: 1,
        pageSize: 20,
        total: 0,
    };

    return {
        items: courses,
        meta: {
            page: meta.page || 1,
            pageSize: meta.pageSize || 20,
            total: meta.total || 0,
            totalPages: Math.ceil((meta.total || 0) / (meta.pageSize || 20)),
        },
    };
}

/**
 * 获取单个课程详情
 */
export async function getCourse(courseId: string): Promise<Course> {
    const response = await withRetry(() =>
        apiClient.get<ApiResponse<Course>>(`/courses/${courseId}`)
    );

    const apiResponse = response.data as ApiResponse<Course>;
    return apiResponse.data;
}

/**
 * 创建课程
 */
export async function createCourse(
    data: CreateCourseRequest
): Promise<Course> {
    const response = await withRetry(() =>
        apiClient.post<ApiResponse<Course>>("/courses", data)
    );

    const apiResponse = response.data as ApiResponse<Course>;
    return apiResponse.data;
}

/**
 * 更新课程
 */
export async function updateCourse(
    courseId: string,
    data: UpdateCourseRequest
): Promise<Course> {
    const response = await withRetry(() =>
        apiClient.put<ApiResponse<Course>>(`/courses/${courseId}`, data)
    );

    const apiResponse = response.data as ApiResponse<Course>;
    return apiResponse.data;
}

/**
 * 删除课程
 */
export async function deleteCourse(courseId: string): Promise<void> {
    await withRetry(() =>
        apiClient.delete<ApiResponse<void>>(`/courses/${courseId}`)
    );
}

/**
 * 获取课程学生列表
 */
export async function getCourseStudents(
    courseId: string
): Promise<CourseStudent[]> {
    const response = await withRetry(() =>
        apiClient.get<ApiResponse<CourseStudent[]>>(
            `/courses/${courseId}/students`
        )
    );

    const apiResponse = response.data as ApiResponse<CourseStudent[]>;
    return apiResponse.data || [];
}

/**
 * 获取课程模块列表
 */
export async function getCourseModules(
    courseId: string
): Promise<CourseModule[]> {
    const response = await withRetry(() =>
        apiClient.get<ApiResponse<CourseModule[]>>(
            `/courses/${courseId}/modules`
        )
    );

    const apiResponse = response.data as ApiResponse<CourseModule[]>;
    return apiResponse.data || [];
}

