import { render, screen, waitFor } from "@testing-library/react";
import { useParams } from "next/navigation";
import SubmissionDetailPage from "../page";
import * as assignmentsApi from "@/lib/api/assignments";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
    useParams: jest.fn(),
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

const mockAssignment = {
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
        { criterion: "创新性", weight: 0.2 },
    ],
    visibilityTags: [],
    releaseAt: "2025-09-01T09:00:00+08:00",
    published: true,
    publishedAt: "2025-09-01T09:00:00+08:00",
    createdAt: "2025-09-01T08:00:00+08:00",
    updatedAt: "2025-09-01T08:00:00+08:00",
};

const mockSubmission = {
    id: "submission-1",
    assignmentId: "assignment-1",
    studentId: "student-1",
    status: "GRADED" as const,
    score: 86,
    feedback: "整体表现不错，注意异常处理。",
    attachments: [
        "https://oss.smart-learning.edu/tmp/submission-1.zip",
        "https://oss.smart-learning.edu/tmp/submission-2.pdf",
    ],
    rubricScores: [
        { criterion: "正确性", score: 45 },
        { criterion: "代码规范", score: 26 },
        { criterion: "创新性", score: 15 },
    ],
    resubmitCount: 1,
    gradingTeacherId: "teacher-1",
    appealReason: null,
    appealedAt: null,
    submittedAt: "2025-09-12T14:00:00+08:00",
    createdAt: "2025-09-12T14:00:00+08:00",
    updatedAt: "2025-09-12T15:00:00+08:00",
};

describe("SubmissionDetailPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useParams as jest.Mock).mockReturnValue({
            assignmentId: "assignment-1",
            submissionId: "submission-1",
        });
        (assignmentsApi.getSubmission as jest.Mock).mockResolvedValue(
            mockSubmission
        );
        (assignmentsApi.getAssignment as jest.Mock).mockResolvedValue(
            mockAssignment
        );
    });

    describe("Property 19: Submission details include all fields", () => {
        it("should display all submission fields including attachments, scores, feedback, and Rubric", async () => {
            render(<SubmissionDetailPage />);

            await waitFor(() => {
                expect(screen.getByText(/函数式编程作业/)).toBeInTheDocument();
            });

            // Check student ID
            await waitFor(() => {
                expect(screen.getByText(/学生 ID: student-1/)).toBeInTheDocument();
            });

            // Check status
            await waitFor(() => {
                expect(screen.getByText("已评分")).toBeInTheDocument();
            });

            // Check score
            await waitFor(() => {
                expect(screen.getByText("86 / 100")).toBeInTheDocument();
                expect(screen.getByText("得分")).toBeInTheDocument();
            });

            // Check feedback
            await waitFor(() => {
                expect(screen.getByText("教师反馈")).toBeInTheDocument();
                expect(
                    screen.getByText("整体表现不错，注意异常处理。")
                ).toBeInTheDocument();
            });

            // Check attachments
            await waitFor(() => {
                expect(screen.getByText("附件")).toBeInTheDocument();
                expect(screen.getByText(/submission-1.zip/)).toBeInTheDocument();
                expect(screen.getByText(/submission-2.pdf/)).toBeInTheDocument();
                const downloadButtons = screen.getAllByText("下载");
                expect(downloadButtons.length).toBe(2); // One for each attachment
            });

            // Check Rubric scores
            await waitFor(() => {
                expect(screen.getByText("评分标准详情")).toBeInTheDocument();
                expect(screen.getByText("正确性")).toBeInTheDocument();
                expect(screen.getByText("代码规范")).toBeInTheDocument();
                expect(screen.getByText("创新性")).toBeInTheDocument();
                expect(screen.getByText("45 / 50")).toBeInTheDocument(); // 正确性: 45 / (0.5 * 100)
                expect(screen.getByText("26 / 30")).toBeInTheDocument(); // 代码规范: 26 / (0.3 * 100)
                expect(screen.getByText("15 / 20")).toBeInTheDocument(); // 创新性: 15 / (0.2 * 100)
            });

            // Check resubmit count
            await waitFor(() => {
                expect(screen.getByText("重提交次数")).toBeInTheDocument();
                expect(screen.getByText("1")).toBeInTheDocument();
            });

            // Check timestamps
            await waitFor(() => {
                expect(screen.getByText("提交时间")).toBeInTheDocument();
                expect(screen.getByText("创建时间")).toBeInTheDocument();
                expect(screen.getByText("更新时间")).toBeInTheDocument();
            });
        });

        it("should display appeal information when present", async () => {
            const submissionWithAppeal = {
                ...mockSubmission,
                appealReason: "评分标准未对创新点给予加分，申请复核。",
                appealedAt: "2025-09-13T10:00:00+08:00",
                status: "APPEALED" as const,
            };
            (assignmentsApi.getSubmission as jest.Mock).mockResolvedValue(
                submissionWithAppeal
            );

            render(<SubmissionDetailPage />);

            await waitFor(() => {
                expect(screen.getByText("申诉信息")).toBeInTheDocument();
                expect(
                    screen.getByText("评分标准未对创新点给予加分，申请复核。")
                ).toBeInTheDocument();
                expect(screen.getByText("申诉时间")).toBeInTheDocument();
            });
        });

        it("should handle submission without score", async () => {
            const submissionWithoutScore = {
                ...mockSubmission,
                score: null,
                feedback: null,
                status: "SUBMITTED" as const,
            };
            (assignmentsApi.getSubmission as jest.Mock).mockResolvedValue(
                submissionWithoutScore
            );

            render(<SubmissionDetailPage />);

            await waitFor(() => {
                expect(screen.getByText("已提交")).toBeInTheDocument();
                // Score section should not be displayed if score is null
                expect(screen.queryByText("86 / 100")).not.toBeInTheDocument();
            });
        });

        it("should handle submission without attachments", async () => {
            const submissionWithoutAttachments = {
                ...mockSubmission,
                attachments: [],
            };
            (assignmentsApi.getSubmission as jest.Mock).mockResolvedValue(
                submissionWithoutAttachments
            );

            render(<SubmissionDetailPage />);

            await waitFor(() => {
                // Attachments section should not be displayed if empty
                expect(screen.queryByText("附件")).not.toBeInTheDocument();
            });
        });

        it("should handle submission without Rubric scores", async () => {
            const submissionWithoutRubric = {
                ...mockSubmission,
                rubricScores: [],
            };
            (assignmentsApi.getSubmission as jest.Mock).mockResolvedValue(
                submissionWithoutRubric
            );

            render(<SubmissionDetailPage />);

            await waitFor(() => {
                // Rubric section should not be displayed if empty
                expect(screen.queryByText("评分标准详情")).not.toBeInTheDocument();
            });
        });

        it("should display error message when submission not found", async () => {
            const error = new Error("Submission not found");
            (assignmentsApi.getSubmission as jest.Mock).mockRejectedValue(error);

            render(<SubmissionDetailPage />);

            await waitFor(() => {
                expect(screen.getByText("加载失败")).toBeInTheDocument();
                expect(screen.getByText("返回")).toBeInTheDocument();
            });
        });
    });
});

