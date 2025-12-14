import { useAuthStore } from "../store";
import * as authApi from "@/lib/api/auth";
import { tokenStorage } from "@/lib/utils/storage";

// Mock API
jest.mock("@/lib/api/auth");
jest.mock("@/lib/utils/storage");

describe("Authentication Store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  describe("Property 2: Successful login stores JWT token", () => {
    it("should store token after successful login", async () => {
      const mockAuthResponse = {
        accessToken: "test-token-123",
        tokenType: "Bearer",
        expiresIn: 3600000,
      };

      const mockUser = {
        id: "user-1",
        username: "admin",
        email: "admin@example.com",
        role: "ADMIN" as const,
      };

      (authApi.login as jest.Mock).mockResolvedValue(mockAuthResponse);
      (authApi.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const { login } = useAuthStore.getState();

      await login("admin", "password123");

      expect(tokenStorage.setToken).toHaveBeenCalledWith(
        mockAuthResponse.accessToken,
        mockAuthResponse.expiresIn
      );
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
  });

  describe("Property 4: Logout clears authentication state", () => {
    it("should clear token and reset state on logout", async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: {
          id: "user-1",
          username: "admin",
          email: "admin@example.com",
          role: "ADMIN",
        },
        isAuthenticated: true,
      });

      (authApi.logout as jest.Mock).mockResolvedValue(undefined);

      const { logout } = useAuthStore.getState();

      await logout();

      expect(tokenStorage.clearToken).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });
});

