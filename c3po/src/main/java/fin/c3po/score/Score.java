package fin.c3po.score;

import fin.c3po.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "scores")
public class Score extends BaseEntity {

    @Column(nullable = false)
    private UUID studentId;

    @Column(nullable = false)
    private UUID courseId;

    @Column(nullable = false, length = 64)
    private String component;

    @Column(name = "\"value\"")
    private Integer value;

    private Instant releasedAt;
}


