---
description: Generate Excalidraw architecture diagrams from codebase analysis. Use when user says "create an architecture diagram", "visualize the system design", "generate an excalidraw diagram", "draw the component structure", "create a visual representation of the codebase", or "diagram the data flow".
allowed-tools: Bash(git ls-files:*), Bash(find:*), Glob, Grep, Read, Write
model: opus
---

# Excalidraw Diagram Generator

Generate valid `.excalidraw` JSON files representing system architecture from codebase analysis.

## Quick Start

Works without existing diagrams, Terraform, or specific file types. Analyzes any codebase structure. If the codebase has more than ~30 distinct components, limit scope to top-level packages or services only to keep the diagram readable.

## Implementation Constraints

These are the constraints for this skill, stated once. Apply them while generating; they are
not repeated as a checklist afterward.

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

5. **Unique element IDs**, and every label needs both halves of the binding in rule 2.

The output is a JSON file, so the one check worth doing is the one you cannot do from memory:
confirm the written file parses. Everything else above is a generation-time constraint, not a
post-hoc review item.

## Generation Workflow

1. **Analyze codebase structure** - Identify components, services, and relationships
2. **Plan layout grid** - Determine rows, columns, and spacing
3. **Generate shape elements** - Create rectangles, ellipses, text labels; derive element IDs from component names (e.g., `api-server`, `api-server-text`) and verify all IDs are unique
4. **Add connection arrows** - Connect components with proper edge positioning
5. **Apply grouping** - Group related elements (namespaces, services, etc.)
6. **Write the output file** - then confirm it parses as JSON

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

## Reference Documentation

For detailed implementation guidance, see:

- [JSON Format Reference](references/json-format.md) - Complete element structure
- [Arrow Routing Guide](references/arrows.md) - Arrow positioning and patterns
- [Color Palettes](references/colors.md) - Component type color schemes
- [Examples](references/examples.md) - Layout patterns and templates
- [Validation Rules](references/validation.md) - Debugging a diagram that renders wrong
