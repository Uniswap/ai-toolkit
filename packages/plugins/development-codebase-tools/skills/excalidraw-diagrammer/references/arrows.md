# Arrow Routing Reference

Complete guide for creating properly connected arrows in Excalidraw JSON.

## Essential Properties

Three required settings enable 90-degree corners:

```json
{
  "roughness": 0,
  "roundness": null,
  "elbowed": true
}
```

Without these, arrows render as curves rather than sharp angles.

## Edge Calculations

Connection points on shapes:

### Rectangle edges

| Edge   | Formula                     |
| ------ | --------------------------- |
| Top    | `(x + width/2, y)`          |
| Bottom | `(x + width/2, y + height)` |
| Left   | `(x, y + height/2)`         |
| Right  | `(x + width, y + height/2)` |

### Ellipse edges

| Edge   | Formula                     |
| ------ | --------------------------- |
| Top    | `(x + width/2, y)`          |
| Bottom | `(x + width/2, y + height)` |
| Left   | `(x, y + height/2)`         |
| Right  | `(x + width, y + height/2)` |

## Arrow Element Structure

```json
{
  "id": "arrow-1",
  "type": "arrow",
  "x": 300,
  "y": 140,
  "width": 100,
  "height": 60,
  "points": [
    [0, 0],
    [100, 0],
    [100, 60]
  ],
  "startBinding": {
    "elementId": "source-shape",
    "focus": 0,
    "gap": 1,
    "fixedPoint": [0.5, 1]
  },
  "endBinding": {
    "elementId": "target-shape",
    "focus": 0,
    "gap": 1,
    "fixedPoint": [0.5, 0]
  },
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "elbowed": true,
  "roughness": 0,
  "roundness": null
}
```

## Routing Patterns

### Vertical connection (top to bottom)

```json
"points": [[0, 0], [0, height]]
```

### Horizontal connection (left to right)

```json
"points": [[0, 0], [width, 0]]
```

### L-shape (down then right)

```json
"points": [[0, 0], [0, midY], [width, midY]]
```

### U-turn (around obstacle)

```json
"points": [[0, 0], [-offset, 0], [-offset, height], [width, height]]
```

### S-shape (complex routing)

```json
"points": [[0, 0], [midX, 0], [midX, height], [width, height]]
```

## Fixed Point Bindings

Cardinal positions for `fixedPoint`:

| Position      | fixedPoint |
| ------------- | ---------- |
| Top center    | `[0.5, 0]` |
| Bottom center | `[0.5, 1]` |
| Left center   | `[0, 0.5]` |
| Right center  | `[1, 0.5]` |

## Staggering Multiple Arrows

When multiple arrows connect to the same edge, stagger them:

```javascript
// For n arrows on same edge
const spacing = 1 / (n + 1);
arrow1.fixedPoint = [spacing, 1]; // 33% along edge
arrow2.fixedPoint = [spacing * 2, 1]; // 66% along edge
```

## Bounding Box Calculation

Arrow width/height derive from points:

```javascript
const xs = points.map((p) => p[0]);
const ys = points.map((p) => p[1]);
const width = Math.max(...xs) - Math.min(...xs);
const height = Math.max(...ys) - Math.min(...ys);
```

## Bidirectional Arrows

Set both arrowheads:

```json
{
  "startArrowhead": "arrow",
  "endArrowhead": "arrow"
}
```

## Arrow Labels

Position text at arrow midpoint:

```javascript
const midX = arrow.x + arrow.width / 2;
const midY = arrow.y + arrow.height / 2;
const labelX = midX - labelWidth / 2;
const labelY = midY - labelHeight / 2 - 10; // Offset above arrow
```
