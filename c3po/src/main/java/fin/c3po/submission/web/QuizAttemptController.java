package fin.c3po.submission.web;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import fin.c3po.assignment.Assignment;
import fin.c3po.assignment.AssignmentRepository;
import fin.c3po.assignment.AssignmentType;
import fin.c3po.common.web.ApiResponse;
import fin.c3po.course.Course;
import fin.c3po.course.CourseRepository;
import fin.c3po.submission.QuizAttempt;
import fin.c3po.submission.QuizAttemptRepository;
import fin.c3po.submission.QuizAttemptStatus;
import fin.c3po.submission.dto.CreateQuizAttemptRequest;
import fin.c3po.submission.dto.GradeQuizAttemptRequest;
import fin.c3po.submission.dto.QuizAttemptResponse;
import fin.c3po.submission.dto.UpdateQuizAttemptRequest;
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
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@Validated
@RequiredArgsConstructor
public class QuizAttemptController {

    private final QuizAttemptRepository quizAttemptRepository;
    private final AssignmentRepository assignmentRepository;
    private final CourseRepository courseRepository;
    private final ObjectMapper objectMapper;

    private static final TypeReference<List<CreateQuizAttemptRequest.Answer>> ANSWER_TYPE =
            new TypeReference<>() {};

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/assignments/{assignmentId}/quiz-attempts")
    public ResponseEntity<ApiResponse<QuizAttemptResponse>> createQuizAttempt(
            @PathVariable UUID assignmentId,
            @Valid @RequestBody CreateQuizAttemptRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
        ensureQuizAssignment(assignment);

        QuizAttempt attempt = new QuizAttempt();
        attempt.setAssignmentId(assignmentId);
        attempt.setStudentId(currentUser.getId());
        attempt.setStartedAt(request.getStartedAt());
        attempt.setDurationSeconds(request.getDurationSeconds());
        attempt.setSubmittedAt(request.getSubmittedAt());
        attempt.setAnswers(toJson(request.getAnswers()));
        attempt.setStatus(request.getSubmittedAt() == null ? QuizAttemptStatus.IN_PROGRESS : QuizAttemptStatus.SUBMITTED);

        QuizAttempt saved = quizAttemptRepository.save(attempt);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(toResponse(saved)));
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PutMapping("/quiz-attempts/{attemptId}")
    public ApiResponse<QuizAttemptResponse> updateQuizAttempt(
            @PathVariable UUID attemptId,
            @Valid @RequestBody UpdateQuizAttemptRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {

        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz attempt not found"));
        if (!attempt.getStudentId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to modify this quiz attempt");
        }

        if (request.getAnswers() != null) {
            attempt.setAnswers(toJson(request.getAnswers()));
        }
        if (request.getDurationSeconds() != null) {
            attempt.setDurationSeconds(request.getDurationSeconds());
        }
        if (request.getSubmittedAt() != null) {
            attempt.setSubmittedAt(request.getSubmittedAt());
            attempt.setStatus(QuizAttemptStatus.SUBMITTED);
        }
        if (Boolean.TRUE.equals(request.getSubmit())) {
            attempt.setStatus(QuizAttemptStatus.SUBMITTED);
            if (attempt.getSubmittedAt() == null) {
                attempt.setSubmittedAt(Instant.now());
            }
        }

        QuizAttempt saved = quizAttemptRepository.save(attempt);
        return ApiResponse.success(toResponse(saved));
    }

    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @GetMapping("/assignments/{assignmentId}/quiz-attempts")
    public ApiResponse<List<QuizAttemptResponse>> listQuizAttempts(
            @PathVariable UUID assignmentId,
            @AuthenticationPrincipal UserAccount currentUser) {

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
        ensureQuizAssignment(assignment);
        ensureCourseAccess(currentUser, assignment.getCourseId());

        List<QuizAttemptResponse> responses = quizAttemptRepository.findByAssignmentId(assignmentId)
                .stream()
                .map(this::toResponse)
                .toList();
        return ApiResponse.success(responses);
    }

    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/assignments/{assignmentId}/quiz-attempts/me")
    public ApiResponse<List<QuizAttemptResponse>> listMyQuizAttempts(
            @PathVariable UUID assignmentId,
            @AuthenticationPrincipal UserAccount currentUser) {

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
        ensureQuizAssignment(assignment);

        List<QuizAttemptResponse> responses = quizAttemptRepository.findByAssignmentIdAndStudentId(assignmentId, currentUser.getId())
                .stream()
                .map(this::toResponse)
                .toList();
        return ApiResponse.success(responses);
    }

    @GetMapping("/quiz-attempts/{attemptId}")
    public ApiResponse<QuizAttemptResponse> getQuizAttempt(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal UserAccount currentUser) {

        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz attempt not found"));
        Assignment assignment = assignmentRepository.findById(attempt.getAssignmentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
        ensureQuizAssignment(assignment);

        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        if (!attempt.getStudentId().equals(currentUser.getId())) {
            ensureCourseAccess(currentUser, assignment.getCourseId());
        }

        return ApiResponse.success(toResponse(attempt));
    }

    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @PostMapping("/quiz-attempts/{attemptId}/grade")
    public ApiResponse<QuizAttemptResponse> gradeQuizAttempt(
            @PathVariable UUID attemptId,
            @Valid @RequestBody GradeQuizAttemptRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {

        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Quiz attempt not found"));
        Assignment assignment = assignmentRepository.findById(attempt.getAssignmentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));
        ensureQuizAssignment(assignment);
        ensureCourseAccess(currentUser, assignment.getCourseId());

        attempt.setScore(request.getScore());
        attempt.setFeedback(request.getFeedback());
        attempt.setStatus(QuizAttemptStatus.GRADED);
        if (attempt.getSubmittedAt() == null) {
            attempt.setSubmittedAt(Instant.now());
        }

        QuizAttempt saved = quizAttemptRepository.save(attempt);
        return ApiResponse.success(toResponse(saved));
    }

    private void ensureQuizAssignment(Assignment assignment) {
        if (assignment.getType() != AssignmentType.QUIZ) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assignment is not a quiz");
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
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to access quiz attempts");
    }

    private QuizAttemptResponse toResponse(QuizAttempt attempt) {
        List<CreateQuizAttemptRequest.Answer> answers = fromJson(attempt.getAnswers());
        return QuizAttemptResponse.builder()
                .id(attempt.getId())
                .assignmentId(attempt.getAssignmentId())
                .studentId(attempt.getStudentId())
                .status(attempt.getStatus())
                .score(attempt.getScore())
                .durationSeconds(attempt.getDurationSeconds())
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .answers(answers)
                .feedback(attempt.getFeedback())
                .createdAt(attempt.getCreatedAt())
                .updatedAt(attempt.getUpdatedAt())
                .build();
    }

    private List<CreateQuizAttemptRequest.Answer> fromJson(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, ANSWER_TYPE);
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private String toJson(List<CreateQuizAttemptRequest.Answer> answers) {
        if (answers == null || answers.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(answers);
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid quiz answers format");
        }
    }
}


