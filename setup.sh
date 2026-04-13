#!/usr/bin/env bash
set -euo pipefail

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
log_skip()   { echo -e "  ${C_DIM}[=] $1 (already linked)${C_RESET}"; }
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
STALE_COUNT=0

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
  list                 Show all installed symlinks grouped by agent
  remove               Remove symlinks/copies created by this script
  update               Re-install, cleaning stale links for deleted source files
  check                Verify existing symlinks are valid and targets exist

Options:
  --agent <name>       Target a specific agent (cursor, claude, codex, copilot, gemini)
                       Can be repeated. Use --agent '*' for all agents.
  --only <category>    Only install specific categories (instructions, skills, personas)
                       Can be repeated.
  --copilot-concat [DIR]  Concatenate instructions into .github/copilot-instructions.md
                          in DIR (default: current directory)
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
  local list="$1" word="$2"
  for w in $list; do
    [ "$w" = "$word" ] && return 0
  done
  return 1
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

  read -rp "Select agents (numbers separated by spaces, or 'a' for all): " selection

  if [ "$selection" = "a" ] || [ "$selection" = "A" ]; then
    SELECTED_AGENTS="$detected"
  else
    local detected_arr
    # shellcheck disable=SC2206
    detected_arr=($detected)
    for num in $selection; do
      local idx=$((num - 1))
      if [ $idx -ge 0 ] && [ $idx -lt ${#detected_arr[@]} ]; then
        SELECTED_AGENTS="$SELECTED_AGENTS ${detected_arr[$idx]}"
      else
        log_warn "Invalid selection: $num"
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
      log_skip "$(basename "$dst")"
      SUMMARY_UPTODATE=$((SUMMARY_UPTODATE + 1))
      return
    fi
    log_warn "$(basename "$dst") exists at $dst and points to $existing_target -- skipping"
    SUMMARY_SKIPPED=$((SUMMARY_SKIPPED + 1))
    return
  fi

  if [ -e "$dst" ]; then
    if $COPY_MODE && cmp -s "$src" "$dst"; then
      log_skip "$(basename "$dst")"
      SUMMARY_UPTODATE=$((SUMMARY_UPTODATE + 1))
      return
    fi
    log_warn "$(basename "$dst") exists at $dst and differs from source -- skipping"
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
    cp "$src" "$dst"
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
  fi

  if [ -e "$dst" ] && ! [ -L "$dst" ] && cmp -s "$src" "$dst"; then
    if $DRY_RUN; then
      log_dry "rm $dst (copy)"
    else
      rm "$dst"
      log_remove "$(basename "$dst") (copy)"
    fi
    SUMMARY_REMOVED=$((SUMMARY_REMOVED + 1))
    return
  fi
}

check_file() {
  local src="$1" dst="$2"

  if [ -L "$dst" ]; then
    local existing_target
    existing_target="$(readlink "$dst")"
    if [ "$existing_target" = "$src" ]; then
      if [ -e "$dst" ]; then
        log_ok "$(basename "$dst")"
        SUMMARY_UPTODATE=$((SUMMARY_UPTODATE + 1))
      else
        log_broken "$(basename "$dst") -> $existing_target (target missing)"
        BROKEN_COUNT=$((BROKEN_COUNT + 1))
        SUMMARY_BROKEN=$((SUMMARY_BROKEN + 1))
      fi
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
  elif [ -e "$dst" ] && ! [ -L "$dst" ] && cmp -s "$src" "$dst"; then
    log_ok "$dst (copy)"
  fi
}

# ---------------------------------------------------------------------------
# Stale symlink cleanup: remove symlinks pointing into SCRIPT_DIR whose
# source no longer exists
# ---------------------------------------------------------------------------
clean_stale_in_dir() {
  local dir="$1"
  [ -d "$dir" ] || return 0

  for entry in "$dir"/*; do
    [ -e "$entry" ] || [ -L "$entry" ] || continue

    if [ -L "$entry" ]; then
      local target
      target="$(readlink "$entry")"
      case "$target" in
        "$SCRIPT_DIR"/*)
          if [ ! -e "$target" ]; then
            if $DRY_RUN; then
              log_dry "rm stale $entry -> $target"
            else
              rm "$entry"
              log_stale "$(basename "$entry") -> $target"
            fi
            STALE_COUNT=$((STALE_COUNT + 1))
            SUMMARY_STALE=$((SUMMARY_STALE + 1))
          fi
          ;;
      esac
    elif [ -d "$entry" ]; then
      local skill_file="$entry/SKILL.md"
      if [ -L "$skill_file" ]; then
        local target
        target="$(readlink "$skill_file")"
        case "$target" in
          "$SCRIPT_DIR"/*)
            if [ ! -e "$target" ]; then
              if $DRY_RUN; then
                log_dry "rm stale $skill_file -> $target"
              else
                rm "$skill_file"
                rmdir "$entry" 2>/dev/null || true
                log_stale "$(basename "$entry")/SKILL.md -> $target"
              fi
              STALE_COUNT=$((STALE_COUNT + 1))
              SUMMARY_STALE=$((SUMMARY_STALE + 1))
            fi
            ;;
        esac
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
  local instr_dir skills_dir personas_dir
  instr_dir="$(agent_instr_dir "$agent")"
  skills_dir="$(agent_skills_dir "$agent")"
  personas_dir="$(agent_personas_dir "$agent")"

  [ -n "$instr_dir" ] && clean_stale_in_dir "$instr_dir"
  [ -n "$skills_dir" ] && clean_stale_in_dir "$skills_dir"
  [ -n "$personas_dir" ] && clean_stale_in_dir "$personas_dir"
}

# ---------------------------------------------------------------------------
# Copilot concatenation (targets a specific repo directory, separate flow)
# ---------------------------------------------------------------------------
copilot_concat() {
  local target_dir="${COPILOT_CONCAT_DIR:-.}"
  local github_dir="$target_dir/.github"
  local output_file="$github_dir/copilot-instructions.md"

  log_header "GitHub Copilot (concatenated instructions)"
  log "Generating $output_file"

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
    echo "<!-- Auto-generated by ai-instructions/setup.sh --copilot-concat -->"
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
      ;;
    check)
      echo -e "  OK:     ${C_GREEN}${SUMMARY_UPTODATE}${C_RESET}"
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
        if [ $# -gt 0 ] && [[ ! "$1" =~ ^-- ]]; then
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

  # Deduplicate agents while preserving order
  local deduped=""
  for a in $SELECTED_AGENTS; do
    if ! contains_word "$deduped" "$a"; then
      deduped="$deduped $a"
    fi
  done
  SELECTED_AGENTS="$(echo "$deduped" | xargs)"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
main() {
  parse_args "$@"

  if [ -z "$SELECTED_AGENTS" ]; then
    prompt_agent_selection
  fi

  echo -e "${C_BOLD}ai-instructions${C_RESET} (source: $SCRIPT_DIR)"
  if $DRY_RUN; then echo -e "${C_CYAN}(dry-run mode -- no changes will be made)${C_RESET}"; fi
  if $COPY_MODE; then echo "(copy mode -- files will be copied instead of symlinked)"; fi
  echo "Agents: $SELECTED_AGENTS"

  case "$COMMAND" in
    install)
      for agent in $SELECTED_AGENTS; do
        process_agent "$agent" install_file
      done
      [ -n "$COPILOT_CONCAT_DIR" ] && copilot_concat
      print_summary
      ;;
    list)
      for agent in $SELECTED_AGENTS; do
        process_agent "$agent" list_file
      done
      ;;
    remove)
      for agent in $SELECTED_AGENTS; do
        process_agent "$agent" unlink_file
      done
      print_summary
      ;;
    update)
      for agent in $SELECTED_AGENTS; do
        clean_stale_agent "$agent"
        process_agent "$agent" install_file
      done
      [ -n "$COPILOT_CONCAT_DIR" ] && copilot_concat
      print_summary
      ;;
    check)
      for agent in $SELECTED_AGENTS; do
        process_agent "$agent" check_file
      done
      print_summary
      if [ "$BROKEN_COUNT" -gt 0 ]; then
        exit 1
      fi
      ;;
  esac
}

main "$@"
