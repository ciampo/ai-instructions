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
#   personas_dir   — where persona files go (empty = not supported)
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

agent_instr_dir() {
  case "$1" in
    cursor)  echo "$HOME/.cursor/rules" ;;
    claude)  echo "$HOME/.claude/rules" ;;
    codex)   echo "$HOME/.codex/instructions" ;;
    copilot) echo "" ;;
    gemini)  echo "" ;;
  esac
}

agent_instr_ext() {
  case "$1" in
    cursor) echo ".mdc" ;;
    *)      echo ".md" ;;
  esac
}

agent_skills_dir() {
  case "$1" in
    cursor)  echo "$HOME/.cursor/skills-cursor" ;;
    claude)  echo "$HOME/.claude/skills" ;;
    codex)   echo "" ;;
    copilot) echo "$HOME/.copilot/skills" ;;
    gemini)  echo "$HOME/.gemini/skills" ;;
  esac
}

agent_skill_file() {
  echo "SKILL.md"
}

agent_personas_dir() {
  case "$1" in
    cursor) echo "$HOME/.cursor/agents" ;;
    *)      echo "" ;;
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
BROKEN_COUNT=0

SUMMARY_NEW=0
SUMMARY_UPTODATE=0
SUMMARY_SKIPPED=0
SUMMARY_REMOVED=0
SUMMARY_STALE=0
SUMMARY_BROKEN=0

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
  update               Re-install, cleaning stale symlinks for deleted source files
  check                Verify existing symlinks/copies are valid and targets exist

Options:
  --agent <name>       Target a specific agent (cursor, claude, codex, copilot, gemini)
                       Can be repeated. Use --agent '*' for all agents.
  --only <category>    Only process specific categories (instructions, skills, personas)
                       Can be repeated.
  --copilot-concat [DIR]  Concatenate instructions into .github/copilot-instructions.md
                          in DIR (default: current directory). Can run standalone.
  --copy               Copy files instead of symlinking
  -y, --yes            Skip all prompts (non-interactive mode)
  --dry-run            Show what would be done without making changes
  -h, --help           Show this help message

When no --agent is specified, the script auto-detects installed agents.

Examples:
  $(basename "$0")                              # Auto-detect agents, install all
  $(basename "$0") --agent cursor               # Install into Cursor only
  $(basename "$0") --agent '*' --dry-run        # Preview install for all agents
  $(basename "$0") --only skills --only personas
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

is_managed_copy() {
  [ -f "$1" ] && ! [ -L "$1" ] && head -1 "$1" 2>/dev/null | grep -q "^<!-- ai-instructions:managed -->$"
}

is_managed_copy_current() {
  local src="$1" dst="$2"
  is_managed_copy "$dst" && tail -n +2 "$dst" | cmp -s "$src" -
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
              { echo "<!-- ai-instructions:managed -->"; cat "$src"; } > "$dst"
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
        { echo "<!-- ai-instructions:managed -->"; cat "$src"; } > "$dst"
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
    { echo "<!-- ai-instructions:managed -->"; cat "$src"; } > "$dst"
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
    elif [ "$existing_target" = "$src" ]; then
      log_ok "$(basename "$dst")"
      SUMMARY_UPTODATE=$((SUMMARY_UPTODATE + 1))
    else
      log_warn "$(basename "$dst") exists at $dst but points to $existing_target (expected $src)"
      SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
    fi
  elif is_managed_copy "$dst"; then
    if is_managed_copy_current "$src" "$dst"; then
      log_ok "$(basename "$dst") (copy)"
      SUMMARY_UPTODATE=$((SUMMARY_UPTODATE + 1))
    else
      log_warn "$(basename "$dst") (copy, out of date)"
      SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
    fi
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

# ---------------------------------------------------------------------------
# Stale cleanup: remove symlinks/managed copies whose source no longer exists
# ---------------------------------------------------------------------------
remove_stale_entry() {
  local path="$1" label="$2" parent_dir="${3:-}"
  if $DRY_RUN; then
    log_dry "rm stale $path"
  else
    rm "$path"
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
      if [ -L "$nested_path" ]; then
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
        if [ ! -e "$src_dir/${skill_name}.md" ]; then
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

  local instr_dir skills_dir personas_dir instr_ext skill_file
  instr_dir="$(agent_instr_dir "$agent")"
  instr_ext="$(agent_instr_ext "$agent")"
  skills_dir="$(agent_skills_dir "$agent")"
  skill_file="$(agent_skill_file "$agent")"
  personas_dir="$(agent_personas_dir "$agent")"

  if should_process_category "instructions" && [ -n "$instr_dir" ]; then
    log "Instructions -> $instr_dir/"
    for f in "$SCRIPT_DIR"/instructions/*.md; do
      [ -e "$f" ] || continue
      local basename_no_ext
      basename_no_ext="$(basename "$f" .md)"
      "$action" "$f" "$instr_dir/${basename_no_ext}${instr_ext}"
    done
  fi

  if should_process_category "skills" && [ -n "$skills_dir" ]; then
    log "Skills -> $skills_dir/"
    for f in "$SCRIPT_DIR"/skills/*.md; do
      [ -e "$f" ] || continue
      local skill_name
      skill_name="$(basename "$f" .md)"
      local sdir="$skills_dir/$skill_name"
      if [ "$action" = "install_file" ] && ! $DRY_RUN; then
        mkdir -p "$sdir"
      fi
      "$action" "$f" "$sdir/$skill_file"
      if [ "$action" = "unlink_file" ] && ! $DRY_RUN; then
        rmdir "$sdir" 2>/dev/null || true
      fi
    done
  fi

  if should_process_category "personas" && [ -n "$personas_dir" ]; then
    log "Personas -> $personas_dir/"
    for f in "$SCRIPT_DIR"/personas/*.md; do
      [ -e "$f" ] || continue
      "$action" "$f" "$personas_dir/$(basename "$f")"
    done
  fi

  if [ "$action" = "install_file" ] && [ "$agent" = "claude" ]; then
    echo ""
    log "Reminder: reference instructions from your CLAUDE.md if not already done."
  fi
}

# ---------------------------------------------------------------------------
# Stale cleanup for one agent
# ---------------------------------------------------------------------------
clean_stale_agent() {
  local agent="$1"
  local instr_dir skills_dir personas_dir skill_file
  instr_dir="$(agent_instr_dir "$agent")"
  skills_dir="$(agent_skills_dir "$agent")"
  skill_file="$(agent_skill_file "$agent")"
  personas_dir="$(agent_personas_dir "$agent")"

  if [ -n "$instr_dir" ]; then clean_stale_in_dir "$instr_dir" "$SCRIPT_DIR/instructions"; fi
  if [ -n "$skills_dir" ]; then clean_stale_in_dir "$skills_dir" "$SCRIPT_DIR/skills" "$skill_file"; fi
  if [ -n "$personas_dir" ]; then clean_stale_in_dir "$personas_dir" "$SCRIPT_DIR/personas"; fi
}

# ---------------------------------------------------------------------------
# Check for stale/broken managed entries (report only)
# ---------------------------------------------------------------------------
report_stale_entry() {
  local label="$1"
  log_broken "$label"
  BROKEN_COUNT=$((BROKEN_COUNT + 1))
  SUMMARY_BROKEN=$((SUMMARY_BROKEN + 1))
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
      if [ -L "$nested_path" ]; then
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
        if [ ! -e "$src_dir/${skill_name}.md" ]; then
          report_stale_entry "$skill_name/$nested_file (stale managed copy)"
        fi
      fi
    fi
  done
}

check_stale_agent() {
  local agent="$1"
  local instr_dir skills_dir personas_dir skill_file
  instr_dir="$(agent_instr_dir "$agent")"
  skills_dir="$(agent_skills_dir "$agent")"
  skill_file="$(agent_skill_file "$agent")"
  personas_dir="$(agent_personas_dir "$agent")"

  if [ -n "$instr_dir" ]; then check_stale_in_dir "$instr_dir" "$SCRIPT_DIR/instructions"; fi
  if [ -n "$skills_dir" ]; then check_stale_in_dir "$skills_dir" "$SCRIPT_DIR/skills" "$skill_file"; fi
  if [ -n "$personas_dir" ]; then check_stale_in_dir "$personas_dir" "$SCRIPT_DIR/personas"; fi
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
    for f in "$SCRIPT_DIR"/instructions/*.md; do
      [ -e "$f" ] || continue
      cat "$f"
      echo ""
      echo "---"
      echo ""
    done
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
          instructions|skills|personas) ONLY_CATEGORIES="$ONLY_CATEGORIES $1" ;;
          *) echo "Error: --only value must be instructions, skills, or personas" >&2; exit 1 ;;
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
      if [ "$BROKEN_COUNT" -gt 0 ]; then
        exit 1
      fi
      ;;
  esac
}

main "$@"
