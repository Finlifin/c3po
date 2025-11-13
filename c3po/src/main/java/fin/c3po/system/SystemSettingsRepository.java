package fin.c3po.system;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SystemSettingsRepository extends JpaRepository<SystemSettings, UUID> {

    Optional<SystemSettings> findFirstByOrderByCreatedAtAsc();
}


