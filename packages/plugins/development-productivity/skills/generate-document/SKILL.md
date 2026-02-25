---
name: generate-document
description: Generate professional documents in multiple formats (PDF, DOCX, HTML, ODT, EPUB, RTF). Use when the user says "make a PDF", "generate a report", "create a document", "export to Word", "make a Word doc", "convert to PDF", "export findings", "create documentation", or wants to save analysis results as a formatted document.
allowed-tools: Read, Write, Bash(pandoc:*), Bash(which:*), Bash(rm:/tmp/document_*:*), Bash(mkdir:*), Bash(open:*), Bash(xdg-open:*), Glob, Grep
---

# Document Generator

Generate professional documents in multiple formats from markdown content using pandoc.

## Prerequisites

Requires [pandoc](https://pandoc.org/). For PDF output, also requires a LaTeX distribution (e.g., `basictex` on macOS, `texlive-xetex` on Ubuntu/Debian).

## Instructions

1. **Check pandoc availability**: Run `which pandoc`. If not found, inform the user of installation requirements.

2. **Collect content**: Gather content from the conversation (security findings, code reviews, research summaries, meeting notes, etc.) or from files the user points to.

3. **Determine format**: Infer from context or ask the user:

   - "PDF" or "report" -> PDF
   - "Word" or "doc" or "docx" -> DOCX
   - "HTML" or "web" -> HTML
   - Default to PDF if unspecified

4. **Structure the document**: Organize content into well-formatted markdown with YAML frontmatter, sections, and appropriate formatting. See [references/templates.md](references/templates.md) for content-type-specific templates (security reports, code reviews, research summaries).

5. **Write markdown to temp file**: Save content to `/tmp/document_<timestamp>.md`

6. **Convert with pandoc**: Run the appropriate command from the format reference below.

7. **Clean up**: Delete the temporary markdown file after successful conversion.

8. **Report output**: Tell the user the output path and suggest how to open it.

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

Structure markdown content following this template. Adapt sections based on content type.

```markdown
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

# Section 2: Data Tables

| Column A | Column B | Column C |
| -------- | -------- | -------- |
| Value 1  | Value 2  | Value 3  |

# Appendix A: References

1. Reference One - <https://example.com>
```

For content-type-specific templates, see [references/templates.md](references/templates.md).

## Output Path Convention

Default output location: `./<descriptive-name>.<ext>` (current working directory).

If the user specifies a custom output directory, run `mkdir -p <directory>` before invoking pandoc.

Use descriptive names derived from content:

- `security-review-myapp-2024-01-15.pdf`
- `code-review-pr-123.docx`
- `research-caching-strategies.html`

## Key Guidelines

- **Format Selection:** Default to PDF for reports; use DOCX for documents requiring edits
- **Page Breaks:** Insert `\newpage` for PDF or use horizontal rules `---` as section breaks
- **Temp Files:** Always clean up `/tmp/document_*.md` files after conversion
- **Sensitive Data:** Never include API keys, passwords, or credentials in documents
- **Error Handling:** If pandoc fails, see [references/troubleshooting.md](references/troubleshooting.md)
