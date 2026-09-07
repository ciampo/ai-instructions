# Review report

Use this format for a full PR review, including self-reviews and coordinated reviews. Follow an explicit request for only comments or replies instead. The reviewing workflow supplies the checked facts and previous-feedback assessment. Drafting alone does not authorize fetching more PR data or claiming missing checks passed.

## Structure

Start with the PR number and title. Keep required repository, revision, and audience metadata on one compact line.

### Overall

Give the assessment in a short paragraph. Say whether changes are needed and why at a high level. If useful, briefly explain what the PR changes or what changed since the last review. Do not repeat each finding or narrate the investigation. State material verification limits here, with a short list only if needed.

Distinguish "no new findings" from "nothing left to address." Earlier feedback may still need attention. If discussion access was incomplete, say what was not checked instead of giving a clean bill of health.

### Previous feedback

Account for earlier actionable concerns using their original thread or comment links. For each concern still needing attention, state separately:

- GitHub state, such as open, resolved, or outdated, if known.
- Current assessment: **Needs change**, **Needs reply**, **Addressed**, or **Unclear**.
- A short reason and the next action, or a reference to its numbered action below.

An open thread can be fixed in code. A resolved or outdated thread can still describe a problem. Do not infer either assessment from GitHub state alone. Include open threads whose code concern is addressed, so the reader can see whether discussion still needs a reply. If a suggestion was declined, distinguish an explained decision from an unanswered disagreement. Do not present a disputed suggestion as an agreed fix.

Summarize addressed concerns that need no follow-up in one line. If no previous feedback exists, say so. If it was not checked or only partly available, say that explicitly. Do not list praise or repeat the full discussion.

### Actions and suggested comments

Use one numbered item for each action. Put blocking changes first. Label each as a **New finding**, **Follow up on existing feedback**, or **Verification needed**. Separate required changes from optional suggestions.

- Give a short title that says what needs to change or be checked. Keep severity and exact file/line metadata outside the suggested text. Never invent a line, location, or link.
- State the next step directly. For an existing concern, link to its original discussion and include only what remains to do. Do not propose a second comment that repeats an unanswered request already in that thread.
- When a comment would help, label its destination as **New inline comment**, **PR comment**, or **Reply to existing thread**, then put only the copy-pasteable text in a blockquote. For replies, use the user's role and the verified outcome. Do not claim that the user made a fix or agrees with feedback without evidence.
- If no message is needed, say so briefly. A code change or missing check can be the entire action. Put optional supporting evidence in a separate `<details>` block outside the copy-pasteable text. Keep uncertainty visible when it changes the action.

If there are no actions, say so. Do not invent a comment to fill the section. Review and drafting do not authorize posting, resolving threads, or changing code.

## Plain wording

Short sentences can still be hard to read. Prefer a concrete failure and request over compressed implementation terminology. Keep exact identifiers that the author needs, the supported scope, and evidence-status terms such as "reproduced" or "not reproduced."

Dense:

> The locale-agnostic cache identity aliases localized payloads across consumers; incorporate `locale` into key derivation and assert isolation.

Plain:

> Requests for the same record in different languages share a cache entry, so the second request can get text in the wrong language. Could we include `locale` in the key and test requests in two languages?

Keep the report's explanation separate from the suggested comment. More words are acceptable when they make the issue easier to understand.
