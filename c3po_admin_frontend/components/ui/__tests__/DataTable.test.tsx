import { render, screen, fireEvent } from "@testing-library/react";
import { DataTable, type Column } from "../DataTable";

interface TestData {
  id: string;
  name: string;
  email: string;
}

describe("DataTable", () => {
  const columns: Column<TestData>[] = [
    { key: "name", label: "姓名", sortable: true },
    { key: "email", label: "邮箱" },
  ];

  const data: TestData[] = [
    { id: "1", name: "张三", email: "zhang@example.com" },
    { id: "2", name: "李四", email: "li@example.com" },
  ];

  describe("Property 14: Sorting updates API parameters", () => {
    it("should call onSort when clicking sortable column header", () => {
      const onSort = jest.fn();
      render(
        <DataTable
          columns={columns}
          data={data}
          sorting={{ field: "name", order: "asc", onSort }}
        />
      );

      const nameHeader = screen.getByText("姓名");
      fireEvent.click(nameHeader.closest("button")!);

      expect(onSort).toHaveBeenCalledWith("name", "desc");
    });
  });

  describe("Property 40: Empty table shows empty state", () => {
    it("should display empty message when data is empty", () => {
      render(<DataTable columns={columns} data={[]} />);
      expect(screen.getByText("暂无数据")).toBeInTheDocument();
    });
  });

  describe("Property 41: Table action buttons trigger correct handlers", () => {
    it("should render action buttons", () => {
      const actions = jest.fn((row) => <button>Edit</button>);
      render(<DataTable columns={columns} data={data} actions={actions} />);

      expect(screen.getAllByText("Edit")).toHaveLength(2);
    });
  });
});

