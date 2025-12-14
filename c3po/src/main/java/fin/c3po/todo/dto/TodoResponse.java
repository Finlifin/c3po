package fin.c3po.todo.dto;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Value
@Builder
public class TodoResponse {
    UUID id;
    String type;
    String title;
    String description;
    Instant dueAt;
    String status;
    Map<String, Object> summary;
}


