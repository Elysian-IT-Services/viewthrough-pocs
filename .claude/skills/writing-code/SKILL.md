---
name: writing-code
description: >-
  Apply our team's engineering conventions when writing or modifying any production code —
  declarative style, descriptive names, DRY/SOLID/Clean Architecture, no magic values, and
  security/performance as first-class concerns. Use this whenever you are implementing a
  feature, refactoring, fixing a bug, or scaffolding a module, even if the user only says
  "add", "build", "implement", or "fix" without naming conventions. For Angular or React
  work, also read the matching file in references/ for framework-specific rules.
---

# Writing Code

These are the conventions we hold every change to. The goal is code the next person can read
in one pass and trust: lean, declarative, and consistent across the codebase. Follow the
spirit, not just the letter — when a rule and readability collide, readability wins, and you
say why.

## Before you write anything

**Reuse before creating.** In an existing codebase, the fastest correct change is usually the
one that leans on what's already there — services, utilities, models, styles, constants, and
the framework idioms already in play. Look first. Add something new only where a real gap
exists, and name the gap when you do. Prefer editing an existing file over adding one; a new
file is a new thing to find, import, and maintain.

**Never build against a contract you haven't seen.** An interface, provider, wrapper, or
abstraction invented around a guessed API shape is a liability, not an asset — it locks in an
assumption that turns out wrong. Read the real contract first, or ask for it.

**Stay in scope.** Do the change that was asked. Unrelated cleanups, drive-by refactors, and
adjacent bug fixes are their own change — if you spot one, flag it as a follow-up rather than
folding it into this diff. A focused diff is reviewable; a sprawling one hides its own bugs.

## Declarative over imperative

Prefer expressions that say *what* you want over step-by-step statements that say *how* to get
it. Data-driven patterns beat branching logic; a `map`/`filter`/`reduce` or a lookup table is
usually clearer than a hand-rolled loop with accumulators.

```ts
// Prefer
const activeUserNames = users.filter(user => user.isActive).map(user => user.name)

// Over
const activeUserNames = []
for (let i = 0; i < users.length; i++) {
  if (users[i].isActive) activeUserNames.push(users[i].name)
}
```

Write less code. If one expressive line reads as clearly as four, write the one line. Skip
trivial ceremony — needless intermediate variables, defensive boilerplate for cases that
can't happen, and comments that restate the code. But never compress to the point of
obscurity: a clever one-liner nobody can modify safely is worse than three honest lines.

## Naming

Use full, descriptive, pronounceable names. A reader should understand a variable from its
name alone, without chasing its definition.

Avoid single-letter identifiers and cryptic abbreviations — including loop counters and
callback parameters. `index`, `item`, `element`, `event`, `error`, `response` read instantly;
`i`, `x`, `e`, `usr`, `btn`, `calc`, `tmp` make the reader decode. The few universal
conventions (`id`) are fine; everything else earns its full name.

```ts
// Prefer
users.forEach((user, index) => renderRow(user, index))
onError(error => logger.warn(error.message))

// Over
users.forEach((u, i) => renderRow(u, i))
onError(e => logger.warn(e.message))
```

Names should match the domain vocabulary the rest of the codebase already uses. Consistency
across files matters more than any single "better" name.

## No magic strings or numbers

Any literal that carries meaning gets a named constant, declared once and referenced
everywhere it applies — including user-facing copy that mirrors a threshold (if the limit is
`10`, the message "max 10 items" reads from the same constant, so they can never drift apart).

A constant used in more than one layer must live in a shared constants location and be
exported from there — never buried unexported inside a component, service, or module, because
burying it forces the next person to duplicate it.

```ts
// Prefer
export const MAX_UPLOAD_SIZE_MEGABYTES = 10
if (fileSizeMegabytes > MAX_UPLOAD_SIZE_MEGABYTES) reject(`Files must be under ${MAX_UPLOAD_SIZE_MEGABYTES}MB`)

// Over
if (fileSizeMegabytes > 10) reject('Files must be under 10MB')
```

## Structure and separation of concerns

Keep business logic out of controllers, components, and templates. A controller receives a
request and delegates; a component renders state and forwards events; the real work lives in a
service or a pure function that can be tested on its own. When logic is hard to test, that is
usually the structure telling you it's in the wrong place.

Apply DRY, SOLID, and Clean Architecture as defaults, not aspirations. Extract shared logic
into a utility or service *before* you copy-paste it the second time.

We organize every app the same way, regardless of framework — three top-level folders inside
the app source root:

- **`core/`** — technical foundation, organized *by type*. One folder per kind of thing, each
  with an `index.ts` barrel: `models/`, `interfaces/`, `constants/`, `services/`, `guards/`,
  `interceptors/`, `utils/`, and so on. Cross-cutting infrastructure only — auth, HTTP
  plumbing, data access, app chrome. Never feature logic.
- **`features/`** — product surface, organized *by feature* (`auth/`, `admin-dashboard/`,
  `purchases/`). Inside each feature, the same by-type split scoped to that feature. A feature
  never imports from another feature — shared things move up to `shared/` or `core/`.
- **`shared/`** — reusable, feature-agnostic pieces (`components/`, `pipes/`, `utils/`), each
  with an `index.ts`. Presentational or purely functional; no feature knowledge, no app state.

So: **organize by domain first, then by function within that domain.** Barrels are mandatory —
every folder exports its public surface through `index.ts`, and cross-folder imports go
through that barrel (`from '../../core/services'`), never deep into a file path. Within a
folder, files import each other directly (`from './prisma.service'`) — importing your own
barrel from inside it creates a circular dependency.

Create a folder only when something goes in it; empty scaffolding is bloat. If the codebase
already follows a different convention consistently, match it and say so rather than
half-migrating it.

## No bloat

Ship only what is used. No dead code, no commented-out blocks, no unnecessary files, layers,
or wrappers, no DTO fields nothing consumes. Every line is a line someone else has to read and
keep working. If you're leaving something for later, it's a `TODO` with a reason, not
commented-out code.

## Comments

Never write comments that explain *how* the code works — the code already shows that, and the
comment will rot the first time the code changes. Comment only where genuine understanding is
at risk: a non-obvious edge case, a landmine that breaks something elsewhere if changed, the
reason a decision was made over the obvious alternative, or a `TODO` left behind. Everything
else is noise; delete it.

```ts
// Good — explains a non-obvious why
// Stripe rounds half-up; we round half-even to match our ledger, so compute it ourselves.
const roundedAmount = roundHalfEven(rawAmount)

// Noise — restates the code
// increment the counter
counter += 1
```

No `console.log` (or language equivalent) left in committed code. Use the project's logger for
anything that should persist; delete debugging output before you're done.

## Security, performance, and scalability are part of every change

These are not a separate review pass — consider them as you write. If the task or the obvious
approach overlooks one, flag it plainly rather than silently shipping it:

- An N+1 query, or an unbounded query that will not hold as the table grows.
- An endpoint with no authentication, authorization, or rate limiting.
- A secret, key, or token reaching the client, or logged.
- Unvalidated input crossing a trust boundary.
- Anything that works at ten rows and falls over at ten million.

Naming the risk in one sentence when you hand back the work is part of doing the work.

## Framework-specific rules

When the change is in one of these frameworks, read the matching reference file and apply it —
it carries the current idioms we expect, which change faster than these general rules:

- **Angular** → `references/angular.md`
- **React** → `references/react.md`
