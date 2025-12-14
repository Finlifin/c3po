package fin.c3po.profile.web;

import fin.c3po.common.web.ApiResponse;
import fin.c3po.profile.ProfileService;
import fin.c3po.profile.dto.ProfileResponse;
import fin.c3po.profile.dto.ProfileStatsResponse;
import fin.c3po.profile.dto.UpdateAvatarRequest;
import fin.c3po.profile.dto.UpdateProfileRequest;
import fin.c3po.user.UserAccount;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/profile")
@Validated
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ProfileResponse> getProfile(@AuthenticationPrincipal UserAccount currentUser) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        ProfileResponse profile = profileService.getProfile(currentUser.getId());
        return ApiResponse.success(profile);
    }

    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ProfileStatsResponse> getProfileStats(@AuthenticationPrincipal UserAccount currentUser) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        ProfileStatsResponse stats = profileService.getProfileStats(currentUser.getId(), currentUser.getRole());
        return ApiResponse.success(stats);
    }

    @PatchMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ProfileResponse> updateProfile(
            @AuthenticationPrincipal UserAccount currentUser,
            @Valid @RequestBody UpdateProfileRequest request) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        ProfileResponse profile = profileService.updateProfile(currentUser.getId(), request);
        return ApiResponse.success(profile);
    }

    @PatchMapping("/avatar")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<ProfileResponse> updateAvatar(
            @AuthenticationPrincipal UserAccount currentUser,
            @Valid @RequestBody UpdateAvatarRequest request) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        ProfileResponse profile = profileService.updateAvatar(currentUser.getId(), request.getAvatarUrl());
        return ApiResponse.success(profile);
    }
}
