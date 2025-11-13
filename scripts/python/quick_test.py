#!/usr/bin/env python3
"""
Quick diagnostic script for checking API connectivity (Python).
"""

from __future__ import annotations

import os
import sys
import urllib.error
import urllib.request
from typing import Tuple


API_BASE = os.environ.get("C3PO_API_BASE_URL", "http://localhost:8080")
MAX_LINES = 50


def request(method: str, url: str, payload: str | None = None) -> Tuple[str, str]:
    data = payload.encode("utf-8") if payload is not None else None
    headers = {"Content-Type": "application/json"}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            body = response.read().decode("utf-8", errors="replace")
            status = str(response.getcode())
            return status, body
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        return str(exc.code), body
    except urllib.error.URLError as exc:
        return "000", f"Request failed: {exc.reason}"


def preview(text: str, limit: int = MAX_LINES) -> str:
    lines = text.splitlines()
    preview_lines = lines[:limit]
    if len(lines) > limit:
        preview_lines.append("... (output truncated)")
    return "\n".join(preview_lines)


def main() -> int:
    print("==================================")
    print("Quick Diagnostic Test")
    print("==================================")
    print("")

    print("1. Testing server health...")
    status, body = request("GET", f"{API_BASE}/actuator/health")
    print("Health check response:")
    print(preview(f"HTTP {status}\n{body}"))
    print("")

    login_payload = '{"identifier":"admin","password":"admin123"}'

    print("2. Testing /api/v1/auth/login endpoint...")
    print(f"URL: {API_BASE}/api/v1/auth/login")
    print(f"Payload: {login_payload}")
    print("")
    status, body = request("POST", f"{API_BASE}/api/v1/auth/login", payload=login_payload)
    print("Response:")
    print(preview(f"HTTP {status}\n{body}"))
    print("")

    print("3. Testing if /auth/login works (without /api/v1 prefix)...")
    print(f"URL: {API_BASE}/auth/login")
    status, body = request("POST", f"{API_BASE}/auth/login", payload=login_payload)
    print("Response:")
    print(preview(f"HTTP {status}\n{body}"))
    print("")

    print("==================================")
    print("Diagnostic Complete")
    print("==================================")

    return 0


if __name__ == "__main__":
    sys.exit(main())


