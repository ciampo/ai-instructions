---
name: create-verification-skill
description: Create and prove a project-local skill for repeatable verification through real user or consumer workflows. Use when asked to create a verification skill or reusable project verification instructions, not merely to run tests or review test quality.
---

# Create a verification skill

Package the project's launch, interaction, evidence, and cleanup instructions for an agent that has not seen the project before. Reuse existing verification tooling before adding helpers.

## Scope and destination

- Create the requested skill and its bundled resources locally. A generation request does not authorize product fixes, commits, pushes, or pull requests. Honor any separately authorized delivery workflow.
- Follow the project's existing skill layout and the active host's supported project-local discovery path. Use a user-specified destination when provided. If the destination cannot be established, ask one focused question. Do not assume a vendor directory, install globally, or create duplicate copies for other hosts.
- Preserve existing skills and user-maintained files. If an equivalent verification skill exists, propose maintaining it instead of creating another one.
- Use isolated test data and instances. Do not drive a user's active session or perform external writes without existing authorization. A skill cannot grant that authority to future runs.

## Inspect the project

Establish these facts from source, documentation, and available tools before asking the user:

- What users or consumers interact with, including UI, CLI, service, or library entry points.
- The documented setup and launch commands, required environment, authentication, migrations, and seed data.
- Existing ways to drive the project, such as browser tests, structured browser tools, HTTP clients, CLI scripts, or public API examples. A noninteractive CLI needs no PTY; an interactive CLI may need one.
- Observable results and side effects that prove behavior, and how to capture them.
- How to isolate concurrent runs through ports, profiles, data directories, or disposable checkouts. If isolation is unavailable, report the constraint before using a shared instance.

Check that the relevant build and launch path works in the verification environment. Report failures precisely. Do not repair product code, install new verification tools, or change agent configuration as a side effect. Necessary test scaffolding must be isolated, documented, and removed during cleanup.

## Write the skill

Create `verify-<project>/SKILL.md` in the resolved project-local skill directory. Include portable YAML frontmatter with a matching `name` and a `description` that names the project, interaction surface, and verification trigger. Keep paths relative to the project or skill; do not embed machine-specific paths, secrets, or credentials.

Include these operational sections, grounded in inspected commands and available capabilities:

- **Launch.** Exact setup and startup commands, working directory, prerequisites, and readiness criteria. A fresh data directory must reach a usable state, including necessary migrations and seeds. A responding process alone is insufficient. For a short-lived CLI or library, prepare once and run each recipe in its own isolated execution context.
- **Doctor.** Read-only checks for the expected build, instance identity, data directory, and any required authentication. Run these before driving a new instance or isolated recipe context, and after unexpected failures. Commands in one recipe can share a checked build and data context; doctor commands need no recursive preflight. Never record authentication values as evidence.
- **Drive.** Real commands, public API calls, or semantic UI interactions. Prefer roles, names, labels, routes, and documented CLI flags over coordinates, DOM position, or private implementation state. Name required capabilities and report unavailable ones instead of inventing tools.
- **Evidence.** Capture the action, resulting state, and relevant side effects. Name an artifact location outside disposable state, and record the feature, entry point, source revision, and environment with the proof. Redact sensitive values. Exercise the real user or consumer path; do not substitute internal setters or test-only endpoints. Use mocks only at established external boundaries and state what they leave unverified. Observe what dry-run modes actually change rather than trusting their names.
- **Cleanup.** Stop only processes the run owns and remove only its scratch state. Record process or session ownership at launch. Never kill by process name. On failed attempts, clean residue before retrying. Preserve evidence and check it still exists after cleanup; a shared instance is not owned by the run.
- **Helpers.** Add scripts only for a demonstrated gap. Make executable helpers executable and document their invocation, prerequisites, and cleanup. Prefer the project's existing harness over a new wrapper.

## Map the features

Read the [feature map contract](references/feature-map.md). Write `features/README.md` and one file per mapped user-facing feature. Start with a small, useful set grounded in routes, commands, exports, or docs. State the initial coverage and omissions rather than claiming a complete inventory.

Each recipe must pair a user or consumer action with a command or interaction and an observable expected result. Include alternate entry points and required state. Missing seed data or permissions are verification gaps; do not weaken the expected behavior to get a passing run.

## Prove and deliver

Follow the generated instructions from setup through cleanup. Drive at least one mapped feature, capture its evidence, and confirm the artifacts survive teardown. Inspect the saved artifacts. Fix generated instructions or helpers that fail, then repeat the affected proof. Clean failed attempts too.

If execution cannot finish, label the generated skill a draft and report the exact blocker and unverified steps. Distinguish a successful proof of one feature from coverage of the whole map. If a substitute environment was used, name the target setup steps it did not prove.

Report the skill location, proven behavior, evidence location, and remaining gaps concisely. Point to `maintain-verification-skill` for future upkeep. Do not schedule maintenance unless requested.

<!-- Adapted from https://github.com/cursor/plugins/tree/c49b37a2c0e7bede60a71ad7322e3f12c337a3da/pstack/skills/create-verification-skill. MIT licensed; see LICENSE. -->
