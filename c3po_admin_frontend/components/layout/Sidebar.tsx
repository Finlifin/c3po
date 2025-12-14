"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  BarChart3,
  ClipboardList,
  Bell,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth/store";
import { useRouter } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "仪表板", icon: LayoutDashboard },
  { href: "/users", label: "用户管理", icon: Users },
  { href: "/courses", label: "课程管理", icon: BookOpen },
  { href: "/assignments", label: "作业管理", icon: FileText },
  { href: "/scores", label: "成绩管理", icon: BarChart3 },
  { href: "/approvals", label: "审批管理", icon: ClipboardList },
  { href: "/notifications", label: "通知管理", icon: Bell },
  { href: "/settings", label: "系统设置", icon: Settings },
];

interface SidebarProps {
  pendingApprovalCount?: number;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ pendingApprovalCount = 0, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (onCollapsedChange) {
      onCollapsedChange(collapsed);
    }
  }, [collapsed, onCollapsedChange]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => !prev);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-[var(--border-radius)] bg-card shadow-medium"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? (
          <X className="w-6 h-6 text-text-primary" />
        ) : (
          <Menu className="w-6 h-6 text-text-primary" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-card border-r border-border 
          transition-all duration-300 z-40
          ${collapsed ? "w-20" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            {!collapsed && (
              <h1 className="text-xl font-bold text-danger">智慧学习平台</h1>
            )}
            <button
              onClick={toggleCollapsed}
              className="hidden lg:block p-2 rounded-[var(--border-radius)] hover:bg-bg-page transition-colors"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-[var(--border-radius)]
                        transition-colors relative
                        ${
                          active
                            ? "bg-[rgba(255,59,48,0.1)] text-danger font-medium"
                            : "text-text-secondary hover:bg-bg-page"
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                      {item.href === "/approvals" && pendingApprovalCount > 0 && (
                        <span className="ml-auto bg-danger text-white text-xs font-medium px-2 py-0.5 rounded-full">
                          {pendingApprovalCount > 99 ? "99+" : pendingApprovalCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout */}
          <div className="border-t border-border p-4">
            <button
              onClick={handleLogout}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-[var(--border-radius)]
                text-text-secondary hover:bg-bg-page
                transition-colors
              `}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>退出登录</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

