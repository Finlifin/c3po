package fin.c3po.profile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface TeacherProfileRepository extends JpaRepository<TeacherProfile, UUID> {
    Optional<TeacherProfile> findByUserId(UUID userId);
    List<TeacherProfile> findByUserIdIn(Collection<UUID> userIds);
    List<TeacherProfile> findByDepartmentContainingIgnoreCase(String department);
}


