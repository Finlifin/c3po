import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "../page";
import * as dashboardApi from "@/lib/api/dashboard";

// Mock API
jest.mock("@/lib/api/dashboard");
jest.mock("@/lib/hooks/useToast", () => ({
  useToast: () => ({
    error: jest.fn(),
  }),
}));

const mockOverview = {
  totalMembers: 2456,
  activeMembers: 1892,
  totalActivities: 89,
  pendingApplications: 7,
};

const mockUsageTrend = {
  dates: ["2024-01-01", "2024-01-02", "2024-01-03"],
  activeUsers: [100, 120, 110],
  courseVisits: [50, 60, 55],
  assignmentSubmissions: [30, 40, 35],
};

const mockPendingTasks = {
  pendingApplications: 7,
  activityCount: 89,
  activeMembers: 1892,
  totalMembers: 2456,
};

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dashboardApi.getDashboardOverview as jest.Mock).mockResolvedValue(
      mockOverview
    );
    (dashboardApi.getDashboardUsageTrend as jest.Mock).mockResolvedValue(
      mockUsageTrend
    );
    (dashboardApi.getDashboardPendingTasks as jest.Mock).mockResolvedValue(
      mockPendingTasks
    );
  });

  describe("Property 6: Dashboard displays all overview metrics", () => {
    it("should display all overview metrics", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("总成员数")).toBeInTheDocument();
        expect(screen.getByText("活跃成员数")).toBeInTheDocument();
        expect(screen.getByText("活动总数")).toBeInTheDocument();
        expect(screen.getByText("待审批数")).toBeInTheDocument();
      });

      expect(screen.getByText("2,456")).toBeInTheDocument(); // totalMembers
      expect(screen.getByText("1,892")).toBeInTheDocument(); // activeMembers
      expect(screen.getByText("89")).toBeInTheDocument(); // totalActivities
      expect(screen.getByText("7")).toBeInTheDocument(); // pendingApplications
    });
  });

  describe("Property 7: Usage trend chart renders with correct data", () => {
    it("should render usage trend chart", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("使用趋势（最近 7 天）")).toBeInTheDocument();
      });

      // Chart should be rendered (Recharts creates SVG)
      const chartContainer = document.querySelector(".recharts-responsive-container");
      expect(chartContainer).toBeInTheDocument();
    });
  });

  describe("Property 8: Pending tasks display all required fields", () => {
    it("should display all pending task fields", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("待处理任务")).toBeInTheDocument();
        expect(screen.getByText(/待审批申请/)).toBeInTheDocument();
        expect(screen.getByText("活动总数")).toBeInTheDocument();
        expect(screen.getByText("活跃成员")).toBeInTheDocument();
        expect(screen.getByText("总成员数")).toBeInTheDocument();
      });
    });
  });

  describe("Property 9: API errors show user-friendly messages", () => {
    it("should display error message and retry button on API error", async () => {
      const error = new Error("Network error");
      (dashboardApi.getDashboardOverview as jest.Mock).mockRejectedValue(error);

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("加载失败")).toBeInTheDocument();
        expect(screen.getByText("重试")).toBeInTheDocument();
      });
    });
  });
});

