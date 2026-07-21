#!/usr/bin/env sh
set -eu

if ! command -v node >/dev/null 2>&1; then
	echo "ai-instructions requires Node.js 22 or newer, but 'node' was not found on PATH." >&2
	exit 1
fi

SCRIPT_PATH=$0
case $SCRIPT_PATH in
	*/*) ;;
	*)
		if [ -f "$SCRIPT_PATH" ]; then
			SCRIPT_PATH=./$SCRIPT_PATH
		elif RESOLVED_PATH=$(command -v "$SCRIPT_PATH" 2>/dev/null); then
			SCRIPT_PATH=$RESOLVED_PATH
		fi
		;;
esac

case $SCRIPT_PATH in
	*/*) SCRIPT_DIR=${SCRIPT_PATH%/*} ;;
	*) SCRIPT_DIR=. ;;
esac
[ -n "$SCRIPT_DIR" ] || SCRIPT_DIR=/
case $SCRIPT_DIR in
	-*) SCRIPT_DIR="./$SCRIPT_DIR" ;;
esac
SCRIPT_DIR="$(CDPATH= cd "$SCRIPT_DIR" && pwd)"
exec node "$SCRIPT_DIR/scripts/setup.mjs" "$@"
