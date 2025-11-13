package fin.c3po.score.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class StudentScoreSummary {
    Double overallAverage;
    Double median;
    Double gpa;
    CourseProgressOverview progress;
    List<CourseScoreSummary> courses;
    List<String> insights;
}


