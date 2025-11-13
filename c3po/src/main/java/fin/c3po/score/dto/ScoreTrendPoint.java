package fin.c3po.score.dto;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class ScoreTrendPoint {
    String courseName;
    String component;
    Double value;
    Instant timestamp;
}


