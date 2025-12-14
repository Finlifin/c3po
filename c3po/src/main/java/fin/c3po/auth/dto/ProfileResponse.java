package fin.c3po.auth.dto;

import fin.c3po.user.UserRole;
import fin.c3po.user.UserStatus;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.UUID;

@Value
@Builder
public class ProfileResponse {
    UUID id;
    String username;
    String email;
    UserRole role;
    UserStatus status;
    String avatarUrl;
    Instant createdAt;
    Instant updatedAt;
}
