package fin.c3po.submission;

import fin.c3po.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "submissions")
public class Submission extends BaseEntity {

    @Column(nullable = false)
    private UUID assignmentId;

    @Column(nullable = false)
    private UUID studentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SubmissionStatus status = SubmissionStatus.SUBMITTED;

    private Integer score;

    private Instant submittedAt;

    @ElementCollection
    private List<String> attachments = new ArrayList<>();

    @Column(length = 4096)
    private String feedback;

    @Column(length = 2048)
    private String rubricScores;

    @Column(length = 2048)
    private String appealReason;

    private Instant appealedAt;

    private UUID gradingTeacherId;

    private Integer resubmitCount = 0;
}


