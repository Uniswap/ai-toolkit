---
description: Audit UI components and pages for accessibility (a11y) issues. Use when user says "check accessibility", "audit a11y compliance", "find WCAG violations", "is this component accessible", "run an accessibility audit", or "check screen reader support".
allowed-tools: Read, Grep, Glob, Bash(npx axe:*), Bash(npx pa11y:*), Bash(npx lighthouse:*), Bash(npx jest:*), Bash(node -e:*), Task
model: sonnet
---

# Accessibility Auditor

Audit frontend components and pages for WCAG 2.1 AA compliance, identifying violations by severity and providing targeted fix guidance.

## When to Activate

- User asks to "check accessibility" or "audit a11y"
- User wants to find WCAG violations or screen reader issues
- User mentions ADA compliance or ARIA issues
- Before shipping a new UI component or page
- User asks "is this accessible?"

## Quick Process

1. **Detect scope**: Identify target files (JSX/TSX/HTML/Vue/Svelte)
2. **Static analysis**: Scan code for structural a11y issues
3. **Tool detection**: Check for available automated tools (axe, pa11y, lighthouse)
4. **Run tools**: Execute available auditors on the target
5. **Report**: Output violations grouped by severity with fix guidance

## What Gets Checked

### Structural (Static Analysis)

| Category        | What to Check                                                                        |
| --------------- | ------------------------------------------------------------------------------------ |
| Images          | `<img>` missing `alt`; decorative images use `alt=""`                                |
| Forms           | Every `<input>` / `<select>` / `<textarea>` has associated `<label>` or `aria-label` |
| Headings        | Heading hierarchy is sequential (h1 → h2 → h3, no skipped levels)                    |
| Buttons & links | Interactive elements have accessible text (not icon-only without aria-label)         |
| Color contrast  | CSS custom properties checked; hardcoded hex values flagged for manual review        |
| ARIA            | `role`, `aria-*` attributes used correctly; no redundant roles                       |
| Keyboard        | `onClick` on non-interactive elements without `onKeyDown`/`onKeyPress`               |
| Focus           | No `tabIndex > 0`; focus-visible not suppressed via `outline: 0` without replacement |
| Language        | `<html lang="...">` present                                                          |
| Landmarks       | Page has at least one `<main>` landmark                                              |

### Automated Tools (when available)

```
@axe-core/cli  →  npx axe <url>  or  jest-axe in test files
pa11y          →  npx pa11y <url>
lighthouse     →  npx lighthouse <url> --only-categories=accessibility --output=json
```

## Step-by-Step

### Step 1: Identify Target Files

Glob for `.jsx`, `.tsx`, `.html`, `.vue`, `.svelte` under `src/` or the path provided.
If a URL is given, skip to Step 3 (tool-based audit).

### Step 2: Static Code Scan

For each component file:

1. Read the file
2. Check the structural categories in the table above
3. Record each violation with file path, line number, WCAG criterion, and severity

**Severity mapping:**

| Severity | Examples                                                              |
| -------- | --------------------------------------------------------------------- |
| Critical | Missing alt text on informative image, form input with no label       |
| Serious  | Interactive element with no accessible name, missing `lang` attribute |
| Moderate | Skipped heading level, `onClick` without keyboard handler             |
| Minor    | Redundant ARIA role, `tabIndex="0"` on naturally focusable element    |

### Step 3: Run Automated Tools

Detect installed tools via `npx axe --version`, `npx pa11y --version`, `npx lighthouse --version` etc.
For each available tool, run against the target URL or build output.
Parse JSON output and merge with static findings (deduplicate by element + criterion).

### Step 4: Generate Report

Output a summary then grouped violation list:

```
Accessibility Audit: <target>
WCAG Standard: 2.1 AA
───────────────────────────────
Critical:   N  (must fix before release)
Serious:    N  (fix soon)
Moderate:   N  (fix in backlog)
Minor:      N  (nice to have)
───────────────────────────────

[CRITICAL] src/components/Avatar.tsx:12
  Issue: <img> missing alt attribute
  WCAG:  1.1.1 Non-text Content
  Fix:   Add alt="" for decorative or alt="<description>" for informative image

[SERIOUS] src/pages/LoginForm.tsx:34
  Issue: <input type="email"> has no associated label
  WCAG:  1.3.1 Info and Relationships, 4.1.2 Name, Role, Value
  Fix:   Add <label htmlFor="email">...</label> or aria-label attribute

[MODERATE] src/components/Sidebar.tsx:88
  Issue: onClick handler on <div> with no keyboard equivalent
  WCAG:  2.1.1 Keyboard
  Fix:   Use <button> element or add onKeyDown={handleKey} and role="button" tabIndex={0}
```

### Step 5: Prioritize Fixes

If Critical or Serious violations exist, list the top 5 highest-impact fixes with code snippets.
Provide a summary of effort: which violations are one-line fixes vs. require design changes.

## Options

| Option       | Values                                | Default  |
| ------------ | ------------------------------------- | -------- |
| `--standard` | wcag2a, wcag2aa, wcag21aa, wcag22aa   | wcag21aa |
| `--target`   | path/glob or URL                      | `src/`   |
| `--severity` | critical, serious, moderate, all      | all      |
| `--fix`      | Attempt to auto-fix simple violations | false    |

## Auto-Fix Candidates

When `--fix` is passed, safely apply:

- Add `alt=""` to clearly decorative images (svg icons, spacers)
- Add `lang="en"` to `<html>` if missing
- Replace `role="button"` on `<div onClick>` with `<button type="button">` (explicit `type="button"` prevents unintended form submissions in form contexts)

Never auto-fix color contrast or heading hierarchy — these require design judgment.

## Examples

```
"Check accessibility in src/components"
"Audit a11y compliance for the checkout page"
"Find WCAG violations in LoginForm.tsx"
"Is the dashboard accessible to screen readers?"
"Run an accessibility audit before we ship"
```
