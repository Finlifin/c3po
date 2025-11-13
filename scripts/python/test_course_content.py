#!/usr/bin/env python3
"""
Course modules and resources API tests implemented in Python.
"""

from __future__ import annotations

import json
import random
import sys
import time
from pathlib import Path
from typing import Optional

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from run_tests import (  # type: ignore
    ADMIN_PASSWORD,
    ADMIN_USERNAME,
    assert_json_field,
    assert_status,
    http_get,
    http_post,
    log_error,
    log_info,
    log_success,
    log_warn,
    save_token,
)

COURSE_CONTENT_TEACHER_USERNAME: Optional[str] = None
COURSE_CONTENT_TEACHER_PASSWORD: Optional[str] = None
COURSE_CONTENT_COURSE_ID: Optional[str] = None
COURSE_CONTENT_MODULE_ID: Optional[str] = None


def _login(username: str, password: str) -> bool:
    payload = json.dumps({"identifier": username, "password": password})
    body, status = http_post("/auth/login", payload)

    if not assert_status("200", status, f"Login as {username}"):
        return False
    if not assert_json_field(body, "accessToken", "Login response has accessToken"):
        return False
    save_token(body)
    return True


def course_content_create_teacher() -> bool:
    global COURSE_CONTENT_TEACHER_PASSWORD, COURSE_CONTENT_TEACHER_USERNAME

    log_info("Creating temporary teacher via POST /api/v1/admin/users")
    suffix = f"{int(time.time())}{random.randint(1000, 9999)}"

    username = f"auto-teacher-{suffix}"
    email = f"auto-teacher-{suffix}@example.com"
    password = f"Teacher#{suffix}"

    payload = {
        "users": [
            {
                "username": username,
                "email": email,
                "password": password,
                "role": "TEACHER",
                "status": "ACTIVE",
                "teacherProfile": {
                    "teacherNo": f"T{suffix}",
                    "department": "Mathematics",
                    "title": "Lecturer",
                    "subjects": ["Linear Algebra", "Discrete Math"],
                },
            }
        ]
    }

    body, status = http_post("/v1/admin/users", json.dumps(payload))

    if not assert_status("201", status, "Create temporary teacher"):
        return False

    COURSE_CONTENT_TEACHER_USERNAME = username
    COURSE_CONTENT_TEACHER_PASSWORD = password
    log_success(f"Created teacher {username}")
    return True


def course_content_create_course() -> None:
    global COURSE_CONTENT_COURSE_ID

    if not COURSE_CONTENT_TEACHER_USERNAME:
        log_warn("Skipping course creation (no teacher username)")
        return

    log_info("Testing POST /api/courses as teacher")
    suffix = f"{int(time.time())}{random.randint(100, 999)}"
    payload = {
        "name": f"Automated Course {suffix}",
        "semester": "2025春",
        "credit": 3,
        "enrollLimit": 50,
    }

    body, status = http_post("/courses", json.dumps(payload))

    if not assert_status("201", status, "Create course"):
        return

    if not assert_json_field(body, "data.id", "Course creation response has id"):
        return

    try:
        COURSE_CONTENT_COURSE_ID = json.loads(body)["data"]["id"]
    except (KeyError, TypeError, json.JSONDecodeError):
        log_error("Failed to extract course id")
        return

    log_success(f"Created course {COURSE_CONTENT_COURSE_ID}")


def course_content_create_module() -> None:
    global COURSE_CONTENT_MODULE_ID

    if not COURSE_CONTENT_COURSE_ID:
        log_warn("Skipping module creation (no course id)")
        return

    log_info(f"Testing POST /api/courses/{COURSE_CONTENT_COURSE_ID}/modules")
    payload = {
        "title": "第 1 周 · 自动化测试章节",
        "displayOrder": 1,
        "releaseAt": "2025-09-01T00:00:00Z",
    }

    body, status = http_post(
        f"/courses/{COURSE_CONTENT_COURSE_ID}/modules", json.dumps(payload)
    )

    if not assert_status("200", status, "Create course module"):
        return

    if not assert_json_field(body, "data.id", "Module creation response has id"):
        return

    try:
        COURSE_CONTENT_MODULE_ID = json.loads(body)["data"]["id"]
    except (KeyError, TypeError, json.JSONDecodeError):
        log_error("Failed to extract module id")
        return

    log_success(f"Created module {COURSE_CONTENT_MODULE_ID}")


def course_content_get_modules() -> None:
    if not COURSE_CONTENT_COURSE_ID:
        log_warn("Skipping GET modules test (no course id)")
        return

    log_info(f"Testing GET /api/courses/{COURSE_CONTENT_COURSE_ID}/modules")
    body, status = http_get(f"/courses/{COURSE_CONTENT_COURSE_ID}/modules")

    if not assert_status("200", status, "List course modules"):
        return

    if not assert_json_field(body, "data", "Modules list has data"):
        return

    if COURSE_CONTENT_MODULE_ID:
        try:
            parsed = json.loads(body)
            matches = [
                item
                for item in parsed.get("data", [])
                if item.get("id") == COURSE_CONTENT_MODULE_ID
            ]
            if matches:
                log_success(
                    f"Modules list contains created module ({matches[0].get('title')})"
                )
            else:
                log_warn("Created module not found in list response")
        except json.JSONDecodeError:
            log_warn("Unable to parse modules list response")


def run_course_content_tests() -> None:
    print("")
    print("==================================")
    print("Course Content Tests")
    print("==================================")

    if not _login(ADMIN_USERNAME, ADMIN_PASSWORD):
        log_error("Admin login failed, skipping course content tests")
        print("")
        return

    if not course_content_create_teacher():
        print("")
        return

    if not _login(COURSE_CONTENT_TEACHER_USERNAME or "", COURSE_CONTENT_TEACHER_PASSWORD or ""):
        log_error("Teacher login failed, skipping course content tests")
        print("")
        return

    course_content_create_course()
    course_content_create_module()
    course_content_get_modules()

    _login(ADMIN_USERNAME, ADMIN_PASSWORD)

    print("")


__all__ = [
    "run_course_content_tests",
]


