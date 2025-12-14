import { render, screen } from "@testing-library/react";
import { Breadcrumb } from "../Breadcrumb";
import { usePathname } from "next/navigation";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}));

describe("Breadcrumb", () => {
  describe("Property 34: Breadcrumb reflects current path", () => {
    it("should display breadcrumb for nested route", () => {
      (usePathname as jest.Mock).mockReturnValue("/users/edit");
      render(<Breadcrumb />);

      expect(screen.getByText("仪表板")).toBeInTheDocument();
      expect(screen.getByText("用户管理")).toBeInTheDocument();
    });

    it("should highlight current page", () => {
      (usePathname as jest.Mock).mockReturnValue("/users");
      render(<Breadcrumb />);

      const usersLink = screen.getByText("用户管理");
      // Current page should not be a link
      expect(usersLink.closest("span")).toHaveClass("text-gray-900");
    });
  });
});

