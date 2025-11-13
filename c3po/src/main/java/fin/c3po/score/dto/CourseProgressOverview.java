package fin.c3po.score.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class CourseProgressOverview {
    int totalCourses;
    int totalAssignments;
    int completedAssignments;
    int gradedAssignments;
    int overdueAssignments;
}


