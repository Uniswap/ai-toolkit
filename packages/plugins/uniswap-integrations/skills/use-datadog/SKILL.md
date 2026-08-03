---
description: Use the Datadog CLI (pup) for observability tasks. TRIGGER when the user mentions Datadog, monitors, alerts, logs, metrics, APM, traces, incidents, SLOs, dashboards, or any Datadog-related observability work. This skill ensures the agent uses pup instead of raw API calls or the Datadog web UI.
allowed-tools: Bash(*)
---

# Datadog via pup CLI

The `pup` CLI gives you full access to Datadog's observability platform — 320+ commands across 56+ domains. **Always use `pup` for Datadog operations instead of raw API calls, curl, or telling the user to check the Datadog UI.**

## Verify Availability

Before running pup commands, check it's installed and authenticated:

```bash
command -v pup >/dev/null && pup auth status || echo "pup is not installed — see https://github.com/datadog-labs/pup for setup"
```

If pup is not installed or not authenticated, tell the user they need to set it up. Do not attempt to install it for them. Point them to `https://github.com/datadog-labs/pup` for installation, then `pup auth login` for authentication.

## Agent Mode

Pup auto-detects Claude Code and returns structured JSON — no special flags needed. Just run commands normally.

## Key Commands

| Task              | Command                                                              |
| ----------------- | -------------------------------------------------------------------- |
| Search error logs | `pup logs search --query "status:error" --from 1h`                   |
| Query metrics     | `pup metrics query --query "avg:system.cpu.user{*}" --from 1h`       |
| List monitors     | `pup monitors list --limit 10`                                       |
| Find slow traces  | `pup traces search --query="@duration:>500000000" --from="1h"`       |
| List incidents    | `pup incidents list`                                                 |
| Check SLOs        | `pup slos list`                                                      |
| List dashboards   | `pup dashboards list`                                                |
| Aggregate logs    | `pup logs aggregate --query "service:api" --compute count --from 1h` |
| Service catalog   | `pup service-catalog list`                                           |
| Security signals  | `pup security signals list --from 24h`                               |
| Discover commands | `pup --help` or `pup <command> --help`                               |

## Critical Rules

- **Always specify `--from`** for time-series queries. Most default to 1h but be explicit.
- **Start narrow** (1h), widen if needed. Large ranges are slow and expensive.
- **APM durations are in NANOSECONDS**: 1 second = 1,000,000,000. 5ms = 5,000,000.
- **Use `pup logs aggregate --compute=count`** instead of fetching raw logs and counting locally.
- **Use `--limit`** to control result size. Don't request 1000 results as a first step.
- **Filter by service first** when investigating: `--query='service:<name>'`
- **If you get a 401**: run `pup auth refresh` (or `pup auth login` if refresh fails).

## Extended Skills

Pup ships its own detailed per-domain skills (monitors, logs, APM, etc.) that can be installed directly:

```bash
pup skills install --target-agent=claude-code
```

If the user's task requires deep domain knowledge (e.g., creating monitors with best practices, configuring log pipelines, setting up SLOs), check whether pup's domain skills are already installed and suggest installing them if not.
