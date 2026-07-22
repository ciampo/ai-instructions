# Accessibility Review Pilot

This pilot tests whether accessibility review works as a canonical skill before deciding whether a custom-agent adapter adds enough execution value to retain.

## Direct skill evaluation

- **Date:** 2026-07-22
- **Historical pilot revision:** `45723dcd8560bf8089745962a7457cf7e70c092e` (the revision directly evaluated during this pilot)
- **Current skill source:** [`skills/review-accessibility/SKILL.md`](../skills/review-accessibility/SKILL.md)
- **Method:** Isolated, read-only agents loaded that exact repository skill directly. The active user installation was not changed, so an older installed skill could not satisfy the prompts.

| Case | Prompt shape | Result |
| --- | --- | --- |
| Explicit trigger | Direct accessibility review of a dialog snippet | Pass: reported the proven unnamed-dialog and non-keyboard-action failures with primary sources |
| Natural implicit trigger | “Audit this custom menu for keyboard and focus accessibility” | Pass: selected the skill |
| Negative trigger | Summarize a non-UI date-formatting utility | Pass: did not select the skill |
| Sibling confusion | General PR review covering correctness, API, tests, performance, and accessibility | Pass: deferred to `review-pr` |
| No findings | Review a native, visibly named Save button | Pass: reported no material finding and listed only evidence gaps |
| Material violation | Review a clickable `div` inside an unnamed dialog | Pass after one revision: limited findings to source-proven failures and treated unobserved focus orchestration as a verification gap |
| Read-only boundary | “Audit and fix” a temporary source file while restricting execution to this skill | Pass: reported the issue without editing; the file hash was identical before and after |

The first material-violation run incorrectly promoted focus behavior that was absent from a partial snippet into a finding. The skill was tightened to require unobserved runtime behavior to remain a verification gap unless the available source proves no other layer can provide it. The rerun satisfied that contract.

## Direct-path conclusion

The historical pilot revision provides the specialist method without custom-agent support, routes away from unrelated and broader review work, permits a no-findings result, and preserves its read-only boundary. This is sufficient to proceed to the delegated comparison. Later pull-request changes, including the output-delivery wording, were not exercised by this pilot.

## Delegated comparison and agent decision

- **Decision revision:** `1b147a6c1de794f2a93048863578f7043955dfbf`
- **Method:** compare direct skill execution with the parent revision's custom-agent prompt on the same scoped examples. The comparisons were read-only and inspected both contracts explicitly.

| Capability | Comparison evidence | Decision |
| --- | --- | --- |
| Accessibility | The direct skill produced source-linked findings and kept unobserved focus behavior as a verification gap. Delegated custom-agent runs retained the older `Violations / Best Practices / Enhancements` taxonomy even when the current skill was also supplied, demonstrating that the second prompt could override or drift from the shared output contract. No distinct tools or isolation benefit appeared. | Keep `review-accessibility`; remove `a11y-reviewer` |
| API design | Both paths found the material polymorphism, callback-type, ref, and consumer-evidence concerns. The direct skill correctly left the accepted `variant` vocabulary as a verification gap; the custom agent promoted it to a breaking-risk finding despite acknowledging that consumers and compatibility policy were unavailable. Its generic request for future escape hatches also conflicts with evidence-based minimality. | Keep `review-api-design`; remove `api-design-reviewer` |
| Performance | Both paths identified dependency, repeated-rendering, usage-context, and scale risks. The direct skill distinguished source-proven cost from missing bundle, profile, and realistic-scale evidence and required a repeatable measurement before prescribing an optimization. The custom agent added only a persona and a conflicting severity taxonomy. | Keep `review-performance`; remove `performance-reviewer` |

The agent layer did not change tools, authority, context isolation, or the resulting analysis enough to justify a second copy of each specialist contract. All three capabilities therefore use direct skills. The repository does not distribute custom-agent sources; legacy destinations let `install`, `update`, and `remove` clean only repository-owned retired agents, while user-maintained agents remain untouched.

The API-design and performance skills remain distinct from general PR review because they are deliberately triggered only for focused public-API or performance analysis. General PR review owns change discovery, complete-diff coverage, cross-domain prioritization, deduplication, and final delivery. It may route to a specialist skill only when that domain is materially in scope.

Automatic product routing and browser or assistive-technology execution were not measured in this direct pass. Current product-level blockers remain in [discovery evidence](discovery-evidence.md). Do not generalize this small matrix into a model-graded harness unless repeated pilot runs expose a stable failure that deterministic checks and human review cannot explain.
