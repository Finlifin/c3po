package fin.c3po.score.web;

import fin.c3po.common.web.ApiResponse;
import fin.c3po.course.Course;
import fin.c3po.course.CourseRepository;
import fin.c3po.assignment.Assignment;
import fin.c3po.assignment.AssignmentRepository;
import fin.c3po.score.Score;
import fin.c3po.score.ScoreRepository;
import fin.c3po.score.dto.CourseScoreOverview;
import fin.c3po.score.dto.CourseScoreSummary;
import fin.c3po.score.dto.CourseScoresResponse;
import fin.c3po.score.dto.CourseLearningProgress;
import fin.c3po.score.dto.CourseProgressOverview;
import fin.c3po.score.dto.PublishScoresRequest;
import fin.c3po.user.UserAccount;
import fin.c3po.user.UserRole;
import fin.c3po.score.dto.ScoreDistributionBucket;
import fin.c3po.score.dto.ScoreExportInfo;
import fin.c3po.score.dto.ScoreResponse;
import fin.c3po.score.dto.ScoreTrendPoint;
import fin.c3po.score.dto.StudentScoreSummary;
import fin.c3po.score.dto.StudentScoresResponse;
import fin.c3po.selection.CourseSelectionRepository;
import fin.c3po.selection.SelectionStatus;
import fin.c3po.submission.Submission;
import fin.c3po.submission.SubmissionRepository;
import fin.c3po.submission.SubmissionStatus;
import fin.c3po.report.ReportJobType;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.DoubleSummaryStatistics;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@Validated
@RequiredArgsConstructor
public class ScoreController {

    private final ScoreRepository scoreRepository;
    private final CourseRepository courseRepository;
    private final CourseSelectionRepository courseSelectionRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;

    @GetMapping("/students/{studentId}/scores")
    public ApiResponse<StudentScoresResponse> studentScores(
            @PathVariable UUID studentId,
            @AuthenticationPrincipal UserAccount currentUser) {

        ensureViewPermission(studentId, currentUser);
        List<Score> scores = scoreRepository.findByStudentId(studentId);
        StudentScoresResponse response = buildStudentScoresResponse(studentId, scores);
        return ApiResponse.success(response);
    }

    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @GetMapping("/courses/{courseId}/scores")
    public ApiResponse<CourseScoresResponse> courseScores(
            @PathVariable UUID courseId,
            @RequestParam(name = "component", required = false) String component,
            @RequestParam(name = "studentId", required = false) UUID studentFilter,
            @AuthenticationPrincipal UserAccount currentUser) {

        ensureCoursePermission(currentUser, courseId);
        List<Score> scores = scoreRepository.findByCourseId(courseId);
        List<Score> filtered = scores.stream()
                .filter(score -> component == null || component.equalsIgnoreCase(score.getComponent()))
                .filter(score -> studentFilter == null || studentFilter.equals(score.getStudentId()))
                .toList();

        CourseScoresResponse response = buildCourseScoresResponse(courseId, filtered);
        return ApiResponse.success(response);
    }

    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @PostMapping("/courses/{courseId}/scores/publish")
    public ResponseEntity<ApiResponse<List<ScoreResponse>>> publishScores(
            @PathVariable UUID courseId,
            @Valid @RequestBody PublishScoresRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {

        ensureCoursePermission(currentUser, courseId);
        Instant releaseTime = request.getPublishAt() != null ? request.getPublishAt() : Instant.now();

        List<ScoreResponse> responses = request.getScores().stream()
                .map(entry -> upsertScore(courseId, entry.getStudentId(), entry.getComponent(), entry.getValue(), releaseTime))
                .map(this::toResponse)
                .toList();

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(responses));
    }

    private void ensureViewPermission(UUID studentId, UserAccount currentUser) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        if (currentUser.getRole() == UserRole.ADMIN || currentUser.getRole() == UserRole.TEACHER) {
            return;
        }
        if (!currentUser.getId().equals(studentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to view scores");
        }
    }

    private void ensureCoursePermission(UserAccount currentUser, UUID courseId) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        if (currentUser.getRole() == UserRole.ADMIN) {
            return;
        }
        if (currentUser.getRole() == UserRole.TEACHER) {
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
            if (!course.getTeacherId().equals(currentUser.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to manage this course");
            }
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to access course scores");
    }

    private Score upsertScore(UUID courseId, UUID studentId, String component, Integer value, Instant releaseTime) {
        Score score = scoreRepository.findByStudentIdAndCourseIdAndComponent(studentId, courseId, component)
                .orElseGet(Score::new);
        score.setCourseId(courseId);
        score.setStudentId(studentId);
        score.setComponent(component);
        score.setValue(value);
        score.setReleasedAt(releaseTime);
        return scoreRepository.save(score);
    }

    private ScoreResponse toResponse(Score score) {
        return ScoreResponse.builder()
                .id(score.getId())
                .studentId(score.getStudentId())
                .courseId(score.getCourseId())
                .component(score.getComponent())
                .value(score.getValue())
                .releasedAt(score.getReleasedAt())
                .createdAt(score.getCreatedAt())
                .updatedAt(score.getUpdatedAt())
                .build();
    }

    private StudentScoresResponse buildStudentScoresResponse(UUID studentId, List<Score> scores) {
        List<ScoreResponse> items = scores.stream()
                .map(this::toResponse)
                .toList();

        Map<UUID, List<Score>> scoresByCourse = scores.stream()
                .collect(Collectors.groupingBy(Score::getCourseId));

        Map<UUID, Course> courseMap = courseRepository.findAllById(scoresByCourse.keySet())
                .stream()
                .collect(Collectors.toMap(Course::getId, course -> course));

        List<CourseScoreSummary> courseSummaries = new ArrayList<>();
        int totalAssignments = 0;
        int completedAssignments = 0;
        int gradedAssignments = 0;
        int overdueAssignments = 0;
        List<Integer> allScoreValues = new ArrayList<>();

        for (Map.Entry<UUID, List<Score>> entry : scoresByCourse.entrySet()) {
            UUID courseId = entry.getKey();
            List<Score> courseScores = entry.getValue();
            Course course = courseMap.get(courseId);

            DoubleSummaryStatistics stats = courseScores.stream()
                    .map(Score::getValue)
                    .filter(Objects::nonNull)
                    .mapToDouble(Integer::doubleValue)
                    .summaryStatistics();

            courseScores.stream()
                    .map(Score::getValue)
                    .filter(Objects::nonNull)
                    .forEach(allScoreValues::add);

            Map<String, Double> componentAverages = averageByComponent(courseScores);
            CourseLearningProgress progress = computeCourseLearningProgress(courseId, studentId);

            totalAssignments += progress.getTotalAssignments();
            completedAssignments += progress.getCompletedAssignments();
            gradedAssignments += progress.getGradedAssignments();
            overdueAssignments += progress.getOverdueAssignments();

            courseSummaries.add(CourseScoreSummary.builder()
                    .courseId(courseId)
                    .courseName(course != null ? course.getName() : null)
                    .average(stats.getCount() > 0 ? round(stats.getAverage()) : null)
                    .highest(stats.getCount() > 0 ? (int) Math.round(stats.getMax()) : null)
                    .lowest(stats.getCount() > 0 ? (int) Math.round(stats.getMin()) : null)
                    .scoreCount((int) stats.getCount())
                    .componentAverages(componentAverages)
                    .progress(progress)
                    .build());
        }

        CourseProgressOverview progressOverview = CourseProgressOverview.builder()
                .totalCourses(scoresByCourse.size())
                .totalAssignments(totalAssignments)
                .completedAssignments(completedAssignments)
                .gradedAssignments(gradedAssignments)
                .overdueAssignments(overdueAssignments)
                .build();

        StudentScoreSummary summary = StudentScoreSummary.builder()
                .overallAverage(allScoreValues.isEmpty() ? null : round(allScoreValues.stream().mapToDouble(Integer::doubleValue).average().orElse(0)))
                .median(allScoreValues.isEmpty() ? null : computeMedian(allScoreValues))
                .gpa(allScoreValues.isEmpty() ? null : round(allScoreValues.stream().mapToDouble(this::convertScoreToGpa).average().orElse(0)))
                .progress(progressOverview)
                .courses(courseSummaries.stream()
                        .sorted(Comparator.comparing(CourseScoreSummary::getAverage, Comparator.nullsLast(Comparator.reverseOrder())))
                        .toList())
                .insights(generateInsights(progressOverview, allScoreValues, courseSummaries))
                .build();

        List<ScoreTrendPoint> trend = scores.stream()
                .filter(score -> score.getValue() != null)
                .sorted(Comparator.comparing(this::resolveTimestamp))
                .map(score -> ScoreTrendPoint.builder()
                        .courseName(Optional.ofNullable(courseMap.get(score.getCourseId()))
                                .map(Course::getName)
                                .orElse(null))
                        .component(score.getComponent())
                        .value(score.getValue().doubleValue())
                        .timestamp(resolveTimestamp(score))
                        .build())
                .toList();

        ScoreExportInfo exportInfo = ScoreExportInfo.builder()
                .available(true)
                .suggestedJobType(ReportJobType.SCORE_EXPORT.name())
                .suggestedParams(Map.of(
                        "studentId", studentId.toString(),
                        "courseIds", scoresByCourse.keySet().stream().map(UUID::toString).toList()
                ))
                .instructions("调用 POST /api/jobs/reports 并传入建议参数即可生成成绩导出任务。")
                .build();

        return StudentScoresResponse.builder()
                .studentId(studentId)
                .items(items)
                .summary(summary)
                .trend(trend)
                .exportInfo(exportInfo)
                .build();
    }

    private CourseScoresResponse buildCourseScoresResponse(UUID courseId, List<Score> scores) {
        List<ScoreResponse> items = scores.stream()
                .map(this::toResponse)
                .toList();

        List<Integer> values = scores.stream()
                .map(Score::getValue)
                .filter(Objects::nonNull)
                .toList();

        DoubleSummaryStatistics stats = values.stream()
                .mapToDouble(Integer::doubleValue)
                .summaryStatistics();

        Map<UUID, DoubleSummaryStatistics> statisticsByStudent = scores.stream()
                .filter(score -> score.getValue() != null)
                .collect(Collectors.groupingBy(
                        Score::getStudentId,
                        Collectors.summarizingDouble(score -> score.getValue().doubleValue())
                ));

        List<String> topPerformers = statisticsByStudent.entrySet().stream()
                .sorted(Map.Entry.<UUID, DoubleSummaryStatistics>comparingByValue(Comparator.comparingDouble(DoubleSummaryStatistics::getAverage)).reversed())
                .limit(5)
                .map(entry -> entry.getKey().toString())
                .toList();

        List<String> needsAttention = statisticsByStudent.entrySet().stream()
                .filter(entry -> entry.getValue().getCount() > 0 && entry.getValue().getAverage() < 60)
                .map(entry -> entry.getKey().toString())
                .toList();

        long enrolledCount = courseSelectionRepository.countByCourseIdAndStatus(courseId, SelectionStatus.ENROLLED);
        double completionRate = enrolledCount == 0 ? 0.0 : round(statisticsByStudent.size() / (double) enrolledCount);

        CourseScoreOverview overview = CourseScoreOverview.builder()
                .average(values.isEmpty() ? null : round(stats.getAverage()))
                .median(values.isEmpty() ? null : computeMedian(values))
                .highest(values.isEmpty() ? null : values.stream().max(Integer::compareTo).orElse(null))
                .lowest(values.isEmpty() ? null : values.stream().min(Integer::compareTo).orElse(null))
                .scoreCount(values.size())
                .studentCount(statisticsByStudent.size())
                .completionRate(completionRate)
                .build();

        List<ScoreDistributionBucket> distribution = buildDistribution(values);

        Map<String, Double> componentAverages = averageByComponent(scores);

        return CourseScoresResponse.builder()
                .courseId(courseId)
                .items(items)
                .overview(overview)
                .distribution(distribution)
                .componentAverages(componentAverages)
                .topPerformers(topPerformers)
                .needsAttention(needsAttention)
                .build();
    }

    private Map<String, Double> averageByComponent(List<Score> scores) {
        Map<String, Double> averages = scores.stream()
                .filter(score -> score.getValue() != null)
                .collect(Collectors.groupingBy(
                        score -> score.getComponent() != null ? score.getComponent() : "UNKNOWN",
                        LinkedHashMap::new,
                        Collectors.averagingDouble(score -> score.getValue().doubleValue())
                ));

        Map<String, Double> rounded = new LinkedHashMap<>();
        averages.forEach((component, value) -> rounded.put(component, round(value)));
        return rounded;
    }

    private List<ScoreDistributionBucket> buildDistribution(List<Integer> values) {
        int[] ranges = {0, 60, 70, 80, 90, 101};
        String[] labels = {"0-59", "60-69", "70-79", "80-89", "90-100"};
        List<ScoreDistributionBucket> buckets = new ArrayList<>();

        for (int i = 0; i < labels.length; i++) {
            int from = ranges[i];
            int to = ranges[i + 1] - 1;
            long count = values.stream()
                    .filter(value -> value >= from && value <= to)
                    .count();

            buckets.add(ScoreDistributionBucket.builder()
                    .label(labels[i])
                    .from(from)
                    .to(to)
                    .count(count)
                    .build());
        }

        return buckets;
    }

    private Instant resolveTimestamp(Score score) {
        if (score.getReleasedAt() != null) {
            return score.getReleasedAt();
        }
        if (score.getUpdatedAt() != null) {
            return score.getUpdatedAt();
        }
        return score.getCreatedAt();
    }

    private Double computeMedian(List<Integer> values) {
        if (values.isEmpty()) {
            return null;
        }
        List<Integer> sorted = values.stream()
                .sorted()
                .toList();
        int size = sorted.size();
        if (size % 2 == 1) {
            return sorted.get(size / 2).doubleValue();
        }
        double left = sorted.get(size / 2 - 1);
        double right = sorted.get(size / 2);
        return round((left + right) / 2.0);
    }

    private double convertScoreToGpa(double score) {
        if (score >= 90) {
            return 4.0;
        } else if (score >= 85) {
            return 3.7;
        } else if (score >= 80) {
            return 3.3;
        } else if (score >= 75) {
            return 3.0;
        } else if (score >= 70) {
            return 2.7;
        } else if (score >= 65) {
            return 2.3;
        } else if (score >= 60) {
            return 2.0;
        } else if (score >= 50) {
            return 1.0;
        }
        return 0.0;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private CourseLearningProgress computeCourseLearningProgress(UUID courseId, UUID studentId) {
        List<Assignment> assignments = assignmentRepository.findByCourseId(courseId);
        if (assignments.isEmpty()) {
            return CourseLearningProgress.builder()
                    .totalAssignments(0)
                    .completedAssignments(0)
                    .gradedAssignments(0)
                    .overdueAssignments(0)
                    .build();
        }

        int completed = 0;
        int graded = 0;
        int overdue = 0;
        Instant now = Instant.now();

        for (Assignment assignment : assignments) {
            Optional<Submission> submissionOpt = submissionRepository.findTopByAssignmentIdAndStudentIdOrderBySubmittedAtDesc(
                    assignment.getId(), studentId);
            Instant deadline = assignment.getDeadline();

            if (submissionOpt.isPresent()) {
                Submission submission = submissionOpt.get();
                completed++;
                if (submission.getStatus() == SubmissionStatus.GRADED) {
                    graded++;
                }
                if (deadline != null) {
                    Instant submittedAt = submission.getSubmittedAt();
                    if (submittedAt == null || submittedAt.isAfter(deadline)) {
                        overdue++;
                    }
                }
            } else if (deadline != null && deadline.isBefore(now)) {
                overdue++;
            }
        }

        return CourseLearningProgress.builder()
                .totalAssignments(assignments.size())
                .completedAssignments(completed)
                .gradedAssignments(graded)
                .overdueAssignments(overdue)
                .build();
    }

    private List<String> generateInsights(CourseProgressOverview progressOverview,
                                          List<Integer> allScores,
                                          List<CourseScoreSummary> courseSummaries) {
        List<String> insights = new ArrayList<>();

        if (!allScores.isEmpty()) {
            double average = allScores.stream().mapToDouble(Integer::doubleValue).average().orElse(0);
            if (average >= 90) {
                insights.add("整体表现优秀，继续保持。");
            } else if (average >= 75) {
                insights.add("整体成绩稳健，可进一步冲刺高分。");
            } else if (average < 60) {
                insights.add("整体成绩低于及格线，建议尽快制定提升计划。");
            }
        }

        if (progressOverview.getOverdueAssignments() > 0) {
            insights.add("存在未按时完成的作业，请优先补齐。");
        }

        courseSummaries.stream()
                .filter(summary -> summary.getAverage() != null && summary.getAverage() < 60)
                .map(CourseScoreSummary::getCourseName)
                .filter(Objects::nonNull)
                .findFirst()
                .ifPresent(course -> insights.add("课程《" + course + "》存在明显风险，需重点关注。"));

        return insights;
    }
}


