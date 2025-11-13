package fin.c3po.approval.web;

import fin.c3po.approval.ApprovalRequest;
import fin.c3po.approval.ApprovalRequestRepository;
import fin.c3po.approval.ApprovalStatus;
import fin.c3po.approval.ApprovalType;
import fin.c3po.approval.dto.ApprovalDecisionRequest;
import fin.c3po.approval.dto.ApprovalResponse;
import fin.c3po.common.web.ApiResponse;
import fin.c3po.common.web.PageMeta;
import fin.c3po.user.UserAccount;
import fin.c3po.user.UserRole;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/approvals")
@Validated
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ApprovalController {

    private static final int MAX_PAGE_SIZE = 100;

    private final ApprovalRequestRepository approvalRequestRepository;

    @GetMapping
    public ApiResponse<List<ApprovalResponse>> listApprovals(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "pageSize", defaultValue = "20") int pageSize,
            @RequestParam(name = "status", required = false) ApprovalStatus status,
            @RequestParam(name = "type", required = false) ApprovalType type) {

        Pageable pageable = PageRequest.of(Math.max(page, 1) - 1,
                Math.max(1, Math.min(pageSize, MAX_PAGE_SIZE)),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<ApprovalRequest> spec = (root, query, cb) -> cb.conjunction();
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (type != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("type"), type));
        }

        Page<ApprovalRequest> pageResult = approvalRequestRepository.findAll(spec, pageable);
        List<ApprovalResponse> data = pageResult.getContent().stream()
                .map(this::toResponse)
                .toList();

        PageMeta meta = PageMeta.builder()
                .page(pageResult.getNumber() + 1)
                .pageSize(pageResult.getSize())
                .total(pageResult.getTotalElements())
                .sort("createdAt,desc")
                .build();
        return ApiResponse.success(data, meta);
    }

    @PostMapping("/{requestId}/decision")
    public ApiResponse<ApprovalResponse> decide(
            @PathVariable UUID requestId,
            @Valid @RequestBody ApprovalDecisionRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {

        ApprovalRequest approval = approvalRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Approval request not found"));

        if (request.getStatus() == ApprovalStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Decision status cannot be PENDING");
        }

        approval.setStatus(request.getStatus());
        approval.setComment(request.getComment());
        approval.setProcessedBy(currentUser.getId());
        approval.setProcessedAt(Instant.now());

        ApprovalRequest saved = approvalRequestRepository.save(approval);
        return ApiResponse.success(toResponse(saved));
    }

    private ApprovalResponse toResponse(ApprovalRequest approval) {
        return ApprovalResponse.builder()
                .id(approval.getId())
                .type(approval.getType())
                .status(approval.getStatus())
                .applicantId(approval.getApplicantId())
                .payload(approval.getPayload())
                .processedBy(approval.getProcessedBy())
                .comment(approval.getComment())
                .processedAt(approval.getProcessedAt())
                .createdAt(approval.getCreatedAt())
                .updatedAt(approval.getUpdatedAt())
                .build();
    }
}

