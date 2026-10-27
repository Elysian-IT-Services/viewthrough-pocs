---
name: writing-tests
description: >-
  Write clean, focused unit and end-to-end tests our way — one behavior per test, declarative
  setup, descriptive names, testing behavior not implementation. Use this whenever you are
  adding or changing tests, asked to "add tests", "write a unit test", "cover this", set up
  e2e specs, or improve test coverage — even if the framework (Jest, Vitest, Playwright,
  Cypress, etc.) isn't named. Match the project's existing test framework and helpers.
---

# Writing Tests

A good test suite is documentation that runs. Each test should state one expectation clearly
enough that when it fails, the name alone tells you what broke. Optimize for signal and
readability, not coverage percentage — a green suite that tests the wrong things is worse than
no suite, because it invites false confidence.

The code inside tests follows the same conventions as production code: declarative, DRY, no
magic values, full descriptive names, no `console.log`, comments only where genuinely needed.
Test code is real code and rots the same way when it's sloppy.

## One behavior per test

A unit test exercises a single function or unit and asserts **one behavior** — not an entire
feature flow. When a test checks one thing, a failure points straight at the cause; when it
checks five, a failure tells you only that "something in here broke."

This does not mean one `expect` per test — several assertions about the *same* behavior are
fine (a returned object's shape, say). It means one *reason to fail*. If you find yourself
writing "and then" in a test name, it's two tests.

```ts
// Prefer — each names one behavior
describe('calculateDiscount', () => {
  it('applies the member rate to the subtotal', () => { /* ... */ })
  it('returns the subtotal unchanged for non-members', () => { /* ... */ })
  it('throws when the subtotal is negative', () => { /* ... */ })
})

// Over — one test carrying a whole feature
it('handles discounts', () => {
  // asserts member rate, non-member, negative input, and rounding all at once
})
```

## Test behavior, not implementation

Assert on what the unit *does* — its return value, its emitted event, the state a user would
observe — not on how it does it internally. Tests coupled to implementation break on every
refactor even when behavior is unchanged, which trains people to ignore failures.

- Don't assert that a private helper was called, or reach into internal fields.
- Don't over-mock. Mock the true boundaries (network, clock, filesystem, third-party SDK) and
  let the real code under test run. A test that mocks everything tests only the mocks.
- Prefer querying by what the user perceives (role, label, visible text) over test-only hooks,
  in UI tests.

## Naming

The test name is the specification. Write it so someone reading the test output — without the
code — understands the expected behavior and the condition. Full, descriptive names; no
single-letter variables or cryptic abbreviations in test bodies either.

Prefer a consistent shape: the unit, the expected behavior, the condition.

```
calculateDiscount › returns the subtotal unchanged for non-members
OrderRepository › throws NotFoundError when the order id does not exist
```

## Structure: Arrange–Act–Assert

Keep each test in three visible beats — set up the inputs, perform the one action, assert the
outcome. The separation makes tests scannable and stops setup from bleeding into assertions.

Keep setup declarative and close to the test. Use small, named factory helpers or builders for
test data so each test shows only what's *relevant* to it, with sensible defaults for the rest
— this beats sharing one giant mutable fixture that hides which field actually matters.

```ts
it('applies the member rate to the subtotal', () => {
  const memberOrder = buildOrder({ isMember: true, subtotalCents: 10_000 })

  const discountedTotal = calculateDiscount(memberOrder)

  expect(discountedTotal).toBe(9_000)
})
```

Extract repeated setup into named helpers rather than copy-pasting it — but keep the data that
*defines* the case visible in the test. A reader shouldn't have to scroll to a distant
`beforeEach` to understand why the result is what it is.

## Determinism

Tests must pass or fail for real reasons, not timing or ordering. Flaky tests get ignored, and
ignored tests protect nothing.

- No real sleeps, real network, or real wall-clock — fake timers, stub the clock, control the
  data. Import time and randomness so they can be injected.
- Each test is independent: no shared mutable state, no reliance on execution order, clean up
  what you create.
- In e2e, wait on observable conditions (an element, a response, a state) — never a fixed
  `sleep(2000)`.

## Choosing the level

- **Unit tests** are the default for logic — pure functions, services, reducers, validators.
  Fast, focused, one behavior each. Most of the suite lives here.
- **Integration tests** cover a seam between units that unit tests can't reach honestly (a
  service against a real repository, a handler through its middleware).
- **End-to-end tests** cover a small number of critical user journeys through the running app —
  sign in, checkout, the paths that must never break. They're slow and broader by nature, so
  keep them few and reserve them for genuine flows; push everything that *can* be a unit test
  down to a unit test.

## What to cover

Aim tests at the paths most likely to break or most costly if they do:

- The happy path, stated plainly.
- Boundaries and edge cases — empty, zero, one, max, off-by-one, unicode, timezone edges.
- Failure modes — invalid input, thrown errors, rejected promises, the network failing.

If production code is genuinely hard to test, that's a signal about the code, not the test.
Propose the smallest refactor that makes it testable (usually: extract the logic out of the
controller/component into a pure function) rather than contorting the test around it.
