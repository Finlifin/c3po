package fin.c3po.todo.web;

import fin.c3po.assignment.Assignment;
import fin.c3po.assignment.AssignmentRepository;
import fin.c3po.common.web.ApiResponse;
import fin.c3po.course.Course;
import fin.c3po.course.CourseRepository;
import fin.c3po.selection.CourseSelection;
import fin.c3po.selection.CourseSelectionRepository;
import fin.c3po.selection.SelectionStatus;
import fin.c3po.submission.Submission;
import fin.c3po.submission.SubmissionRepository;
import fin.c3po.submission.SubmissionStatus;
import fin.c3po.todo.dto.TodoResponse;
import fin.c3po.user.UserAccount;
import fin.c3po.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@Validated
@RequiredArgsConstructor
public class TodoController {

    private final CourseSelectionRepository courseSelectionRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final CourseRepository courseRepository;
    private final fin.c3po.approval.ApprovalRequestRepository approvalRequestRepository;

    @GetMapping("/todos")
    public ApiResponse<List<TodoResponse>> todos(@AuthenticationPrincipal UserAccount currentUser) {
        List<TodoResponse> todos = new ArrayList<>();
        if (currentUser == null) {
            return ApiResponse.success(List.of());
        }

        if (currentUser.getRole() == UserRole.STUDENT) {
            todos.addAll(studentTodos(currentUser.getId()));
        } else if (currentUser.getRole() == UserRole.TEACHER) {
            todos.addAll(teacherTodos(currentUser.getId()));
        } else if (currentUser.getRole() == UserRole.ADMIN) {
            todos.addAll(adminTodos());
        }

        return ApiResponse.success(todos);
    }

    private List<TodoResponse> studentTodos(UUID studentId) {
        List<TodoResponse> todos = new ArrayList<>();
        List<CourseSelection> selections = courseSelectionRepository.findByStudentId(studentId);
        for (CourseSelection selection : selections) {
            if (selection.getStatus() != SelectionStatus.ENROLLED) {
                continue;
            }
            List<Assignment> assignments = assignmentRepository.findByCourseId(selection.getCourseId());
            for (Assignment assignment : assignments) {
                Submission submission = submissionRepository
                        .findTopByAssignmentIdAndStudentIdOrderBySubmittedAtDesc(assignment.getId(), studentId)
                        .orElse(null);
                boolean needsAction = submission == null || submission.getStatus() != SubmissionStatus.GRADED;
                if (needsAction) {
                    todos.add(TodoResponse.builder()
                            .id(UUID.randomUUID())
                            .type("assignment")
                            .title("提交作业：" + assignment.getTitle())
                            .description("课程 ID: " + assignment.getCourseId())
                            .dueAt(assignment.getDeadline())
                            .status(submission == null ? "pending" : "submitted")
                            .build());
                }
            }
        }
        return todos;
    }

    private List<TodoResponse> teacherTodos(UUID teacherId) {
        List<TodoResponse> todos = new ArrayList<>();
        List<Course> courses = courseRepository.findByTeacherId(teacherId);
        for (Course course : courses) {
            List<Assignment> assignments = assignmentRepository.findByCourseId(course.getId());
            for (Assignment assignment : assignments) {
                long pendingSubmissions = submissionRepository.findByAssignmentId(assignment.getId()).stream()
                        .filter(submission -> submission.getStatus() == SubmissionStatus.SUBMITTED
                                || submission.getStatus() == SubmissionStatus.RESUBMITTED)
                        .count();
                if (pendingSubmissions > 0) {
                    todos.add(TodoResponse.builder()
                            .id(UUID.randomUUID())
                            .type("grading")
                            .title("批改作业：" + assignment.getTitle())
                            .description("待批改提交数：" + pendingSubmissions)
                            .dueAt(assignment.getDeadline())
                            .status("pending")
                            .build());
                }
            }
        }
        return todos;
    }

    private List<TodoResponse> adminTodos() {
        long pendingApprovals = approvalRequestRepository.countByStatus(fin.c3po.approval.ApprovalStatus.PENDING);
        if (pendingApprovals == 0) {
            return List.of();
        }
        return List.of(TodoResponse.builder()
                .id(UUID.randomUUID())
                .type("approval")
                .title("审批事项待处理")
                .description("待审批数量：" + pendingApprovals)
                .dueAt(Instant.now())
                .status("pending")
                .build());
    }
}


