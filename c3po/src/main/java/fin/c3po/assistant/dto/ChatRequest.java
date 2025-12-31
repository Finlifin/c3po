package fin.c3po.assistant.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request body for the AI assistant chat endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {
    
    /**
     * Optional context information to help the AI understand the learning scenario.
     */
    @Valid
    private ChatContext context;
    
    /**
     * Conversation messages history (required, at least one message).
     */
    @NotEmpty(message = "Messages cannot be empty")
    @Valid
    private List<ChatMessage> messages;
    
    /**
     * Optional preferences for response customization.
     */
    private ChatPreferences preferences;
    
    /**
     * Whether to use streaming response (SSE).
     */
    private Boolean stream;
}
