---
description: Generate Excalidraw architecture diagrams from codebase analysis. Use when user says "create an architecture diagram", "visualize the system design", "generate an excalidraw diagram", "draw the component structure", "create a visual representation of the codebase", or "diagram the data flow".
allowed-tools: Bash(git ls-files:*), Bash(find:*), Glob, Grep, Read, Write
model: opus
---

# Excalidraw Diagram Generator

Generate valid `.excalidraw` JSON files representing system architecture from codebase analysis.

## When to Activate

- User asks to create an architecture diagram
- User wants to visualize system design
- User asks for a flowchart or data flow diagram
- User wants to document system structure visually
- User mentions Excalidraw or diagram generation

## Quick Start

Works without existing diagrams, Terraform, or specific file types. Analyzes any codebase structure.

## Critical Implementation Rules

**Four non-negotiable constraints:**

1. **No Diamond Shapes**: Diamond arrow connections are broken in raw Excalidraw JSON. Use styled rectangles instead:

   - Orchestrators: coral background with thick stroke
   - Decision points: orange background with dashed stroke

2. **Label Architecture**: The `label` property does NOT work in raw JSON. Every labeled element requires:

   - A shape with `boundElements` referencing the text element
   - A separate text element with `containerId` pointing to the shape

3. **Arrow Formatting**: Multi-point arrows need:

   - `"elbowed": true`
   - `"roundness": null`
   - `"roughness": 0`

4. **Edge Positioning**: Arrows must start/end at shape edges, not centers:
   - Top: `(x + width/2, y)`
   - Bottom: `(x + width/2, y + height)`
   - Left: `(x, y + height/2)`
   - Right: `(x + width, y + height/2)`

## Generation Workflow

1. **Analyze codebase structure** - Identify components, services, and relationships
2. **Plan layout grid** - Determine rows, columns, and spacing
3. **Generate shape elements** - Create rectangles, ellipses, text labels
4. **Add connection arrows** - Connect components with proper edge positioning
5. **Apply grouping** - Group related elements (namespaces, services, etc.)
6. **Validate and write output** - Check all constraints before writing file

## Input Parsing

Extract from user's request:

- `scope`: What part of codebase to diagram (full, specific module, etc.)
- `type`: Type of diagram (architecture, data flow, deployment, etc.)
- `depth`: Level of detail (high-level overview vs detailed)
- `output`: Output file path (defaults to `./architecture.excalidraw`)

## Output Format

Generate a valid `.excalidraw` JSON file with:

- Proper file structure (type, version, elements, appState)
- All shapes with unique IDs
- Proper text bindings for labels
- Correct arrow connections at shape edges
- Logical groupings with dashed rectangles

## Validation Checklist

Before writing output, verify:

- [ ] No duplicate element IDs
- [ ] All labels have proper shape-text bindings
- [ ] No diamond shapes used
- [ ] All arrows positioned at shape edges
- [ ] JSON is valid and properly formatted

## Reference Documentation

For detailed implementation guidance, see:

- [JSON Format Reference](references/json-format.md) - Complete element structure
- [Arrow Routing Guide](references/arrows.md) - Arrow positioning and patterns
- [Color Palettes](references/colors.md) - Component type color schemes
- [Examples](references/examples.md) - Layout patterns and templates
- [Validation Rules](references/validation.md) - Pre-output verification
