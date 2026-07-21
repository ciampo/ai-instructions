#!/usr/bin/env sh
set -eu

if ! command -v node >/dev/null 2>&1; then
	echo "ai-instructions requires Node.js 22 or newer, but 'node' was not found on PATH." >&2
	exit 1
fi

case $0 in
	*/*) SCRIPT_DIR=${0%/*} ;;
	*) SCRIPT_DIR=. ;;
esac
[ -n "$SCRIPT_DIR" ] || SCRIPT_DIR=/
case $SCRIPT_DIR in
	-*) SCRIPT_DIR="./$SCRIPT_DIR" ;;
esac
SCRIPT_DIR="$(CDPATH= cd "$SCRIPT_DIR" && pwd)"
exec node "$SCRIPT_DIR/scripts/setup.mjs" "$@"
