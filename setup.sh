#!/usr/bin/env bash
set -euo pipefail

if [ -z "${HOME:-}" ]; then
  echo "Error: \$HOME is not set. Cannot determine agent config directories." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---------------------------------------------------------------------------
# Color helpers (disabled when not on a TTY or NO_COLOR is set)
# ---------------------------------------------------------------------------
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  C_RESET='\033[0m'
  C_BOLD='\033[1m'
  C_RED='\033[31m'
  C_GREEN='\033[32m'
  C_YELLOW='\033[33m'
  C_CYAN='\033[36m'
  C_DIM='\033[2m'
else
  C_RESET='' C_BOLD='' C_RED='' C_GREEN='' C_YELLOW='' C_CYAN='' C_DIM=''
fi

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
MANAGED_MARKER='<!-- ai-instructions:managed -->'
TOML_MANAGED_MARKER='# ai-instructions:managed'
SKILL_DIR_MANAGED_MARKER='.ai-instructions-managed'

log()        { echo "  $1"; }
log_action() { echo -e "  ${C_GREEN}[+]${C_RESET} $1"; }
log_skip()   {
  local msg="$1" dst="${2:-}"
  local status
  if [ -n "$dst" ] && [ -L "$dst" ]; then
    status="already linked"
  elif [ -n "$dst" ] && [ -f "$dst" ] && ! [ -L "$dst" ]; then
    status="already installed"
  elif $COPY_MODE; then
    status="already installed"
  else
    status="already linked"
  fi
  echo -e "  ${C_DIM}[=] $msg ($status)${C_RESET}"
}
log_warn()   { echo -e "  ${C_YELLOW}[!]${C_RESET} $1" >&2; }
log_dry()    { echo -e "  ${C_CYAN}[dry-run]${C_RESET} $1"; }
log_header() { echo -e "\n${C_BOLD}==> $1${C_RESET}"; }
log_remove() { echo -e "  ${C_RED}[-]${C_RESET} $1"; }
log_ok()     { echo -e "  ${C_GREEN}[ok]${C_RESET} $1"; }
log_broken() { echo -e "  ${C_RED}[BROKEN]${C_RESET} $1" >&2; }
log_stale()  { echo -e "  ${C_YELLOW}[stale]${C_RESET} $1"; }
log_copy()   { echo -e "  ${C_GREEN}[cp]${C_RESET} $1"; }

# ---------------------------------------------------------------------------
# Agent registry
#
# Lookup functions return agent-specific paths. Adding a new agent means
# adding one case to each function — no associative arrays required (bash 3).
#
# Fields:
#   detect_dir     — directory whose existence signals the agent is installed
#   instr_dir      — where instruction files go (empty = not supported)
#   instr_ext      — file extension for instructions (.md default)
#   skills_dir     — where skill dirs go (empty = not supported)
#   skill_file     — filename inside each skill dir (SKILL.md default)
#   agents_dir     — where custom agent files go (empty = not supported)
# ---------------------------------------------------------------------------
ALL_AGENTS="cursor claude codex copilot gemini"

agent_detect_dir() {
  case "$1" in
    cursor)  echo "$HOME/.cursor" ;;
    claude)  echo "$HOME/.claude" ;;
    codex)   echo "$HOME/.codex" ;;
    copilot) echo "$HOME/.copilot" ;;
    gemini)  echo "$HOME/.gemini" ;;
  esac
}

# Codex is intentionally absent here: it loads a single global instructions
# file (~/.codex/AGENTS.md), not a directory of separate files. It is handled
# specially via codex_agents_md() / codex_agents_file().
agent_instr_dir() {
  case "$1" in
    cursor)  echo "$HOME/.cursor/rules" ;;
    claude)  echo "$HOME/.claude/rules" ;;
    codex)   echo "" ;;
    copilot) echo "" ;;
    gemini)  echo "" ;;
  esac
}

# Path to Codex's global instructions file. Codex reads ~/.codex/AGENTS.md
# (or AGENTS.override.md) on startup; we generate the former as a single
# concatenated, managed file.
codex_agents_file() {
  echo "$HOME/.codex/AGENTS.md"
}

agent_instr_ext() {
  case "$1" in
    cursor) echo ".mdc" ;;
    *)      echo ".md" ;;
  esac
}

agent_skills_dir() {
  case "$1" in
    cursor)  echo "$HOME/.cursor/skills" ;;
    claude)  echo "$HOME/.claude/skills" ;;
    codex)   echo "$HOME/.agents/skills" ;;
    copilot) echo "$HOME/.copilot/skills" ;;
    gemini)  echo "$HOME/.gemini/skills" ;;
  esac
}

agent_skill_file() {
  echo "SKILL.md"
}

agent_agents_dir() {
  case "$1" in
    cursor)  echo "$HOME/.cursor/agents" ;;
    claude)  echo "$HOME/.claude/agents" ;;
    codex)   echo "$HOME/.codex/agents" ;;
    copilot) echo "$HOME/.copilot/agents" ;;
    gemini)  echo "$HOME/.gemini/agents" ;;
  esac
}

agent_agent_ext() {
  case "$1" in
    codex) echo ".toml" ;;
    *)     echo ".md" ;;
  esac
}

# ---------------------------------------------------------------------------
# Global state
# ---------------------------------------------------------------------------
DRY_RUN=false
COPY_MODE=false
YES_MODE=false
COMMAND="install"
SELECTED_AGENTS=""
ONLY_CATEGORIES=""
COPILOT_CONCAT_DIR=""
CURSOR_MIGRATED_LEGACY_COPY_SKILLS=""
BROKEN_COUNT=0
CHECK_FAILURE_COUNT=0

SUMMARY_NEW=0
SUMMARY_UPTODATE=0
SUMMARY_SKIPPED=0
SUMMARY_REMOVED=0
SUMMARY_STALE=0
SUMMARY_BROKEN=0

record_check_failure() {
  CHECK_FAILURE_COUNT=$((CHECK_FAILURE_COUNT + 1))
}

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------
usage() {
  cat <<EOF
Usage: $(basename "$0") [COMMAND] [OPTIONS]

Wire ai-instructions into AI tool configurations via symlinks (or copies).

Commands:
  install              Create symlinks/copies into agent config dirs (default)
  list                 Show all installed symlinks/copies grouped by agent (includes stale)
  remove               Remove symlinks/copies created by this script (includes stale cleanup)
  update               Re-install, cleaning stale symlinks/copies for deleted source files
  check                Verify existing symlinks/copies and detect stale/broken entries

Options:
  --agent <name>       Target a specific agent (cursor, claude, codex, copilot, gemini)
                       Can be repeated. Use --agent '*' for all agents.
  --only <category>    Only process specific categories (instructions, skills, agents)
                       Can be repeated.
  --copilot-concat [DIR]  Concatenate instructions into .github/copilot-instructions.md
                          in DIR (default: current directory). Skips user-maintained files.
                          Can run standalone.
  --copy               Copy files instead of symlinking
  -y, --yes            Skip all prompts (non-interactive mode)
  --dry-run            Show what would be done without making changes
  -h, --help           Show this help message

When no --agent is specified, the script auto-detects installed agents.

Examples:
  $(basename "$0")                              # Auto-detect agents, install all
  $(basename "$0") --agent cursor               # Install into Cursor only
  $(basename "$0") --agent '*' --dry-run        # Preview install for all agents
  $(basename "$0") --only skills --only agents
  $(basename "$0") remove --agent claude
  $(basename "$0") list
  $(basename "$0") update --agent '*'
  $(basename "$0") install --copy --yes
  $(basename "$0") --copilot-concat ~/Code/my-project
EOF
  exit 0
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
contains_word() {
  local list="$1" word="$2" _cw
  for _cw in $list; do
    [ "$_cw" = "$word" ] && return 0
  done
  return 1
}

is_standard_managed_copy() {
  [ -f "$1" ] && ! [ -L "$1" ] && head -1 "$1" 2>/dev/null | grep -Fqx "$MANAGED_MARKER"
}

is_portable_managed_copy() {
  [ -f "$1" ] && ! [ -L "$1" ] || return 1
  [ "$(sed -n '1p' "$1" 2>/dev/null)" = "---" ] || return 1
  tail -1 "$1" 2>/dev/null | grep -Fqx "$MANAGED_MARKER"
}

is_cursor_rule_copy() {
  [ -f "$1" ] && ! [ -L "$1" ] || return 1

  local line1 closing_line marker_line
  line1="$(sed -n '1p' "$1" 2>/dev/null)"
  [ "$line1" = "---" ] || return 1

  closing_line="$(awk 'NR > 1 && $0 == "---" { print NR; exit }' "$1" 2>/dev/null)"
  [ -n "$closing_line" ] || return 1

  marker_line="$(sed -n "$((closing_line + 1))p" "$1" 2>/dev/null)"
  [ "$marker_line" = "$MANAGED_MARKER" ]
}

is_managed_copy() {
  is_standard_managed_copy "$1" || is_portable_managed_copy "$1" || is_cursor_rule_copy "$1" || is_codex_agent_copy "$1"
}

is_managed_copy_current() {
  local src="$1" dst="$2"
  if is_standard_managed_copy "$dst"; then
    tail -n +2 "$dst" | cmp -s "$src" -
  elif is_portable_managed_copy "$dst"; then
    sed '$d' "$dst" | cmp -s "$src" -
  else
    return 1
  fi
}

write_managed_copy() {
  local src="$1" dst="$2"
  if [ "$(sed -n '1p' "$src")" = "---" ]; then
    { cat "$src"; echo "$MANAGED_MARKER"; } > "$dst"
  else
    { echo "$MANAGED_MARKER"; cat "$src"; } > "$dst"
  fi
}

dedupe_words() {
  local input="$1" result=""
  for w in $input; do
    if ! contains_word "$result" "$w"; then
      result="$result $w"
    fi
  done
  echo "$result" | xargs
}

# ---------------------------------------------------------------------------
# Auto-detection
# ---------------------------------------------------------------------------
detect_agents() {
  local detected=""
  for agent in $ALL_AGENTS; do
    local dir
    dir="$(agent_detect_dir "$agent")"
    if [ -n "$dir" ] && [ -d "$dir" ]; then
      detected="$detected $agent"
    fi
  done
  echo "$detected"
}

prompt_agent_selection() {
  local detected
  detected="$(detect_agents)"
  detected="$(echo "$detected" | xargs)"

  if [ -z "$detected" ]; then
    echo "No known agent directories found in \$HOME." >&2
    echo "Use --agent <name> to specify one explicitly, or --agent '*' for all." >&2
    exit 1
  fi

  if $YES_MODE; then
    SELECTED_AGENTS="$detected"
    return
  fi

  echo "Detected agents:"
  local i=1
  for agent in $detected; do
    echo "  $i) $agent ($(agent_detect_dir "$agent"))"
    i=$((i + 1))
  done
  echo "  a) All detected"
  echo ""

  if [ ! -t 0 ]; then
    echo "Cannot prompt for agent selection because stdin is not interactive." >&2
    echo "Re-run with --yes, --agent <name>, or --agent '*'." >&2
    exit 1
  fi

  if ! read -rp "Select agents (numbers separated by spaces, or 'a' for all): " selection; then
    echo "Failed to read agent selection from stdin." >&2
    echo "Re-run with --yes, --agent <name>, or --agent '*'." >&2
    exit 1
  fi

  if [ "$selection" = "a" ] || [ "$selection" = "A" ]; then
    SELECTED_AGENTS="$detected"
  else
    local detected_arr
    # shellcheck disable=SC2206
    detected_arr=($detected)
    for num in $selection; do
      if ! [[ "$num" =~ ^[0-9]+$ ]]; then
        log_warn "Invalid selection (not a number): $num"
        continue
      fi
      local idx=$((num - 1))
      if [ $idx -ge 0 ] && [ $idx -lt ${#detected_arr[@]} ]; then
        SELECTED_AGENTS="$SELECTED_AGENTS ${detected_arr[$idx]}"
      else
        log_warn "Invalid selection (out of range): $num"
      fi
    done
  fi

  SELECTED_AGENTS="$(echo "$SELECTED_AGENTS" | xargs)"

  if [ -z "$SELECTED_AGENTS" ]; then
    echo "No agents selected." >&2
    exit 1
  fi
}

# ---------------------------------------------------------------------------
# File operations
# ---------------------------------------------------------------------------
install_file() {
  local src="$1" dst="$2"

  if [ -L "$dst" ]; then
    local existing_target
    existing_target="$(readlink "$dst")"
    if [ "$existing_target" = "$src" ]; then
      log_skip "$(basename "$dst")" "$dst"
      SUMMARY_UPTODATE=$((SUMMARY_UPTODATE + 1))
      return
    fi
    # During update, repair broken symlinks that point into our repo
    if [ "$COMMAND" = "update" ] && ! [ -e "$dst" ]; then
      case "$existing_target" in
        "$SCRIPT_DIR"/*)
          if $DRY_RUN; then
            if $COPY_MODE; then
              log_dry "replace broken link $dst with copy of $src"
            else
              log_dry "replace broken link $dst -> $src"
            fi
          else
            rm "$dst"
            if $COPY_MODE; then
              write_managed_copy "$src" "$dst"
              log_copy "$(basename "$dst") (repaired)"
            else
              ln -s "$src" "$dst"
              log_action "$(basename "$dst") (repaired)"
            fi
          fi
          SUMMARY_NEW=$((SUMMARY_NEW + 1))
          return
          ;;
      esac
    fi
    log_warn "$(basename "$dst") exists at $dst and points to $existing_target -- skipping"
    SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
    return
  fi

  if [ -e "$dst" ]; then
    if $COPY_MODE && is_managed_copy_current "$src" "$dst"; then
      log_skip "$(basename "$dst")" "$dst"
      SUMMARY_UPTODATE=$((SUMMARY_UPTODATE + 1))
      return
    fi
    if $COPY_MODE && [ "$COMMAND" = "update" ] && is_managed_copy "$dst"; then
      if $DRY_RUN; then
        log_dry "cp (update) $src -> $dst"
      else
        write_managed_copy "$src" "$dst"
        log_copy "$(basename "$dst") (updated)"
      fi
      SUMMARY_NEW=$((SUMMARY_NEW + 1))
      return
    fi
    log_warn "$(basename "$dst") already exists at $dst -- skipping"
    SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
    return
  fi

  if $DRY_RUN; then
    if $COPY_MODE; then
      log_dry "cp $src -> $dst"
    else
      log_dry "ln -s $src -> $dst"
    fi
    SUMMARY_NEW=$((SUMMARY_NEW + 1))
    return
  fi

  mkdir -p "$(dirname "$dst")"
  if $COPY_MODE; then
    write_managed_copy "$src" "$dst"
    log_copy "$(basename "$dst")"
  else
    ln -s "$src" "$dst"
    log_action "$(basename "$dst")"
  fi
  SUMMARY_NEW=$((SUMMARY_NEW + 1))
}

unlink_file() {
  local src="$1" dst="$2"

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
      SUMMARY_REMOVED=$((SUMMARY_REMOVED + 1))
      return
    fi
    log_warn "$(basename "$dst") exists at $dst and points to $existing_target -- skipping"
    SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
    return
  fi

  if is_managed_copy "$dst"; then
    if $DRY_RUN; then
      log_dry "rm $dst (copy)"
    else
      rm "$dst"
      log_remove "$(basename "$dst") (copy)"
    fi
    SUMMARY_REMOVED=$((SUMMARY_REMOVED + 1))
    return
  fi

  if [ -e "$dst" ] && ! [ -L "$dst" ]; then
    log_warn "$(basename "$dst") exists at $dst but was not installed by this script -- skipping"
    SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
  fi
}

check_file() {
  local src="$1" dst="$2"

  if [ -L "$dst" ]; then
    local existing_target
    existing_target="$(readlink "$dst")"
    if ! [ -e "$dst" ]; then
      log_broken "$(basename "$dst") -> $existing_target (target missing)"
      BROKEN_COUNT=$((BROKEN_COUNT + 1))
      SUMMARY_BROKEN=$((SUMMARY_BROKEN + 1))
      record_check_failure
    elif [ "$existing_target" = "$src" ]; then
      log_ok "$(basename "$dst")"
      SUMMARY_UPTODATE=$((SUMMARY_UPTODATE + 1))
    else
      log_warn "$(basename "$dst") exists at $dst but points to $existing_target (expected $src)"
      SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
      record_check_failure
    fi
  elif is_managed_copy "$dst"; then
    if is_managed_copy_current "$src" "$dst"; then
      log_ok "$(basename "$dst") (copy)"
      SUMMARY_UPTODATE=$((SUMMARY_UPTODATE + 1))
    else
      log_warn "$(basename "$dst") (copy, out of date)"
      SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
      record_check_failure
    fi
  elif [ -e "$dst" ]; then
    log_warn "$(basename "$dst") exists at $dst but was not installed by this script"
    SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
    record_check_failure
  fi
}

list_file() {
  local src="$1" dst="$2"

  if [ -L "$dst" ]; then
    local existing_target
    existing_target="$(readlink "$dst")"
    if [ "$existing_target" = "$src" ]; then
      if [ -e "$dst" ]; then
        log_ok "$dst"
      else
        log_broken "$dst (target missing)"
      fi
    fi
  elif is_managed_copy "$dst"; then
    if is_managed_copy_current "$src" "$dst"; then
      log_ok "$dst (copy)"
    else
      log_warn "$dst (copy, out of date)"
    fi
  fi
}

yaml_single_quote() {
  printf '%s' "$1" | sed "s/'/''/g"
}

cursor_rule_description() {
  local src="$1" heading fallback
  heading="$(awk '/^# / { sub(/^# /, ""); print; exit }' "$src")"
  if [ -n "$heading" ]; then
    printf '%s' "$heading"
    return
  fi

  fallback="$(basename "$src")"
  fallback="${fallback%.*}"
  printf '%s' "$fallback" | tr '-' ' '
}

write_cursor_rule_file() {
  local src="$1" dst="$2" content_file="${3:-}"
  local description
  description="$(yaml_single_quote "$(cursor_rule_description "$src")")"

  {
    echo "---"
    printf "description: '%s'\n" "$description"
    echo "alwaysApply: true"
    echo "---"
    echo "$MANAGED_MARKER"
    if [ -n "$content_file" ]; then
      cat "$content_file"
    else
      cat "$src"
    fi
  } > "$dst"
}

is_cursor_rule_current() {
  local src="$1" dst="$2" content_file="${3:-}" generated
  is_cursor_rule_copy "$dst" || return 1

  generated="$(mktemp "${TMPDIR:-/tmp}/ai-cursor-rule.XXXXXX")"
  write_cursor_rule_file "$src" "$generated" "$content_file"

  if cmp -s "$generated" "$dst"; then
    rm "$generated"
    return 0
  fi

  rm "$generated"
  return 1
}

install_cursor_rule() {
  local src="$1" dst="$2" content_file="${3:-}"

  if [ -L "$dst" ]; then
    local existing_target
    existing_target="$(readlink "$dst")"
    case "$existing_target" in
      "$SCRIPT_DIR"/*)
        if $DRY_RUN; then
          log_dry "generate cursor rule -> $dst"
        else
          rm "$dst"
          mkdir -p "$(dirname "$dst")"
          write_cursor_rule_file "$src" "$dst" "$content_file"
          log_copy "$(basename "$dst") (cursor rule)"
        fi
        SUMMARY_NEW=$((SUMMARY_NEW + 1))
        return
        ;;
    esac

    log_warn "$(basename "$dst") exists at $dst and points to $existing_target -- skipping"
    SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
    return
  fi

  if [ -e "$dst" ]; then
    if is_cursor_rule_current "$src" "$dst" "$content_file"; then
      log_skip "$(basename "$dst")" "$dst"
      SUMMARY_UPTODATE=$((SUMMARY_UPTODATE + 1))
      return
    fi
    if [ "$COMMAND" = "update" ] && { is_cursor_rule_copy "$dst" || is_standard_managed_copy "$dst"; }; then
      if $DRY_RUN; then
        log_dry "generate cursor rule -> $dst"
      else
        write_cursor_rule_file "$src" "$dst" "$content_file"
        log_copy "$(basename "$dst") (cursor rule, updated)"
      fi
      SUMMARY_NEW=$((SUMMARY_NEW + 1))
      return
    fi
    if is_cursor_rule_copy "$dst"; then
      log_warn "$(basename "$dst") is outdated; run update to refresh Cursor frontmatter"
      SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
      return
    fi
    if is_standard_managed_copy "$dst"; then
      log_warn "$(basename "$dst") is a legacy managed copy without Cursor frontmatter; run update to regenerate"
      SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
      return
    fi
    log_warn "$(basename "$dst") already exists at $dst -- skipping"
    SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
    return
  fi

  if $DRY_RUN; then
    log_dry "generate cursor rule -> $dst"
    SUMMARY_NEW=$((SUMMARY_NEW + 1))
    return
  fi

  mkdir -p "$(dirname "$dst")"
  write_cursor_rule_file "$src" "$dst" "$content_file"
  log_copy "$(basename "$dst") (cursor rule)"
  SUMMARY_NEW=$((SUMMARY_NEW + 1))
}

check_cursor_rule() {
  local src="$1" dst="$2" content_file="${3:-}"

  if [ -L "$dst" ]; then
    local existing_target
    existing_target="$(readlink "$dst")"
    case "$existing_target" in
      "$SCRIPT_DIR"/*)
        log_warn "$(basename "$dst") is symlinked — missing Cursor frontmatter; run update"
        SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
        record_check_failure
        return
        ;;
    esac

    log_warn "$(basename "$dst") exists at $dst but points to $existing_target"
    SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
    record_check_failure
    return
  fi

  if is_cursor_rule_copy "$dst"; then
    if is_cursor_rule_current "$src" "$dst" "$content_file"; then
      log_ok "$(basename "$dst") (cursor rule)"
      SUMMARY_UPTODATE=$((SUMMARY_UPTODATE + 1))
    else
      log_warn "$(basename "$dst") (cursor rule, out of date)"
      SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
      record_check_failure
    fi
  elif is_standard_managed_copy "$dst"; then
    log_warn "$(basename "$dst") is a legacy managed copy without Cursor frontmatter; run update to regenerate"
    SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
    record_check_failure
  elif [ -e "$dst" ]; then
    log_warn "$(basename "$dst") exists at $dst but was not installed by this script"
    SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
    record_check_failure
  fi
}

list_cursor_rule() {
  local src="$1" dst="$2" content_file="${3:-}"

  if [ -L "$dst" ]; then
    local existing_target
    existing_target="$(readlink "$dst")"
    case "$existing_target" in
      "$SCRIPT_DIR"/*)
        if [ -e "$dst" ]; then
          log_warn "$dst (symlinked, missing Cursor frontmatter)"
        else
          log_broken "$dst (target missing)"
        fi
        return
        ;;
    esac
  elif is_cursor_rule_copy "$dst"; then
    if is_cursor_rule_current "$src" "$dst" "$content_file"; then
      log_ok "$dst (cursor rule)"
    else
      log_warn "$dst (cursor rule, out of date)"
    fi
  elif is_standard_managed_copy "$dst"; then
    log_warn "$dst (legacy managed copy, missing Cursor frontmatter)"
  fi
}

unlink_cursor_rule() {
  local src="$1" dst="$2"

  if [ -L "$dst" ]; then
    local existing_target
    existing_target="$(readlink "$dst")"
    case "$existing_target" in
      "$SCRIPT_DIR"/*)
        if $DRY_RUN; then
          log_dry "rm $dst"
        else
          rm "$dst"
          log_remove "$(basename "$dst")"
        fi
        SUMMARY_REMOVED=$((SUMMARY_REMOVED + 1))
        return
        ;;
    esac

    log_warn "$(basename "$dst") exists at $dst and points to $existing_target -- skipping"
    SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
    return
  fi

  if is_cursor_rule_copy "$dst" || is_standard_managed_copy "$dst"; then
    if $DRY_RUN; then
      log_dry "rm $dst (cursor rule)"
    else
      rm "$dst"
      log_remove "$(basename "$dst") (cursor rule)"
    fi
    SUMMARY_REMOVED=$((SUMMARY_REMOVED + 1))
    return
  fi

  if [ -e "$dst" ] && ! [ -L "$dst" ]; then
    log_warn "$(basename "$dst") exists at $dst but was not installed by this script -- skipping"
    SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
  fi
}

apply_cursor_rule_action() {
  local action="$1" src="$2" dst="$3" content_file="${4:-}"

  case "$action" in
    install_file) install_cursor_rule "$src" "$dst" "$content_file" ;;
    check_file)   check_cursor_rule "$src" "$dst" "$content_file" ;;
    list_file)    list_cursor_rule "$src" "$dst" "$content_file" ;;
    unlink_file)  unlink_cursor_rule "$src" "$dst" ;;
  esac
}

# ---------------------------------------------------------------------------
# Skill directories
#
# Skills can bundle references, scripts, and binary assets alongside SKILL.md.
# Manage the directory as one unit so relative references and file bytes survive.
# ---------------------------------------------------------------------------
skill_directory_link_is_ours() {
  local dst="$1" target
  [ -L "$dst" ] || return 1
  target="$(readlink "$dst")"
  case "$target" in
    "$SCRIPT_DIR"/skills/*) return 0 ;;
    *) return 1 ;;
  esac
}

skill_directory_is_managed_copy() {
  local dst="$1" marker
  [ -d "$dst" ] && ! [ -L "$dst" ] || return 1
  marker="$dst/$SKILL_DIR_MANAGED_MARKER"
  [ -f "$marker" ] && ! [ -L "$marker" ] && grep -Fqx 'ai-instructions:managed' "$marker"
}

skill_directory_is_legacy_managed() {
  local dst="$1" entrypoint target
  [ -d "$dst" ] && ! [ -L "$dst" ] || return 1
  skill_directory_is_managed_copy "$dst" && return 1
  entrypoint="$dst/SKILL.md"

  if is_portable_managed_copy "$entrypoint" || is_standard_managed_copy "$entrypoint"; then
    return 0
  fi

  if [ -L "$entrypoint" ]; then
    target="$(readlink "$entrypoint")"
    case "$target" in
      "$SCRIPT_DIR"/skills/*.md|"$SCRIPT_DIR"/skills/*/SKILL.md) return 0 ;;
    esac
  fi

  return 1
}

legacy_skill_directory_has_unknown_entries() {
  local dst="$1" unknown
  unknown="$(
    find "$dst" -mindepth 1 -maxdepth 1 \
      ! -name 'SKILL.md' \
      ! -name '.DS_Store' \
      ! -name 'Thumbs.db' \
      -print -quit
  )"
  [ -n "$unknown" ]
}

legacy_skill_directory_is_safe_to_replace() {
  local dst="$1"
  skill_directory_is_legacy_managed "$dst" || return 1
  ! legacy_skill_directory_has_unknown_entries "$dst"
}

write_skill_directory_copy() {
  local src="$1" dst="$2"
  mkdir -p "$dst"
  cp -Rp "$src/." "$dst/"
  write_managed_copy "$src/SKILL.md" "$dst/SKILL.md"
  printf 'ai-instructions:managed\n' > "$dst/$SKILL_DIR_MANAGED_MARKER"
}

skill_directory_is_current() {
  local src="$1" dst="$2" target expected status

  if [ -L "$dst" ]; then
    target="$(readlink "$dst")"
    [ "$target" = "$src" ]
    return
  fi

  skill_directory_is_managed_copy "$dst" || return 1
  is_portable_managed_copy "$dst/SKILL.md" || return 1

  expected="$(mktemp -d "${TMPDIR:-/tmp}/ai-skill-copy.XXXXXX")"
  write_skill_directory_copy "$src" "$expected"
  if diff -qr "$expected" "$dst" >/dev/null; then
    status=0
  else
    status=1
  fi
  rm -rf "$expected"
  return "$status"
}

skill_directory_can_update() {
  local dst="$1"

  if skill_directory_link_is_ours "$dst"; then
    return 0
  fi

  if skill_directory_is_managed_copy "$dst"; then
    $COPY_MODE
    return
  fi

  if legacy_skill_directory_is_safe_to_replace "$dst"; then
    if [ -L "$dst/SKILL.md" ]; then
      return 0
    fi
    $COPY_MODE
    return
  fi

  return 1
}

create_skill_directory() {
  local src="$1" dst="$2"
  mkdir -p "$(dirname "$dst")"
  if $COPY_MODE; then
    write_skill_directory_copy "$src" "$dst"
    log_copy "$(basename "$dst")/ (skill)"
  else
    ln -s "$src" "$dst"
    log_action "$(basename "$dst")/ (skill)"
  fi
}

remove_skill_directory() {
  local dst="$1"
  if [ -L "$dst" ]; then
    rm "$dst"
  else
    rm -rf "$dst"
  fi
}

process_skill_directory() {
  local action="$1" src="$2" dst="$3" label
  label="$(basename "$dst")/"

  case "$action" in
    install_file)
      if skill_directory_is_current "$src" "$dst"; then
        log_skip "$label" "$dst"
        SUMMARY_UPTODATE=$((SUMMARY_UPTODATE + 1))
      elif [ -e "$dst" ] || [ -L "$dst" ]; then
        if [ "$COMMAND" = "update" ] && skill_directory_can_update "$dst"; then
          if $DRY_RUN; then
            log_dry "replace managed skill $dst"
          else
            remove_skill_directory "$dst"
            create_skill_directory "$src" "$dst"
          fi
          SUMMARY_NEW=$((SUMMARY_NEW + 1))
        else
          if skill_directory_is_legacy_managed "$dst" && legacy_skill_directory_has_unknown_entries "$dst"; then
            log_warn "$label contains files not installed by this script; preserving the legacy directory"
          elif skill_directory_is_legacy_managed "$dst" && ! $COPY_MODE; then
            log_warn "$label is a legacy managed copy; run update --copy to migrate it without changing install mode"
          elif skill_directory_is_managed_copy "$dst" && ! $COPY_MODE; then
            log_warn "$label is a managed copy; run update --copy to refresh it"
          else
            log_warn "$label exists at $dst but is out of date or was not installed by this script -- skipping"
          fi
          SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
        fi
      elif $DRY_RUN; then
        log_dry "install skill $src -> $dst"
        SUMMARY_NEW=$((SUMMARY_NEW + 1))
      else
        create_skill_directory "$src" "$dst"
        SUMMARY_NEW=$((SUMMARY_NEW + 1))
      fi
      ;;
    check_file)
      if skill_directory_is_current "$src" "$dst"; then
        log_ok "$label (skill)"
        SUMMARY_UPTODATE=$((SUMMARY_UPTODATE + 1))
      elif [ -e "$dst" ] || [ -L "$dst" ]; then
        log_warn "$label (skill, out of date or conflicting)"
        SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
        record_check_failure
      fi
      ;;
    list_file)
      if skill_directory_is_current "$src" "$dst"; then
        log_ok "$dst (skill)"
      elif skill_directory_link_is_ours "$dst" || skill_directory_is_managed_copy "$dst" || skill_directory_is_legacy_managed "$dst"; then
        log_warn "$dst (skill, out of date)"
      fi
      ;;
    unlink_file)
      if skill_directory_link_is_ours "$dst" || skill_directory_is_managed_copy "$dst" || legacy_skill_directory_is_safe_to_replace "$dst"; then
        if $DRY_RUN; then
          log_dry "rm $dst (skill)"
        else
          remove_skill_directory "$dst"
          log_remove "$label (skill)"
        fi
        SUMMARY_REMOVED=$((SUMMARY_REMOVED + 1))
      elif skill_directory_is_legacy_managed "$dst"; then
        if $DRY_RUN; then
          log_dry "rm legacy managed entrypoint $dst/SKILL.md"
        else
          rm "$dst/SKILL.md"
          log_remove "$(basename "$dst")/SKILL.md (legacy managed entrypoint)"
          log_warn "$label contains files not installed by this script; preserving them"
        fi
        SUMMARY_REMOVED=$((SUMMARY_REMOVED + 1))
      elif [ -e "$dst" ] || [ -L "$dst" ]; then
        log_warn "$label at $dst was not installed by this script -- skipping"
        SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
      fi
      ;;
  esac
}

# ---------------------------------------------------------------------------
# Codex custom agents (generated TOML)
# ---------------------------------------------------------------------------
frontmatter_value() {
  local src="$1" key="$2"
  awk -v key="$key" -v src="$src" '
    function fail(message) {
      print "Error: " src ": " message > "/dev/stderr"
      failed = 1
      exit 1
    }

    function trim(value) {
      sub(/^[[:space:]]+/, "", value)
      sub(/[[:space:]]+$/, "", value)
      return value
    }

    BEGIN {
      single_quote = sprintf("%c", 39)
    }

    NR == 1 && $0 == "---" { in_frontmatter = 1; next }
    in_frontmatter && $0 == "---" { exit }

    in_frontmatter && $0 !~ /^[[:space:]]*(#|$)/ {
      match($0, /[^[:space:]]/)
      indentation = RSTART - 1
      if (!root_indentation_set) {
        root_indentation = indentation
        root_indentation_set = 1
      }

      if (indentation != root_indentation) {
        next
      }

      field_pattern = "^[[:space:]]*" key "[[:space:]]*:"
      if (!match($0, field_pattern)) {
        next
      }

      value = trim(substr($0, RLENGTH + 1))
      first_character = substr(value, 1, 1)
      last_character = substr(value, length(value), 1)

      if (first_character == ">" || first_character == "|") {
        fail("frontmatter field \047" key "\047 must use a single-line scalar")
      }

      if (first_character == single_quote) {
        if (length(value) < 2 || last_character != single_quote) {
          fail("frontmatter field \047" key "\047 has an unterminated quoted scalar")
        }
        value = substr(value, 2, length(value) - 2)
        unescaped_value = value
        gsub(single_quote single_quote, "", unescaped_value)
        if (index(unescaped_value, single_quote) > 0) {
          fail("frontmatter field \047" key "\047 has an invalid single-quoted scalar")
        }
        gsub(single_quote single_quote, single_quote, value)
      } else if (first_character == "\"") {
        if (length(value) < 2 || last_character != "\"") {
          fail("frontmatter field \047" key "\047 has an unterminated quoted scalar")
        }
        value = substr(value, 2, length(value) - 2)
        if (index(value, "\\") > 0 || index(value, "\"") > 0) {
          fail("frontmatter field \047" key "\047 uses unsupported quoted escapes")
        }
      } else {
        sub(/[[:space:]]+#.*$/, "", value)
        value = trim(value)
      }

      if (value == "") {
        fail("frontmatter field \047" key "\047 must not be empty")
      }

      found = 1
      print value
      exit
    }

    END {
      if (!found && !failed) {
        fail("missing required frontmatter field \047" key "\047")
      }
    }
  ' "$src"
}

frontmatter_body() {
  awk -v src="$1" '
    NR == 1 && $0 == "---" { in_frontmatter = 1; next }
    in_frontmatter && $0 == "---" { in_frontmatter = 0; found_body = 1; next }
    found_body { print }
    END {
      if (!found_body) {
        print "Error: " src ": missing closing frontmatter delimiter" > "/dev/stderr"
        exit 1
      }
    }
  ' "$1"
}

toml_escape() {
  sed 's/\\/\\\\/g; s/"/\\"/g'
}

emit_codex_agent() {
  local src="$1" name description body_file
  if ! name="$(frontmatter_value "$src" "name")"; then
    return 1
  fi
  if ! description="$(frontmatter_value "$src" "description")"; then
    return 1
  fi
  name="$(printf '%s' "$name" | toml_escape)"
  description="$(printf '%s' "$description" | toml_escape)"
  body_file="$(mktemp "${TMPDIR:-/tmp}/ai-codex-agent-body.XXXXXX")"
  if ! frontmatter_body "$src" > "$body_file"; then
    rm "$body_file"
    return 1
  fi

  echo "name = \"$name\""
  echo "description = \"$description\""
  echo 'developer_instructions = """'
  sed 's/\\/\\\\/g; s/"/\\"/g' "$body_file"
  echo '"""'
  rm "$body_file"
}

validate_agent_sources() {
  local src
  for src in "$SCRIPT_DIR"/agents/*.md; do
    [ -e "$src" ] || continue
    emit_codex_agent "$src" >/dev/null || return 1
  done
}

is_codex_agent_copy() {
  [ -f "$1" ] && ! [ -L "$1" ] && head -1 "$1" 2>/dev/null | grep -Fqx "$TOML_MANAGED_MARKER"
}

codex_agent_current() {
  local generated="$1" dst="$2"
  is_codex_agent_copy "$dst" && cmp -s <(printf '%s\n' "$generated") <(tail -n +2 "$dst")
}

process_codex_agent() {
  local action="$1" src="$2" dst="$3" generated=""

  if [ "$action" != "unlink_file" ] && ! generated="$(emit_codex_agent "$src")"; then
    return 1
  fi

  case "$action" in
    install_file)
      if codex_agent_current "$generated" "$dst"; then
        log_skip "$(basename "$dst")" "$dst"
        SUMMARY_UPTODATE=$((SUMMARY_UPTODATE + 1))
      elif { [ -e "$dst" ] || [ -L "$dst" ]; } && ! is_codex_agent_copy "$dst"; then
        log_warn "$(basename "$dst") exists at $dst but was not installed by this script -- skipping"
        SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
      elif $DRY_RUN; then
        log_dry "generate Codex agent -> $dst"
        SUMMARY_NEW=$((SUMMARY_NEW + 1))
      else
        mkdir -p "$(dirname "$dst")"
        { echo "$TOML_MANAGED_MARKER"; printf '%s\n' "$generated"; } > "$dst"
        log_copy "$(basename "$dst") (Codex agent)"
        SUMMARY_NEW=$((SUMMARY_NEW + 1))
      fi
      ;;
    check_file)
      if codex_agent_current "$generated" "$dst"; then
        log_ok "$(basename "$dst") (Codex agent)"
        SUMMARY_UPTODATE=$((SUMMARY_UPTODATE + 1))
      elif [ -e "$dst" ] || [ -L "$dst" ]; then
        log_warn "$(basename "$dst") (Codex agent, out of date or conflicting)"
        SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
        record_check_failure
      fi
      ;;
    list_file)
      if codex_agent_current "$generated" "$dst"; then
        log_ok "$dst (Codex agent)"
      elif is_codex_agent_copy "$dst"; then
        log_warn "$dst (Codex agent, out of date)"
      fi
      ;;
    unlink_file)
      if is_codex_agent_copy "$dst"; then
        if $DRY_RUN; then
          log_dry "rm $dst (Codex agent)"
        else
          rm "$dst"
          log_remove "$(basename "$dst") (Codex agent)"
        fi
        SUMMARY_REMOVED=$((SUMMARY_REMOVED + 1))
      elif [ -e "$dst" ] || [ -L "$dst" ]; then
        log_warn "$(basename "$dst") at $dst was not installed by this script -- skipping"
        SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
      fi
      ;;
  esac
}

# ---------------------------------------------------------------------------
# Stale cleanup: remove symlinks/managed copies whose source no longer exists
# ---------------------------------------------------------------------------
remove_stale_entry() {
  local path="$1" label="$2" parent_dir="${3:-}"
  if $DRY_RUN; then
    log_dry "rm stale $path"
  else
    if [ -d "$path" ] && ! [ -L "$path" ]; then
      rm -rf "$path"
    else
      rm "$path"
    fi
    if [ -n "$parent_dir" ]; then
      rmdir "$parent_dir" 2>/dev/null || true
    fi
    log_stale "$label"
  fi
  SUMMARY_STALE=$((SUMMARY_STALE + 1))
}

clean_stale_in_dir() {
  local dir="$1" src_dir="$2" nested_file="${3:-}"
  [ -d "$dir" ] || return 0

  for entry in "$dir"/*; do
    [ -e "$entry" ] || [ -L "$entry" ] || continue

    if [ -L "$entry" ]; then
      local target
      target="$(readlink "$entry")"
      case "$target" in
        "$SCRIPT_DIR"/*)
          if [ ! -e "$target" ]; then
            remove_stale_entry "$entry" "$(basename "$entry") -> $target"
          fi
          ;;
      esac
    elif [ -f "$entry" ] && is_managed_copy "$entry"; then
      local base_no_ext
      base_no_ext="$(basename "$entry")"
      base_no_ext="${base_no_ext%.*}"
      if [ ! -e "$src_dir/${base_no_ext}.md" ]; then
        remove_stale_entry "$entry" "$(basename "$entry") (managed copy)"
      fi
    elif [ -d "$entry" ] && [ -n "$nested_file" ]; then
      local nested_path="$entry/$nested_file"
      local skill_name
      skill_name="$(basename "$entry")"
      if skill_directory_is_managed_copy "$entry" && [ ! -e "$src_dir/$skill_name/$nested_file" ]; then
        remove_stale_entry "$entry" "$skill_name/ (managed skill directory)"
      elif [ -L "$nested_path" ]; then
        local target
        target="$(readlink "$nested_path")"
        case "$target" in
          "$SCRIPT_DIR"/*)
            if [ ! -e "$target" ]; then
              remove_stale_entry "$nested_path" "$skill_name/$nested_file -> $target" "$entry"
            fi
            ;;
        esac
      elif is_managed_copy "$nested_path"; then
        if [ ! -e "$src_dir/$skill_name/$nested_file" ]; then
          remove_stale_entry "$nested_path" "$skill_name/$nested_file (managed copy)" "$entry"
        fi
      fi
    fi
  done
}

# ---------------------------------------------------------------------------
# Category filter
# ---------------------------------------------------------------------------
should_process_category() {
  local category="$1"
  if [ -z "$ONLY_CATEGORIES" ]; then
    return 0
  fi
  contains_word "$ONLY_CATEGORIES" "$category"
}

# ---------------------------------------------------------------------------
# Process one agent with a given action function
# ---------------------------------------------------------------------------
process_agent() {
  local agent="$1" action="$2"
  log_header "$agent"

  if [ "$agent" = "cursor" ] && should_process_category "skills"; then
    cursor_clean_legacy_skills "$action"
  fi

  local instr_dir skills_dir agents_dir instr_ext skill_file agent_ext
  instr_dir="$(agent_instr_dir "$agent")"
  instr_ext="$(agent_instr_ext "$agent")"
  skills_dir="$(agent_skills_dir "$agent")"
  skill_file="$(agent_skill_file "$agent")"
  agents_dir="$(agent_agents_dir "$agent")"
  agent_ext="$(agent_agent_ext "$agent")"

  if should_process_category "instructions"; then
    if [ "$agent" = "codex" ]; then
      log "Instructions -> $(codex_agents_file) (concatenated)"
      codex_agents_md "$action"
    elif [ -n "$instr_dir" ]; then
      log "Instructions -> $instr_dir/"
      for f in "$SCRIPT_DIR"/instructions/*.md; do
        [ -e "$f" ] || continue
        local basename_no_ext
        basename_no_ext="$(basename "$f" .md)"
        if [ "$agent" = "cursor" ]; then
          apply_cursor_rule_action "$action" "$f" "$instr_dir/${basename_no_ext}${instr_ext}"
        else
          "$action" "$f" "$instr_dir/${basename_no_ext}${instr_ext}"
        fi
      done
    fi
  fi

  if should_process_category "skills" && [ -n "$skills_dir" ]; then
    log "Skills -> $skills_dir/"
    for f in "$SCRIPT_DIR"/skills/*; do
      [ -f "$f/$skill_file" ] || continue
      local skill_name sdir
      skill_name="$(basename "$f")"
      sdir="$skills_dir/$skill_name"
      if [ "$agent" = "cursor" ] && contains_word "$CURSOR_MIGRATED_LEGACY_COPY_SKILLS" "$skill_name"; then
        continue
      fi
      process_skill_directory "$action" "$f" "$sdir"
    done
  fi

  if should_process_category "agents" && [ -n "$agents_dir" ]; then
    log "Agents -> $agents_dir/"
    for f in "$SCRIPT_DIR"/agents/*.md; do
      [ -e "$f" ] || continue
      local agent_name adst
      agent_name="$(basename "$f" .md)"
      adst="$agents_dir/${agent_name}${agent_ext}"
      if [ "$agent" = "codex" ]; then
        process_codex_agent "$action" "$f" "$adst"
      else
        "$action" "$f" "$adst"
      fi
    done
  fi
}

# Remove skill entries created by older versions at Cursor's reserved
# ~/.cursor/skills-cursor path. User-owned files are always preserved.
cursor_clean_legacy_skills() {
  local action="$1"
  local legacy_dir="$HOME/.cursor/skills-cursor"
  [ -d "$legacy_dir" ] || return 0

  local entry nested target is_ours is_copy skill_name src dst
  for entry in "$legacy_dir"/*; do
    [ -d "$entry" ] || continue
    nested="$entry/SKILL.md"
    is_ours=false
    is_copy=false

    if [ -L "$nested" ]; then
      target="$(readlink "$nested")"
      case "$target" in
        "$SCRIPT_DIR"/skills/*.md|"$SCRIPT_DIR"/skills/*/SKILL.md) is_ours=true ;;
      esac
    elif is_standard_managed_copy "$nested"; then
      is_ours=true
      is_copy=true
    fi

    $is_ours || continue
    case "$action" in
      check_file)
        report_stale_entry "$(basename "$entry")/SKILL.md (legacy Cursor path)"
        ;;
      list_file)
        log_stale "$(basename "$entry")/SKILL.md (legacy Cursor path)"
        SUMMARY_STALE=$((SUMMARY_STALE + 1))
        ;;
      install_file)
        skill_name="$(basename "$entry")"
        src="$SCRIPT_DIR/skills/$skill_name"
        dst="$HOME/.cursor/skills/$skill_name"

        if $is_copy && [ -f "$src/SKILL.md" ]; then
          if [ -e "$dst" ] || [ -L "$dst" ]; then
            if skill_directory_is_current "$src" "$dst"; then
              if $DRY_RUN; then
                log_dry "rm legacy Cursor skill $nested"
              else
                rm "$nested"
                rmdir "$entry" 2>/dev/null || true
                log_stale "$skill_name/SKILL.md (legacy Cursor path)"
              fi
              CURSOR_MIGRATED_LEGACY_COPY_SKILLS="$CURSOR_MIGRATED_LEGACY_COPY_SKILLS $skill_name"
              SUMMARY_STALE=$((SUMMARY_STALE + 1))
            else
              log_warn "$skill_name/ cannot migrate from the legacy Cursor path because $dst already exists; preserving the legacy copy"
              SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
            fi
            continue
          fi

          if $DRY_RUN; then
            log_dry "migrate legacy Cursor skill copy $entry -> $dst"
          else
            write_skill_directory_copy "$src" "$dst"
            rm "$nested"
            rmdir "$entry" 2>/dev/null || true
            log_copy "$skill_name/ (migrated legacy Cursor skill copy)"
          fi
          CURSOR_MIGRATED_LEGACY_COPY_SKILLS="$CURSOR_MIGRATED_LEGACY_COPY_SKILLS $skill_name"
          SUMMARY_NEW=$((SUMMARY_NEW + 1))
          SUMMARY_STALE=$((SUMMARY_STALE + 1))
          continue
        fi

        if $DRY_RUN; then
          log_dry "rm legacy Cursor skill $nested"
        else
          rm "$nested"
          rmdir "$entry" 2>/dev/null || true
          log_stale "$(basename "$entry")/SKILL.md (legacy Cursor path)"
        fi
        SUMMARY_STALE=$((SUMMARY_STALE + 1))
        ;;
      unlink_file)
        if $DRY_RUN; then
          log_dry "rm legacy Cursor skill $nested"
        else
          rm "$nested"
          rmdir "$entry" 2>/dev/null || true
          log_stale "$(basename "$entry")/SKILL.md (legacy Cursor path)"
        fi
        SUMMARY_STALE=$((SUMMARY_STALE + 1))
        ;;
    esac
  done

  if ! $DRY_RUN && { [ "$action" = "install_file" ] || [ "$action" = "unlink_file" ]; }; then
    rmdir "$legacy_dir" 2>/dev/null || true
  fi
}

# ---------------------------------------------------------------------------
# Stale cleanup for one agent
# ---------------------------------------------------------------------------
clean_stale_agent() {
  local agent="$1"
  local instr_dir skills_dir agents_dir skill_file
  instr_dir="$(agent_instr_dir "$agent")"
  skills_dir="$(agent_skills_dir "$agent")"
  skill_file="$(agent_skill_file "$agent")"
  agents_dir="$(agent_agents_dir "$agent")"

  if [ -n "$instr_dir" ]; then clean_stale_in_dir "$instr_dir" "$SCRIPT_DIR/instructions"; fi
  if [ -n "$skills_dir" ]; then clean_stale_in_dir "$skills_dir" "$SCRIPT_DIR/skills" "$skill_file"; fi
  if [ -n "$agents_dir" ]; then clean_stale_in_dir "$agents_dir" "$SCRIPT_DIR/agents"; fi
}

# ---------------------------------------------------------------------------
# Check for stale/broken managed entries (report only)
# ---------------------------------------------------------------------------
report_stale_entry() {
  local label="$1"
  log_broken "$label"
  BROKEN_COUNT=$((BROKEN_COUNT + 1))
  SUMMARY_BROKEN=$((SUMMARY_BROKEN + 1))
  record_check_failure
}

check_stale_in_dir() {
  local dir="$1" src_dir="$2" nested_file="${3:-}"
  [ -d "$dir" ] || return 0

  for entry in "$dir"/*; do
    [ -e "$entry" ] || [ -L "$entry" ] || continue

    if [ -L "$entry" ]; then
      local target
      target="$(readlink "$entry")"
      case "$target" in
        "$SCRIPT_DIR"/*)
          if [ ! -e "$target" ]; then
            report_stale_entry "$(basename "$entry") -> $target (stale)"
          fi
          ;;
      esac
    elif [ -f "$entry" ] && is_managed_copy "$entry"; then
      local base_no_ext
      base_no_ext="$(basename "$entry")"
      base_no_ext="${base_no_ext%.*}"
      if [ ! -e "$src_dir/${base_no_ext}.md" ]; then
        report_stale_entry "$(basename "$entry") (stale managed copy)"
      fi
    elif [ -d "$entry" ] && [ -n "$nested_file" ]; then
      local nested_path="$entry/$nested_file"
      local skill_name
      skill_name="$(basename "$entry")"
      if skill_directory_is_managed_copy "$entry" && [ ! -e "$src_dir/$skill_name/$nested_file" ]; then
        report_stale_entry "$skill_name/ (stale managed skill directory)"
      elif [ -L "$nested_path" ]; then
        local target
        target="$(readlink "$nested_path")"
        case "$target" in
          "$SCRIPT_DIR"/*)
            if [ ! -e "$target" ]; then
              report_stale_entry "$skill_name/$nested_file -> $target (stale)"
            fi
            ;;
        esac
      elif is_managed_copy "$nested_path"; then
        if [ ! -e "$src_dir/$skill_name/$nested_file" ]; then
          report_stale_entry "$skill_name/$nested_file (stale managed copy)"
        fi
      fi
    fi
  done
}

check_stale_agent() {
  local agent="$1"
  local instr_dir skills_dir agents_dir skill_file
  instr_dir="$(agent_instr_dir "$agent")"
  skills_dir="$(agent_skills_dir "$agent")"
  skill_file="$(agent_skill_file "$agent")"
  agents_dir="$(agent_agents_dir "$agent")"

  if [ -n "$instr_dir" ]; then check_stale_in_dir "$instr_dir" "$SCRIPT_DIR/instructions"; fi
  if [ -n "$skills_dir" ]; then check_stale_in_dir "$skills_dir" "$SCRIPT_DIR/skills" "$skill_file"; fi
  if [ -n "$agents_dir" ]; then check_stale_in_dir "$agents_dir" "$SCRIPT_DIR/agents"; fi
}

# ---------------------------------------------------------------------------
# Concatenated instructions (shared by Codex AGENTS.md and Copilot)
#
# Some agents load a single instructions file rather than a directory of
# separate files. This emits every instruction file to stdout, with source
# markers between sections.
# ---------------------------------------------------------------------------
emit_concat_instructions() {
  for f in "$SCRIPT_DIR"/instructions/*.md; do
    [ -e "$f" ] || continue
    echo "<!-- source: $(basename "$f") -->"
    echo ""
    cat "$f"
    echo ""
    echo "---"
    echo ""
  done
}

# ---------------------------------------------------------------------------
# Codex global instructions (~/.codex/AGENTS.md)
#
# Codex reads a single global instructions file on startup, not a directory of
# separate files. We generate ~/.codex/AGENTS.md as a managed, concatenated
# copy (marked with MANAGED_MARKER on line 1, like the auto-generated routing
# file) so install/update/check/remove can own it without clobbering a
# user-maintained AGENTS.md.
# ---------------------------------------------------------------------------
codex_agents_md() {
  local action="$1"
  local dst
  dst="$(codex_agents_file)"

  # Migrate away from the old per-file install location (~/.codex/instructions).
  codex_clean_legacy_instructions "$action"

  local content_file
  content_file="$(mktemp "${TMPDIR:-/tmp}/ai-codex.XXXXXX")"
  emit_concat_instructions > "$content_file"

  case "$action" in
    install_file)
      # The `[ -e ] || [ -L ]` guard intentionally also matches symlinks --
      # including dangling ones, which `-e` alone misses because it follows the
      # link. We never create a symlink at this path, so any symlink here is the
      # user's; skip rather than clobber it (and avoid writing through a broken
      # link, which would error under set -e).
      if is_standard_managed_copy "$dst" && cmp -s "$content_file" <(tail -n +2 "$dst"); then
        log_skip "$(basename "$dst")" "$dst"
        SUMMARY_UPTODATE=$((SUMMARY_UPTODATE + 1))
      elif { [ -e "$dst" ] || [ -L "$dst" ]; } && ! is_standard_managed_copy "$dst"; then
        log_warn "$(basename "$dst") exists at $dst but was not generated by this script -- skipping"
        log_warn "Back up your global instructions, then re-run, or add the marker: $MANAGED_MARKER"
        SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
      elif $DRY_RUN; then
        log_dry "generate concatenated instructions -> $dst"
        SUMMARY_NEW=$((SUMMARY_NEW + 1))
      else
        mkdir -p "$(dirname "$dst")"
        { echo "$MANAGED_MARKER"; cat "$content_file"; } > "$dst"
        log_copy "$(basename "$dst") (concatenated, $(wc -l < "$dst" | tr -d ' ') lines)"
        SUMMARY_NEW=$((SUMMARY_NEW + 1))
      fi
      ;;

    check_file)
      if is_standard_managed_copy "$dst"; then
        if cmp -s "$content_file" <(tail -n +2 "$dst"); then
          log_ok "$(basename "$dst") (concatenated)"
          SUMMARY_UPTODATE=$((SUMMARY_UPTODATE + 1))
        else
          log_warn "$(basename "$dst") (concatenated, out of date) -- run update"
          SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
          record_check_failure
        fi
      elif [ -e "$dst" ] || [ -L "$dst" ]; then
        log_warn "$(basename "$dst") at $dst was not generated by this script"
        SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
        record_check_failure
      fi
      ;;

    list_file)
      if is_standard_managed_copy "$dst"; then
        if cmp -s "$content_file" <(tail -n +2 "$dst"); then
          log_ok "$dst (concatenated)"
        else
          log_warn "$dst (concatenated, out of date)"
        fi
      fi
      ;;

    unlink_file)
      if is_standard_managed_copy "$dst"; then
        if $DRY_RUN; then
          log_dry "rm $dst (concatenated)"
        else
          rm "$dst"
          log_remove "$(basename "$dst") (concatenated)"
        fi
        SUMMARY_REMOVED=$((SUMMARY_REMOVED + 1))
      elif [ -e "$dst" ] || [ -L "$dst" ]; then
        log_warn "$(basename "$dst") at $dst was not generated by this script -- skipping"
        SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
      fi
      ;;
  esac

  rm "$content_file"
}

# Remove managed entries left behind by the previous Codex layout
# (~/.codex/instructions/*). Runs on install/update/remove so upgrading users
# do not accumulate dead files. Only touches our own artifacts -- symlinks that
# point at the legacy install targets ($SCRIPT_DIR/instructions/*) and managed
# copies (marker on line 1). User-authored files, and symlinks that happen to
# point elsewhere in the repo (for example, skills or agents), are left alone.
codex_clean_legacy_instructions() {
  local action="$1"
  case "$action" in
    install_file|unlink_file) ;;  # install, update, remove
    *) return 0 ;;
  esac

  local legacy_dir="$HOME/.codex/instructions"
  [ -d "$legacy_dir" ] || return 0

  local removed_any=false entry
  for entry in "$legacy_dir"/*; do
    [ -e "$entry" ] || [ -L "$entry" ] || continue
    local is_ours=false
    if [ -L "$entry" ]; then
      case "$(readlink "$entry")" in "$SCRIPT_DIR"/instructions/*) is_ours=true ;; esac
    elif is_standard_managed_copy "$entry"; then
      is_ours=true
    fi
    $is_ours || continue
    if $DRY_RUN; then
      log_dry "rm stale $entry (legacy Codex instructions)"
    else
      rm "$entry"
      log_stale "$(basename "$entry") (legacy Codex instructions)"
    fi
    SUMMARY_STALE=$((SUMMARY_STALE + 1))
    removed_any=true
  done

  if $removed_any && ! $DRY_RUN; then
    rmdir "$legacy_dir" 2>/dev/null || true
  fi
}

# ---------------------------------------------------------------------------
# Copilot concatenation (targets a specific repo directory, separate flow)
# ---------------------------------------------------------------------------
COPILOT_CONCAT_MARKER="<!-- Auto-generated by ai-instructions/setup.sh --copilot-concat -->"

is_generated_copilot_file() {
  [ -f "$1" ] && head -1 "$1" 2>/dev/null | grep -q "^$COPILOT_CONCAT_MARKER$"
}

copilot_concat() {
  local target_dir="${COPILOT_CONCAT_DIR:-.}"
  local github_dir="$target_dir/.github"
  local output_file="$github_dir/copilot-instructions.md"

  log_header "GitHub Copilot (concatenated instructions)"
  log "Generating $output_file"

  if [ -f "$output_file" ] && ! is_generated_copilot_file "$output_file"; then
    log_warn "$output_file already exists and was not generated by this script -- skipping"
    log_warn "Delete the file manually or add the marker: $COPILOT_CONCAT_MARKER"
    return
  fi

  if $DRY_RUN; then
    log_dry "Concatenate all instructions -> $output_file"
    for f in "$SCRIPT_DIR"/instructions/*.md; do
      [ -e "$f" ] || continue
      log_dry "  include $(basename "$f")"
    done
    return
  fi

  mkdir -p "$github_dir"

  {
    echo "$COPILOT_CONCAT_MARKER"
    echo "<!-- Do not edit manually. Re-run setup.sh to update. -->"
    echo ""
    emit_concat_instructions
  } > "$output_file"

  log_action "$(basename "$output_file") ($(wc -l < "$output_file" | tr -d ' ') lines)"
}

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print_summary() {
  echo ""
  echo -e "${C_BOLD}Summary${C_RESET}"

  case "$COMMAND" in
    install|update)
      echo -e "  Newly linked/copied: ${C_GREEN}${SUMMARY_NEW}${C_RESET}"
      echo -e "  Already up to date:  ${SUMMARY_UPTODATE}"
      if [ "$SUMMARY_SKIPPED" -gt 0 ]; then echo -e "  Skipped (conflict):  ${C_YELLOW}${SUMMARY_SKIPPED}${C_RESET}"; fi
      if [ "$SUMMARY_STALE" -gt 0 ]; then echo -e "  Stale removed:       ${C_YELLOW}${SUMMARY_STALE}${C_RESET}"; fi
      ;;
    remove)
      echo -e "  Removed: ${C_RED}${SUMMARY_REMOVED}${C_RESET}"
      if [ "$SUMMARY_SKIPPED" -gt 0 ]; then echo -e "  Skipped (conflict):  ${C_YELLOW}${SUMMARY_SKIPPED}${C_RESET}"; fi
      ;;
    check)
      echo -e "  OK:     ${C_GREEN}${SUMMARY_UPTODATE}${C_RESET}"
      if [ "$SUMMARY_SKIPPED" -gt 0 ]; then echo -e "  Conflict: ${C_YELLOW}${SUMMARY_SKIPPED}${C_RESET}"; fi
      if [ "$SUMMARY_BROKEN" -gt 0 ]; then echo -e "  Broken: ${C_RED}${SUMMARY_BROKEN}${C_RESET}"; fi
      ;;
  esac
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
parse_args() {
  case "${1:-}" in
    install|list|remove|update|check)
      COMMAND="$1"
      shift
      ;;
  esac

  while [ $# -gt 0 ]; do
    case "$1" in
      --agent)
        shift
        if [ $# -eq 0 ]; then echo "Error: --agent requires a value" >&2; exit 1; fi
        if [ "$1" = "*" ]; then
          SELECTED_AGENTS="$ALL_AGENTS"
        else
          if ! contains_word "$ALL_AGENTS" "$1"; then
            echo "Error: unknown agent '$1'. Available: $ALL_AGENTS" >&2
            exit 1
          fi
          SELECTED_AGENTS="$SELECTED_AGENTS $1"
        fi
        shift
        ;;
      --only)
        shift
        if [ $# -eq 0 ]; then echo "Error: --only requires a value" >&2; exit 1; fi
        case "$1" in
          instructions|skills|agents) ONLY_CATEGORIES="$ONLY_CATEGORIES $1" ;;
          personas)
            log_warn "--only personas is deprecated; use --only agents"
            ONLY_CATEGORIES="$ONLY_CATEGORIES agents"
            ;;
          *) echo "Error: --only value must be instructions, skills, or agents" >&2; exit 1 ;;
        esac
        shift
        ;;
      --copilot-concat)
        shift
        if [ $# -gt 0 ] && [[ "$1" != -* ]]; then
          COPILOT_CONCAT_DIR="$1"
          shift
        else
          COPILOT_CONCAT_DIR="."
        fi
        ;;
      --copy)    COPY_MODE=true; shift ;;
      -y|--yes)  YES_MODE=true; shift ;;
      --dry-run) DRY_RUN=true; shift ;;
      -h|--help) usage ;;
      *)
        echo "Unknown option: $1" >&2
        echo "Run '$(basename "$0") --help' for usage." >&2
        exit 1
        ;;
    esac
  done

  SELECTED_AGENTS="$(echo "$SELECTED_AGENTS" | xargs)"
  ONLY_CATEGORIES="$(echo "$ONLY_CATEGORIES" | xargs)"

  SELECTED_AGENTS="$(dedupe_words "$SELECTED_AGENTS")"

  # --copilot-concat is only valid with install/update
  if [ -n "$COPILOT_CONCAT_DIR" ]; then
    case "$COMMAND" in
      install|update) ;;
      *) echo "Error: --copilot-concat can only be used with install or update" >&2; exit 1 ;;
    esac
  fi
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  parse_args "$@"

  if [ -z "$SELECTED_AGENTS" ]; then
    if [ -n "$COPILOT_CONCAT_DIR" ]; then
      # With --copilot-concat and no --agent, auto-detect silently (don't prompt)
      SELECTED_AGENTS="$(detect_agents | xargs)"
    else
      prompt_agent_selection
    fi
    SELECTED_AGENTS="$(dedupe_words "$SELECTED_AGENTS")"
  fi

  echo -e "${C_BOLD}ai-instructions${C_RESET} (source: $SCRIPT_DIR)"
  if $DRY_RUN; then echo -e "${C_CYAN}(dry-run mode -- no changes will be made)${C_RESET}"; fi
  if $COPY_MODE; then echo "(copy mode -- files will be copied instead of symlinked)"; fi
  if [ -n "$SELECTED_AGENTS" ]; then echo "Agents: $SELECTED_AGENTS"; fi

  case "$COMMAND" in
    install|update)
      if [ -n "$SELECTED_AGENTS" ] && should_process_category "agents"; then
        validate_agent_sources || exit 1
      fi
      ;;
  esac

  case "$COMMAND" in
    install)
      for agent in $SELECTED_AGENTS; do
        process_agent "$agent" install_file
      done
      if [ -n "$COPILOT_CONCAT_DIR" ]; then copilot_concat; fi
      print_summary
      ;;
    list)
      for agent in $SELECTED_AGENTS; do
        process_agent "$agent" list_file
        check_stale_agent "$agent"
      done
      ;;
    remove)
      for agent in $SELECTED_AGENTS; do
        process_agent "$agent" unlink_file
        clean_stale_agent "$agent"
      done
      print_summary
      ;;
    update)
      for agent in $SELECTED_AGENTS; do
        clean_stale_agent "$agent"
        process_agent "$agent" install_file
      done
      if [ -n "$COPILOT_CONCAT_DIR" ]; then copilot_concat; fi
      print_summary
      ;;
    check)
      for agent in $SELECTED_AGENTS; do
        process_agent "$agent" check_file
        check_stale_agent "$agent"
      done
      print_summary
      if [ "$CHECK_FAILURE_COUNT" -gt 0 ]; then
        exit 1
      fi
      ;;
  esac
}

main "$@"
