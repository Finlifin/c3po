package fin.c3po.assignment;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {
    @EntityGraph(attributePaths = { "visibilityTags" })
    List<Assignment> findByCourseId(UUID courseId);

    @EntityGraph(attributePaths = { "visibilityTags" })
    Optional<Assignment> findWithTagsById(UUID id);

    long countByCourseId(UUID courseId);
}
