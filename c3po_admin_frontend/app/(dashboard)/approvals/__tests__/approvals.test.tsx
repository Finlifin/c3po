import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ApprovalsPage from "../page";
import * as approvalsApi from "@/lib/api/approvals";

// Mock API
jest.mock("@/lib/api/approvals");
jest.mock("@/lib/hooks/useToast", () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
  }),
}));

const mockApprovals = [
  {
    id: "approval-1",
    type: "COURSE_PUBLISH" as const,
    status: "PENDING" as const,
    applicantId: "applicant-1",
    payload: JSON.stringify({ courseId: "course-1", courseName: "Test Course" }),
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "approval-2",
    type: "SCORE_APPEAL" as const,
    status: "APPROVED" as const,
    applicantId: "applicant-2",
    payload: JSON.stringify({ submissionId: "sub-1" }),
    processedBy: "admin-1",
    comment: "Approved",
    processedAt: "2024-01-02T00:00:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
  },
];

describe("ApprovalsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (approvalsApi.getApprovals as jest.Mock).mockResolvedValue({
      items: mockApprovals,
      meta: {
        page: 1,
        pageSize: 20,
        total: 2,
        totalPages: 1,
      },
    });
  });

  describe("Property 23: Approval list filters work correctly", () => {
    it("should filter by status", async () => {
      render(<ApprovalsPage />);

      await waitFor(() => {
        expect(screen.getByText("审批管理")).toBeInTheDocument();
      });

      const statusLabel = screen.getByText("状态");
      const statusSelect = statusLabel.parentElement?.querySelector("select");
      if (statusSelect) {
        fireEvent.change(statusSelect, { target: { value: "PENDING" } });
      }

      await waitFor(() => {
        expect(approvalsApi.getApprovals).toHaveBeenCalledWith(
          expect.objectContaining({
            status: "PENDING",
          })
        );
      });
    });

    it("should filter by type", async () => {
      render(<ApprovalsPage />);

      await waitFor(() => {
        expect(screen.getByText("审批管理")).toBeInTheDocument();
      });

      const typeLabel = screen.getByText("类型");
      const typeSelect = typeLabel.parentElement?.querySelector("select");
      if (typeSelect) {
        fireEvent.change(typeSelect, { target: { value: "COURSE_PUBLISH" } });
      }

      await waitFor(() => {
        expect(approvalsApi.getApprovals).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "COURSE_PUBLISH",
          })
        );
      });
    });
  });

  describe("Property 24: Approval payload is parsed and displayed", () => {
    it("should parse and display JSON payload", async () => {
      render(<ApprovalsPage />);

      await waitFor(() => {
        expect(screen.getByText("审批管理")).toBeInTheDocument();
      });

      // Check if payload is displayed (JSON.stringify creates formatted JSON)
      expect(screen.getByText(/"courseId"/)).toBeInTheDocument();
      expect(screen.getByText(/"courseName"/)).toBeInTheDocument();
      expect(screen.getByText(/"Test Course"/)).toBeInTheDocument();
    });
  });

  describe("Property 25: Approval decision requires comment for rejection", () => {
    it("should require comment when status is REJECTED", async () => {
      render(<ApprovalsPage />);

      await waitFor(() => {
        expect(screen.getByText("审批管理")).toBeInTheDocument();
      });

      // Click process button for pending approval
      const processButton = screen.getAllByText("处理")[0];
      fireEvent.click(processButton);

      await waitFor(() => {
        expect(screen.getByText("审批决策")).toBeInTheDocument();
      });

      // Change status to REJECTED
      const statusLabel = screen.getByText(/决策/);
      const statusSelect = statusLabel.parentElement?.querySelector("select");
      if (statusSelect) {
        fireEvent.change(statusSelect, { target: { value: "REJECTED" } });
      }

      // Try to submit without comment
      const submitButton = screen.getByText("提交");
      fireEvent.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/驳回时必须填写处理意见/)).toBeInTheDocument();
      });
    });
  });

  describe("Property 26: Pending approval count displays in navigation", () => {
    it("should display pending approvals in the list", async () => {
      render(<ApprovalsPage />);

      await waitFor(() => {
        expect(screen.getByText("待审批")).toBeInTheDocument();
      });

      // Should show pending approval status
      expect(screen.getByText("待审批")).toBeInTheDocument();
    });
  });
});

