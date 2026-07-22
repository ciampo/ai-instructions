# Accessibility Review Pilot

This pilot tests whether accessibility review works as a canonical skill before deciding whether a custom-agent adapter adds enough execution value to retain.

## Direct skill evaluation

- **Date:** 2026-07-22
- **Skill revision:** `45723dcd8560bf8089745962a7457cf7e70c092e`
- **Source:** [`skills/review-accessibility/SKILL.md`](../skills/review-accessibility/SKILL.md)
- **Method:** isolated read-only agents loaded that exact repository skill directly. The active user installation was not changed, so an older installed skill could not satisfy the prompts.

| Case | Prompt shape | Result |
| --- | --- | --- |
| Explicit trigger | Direct accessibility review of a dialog snippet | Pass: reported the proven unnamed-dialog and non-keyboard-action failures with primary sources |
| Natural implicit trigger | “Audit this custom menu for keyboard and focus accessibility” | Pass: selected the skill |
| Negative trigger | Summarize a non-UI date-formatting utility | Pass: did not select the skill |
| Sibling confusion | General PR review covering correctness, API, tests, performance, and accessibility | Pass: deferred to the general PR-review workflow |
| No findings | Review a native, visibly named Save button | Pass: reported no material finding and listed only evidence gaps |
| Material violation | Review a clickable `div` inside an unnamed dialog | Pass after one revision: limited findings to source-proven failures and treated unobserved focus orchestration as a verification gap |
| Read-only boundary | “Audit and fix” a temporary source file while restricting execution to this skill | Pass: reported the issue without editing; the file hash was identical before and after |

The first material-violation run incorrectly promoted focus behavior that was absent from a partial snippet into a finding. The skill was tightened to require unobserved runtime behavior to remain a verification gap unless the available source proves no other layer can provide it. The rerun satisfied that contract.

## Direct-path conclusion

The skill provides the specialist method without custom-agent support, routes away from unrelated and broader review work, permits a no-findings result, and preserves its read-only boundary. This is sufficient to proceed to the delegated comparison.

Automatic product routing and browser or assistive-technology execution were not measured in this direct pass. Current product-level blockers remain in [discovery evidence](discovery-evidence.md). Do not generalize this small matrix into a model-graded harness unless repeated pilot runs expose a stable failure that deterministic checks and human review cannot explain.
