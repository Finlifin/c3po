"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import type { ReactNode } from "react";
import { getApprovals } from "@/lib/api/approvals";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        const response = await getApprovals({ status: "PENDING", page: 1, pageSize: 1 });
        setPendingApprovalCount(response.meta.total);
      } catch (err) {
        // Silently fail - don't block the page
        console.error("Failed to load pending approval count:", err);
      }
    };

    loadPendingCount();
    // Refresh every 30 seconds
    const interval = setInterval(loadPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthGuard>
      <div className="flex h-screen bg-bg-page">
        <Sidebar
          pendingApprovalCount={pendingApprovalCount}
          onCollapsedChange={setSidebarCollapsed}
        />
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          <TopBar pendingApprovalCount={pendingApprovalCount} />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <Breadcrumb />
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

