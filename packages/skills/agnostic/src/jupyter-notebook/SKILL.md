---
name: jupyter-notebook
description: Work with Jupyter notebooks, understanding code cells, markdown documentation, and outputs for data science and analysis workflows
---

## Purpose

This skill enables Claude to effectively work with Jupyter notebooks (.ipynb files). When a user needs to understand, analyze, or modify notebooks containing code, documentation, and outputs, this skill provides the guidance and approach for handling these interactive documents.

## When to Use

Use this skill when the user:

- Asks you to read or analyze a Jupyter notebook
- Wants to understand the code and its outputs
- Needs to modify or add cells to a notebook
- Wants to understand data analysis workflows
- Asks about visualizations or plots in the notebook
- Needs help debugging notebook code

## Approach

### Reading Notebooks

Claude Code can read Jupyter notebooks directly. The content includes:

- All cells (code and markdown)
- Cell outputs (text, tables, visualizations)
- Cell execution order
- Metadata and kernel information

**Steps:**

1. Use the Read tool with the .ipynb file path
2. Review the notebook structure and flow
3. Understand the narrative from markdown cells
4. Analyze code cells and their outputs
5. Note any visualizations or data transformations

### Understanding Notebook Flow

When analyzing a notebook:

1. Start with any title or introduction cells
2. Follow the logical flow of code execution
3. Understand data loading and preprocessing
4. Identify key analysis or modeling steps
5. Review conclusions and visualizations

### Modifying Notebooks

When editing notebooks:

1. Use the NotebookEdit tool for cell modifications
2. Specify the cell by its index (0-based)
3. Provide the new cell content
4. Choose the appropriate cell type (code or markdown)

## Best Practices

- Understand the overall narrative before diving into specific cells
- Note dependencies between cells (variables, imports)
- Pay attention to execution order (may differ from cell order)
- Consider the kernel/runtime environment
- Be aware that outputs may be stale (not matching current code)
- Reference cells by their position or content when discussing

## Example Interactions

**User:** "Explain what this data analysis notebook does"

**Approach:**

1. Read the entire notebook
2. Summarize the high-level workflow
3. Explain key data transformations
4. Describe the analysis methodology
5. Present findings and visualizations

**User:** "Fix the error in cell 5"

**Approach:**

1. Read the notebook to understand context
2. Examine cell 5 and its error output
3. Check dependencies from previous cells
4. Identify the issue and solution
5. Use NotebookEdit to fix the cell

**User:** "Add a visualization for the results"

**Approach:**

1. Understand the data and results to visualize
2. Determine appropriate visualization type
3. Write the plotting code
4. Insert a new code cell at the right position
5. Explain the visualization choice
