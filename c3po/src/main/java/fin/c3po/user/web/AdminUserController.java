package fin.c3po.user.web;

import fin.c3po.common.web.ApiResponse;
import fin.c3po.common.web.PageMeta;
import fin.c3po.profile.StudentProfile;
import fin.c3po.profile.StudentProfileRepository;
import fin.c3po.profile.TeacherProfile;
import fin.c3po.profile.TeacherProfileRepository;
import fin.c3po.user.UserAccount;
import fin.c3po.user.UserAccountRepository;
import fin.c3po.user.UserRole;
import fin.c3po.user.UserStatus;
import fin.c3po.user.dto.AdminUpdateUserRequest;
import fin.c3po.user.dto.AdminUserResponse;
import fin.c3po.user.dto.BulkCreateUsersRequest;
import fin.c3po.user.dto.BulkCreateUsersResponse;
import fin.c3po.user.dto.StudentProfileSummary;
import fin.c3po.user.dto.TeacherProfileSummary;
import fin.c3po.user.dto.UpdateUserStatusRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/users")
@Validated
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> ALLOWED_SORT_PROPERTIES = Set.of(
            "createdAt", "updatedAt", "username", "email", "role", "status");

    private final UserAccountRepository userAccountRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @GetMapping
    public ApiResponse<List<AdminUserResponse>> listUsers(
            @RequestParam(name = "page", defaultValue = "1") @Min(1) int page,
            @RequestParam(name = "pageSize", defaultValue = "20") @Min(1) int pageSize,
            @RequestParam(name = "role", required = false) UserRole role,
            @RequestParam(name = "status", required = false) UserStatus status,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "department", required = false) String department,
            @RequestParam(name = "sort", required = false) String sort) {

        Pageable pageable = buildPageable(page, pageSize, sort);
        Specification<UserAccount> specification = (root, query, cb) -> cb.conjunction();

        if (role != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("role"), role));
        }
        if (status != null) {
            specification = specification.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (StringUtils.hasText(keyword)) {
            String pattern = "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("username")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern)));
        }

        if (StringUtils.hasText(department)) {
            List<UUID> teacherUserIds = teacherProfileRepository.findByDepartmentContainingIgnoreCase(department.trim())
                    .stream()
                    .map(TeacherProfile::getUserId)
                    .toList();
            if (teacherUserIds.isEmpty()) {
                Page<UserAccount> empty = Page.empty(pageable);
                return ApiResponse.success(List.of(), toPageMeta(empty, pageable));
            }
            specification = specification.and((root, query, cb) -> root.get("id").in(teacherUserIds));
        }

        Page<UserAccount> result = userAccountRepository.findAll(specification, pageable);
        List<UserAccount> users = result.getContent();
        Map<UUID, StudentProfile> studentProfiles = loadStudentProfiles(users);
        Map<UUID, TeacherProfile> teacherProfiles = loadTeacherProfiles(users);

        List<AdminUserResponse> responses = users.stream()
                .map(user -> toResponse(user, studentProfiles.get(user.getId()), teacherProfiles.get(user.getId())))
                .toList();

        return ApiResponse.success(responses, toPageMeta(result, pageable));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<BulkCreateUsersResponse>> createUsers(
            @Valid @RequestBody BulkCreateUsersRequest request) {

        // 第一阶段：验证所有用户的有效性
        List<BulkCreateUsersResponse.CreateUserError> validationErrors = new ArrayList<>();
        Set<String> usernameSet = new HashSet<>();
        Set<String> emailSet = new HashSet<>();
        List<BulkCreateUsersRequest.CreateUserPayload> validPayloads = new ArrayList<>();

        int index = 0;
        for (BulkCreateUsersRequest.CreateUserPayload payload : request.getUsers()) {
            String normalizedUsername = payload.getUsername().trim().toLowerCase(Locale.ROOT);
            String normalizedEmail = payload.getEmail().trim().toLowerCase(Locale.ROOT);
            UserRole role = payload.getRole() != null ? payload.getRole() : UserRole.STUDENT;
            UserStatus status = payload.getStatus() != null ? payload.getStatus() : UserStatus.ACTIVE;
            String statusReason = normalizeReason(payload.getStatusReason());

            // 验证请求内的重复性
            String validationError = validatePayload(
                    payload, role, status, statusReason, usernameSet, emailSet, normalizedUsername, normalizedEmail);
            
            // 验证数据库中的唯一性
            if (validationError == null) {
                validationError = validateAgainstDatabase(payload.getUsername(), payload.getEmail());
            }

            if (validationError != null) {
                validationErrors.add(BulkCreateUsersResponse.CreateUserError.builder()
                        .index(index)
                        .username(payload.getUsername())
                        .email(payload.getEmail())
                        .message(validationError)
                        .build());
            } else {
                usernameSet.add(normalizedUsername);
                emailSet.add(normalizedEmail);
                validPayloads.add(payload);
            }
            index++;
        }

        // 如果有任何验证错误，返回所有错误，不创建任何用户
        if (!validationErrors.isEmpty()) {
            BulkCreateUsersResponse response = BulkCreateUsersResponse.builder()
                    .created(List.of())
                    .errors(validationErrors)
                    .build();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.success(response));
        }

        // 第二阶段：所有验证通过，统一批量创建
        List<AdminUserResponse> createdUsers = new ArrayList<>();
        List<UserAccount> usersToSave = new ArrayList<>();
        List<StudentProfile> studentProfilesToSave = new ArrayList<>();
        List<TeacherProfile> teacherProfilesToSave = new ArrayList<>();

        for (BulkCreateUsersRequest.CreateUserPayload payload : validPayloads) {
            UserRole role = payload.getRole() != null ? payload.getRole() : UserRole.STUDENT;
            UserStatus status = payload.getStatus() != null ? payload.getStatus() : UserStatus.ACTIVE;
            String statusReason = normalizeReason(payload.getStatusReason());

            UserAccount user = new UserAccount();
            user.setUsername(payload.getUsername().trim());
            user.setEmail(payload.getEmail().trim());
            user.setPassword(passwordEncoder.encode(payload.getPassword()));
            user.setRole(role);
            user.setStatus(status);
            user.setStatusReason(statusReason);
            usersToSave.add(user);
        }

        // 批量保存用户
        List<UserAccount> savedUsers = userAccountRepository.saveAll(usersToSave);

        // 创建对应的Profile
        for (int i = 0; i < savedUsers.size(); i++) {
            UserAccount savedUser = savedUsers.get(i);
            BulkCreateUsersRequest.CreateUserPayload payload = validPayloads.get(i);

            StudentProfile studentProfileEntity = null;
            TeacherProfile teacherProfileEntity = null;

            if (payload.getStudentProfile() != null) {
                studentProfileEntity = new StudentProfile();
                studentProfileEntity.setUserId(savedUser.getId());
                studentProfileEntity.setStudentNo(payload.getStudentProfile().getStudentNo().trim());
                studentProfileEntity.setGrade(trimToNull(payload.getStudentProfile().getGrade()));
                studentProfileEntity.setMajor(trimToNull(payload.getStudentProfile().getMajor()));
                studentProfileEntity.setClassName(trimToNull(payload.getStudentProfile().getClassName()));
                studentProfilesToSave.add(studentProfileEntity);
            }

            if (payload.getTeacherProfile() != null) {
                teacherProfileEntity = new TeacherProfile();
                teacherProfileEntity.setUserId(savedUser.getId());
                teacherProfileEntity.setTeacherNo(payload.getTeacherProfile().getTeacherNo().trim());
                teacherProfileEntity.setDepartment(trimToNull(payload.getTeacherProfile().getDepartment()));
                teacherProfileEntity.setTitle(trimToNull(payload.getTeacherProfile().getTitle()));
                teacherProfileEntity.setSubjects(joinSubjects(payload.getTeacherProfile().getSubjects()));
                teacherProfilesToSave.add(teacherProfileEntity);
            }
        }

        // 批量保存Profiles
        if (!studentProfilesToSave.isEmpty()) {
            studentProfileRepository.saveAll(studentProfilesToSave);
        }
        if (!teacherProfilesToSave.isEmpty()) {
            teacherProfileRepository.saveAll(teacherProfilesToSave);
        }

        // 构建响应
        Map<UUID, StudentProfile> studentProfileMap = studentProfilesToSave.stream()
                .collect(Collectors.toMap(StudentProfile::getUserId, profile -> profile));
        Map<UUID, TeacherProfile> teacherProfileMap = teacherProfilesToSave.stream()
                .collect(Collectors.toMap(TeacherProfile::getUserId, profile -> profile));

        for (UserAccount savedUser : savedUsers) {
            createdUsers.add(toResponse(
                    savedUser,
                    studentProfileMap.get(savedUser.getId()),
                    teacherProfileMap.get(savedUser.getId())));
        }

        BulkCreateUsersResponse response = BulkCreateUsersResponse.builder()
                .created(createdUsers)
                .errors(List.of())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PutMapping("/{userId}/status")
    @Transactional
    public ApiResponse<AdminUserResponse> updateUserStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserStatusRequest request) {

        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String reason = normalizeReason(request.getReason());
        if (request.getStatus() != UserStatus.ACTIVE && !StringUtils.hasText(reason)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "reason is required when status is not ACTIVE");
        }

        user.setStatus(request.getStatus());
        user.setStatusReason(reason);
        userAccountRepository.save(user);

        StudentProfile studentProfile = studentProfileRepository.findByUserId(userId).orElse(null);
        TeacherProfile teacherProfile = teacherProfileRepository.findByUserId(userId).orElse(null);

        return ApiResponse.success(toResponse(user, studentProfile, teacherProfile));
    }

    @PatchMapping("/{userId}")
    @Transactional
    public ApiResponse<AdminUserResponse> updateUser(
            @PathVariable UUID userId,
            @Valid @RequestBody AdminUpdateUserRequest request) {

        UserAccount user = userAccountRepository.findById(userId)
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

        // Update status if provided
        if (request.getStatus() != null) {
            String reason = normalizeReason(request.getStatusReason());
            if (request.getStatus() != UserStatus.ACTIVE && !StringUtils.hasText(reason)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "reason is required when status is not ACTIVE");
            }
            if (request.getStatus() != user.getStatus()) {
                user.setStatus(request.getStatus());
                user.setStatusReason(reason);
                updated = true;
            }
        }

        if (updated) {
            user = userAccountRepository.save(user);
        }

        StudentProfile studentProfile = studentProfileRepository.findByUserId(userId).orElse(null);
        TeacherProfile teacherProfile = teacherProfileRepository.findByUserId(userId).orElse(null);

        return ApiResponse.success(toResponse(user, studentProfile, teacherProfile));
    }

    private Map<UUID, StudentProfile> loadStudentProfiles(List<UserAccount> users) {
        if (users.isEmpty()) {
            return Map.of();
        }
        List<UUID> ids = users.stream().map(UserAccount::getId).toList();
        return studentProfileRepository.findByUserIdIn(ids)
                .stream()
                .collect(Collectors.toMap(StudentProfile::getUserId, profile -> profile));
    }

    private Map<UUID, TeacherProfile> loadTeacherProfiles(List<UserAccount> users) {
        if (users.isEmpty()) {
            return Map.of();
        }
        List<UUID> ids = users.stream().map(UserAccount::getId).toList();
        return teacherProfileRepository.findByUserIdIn(ids)
                .stream()
                .collect(Collectors.toMap(TeacherProfile::getUserId, profile -> profile));
    }

    private Pageable buildPageable(int page, int pageSize, String sortParameter) {
        int sanitizedPage = Math.max(page, 1) - 1;
        int sanitizedSize = Math.max(1, Math.min(pageSize, MAX_PAGE_SIZE));
        Sort sort = buildSort(sortParameter);
        return PageRequest.of(sanitizedPage, sanitizedSize, sort);
    }

    private Sort buildSort(String sortParameter) {
        if (!StringUtils.hasText(sortParameter)) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        String[] parts = sortParameter.split(",", 2);
        String property = parts[0].trim();
        Sort.Direction direction = Sort.Direction.DESC;
        if (parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim())) {
            direction = Sort.Direction.ASC;
        } else if (parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim())) {
            direction = Sort.Direction.DESC;
        }
        if (!ALLOWED_SORT_PROPERTIES.contains(property)) {
            property = "createdAt";
        }
        return Sort.by(direction, property);
    }

    private PageMeta toPageMeta(Page<?> page, Pageable pageable) {
        String sort = pageable.getSort().stream()
                .map(order -> order.getProperty() + "," + order.getDirection().name().toLowerCase(Locale.ROOT))
                .collect(Collectors.joining(";"));
        return PageMeta.builder()
                .page(pageable.getPageNumber() + 1)
                .pageSize(pageable.getPageSize())
                .total(page.getTotalElements())
                .sort(sort)
                .build();
    }

    private AdminUserResponse toResponse(UserAccount user, StudentProfile studentProfile,
            TeacherProfile teacherProfile) {
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

        return AdminUserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .statusReason(user.getStatusReason())
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

    private String joinSubjects(List<String> subjects) {
        if (subjects == null || subjects.isEmpty()) {
            return null;
        }
        return subjects.stream()
                .map(subject -> subject == null ? null : subject.trim())
                .filter(StringUtils::hasText)
                .collect(Collectors.joining(","));
    }

    private String validatePayload(BulkCreateUsersRequest.CreateUserPayload payload,
            UserRole role,
            UserStatus status,
            String statusReason,
            Set<String> usernameSet,
            Set<String> emailSet,
            String normalizedUsername,
            String normalizedEmail) {
        if (usernameSet.contains(normalizedUsername)) {
            return "Duplicate username in request";
        }
        if (emailSet.contains(normalizedEmail)) {
            return "Duplicate email in request";
        }
        if (role == UserRole.ADMIN && (payload.getStudentProfile() != null || payload.getTeacherProfile() != null)) {
            return "Admin users cannot include studentProfile or teacherProfile";
        }
        if (role == UserRole.STUDENT && payload.getTeacherProfile() != null) {
            return "Student users cannot include teacherProfile";
        }
        if (role == UserRole.TEACHER && payload.getStudentProfile() != null) {
            return "Teacher users cannot include studentProfile";
        }
        if (status != UserStatus.ACTIVE && !StringUtils.hasText(statusReason)) {
            return "statusReason is required when status is not ACTIVE";
        }
        return null;
    }

    private String validateAgainstDatabase(String username, String email) {
        if (userAccountRepository.existsByUsernameIgnoreCase(username)) {
            return "Username already exists";
        }
        if (userAccountRepository.existsByEmailIgnoreCase(email)) {
            return "Email already exists";
        }
        return null;
    }

    private String normalizeReason(String reason) {
        return StringUtils.hasText(reason) ? reason.trim() : null;
    }

    private String trimToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
