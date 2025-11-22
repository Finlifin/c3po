package fin.c3po.user.dto;

import fin.c3po.user.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdateUserRequest {
    @Size(min = 3, max = 64, message = "Username must be between 3 and 64 characters")
    private String username;

    @Email(message = "Email must be valid")
    @Size(max = 128, message = "Email must not exceed 128 characters")
    private String email;

    private UserStatus status;

    private String statusReason;
}

