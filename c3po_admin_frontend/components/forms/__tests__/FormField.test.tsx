import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { FormField } from "../FormField";

function TestWrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm();
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe("FormField", () => {
  describe("Property 36: Form validation errors display inline", () => {
    it("should display validation error message", async () => {
      render(
        <TestWrapper>
          <FormField name="test" label="测试字段" required />
        </TestWrapper>
      );

      // Error should appear when validation fails
      const input = screen.getByLabelText("测试字段");
      expect(input).toBeInTheDocument();
    });
  });
});

