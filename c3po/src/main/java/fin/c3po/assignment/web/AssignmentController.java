package fin.c3po.assignment.web;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import fin.c3po.assignment.Assignment;
import fin.c3po.assignment.AssignmentRepository;
import fin.c3po.assignment.dto.AssignmentResponse;
import fin.c3po.assignment.dto.CreateAssignmentRequest;
import fin.c3po.assignment.dto.DuplicateAssignmentRequest;
import fin.c3po.assignment.dto.UpdateAssignmentRequest;
import fin.c3po.common.web.ApiResponse;
import fin.c3po.course.Course;
import fin.c3po.course.CourseRepository;
import fin.c3po.user.UserAccount;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@Validated
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentRepository assignmentRepository;
    private final CourseRepository courseRepository;
    private final ObjectMapper objectMapper;

    private static final TypeReference<List<CreateAssignmentRequest.RubricItem>> RUBRIC_TYPE = new TypeReference<>() {
    };

    @GetMapping("/courses/{courseId}/assignments")
    public ApiResponse<List<AssignmentResponse>> listAssignments(@PathVariable UUID courseId) {
        ensureCourseExists(courseId);
        List<AssignmentResponse> responses = assignmentRepository.findByCourseId(courseId)
                .stream()
                .map(this::toResponse)
                .toList();
        return ApiResponse.success(responses);
    }

    @GetMapping("/assignments/{assignmentId}")
    public ApiResponse<AssignmentResponse> getAssignment(@PathVariable UUID assignmentId) {
        Assignment assignment = assignmentRepository.findWithTagsById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
        return ApiResponse.success(toResponse(assignment));
    }

    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @PostMapping("/courses/{courseId}/assignments")
    public ResponseEntity<ApiResponse<AssignmentResponse>> createAssignment(
            @PathVariable UUID courseId,
            @Valid @RequestBody CreateAssignmentRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        ensureCourseOwner(currentUser, course);

        Assignment assignment = new Assignment();
        assignment.setCourseId(courseId);
        assignment.setTitle(request.getTitle());
        assignment.setType(request.getType());
        assignment.setDeadline(request.getDeadline());
        assignment.setAllowResubmit(request.getAllowResubmit());
        assignment.setMaxResubmit(request.getMaxResubmit());
        assignment.setGradingRubric(toJson(request.getGradingRubric()));
        assignment.setReleaseAt(request.getVisibility() != null ? request.getVisibility().getReleaseAt() : null);
        assignment.getVisibilityTags().clear();
        if (request.getVisibility() != null && request.getVisibility().getVisibleTo() != null) {
            assignment.getVisibilityTags().addAll(request.getVisibility().getVisibleTo());
        }

        Assignment saved = assignmentRepository.save(assignment);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(toResponse(saved)));
    }

    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @PatchMapping("/assignments/{assignmentId}")
    public ApiResponse<AssignmentResponse> updateAssignment(
            @PathVariable UUID assignmentId,
            @Valid @RequestBody UpdateAssignmentRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
        Course course = courseRepository.findById(assignment.getCourseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        ensureCourseOwner(currentUser, course);

        if (request.getTitle() != null) {
            assignment.setTitle(request.getTitle());
        }
        if (request.getType() != null) {
            assignment.setType(request.getType());
        }
        if (request.getDeadline() != null) {
            assignment.setDeadline(request.getDeadline());
        }
        if (request.getAllowResubmit() != null) {
            assignment.setAllowResubmit(request.getAllowResubmit());
        }
        if (request.getMaxResubmit() != null) {
            assignment.setMaxResubmit(request.getMaxResubmit());
        }
        if (request.getGradingRubric() != null) {
            assignment.setGradingRubric(toJson(request.getGradingRubric()));
        }
        if (request.getVisibility() != null) {
            assignment.setReleaseAt(request.getVisibility().getReleaseAt());
            assignment.getVisibilityTags().clear();
            if (request.getVisibility().getVisibleTo() != null) {
                assignment.getVisibilityTags().addAll(request.getVisibility().getVisibleTo());
            }
        }

        Assignment saved = assignmentRepository.save(assignment);
        return ApiResponse.success(toResponse(saved));
    }

    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @PostMapping("/assignments/{assignmentId}/publish")
    public ApiResponse<AssignmentResponse> publishAssignment(
            @PathVariable UUID assignmentId,
            @AuthenticationPrincipal UserAccount currentUser) {

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
        Course course = courseRepository.findById(assignment.getCourseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        ensureCourseOwner(currentUser, course);

        assignment.setPublished(true);
        assignment.setPublishedAt(Instant.now());
        if (assignment.getReleaseAt() == null) {
            assignment.setReleaseAt(Instant.now());
        }
        Assignment saved = assignmentRepository.save(assignment);
        return ApiResponse.success(toResponse(saved));
    }

    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @PostMapping("/assignments/{assignmentId}/duplicate")
    public ResponseEntity<ApiResponse<AssignmentResponse>> duplicateAssignment(
            @PathVariable UUID assignmentId,
            @Valid @RequestBody DuplicateAssignmentRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
        Course sourceCourse = courseRepository.findById(assignment.getCourseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        ensureCourseOwner(currentUser, sourceCourse);

        Course targetCourse = courseRepository.findById(request.getTargetCourseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target course not found"));

        Assignment clone = new Assignment();
        clone.setCourseId(targetCourse.getId());
        clone.setTitle(request.getNewTitle() != null ? request.getNewTitle() : assignment.getTitle());
        clone.setType(assignment.getType());
        clone.setDeadline(assignment.getDeadline());
        clone.setAllowResubmit(assignment.getAllowResubmit());
        clone.setMaxResubmit(assignment.getMaxResubmit());
        clone.setGradingRubric(assignment.getGradingRubric());
        clone.setReleaseAt(assignment.getReleaseAt());
        clone.setPublished(false);
        clone.setVisibilityTags(new ArrayList<>(assignment.getVisibilityTags()));

        Assignment saved = assignmentRepository.save(clone);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(toResponse(saved)));
    }

    private void ensureCourseExists(UUID courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
        }
    }

    private void ensureCourseOwner(UserAccount currentUser, Course course) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        if (!currentUser.getRole().equals(fin.c3po.user.UserRole.ADMIN)
                && !course.getTeacherId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to manage assignments");
        }
    }

    private AssignmentResponse toResponse(Assignment assignment) {
        List<CreateAssignmentRequest.RubricItem> rubric = fromJson(assignment.getGradingRubric());
        return AssignmentResponse.builder()
                .id(assignment.getId())
                .courseId(assignment.getCourseId())
                .title(assignment.getTitle())
                .type(assignment.getType())
                .deadline(assignment.getDeadline())
                .allowResubmit(assignment.getAllowResubmit())
                .maxResubmit(assignment.getMaxResubmit())
                .gradingRubric(rubric)
                .visibilityTags(new ArrayList<>(assignment.getVisibilityTags()))
                .releaseAt(assignment.getReleaseAt())
                .published(assignment.getPublished())
                .publishedAt(assignment.getPublishedAt())
                .createdAt(assignment.getCreatedAt())
                .updatedAt(assignment.getUpdatedAt())
                .build();
    }

    private List<CreateAssignmentRequest.RubricItem> fromJson(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, RUBRIC_TYPE);
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private String toJson(List<CreateAssignmentRequest.RubricItem> items) {
        if (items == null || items.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(items);
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid rubric format");
        }
    }
}
