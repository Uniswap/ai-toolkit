---
description: Comprehensively diagnose bugs with root cause analysis, systematic fixes, regression tests, and prevention strategies.
argument-hint: <error text or pointer> [--run-tests] [--deep-analysis] [--generate-tests] [--prevention-mode]
allowed-tools: Bash(npm test:*), Bash(pnpm test:*), Bash(bun test:*), Bash(yarn test:*), Bash(npm run lint*), Bash(pnpm lint*), Bash(bun lint*), Bash(yarn lint*)
---

## Inputs

- `$ARGUMENTS`: Error message, stack trace, failing test output, or bug description
- `--run-tests`: Execute project test suites to capture live failure output
- `--deep-analysis`: Perform comprehensive Five Whys analysis and system-level investigation
- `--generate-tests`: Automatically create regression tests with edge case coverage
- `--prevention-mode`: Focus on prevention strategies and system improvements

## Phase 1: Enhanced Debugging & Analysis

### Initial Diagnosis

Use **debug-assistant** with enhanced capabilities to:

1. **Error Pattern Recognition**:

   - Classify error type (runtime, compilation, logic, integration, performance)
   - Identify error patterns and common causes
   - Check for known issue signatures in codebase
   - Analyze error frequency and impact scope

2. **Multi-File Context Analysis**:

   - Trace error propagation across modules
   - Identify all affected files and dependencies
   - Map data flow through the error chain
   - Check for cascading failures

3. **Five Whys Root Cause Analysis**:
   - Why did the error occur? (immediate cause)
   - Why did the immediate cause happen? (contributing factors)
   - Why did those factors exist? (system conditions)
   - Why were those conditions present? (process gaps)
   - Why weren't these gaps prevented? (root cause)

### Deep System Analysis

If `--deep-analysis` is provided:

1. **Causal Chain Mapping**:

   - Primary cause identification
   - Secondary contributing factors
   - Environmental conditions
   - Timing dependencies
   - Resource constraints

2. **System-Level vs Code-Level Classification**:

   - Code logic errors
   - Architecture problems
   - Configuration issues
   - Infrastructure limitations
   - Process failures

3. **Impact Assessment**:
   - Affected user scenarios
   - Performance implications
   - Security considerations
   - Data integrity risks

## Phase 2: Systematic Fix Implementation

### Fix Strategy Development

Based on root cause analysis, develop:

1. **Immediate Fix Plan**:

   - Minimal code changes required
   - Risk assessment of each change
   - Rollback strategy if needed
   - Testing approach

2. **Implementation Approach**:
   - Use **refactorer** for minimal, surgical patches
   - Prioritize backwards compatibility
   - Implement defensive programming practices
   - Add appropriate error handling

### Code Quality Assurance

- Ensure fix follows project coding standards
- Verify no introduction of new vulnerabilities
- Maintain existing API contracts
- Optimize for maintainability

## Phase 3: Comprehensive Test Generation

### Regression Test Suite

Use **test-writer** to create:

1. **Core Regression Tests**:

   - Test the exact scenario that failed
   - Verify the fix resolves the issue
   - Ensure no side effects introduced

2. **Edge Case Coverage**:

   - Boundary conditions that led to the bug
   - Input validation scenarios
   - Error state handling
   - Resource exhaustion cases

3. **Multi-Level Testing**:

   - **Unit Tests**: Component-level validation
   - **Integration Tests**: Cross-module interactions
   - **End-to-End Tests**: Full user workflow validation
   - **Performance Tests**: Resource usage verification

4. **Test Coverage Metrics**:
   - Measure code coverage improvement
   - Identify untested paths
   - Ensure critical paths are covered
   - Track test execution performance

## Phase 4: Prevention Strategy Implementation

### Code-Level Improvements

1. **Defensive Programming**:

   - Input validation enhancements
   - Error boundary implementations
   - Graceful degradation patterns
   - Resource cleanup procedures

2. **Type Safety & Validation**:
   - Strengthen type definitions
   - Add runtime validation
   - Implement schema validation
   - Use assertion libraries

### System-Level Enhancements

1. **Monitoring & Observability**:

   - Add logging for critical paths
   - Implement health checks
   - Create performance metrics
   - Set up alerting thresholds

2. **Configuration Management**:
   - Externalize configuration
   - Add configuration validation
   - Implement feature flags
   - Create environment-specific settings

### Process Improvements

1. **Code Review Guidelines**:

   - Add specific review criteria
   - Create bug pattern checklists
   - Implement pair programming for critical code
   - Establish security review requirements

2. **Testing Strategy**:

   - Enhance CI/CD pipeline
   - Add pre-commit hooks
   - Implement property-based testing
   - Create mutation testing

3. **Documentation Updates**:
   - Update API documentation
   - Create troubleshooting guides
   - Document known limitations
   - Add deployment procedures

## Enhanced Output Structure

### Comprehensive Report

```json
{
  "errorAnalysis": {
    "errorType": "string",
    "errorPattern": "string",
    "severity": "critical|high|medium|low",
    "scope": "string[]"
  },
  "rootCauseAnalysis": {
    "fiveWhys": {
      "why1": "immediate cause",
      "why2": "contributing factors",
      "why3": "system conditions",
      "why4": "process gaps",
      "why5": "root cause"
    },
    "causalChain": "string[]",
    "contributingFactors": "string[]",
    "systemLevel": "boolean",
    "codeLevel": "boolean"
  },
  "fixImplementation": {
    "strategy": "string",
    "patches": [
      {
        "file": "string",
        "description": "string",
        "changes": "string",
        "riskLevel": "low|medium|high"
      }
    ],
    "rollbackPlan": "string"
  },
  "regressionTests": {
    "unitTests": "TestCase[]",
    "integrationTests": "TestCase[]",
    "e2eTests": "TestCase[]",
    "coverageMetrics": {
      "before": "number",
      "after": "number",
      "improvement": "number"
    }
  },
  "preventionRecommendations": {
    "codeLevel": {
      "defensiveProgramming": "string[]",
      "typeValidation": "string[]",
      "errorHandling": "string[]"
    },
    "systemLevel": {
      "monitoring": "string[]",
      "configuration": "string[]",
      "infrastructure": "string[]"
    },
    "processLevel": {
      "codeReview": "string[]",
      "testing": "string[]",
      "documentation": "string[]",
      "cicd": "string[]"
    }
  },
  "implementationPlan": {
    "immediate": "string[]",
    "shortTerm": "string[]",
    "longTerm": "string[]"
  }
}
```

## Agent Orchestration Strategy

### Primary Agents

1. **debug-assistant**: Enhanced with Five Whys methodology, pattern recognition, and multi-file analysis
2. **refactorer**: Minimal, surgical code fixes with risk assessment
3. **test-writer**: Comprehensive test suite generation with coverage analysis

### Secondary Agents (as needed)

1. **security-analyst**: For security-related bugs
2. **performance-optimizer**: For performance issues
3. **architect**: For system-level design problems
4. **devops-engineer**: For infrastructure and deployment issues

### Workflow Orchestration

1. **Sequential Analysis**: Root cause → Fix → Test → Prevention
2. **Parallel Processing**: Where appropriate for independent analysis
3. **Iterative Refinement**: Based on test results and validation
4. **Quality Gates**: Validation at each phase before proceeding
