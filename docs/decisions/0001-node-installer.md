# ADR 0001: Use a Manifest-Driven Node Installer

- **Status:** Accepted
- **Date:** 2026-07-21

## Context

The original installer encoded product detection, paths, formats, capabilities, migration rules, and lifecycle operations in one Bash file. Its safe ownership checks were valuable, but every platform change required coordinated edits across distant case statements. The hand-maintained README table could then drift from the implementation.

The repository already requires Node.js for linting. The modernization baseline also added behavior-locking integration tests for the existing Cursor and Codex safety semantics before this decision was implemented.

## Options Considered

### Continue with one Bash script

This preserves stock-macOS compatibility without another runtime, but retains duplicated platform branching and makes structured format generation, staged replacement, native Windows support, and shared data validation difficult.

### Split Bash into sourced modules

This improves file size and navigation but does not provide a natural typed data model. Cross-platform path handling and structured JSON, YAML-frontmatter, and TOML generation would still depend on shell-specific behavior and external utilities.

### Use a dependency-free Node CLI behind the shell entrypoint

This allows a JSON platform manifest, built-in cross-platform filesystem APIs, no-clobber writes, deterministic generators, and Node's test runner without adding a runtime dependency beyond the repository's existing requirement.

## Decision

Use a dependency-free Node.js 22+ CLI as the installer implementation. Keep `setup.sh` as a small compatibility wrapper for macOS, Linux, and WSL. Native Windows users run `node scripts/setup.mjs` and use `--copy` unless their environment permits file symlinks.

The platform manifest is the source of truth for:

- product surface and detection;
- supported instruction, skill, and agent capabilities;
- user and project destinations;
- formats and generators;
- precedence and conflict behavior;
- legacy managed destinations;
- support tier, documentation, and verification date.

Generated and copied artifacts are staged in a temporary sibling before publication. New file paths use an atomic no-clobber hard link; managed replacements are captured and revalidated before the staged artifact is published. Copied skill directories use exclusive creation for every directory, file, and symlink because Node does not expose a portable atomic rename-if-absent operation for directories. Conditional replacement prioritizes never overwriting an unexpected path over uninterrupted visibility during the replacement window. The installer never removes an artifact unless a strict managed marker or repository-owned symlink proves ownership, and it preserves captured originals when recovery cannot safely restore them.

## Consequences

- Node.js 22+ is now required to run the installer, not only development tooling.
- Platform additions require one manifest entry plus format-specific code only when the native format is new.
- The README support matrix can be generated and checked from the same data used by installation tests.
- The shell wrapper remains stable for one migration cycle, but the former monolithic Bash implementation is removed.
- Product discovery still needs periodic manual smoke tests; filesystem integration tests prove the adapter contract, not every upstream product release.
