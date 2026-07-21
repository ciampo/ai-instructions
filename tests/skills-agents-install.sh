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

assert_frontmatter_field() {
  local path="$1" field="$2" expected="${3:-}"
  awk -v field="$field" -v expected="$expected" '
    function trim(value) {
      sub(/^[[:space:]]+/, "", value)
      sub(/[[:space:]]+$/, "", value)
      return value
    }

    NR == 1 && $0 == "---" { in_frontmatter = 1; next }
    in_frontmatter && $0 == "---" { closed = 1; exit }
    in_frontmatter {
      pattern = "^[[:space:]]*" field "[[:space:]]*:"
      if (match($0, pattern)) {
        value = trim(substr($0, RLENGTH + 1))
        if (expected == "" && value != "") {
          found = 1
        } else if (value == expected || value == "\"" expected "\"" || value == "\047" expected "\047") {
          found = 1
        }
      }
    }
    END { exit(found && closed ? 0 : 1) }
  ' "$path" || fail "Expected non-empty '$field' frontmatter field in $path"
}

assert_frontmatter_file() {
  local path="$1" name="$2"
  assert_file_exists "$path"
  [ "$(sed -n '1p' "$path")" = "---" ] || fail "Expected YAML frontmatter first in $path"
  assert_frontmatter_field "$path" "name" "$name"
  assert_frontmatter_field "$path" "description"
}

copy_installer_runtime() {
  local destination="$1"
  cp "$REPO_DIR/setup.sh" "$destination/setup.sh"
  cp -R "$REPO_DIR/scripts" "$destination/scripts"
  cp -R "$REPO_DIR/platforms" "$destination/platforms"
}

TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/skills-agents-install.XXXXXX")"
trap 'rm -rf "$TMP_ROOT"' EXIT

INVALID_FRONTMATTER_FIXTURE="$TMP_ROOT/invalid-frontmatter.md"
cat > "$INVALID_FRONTMATTER_FIXTURE" <<'EOF'
---
name: invalid-frontmatter
---

The body contains description: but the frontmatter does not.
EOF
if ( assert_frontmatter_file "$INVALID_FRONTMATTER_FIXTURE" "invalid-frontmatter" ) 2>/dev/null; then
  fail "Expected frontmatter assertions to ignore fields in the Markdown body"
fi

for skill in "$REPO_DIR"/skills/*/SKILL.md; do
  skill_name="$(basename "$(dirname "$skill")")"
  assert_frontmatter_file "$skill" "$skill_name"
done

for agent in "$REPO_DIR"/agents/*.md; do
  agent_name="$(basename "$agent" .md)"
  assert_frontmatter_file "$agent" "$agent_name"
done

if grep -E -q '^## Dependencies|/Users/|skills/[^/[:space:]]+\.md' "$REPO_DIR"/skills/*/SKILL.md; then
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
ENGINEERING_REFERENCE="$TMP_HOME/.agents/skills/engineering-standards/references/accessibility.md"

for installed_skill in "$CURSOR_SKILL" "$CLAUDE_SKILL" "$CODEX_SKILL" "$COPILOT_SKILL" "$GEMINI_SKILL"; do
  assert_frontmatter_file "$installed_skill" "review-pr"
  if grep -Fq "$REPO_DIR" "$installed_skill"; then
    fail "Installed skill contains an absolute source path: $installed_skill"
  fi
done
assert_file_exists "$ENGINEERING_REFERENCE"
assert_file_contains "$ENGINEERING_REFERENCE" "# Accessibility Reference"
assert_file_contains "$TMP_HOME/.agents/skills/engineering-standards/.ai-instructions-managed" "ai-instructions:managed-skill"

HOME="$TMP_HOME" "$REPO_DIR/setup.sh" --agent '*' --only agents --copy --yes >/dev/null

for agent_path in \
  "$TMP_HOME/.cursor/agents/a11y-reviewer.md" \
  "$TMP_HOME/.claude/agents/a11y-reviewer.md" \
  "$TMP_HOME/.copilot/agents/a11y-reviewer.agent.md" \
  "$TMP_HOME/.gemini/agents/a11y-reviewer.md"; do
  assert_frontmatter_file "$agent_path" "a11y-reviewer"
done

CODEX_AGENT="$TMP_HOME/.codex/agents/a11y-reviewer.toml"
assert_file_exists "$CODEX_AGENT"
assert_file_contains "$CODEX_AGENT" "# ai-instructions:managed"
assert_file_contains "$CODEX_AGENT" 'name = "a11y-reviewer"'
assert_file_contains "$CODEX_AGENT" "developer_instructions ="

QUOTED_REPO="$TMP_ROOT/quoted-repo"
QUOTED_HOME="$TMP_ROOT/quoted-home"
mkdir -p "$QUOTED_REPO/agents" "$QUOTED_HOME/.codex"
copy_installer_runtime "$QUOTED_REPO"
cat > "$QUOTED_REPO/agents/quoted-agent.md" <<'EOF'
---
  name: "quoted-agent"
  description: 'Quoted description: it''s portable.'
---

Review quoted metadata.

Match \d+ and inspect C:\temp.
Document the TOML delimiter """ without changing it.
EOF

HOME="$QUOTED_HOME" "$QUOTED_REPO/setup.sh" --agent codex --only agents --copy --yes >/dev/null
QUOTED_AGENT="$QUOTED_HOME/.codex/agents/quoted-agent.toml"
assert_file_contains "$QUOTED_AGENT" 'name = "quoted-agent"'
assert_file_contains "$QUOTED_AGENT" 'description = "Quoted description: it'\''s portable."'
assert_file_contains "$QUOTED_AGENT" 'Match \\d+ and inspect C:\\temp.'
assert_file_contains "$QUOTED_AGENT" 'Document the TOML delimiter \"\"\" without changing it.'

INVALID_REPO="$TMP_ROOT/invalid-repo"
INVALID_HOME="$TMP_ROOT/invalid-home"
mkdir -p \
  "$INVALID_REPO/agents" \
  "$INVALID_HOME/.cursor" \
  "$INVALID_HOME/.claude" \
  "$INVALID_HOME/.codex" \
  "$INVALID_HOME/.copilot" \
  "$INVALID_HOME/.gemini"
copy_installer_runtime "$INVALID_REPO"
cat > "$INVALID_REPO/agents/a-valid-agent.md" <<'EOF'
---
name: a-valid-agent
description: A valid agent that sorts before the invalid fixture.
---

This agent must not be installed when preflight fails.
EOF
cat > "$INVALID_REPO/agents/invalid-agent.md" <<'EOF'
---
name: invalid-agent
---

This agent has no description.
EOF

if HOME="$INVALID_HOME" "$INVALID_REPO/setup.sh" --agent claude --only agents --copy --yes >"$INVALID_HOME/claude-install.log" 2>&1; then
  fail "Expected direct agent installation to reject missing frontmatter"
fi
assert_file_contains "$INVALID_HOME/claude-install.log" "missing required frontmatter field 'description'"
assert_path_missing "$INVALID_HOME/.claude/agents/a-valid-agent.md"
assert_path_missing "$INVALID_HOME/.claude/agents/invalid-agent.md"

if HOME="$INVALID_HOME" "$INVALID_REPO/setup.sh" --agent '*' --only agents --copy --yes >"$INVALID_HOME/all-install.log" 2>&1; then
  fail "Expected all-platform agent installation to reject missing frontmatter"
fi
assert_file_contains "$INVALID_HOME/all-install.log" "missing required frontmatter field 'description'"
assert_path_missing "$INVALID_HOME/.cursor/agents/a-valid-agent.md"
assert_path_missing "$INVALID_HOME/.cursor/agents/invalid-agent.md"

mkdir -p "$INVALID_HOME/.claude/agents"
printf '<!-- ai-instructions:managed -->\n# Stale agent\n' > "$INVALID_HOME/.claude/agents/stale-agent.md"
if HOME="$INVALID_HOME" "$INVALID_REPO/setup.sh" update --agent claude --only agents --copy --yes >"$INVALID_HOME/claude-update.log" 2>&1; then
  fail "Expected agent update to reject missing frontmatter before stale cleanup"
fi
assert_file_contains "$INVALID_HOME/claude-update.log" "missing required frontmatter field 'description'"
assert_file_exists "$INVALID_HOME/.claude/agents/stale-agent.md"
assert_path_missing "$INVALID_HOME/.claude/agents/a-valid-agent.md"

if HOME="$INVALID_HOME" "$INVALID_REPO/setup.sh" --agent codex --only agents --copy --yes >"$INVALID_HOME/install.log" 2>&1; then
  fail "Expected Codex agent generation to reject missing frontmatter"
fi
assert_file_contains "$INVALID_HOME/install.log" "missing required frontmatter field 'description'"
assert_path_missing "$INVALID_HOME/.codex/agents/invalid-agent.toml"

FOLDED_REPO="$TMP_ROOT/folded-repo"
FOLDED_HOME="$TMP_ROOT/folded-home"
mkdir -p "$FOLDED_REPO/agents" "$FOLDED_HOME/.codex"
copy_installer_runtime "$FOLDED_REPO"
cat > "$FOLDED_REPO/agents/folded-agent.md" <<'EOF'
---
name: folded-agent
description: >
  Folded descriptions are valid YAML but unsupported by the portable shell parser.
---

This agent uses folded metadata.
EOF

if HOME="$FOLDED_HOME" "$FOLDED_REPO/setup.sh" --agent codex --only agents --copy --yes >"$FOLDED_HOME/install.log" 2>&1; then
  fail "Expected Codex agent generation to reject folded frontmatter"
fi
assert_file_contains "$FOLDED_HOME/install.log" "frontmatter field 'description' must use a single-line scalar"
assert_path_missing "$FOLDED_HOME/.codex/agents/folded-agent.toml"

STANDARD_COPY_REPO="$TMP_ROOT/standard-copy-repo"
STANDARD_COPY_HOME="$TMP_ROOT/standard-copy-home"
STANDARD_COPY_SKILL="$STANDARD_COPY_HOME/.agents/skills/standard-copy/SKILL.md"
mkdir -p \
  "$STANDARD_COPY_REPO/skills/standard-copy" \
  "$STANDARD_COPY_HOME/.codex" \
  "$(dirname "$STANDARD_COPY_SKILL")"
copy_installer_runtime "$STANDARD_COPY_REPO"
cat > "$STANDARD_COPY_REPO/skills/standard-copy/SKILL.md" <<'EOF'
---
name: standard-copy
description: Validate migration from the former managed-file format.
---

# Standard managed copy fixture
EOF
{
  printf '<!-- ai-instructions:managed -->\n'
  cat "$STANDARD_COPY_REPO/skills/standard-copy/SKILL.md"
} > "$STANDARD_COPY_SKILL"

HOME="$STANDARD_COPY_HOME" "$STANDARD_COPY_REPO/setup.sh" update --agent codex --only skills --copy --yes >/dev/null
[ "$(sed -n '1p' "$STANDARD_COPY_SKILL")" = '---' ] || fail "Expected the standard managed copy to migrate"
assert_file_contains "$(dirname "$STANDARD_COPY_SKILL")/.ai-instructions-managed" "ai-instructions:managed"
HOME="$STANDARD_COPY_HOME" "$STANDARD_COPY_REPO/setup.sh" check --agent codex --only skills --copy --yes >/dev/null

RESOURCE_REPO="$TMP_ROOT/resource-repo"
RESOURCE_HOME="$TMP_ROOT/resource-home"
mkdir -p \
  "$RESOURCE_REPO/skills/resource-skill/references" \
  "$RESOURCE_REPO/skills/resource-skill/assets" \
  "$RESOURCE_HOME/.cursor" \
  "$RESOURCE_HOME/.claude" \
  "$RESOURCE_HOME/.codex" \
  "$RESOURCE_HOME/.copilot" \
  "$RESOURCE_HOME/.gemini"
copy_installer_runtime "$RESOURCE_REPO"
cat > "$RESOURCE_REPO/skills/resource-skill/SKILL.md" <<'EOF'
---
name: resource-skill
description: Load a bundled reference when this fixture runs.
---

Read [the reference](references/example.md).
EOF
printf '# Bundled reference\n' > "$RESOURCE_REPO/skills/resource-skill/references/example.md"
printf '\000\377\001\376' > "$RESOURCE_REPO/skills/resource-skill/assets/example.bin"

HOME="$RESOURCE_HOME" "$RESOURCE_REPO/setup.sh" --agent '*' --only skills --copy --yes >/dev/null
for resource_root in \
  "$RESOURCE_HOME/.cursor/skills" \
  "$RESOURCE_HOME/.claude/skills" \
  "$RESOURCE_HOME/.agents/skills" \
  "$RESOURCE_HOME/.copilot/skills" \
  "$RESOURCE_HOME/.gemini/skills"; do
  assert_file_contains "$resource_root/resource-skill/references/example.md" "# Bundled reference"
  cmp -s \
    "$RESOURCE_REPO/skills/resource-skill/assets/example.bin" \
    "$resource_root/resource-skill/assets/example.bin" || fail "Expected binary skill asset to be preserved"
  assert_file_contains "$resource_root/resource-skill/.ai-instructions-managed" "ai-instructions:managed"
done

printf '# Updated bundled reference\n' > "$RESOURCE_REPO/skills/resource-skill/references/example.md"
HOME="$RESOURCE_HOME" "$RESOURCE_REPO/setup.sh" update --agent '*' --only skills --yes >"$RESOURCE_HOME/update-without-copy.log" 2>&1
assert_file_contains "$RESOURCE_HOME/update-without-copy.log" "run update --copy to refresh it"
assert_file_contains "$RESOURCE_HOME/.cursor/skills/resource-skill/references/example.md" "# Bundled reference"
assert_file_exists "$RESOURCE_HOME/.cursor/skills/resource-skill/assets/example.bin"

rm "$RESOURCE_REPO/skills/resource-skill/assets/example.bin"
HOME="$RESOURCE_HOME" "$RESOURCE_REPO/setup.sh" update --agent '*' --only skills --copy --yes >/dev/null
assert_file_contains "$RESOURCE_HOME/.cursor/skills/resource-skill/references/example.md" "# Updated bundled reference"
assert_path_missing "$RESOURCE_HOME/.cursor/skills/resource-skill/assets/example.bin"

HOME="$RESOURCE_HOME" "$RESOURCE_REPO/setup.sh" check --agent '*' --only skills --copy --yes >/dev/null
HOME="$RESOURCE_HOME" "$RESOURCE_REPO/setup.sh" remove --agent '*' --only skills --copy --yes >/dev/null
assert_path_missing "$RESOURCE_HOME/.cursor/skills/resource-skill"
assert_path_missing "$RESOURCE_HOME/.agents/skills/resource-skill"

MARKER_LINK_HOME="$TMP_ROOT/marker-link-home"
MARKER_LINK_SKILL="$MARKER_LINK_HOME/.agents/skills/resource-skill"
mkdir -p "$MARKER_LINK_SKILL" "$MARKER_LINK_HOME/.codex"
printf 'ai-instructions:managed\n' > "$MARKER_LINK_HOME/marker-target"
ln -s "$MARKER_LINK_HOME/marker-target" "$MARKER_LINK_SKILL/.ai-instructions-managed"
printf '# User-owned sibling\n' > "$MARKER_LINK_SKILL/user-reference.md"

HOME="$MARKER_LINK_HOME" "$RESOURCE_REPO/setup.sh" remove --agent codex --only skills --copy --yes >"$MARKER_LINK_HOME/remove.log" 2>&1
assert_file_contains "$MARKER_LINK_SKILL/user-reference.md" "# User-owned sibling"
assert_file_contains "$MARKER_LINK_HOME/remove.log" "was not installed by this script"

RESOURCE_LINK_HOME="$TMP_ROOT/resource-link-home"
mkdir -p "$RESOURCE_LINK_HOME/.codex"
HOME="$RESOURCE_LINK_HOME" "$RESOURCE_REPO/setup.sh" --agent codex --only skills --yes >/dev/null
assert_file_contains "$RESOURCE_LINK_HOME/.agents/skills/resource-skill/references/example.md" "# Updated bundled reference"
HOME="$RESOURCE_LINK_HOME" "$RESOURCE_REPO/setup.sh" check --agent codex --only skills --yes >/dev/null
HOME="$RESOURCE_LINK_HOME" "$RESOURCE_REPO/setup.sh" remove --agent codex --only skills --yes >/dev/null
assert_path_missing "$RESOURCE_LINK_HOME/.agents/skills/resource-skill"

LEGACY_SAFE_COPY_HOME="$TMP_ROOT/legacy-safe-copy-home"
LEGACY_SAFE_COPY_SKILL="$LEGACY_SAFE_COPY_HOME/.agents/skills/resource-skill"
mkdir -p "$LEGACY_SAFE_COPY_SKILL" "$LEGACY_SAFE_COPY_HOME/.codex"
{
  cat "$RESOURCE_REPO/skills/resource-skill/SKILL.md"
  printf '<!-- ai-instructions:managed -->\n'
} > "$LEGACY_SAFE_COPY_SKILL/SKILL.md"
printf 'Finder metadata\n' > "$LEGACY_SAFE_COPY_SKILL/.DS_Store"
printf 'Windows metadata\n' > "$LEGACY_SAFE_COPY_SKILL/Thumbs.db"

HOME="$LEGACY_SAFE_COPY_HOME" "$RESOURCE_REPO/setup.sh" update --agent codex --only skills --yes >"$LEGACY_SAFE_COPY_HOME/update-without-copy.log" 2>&1
assert_file_contains "$LEGACY_SAFE_COPY_HOME/update-without-copy.log" "run update --copy to migrate it without changing install mode"
[ ! -L "$LEGACY_SAFE_COPY_SKILL" ] || fail "Expected default update to preserve legacy copy mode"
assert_path_missing "$LEGACY_SAFE_COPY_SKILL/.ai-instructions-managed"
assert_path_missing "$LEGACY_SAFE_COPY_SKILL/references/example.md"

HOME="$LEGACY_SAFE_COPY_HOME" "$RESOURCE_REPO/setup.sh" update --agent codex --only skills --copy --yes >/dev/null
assert_file_contains "$LEGACY_SAFE_COPY_SKILL/.ai-instructions-managed" "ai-instructions:managed"
assert_file_contains "$LEGACY_SAFE_COPY_SKILL/references/example.md" "# Updated bundled reference"
assert_path_missing "$LEGACY_SAFE_COPY_SKILL/.DS_Store"
assert_path_missing "$LEGACY_SAFE_COPY_SKILL/Thumbs.db"

LEGACY_COPY_HOME="$TMP_ROOT/legacy-copy-home"
LEGACY_COPY_SKILL="$LEGACY_COPY_HOME/.agents/skills/resource-skill"
mkdir -p "$LEGACY_COPY_SKILL" "$LEGACY_COPY_HOME/.codex"
{
  cat "$RESOURCE_REPO/skills/resource-skill/SKILL.md"
  printf '<!-- ai-instructions:managed -->\n'
} > "$LEGACY_COPY_SKILL/SKILL.md"
printf '# User-owned sibling\n' > "$LEGACY_COPY_SKILL/user-reference.md"
legacy_sibling_index=0
while [ "$legacy_sibling_index" -lt 1500 ]; do
  printf '# User-owned sibling %s\n' "$legacy_sibling_index" > "$LEGACY_COPY_SKILL/user-$legacy_sibling_index.md"
  legacy_sibling_index=$((legacy_sibling_index + 1))
done

HOME="$LEGACY_COPY_HOME" "$RESOURCE_REPO/setup.sh" update --agent codex --only skills --copy --yes >"$LEGACY_COPY_HOME/update.log" 2>&1
assert_file_contains "$LEGACY_COPY_HOME/update.log" "preserving the legacy directory"
assert_file_contains "$LEGACY_COPY_SKILL/user-reference.md" "# User-owned sibling"
assert_path_missing "$LEGACY_COPY_SKILL/.ai-instructions-managed"

HOME="$LEGACY_COPY_HOME" "$RESOURCE_REPO/setup.sh" remove --agent codex --only skills --copy --yes >"$LEGACY_COPY_HOME/remove.log" 2>&1
assert_path_missing "$LEGACY_COPY_SKILL/SKILL.md"
assert_file_contains "$LEGACY_COPY_SKILL/user-reference.md" "# User-owned sibling"

STALE_LEGACY_HOME="$TMP_ROOT/stale-legacy-home"
STALE_SAFE_SKILL="$STALE_LEGACY_HOME/.agents/skills/stale-safe"
STALE_MIXED_SKILL="$STALE_LEGACY_HOME/.agents/skills/stale-mixed"
mkdir -p "$STALE_SAFE_SKILL" "$STALE_MIXED_SKILL" "$STALE_LEGACY_HOME/.codex"
printf '<!-- ai-instructions:managed -->\n# Removed skill\n' > "$STALE_SAFE_SKILL/SKILL.md"
printf '<!-- ai-instructions:managed -->\n# Removed skill\n' > "$STALE_MIXED_SKILL/SKILL.md"
printf '# User-owned sibling\n' > "$STALE_MIXED_SKILL/reference.md"

HOME="$STALE_LEGACY_HOME" "$RESOURCE_REPO/setup.sh" update --agent codex --only skills --copy --yes >/dev/null
assert_path_missing "$STALE_SAFE_SKILL"
assert_path_missing "$STALE_MIXED_SKILL/SKILL.md"
assert_file_contains "$STALE_MIXED_SKILL/reference.md" "# User-owned sibling"

HOME="$TMP_HOME" "$REPO_DIR/setup.sh" check --agent '*' --only skills --only agents --copy --yes >/dev/null

HOME="$TMP_HOME" "$REPO_DIR/setup.sh" remove --agent '*' --only skills --only agents --copy --yes >/dev/null
assert_path_missing "$CURSOR_SKILL"
assert_path_missing "$CODEX_SKILL"
assert_path_missing "$ENGINEERING_REFERENCE"
assert_path_missing "$CODEX_AGENT"

LEGACY_HOME="$TMP_ROOT/legacy"
mkdir -p "$LEGACY_HOME/.cursor/skills-cursor/review-pr" "$LEGACY_HOME/.cursor/agents"
printf '<!-- ai-instructions:managed -->\n# Legacy skill\n' > "$LEGACY_HOME/.cursor/skills-cursor/review-pr/SKILL.md"
printf '<!-- ai-instructions:managed -->\n# Legacy persona\n' > "$LEGACY_HOME/.cursor/agents/a11y-reviewer.md"

if HOME="$LEGACY_HOME" "$REPO_DIR/setup.sh" check --agent cursor --only skills --yes >"$LEGACY_HOME/check.log" 2>&1; then
  fail "Expected check to fail for a managed skill at the legacy Cursor path"
fi
assert_file_contains "$LEGACY_HOME/check.log" "review-pr/SKILL.md (legacy Cursor path)"

HOME="$LEGACY_HOME" "$REPO_DIR/setup.sh" list --agent cursor --only skills --yes >"$LEGACY_HOME/list.log" 2>&1
assert_file_contains "$LEGACY_HOME/list.log" "review-pr/SKILL.md (legacy Cursor path)"

HOME="$LEGACY_HOME" "$REPO_DIR/setup.sh" update --agent cursor --only skills --yes >/dev/null
assert_path_missing "$LEGACY_HOME/.cursor/skills-cursor/review-pr/SKILL.md"
assert_frontmatter_file "$LEGACY_HOME/.cursor/skills/review-pr/SKILL.md" "review-pr"
assert_file_contains "$LEGACY_HOME/.cursor/skills/review-pr/.ai-instructions-managed" "ai-instructions:managed"
[ ! -L "$LEGACY_HOME/.cursor/skills/review-pr" ] || fail "Expected legacy Cursor skill copy migration to preserve copy mode"

HOME="$LEGACY_HOME" "$REPO_DIR/setup.sh" update --agent cursor --only agents --copy --yes >/dev/null
assert_frontmatter_file "$LEGACY_HOME/.cursor/agents/a11y-reviewer.md" "a11y-reviewer"

echo "skills and agents installer regression test passed"
