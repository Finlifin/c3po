package fin.c3po.profile.dto;

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
    StudentProfileInfo studentProfile;
    TeacherProfileInfo teacherProfile;

    @Value
    @Builder
    public static class StudentProfileInfo {
        String studentNo;
        String grade;
        String major;
        String className;
    }

    @Value
    @Builder
    public static class TeacherProfileInfo {
        String teacherNo;
        String department;
        String title;
        String subjects;
    }
}
