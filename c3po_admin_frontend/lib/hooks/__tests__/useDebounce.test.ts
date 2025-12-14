import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "../useDebounce";
import fc from "fast-check";

// Mock timer functions
jest.useFakeTimers();

describe("useDebounce", () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  it("should return initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 300));
    expect(result.current).toBe("initial");
  });

  it("should debounce value updates", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "initial", delay: 300 },
      }
    );

    expect(result.current).toBe("initial");

    // Update value
    rerender({ value: "updated", delay: 300 });

    // Should not update immediately
    expect(result.current).toBe("initial");

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should update after delay
    expect(result.current).toBe("updated");
  });

  it("should cancel previous timeout on rapid updates", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: "a", delay: 300 },
      }
    );

    // Rapid updates
    rerender({ value: "b", delay: 300 });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    rerender({ value: "c", delay: 300 });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Should still be "a"
    expect(result.current).toBe("a");

    // Advance remaining time
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Should be "c" (last value)
    expect(result.current).toBe("c");
  });

  // Feature: admin-frontend, Property 50: Frequent operations are debounced
  describe("Property 50: Frequent operations are debounced", () => {
    it("should debounce with configurable delay", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 1000 }), // delay
          fc.string({ minLength: 1 }), // initial value
          fc.string({ minLength: 1 }), // updated value
          (delay, initial, updated) => {
            const { result, rerender, unmount } = renderHook(
              ({ value, delay: d }) => useDebounce(value, d),
              {
                initialProps: { value: initial, delay },
              }
            );

            expect(result.current).toBe(initial);

            rerender({ value: updated, delay });

            // Should not update immediately
            expect(result.current).toBe(initial);

            // Fast-forward less than delay
            act(() => {
              jest.advanceTimersByTime(delay - 1);
            });
            expect(result.current).toBe(initial);

            // Fast-forward to delay
            act(() => {
              jest.advanceTimersByTime(1);
            });
            expect(result.current).toBe(updated);

            unmount();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

