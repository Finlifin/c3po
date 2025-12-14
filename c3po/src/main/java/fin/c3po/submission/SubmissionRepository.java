package fin.c3po.submission;


import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubmissionRepository extends JpaRepository<Submission, UUID> {
    @EntityGraph(attributePaths = {"attachments"})
    List<Submission> findByAssignmentId(UUID assignmentId);

    @EntityGraph(attributePaths = {"attachments"})
    List<Submission> findByStudentId(UUID studentId);

    @EntityGraph(attributePaths = {"attachments"})
    Optional<Submission> findTopByAssignmentIdAndStudentIdOrderBySubmittedAtDesc(UUID assignmentId, UUID studentId);

    @EntityGraph(attributePaths = {"attachments"})
    Optional<Submission> findWithAttachmentsById(UUID id);

    boolean existsByAssignmentIdAndStudentId(UUID assignmentId, UUID studentId);
}


