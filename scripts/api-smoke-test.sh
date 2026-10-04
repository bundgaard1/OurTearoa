#!/usr/bin/env bash
# Calls every OurTearoa API endpoint and checks the HTTP status codes.
# Usage: scripts/api-smoke-test.sh [BASE_URL]
#   BASE_URL defaults to http://localhost:3000/api
#   PLACE_ID=<uuid> can be set when GET /places is not available yet.
# Requires: curl, node. Creates a throwaway user and deletes it again at the end.

BASE="${1:-http://localhost:3000/api}"
BASE="${BASE%/}"
JSON='content-type: application/json'
PASS=0
FAIL=0
SKIP=0

field() { node -e "let s='';process.stdin.on('data',c=>s+=c).on('end',()=>{try{const d=JSON.parse(s);const v=($1);console.log(v===undefined?'':v)}catch{console.log('')}})"; }

# req METHOD PATH [TOKEN] [BODY] -> sets CODE and BODY_OUT
req() {
  local method="$1" path="$2" token="${3:-}" body="${4:-}"
  local args=(-s -o /tmp/smoke_body.$$ -w '%{http_code}' -X "$method" "$BASE$path")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  [ -n "$body" ] && args+=(-H "$JSON" -d "$body")
  CODE=$(curl "${args[@]}")
  BODY_OUT=$(cat /tmp/smoke_body.$$)
}

check() {
  local name="$1" expected="$2"
  if [ "$CODE" = "$expected" ]; then
    PASS=$((PASS + 1)); printf 'PASS  %-52s %s\n' "$name" "$CODE"
  else
    FAIL=$((FAIL + 1)); printf 'FAIL  %-52s got %s, expected %s\n' "$name" "$CODE" "$expected"
  fi
}

skip() { SKIP=$((SKIP + 1)); printf 'SKIP  %-52s %s\n' "$1" "$2"; }

echo "Base URL: $BASE"
echo

req GET /health;                                   check "GET  /health" 200

STAMP="$(date +%s)$RANDOM"
EMAIL="smoke$STAMP@smoke.test"
PASSWORD="smoke-password-1"
req POST /auth/register "" "{\"email\":\"$EMAIL\",\"name\":\"Smoke Test\",\"password\":\"$PASSWORD\"}"
check "POST /auth/register" 201
USER_ID=$(echo "$BODY_OUT" | field 'd.user.id')
req POST /auth/register "" "{\"email\":\"$EMAIL\",\"name\":\"Smoke Test\",\"password\":\"$PASSWORD\"}"
check "POST /auth/register (duplicate email)" 409
req POST /auth/register "" '{"email":"x","name":"","password":"1"}'
check "POST /auth/register (invalid input)" 400
req POST /auth/login "" "{\"email\":\"$EMAIL\",\"password\":\"wrong-password\"}"
check "POST /auth/login (wrong password)" 401
req POST /auth/login "" "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
check "POST /auth/login" 200
TOKEN=$(echo "$BODY_OUT" | field 'd.token')
if [ -z "$TOKEN" ]; then
  echo; echo "No token received; cannot continue."; exit 1
fi

req GET /users/me;                                 check "GET  /users/me (no token)" 401
req GET /users/me "$TOKEN";                        check "GET  /users/me" 200
req GET "/users/$USER_ID" "$TOKEN";                check "GET  /users/:id" 200
req GET /users/does-not-exist "$TOKEN";            check "GET  /users/:id (unknown)" 404

PLACES_READY=1
req GET /places
if [ "$CODE" = "501" ]; then
  PLACES_READY=0
  skip "GET  /places and place CRUD" "not implemented yet (501), see issue #35"
else
  check "GET  /places" 200
  [ -z "${PLACE_ID:-}" ] && PLACE_ID=$(echo "$BODY_OUT" | field 'd[0] && d[0].id')
fi

if [ -z "${PLACE_ID:-}" ]; then
  skip "favorites, itinerary, reviews" "no place id: set PLACE_ID=<uuid>"
else
  if [ "$PLACES_READY" = "1" ]; then
    req GET "/places/$PLACE_ID";                   check "GET  /places/:id" 200
    req POST /places "" '{}';                      check "POST /places (no token)" 401
  fi

  req GET /favorites;                              check "GET  /favorites (no token)" 401
  req POST /favorites "$TOKEN" "{\"placeId\":\"$PLACE_ID\"}"
  check "POST /favorites" 201
  FAV_ID=$(echo "$BODY_OUT" | field 'd.id')
  req POST /favorites "$TOKEN" "{\"placeId\":\"$PLACE_ID\"}"
  check "POST /favorites (duplicate)" 409
  req GET /favorites "$TOKEN";                     check "GET  /favorites" 200
  req DELETE "/favorites/$FAV_ID" "$TOKEN";        check "DELETE /favorites/:id" 204
  req DELETE "/favorites/$FAV_ID" "$TOKEN";        check "DELETE /favorites/:id (again)" 404

  req POST /itinerary "$TOKEN" "{\"placeId\":\"$PLACE_ID\",\"startDate\":\"2026-12-01\",\"endDate\":\"2026-12-03\",\"note\":\"smoke\"}"
  check "POST /itinerary" 201
  ITIN_ID=$(echo "$BODY_OUT" | field 'd.id')
  req POST /itinerary "$TOKEN" "{\"placeId\":\"$PLACE_ID\",\"startDate\":\"2026-12-05\",\"endDate\":\"2026-12-01\"}"
  check "POST /itinerary (end before start)" 400
  req GET /itinerary "$TOKEN";                     check "GET  /itinerary" 200
  req PUT "/itinerary/$ITIN_ID" "$TOKEN" '{"note":"updated"}'
  check "PUT  /itinerary/:id" 200
  req DELETE "/itinerary/$ITIN_ID" "$TOKEN";       check "DELETE /itinerary/:id" 204

  req POST /reviews "$TOKEN" "{\"placeId\":\"$PLACE_ID\",\"rating\":6}"
  check "POST /reviews (rating out of range)" 400
  req POST /reviews "$TOKEN" "{\"placeId\":\"$PLACE_ID\",\"rating\":5,\"comment\":\"smoke test\"}"
  check "POST /reviews" 201
  REVIEW_ID=$(echo "$BODY_OUT" | field 'd.id')
  req GET "/reviews/$REVIEW_ID";                   check "GET  /reviews/:id" 200
  req GET "/places/$PLACE_ID/reviews";             check "GET  /places/:id/reviews" 200
  req PUT "/reviews/$REVIEW_ID" "$TOKEN" '{"rating":4}'
  check "PUT  /reviews/:id" 200
  req DELETE "/reviews/$REVIEW_ID" "$TOKEN";       check "DELETE /reviews/:id" 204
fi

req DELETE /users/me "$TOKEN";                     check "DELETE /users/me (cleanup)" 204
req GET /users/me "$TOKEN";                        check "GET  /users/me (after delete)" 404

rm -f /tmp/smoke_body.$$
echo
echo "Result: $PASS passed, $FAIL failed, $SKIP skipped"
[ "$FAIL" -eq 0 ]
