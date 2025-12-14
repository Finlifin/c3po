import { apiClient, withRetry } from "./client";
import { tokenStorage } from "@/lib/utils/storage";
import type {
  LoginCredentials,
  AuthResponse,
  ProfileResponse,
} from "@/types/api";

/**
 * 登录
 */
export async function login(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  const response = await withRetry(() =>
    apiClient.post<AuthResponse>("/auth/login", credentials)
  );

  // 响应可能是直接的 AuthResponse 或包装在 ApiResponse 中
  const authResponse =
    (response.data as unknown as { data?: AuthResponse }).data ||
    (response.data as AuthResponse);

  // 存储 Token
  tokenStorage.setToken(authResponse.accessToken, authResponse.expiresIn);

  return authResponse;
}

/**
 * 登出
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } catch (error) {
    // 即使 API 调用失败，也要清除本地 Token
    console.error("Logout API call failed:", error);
  } finally {
    // 清除本地存储的 Token
    tokenStorage.clearToken();
  }
}

/**
 * 刷新 Token（如果需要）
 * 注意：根据 API 文档，当前后端可能不支持单独的 refresh token 端点
 * 这里保留接口以便将来扩展
 */
export async function refreshToken(token: string): Promise<AuthResponse> {
  const response = await withRetry(() =>
    apiClient.post<AuthResponse>("/auth/refresh", { token })
  );

  // 响应可能是直接的 AuthResponse 或包装在 ApiResponse 中
  const authResponse =
    (response.data as unknown as { data?: AuthResponse }).data ||
    (response.data as AuthResponse);

  // 更新存储的 Token
  tokenStorage.setToken(authResponse.accessToken, authResponse.expiresIn);

  return authResponse;
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<ProfileResponse> {
  const response = await withRetry(() =>
    apiClient.get<ProfileResponse>("/auth/me")
  );

  // 响应可能是直接的 ProfileResponse 或包装在 ApiResponse 中
  return (
    (response.data as unknown as { data?: ProfileResponse }).data ||
    (response.data as ProfileResponse)
  );
}

