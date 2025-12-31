package fin.c3po.assistant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * User preferences for AI assistant response customization.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatPreferences {
    
    /**
     * Preferred language for the response (default: zh-CN).
     */
    private String language;
    
    /**
     * Response style: concise, detailed, or educational.
     */
    private ResponseStyle style;
    
    /**
     * Maximum response length in characters.
     */
    private Integer maxLength;
    
    /**
     * Whether to include references to course materials.
     */
    private Boolean includeReferences;
    
    /**
     * Whether to include suggested next actions.
     */
    private Boolean includeSuggestions;
    
    public enum ResponseStyle {
        CONCISE,      // Brief, to-the-point answers
        DETAILED,     // Comprehensive explanations
        EDUCATIONAL   // Teaching-oriented with examples
    }
    
    public static ChatPreferences defaults() {
        return ChatPreferences.builder()
                .language("zh-CN")
                .style(ResponseStyle.EDUCATIONAL)
                .includeReferences(true)
                .includeSuggestions(true)
                .build();
    }
}
