import { render, screen, waitFor } from "@testing-library/react";
import StudentScoresPage from "../page";
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

const mockStudentScoresResponse = {
  studentId: "student-123",
  items: [
    {
      id: "score-1",
      studentId: "student-123",
      courseId: "course-1",
      component: "作业",
      value: 85,
      releasedAt: "2024-01-15T10:00:00Z",
      createdAt: "2024-01-15T09:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
    },
    {
      id: "score-2",
      studentId: "student-123",
      courseId: "course-1",
      component: "考试",
      value: 92,
      releasedAt: "2024-01-20T10:00:00Z",
      createdAt: "2024-01-20T09:00:00Z",
      updatedAt: "2024-01-20T10:00:00Z",
    },
  ],
  summary: {
    overallAverage: 88.5,
    median: 88.5,
    gpa: 3.5,
    progress: {
      totalCourses: 2,
      totalAssignments: 5,
      completedAssignments: 4,
      gradedAssignments: 3,
      overdueAssignments: 1,
    },
    courses: [
      {
        courseId: "course-1",
        courseName: "数学",
        average: 88.5,
        highest: 92,
        lowest: 85,
        scoreCount: 2,
        componentAverages: {
          作业: 85,
          考试: 92,
        },
        progress: {
          totalAssignments: 3,
          completedAssignments: 2,
          gradedAssignments: 2,
          overdueAssignments: 0,
        },
      },
    ],
    insights: ["整体表现优秀，继续保持。"],
  },
  trend: [
    {
      courseName: "数学",
      component: "作业",
      value: 85,
      timestamp: "2024-01-15T10:00:00Z",
    },
    {
      courseName: "数学",
      component: "考试",
      value: 92,
      timestamp: "2024-01-20T10:00:00Z",
    },
  ],
  exportInfo: {
    available: true,
    suggestedJobType: "SCORE_EXPORT",
    suggestedParams: {
      studentId: "student-123",
    },
    instructions: "调用 POST /api/v1/jobs/reports 并传入建议参数即可生成成绩导出任务。",
  },
};

describe("StudentScoresPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ studentId: "student-123" });
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (scoresApi.getStudentScores as jest.Mock).mockResolvedValue(
      mockStudentScoresResponse
    );
  });

  describe("Property 20: Student scores display all sections", () => {
    it("should display score items, summary, and trend data", async () => {
      render(<StudentScoresPage />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText("学生成绩详情")).toBeInTheDocument();
      });

      // Check summary section (overall average, GPA, progress)
      await waitFor(() => {
        expect(screen.getByText("平均分")).toBeInTheDocument();
        expect(screen.getByText("88.50")).toBeInTheDocument(); // overallAverage
        expect(screen.getByText("GPA")).toBeInTheDocument();
        expect(screen.getByText("3.50")).toBeInTheDocument(); // gpa
        expect(screen.getByText("完成作业数")).toBeInTheDocument();
        expect(screen.getByText(/4 \/ 5/)).toBeInTheDocument(); // completedAssignments / totalAssignments
      });

      // Check progress overview section
      await waitFor(() => {
        expect(screen.getByText("学习进度概览")).toBeInTheDocument();
        expect(screen.getByText("总课程数")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument(); // totalCourses
        expect(screen.getByText("总作业数")).toBeInTheDocument();
        expect(screen.getByText("5")).toBeInTheDocument(); // totalAssignments
        expect(screen.getByText("已完成")).toBeInTheDocument();
        expect(screen.getByText("4")).toBeInTheDocument(); // completedAssignments
        expect(screen.getByText("已评分")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument(); // gradedAssignments
        expect(screen.getByText("逾期作业")).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument(); // overdueAssignments
      });

      // Check trend chart section
      await waitFor(() => {
        expect(screen.getByText("学习趋势")).toBeInTheDocument();
        // Chart should be rendered
        const chartContainer = document.querySelector(
          ".recharts-responsive-container"
        );
        expect(chartContainer).toBeInTheDocument();
      });

      // Check course summary table
      await waitFor(() => {
        expect(screen.getByText("各课程成绩汇总")).toBeInTheDocument();
        expect(screen.getByText("数学")).toBeInTheDocument(); // courseName
        expect(screen.getByText(/88\.50/)).toBeInTheDocument(); // average
        expect(screen.getByText("92")).toBeInTheDocument(); // highest
        expect(screen.getByText("85")).toBeInTheDocument(); // lowest
      });

      // Check insights section
      await waitFor(() => {
        expect(screen.getByText("学习建议")).toBeInTheDocument();
        expect(screen.getByText("整体表现优秀，继续保持。")).toBeInTheDocument();
      });

      // Check score items table
      await waitFor(() => {
        expect(screen.getByText("成绩明细")).toBeInTheDocument();
        expect(screen.getByText("成绩类型")).toBeInTheDocument();
        expect(screen.getByText("作业")).toBeInTheDocument();
        expect(screen.getByText("考试")).toBeInTheDocument();
        expect(screen.getByText("85")).toBeInTheDocument();
        expect(screen.getByText("92")).toBeInTheDocument();
      });
    });

    it("should display export info when available", async () => {
      render(<StudentScoresPage />);

      await waitFor(() => {
        expect(screen.getByText("导出成绩")).toBeInTheDocument();
        expect(
          screen.getByText(/调用 POST \/api\/v1\/jobs\/reports/)
        ).toBeInTheDocument();
      });
    });
  });
});

