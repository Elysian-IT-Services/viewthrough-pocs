---
name: code-review
description: >-
  Review a diff, pull request, or implementation against our team's standards — correctness and
  regression risk first, then security, performance, and our code-quality conventions
  (declarative style, no duplication, no stray console logs, descriptive names, domain-first
  structure, disciplined comments). Use this whenever asked to review, audit, or give feedback
  on code, a PR, or a change before merge. Read-only by default: report findings, never edit or
  change git/ticket state unless explicitly told to.
---

# Code Review

A review's job is to catch what will bite later and to hold the codebase to a consistent bar,
without expanding scope or rewriting the author's work. Be direct, specific, and fair: every
finding names a file and line, states the impact, and gives the condition to reproduce it. Rank
by severity so the author fixes what matters first.

## How to review

1. **Read the project's own conventions first** — `CLAUDE.md`, contributing docs, and the
   surrounding code. Where a project states a rule, it wins over anything here; where a project
   is silent, apply the standards below. Don't flag a choice that matches an established local
   convention just because you'd write it differently.
2. **Understand the change in context.** Read the diff *and* the nearest implementation, call
   sites, and tests. A line can be correct in isolation and wrong given its callers.
3. **Assess correctness and regression risk before style.** The costly findings are behavioral;
   get those right before commenting on naming.
4. **Judge by the property, not the wording.** A fix implemented differently from how a ticket
   or comment described it is still done if it achieves the same end — note the divergence, but
   don't fail it for not being a literal match. Only flag genuine gaps: the fix is absent, only
   some instances were handled, or it introduces a new instance of the same class of bug.
5. **Stay in scope.** Review the change in front of you. Pre-existing problems in untouched code
   are follow-ups you name, not blockers you pin on this diff.

## What to look for, most costly first

### Correctness and regressions
- Does it do what it claims, including the edge cases — empty, zero, one, max, null, error paths?
- Does it break an existing caller, contract, or behavior?
- Race conditions, unhandled rejections, off-by-one, incorrect boundary handling.
- Is it built against a real, verified contract — not a guessed API shape?

### Security
- Endpoints without authentication, authorization, or rate limiting.
- Unvalidated input crossing a trust boundary; injection surfaces.
- Secrets, keys, or tokens reaching the client, committed, or logged.

### Performance and scalability
- N+1 queries; unbounded queries or loops that won't hold as data grows.
- Work that passes at ten rows and fails at ten million.
- Needless re-renders, repeated computation, missing pagination.

### Code quality (our conventions)
These are the standards in the `writing-code` and `writing-tests` skills; the review enforces
what those skills ask authors to write. Check for:

- **No stray `console.log`** (or language equivalent) in committed code. Persistent logging goes
  through the project logger; debug output should be gone.
- **No copy-paste / duplication.** Logic repeated a second time should have been extracted into
  a shared utility, service, or helper. Flag the duplication and name where the shared version
  belongs.
- **Declarative style.** Prefer expressions and data-driven patterns over imperative loops and
  accumulators where they read as clearly.
- **Descriptive names.** Full, pronounceable names; flag single-letter identifiers and cryptic
  abbreviations (`e`, `x`, `usr`, `btn`, `tmp`), including loop counters and callback params.
- **No magic strings or numbers.** Meaningful literals should be named constants, declared once;
  values used across layers should come from a shared constants location, not be buried and
  duplicated.
- **Structure: domain first, then function.** Changes land in the right place —
  `core/` (by type), `features/` (by feature, then by type), `shared/` — with barrels used for
  cross-folder imports. Business logic stays out of controllers, components, and templates.
- **Comments earn their place.** Flag comments that restate the code; expect comments only for a
  non-obvious edge case, a landmine, a decision's rationale, or a `TODO`.
- **No bloat.** Dead code, commented-out blocks, unused files/fields/exports, speculative
  abstractions — call them out.

### Tests
- Do new behaviors and bug fixes come with tests that assert the behavior, not the internals?
- Is each unit test focused on one behavior, deterministic, and clearly named?
- What critical path or failure mode is left uncovered?

## Reporting

Lead with the verdict, then the findings, ranked most severe first. Structure:

- **Verdict** — one line: is it safe to merge, merge with fixes, or not yet?
- **Findings** — each as: `path:line` — severity — what's wrong, the impact, and how to
  reproduce or when it bites. A short suggested direction is welcome; a full rewrite is not.
- **Assumptions / open questions** — anything you couldn't verify, and what would resolve it.
- **Summary** — a concise note of what the change does and residual risk.

If there are no findings, say so plainly and note any test gaps or residual risk rather than
padding the report. For multi-item audits (several tickets or files), a table of
item → verdict → evidence is the clearest format.

## Guardrails

- **Read-only by default.** Reviewing means reporting. Do not edit files, restructure code, fix
  the issues you find, change ticket/PR status, or touch git state as a side effect of a
  review. Propose; let the author decide.
- **Only take write actions when explicitly asked** (e.g. "post these as PR comments"), and keep
  them to what was requested.
- **Don't claim a check you didn't run.** If you didn't execute the tests or the build, say the
  review is static. Never state something passed unless it actually ran.
