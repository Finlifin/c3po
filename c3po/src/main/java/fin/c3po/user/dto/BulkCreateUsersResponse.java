package fin.c3po.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Singular;
import lombok.Value;

import java.util.List;

@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BulkCreateUsersResponse {
    @Singular("createdUser")
    List<AdminUserResponse> created;
    @Singular("error")
    List<CreateUserError> errors;

    @Value
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CreateUserError {
        int index;
        String username;
        String email;
        String message;
    }
}


