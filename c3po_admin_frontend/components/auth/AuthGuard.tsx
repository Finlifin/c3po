"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth/store";
import { tokenStorage } from "@/lib/utils/storage";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * 认证守卫组件
 * 在客户端检查认证状态，未认证则重定向到登录页
 */
export function AuthGuard({ children, fallback = null }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    const checkAuthentication = async () => {
      // 检查 token 是否存在
      const token = tokenStorage.getToken();

      if (!token || tokenStorage.isTokenExpired()) {
        // 没有 token 或已过期，重定向到登录页
        const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
        router.push(loginUrl);
        return;
      }

      // 有 token，验证用户信息
      if (!isAuthenticated) {
        await checkAuth();
      }
    };

    checkAuthentication();
  }, [isAuthenticated, isLoading, checkAuth, pathname, router]);

  // 加载中显示 fallback
  if (isLoading) {
    return <>{fallback}</>;
  }

  // 未认证时不渲染子组件（会触发重定向）
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

