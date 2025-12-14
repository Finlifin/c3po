import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 公开路径（不需要认证）
const publicPaths = ["/login"];

// 检查路径是否为公开路径
function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 如果是公开路径，允许访问
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 检查 Token（从 cookie 或 header 中读取）
  // 注意：由于 proxy 在边缘运行时执行，无法直接访问 localStorage
  // 我们需要通过 cookie 或 header 传递 token
  const token = request.cookies.get("c3po_auth_token")?.value;

  // 如果没有 token，重定向到登录页
  if (!token && pathname !== "/login") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - 公开资源 (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};

