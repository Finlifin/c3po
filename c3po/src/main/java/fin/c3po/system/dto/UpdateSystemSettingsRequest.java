package fin.c3po.system.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class UpdateSystemSettingsRequest {

    @Valid
    private MaintenanceWindow maintenanceWindow;

    @Valid
    private PasswordPolicy passwordPolicy;

    @Valid
    private AlertThresholds alertThresholds;

    @Getter
    @Setter
    public static class MaintenanceWindow {
        private Boolean enabled;
        private Instant startAt;
        private Instant endAt;

        @Size(max = 512)
        private String message;
    }

    @Getter
    @Setter
    public static class PasswordPolicy {

        @Min(6)
        @Max(128)
        private Integer minLength;

        private Boolean requireUppercase;
        private Boolean requireNumber;
        private Boolean requireSpecial;

        @Min(1)
        @Max(365)
        private Integer expiryDays;
    }

    @Getter
    @Setter
    public static class AlertThresholds {

        @Min(1)
        @Max(100)
        private Integer loginFailure;

        @Min(1)
        @Max(100)
        private Integer storageUsagePercent;

        @Min(1)
        @Max(1440)
        private Integer jobQueueDelayMinutes;
    }
}


