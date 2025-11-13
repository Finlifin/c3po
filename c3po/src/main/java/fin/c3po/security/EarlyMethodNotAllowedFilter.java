package fin.c3po.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * 早期过滤器，在Security过滤器链之前处理HTTP方法不匹配问题，
 * 防止405错误导致的重定向循环
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class EarlyMethodNotAllowedFilter implements Filter {

    // API端点和允许的HTTP方法映射
    private static final Map<String, Set<HttpMethod>> ENDPOINT_METHODS = new HashMap<>();
    
    static {
        // 认证端点
        ENDPOINT_METHODS.put("/api/v1/auth/login", Set.of(HttpMethod.POST));
        ENDPOINT_METHODS.put("/api/v1/auth/register", Set.of(HttpMethod.POST));
        ENDPOINT_METHODS.put("/api/v1/auth/me", Set.of(HttpMethod.GET));
        
        // 其他GET端点示例
        ENDPOINT_METHODS.put("/api/v1/dashboard/overview", Set.of(HttpMethod.GET));
        ENDPOINT_METHODS.put("/api/v1/courses", Set.of(HttpMethod.GET, HttpMethod.POST));
        ENDPOINT_METHODS.put("/api/v1/members", Set.of(HttpMethod.GET, HttpMethod.POST));
        ENDPOINT_METHODS.put("/api/v1/activities", Set.of(HttpMethod.GET, HttpMethod.POST));
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        if (!(request instanceof HttpServletRequest httpRequest) || 
            !(response instanceof HttpServletResponse httpResponse)) {
            chain.doFilter(request, response);
            return;
        }

        String requestUri = httpRequest.getRequestURI();
        String method = httpRequest.getMethod();
        
        // 检查是否是已知端点且方法不匹配
        if (isMethodNotAllowed(requestUri, method)) {
            log.warn("Method {} not allowed for URI: {}", method, requestUri);
            sendMethodNotAllowedResponse(httpResponse, requestUri, method);
            return;
        }
        
        chain.doFilter(request, response);
    }

    private boolean isMethodNotAllowed(String uri, String method) {
        // 精确匹配
        if (ENDPOINT_METHODS.containsKey(uri)) {
            try {
                HttpMethod httpMethod = HttpMethod.valueOf(method);
                return !ENDPOINT_METHODS.get(uri).contains(httpMethod);
            } catch (IllegalArgumentException e) {
                return true; // 未知的HTTP方法
            }
        }
        
        // 通用规则：OPTIONS通常应该被允许（CORS预检）
        if ("OPTIONS".equals(method)) {
            return false;
        }
        
        return false;
    }

    private void sendMethodNotAllowedResponse(HttpServletResponse response, String uri, String method) 
            throws IOException {
        response.setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        String jsonResponse = String.format(
            "{\"timestamp\":\"%s\",\"status\":405,\"error\":\"Method Not Allowed\"," +
            "\"message\":\"HTTP method %s is not supported for this endpoint\"," +
            "\"path\":\"%s\"}",
            Instant.now().toString(),
            method,
            uri
        );
        
        response.getWriter().write(jsonResponse);
        response.getWriter().flush();
    }
}

