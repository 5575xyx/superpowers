# Writing Good Tests

A test earns its place by proving something that would otherwise break
silently. This page is the standard for tests written under
[test-driven-development](SKILL.md): name the break, then prove the test
can catch one.

## Name the Break

**Name the production change a test fails without** — 点名会坏掉的生产改动.

A test name that only restates the behavior under test (`returns success`)
tells a future reader nothing about what the test protects. A test named
for the break tells them what stops shipping if they delete or weaken it:

```
test('empty cart cannot checkout: lineItems length is asserted before createOrder', ...)
test('retry stops at 3 attempts: attempts counter is 3 after the third failure', ...)
```

Rules:
- One production change per test. If the name needs "and", split the test.
- The name must name something in the implementation, not only the input.
- If you cannot name the break, you do not yet know what the test is for —
  write the break first, then the assertion.

## Mutation Check

**变异检查：** After the test is green, temporarily break or delete the
production change the test names and re-run it. The test must fail for the
reason its name gives. Restore the code and confirm green again.

- Break fails the test → the test works.
- Break does nothing → the test asserts nothing that matters; rewrite it.
- Several tests fail → fine; note which one names the break, and keep that
  name accurate.

Do this once per new test class of behavior, not on every run: it is a
one-time proof that the suite can catch the change it claims to catch.

## Other Quality Bars

| Quality | Good | Bad |
|---------|------|-----|
| **Minimal** | One break per test | One test guarding five production changes |
| **Clear** | Name describes the break | `test('test1')` |
| **Shows intent** | Demonstrates desired API | Obscures what code should do |
| **Real behavior** | Calls real code; mocks only at true seams | Asserts on mock call counts alone |

When adding mocks or test utilities, also read
[testing-anti-patterns.md](testing-anti-patterns.md).
