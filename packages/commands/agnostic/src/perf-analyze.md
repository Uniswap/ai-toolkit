---
description: O(1) Chain-of-Thought Performance Analyzer - Systematic complexity analysis with optimization paths, bottleneck identification, and performance proofs
argument-hint: <code or file path> [concerns] [--run-benchmarks] [--memory-profile] [--full-trace] [--suggest-caching] [--compare-implementations] [--typescript-diagnostics] [--flamegraph] [--pulumi-analysis] [--cloudwatch-metrics]
allowed-tools: Bash(python -m cProfile*), Bash(python -m memory_profiler*), Bash(py-spy*), Bash(node --prof*), Bash(node --cpu-prof*), Bash(node --heap-prof*), Bash(node --inspect*), Bash(tsc --diagnostics*), Bash(tsc --extendedDiagnostics*), Bash(0x*), Bash(clinic*), Bash(autocannon*), Bash(go test -bench*), Bash(go test -cpuprofile*), Bash(pytest --profile*), Bash(time *), Bash(hyperfine*), Bash(pulumi preview*), Bash(pulumi refresh*), Bash(pulumi stack graph*), Bash(pulumi stack export*), Bash(pulumi about*), Bash(aws cloudwatch get-metric-statistics*), Bash(npm run bench*), Bash(yarn bench*), Bash(pnpm bench*), Bash(bun bench*)
---

## Inputs

- `$ARGUMENTS`: Code to analyze, file path, or function/component identifier
- `concerns`: Specific performance concerns or areas to focus on (optional)
- `--run-benchmarks`: Execute performance benchmarks and compare before/after metrics
- `--memory-profile`: Include detailed memory usage analysis and allocation patterns
- `--full-trace`: Perform complete execution trace with call stack analysis
- `--suggest-caching`: Focus on caching strategies and memoization opportunities
- `--compare-implementations`: Compare multiple implementation approaches with complexity proofs
- `--typescript-diagnostics`: Run TypeScript compiler diagnostics and type-checking performance analysis
- `--flamegraph`: Generate flamegraph visualization using 0x or clinic flame
- `--pulumi-analysis`: Analyze Pulumi stack performance, resource dependencies, and deployment timing
- `--cloudwatch-metrics`: Fetch AWS CloudWatch metrics for Pulumi-deployed infrastructure

---

You are an expert performance engineer specializing in O(1) optimizations. Your task is to systematically analyze code through multiple iterations of deep reasoning.

## Code to Analyze

{code}

## Specific Performance Concerns

{concerns}

---

## ANALYSIS PHASES

### Phase 1: Component Identification

Iterate through each component:

1. What is its primary function?
2. What operations does it perform?
3. What data structures does it use?
4. What are its dependencies?

### Phase 2: Complexity Analysis

For each operation, provide:

**OPERATION:** [Name]
**CURRENT_COMPLEXITY:** [Big O notation]
**BREAKDOWN:**

- Step 1: [Operation] -> O(?)
- Step 2: [Operation] -> O(?)

**BOTTLENECK:** [Slowest part]
**REASONING:** [Detailed explanation]

### Phase 3: Optimization Opportunities

For each suboptimal component:

**COMPONENT:** [Name]
**CURRENT_APPROACH:**

- Implementation: [Current code]
- Complexity: [Current Big O]
- Limitations: [Why not O(1)]

**OPTIMIZATION_PATH:**

1. [First improvement]
   - Change: [What to modify]
   - Impact: [Complexity change]
   - Code: [Implementation]
2. [Second improvement]
   ...

### Phase 4: System-Wide Impact

Analyze effects on:

1. Memory usage
2. Cache efficiency
3. Resource utilization
4. Scalability
5. Maintenance

---

## OUTPUT REQUIREMENTS

### 1. Performance Analysis

For each component:

**COMPONENT:** [Name]
**ORIGINAL_COMPLEXITY:** [Big O]
**OPTIMIZED_COMPLEXITY:** O(1)
**PROOF:**

- Step 1: [Reasoning]
- Step 2: [Reasoning]
  ...

**IMPLEMENTATION:**

```
[Code block]
```

### 2. Bottleneck Identification

**BOTTLENECK #[n]:**
**LOCATION:** [Where]
**IMPACT:** [Performance cost]
**SOLUTION:** [O(1) approach]
**CODE:** [Implementation]
**VERIFICATION:** [How to prove O(1)]

### 3. Optimization Roadmap

**STAGE 1:**

- Changes: [What to modify]
- Expected Impact: [Improvement]
- Implementation: [Code]
- Verification: [Tests]

**STAGE 2:**
...

---

## ITERATION REQUIREMENTS

1. **First Pass:** Identify all operations above O(1)
2. **Second Pass:** Analyze each for optimization potential
3. **Third Pass:** Design O(1) solutions
4. **Fourth Pass:** Verify optimizations maintain correctness
5. **Final Pass:** Document tradeoffs and implementation details

---

## Remember to

- Show all reasoning steps
- Provide concrete examples
- Include performance proofs
- Consider edge cases
- Document assumptions
- Analyze memory/space tradeoffs
- Provide benchmarking approach
- Consider real-world constraints

---

## TypeScript-Specific Analysis

When analyzing TypeScript code:

1. **Compilation Performance**

   - Type checking overhead
   - Large type unions or intersections
   - Excessive type instantiation
   - `tsc --diagnostics` output analysis

2. **Runtime Performance**

   - Generated JavaScript efficiency
   - Async/await vs Promise chains
   - Object destructuring costs
   - Class vs function performance

3. **Bundling Impact**
   - Tree-shaking effectiveness
   - Dead code elimination
   - Module resolution strategy

---

## Pulumi Infrastructure Performance

When analyzing Pulumi stacks:

1. **Resource Provisioning**

   - Dependency graph optimization
   - Parallel vs sequential resource creation
   - Provider initialization overhead
   - State file size and complexity

2. **Deployment Performance**

   - `pulumi preview` execution time
   - Resource update batching
   - Network latency to cloud providers
   - State backend performance (S3, local, etc.)

3. **Stack Complexity**

   - Component resource organization
   - Cross-stack references
   - Dynamic provider configuration
   - Resource count and fanout

4. **CloudWatch Integration**
   - ECS task metrics (CPU, memory)
   - Lambda cold start times
   - API Gateway latency
   - RDS/Aurora query performance
   - Load balancer response times
