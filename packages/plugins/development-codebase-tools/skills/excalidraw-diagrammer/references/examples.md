# Examples Reference

Layout patterns and JSON templates for common diagram types.

## 3-Tier Architecture Example

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "claude-code-diagrammer",
  "elements": [
    {
      "id": "user",
      "type": "ellipse",
      "x": 250,
      "y": 50,
      "width": 100,
      "height": 60,
      "backgroundColor": "#d0ebff",
      "strokeColor": "#1c7ed6",
      "boundElements": [{ "id": "user-text", "type": "text" }]
    },
    {
      "id": "user-text",
      "type": "text",
      "x": 275,
      "y": 70,
      "width": 50,
      "height": 20,
      "text": "User",
      "containerId": "user"
    },
    {
      "id": "frontend",
      "type": "rectangle",
      "x": 200,
      "y": 180,
      "width": 200,
      "height": 80,
      "backgroundColor": "#a5d8ff",
      "strokeColor": "#1971c2",
      "boundElements": [
        { "id": "frontend-text", "type": "text" },
        { "id": "arrow-1", "type": "arrow" }
      ]
    },
    {
      "id": "frontend-text",
      "type": "text",
      "x": 205,
      "y": 205,
      "width": 190,
      "height": 30,
      "text": "Frontend\nReact App",
      "containerId": "frontend"
    },
    {
      "id": "backend",
      "type": "rectangle",
      "x": 200,
      "y": 330,
      "width": 200,
      "height": 80,
      "backgroundColor": "#d0bfff",
      "strokeColor": "#7950f2",
      "boundElements": [{ "id": "backend-text", "type": "text" }]
    },
    {
      "id": "backend-text",
      "type": "text",
      "x": 205,
      "y": 355,
      "width": 190,
      "height": 30,
      "text": "API Server\nNode.js",
      "containerId": "backend"
    },
    {
      "id": "database",
      "type": "rectangle",
      "x": 200,
      "y": 480,
      "width": 200,
      "height": 80,
      "backgroundColor": "#b2f2bb",
      "strokeColor": "#2f9e44",
      "boundElements": [{ "id": "database-text", "type": "text" }]
    },
    {
      "id": "database-text",
      "type": "text",
      "x": 205,
      "y": 505,
      "width": 190,
      "height": 30,
      "text": "Database\nPostgreSQL",
      "containerId": "database"
    }
  ],
  "appState": {
    "gridSize": 20,
    "viewBackgroundColor": "#ffffff"
  }
}
```

## Layout Patterns

### Vertical Flow (Microservices)

Grid-based positioning:

- Row height: 130-150px
- Column width: 200-250px
- Start position: (100, 100)

```javascript
const row = (index) => 100 + index * 150;
const col = (index) => 100 + index * 250;

// Position calculation
element.x = col(columnIndex);
element.y = row(rowIndex);
```

### Horizontal Flow (Pipeline)

Stage-based positioning:

```javascript
const stages = ['Source', 'Build', 'Test', 'Deploy', 'Monitor'];
const stageX = (index) => 100 + index * 220;
const stageY = 200;
```

### Hub-and-Spoke (Event-Driven)

Central element with surrounding components at angles:

```javascript
const center = { x: 400, y: 300 };
const radius = 200;
const angles = [0, 45, 90, 135, 180, 225, 270, 315];

const position = (angleIndex) => ({
  x: center.x + radius * Math.cos((angles[angleIndex] * Math.PI) / 180),
  y: center.y + radius * Math.sin((angles[angleIndex] * Math.PI) / 180),
});
```

## Complex Architecture Template

Six-row layout for comprehensive systems:

| Row | Y Position | Components          |
| --- | ---------- | ------------------- |
| 0   | 50         | Users, Actors       |
| 1   | 180        | Load Balancers, CDN |
| 2   | 310        | Frontend Services   |
| 3   | 440        | Backend Services    |
| 4   | 570        | Data Stores         |
| 5   | 700        | External Services   |

## Complexity Guidelines

| Element Count | Recommendation               |
| ------------- | ---------------------------- |
| 5-25          | Single diagram               |
| 25-50         | Consider grouping            |
| 50+           | Split into multiple diagrams |

### When to Group

- 3+ related services (microservice cluster)
- Shared infrastructure (VPC, namespace)
- Logical domains (auth, payments, etc.)

### When to Split

- Different deployment environments
- Separate bounded contexts
- Independent subsystems

## Template Notes

All examples are templates requiring customization:

- Replace placeholder IDs with discovered component names
- Adjust positions based on actual component count
- Apply appropriate colors from the color palette
- Modify labels to reflect actual service names
