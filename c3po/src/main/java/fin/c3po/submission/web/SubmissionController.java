package fin.c3po.submission.web;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import fin.c3po.assignment.AssignmentRepository;
import fin.c3po.assignment.Assignment;
import fin.c3po.course.Course;
import fin.c3po.course.CourseRepository;
import fin.c3po.common.web.ApiResponse;
import fin.c3po.submission.Submission;
import fin.c3po.submission.SubmissionRepository;
import fin.c3po.submission.SubmissionStatus;
import fin.c3po.submission.dto.AppealSubmissionRequest;
import fin.c3po.submission.dto.BatchGradeSubmissionRequest;
import fin.c3po.submission.dto.CreateSubmissionRequest;
import fin.c3po.submission.dto.GradeSubmissionRequest;
import fin.c3po.submission.dto.SubmissionResponse;
import fin.c3po.submission.dto.UpdateSubmissionRequest;
import fin.c3po.user.UserAccount;
import fin.c3po.user.UserRole;
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
import org.springframework.web.bind.annotation.PutMapping;
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
public class SubmissionController {

    private final SubmissionRepository submissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final CourseRepository courseRepository;
    private final ObjectMapper objectMapper;

    private static final TypeReference<List<GradeSubmissionRequest.RubricScore>> RUBRIC_TYPE = new TypeReference<>() {
    };

    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @GetMapping("/assignments/{assignmentId}/submissions")
    public ApiResponse<List<SubmissionResponse>> listSubmissions(
            @PathVariable UUID assignmentId,
            @AuthenticationPrincipal UserAccount currentUser) {

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
        ensureCourseAccess(currentUser, assignment.getCourseId());

        List<SubmissionResponse> responses = submissionRepository.findByAssignmentId(assignmentId)
                .stream()
                .map(this::toResponse)
                .toList();
        return ApiResponse.success(responses);
    }

    @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN')")
    @GetMapping("/students/{studentId}/submissions")
    public ApiResponse<List<SubmissionResponse>> studentSubmissions(
            @PathVariable UUID studentId,
            @AuthenticationPrincipal UserAccount currentUser) {

        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        List<Submission> submissions = submissionRepository.findByStudentId(studentId);

        if (currentUser.getRole() == UserRole.STUDENT) {
            if (!currentUser.getId().equals(studentId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Not allowed to view other students' submissions");
            }
        } else if (currentUser.getRole() == UserRole.TEACHER) {
            submissions = submissions.stream()
                    .filter(submission -> teacherCanAccessSubmission(currentUser, submission))
                    .toList();
        } else if (currentUser.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to view student submissions");
        }

        List<SubmissionResponse> responses = submissions.stream()
                .map(this::toResponse)
                .toList();
        return ApiResponse.success(responses);
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/assignments/{assignmentId}/submissions")
    public ResponseEntity<ApiResponse<SubmissionResponse>> createSubmission(
            @PathVariable UUID assignmentId,
            @Valid @RequestBody CreateSubmissionRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));

        Instant now = Instant.now();
        ensureAssignmentOpenForSubmission(assignment, now);

        if (submissionRepository.existsByAssignmentIdAndStudentId(assignmentId, currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Submission already exists, please update instead");
        }

        Submission submission = new Submission();
        submission.setAssignmentId(assignmentId);
        submission.setStudentId(currentUser.getId());
        submission.setStatus(SubmissionStatus.SUBMITTED);
        submission.setScore(null);
        submission.setSubmittedAt(now);
        submission.setAttachments(new ArrayList<>(request.getAttachments()));
        submission.setResubmitCount(0);

        Submission saved = submissionRepository.save(submission);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(toResponse(saved)));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PutMapping("/submissions/{submissionId}")
    public ApiResponse<SubmissionResponse> updateSubmission(
            @PathVariable UUID submissionId,
            @Valid @RequestBody UpdateSubmissionRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {

        Submission submission = submissionRepository.findWithAttachmentsById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));
        if (!submission.getStudentId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to update this submission");
        }

        Assignment assignment = assignmentRepository.findById(submission.getAssignmentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));

        Instant now = Instant.now();
        ensureAssignmentOpenForSubmission(assignment, now);

        if (!Boolean.TRUE.equals(assignment.getAllowResubmit())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Assignment does not allow resubmission");
        }

        int resubmitCount = submission.getResubmitCount() == null ? 0 : submission.getResubmitCount();
        Integer maxResubmit = assignment.getMaxResubmit();
        if (maxResubmit != null && resubmitCount >= maxResubmit) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Resubmission limit reached");
        }

        submission.setAttachments(new ArrayList<>(request.getAttachments()));
        submission.setStatus(SubmissionStatus.RESUBMITTED);
        submission.setSubmittedAt(now);
        submission.setResubmitCount(resubmitCount + 1);
        submission.setScore(null);
        submission.setFeedback(null);
        submission.setRubricScores(null);
        submission.setGradingTeacherId(null);
        submission.setAppealReason(null);
        submission.setAppealedAt(null);
        Submission saved = submissionRepository.save(submission);
        return ApiResponse.success(toResponse(saved));
    }

    @GetMapping("/submissions/{submissionId}")
    public ApiResponse<SubmissionResponse> getSubmission(
            @PathVariable UUID submissionId,
            @AuthenticationPrincipal UserAccount currentUser) {

        Submission submission = submissionRepository.findWithAttachmentsById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));

        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        if (!submission.getStudentId().equals(currentUser.getId())) {
            Assignment assignment = assignmentRepository.findById(submission.getAssignmentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
            ensureCourseAccess(currentUser, assignment.getCourseId());
        }

        return ApiResponse.success(toResponse(submission));
    }

    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @PostMapping("/submissions/{submissionId}/grade")
    public ApiResponse<SubmissionResponse> gradeSubmission(
            @PathVariable UUID submissionId,
            @Valid @RequestBody GradeSubmissionRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {

        Submission submission = submissionRepository.findWithAttachmentsById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));
        Assignment assignment = assignmentRepository.findById(submission.getAssignmentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));

        ensureCourseAccess(currentUser, assignment.getCourseId());

        submission.setScore(request.getScore());
        submission.setFeedback(request.getFeedback());
        submission.setRubricScores(toJson(request.getRubricScores()));
        submission.setGradingTeacherId(currentUser.getId());
        if (request.isPublish()) {
            submission.setStatus(SubmissionStatus.GRADED);
        }
        submission.setAppealReason(null);
        submission.setAppealedAt(null);
        Submission saved = submissionRepository.save(submission);
        return ApiResponse.success(toResponse(saved));
    }

    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @PostMapping("/assignments/{assignmentId}/submissions/batch-grade")
    public ApiResponse<List<SubmissionResponse>> batchGradeSubmissions(
            @PathVariable UUID assignmentId,
            @Valid @RequestBody BatchGradeSubmissionRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
        ensureCourseAccess(currentUser, assignment.getCourseId());

        // 收集所有需要评分的submission ID
        List<UUID> submissionIds = request.getGrades().stream()
                .map(BatchGradeSubmissionRequest.GradeItem::getSubmissionId)
                .toList();

        // 检查是否有重复的submissionId
        if (submissionIds.size() != submissionIds.stream().distinct().count()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicate submission IDs in request");
        }

        // 批量查询所有submissions
        List<Submission> submissions = submissionRepository.findAllById(submissionIds);

        // 验证是否有缺失的submission
        if (submissions.size() != submissionIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Some submissions not found");
        }

        // 验证所有submissions都属于指定的assignment
        for (Submission submission : submissions) {
            if (!submission.getAssignmentId().equals(assignmentId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Submission " + submission.getId() + " does not belong to assignment " + assignmentId);
            }
        }

        // 创建submission ID到GradeItem的映射
        java.util.Map<UUID, BatchGradeSubmissionRequest.GradeItem> gradeMap = request.getGrades().stream()
                .collect(java.util.stream.Collectors.toMap(
                        BatchGradeSubmissionRequest.GradeItem::getSubmissionId,
                        item -> item));

        // 批量更新评分
        for (Submission submission : submissions) {
            BatchGradeSubmissionRequest.GradeItem gradeItem = gradeMap.get(submission.getId());
            if (gradeItem == null) {
                continue;
            }

            submission.setScore(gradeItem.getScore());
            submission.setFeedback(gradeItem.getFeedback());
            submission.setRubricScores(toJson(gradeItem.getRubricScores()));
            submission.setGradingTeacherId(currentUser.getId());
            if (gradeItem.isPublish()) {
                submission.setStatus(SubmissionStatus.GRADED);
            }
            submission.setAppealReason(null);
            submission.setAppealedAt(null);
        }

        // 批量保存
        List<Submission> saved = submissionRepository.saveAll(submissions);

        // 转换为响应
        List<SubmissionResponse> responses = saved.stream()
                .map(this::toResponse)
                .toList();

        return ApiResponse.success(responses);
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/submissions/{submissionId}/appeal")
    public ApiResponse<SubmissionResponse> appealSubmission(
            @PathVariable UUID submissionId,
            @Valid @RequestBody AppealSubmissionRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Submission not found"));
        if (!submission.getStudentId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to appeal this submission");
        }
        if (submission.getScore() == null || submission.getStatus() != SubmissionStatus.GRADED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Submission has not been graded or published");
        }
        if (submission.getAppealReason() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Submission already appealed");
        }
        submission.setStatus(SubmissionStatus.APPEALED);
        submission.setAppealReason(request.getReason());
        submission.setAppealedAt(Instant.now());

        Submission saved = submissionRepository.save(submission);
        return ApiResponse.success(toResponse(saved));
    }

    private boolean teacherCanAccessSubmission(UserAccount teacher, Submission submission) {
        Assignment assignment = assignmentRepository.findById(submission.getAssignmentId())
                .orElse(null);
        if (assignment == null) {
            return false;
        }
        try {
            ensureCourseAccess(teacher, assignment.getCourseId());
            return true;
        } catch (ResponseStatusException ex) {
            return false;
        }
    }

    private void ensureCourseAccess(UserAccount user, UUID courseId) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        if (user.getRole() == UserRole.ADMIN) {
            return;
        }
        if (user.getRole() == UserRole.TEACHER) {
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
            if (course.getTeacherId().equals(user.getId())) {
                return;
            }
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to access submissions");
    }

    private void ensureAssignmentOpenForSubmission(Assignment assignment, Instant now) {
        if (!Boolean.TRUE.equals(assignment.getPublished())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Assignment is not published");
        }
        if (assignment.getReleaseAt() != null && now.isBefore(assignment.getReleaseAt())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Assignment is not yet open for submission");
        }
        if (assignment.getDeadline() != null && now.isAfter(assignment.getDeadline())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Assignment submission deadline has passed");
        }
    }

    private SubmissionResponse toResponse(Submission submission) {
        List<GradeSubmissionRequest.RubricScore> rubric = fromJson(submission.getRubricScores());
        return SubmissionResponse.builder()
                .id(submission.getId())
                .assignmentId(submission.getAssignmentId())
                .studentId(submission.getStudentId())
                .status(submission.getStatus())
                .score(submission.getScore())
                .submittedAt(submission.getSubmittedAt())
                .attachments(new ArrayList<>(submission.getAttachments()))
                .feedback(submission.getFeedback())
                .rubricScores(rubric)
                .appealReason(submission.getAppealReason())
                .appealedAt(submission.getAppealedAt())
                .gradingTeacherId(submission.getGradingTeacherId())
                .resubmitCount(submission.getResubmitCount())
                .createdAt(submission.getCreatedAt())
                .updatedAt(submission.getUpdatedAt())
                .build();
    }

    private List<GradeSubmissionRequest.RubricScore> fromJson(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, RUBRIC_TYPE);
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private String toJson(List<GradeSubmissionRequest.RubricScore> rubricScores) {
        if (rubricScores == null || rubricScores.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(rubricScores);
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid rubric scores format");
        }
    }
}
