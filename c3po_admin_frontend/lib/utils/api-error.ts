import type { ApiResponse } from "@/types/api";

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }

  static fromApiResponse<T>(response: ApiResponse<T>): ApiError {
    if (!response.error) {
      return new ApiError("UNKNOWN_ERROR", "Unknown error occurred");
    }

    return new ApiError(
      response.error.code,
      response.error.message,
      undefined,
      response.error.details
    );
  }
}

/**
 * 网络错误类
 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

/**
 * 认证错误类
 */
export class AuthenticationError extends Error {
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

