package fin.c3po.score.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class CourseScoreOverview {
    Double average;
    Double median;
    Integer highest;
    Integer lowest;
    int scoreCount;
    int studentCount;
    Double completionRate;
}


