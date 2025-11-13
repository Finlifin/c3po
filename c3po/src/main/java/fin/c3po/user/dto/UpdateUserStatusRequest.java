package fin.c3po.user.dto;

import fin.c3po.user.UserStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UpdateUserStatusRequest {
    @NotNull
    UserStatus status;

    @Size(max = 512)
    String reason;
}


