#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

test_endpoint() {
  local name="$1"
  local method="$2"
  local path="$3"
  local expected_status="$4"
  local jq_filter="${5:-}"
  local expected_value="${6:-}"
  local data="${7:-}"

  local curl_args=(-k -s -w '\n%{http_code}' -X "$method" "$BASE_URL$path" -H 'Content-Type: application/json')
  if [[ -n "${CURRENT_TOKEN:-}" ]]; then
    curl_args+=(-H "Authorization: Bearer $CURRENT_TOKEN")
  fi
  if [[ -n "$data" ]]; then
    curl_args+=(-d "$data")
  fi

  local response
  response=$(curl "${curl_args[@]}" 2>/dev/null)

  local http_code
  http_code=$(echo "$response" | tail -n1)

  local body
  body=$(echo "$response" | sed '$d')

  local status_ok=false
  local value_ok=false

  if [[ "$http_code" == "$expected_status" ]]; then
    status_ok=true
  fi

  if [[ -n "$jq_filter" ]]; then
    local actual
    actual=$(echo "$body" | jq -r "$jq_filter" 2>/dev/null || echo "__ERROR__")
    if [[ "$actual" == "$expected_value" ]]; then
      value_ok=true
    fi
  else
    value_ok=true
  fi

  if $status_ok && $value_ok; then
    echo -e "${GREEN}PASS${NC} [$http_code] $name" >&2
    PASS=$((PASS + 1))
  else
    echo -e "${RED}FAIL${NC} [$http_code expected $expected_status] $name" >&2
    if ! $status_ok; then
      echo -e "  ${RED}-> Status mismatch: got $http_code, expected $expected_status${NC}" >&2
    fi
    if ! $value_ok; then
      local actual_val
      actual_val=$(echo "$body" | jq -r "$jq_filter" 2>/dev/null || echo "__PARSE_ERROR__")
      echo -e "  ${RED}-> Value mismatch for '$jq_filter': got '$actual_val', expected '$expected_value'${NC}" >&2
    fi
    echo -e "  ${YELLOW}Response body:${NC} $(echo "$body" | head -c 300)" >&2
    FAIL=$((FAIL + 1))
  fi

  printf '%s' "$body"
}

echo "══════════════════════════════════════════════════════════"
echo "  Express Quiz App — API Test Suite"
echo "  Target: $BASE_URL"
echo "══════════════════════════════════════════════════════════"
echo ""

register_user() {
  local username="$1"
  local password="$2"
  local admin="$3"
  curl -k -s -X POST "$BASE_URL/users/signup" \
    -H 'Content-Type: application/json' \
    -d "{\"username\":\"$username\",\"password\":\"$password\",\"admin\":$admin}" >/dev/null || true
}

login_user() {
  local username="$1"
  local password="$2"
  local res
  res=$(curl -k -s -X POST "$BASE_URL/users/login" \
    -H 'Content-Type: application/json' \
    -d "{\"username\":\"$username\",\"password\":\"$password\"}")
  echo "$res" | jq -r '.token // empty'
}

echo "--- Registering/Logging in Users ---"
register_user "adminuser" "adminpass" "true"
register_user "authoruser" "authorpass" "false"
register_user "otheruser" "otherpass" "false"

ADMIN_TOKEN=$(login_user "adminuser" "adminpass")
AUTHOR_TOKEN=$(login_user "authoruser" "authorpass")
OTHER_TOKEN=$(login_user "otheruser" "otherpass")

if [[ -z "$ADMIN_TOKEN" || -z "$AUTHOR_TOKEN" || -z "$OTHER_TOKEN" ]]; then
  echo -e "${RED}Failed to log in test users!${NC}"
  exit 1
fi
echo "Successfully logged in admin, author, and other test users."
echo ""

# ═══════════════════════════════════════════════
# PHASE 1: Question CRUD
# ═══════════════════════════════════════════════
echo -e "${YELLOW}── Phase 1: Question CRUD ──${NC}"
echo ""

CURRENT_TOKEN="$AUTHOR_TOKEN"
# Test 1
echo "--- Test 1: POST /question (capital #1) ---"
BODY=$(test_endpoint "Create question with keyword capital" \
  POST "/question" 201 \
  ".text" "What is the capital of France?" \
  '{"text":"What is the capital of France?","options":["Berlin","Madrid","Paris","Rome"],"keywords":["capital","geography"],"correctAnswerIndex":2}')
Q1_ID=$(echo "$BODY" | jq -r '._id')
echo "  Q1_ID=$Q1_ID"

# Test 2
echo "--- Test 2: POST /question (capital #2) ---"
BODY=$(test_endpoint "Create second capital question" \
  POST "/question" 201 \
  ".text" "What is the capital of Japan?" \
  '{"text":"What is the capital of Japan?","options":["Seoul","Beijing","Tokyo","Bangkok"],"keywords":["capital","asia"],"correctAnswerIndex":2}')
Q2_ID=$(echo "$BODY" | jq -r '._id')
echo "  Q2_ID=$Q2_ID"

# Test 3
echo "--- Test 3: POST /question (science) ---"
BODY=$(test_endpoint "Create science question (no capital)" \
  POST "/question" 201 \
  ".text" "What is the chemical symbol for water?" \
  '{"text":"What is the chemical symbol for water?","options":["CO2","H2O","O2","NaCl"],"keywords":["science","chemistry"],"correctAnswerIndex":1}')
Q3_ID=$(echo "$BODY" | jq -r '._id')
echo "  Q3_ID=$Q3_ID"

CURRENT_TOKEN=""
# Test 4
echo "--- Test 4: GET /question (all) ---"
test_endpoint "Get all questions returns array" \
  GET "/question" 200 \
  "length >= 3" "true" > /dev/null

# Test 5
echo "--- Test 5: GET /question/:id ---"
test_endpoint "Get question by ID returns correct text" \
  GET "/question/$Q1_ID" 200 \
  ".text" "What is the capital of France?" > /dev/null

# Test 6
echo "--- Test 6: GET /question/:id — keyword check ---"
test_endpoint "Question has capital in keywords" \
  GET "/question/$Q1_ID" 200 \
  '.keywords | contains(["capital"])' "true" > /dev/null

# Test 7
echo "--- Test 7: PUT /question/:id ---"
CURRENT_TOKEN="$AUTHOR_TOKEN"
test_endpoint "Update question text" \
  PUT "/question/$Q1_ID" 200 \
  ".text" "What is the capital of France? (UPDATED)" \
  '{"text":"What is the capital of France? (UPDATED)","options":["Berlin","Madrid","Paris","Rome"],"keywords":["capital","geography","updated"],"correctAnswerIndex":2}' > /dev/null

# Test 8
echo "--- Test 8: GET /question/:id (verify update) ---"
CURRENT_TOKEN=""
test_endpoint "Verify updated question persisted" \
  GET "/question/$Q1_ID" 200 \
  ".text" "What is the capital of France? (UPDATED)" > /dev/null

# Test 9
echo "--- Test 9: DELETE /question/:id ---"
CURRENT_TOKEN="$AUTHOR_TOKEN"
test_endpoint "Delete science question" \
  DELETE "/question/$Q3_ID" 200 \
  ".message" "Question deleted" > /dev/null

# Test 10
echo "--- Test 10: GET /question/:id (verify 404) ---"
CURRENT_TOKEN=""
test_endpoint "Fetch deleted question returns 404" \
  GET "/question/$Q3_ID" 404 \
  ".message" "Question not found" > /dev/null

echo ""

# ═══════════════════════════════════════════════
# PHASE 2: Quiz CRUD
# ═══════════════════════════════════════════════
echo -e "${YELLOW}── Phase 2: Quiz CRUD ──${NC}"
echo ""

# Test 11
echo "--- Test 11: POST /quizzes ---"
CURRENT_TOKEN="$ADMIN_TOKEN"
BODY=$(test_endpoint "Create a quiz" \
  POST "/quizzes" 201 \
  ".title" "Capital Cities Quiz" \
  '{"title":"Capital Cities Quiz","description":"A quiz about world capitals"}')
QUIZ_ID=$(echo "$BODY" | jq -r '._id')
echo "  QUIZ_ID=$QUIZ_ID"

# Test 12
echo "--- Test 12: GET /quizzes ---"
CURRENT_TOKEN=""
test_endpoint "Get all quizzes returns array" \
  GET "/quizzes" 200 \
  "length >= 1" "true" > /dev/null

# Test 13
echo "--- Test 13: GET /quizzes/:id ---"
test_endpoint "Get quiz by ID returns correct title" \
  GET "/quizzes/$QUIZ_ID" 200 \
  ".title" "Capital Cities Quiz" > /dev/null

# Test 14
echo "--- Test 14: GET /quizzes/:id/populate ---"
test_endpoint "Populate quiz with capital keyword questions" \
  GET "/quizzes/$QUIZ_ID/populate" 200 \
  '.questions | length >= 2' "true" > /dev/null

# Test 15
echo "--- Test 15: GET /quizzes/:id (verify populated) ---"
BODY=$(test_endpoint "Quiz now has populated questions" \
  GET "/quizzes/$QUIZ_ID" 200 \
  '.questions | length >= 2' "true")
QUESTIONS_COUNT=$(echo "$BODY" | jq '.questions | length')
echo "  Questions in quiz: $QUESTIONS_COUNT"
FIRST_Q_TEXT=$(echo "$BODY" | jq -r '.questions[0].text')
if [[ -n "$FIRST_Q_TEXT" && "$FIRST_Q_TEXT" != "null" ]]; then
  echo -e "  ${GREEN}-> Questions are populated (first: '$FIRST_Q_TEXT')${NC}"
else
  echo -e "  ${RED}-> Questions NOT populated!${NC}"
fi

# Test 16
echo "--- Test 16: POST /quizzes/:id/question ---"
CURRENT_TOKEN="$ADMIN_TOKEN"
test_endpoint "Add single question to quiz" \
  POST "/quizzes/$QUIZ_ID/question" 201 \
  '.questions | length > '"$QUESTIONS_COUNT" "true" \
  '{"text":"What is the capital of Brazil?","options":["Rio","São Paulo","Brasília","Salvador"],"keywords":["capital","south america"],"correctAnswerIndex":2}' > /dev/null

# Test 17
echo "--- Test 17: POST /quizzes/:id/questions ---"
CURRENT_TOKEN="$ADMIN_TOKEN"
test_endpoint "Add multiple questions to quiz" \
  POST "/quizzes/$QUIZ_ID/questions" 201 \
  '.questions | length > '"$((QUESTIONS_COUNT + 1))" "true" \
  '{"questions":[{"text":"What is the capital of Australia?","options":["Sydney","Melbourne","Canberra","Perth"],"keywords":["capital","oceania"],"correctAnswerIndex":2},{"text":"What is the capital of Canada?","options":["Toronto","Vancouver","Ottawa","Montreal"],"keywords":["capital","north america"],"correctAnswerIndex":2}]}' > /dev/null

# Test 18
echo "--- Test 18: PUT /quizzes/:id ---"
CURRENT_TOKEN="$ADMIN_TOKEN"
test_endpoint "Update quiz title" \
  PUT "/quizzes/$QUIZ_ID" 200 \
  ".title" "World Capitals Quiz (Updated)" \
  '{"title":"World Capitals Quiz (Updated)","description":"Updated description of world capitals quiz"}' > /dev/null

# Test 19
echo "--- Test 19: GET /quizzes/:id (verify update) ---"
CURRENT_TOKEN=""
test_endpoint "Verify quiz update persisted" \
  GET "/quizzes/$QUIZ_ID" 200 \
  ".title" "World Capitals Quiz (Updated)" > /dev/null

echo ""

# ═══════════════════════════════════════════════
# PHASE 3: Deletion & Cleanup
# ═══════════════════════════════════════════════
echo -e "${YELLOW}── Phase 3: Deletion & Cleanup ──${NC}"
echo ""

# Test 20
echo "--- Test 20: DELETE /quizzes/:id ---"
CURRENT_TOKEN="$ADMIN_TOKEN"
test_endpoint "Delete quiz" \
  DELETE "/quizzes/$QUIZ_ID" 200 \
  ".message" "Quiz deleted" > /dev/null

# Test 21
echo "--- Test 21: GET /quizzes/:id (verify 404) ---"
CURRENT_TOKEN=""
test_endpoint "Fetch deleted quiz returns 404" \
  GET "/quizzes/$QUIZ_ID" 404 \
  ".message" "Quiz not found" > /dev/null

# Test 22
echo "--- Test 22: GET /quizzes/:id/populate (404 on deleted) ---"
test_endpoint "Populate on deleted quiz returns 404" \
  GET "/quizzes/$QUIZ_ID/populate" 404 \
  ".message" "Quiz not found" > /dev/null

# Cleanup
echo ""
echo "--- Cleanup: Deleting remaining questions (expect 404 as already deleted by quiz delete) ---"
CURRENT_TOKEN="$AUTHOR_TOKEN"
test_endpoint "Delete Q1" DELETE "/question/$Q1_ID" 404 ".message" "Question not found" > /dev/null
test_endpoint "Delete Q2" DELETE "/question/$Q2_ID" 404 ".message" "Question not found" > /dev/null

echo ""
echo "--- Final 404 checks ---"
CURRENT_TOKEN=""
test_endpoint "Q1 returns 404 after delete" GET "/question/$Q1_ID" 404 ".message" "Question not found" > /dev/null
test_endpoint "Q2 returns 404 after delete" GET "/question/$Q2_ID" 404 ".message" "Question not found" > /dev/null

echo ""
echo -e "${YELLOW}── Phase 4: Authentication & Authorization Verification ──${NC}"
echo ""

# Test 23: Admin tries GET /users (Should pass 200)
echo "--- Test 23: GET /users as Admin ---"
CURRENT_TOKEN="$ADMIN_TOKEN"
test_endpoint "GET /users as Admin" GET "/users" 200

# Test 24: Ordinary user tries GET /users (Should fail 403)
echo "--- Test 24: GET /users as Regular User (Forbidden) ---"
CURRENT_TOKEN="$AUTHOR_TOKEN"
test_endpoint "GET /users as Regular User returns 403" GET "/users" 403 ".message" "You are not authorized to perform this operation!"

# Test 25: Unauthorized user tries GET /users (Should fail 401)
echo "--- Test 25: GET /users without Token (Unauthorized) ---"
CURRENT_TOKEN=""
test_endpoint "GET /users without Token returns 401" GET "/users" 401

# Test 26: Create a new question and verify another user cannot update it (Should fail 403)
echo "--- Test 26: Update question created by author as otheruser ---"
# First create a new question with AUTHOR_TOKEN
CURRENT_TOKEN="$AUTHOR_TOKEN"
BODY=$(test_endpoint "Create a question to test other user update restriction" \
  POST "/question" 201 \
  ".text" "Question for update restriction test" \
  '{"text":"Question for update restriction test","options":["A","B"],"keywords":["test"],"correctAnswerIndex":0}')
RESTRICT_Q_ID=$(echo "$BODY" | jq -r '._id')

# Try updating this question using OTHER_TOKEN
CURRENT_TOKEN="$OTHER_TOKEN"
test_endpoint "Update question by non-author returns 403" \
  PUT "/question/$RESTRICT_Q_ID" 403 \
  ".message" "You are not the author of this question" \
  '{"text":"Trying to hack updated text","options":["A","B"],"keywords":["test"],"correctAnswerIndex":0}'

# Try deleting this question using ADMIN_TOKEN
CURRENT_TOKEN="$ADMIN_TOKEN"
test_endpoint "Delete question by Admin (non-author) returns 403" \
  DELETE "/question/$RESTRICT_Q_ID" 403 \
  ".message" "You are not the author of this question"

# Finally, cleanup the restriction test question using AUTHOR_TOKEN
CURRENT_TOKEN="$AUTHOR_TOKEN"
test_endpoint "Delete question by actual author" DELETE "/question/$RESTRICT_Q_ID" 200 ".message" "Question deleted"
CURRENT_TOKEN=""

# ═══════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════
echo ""
echo "══════════════════════════════════════════════════════════"
TOTAL=$((PASS + FAIL))
echo -e "  Results: ${GREEN}$PASS PASSED${NC} / ${RED}$FAIL FAILED${NC} / $TOTAL TOTAL"
if [[ $FAIL -eq 0 ]]; then
  echo -e "  ${GREEN}All tests passed! ✓${NC}"
else
  echo -e "  ${RED}Some tests failed ✗${NC}"
fi
echo "══════════════════════════════════════════════════════════"

exit $FAIL
