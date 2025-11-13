package fin.c3po.submission.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GradeQuizAttemptRequest {

    @NotNull
    @Min(0)
    @Max(100)
    private Integer score;

    @Size(max = 2048)
    private String feedback;
}


