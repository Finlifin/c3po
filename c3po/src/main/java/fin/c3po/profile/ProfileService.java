package fin.c3po.profile;

import fin.c3po.assignment.Assignment;
import fin.c3po.assignment.AssignmentRepository;
import fin.c3po.course.Course;
import fin.c3po.course.CourseRepository;
import fin.c3po.profile.dto.ProfileResponse;
import fin.c3po.profile.dto.ProfileStatsResponse;
import fin.c3po.profile.dto.UpdateProfileRequest;
import fin.c3po.score.Score;
import fin.c3po.score.ScoreRepository;
import fin.c3po.selection.CourseSelection;
import fin.c3po.selection.CourseSelectionRepository;
import fin.c3po.selection.SelectionStatus;
import fin.c3po.submission.Submission;
import fin.c3po.submission.SubmissionRepository;
import fin.c3po.submission.SubmissionStatus;
import fin.c3po.user.UserAccount;
import fin.c3po.user.UserAccountRepository;
import fin.c3po.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserAccountRepository userAccountRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final TeacherProfileRepository teacherProfileRepository;
    private final CourseSelectionRepository courseSelectionRepository;
    private final SubmissionRepository submissionRepository;
    private final ScoreRepository scoreRepository;
    private final CourseRepository courseRepository;
    private final AssignmentRepository assignmentRepository;

    public ProfileResponse getProfile(UUID userId) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        ProfileResponse.StudentProfileInfo studentProfileInfo = null;
        ProfileResponse.TeacherProfileInfo teacherProfileInfo = null;

        if (user.getRole() == UserRole.STUDENT) {
            Optional<StudentProfile> studentProfile = studentProfileRepository.findByUserId(userId);
            if (studentProfile.isPresent()) {
                StudentProfile profile = studentProfile.get();
                studentProfileInfo = ProfileResponse.StudentProfileInfo.builder()
                        .studentNo(profile.getStudentNo())
                        .grade(profile.getGrade())
                        .major(profile.getMajor())
                        .className(profile.getClassName())
                        .build();
            }
        } else if (user.getRole() == UserRole.TEACHER) {
            Optional<TeacherProfile> teacherProfile = teacherProfileRepository.findByUserId(userId);
            if (teacherProfile.isPresent()) {
                TeacherProfile profile = teacherProfile.get();
                teacherProfileInfo = ProfileResponse.TeacherProfileInfo.builder()
                        .teacherNo(profile.getTeacherNo())
                        .department(profile.getDepartment())
                        .title(profile.getTitle())
                        .subjects(profile.getSubjects())
                        .build();
            }
        }

        return ProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .studentProfile(studentProfileInfo)
                .teacherProfile(teacherProfileInfo)
                .build();
    }

    public ProfileStatsResponse getProfileStats(UUID userId, UserRole role) {
        if (role == UserRole.STUDENT) {
            return getStudentStats(userId);
        } else if (role == UserRole.TEACHER) {
            return getTeacherStats(userId);
        }
        return ProfileStatsResponse.builder().build();
    }

    private ProfileStatsResponse getStudentStats(UUID studentId) {
        // 已选课程数
        List<CourseSelection> enrolledSelections = courseSelectionRepository.findByStudentId(studentId)
                .stream()
                .filter(selection -> selection.getStatus() == SelectionStatus.ENROLLED)
                .toList();
        int enrolledCoursesCount = enrolledSelections.size();

        // 获取所有已选课程的ID
        Set<UUID> enrolledCourseIds = enrolledSelections.stream()
                .map(CourseSelection::getCourseId)
                .collect(Collectors.toSet());

        // 获取所有已选课程的作业
        List<Assignment> allAssignments = enrolledCourseIds.stream()
                .flatMap(courseId -> assignmentRepository.findByCourseId(courseId).stream())
                .toList();

        // 获取学生的所有提交
        List<Submission> allSubmissions = submissionRepository.findByStudentId(studentId);

        // 已完成作业数（已提交或已批改）
        int completedAssignmentsCount = (int) allAssignments.stream()
                .filter(assignment -> allSubmissions.stream()
                        .anyMatch(submission -> submission.getAssignmentId().equals(assignment.getId())
                                && (submission.getStatus() == SubmissionStatus.SUBMITTED
                                        || submission.getStatus() == SubmissionStatus.GRADED)))
                .count();

        // 待完成作业数（未提交的作业）
        int pendingAssignmentsCount = (int) allAssignments.stream()
                .filter(assignment -> allSubmissions.stream()
                        .noneMatch(submission -> submission.getAssignmentId().equals(assignment.getId())
                                && (submission.getStatus() == SubmissionStatus.SUBMITTED
                                        || submission.getStatus() == SubmissionStatus.GRADED)))
                .count();

        // 平均成绩（从Score表或Submission表计算）
        List<Score> scores = scoreRepository.findByStudentId(studentId);
        double averageScore = 0.0;
        if (!scores.isEmpty()) {
            averageScore = scores.stream()
                    .mapToInt(Score::getValue)
                    .average()
                    .orElse(0.0);
        } else {
            // 如果没有Score记录，从已批改的Submission计算
            List<Submission> gradedSubmissions = allSubmissions.stream()
                    .filter(s -> s.getStatus() == SubmissionStatus.GRADED && s.getScore() != null)
                    .toList();
            if (!gradedSubmissions.isEmpty()) {
                averageScore = gradedSubmissions.stream()
                        .mapToInt(Submission::getScore)
                        .average()
                        .orElse(0.0);
            }
        }

        // GPA计算（简化版：90-100=4.0, 80-89=3.0, 70-79=2.0, 60-69=1.0, <60=0.0）
        double gpa = 0.0;
        if (averageScore > 0) {
            if (averageScore >= 90) {
                gpa = 4.0;
            } else if (averageScore >= 80) {
                gpa = 3.0;
            } else if (averageScore >= 70) {
                gpa = 2.0;
            } else if (averageScore >= 60) {
                gpa = 1.0;
            }
        }

        return ProfileStatsResponse.builder()
                .enrolledCoursesCount(enrolledCoursesCount)
                .completedAssignmentsCount(completedAssignmentsCount)
                .pendingAssignmentsCount(pendingAssignmentsCount)
                .averageScore(Math.round(averageScore * 100.0) / 100.0)
                .gpa(Math.round(gpa * 100.0) / 100.0)
                .build();
    }

    private ProfileStatsResponse getTeacherStats(UUID teacherId) {
        // 授课课程数
        List<Course> courses = courseRepository.findByTeacherId(teacherId);
        int teachingCoursesCount = courses.size();

        // 获取所有课程的ID
        Set<UUID> courseIds = courses.stream()
                .map(Course::getId)
                .collect(Collectors.toSet());

        // 获取所有课程的作业
        List<Assignment> allAssignments = courseIds.stream()
                .flatMap(courseId -> assignmentRepository.findByCourseId(courseId).stream())
                .toList();

        // 待批改作业数（状态为SUBMITTED的提交）
        int pendingGradingCount = 0;
        for (Assignment assignment : allAssignments) {
            List<Submission> submissions = submissionRepository.findByAssignmentId(assignment.getId());
            pendingGradingCount += (int) submissions.stream()
                    .filter(s -> s.getStatus() == SubmissionStatus.SUBMITTED)
                    .count();
        }

        // 学生总数（所有授课课程的学生总数，去重）
        Set<UUID> allStudentIds = courseIds.stream()
                .flatMap(courseId -> courseSelectionRepository.findByCourseId(courseId).stream()
                        .filter(selection -> selection.getStatus() == SelectionStatus.ENROLLED)
                        .map(CourseSelection::getStudentId))
                .collect(Collectors.toSet());
        int totalStudentsCount = allStudentIds.size();

        return ProfileStatsResponse.builder()
                .teachingCoursesCount(teachingCoursesCount)
                .pendingGradingCount(pendingGradingCount)
                .totalStudentsCount(totalStudentsCount)
                .build();
    }

    @Transactional
    public ProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // 更新基础信息
        if (request.getUsername() != null && !request.getUsername().equals(user.getUsername())) {
            if (userAccountRepository.existsByUsernameIgnoreCase(request.getUsername())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
            }
            user.setUsername(request.getUsername());
        }

        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userAccountRepository.existsByEmailIgnoreCase(request.getEmail())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
            }
            user.setEmail(request.getEmail());
        }

        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        userAccountRepository.save(user);

        // 更新Profile信息
        if (user.getRole() == UserRole.STUDENT) {
            StudentProfile profile = studentProfileRepository.findByUserId(userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student profile not found"));

            if (request.getGrade() != null) {
                profile.setGrade(request.getGrade());
            }
            if (request.getMajor() != null) {
                profile.setMajor(request.getMajor());
            }
            if (request.getClassName() != null) {
                profile.setClassName(request.getClassName());
            }

            studentProfileRepository.save(profile);
        } else if (user.getRole() == UserRole.TEACHER) {
            TeacherProfile profile = teacherProfileRepository.findByUserId(userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Teacher profile not found"));

            if (request.getDepartment() != null) {
                profile.setDepartment(request.getDepartment());
            }
            if (request.getTitle() != null) {
                profile.setTitle(request.getTitle());
            }
            if (request.getSubjects() != null) {
                profile.setSubjects(request.getSubjects());
            }

            teacherProfileRepository.save(profile);
        }

        return getProfile(userId);
    }

    @Transactional
    public ProfileResponse updateAvatar(UUID userId, String avatarUrl) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setAvatarUrl(avatarUrl);
        userAccountRepository.save(user);

        return getProfile(userId);
    }
}
