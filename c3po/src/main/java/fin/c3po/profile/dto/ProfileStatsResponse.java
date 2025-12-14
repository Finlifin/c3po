package fin.c3po.profile.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ProfileStatsResponse {
    // Student stats
    Integer enrolledCoursesCount;
    Integer completedAssignmentsCount;
    Integer pendingAssignmentsCount;
    Double averageScore;
    Double gpa;

    // Teacher stats
    Integer teachingCoursesCount;
    Integer pendingGradingCount;
    Integer totalStudentsCount;
}
