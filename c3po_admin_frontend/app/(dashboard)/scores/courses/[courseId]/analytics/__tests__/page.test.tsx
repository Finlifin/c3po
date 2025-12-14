import { render, screen, waitFor } from "@testing-library/react";
import CourseAnalyticsPage from "../page";
import * as scoresApi from "@/lib/api/scores";
import { useParams, useRouter } from "next/navigation";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock API
jest.mock("@/lib/api/scores");
jest.mock("@/lib/hooks/useToast", () => ({
  useToast: () => ({
    error: jest.fn(),
  }),
}));

const mockRouter = {
  back: jest.fn(),
  push: jest.fn(),
};

const mockCourseAnalyticsResponse = {
  completionRate: 0.85,
  averageScore: 88.5,
  medianScore: 88.0,
  enrolledStudents: 30,
  totalAssignments: 10,
  gradedSubmissions: 255,
  pendingSubmissions: 45,
  overdueStudents: ["student-1", "student-2"],
  difficultAssignments: ["作业3", "考试1"],
  atRiskStudents: ["student-3", "student-4", "student-5"],
  insights: [
    "整体得分表现优异，建议进一步挖掘拔尖内容。",
    "存在 2 名学生存在逾期或延迟提交，建议发送提醒。",
    "建议复盘以下难度较高的作业：作业3、考试1",
    "共 3 名学生处于学业风险区间。",
  ],
};

describe("CourseAnalyticsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ courseId: "course-123" });
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (scoresApi.getCourseAnalytics as jest.Mock).mockResolvedValue(
      mockCourseAnalyticsResponse
    );
  });

  describe("Property 22: Course analytics displays all metrics", () => {
    it("should display all analytics metrics", async () => {
      render(<CourseAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText("课程分析")).toBeInTheDocument();
      });

      // Check core metrics cards
      await waitFor(() => {
        expect(screen.getByText("完成率")).toBeInTheDocument();
        expect(screen.getByText("85.0%")).toBeInTheDocument(); // completionRate * 100
        expect(screen.getByText("平均分")).toBeInTheDocument();
        expect(screen.getByText("88.50")).toBeInTheDocument(); // averageScore
        expect(screen.getByText("中位数")).toBeInTheDocument();
        expect(screen.getByText("88.00")).toBeInTheDocument(); // medianScore
        expect(screen.getByText("选课学生数")).toBeInTheDocument();
        expect(screen.getByText("30")).toBeInTheDocument(); // enrolledStudents
      });

      // Check submission statistics
      await waitFor(() => {
        expect(screen.getByText("作业提交统计")).toBeInTheDocument();
        expect(screen.getByText("总作业数")).toBeInTheDocument();
        expect(screen.getByText("10")).toBeInTheDocument(); // totalAssignments
        expect(screen.getByText("已评分提交")).toBeInTheDocument();
        expect(screen.getByText("255")).toBeInTheDocument(); // gradedSubmissions
        expect(screen.getByText("待评分提交")).toBeInTheDocument();
        expect(screen.getByText("45")).toBeInTheDocument(); // pendingSubmissions
      });

      // Check overdue students
      await waitFor(() => {
        expect(screen.getByText(/滞后学生/)).toBeInTheDocument();
        expect(screen.getByText(/2 人/)).toBeInTheDocument(); // overdueStudents.length
        expect(screen.getByText("student-1")).toBeInTheDocument();
        expect(screen.getByText("student-2")).toBeInTheDocument();
      });

      // Check at-risk students
      await waitFor(() => {
        expect(screen.getByText(/风险学生/)).toBeInTheDocument();
        expect(screen.getByText(/3 人/)).toBeInTheDocument(); // atRiskStudents.length
        expect(screen.getByText("student-3")).toBeInTheDocument();
        expect(screen.getByText("student-4")).toBeInTheDocument();
        expect(screen.getByText("student-5")).toBeInTheDocument();
      });

      // Check difficult assignments
      await waitFor(() => {
        expect(screen.getByText("难度较高的作业")).toBeInTheDocument();
        expect(screen.getByText("作业3")).toBeInTheDocument();
        expect(screen.getByText("考试1")).toBeInTheDocument();
      });

      // Check insights
      await waitFor(() => {
        expect(screen.getByText("分析洞察")).toBeInTheDocument();
        expect(
          screen.getByText("整体得分表现优异，建议进一步挖掘拔尖内容。")
        ).toBeInTheDocument();
        expect(
          screen.getByText(/存在 2 名学生存在逾期或延迟提交/)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/建议复盘以下难度较高的作业/)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/共 3 名学生处于学业风险区间/)
        ).toBeInTheDocument();
      });

      // Check export functionality hint
      await waitFor(() => {
        expect(screen.getByText("导出课程分析报告")).toBeInTheDocument();
        expect(
          screen.getByText(/您可以创建报表任务来导出课程分析数据/)
        ).toBeInTheDocument();
        expect(screen.getByText("创建导出任务")).toBeInTheDocument();
      });
    });

    it("should handle null averageScore and medianScore", async () => {
      const responseWithNullScores = {
        ...mockCourseAnalyticsResponse,
        averageScore: null,
        medianScore: null,
      };
      (scoresApi.getCourseAnalytics as jest.Mock).mockResolvedValue(
        responseWithNullScores
      );

      render(<CourseAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText("平均分")).toBeInTheDocument();
        // Should show "—" for null values
        const averageCard = screen.getByText("平均分").closest(".grid");
        expect(averageCard).toBeInTheDocument();
      });
    });

    it("should handle empty lists gracefully", async () => {
      const responseWithEmptyLists = {
        ...mockCourseAnalyticsResponse,
        overdueStudents: [],
        difficultAssignments: [],
        atRiskStudents: [],
      };
      (scoresApi.getCourseAnalytics as jest.Mock).mockResolvedValue(
        responseWithEmptyLists
      );

      render(<CourseAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText("课程分析")).toBeInTheDocument();
      });

      // Sections with empty lists should not be displayed (or should show empty message)
      // The implementation may hide these sections or show "暂无" messages
      await waitFor(() => {
        // Check that core metrics are still displayed
        expect(screen.getByText("完成率")).toBeInTheDocument();
        expect(screen.getByText("作业提交统计")).toBeInTheDocument();
      });
    });
  });
});

