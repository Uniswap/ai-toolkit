---
name: xlsx
description: Work with Excel spreadsheet files, analyzing data, understanding formulas, and extracting structured information from worksheets
---

## Purpose

This skill enables Claude to effectively work with Excel spreadsheet files (.xlsx, .xls). When a user needs to analyze spreadsheet data, understand formulas, or extract structured information from Excel files, this skill provides the guidance and approach for handling these documents.

## When to Use

Use this skill when the user:

- Asks you to read or analyze an Excel spreadsheet
- Wants to understand data in worksheets
- Needs to extract specific values or ranges
- Wants to understand formulas or calculations
- Asks about data relationships across sheets
- Needs help with data analysis or visualization recommendations

## Approach

### Reading Excel Files

Excel files can be processed to extract:

- Cell values and data types
- Sheet names and structure
- Formulas and calculations
- Named ranges and references
- Basic formatting information

**Steps:**

1. Identify the file path and format (.xlsx or .xls)
2. Determine which sheets need to be analyzed
3. Extract relevant data ranges
4. Understand any formulas or calculated fields

### Data Analysis

When analyzing spreadsheet data:

1. First understand the overall structure (sheets, columns, rows)
2. Identify header rows and data types
3. Look for patterns, formulas, and relationships
4. Note any pivot tables or summarized data
5. Provide insights based on the data patterns

### Working with Formulas

When the user asks about calculations:

1. Identify cells containing formulas
2. Explain what the formulas calculate
3. Trace dependencies between cells
4. Suggest improvements or alternatives if asked

## Best Practices

- Always confirm which sheet(s) to analyze first
- Reference cell addresses (e.g., A1, B2:D10) when discussing data
- Explain formulas in plain language
- Note any data validation or conditional formatting
- Handle merged cells and complex layouts appropriately
- Be aware of potential data quality issues (empty cells, inconsistent formats)

## Example Interactions

**User:** "Analyze the sales data in quarterly-report.xlsx"

**Approach:**

1. Read the file to understand available sheets
2. Identify the sales data sheet
3. Analyze column headers and data structure
4. Calculate or summarize key metrics
5. Present findings with specific cell references

**User:** "Explain the formula in cell G15"

**Approach:**

1. Read the relevant sheet
2. Extract the formula from G15
3. Trace all cell references in the formula
4. Explain the calculation in plain language
5. Show what values contribute to the result

**User:** "Compare Sheet1 and Sheet2 data"

**Approach:**

1. Read both sheets
2. Identify common columns or keys
3. Compare corresponding values
4. Highlight differences or discrepancies
5. Summarize the comparison results
