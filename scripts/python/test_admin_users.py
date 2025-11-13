#!/usr/bin/env python3
"""
Admin user management API tests implemented in Python.
"""

from __future__ import annotations

import json
import random
import sys
import time
from pathlib import Path
from typing import Optional

SCRIPT_DIR = Path(__file__).resolve().parent
PARENT = SCRIPT_DIR
if str(PARENT) not in sys.path:
    sys.path.insert(0, str(PARENT))

from run_tests import (  # type: ignore
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    assert_json_field,
    assert_status,
    http_get,
    http_post,
    http_put,
    log_error,
    log_info,
    log_success,
    log_warn,
    save_token,
)

ADMIN_USERS_LAST_ID: Optional[str] = None
ADMIN_USERS_LAST_USERNAME: Optional[str] = None
ADMIN_USERS_LAST_PASSWORD: Optional[str] = None


def _login_as(username: str, password: str) -> bool:
    payload = json.dumps({"identifier": username, "password": password})
    body, status = http_post("/auth/login", payload)

    if not assert_status("200", status, f"Login as {username}"):
        return False
    if not assert_json_field(body, "accessToken", "Login response has accessToken"):
        return False
    save_token(body)
    return True


def _assert_json_equals(json_payload: str, field: str, expected: str, message: str) -> None:
    if not json_payload:
        log_error(f"{message} (empty JSON payload)")
        return
    try:
        parsed = json.loads(json_payload)
    except json.JSONDecodeError:
        log_error(f"{message} (invalid JSON payload)")
        return

    actual = parsed
    for segment in field.split("."):
        if isinstance(actual, dict):
            actual = actual.get(segment)
        else:
            actual = None
        if actual is None:
            break

    if actual == expected:
        log_success(f"{message} ('{actual}')")
    else:
        actual_display = "<empty>" if actual in (None, "") else actual
        log_error(f"{message} (expected '{expected}', got '{actual_display}')")


def test_admin_users_list() -> None:
    log_info("Testing GET /api/v1/admin/users")
    body, status = http_get("/v1/admin/users?page=1&pageSize=5")

    if not assert_status("200", status, "List admin users"):
        return

    assert_json_field(body, "data", "Users list contains data")


def test_admin_users_bulk_create() -> None:
    global ADMIN_USERS_LAST_ID, ADMIN_USERS_LAST_USERNAME, ADMIN_USERS_LAST_PASSWORD

    log_info("Testing POST /api/v1/admin/users (bulk create)")
    suffix = f"{int(time.time())}{random.randint(1000, 9999)}"

    username = f"auto-student-{suffix}"
    email = f"auto-student-{suffix}@example.com"
    password = f"Student#{suffix}"

    payload = {
        "users": [
            {
                "username": username,
                "email": email,
                "password": password,
                "role": "STUDENT",
                "status": "ACTIVE",
                "studentProfile": {
                    "studentNo": f"S{suffix}",
                    "grade": "2025",
                    "major": "Computer Science",
                    "className": f"CS-{suffix}",
                },
            }
        ]
    }

    body, status = http_post("/v1/admin/users", json.dumps(payload))

    if not assert_status("201", status, "Bulk create student user"):
        return

    if not assert_json_field(body, "data.created", "Bulk create response has created list"):
        return

    try:
        created = json.loads(body)["data"]["created"]
        created_id = created[0]["id"]
    except (KeyError, IndexError, TypeError, json.JSONDecodeError):
        log_error("Failed to extract created user id")
        return

    ADMIN_USERS_LAST_ID = created_id
    ADMIN_USERS_LAST_USERNAME = username
    ADMIN_USERS_LAST_PASSWORD = password
    log_success(f"Created student user {username} ({created_id})")


def test_admin_users_update_status() -> None:
    if not ADMIN_USERS_LAST_ID:
        log_warn("Skipping update status test (no user id)")
        return

    log_info(f"Testing PUT /api/v1/admin/users/{ADMIN_USERS_LAST_ID}/status")

    payload = json.dumps(
        {"status": "DISABLED", "reason": "Automated regression test disable"}
    )
    body, status = http_put(f"/v1/admin/users/{ADMIN_USERS_LAST_ID}/status", payload)

    if not assert_status("200", status, "Update user status"):
        return

    if not assert_json_field(body, "data.status", "Status update response has status field"):
        return

    _assert_json_equals(body, "data.status", "DISABLED", "User status updated to DISABLED")


def run_admin_user_tests() -> None:
    print("")
    print("==================================")
    print("Admin User Management Tests")
    print("==================================")

    if not _login_as(ADMIN_USERNAME, ADMIN_PASSWORD):
        log_error("Admin login failed, skipping admin user tests")
        print("")
        return

    test_admin_users_list()
    test_admin_users_bulk_create()
    test_admin_users_update_status()

    print("")


__all__ = [
    "run_admin_user_tests",
]


