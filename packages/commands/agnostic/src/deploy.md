---
description: Orchestrate deployment pipelines, infrastructure setup, and CI/CD configuration using specialized deployment agents.
argument-hint: <target> [--strategy blue-green|canary|rolling] [--environment dev|staging|prod] [--dry-run]
allowed-tools: Read(*), Write(*), Task(subagent_type:cicd-agent), Task(subagent_type:infrastructure-agent), Task(subagent_type:agent-orchestrator), Task(subagent_type:monitor)
---

## Inputs

Parse arguments from `$ARGUMENTS`:

- **target**: Deployment target (app-name, service, or "all")
- **--strategy**: Deployment strategy (blue-green|canary|rolling) - default: rolling
- **--environment**: Target environment (dev|staging|prod) - default: dev
- **--infrastructure**: Include infrastructure provisioning (default: false)
- **--monitoring**: Setup monitoring and alerts (default: true)
- **--rollback**: Rollback to previous version (default: false)
- **--dry-run**: Preview deployment plan without executing

Examples:

- `/deploy api-service --environment staging`
- `/deploy frontend --strategy canary --environment prod`
- `/deploy all --infrastructure --monitoring`
- `/deploy payment-service --rollback`

## Task

Orchestrate complete deployment workflow through specialized agents:

1. **Infrastructure Provisioning**: Cloud resources and scaling setup
2. **Pipeline Configuration**: CI/CD workflow generation
3. **Deployment Execution**: Strategy-based deployment
4. **Monitoring Setup**: Observability and alerting
5. **Validation & Rollback**: Health checks and rollback procedures

## Orchestration Strategy

### Phase 1: Pre-Deployment Analysis

1. **Current State Assessment**:

   - Identify existing infrastructure
   - Check current deployment configuration
   - Validate environment readiness
   - Review recent deployment history

2. **Dependency Check**:
   - Validate service dependencies
   - Check database migrations
   - Verify configuration completeness
   - Assess rollback capabilities

### Phase 2: Infrastructure & Pipeline Setup

Coordinate infrastructure and CI/CD agents:

```typescript
{
  task: "Setup deployment infrastructure and pipelines",
  orchestration: {
    parallel: [
      {
        agent: "infrastructure-agent",
        tasks: [
          "Provision cloud resources",
          "Configure auto-scaling",
          "Setup load balancers",
          "Configure networking"
        ]
      },
      {
        agent: "cicd-agent",
        tasks: [
          "Generate GitHub Actions workflows",
          "Configure deployment strategies",
          "Setup environment secrets",
          "Create rollback procedures"
        ]
      }
    ]
  }
}
```

### Phase 3: Deployment Execution

Based on selected strategy:

#### Blue-Green Deployment

```typescript
{
  agent: "cicd-agent",
  strategy: "blue-green",
  steps: [
    "Provision green environment",
    "Deploy to green",
    "Run smoke tests",
    "Switch traffic to green",
    "Monitor metrics",
    "Decommission blue (after validation)"
  ]
}
```

#### Canary Deployment

```typescript
{
  agent: "cicd-agent",
  strategy: "canary",
  steps: [
    "Deploy to canary instances (10%)",
    "Monitor error rates and latency",
    "Gradually increase traffic (25%, 50%, 100%)",
    "Automatic rollback on anomalies"
  ]
}
```

#### Rolling Deployment

```typescript
{
  agent: "cicd-agent",
  strategy: "rolling",
  steps: [
    "Deploy to instance batch 1",
    "Health check and validation",
    "Continue with remaining batches",
    "Full deployment verification"
  ]
}
```

### Phase 4: Monitoring & Validation

Invoke **monitor** agent for observability:

```typescript
{
  agent: "monitor",
  tasks: [
    "Setup application metrics",
    "Configure error tracking",
    "Create performance dashboards",
    "Setup alerting rules",
    "Configure log aggregation"
  ]
}
```

## Output Format

```typescript
{
  summary: {
    target: string;
    environment: string;
    strategy: string;
    status: 'success' | 'failed' | 'rolled-back';
    duration: number; // seconds
    version: string; // Deployed version
  };

  infrastructure?: {
    provisioned: Array<{
      resource: string;
      type: string; // e.g., "EC2", "RDS", "EKS"
      region: string;
      status: string;
      details: object;
    }>;
    configuration: {
      autoScaling: object;
      loadBalancing: object;
      networking: object;
    };
    costs: {
      estimated: string; // Monthly cost estimate
      breakdown: object;
    };
  };

  pipeline: {
    workflows: Array<{
      name: string;
      path: string; // e.g., ".github/workflows/deploy.yml"
      triggers: string[];
      stages: string[];
    }>;
    secrets: string[]; // Configured secrets (names only)
    environments: string[]; // Configured environments
  };

  deployment: {
    stages: Array<{
      name: string;
      status: 'pending' | 'in-progress' | 'completed' | 'failed';
      startTime: string;
      endTime?: string;
      instances: number;
      healthChecks: {
        passed: number;
        failed: number;
      };
    }>;
    validation: {
      smokeTests: boolean;
      healthChecks: boolean;
      performanceBaseline: boolean;
    };
    rollback?: {
      available: boolean;
      previousVersion: string;
      procedure: string;
    };
  };

  monitoring: {
    metrics: string[]; // Configured metrics
    dashboards: Array<{
      name: string;
      url: string;
      widgets: string[];
    }>;
    alerts: Array<{
      name: string;
      condition: string;
      severity: 'critical' | 'warning' | 'info';
      channels: string[]; // Notification channels
    }>;
    logs: {
      aggregation: string; // e.g., "CloudWatch", "DataDog"
      retention: string; // e.g., "30 days"
    };
  };

  recommendations: {
    optimizations: string[]; // Cost/performance optimizations
    security: string[]; // Security improvements
    reliability: string[]; // Reliability enhancements
  };
}
```

## Infrastructure as Code

When `--infrastructure` is enabled, generate:

### Terraform Configuration

```hcl
# Generated by infrastructure-agent
resource "aws_ecs_service" "api" {
  name            = var.service_name
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.desired_count

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 3000
  }
}
```

### Kubernetes Manifests

```yaml
# Generated by infrastructure-agent
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: api-service
  template:
    metadata:
      labels:
        app: api-service
    spec:
      containers:
        - name: api
          image: api-service:latest
          ports:
            - containerPort: 3000
```

## CI/CD Workflow Generation

### GitHub Actions Example

```yaml
# Generated by cicd-agent
name: Deploy to Production
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build and Test
        run: |
          npm ci
          npm test
          npm run build

      - name: Deploy to AWS ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: task-definition.json
          service: api-service
          cluster: production
          wait-for-service-stability: true
```

## Rollback Procedures

When `--rollback` is specified:

1. **Automatic Detection**:

   - Identify previous stable version
   - Validate rollback feasibility
   - Check database compatibility

2. **Rollback Execution**:

   - Switch traffic to previous version
   - Restore previous configuration
   - Validate service health
   - Update monitoring dashboards

3. **Post-Rollback**:
   - Generate incident report
   - Identify failure root cause
   - Suggest prevention measures

## Examples

### Basic Staging Deployment

```bash
/deploy api-service --environment staging
# Deploys API service to staging with rolling strategy
```

### Production Canary Deployment

```bash
/deploy frontend --strategy canary --environment prod
# Gradual rollout to production with automatic rollback
```

### Full Infrastructure Setup

```bash
/deploy all --infrastructure --monitoring --dry-run
# Preview complete infrastructure and deployment setup
```

### Emergency Rollback

```bash
/deploy payment-service --rollback --environment prod
# Immediate rollback to previous stable version
```

## Safety Mechanisms

1. **Pre-flight Checks**:

   - Configuration validation
   - Dependency verification
   - Resource availability
   - Budget constraints

2. **Progressive Rollout**:

   - Start with minimal traffic
   - Monitor key metrics
   - Automatic anomaly detection
   - Circuit breaker activation

3. **Rollback Triggers**:
   - Error rate threshold exceeded
   - Response time degradation
   - Health check failures
   - Manual intervention

## Integration with Cloud Providers

### AWS

- ECS/EKS deployments
- Lambda function updates
- CloudFormation stacks
- CodeDeploy integration

### Azure

- AKS deployments
- App Service updates
- ARM templates
- Azure DevOps pipelines

### GCP

- GKE deployments
- Cloud Run services
- Deployment Manager
- Cloud Build integration

## Best Practices

1. **Environment Progression**: Always deploy dev → staging → prod
2. **Automated Testing**: Run comprehensive tests before deployment
3. **Monitoring First**: Setup monitoring before deployment
4. **Incremental Rollout**: Use canary or blue-green for production
5. **Rollback Ready**: Always maintain rollback capability
6. **Documentation**: Document deployment procedures and runbooks
