import { getApprovals, processApproval } from "../approvals";
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

describe("Approvals API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedWithRetry.mockImplementation((fn) => fn());
  });

  describe("Property 23: Approval list filters work correctly", () => {
    it("should include status and type filters in API call", async () => {
      const mockResponse = {
        data: {
          traceId: "test-trace",
          success: true,
          data: [],
          meta: {
            page: 1,
            pageSize: 20,
            total: 0,
          },
        },
      };

      mockedApiClient.get.mockResolvedValue(mockResponse as any);

      await getApprovals({
        status: "PENDING",
        type: "COURSE_PUBLISH",
        page: 1,
        pageSize: 20,
      });

      expect(mockedApiClient.get).toHaveBeenCalledWith("/admin/approvals", {
        params: {
          status: "PENDING",
          type: "COURSE_PUBLISH",
          page: 1,
          pageSize: 20,
        },
      });
    });

    it("should work with only status filter", async () => {
      const mockResponse = {
        data: {
          traceId: "test-trace",
          success: true,
          data: [],
          meta: {
            page: 1,
            pageSize: 20,
            total: 0,
          },
        },
      };

      mockedApiClient.get.mockResolvedValue(mockResponse as any);

      await getApprovals({
        status: "APPROVED",
      });

      expect(mockedApiClient.get).toHaveBeenCalledWith("/admin/approvals", {
        params: {
          status: "APPROVED",
        },
      });
    });

    it("should work with only type filter", async () => {
      const mockResponse = {
        data: {
          traceId: "test-trace",
          success: true,
          data: [],
          meta: {
            page: 1,
            pageSize: 20,
            total: 0,
          },
        },
      };

      mockedApiClient.get.mockResolvedValue(mockResponse as any);

      await getApprovals({
        type: "SCORE_APPEAL",
      });

      expect(mockedApiClient.get).toHaveBeenCalledWith("/admin/approvals", {
        params: {
          type: "SCORE_APPEAL",
        },
      });
    });
  });

  describe("processApproval", () => {
    it("should call API with correct parameters", async () => {
      const mockResponse = {
        data: {
          traceId: "test-trace",
          success: true,
          data: {
            id: "test-id",
            type: "COURSE_PUBLISH",
            status: "APPROVED",
            applicantId: "applicant-id",
            payload: "{}",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        },
      };

      mockedApiClient.post.mockResolvedValue(mockResponse as any);

      await processApproval("test-id", {
        status: "APPROVED",
        comment: "Approved",
      });

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        "/admin/approvals/test-id/decision",
        {
          status: "APPROVED",
          comment: "Approved",
        }
      );
    });
  });
});

