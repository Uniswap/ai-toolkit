# Excalidraw JSON Format Reference

Complete guide for the Excalidraw JSON structure.

## File Structure

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "claude-code-diagrammer",
  "elements": [],
  "appState": {
    "gridSize": 20,
    "viewBackgroundColor": "#ffffff"
  },
  "files": {}
}
```

## Element Types

### Recommended Shapes

| Type      | Use Cases                                        | Arrow Reliability |
| --------- | ------------------------------------------------ | ----------------- |
| Rectangle | Services, components, databases, decision points | Excellent         |
| Ellipse   | Users, external systems, endpoints               | Good              |
| Text      | Labels, annotations                              | N/A               |
| Arrow     | Connections, data flow                           | N/A               |
| Line      | Boundaries, separators                           | N/A               |

### Prohibited Shapes

**Diamond shapes are NOT allowed** - Arrow connections are fundamentally broken in raw Excalidraw JSON because rendering applies roundness to vertices, causing visual misalignment.

**Alternatives for semantic meaning:**

- Orchestrators: Coral-colored rectangles with thick strokes
- Decision points: Orange dashed rectangles
- Central routers: Larger, bold-colored boxes

## Required Element Properties

Every element must include:

```json
{
  "id": "unique-id",
  "type": "rectangle",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 80,
  "strokeColor": "#1e1e1e",
  "backgroundColor": "#a5d8ff",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 0,
  "opacity": 100,
  "angle": 0,
  "seed": 12345,
  "version": 1,
  "versionNonce": 67890,
  "isDeleted": false,
  "boundElements": null,
  "updated": 1704067200000,
  "link": null,
  "locked": false,
  "groupIds": [],
  "frameId": null,
  "roundness": { "type": 3 }
}
```

## Text Labeling

Labels require **two separate elements**:

### Shape with boundElements

```json
{
  "id": "service-1",
  "type": "rectangle",
  "boundElements": [{ "id": "service-1-text", "type": "text" }]
}
```

### Text element with containerId

```json
{
  "id": "service-1-text",
  "type": "text",
  "x": 105,
  "y": 125,
  "width": 190,
  "height": 30,
  "text": "API Server",
  "fontSize": 16,
  "fontFamily": 1,
  "textAlign": "center",
  "verticalAlign": "middle",
  "containerId": "service-1",
  "originalText": "API Server",
  "autoResize": true
}
```

**Text positioning formulas:**

- Text x: `shape.x + 5`
- Text y: `shape.y + (shape.height - text.height) / 2`
- Text width: `shape.width - 10`

**Text ID pattern:** `{shape-id}-text`

## Grouping

Logical groupings use dashed rectangles with transparent backgrounds:

```json
{
  "id": "group-vpc",
  "type": "rectangle",
  "backgroundColor": "transparent",
  "strokeStyle": "dashed",
  "strokeWidth": 1,
  "strokeColor": "#868e96"
}
```

Group labels are **standalone text elements** without `containerId`:

```json
{
  "id": "group-vpc-label",
  "type": "text",
  "text": "VPC",
  "containerId": null
}
```

## Dynamic ID Generation

Generate IDs from discovered component names:

- API component `express-api` generates ID `express-api`
- Labels use pattern `{component-id}-text`

Multi-line labels for component details:

```json
{
  "text": "API Server\nExpress.js"
}
```
