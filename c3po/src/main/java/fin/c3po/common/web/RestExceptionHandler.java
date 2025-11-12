package fin.c3po.common.web;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@ControllerAdvice
public class RestExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return errorResponse(HttpStatus.BAD_REQUEST, "Validation failed", errors);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleNotReadableException(HttpMessageNotReadableException ex) {
        return errorResponse(HttpStatus.BAD_REQUEST, "Malformed request payload", null);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex) {
        Map<String, Object> body = errorResponse(ex.getStatusCode(), ex.getReason(), null);
        return ResponseEntity.status(ex.getStatusCode()).body(body);
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> handleNoHandlerFound(NoHandlerFoundException ex) {
        log.debug("No handler found for {} {}", ex.getHttpMethod(), ex.getRequestURL());
        return errorResponse(HttpStatus.NOT_FOUND, "Endpoint not found", null);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    @ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
    public Map<String, Object> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        log.debug("Method not supported: {} for {}", ex.getMethod(), ex.getMessage());
        String message = "Method " + ex.getMethod() + " is not supported for this endpoint";
        return errorResponse(HttpStatus.METHOD_NOT_ALLOWED, message, null);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, Object> handleUnexpectedException(Exception ex) {
        log.error("Unexpected error occurred", ex);
        return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error occurred", null);
    }

    private Map<String, Object> errorResponse(HttpStatusCode statusCode, String message, Map<String, String> errors) {
        HttpStatus status = statusCode instanceof HttpStatus httpStatus ? httpStatus
                : HttpStatus.resolve(statusCode.value());
        String reasonPhrase = status != null ? status.getReasonPhrase() : "HTTP " + statusCode.value();
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", Instant.now());
        body.put("status", statusCode.value());
        body.put("error", reasonPhrase);
        body.put("message", message);
        if (errors != null && !errors.isEmpty()) {
            body.put("errors", errors);
        }
        return body;
    }
}
