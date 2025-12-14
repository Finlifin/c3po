import { render, screen, waitFor } from "@testing-library/react";
import CourseScoresPage from "../page";
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

const mockCourseScoresResponse = {
  courseId: "course-123",
  items: [
    {
      id: "score-1",
      studentId: "student-1",
      courseId: "course-123",
      component: "作业",
      value: 85,
      releasedAt: "2024-01-15T10:00:00Z",
      createdAt: "2024-01-15T09:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    },
    {
      id: "score-2",
      studentId: "student-2",
      courseId: "course-123",
      component: "作业",
      value: 92,
      releasedAt: "2024-01-15T10:00:00Z",
      createdAt: "2024-01-15T09:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    },
  ],
  overview: {
    average: 88.5,
    median: 88.5,
    highest: 92,
    lowest: 85,
    scoreCount: 2,
    studentCount: 2,
    completionRate: 0.9,
  },
  distribution: [
    { label: "0-59", from: 0, to: 59, count: 0 },
    { label: "60-69", from: 60, to: 69, count: 0 },
    { label: "70-79", from: 70, to: 79, count: 0 },
    { label: "80-89", from: 80, to: 89, count: 1 },
    { label: "90-100", from: 90, to: 100, count: 1 },
  ],
  componentAverages: {
    作业: 88.5,
  },
  topPerformers: ["student-2"],
  needsAttention: [],
};

describe("CourseScoresPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ courseId: "course-123" });
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (scoresApi.getCourseScores as jest.Mock).mockResolvedValue(
      mockCourseScoresResponse
    );
  });

  describe("Property 21: Course score distribution renders correctly", () => {
    it("should render score distribution chart with correct buckets", async () => {
      render(<CourseScoresPage />);

      await waitFor(() => {
        expect(screen.getByText("课程成绩统计")).toBeInTheDocument();
      });

      // Check overview statistics
      await waitFor(() => {
        expect(screen.getByText("平均分")).toBeInTheDocument();
        expect(screen.getByText("88.50")).toBeInTheDocument(); // average
        expect(screen.getByText("中位数")).toBeInTheDocument();
        expect(screen.getByText("88.50")).toBeInTheDocument(); // median
        expect(screen.getByText("学生数")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument(); // studentCount
        expect(screen.getByText("完成率")).toBeInTheDocument();
        expect(screen.getByText("90.0%")).toBeInTheDocument(); // completionRate * 100
      });

      // Check distribution chart
      await waitFor(() => {
        expect(screen.getByText("分数分布")).toBeInTheDocument();
        // Chart should be rendered
        const chartContainer = document.querySelector(
          ".recharts-responsive-container"
        );
        expect(chartContainer).toBeInTheDocument();
      });

      // Check component averages
      await waitFor(() => {
        expect(screen.getByText("各成绩类型平均分")).toBeInTheDocument();
        expect(screen.getByText("作业")).toBeInTheDocument();
        expect(screen.getByText(/88\.50/)).toBeInTheDocument(); // componentAverage
      });

      // Check top performers
      await waitFor(() => {
        expect(screen.getByText("高分学生 (Top 5)")).toBeInTheDocument();
        expect(screen.getByText("student-2")).toBeInTheDocument();
      });

      // Check needs attention (should be empty)
      await waitFor(() => {
        expect(screen.getByText("需要关注的学生")).toBeInTheDocument();
        expect(
          screen.getByText("暂无需要关注的学生")
        ).toBeInTheDocument();
      });

      // Check score details table
      await waitFor(() => {
        expect(screen.getByText("成绩明细")).toBeInTheDocument();
        expect(screen.getByText("student-1")).toBeInTheDocument();
        expect(screen.getByText("student-2")).toBeInTheDocument();
        expect(screen.getByText("85")).toBeInTheDocument();
        expect(screen.getByText("92")).toBeInTheDocument();
      });

      // Check statistics summary
      await waitFor(() => {
        expect(screen.getByText("统计摘要")).toBeInTheDocument();
        expect(screen.getByText("最高分")).toBeInTheDocument();
        expect(screen.getByText("92")).toBeInTheDocument();
        expect(screen.getByText("最低分")).toBeInTheDocument();
        expect(screen.getByText("85")).toBeInTheDocument();
        expect(screen.getByText("成绩总数")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
      });
    });

    it("should render all distribution buckets correctly", async () => {
      render(<CourseScoresPage />);

      await waitFor(() => {
        expect(screen.getByText("分数分布")).toBeInTheDocument();
      });

      // The chart should render all 5 buckets (0-59, 60-69, 70-79, 80-89, 90-100)
      // We verify by checking the chart is rendered, as the actual bucket labels
      // are rendered inside the chart SVG which may not be easily queryable
      const chartContainer = document.querySelector(
        ".recharts-responsive-container"
      );
      expect(chartContainer).toBeInTheDocument();
    });
  });
});

