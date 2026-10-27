---
name: qa-verification
description: >-
  Verify that tickets are actually implemented in the current code before release. Use this
  whenever asked to "QA review", verify tickets, check what's "ready to deploy" / "deploy to
  live", or confirm that fixes described in tickets are really in the codebase. Checks the
  property each acceptance criterion protects — not just its literal wording — and reports
  DONE / PARTIAL / NOT DONE with file:line evidence. Read-only: never changes ticket status
  unless explicitly told to.
---

# QA Verification

The job is to confirm that what a ticket says was done is genuinely present and correct in the
current code, before it ships. This is verification, not review of new work — you're checking
implementation status against intent. It's read-only by default: you report what you find and
let the user decide what to close, move, or comment on.

## How to verify

For each code-related ticket:

1. **Re-derive the intent behind the acceptance criteria.** Ask what property each criterion is
   really protecting — the security, performance, or correctness guarantee — not just the exact
   words it uses. "Cache the report for 5 minutes" is protecting "the expensive query doesn't
   re-run on every load"; that property is what you verify.
2. **Check the actual current code for that property.** Open the real files and confirm the
   property holds now. Don't trust the ticket's own claim, a comment, or a commit message that
   says it was done — confirm it in the code.
3. **Cite evidence.** Every verdict points at `path/to/file.ts:line` showing why.

When verifying several independent tickets or files, look at them in parallel rather than
serializing reads that don't depend on each other — spawn a read-only Explore agent per
ticket/file and gather the results. (This skill authorizes that fan-out for this workflow.)

## Verdicts

**Functional equivalence is a PASS.** If a ticket's fix was implemented with a *different
mechanism* than the ticket described — different function names, a different cache-key scheme, a
regex check instead of a string comparison, a different but equally safe validation — but it
achieves the same end property the acceptance criteria protects, mark it **DONE**. Note the
divergence in the report so the user can judge it, but don't downgrade a working fix just
because it isn't a literal 1:1 match to the ticket's wording.

Only flag genuine gaps:

- **NOT DONE** — the described fix is entirely absent, or the property simply doesn't hold.
- **PARTIAL** — only some of several instances/methods were fixed, or the fix introduces a *new*
  instance of the same class of bug (e.g. it removes one N+1 query but adds a different
  per-iteration query in the same change).

| Verdict | Meaning |
|---|---|
| **DONE** | The property holds in current code (even if implemented differently than described). |
| **PARTIAL** | Partially implemented, or fixes one case while creating another of the same kind. |
| **NOT DONE** | The fix is absent or the property does not hold. |

## Report format

Lead with the verdict, then a table, then detail. For a multi-ticket sweep, the table is the
core deliverable:

```markdown
## Verdict
[One line: is this safe to deploy, or what's blocking?]

## Findings
| Ticket | Verdict | Evidence |
|---|---|---|
| [HS] Rate limit attribution endpoint | DONE | Limiter applied at server.ts:22 (differs from ticket's middleware approach — same effect) |
| [HS] Cache media report | PARTIAL | Cached at report.ts:40, but the CSV export path report.ts:88 still re-runs the query |
| [AW] Sanitize search input | NOT DONE | No validation at search.ts:15; raw input reaches the query |

## Detail
[Per-ticket notes for anything PARTIAL/NOT DONE or where the implementation diverged.]
```

## Guardrails

- **Read-only by default.** Verifying status is not permission to change it. Do not change,
  close, move, or comment on a ticket as a side effect of a review. Report findings and wait for
  the user to say explicitly which tickets to act on.
- **Only take write actions when explicitly asked** (e.g. "post that as a comment"), and keep
  the comment as short as the user asked.
- **Never claim a check you didn't run.** If you reasoned from the code statically rather than
  executing it, say so.

For reviewing the *quality* of new code (rather than verifying a ticket's status), use the
`code-review` skill instead.
