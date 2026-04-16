#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

assert_file_exists() {
  local path="$1"
  [ -f "$path" ] || fail "Expected file to exist: $path"
}

assert_path_missing() {
  local path="$1"
  [ ! -e "$path" ] || fail "Expected path to be absent: $path"
}

assert_not_symlink() {
  local path="$1"
  [ ! -L "$path" ] || fail "Expected regular file, found symlink: $path"
}

assert_file_contains() {
  local path="$1" needle="$2"
  grep -Fq "$needle" "$path" || fail "Expected '$needle' in $path"
}

TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

TMP_HOME_FULL="$TMP_ROOT/full"
mkdir -p "$TMP_HOME_FULL/.cursor"

HOME="$TMP_HOME_FULL" "$REPO_DIR/setup.sh" --agent cursor --yes >/dev/null

RULE_FILE="$TMP_HOME_FULL/.cursor/rules/coding-principles.mdc"
ROUTING_FILE="$TMP_HOME_FULL/.cursor/rules/workflow-routing.mdc"
SKILL_FILE="$TMP_HOME_FULL/.cursor/skills-cursor/investigate-debug/SKILL.md"

assert_file_exists "$RULE_FILE"
assert_not_symlink "$RULE_FILE"
assert_file_contains "$RULE_FILE" "description: 'Coding Principles'"
assert_file_contains "$RULE_FILE" "alwaysApply: true"
assert_file_contains "$RULE_FILE" "<!-- ai-instructions:managed -->"
assert_file_contains "$RULE_FILE" "# Coding Principles"

assert_file_exists "$ROUTING_FILE"
assert_not_symlink "$ROUTING_FILE"
assert_file_contains "$ROUTING_FILE" "description: 'Workflow Routing'"
assert_file_contains "$ROUTING_FILE" "alwaysApply: true"
assert_file_contains "$ROUTING_FILE" "$SKILL_FILE"

assert_file_exists "$SKILL_FILE"

HOME="$TMP_HOME_FULL" "$REPO_DIR/setup.sh" check --agent cursor --yes >/dev/null
HOME="$TMP_HOME_FULL" "$REPO_DIR/setup.sh" list --agent cursor --yes >"$TMP_HOME_FULL/list.log"
assert_file_contains "$TMP_HOME_FULL/list.log" "$RULE_FILE (cursor rule)"

rm "$SKILL_FILE"

if HOME="$TMP_HOME_FULL" "$REPO_DIR/setup.sh" check --agent cursor --yes >"$TMP_HOME_FULL/check.log" 2>&1; then
  fail "Expected check to fail when a workflow-routing target is missing"
fi

assert_file_contains "$TMP_HOME_FULL/check.log" "workflow-routing target missing: $SKILL_FILE"

TMP_HOME_PARTIAL="$TMP_ROOT/partial"
mkdir -p "$TMP_HOME_PARTIAL/.cursor"

HOME="$TMP_HOME_PARTIAL" "$REPO_DIR/setup.sh" --agent cursor --only instructions --yes >"$TMP_HOME_PARTIAL/install.log" 2>&1

assert_file_exists "$TMP_HOME_PARTIAL/.cursor/rules/workflow-routing.mdc"
assert_file_contains "$TMP_HOME_PARTIAL/install.log" "workflow-routing references missing skill target"

if HOME="$TMP_HOME_PARTIAL" "$REPO_DIR/setup.sh" check --agent cursor --only instructions --yes >"$TMP_HOME_PARTIAL/check.log" 2>&1; then
  fail "Expected instructions-only check to fail while routing targets are missing"
fi

assert_file_contains "$TMP_HOME_PARTIAL/check.log" "workflow-routing target missing"

TMP_HOME_MIGRATION="$TMP_ROOT/migration"
mkdir -p "$TMP_HOME_MIGRATION/.cursor/rules"
ln -s "$REPO_DIR/instructions/coding-principles.md" "$TMP_HOME_MIGRATION/.cursor/rules/coding-principles.mdc"

HOME="$TMP_HOME_MIGRATION" "$REPO_DIR/setup.sh" --agent cursor --yes >/dev/null

assert_file_exists "$TMP_HOME_MIGRATION/.cursor/rules/coding-principles.mdc"
assert_not_symlink "$TMP_HOME_MIGRATION/.cursor/rules/coding-principles.mdc"
assert_file_contains "$TMP_HOME_MIGRATION/.cursor/rules/coding-principles.mdc" "alwaysApply: true"

TMP_HOME_COPY="$TMP_ROOT/copy"
mkdir -p "$TMP_HOME_COPY/.cursor"

HOME="$TMP_HOME_COPY" "$REPO_DIR/setup.sh" --agent cursor --copy --yes >/dev/null
assert_file_exists "$TMP_HOME_COPY/.cursor/rules/coding-principles.mdc"
assert_not_symlink "$TMP_HOME_COPY/.cursor/rules/coding-principles.mdc"
HOME="$TMP_HOME_COPY" "$REPO_DIR/setup.sh" check --agent cursor --yes >/dev/null
HOME="$TMP_HOME_COPY" "$REPO_DIR/setup.sh" remove --agent cursor --yes >/dev/null
assert_path_missing "$TMP_HOME_COPY/.cursor/rules/coding-principles.mdc"
assert_path_missing "$TMP_HOME_COPY/.cursor/rules/workflow-routing.mdc"
assert_path_missing "$TMP_HOME_COPY/.cursor/skills-cursor/investigate-debug/SKILL.md"

echo "cursor installer regression test passed"
