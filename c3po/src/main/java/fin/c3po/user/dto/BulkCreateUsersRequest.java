package fin.c3po.user.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import fin.c3po.user.UserRole;
import fin.c3po.user.UserStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Singular;
import lombok.Value;

import java.util.List;

@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BulkCreateUsersRequest {

    @NotEmpty
    @Valid
    @Singular
    List<CreateUserPayload> users;

    @Value
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CreateUserPayload {
        @NotBlank
        @Size(max = 64)
        String username;

        @NotBlank
        @Email
        @Size(max = 128)
        String email;

        @NotBlank
        @Size(min = 8, max = 128)
        String password;

        UserRole role;

        UserStatus status;

        @Size(max = 512)
        String statusReason;

        @Valid
        StudentProfilePayload studentProfile;

        @Valid
        TeacherProfilePayload teacherProfile;
    }

    @Value
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class StudentProfilePayload {
        @NotBlank
        @Size(max = 32)
        String studentNo;

        @Size(max = 32)
        String grade;

        @Size(max = 64)
        String major;

        @Size(max = 64)
        String className;
    }

    @Value
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TeacherProfilePayload {
        @NotBlank
        @Size(max = 32)
        String teacherNo;

        @Size(max = 64)
        String department;

        @Size(max = 64)
        String title;

        @Singular("subject")
        @Size(max = 10)
        List<@NotBlank @Size(max = 64) String> subjects;
    }
}


