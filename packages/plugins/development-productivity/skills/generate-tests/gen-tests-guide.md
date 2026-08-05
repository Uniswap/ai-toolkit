---
description: Generate comprehensive tests with advanced testing strategies, scenario generation, and edge case identification using the enhanced test-writer agent.
argument-hint: [paths...] [--framework jest|vitest|pytest|cypress|playwright] [--type unit|integration|e2e|all] [--strategy standard|scenario|property|mutation|accessibility] [--requirements "user stories"]
allowed-tools: Read, Grep, Glob, Task(subagent_type:test-writer-agent), Task(subagent_type:development-codebase-tools:agent-orchestrator-agent), Task(subagent_type:development-codebase-tools:context-loader-agent), Task(subagent_type:development-codebase-tools:security-analyzer-agent), Task(subagent_type:development-codebase-tools:performance-analyzer-agent)
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

Generate comprehensive tests leveraging the enhanced test-writer-agent's advanced capabilities:

1. **Context Analysis**: First understand the code structure and dependencies
2. **Test Generation**: Create tests based on the specified strategy
3. **Edge Case Identification**: Automatically identify boundary conditions
4. **Scenario Generation**: Create behavior-driven tests from requirements
5. **Maintenance Recommendations**: Suggest test organization and refactoring

## Orchestration Strategy

For complex test generation (multiple files or --type all), use orchestration:

1. **Context Loading Phase**:

   - Invoke **development-codebase-tools:context-loader-agent** to understand the codebase area
   - Identify dependencies and integration points
   - Gather existing test patterns

2. **Test Generation Phase**:

   - For unit tests: Direct delegation to **test-writer-agent**
   - For integration/e2e: Coordinate multiple agents:
     - **test-writer-agent** for test scenarios
     - **development-codebase-tools:context-loader-agent** for API/database schemas
     - **development-codebase-tools:security-analyzer-agent** for security test cases (if
       applicable)

3. **Quality Assurance Phase**:
   - Name the behaviors you did NOT write a test for, and why
   - Check for test anti-patterns
   - Ensure proper mocking strategies

**When to skip the orchestration above:** a single file, or a handful of files in one module,
is faster and more accurate done directly. The agent list below is a menu of what is available,
not a set of steps to work through — invoke only the agents the specific task needs.

## Delegation

### Simple Case (single file, unit tests)

Invoke **test-writer-agent** with:

- `paths`: parsed file paths
- `framework`: from `--framework` or auto-detected
- `coverage`: from `--type` (map to coverage type)
- `testType`: from `--strategy`
- `requirements`: from `--requirements` if provided
- `context`: dependency information if needed

### Complex Case (multiple files or integration/e2e)

The orchestrator and the loader/analyzer agents live in the **development-codebase-tools**
plugin, so dispatch them with the cross-plugin form
`Task(subagent_type: development-codebase-tools:<agent-name>)`. `test-writer-agent` is in this
plugin and needs no prefix.

**If `development-codebase-tools:agent-orchestrator-agent` is available**, invoke it to coordinate:

- **development-codebase-tools:context-loader-agent**: Build comprehensive understanding
- **test-writer-agent**: Generate test scenarios and implementations
- **development-codebase-tools:security-analyzer-agent**: Add security test cases (for APIs)
- **development-codebase-tools:performance-analyzer-agent**: Add performance benchmarks (for critical paths)

**Fallback (if the orchestrator is not available)**:

Execute agents sequentially:

1. First invoke **development-codebase-tools:context-loader-agent** to gather context
2. Then invoke **test-writer-agent** with the gathered context
3. Optionally invoke **development-codebase-tools:security-analyzer-agent** for API endpoints
4. Aggregate results manually

## Output Format

```typescript
{
  summary: string; // Overview of test generation strategy
  testStrategy: {
    approach: string; // Selected testing approach
    // Coverage is only reported when a coverage tool actually ran and produced a
    // number. This skill's allowed-tools include no Bash, so it cannot run one --
    // in that case emit 'not_measured' and say which command the user should run.
    // Never estimate a coverage percentage; a guessed number reads as a
    // measurement and is not one.
    coverage: number | 'not_measured';
    coverageSource?: string; // Command whose output produced the number
    edgeCasesIdentified: number; // Count of edge cases you actually enumerated below
    scenariosGenerated: number; // Count of scenarios you actually generated below
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
