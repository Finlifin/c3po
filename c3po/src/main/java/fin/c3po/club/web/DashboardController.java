package fin.c3po.club.web;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

	@GetMapping("/overview")
	public ResponseEntity<Map<String, Object>> overview() {
		// Simple synthetic metrics suitable for smoke checks
		Map<String, Object> payload = Map.of(
			"totalMembers", 0,
			"activeMembers", 0,
			"totalActivities", 0,
			"pendingApplications", 0,
			"approvalRate", 0.0
		);
		return ResponseEntity.ok(payload);
	}
}


