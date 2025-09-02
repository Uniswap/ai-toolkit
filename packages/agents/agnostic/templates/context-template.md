# Agent Context Template

This template provides a standardized format for context storage and exchange between agents in the AI Toolkit ecosystem.

## Template Structure

```json
{
  "@context": {
    "@vocab": "https://ai-toolkit.dev/context/",
    "schema": "https://schema.org/",
    "dc": "http://purl.org/dc/terms/",
    "foaf": "http://xmlns.com/foaf/0.1/"
  },
  "@type": "AgentContext",
  "@id": "context-{uuid}",
  "version": "1.0.0",
  "schemaVersion": "2.0",

  "metadata": {
    "created": "{ISO-8601-timestamp}",
    "lastModified": "{ISO-8601-timestamp}",
    "author": {
      "@type": "Agent",
      "name": "{agent-name}",
      "version": "{agent-version}",
      "capabilities": ["{capability-1}", "{capability-2}"]
    },
    "relevanceScore": 0.0,
    "usageCount": 0,
    "tags": ["{tag-1}", "{tag-2}"],
    "relationships": {
      "parent": "{parent-context-id}",
      "children": ["{child-context-id-1}", "{child-context-id-2}"],
      "references": ["{ref-context-id-1}", "{ref-context-id-2}"]
    }
  },

  "storage": {
    "compression": {
      "enabled": true,
      "algorithm": "gzip",
      "ratio": 0.0
    },
    "backend": {
      "type": "file|memory|redis|database",
      "location": "{storage-location}",
      "encryption": true
    },
    "size": {
      "raw": 0,
      "compressed": 0,
      "limit": 1048576
    }
  },

  "expiration": {
    "ttl": 3600,
    "accessBased": {
      "enabled": true,
      "maxIdleTime": 1800
    },
    "sizeBased": {
      "enabled": true,
      "maxSize": 1048576,
      "cleanupStrategy": "lru"
    },
    "priority": "normal",
    "refreshTriggers": [
      {
        "type": "time",
        "interval": 3600
      },
      {
        "type": "dependency",
        "target": "{dependency-id}"
      }
    ]
  },

  "context": {
    "type": "code|business|technical|execution|historical|mixed",
    "scope": "file|module|package|project|workspace",
    "domains": ["{domain-1}", "{domain-2}"],

    "code": {
      "files": [
        {
          "path": "{file-path}",
          "hash": "{file-hash}",
          "language": "{programming-language}",
          "size": 0,
          "lastModified": "{ISO-8601-timestamp}",
          "encoding": "utf-8",
          "dependencies": ["{dependency-1}", "{dependency-2}"],
          "exports": ["{export-1}", "{export-2}"],
          "imports": ["{import-1}", "{import-2}"]
        }
      ],
      "modules": [
        {
          "name": "{module-name}",
          "version": "{module-version}",
          "type": "internal|external",
          "dependencies": ["{dep-1}", "{dep-2}"],
          "interfaces": ["{interface-1}", "{interface-2}"]
        }
      ],
      "patterns": [
        {
          "name": "{pattern-name}",
          "type": "design|architectural|coding",
          "description": "{pattern-description}",
          "examples": ["{example-1}", "{example-2}"]
        }
      ],
      "conventions": [
        {
          "type": "naming|formatting|structure",
          "rule": "{convention-rule}",
          "examples": ["{example-1}", "{example-2}"]
        }
      ]
    },

    "business": {
      "requirements": [
        {
          "id": "{requirement-id}",
          "type": "functional|non-functional|constraint",
          "priority": "critical|high|medium|low",
          "description": "{requirement-description}",
          "acceptance": ["{criteria-1}", "{criteria-2}"],
          "stakeholders": ["{stakeholder-1}", "{stakeholder-2}"]
        }
      ],
      "constraints": [
        {
          "type": "technical|business|legal|time",
          "description": "{constraint-description}",
          "impact": "high|medium|low",
          "mitigation": "{mitigation-strategy}"
        }
      ],
      "goals": [
        {
          "description": "{goal-description}",
          "measurable": true,
          "metrics": ["{metric-1}", "{metric-2}"],
          "timeline": "{timeline}"
        }
      ],
      "stakeholders": [
        {
          "name": "{stakeholder-name}",
          "role": "{stakeholder-role}",
          "influence": "high|medium|low",
          "contact": "{contact-info}"
        }
      ]
    },

    "technical": {
      "architecture": {
        "style": "microservices|monolithic|serverless|layered",
        "components": [
          {
            "name": "{component-name}",
            "type": "service|library|database|ui",
            "responsibilities": ["{resp-1}", "{resp-2}"],
            "interfaces": ["{interface-1}", "{interface-2}"],
            "dependencies": ["{dep-1}", "{dep-2}"]
          }
        ],
        "dataFlow": [
          {
            "from": "{source-component}",
            "to": "{target-component}",
            "type": "sync|async|event",
            "protocol": "{protocol-name}",
            "format": "{data-format}"
          }
        ]
      },
      "technologies": [
        {
          "name": "{technology-name}",
          "version": "{version}",
          "purpose": "{usage-purpose}",
          "alternatives": ["{alt-1}", "{alt-2}"]
        }
      ],
      "patterns": [
        {
          "name": "{pattern-name}",
          "category": "creational|structural|behavioral",
          "applicability": "{when-to-use}",
          "implementation": "{implementation-notes}"
        }
      ],
      "decisions": [
        {
          "id": "{decision-id}",
          "title": "{decision-title}",
          "status": "proposed|accepted|deprecated|superseded",
          "context": "{decision-context}",
          "decision": "{decision-made}",
          "consequences": ["{consequence-1}", "{consequence-2}"],
          "alternatives": ["{alt-1}", "{alt-2}"]
        }
      ]
    },

    "execution": {
      "runtime": {
        "environment": "{environment-name}",
        "version": "{runtime-version}",
        "configuration": {
          "memory": "{memory-allocation}",
          "cpu": "{cpu-allocation}",
          "storage": "{storage-allocation}"
        }
      },
      "performance": {
        "metrics": [
          {
            "name": "{metric-name}",
            "value": 0.0,
            "unit": "{metric-unit}",
            "timestamp": "{ISO-8601-timestamp}",
            "threshold": {
              "warning": 0.0,
              "critical": 0.0
            }
          }
        ],
        "benchmarks": [
          {
            "name": "{benchmark-name}",
            "baseline": 0.0,
            "current": 0.0,
            "trend": "improving|stable|degrading"
          }
        ]
      },
      "state": {
        "variables": [
          {
            "name": "{variable-name}",
            "type": "{data-type}",
            "value": "{current-value}",
            "scope": "global|local|session"
          }
        ],
        "sessions": [
          {
            "id": "{session-id}",
            "status": "active|inactive|expired",
            "created": "{ISO-8601-timestamp}",
            "lastAccessed": "{ISO-8601-timestamp}"
          }
        ]
      }
    },

    "historical": {
      "decisions": [
        {
          "timestamp": "{ISO-8601-timestamp}",
          "decision": "{decision-description}",
          "rationale": "{decision-rationale}",
          "outcome": "{decision-outcome}",
          "lessons": ["{lesson-1}", "{lesson-2}"]
        }
      ],
      "changes": [
        {
          "timestamp": "{ISO-8601-timestamp}",
          "type": "feature|bugfix|refactor|performance",
          "description": "{change-description}",
          "author": "{change-author}",
          "impact": "high|medium|low",
          "rollback": "{rollback-procedure}"
        }
      ],
      "experiments": [
        {
          "name": "{experiment-name}",
          "hypothesis": "{experiment-hypothesis}",
          "setup": "{experiment-setup}",
          "results": "{experiment-results}",
          "conclusion": "{experiment-conclusion}"
        }
      ],
      "incidents": [
        {
          "timestamp": "{ISO-8601-timestamp}",
          "severity": "critical|high|medium|low",
          "description": "{incident-description}",
          "resolution": "{resolution-steps}",
          "postmortem": "{postmortem-link}"
        }
      ]
    }
  },

  "extensions": {
    "custom": {
      "fields": [
        {
          "name": "{field-name}",
          "type": "{field-type}",
          "value": "{field-value}",
          "validation": "{validation-rules}"
        }
      ],
      "schemas": [
        {
          "name": "{schema-name}",
          "version": "{schema-version}",
          "definition": "{schema-definition}"
        }
      ]
    },
    "plugins": [
      {
        "name": "{plugin-name}",
        "version": "{plugin-version}",
        "configuration": {
          "setting1": "value1",
          "setting2": "value2"
        }
      }
    ]
  }
}
```

## Documentation

### Core Fields

#### @context

JSON-LD context for semantic interpretation of the data structure.

#### @type

Always "AgentContext" for this template.

#### @id

Unique identifier for this context instance. Use format: `context-{uuid}`.

#### version

Version of this specific context instance.

#### schemaVersion

Version of the context template schema being used.

### Metadata Section

#### created/lastModified

ISO-8601 timestamps for tracking context lifecycle.

#### author

Information about the agent that created this context:

- `name`: Agent identifier
- `version`: Agent version
- `capabilities`: List of agent capabilities

#### relevanceScore

Float value (0.0-1.0) indicating context relevance for current operations.

#### usageCount

Number of times this context has been accessed.

#### tags

Array of string tags for categorization and search.

#### relationships

Context hierarchy and cross-references:

- `parent`: ID of parent context
- `children`: Array of child context IDs
- `references`: Array of related context IDs

### Storage Section

#### compression

Compression settings for storage optimization:

- `enabled`: Whether compression is active
- `algorithm`: Compression algorithm used
- `ratio`: Compression ratio achieved

#### backend

Storage backend configuration:

- `type`: Storage type (file, memory, redis, database)
- `location`: Storage location identifier
- `encryption`: Whether data is encrypted

#### size

Size tracking:

- `raw`: Uncompressed size in bytes
- `compressed`: Compressed size in bytes
- `limit`: Maximum size limit in bytes

### Expiration Section

#### ttl

Time-to-live in seconds.

#### accessBased

Access-based expiration:

- `enabled`: Whether access-based expiration is active
- `maxIdleTime`: Maximum idle time before expiration

#### sizeBased

Size-based expiration:

- `enabled`: Whether size-based limits are active
- `maxSize`: Maximum size before cleanup
- `cleanupStrategy`: Strategy for cleanup (lru, fifo, random)

#### priority

Context priority level (critical, high, normal, low).

#### refreshTriggers

Array of conditions that trigger context refresh:

- `type`: Trigger type (time, dependency, event)
- Additional properties based on trigger type

### Context Section

#### type

Primary context classification (code, business, technical, execution, historical, mixed).

#### scope

Context scope level (file, module, package, project, workspace).

#### domains

Array of domain classifications.

#### Context Type Subsections

Each context type (code, business, technical, execution, historical) has its own structured format for relevant information.

### Extensions Section

#### custom

Custom fields and schemas for extending the template:

- `fields`: Custom data fields
- `schemas`: Custom schema definitions

#### plugins

Plugin-specific configurations and data.

## Usage Examples

### Example 1: Code Context for a TypeScript Module

```json
{
  "@context": {
    "@vocab": "https://ai-toolkit.dev/context/",
    "schema": "https://schema.org/"
  },
  "@type": "AgentContext",
  "@id": "context-550e8400-e29b-41d4-a716-446655440000",
  "version": "1.0.0",
  "schemaVersion": "2.0",

  "metadata": {
    "created": "2024-01-15T10:30:00Z",
    "lastModified": "2024-01-15T10:30:00Z",
    "author": {
      "@type": "Agent",
      "name": "code-analyzer",
      "version": "2.1.0",
      "capabilities": ["code-analysis", "dependency-tracking"]
    },
    "relevanceScore": 0.95,
    "usageCount": 0,
    "tags": ["typescript", "authentication", "security"],
    "relationships": {
      "parent": null,
      "children": [],
      "references": []
    }
  },

  "context": {
    "type": "code",
    "scope": "module",
    "domains": ["authentication", "security"],

    "code": {
      "files": [
        {
          "path": "src/auth/user-manager.ts",
          "hash": "a1b2c3d4e5f6",
          "language": "typescript",
          "size": 2048,
          "lastModified": "2024-01-15T09:45:00Z",
          "encoding": "utf-8",
          "dependencies": ["bcrypt", "jsonwebtoken"],
          "exports": ["UserManager", "AuthError"],
          "imports": ["User", "Database"]
        }
      ],
      "patterns": [
        {
          "name": "Singleton",
          "type": "design",
          "description": "UserManager implements singleton pattern for global access",
          "examples": ["UserManager.getInstance()"]
        }
      ]
    }
  }
}
```

### Example 2: Business Context for Requirements

```json
{
  "@context": {
    "@vocab": "https://ai-toolkit.dev/context/"
  },
  "@type": "AgentContext",
  "@id": "context-550e8400-e29b-41d4-a716-446655440001",
  "version": "1.0.0",
  "schemaVersion": "2.0",

  "metadata": {
    "created": "2024-01-15T11:00:00Z",
    "lastModified": "2024-01-15T11:00:00Z",
    "author": {
      "@type": "Agent",
      "name": "requirements-analyst",
      "version": "1.5.0",
      "capabilities": ["requirements-analysis", "stakeholder-management"]
    },
    "relevanceScore": 0.88,
    "tags": ["user-authentication", "security", "mvp"]
  },

  "context": {
    "type": "business",
    "scope": "project",
    "domains": ["user-management", "security"],

    "business": {
      "requirements": [
        {
          "id": "REQ-001",
          "type": "functional",
          "priority": "critical",
          "description": "Users must be able to register with email and password",
          "acceptance": [
            "Registration form accepts valid email formats",
            "Password meets complexity requirements",
            "Confirmation email is sent"
          ],
          "stakeholders": ["product-owner", "security-team"]
        }
      ],
      "constraints": [
        {
          "type": "technical",
          "description": "Must integrate with existing LDAP system",
          "impact": "high",
          "mitigation": "Use LDAP adapter pattern"
        }
      ]
    }
  }
}
```

## Usage Guidelines

### Creating New Contexts

1. **Start with the template**: Copy the JSON template structure
2. **Fill required fields**: Populate @id, metadata, and primary context data
3. **Choose context type**: Select appropriate type and populate relevant subsections
4. **Set expiration**: Configure appropriate TTL and expiration strategies
5. **Add relationships**: Link to parent/child contexts if applicable

### Updating Contexts

1. **Update lastModified**: Always update timestamp when modifying
2. **Increment version**: Use semantic versioning for context versions
3. **Update relevanceScore**: Recalculate based on current operations
4. **Maintain relationships**: Update parent/child links as needed

### Searching Contexts

Use tags, domains, and metadata for efficient context discovery:

- Filter by context type for specific use cases
- Use relevanceScore for ranking results
- Leverage relationships for context traversal

### Best Practices

1. **Be Specific**: Use detailed, descriptive tags and domains
2. **Maintain Relationships**: Keep parent/child/reference links updated
3. **Set Appropriate TTL**: Balance freshness with performance
4. **Use Compression**: Enable compression for large contexts
5. **Regular Cleanup**: Implement proper expiration strategies
6. **Version Control**: Track context evolution with version numbers

### Extension Points

#### Custom Fields

Add domain-specific fields in the `extensions.custom.fields` array:

```json
"extensions": {
  "custom": {
    "fields": [
      {
        "name": "testCoverage",
        "type": "float",
        "value": 0.85,
        "validation": "range(0.0, 1.0)"
      }
    ]
  }
}
```

#### Plugin Integration

Register plugin-specific data in the `extensions.plugins` array:

```json
"extensions": {
  "plugins": [
    {
      "name": "performance-monitor",
      "version": "1.2.0",
      "configuration": {
        "samplingRate": 0.1,
        "alertThreshold": 1000
      }
    }
  ]
}
```

## Schema Validation

The context template follows JSON Schema validation. Key validation rules:

- Required fields: @context, @type, @id, version, schemaVersion, metadata
- Type constraints: timestamps must be ISO-8601, scores must be 0.0-1.0
- Relationship validation: referenced context IDs must exist
- Size limits: respect configured size limits in storage section
- Version format: follow semantic versioning (major.minor.patch)

## Migration Guide

When updating from previous schema versions:

1. **Check schemaVersion**: Identify current version
2. **Apply transformations**: Use provided migration scripts
3. **Validate result**: Ensure new format passes validation
4. **Update references**: Update any external references to context
5. **Test integration**: Verify agents can consume updated context

This template provides a comprehensive foundation for agent context management while remaining flexible for future extensions and customizations.
