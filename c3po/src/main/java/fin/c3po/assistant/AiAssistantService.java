package fin.c3po.assistant;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import fin.c3po.assistant.config.DeepSeekConfig;
import fin.c3po.assistant.dto.*;
import fin.c3po.assignment.Assignment;
import fin.c3po.assignment.AssignmentRepository;
import fin.c3po.course.*;
import fin.c3po.profile.StudentProfile;
import fin.c3po.profile.StudentProfileRepository;
import fin.c3po.selection.CourseSelection;
import fin.c3po.selection.CourseSelectionRepository;
import fin.c3po.selection.SelectionStatus;
import fin.c3po.submission.Submission;
import fin.c3po.submission.SubmissionRepository;
import fin.c3po.submission.SubmissionStatus;
import fin.c3po.user.UserAccount;
import fin.c3po.user.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AI Assistant Service that provides intelligent learning support.
 * 
 * Key Features:
 * - 智能答疑 (Smart Q&A): Answer questions about course content
 * - 知识点总结 (Knowledge Summary): Summarize key concepts
 * - 个性化学习路径推荐 (Personalized Learning Path): Recommend next steps
 * - 智能笔记整理与复习提醒 (Smart Notes & Review): Help organize notes
 * 
 * Context Extraction Strategy:
 * 1. Student context: Profile, enrollment, progress
 * 2. Course context: Structure, modules, resources
 * 3. Assignment context: Current assignments, deadlines, submissions
 * 4. Performance context: Scores, completion rate
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiAssistantService {
    
    private final DeepSeekConfig deepSeekConfig;
    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final CourseRepository courseRepository;
    private final CourseModuleRepository moduleRepository;
    private final CourseResourceRepository resourceRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final CourseSelectionRepository selectionRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final UserAccountRepository userAccountRepository;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    private static final String SYSTEM_PROMPT = """
        你是智慧学习平台的AI学习助手，名叫"小智"。你的职责是帮助学生更好地学习课程内容。
        
        ## 你的核心能力
        
        1. **智能答疑**：回答学生关于课程内容的问题，提供清晰、准确、易懂的解释
        2. **知识点总结**：帮助学生总结和梳理学习内容的重点知识点
        3. **学习路径推荐**：根据学生的学习进度和表现，推荐合适的下一步学习内容
        4. **复习提醒**：提醒学生重要的作业截止日期，建议复习计划
        
        ## 回复规范
        
        - 使用简洁友好的中文回答
        - 对于专业概念，先给出简单解释，再深入说明
        - 适当使用示例来帮助理解
        - 如果问题超出课程范围，诚实说明并建议相关学习资源
        - 鼓励学生思考，而不是直接给出作业答案
        - 对于作业问题，提供思路和方法引导，不直接给完整答案
        
        ## 上下文使用
        
        系统会提供学生当前的学习上下文信息，请结合这些信息给出个性化的回答：
        - 学生正在学习的课程和章节
        - 学生的学习进度和成绩情况
        - 即将截止的作业
        """;
    
    /**
     * Process a chat request and generate an AI response.
     */
    @Transactional
    public ChatResponse chat(ChatRequest request, UserAccount user) {
        log.info("Processing chat request for user: {}", user.getUsername());
        
        // 1. Extract learning context
        LearningContext context = extractContext(request.getContext(), user);
        
        // 2. Build messages for DeepSeek API
        List<Map<String, String>> apiMessages = buildApiMessages(request, context);
        
        // 3. Call DeepSeek API
        ChatResponse.TokenUsage usage = new ChatResponse.TokenUsage();
        String answer = callDeepSeekApi(apiMessages, usage);
        
        // 4. Generate references and suggestions
        List<ChatResponse.Reference> references = generateReferences(request.getContext(), context);
        List<ChatResponse.Suggestion> suggestions = generateSuggestions(request.getContext(), context);
        
        // 5. Save conversation history
        String conversationId = saveConversation(request, answer, user, context, usage);
        
        return ChatResponse.builder()
                .conversationId(conversationId)
                .answer(answer)
                .references(references)
                .suggestions(suggestions)
                .usage(usage)
                .build();
    }
    
    /**
     * Extract learning context from database based on the provided context hints.
     * 
     * Context Extraction Strategy:
     * - If courseId is provided: Extract course structure, modules, resources
     * - If moduleId is provided: Focus on current module content
     * - If assignmentId is provided: Include assignment details
     * - Always include: Student progress and performance summary
     */
    private LearningContext extractContext(ChatContext ctx, UserAccount user) {
        LearningContext.LearningContextBuilder builder = LearningContext.builder();
        
        // 1. Extract student information
        extractStudentInfo(builder, user);
        
        if (ctx == null) {
            return builder.build();
        }
        
        // 2. Extract course information
        if (ctx.getCourseId() != null) {
            extractCourseInfo(builder, ctx.getCourseId(), user);
        }
        
        // 3. Extract current module information
        if (ctx.getModuleId() != null) {
            extractModuleInfo(builder, ctx.getModuleId());
        }
        
        // 4. Extract current resource information
        if (ctx.getResourceId() != null) {
            extractResourceInfo(builder, ctx.getResourceId());
        }
        
        // 5. Extract assignment information
        if (ctx.getAssignmentId() != null) {
            extractAssignmentInfo(builder, ctx.getAssignmentId());
        }
        
        // 6. Extract performance summary for the student
        extractPerformanceSummary(builder, user.getId(), ctx.getCourseId());
        
        return builder.build();
    }
    
    private void extractStudentInfo(LearningContext.LearningContextBuilder builder, UserAccount user) {
        builder.studentName(user.getUsername());
        
        studentProfileRepository.findByUserId(user.getId()).ifPresent(profile -> {
            builder.studentMajor(profile.getMajor());
            builder.studentGrade(profile.getGrade());
        });
    }
    
    private void extractCourseInfo(LearningContext.LearningContextBuilder builder, UUID courseId, UserAccount user) {
        courseRepository.findById(courseId).ifPresent(course -> {
            builder.courseName(course.getName());
            builder.courseSemester(course.getSemester());
            builder.courseCredit(course.getCredit());
            
            // Get teacher name
            userAccountRepository.findById(course.getTeacherId())
                    .ifPresent(teacher -> builder.teacherName(teacher.getUsername()));
            
            // Get all modules for this course
            List<CourseModule> modules = moduleRepository.findByCourseIdOrderByDisplayOrderAsc(courseId);
            builder.totalModules(modules.size());
            
            List<LearningContext.ModuleInfo> moduleInfos = new ArrayList<>();
            for (CourseModule module : modules) {
                List<CourseResource> resources = resourceRepository.findByModuleId(module.getId());
                List<String> resourceNames = resources.stream()
                        .map(CourseResource::getName)
                        .collect(Collectors.toList());
                
                moduleInfos.add(LearningContext.ModuleInfo.builder()
                        .title(module.getTitle())
                        .order(module.getDisplayOrder())
                        .resourceNames(resourceNames)
                        .build());
            }
            builder.modules(moduleInfos);
            
            // Get upcoming assignments
            List<Assignment> assignments = assignmentRepository.findByCourseId(courseId);
            Instant now = Instant.now();
            
            List<LearningContext.AssignmentInfo> upcomingAssignments = assignments.stream()
                    .filter(a -> a.getDeadline() != null && a.getDeadline().isAfter(now))
                    .filter(a -> Boolean.TRUE.equals(a.getPublished()))
                    .sorted(Comparator.comparing(Assignment::getDeadline))
                    .limit(5)
                    .map(a -> {
                        // Check submission status
                        String status = "PENDING";
                        Optional<Submission> submission = submissionRepository
                                .findByAssignmentIdAndStudentId(a.getId(), user.getId());
                        if (submission.isPresent()) {
                            status = submission.get().getStatus().name();
                        }
                        
                        return LearningContext.AssignmentInfo.builder()
                                .title(a.getTitle())
                                .type(a.getType().name())
                                .deadline(a.getDeadline())
                                .status(status)
                                .build();
                    })
                    .collect(Collectors.toList());
            builder.upcomingAssignments(upcomingAssignments);
        });
    }
    
    private void extractModuleInfo(LearningContext.LearningContextBuilder builder, UUID moduleId) {
        moduleRepository.findById(moduleId).ifPresent(module -> {
            builder.currentModuleTitle(module.getTitle());
            builder.currentModuleOrder(module.getDisplayOrder());
        });
    }
    
    private void extractResourceInfo(LearningContext.LearningContextBuilder builder, UUID resourceId) {
        resourceRepository.findById(resourceId).ifPresent(resource -> {
            builder.currentResourceName(resource.getName());
            builder.currentResourceType(resource.getType().name());
        });
    }
    
    private void extractAssignmentInfo(LearningContext.LearningContextBuilder builder, UUID assignmentId) {
        assignmentRepository.findById(assignmentId).ifPresent(assignment -> {
            builder.currentAssignmentTitle(assignment.getTitle());
            builder.currentAssignmentDeadline(assignment.getDeadline());
            builder.currentAssignmentRequirements(assignment.getGradingRubric());
        });
    }
    
    private void extractPerformanceSummary(LearningContext.LearningContextBuilder builder, UUID studentId, UUID courseId) {
        // Get all submissions for the student
        List<Submission> submissions = submissionRepository.findByStudentId(studentId);
        
        if (courseId != null) {
            // Filter to course-specific submissions
            Set<UUID> courseAssignmentIds = assignmentRepository.findByCourseId(courseId).stream()
                    .map(Assignment::getId)
                    .collect(Collectors.toSet());
            submissions = submissions.stream()
                    .filter(s -> courseAssignmentIds.contains(s.getAssignmentId()))
                    .collect(Collectors.toList());
        }
        
        if (!submissions.isEmpty()) {
            List<Submission> gradedSubmissions = submissions.stream()
                    .filter(s -> s.getStatus() == SubmissionStatus.GRADED && s.getScore() != null)
                    .collect(Collectors.toList());
            
            if (!gradedSubmissions.isEmpty()) {
                double avgScore = gradedSubmissions.stream()
                        .mapToInt(Submission::getScore)
                        .average()
                        .orElse(0);
                builder.averageScore(avgScore);
            }
            
            builder.completedAssignments(submissions.size());
        }
        
        // Count total assignments
        if (courseId != null) {
            int totalAssignments = assignmentRepository.findByCourseId(courseId).size();
            builder.totalAssignments(totalAssignments);
        }
    }
    
    /**
     * Build API messages including system prompt and context.
     */
    private List<Map<String, String>> buildApiMessages(ChatRequest request, LearningContext context) {
        List<Map<String, String>> messages = new ArrayList<>();
        
        // Add system message with context
        String systemMessage = SYSTEM_PROMPT;
        if (context != null) {
            String contextPrompt = context.toContextPrompt();
            if (!contextPrompt.isEmpty()) {
                systemMessage += "\n\n" + contextPrompt;
            }
        }
        messages.add(Map.of("role", "system", "content", systemMessage));
        
        // Add user messages from request
        for (ChatMessage msg : request.getMessages()) {
            String role = switch (msg.getRole()) {
                case SYSTEM -> "system";
                case ASSISTANT -> "assistant";
                case USER -> "user";
            };
            messages.add(Map.of("role", role, "content", msg.getContent()));
        }
        
        return messages;
    }
    
    /**
     * Call DeepSeek API to generate response.
     */
    private String callDeepSeekApi(List<Map<String, String>> messages, ChatResponse.TokenUsage usage) {
        String url = deepSeekConfig.getBaseUrl() + "/chat/completions";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(deepSeekConfig.getApiKey());
        
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", deepSeekConfig.getModel());
        requestBody.put("messages", messages);
        requestBody.put("max_tokens", deepSeekConfig.getMaxTokens());
        requestBody.put("temperature", deepSeekConfig.getTemperature());
        requestBody.put("stream", false);
        
        try {
            String requestJson = objectMapper.writeValueAsString(requestBody);
            log.debug("DeepSeek API request: {}", requestJson);
            
            HttpEntity<String> entity = new HttpEntity<>(requestJson, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                
                // Extract usage info
                JsonNode usageNode = root.path("usage");
                if (!usageNode.isMissingNode()) {
                    usage.setPromptTokens(usageNode.path("prompt_tokens").asInt(0));
                    usage.setCompletionTokens(usageNode.path("completion_tokens").asInt(0));
                    usage.setTotalTokens(usageNode.path("total_tokens").asInt(0));
                }
                
                // Extract response content
                JsonNode choices = root.path("choices");
                if (choices.isArray() && !choices.isEmpty()) {
                    return choices.get(0).path("message").path("content").asText("");
                }
            }
            
            log.error("DeepSeek API returned unexpected response: {}", response.getBody());
            return "抱歉，我暂时无法回答您的问题。请稍后再试。";
            
        } catch (JsonProcessingException e) {
            log.error("Failed to parse DeepSeek API response", e);
            return "抱歉，处理响应时出现错误。请稍后再试。";
        } catch (Exception e) {
            log.error("Failed to call DeepSeek API", e);
            return "抱歉，AI服务暂时不可用。请稍后再试。";
        }
    }
    
    /**
     * Generate references to relevant course materials.
     */
    private List<ChatResponse.Reference> generateReferences(ChatContext ctx, LearningContext context) {
        List<ChatResponse.Reference> references = new ArrayList<>();
        
        if (context == null) {
            return references;
        }
        
        // Add current module as reference
        if (context.getCurrentModuleTitle() != null && ctx != null && ctx.getModuleId() != null) {
            references.add(ChatResponse.Reference.builder()
                    .type("module")
                    .id(ctx.getModuleId().toString())
                    .title("第" + context.getCurrentModuleOrder() + "章: " + context.getCurrentModuleTitle())
                    .build());
        }
        
        // Add current resource as reference
        if (context.getCurrentResourceName() != null && ctx != null && ctx.getResourceId() != null) {
            references.add(ChatResponse.Reference.builder()
                    .type("resource")
                    .id(ctx.getResourceId().toString())
                    .title(context.getCurrentResourceName())
                    .build());
        }
        
        // Add current assignment as reference
        if (context.getCurrentAssignmentTitle() != null && ctx != null && ctx.getAssignmentId() != null) {
            references.add(ChatResponse.Reference.builder()
                    .type("assignment")
                    .id(ctx.getAssignmentId().toString())
                    .title(context.getCurrentAssignmentTitle())
                    .build());
        }
        
        return references;
    }
    
    /**
     * Generate suggested next actions based on learning context.
     */
    private List<ChatResponse.Suggestion> generateSuggestions(ChatContext ctx, LearningContext context) {
        List<ChatResponse.Suggestion> suggestions = new ArrayList<>();
        
        if (context == null) {
            return suggestions;
        }
        
        // Suggest next module if not at the last one
        if (context.getCurrentModuleOrder() != null && context.getTotalModules() != null
                && context.getCurrentModuleOrder() < context.getTotalModules()
                && context.getModules() != null) {
            
            int nextOrder = context.getCurrentModuleOrder() + 1;
            context.getModules().stream()
                    .filter(m -> m.getOrder() == nextOrder)
                    .findFirst()
                    .ifPresent(nextModule -> {
                        suggestions.add(ChatResponse.Suggestion.builder()
                                .action("continue_learning")
                                .title("继续学习: " + nextModule.getTitle())
                                .build());
                    });
        }
        
        // Suggest upcoming assignments
        if (context.getUpcomingAssignments() != null && !context.getUpcomingAssignments().isEmpty()) {
            LearningContext.AssignmentInfo nextAssignment = context.getUpcomingAssignments().get(0);
            if ("PENDING".equals(nextAssignment.getStatus())) {
                suggestions.add(ChatResponse.Suggestion.builder()
                        .action("complete_assignment")
                        .title("完成作业: " + nextAssignment.getTitle())
                        .build());
            }
        }
        
        // Suggest review if performance is low
        if (context.getAverageScore() != null && context.getAverageScore() < 70) {
            suggestions.add(ChatResponse.Suggestion.builder()
                    .action("review_materials")
                    .title("建议复习: 您的平均分较低，建议回顾之前的章节内容")
                    .build());
        }
        
        return suggestions;
    }
    
    /**
     * Save conversation and messages to database.
     */
    private String saveConversation(ChatRequest request, String answer, UserAccount user, 
                                    LearningContext context, ChatResponse.TokenUsage usage) {
        // Create or find conversation
        AiConversation conversation = new AiConversation();
        conversation.setUserId(user.getId());
        if (request.getContext() != null) {
            conversation.setCourseId(request.getContext().getCourseId());
            conversation.setModuleId(request.getContext().getModuleId());
        }
        
        // Set title from first user message
        String title = request.getMessages().stream()
                .filter(m -> m.getRole() == ChatMessage.MessageRole.USER)
                .findFirst()
                .map(m -> m.getContent().length() > 50 ? m.getContent().substring(0, 50) + "..." : m.getContent())
                .orElse("新对话");
        conversation.setTitle(title);
        
        conversation = conversationRepository.save(conversation);
        
        // Save messages
        int order = 0;
        for (ChatMessage msg : request.getMessages()) {
            AiMessage aiMessage = new AiMessage();
            aiMessage.setConversationId(conversation.getId());
            aiMessage.setRole(msg.getRole());
            aiMessage.setContent(msg.getContent());
            aiMessage.setMessageOrder(order++);
            messageRepository.save(aiMessage);
        }
        
        // Save assistant response
        AiMessage responseMessage = new AiMessage();
        responseMessage.setConversationId(conversation.getId());
        responseMessage.setRole(ChatMessage.MessageRole.ASSISTANT);
        responseMessage.setContent(answer);
        responseMessage.setMessageOrder(order);
        responseMessage.setTokens(usage.getTotalTokens());
        messageRepository.save(responseMessage);
        
        // Update conversation stats
        conversation.setMessageCount(order + 1);
        conversation.setTotalTokens(usage.getTotalTokens());
        conversationRepository.save(conversation);
        
        return conversation.getId().toString();
    }
    
    /**
     * Get conversation history for a user.
     */
    public List<AiConversation> getConversationHistory(UUID userId) {
        return conversationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    /**
     * Get messages for a specific conversation.
     */
    public List<AiMessage> getConversationMessages(UUID conversationId) {
        return messageRepository.findByConversationIdOrderByMessageOrderAsc(conversationId);
    }
    
    /**
     * Get a specific conversation by ID.
     */
    public Optional<AiConversation> getConversation(UUID conversationId) {
        return conversationRepository.findById(conversationId);
    }
    
    /**
     * Delete a specific conversation and all its messages.
     */
    @Transactional
    public boolean deleteConversation(UUID conversationId, UUID userId) {
        Optional<AiConversation> conversation = conversationRepository.findById(conversationId);
        if (conversation.isEmpty()) {
            return false;
        }
        
        // Verify ownership
        if (!conversation.get().getUserId().equals(userId)) {
            return false;
        }
        
        // Delete all messages first
        List<AiMessage> messages = messageRepository.findByConversationIdOrderByMessageOrderAsc(conversationId);
        messageRepository.deleteAll(messages);
        
        // Delete the conversation
        conversationRepository.delete(conversation.get());
        
        log.info("Deleted conversation {} for user {}", conversationId, userId);
        return true;
    }
    
    /**
     * Clear all conversations for a user.
     */
    @Transactional
    public int clearAllConversations(UUID userId) {
        List<AiConversation> conversations = conversationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        int count = conversations.size();
        
        for (AiConversation conversation : conversations) {
            List<AiMessage> messages = messageRepository.findByConversationIdOrderByMessageOrderAsc(conversation.getId());
            messageRepository.deleteAll(messages);
        }
        
        conversationRepository.deleteAll(conversations);
        
        log.info("Cleared {} conversations for user {}", count, userId);
        return count;
    }
    
    /**
     * Update conversation title.
     */
    @Transactional
    public Optional<AiConversation> updateConversationTitle(UUID conversationId, UUID userId, String newTitle) {
        Optional<AiConversation> conversationOpt = conversationRepository.findById(conversationId);
        if (conversationOpt.isEmpty()) {
            return Optional.empty();
        }
        
        AiConversation conversation = conversationOpt.get();
        
        // Verify ownership
        if (!conversation.getUserId().equals(userId)) {
            return Optional.empty();
        }
        
        conversation.setTitle(newTitle);
        return Optional.of(conversationRepository.save(conversation));
    }
}
