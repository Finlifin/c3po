package fin.c3po.system.web;

import fin.c3po.common.web.ApiResponse;
import fin.c3po.system.SystemSettingsService;
import fin.c3po.system.dto.SystemSettingsResponse;
import fin.c3po.system.dto.UpdateSystemSettingsRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/system/settings")
@Validated
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SystemSettingsController {

    private final SystemSettingsService systemSettingsService;

    @GetMapping
    public ApiResponse<SystemSettingsResponse> getSettings() {
        return ApiResponse.success(systemSettingsService.getSettings());
    }

    @PutMapping
    public ApiResponse<SystemSettingsResponse> updateSettings(
            @Valid @RequestBody UpdateSystemSettingsRequest request) {
        return ApiResponse.success(systemSettingsService.updateSettings(request));
    }
}


