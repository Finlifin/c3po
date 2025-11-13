package fin.c3po.score.dto;

import lombok.Builder;
import lombok.Value;

import java.util.Map;
import java.util.UUID;

@Value
@Builder
public class CourseScoreSummary {
    UUID courseId;
    String courseName;
    Double average;
    Integer highest;
    Integer lowest;
    int scoreCount;
    Map<String, Double> componentAverages;
    CourseLearningProgress progress;
}


