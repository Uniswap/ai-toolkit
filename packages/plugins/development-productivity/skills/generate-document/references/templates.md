# Content Type Templates

Use these templates when the document matches a specific content type. Adapt sections as needed.

## Security Report

```markdown
---
title: 'Security Assessment Report'
subtitle: 'Target Application Name'
date: 'YYYY-MM-DD'
---

# Executive Summary

- **Scope:** Brief description of what was assessed
- **Critical Findings:** X
- **High Findings:** X
- **Medium Findings:** X
- **Low Findings:** X

# Findings by Severity

## Critical

### VULN-001: Vulnerability Title

**CVSS Score:** X.X (Critical)
**CWE:** CWE-XXX
**Location:** `file:line`

**Description:** ...
**Impact:** ...
**Recommendation:** ...

## High

(Repeat pattern)

# Methodology

Description of assessment methodology.

# Scope

What was included/excluded.
```

## Code Review Report

```markdown
---
title: 'Code Review Report'
subtitle: 'PR #XXX - Feature Name'
date: 'YYYY-MM-DD'
---

# Summary

Brief overview of the code changes reviewed.

# Findings

## Architecture

### ARCH-001: Finding Title

**Impact:** High | Medium | Low
**Files:** `file1.ts`, `file2.ts`

Description and recommendations.

## Code Quality

(Repeat pattern)

## Testing

(Repeat pattern)

# Recommendations

Prioritized list of recommended actions.
```

## Research Summary

```markdown
---
title: 'Research Summary'
subtitle: 'Topic Name'
date: 'YYYY-MM-DD'
---

# Overview

Brief introduction to the research topic.

# Key Findings

1. **Finding One:** Description
2. **Finding Two:** Description
3. **Finding Three:** Description

# Analysis

Detailed analysis sections.

# Recommendations

Actionable recommendations based on research.

# References

Cited sources.
```
