---
name: stakeholder-findings
description: >-
  Investigate a problem, question, or challenge and write the results up for a
  non-technical audience — POs, managers, clients, the wider business. Use this whenever asked
  to "investigate", "look into", "find out why", "write up findings", produce a "summary for
  stakeholders", a "non-technical explanation", or an "executive summary" of a technical issue.
  Produces a fixed structure — Summary + Verdict, Problem, Solution, Impact, then Research
  Findings — leading with the answer and keeping jargon out of the top.
---

# Stakeholder Findings

Two jobs, in order: investigate the thing properly, then explain it to someone who doesn't work
in the code. The report is the deliverable, and its whole purpose is that a busy stakeholder can
read the top, understand what's going on, and make a decision — without a glossary and without
scrolling into the technical weeds. The depth still exists; it just moves to the end for the
readers who want it.

## Investigate first

The report is only as good as the investigation behind it. Before writing:

- **Verify, don't assume.** Check the actual code, data, logs, or system — don't report a claim
  from a comment, a ticket, or someone's recollection as fact until you've confirmed it.
- **Separate fact from hypothesis.** State plainly what you confirmed versus what you suspect,
  and attach a confidence level to conclusions that aren't certain ("confirmed", "likely",
  "unverified"). Overclaiming is the fastest way to lose a stakeholder's trust.
- **Follow the evidence to a single verdict.** Stakeholders need a conclusion, not a menu of
  possibilities. If genuine options remain, recommend one and say why.

## Report structure

Use this exact order. The first four sections are for everyone and stay jargon-free; the last
is the technical backup.

```markdown
# [Plain-language title — what was investigated, not the ticket number]

## Summary
[2–4 sentences: what you looked into and the bottom line, in everyday language.]

**Verdict:** [One clear sentence — the single conclusion someone can act on.]

## Problem
[What prompted this and why it matters to the business or users. What's broken, at risk, or
unanswered — described by its effect, not its mechanism.]

## Solution
[What resolves it, or what was done. Plain language. If there are options, lead with your
recommendation and keep the alternatives brief.]

## Impact
[What this means in terms the business cares about: time, cost, risk, revenue, users affected,
effort to fix. Say what changes if we act versus if we don't. Quantify wherever you honestly
can.]

---

## Research Findings
[The evidence and technical detail for readers who want it — what you checked, what you found,
data, file/line references, confidence levels, and caveats. Safe for a decision-maker to skip.]
```

Always include the Summary and Verdict, even for a short write-up — they're the part most people
will actually read. Keep the top four sections skimmable in about a minute; let Research Findings
be as long as the evidence needs.

## Writing for a non-technical reader

Write as if explaining to a smart colleague in a different department. The test: would a PO or a
client understand every sentence without asking what a word means?

- **Lead with the answer.** Decision-makers read top-down and stop when they have enough. Never
  make them read the analysis to find the conclusion.
- **Cut jargon and acronyms.** If a technical term is genuinely unavoidable in the top sections,
  explain it in the same breath in one short clause. Save the raw terminology for Research
  Findings.
- **Describe effects, not mechanisms, up top.** Stakeholders care what happens and what it
  costs, not how it works internally.
- **Quantify impact honestly.** "Roughly a day of work" and "affects about 5% of checkouts"
  land far better than "non-trivial" or "some users" — but never invent a number to sound
  precise.

### Translating technical → plain

Do this kind of translation in the top sections; keep the left-hand term for Research Findings.

**Example 1**
Jargon: "There's an N+1 query in the orders endpoint."
Plain: "The orders page fetches data one record at a time instead of all at once, so it gets
slower as the number of orders grows — noticeable now, worse at scale."

**Example 2**
Jargon: "A race condition lets two concurrent writes clobber each other."
Plain: "If two people save at the same moment, one person's change can silently overwrite the
other's. It's intermittent, which is why it's been hard to pin down."

**Example 3**
Jargon: "The token is exposed client-side, so the endpoint is effectively unauthenticated."
Plain: "A secret key that should stay on our servers is visible in the browser, which means
someone could use our service as if they were us."

## Length and tone

Match the length to the decision at stake — a paragraph for a quick question, a page for a real
investigation. Be direct and factual; state bad news plainly rather than softening it into
vagueness. The point is a stakeholder who finishes reading knowing exactly what was found and
what to do about it.
