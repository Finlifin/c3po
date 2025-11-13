package fin.c3po.user.dto;

import lombok.Builder;
import lombok.Singular;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class TeacherProfileSummary {
    String teacherNo;
    String department;
    String title;
    @Singular
    List<String> subjects;
}


