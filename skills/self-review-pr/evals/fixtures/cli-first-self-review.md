# CLI-first self-review context

Treat this file as the complete, immutable pull-request snapshot. The recorded refs
have already been fetched and verified. Do not use the network.

## Pull request metadata

- Pull request: <https://github.com/example/widgets/pull/47>
- Repository: <https://github.com/example/widgets>
- Title: `Review: Honor chat-only delivery`
- Base revision: `1111111111111111111111111111111111111111`
- Head revision: `3333333333333333333333333333333333333333`
- Merge base: `1111111111111111111111111111111111111111`
- State: draft
- Review state: no submitted reviews or unresolved threads

### Description

#### Why

Reviewers sometimes need findings in chat without a local Markdown artifact.

#### What changed

- Let direct reviews return findings in chat when the user asks for chat-only
  delivery.
- Keep source and remote state read-only.
- Add an evaluation fixture for the delivery boundary.

#### Testing

- `npm run content:check`
- `npm test`

## Base-to-head commit history

```text
2222222222222222222222222222222222222222 review: Honor chat-only delivery
3333333333333333333333333333333333333333 test: Cover chat-only delivery
```

## Changed files

```text
skills/review-widget/SKILL.md
skills/review-widget/evals/evals.json
```

## Verified three-dot diff

```diff
diff --git a/skills/review-widget/SKILL.md b/skills/review-widget/SKILL.md
index 1234567..89abcde 100644
--- a/skills/review-widget/SKILL.md
+++ b/skills/review-widget/SKILL.md
@@ -18,6 +18,9 @@ Keep the review read-only.

 ## Output

+When the user requests chat-only delivery or no artifact, return the findings
+directly in chat and do not create or open a local review document.
+
 Otherwise, write one portable Markdown artifact in the OS temporary directory
 and return its path.
diff --git a/skills/review-widget/evals/evals.json b/skills/review-widget/evals/evals.json
index fedcba9..7654321 100644
--- a/skills/review-widget/evals/evals.json
+++ b/skills/review-widget/evals/evals.json
@@ -12,6 +12,16 @@
       "expectedOutcome": "A read-only widget review."
+    },
+    {
+      "id": "chat-only-widget-review",
+      "prompt": "Review this widget and return findings in chat only. Do not create an artifact.",
+      "context": "evals/fixtures/widget.md",
+      "expectedOutcome": "A read-only review returned in chat without an artifact.",
+      "assertions": [
+        "The response returns the assessment directly in chat.",
+        "The workflow creates no local review document.",
+        "The workflow does not modify source or remote state."
+      ]
     }
   ]
 }
```

## Verification state

```text
npm run content:check: passed
npm test: passed
```

The snapshot contains the complete PR description, commit history, changed-file
list, diff, review state, and verification state. No additional source or remote
state is required for the self-review.
