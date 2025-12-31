package fin.c3po.assistant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A single message in the conversation history.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    
    /**
     * Role of the message sender.
     * Supported values: system, assistant, user (student/teacher)
     */
    @NotNull(message = "Role is required")
    private MessageRole role;
    
    /**
     * The content of the message.
     */
    @NotBlank(message = "Content cannot be blank")
    private String content;
    
    public enum MessageRole {
        SYSTEM,
        ASSISTANT,
        USER
    }
}
