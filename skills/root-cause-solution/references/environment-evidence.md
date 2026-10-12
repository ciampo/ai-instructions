# Environment evidence

Read this when a candidate depends on browser, OS, device, or runtime behavior that source inspection alone cannot establish.

## Reproduce the relevant behavior

- Use available automation in the required environment. Read-only window access, mocks, and a different browser or runtime cannot establish native behavior in the reported environment.
- Record the environment version and the conditions the reproduction exercised. Report the result with that scope.
- Check that the setup actually reaches the suspected cause. A failed assertion caused by a missing dependency or a different configuration is not evidence for the reported defect.
- Combine deciding variations into one focused reproduction when handing work to the user would otherwise require repeated runs.

If access is unavailable, explain the specific limitation and request only the access or observations needed to resolve it. Respect tool restrictions and the user's control of settings. Do not require enabling remote automation when another adequate evidence route exists.

Pause the environment-dependent conclusion until the evidence is available. Continue source analysis and other independent work, and distinguish a proposed mechanism from a verified result.

## Cover the supported range

Find the project's support policy, browserslist, runtime engines, or deployment target. If the supported range is undefined and changes the choice, state the uncertainty or ask for the required range.

Name the exact behavior the candidate relies on. Check relevant authoritative compatibility data, availability documentation, release notes, or bug history when that behavior may differ within the supported range. Follow source history only when it can resolve a remaining deciding question. Do not require a release date or an exhaustive historical search for every platform behavior.

Distinguish documented availability from runtime verification. If the earliest supported version remains unverified, say so. An unknown availability boundary cannot justify removing compatibility code.

For a plausible version difference, identify the quickest check and the compatibility approach that would cover it. Treat it as unresolved until evidence or an explicit support decision settles it. Test additional environments when they are necessary for the authorized change's supported behavior, rather than excluding them as optional edge cases.
