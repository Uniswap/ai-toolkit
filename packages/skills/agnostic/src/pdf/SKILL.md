---
name: pdf
description: Read and analyze PDF documents, extracting text content, structure, and metadata for comprehensive document understanding
---

## Purpose

This skill enables Claude to effectively read and analyze PDF documents. When a user asks about PDF content, wants to extract information from PDFs, or needs to understand document structure, this skill provides the guidance and approach for handling PDF files.

## When to Use

Use this skill when the user:

- Asks you to read or analyze a PDF file
- Wants to extract specific information from a PDF document
- Needs to understand the structure or contents of a PDF
- Wants to compare multiple PDF documents
- Asks about metadata or properties of a PDF file

## Approach

### Reading PDF Files

Claude Code can read PDF files directly using the Read tool. The PDF content is processed page by page, extracting both text and visual content for analysis.

**Steps:**

1. Use the Read tool with the PDF file path
2. The content will include extracted text from each page
3. Visual elements (charts, images, diagrams) are also analyzed
4. Page numbers and structure are preserved

### Extracting Information

When extracting specific information:

1. First, read the entire PDF to understand its structure
2. Identify relevant sections based on headings and content
3. Extract the requested information with page references
4. Summarize findings with citations to specific pages

### Handling Large PDFs

For large documents:

1. Start by reading the table of contents or first few pages to understand structure
2. Use targeted reading of specific page ranges if supported
3. Build a mental map of the document organization
4. Focus on relevant sections based on user's query

## Best Practices

- Always cite page numbers when referencing content
- Preserve formatting and structure when quoting text
- Note any visual elements that might contain relevant information
- Handle multi-column layouts by reading in logical order
- Be aware that scanned PDFs may have OCR limitations

## Example Interactions

**User:** "Read the quarterly report.pdf and summarize the financial highlights"

**Approach:**

1. Read the PDF file
2. Locate financial sections (usually income statement, balance sheet)
3. Extract key metrics and figures
4. Summarize with specific page references

**User:** "What are the main conclusions in chapter 3 of thesis.pdf?"

**Approach:**

1. Read the PDF to locate chapter 3
2. Identify conclusion sections within that chapter
3. Extract and synthesize the main points
4. Provide page references for key findings
