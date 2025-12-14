import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import NotificationsPage from "../page";
import * as notificationsApi from "@/lib/api/notifications";

// Mock API
jest.mock("@/lib/api/notifications");
jest.mock("@/lib/hooks/useToast", () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
  }),
}));

const mockNotifications = [
  {
    id: "notif-1",
    targetType: "ALL",
    title: "Test Notification 1",
    content: "Test content 1",
    sendChannels: ["INBOX", "EMAIL"] as const,
    status: "SENT" as const,
    sentAt: "2024-01-01T00:00:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "notif-2",
    targetType: "STUDENT",
    title: "Test Notification 2",
    content: "Test content 2",
    sendChannels: ["SMS"] as const,
    status: "DRAFT" as const,
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
  },
  {
    id: "notif-3",
    targetType: "TEACHER",
    title: "Test Notification 3",
    content: "Test content 3",
    sendChannels: ["INBOX"] as const,
    status: "FAILED" as const,
    createdAt: "2024-01-03T00:00:00Z",
    updatedAt: "2024-01-03T00:00:00Z",
  },
];

describe("NotificationsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (notificationsApi.getNotifications as jest.Mock).mockResolvedValue({
      items: mockNotifications,
      meta: {
        page: 1,
        pageSize: 20,
        total: 3,
        totalPages: 1,
      },
    });
    (notificationsApi.createNotification as jest.Mock).mockResolvedValue(
      mockNotifications[0]
    );
  });

  describe("Property 27: Notification list displays all fields", () => {
    it("should display all notification fields", async () => {
      render(<NotificationsPage />);

      await waitFor(() => {
        expect(screen.getByText("通知管理")).toBeInTheDocument();
      });

      // Check all fields are displayed
      expect(screen.getByText("Test Notification 1")).toBeInTheDocument();
      expect(screen.getByText("Test Notification 2")).toBeInTheDocument();
      expect(screen.getByText("Test Notification 3")).toBeInTheDocument();

      expect(screen.getByText("ALL")).toBeInTheDocument();
      expect(screen.getByText("STUDENT")).toBeInTheDocument();
      expect(screen.getByText("TEACHER")).toBeInTheDocument();
    });
  });

  describe("Property 28: Notification creation validates required fields", () => {
    it("should validate required fields", async () => {
      render(<NotificationsPage />);

      await waitFor(() => {
        expect(screen.getByText("通知管理")).toBeInTheDocument();
      });

      // Click create button
      const createButton = screen.getByText("创建通知");
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText("创建通知")).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      const submitButton = screen.getByText("创建并发送");
      fireEvent.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/目标类型不能为空/)).toBeInTheDocument();
        expect(screen.getByText(/标题不能为空/)).toBeInTheDocument();
        expect(screen.getByText(/内容不能为空/)).toBeInTheDocument();
        expect(screen.getByText(/至少选择一个发送渠道/)).toBeInTheDocument();
      });
    });

    it("should validate at least one send channel is selected", async () => {
      render(<NotificationsPage />);

      await waitFor(() => {
        expect(screen.getByText("通知管理")).toBeInTheDocument();
      });

      // Click create button
      const createButton = screen.getByText("创建通知");
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText("创建通知")).toBeInTheDocument();
      });

      // Fill other fields but not select channels
      const targetTypeInput = screen.getByPlaceholderText(/目标类型/);
      const titleInput = screen.getByPlaceholderText(/输入通知标题/);
      const contentInput = screen.getByPlaceholderText(/输入通知内容/);

      fireEvent.change(targetTypeInput, { target: { value: "ALL" } });
      fireEvent.change(titleInput, { target: { value: "Test Title" } });
      fireEvent.change(contentInput, { target: { value: "Test Content" } });

      // Try to submit
      const submitButton = screen.getByText("创建并发送");
      fireEvent.click(submitButton);

      // Should show validation error for channels
      await waitFor(() => {
        expect(screen.getByText(/至少选择一个发送渠道/)).toBeInTheDocument();
      });
    });
  });

  describe("Property 29: Notification status is visually distinct", () => {
    it("should display different status indicators", async () => {
      render(<NotificationsPage />);

      await waitFor(() => {
        expect(screen.getByText("通知管理")).toBeInTheDocument();
      });

      // Check status indicators are displayed
      expect(screen.getByText("已发送")).toBeInTheDocument();
      expect(screen.getByText("草稿")).toBeInTheDocument();
      expect(screen.getByText("发送失败")).toBeInTheDocument();
    });
  });
});

