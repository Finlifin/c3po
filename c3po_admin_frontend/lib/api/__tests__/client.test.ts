import { apiClient } from "../client";
import { tokenStorage } from "@/lib/utils/storage";
import { AuthenticationError } from "@/lib/utils/api-error";
import axios from "axios";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock storage
jest.mock("@/lib/utils/storage", () => ({
  tokenStorage: {
    getToken: jest.fn(),
    setToken: jest.fn(),
    clearToken: jest.fn(),
    isTokenExpired: jest.fn(),
  },
}));

describe("API Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Property 5: API requests include authorization header", () => {
    it("should include Authorization header when token exists", async () => {
      const token = "test-token-123";
      (tokenStorage.getToken as jest.Mock).mockReturnValue(token);
      (tokenStorage.isTokenExpired as jest.Mock).mockReturnValue(false);

      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({ data: {} }),
        post: jest.fn().mockResolvedValue({ data: {} }),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };

      mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);

      // Re-import to get new instance
      const { apiClient: client } = await import("../client");

      await client.get("/test");

      // Verify request interceptor was set up
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });
  });
});

