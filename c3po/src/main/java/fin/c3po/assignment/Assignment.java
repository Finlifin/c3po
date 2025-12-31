package fin.c3po.assignment;

import fin.c3po.common.domain.BaseEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "assignments")
public class Assignment extends BaseEntity {

    @Column(nullable = false)
    private UUID courseId;

    @Column(nullable = false, length = 128)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AssignmentType type = AssignmentType.ASSIGNMENT;

    private Instant deadline;

    private Instant releaseAt;

    private Boolean published = Boolean.FALSE;

    private Instant publishedAt;

    private Boolean allowResubmit;

    private Integer maxResubmit;

    @Column(length = 4096)
    private String gradingRubric; // JSON string for rubric (kept simple)

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "assignment_visibility_tags", joinColumns = @JoinColumn(name = "assignment_id"))
    @Column(name = "visibility_tags")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private List<String> visibilityTags = new ArrayList<>();
}
