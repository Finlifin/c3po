package fin.c3po.assistant;

import fin.c3po.assistant.dto.ChatMessage.MessageRole;
import fin.c3po.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Entity to store individual messages in an AI conversation.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "ai_messages")
public class AiMessage extends BaseEntity {
    
    /**
     * The conversation this message belongs to.
     */
    @Column(nullable = false)
    private UUID conversationId;
    
    /**
     * Role of the message sender (SYSTEM, ASSISTANT, USER).
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private MessageRole role;
    
    /**
     * The message content.
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    
    /**
     * Order of this message in the conversation.
     */
    @Column(nullable = false)
    private Integer messageOrder;
    
    /**
     * Tokens used for this message (for tracking).
     */
    private Integer tokens;
}
