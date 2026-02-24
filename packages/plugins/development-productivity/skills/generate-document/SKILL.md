---
description: Generate professional documents in multiple formats (PDF, DOCX, HTML, ODT, EPUB, RTF). Use when the user says "make a PDF", "generate a report", "create a document", "export to Word", "make a Word doc", "convert to PDF", "export findings", "create documentation", or wants to save analysis results as a formatted document.
allowed-tools: Read, Write, Bash(pandoc:*), Bash(which:*), Bash(rm:/tmp/document_*:*), Bash(mkdir:*), Bash(open:*), Bash(xdg-open:*), Glob, Grep
---

# Document Generator

Generate professional documents in multiple formats from markdown content using pandoc.

## Supported Output Formats

| Format       | Extension | Use Case                           |
| ------------ | --------- | ---------------------------------- |
| PDF          | `.pdf`    | Final reports, printable documents |
| Word         | `.docx`   | Editable documents, collaboration  |
| HTML         | `.html`   | Web viewing, email attachments     |
| OpenDocument | `.odt`    | LibreOffice compatibility          |
| EPUB         | `.epub`   | E-book readers                     |
| RTF          | `.rtf`    | Legacy compatibility               |
| Plain Text   | `.txt`    | Maximum compatibility              |

## Prerequisites

Requires [pandoc](https://pandoc.org/) to be installed:

**macOS:**

```bash
brew install pandoc
```

**Ubuntu/Debian:**

```bash
sudo apt-get install pandoc
```

**For PDF output**, also install a LaTeX distribution:

**macOS:**

```bash
brew install --cask basictex
```

**Ubuntu/Debian:**

```bash
sudo apt-get install texlive-xetex
```

## Instructions

1. **Check pandoc availability**: Verify pandoc is installed by running `which pandoc`. If not found, inform the user of installation requirements.

2. **Collect content**: Gather the content to include from the conversation (security findings, code reviews, research summaries, meeting notes, etc.) or from files the user points to.

3. **Determine format**: Ask the user which format they want, or infer from context:

   - "PDF" or "report" -> PDF
   - "Word" or "doc" or "docx" -> DOCX
   - "HTML" or "web" -> HTML
   - Default to PDF if unspecified

4. **Structure the document**: Organize content into well-formatted markdown:

   - Title and metadata (YAML frontmatter)
   - Executive summary or abstract
   - Main sections with clear headings
   - Tables, lists, and code blocks as needed
   - References or appendices

5. **Write markdown to temp file**: Save content to `/tmp/document_<timestamp>.md`

6. **Convert with pandoc**: Run the appropriate pandoc command for the target format

7. **Clean up**: Delete the temporary markdown file after successful conversion

8. **Report output**: Tell the user the output path and suggest how to open it

## Pandoc Commands by Format

### PDF (via LaTeX)

```bash
pandoc /tmp/document.md -o ./report.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=1in \
  -V fontsize=11pt \
  --toc \
  --highlight-style=tango
```

### PDF (via wkhtmltopdf - fallback if no LaTeX)

```bash
pandoc /tmp/document.md -o ./report.pdf \
  --pdf-engine=wkhtmltopdf \
  --css=/tmp/style.css
```

### Word (DOCX)

```bash
pandoc /tmp/document.md -o ./report.docx \
  --toc \
  --highlight-style=tango
```

### HTML (standalone)

```bash
pandoc /tmp/document.md -o ./report.html \
  --standalone \
  --toc \
  --highlight-style=tango \
  --metadata title="Report Title"
```

### OpenDocument (ODT)

```bash
pandoc /tmp/document.md -o ./report.odt \
  --toc
```

### EPUB

```bash
pandoc /tmp/document.md -o ./report.epub \
  --toc \
  --epub-chapter-level=2
```

### RTF

```bash
pandoc /tmp/document.md -o ./report.rtf
```

### Plain Text

```bash
pandoc /tmp/document.md -o ./report.txt \
  --wrap=auto
```

## Markdown Document Template

Structure the markdown content following this template. Adapt sections based on the content type.

````markdown
---
title: 'Document Title'
subtitle: 'Optional Subtitle'
author: 'Author Name'
date: '2024-01-15'
abstract: |
  Brief summary of the document contents.
  Can span multiple lines.
---

# Executive Summary

High-level overview of findings or content.

# Section 1: Category Name

## Subsection 1.1

Content with **bold**, _italic_, and `inline code`.

### Finding ID-001: Finding Title

**Severity:** Critical | High | Medium | Low | Info

**Location:** `path/to/file.ts:42`

**Description:**
Detailed description of the finding or item.

**Recommendation:**
Actionable steps to address the finding.

---

## Subsection 1.2

More content here.

# Section 2: Data Tables

| Column A | Column B | Column C |
| -------- | -------- | -------- |
| Value 1  | Value 2  | Value 3  |
| Value 4  | Value 5  | Value 6  |

# Section 3: Code Examples

```typescript
function example(): void {
  console.log('Code block with syntax highlighting');
}
```
````

# Appendix A: References

1. Reference One - <https://example.com>
2. Reference Two - <https://example.com>

````

## Content Type Templates

### Security Report

```markdown
---
title: "Security Assessment Report"
subtitle: "Target Application Name"
date: "YYYY-MM-DD"
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
````

<!-- markdownlint-disable MD001 -->

### Code Review Report

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

### Research Summary

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

## Output Path Convention

Default output location: `./<descriptive-name>.<ext>` (current working directory)

If the user specifies a custom output directory, ensure it exists first by running `mkdir -p <directory>` before invoking pandoc.

Use descriptive names derived from content:

- `security-review-myapp-2024-01-15.pdf`
- `code-review-pr-123.docx`
- `research-caching-strategies.html`

## Key Guidelines

- **Format Selection:** Default to PDF for reports; use DOCX for documents requiring edits
- **Unicode Support:** Pandoc handles unicode natively - no restrictions on special characters
- **Tables:** Use markdown tables; pandoc renders them appropriately per format
- **Code Blocks:** Use fenced code blocks with language identifiers for syntax highlighting
- **Images:** Can embed images using `![alt](path)` syntax if needed
- **Cross-References:** Use heading anchors for internal links: `[link text](#heading-id)`
- **Page Breaks:** Insert `\newpage` for PDF or use horizontal rules `---` as section breaks
- **Temp Files:** Always clean up `/tmp/document_*.md` files after conversion
- **Sensitive Data:** Never include API keys, passwords, or credentials in documents
- **Error Handling:** If pandoc fails, check for missing dependencies and inform the user

## Troubleshooting

### PDF generation fails

1. Check if LaTeX is installed: `which xelatex`
2. Try alternative PDF engine: `--pdf-engine=wkhtmltopdf`
3. Install missing LaTeX packages if prompted

### Fonts not rendering correctly

- For XeLaTeX: Use `--variable mainfont="Font Name"` to specify fonts
- Ensure the font is installed on the system

### Tables look wrong

- Ensure consistent column separators in markdown
- Use `--columns=80` to control text wrapping
