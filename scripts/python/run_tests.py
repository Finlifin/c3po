#!/usr/bin/env python3
"""
C3PO API regression tests implemented in Python for cross-platform support.
"""

from __future__ import annotations

import json
import os
import sys
import tempfile
import time
import urllib.error
import urllib.request
from importlib import import_module
from pathlib import Path
from typing import Optional, Tuple


API_BASE_URL = os.environ.get("C3PO_API_BASE_URL", "http://localhost:8080/api/v1")
API_TIMEOUT = float(os.environ.get("C3PO_API_TIMEOUT", "200"))
ADMIN_USERNAME = os.environ.get("C3PO_ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("C3PO_ADMIN_PASSWORD", "admin123")

TOKEN_FILE = Path(
    os.environ.get(
        "C3PO_TOKEN_FILE",
        str(Path(tempfile.gettempdir()) / "c3po_test_token"),
    )
)

TESTS_PASSED = 0
TESTS_FAILED = 0


def _supports_color() -> bool:
    if os.environ.get("NO_COLOR"):
        return False
    if not sys.stdout.isatty():
        return False
    return True


USE_COLOR = _supports_color()


class Color:
    reset = "\033[0m" if USE_COLOR else ""
    red = "\033[0;31m" if USE_COLOR else ""
    green = "\033[0;32m" if USE_COLOR else ""
    yellow = "\033[0;33m" if USE_COLOR else ""
    blue = "\033[0;34m" if USE_COLOR else ""


def log_info(message: str) -> None:
    print(f"{Color.blue}(INFO){Color.reset} {message}")


def log_success(message: str) -> None:
    global TESTS_PASSED
    print(f"{Color.green}(✓){Color.reset} {message}")
    TESTS_PASSED += 1


def log_error(message: str) -> None:
    global TESTS_FAILED
    print(f"{Color.red}(✗){Color.reset} {message}")
    TESTS_FAILED += 1


def log_warn(message: str) -> None:
    print(f"{Color.yellow}(WARN){Color.reset} {message}")


def build_url(path: str) -> str:
    if path.startswith("http://") or path.startswith("https://"):
        return path
    base = API_BASE_URL.rstrip("/")
    if path.startswith("/"):
        return f"{base}{path}"
    return f"{base}/{path}"


def load_token() -> str:
    if TOKEN_FILE.exists():
        return TOKEN_FILE.read_text(encoding="utf-8").strip()
    return ""


def http_request(method: str, path: str, data: Optional[str] = None) -> Tuple[str, str]:
    url = build_url(path)
    headers = {"Content-Type": "application/json"}
    token = load_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"

    payload: Optional[bytes] = data.encode("utf-8") if data is not None else None

    request = urllib.request.Request(url, data=payload, headers=headers, method=method)

    try:
        with urllib.request.urlopen(request, timeout=API_TIMEOUT) as response:
            body = response.read().decode("utf-8", errors="replace")
            status = str(response.getcode())
            return body, status
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        return body, str(exc.code)
    except urllib.error.URLError as exc:
        log_warn(f"{method} {url} failed: {exc.reason}")
        return "", "000"


def http_get(path: str) -> Tuple[str, str]:
    return http_request("GET", path)


def http_post(path: str, data: str) -> Tuple[str, str]:
    return http_request("POST", path, data=data)


def http_put(path: str, data: str) -> Tuple[str, str]:
    return http_request("PUT", path, data=data)


def http_delete(path: str) -> Tuple[str, str]:
    return http_request("DELETE", path)


def http_patch(path: str, data: str) -> Tuple[str, str]:
    return http_request("PATCH", path, data=data)


def assert_status(expected: str, actual: str, message: str) -> bool:
    if actual == expected:
        log_success(f"{message} (HTTP {actual})")
        return True
    log_error(f"{message} (Expected HTTP {expected}, got {actual})")
    return False


def _get_field(json_data: object, field: str) -> Optional[object]:
    current = json_data
    for segment in field.split("."):
        if current is None:
            return None
        if isinstance(current, dict):
            current = current.get(segment)
        else:
            try:
                current = getattr(current, segment)  # type: ignore[attr-defined]
            except AttributeError:
                return None
    return current


def assert_json_field(json_payload: str, field: str, message: str) -> bool:
    if not json_payload:
        log_error(f"{message} (empty JSON payload)")
        return False
    try:
        parsed = json.loads(json_payload)
    except json.JSONDecodeError:
        log_error(f"{message} (invalid JSON payload)")
        return False

    value = _get_field(parsed, field)
    if value is not None:
        log_success(f"{message} (field '{field}' exists)")
        return True

    log_error(f"{message} (field '{field}' missing)")
    return False


def save_token(json_payload: str) -> bool:
    if not json_payload:
        log_error("No token in response")
        return False
    try:
        parsed = json.loads(json_payload)
    except json.JSONDecodeError:
        log_error("No token in response")
        return False

    token = parsed.get("accessToken")
    if not token:
        log_error("No token in response")
        return False

    TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
    TOKEN_FILE.write_text(str(token), encoding="utf-8")
    log_info("Token saved")
    return True


def clear_token() -> None:
    if TOKEN_FILE.exists():
        TOKEN_FILE.unlink()
    log_info("Token cleared")


def print_summary() -> bool:
    print("")
    print("==================================")
    print("Test Summary")
    print("==================================")
    print(f"Passed: {Color.green}{TESTS_PASSED}{Color.reset}")
    print(f"Failed: {Color.red}{TESTS_FAILED}{Color.reset}")
    print(f"Total:  {TESTS_PASSED + TESTS_FAILED}")
    print("==================================")
    return TESTS_FAILED == 0


def test_auth_login() -> None:
    log_info("Testing POST /api/v1/auth/login")

    payload = json.dumps({"identifier": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
    body, status = http_post("/auth/login", payload)

    log_info(f"Request: POST {build_url('/auth/login')}")
    log_info(f"Payload: {payload}")
    log_info(f"Response body: {body}")
    log_info(f"Response status: {status}")

    if not assert_status("200", status, "Login request"):
        return
    if not assert_json_field(body, "accessToken", "Login response has accessToken"):
        return
    if not assert_json_field(body, "tokenType", "Login response has tokenType"):
        return
    save_token(body)


def test_auth_me() -> None:
    log_info("Testing GET /api/v1/auth/me")
    body, status = http_get("/auth/me")

    log_info(f"Response body: {body}")
    log_info(f"Response status: {status}")

    if not assert_status("200", status, "Get profile request"):
        return
    if not assert_json_field(body, "username", "Profile has username"):
        return
    assert_json_field(body, "role", "Profile has role")


def test_auth_invalid_credentials() -> None:
    log_info("Testing login with invalid credentials")
    payload = json.dumps({"identifier": "admin", "password": "wrongpassword"})
    _, status = http_post("/auth/login", payload)
    log_info(f"Response status: {status}")
    assert_status("401", status, "Invalid credentials should return 401")


def run_auth_tests() -> None:
    print("")
    print("==================================")
    print("Authentication Tests")
    print("==================================")

    clear_token()
    test_auth_login()
    test_auth_me()
    test_auth_invalid_credentials()
    print("")


def test_dashboard_overview() -> None:
    log_info("Testing GET /api/v1/dashboard/overview")
    body, status = http_get("/dashboard/overview")

    log_info(f"Response body: {body}")
    log_info(f"Response status: {status}")

    if not assert_status("200", status, "Dashboard overview request"):
        return
    if not assert_json_field(body, "totalMembers", "Dashboard has totalMembers"):
        return
    if not assert_json_field(body, "activeMembers", "Dashboard has activeMembers"):
        return
    assert_json_field(body, "totalActivities", "Dashboard has totalActivities")


def run_dashboard_tests() -> None:
    print("")
    print("==================================")
    print("Dashboard Tests")
    print("==================================")
    test_dashboard_overview()
    print("")


def test_members_create(state: dict) -> None:
    log_info("Testing POST /api/v1/members")
    timestamp = int(time.time())
    payload = {
        "name": f"Test Member {timestamp}",
        "studentId": f"S{timestamp}",
        "major": "Computer Science",
        "joinDate": "2024-01-01",
        "status": "active",
        "role": "member",
        "email": f"test{timestamp}@example.com",
        "phone": "1234567890",
    }
    body, status = http_post("/members", json.dumps(payload))

    log_info(f"Response body: {body}")
    log_info(f"Response status: {status}")

    if not assert_status("200", status, "Create member request"):
        return
    if not assert_json_field(body, "id", "Member response has id"):
        return

    try:
        state["member_id"] = json.loads(body)["id"]
        log_info(f"Created member ID: {state['member_id']}")
    except (KeyError, json.JSONDecodeError, TypeError):
        log_warn("Could not determine member ID from response")


def test_members_list() -> None:
    log_info("Testing GET /api/v1/members")
    body, status = http_get("/members?page=1&limit=20")

    log_info(f"Response status: {status}")

    if not assert_status("200", status, "List members request"):
        return
    assert_json_field(body, "items", "Members response has items")


def test_members_get(state: dict) -> None:
    member_id = state.get("member_id")
    if not member_id:
        log_warn("Skipping GET member test (no member created)")
        return

    log_info(f"Testing GET /api/v1/members/{member_id}")
    body, status = http_get(f"/members/{member_id}")

    log_info(f"Response status: {status}")

    if not assert_status("200", status, "Get member request"):
        return
    assert_json_field(body, "id", "Member has id")


def test_members_delete(state: dict) -> None:
    member_id = state.get("member_id")
    if not member_id:
        log_warn("Skipping DELETE member test (no member created)")
        return

    log_info(f"Testing DELETE /api/v1/members/{member_id}")
    _, status = http_delete(f"/members/{member_id}")

    log_info(f"Response status: {status}")

    if status in {"204", "200"}:
        log_success(f"Delete member request (HTTP {status})")
        return
    log_error(f"Delete member request (Expected HTTP 204 or 200, got {status})")


def run_members_tests() -> None:
    print("")
    print("==================================")
    print("Members Tests")
    print("==================================")
    state: dict = {}
    test_members_create(state)
    test_members_list()
    test_members_get(state)
    test_members_delete(state)
    print("")


def test_activities_create(state: dict) -> None:
    log_info("Testing POST /api/v1/activities")
    timestamp = int(time.time())
    payload = {
        "name": f"Test Activity {timestamp}",
        "description": "Test activity description",
        "activityDate": "2024-12-31",
        "location": "Test Location",
        "capacity": 50,
        "status": "upcoming",
    }
    body, status = http_post("/activities", json.dumps(payload))

    log_info(f"Response body: {body}")
    log_info(f"Response status: {status}")

    if not assert_status("200", status, "Create activity request"):
        return
    if not assert_json_field(body, "id", "Activity response has id"):
        return

    try:
        state["activity_id"] = json.loads(body)["id"]
        log_info(f"Created activity ID: {state['activity_id']}")
    except (KeyError, json.JSONDecodeError, TypeError):
        log_warn("Could not determine activity ID from response")


def test_activities_list() -> None:
    log_info("Testing GET /api/v1/activities")
    body, status = http_get("/activities?page=1&limit=20")

    log_info(f"Response status: {status}")

    if not assert_status("200", status, "List activities request"):
        return
    assert_json_field(body, "items", "Activities response has items")


def test_activities_get(state: dict) -> None:
    activity_id = state.get("activity_id")
    if not activity_id:
        log_warn("Skipping GET activity test (no activity created)")
        return

    log_info(f"Testing GET /api/v1/activities/{activity_id}")
    body, status = http_get(f"/activities/{activity_id}")

    log_info(f"Response status: {status}")

    if not assert_status("200", status, "Get activity request"):
        return
    assert_json_field(body, "id", "Activity has id")


def run_activities_tests() -> None:
    print("")
    print("==================================")
    print("Activities Tests")
    print("==================================")
    state: dict = {}
    test_activities_create(state)
    test_activities_list()
    test_activities_get(state)
    print("")


def main() -> int:
    print("==================================")
    print("C3PO API Test Suite")
    print("==================================")
    print(f"Base URL: {API_BASE_URL}")
    print(f"Admin User: {ADMIN_USERNAME}")
    print("")

    clear_token()
    log_info("Skipping server health check, starting tests...")

    run_auth_tests()

    if TOKEN_FILE.exists():
        run_dashboard_tests()
        run_members_tests()
        run_activities_tests()

        admin_users_module = import_module("test_admin_users")
        admin_users_module.run_admin_user_tests()

        course_content_module = import_module("test_course_content")
        course_content_module.run_course_content_tests()
        
        ai_assistant_module = import_module("test_ai_assistant")
        ai_assistant_module.run_ai_assistant_tests()
    else:
        log_error("Authentication failed, skipping other tests")

    success = print_summary()
    clear_token()
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())


