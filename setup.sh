#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRY_RUN=false
SETUP_CURSOR=false
SETUP_CLAUDE=false
SETUP_COPILOT=false
DO_UNLINK=false
DO_CHECK=false
COPILOT_TARGET_DIR=""

usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Wire ai-instructions into AI tool configurations via symlinks.

Options:
  --cursor             Set up Cursor (rules, skills, agents)
  --claude             Set up Claude Code (rules, skills)
  --copilot [DIR]      Generate .github/copilot-instructions.md in DIR (default: current directory)
  --all                Set up all supported tools (Cursor + Claude; use --copilot separately)
  --unlink             Remove symlinks created by this script (use with --cursor, --claude, or --all)
  --check              Verify existing symlinks are valid (use with --cursor, --claude, or --all)
  --dry-run            Show what would be done without making changes
  -h, --help           Show this help message

Examples:
  $(basename "$0") --cursor
  $(basename "$0") --all --dry-run
  $(basename "$0") --unlink --all
  $(basename "$0") --check --all
  $(basename "$0") --copilot ~/Code/my-project
EOF
  exit 0
}

log() { echo "  $1"; }
log_action() { echo "  [+] $1"; }
log_skip() { echo "  [=] $1 (already linked)"; }
log_warn() { echo "  [!] $1" >&2; }
log_dry() { echo "  [dry-run] $1"; }
log_header() { echo -e "\n==> $1"; }
log_remove() { echo "  [-] $1"; }
log_ok() { echo "  [ok] $1"; }
log_broken() { echo "  [BROKEN] $1" >&2; }

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

unlink_file() {
  local src="$1"
  local dst="$2"

  if [ -L "$dst" ]; then
    local existing_target
    existing_target="$(readlink "$dst")"
    if [ "$existing_target" = "$src" ]; then
      if $DRY_RUN; then
        log_dry "rm $dst"
      else
        rm "$dst"
        log_remove "$(basename "$dst")"
      fi
      return
    fi
  fi

  if [ -e "$dst" ]; then
    log_skip "$(basename "$dst") (not our symlink)"
  fi
}

check_file() {
  local src="$1"
  local dst="$2"

  if [ -L "$dst" ]; then
    local existing_target
    existing_target="$(readlink "$dst")"
    if [ "$existing_target" = "$src" ]; then
      if [ -e "$dst" ]; then
        log_ok "$(basename "$dst")"
      else
        log_broken "$(basename "$dst") -> $existing_target (target missing)"
        BROKEN_COUNT=$((BROKEN_COUNT + 1))
      fi
    fi
  fi
}

process_cursor() {
  local action="$1"
  log_header "Cursor"

  local cursor_rules_dir="$HOME/.cursor/rules"
  local cursor_skills_dir="$HOME/.cursor/skills-cursor"
  local cursor_agents_dir="$HOME/.cursor/agents"

  log "Instructions in $cursor_rules_dir/ (as .mdc)"
  for f in "$SCRIPT_DIR"/instructions/*.md; do
    local basename_no_ext
    basename_no_ext="$(basename "$f" .md)"
    "$action" "$f" "$cursor_rules_dir/${basename_no_ext}.mdc"
  done

  log "Skills in $cursor_skills_dir/"
  for f in "$SCRIPT_DIR"/skills/*.md; do
    local skill_name
    skill_name="$(basename "$f" .md)"
    local skill_dir="$cursor_skills_dir/$skill_name"
    if [ "$action" = "symlink_file" ] && ! $DRY_RUN; then
      mkdir -p "$skill_dir"
    fi
    "$action" "$f" "$skill_dir/SKILL.md"
  done

  log "Personas in $cursor_agents_dir/"
  for f in "$SCRIPT_DIR"/personas/*.md; do
    "$action" "$f" "$cursor_agents_dir/$(basename "$f")"
  done
}

process_claude() {
  local action="$1"
  log_header "Claude Code"

  local claude_rules_dir="$HOME/.claude/rules"
  local claude_skills_dir="$HOME/.claude/skills"

  log "Instructions in $claude_rules_dir/"
  for f in "$SCRIPT_DIR"/instructions/*.md; do
    "$action" "$f" "$claude_rules_dir/$(basename "$f")"
  done

  log "Skills in $claude_skills_dir/"
  for f in "$SCRIPT_DIR"/skills/*.md; do
    local skill_name
    skill_name="$(basename "$f" .md)"
    local skill_dir="$claude_skills_dir/$skill_name"
    if [ "$action" = "symlink_file" ] && ! $DRY_RUN; then
      mkdir -p "$skill_dir"
    fi
    "$action" "$f" "$skill_dir/SKILL.md"
  done

  if [ "$action" = "symlink_file" ]; then
    echo ""
    log "Reminder: reference instructions from your CLAUDE.md if not already done:"
    log "  @ai-instructions/instructions/coding-principles.md"
    log "  @ai-instructions/instructions/interaction-preferences.md"
    log "  (etc.)"
  fi
}

setup_copilot() {
  local target_dir="${COPILOT_TARGET_DIR:-.}"
  local github_dir="$target_dir/.github"
  local output_file="$github_dir/copilot-instructions.md"

  log_header "GitHub Copilot"
  log "Generating $output_file"

  if $DRY_RUN; then
    log_dry "Concatenate all instructions -> $output_file"
    for f in "$SCRIPT_DIR"/instructions/*.md; do
      log_dry "  include $(basename "$f")"
    done
    return
  fi

  mkdir -p "$github_dir"

  {
    echo "<!-- Auto-generated by ai-instructions/setup.sh --copilot -->"
    echo "<!-- Do not edit manually. Re-run setup.sh to update. -->"
    echo ""
    for f in "$SCRIPT_DIR"/instructions/*.md; do
      cat "$f"
      echo ""
      echo "---"
      echo ""
    done
  } > "$output_file"

  log_action "$(basename "$output_file") ($(wc -l < "$output_file" | tr -d ' ') lines)"
}

# Parse arguments
if [ $# -eq 0 ]; then
  usage
fi

while [ $# -gt 0 ]; do
  case "$1" in
    --cursor)  SETUP_CURSOR=true; shift ;;
    --claude)  SETUP_CLAUDE=true; shift ;;
    --copilot)
      SETUP_COPILOT=true
      shift
      if [ $# -gt 0 ] && [[ ! "$1" =~ ^-- ]]; then
        COPILOT_TARGET_DIR="$1"
        shift
      fi
      ;;
    --all)     SETUP_CURSOR=true; SETUP_CLAUDE=true; shift ;;
    --unlink)  DO_UNLINK=true; shift ;;
    --check)   DO_CHECK=true; shift ;;
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

if $DO_CHECK; then
  BROKEN_COUNT=0
  if $SETUP_CURSOR; then process_cursor check_file; fi
  if $SETUP_CLAUDE; then process_claude check_file; fi
  if [ "$BROKEN_COUNT" -gt 0 ]; then
    echo -e "\n$BROKEN_COUNT broken symlink(s) found."
    exit 1
  else
    echo -e "\nAll symlinks OK."
  fi
  exit 0
fi

if $DO_UNLINK; then
  if $SETUP_CURSOR; then process_cursor unlink_file; fi
  if $SETUP_CLAUDE; then process_claude unlink_file; fi
  echo -e "\nDone (unlink)."
  exit 0
fi

if $SETUP_CURSOR; then process_cursor symlink_file; fi
if $SETUP_CLAUDE; then process_claude symlink_file; fi
if $SETUP_COPILOT; then setup_copilot; fi

echo -e "\nDone."
