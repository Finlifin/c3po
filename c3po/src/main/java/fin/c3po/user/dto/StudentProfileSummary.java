package fin.c3po.user.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class StudentProfileSummary {
    String studentNo;
    String grade;
    String major;
    String className;
}


