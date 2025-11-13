package fin.c3po.common.web;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Map;

/**
 * 统一的错误响应结构
 * 符合 API 文档 2.5 节定义的失败响应格式
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    
    /**
     * 时间戳（ISO8601 格式）
     */
    private Instant timestamp;
    
    /**
     * HTTP 状态码
     */
    private int status;
    
    /**
     * 错误类型（如 "Unauthorized", "Bad Request" 等）
     */
    private String error;
    
    /**
     * 错误消息（用户友好的描述）
     */
    private String message;
    
    /**
     * 字段级错误信息（可选）
     * 键为字段名，值为错误消息
     * 主要用于表单验证错误
     */
    private Map<String, String> errors;
    
    /**
     * 请求路径（可选，用于调试）
     */
    private String path;
    
    /**
     * 追踪 ID（可选，用于日志关联）
     */
    private String traceId;
}

