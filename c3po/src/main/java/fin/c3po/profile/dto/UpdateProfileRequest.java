package fin.c3po.profile.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @Size(min = 3, max = 64, message = "用户名长度必须在3-64个字符之间")
    private String username;

    @Email(message = "邮箱格式不正确")
    private String email;

    // Student profile fields
    private String grade;
    private String major;
    private String className;

    // Teacher profile fields
    private String department;
    private String title;
    private String subjects;

    private String avatarUrl;
}
