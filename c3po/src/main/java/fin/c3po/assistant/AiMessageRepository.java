package fin.c3po.assistant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AiMessageRepository extends JpaRepository<AiMessage, UUID> {
    
    /**
     * Find all messages in a conversation, ordered by message order.
     */
    List<AiMessage> findByConversationIdOrderByMessageOrderAsc(UUID conversationId);
    
    /**
     * Count messages in a conversation.
     */
    long countByConversationId(UUID conversationId);
}
