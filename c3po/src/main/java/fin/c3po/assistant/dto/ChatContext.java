package fin.c3po.assistant.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/**
 * Context information for AI assistant to understand the current learning scenario.
 * This helps the AI provide more relevant and personalized responses.
 */
@Data
@Builder
public class ChatContext {
    
    /**
     * The course ID the student is currently viewing/studying.
     */
    private UUID courseId;
    
    /**
     * The specific module/chapter ID within the course.
     */
    private UUID moduleId;
    
    /**
     * The resource ID if the student is viewing a specific resource.
     */
    private UUID resourceId;
    
    /**
     * The assignment ID if the student needs help with a specific assignment.
     */
    private UUID assignmentId;
    
    /**
     * The student ID for personalized learning path recommendations.
     */
    private UUID studentId;
    
    /**
     * Optional video timestamp (in seconds) for time-specific questions.
     */
    private Integer videoTimestamp;
    
    /**
     * The current page number if viewing a PDF.
     */
    private Integer pageNumber;
}
