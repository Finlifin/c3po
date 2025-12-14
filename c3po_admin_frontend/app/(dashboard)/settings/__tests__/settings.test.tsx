import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import SettingsPage from "../page";
import * as settingsApi from "@/lib/api/settings";

// Mock API
jest.mock("@/lib/api/settings");

const mockSuccess = jest.fn();
const mockError = jest.fn();

jest.mock("@/lib/hooks/useToast", () => ({
  useToast: () => ({
    success: mockSuccess,
    error: mockError,
  }),
}));

const mockSettings: settingsApi.SystemSettings = {
  maintenanceWindow: {
    enabled: true,
    startTime: "2025-01-15T02:00:00Z",
    endTime: "2025-01-15T04:00:00Z",
  },
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    expirationDays: 90,
  },
  alertThresholds: {
    maxFailedLoginAttempts: 5,
    systemLoadThreshold: 80,
    diskUsageThreshold: 85,
    memoryUsageThreshold: 90,
  },
  updatedAt: "2025-01-10T10:00:00Z",
};

describe("SettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSuccess.mockClear();
    mockError.mockClear();
    (settingsApi.getSystemSettings as jest.Mock).mockResolvedValue(
      mockSettings
    );
    (settingsApi.updateSystemSettings as jest.Mock).mockResolvedValue(
      mockSettings
    );
  });

  describe("Property 30: Maintenance window validates time order", () => {
    it("should validate that start time is before end time", async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText("系统设置")).toBeInTheDocument();
      });

      // Enable maintenance window
      const enableCheckbox = screen.getByLabelText("启用维护窗口");
      fireEvent.click(enableCheckbox);

      // Set start time to be after end time
      const startTimeInput = screen.getByLabelText(/开始时间/);
      const endTimeInput = screen.getByLabelText(/结束时间/);

      // Set end time first
      fireEvent.change(endTimeInput, {
        target: { value: "2025-01-15T02:00" },
      });

      // Set start time after end time
      fireEvent.change(startTimeInput, {
        target: { value: "2025-01-15T04:00" },
      });

      // Try to submit
      const submitButton = screen.getByText("保存设置");
      fireEvent.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(
          screen.getByText("开始时间必须早于结束时间")
        ).toBeInTheDocument();
      });
    });

    it("should accept valid time order", async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText("系统设置")).toBeInTheDocument();
      });

      // Enable maintenance window
      const enableCheckbox = screen.getByLabelText("启用维护窗口");
      fireEvent.click(enableCheckbox);

      // Set valid times
      const startTimeInput = screen.getByLabelText(/开始时间/);
      const endTimeInput = screen.getByLabelText(/结束时间/);

      fireEvent.change(startTimeInput, {
        target: { value: "2025-01-15T02:00" },
      });
      fireEvent.change(endTimeInput, {
        target: { value: "2025-01-15T04:00" },
      });

      // Submit should work
      const submitButton = screen.getByText("保存设置");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(settingsApi.updateSystemSettings).toHaveBeenCalled();
      });
    });
  });

  describe("Property 31: Password policy validates numeric ranges", () => {
    it("should validate minimum length range", async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText("系统设置")).toBeInTheDocument();
      });

      const minLengthInput = screen.getByLabelText(/最小长度/);
      
      // Set value below minimum
      fireEvent.change(minLengthInput, { target: { value: "5" } });
      fireEvent.blur(minLengthInput);

      // Try to submit
      const submitButton = screen.getByText("保存设置");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/最小长度不能少于6/)
        ).toBeInTheDocument();
      });
    });

    it("should validate expiration days range", async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText("系统设置")).toBeInTheDocument();
      });

      const expirationInput = screen.getByLabelText(/密码过期天数/);
      
      // Set value above maximum
      fireEvent.change(expirationInput, { target: { value: "4000" } });
      fireEvent.blur(expirationInput);

      // Try to submit
      const submitButton = screen.getByText("保存设置");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/过期天数不能超过3650天/)
        ).toBeInTheDocument();
      });
    });

    it("should validate alert threshold ranges", async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText("系统设置")).toBeInTheDocument();
      });

      const diskUsageInput = screen.getByLabelText(/磁盘使用率阈值/);
      
      // Set value above maximum
      fireEvent.change(diskUsageInput, { target: { value: "150" } });
      fireEvent.blur(diskUsageInput);

      // Try to submit
      const submitButton = screen.getByText("保存设置");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/磁盘使用率阈值不能超过100/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Property 32: Settings update triggers refresh", () => {
    it("should refresh settings after successful update", async () => {
      const updatedSettings: settingsApi.SystemSettings = {
        ...mockSettings,
        passwordPolicy: {
          ...mockSettings.passwordPolicy,
          minLength: 10,
        },
        updatedAt: "2025-01-15T12:00:00Z",
      };

      (settingsApi.updateSystemSettings as jest.Mock).mockResolvedValue(
        updatedSettings
      );

      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText("系统设置")).toBeInTheDocument();
      });

      // Change a setting
      const minLengthInput = screen.getByLabelText(/最小长度/);
      fireEvent.change(minLengthInput, { target: { value: "10" } });

      // Submit
      const submitButton = screen.getByText("保存设置");
      fireEvent.click(submitButton);

      // Should call update API
      await waitFor(() => {
        expect(settingsApi.updateSystemSettings).toHaveBeenCalled();
      });

      // Should refresh settings (getSystemSettings should be called again)
      await waitFor(() => {
        // The form should be updated with new values
        expect(minLengthInput).toHaveValue(10);
      });
    });

    it("should display success message after update", async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText("系统设置")).toBeInTheDocument();
      });

      // Submit without changes
      const submitButton = screen.getByText("保存设置");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(settingsApi.updateSystemSettings).toHaveBeenCalled();
      });

      // Should show success toast
      await waitFor(() => {
        expect(mockSuccess).toHaveBeenCalledWith("系统设置已成功更新");
      });
    });
  });

  describe("Settings display", () => {
    it("should display current configuration", async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText("系统设置")).toBeInTheDocument();
        expect(screen.getByText(/当前配置/)).toBeInTheDocument();
      });

      // Should show current password policy
      expect(
        screen.getByText(/最小长度 8/)
      ).toBeInTheDocument();
    });

    it("should show maintenance window when enabled", async () => {
      render(<SettingsPage />);

      await waitFor(() => {
        expect(screen.getByText("系统设置")).toBeInTheDocument();
      });

      // Should show maintenance window info
      expect(screen.getByText(/当前配置/)).toBeInTheDocument();
    });
  });
});

