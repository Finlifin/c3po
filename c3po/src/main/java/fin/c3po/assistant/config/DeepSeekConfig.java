package fin.c3po.assistant.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for DeepSeek AI API.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "ai.deepseek")
public class DeepSeekConfig {
    
    /**
     * DeepSeek API key.
     */
    private String apiKey;
    
    /**
     * DeepSeek API base URL.
     */
    private String baseUrl = "https://api.deepseek.com";
    
    /**
     * Model to use (deepseek-chat for non-thinking, deepseek-reasoner for thinking mode).
     */
    private String model = "deepseek-chat";
    
    /**
     * Maximum tokens in response.
     */
    private Integer maxTokens = 2048;
    
    /**
     * Temperature for response generation (0.0 - 2.0).
     */
    private Double temperature = 0.7;
    
    /**
     * Request timeout in seconds.
     */
    private Integer timeoutSeconds = 60;
}
