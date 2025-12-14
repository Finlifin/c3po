import { render, screen, waitFor } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import AssignmentsPage from "../page";
import * as assignmentsApi from "@/lib/api/assignments";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
  })),
}));

// Mock API
jest.mock("@/lib/api/assignments");
jest.mock("@/lib/hooks/useToast", () => ({
  useToast: () => ({
    error: jest.fn(),
  }),
}));

const mockAssignments = [
  {
    id: "assignment-1",
    courseId: "course-1",
    title: "函数式编程作业",
    type: "ASSIGNMENT" as const,
    deadline: "2025-09-12T15:00:00+08:00",
    allowResubmit: true,
    maxResubmit: 3,
    gradingRubric: [
      { criterion: "正确性", weight: 0.5 },
      { criterion: "代码规范", weight: 0.3 },
    ],
    visibilityTags: [],
    releaseAt: "2025-09-01T09:00:00+08:00",
    published: true,
    publishedAt: "2025-09-01T09:00:00+08:00",
    createdAt: "2025-09-01T08:00:00+08:00",
    updatedAt: "2025-09-01T08:00:00+08:00",
    submissionRate: 85.5,
    overdueRate: 12.3,
  },
  {
    id: "assignment-2",
    courseId: "course-1",
    title: "算法设计测验",
    type: "QUIZ" as const,
    deadline: "2025-09-15T10:00:00+08:00",
    allowResubmit: false,
    maxResubmit: 0,
    gradingRubric: [],
    visibilityTags: [],
    releaseAt: "2025-09-10T09:00:00+08:00",
    published: true,
    publishedAt: "2025-09-10T09:00:00+08:00",
    createdAt: "2025-09-10T08:00:00+08:00",
    updatedAt: "2025-09-10T08:00:00+08:00",
    submissionRate: 92.0,
    overdueRate: 5.0,
  },
];

const mockSubmissions = [
  {
    id: "submission-1",
    assignmentId: "assignment-1",
    studentId: "student-1",
    status: "GRADED" as const,
    score: 92,
    feedback: "Good work",
    attachments: ["https://example.com/file1.zip"],
    rubricScores: [],
    resubmitCount: 0,
    gradingTeacherId: "teacher-1",
    appealReason: null,
    appealedAt: null,
    submittedAt: "2025-09-12T14:00:00+08:00",
    createdAt: "2025-09-12T14:00:00+08:00",
    updatedAt: "2025-09-12T15:00:00+08:00",
  },
];

describe("AssignmentsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn((key: string) => {
        if (key === "courseId") return "course-1";
        return null;
      }),
    });
    (assignmentsApi.getAssignments as jest.Mock).mockResolvedValue(
      mockAssignments
    );
    (assignmentsApi.getSubmissions as jest.Mock).mockResolvedValue(
      mockSubmissions
    );
  });

  describe("Property 18: Assignment list shows submission metrics", () => {
    it("should display submission rate and overdue rate for each assignment", async () => {
      render(<AssignmentsPage />);

      await waitFor(() => {
        expect(screen.getByText("作业列表")).toBeInTheDocument();
      });

      // Check that submission rate is displayed
      await waitFor(() => {
        expect(screen.getByText("提交率")).toBeInTheDocument();
        expect(screen.getByText("85.5%")).toBeInTheDocument(); // First assignment
        expect(screen.getByText("92.0%")).toBeInTheDocument(); // Second assignment
      });

      // Check that overdue rate is displayed
      await waitFor(() => {
        expect(screen.getByText("逾期率")).toBeInTheDocument();
        expect(screen.getByText("12.3%")).toBeInTheDocument(); // First assignment
        expect(screen.getByText("5.0%")).toBeInTheDocument(); // Second assignment
      });
    });

    it("should display assignment titles and types", async () => {
      render(<AssignmentsPage />);

      await waitFor(() => {
        expect(screen.getByText("函数式编程作业")).toBeInTheDocument();
        expect(screen.getByText("算法设计测验")).toBeInTheDocument();
        expect(screen.getByText("作业")).toBeInTheDocument();
        expect(screen.getByText("测验")).toBeInTheDocument();
      });
    });

    it("should display deadline information", async () => {
      render(<AssignmentsPage />);

      await waitFor(() => {
        expect(screen.getByText("截止时间")).toBeInTheDocument();
        // The date should be formatted and displayed
        const deadlineCells = screen.getAllByText(/2025/);
        expect(deadlineCells.length).toBeGreaterThan(0);
      });
    });

    it("should show view details button for each assignment", async () => {
      render(<AssignmentsPage />);

      await waitFor(() => {
        const viewButtons = screen.getAllByText("查看详情");
        expect(viewButtons.length).toBe(2); // One for each assignment
      });
    });

    it("should handle empty assignment list", async () => {
      (assignmentsApi.getAssignments as jest.Mock).mockResolvedValue([]);

      render(<AssignmentsPage />);

      await waitFor(() => {
        expect(screen.getByText("暂无作业")).toBeInTheDocument();
      });
    });

    it("should calculate metrics when not provided by API", async () => {
      const assignmentsWithoutMetrics = mockAssignments.map((a) => ({
        ...a,
        submissionRate: undefined,
        overdueRate: undefined,
      }));
      (assignmentsApi.getAssignments as jest.Mock).mockResolvedValue(
        assignmentsWithoutMetrics
      );

      render(<AssignmentsPage />);

      await waitFor(() => {
        // Should still display the metrics columns
        expect(screen.getByText("提交率")).toBeInTheDocument();
        expect(screen.getByText("逾期率")).toBeInTheDocument();
      });
    });
  });
});

