import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "../ConfirmDialog";

describe("ConfirmDialog", () => {
  describe("Property 39: Dangerous operations require confirmation", () => {
    it("should display confirmation dialog", () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      render(
        <ConfirmDialog
          open={true}
          title="确认删除"
          message="您确定要删除此项吗？"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText("确认删除")).toBeInTheDocument();
      expect(screen.getByText("您确定要删除此项吗？")).toBeInTheDocument();
    });

    it("should call onConfirm when confirm button is clicked", () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      render(
        <ConfirmDialog
          open={true}
          title="确认删除"
          message="您确定要删除此项吗？"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const confirmButton = screen.getByText("确认");
      fireEvent.click(confirmButton);

      expect(onConfirm).toHaveBeenCalled();
    });

    it("should call onCancel when cancel button is clicked", () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      render(
        <ConfirmDialog
          open={true}
          title="确认删除"
          message="您确定要删除此项吗？"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      const cancelButton = screen.getByText("取消");
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });
  });
});

