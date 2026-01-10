---
name: deployment-orchestrator
description: Orchestrate deployment pipelines and infrastructure. Use when user says "deploy to staging", "set up CI/CD for this project", "configure deployment pipeline", "deploy to production with canary", or "rollback the last deployment".
allowed-tools: Read, Write, Glob, Grep, Task(subagent_type:cicd-agent), Task(subagent_type:infrastructure-agent), Bash(git:*), Bash(docker:*), Bash(kubectl:*), Bash(terraform:*)
model: sonnet
---

# Deployment Orchestrator

Orchestrate deployment pipelines, infrastructure setup, and CI/CD configuration.

## When to Activate

- User wants to deploy an application
- User asks about CI/CD setup
- User mentions staging/production deployment
- User wants to rollback a deployment
- User asks about deployment strategies

## Deployment Strategies

| Strategy | Description |
| --- | --- |
| `rolling` | Deploy in batches with health checks (default) |
| `blue-green` | Zero-downtime with environment switch |
| `canary` | Gradual rollout with automatic rollback |

## Process

1. **Pre-Deployment**: Validate config, check dependencies
2. **Infrastructure**: Provision resources (if needed)
3. **Pipeline Setup**: Generate CI/CD workflows
4. **Deployment**: Execute strategy-based deployment
5. **Monitoring**: Setup alerts and dashboards
6. **Validation**: Health checks and smoke tests

## Parameters

| Option | Values | Default |
| --- | --- | --- |
| `--environment` | dev, staging, prod | dev |
| `--strategy` | rolling, blue-green, canary | rolling |
| `--infrastructure` | Include infra provisioning | false |
| `--monitoring` | Setup monitoring/alerts | true |
| `--rollback` | Rollback to previous version | false |
| `--dry-run` | Preview without executing | false |

## Agent Coordination

- **cicd-agent**: Pipeline generation, deployment execution, and monitoring setup
- **infrastructure-agent**: Cloud resource provisioning

## Output

- Deployment status and version
- Infrastructure changes (if applicable)
- Pipeline workflows created
- Monitoring dashboards and alerts
- Rollback procedures

## Examples

```
"Deploy api-service to staging"
"Deploy frontend to production with canary strategy"
"Set up CI/CD for this project"
"Rollback payment-service in production"
"Preview deployment plan with --dry-run"
```

## Cloud Provider Support

- **AWS**: ECS, EKS, Lambda, CodeDeploy
- **Azure**: AKS, App Service, Azure DevOps
- **GCP**: GKE, Cloud Run, Cloud Build

## Detailed Reference

For infrastructure templates and advanced options, see [deploy-guide.md](deploy-guide.md).
