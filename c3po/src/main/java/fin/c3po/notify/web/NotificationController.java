package fin.c3po.notify.web;

import fin.c3po.common.web.ApiResponse;
import fin.c3po.common.web.PageMeta;
import fin.c3po.notify.Notification;
import fin.c3po.notify.NotificationRepository;
import fin.c3po.notify.NotificationStatus;
import fin.c3po.notify.dto.CreateNotificationRequest;
import fin.c3po.notify.dto.NotificationResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1")
@Validated
@RequiredArgsConstructor
public class NotificationController {

    private static final int MAX_PAGE_SIZE = 100;
    private final NotificationRepository notificationRepository;

    @GetMapping("/notifications")
    public ApiResponse<List<NotificationResponse>> listNotifications(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "pageSize", defaultValue = "20") int pageSize,
            @RequestParam(name = "targetType", required = false) String targetType,
            @RequestParam(name = "status", required = false) NotificationStatus status) {

        Pageable pageable = PageRequest.of(Math.max(page, 1) - 1,
                Math.max(1, Math.min(pageSize, MAX_PAGE_SIZE)),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<Notification> spec = (root, query, cb) -> cb.conjunction();
        if (targetType != null && !targetType.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(cb.lower(root.get("targetType")), targetType.toLowerCase(Locale.ROOT)));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }

        Page<Notification> pageResult = notificationRepository.findAll(spec, pageable);
        List<NotificationResponse> data = pageResult.getContent().stream()
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

    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @PostMapping("/notifications")
    public ResponseEntity<ApiResponse<NotificationResponse>> createNotification(
            @Valid @RequestBody CreateNotificationRequest request) {

        Notification notification = new Notification();
        notification.setTargetType(request.getTargetType());
        notification.setTitle(request.getTitle());
        notification.setContent(request.getContent());
        notification.setSendChannels(request.getSendChannels());
        notification.setStatus(NotificationStatus.SENT);
        notification.setSentAt(Instant.now());

        Notification saved = notificationRepository.save(notification);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(toResponse(saved)));
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .targetType(notification.getTargetType())
                .title(notification.getTitle())
                .content(notification.getContent())
                .sendChannels(notification.getSendChannels())
                .status(notification.getStatus())
                .sentAt(notification.getSentAt())
                .createdAt(notification.getCreatedAt())
                .updatedAt(notification.getUpdatedAt())
                .build();
    }
}


