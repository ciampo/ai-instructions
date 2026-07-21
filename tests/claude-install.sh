#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

assert_file_contains() {
  local path="$1" needle="$2"
  grep -Fq -- "$needle" "$path" || fail "Expected '$needle' in $path"
}

assert_file_not_contains() {
  local path="$1" needle="$2"
  if grep -Fq -- "$needle" "$path"; then
    fail "Did not expect '$needle' in $path"
  fi
}

TMP_HOME="$(mktemp -d "${TMPDIR:-/tmp}/claude-install.XXXXXX")"
trap 'rm -rf "$TMP_HOME"' EXIT

ROUTING_FILE="$TMP_HOME/.claude/rules/workflow-routing.md"
mkdir -p "$(dirname "$ROUTING_FILE")"
printf '# User routing\n' > "$ROUTING_FILE"

HOME="$TMP_HOME" "$REPO_DIR/setup.sh" --agent claude --yes >/dev/null
HOME="$TMP_HOME" "$REPO_DIR/setup.sh" check --agent claude --yes >"$TMP_HOME/check.log" 2>&1
assert_file_not_contains "$TMP_HOME/check.log" "workflow-routing.md"
assert_file_contains "$ROUTING_FILE" "# User routing"

echo "claude installer regression test passed"
