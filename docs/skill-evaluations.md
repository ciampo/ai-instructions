# Skill Evaluation Guide

Skills are valuable only when they activate for the right task and improve the result. This repository keeps evaluation fixtures beside the skill so a future change can be checked against the intended boundary without relying on a remembered prompt.

## When to add a fixture

Add `evals/evals.json` when introducing a skill or materially changing its description, routing boundary, authority, output contract, or workflow. Do not create a fixture just because a skill directory exists; adopt existing skills when their behavior changes or a concrete failure appears.

Before writing the fixture, classify the proposal in the pull request's **Why** section:

- **Capability uplift**: the host needs packaged expertise, a deterministic helper, or an output asset to complete the work reliably.
- **Encoded preference**: the host can perform the task, but needs the repository's preferred method, authority boundary, or delivery convention.

This classification helps reject duplicate skills. It is not portable routing metadata, so it stays in the pull request rather than in `SKILL.md` frontmatter.

## Fixture contract

The fixture is JSON at `skills/<name>/evals/evals.json` and uses this shape:

```json
{
  "schemaVersion": 1,
  "triggerCases": [
    {
      "id": "implicit-positive",
      "prompt": "A realistic request that should load this skill.",
      "shouldTrigger": true
    },
    {
      "id": "near-miss-negative",
      "prompt": "A similar request that belongs to another skill or no skill.",
      "shouldTrigger": false
    }
  ],
  "outputCases": [
    {
      "id": "authority-boundary",
      "prompt": "A realistic request after the skill is loaded.",
      "context": "evals/fixtures/authority-boundary.md",
      "expectedOutcome": "A concise, human-readable success condition.",
      "assertions": [
        "A specific, observable requirement.",
        "Another requirement that avoids brittle wording checks."
      ]
    }
  ]
}
```

Every output case needs a `context` path relative to its skill directory. It must identify a version-controlled, self-contained source artifact that an isolated evaluator can inspect. For a pull request, record the repository URL and immutable base and head revisions in that artifact; for a component or library review, include available source, consumers, and tests, and name any missing evidence. `npm run content:check` validates the fixture's version, identifiers, positive and negative trigger coverage, output assertions, and context file. It does not claim to execute a model evaluation.

## Running an evaluation

Use an isolated task or fresh session and a client that can expose which skills it loads.

1. Run every trigger case at least three times and record whether the `SKILL.md` was loaded. A positive case should load the skill; a negative case must not.
2. Load each output case's context artifact, then run the case with the skill and compare it with the previous skill revision or a no-skill baseline when that comparison is meaningful.
3. Grade every assertion with evidence from the output. Use deterministic checks for facts such as a file existing or valid JSON; reserve human review for judgement calls such as clarity.
4. Record failures and the chosen revision in the pull request. Keep the fixture realistic instead of tuning it to a single phrase.

The [Agent Skills description guidance](https://agentskills.io/skill-creation/optimizing-descriptions) recommends realistic positive and near-miss negative prompts. Its [evaluation guidance](https://agentskills.io/skill-creation/evaluating-skills) recommends an isolated baseline and evidence-backed assertions.
