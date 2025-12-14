import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SearchInput } from "../SearchInput";
import fc from "fast-check";
import { act } from "react";

// Mock timer functions for debounce testing
jest.useFakeTimers();

describe("SearchInput", () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe("Basic functionality", () => {
    it("should render with placeholder", () => {
      render(<SearchInput placeholder="搜索用户..." />);
      expect(screen.getByPlaceholderText("搜索用户...")).toBeInTheDocument();
    });

    it("should display clear button when value is entered", () => {
      render(<SearchInput defaultValue="test" />);
      expect(screen.getByLabelText("清除搜索")).toBeInTheDocument();
    });

    it("should clear value when clear button is clicked", () => {
      const onSearch = jest.fn();
      render(<SearchInput defaultValue="test" onSearch={onSearch} />);

      const clearButton = screen.getByLabelText("清除搜索");
      fireEvent.click(clearButton);

      const input = screen.getByPlaceholderText("搜索...") as HTMLInputElement;
      expect(input.value).toBe("");

      // onSearch should be called immediately when clearing
      expect(onSearch).toHaveBeenCalledWith("");
    });
  });

  // Feature: admin-frontend, Property 45: Search keyword is transmitted to API
  describe("Property 45: Search keyword is transmitted to API", () => {
    it("should call onSearch with keyword after debounce delay", async () => {
      const onSearch = jest.fn();
      render(<SearchInput onSearch={onSearch} debounceMs={300} />);

      const input = screen.getByPlaceholderText("搜索...") as HTMLInputElement;
      
      // Initial mount should not trigger onSearch
      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(onSearch).not.toHaveBeenCalled();
      
      fireEvent.change(input, { target: { value: "test keyword" } });

      // Should not be called immediately
      expect(onSearch).not.toHaveBeenCalled();

      // Fast-forward time by 300ms
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should be called after debounce delay
      await waitFor(() => {
        expect(onSearch).toHaveBeenCalledWith("test keyword");
      });
    });

    it("should transmit search keyword to API for various keywords", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 100 }), (keyword) => {
          const onSearch = jest.fn();
          const { unmount } = render(
            <SearchInput onSearch={onSearch} debounceMs={100} />
          );

          const input = screen.getByPlaceholderText("搜索...") as HTMLInputElement;
          fireEvent.change(input, { target: { value: keyword } });

          act(() => {
            jest.advanceTimersByTime(100);
          });

          expect(onSearch).toHaveBeenCalledWith(keyword);
          unmount();
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: admin-frontend, Property 50: Frequent operations are debounced
  describe("Property 50: Frequent operations are debounced", () => {
    it("should debounce rapid input changes", () => {
      const onSearch = jest.fn();
      render(<SearchInput onSearch={onSearch} debounceMs={300} />);

      const input = screen.getByPlaceholderText("搜索...") as HTMLInputElement;

      // Skip initial mount
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Rapid changes
      fireEvent.change(input, { target: { value: "a" } });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      fireEvent.change(input, { target: { value: "ab" } });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      fireEvent.change(input, { target: { value: "abc" } });
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should not have been called yet
      expect(onSearch).not.toHaveBeenCalled();

      // After full debounce delay
      act(() => {
        jest.advanceTimersByTime(200);
      });

      // Should only be called once with final value
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch).toHaveBeenCalledWith("abc");
    });

    it("should debounce with at least 300ms delay", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 300, max: 1000 }), // delay in ms
          fc.array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 10 }), // rapid inputs
          (delay, inputs) => {
            const onSearch = jest.fn();
            const { unmount } = render(
              <SearchInput onSearch={onSearch} debounceMs={delay} />
            );

            const input = screen.getByPlaceholderText("搜索...") as HTMLInputElement;

            // Simulate rapid inputs
            inputs.forEach((value, index) => {
              fireEvent.change(input, { target: { value } });
              if (index < inputs.length - 1) {
                act(() => {
                  jest.advanceTimersByTime(Math.floor(delay / inputs.length));
                });
              }
            });

            // Advance remaining time to trigger debounce
            act(() => {
              jest.advanceTimersByTime(delay);
            });

            // Should be called with last value
            if (inputs.length > 0) {
              expect(onSearch).toHaveBeenCalledWith(inputs[inputs.length - 1]);
            }

            unmount();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe("Controlled vs Uncontrolled", () => {
    it("should work as uncontrolled component", () => {
      const onSearch = jest.fn();
      render(<SearchInput onSearch={onSearch} defaultValue="initial" />);

      const input = screen.getByPlaceholderText("搜索...") as HTMLInputElement;
      expect(input.value).toBe("initial");

      fireEvent.change(input, { target: { value: "changed" } });
      expect(input.value).toBe("changed");

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(onSearch).toHaveBeenCalledWith("changed");
    });

    it("should work as controlled component", () => {
      const onSearch = jest.fn();
      const { rerender } = render(
        <SearchInput onSearch={onSearch} value="controlled" />
      );

      const input = screen.getByPlaceholderText("搜索...") as HTMLInputElement;
      expect(input.value).toBe("controlled");

      rerender(<SearchInput onSearch={onSearch} value="updated" />);
      expect(input.value).toBe("updated");
    });
  });
});

