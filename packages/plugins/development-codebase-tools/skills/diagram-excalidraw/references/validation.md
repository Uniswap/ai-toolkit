# Validation Reference

Pre-output verification rules and debugging strategies.

## Pre-Flight Validation Algorithm

```javascript
function validateDiagram(elements) {
  const errors = [];

  // 1. Check unique IDs
  const ids = elements.map((e) => e.id);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicates.length > 0) {
    errors.push(`Duplicate IDs: ${duplicates.join(', ')}`);
  }

  // 2. Check shape-text bindings
  const shapes = elements.filter((e) => e.type !== 'text' && e.type !== 'arrow');
  const texts = elements.filter((e) => e.type === 'text' && e.containerId);

  for (const text of texts) {
    const shape = shapes.find((s) => s.id === text.containerId);
    if (!shape) {
      errors.push(`Text ${text.id} references missing shape ${text.containerId}`);
    } else if (!shape.boundElements?.some((b) => b.id === text.id)) {
      errors.push(`Shape ${shape.id} missing boundElement for text ${text.id}`);
    }
  }

  // 3. Check arrow connections
  const arrows = elements.filter((e) => e.type === 'arrow');
  for (const arrow of arrows) {
    if (arrow.startBinding) {
      const source = findShapeNear(elements, arrow.x, arrow.y);
      if (!source) {
        errors.push(`Arrow ${arrow.id} start not near any shape`);
      }
    }
    if (arrow.endBinding) {
      const endX = arrow.x + arrow.points[arrow.points.length - 1][0];
      const endY = arrow.y + arrow.points[arrow.points.length - 1][1];
      const target = findShapeNear(elements, endX, endY);
      if (!target) {
        errors.push(`Arrow ${arrow.id} end not near any shape`);
      }
    }
  }

  // 4. Check for prohibited diamonds
  const diamonds = elements.filter((e) => e.type === 'diamond');
  if (diamonds.length > 0) {
    errors.push(`Diamond shapes not allowed: ${diamonds.map((d) => d.id).join(', ')}`);
  }

  return errors;
}

function findShapeNear(elements, x, y, tolerance = 15) {
  return elements.find(
    (e) =>
      e.type !== 'text' &&
      e.type !== 'arrow' &&
      x >= e.x - tolerance &&
      x <= e.x + e.width + tolerance &&
      y >= e.y - tolerance &&
      y <= e.y + e.height + tolerance
  );
}
```

## Checklists

### Pre-Generation

- [ ] Identified all components from codebase
- [ ] Selected appropriate layout pattern
- [ ] Established naming scheme for IDs
- [ ] Determined color palette based on component types

### During Generation

- [ ] Created shape for each component
- [ ] Added text element for each label
- [ ] Set up boundElements references on shapes
- [ ] Set containerId on text elements
- [ ] Created arrows with proper bindings
- [ ] Applied elbowed/roughness/roundness to arrows
- [ ] Positioned arrows at shape edges (not centers)

### Post-Generation

- [ ] All IDs are unique
- [ ] All text elements have valid containerId references
- [ ] All shapes with labels have boundElements array
- [ ] No diamond shapes present
- [ ] All arrows have proper edge positioning
- [ ] JSON is valid (parseable)
- [ ] File has .excalidraw extension

## Common Bugs and Fixes

### Disconnected Arrows

**Symptom:** Arrows appear floating, not connected to shapes.

**Cause:** Arrow x,y position not at shape edge.

**Fix:**

```javascript
// Calculate arrow start at bottom of source shape
arrow.x = source.x + source.width / 2;
arrow.y = source.y + source.height;
```

### Missing Labels

**Symptom:** Shapes appear but text is missing.

**Cause:** Using `label` property instead of separate text element.

**Fix:**

```javascript
// Wrong
{ id: "shape-1", label: "My Label" }

// Correct
{ id: "shape-1", boundElements: [{ id: "shape-1-text", type: "text" }] }
{ id: "shape-1-text", type: "text", containerId: "shape-1", text: "My Label" }
```

### Curved Arrows

**Symptom:** Arrows render as curves instead of 90-degree angles.

**Cause:** Missing elbowed properties.

**Fix:**

```javascript
{
  type: "arrow",
  elbowed: true,
  roughness: 0,
  roundness: null
}
```

### Overlapping Arrows

**Symptom:** Multiple arrows on same edge overlap.

**Cause:** Same fixedPoint for all arrows.

**Fix:**

```javascript
// Stagger arrows along edge
arrow1.startBinding.fixedPoint = [0.33, 1];
arrow2.startBinding.fixedPoint = [0.66, 1];
```

### Looping Callback Failures

**Symptom:** Self-referencing arrows don't render properly.

**Cause:** Insufficient clearance for U-turn.

**Fix:**

```javascript
// Add clearance offset
const offset = 50;
arrow.points = [
  [0, 0],
  [offset, 0],
  [offset, shape.height + offset],
  [-offset, shape.height + offset],
  [-offset, 0],
];
```

### Unreachable Endpoints

**Symptom:** Arrow ends in wrong location.

**Cause:** Incorrect offset calculations.

**Fix:**

```javascript
// Verify end position matches target edge
const endX = arrow.x + arrow.points[arrow.points.length - 1][0];
const endY = arrow.y + arrow.points[arrow.points.length - 1][1];

// Should match target top edge
const targetTop = target.y;
const targetCenterX = target.x + target.width / 2;

console.assert(Math.abs(endY - targetTop) < 5);
console.assert(Math.abs(endX - targetCenterX) < 5);
```

## JSON Integrity Check

Before writing output, validate JSON structure:

```javascript
function validateJSON(content) {
  try {
    const parsed = JSON.parse(content);
    if (parsed.type !== 'excalidraw') return 'Missing type field';
    if (parsed.version !== 2) return 'Wrong version';
    if (!Array.isArray(parsed.elements)) return 'Elements not array';
    return null;
  } catch (e) {
    return `Invalid JSON: ${e.message}`;
  }
}
```
