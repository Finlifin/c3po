package fin.c3po.assistant;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

/**
 * Structured learning context extracted from the database for AI assistant.
 * This class encapsulates all relevant information about the student's learning state.
 */
@Data
@Builder
public class LearningContext {
    
    // ========== Student Information ==========
    private String studentName;
    private String studentMajor;
    private String studentGrade;
    
    // ========== Course Information ==========
    private String courseName;
    private String courseSemester;
    private Integer courseCredit;
    private String teacherName;
    
    // ========== Current Module ==========
    private String currentModuleTitle;
    private Integer currentModuleOrder;
    private Integer totalModules;
    
    // ========== Current Resource ==========
    private String currentResourceName;
    private String currentResourceType;
    
    // ========== Module List ==========
    private List<ModuleInfo> modules;
    
    // ========== Learning Progress ==========
    private Integer completedModules;
    private Double progressPercentage;
    
    // ========== Assignment Information ==========
    private String currentAssignmentTitle;
    private Instant currentAssignmentDeadline;
    private String currentAssignmentRequirements;
    private List<AssignmentInfo> upcomingAssignments;
    private List<AssignmentInfo> recentSubmissions;
    
    // ========== Performance Summary ==========
    private Double averageScore;
    private Integer totalAssignments;
    private Integer completedAssignments;
    
    @Data
    @Builder
    public static class ModuleInfo {
        private String title;
        private Integer order;
        private List<String> resourceNames;
    }
    
    @Data
    @Builder
    public static class AssignmentInfo {
        private String title;
        private String type;
        private Instant deadline;
        private String status;  // PENDING, SUBMITTED, GRADED
        private Integer score;
    }
    
    /**
     * Convert the learning context to a structured text format for the AI prompt.
     */
    public String toContextPrompt() {
        StringBuilder sb = new StringBuilder();
        sb.append("## 当前学习上下文\n\n");
        
        // Student info
        if (studentName != null) {
            sb.append("### 学生信息\n");
            sb.append("- 姓名: ").append(studentName).append("\n");
            if (studentMajor != null) sb.append("- 专业: ").append(studentMajor).append("\n");
            if (studentGrade != null) sb.append("- 年级: ").append(studentGrade).append("\n");
            sb.append("\n");
        }
        
        // Course info
        if (courseName != null) {
            sb.append("### 课程信息\n");
            sb.append("- 课程名称: ").append(courseName).append("\n");
            if (courseSemester != null) sb.append("- 学期: ").append(courseSemester).append("\n");
            if (courseCredit != null) sb.append("- 学分: ").append(courseCredit).append("\n");
            if (teacherName != null) sb.append("- 授课教师: ").append(teacherName).append("\n");
            sb.append("\n");
        }
        
        // Current study location
        if (currentModuleTitle != null) {
            sb.append("### 当前学习位置\n");
            sb.append("- 正在学习: 第").append(currentModuleOrder).append("章 - ").append(currentModuleTitle).append("\n");
            if (currentResourceName != null) {
                sb.append("- 当前资源: ").append(currentResourceName);
                if (currentResourceType != null) sb.append(" (").append(currentResourceType).append(")");
                sb.append("\n");
            }
            sb.append("\n");
        }
        
        // Course structure
        if (modules != null && !modules.isEmpty()) {
            sb.append("### 课程章节结构\n");
            for (ModuleInfo module : modules) {
                sb.append("- 第").append(module.getOrder()).append("章: ").append(module.getTitle()).append("\n");
                if (module.getResourceNames() != null && !module.getResourceNames().isEmpty()) {
                    for (String resource : module.getResourceNames()) {
                        sb.append("  - ").append(resource).append("\n");
                    }
                }
            }
            sb.append("\n");
        }
        
        // Learning progress
        if (progressPercentage != null) {
            sb.append("### 学习进度\n");
            sb.append("- 已完成章节: ").append(completedModules).append("/").append(totalModules).append("\n");
            sb.append("- 总体进度: ").append(String.format("%.1f%%", progressPercentage)).append("\n");
            sb.append("\n");
        }
        
        // Current assignment
        if (currentAssignmentTitle != null) {
            sb.append("### 当前作业\n");
            sb.append("- 标题: ").append(currentAssignmentTitle).append("\n");
            if (currentAssignmentDeadline != null) {
                sb.append("- 截止时间: ").append(currentAssignmentDeadline).append("\n");
            }
            if (currentAssignmentRequirements != null) {
                sb.append("- 要求: ").append(currentAssignmentRequirements).append("\n");
            }
            sb.append("\n");
        }
        
        // Upcoming assignments
        if (upcomingAssignments != null && !upcomingAssignments.isEmpty()) {
            sb.append("### 待完成作业\n");
            for (AssignmentInfo assignment : upcomingAssignments) {
                sb.append("- ").append(assignment.getTitle());
                if (assignment.getDeadline() != null) {
                    sb.append(" (截止: ").append(assignment.getDeadline()).append(")");
                }
                sb.append("\n");
            }
            sb.append("\n");
        }
        
        // Performance summary
        if (averageScore != null) {
            sb.append("### 成绩概览\n");
            sb.append("- 平均分: ").append(String.format("%.1f", averageScore)).append("\n");
            sb.append("- 已完成作业: ").append(completedAssignments).append("/").append(totalAssignments).append("\n");
            sb.append("\n");
        }
        
        return sb.toString();
    }
}
