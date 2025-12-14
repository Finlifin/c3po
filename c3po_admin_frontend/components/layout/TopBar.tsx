"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, User, LogOut, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/lib/auth/store";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TopBarProps {
  pendingApprovalCount?: number;
}

export function TopBar({ pendingApprovalCount = 0 }: TopBarProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target as Node)
      ) {
        setNotificationMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const userInitial = user?.username?.[0]?.toUpperCase() || "U";

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 shadow-light">
      {/* Left side - can be used for page title or breadcrumbs */}
      <div className="flex-1"></div>

      {/* Right side - notifications and user menu */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={notificationMenuRef}>
          <button
            onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
            className="relative p-2 rounded-[var(--border-radius)] hover:bg-bg-page transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-text-secondary" />
            {pendingApprovalCount > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-danger text-white text-xs rounded-full flex items-center justify-center">
                {pendingApprovalCount > 99 ? "99+" : pendingApprovalCount}
              </span>
            )}
          </button>

          {notificationMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-card rounded-[var(--border-radius)] shadow-heavy border border-border py-2 z-50">
              <div className="px-4 py-2 border-b border-border">
                <h3 className="font-semibold text-text-primary">通知</h3>
              </div>
              {pendingApprovalCount > 0 ? (
                <div className="px-4 py-3">
                  <Link
                    href="/approvals"
                    className="text-sm text-text-secondary hover:text-danger transition-colors"
                    onClick={() => setNotificationMenuOpen(false)}
                  >
                    您有 {pendingApprovalCount} 个待审批事项
                  </Link>
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-text-tertiary text-sm">
                  暂无通知
                </div>
              )}
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 px-3 py-2 rounded-[var(--border-radius)] hover:bg-bg-page transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-danger text-white flex items-center justify-center text-sm font-medium">
              {userInitial}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-text-primary">
                {user?.username || "用户"}
              </div>
              <div className="text-xs text-text-secondary">
                {user?.role === "ADMIN"
                  ? "管理员"
                  : user?.role === "TEACHER"
                    ? "教师"
                    : "学生"}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-text-secondary hidden md:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card rounded-[var(--border-radius)] shadow-heavy border border-border py-2 z-50">
              <Link
                href="/profile"
                className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-bg-page transition-colors"
                onClick={() => setUserMenuOpen(false)}
              >
                <User className="w-4 h-4" />
                个人中心
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-bg-page transition-colors"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

