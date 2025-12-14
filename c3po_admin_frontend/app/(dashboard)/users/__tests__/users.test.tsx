import { describe, it, expect } from "@jest/globals";
import { renderHook } from "@testing-library/react";
import fc from "fast-check";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Feature: admin-frontend, Property 12: User status change requires reason
describe("User Status Change Validation", () => {
  const statusSchema = z
    .object({
      status: z.enum(["ACTIVE", "LOCKED", "DISABLED"]),
      reason: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.status !== "ACTIVE" && !data.reason) {
          return false;
        }
        return true;
      },
      {
        message: "状态变更原因不能为空",
        path: ["reason"],
      }
    );

  it("should require reason when status is not ACTIVE", async () => {
    fc.assert(
      fc.property(
        fc.constantFrom("LOCKED", "DISABLED"), // status
        fc.string(), // reason (may be empty)
        async (status, reason) => {
          const { result } = renderHook(() =>
            useForm({
              resolver: zodResolver(statusSchema),
              mode: "onChange",
            })
          );

          result.current.setValue("status", status);
          result.current.setValue("reason", reason);

          const isValid = await result.current.trigger();

          if (reason.trim().length === 0) {
            expect(isValid).toBe(false);
            expect(result.current.formState.errors.reason).toBeDefined();
          } else {
            expect(isValid).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should not require reason when status is ACTIVE", async () => {
    const { result } = renderHook(() =>
      useForm({
        resolver: zodResolver(statusSchema),
        mode: "onChange",
      })
    );

    result.current.setValue("status", "ACTIVE");
    result.current.setValue("reason", "");

    const isValid = await result.current.trigger();
    expect(isValid).toBe(true);
    expect(result.current.formState.errors.reason).toBeUndefined();
  });
});

