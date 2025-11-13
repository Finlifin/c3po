package fin.c3po.submission.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
public class UpdateQuizAttemptRequest {

    private Instant submittedAt;

    @PositiveOrZero
    private Long durationSeconds;

    @Valid
    private List<CreateQuizAttemptRequest.Answer> answers;

    private Boolean submit;
}


