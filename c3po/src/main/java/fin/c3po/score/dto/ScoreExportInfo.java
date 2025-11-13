package fin.c3po.score.dto;

import lombok.Builder;
import lombok.Value;

import java.util.Map;

@Value
@Builder
public class ScoreExportInfo {
    boolean available;
    String suggestedJobType;
    Map<String, Object> suggestedParams;
    String instructions;
}


