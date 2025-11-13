package fin.c3po.club.web;

import fin.c3po.club.dto.CommonListResponse;
import fin.c3po.club.model.Member;
import fin.c3po.club.service.MemberService;
import jakarta.validation.Valid;
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

import java.util.Map;

@RestController
@RequestMapping("/api/v1/members")
public class MemberController {
	private final MemberService memberService;

	public MemberController(MemberService memberService) {
		this.memberService = memberService;
	}

	@PostMapping
	public ResponseEntity<Member> create(@Valid @RequestBody Member request) {
		Member created = memberService.create(request);
		return ResponseEntity.ok(created);
	}

	@GetMapping("/{id}")
	public ResponseEntity<Member> get(@PathVariable int id) {
		Member member = memberService.get(id);
		if (member == null) return ResponseEntity.notFound().build();
		return ResponseEntity.ok(member);
	}

	@PutMapping("/{id}")
	public ResponseEntity<Member> update(@PathVariable int id, @Valid @RequestBody Member request) {
		Member updated = memberService.update(id, request);
		if (updated == null) return ResponseEntity.notFound().build();
		return ResponseEntity.ok(updated);
	}

	@GetMapping
	public ResponseEntity<Map<String, Object>> list(
		@RequestParam(name = "page", defaultValue = "1") int page,
		@RequestParam(name = "limit", defaultValue = "20") int limit
	) {
		CommonListResponse<Member> resp = memberService.list(page, limit);
		return ResponseEntity.ok(Map.of("total", resp.getTotal(), "items", resp.getItems()));
	}

	@GetMapping("/stats")
	public ResponseEntity<Map<String, Object>> stats() {
		return ResponseEntity.ok(memberService.stats());
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable int id) {
		boolean removed = memberService.delete(id);
		return removed ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
	}
}


