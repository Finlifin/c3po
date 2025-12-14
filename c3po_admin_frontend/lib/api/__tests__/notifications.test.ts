import { getNotifications, createNotification } from "../notifications";
import { apiClient } from "../client";
import { withRetry } from "../client";

// Mock API client
jest.mock("../client", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
  withRetry: jest.fn((fn) => fn()),
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedWithRetry = withRetry as jest.MockedFunction<typeof withRetry>;

describe("Notifications API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedWithRetry.mockImplementation((fn) => fn());
  });

  describe("Property 27: Notification list displays all fields", () => {
    it("should include targetType and status filters in API call", async () => {
      const mockResponse = {
        data: {
          traceId: "test-trace",
          success: true,
          data: [
            {
              id: "test-id",
              targetType: "ALL",
              title: "Test Notification",
              content: "Test content",
              sendChannels: ["INBOX", "EMAIL"],
              status: "SENT",
              sentAt: "2024-01-01T00:00:00Z",
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z",
            },
          ],
          meta: {
            page: 1,
            pageSize: 20,
            total: 1,
          },
        },
      };

      mockedApiClient.get.mockResolvedValue(mockResponse as any);

      const result = await getNotifications({
        targetType: "ALL",
        status: "SENT",
        page: 1,
        pageSize: 20,
      });

      expect(mockedApiClient.get).toHaveBeenCalledWith("/notifications", {
        params: {
          targetType: "ALL",
          status: "SENT",
          page: 1,
          pageSize: 20,
        },
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        id: "test-id",
        targetType: "ALL",
        title: "Test Notification",
        content: "Test content",
        sendChannels: ["INBOX", "EMAIL"],
        status: "SENT",
      });
    });
  });

  describe("createNotification", () => {
    it("should call API with correct parameters", async () => {
      const mockResponse = {
        data: {
          traceId: "test-trace",
          success: true,
          data: {
            id: "test-id",
            targetType: "ALL",
            title: "Test Notification",
            content: "Test content",
            sendChannels: ["INBOX", "EMAIL"],
            status: "SENT",
            sentAt: "2024-01-01T00:00:00Z",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        },
      };

      mockedApiClient.post.mockResolvedValue(mockResponse as any);

      await createNotification({
        targetType: "ALL",
        title: "Test Notification",
        content: "Test content",
        sendChannels: ["INBOX", "EMAIL"],
      });

      expect(mockedApiClient.post).toHaveBeenCalledWith("/notifications", {
        targetType: "ALL",
        title: "Test Notification",
        content: "Test content",
        sendChannels: ["INBOX", "EMAIL"],
      });
    });
  });
});

