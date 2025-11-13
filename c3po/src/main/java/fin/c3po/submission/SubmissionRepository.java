package fin.c3po.submission;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubmissionRepository extends JpaRepository<Submission, UUID> {
    List<Submission> findByAssignmentId(UUID assignmentId);
    List<Submission> findByStudentId(UUID studentId);
    Optional<Submission> findTopByAssignmentIdAndStudentIdOrderBySubmittedAtDesc(UUID assignmentId, UUID studentId);
    boolean existsByAssignmentIdAndStudentId(UUID assignmentId, UUID studentId);
}


