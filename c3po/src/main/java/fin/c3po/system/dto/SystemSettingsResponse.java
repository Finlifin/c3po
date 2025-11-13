package fin.c3po.system.dto;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class SystemSettingsResponse {

    MaintenanceWindow maintenanceWindow;
    PasswordPolicy passwordPolicy;
    AlertThresholds alertThresholds;

    @Value
    @Builder
    public static class MaintenanceWindow {
        boolean enabled;
        Instant startAt;
        Instant endAt;
        String message;
    }

    @Value
    @Builder
    public static class PasswordPolicy {
        int minLength;
        boolean requireUppercase;
        boolean requireNumber;
        boolean requireSpecial;
        Integer expiryDays;
    }

    @Value
    @Builder
    public static class AlertThresholds {
        int loginFailure;
        int storageUsagePercent;
        int jobQueueDelayMinutes;
    }
}


