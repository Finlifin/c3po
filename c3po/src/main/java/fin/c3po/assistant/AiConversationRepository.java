package fin.c3po.assistant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AiConversationRepository extends JpaRepository<AiConversation, UUID> {
    
    /**
     * Find all conversations for a user, ordered by most recent first.
     */
    List<AiConversation> findByUserIdOrderByCreatedAtDesc(UUID userId);
    
    /**
     * Find conversations for a user in a specific course context.
     */
    List<AiConversation> findByUserIdAndCourseIdOrderByCreatedAtDesc(UUID userId, UUID courseId);
}
