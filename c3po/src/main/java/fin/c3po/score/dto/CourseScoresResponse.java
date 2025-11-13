package fin.c3po.score.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Value
@Builder
public class CourseScoresResponse {
    UUID courseId;
    List<ScoreResponse> items;
    CourseScoreOverview overview;
    List<ScoreDistributionBucket> distribution;
    Map<String, Double> componentAverages;
    List<String> topPerformers;
    List<String> needsAttention;
}


