#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRY_RUN=false
SETUP_CURSOR=false
SETUP_CLAUDE=false

usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Wire ai-instructions into AI tool configurations via symlinks.

Options:
  --cursor     Set up Cursor (rules, skills, agents)
  --claude     Set up Claude Code (rules, skills)
  --all        Set up all supported tools
  --dry-run    Show what would be done without making changes
  -h, --help   Show this help message

Examples:
  $(basename "$0") --cursor
  $(basename "$0") --claude
  $(basename "$0") --all --dry-run
EOF
  exit 0
}

log() { echo "  $1"; }
log_action() { echo "  [+] $1"; }
log_skip() { echo "  [=] $1 (already linked)"; }
log_warn() { echo "  [!] $1" >&2; }
log_dry() { echo "  [dry-run] $1"; }
log_header() { echo -e "\n==> $1"; }

symlink_file() {
  local src="$1"
  local dst="$2"

  if [ -L "$dst" ]; then
    local existing_target
    existing_target="$(readlink "$dst")"
    if [ "$existing_target" = "$src" ]; then
      log_skip "$(basename "$dst")"
      return
    fi
  fi

  if [ -e "$dst" ]; then
    log_warn "$(basename "$dst") already exists at $dst and is not a symlink -- skipping"
    return
  fi

  if $DRY_RUN; then
    log_dry "ln -s $src -> $dst"
  else
    mkdir -p "$(dirname "$dst")"
    ln -s "$src" "$dst"
    log_action "$(basename "$dst")"
  fi
}

setup_cursor() {
  log_header "Cursor"

  local cursor_rules_dir="$HOME/.cursor/rules"
  local cursor_skills_dir="$HOME/.cursor/skills-cursor"
  local cursor_agents_dir="$HOME/.cursor/agents"

  log "Linking instructions -> $cursor_rules_dir/ (as .mdc)"
  for f in "$SCRIPT_DIR"/instructions/*.md; do
    local basename_no_ext
    basename_no_ext="$(basename "$f" .md)"
    symlink_file "$f" "$cursor_rules_dir/${basename_no_ext}.mdc"
  done

  log "Linking skills -> $cursor_skills_dir/"
  for f in "$SCRIPT_DIR"/skills/*.md; do
    local skill_name
    skill_name="$(basename "$f" .md)"
    local skill_dir="$cursor_skills_dir/$skill_name"
    if ! $DRY_RUN; then
      mkdir -p "$skill_dir"
    fi
    symlink_file "$f" "$skill_dir/SKILL.md"
  done

  log "Linking personas -> $cursor_agents_dir/"
  for f in "$SCRIPT_DIR"/personas/*.md; do
    symlink_file "$f" "$cursor_agents_dir/$(basename "$f")"
  done
}

setup_claude() {
  log_header "Claude Code"

  local claude_rules_dir="$HOME/.claude/rules"
  local claude_skills_dir="$HOME/.claude/skills"

  log "Linking instructions -> $claude_rules_dir/"
  for f in "$SCRIPT_DIR"/instructions/*.md; do
    symlink_file "$f" "$claude_rules_dir/$(basename "$f")"
  done

  log "Linking skills -> $claude_skills_dir/"
  for f in "$SCRIPT_DIR"/skills/*.md; do
    local skill_name
    skill_name="$(basename "$f" .md)"
    local skill_dir="$claude_skills_dir/$skill_name"
    if ! $DRY_RUN; then
      mkdir -p "$skill_dir"
    fi
    symlink_file "$f" "$skill_dir/SKILL.md"
  done

  echo ""
  log "Reminder: reference instructions from your CLAUDE.md if not already done:"
  log "  @ai-instructions/instructions/coding-principles.md"
  log "  @ai-instructions/instructions/interaction-preferences.md"
  log "  (etc.)"
}

# Parse arguments
if [ $# -eq 0 ]; then
  usage
fi

while [ $# -gt 0 ]; do
  case "$1" in
    --cursor)  SETUP_CURSOR=true; shift ;;
    --claude)  SETUP_CLAUDE=true; shift ;;
    --all)     SETUP_CURSOR=true; SETUP_CLAUDE=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    -h|--help) usage ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      ;;
  esac
done

echo "ai-instructions setup (source: $SCRIPT_DIR)"
if $DRY_RUN; then
  echo "(dry-run mode -- no changes will be made)"
fi

if $SETUP_CURSOR; then setup_cursor; fi
if $SETUP_CLAUDE; then setup_claude; fi

echo -e "\nDone."
