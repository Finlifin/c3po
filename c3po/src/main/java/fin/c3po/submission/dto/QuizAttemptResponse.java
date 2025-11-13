package fin.c3po.submission.dto;

import fin.c3po.submission.QuizAttemptStatus;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Value
@Builder
public class QuizAttemptResponse {
    UUID id;
    UUID assignmentId;
    UUID studentId;
    QuizAttemptStatus status;
    Integer score;
    Long durationSeconds;
    Instant startedAt;
    Instant submittedAt;
    List<CreateQuizAttemptRequest.Answer> answers;
    String feedback;
    Instant createdAt;
    Instant updatedAt;
}


