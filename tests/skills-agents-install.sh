#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

assert_file_exists() {
  [ -f "$1" ] || fail "Expected file to exist: $1"
}

assert_path_missing() {
  [ ! -e "$1" ] || fail "Expected path to be absent: $1"
}

assert_file_contains() {
  grep -Fq -- "$2" "$1" || fail "Expected '$2' in $1"
}

assert_frontmatter_file() {
  local path="$1" name="$2"
  assert_file_exists "$path"
  [ "$(sed -n '1p' "$path")" = "---" ] || fail "Expected YAML frontmatter first in $path"
  assert_file_contains "$path" "name: $name"
  assert_file_contains "$path" "description:"
}

TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/skills-agents-install.XXXXXX")"
trap 'rm -rf "$TMP_ROOT"' EXIT

for skill in "$REPO_DIR"/skills/*/SKILL.md; do
  skill_name="$(basename "$(dirname "$skill")")"
  assert_frontmatter_file "$skill" "$skill_name"
done

for agent in "$REPO_DIR"/agents/*.md; do
  agent_name="$(basename "$agent" .md)"
  assert_frontmatter_file "$agent" "$agent_name"
done

if grep -R -E -q '^## Dependencies|/Users/|skills/[^/[:space:]]+\.md' "$REPO_DIR/skills"; then
  fail "Skills must be self-contained and portable"
fi

TMP_HOME="$TMP_ROOT/home"
mkdir -p "$TMP_HOME/.cursor" "$TMP_HOME/.claude" "$TMP_HOME/.codex" "$TMP_HOME/.copilot" "$TMP_HOME/.gemini"

HOME="$TMP_HOME" "$REPO_DIR/setup.sh" --agent '*' --only skills --copy --yes >/dev/null

CURSOR_SKILL="$TMP_HOME/.cursor/skills/review-pr/SKILL.md"
CLAUDE_SKILL="$TMP_HOME/.claude/skills/review-pr/SKILL.md"
CODEX_SKILL="$TMP_HOME/.agents/skills/review-pr/SKILL.md"
COPILOT_SKILL="$TMP_HOME/.copilot/skills/review-pr/SKILL.md"
GEMINI_SKILL="$TMP_HOME/.gemini/skills/review-pr/SKILL.md"

for installed_skill in "$CURSOR_SKILL" "$CLAUDE_SKILL" "$CODEX_SKILL" "$COPILOT_SKILL" "$GEMINI_SKILL"; do
  assert_frontmatter_file "$installed_skill" "review-pr"
  if grep -Fq "$REPO_DIR" "$installed_skill"; then
    fail "Installed skill contains an absolute source path: $installed_skill"
  fi
done

HOME="$TMP_HOME" "$REPO_DIR/setup.sh" --agent '*' --only agents --copy --yes >/dev/null

for agent_path in \
  "$TMP_HOME/.cursor/agents/a11y-reviewer.md" \
  "$TMP_HOME/.claude/agents/a11y-reviewer.md" \
  "$TMP_HOME/.copilot/agents/a11y-reviewer.md" \
  "$TMP_HOME/.gemini/agents/a11y-reviewer.md"; do
  assert_frontmatter_file "$agent_path" "a11y-reviewer"
done

CODEX_AGENT="$TMP_HOME/.codex/agents/a11y-reviewer.toml"
assert_file_exists "$CODEX_AGENT"
assert_file_contains "$CODEX_AGENT" "# ai-instructions:managed"
assert_file_contains "$CODEX_AGENT" 'name = "a11y-reviewer"'
assert_file_contains "$CODEX_AGENT" "developer_instructions ="

HOME="$TMP_HOME" "$REPO_DIR/setup.sh" check --agent '*' --only skills --only agents --copy --yes >/dev/null

HOME="$TMP_HOME" "$REPO_DIR/setup.sh" remove --agent '*' --only skills --only agents --copy --yes >/dev/null
assert_path_missing "$CURSOR_SKILL"
assert_path_missing "$CODEX_SKILL"
assert_path_missing "$CODEX_AGENT"

LEGACY_HOME="$TMP_ROOT/legacy"
mkdir -p "$LEGACY_HOME/.cursor/skills-cursor/review-pr" "$LEGACY_HOME/.cursor/agents"
printf '<!-- ai-instructions:managed -->\n# Legacy skill\n' > "$LEGACY_HOME/.cursor/skills-cursor/review-pr/SKILL.md"
printf '<!-- ai-instructions:managed -->\n# Legacy persona\n' > "$LEGACY_HOME/.cursor/agents/a11y-reviewer.md"

HOME="$LEGACY_HOME" "$REPO_DIR/setup.sh" update --agent cursor --only skills --only agents --copy --yes >/dev/null
assert_path_missing "$LEGACY_HOME/.cursor/skills-cursor/review-pr/SKILL.md"
assert_frontmatter_file "$LEGACY_HOME/.cursor/skills/review-pr/SKILL.md" "review-pr"
assert_frontmatter_file "$LEGACY_HOME/.cursor/agents/a11y-reviewer.md" "a11y-reviewer"

echo "skills and agents installer regression test passed"
