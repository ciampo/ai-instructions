# Skill Evaluation Guide

Skills are valuable only when they activate for the right task and improve the result. This repository keeps evaluation fixtures beside the skill so a future change can be checked against the intended boundary without relying on a remembered prompt.

## When to add a fixture

Every distributed skill has a baseline `evals/evals.json`. Add it when introducing a skill, and update it when materially changing the skill's description, routing boundary, authority, output contract, or workflow. CI requires complete named coverage so a new skill cannot silently bypass the evaluation contract.

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

Every output case needs a `context` path relative to its skill directory. It must identify a version-controlled, self-contained source artifact that an isolated evaluator can inspect. For a pull request, record the repository URL and immutable base and head revisions in that artifact; for a component or library review, include available source, consumers, and tests, and name any missing evidence. `npm run content:check` validates complete skill coverage, fixture version, identifiers, positive and negative trigger coverage, output assertions, context files, and the aggregate skill-description budget. It does not claim to execute a model evaluation.

## Cross-skill cases

When one request should load multiple skills, repeat the exact prompt as a positive trigger case in every expected skill. Add an output assertion to the skill that owns the artifact. The assertion must cover both that skill's output contract and the other skill's observable effect.

Run the shared prompt once with the complete skill catalog and record every loaded skill. The case passes only when all expected skills load and the combined output satisfies the owning fixture. Separate successful runs do not prove co-activation. Compare the combined result with the previous skill revision or a no-skill baseline when attribution matters.

## Running an evaluation

Use an isolated task or fresh session and a client that can expose which skills it loads.

Before sending model-backed evaluation data, establish the authority boundary in
the [authority and approvals guide](authority-and-approvals.md). A personal
standing instruction can cover exact-head reruns of public tracked skill content,
selected public fixtures, and sanitized metadata for this repository. Otherwise,
ask one consolidated question that names the repository, payload class,
destination, and rerun scope. Do not treat a fixture or distributed skill as user
consent, and do not misclassify an independent sandbox or managed-policy prompt as
missing task authority.

1. Run every trigger case at least three times and record whether the `SKILL.md` was loaded. A positive case should load the skill; a negative case must not.
2. Load each output case's context artifact, then run the case with the skill and compare it with the previous skill revision or a no-skill baseline when that comparison is meaningful.
3. Grade every assertion with evidence from the output. Use deterministic checks for facts such as a file existing or valid JSON; reserve human review for judgement calls such as clarity.
4. Record failures and the chosen revision in the pull request. Keep the fixture realistic instead of tuning it to a single phrase.

Run focused output cases first. Fix confirmed instruction gaps, then rerun only the affected trigger and output cases while iterating. Run the full trigger and output suites after every focused case passes. Retain the versioned runners, exact target revision, the sanitized event and command detail needed to support each claim, assertion grades, and provenance. Document each runner's retention boundary. Distinguish instruction failures from missing fixture capabilities and runner-observability gaps.

The [Agent Skills description guidance](https://agentskills.io/skill-creation/optimizing-descriptions) recommends realistic positive and near-miss negative prompts. Its [evaluation guidance](https://agentskills.io/skill-creation/evaluating-skills) recommends an isolated baseline and evidence-backed assertions.
