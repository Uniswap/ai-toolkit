---
description: Generate comprehensive tests with advanced testing strategies, scenario generation, and edge case identification using the enhanced test-writer agent.
argument-hint: [paths...] [--framework jest|vitest|pytest|cypress|playwright] [--type unit|integration|e2e|all] [--strategy standard|scenario|property|mutation|accessibility] [--requirements "user stories"]
allowed-tools: Read(*), Grep(*), Task(subagent_type:test-writer), Task(subagent_type:context-loader)
---

## Inputs

Parse arguments from `$ARGUMENTS`:

- **paths**: One or more file paths to generate tests for
- **--framework**: Testing framework (jest|vitest|pytest|cypress|playwright)
- **--type**: Test type (unit|integration|e2e|all) - default: unit
- **--strategy**: Testing strategy (standard|scenario|property|mutation|accessibility) - default: standard
- **--requirements**: Optional user stories or acceptance criteria for scenario generation
- **--edge-cases**: Flag to emphasize edge case identification (default: true)
- **--maintenance**: Flag to include test maintenance recommendations (default: false)

Examples:

- `/gen-tests src/auth/login.ts`
- `/gen-tests src/api/*.ts --type integration --framework jest`
- `/gen-tests src/components/Form.tsx --strategy scenario --requirements "As a user, I want to submit forms with validation"`
- `/gen-tests src/utils/ --type all --edge-cases --maintenance`

## Task

Generate comprehensive tests leveraging the enhanced test-writer agent's advanced capabilities:

1. **Context Analysis**: First understand the code structure and dependencies
2. **Test Generation**: Create tests based on the specified strategy
3. **Edge Case Identification**: Automatically identify boundary conditions
4. **Scenario Generation**: Create behavior-driven tests from requirements
5. **Maintenance Recommendations**: Suggest test organization and refactoring

## Orchestration Strategy

For complex test generation (multiple files or --type all), use orchestration:

1. **Context Loading Phase**:

   - Invoke **context-loader** to understand the codebase area
   - Identify dependencies and integration points
   - Gather existing test patterns

2. **Test Generation Phase**:

   - For unit tests: Direct delegation to **test-writer**
   - For integration/e2e: Coordinate multiple agents:
     - **test-writer** for test scenarios
     - **context-loader** for API/database schemas
     - **security-analyzer** for security test cases (if applicable)

3. **Quality Assurance Phase**:
   - Validate test coverage completeness
   - Check for test anti-patterns
   - Ensure proper mocking strategies

## Delegation

### Simple Case (single file, unit tests):

Invoke **test-writer** with:

- `paths`: parsed file paths
- `framework`: from `--framework` or auto-detected
- `coverage`: from `--type` (map to coverage type)
- `testType`: from `--strategy`
- `requirements`: from `--requirements` if provided
- `context`: dependency information if needed

### Complex Case (multiple files or integration/e2e):

Invoke **agent-orchestrator** to coordinate:

- **context-loader**: Build comprehensive understanding
- **test-writer**: Generate test scenarios and implementations
- **security-analyzer**: Add security test cases (for APIs)
- **performance-analyzer**: Add performance benchmarks (for critical paths)

## Output Format

```typescript
{
  summary: string; // Overview of test generation strategy
  testStrategy: {
    approach: string; // Selected testing approach
    coverage: number; // Estimated coverage percentage
    edgeCasesIdentified: number;
    scenariosGenerated: number;
  };
  suggestedTests: Array<{
    file: string; // Test file path
    contents: string; // Complete test file
    rationale: string[]; // Key test cases covered
    scenarios: Array<{ // Generated test scenarios
      name: string;
      description: string;
      type: 'happy-path' | 'edge-case' | 'error-handling' | 'security';
    }>;
    edgeCases: Array<{ // Identified edge cases
      category: string;
      cases: string[];
      severity: 'critical' | 'important' | 'nice-to-have';
    }>;
  }>;
  recommendations?: { // If --maintenance flag is set
    refactoring: string[]; // Test refactoring opportunities
    utilities: string[]; // Suggested test utilities
    organization: string; // Test structure improvements
    maintenance: string[]; // Maintenance guidelines
  };
  integrationPoints?: Array<{ // For integration/e2e tests
    service: string;
    mockingStrategy: string;
    dependencies: string[];
  }>;
}
```

## Advanced Features

### Scenario-Driven Testing

When `--strategy scenario` is used with `--requirements`:

- Parse user stories into Given-When-Then scenarios
- Generate behavior-driven test cases
- Create acceptance test suites
- Map requirements to test coverage

### Property-Based Testing

When `--strategy property` is used:

- Identify pure functions suitable for property testing
- Generate property-based test scenarios
- Create hypothesis-driven test cases
- Include random data generators with constraints

### Edge Case Emphasis

When `--edge-cases` flag is set (default):

- Comprehensive boundary value analysis
- Null/undefined/empty handling
- Overflow/underflow conditions
- Security edge cases (injection, XSS)
- Concurrency and race conditions

### Test Maintenance Mode

When `--maintenance` flag is set:

- Identify brittle tests
- Suggest test utilities and factories
- Recommend test organization improvements
- Provide documentation templates

## Examples

### Basic Unit Test Generation

```bash
/gen-tests src/utils/validator.ts
```

### Comprehensive Integration Testing

```bash
/gen-tests src/api/ --type integration --framework jest
```

### Scenario-Driven E2E Tests

```bash
/gen-tests src/features/checkout/ --type e2e --strategy scenario \
  --requirements "As a customer, I want to complete checkout with multiple payment methods"
```

### Full Test Suite with Maintenance

```bash
/gen-tests src/core/ --type all --edge-cases --maintenance
```
