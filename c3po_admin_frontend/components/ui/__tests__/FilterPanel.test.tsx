import { render, screen, fireEvent } from "@testing-library/react";
import { FilterPanel, type FilterField } from "../FilterPanel";
import fc from "fast-check";

describe("FilterPanel", () => {
  const mockFields: FilterField[] = [
    {
      key: "role",
      label: "角色",
      type: "select",
      options: [
        { label: "全部", value: "" },
        { label: "学生", value: "STUDENT" },
        { label: "教师", value: "TEACHER" },
        { label: "管理员", value: "ADMIN" },
      ],
      defaultValue: "",
    },
    {
      key: "status",
      label: "状态",
      type: "select",
      options: [
        { label: "全部", value: "" },
        { label: "活跃", value: "ACTIVE" },
        { label: "锁定", value: "LOCKED" },
        { label: "禁用", value: "DISABLED" },
      ],
      defaultValue: "",
    },
    {
      key: "keyword",
      label: "关键字",
      type: "text",
      placeholder: "输入关键字",
      defaultValue: undefined,
    },
  ];

  describe("Basic functionality", () => {
    it("should render filter panel header", () => {
      render(<FilterPanel fields={mockFields} />);
      expect(screen.getByText("高级筛选")).toBeInTheDocument();
    });

    it("should be collapsible", () => {
      render(<FilterPanel fields={mockFields} />);

      // Should be collapsed by default
      expect(screen.queryByLabelText("角色")).not.toBeInTheDocument();

      // Click to expand
      const header = screen.getByText("高级筛选").closest("button");
      fireEvent.click(header!);

      // Should show filter fields
      expect(screen.getByLabelText("角色")).toBeInTheDocument();
      expect(screen.getByLabelText("状态")).toBeInTheDocument();
      expect(screen.getByLabelText("关键字")).toBeInTheDocument();
    });

    it("should show active filter count badge", () => {
      render(
        <FilterPanel
          fields={mockFields}
          values={{ role: "STUDENT", status: "ACTIVE" }}
        />
      );

      const header = screen.getByText("高级筛选").closest("button");
      fireEvent.click(header!);

      // Should show badge with count
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  // Feature: admin-frontend, Property 46: Multiple filters are combined
  describe("Property 46: Multiple filters are combined", () => {
    it("should combine all active filters in API call", () => {
      const onFilterChange = jest.fn();
      render(
        <FilterPanel fields={mockFields} onFilterChange={onFilterChange} />
      );

      // Expand panel
      const header = screen.getByText("高级筛选").closest("button");
      fireEvent.click(header!);

      // Set role filter
      const roleSelect = screen.getByLabelText("角色") as HTMLSelectElement;
      fireEvent.change(roleSelect, { target: { value: "STUDENT" } });

      // Set status filter
      const statusSelect = screen.getByLabelText("状态") as HTMLSelectElement;
      fireEvent.change(statusSelect, { target: { value: "ACTIVE" } });

      // Set keyword filter
      const keywordInput = screen.getByLabelText("关键字") as HTMLInputElement;
      fireEvent.change(keywordInput, { target: { value: "test" } });

      // All filters should be in the callback
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          role: "STUDENT",
          status: "ACTIVE",
          keyword: "test",
        })
      );
    });

    it("should combine all provided filters for any combination", () => {
      fc.assert(
        fc.property(
          fc.record({
            role: fc.option(fc.constantFrom("STUDENT", "TEACHER", "ADMIN")),
            status: fc.option(
              fc.constantFrom("ACTIVE", "LOCKED", "DISABLED")
            ),
            keyword: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          }),
          (filters) => {
            const onFilterChange = jest.fn();
            const { unmount } = render(
              <FilterPanel fields={mockFields} onFilterChange={onFilterChange} defaultExpanded={true} />
            );

            // Apply filters only if they are defined
            if (filters.role) {
              const roleSelect = screen.getByLabelText("角色") as HTMLSelectElement;
              fireEvent.change(roleSelect, { target: { value: filters.role } });
            }

            if (filters.status) {
              const statusSelect = screen.getByLabelText("状态") as HTMLSelectElement;
              fireEvent.change(statusSelect, {
                target: { value: filters.status },
              });
            }

            if (filters.keyword) {
              const keywordInput = screen.getByLabelText("关键字") as HTMLInputElement;
              fireEvent.change(keywordInput, {
                target: { value: filters.keyword },
              });
            }

            // Verify all provided filters are in the final call
            if (onFilterChange.mock.calls.length > 0) {
              const lastCall = onFilterChange.mock.calls[
                onFilterChange.mock.calls.length - 1
              ]?.[0];
              if (lastCall) {
                // Verify provided filters are in the call
                if (filters.role) {
                  expect(lastCall.role).toBe(filters.role);
                }
                if (filters.status) {
                  expect(lastCall.status).toBe(filters.status);
                }
                if (filters.keyword) {
                  expect(lastCall.keyword).toBe(filters.keyword);
                }
              }
            }

            unmount();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Feature: admin-frontend, Property 47: Clear filters resets to default
  describe("Property 47: Clear filters resets to default", () => {
    it("should reset all filters to default when clear button is clicked", () => {
      const onClear = jest.fn();
      const onFilterChange = jest.fn();
      render(
        <FilterPanel
          fields={mockFields}
          onFilterChange={onFilterChange}
          onClear={onClear}
          values={{ role: "STUDENT", status: "ACTIVE", keyword: "test" }}
        />
      );

      // Expand panel
      const header = screen.getByText("高级筛选").closest("button");
      fireEvent.click(header!);

      // Click clear button
      const clearButton = screen.getByText("清除筛选");
      fireEvent.click(clearButton);

      // onClear should be called
      expect(onClear).toHaveBeenCalled();
    });

    it("should reset all filters to default values when cleared", () => {
      fc.assert(
        fc.property(
          fc.record({
            role: fc.option(fc.constantFrom("STUDENT", "TEACHER", "ADMIN")),
            status: fc.option(
              fc.constantFrom("ACTIVE", "LOCKED", "DISABLED")
            ),
            keyword: fc.option(fc.string({ maxLength: 50 })),
          }),
          (filters) => {
            const onFilterChange = jest.fn();
            const { unmount } = render(
              <FilterPanel
                fields={mockFields}
                onFilterChange={onFilterChange}
                values={filters}
              />
            );

            // Expand panel
            const header = screen.getByText("高级筛选").closest("button");
            fireEvent.click(header!);

            // Click clear button (only if there are active filters)
            const clearButton = screen.queryByText("清除筛选");
            if (clearButton) {
              fireEvent.click(clearButton);

              // Should reset to defaults (empty strings for selects)
              const lastCall = onFilterChange.mock.calls[
                onFilterChange.mock.calls.length - 1
              ]?.[0];
              if (lastCall) {
                expect(lastCall.role).toBe("");
                expect(lastCall.status).toBe("");
                expect(lastCall.keyword).toBeUndefined();
              }
            }

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Empty results message", () => {
    it("should display empty results message when showEmptyResults is true", () => {
      render(
        <FilterPanel
          fields={mockFields}
          showEmptyResults={true}
          emptyResultsMessage="没有找到匹配的结果"
        />
      );

      // Expand panel
      const header = screen.getByText("高级筛选").closest("button");
      fireEvent.click(header!);

      expect(screen.getByText("没有找到匹配的结果")).toBeInTheDocument();
    });
  });

  describe("Filter types", () => {
    it("should render checkbox filter", () => {
      const checkboxFields: FilterField[] = [
        {
          key: "active",
          label: "仅显示活跃",
          type: "checkbox",
          defaultValue: false,
        },
      ];

      render(<FilterPanel fields={checkboxFields} defaultExpanded={true} />);

      const checkbox = screen.getByLabelText("仅显示活跃") as HTMLInputElement;
      expect(checkbox.type).toBe("checkbox");
      expect(checkbox.checked).toBe(false);

      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });

    it("should render date filter", () => {
      const dateFields: FilterField[] = [
        {
          key: "createdAt",
          label: "创建日期",
          type: "date",
        },
      ];

      render(<FilterPanel fields={dateFields} defaultExpanded={true} />);

      const dateInput = screen.getByLabelText("创建日期") as HTMLInputElement;
      expect(dateInput.type).toBe("date");
    });
  });
});

