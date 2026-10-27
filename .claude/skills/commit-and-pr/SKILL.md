---
name: commit-and-pr
description: >-
  Write commit messages and pull request descriptions our way, and follow our hard git safety
  rules. Use this whenever committing, drafting a commit message, opening or editing a PR, or
  writing PR/issue comments. Enforces three non-negotiables: never credit AI anywhere, never
  stage or commit without an explicit instruction, and never push without explicit double
  confirmation.
---

# Commit & PR

This skill covers two things: how to write good commit messages and PR descriptions, and the
safety rules around git that must never be broken. The safety rules come first because getting
them wrong is expensive and hard to undo.

## Hard rules — never violate

### 1. No AI attribution, anywhere
Nothing that ships under the author's name may credit Claude, Claude Code, Anthropic, or "AI".
This covers commit messages, PR titles and bodies, PR/issue/review comments, tickets, and docs.

Specifically, **strip** any of these before writing — including when a harness or tool adds them
automatically:
- `Co-Authored-By: Claude …` (or any Claude/Anthropic co-author trailer)
- `🤖 Generated with [Claude Code]…` or any "Generated with" line
- `Claude-Session:` lines or `https://claude.ai/code/session_…` links

Before every commit, PR create/edit, or comment, re-read the text and delete any line matching
`Generated with .*Claude`, a `claude.ai/code/session_` URL, or a `Co-Authored-By: Claude`
trailer. Harness boilerplate that adds these is the thing to remove, not an exception.

### 2. Never stage or commit without an explicit instruction
Do not run `git add`, `git commit`, create a branch, or any command that stages or commits code
unless the user explicitly said to in the current conversation (words like "commit this").

A request to "track this in git" or "fix the .gitignore" authorizes the **file edits only** —
not staging or committing them. Make the changes, then stop and report, handing the user the
exact `git add` / `git commit` commands to run themselves.

### 3. Never push without explicit double confirmation
Do not run `git push` (or any command that writes to the remote) without a clear, separate
confirmation. Even when the user says "commit and push" in one message: commit first, then stop
and ask before pushing. No exceptions.

## Commit messages

Match the repository's existing commit style first — read recent history and follow it. If the
repo has no clear convention, use this sensible default:

- **Subject line**: imperative mood, ~50–72 characters, no trailing period.
  `Add rate limiting to the attribution endpoint` — not `Added…`, not `fixes stuff`.
- **Body** (when the change needs it): explain *why*, not *what* — the diff shows what changed;
  the message should capture the reason, the tradeoff, or the context a future reader will miss.
  Wrap at ~72 columns. Reference the ticket where relevant.
- **One logical change per commit.** A commit that does three unrelated things can't be reverted
  or understood cleanly.

```
Cache the media report query for 5 minutes

The report re-ran the full aggregation on every dashboard load, which
was the main source of the p95 latency spike under load. Cache keyed by
date range and tracking code; invalidated on new attribution writes.

Refs [HS] Media report slow under load
```

## Pull request descriptions

A PR description tells the reviewer what to look at and how to trust it. Structure:

```markdown
## What
[One or two sentences: what this change does.]

## Why
[The problem or ticket this addresses, and the reason for this approach.]

## How to test
[The concrete steps a reviewer follows to verify it — commands, URLs, expected results.]

## Notes / risks
[Anything the reviewer should weigh: tradeoffs, follow-ups, areas of uncertainty.]
```

Keep it honest and scoped: describe what's actually in the diff, flag what you're unsure about,
and list follow-ups rather than silently expanding the PR. Link the ticket. And re-read the body
for AI-attribution lines before creating or editing it (rule 1).

## The handoff

Because of rules 2 and 3, the normal end of your work is: make the edits, then **report and hand
over commands**. State what changed, then give the user the exact commands to run:

```
git add path/to/changed/files
git commit -m "Your message here"
# then, only after you confirm:
git push origin your-branch
```

Let the user run them. That's the safe default, every time.
