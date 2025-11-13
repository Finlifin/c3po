package fin.c3po.club.web;

import fin.c3po.club.dto.CommonListResponse;
import fin.c3po.club.model.Activity;
import fin.c3po.club.model.Attendance;
import fin.c3po.club.service.ActivityService;
import fin.c3po.club.service.AttendanceService;
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
@RequestMapping("/api/v1/activities")
public class ActivityController {
	private final ActivityService activityService;
	private final AttendanceService attendanceService;

	public ActivityController(ActivityService activityService, AttendanceService attendanceService) {
		this.activityService = activityService;
		this.attendanceService = attendanceService;
	}

	@PostMapping
	public ResponseEntity<Activity> create(@Valid @RequestBody Activity request) {
		return ResponseEntity.ok(activityService.create(request));
	}

	@GetMapping("/{id}")
	public ResponseEntity<Activity> get(@PathVariable int id) {
		Activity activity = activityService.get(id);
		if (activity == null) return ResponseEntity.notFound().build();
		return ResponseEntity.ok(activity);
	}

	@PutMapping("/{id}")
	public ResponseEntity<Activity> update(@PathVariable int id, @Valid @RequestBody Activity request) {
		Activity updated = activityService.update(id, request);
		if (updated == null) return ResponseEntity.notFound().build();
		return ResponseEntity.ok(updated);
	}

	@GetMapping
	public ResponseEntity<Map<String, Object>> list(
		@RequestParam(name = "page", defaultValue = "1") int page,
		@RequestParam(name = "limit", defaultValue = "20") int limit
	) {
		CommonListResponse<Activity> resp = activityService.list(page, limit);
		return ResponseEntity.ok(Map.of("total", resp.getTotal(), "items", resp.getItems()));
	}

	@GetMapping("/stats")
	public ResponseEntity<Map<String, Object>> stats() {
		return ResponseEntity.ok(activityService.stats());
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable int id) {
		boolean removed = activityService.delete(id);
		return removed ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
	}

	@GetMapping("/{id}/attendance")
	public ResponseEntity<Map<String, Object>> listAttendance(
		@PathVariable int id,
		@RequestParam(name = "page", defaultValue = "1") int page,
		@RequestParam(name = "limit", defaultValue = "20") int limit
	) {
		CommonListResponse<Attendance> resp = attendanceService.listByActivity(id, page, limit);
		return ResponseEntity.ok(Map.of("total", resp.getTotal(), "items", resp.getItems()));
	}
}


