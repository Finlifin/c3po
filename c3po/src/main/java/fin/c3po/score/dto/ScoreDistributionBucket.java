package fin.c3po.score.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ScoreDistributionBucket {
    String label;
    int from;
    int to;
    long count;
}


