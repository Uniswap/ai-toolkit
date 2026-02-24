---
description: Generate a professional PDF report from structured findings. Use when the user says "make a PDF", "generate a report", "create a PDF report", "export findings to PDF", or wants to save analysis results as a document.
allowed-tools: Read, Write, Bash(python3:*), Glob, Grep
---

# PDF Report Generator

Generate a professional, well-formatted PDF report from structured findings or analysis results.

## When to Activate

- User asks to create a PDF or report
- User wants to export findings to a document
- After completing security reviews, code reviews, or research
- User says "make a PDF", "generate a report", "export findings"

## Prerequisites

Requires `fpdf2` (>= 2.7.9) Python package. If not installed, run:

```bash
pip3 install --user --break-system-packages fpdf2
```

## Quick Process

1. **Collect Content**: Gather findings from the current conversation or files the user points to
2. **Structure Report**: Determine title, sections, severity levels, and layout
3. **Generate PDF**: Write a Python script to `/tmp/` and execute it
4. **Clean Up**: Remove the temporary script after success
5. **Report Path**: Tell the user the output path and suggest `open <path>`

## Choosing an Approach

fpdf2 offers three ways to render content. Pick the right one:

| Approach                                       | When to Use                                                               | Speed   |
| ---------------------------------------------- | ------------------------------------------------------------------------- | ------- |
| Direct methods (`multi_cell`, `cell`, `table`) | Structured reports with known layout (findings, tables, badges)           | Fastest |
| `markdown=True` on `multi_cell`/`cell`         | Inline **bold**/**italic**/**underline** within body text                 | Fast    |
| `write_html()`                                 | Complex mixed content, nested lists, or converting existing markdown/HTML | Slower  |

For most reports, use **direct methods** for structure + **markdown=True** for inline formatting within body text. Fall back to `write_html()` only when you need nested lists or complex HTML tables.

## Report Structure

Determine the report structure from the content:

- **Title** and subtitle
- **Date** (default: today)
- **Scope** description (one line)
- **Summary table** (severity counts, category counts, or similar)
- **Sections** grouped by category (e.g., by severity, by topic, by component)
- **Individual findings/items** with: ID, severity/priority badge, title, file references, description, and recommendation/mitigation

## PDF Generation Template

Write a Python script following this structure. Adapt the content sections to match whatever is being reported. Do NOT copy this template verbatim -- reshape it to fit the actual content.

```python
#!/usr/bin/env python3
"""Generate PDF report."""
from fpdf import FPDF
from fpdf.fonts import FontFace
from datetime import date


class Report(FPDF):
    ACCENT = (200, 60, 60)

    def header(self):
        if self.page_no() > 1:
            self.set_font("Helvetica", "I", 8)
            self.set_text_color(120, 120, 120)
            self.cell(0, 8, "REPORT_TITLE_HERE", align="L")
            self.cell(0, 8, f"Page {self.page_no()}", align="R",
                      new_x="LMARGIN", new_y="NEXT")
            self.line(10, self.get_y(), 200, self.get_y())
            self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"Confidential - {date.today().isoformat()}",
                  align="C")

    # --- Layout helpers ---

    def title_page(self, title, subtitle, scope):
        self.ln(30)
        self.set_font("Helvetica", "B", 26)
        self.set_text_color(30, 30, 30)
        self.cell(0, 12, title, align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 16)
        self.set_text_color(80, 80, 80)
        self.cell(0, 10, subtitle, align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(12)
        self.set_draw_color(*self.ACCENT)
        self.set_line_width(0.8)
        self.line(60, self.get_y(), 150, self.get_y())
        self.ln(12)
        self.set_font("Helvetica", "", 11)
        self.cell(0, 7, f"Date: {date.today().isoformat()}", align="C",
                  new_x="LMARGIN", new_y="NEXT")
        self.cell(0, 7, f"Scope: {scope}", align="C",
                  new_x="LMARGIN", new_y="NEXT")

    def section_title(self, title, level=1):
        sizes = {1: 16, 2: 13, 3: 11}
        self.set_font("Helvetica", "B", sizes.get(level, 11))
        self.set_text_color(20, 20, 20)
        self.ln(6 if level == 1 else 3)
        self.multi_cell(0, 7, title, new_x="LMARGIN", new_y="NEXT")
        if level == 1:
            self.set_draw_color(*self.ACCENT)
            self.set_line_width(0.5)
            self.line(10, self.get_y(), 200, self.get_y())
            self.ln(4)
        else:
            self.ln(2)

    def body_text(self, text):
        """Body text with optional inline markdown: **bold**, __italic__,
        --underline--."""
        self.set_font("Helvetica", "", 9.5)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 5, text, markdown=True,
                        new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def bold_text(self, text):
        self.set_font("Helvetica", "B", 9.5)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 5, text, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def code_block(self, text):
        self.set_fill_color(245, 245, 245)
        self.set_font("Courier", "", 8)
        self.set_text_color(50, 50, 50)
        self.set_x(self.get_x() + 4)
        self.multi_cell(180, 4.5, text, fill=True,
                        new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def file_ref(self, path):
        self.set_font("Courier", "", 8)
        self.set_text_color(80, 80, 80)
        self.cell(0, 4.5, path, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    # --- Badges ---

    BADGE_COLORS = {
        "CRITICAL": (160, 30, 30),
        "HIGH": (200, 50, 50),
        "MEDIUM": (220, 140, 20),
        "LOW": (80, 140, 200),
        "INFO": (100, 100, 100),
    }

    def severity_badge(self, severity):
        r, g, b = self.BADGE_COLORS.get(severity.upper(), (100, 100, 100))
        self.set_font("Helvetica", "B", 9)
        self.set_fill_color(r, g, b)
        self.set_text_color(255, 255, 255)
        w = self.get_string_width(f" {severity} ") + 6
        self.cell(w, 6, f" {severity} ", fill=True, new_x="END")
        self.set_text_color(40, 40, 40)
        self.cell(3, 6, " ")

    def finding_header(self, id_str, severity, title):
        self.ln(3)
        self.severity_badge(severity)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(40, 40, 40)
        self.cell(0, 6, f"{id_str}: {title}", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def mitigation(self, text):
        self.set_font("Helvetica", "B", 9.5)
        self.set_text_color(30, 120, 70)
        self.cell(0, 5, "Recommended Mitigation:", new_x="LMARGIN",
                  new_y="NEXT")
        self.set_font("Helvetica", "", 9.5)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 5, text, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    # --- Tables ---

    def summary_table(self, headers, rows):
        """Quick summary table.

        rows: list of (label, value, (r,g,b)) tuples.
        """
        col_w = [50, 30]
        self.set_font("Helvetica", "B", 10)
        self.set_fill_color(60, 60, 60)
        self.set_text_color(255, 255, 255)
        for i, h in enumerate(headers):
            self.cell(col_w[i], 7, h, border=1, fill=True, align="C")
        self.ln()
        self.set_font("Helvetica", "", 10)
        for label, value, color in rows:
            self.set_fill_color(*color)
            self.set_text_color(40, 40, 40)
            self.cell(col_w[0], 7, label, border=1, fill=True, align="C")
            self.cell(col_w[1], 7, str(value), border=1, fill=True, align="C")
            self.ln()
        self.ln(4)

    def data_table(self, headers, rows, col_widths=None):
        """Render a multi-column data table using fpdf2's table() API.

        headers:    list of column header strings
        rows:       list of row tuples/lists (same length as headers)
        col_widths: optional tuple of column widths (in mm); auto if None

        Uses alternating row shading and styled headers automatically.
        """
        heading_style = FontFace(
            emphasis="BOLD", color=(255, 255, 255),
            fill_color=(60, 60, 60),
        )
        self.set_font("Helvetica", "", 9)
        self.set_text_color(40, 40, 40)
        with self.table(
            headings_style=heading_style,
            cell_fill_color=(245, 245, 245),
            cell_fill_mode="ROWS",
            col_widths=col_widths,
            line_height=5.5,
            text_align="LEFT",
            borders_layout="SINGLE_TOP_LINE",
            first_row_as_headings=True,
        ) as table:
            # Header row
            hdr = table.row()
            for h in headers:
                hdr.cell(h)
            # Data rows
            for r in rows:
                row = table.row()
                for val in r:
                    row.cell(str(val))
        self.ln(4)


# --- Build the report ---
pdf = Report()
pdf.set_auto_page_break(auto=True, margin=20)
pdf.add_page()

# ADAPT EVERYTHING BELOW TO FIT THE ACTUAL CONTENT
pdf.title_page("Report Title", "Subtitle", "Scope description")

pdf.add_page()
pdf.section_title("Summary")
pdf.summary_table(
    ["Category", "Count"],
    [
        ("Example", "3", (230, 240, 255)),
    ],
)

pdf.section_title("Findings")
pdf.finding_header("F-1", "HIGH", "Example finding title")
pdf.file_ref("path/to/file.py:42")
pdf.body_text("Description with **inline bold** and __italic__ support.")
pdf.mitigation("How to fix it.")

output_path = "/path/to/output.pdf"
pdf.output(output_path)
print(f"PDF written to {output_path}")
```

## Output Path Convention

Default to `~/dev/<descriptive-name>.pdf`. Use a name derived from the report content, e.g.:

- `~/dev/uniswap-ai-security-review.pdf`
- `~/dev/api-code-review-2026-02-24.pdf`
- `~/dev/migration-risk-assessment.pdf`

## Key Guidelines

- **Adapt the template** to fit the content -- do not force content into a security-findings shape if it is a different kind of report
- **Use markdown=True** in body_text() for inline **bold**/**italic** formatting instead of switching fonts manually
- **Use data_table()** for any multi-column data -- it auto-handles alternating row shading, styled headers, and page-break row repetition
- **Use write_html()** only when you need nested lists, mixed inline formatting, or are converting existing HTML/markdown content
- **Watch for page breaks** -- fpdf2 handles auto page breaks, but long code blocks or tables may need manual `pdf.add_page()` calls
- **Special characters** -- fpdf2 default fonts (Helvetica, Courier) use latin-1 encoding; avoid unicode smart quotes, em dashes, emoji; use ASCII equivalents
- **Temp script location** -- always write the generator script to `/tmp/pdf_report_XXXX.py` and delete it after PDF generation succeeds
- **Never include sensitive data** (API keys, passwords, private keys) in the PDF content

## Examples

```text
"Generate a PDF report from the security findings"
"Make a PDF of the code review results"
"Export this research summary to PDF"
"Create a report document from the analysis"
```
