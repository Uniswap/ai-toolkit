---
name: test-generator
description: Generate comprehensive tests for code. Use when user says "write tests for this function", "add unit tests to this file", "generate integration tests for the API", "I need test coverage for this module", or "create e2e tests for the checkout flow".
user-invocable: true
allowed-tools: Read, Grep, Glob, Task(subagent_type:test-writer), Task(subagent_type:context-loader), Task(subagent_type:security-analyzer)
model: sonnet
---

# Test Generator

Generate comprehensive tests with advanced testing strategies, scenario generation, and edge case identification.

## When to Activate

- User asks to write tests
- User mentions test coverage
- User wants unit, integration, or e2e tests
- After implementing new features (suggest tests)
- User asks about testing a specific file or function

## Quick Process

1. **Analyze Code**: Understand structure and dependencies
2. **Select Strategy**: Choose testing approach based on code type
3. **Generate Tests**: Create tests with appropriate framework
4. **Identify Edge Cases**: Boundary conditions and error handling
5. **Output Files**: Write test files with full coverage

## Options

| Option           | Values                                    | Default     |
| ---------------- | ----------------------------------------- | ----------- |
| `--framework`    | jest, vitest, pytest, cypress, playwright | auto-detect |
| `--type`         | unit, integration, e2e, all               | unit        |
| `--strategy`     | standard, scenario, property, mutation    | standard    |
| `--requirements` | User stories for scenario generation      | (none)      |

## Strategies

- **Standard**: Traditional unit testing with assertions
- **Scenario**: Behavior-driven from user stories (Given-When-Then)
- **Property**: Property-based testing for pure functions
- **Mutation**: Mutation testing to verify test quality

## Edge Case Emphasis

Always identifies:

- Boundary values and null/undefined handling
- Overflow/underflow conditions
- Security edge cases (injection, XSS)
- Concurrency and race conditions

## Delegation

Invoke **test-writer** agent with:

- `paths`: Files to test
- `framework`: Testing framework
- `testType`: Testing strategy
- `requirements`: User stories (if provided)

For complex scenarios, coordinate with **context-loader** and **security-analyzer**.

## Examples

```
"Write tests for src/utils/validator.ts"
"Add integration tests for the API endpoints"
"Generate e2e tests for checkout flow"
"I need property-based tests for this pure function"
```

## Detailed Reference

For advanced strategies and orchestration, see [gen-tests-guide.md](gen-tests-guide.md).
