package fin.c3po.score.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;
import java.util.UUID;

@Value
@Builder
public class StudentScoresResponse {
    UUID studentId;
    List<ScoreResponse> items;
    StudentScoreSummary summary;
    List<ScoreTrendPoint> trend;
    ScoreExportInfo exportInfo;
}


