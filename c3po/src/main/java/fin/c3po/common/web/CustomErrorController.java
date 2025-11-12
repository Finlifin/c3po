package fin.c3po.common.web;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * 自定义错误控制器，防止 Tomcat 默认错误页面导致的无限重定向问题
 */
@Slf4j
@RestController
public class CustomErrorController implements ErrorController {

    @RequestMapping("/error")
    public ResponseEntity<Map<String, Object>> handleError(HttpServletRequest request) {
        // 防止无限重定向：检测是否已经在处理错误
        String errorPath = (String) request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
        if (errorPath != null && errorPath.contains("/error")) {
            log.error("Detected potential redirect loop to /error, breaking the loop");
            Map<String, Object> body = new HashMap<>();
            body.put("timestamp", Instant.now());
            body.put("status", 500);
            body.put("error", "Internal Server Error");
            body.put("message", "Error handling failed (potential redirect loop)");
            body.put("path", errorPath);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body);
        }

        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        Object message = request.getAttribute(RequestDispatcher.ERROR_MESSAGE);
        Object uri = request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
        Object exception = request.getAttribute(RequestDispatcher.ERROR_EXCEPTION);

        int statusCode = status != null ? Integer.parseInt(status.toString()) : 500;
        String errorMessage = message != null ? message.toString() : "Unknown error";
        String requestUri = uri != null ? uri.toString() : "Unknown URI";

        log.warn("Error handled by CustomErrorController: {} {} - {}", statusCode, requestUri, errorMessage);

        if (exception != null) {
            log.error("Error exception", (Throwable) exception);
        }

        HttpStatus httpStatus = HttpStatus.resolve(statusCode);
        if (httpStatus == null) {
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now());
        body.put("status", statusCode);
        body.put("error", httpStatus.getReasonPhrase());
        body.put("message", errorMessage);
        body.put("path", requestUri);

        return ResponseEntity
                .status(httpStatus)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
    }
}
