import { render, screen } from "@testing-library/react";
import { Sidebar } from "../Sidebar";
import { usePathname } from "next/navigation";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock auth store
jest.mock("@/lib/auth/store", () => ({
  useAuthStore: jest.fn(() => ({
    logout: jest.fn(),
  })),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue("/dashboard");
  });

  describe("Property 33: Active navigation item is highlighted", () => {
    it("should highlight active navigation item", () => {
      (usePathname as jest.Mock).mockReturnValue("/dashboard");
      render(<Sidebar />);

      const dashboardLink = screen.getByText("仪表板").closest("a");
      expect(dashboardLink).toHaveClass("bg-red-50", "text-red-600");
    });
  });

  describe("Property 35: Mobile navigation is collapsible", () => {
    it("should have mobile menu button", () => {
      render(<Sidebar />);
      const menuButton = screen.getByLabelText("Toggle menu");
      expect(menuButton).toBeInTheDocument();
    });
  });
});

