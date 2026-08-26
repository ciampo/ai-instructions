---
name: unslop
description: Rewrite supplied prose to remove formulaic AI-writing patterns while preserving meaning, evidence, uncertainty, terminology, audience, and requested tone. Use when the user asks to unslop, humanize, de-AI, or make existing text sound less generated. Do not use for ordinary drafting or documentation review unless the user also asks for this rewrite.
---

# Unslop

Rewrite existing text so it sounds direct, specific, and natural without changing what it says.

## Preserve the source

- Preserve every conclusion, constraint, caveat, uncertainty, evidence-status term, exact identifier, quotation, link, and necessary technical term.
- Keep the intended audience, format, point of view, and level of formality. Follow an explicit style guide or repository convention before this skill's defaults.
- Do not invent facts, sources, measurements, opinions, anecdotes, confidence, or personality. Human voice must come from the source or the user's requested tone.
- If a stylistic change could alter the meaning, keep the original wording or flag the ambiguity instead of guessing.

## Rewrite method

1. Identify the text's purpose, audience, voice, and non-negotiable facts before editing.
2. Lead with the point. Remove throat-clearing, generic introductions, repeated summaries, empty conclusions, chatbot phrases, and unearned praise.
3. Replace puffery, promotional language, vague attribution, and abstract claims with supported specifics. If the source does not provide the needed support, remove the claim or preserve its stated uncertainty.
4. Prefer plain, concrete words and consistent terminology. Explain necessary jargon briefly, but retain exact domain terms and identifiers.
5. Split sentences that carry several ideas. Prefer active voice when the actor matters. Keep passive voice when the actor is unknown or irrelevant.
6. Remove formulaic patterns when they do not serve the content. Common examples include forced groups of three, "not just X but Y," superficial `-ing` clauses, synonym cycling, false ranges, and decorative metaphors.
7. Use headings, lists, emphasis, punctuation, contractions, and sentence-length variation only when they help the reader or match the requested voice. Do not enforce a blanket ban on a word or punctuation mark.
8. Read the revision once for meaning and once for voice. If a sentence could fit unchanged in unrelated writing, make it specific or cut it.

## Output

Return the revised text without a change log unless the user asks for one. Keep any unresolved ambiguity visible and concise.
