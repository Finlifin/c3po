"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

// 路由到标签的映射
const routeLabels: Record<string, string> = {
  dashboard: "仪表板",
  users: "用户管理",
  courses: "课程管理",
  assignments: "作业管理",
  scores: "成绩管理",
  approvals: "审批管理",
  notifications: "通知管理",
  settings: "系统设置",
};

export function Breadcrumb() {
  const pathname = usePathname();

  // 根据路径生成面包屑
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];

    // 首页总是第一个
    if (pathname !== "/dashboard") {
      items.push({ label: "仪表板", href: "/dashboard" });
    }

    // 解析路径段
    const segments = pathname.split("/").filter(Boolean);

    segments.forEach((segment, index) => {
      const isLast = index === segments.length - 1;
      const href = "/" + segments.slice(0, index + 1).join("/");

      // 尝试从映射中获取标签，如果没有则使用 segment
      const label = routeLabels[segment] || segment;

      items.push({
        label,
        href: isLast ? undefined : href,
      });
    });

    return items;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
      <Link
        href="/dashboard"
        className="flex items-center hover:text-red-600 transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-red-600 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

