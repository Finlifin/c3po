package fin.c3po.club.web;

import fin.c3po.club.dto.CommonListResponse;
import fin.c3po.club.model.Application;
import fin.c3po.club.service.ApplicationService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/applications")
public class ApplicationController {
	private final ApplicationService applicationService;

	public ApplicationController(ApplicationService applicationService) {
		this.applicationService = applicationService;
	}

	@PostMapping
	public ResponseEntity<Application> create(@Valid @RequestBody Application request) {
		return ResponseEntity.ok(applicationService.create(request));
	}

	@GetMapping("/{id}")
	public ResponseEntity<Application> get(@PathVariable int id) {
		Application application = applicationService.get(id);
		if (application == null) return ResponseEntity.notFound().build();
		return ResponseEntity.ok(application);
	}

	@PutMapping("/{id}/process")
	public ResponseEntity<Application> process(@PathVariable int id, @Valid @RequestBody Application request) {
		Application processed = applicationService.process(id, request);
		if (processed == null) return ResponseEntity.notFound().build();
		return ResponseEntity.ok(processed);
	}

	@GetMapping
	public ResponseEntity<Map<String, Object>> list(
		@RequestParam(name = "page", defaultValue = "1") int page,
		@RequestParam(name = "limit", defaultValue = "20") int limit
	) {
		CommonListResponse<Application> resp = applicationService.list(page, limit);
		return ResponseEntity.ok(Map.of("total", resp.getTotal(), "items", resp.getItems()));
	}

	@GetMapping("/stats")
	public ResponseEntity<Map<String, Object>> stats() {
		return ResponseEntity.ok(applicationService.stats());
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable int id) {
		boolean removed = applicationService.delete(id);
		return removed ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
	}
}


