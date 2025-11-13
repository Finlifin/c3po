package fin.c3po.system;

import fin.c3po.system.dto.SystemSettingsResponse;
import fin.c3po.system.dto.UpdateSystemSettingsRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class SystemSettingsService {

    private final SystemSettingsRepository repository;

    @Transactional
    public SystemSettingsResponse getSettings() {
        SystemSettings settings = getOrCreate();
        return toResponse(settings);
    }

    @Transactional
    public SystemSettingsResponse updateSettings(UpdateSystemSettingsRequest request) {
        SystemSettings settings = getOrCreate();

        if (request.getMaintenanceWindow() != null) {
            UpdateSystemSettingsRequest.MaintenanceWindow mw = request.getMaintenanceWindow();
            if (mw.getEnabled() != null) {
                settings.setMaintenanceEnabled(mw.getEnabled());
            }
            Instant start = mw.getStartAt() != null ? mw.getStartAt() : settings.getMaintenanceStart();
            Instant end = mw.getEndAt() != null ? mw.getEndAt() : settings.getMaintenanceEnd();
            if (start != null && end != null && start.isAfter(end)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "maintenanceWindow.startAt must be before endAt");
            }
            if (mw.getStartAt() != null) {
                settings.setMaintenanceStart(mw.getStartAt());
            }
            if (mw.getEndAt() != null) {
                settings.setMaintenanceEnd(mw.getEndAt());
            }
            if (mw.getMessage() != null) {
                settings.setMaintenanceMessage(mw.getMessage());
            }
        }

        if (request.getPasswordPolicy() != null) {
            UpdateSystemSettingsRequest.PasswordPolicy policy = request.getPasswordPolicy();
            if (policy.getMinLength() != null) {
                settings.setPasswordMinLength(policy.getMinLength());
            }
            if (policy.getRequireUppercase() != null) {
                settings.setPasswordRequireUppercase(policy.getRequireUppercase());
            }
            if (policy.getRequireNumber() != null) {
                settings.setPasswordRequireNumber(policy.getRequireNumber());
            }
            if (policy.getRequireSpecial() != null) {
                settings.setPasswordRequireSpecial(policy.getRequireSpecial());
            }
            if (policy.getExpiryDays() != null) {
                settings.setPasswordExpiryDays(policy.getExpiryDays());
            }
        }

        if (request.getAlertThresholds() != null) {
            UpdateSystemSettingsRequest.AlertThresholds alert = request.getAlertThresholds();
            if (alert.getLoginFailure() != null) {
                settings.setAlertLoginFailureThreshold(alert.getLoginFailure());
            }
            if (alert.getStorageUsagePercent() != null) {
                settings.setAlertStorageUsagePercent(alert.getStorageUsagePercent());
            }
            if (alert.getJobQueueDelayMinutes() != null) {
                settings.setAlertJobQueueDelayMinutes(alert.getJobQueueDelayMinutes());
            }
        }

        SystemSettings saved = repository.save(settings);
        return toResponse(saved);
    }

    private SystemSettings getOrCreate() {
        return repository.findFirstByOrderByCreatedAtAsc()
                .orElseGet(() -> repository.save(new SystemSettings()));
    }

    private SystemSettingsResponse toResponse(SystemSettings settings) {
        return SystemSettingsResponse.builder()
                .maintenanceWindow(SystemSettingsResponse.MaintenanceWindow.builder()
                        .enabled(settings.isMaintenanceEnabled())
                        .startAt(settings.getMaintenanceStart())
                        .endAt(settings.getMaintenanceEnd())
                        .message(settings.getMaintenanceMessage())
                        .build())
                .passwordPolicy(SystemSettingsResponse.PasswordPolicy.builder()
                        .minLength(settings.getPasswordMinLength())
                        .requireUppercase(settings.isPasswordRequireUppercase())
                        .requireNumber(settings.isPasswordRequireNumber())
                        .requireSpecial(settings.isPasswordRequireSpecial())
                        .expiryDays(settings.getPasswordExpiryDays())
                        .build())
                .alertThresholds(SystemSettingsResponse.AlertThresholds.builder()
                        .loginFailure(settings.getAlertLoginFailureThreshold())
                        .storageUsagePercent(settings.getAlertStorageUsagePercent())
                        .jobQueueDelayMinutes(settings.getAlertJobQueueDelayMinutes())
                        .build())
                .build();
    }
}


