package fin.c3po.submission;

import fin.c3po.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "quiz_attempts")
public class QuizAttempt extends BaseEntity {

    @Column(nullable = false)
    private UUID assignmentId;

    @Column(nullable = false)
    private UUID studentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private QuizAttemptStatus status = QuizAttemptStatus.IN_PROGRESS;

    private Integer score;

    private Long durationSeconds;

    private Instant startedAt;

    private Instant submittedAt;

    @Column(length = 8192)
    private String answers;

    @Column(length = 2048)
    private String feedback;
}


