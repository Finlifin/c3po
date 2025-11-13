package fin.c3po.course.web;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import fin.c3po.approval.ApprovalRequest;
import fin.c3po.approval.ApprovalRequestRepository;
import fin.c3po.approval.ApprovalType;
import fin.c3po.common.web.ApiResponse;
import fin.c3po.common.web.PageMeta;
import fin.c3po.course.Course;
import fin.c3po.course.CourseRepository;
import fin.c3po.course.CourseStatus;
import fin.c3po.course.dto.CourseAnalyticsResponse;
import fin.c3po.course.dto.CourseEnrollmentResponse;
import fin.c3po.course.dto.CoursePublishResponse;
import fin.c3po.course.dto.CourseResponse;
import fin.c3po.course.dto.CreateCourseRequest;
import fin.c3po.course.dto.StudentCourseResponse;
import fin.c3po.course.dto.UpdateCourseRequest;
import fin.c3po.selection.CourseSelection;
import fin.c3po.selection.CourseSelectionRepository;
import fin.c3po.selection.SelectionStatus;
import fin.c3po.assignment.Assignment;
import fin.c3po.assignment.AssignmentRepository;
import fin.c3po.course.CourseModuleRepository;
import fin.c3po.submission.Submission;
import fin.c3po.submission.SubmissionRepository;
import fin.c3po.submission.SubmissionStatus;
import fin.c3po.user.UserAccount;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.DoubleSummaryStatistics;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@Validated
@RequiredArgsConstructor
public class CourseController {

    private static final int MAX_PAGE_SIZE = 100;

    private final CourseRepository courseRepository;
    private final CourseModuleRepository courseModuleRepository;
    private final AssignmentRepository assignmentRepository;
    private final CourseSelectionRepository courseSelectionRepository;
    private final SubmissionRepository submissionRepository;
    private final ApprovalRequestRepository approvalRequestRepository;
    private final ObjectMapper objectMapper;

    @GetMapping("/courses")
    public ApiResponse<List<CourseResponse>> listCourses(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "pageSize", defaultValue = "20") int pageSize,
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "teacherId", required = false) UUID teacherId,
            @RequestParam(name = "status", required = false) CourseStatus status,
            @RequestParam(name = "sort", defaultValue = "createdAt,desc") String sort) {

        Pageable pageable = buildPageable(page, pageSize, sort);
        Specification<Course> spec = (root, query, cb) -> cb.conjunction();

        if (keyword != null && !keyword.isBlank()) {
            String pattern = "%" + keyword.toLowerCase(Locale.ROOT) + "%";
            spec = spec.and((root, query, cb) -> cb.like(cb.lower(root.get("name")), pattern));
        }
        if (teacherId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("teacherId"), teacherId));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }

        Page<Course> coursePage = courseRepository.findAll(spec, pageable);
        List<CourseResponse> responses = coursePage.getContent()
                .stream()
                .map(this::toCourseResponse)
                .toList();

        PageMeta meta = PageMeta.builder()
                .page(pageable.getPageNumber() + 1)
                .pageSize(pageable.getPageSize())
                .total(coursePage.getTotalElements())
                .sort(pageable.getSort().stream()
                        .map(order -> order.getProperty() + "," + order.getDirection().name().toLowerCase(Locale.ROOT))
                        .collect(Collectors.joining(";")))
                .build();

        return ApiResponse.success(responses, meta);
    }

    @GetMapping("/courses/{courseId}")
    public ApiResponse<CourseResponse> getCourse(@PathVariable UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
        return ApiResponse.success(toCourseResponse(course));
    }

    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @PostMapping("/courses")
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(
            @Valid @RequestBody CreateCourseRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {

        UUID teacherId = request.getTeacherId();
        if (teacherId == null) {
            if (currentUser == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
            }
            teacherId = currentUser.getId();
        }

        Course course = new Course();
        course.setName(request.getName().trim());
        course.setSemester(request.getSemester());
        course.setCredit(request.getCredit());
        course.setEnrollLimit(request.getEnrollLimit());
        course.setTeacherId(teacherId);
        course.setStatus(CourseStatus.DRAFT);

        Course saved = courseRepository.save(course);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(toCourseResponse(saved)));
    }

    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @PutMapping("/courses/{courseId}")
    public ApiResponse<CourseResponse> updateCourse(
            @PathVariable UUID courseId,
            @Valid @RequestBody UpdateCourseRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        if (!currentUser.getRole().equals(fin.c3po.user.UserRole.ADMIN)
                && !course.getTeacherId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to update this course");
        }

        if (request.getName() != null) {
            course.setName(request.getName().trim());
        }
        if (request.getSemester() != null) {
            course.setSemester(request.getSemester());
        }
        if (request.getCredit() != null) {
            course.setCredit(request.getCredit());
        }
        if (request.getEnrollLimit() != null) {
            course.setEnrollLimit(request.getEnrollLimit());
        }

        Course saved = courseRepository.save(course);
        return ApiResponse.success(toCourseResponse(saved));
    }

    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @PostMapping("/courses/{courseId}/publish")
    public ApiResponse<CoursePublishResponse> publishCourse(
            @PathVariable UUID courseId,
            @AuthenticationPrincipal UserAccount currentUser) {

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        if (!currentUser.getRole().equals(fin.c3po.user.UserRole.ADMIN)
                && !course.getTeacherId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to publish this course");
        }

        course.setStatus(CourseStatus.PENDING_REVIEW);
        courseRepository.save(course);

        ApprovalRequest approvalRequest = new ApprovalRequest();
        approvalRequest.setType(ApprovalType.COURSE_PUBLISH);
        approvalRequest.setApplicantId(currentUser.getId());
        approvalRequest.setPayload(toJson(Map.of("courseId", courseId)));
        ApprovalRequest saved = approvalRequestRepository.save(approvalRequest);

        CoursePublishResponse response = CoursePublishResponse.builder()
                .courseId(courseId)
                .status(course.getStatus())
                .approvalRequestId(saved.getId())
                .submittedAt(saved.getCreatedAt())
                .build();
        return ApiResponse.success(response);
    }

    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/courses/{courseId}/enroll")
    public ApiResponse<CourseEnrollmentResponse> enrollCourse(
            @PathVariable UUID courseId,
            @AuthenticationPrincipal UserAccount currentUser) {

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        if (course.getStatus() != CourseStatus.PUBLISHED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Course is not open for enrollment");
        }

        UUID studentId = currentUser.getId();
        CourseSelection selection = courseSelectionRepository.findByCourseIdAndStudentId(courseId, studentId)
                .orElseGet(() -> {
                    CourseSelection s = new CourseSelection();
                    s.setCourseId(courseId);
                    s.setStudentId(studentId);
                    return s;
                });

        if (selection.getId() != null && selection.getStatus() == SelectionStatus.ENROLLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already enrolled");
        }

        if (course.getEnrollLimit() != null) {
            long enrolledCount = courseSelectionRepository.countByCourseIdAndStatus(courseId, SelectionStatus.ENROLLED);
            boolean incrementsCapacity = selection.getId() == null || selection.getStatus() != SelectionStatus.ENROLLED;
            if (incrementsCapacity && enrolledCount >= course.getEnrollLimit()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Course capacity reached");
            }
        }

        selection.setStatus(SelectionStatus.ENROLLED);
        selection.setSelectedAt(Instant.now());

        CourseSelection saved = courseSelectionRepository.save(selection);
        CourseEnrollmentResponse response = CourseEnrollmentResponse.builder()
                .selectionId(saved.getId())
                .courseId(saved.getCourseId())
                .studentId(saved.getStudentId())
                .status(saved.getStatus())
                .selectedAt(saved.getSelectedAt())
                .build();
        return ApiResponse.success(response);
    }

    @PreAuthorize("hasRole('STUDENT')")
    @DeleteMapping("/courses/{courseId}/enroll")
    public ResponseEntity<Void> dropCourse(
            @PathVariable UUID courseId,
            @AuthenticationPrincipal UserAccount currentUser) {

        CourseSelection selection = courseSelectionRepository.findByCourseIdAndStudentId(courseId, currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Enrollment not found"));

        if (selection.getStatus() != SelectionStatus.ENROLLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Enrollment is not active");
        }

        selection.setStatus(SelectionStatus.DROPPED);
        selection.setSelectedAt(Instant.now());
        courseSelectionRepository.save(selection);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/students/{studentId}/courses")
    public ApiResponse<List<StudentCourseResponse>> studentCourses(
            @PathVariable UUID studentId,
            @AuthenticationPrincipal UserAccount currentUser) {

        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        boolean isSelf = currentUser.getId().equals(studentId);
        boolean isAdminOrTeacher = currentUser.getRole() == fin.c3po.user.UserRole.ADMIN
                || currentUser.getRole() == fin.c3po.user.UserRole.TEACHER;
        if (!isSelf && !isAdminOrTeacher) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to view courses");
        }

        List<CourseSelection> selections = courseSelectionRepository.findByStudentId(studentId);
        List<StudentCourseResponse> responses = new ArrayList<>();
        for (CourseSelection selection : selections) {
            courseRepository.findById(selection.getCourseId()).ifPresent(course -> {
                List<Submission> submissions = selectionSubmissions(course.getId(), studentId);
                List<Assignment> assignments = assignmentRepository.findByCourseId(course.getId());
                int totalAssignments = assignments.size();
                int completedAssignments = (int) assignments.stream()
                        .filter(assignment -> submissions.stream()
                                .anyMatch(submission -> submission.getAssignmentId().equals(assignment.getId())))
                        .count();
                int gradedAssignments = (int) submissions.stream()
                        .filter(submission -> submission.getStatus() == SubmissionStatus.GRADED)
                        .map(Submission::getAssignmentId)
                        .distinct()
                        .count();
                int pendingAssignments = Math.max(totalAssignments - gradedAssignments, 0);

                responses.add(StudentCourseResponse.builder()
                        .courseId(course.getId())
                        .name(course.getName())
                        .status(course.getStatus())
                        .selectionStatus(selection.getStatus())
                        .selectedAt(selection.getSelectedAt())
                        .pendingAssignments(pendingAssignments)
                        .completedAssignments(gradedAssignments)
                        .totalAssignments(totalAssignments)
                        .build());
            });
        }
        return ApiResponse.success(responses);
    }

    @GetMapping("/courses/{courseId}/analytics/overview")
    public ApiResponse<CourseAnalyticsResponse> courseAnalytics(@PathVariable UUID courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        List<CourseSelection> enrolledSelections = courseSelectionRepository.findByCourseIdAndStatus(courseId, SelectionStatus.ENROLLED);
        List<UUID> enrolledStudents = enrolledSelections.stream()
                .map(CourseSelection::getStudentId)
                .toList();

        List<Assignment> assignments = assignmentRepository.findByCourseId(courseId);
        int totalAssignments = assignments.size();
        int enrolledCount = enrolledStudents.size();

        if (enrolledStudents.isEmpty() || assignments.isEmpty()) {
            CourseAnalyticsResponse response = CourseAnalyticsResponse.builder()
                    .completionRate(0.0)
                    .averageScore(null)
                    .medianScore(null)
                    .enrolledStudents(enrolledCount)
                    .totalAssignments(totalAssignments)
                    .gradedSubmissions(0)
                    .pendingSubmissions(0)
                    .overdueStudents(List.of())
                    .difficultAssignments(List.of())
                    .atRiskStudents(List.of())
                    .insights(assignments.isEmpty()
                            ? List.of("当前课程尚未创建任何作业，暂无可计算的学习分析指标。")
                            : List.of("暂无选课学生，暂不生成学习分析结果。"))
                    .build();
            return ApiResponse.success(response);
        }

        Instant now = Instant.now();
        int gradedSubmissions = 0;
        int pendingSubmissions = 0;
        List<Double> allScores = new ArrayList<>();
        List<String> difficultAssignments = new ArrayList<>();
        List<String> insights = new ArrayList<>();
        Set<UUID> overdueStudents = new LinkedHashSet<>();
        Map<UUID, DoubleSummaryStatistics> scoreStatsByStudent = new HashMap<>();
        Map<UUID, Integer> missingAssignmentsByStudent = new HashMap<>();

        for (Assignment assignment : assignments) {
            List<Submission> assignmentSubmissions = submissionRepository.findByAssignmentId(assignment.getId());
            Map<UUID, Submission> latestByStudent = new HashMap<>();
            for (Submission submission : assignmentSubmissions) {
                Submission current = latestByStudent.get(submission.getStudentId());
                if (current == null || isLater(submission, current)) {
                    latestByStudent.put(submission.getStudentId(), submission);
                }
            }

            double assignmentScoreTotal = 0;
            int assignmentScoreCount = 0;

            for (UUID studentId : enrolledStudents) {
                Submission submission = latestByStudent.get(studentId);
                DoubleSummaryStatistics studentStats = scoreStatsByStudent
                        .computeIfAbsent(studentId, key -> new DoubleSummaryStatistics());

                if (submission != null) {
                    if (submission.getStatus() == SubmissionStatus.GRADED) {
                        gradedSubmissions++;
                    } else {
                        pendingSubmissions++;
                    }
                    Integer score = submission.getScore();
                    if (score != null) {
                        studentStats.accept(score);
                        assignmentScoreTotal += score;
                        assignmentScoreCount++;
                        allScores.add(score.doubleValue());
                    }

                    Instant deadline = assignment.getDeadline();
                    if (deadline != null) {
                        Instant submittedAt = submission.getSubmittedAt();
                        if (submittedAt == null || submittedAt.isAfter(deadline)) {
                            overdueStudents.add(studentId);
                        }
                    }
                } else {
                    missingAssignmentsByStudent.merge(studentId, 1, Integer::sum);
                    Instant deadline = assignment.getDeadline();
                    if (deadline != null && deadline.isBefore(now)) {
                        overdueStudents.add(studentId);
                        pendingSubmissions++;
                    }
                }
            }

            if (assignmentScoreCount > 0) {
                double average = assignmentScoreTotal / assignmentScoreCount;
                if (average < 60) {
                    difficultAssignments.add(assignment.getTitle() != null
                            ? assignment.getTitle()
                            : "Assignment-" + assignment.getId());
                }
            } else if (assignment.getDeadline() != null && assignment.getDeadline().isBefore(now)) {
                difficultAssignments.add(assignment.getTitle() != null
                        ? assignment.getTitle()
                        : "Assignment-" + assignment.getId());
            }
        }

        Set<UUID> atRiskStudents = new LinkedHashSet<>();
        for (UUID studentId : enrolledStudents) {
            DoubleSummaryStatistics stats = scoreStatsByStudent.get(studentId);
            double average = stats != null && stats.getCount() > 0 ? stats.getAverage() : 0;
            int missing = missingAssignmentsByStudent.getOrDefault(studentId, 0);
            if (average < 60 || missing > Math.max(1, totalAssignments / 3)) {
                atRiskStudents.add(studentId);
            }
        }

        double completionRate = enrolledCount == 0 || totalAssignments == 0
                ? 0.0
                : round(gradedSubmissions / (double) (enrolledCount * totalAssignments));

        if (!allScores.isEmpty()) {
            double avg = allScores.stream().mapToDouble(Double::doubleValue).average().orElse(0);
            if (avg >= 90) {
                insights.add("整体得分表现优异，建议进一步挖掘拔尖内容。");
            } else if (avg < 65) {
                insights.add("整体得分偏低，可适当安排跟进辅导。");
            }
        }

        if (!overdueStudents.isEmpty()) {
            insights.add("存在 " + overdueStudents.size() + " 名学生存在逾期或延迟提交，建议发送提醒。");
        }
        if (!difficultAssignments.isEmpty()) {
            insights.add("建议复盘以下难度较高的作业：" + String.join("、", difficultAssignments));
        }
        if (!atRiskStudents.isEmpty()) {
            insights.add("共 " + atRiskStudents.size() + " 名学生处于学业风险区间。");
        }

        CourseAnalyticsResponse response = CourseAnalyticsResponse.builder()
                .completionRate(completionRate)
                .averageScore(allScores.isEmpty() ? null : round(allScores.stream().mapToDouble(Double::doubleValue).average().orElse(0)))
                .medianScore(allScores.isEmpty() ? null : computeMedian(allScores))
                .enrolledStudents(enrolledCount)
                .totalAssignments(totalAssignments)
                .gradedSubmissions(gradedSubmissions)
                .pendingSubmissions(pendingSubmissions)
                .overdueStudents(overdueStudents.stream().map(UUID::toString).toList())
                .difficultAssignments(difficultAssignments)
                .atRiskStudents(atRiskStudents.stream().map(UUID::toString).toList())
                .insights(insights)
                .build();
        return ApiResponse.success(response);
    }

    private boolean isLater(Submission candidate, Submission current) {
        Instant candidateTs = resolveSubmissionTimestamp(candidate);
        Instant currentTs = resolveSubmissionTimestamp(current);
        if (candidateTs == null) {
            return false;
        }
        if (currentTs == null) {
            return true;
        }
        return candidateTs.isAfter(currentTs);
    }

    private Instant resolveSubmissionTimestamp(Submission submission) {
        if (submission.getSubmittedAt() != null) {
            return submission.getSubmittedAt();
        }
        if (submission.getUpdatedAt() != null) {
            return submission.getUpdatedAt();
        }
        return submission.getCreatedAt();
    }

    private Double computeMedian(List<Double> values) {
        if (values.isEmpty()) {
            return null;
        }
        List<Double> sorted = values.stream()
                .sorted()
                .toList();
        int size = sorted.size();
        if (size % 2 == 1) {
            return round(sorted.get(size / 2));
        }
        double left = sorted.get(size / 2 - 1);
        double right = sorted.get(size / 2);
        return round((left + right) / 2.0);
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private Pageable buildPageable(int page, int pageSize, String sort) {
        int sanitizedPage = Math.max(page, 1) - 1;
        int sanitizedSize = Math.max(1, Math.min(pageSize, MAX_PAGE_SIZE));
        Sort sortObj = parseSort(sort);
        return PageRequest.of(sanitizedPage, sanitizedSize, sortObj);
    }

    private Sort parseSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        String[] parts = sort.split(",");
        String property = parts.length > 0 ? parts[0] : "createdAt";
        Sort.Direction direction = Sort.Direction.DESC;
        if (parts.length > 1) {
            direction = "asc".equalsIgnoreCase(parts[1]) ? Sort.Direction.ASC : Sort.Direction.DESC;
        }
        return Sort.by(direction, property);
    }

    private CourseResponse toCourseResponse(Course course) {
        long enrolled = courseSelectionRepository.countByCourseIdAndStatus(course.getId(), SelectionStatus.ENROLLED);
        long assignments = assignmentRepository.countByCourseId(course.getId());
        long modules = courseModuleRepository.countByCourseId(course.getId());

        return CourseResponse.builder()
                .id(course.getId())
                .name(course.getName())
                .semester(course.getSemester())
                .credit(course.getCredit())
                .status(course.getStatus())
                .enrollLimit(course.getEnrollLimit())
                .teacherId(course.getTeacherId())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .metrics(CourseResponse.CourseSummaryMetrics.builder()
                        .enrolledCount((int) Math.min(enrolled, Integer.MAX_VALUE))
                        .assignments((int) Math.min(assignments, Integer.MAX_VALUE))
                        .modules((int) Math.min(modules, Integer.MAX_VALUE))
                        .build())
                .build();
    }

    private List<Submission> selectionSubmissions(UUID courseId, UUID studentId) {
        return assignmentRepository.findByCourseId(courseId).stream()
                .map(assignment -> submissionRepository.findTopByAssignmentIdAndStudentIdOrderBySubmittedAtDesc(assignment.getId(), studentId))
                .flatMap(Optional::stream)
                .toList();
    }

    private String toJson(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to serialize payload");
        }
    }
}


