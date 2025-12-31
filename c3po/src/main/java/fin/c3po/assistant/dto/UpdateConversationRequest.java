package fin.c3po.assistant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body for updating a conversation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateConversationRequest {
    
    /**
     * New title for the conversation.
     */
    @NotBlank(message = "Title cannot be blank")
    @Size(max = 256, message = "Title cannot exceed 256 characters")
    private String title;
}
