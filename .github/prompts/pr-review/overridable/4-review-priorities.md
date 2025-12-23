# Review Priorities

Review in this order:

## 1. Critical Issues (Blocking)

- **Bugs**: Logic errors, null references, race conditions, off-by-one errors
- **Security**: SQL injection, XSS, authentication bypasses, exposed secrets, CSRF
- **Data loss**: Missing transactions, incorrect deletions, data corruption risks
- **Performance**: N+1 queries, memory leaks, inefficient algorithms on hot paths

## 2. Maintainability Issues (Important)

- **Mixed responsibilities**: Functions doing validation + fetching + business logic + saving
- **Hidden dependencies**: Direct imports that make testing require complex mocks
- **Missing error handling**: Uncaught exceptions, silent failures, missing validation
- **Poor boundaries**: Tight coupling, missing interfaces, implementation details leaked

## 3. Improvements (Nice-to-have)

- Better naming, test coverage, documentation
- Only mention if high value - skip nitpicks

---
