---
description: Investigate production incidents using Datadog. Use when user says "what's causing this alert", "investigate production incident", "root cause analysis for production error", "debug production issue", "what caused this outage", "analyze production logs", "triage production error", "why is the service down", "production is throwing errors", or "help me understand this incident". Always use this skill when diagnosing production issues, on-call alerts, or service degradations that require querying logs, metrics, or traces.
allowed-tools: Task(mcp__datadog__*), Read, Glob, WebSearch
model: sonnet
---

# Incident Investigator

Investigate production incidents by querying Datadog for logs, metrics, and traces, then synthesizing findings into a structured root-cause report.

## When to Activate

- On-call alert triggered and developer needs to understand what's happening
- Service degradation, error spike, or latency increase detected
- User asks "what's causing this?" or "why is X failing in production?"
- Post-incident root cause analysis needed
- Monitoring dashboard shows anomaly requiring investigation

## Steps

1. **Gather incident context** — confirm the affected service, error message or alert name, and approximate start time. If the user hasn't provided a time range, default to the last hour. Ask for any missing critical context before querying.

2. **Query logs** — search Datadog logs for error patterns in the incident window. Filter by service name and `status:error`. Surface the top recurring error messages and stack traces. Note frequency and distribution over time to establish whether the issue is steady-state or spiking.

3. **Check metrics and monitors** — retrieve error rate, latency (p50/p95/p99), and saturation metrics (CPU, memory, throughput) for the affected service. Check for triggered monitors around the incident start time to correlate alert onset with metric changes.

4. **Pull traces** — look up traces for failing requests to identify where in the call chain the failure originates. Note slow spans, timeouts, and downstream service dependencies that may indicate the root cause location.

5. **Correlate events** — search for deployment events, configuration changes, or upstream service issues in the same window. A deploy or config push immediately preceding the error onset is strong evidence of causation.

6. **Generate report** — synthesize findings into a structured incident report with timeline, root cause, confidence level, and actionable remediation steps.

## Output Format

**Incident Summary**

- What happened, when it started, and estimated user/system impact

**Timeline**

- Chronological events: deploys, config changes, error onset, monitor triggers

**Root Cause** _(High / Medium / Low confidence)_

- Primary cause with supporting evidence from logs, metrics, and traces

**Evidence**

- Key log snippets showing the error pattern
- Metric anomalies (e.g., "error rate jumped from 0.1% to 12% at 14:32 UTC")
- Relevant trace IDs for further inspection

**Next Steps**

- Immediate remediation actions (rollback, config change, scaling)
- Follow-up investigation items if root cause is uncertain
- Suggested post-mortem tasks

## Parameters

| Parameter  | Description                                           | Default           |
| ---------- | ----------------------------------------------------- | ----------------- |
| `service:` | Datadog service name to investigate                   | (prompt if blank) |
| `since:`   | Start of incident window (ISO 8601 or relative: `1h`) | `1h ago`          |
| `until:`   | End of incident window                                | `now`             |
| `error:`   | Specific error message or alert name to focus on      | (optional)        |
| `env:`     | Deployment environment (`prod`, `staging`)            | `prod`            |

## Usage

Quick triage from an alert:

```
"Investigate the high error rate alert on the swap-router service"
```

With explicit time range:

```
"Root cause analysis for production error since:2024-01-15T14:00:00Z until:2024-01-15T15:30:00Z service:api-gateway"
```

Post-incident analysis:

```
"What caused the outage on the pricing service around 2pm yesterday?"
```

Scoped to a specific error:

```
"Triage production error 'upstream connect error or disconnect/reset before headers' on service:routing env:prod"
```

## Notes

- Requires Datadog MCP server configured in the uniswap-integrations plugin
- If traces are unavailable, the investigation focuses on logs and metrics
- Use `env:staging` to investigate pre-production incidents before they reach prod
- Confidence level in the root cause reflects evidence quality — "Low" means further investigation is recommended before acting
