package fin.c3po.course.web;

import fin.c3po.common.web.ApiResponse;
import fin.c3po.course.Course;
import fin.c3po.course.CourseModule;
import fin.c3po.course.CourseModuleRepository;
import fin.c3po.course.CourseRepository;
import fin.c3po.course.CourseResource;
import fin.c3po.course.CourseResourceRepository;
import fin.c3po.course.dto.CourseModuleResponse;
import fin.c3po.course.dto.CourseResourceResponse;
import fin.c3po.course.dto.CreateCourseModuleRequest;
import fin.c3po.course.dto.CreateCourseResourceRequest;
import fin.c3po.course.dto.UploadCredentialResponse;
import fin.c3po.user.UserAccount;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@Validated
@RequiredArgsConstructor
public class CourseModuleController {

    private final CourseRepository courseRepository;
    private final CourseModuleRepository courseModuleRepository;
    private final CourseResourceRepository courseResourceRepository;

    @GetMapping("/courses/{courseId}/modules")
    public ApiResponse<List<CourseModuleResponse>> listModules(@PathVariable UUID courseId) {
        ensureCourseExists(courseId);
        List<CourseModuleResponse> modules = courseModuleRepository.findByCourseIdOrderByDisplayOrderAsc(courseId)
                .stream()
                .map(this::toModuleResponse)
                .toList();
        return ApiResponse.success(modules);
    }

    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @PostMapping("/courses/{courseId}/modules")
    public ApiResponse<CourseModuleResponse> createModule(
            @PathVariable UUID courseId,
            @Valid @RequestBody CreateCourseModuleRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        if (!currentUser.getRole().equals(fin.c3po.user.UserRole.ADMIN)
                && !course.getTeacherId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to manage modules");
        }

        CourseModule module = new CourseModule();
        module.setCourseId(courseId);
        module.setTitle(request.getTitle());
        module.setDisplayOrder(request.getDisplayOrder());
        module.setReleaseAt(request.getReleaseAt());

        CourseModule saved = courseModuleRepository.save(module);
        return ApiResponse.success(toModuleResponse(saved));
    }

    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @PostMapping("/modules/{moduleId}/resources")
    public ApiResponse<CourseResourceResponse> createResource(
            @PathVariable UUID moduleId,
            @Valid @RequestBody CreateCourseResourceRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {

        CourseModule module = courseModuleRepository.findById(moduleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));
        Course course = courseRepository.findById(module.getCourseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));

        if (!currentUser.getRole().equals(fin.c3po.user.UserRole.ADMIN)
                && !course.getTeacherId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to manage resources");
        }

        CourseResource resource = new CourseResource();
        resource.setModuleId(moduleId);
        resource.setType(request.getType());
        resource.setName(request.getName());
        resource.setFileSize(request.getFileSize());
        resource.setDownloadUrl(request.getDownloadUrl());

        CourseResource saved = courseResourceRepository.save(resource);
        return ApiResponse.success(toResourceResponse(saved));
    }

    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @PostMapping("/modules/{moduleId}/resources/upload-url")
    public ApiResponse<UploadCredentialResponse> createUploadUrl(@PathVariable UUID moduleId) {
        courseModuleRepository.findById(moduleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Module not found"));

        UploadCredentialResponse response = UploadCredentialResponse.builder()
                .uploadUrl("https://oss.c3po.local/upload/" + moduleId)
                .method("PUT")
                .expiresAt(Instant.now().plus(10, ChronoUnit.MINUTES))
                .callbackUrl("/api/v1/modules/" + moduleId + "/resources")
                .build();
        return ApiResponse.success(response);
    }

    @GetMapping("/resources/{resourceId}")
    public ApiResponse<CourseResourceResponse> getResource(@PathVariable UUID resourceId) {
        CourseResource resource = courseResourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));
        return ApiResponse.success(toResourceResponse(resource));
    }

    private void ensureCourseExists(UUID courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found");
        }
    }

    private CourseModuleResponse toModuleResponse(CourseModule module) {
        List<CourseModuleResponse.Resource> resources = courseResourceRepository.findByModuleId(module.getId())
                .stream()
                .map(resource -> CourseModuleResponse.Resource.builder()
                        .id(resource.getId())
                        .type(resource.getType())
                        .name(resource.getName())
                        .fileSize(resource.getFileSize())
                        .downloadUrl(resource.getDownloadUrl())
                        .build())
                .toList();

        return CourseModuleResponse.builder()
                .id(module.getId())
                .courseId(module.getCourseId())
                .title(module.getTitle())
                .displayOrder(module.getDisplayOrder())
                .releaseAt(module.getReleaseAt())
                .resources(resources)
                .build();
    }

    private CourseResourceResponse toResourceResponse(CourseResource resource) {
        return CourseResourceResponse.builder()
                .id(resource.getId())
                .moduleId(resource.getModuleId())
                .type(resource.getType())
                .name(resource.getName())
                .fileSize(resource.getFileSize())
                .downloadUrl(resource.getDownloadUrl())
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .build();
    }
}


