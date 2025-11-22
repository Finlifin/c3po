package fin.c3po.user.web;

import fin.c3po.common.web.ApiResponse;
import fin.c3po.profile.StudentProfile;
import fin.c3po.profile.StudentProfileRepository;
import fin.c3po.profile.TeacherProfile;
import fin.c3po.profile.TeacherProfileRepository;
import fin.c3po.user.UserAccount;
import fin.c3po.user.UserAccountRepository;
import fin.c3po.user.dto.ChangePasswordRequest;
import fin.c3po.user.dto.StudentProfileSummary;
import fin.c3po.user.dto.TeacherProfileSummary;
import fin.c3po.user.dto.UpdateUserInfoRequest;
import fin.c3po.user.dto.UserDetailResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/users/me")
@Validated
@RequiredArgsConstructor
public class UserController {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final StudentProfileRepository studentProfileRepository;
    private final TeacherProfileRepository teacherProfileRepository;

    @GetMapping
    public ApiResponse<UserDetailResponse> getCurrentUser(
            @AuthenticationPrincipal UserAccount currentUser) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        StudentProfile studentProfile = null;
        TeacherProfile teacherProfile = null;

        if (currentUser.getRole() == fin.c3po.user.UserRole.STUDENT) {
            studentProfile = studentProfileRepository.findByUserId(currentUser.getId()).orElse(null);
        } else if (currentUser.getRole() == fin.c3po.user.UserRole.TEACHER) {
            teacherProfile = teacherProfileRepository.findByUserId(currentUser.getId()).orElse(null);
        }

        UserDetailResponse response = toResponse(currentUser, studentProfile, teacherProfile);
        return ApiResponse.success(response);
    }

    @PatchMapping
    @Transactional
    public ApiResponse<UserDetailResponse> updateUserInfo(
            @AuthenticationPrincipal UserAccount currentUser,
            @Valid @RequestBody UpdateUserInfoRequest request) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        // Reload user from database to get latest state
        UserAccount user = userAccountRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        boolean updated = false;

        // Update username if provided
        if (StringUtils.hasText(request.getUsername())) {
            String newUsername = request.getUsername().trim().toLowerCase(Locale.ROOT);
            if (!newUsername.equals(user.getUsername())) {
                if (userAccountRepository.existsByUsernameIgnoreCase(newUsername)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
                }
                user.setUsername(newUsername);
                updated = true;
            }
        }

        // Update email if provided
        if (StringUtils.hasText(request.getEmail())) {
            String newEmail = request.getEmail().trim().toLowerCase(Locale.ROOT);
            if (!newEmail.equals(user.getEmail())) {
                if (userAccountRepository.existsByEmailIgnoreCase(newEmail)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
                }
                user.setEmail(newEmail);
                updated = true;
            }
        }

        if (!updated) {
            // No changes made, return current user info
            StudentProfile studentProfile = null;
            TeacherProfile teacherProfile = null;
            if (user.getRole() == fin.c3po.user.UserRole.STUDENT) {
                studentProfile = studentProfileRepository.findByUserId(user.getId()).orElse(null);
            } else if (user.getRole() == fin.c3po.user.UserRole.TEACHER) {
                teacherProfile = teacherProfileRepository.findByUserId(user.getId()).orElse(null);
            }
            return ApiResponse.success(toResponse(user, studentProfile, teacherProfile));
        }

        user = userAccountRepository.save(user);

        StudentProfile studentProfile = null;
        TeacherProfile teacherProfile = null;
        if (user.getRole() == fin.c3po.user.UserRole.STUDENT) {
            studentProfile = studentProfileRepository.findByUserId(user.getId()).orElse(null);
        } else if (user.getRole() == fin.c3po.user.UserRole.TEACHER) {
            teacherProfile = teacherProfileRepository.findByUserId(user.getId()).orElse(null);
        }

        return ApiResponse.success(toResponse(user, studentProfile, teacherProfile));
    }

    @PatchMapping("/password")
    @Transactional
    public ApiResponse<Void> changePassword(
            @AuthenticationPrincipal UserAccount currentUser,
            @Valid @RequestBody ChangePasswordRequest request) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        // Validate new password and confirmation match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password and confirmation do not match");
        }

        // Reload user from database
        UserAccount user = userAccountRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userAccountRepository.save(user);

        return ApiResponse.success(null);
    }

    private UserDetailResponse toResponse(UserAccount user, StudentProfile studentProfile, TeacherProfile teacherProfile) {
        StudentProfileSummary studentSummary = null;
        if (studentProfile != null) {
            studentSummary = StudentProfileSummary.builder()
                    .studentNo(studentProfile.getStudentNo())
                    .grade(studentProfile.getGrade())
                    .major(studentProfile.getMajor())
                    .className(studentProfile.getClassName())
                    .build();
        }

        TeacherProfileSummary teacherSummary = null;
        if (teacherProfile != null) {
            teacherSummary = TeacherProfileSummary.builder()
                    .teacherNo(teacherProfile.getTeacherNo())
                    .department(teacherProfile.getDepartment())
                    .title(teacherProfile.getTitle())
                    .subjects(parseSubjects(teacherProfile.getSubjects()))
                    .build();
        }

        return UserDetailResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .studentProfile(studentSummary)
                .teacherProfile(teacherSummary)
                .build();
    }

    private List<String> parseSubjects(String subjects) {
        if (!StringUtils.hasText(subjects)) {
            return List.of();
        }
        String[] parts = subjects.split(",");
        List<String> parsed = new ArrayList<>();
        for (String part : parts) {
            String trimmed = part.trim();
            if (StringUtils.hasText(trimmed)) {
                parsed.add(trimmed);
            }
        }
        return parsed;
    }
}

