package fin.c3po.admin.web;

import fin.c3po.admin.dto.PlatformMetricsResponse;
import fin.c3po.approval.ApprovalRequestRepository;
import fin.c3po.approval.ApprovalStatus;
import fin.c3po.common.web.ApiResponse;
import fin.c3po.course.CourseRepository;
import fin.c3po.course.CourseStatus;
import fin.c3po.user.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/metrics")
@Validated
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminMetricsController {

    private final UserAccountRepository userAccountRepository;
    private final CourseRepository courseRepository;
    private final fin.c3po.assignment.AssignmentRepository assignmentRepository;
    private final ApprovalRequestRepository approvalRequestRepository;

    @GetMapping
    public ApiResponse<PlatformMetricsResponse> metrics() {
        PlatformMetricsResponse response = PlatformMetricsResponse.builder()
                .totalUsers(userAccountRepository.count())
                .totalCourses(courseRepository.count())
                .activeCourses(courseRepository.countByStatus(CourseStatus.PUBLISHED))
                .totalAssignments(assignmentRepository.count())
                .pendingApprovals(approvalRequestRepository.countByStatus(ApprovalStatus.PENDING))
                .build();
        return ApiResponse.success(response);
    }
}


