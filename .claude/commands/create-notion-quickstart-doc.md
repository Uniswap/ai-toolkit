---
description: Create a new Quick Start documentation page in the Dev AI Tools Notion database
argument-hint: <tool-name> (the name of the tool/feature to document)
---

# `/create-notion-quickstart-doc` - Create Quick Start Documentation

## Purpose

Create standardized quick start documentation for AI Toolkit tools in the [Dev AI Tools → Quickstart Docs](https://www.notion.so/249c52b2548b80a2bcb6d64a65c9c4f2) Notion database. This command ensures consistent documentation structure across all tools, making it easy for engineers to quickly understand and adopt new tools.

## Target Audience

All documentation created by this command is intended for **engineers at the company**. The goal is to:

- Quickly make them aware of a new or updated tool
- Help them understand why it should matter to them
- Help them quickly get up and running to incorporate it into their day-to-day workflow

More technical and comprehensive documentation should be maintained in this repository and linked from the Notion quick start doc.

## Notion Database Details

- **Database Name:** Dev AI Tools → Quickstart Docs
- **Data Source ID:** `249c52b2-548b-8034-a804-000bbb3e5f0b`
- **Available Categories:** API Documentation, User Guide, Tutorial, Reference, Getting Started, Troubleshooting, Best Practices, Git
- **Available Tags:** JavaScript, Frontend, Backend, Mobile, AI, Claude Code, Infra

## Implementation

### Step 1: Gather Tool Information

Before creating the documentation, gather the following information. If the user provided a tool name as an argument, use that. Otherwise, ask for:

1. **Tool Name** - The name of the tool/feature being documented
2. **Tool Description** - Brief description of what the tool does (1-2 sentences)
3. **Why It Matters** - Why should engineers care about this tool?
4. **Categories** - Select from: Tutorial, Getting Started, Best Practices, User Guide, API Documentation, Reference, Troubleshooting, Git
5. **Tags** - Select from: AI, Claude Code, Infra, JavaScript, Frontend, Backend, Mobile
6. **Is Standalone?** - Can this tool be used independently, or does it require other AI Toolkit components?
7. **Prerequisites** - If not standalone, what other tools/docs are prerequisites? (Search the Notion database to find existing docs to link)
8. **GitHub Repo Path** - Path to the tool's README or source in the ai-toolkit repository (e.g., `packages/mcp-config/README.md`)

### Step 2: Search for Prerequisites (if applicable)

If the tool has prerequisites, search the Notion database to find existing documentation to link:

```typescript
// Use the Notion MCP to search for prerequisite docs
const prerequisiteDocs = await searchNotion({
  query: 'prerequisite tool name',
  data_source_url: 'collection://249c52b2-548b-8034-a804-000bbb3e5f0b',
});
```

### Step 3: Research the Tool

Before writing documentation, thoroughly research the tool:

1. **Read the source code** in the repository to understand:

   - What the tool does
   - How it's configured/used
   - Any CLI commands or API interfaces
   - Dependencies and requirements

2. **Read any existing README** files for the tool

3. **Check for example implementations** in the codebase

### Step 4: Generate Documentation Content

Create the documentation following this standard template structure:

```markdown
## TLDR

[1-2 sentence summary of what the tool does and the key benefit]

**Why it matters:** [Brief explanation of why engineers should care]

**Quick setup:** [Brief 1-3 step summary to get started]

---

## Overview

### What This [Tool Name] Does

- [emoji] **Feature 1** - Description
- [emoji] **Feature 2** - Description
- [emoji] **Feature 3** - Description

### How It Works

[Flow diagram or brief explanation of the workflow]

---

## Prerequisites

> **Note:** Complete these prerequisites in order before proceeding.

1. **[Prerequisite 1]** - [Brief description]

   - [Link to prerequisite doc in Notion database]

2. **[Prerequisite 2]** - [Brief description]
   - [Link to prerequisite doc in Notion database]

---

## Setup

### Step 1: [First Setup Step]

[Detailed instructions with code blocks]

### Step 2: [Second Setup Step]

[Detailed instructions with code blocks]

---

## Examples

### Basic Usage (Recommended)

[Code block with basic example]

### Advanced Configuration

[Code block with advanced options]

---

## Reference

### Inputs/Parameters

| Input    | Type   | Required | Default | Description |
| -------- | ------ | -------- | ------- | ----------- |
| `param1` | string | Yes      | -       | Description |
| `param2` | number | No       | `10`    | Description |

### Key Features

- Feature list with checkmarks

---

## Troubleshooting

### [Common Issue 1]

**Cause:** [Why this happens]
**Solution:** [How to fix it]

---

## Links

- [Source code](https://github.com/Uniswap/ai-toolkit/blob/main/path/to/source)
- [Full documentation](https://github.com/Uniswap/ai-toolkit/blob/main/path/to/README.md)
- [Example implementation](https://github.com/Uniswap/ai-toolkit/blob/main/path/to/example)

**Need help?** Open an issue at [GitHub Issues](https://github.com/Uniswap/ai-toolkit/issues)
```

### Step 5: Create the Notion Page

Use the Notion MCP to create the page in the database:

```typescript
// Create the page using the Notion MCP create-pages tool
await notionCreatePages({
  parent: {
    data_source_id: '249c52b2-548b-8034-a804-000bbb3e5f0b',
  },
  pages: [
    {
      properties: {
        Title: toolName,
        Status: 'Draft',
        Category: selectedCategories, // JSON array like ["Tutorial", "Getting Started"]
        Tags: selectedTags, // JSON array like ["AI", "Claude Code"]
        'userDefined:URL': githubUrl || '',
      },
      content: generatedMarkdownContent,
    },
  ],
});
```

### Step 6: Report Results

After creating the page:

1. Display the URL of the newly created Notion page
2. Remind the user to:
   - Review and edit the draft in Notion
   - Add any screenshots or images
   - Update the Status to "In Review" when ready
   - Get approval before changing to "Published"

## Template Customization Guidelines

### For Standalone Tools

- Omit the "Prerequisites" section entirely
- Focus on quick setup and immediate value

### For Tools with Prerequisites

- Always include the "Prerequisites" section
- List prerequisites in chronological order (what must be done first)
- Include links to existing Notion docs for each prerequisite
- If a prerequisite doc doesn't exist, note that it needs to be created

### For GitHub Actions Workflows

- Include the workflow YAML in a code block
- List all required secrets with instructions on where to get them
- Provide example workflow configurations

### For CLI Tools

- Include installation commands (npm/npx)
- Show interactive and non-interactive usage examples
- Document all flags and options in a reference table

### For Configuration/Setup Guides

- Focus on step-by-step instructions
- Use callout blocks for important notes
- Include "Why X Matters" sections to explain the purpose

## Icon

All pages in this database should use the custom emoji icon for the Dev AI Pod:
`notion://custom_emoji/c1425110-7cb9-496c-a16a-1483eb671453/247c52b2-548b-808b-9e8d-007a0af11c4b`

## Quality Checklist

Before finalizing the documentation, ensure:

- [ ] TLDR section is concise and actionable
- [ ] "Why it matters" explains the value proposition clearly
- [ ] All code blocks are properly formatted
- [ ] Prerequisites are listed in chronological order with links
- [ ] Examples are copy-pasteable and work out of the box
- [ ] Links to full documentation in the repository are included
- [ ] Slack channel link is present for support
- [ ] Status is set to "Draft"

## Example Invocations

```bash
# Create documentation for a new tool
/create-notion-quickstart-doc claude-mcp-helper

# Create documentation interactively (no argument)
/create-notion-quickstart-doc
```

---

**Last updated:** 2025-12-02
