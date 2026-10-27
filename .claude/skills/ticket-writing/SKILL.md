---
name: ticket-writing
description: >-
  Write tickets and issues our way — correct site prefix, and the Description / Implementation
  Plan / Acceptance Criteria structure. Use this whenever creating or drafting a ticket, issue,
  bug report, or task in ClickUp or a Markdown file, or when asked to "raise a ticket", "write
  this up as a task", or "log an issue". Follow the existing convention exactly; never invent a
  new prefix, numbering scheme, or structure.
---

# Ticket Writing

Consistent tickets are how the team reads each other's work at a glance. The rule is simple:
match the existing convention exactly. If anything about the convention is unclear, ask before
creating — never invent your own prefix format, numbering, or structure.

## Title format

`[PREFIX] <specific description of the issue>`

The prefix identifies **which site or project the ticket belongs to** — it is not a generic
marker or a category tag. Pick it from the codebase the work is actually in (the local checkout
path or the GitHub repo name), never by habit or by whichever prefix you saw in a recent
example.

| Prefix | Site |
|---|---|
| `[HS]` | Hotspawn |
| `[AW]` | AlphaWire |
| `[CCH]` | CryptoCurrencyHelp |
| `[RR]` | Rank Rush |

Never use invented formats like `HS-SEC-01`, `[HS-CACHE-01]`, or any other scheme layered on
top of the prefix. If the site isn't in this table, **ask** rather than guessing — a wrong
prefix files the ticket against the wrong project.

The description after the prefix should be specific enough to understand without opening the
ticket: `[HS] Orders page reloads full list on every filter change`, not `[HS] Fix orders`.

## Structure

Every ticket has these three sections, in order. Use these exact headings.

```markdown
### Description
[What the problem is, where it lives (file path + line numbers), and why it matters —
the impact if left unfixed. Enough for someone else to find and understand it.]

### Implementation Plan
[Numbered or bulleted steps with concrete detail: exact function names, code patterns,
cache keys, TTLs, endpoints. Specific enough that another developer could execute it.]

### Acceptance Criteria
[Independently testable bullet points. Each one a checkable statement of done.]
```

Notes that keep these consistent:

- **Description** points at the real location — `path/to/file.ts:42`, not "somewhere in the
  orders service." Say why it matters, so priority is obvious.
- **Implementation Plan** is concrete, never hand-wavy. Name the function, the cache key, the
  TTL, the query. Do **not** use "Fix" as a subheading — describe the steps instead.
- **Acceptance Criteria** are testable and independent — a reviewer should be able to verify
  each one on its own. This is what the QA verification later checks against.

## Granularity

Give each distinct issue its own ticket. Don't compact several unrelated problems into one
ticket to save effort — that hides scope and makes verification and estimation impossible.
Combine only when items are genuinely trivial and tightly related. When in doubt, prefer
standalone tickets with full detail over a merged ticket with thin detail.

## ClickUp specifics

When referencing a ClickUp task in prose, write it as an inline Markdown link with the task
name as the anchor text — `[Fix orders filter reload](https://app.clickup.com/t/abc123)` —
never a bare URL, a URL on its own line, or a list of raw URLs (those render as broken cards).

## No AI attribution

Tickets and ticket comments ship under the author's name. Never add any credit to Claude,
Claude Code, Anthropic, or "AI" — no "Generated with" lines, no session links, no co-author
trailers. This applies to every ticket and comment you write. (Same rule as `commit-and-pr`.)
