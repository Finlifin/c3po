package fin.c3po.assistant.web;

import fin.c3po.assistant.AiAssistantService;
import fin.c3po.assistant.AiConversation;
import fin.c3po.assistant.AiMessage;
import fin.c3po.assistant.dto.ChatRequest;
import fin.c3po.assistant.dto.ChatResponse;
import fin.c3po.assistant.dto.UpdateConversationRequest;
import fin.c3po.common.web.ApiResponse;
import fin.c3po.user.UserAccount;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for AI Learning Assistant.
 * 
 * Provides endpoints for:
 * - Chat with AI assistant (智能答疑, 知识点总结)
 * - Get conversation history
 * - Personalized learning recommendations (个性化学习路径推荐)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/assistant")
@Validated
@RequiredArgsConstructor
public class AiAssistantController {
    
    private final AiAssistantService aiAssistantService;
    
    /**
     * Chat with the AI learning assistant.
     * 
     * This endpoint provides:
     * - 智能答疑: Answer questions about course content
     * - 知识点总结: Summarize key concepts
     * - 个性化学习路径推荐: Recommend next learning steps
     * - 智能笔记整理与复习提醒: Help organize notes and remind about reviews
     * 
     * @param request Chat request containing context and messages
     * @param user Currently authenticated user
     * @return AI-generated response with references and suggestions
     */
    @PostMapping("/chat")
    public ApiResponse<ChatResponse> chat(
            @Valid @RequestBody ChatRequest request,
            @AuthenticationPrincipal UserAccount user) {
        
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        
        log.info("AI chat request from user: {} with {} messages", 
                user.getUsername(), request.getMessages().size());
        
        ChatResponse response = aiAssistantService.chat(request, user);
        
        return ApiResponse.success(response);
    }
    
    /**
     * Get conversation history for the current user.
     * 
     * @param user Currently authenticated user
     * @return List of past conversations
     */
    @GetMapping("/conversations")
    public ApiResponse<List<AiConversation>> getConversations(
            @AuthenticationPrincipal UserAccount user) {
        
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        
        List<AiConversation> conversations = aiAssistantService.getConversationHistory(user.getId());
        return ApiResponse.success(conversations);
    }
    
    /**
     * Get messages for a specific conversation.
     * 
     * @param conversationId The conversation ID
     * @param user Currently authenticated user
     * @return List of messages in the conversation
     */
    @GetMapping("/conversations/{conversationId}/messages")
    public ApiResponse<List<AiMessage>> getConversationMessages(
            @PathVariable UUID conversationId,
            @AuthenticationPrincipal UserAccount user) {
        
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        
        List<AiMessage> messages = aiAssistantService.getConversationMessages(conversationId);
        return ApiResponse.success(messages);
    }
    
    /**
     * Knowledge point summary endpoint (convenience wrapper).
     * 
     * Generates a summary of key knowledge points for a given module or resource.
     * 
     * @param courseId Course ID
     * @param moduleId Optional module ID for focused summary
     * @param user Currently authenticated user
     * @return AI-generated knowledge point summary
     */
    @GetMapping("/summary")
    public ApiResponse<ChatResponse> getKnowledgeSummary(
            @RequestParam UUID courseId,
            @RequestParam(required = false) UUID moduleId,
            @AuthenticationPrincipal UserAccount user) {
        
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        
        // Build a summary request
        ChatRequest request = ChatRequest.builder()
                .context(fin.c3po.assistant.dto.ChatContext.builder()
                        .courseId(courseId)
                        .moduleId(moduleId)
                        .studentId(user.getId())
                        .build())
                .messages(List.of(
                        fin.c3po.assistant.dto.ChatMessage.builder()
                                .role(fin.c3po.assistant.dto.ChatMessage.MessageRole.USER)
                                .content(moduleId != null 
                                        ? "请帮我总结当前章节的核心知识点" 
                                        : "请帮我总结这门课程的核心知识点")
                                .build()
                ))
                .build();
        
        ChatResponse response = aiAssistantService.chat(request, user);
        return ApiResponse.success(response);
    }
    
    /**
     * Learning path recommendation endpoint.
     * 
     * Provides personalized learning path recommendations based on:
     * - Current progress
     * - Performance history
     * - Upcoming deadlines
     * 
     * @param courseId Course ID
     * @param user Currently authenticated user
     * @return AI-generated learning path recommendations
     */
    @GetMapping("/learning-path")
    public ApiResponse<ChatResponse> getLearningPathRecommendation(
            @RequestParam UUID courseId,
            @AuthenticationPrincipal UserAccount user) {
        
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        
        // Build a learning path request
        ChatRequest request = ChatRequest.builder()
                .context(fin.c3po.assistant.dto.ChatContext.builder()
                        .courseId(courseId)
                        .studentId(user.getId())
                        .build())
                .messages(List.of(
                        fin.c3po.assistant.dto.ChatMessage.builder()
                                .role(fin.c3po.assistant.dto.ChatMessage.MessageRole.USER)
                                .content("根据我当前的学习进度和成绩表现，请为我推荐接下来的学习路径，并给出学习建议。")
                                .build()
                ))
                .build();
        
        ChatResponse response = aiAssistantService.chat(request, user);
        return ApiResponse.success(response);
    }
    
    /**
     * Review reminder endpoint.
     * 
     * Generates review reminders based on:
     * - Upcoming assignment deadlines
     * - Low-scoring areas that need review
     * - Spaced repetition recommendations
     * 
     * @param courseId Optional course ID for course-specific reminders
     * @param user Currently authenticated user
     * @return AI-generated review reminders and study plan
     */
    @GetMapping("/review-reminder")
    public ApiResponse<ChatResponse> getReviewReminder(
            @RequestParam(required = false) UUID courseId,
            @AuthenticationPrincipal UserAccount user) {
        
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        
        // Build a review reminder request
        ChatRequest request = ChatRequest.builder()
                .context(fin.c3po.assistant.dto.ChatContext.builder()
                        .courseId(courseId)
                        .studentId(user.getId())
                        .build())
                .messages(List.of(
                        fin.c3po.assistant.dto.ChatMessage.builder()
                                .role(fin.c3po.assistant.dto.ChatMessage.MessageRole.USER)
                                .content("请帮我检查即将到期的作业和需要复习的内容，并制定一个复习计划。")
                                .build()
                ))
                .build();
        
        ChatResponse response = aiAssistantService.chat(request, user);
        return ApiResponse.success(response);
    }
    
    // ==================== Conversation Management ====================
    
    /**
     * Get a specific conversation by ID.
     * 
     * @param conversationId The conversation ID
     * @param user Currently authenticated user
     * @return The conversation details
     */
    @GetMapping("/conversations/{conversationId}")
    public ApiResponse<AiConversation> getConversation(
            @PathVariable UUID conversationId,
            @AuthenticationPrincipal UserAccount user) {
        
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        
        return aiAssistantService.getConversation(conversationId)
                .filter(c -> c.getUserId().equals(user.getId()))
                .map(ApiResponse::success)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
    }
    
    /**
     * Update a conversation's title.
     * 
     * @param conversationId The conversation ID
     * @param request The update request containing new title
     * @param user Currently authenticated user
     * @return The updated conversation
     */
    @PatchMapping("/conversations/{conversationId}")
    public ApiResponse<AiConversation> updateConversation(
            @PathVariable UUID conversationId,
            @Valid @RequestBody UpdateConversationRequest request,
            @AuthenticationPrincipal UserAccount user) {
        
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        
        return aiAssistantService.updateConversationTitle(conversationId, user.getId(), request.getTitle())
                .map(ApiResponse::success)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found or access denied"));
    }
    
    /**
     * Delete a specific conversation and all its messages.
     * 
     * @param conversationId The conversation ID
     * @param user Currently authenticated user
     * @return Success message
     */
    @DeleteMapping("/conversations/{conversationId}")
    public ApiResponse<Map<String, Object>> deleteConversation(
            @PathVariable UUID conversationId,
            @AuthenticationPrincipal UserAccount user) {
        
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        
        boolean deleted = aiAssistantService.deleteConversation(conversationId, user.getId());
        
        if (!deleted) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found or access denied");
        }
        
        return ApiResponse.success(Map.of(
                "deleted", true,
                "conversationId", conversationId.toString()
        ));
    }
    
    /**
     * Clear all conversations for the current user.
     * 
     * @param user Currently authenticated user
     * @return Number of deleted conversations
     */
    @DeleteMapping("/conversations")
    public ApiResponse<Map<String, Object>> clearAllConversations(
            @AuthenticationPrincipal UserAccount user) {
        
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        
        int count = aiAssistantService.clearAllConversations(user.getId());
        
        return ApiResponse.success(Map.of(
                "deleted", true,
                "count", count
        ));
    }
}
