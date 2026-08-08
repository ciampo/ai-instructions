---
name: grill-me
description: Conduct a read-only, interactive interview that stress-tests a plan, design, decision, or idea until material gaps are resolved. Use when the user says "grill me", asks to be interviewed one question at a time, or wants iterative questions to challenge or poke holes in a proposal before planning or implementation. Do not use for one-shot reviews, direct implementation, debugging, or non-interactive plan drafting.
---

# Grill Me

Reach shared understanding before planning or implementation. Ask the user about
decisions only; find available facts yourself.

## Keep the session bounded

- Remain read-only. Do not edit files, write a plan artifact, implement, commit,
  or publish as part of the grilling session.
- Treat a combined request such as "grill this, then build it" as an ordered
  workflow. Finish the interview and obtain the user's confirmation before the
  next workflow starts.
- Keep the user's choices distinct from your recommendations. Never silently
  decide a product requirement, constraint, risk acceptance, or trade-off.
- Limit the interview to gaps that can materially change the agreed outcome,
  scope, implementation, verification, or delivery risk.
- Do not reopen a settled branch unless a later answer or discovered fact
  contradicts it.

## Build the decision tree

1. Read the supplied plan, current conversation, project instructions, relevant
   documentation, and available source before asking a question.
2. Identify the intended outcome and map its major decision branches and their
   dependencies.
3. Separate known facts, user decisions, intentional deferrals, evidence gaps,
   and risks.
4. Resolve factual questions with read-only inspection or research. Ask the user
   only when judgement, intent, ownership, or risk acceptance is required.
5. Start with the highest-impact unresolved decision whose prerequisites are
   already settled. Do not ask a downstream question that depends on an open
   answer.

Keep this tree in the conversation unless the user explicitly asks for an
artifact.

## Interview one decision at a time

Ask exactly one answerable decision question per turn. Split independent choices
into separate turns even when they concern the same component.

Use this compact structure:

```text
Question - <decision>

<Relevant evidence, constraint, or concrete failure scenario.>

Recommendation: <preferred answer and brief trade-off.>

<One question for the user.>
```

- Offer multiple-choice options only when they represent genuine alternatives.
  Let the user supply a different answer.
- Challenge vague language with a concrete scenario, boundary, failure mode, or
  acceptance test.
- If the user is unsure, compare the viable options and make a recommendation.
  Record an assumption only after the user accepts it.
- If the user defers a decision, record the deferral, its effect, and what must
  resolve it. A deferral is acceptable only when it does not block the agreed
  scope.
- Update the decision tree after every answer. Continue with the next
  dependency-ready gap.

After five answers, or when a major branch closes, show a short checkpoint before
the next question:

```text
Resolved: <decisions>
Deferred: <intentional deferrals and their effect>
Open: <material gaps>
Current branch: <branch>
```

## Scan for material gaps

Apply only the dimensions relevant to the task:

- outcome, users, success measures, scope, and non-goals;
- primary flows, states, edge cases, and acceptance criteria;
- constraints, dependencies, sequencing, ownership, and external approvals;
- architecture, interfaces, data, lifecycle, migration, and compatibility;
- failure handling, recovery, security, privacy, accessibility,
  internationalization, performance, and scale;
- rollout, observability, rollback, testing, and operational support.

Do not turn this list into a generic questionnaire. Use evidence and prior answers
to remove irrelevant branches.

## Confirm convergence

The plan is ready for confirmation only when:

- every material branch is resolved or intentionally deferred without blocking
  the agreed scope;
- success and acceptance criteria are testable;
- factual unknowns are verified or have explicit validation steps;
- the decisions do not contradict each other; and
- implementation can proceed without inventing an unstated requirement.

Present a compact convergence check with resolved decisions, intentional
deferrals, residual risks or evidence gaps, and `Convergence: Ready` or
`Convergence: Not ready`. Even when the user asks to close the session if it is
ready, ask exactly one final question: whether this matches their understanding
or one branch is still missing.

Do not state that the session is closed or claim confirmed convergence until the
user answers. If they identify a gap, reopen that branch and continue the
interview. After confirmation, stop. Start a plan or implementation workflow
only when the user's request authorizes that separate work.
