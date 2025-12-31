#!/usr/bin/env python3
"""
AI Assistant API tests implemented in Python.

Tests for the AI learning assistant module including:
- Chat with AI assistant (智能答疑)
- Knowledge point summary (知识点总结)
- Learning path recommendations (个性化学习路径推荐)
- Review reminders (智能笔记整理与复习提醒)
- Conversation management (对话记录管理)
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from typing import Optional, Dict, Any

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
    http_delete,
    http_patch,
    http_request,
    log_error,
    log_info,
    log_success,
    log_warn,
    save_token,
    clear_token,
)

# Test state for conversation management
AI_ASSISTANT_STATE: Dict[str, Any] = {
    "conversation_id": None,
    "course_id": None,
}


def _login_as(username: str, password: str) -> bool:
    """Login and save token."""
    payload = json.dumps({"identifier": username, "password": password})
    body, status = http_post("/auth/login", payload)

    if not assert_status("200", status, f"Login as {username}"):
        return False
    if not assert_json_field(body, "accessToken", "Login response has accessToken"):
        return False
    save_token(body)
    return True


def _assert_json_equals(json_payload: str, field: str, expected: Any, message: str) -> bool:
    """Assert that a JSON field equals an expected value."""
    if not json_payload:
        log_error(f"{message} (empty JSON payload)")
        return False
    try:
        parsed = json.loads(json_payload)
    except json.JSONDecodeError:
        log_error(f"{message} (invalid JSON payload)")
        return False

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
        return True
    else:
        actual_display = "<empty>" if actual in (None, "") else actual
        log_error(f"{message} (expected '{expected}', got '{actual_display}')")
        return False


# ==================== Chat Tests ====================

def test_chat_basic() -> None:
    """Test basic chat functionality with AI assistant."""
    global AI_ASSISTANT_STATE
    
    log_info("Testing POST /api/v1/assistant/chat (basic)")
    
    payload = {
        "messages": [
            {
                "role": "USER",
                "content": "你好，请介绍一下你自己。"
            }
        ]
    }
    
    body, status = http_post("/assistant/chat", json.dumps(payload))
    
    log_info(f"Response status: {status}")
    
    if not assert_status("200", status, "Basic chat request"):
        log_info(f"Response body: {body}")
        return
    
    if not assert_json_field(body, "data.answer", "Chat response has answer"):
        log_info(f"Response body: {body}")
        return
    
    if not assert_json_field(body, "data.conversationId", "Chat response has conversationId"):
        return
    
    # Save conversation ID for later tests
    try:
        parsed = json.loads(body)
        AI_ASSISTANT_STATE["conversation_id"] = parsed["data"]["conversationId"]
        log_info(f"Conversation ID: {AI_ASSISTANT_STATE['conversation_id']}")
    except (KeyError, json.JSONDecodeError, TypeError):
        log_warn("Could not extract conversation ID")
    
    # Check for usage info
    assert_json_field(body, "data.usage", "Chat response has usage info")


def test_chat_with_context() -> None:
    """Test chat with course context."""
    log_info("Testing POST /api/v1/assistant/chat (with context)")
    
    # First, try to get a course ID
    courses_body, courses_status = http_get("/courses?page=1&pageSize=1")
    
    course_id = None
    if courses_status == "200":
        try:
            courses = json.loads(courses_body)
            if courses.get("data") and len(courses["data"]) > 0:
                course_id = courses["data"][0].get("id")
                AI_ASSISTANT_STATE["course_id"] = course_id
                log_info(f"Using course ID: {course_id}")
        except (json.JSONDecodeError, KeyError, TypeError):
            pass
    
    payload = {
        "context": {
            "courseId": course_id
        } if course_id else None,
        "messages": [
            {
                "role": "USER",
                "content": "这门课程的主要内容是什么？"
            }
        ],
        "preferences": {
            "language": "zh-CN",
            "style": "EDUCATIONAL",
            "includeReferences": True,
            "includeSuggestions": True
        }
    }
    
    # Remove None context
    if payload["context"] is None:
        del payload["context"]
    
    body, status = http_post("/assistant/chat", json.dumps(payload))
    
    log_info(f"Response status: {status}")
    
    if not assert_status("200", status, "Chat with context request"):
        log_info(f"Response body: {body}")
        return
    
    assert_json_field(body, "data.answer", "Chat response has answer")
    
    # Check optional fields
    try:
        parsed = json.loads(body)
        data = parsed.get("data", {})
        
        if data.get("references"):
            log_success("Chat response includes references")
        else:
            log_info("Chat response has no references (expected if no context)")
            
        if data.get("suggestions"):
            log_success("Chat response includes suggestions")
        else:
            log_info("Chat response has no suggestions (expected if no context)")
    except json.JSONDecodeError:
        pass


def test_chat_empty_messages() -> None:
    """Test chat with empty messages (should fail)."""
    log_info("Testing POST /api/v1/assistant/chat (empty messages)")
    
    payload = {
        "messages": []
    }
    
    body, status = http_post("/assistant/chat", json.dumps(payload))
    
    log_info(f"Response status: {status}")
    
    assert_status("400", status, "Empty messages should return 400")


def test_chat_invalid_role() -> None:
    """Test chat with invalid message role."""
    log_info("Testing POST /api/v1/assistant/chat (invalid role)")
    
    payload = {
        "messages": [
            {
                "role": "INVALID_ROLE",
                "content": "Test message"
            }
        ]
    }
    
    body, status = http_post("/assistant/chat", json.dumps(payload))
    
    log_info(f"Response status: {status}")
    
    # Should return 400 for invalid role
    if status == "400":
        log_success("Invalid role returns 400")
    else:
        log_warn(f"Invalid role returned {status} (expected 400)")


# ==================== Convenience Endpoint Tests ====================

def test_knowledge_summary() -> None:
    """Test knowledge point summary endpoint."""
    log_info("Testing GET /api/v1/assistant/summary")
    
    course_id = AI_ASSISTANT_STATE.get("course_id")
    
    if not course_id:
        # Try to get a course
        courses_body, courses_status = http_get("/courses?page=1&pageSize=1")
        if courses_status == "200":
            try:
                courses = json.loads(courses_body)
                if courses.get("data") and len(courses["data"]) > 0:
                    course_id = courses["data"][0].get("id")
            except (json.JSONDecodeError, KeyError, TypeError):
                pass
    
    if not course_id:
        log_warn("Skipping knowledge summary test (no course available)")
        return
    
    body, status = http_get(f"/assistant/summary?courseId={course_id}")
    
    log_info(f"Response status: {status}")
    
    if not assert_status("200", status, "Knowledge summary request"):
        log_info(f"Response body: {body}")
        return
    
    assert_json_field(body, "data.answer", "Summary response has answer")


def test_learning_path() -> None:
    """Test learning path recommendation endpoint."""
    log_info("Testing GET /api/v1/assistant/learning-path")
    
    course_id = AI_ASSISTANT_STATE.get("course_id")
    
    if not course_id:
        log_warn("Skipping learning path test (no course available)")
        return
    
    body, status = http_get(f"/assistant/learning-path?courseId={course_id}")
    
    log_info(f"Response status: {status}")
    
    if not assert_status("200", status, "Learning path request"):
        log_info(f"Response body: {body}")
        return
    
    assert_json_field(body, "data.answer", "Learning path response has answer")


def test_review_reminder() -> None:
    """Test review reminder endpoint."""
    log_info("Testing GET /api/v1/assistant/review-reminder")
    
    # Test without course ID (should work for all courses)
    body, status = http_get("/assistant/review-reminder")
    
    log_info(f"Response status: {status}")
    
    if not assert_status("200", status, "Review reminder request"):
        log_info(f"Response body: {body}")
        return
    
    assert_json_field(body, "data.answer", "Review reminder response has answer")


# ==================== Conversation Management Tests ====================

def test_get_conversations() -> None:
    """Test getting conversation history."""
    log_info("Testing GET /api/v1/assistant/conversations")
    
    body, status = http_get("/assistant/conversations")
    
    log_info(f"Response status: {status}")
    
    if not assert_status("200", status, "Get conversations request"):
        log_info(f"Response body: {body}")
        return
    
    assert_json_field(body, "data", "Conversations response has data")
    
    try:
        parsed = json.loads(body)
        conversations = parsed.get("data", [])
        log_info(f"Found {len(conversations)} conversations")
    except json.JSONDecodeError:
        pass


def test_get_conversation_by_id() -> None:
    """Test getting a specific conversation."""
    conversation_id = AI_ASSISTANT_STATE.get("conversation_id")
    
    if not conversation_id:
        log_warn("Skipping get conversation test (no conversation created)")
        return
    
    log_info(f"Testing GET /api/v1/assistant/conversations/{conversation_id}")
    
    body, status = http_get(f"/assistant/conversations/{conversation_id}")
    
    log_info(f"Response status: {status}")
    
    if not assert_status("200", status, "Get conversation by ID request"):
        log_info(f"Response body: {body}")
        return
    
    assert_json_field(body, "data.id", "Conversation has id")
    assert_json_field(body, "data.title", "Conversation has title")


def test_get_conversation_messages() -> None:
    """Test getting messages of a conversation."""
    conversation_id = AI_ASSISTANT_STATE.get("conversation_id")
    
    if not conversation_id:
        log_warn("Skipping get messages test (no conversation created)")
        return
    
    log_info(f"Testing GET /api/v1/assistant/conversations/{conversation_id}/messages")
    
    body, status = http_get(f"/assistant/conversations/{conversation_id}/messages")
    
    log_info(f"Response status: {status}")
    
    if not assert_status("200", status, "Get conversation messages request"):
        log_info(f"Response body: {body}")
        return
    
    assert_json_field(body, "data", "Messages response has data")
    
    try:
        parsed = json.loads(body)
        messages = parsed.get("data", [])
        log_info(f"Found {len(messages)} messages in conversation")
        
        if len(messages) >= 2:
            log_success("Conversation has user message and AI response")
    except json.JSONDecodeError:
        pass


def test_update_conversation_title() -> None:
    """Test updating a conversation's title."""
    conversation_id = AI_ASSISTANT_STATE.get("conversation_id")
    
    if not conversation_id:
        log_warn("Skipping update conversation test (no conversation created)")
        return
    
    log_info(f"Testing PATCH /api/v1/assistant/conversations/{conversation_id}")
    
    new_title = f"Test Conversation {int(time.time())}"
    payload = json.dumps({"title": new_title})
    
    body, status = http_patch(f"/assistant/conversations/{conversation_id}", payload)
    
    log_info(f"Response status: {status}")
    
    if not assert_status("200", status, "Update conversation title request"):
        log_info(f"Response body: {body}")
        return
    
    _assert_json_equals(body, "data.title", new_title, "Conversation title updated")


def test_delete_conversation() -> None:
    """Test deleting a conversation."""
    conversation_id = AI_ASSISTANT_STATE.get("conversation_id")
    
    if not conversation_id:
        log_warn("Skipping delete conversation test (no conversation created)")
        return
    
    log_info(f"Testing DELETE /api/v1/assistant/conversations/{conversation_id}")
    
    body, status = http_delete(f"/assistant/conversations/{conversation_id}")
    
    log_info(f"Response status: {status}")
    
    if not assert_status("200", status, "Delete conversation request"):
        log_info(f"Response body: {body}")
        return
    
    assert_json_field(body, "data.deleted", "Delete response has deleted flag")
    
    # Verify it's deleted
    verify_body, verify_status = http_get(f"/assistant/conversations/{conversation_id}")
    if verify_status == "404":
        log_success("Conversation successfully deleted (returns 404)")
    else:
        log_warn(f"Deleted conversation still accessible (status: {verify_status})")
    
    # Clear the conversation ID
    AI_ASSISTANT_STATE["conversation_id"] = None


def test_clear_all_conversations() -> None:
    """Test clearing all conversations."""
    log_info("Testing DELETE /api/v1/assistant/conversations (clear all)")
    
    # First create a conversation to clear
    payload = {
        "messages": [
            {
                "role": "USER",
                "content": "这是一个测试对话，用于测试清除功能。"
            }
        ]
    }
    
    chat_body, chat_status = http_post("/assistant/chat", json.dumps(payload))
    
    if chat_status != "200":
        log_warn("Could not create test conversation for clear test")
        return
    
    # Now clear all conversations
    body, status = http_delete("/assistant/conversations")
    
    log_info(f"Response status: {status}")
    
    if not assert_status("200", status, "Clear all conversations request"):
        log_info(f"Response body: {body}")
        return
    
    assert_json_field(body, "data.deleted", "Clear response has deleted flag")
    assert_json_field(body, "data.count", "Clear response has count")
    
    try:
        parsed = json.loads(body)
        count = parsed.get("data", {}).get("count", 0)
        log_info(f"Cleared {count} conversations")
    except json.JSONDecodeError:
        pass


# ==================== Edge Case Tests ====================

def test_unauthorized_access() -> None:
    """Test that unauthorized access is blocked."""
    log_info("Testing unauthorized access to AI assistant")
    
    # Clear token temporarily
    from run_tests import TOKEN_FILE
    
    token_backup = None
    if TOKEN_FILE.exists():
        token_backup = TOKEN_FILE.read_text(encoding="utf-8")
        TOKEN_FILE.unlink()
    
    # Try to access chat without token
    payload = json.dumps({
        "messages": [{"role": "USER", "content": "Test"}]
    })
    
    body, status = http_post("/assistant/chat", payload)
    
    assert_status("401", status, "Unauthorized chat request should return 401")
    
    # Restore token
    if token_backup:
        TOKEN_FILE.write_text(token_backup, encoding="utf-8")


# ==================== Main Test Runner ====================

def run_ai_assistant_tests() -> None:
    """Run all AI assistant tests."""
    print("")
    print("==================================")
    print("AI Assistant Tests")
    print("==================================")
    
    if not _login_as(ADMIN_USERNAME, ADMIN_PASSWORD):
        log_error("Login failed, skipping AI assistant tests")
        print("")
        return
    
    # Chat tests
    print("")
    print("--- Chat Tests ---")
    test_chat_basic()
    test_chat_with_context()
    test_chat_empty_messages()
    test_chat_invalid_role()
    
    # Convenience endpoint tests
    print("")
    print("--- Convenience Endpoint Tests ---")
    test_knowledge_summary()
    test_learning_path()
    test_review_reminder()
    
    # Conversation management tests
    print("")
    print("--- Conversation Management Tests ---")
    test_get_conversations()
    test_get_conversation_by_id()
    test_get_conversation_messages()
    test_update_conversation_title()
    test_delete_conversation()
    test_clear_all_conversations()
    
    # Edge case tests
    print("")
    print("--- Edge Case Tests ---")
    test_unauthorized_access()
    
    print("")


def main() -> int:
    """Main entry point for standalone execution."""
    print("==================================")
    print("AI Assistant API Tests")
    print("==================================")
    print("")
    
    clear_token()
    run_ai_assistant_tests()
    
    from run_tests import print_summary
    success = print_summary()
    
    clear_token()
    return 0 if success else 1


__all__ = [
    "run_ai_assistant_tests",
]


if __name__ == "__main__":
    sys.exit(main())
