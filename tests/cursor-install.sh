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
  grep -Fq -- "$needle" "$path" || fail "Expected '$needle' in $path"
}

TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/cursor-install.XXXXXX")"
trap 'rm -rf "$TMP_ROOT"' EXIT

TMP_HOME_FULL="$TMP_ROOT/full"
mkdir -p "$TMP_HOME_FULL/.cursor"

HOME="$TMP_HOME_FULL" "$REPO_DIR/setup.sh" --agent cursor --yes >/dev/null

RULE_FILE="$TMP_HOME_FULL/.cursor/rules/core.mdc"
SKILL_FILE="$TMP_HOME_FULL/.cursor/skills/investigate-debug/SKILL.md"

assert_file_exists "$RULE_FILE"
assert_not_symlink "$RULE_FILE"
assert_file_contains "$RULE_FILE" "description: 'Core Instructions'"
assert_file_contains "$RULE_FILE" "alwaysApply: true"
assert_file_contains "$RULE_FILE" "<!-- ai-instructions:managed -->"
assert_file_contains "$RULE_FILE" "# Core Instructions"

assert_file_exists "$SKILL_FILE"
assert_file_contains "$SKILL_FILE" "name: investigate-debug"

HOME="$TMP_HOME_FULL" "$REPO_DIR/setup.sh" check --agent cursor --yes >/dev/null
HOME="$TMP_HOME_FULL" "$REPO_DIR/setup.sh" list --agent cursor --yes >"$TMP_HOME_FULL/list.log"
assert_file_contains "$TMP_HOME_FULL/list.log" "core.mdc (cursor rule)"

printf '\n# stale\n' >> "$RULE_FILE"

if HOME="$TMP_HOME_FULL" "$REPO_DIR/setup.sh" check --agent cursor --yes >"$TMP_HOME_FULL/stale-check.log" 2>&1; then
  fail "Expected check to fail when a generated Cursor rule is out of date"
fi

assert_file_contains "$TMP_HOME_FULL/stale-check.log" "core.mdc (cursor rule) (out of date)"
HOME="$TMP_HOME_FULL" "$REPO_DIR/setup.sh" update --agent cursor --yes >/dev/null

TMP_HOME_PARTIAL="$TMP_ROOT/partial"
mkdir -p "$TMP_HOME_PARTIAL/.cursor"

HOME="$TMP_HOME_PARTIAL" "$REPO_DIR/setup.sh" --agent cursor --only instructions --yes >"$TMP_HOME_PARTIAL/install.log" 2>&1

assert_file_exists "$TMP_HOME_PARTIAL/.cursor/rules/core.mdc"
assert_path_missing "$TMP_HOME_PARTIAL/.cursor/skills/investigate-debug/SKILL.md"
HOME="$TMP_HOME_PARTIAL" "$REPO_DIR/setup.sh" check --agent cursor --only instructions --yes >/dev/null

TMP_HOME_CLEAN="$TMP_ROOT/clean"
mkdir -p "$TMP_HOME_CLEAN/.cursor"
if HOME="$TMP_HOME_CLEAN" "$REPO_DIR/setup.sh" check --agent cursor --yes >/dev/null 2>&1; then
  fail "Expected check to fail when managed Cursor artifacts are missing"
fi

TMP_HOME_MIGRATION="$TMP_ROOT/migration"
mkdir -p "$TMP_HOME_MIGRATION/.cursor/rules"
ln -s "$REPO_DIR/instructions/core.md" "$TMP_HOME_MIGRATION/.cursor/rules/core.mdc"
ln -s "$REPO_DIR/instructions/core.md" "$TMP_HOME_MIGRATION/.cursor/rules/coding-principles.mdc"

HOME="$TMP_HOME_MIGRATION" "$REPO_DIR/setup.sh" --agent cursor --yes >/dev/null

assert_file_exists "$TMP_HOME_MIGRATION/.cursor/rules/core.mdc"
assert_not_symlink "$TMP_HOME_MIGRATION/.cursor/rules/core.mdc"
assert_file_contains "$TMP_HOME_MIGRATION/.cursor/rules/core.mdc" "alwaysApply: true"

cat > "$TMP_HOME_MIGRATION/.cursor/rules/core.mdc" <<'EOF'
---
description: 'Custom Core Instructions'
globs: '**/*.sh'
alwaysApply: true
---
<!-- ai-instructions:managed -->
# Old content
EOF

HOME="$TMP_HOME_MIGRATION" "$REPO_DIR/setup.sh" update --agent cursor --yes >/dev/null
assert_file_contains "$TMP_HOME_MIGRATION/.cursor/rules/core.mdc" "# Core Instructions"
assert_file_contains "$TMP_HOME_MIGRATION/.cursor/rules/core.mdc" "alwaysApply: true"
assert_path_missing "$TMP_HOME_MIGRATION/.cursor/rules/coding-principles.mdc"

TMP_HOME_UNMANAGED="$TMP_ROOT/unmanaged"
mkdir -p "$TMP_HOME_UNMANAGED/.cursor/rules"

cat > "$TMP_HOME_UNMANAGED/.cursor/rules/core.mdc" <<'EOF'
# Custom rule

This file mentions the management marker in its body.
<!-- ai-instructions:managed -->
EOF

HOME="$TMP_HOME_UNMANAGED" "$REPO_DIR/setup.sh" update --agent cursor --yes >"$TMP_HOME_UNMANAGED/update.log" 2>&1
assert_file_contains "$TMP_HOME_UNMANAGED/.cursor/rules/core.mdc" "# Custom rule"
assert_file_contains "$TMP_HOME_UNMANAGED/update.log" "core.mdc already exists"

TMP_HOME_LEGACY="$TMP_ROOT/legacy"
mkdir -p "$TMP_HOME_LEGACY/.cursor/rules"
LEGACY_FILE="$TMP_HOME_LEGACY/.cursor/rules/core.mdc"
{
  echo "<!-- ai-instructions:managed -->"
  cat "$REPO_DIR/instructions/core.md"
} > "$LEGACY_FILE"

HOME="$TMP_HOME_LEGACY" "$REPO_DIR/setup.sh" --agent cursor --yes >"$TMP_HOME_LEGACY/install.log" 2>&1
assert_file_contains "$TMP_HOME_LEGACY/install.log" "legacy managed copy without Cursor frontmatter"

if HOME="$TMP_HOME_LEGACY" "$REPO_DIR/setup.sh" check --agent cursor --yes >"$TMP_HOME_LEGACY/check.log" 2>&1; then
  fail "Expected check to fail for a legacy managed Cursor rule"
fi
assert_file_contains "$TMP_HOME_LEGACY/check.log" "legacy managed copy without Cursor frontmatter"

HOME="$TMP_HOME_LEGACY" "$REPO_DIR/setup.sh" update --agent cursor --yes >/dev/null
assert_file_contains "$LEGACY_FILE" "alwaysApply: true"
assert_file_contains "$LEGACY_FILE" "description: 'Core Instructions'"

{
  echo "<!-- ai-instructions:managed -->"
  cat "$REPO_DIR/instructions/core.md"
} > "$LEGACY_FILE"

HOME="$TMP_HOME_LEGACY" "$REPO_DIR/setup.sh" remove --agent cursor --yes >/dev/null
assert_path_missing "$LEGACY_FILE"

TMP_HOME_COPY="$TMP_ROOT/copy"
mkdir -p "$TMP_HOME_COPY/.cursor"

HOME="$TMP_HOME_COPY" "$REPO_DIR/setup.sh" --agent cursor --copy --yes >/dev/null
assert_file_exists "$TMP_HOME_COPY/.cursor/rules/core.mdc"
assert_not_symlink "$TMP_HOME_COPY/.cursor/rules/core.mdc"
HOME="$TMP_HOME_COPY" "$REPO_DIR/setup.sh" check --agent cursor --yes >/dev/null
HOME="$TMP_HOME_COPY" "$REPO_DIR/setup.sh" remove --agent cursor --yes >/dev/null
assert_path_missing "$TMP_HOME_COPY/.cursor/rules/core.mdc"
assert_path_missing "$TMP_HOME_COPY/.cursor/skills/investigate-debug/SKILL.md"

echo "cursor installer regression test passed"
