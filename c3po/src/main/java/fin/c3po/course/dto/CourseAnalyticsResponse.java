package fin.c3po.course.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class CourseAnalyticsResponse {
    double completionRate;
    Double averageScore;
    Double medianScore;
    int enrolledStudents;
    int totalAssignments;
    int gradedSubmissions;
    int pendingSubmissions;
    List<String> overdueStudents;
    List<String> difficultAssignments;
    List<String> atRiskStudents;
    List<String> insights;
}


