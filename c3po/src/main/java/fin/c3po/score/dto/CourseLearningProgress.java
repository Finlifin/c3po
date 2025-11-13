package fin.c3po.score.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class CourseLearningProgress {
    int totalAssignments;
    int completedAssignments;
    int gradedAssignments;
    int overdueAssignments;
}


