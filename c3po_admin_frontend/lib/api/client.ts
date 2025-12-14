import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { tokenStorage } from "@/lib/utils/storage";
import { ApiError, NetworkError, AuthenticationError } from "@/lib/utils/api-error";
import type { ApiResponse } from "@/types/api";

// API 基础 URL（可以从环境变量读取）
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

/**
 * 创建 Axios 实例
 */
function createAxiosInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30秒超时
    headers: {
      "Content-Type": "application/json",
    },
  });

  // 请求拦截器：添加认证 Token
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = tokenStorage.getToken();

      if (token && !tokenStorage.isTokenExpired()) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (token && tokenStorage.isTokenExpired()) {
        // Token 过期，清除它
        tokenStorage.clearToken();
      }

      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器：错误处理和 Token 刷新
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // 直接返回响应（响应可能是 ApiResponse 格式，也可能是直接的数据）
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // 处理 401 错误（未认证）
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        tokenStorage.clearToken();

        // 如果不是登录请求，重定向到登录页
        if (!originalRequest.url?.includes("/auth/login")) {
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return Promise.reject(new AuthenticationError("Token expired"));
        }
      }

      // 处理网络错误
      if (!error.response) {
        return Promise.reject(
          new NetworkError(
            error.message || "Network error: Unable to connect to server"
          )
        );
      }

      // 处理 API 错误响应
      const responseData = error.response.data as
        | ApiResponse<unknown>
        | Record<string, unknown>;
      const apiError =
        responseData &&
        typeof responseData === "object" &&
        "error" in responseData
          ? ApiError.fromApiResponse(responseData as ApiResponse<unknown>)
          : new ApiError(
              `HTTP_${error.response.status}`,
              error.message || "Request failed",
              error.response.status
            );

      return Promise.reject(apiError);
    }
  );

  return instance;
}

// 导出单例实例
export const apiClient = createAxiosInstance();

/**
 * 重试逻辑
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // 如果是认证错误或客户端错误（4xx），不重试
      if (
        error instanceof AuthenticationError ||
        (error instanceof ApiError && error.statusCode && error.statusCode < 500)
      ) {
        throw error;
      }

      // 最后一次尝试，直接抛出错误
      if (i === maxRetries) {
        break;
      }

      // 等待后重试
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }

  throw lastError!;
}

