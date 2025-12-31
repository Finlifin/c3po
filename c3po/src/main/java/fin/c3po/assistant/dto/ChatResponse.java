package fin.c3po.assistant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response from the AI assistant chat endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    
    /**
     * Unique conversation ID for maintaining context across sessions.
     */
    private String conversationId;
    
    /**
     * The AI-generated answer to the user's question.
     */
    private String answer;
    
    /**
     * References to relevant course materials.
     */
    private List<Reference> references;
    
    /**
     * Suggested next actions for the student.
     */
    private List<Suggestion> suggestions;
    
    /**
     * Token usage information for tracking.
     */
    private TokenUsage usage;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Reference {
        private String type;     // module, resource, assignment
        private String id;
        private String title;
        private String snippet;  // Relevant excerpt
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Suggestion {
        private String action;   // open_resource, practice_quiz, review_module, etc.
        private String target;   // Resource/Module/Assignment ID
        private String title;    // Human-readable description
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TokenUsage {
        private Integer promptTokens;
        private Integer completionTokens;
        private Integer totalTokens;
    }
}
