package fin.c3po.submission.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class CreateQuizAttemptRequest {

    @NotNull
    private Instant startedAt;

    private Instant submittedAt;

    @PositiveOrZero
    private Long durationSeconds;

    @Valid
    @Size(max = 200)
    private List<Answer> answers = new ArrayList<>();

    @Getter
    @Setter
    public static class Answer {
        @NotBlank
        @Size(max = 64)
        private String questionId;

        @NotBlank
        @Size(max = 4096)
        private String answer;

        @PositiveOrZero
        private Double score;
    }
}


