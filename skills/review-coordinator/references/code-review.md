# Core Review and Delivery Reference

## Core review

- Read the full merge-base diff, every modified source file, and relevant consumers before forming findings.
- Cover accessibility, consistency, API correctness, test adequacy, blast radius, build and dependency correctness, documentation, and scope before selecting specialist lanes.
- Treat specialist findings as inputs: verify and deduplicate them before delivery.
- Use `[critical]`, `[major]`, `[minor]`, and `[nit]` only for confirmed evidence-backed findings. Material uncertainty belongs in verification gaps.

## Delivery

- Use portable Markdown with a summary and numbered, concise, self-contained findings.
- Give inline findings exact file paths and line ranges when available; do not invent locations.
- Do not post to GitHub unless explicitly asked.
- Keep the final review to one response. Do not expose panel transcripts, vote counts, or competing specialist reports.
