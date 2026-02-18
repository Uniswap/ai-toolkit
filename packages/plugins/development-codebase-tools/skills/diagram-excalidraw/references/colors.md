# Color Palettes Reference

Standard color schemes for architecture diagram components.

## Default Palette

| Component Type   | Background               | Stroke    |
| ---------------- | ------------------------ | --------- |
| Frontend/UI      | `#a5d8ff` (light blue)   | `#1971c2` |
| Backend/API      | `#d0bfff` (light purple) | `#7950f2` |
| Database         | `#b2f2bb` (light green)  | `#2f9e44` |
| Storage          | `#ffe8cc` (light orange) | `#e8590c` |
| AI/ML            | `#ffc9c9` (light red)    | `#e03131` |
| Message Queue    | `#fff3bf` (light yellow) | `#f08c00` |
| Cache            | `#ffe8cc` (peach)        | `#e8590c` |
| External Service | `#e9ecef` (gray)         | `#495057` |
| User/Actor       | `#d0ebff` (sky blue)     | `#1c7ed6` |
| Gateway/Router   | `#ffd8a8` (light orange) | `#e8590c` |
| Auth/Security    | `#ffdeeb` (light pink)   | `#c2255c` |
| Monitoring       | `#c3fae8` (light teal)   | `#099268` |
| CDN/Edge         | `#d8f5a2` (lime)         | `#66a80f` |
| Container/Pod    | `#e7f5ff` (pale blue)    | `#339af0` |

## Cloud Provider Palettes

### AWS

| Service Type | Background | Stroke    |
| ------------ | ---------- | --------- |
| Compute      | `#ff9900`  | `#232f3e` |
| Storage      | `#3f8624`  | `#232f3e` |
| Database     | `#3b48cc`  | `#232f3e` |
| Networking   | `#8c4fff`  | `#232f3e` |
| Security     | `#dd344c`  | `#232f3e` |
| Analytics    | `#00a1c9`  | `#232f3e` |
| ML/AI        | `#01a88d`  | `#232f3e` |

### Azure

| Service Type | Background | Stroke    |
| ------------ | ---------- | --------- |
| Compute      | `#0078d4`  | `#002050` |
| Storage      | `#00bcf2`  | `#002050` |
| Database     | `#5c2d91`  | `#002050` |
| Networking   | `#ff8c00`  | `#002050` |
| Security     | `#d13438`  | `#002050` |
| AI           | `#68217a`  | `#002050` |

### GCP

| Service Type | Background | Stroke    |
| ------------ | ---------- | --------- |
| Compute      | `#4285f4`  | `#1a73e8` |
| Storage      | `#34a853`  | `#137333` |
| Database     | `#fbbc04`  | `#f9ab00` |
| Networking   | `#ea4335`  | `#c5221f` |
| ML/AI        | `#673ab7`  | `#512da8` |

## Kubernetes Palette

| Component Type | Background | Stroke    |
| -------------- | ---------- | --------- |
| Pod            | `#326ce5`  | `#1a4596` |
| Service        | `#009688`  | `#00695c` |
| Deployment     | `#673ab7`  | `#512da8` |
| ConfigMap      | `#ff9800`  | `#e65100` |
| Secret         | `#f44336`  | `#c62828` |
| Ingress        | `#8bc34a`  | `#558b2f` |
| Node           | `#9e9e9e`  | `#616161` |

## Diagram Layout Recommendations

### Microservices Architecture

- Layout: Vertical flow
- Row height: 130-150px
- Column width: 200-250px

### Data Pipeline

- Layout: Horizontal flow
- Stage spacing: 200-250px

### Event-Driven System

- Layout: Hub-and-spoke
- Central element larger (300x120)
- Surrounding elements at 45-degree angles

### Kubernetes Deployment

- Layout: Layered (infrastructure -> platform -> application)
- Group by namespace with dashed rectangles

### CI/CD Pipeline

- Layout: Horizontal flow with stages
- Group stages with light backgrounds

### Network Architecture

- Layout: Hierarchical (internet -> edge -> core -> services)
- Use grouping for security zones

### User Flow

- Layout: Swimlanes (horizontal lanes per actor)
- Clear left-to-right progression
