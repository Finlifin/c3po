package fin.c3po.club.web;

import fin.c3po.club.model.Attendance;
import fin.c3po.club.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/attendance")
public class AttendanceController {
	private final AttendanceService attendanceService;

	public AttendanceController(AttendanceService attendanceService) {
		this.attendanceService = attendanceService;
	}

	@PostMapping
	public ResponseEntity<Attendance> create(@Valid @RequestBody Attendance request) {
		return ResponseEntity.ok(attendanceService.create(request));
	}
}


