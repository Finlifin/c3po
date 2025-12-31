package fin.c3po.assistant;

import fin.c3po.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Entity to store AI conversation sessions for context persistence.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "ai_conversations")
public class AiConversation extends BaseEntity {
    
    /**
     * The user who initiated this conversation.
     */
    @Column(nullable = false)
    private UUID userId;
    
    /**
     * Optional course context for this conversation.
     */
    private UUID courseId;
    
    /**
     * Optional module context for this conversation.
     */
    private UUID moduleId;
    
    /**
     * Conversation title (auto-generated from first message).
     */
    @Column(length = 256)
    private String title;
    
    /**
     * Number of messages in this conversation.
     */
    private Integer messageCount = 0;
    
    /**
     * Total tokens used in this conversation.
     */
    private Integer totalTokens = 0;
}
