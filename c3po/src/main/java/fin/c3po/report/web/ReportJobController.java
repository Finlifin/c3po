package fin.c3po.report.web;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import fin.c3po.common.web.ApiResponse;
import fin.c3po.report.ReportJob;
import fin.c3po.report.ReportJobRepository;
import fin.c3po.report.ReportJobStatus;
import fin.c3po.report.dto.CreateReportJobRequest;
import fin.c3po.report.dto.ReportJobResponse;
import fin.c3po.user.UserAccount;
import fin.c3po.user.UserRole;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/jobs")
@Validated
@RequiredArgsConstructor
public class ReportJobController {

    private final ReportJobRepository reportJobRepository;
    private final ObjectMapper objectMapper;

    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @PostMapping("/reports")
    public ResponseEntity<ApiResponse<ReportJobResponse>> createReportJob(
            @Valid @RequestBody CreateReportJobRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {

        ReportJob job = new ReportJob();
        job.setJobType(request.getJobType());
        job.setStatus(ReportJobStatus.QUEUED);
        job.setParams(toJson(request.getParams()));

        ReportJob saved = reportJobRepository.save(job);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.success(toResponse(saved)));
    }

    @GetMapping("/{jobId}")
    public ApiResponse<ReportJobResponse> jobStatus(@PathVariable UUID jobId) {
        ReportJob job = reportJobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report job not found"));
        return ApiResponse.success(toResponse(job));
    }

    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @PostMapping("/{jobId}/cancel")
    public ApiResponse<ReportJobResponse> cancelJob(
            @PathVariable UUID jobId,
            @AuthenticationPrincipal UserAccount currentUser) {

        ReportJob job = reportJobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report job not found"));

        if (job.getStatus() == ReportJobStatus.SUCCEEDED || job.getStatus() == ReportJobStatus.FAILED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Completed job cannot be cancelled");
        }

        job.setStatus(ReportJobStatus.CANCELLED);
        ReportJob saved = reportJobRepository.save(job);
        return ApiResponse.success(toResponse(saved));
    }

    private String toJson(Map<String, Object> params) {
        if (params == null || params.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(params);
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid params format");
        }
    }

    private Map<String, Object> fromJson(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, MAP_TYPE);
        } catch (JsonProcessingException e) {
            return Map.of();
        }
    }

    private ReportJobResponse toResponse(ReportJob job) {
        return ReportJobResponse.builder()
                .id(job.getId())
                .jobType(job.getJobType())
                .status(job.getStatus())
                .params(fromJson(job.getParams()))
                .createdAt(job.getCreatedAt())
                .completedAt(job.getCompletedAt())
                .resultUrl(job.getResultUrl())
                .build();
    }
}


