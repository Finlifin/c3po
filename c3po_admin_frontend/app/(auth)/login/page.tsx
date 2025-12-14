"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/lib/auth/store";
import { tokenStorage } from "@/lib/utils/storage";

// 登录表单验证 schema
const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "请输入用户名或邮箱")
    .max(255, "用户名或邮箱过长"),
  password: z.string().min(1, "请输入密码"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading, error } = useAuthStore();
  const hasRedirected = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // 页面加载时同步 token 到 cookie（修复 localStorage 有 token 但 cookie 没有的情况）
  useEffect(() => {
    tokenStorage.syncTokenToCookie();
  }, []);

  // 如果已认证，重定向
  useEffect(() => {
    if (isAuthenticated && !isLoading && !hasRedirected.current) {
      // 确保 token 已同步到 cookie（供 proxy 使用）
      const token = tokenStorage.getToken();
      
      // 如果 localStorage 中没有 token 或 token 已过期，清除认证状态
      if (!token || tokenStorage.isTokenExpired()) {
        return;
      }

      // 同步 token 到 cookie
      const expiryTime = tokenStorage.getTokenExpiry();
      if (expiryTime) {
        const remainingTime = expiryTime - Date.now();
        if (remainingTime > 0) {
          tokenStorage.setToken(token, remainingTime);
        }
      }

      // 检查 cookie 中是否有 token
      // 如果没有，等待一小段时间后再次检查（给 cookie 设置时间）
      if (!tokenStorage.hasCookieToken()) {
        setTimeout(() => {
          // 再次同步并检查
          tokenStorage.syncTokenToCookie();
          if (tokenStorage.hasCookieToken() && !hasRedirected.current) {
            hasRedirected.current = true;
            const redirect = searchParams.get("redirect") || "/dashboard";
            window.location.href = redirect;
          }
        }, 150);
        return;
      }

      // 只有在 cookie 中有 token 时才重定向，避免无限循环
      hasRedirected.current = true;
      const redirect = searchParams.get("redirect") || "/dashboard";
      // 使用 window.location.href 强制刷新，确保 proxy 能看到 cookie
      window.location.href = redirect;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.identifier, data.password);
      // 确保 token 已同步到 cookie
      tokenStorage.syncTokenToCookie();
      // 等待状态更新和 cookie 设置
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      // 设置重定向标志，避免 useEffect 重复跳转
      hasRedirected.current = true;
      const redirect = searchParams.get("redirect") || "/dashboard";
      // 使用 router.push 进行客户端导航
      router.push(redirect);
    } catch (err) {
      // 错误已在 store 中处理
      console.error("Login error:", err);
      hasRedirected.current = false; // 登录失败时重置标志
    }
  };

  return (
    <div 
      className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      style={{
        background: "linear-gradient(135deg, var(--danger-color) 0%, var(--warning-color) 100%)"
      }}
    >
      <div className="w-full max-w-md space-y-8">
        <div 
          className="bg-card rounded-[var(--border-radius-large)] p-[var(--spacing-xl)] shadow-heavy"
        >
          <div className="text-center mb-[var(--spacing-xl)]">
            <h2 className="text-[var(--font-size-2xl)] font-bold text-text-primary mb-[var(--spacing-sm)]">
              管理员登录
            </h2>
            <p className="text-text-secondary text-[var(--font-size-md)]">
              系统管理后台
            </p>
          </div>

          <div 
            className="bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.2)] rounded-[var(--border-radius)] p-[var(--spacing-md)] mb-[var(--spacing-lg)] text-[var(--font-size-sm)] text-danger"
          >
            ⚠️ 此区域仅供系统管理员使用，请确保您有相应的访问权限。
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="identifier"
                  className="block text-sm font-medium text-text-primary mb-[var(--spacing-sm)]"
                >
                  管理员账号
                </label>
                <input
                  {...register("identifier")}
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  className="w-full p-[var(--spacing-md)] border border-border rounded-[var(--border-radius)] text-[var(--font-size-md)] bg-card transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="请输入管理员账号"
                />
                {errors.identifier && (
                  <p className="mt-1 text-sm text-danger">
                    {errors.identifier.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-text-primary mb-[var(--spacing-sm)]"
                >
                  密码
                </label>
                <input
                  {...register("password")}
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="w-full p-[var(--spacing-md)] border border-border rounded-[var(--border-radius)] text-[var(--font-size-md)] bg-card transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder="请输入密码"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-danger">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-[var(--border-radius)] bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.2)] p-4">
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center rounded-[var(--border-radius)] bg-danger text-white px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all min-h-[44px]"
              >
                {isLoading ? "登录中..." : "登录"}
              </button>
            </div>
          </form>

          <div className="text-center mt-[var(--spacing-lg)]">
            <span className="text-text-tertiary text-[var(--font-size-sm)]">
              登录即表示您同意我们的服务条款和隐私政策
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <LoginForm />
    </Suspense>
  );
}

