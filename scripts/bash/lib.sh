#!/usr/bin/env bash
# API testing helper functions for Bash scripts

# shellcheck source=/dev/null
source "$(dirname "${BASH_SOURCE[0]}")/config.sh"

log_info() {
  printf '%b(INFO)%b %s\n' "$COLOR_BLUE" "$COLOR_RESET" "$*"
}

log_success() {
  printf '%b(✓)%b %s\n' "$COLOR_GREEN" "$COLOR_RESET" "$*"
  TESTS_PASSED=$((TESTS_PASSED + 1))
}

log_error() {
  printf '%b(✗)%b %s\n' "$COLOR_RED" "$COLOR_RESET" "$*"
  TESTS_FAILED=$((TESTS_FAILED + 1))
}

log_warn() {
  printf '%b(WARN)%b %s\n' "$COLOR_YELLOW" "$COLOR_RESET" "$*"
}

_build_url() {
  local path="$1"
  if [[ "$path" == /* ]]; then
    printf '%s%s' "${API_BASE_URL%/}" "$path"
  else
    printf '%s/%s' "${API_BASE_URL%/}" "$path"
  fi
}

_maybe_token() {
  if [[ -f "$TOKEN_FILE" ]]; then
    tr -d '\r' <"$TOKEN_FILE"
  fi
}

_curl_common_args() {
  local token
  token="$(_maybe_token)"
  local -a args=(-sS "-w" $'\n%{http_code}' "--max-time" "$API_TIMEOUT" "-H" "Content-Type: application/json")
  if [[ -n "$token" ]]; then
    args+=("-H" "Authorization: Bearer $token")
  fi
  printf '%s\0' "${args[@]}"
}

http_get() {
  local path="$1"
  local url
  url="$(_build_url "$path")"
  mapfile -d '' -t args < <(_curl_common_args)
  curl "${args[@]}" "$url"
}

http_post() {
  local path="$1"
  local data="$2"
  local url
  url="$(_build_url "$path")"
  mapfile -d '' -t args < <(_curl_common_args)
  curl "${args[@]}" -X POST --data-raw "$data" "$url"
}

http_put() {
  local path="$1"
  local data="$2"
  local url
  url="$(_build_url "$path")"
  mapfile -d '' -t args < <(_curl_common_args)
  curl "${args[@]}" -X PUT --data-raw "$data" "$url"
}

http_delete() {
  local path="$1"
  local url
  url="$(_build_url "$path")"
  mapfile -d '' -t args < <(_curl_common_args)
  curl "${args[@]}" -X DELETE "$url"
}

parse_response() {
  local raw="$1"
  local -a lines
  IFS=$'\n' read -r -d '' -a lines <<<"$raw"$'\0'
  if ((${#lines[@]} == 0)); then
    HTTP_BODY=""
    HTTP_STATUS="000"
    return
  fi
  HTTP_STATUS="${lines[-1]}"
  unset 'lines[-1]'
  HTTP_BODY=""
  if ((${#lines[@]} > 0)); then
    HTTP_BODY="$(printf '%s\n' "${lines[@]}")"
    HTTP_BODY="${HTTP_BODY%$'\n'}"
  fi
}

assert_status() {
  local expected="$1"
  local actual="$2"
  local message="$3"
  if [[ "$actual" == "$expected" ]]; then
    log_success "$message (HTTP $actual)"
    return 0
  else
    log_error "$message (Expected HTTP $expected, got $actual)"
    return 1
  fi
}

assert_json_field() {
  local json="$1"
  local field="$2"
  local message="$3"
  if [[ -z "$json" ]]; then
    log_error "$message (empty JSON payload)"
    return 1
  fi
  if echo "$json" | jq -e ".${field}" >/dev/null 2>&1; then
    log_success "$message (field '${field}' exists)"
    return 0
  else
    log_error "$message (field '${field}' missing)"
    return 1
  fi
}

save_token() {
  local json="$1"
  local token
  token="$(echo "$json" | jq -r '.accessToken // empty')"
  if [[ -n "$token" ]]; then
    printf '%s' "$token" >"$TOKEN_FILE"
    log_info "Token saved"
    return 0
  else
    log_error "No token in response"
    return 1
  fi
}

clear_token() {
  rm -f "$TOKEN_FILE"
  log_info "Token cleared"
}

print_summary() {
  printf '\n==================================\n'
  printf 'Test Summary\n'
  printf '==================================\n'
  printf 'Passed: %b%s%b\n' "$COLOR_GREEN" "$TESTS_PASSED" "$COLOR_RESET"
  printf 'Failed: %b%s%b\n' "$COLOR_RED" "$TESTS_FAILED" "$COLOR_RESET"
  printf 'Total:  %d\n' "$((TESTS_PASSED + TESTS_FAILED))"
  printf '==================================\n'
  if ((TESTS_FAILED == 0)); then
    return 0
  fi
  return 1
}

