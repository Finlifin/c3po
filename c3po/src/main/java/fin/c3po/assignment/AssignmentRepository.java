package fin.c3po.assignment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {
    List<Assignment> findByCourseId(UUID courseId);

    Optional<Assignment> findWithTagsById(UUID id);

    long countByCourseId(UUID courseId);
}
